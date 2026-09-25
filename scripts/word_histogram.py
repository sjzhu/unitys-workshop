#!/usr/bin/env python3
"""Build a word-frequency histogram from the card-gallery TSV files.

By default this reads the rules-text columns (anything whose header contains
"game text", plus Setup / Advanced / Innate Power Effect / Extra Text /
Incapacitated Option) from every ``card-gallery/*.tsv`` file, tokenises the
text, drops common stopwords, and reports the most frequent words.

"Name" columns (Name / Hero / Villain / Deck / Character / Variant, and any
header containing "name") get a whole-name entry each: "Absolute Zero" is
counted as `absolute zero`. Stopwords are trimmed from the ends of that
phrase ("The Argent Adept" -> `argent adept`) but kept in the middle
("Darkstrife and Painstake"). Name columns do NOT feed the individual-word
counts (so repeated deck names don't drown the histogram) unless you also
name them with --columns. --all-text likewise skips name columns for word
counts but still emits their phrases. Use --no-names to drop phrases
entirely, or --name-columns to choose which headers count as names.

Examples
--------
    # top 40 words from the default (rules text) columns
    python scripts/word_histogram.py

    # every non-numeric text column, keep stopwords, write outputs
    python scripts/word_histogram.py --all-text --keep-stopwords \
        --csv out.csv --png out.png

    # just flavor text from the hero + villain decks
    python scripts/word_histogram.py \
        --files "Hero Cards.tsv" "Villain Cards.tsv" \
        --columns "Flavor Text"
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from collections import Counter
from pathlib import Path

# --- configuration -----------------------------------------------------------

DEFAULT_GALLERY_DIR = Path(__file__).resolve().parent.parent / "card-gallery"

# Header substrings (case-insensitive) that select the default "rules text".
DEFAULT_COLUMN_MATCHES = (
    "game text",
    "setup",
    "advanced",
    "innate power effect",
    "extra text",
    "incapacitated option",
)

# Header substrings that mark a "name" column: multi-word values in these are
# also counted as one whole-phrase entry, not only as their individual words.
DEFAULT_NAME_MATCHES = (
    "name",
    "hero",
    "villain",
    "deck",
    "character",
    "variant",
)

# Headers that are numeric / identifiers - never counted, even with --all-text.
NON_TEXT_HEADERS = {
    "hp", "qty", "collection limit", "set", "complexity", "difficulty",
    "date", "c/d/p", "nemesis icon", "side 1 hp", "side 2 hp",
    "side 1 nemesis icon", "side 2 nemesis icon",
}

# A compact stopword list - common English function words plus a few tokens
# that dominate Sentinels rules text without being interesting.
STOPWORDS = {
    "a", "an", "and", "any", "are", "as", "at", "be", "been", "but", "by",
    "can", "do", "does", "each", "for", "from", "had", "has", "have", "he",
    "her", "him", "his", "i", "if", "in", "into", "is", "it", "its", "may",
    "must", "no", "not", "of", "on", "or", "s", "she", "so", "than", "that",
    "the", "their", "them", "then", "there", "these", "they", "this", "those",
    "to", "up", "was", "were", "when", "which", "while", "who", "with", "you",
    "your",
}

# A token is a run of letters/digits (any script, so "Æternus" stays intact),
# optionally joined by internal hyphens or apostrophes ("non-hero", "akash'bhuta").
TOKEN_RE = re.compile(r"[^\W_]+(?:[-'’][^\W_]+)*")


# --- core -------------------------------------------------------------------

def resolve_files(gallery_dir: Path, names: list[str] | None) -> list[Path]:
    if names:
        out = []
        for name in names:
            p = Path(name)
            if not p.is_absolute():
                p = gallery_dir / name
            if not p.exists():
                sys.exit(f"error: no such TSV: {p}")
            out.append(p)
        return out
    files = sorted(gallery_dir.glob("*.tsv"))
    if not files:
        sys.exit(f"error: no .tsv files in {gallery_dir}")
    return files


def pick_columns(header: list[str], explicit: list[str] | None, all_text: bool,
                 name_matches: tuple[str, ...]) -> tuple[set[int], set[int]]:
    """Return (word_idxs, phrase_idxs).

    word_idxs   - columns tokenised into individual word counts.
    phrase_idxs - name columns that contribute a whole-name entry. A name
                  column contributes words too only when it is *also* a word
                  column (e.g. named explicitly with --columns); otherwise it
                  is phrase-only, so "Deck"/"Hero" repetition doesn't drown
                  out the histogram.
    """
    lowered = [h.strip().lower() for h in header]
    is_name = [bool(name_matches) and any(m in h for m in name_matches)
               for h in lowered]

    if explicit:
        wanted = {c.strip().lower() for c in explicit}
        word_idxs = {i for i, h in enumerate(lowered) if h in wanted}
    elif all_text:
        word_idxs = {i for i, h in enumerate(lowered)
                     if h not in NON_TEXT_HEADERS and not is_name[i]}
    else:
        word_idxs = {i for i, h in enumerate(lowered)
                     if any(m in h for m in DEFAULT_COLUMN_MATCHES)}

    phrase_idxs = {i for i, _ in enumerate(lowered) if is_name[i]}
    return word_idxs, phrase_idxs




def trim_stopwords(toks: list[str]) -> list[str]:
    """Drop stopwords from the start and end of a token list, not the middle."""
    lo, hi = 0, len(toks)
    while lo < hi and toks[lo] in STOPWORDS:
        lo += 1
    while hi > lo and toks[hi - 1] in STOPWORDS:
        hi -= 1
    return toks[lo:hi]


def count_words(files: list[Path], explicit_cols: list[str] | None,
                all_text: bool, keep_stopwords: bool, min_len: int,
                name_matches: tuple[str, ...]) -> tuple[Counter, dict]:
    counts: Counter = Counter()
    phrases: set[str] = set()
    stats = {"files": 0, "rows": 0, "cells": 0, "columns_used": set()}

    for path in files:
        with path.open("r", encoding="utf-8", newline="") as f:
            rows = list(csv.reader(f, delimiter="\t"))
        if not rows:
            continue
        header = rows[0]
        word_idxs, phrase_idxs = pick_columns(
            header, explicit_cols, all_text, name_matches,
        )
        col_idxs = sorted(word_idxs | phrase_idxs)
        if not col_idxs:
            continue
        stats["files"] += 1
        for i in col_idxs:
            if i in phrase_idxs:
                tag = " [name+words]" if i in word_idxs else " [name only]"
            else:
                tag = ""
            stats["columns_used"].add(f"{path.name}: {header[i]}{tag}")
        for row in rows[1:]:
            stats["rows"] += 1
            for i in col_idxs:
                if i >= len(row):
                    continue
                cell = row[i].strip()
                if not cell:
                    continue
                stats["cells"] += 1
                text = cell.lower().replace("’", "'")
                toks = [t for t in TOKEN_RE.findall(text)
                        if len(t) >= min_len]
                if i in word_idxs:
                    for tok in toks:
                        if not keep_stopwords and tok in STOPWORDS:
                            continue
                        counts[tok] += 1
                # Whole-name entry: the full name with stopwords trimmed from
                # the ends only - "The Argent Adept" -> "argent adept", but
                # "Darkstrife and Painstake" keeps its middle "and".
                if i in phrase_idxs:
                    phrase_toks = toks if keep_stopwords else trim_stopwords(toks)
                    if len(phrase_toks) >= 2:
                        phrase = " ".join(phrase_toks)
                        counts[phrase] += 1
                        phrases.add(phrase)

    stats["phrases"] = phrases
    return counts, stats


# --- output ----------------------------------------------------------------

def print_ascii(counts: Counter, phrases: set[str], top: int,
                width: int) -> None:
    if not counts:
        print("(no words counted)")
        return
    items = counts.most_common(top)
    max_count = items[0][1]
    label_w = max(len(w) for w, _ in items)
    bar_w = max(10, width - label_w - 14)
    total = sum(counts.values())
    print(f"\n{len(counts):,} distinct entries "
          f"({len(phrases):,} name phrases), {total:,} total tokens\n")
    for word, n in items:
        bar = "#" * max(1, round(n / max_count * bar_w))
        mark = "*" if word in phrases else " "
        print(f"{word:>{label_w}} {mark} {n:>6,}  {bar}")


def write_csv(counts: Counter, phrases: set[str], path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["word", "count", "kind"])
        for word, n in counts.most_common():
            w.writerow([word, n, "phrase" if word in phrases else "word"])
    print(f"\nwrote {path}  ({len(counts):,} rows)")


def write_png(counts: Counter, path: Path, top: int) -> None:
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print(f"\nskipping {path}: matplotlib not installed "
              f"(pip install matplotlib)")
        return
    items = counts.most_common(top)
    if not items:
        return
    words = [w for w, _ in items][::-1]
    values = [n for _, n in items][::-1]
    fig, ax = plt.subplots(figsize=(10, max(4, len(items) * 0.28)))
    ax.barh(words, values, color="#4c72b0")
    ax.set_xlabel("count")
    ax.set_title(f"Top {len(items)} words - card-gallery TSVs")
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    print(f"wrote {path}")


# --- cli -------------------------------------------------------------------

def main() -> int:
    p = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--gallery-dir", type=Path, default=DEFAULT_GALLERY_DIR,
                   help="directory holding the .tsv files")
    p.add_argument("--files", nargs="+", metavar="TSV",
                   help="specific TSV file(s) (name or path); default: all")
    p.add_argument("--columns", nargs="+", metavar="HEADER",
                   help="exact column header(s) to read; overrides the default "
                        "rules-text selection")
    p.add_argument("--all-text", action="store_true",
                   help="read every non-numeric column")
    p.add_argument("--name-columns", nargs="+", metavar="SUBSTR",
                   help="header substrings treated as name columns (multi-word "
                        f"values also counted whole); default: "
                        f"{', '.join(DEFAULT_NAME_MATCHES)}")
    p.add_argument("--no-names", action="store_true",
                   help="disable whole-phrase counting of name columns")
    p.add_argument("--keep-stopwords", action="store_true",
                   help="do not filter common function words")
    p.add_argument("--min-len", type=int, default=2,
                   help="ignore tokens shorter than this (default: 2)")
    p.add_argument("--top", type=int, default=40,
                   help="how many words to show / plot (default: 40)")
    p.add_argument("--width", type=int, default=100,
                   help="terminal histogram width (default: 100)")
    p.add_argument("--csv", type=Path, help="write full counts to this CSV")
    p.add_argument("--png", type=Path, help="write a bar chart to this PNG "
                                            "(needs matplotlib)")
    args = p.parse_args()

    if args.no_names:
        name_matches: tuple[str, ...] = ()
    elif args.name_columns:
        name_matches = tuple(s.strip().lower() for s in args.name_columns)
    else:
        name_matches = DEFAULT_NAME_MATCHES

    files = resolve_files(args.gallery_dir, args.files)
    counts, stats = count_words(
        files, args.columns, args.all_text,
        args.keep_stopwords, args.min_len, name_matches,
    )

    print(f"scanned {stats['files']} file(s), {stats['rows']:,} rows, "
          f"{stats['cells']:,} non-empty cells")
    print("columns used:")
    for c in sorted(stats["columns_used"]):
        print(f"  {c}")

    print_ascii(counts, stats["phrases"], args.top, args.width)
    if args.csv:
        write_csv(counts, stats["phrases"], args.csv)
    if args.png:
        write_png(counts, args.png, args.top)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
