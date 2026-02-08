#!/usr/bin/env python3
"""Replace standalone <strong>...</strong> lines with <h4>...</h4> in Content/Excerpt of WordPress export CSV."""
import csv
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DEFAULT_CSV = os.path.join(PROJECT_DIR, "Posts-Export-2026-February-03-0219.csv")

CONTENT_COL = 2
EXCERPT_COL = 3


def process_field(text):
    """Replace lines that are only <strong>...</strong> with <h4>...</h4>."""
    if not text or not isinstance(text, str):
        return text
    # Match a line (between ^ or \n and \n or $) that is only optional space + <strong>content</strong> + optional space
    # Content is [^\n]*? so we don't cross newlines (standalone line)
    return re.sub(
        r"(^|\n)\s*<strong>([^\n]*?)</strong>\s*(\n|$)",
        r"\1<h4>\2</h4>\3",
        text,
        flags=re.MULTILINE,
    )


def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV
    input_path = os.path.normpath(input_path)

    with open(input_path, "r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        print("No rows in CSV")
        return

    if len(rows[0]) <= max(CONTENT_COL, EXCERPT_COL):
        print("CSV has no Content/Excerpt columns")
        return

    for i in range(1, len(rows)):
        row = rows[i]
        if len(row) <= max(CONTENT_COL, EXCERPT_COL):
            continue
        row[CONTENT_COL] = process_field(row[CONTENT_COL])
        row[EXCERPT_COL] = process_field(row[EXCERPT_COL])

    with open(input_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    print(f"Done. Updated {input_path}")


if __name__ == "__main__":
    main()
