#!/usr/bin/env python3
"""Convert WordPress Posts export CSV to Webflow blog collection CSV."""
import csv
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
INPUT_CSV = os.path.join(PROJECT_DIR, "Posts-Export-2026-February-03-0219.csv")
OUTPUT_CSV = os.path.join(PROJECT_DIR, "blog-webflow.csv")

WEBFLOW_HEADERS = [
    "Name",
    "Slug",
    "Author",
    "Date of publication",
    "Category",
    "Main Image",
    "Post body",
    "Post summary",
    "Featured",
]

def first_or_empty(s, sep="|"):
    """Return first segment if pipe-separated, else the string (stripped)."""
    if not s or not str(s).strip():
        return ""
    return str(s).split(sep)[0].strip()

def main():
    with open(INPUT_CSV, "r", encoding="utf-8", newline="") as f_in:
        reader = csv.DictReader(f_in)
        rows = list(reader)
        if not rows:
            print("No rows in input CSV")
            return

    # Build header -> index from first row keys (DictReader uses first row as fieldnames)
    fieldnames = list(rows[0].keys())

    out_rows = []
    for row in rows:
        title = row.get("Title", "").strip()
        if not title:
            continue

        # Author: "Author First Name" + " " + "Author Last Name", fallback to "Author Username"
        first = (row.get("Author First Name") or "").strip()
        last = (row.get("Author Last Name") or "").strip()
        author = f"{first} {last}".strip() if (first or last) else (row.get("Author Username") or "").strip()

        # Main Image: first URL from "Image URL" (pipe-separated)
        image_url = first_or_empty(row.get("Image URL", ""))

        # Category: first category if pipe-separated
        category = first_or_empty(row.get("Categories", ""))

        # Featured: not in export; default false. Could add logic later (e.g. sticky).
        featured = "false"

        out_rows.append({
            "Name": title,
            "Slug": (row.get("Slug") or "").strip(),
            "Author": author or "Little Bee Speech",
            "Date of publication": (row.get("Date") or "").strip(),
            "Category": category,
            "Main Image": image_url,
            "Post body": row.get("Content", ""),
            "Post summary": row.get("Excerpt", ""),
            "Featured": featured,
        })

    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=WEBFLOW_HEADERS, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(out_rows)

    print(f"Wrote {len(out_rows)} rows to {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
