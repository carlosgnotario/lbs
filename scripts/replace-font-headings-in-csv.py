#!/usr/bin/env python3
"""Replace <strong><font size=\"+N\">...</font></strong> with <hN>...</hN> in the WordPress export CSV."""
import re
import sys
import os

DEFAULT_CSV = r"c:\Users\Carlos\Downloads\Posts-Export-2026-February-03-0219.csv"

def main():
    input_csv = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV
    input_csv = os.path.normpath(input_csv)
    with open(input_csv, "r", encoding="utf-8", newline="") as f:
        text = f.read()

    # Replace isolated <strong><font size="+N">...</font></strong> headings: +2 -> h2, +1 -> h3
    # In CSV, doubled quotes: size=""+2"" so pattern is size=""\+2""
    text = re.sub(
        r'<strong><font size=""\+2"">(.*?)</font></strong>',
        r'<h2>\1</h2>',
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )
    text = re.sub(
        r'<strong><font size=""\+1"">(.*?)</font></strong>',
        r'<h3>\1</h3>',
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )

    with open(input_csv, "w", encoding="utf-8", newline="") as f:
        f.write(text)

    print(f"Done. Updated {input_csv}")

if __name__ == "__main__":
    main()
