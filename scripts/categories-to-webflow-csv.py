#!/usr/bin/env python3
"""Extract unique categories from Posts export and write Webflow categories CSV (Name, Slug)."""
import csv
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
INPUT_CSV = os.path.join(PROJECT_DIR, "Posts-Export-2026-February-03-0219.csv")
OUTPUT_CSV = os.path.join(PROJECT_DIR, "categories-webflow.csv")


def name_to_slug(name):
    """Convert category name to URL-safe slug: lowercase, spaces/special -> hyphens."""
    if not name or not str(name).strip():
        return ""
    s = str(name).strip().lower()
    s = re.sub(r"[^\w\s-]", "", s)  # remove non-word except space and hyphen
    s = re.sub(r"[-\s]+", "-", s)   # collapse spaces and hyphens to single hyphen
    return s.strip("-")


def main():
    with open(INPUT_CSV, "r", encoding="utf-8", newline="") as f_in:
        reader = csv.DictReader(f_in)
        rows = list(reader)

    seen = set()
    categories = []
    for row in rows:
        raw = (row.get("Categories") or "").strip()
        if not raw:
            continue
        for name in raw.split("|"):
            name = name.strip()
            if name and name not in seen:
                seen.add(name)
                categories.append((name, name_to_slug(name)))

    # sort by name for consistent output
    categories.sort(key=lambda x: x[0].lower())

    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f_out:
        writer = csv.writer(f_out)
        writer.writerow(["Name", "Slug"])
        writer.writerows(categories)

    print(f"Wrote {len(categories)} categories to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
