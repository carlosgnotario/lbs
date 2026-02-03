#!/usr/bin/env python3
"""Extract unique authors from Posts export and write Webflow authors CSV (Name, Slug)."""
import csv
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
INPUT_CSV = os.path.join(PROJECT_DIR, "Posts-Export-2026-February-03-0219.csv")
OUTPUT_CSV = os.path.join(PROJECT_DIR, "authors-webflow.csv")


def name_to_slug(name):
    """Convert name to URL-safe slug: lowercase, spaces/special -> hyphens."""
    if not name or not str(name).strip():
        return ""
    s = str(name).strip().lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[-\s]+", "-", s)
    return s.strip("-")


def main():
    with open(INPUT_CSV, "r", encoding="utf-8", newline="") as f_in:
        reader = csv.DictReader(f_in)
        rows = list(reader)

    # key by Author ID to get one row per author; value = (display name, slug)
    authors_by_id = {}
    for row in rows:
        uid = (row.get("Author ID") or "").strip()
        first = (row.get("Author First Name") or "").strip()
        last = (row.get("Author Last Name") or "").strip()
        username = (row.get("Author Username") or "").strip()
        if not uid:
            continue
        if uid in authors_by_id:
            continue
        name = f"{first} {last}".strip() if (first or last) else username
        if not name:
            name = username or f"Author {uid}"
        authors_by_id[uid] = (name, name_to_slug(name))

    # sort by name
    authors = sorted(authors_by_id.values(), key=lambda x: x[0].lower())

    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f_out:
        writer = csv.writer(f_out)
        writer.writerow(["Name", "Slug"])
        writer.writerows(authors)

    print(f"Wrote {len(authors)} authors to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
