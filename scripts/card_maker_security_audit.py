#!/usr/bin/env python3
"""Dependency-free wiring and browser-config audit for the ten card makers."""

from __future__ import annotations

import argparse
import hashlib
from html.parser import HTMLParser
from pathlib import Path
import re
import sys


CARD_MAKERS = (
    "environment-deck-back",
    "environment-deck-front",
    "hero-character-card-back",
    "hero-character-card-front",
    "hero-deck-back",
    "hero-deck-front",
    "principles-deck-front",
    "villain-character-card",
    "villain-deck-back",
    "villain-deck-front",
)
EXPECTED_SCRIPTS = (
    "../_vendor/jquery/jquery-3.6.0.min.js",
    "./config.js",
    "../common-before.js",
    "../common-images.js",
    "./script.js",
    "../google-drive-config.js",
    "../google-drive.js",
    "../common-after.js",
)
EXPECTED_CSP = {
    "default-src": ("'self'",),
    "script-src": (
        "'self'",
        "https://accounts.google.com/gsi/client",
        "https://apis.google.com",
    ),
    "connect-src": (
        "'self'",
        "https://accounts.google.com/gsi/",
        "https://www.googleapis.com",
    ),
    "frame-src": (
        "https://accounts.google.com/gsi/",
        "https://docs.google.com",
    ),
    "img-src": ("'self'", "blob:", "data:", "https:"),
    "style-src": (
        "'self'",
        "'unsafe-inline'",
        "https://accounts.google.com/gsi/style",
        "https://fonts.googleapis.com",
        "https://fonts.cdnfonts.com",
    ),
    "font-src": (
        "'self'",
        "https://fonts.gstatic.com",
        "https://fonts.cdnfonts.com",
    ),
    "object-src": ("'none'",),
    "base-uri": ("'self'",),
}
RAW_CONFIG_DECLARATION = re.compile(
    r"\b(?:const|let|var)\s+(?:CARD_FORM|CARD_CATEGORY|ORIENTATION|FACE|DEFAULT_DOWNLOAD_NAME)\b"
)
JQUERY_SHA256 = "ff1523fb7389539c84c65aba19260648793bb4f5e29329d2ee8804bc37a3fe6e"
CONFIG_KEYS = {"apiKey", "clientId", "appId"}


class CardMakerParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.scripts: list[str | None] = []
        self.file_inputs_missing_purpose = 0
        self.csp_values: list[str] = []
        self.csp_positions: list[int] = []
        self.governed_resource_positions: list[int] = []
        self.font_preconnects = 0
        self.position = 0

    def handle_starttag(self, tag: str, attrs_list: list[tuple[str, str | None]]) -> None:
        self.position += 1
        attrs = dict(attrs_list)
        if tag in {"base", "iframe", "img", "link", "object", "script", "source", "style"}:
            self.governed_resource_positions.append(self.position)
        if tag == "script":
            self.scripts.append(attrs.get("src"))
        elif tag == "input" and attrs.get("type", "").lower() == "file":
            if not attrs.get("data-image-purpose"):
                self.file_inputs_missing_purpose += 1
        elif tag == "meta" and attrs.get("http-equiv", "").lower() == "content-security-policy":
            self.csp_values.append(attrs.get("content", ""))
            self.csp_positions.append(self.position)
        elif tag == "link" and attrs.get("rel", "").lower() == "preconnect":
            if attrs.get("href", "").startswith("https://fonts."):
                self.font_preconnects += 1


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def parse_csp(value: str) -> dict[str, tuple[str, ...]] | None:
    directives: dict[str, tuple[str, ...]] = {}
    for raw_directive in value.split(";"):
        tokens = raw_directive.split()
        if not tokens:
            continue
        name = tokens[0].lower()
        if name in directives:
            return None
        directives[name] = tuple(tokens[1:])
    return directives


def audit_html(root: Path, errors: list[str]) -> None:
    for directory in CARD_MAKERS:
        html_path = root / directory / "index.html"
        if not html_path.is_file():
            fail(errors, f"{directory}: index.html is missing")
            continue
        html_text = html_path.read_text(encoding="utf-8")
        parser = CardMakerParser()
        parser.feed(html_text)
        if tuple(parser.scripts) != EXPECTED_SCRIPTS:
            fail(errors, f"{directory}: local scripts are missing, inline, or out of order")
        for src in (item for item in parser.scripts if item):
            if "://" not in src and not (html_path.parent / src).resolve().is_file():
                fail(errors, f"{directory}: referenced local script is missing: {src}")
        if parser.file_inputs_missing_purpose:
            fail(errors, f"{directory}: a file input lacks data-image-purpose")
        if len(parser.csp_values) != 1:
            fail(errors, f"{directory}: expected exactly one CSP meta policy")
        else:
            directives = parse_csp(parser.csp_values[0])
            if directives != EXPECTED_CSP:
                fail(errors, f"{directory}: CSP directives do not exactly match the required policy")
            script_sources = directives.get("script-src", ()) if directives else ()
            if "'unsafe-inline'" in script_sources or "'unsafe-eval'" in script_sources:
                fail(errors, f"{directory}: script-src permits unsafe script execution")
            if parser.governed_resource_positions and \
                    parser.csp_positions[0] > min(parser.governed_resource_positions):
                fail(errors, f"{directory}: CSP meta appears after a governed resource")
        if RAW_CONFIG_DECLARATION.search(html_text):
            fail(errors, f"{directory}: raw page configuration declaration remains in HTML")
        if parser.font_preconnects:
            fail(errors, f"{directory}: font preconnect conflicts with connect-src")


def strip_js_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    return re.sub(r"(^|\s)//[^\r\n]*", r"\1", text)


def audit_config(root: Path, errors: list[str]) -> None:
    path = root / "google-drive-config.js"
    if not path.is_file():
        fail(errors, "google-drive-config.js is missing")
        return
    text = strip_js_comments(path.read_text(encoding="utf-8"))
    assignment = re.fullmatch(
        r"\s*window\.GOOGLE_DRIVE_CONFIG\s*=\s*Object\.freeze\s*\(\s*\{(?P<body>.*?)\}\s*\)\s*;\s*",
        text,
        flags=re.DOTALL,
    )
    if not assignment:
        fail(errors, "google-drive-config.js does not have the required single frozen-object assignment")
        return
    pair_pattern = re.compile(r"\s*([A-Za-z_$][\w$]*)\s*:\s*(['\"])(.*?)\2\s*(?:,|$)", re.DOTALL)
    body = assignment.group("body")
    pairs = list(pair_pattern.finditer(body))
    if not pairs or "".join(match.group(0) for match in pairs).strip().rstrip(",").strip() != body.strip().rstrip(",").strip():
        fail(errors, "google-drive-config.js contains an unsupported value shape")
        return
    values = {match.group(1): match.group(3) for match in pairs}
    if len(values) != len(pairs) or set(values) != CONFIG_KEYS:
        fail(errors, "google-drive-config.js must contain exactly the three allowed property names")
        return
    if not re.fullmatch(r"AIza[A-Za-z0-9_-]{20,}", values["apiKey"]):
        fail(errors, "google-drive-config.js API key format is invalid")
    if not re.fullmatch(r"[A-Za-z0-9_-]+\.apps\.googleusercontent\.com", values["clientId"]):
        fail(errors, "google-drive-config.js client ID format is invalid")
    if not re.fullmatch(r"\d+", values["appId"]):
        fail(errors, "google-drive-config.js app ID format is invalid")


def audit_vendor(root: Path, errors: list[str]) -> None:
    directory = root / "_vendor" / "jquery"
    artifact = directory / "jquery-3.6.0.min.js"
    license_path = directory / "LICENSE.txt"
    readme = directory / "README.md"
    if not artifact.is_file():
        fail(errors, "vendored jQuery artifact is missing")
    elif hashlib.sha256(artifact.read_bytes()).hexdigest() != JQUERY_SHA256:
        fail(errors, "vendored jQuery digest does not match the recorded SHA-256")
    if not license_path.is_file() or not license_path.read_text(encoding="utf-8").strip():
        fail(errors, "vendored jQuery license is missing")
    if not readme.is_file() or JQUERY_SHA256 not in readme.read_text(encoding="utf-8"):
        fail(errors, "vendored jQuery README/digest metadata is missing or inconsistent")


def audit_enforcement(root: Path, errors: list[str]) -> None:
    hook = root / ".githooks" / "pre-commit"
    workflows = (
        root / ".github" / "workflows" / "deploy-live.yml",
        root / ".github" / "workflows" / "pr-preview.yml",
    )
    invocation = "scripts/card_maker_security_audit.py"
    if not hook.is_file() or invocation not in hook.read_text(encoding="utf-8"):
        fail(errors, "pre-commit hook does not run the card-maker security audit")
    for workflow in workflows:
        if not workflow.is_file():
            fail(errors, f"workflow is missing: {workflow.name}")
            continue
        text = workflow.read_text(encoding="utf-8")
        audit_at = text.find(invocation)
        publication_markers = ("rsync -av", "rm -rf \"pages/pr/$PR\"")
        publish_positions = [text.find(marker) for marker in publication_markers if text.find(marker) >= 0]
        if audit_at < 0 or (publish_positions and audit_at > min(publish_positions)):
            fail(errors, f"{workflow.name}: security audit is absent or occurs after publication")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    errors: list[str] = []
    audit_html(root, errors)
    audit_config(root, errors)
    audit_vendor(root, errors)
    audit_enforcement(root, errors)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("Card-maker security audit passed (10 pages).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
