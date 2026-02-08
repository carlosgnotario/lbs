#!/usr/bin/env python3
"""Wrap loose text lines in <p> and collapse extra blank lines in Content/Excerpt of WordPress export CSV."""
import csv
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DEFAULT_CSV = os.path.join(PROJECT_DIR, "Posts-Export-2026-February-03-0219.csv")

CONTENT_COL = 2
EXCERPT_COL = 3


def process_field(text):
    """Wrap loose lines in <p>...</p> and collapse consecutive blank lines to one."""
    if not text or not isinstance(text, str):
        return text
    # Block-level open tags: don't wrap these (they're already a block)
    block_starts = ("<p ", "<p>", "<h1", "<h2", "<h3", "<h4", "<h5", "<h6", "<img", "<ul", "<ol", "<li", "<div", "<blockquote", "<table", "<tr", "<td", "<th", "<tbody", "<thead")
    lines = text.split("\n")
    result = []
    prev_blank = False
    for line in lines:
        stripped = line.strip()
        is_blank = len(stripped) == 0
        if is_blank:
            if not prev_blank:
                result.append("")
            prev_blank = True
        else:
            prev_blank = False
            if stripped.startswith("<"):
                # Inline-only line (e.g. <strong>...</strong> (text)) needs wrapping in <p>
                if any(stripped.startswith(b) for b in block_starts):
                    result.append(line)
                else:
                    result.append("<p>" + stripped + "</p>")
            else:
                result.append("<p>" + stripped + "</p>")
    # Join and collapse runs of more than 2 newlines to exactly 2
    joined = "\n".join(result)
    while "\n\n\n" in joined:
        joined = joined.replace("\n\n\n", "\n\n")
    return joined


def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV
    input_path = os.path.normpath(input_path)

    with open(input_path, "r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        print("No rows in CSV")
        return

    header = rows[0]
    if len(header) <= max(CONTENT_COL, EXCERPT_COL):
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
