#!/usr/bin/env python3
"""Clean ugly HTML in WordPress export CSV: trailing br in p, double closes, empty p junk."""
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
    if not text or not isinstance(text, str):
        return text

    # 1) Remove trailing <br> or <br /> immediately before </p> (redundant)
    text = re.sub(r"<br\s*/?>\s*</p>", "</p>", text, flags=re.IGNORECASE)

    # 2) Fix double closes: </p></p> -> </p>
    while "</p></p>" in text:
        text = text.replace("</p></p>", "</p>")

    # 3) Remove junk: <p></p></p> (empty paragraph + extra close)
    text = text.replace("<p></p></p>", "")

    # 4) Remove standalone empty <p></p> that are redundant (optional - leave single <p></p> as is for now)

    # 5) Close unclosed <p> lines: add </p> when line starts with <p but has no </p>
    lines = text.split("\n")
    result = []
    for line in lines:
        stripped = line.rstrip()
        if stripped.startswith("<p") and "</p>" not in stripped:
            if stripped.endswith("<br />"):
                line = stripped[:-6] + "</p>"
            elif stripped.endswith("<br>"):
                line = stripped[:-4] + "</p>"
            else:
                line = stripped + "</p>"
        result.append(line)
    text = "\n".join(result)

    # 6) Fix any remaining </p></p> (in case step 5 created some)
    while "</p></p>" in text:
        text = text.replace("</p></p>", "</p>")

    return text


def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV
    input_path = os.path.normpath(input_path)

    with open(input_path, "r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows or len(rows[0]) <= max(CONTENT_COL, EXCERPT_COL):
        print("CSV missing or no Content/Excerpt columns")
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
