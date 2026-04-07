#!/usr/bin/env python3
"""Audit TSV files so each row matches the header column count."""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path


def audit_file(path: Path) -> list[tuple[int, int, int]]:
    violations: list[tuple[int, int, int]] = []

    with path.open("r", encoding="utf-8", newline="") as f:
        rows = list(csv.reader(f, delimiter="\t"))

    if not rows:
        return violations

    header_cols = len(rows[0])
    for idx, row in enumerate(rows[1:], start=2):
        row_cols = len(row)
        if row_cols != header_cols:
            violations.append((idx, header_cols, row_cols))

    return violations


def collect_tsv_files(base_dir: Path) -> list[Path]:
    return sorted(base_dir.rglob("*.tsv"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-dir",
        default="card-gallery",
        help="Directory to scan recursively for .tsv files (default: card-gallery)",
    )
    args = parser.parse_args()

    base_dir = Path(args.base_dir)
    if not base_dir.exists():
        print(f"ERROR: base directory not found: {base_dir}", file=sys.stderr)
        return 2

    any_violations = False
    for tsv_path in collect_tsv_files(base_dir):
        violations = audit_file(tsv_path)
        for row_num, header_cols, row_cols in violations:
            any_violations = True
            print(f"{tsv_path.as_posix()}: row {row_num} header={header_cols} row={row_cols}")

    if any_violations:
        return 1

    print("TSV audit passed: no column-count violations.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
