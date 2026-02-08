#!/usr/bin/env python3
"""Convert WordPress Posts export CSV to Webflow blog collection CSV."""
import csv
import os
import re

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
    "Image",
    "Post body",
    "Post summary",
    "Featured",
]

def first_or_empty(s, sep="|"):
    """Return first segment if pipe-separated, else the string (stripped)."""
    if not s or not str(s).strip():
        return ""
    return str(s).split(sep)[0].strip()


def first_image_url_from_html(html):
    """Return the first img src URL in HTML, or empty string if none."""
    if not html:
        return ""
    match = re.search(r'<img\b[^>]*\bsrc=(["\'])([^"\']+)\1', str(html), re.IGNORECASE)
    return match.group(2).strip() if match else ""


def categories_for_webflow(s, sep="|", webflow_sep="; "):
    """Return all pipe-separated categories as Webflow multi-reference format (semicolon-separated)."""
    if not s or not str(s).strip():
        return ""
    parts = [p.strip() for p in str(s).split(sep) if p.strip()]
    return webflow_sep.join(parts)


def strip_images(html):
    """Remove <img> tags from HTML string."""
    if not html:
        return ""
    return re.sub(r"<img\b[^>]*>", "", str(html), flags=re.IGNORECASE)


def strip_all_html(html):
    """Remove all HTML tags; return plain text. Collapses whitespace between tags."""
    if not html:
        return ""
    text = re.sub(r"<[^>]+>", " ", str(html), flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def strip_first_image(html):
    """Remove only the first <img> tag from HTML (so it can be used as main/Image field only)."""
    if not html:
        return ""
    return re.sub(r"<img\b[^>]*>", "", str(html), count=1, flags=re.IGNORECASE)


def convert_font_size_to_headings(html):
    """Convert <font size=\"+2\"> and +1 (and WordPress large-font classes) to <h2>/<h3>, with line break after so following text starts on a new line."""
    if not html:
        return ""
    text = str(html)
    # <strong><font size="+2">...</font></strong> or size='+2' -> <h2>...</h2> + paragraph break
    text = re.sub(
        r'<strong>\s*<font\s+size=["\']\+2["\']\s*>([\s\S]*?)</font>\s*</strong>',
        r'<h2>\1</h2>\n\n',
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r'<strong>\s*<font\s+size=["\']\+1["\']\s*>([\s\S]*?)</font>\s*</strong>',
        r'<h3>\1</h3>\n\n',
        text,
        flags=re.IGNORECASE,
    )
    # Standalone <font size="+2">...</font> (without strong)
    text = re.sub(
        r'<font\s+size=["\']\+2["\']\s*>([\s\S]*?)</font>',
        r'<h2>\1</h2>\n\n',
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r'<font\s+size=["\']\+1["\']\s*>([\s\S]*?)</font>',
        r'<h3>\1</h3>\n\n',
        text,
        flags=re.IGNORECASE,
    )
    # WordPress block classes: has-x-large-font-size -> h2, has-large-font-size -> h3
    text = re.sub(
        r'<p\s+class=["\']has-x-large-font-size["\'][^>]*>([\s\S]*?)</p>',
        r'<h2>\1</h2>\n\n',
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r'<p\s+class=["\']has-large-font-size["\'][^>]*>([\s\S]*?)</p>',
        r'<h3>\1</h3>\n\n',
        text,
        flags=re.IGNORECASE,
    )
    # Ensure line break after headings when source had none (e.g. </h2>Burnout -> </h2>\n\nBurnout)
    text = re.sub(r'(</h[23]>)([^\s<\n])', r'\1\n\n\2', text)
    return text


def ensure_html_paragraphs(text):
    """Convert newline-separated paragraphs into <p>...</p> so they render in HTML/Webflow."""
    if not text or not str(text).strip():
        return "" if text is None else text
    text = str(text)
    # Only skip if content is already wrapped in <p> (stray </p> from WordPress blocks shouldn't skip)
    if text.strip().startswith("<p>") and text.strip().endswith("</p>"):
        return text
    # Double newlines = paragraph break (handle \r\n as one newline)
    text = re.sub(r"(\r?\n)(\s*\r?\n)+", "</p><p>", text)
    # Single newline after sentence-ending punctuation (.[!?]) before capital = paragraph break
    text = re.sub(r"([.!?])\s*(\r?\n)+(\s*)([A-Z])", r"\1</p><p>\2\3", text)
    # Single newlines = line break within paragraph (normalize \r\n to \n first for consistency)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Don't turn newlines after block-end tags into <br /> (they're structural, not in-paragraph breaks)
    text = re.sub(
        r"(</p>|</h[1-6]>|</div>|</li>|</ul>|</ol>)\s*\n",
        r"\1",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"\n", "<br />", text)
    return "<p>" + text.strip() + "</p>"


def remove_leading_br_in_post_body(html):
    """Remove leading <p><br /> or <p></p> or <p><br></p> so body doesn't start with empty paragraph."""
    if not html:
        return html
    text = str(html).strip()
    # <p><br /> or <p><br> or <p><br/> (with optional /) at start
    text = re.sub(r"^<p>\s*<br\s*/?>\s*", "<p>", text, flags=re.IGNORECASE)
    # <p></p> at start (empty first paragraph)
    text = re.sub(r"^<p>\s*</p>\s*", "", text, flags=re.IGNORECASE)
    return text


def fix_paragraphs_ending_with_br(html):
    """Fix WordPress-style <p ...>...content<br> (unclosed) by replacing trailing <br> with </p>."""
    if not html:
        return html
    text = str(html)
    # Match <p> or <p attr="...">, then content (not crossing </p>), then <br> or <br />; replace trailing br with </p>
    text = re.sub(
        r"(<p(?:\s[^>]*)?>)((?:(?!</p>).)*?)<br\s*/?>\s*",
        r"\1\2</p>",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return text


def close_unclosed_paragraphs(html):
    """Close <p> that are followed by another <p> or by the outer </p> with no </p> in between."""
    if not html:
        return html
    text = str(html)
    # Use a replacement that rstrips content so </p> sits right after the text
    def _repl(m):
        return m.group(1) + m.group(2).rstrip() + "</p>" + m.group(3)
    # 1) Repeatedly: <p ...>content<p ...> (no </p> in between) -> <p ...>content</p><p ...>
    prev = None
    while prev != text:
        prev = text
        text = re.sub(
            r"(<p(?:\s[^>]*)?>)((?:(?!</p>).)*?)(<p(?:\s[^>]*)?>)",
            _repl,
            text,
            flags=re.IGNORECASE | re.DOTALL,
        )
    # 2) Last paragraph: <p attr="...">content</p> at end (unclosed inner p before outer </p>)
    text = re.sub(
        r"(<p\s[^>]+>)((?:(?!</p>).)*?)(</p>\s*$)",
        lambda m: m.group(1) + m.group(2).rstrip() + "</p>" + m.group(3),
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return text


def convert_text_align_center_to_class(html):
    """Wrap elements with style='text-align: center' in <div class="w-richtext-align-center"> so Webflow
    preserves center alignment (same class it uses for centered images)."""
    if not html:
        return html
    text = str(html)

    def strip_center_style(attrs):
        attrs = re.sub(
            r'\s*style=["\'][^"\']*?text-align\s*:\s*center[^"\']*["\']',
            "",
            attrs,
            flags=re.IGNORECASE,
        ).strip()
        return (" " + attrs) if attrs else ""

    for tag in ["h1", "h2", "h3", "h4", "h5", "h6", "p"]:
        pattern = (
            r"(<"
            + tag
            + r")(\s+[^>]*style=[\"'][^\"']*?text-align\s*:\s*center[^\"']*[\"'][^>]*)>"
            r"([\s\S]*?)"
            r"(</"
            + tag
            + r">)"
        )

        def repl(m, t=tag):
            open_attrs = strip_center_style(m.group(2))
            attrs_str = open_attrs.strip()
            inner = "<" + t + (" " + attrs_str if attrs_str else "") + ">" + m.group(3) + m.group(4)
            return '<div class="w-richtext-align-center">' + inner + "</div>"

        text = re.sub(pattern, lambda m, t=tag: repl(m, t), text, flags=re.IGNORECASE)
    return text


def strip_strong_from_headings(html):
    """Remove redundant <strong>...</strong> inside headings (h1–h6)."""
    if not html:
        return html
    text = str(html)
    for tag in ["h1", "h2", "h3", "h4", "h5", "h6"]:
        # <hN>...<strong>...</strong>...</hN> -> <hN>......</hN> (strip inner strong)
        text = re.sub(
            r"(<" + tag + r"\b[^>]*>)\s*<strong>\s*([\s\S]*?)\s*</strong>\s*(</" + tag + r">)",
            r"\1\2\3",
            text,
            flags=re.IGNORECASE,
        )
    return text


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

        # Image: first image in post body (used only as main image); fallback to first "Image URL" from export
        content_raw = row.get("Content", "")
        image_url = first_image_url_from_html(content_raw) or first_or_empty(row.get("Image URL", ""))
        # Remove first image from body so it appears only in Image field
        content_without_first_img = strip_first_image(content_raw)
        # Convert font size +2/+1 (and WordPress large-font classes) to h2/h3, ensure line break after headings
        content_without_first_img = convert_font_size_to_headings(content_without_first_img)

        # Category: all categories (pipe-separated in source → semicolon-separated for Webflow multi-reference)
        category = categories_for_webflow(row.get("Categories", ""))

        # Featured: not in export; default false. Could add logic later (e.g. sticky).
        featured = "false"

        out_rows.append({
            "Name": title,
            "Slug": (row.get("Slug") or "").strip(),
            "Author": author or "Little Bee Speech",
            "Date of publication": (row.get("Date") or "").strip(),
            "Category": category,
            "Image": image_url,
            "Post body": remove_leading_br_in_post_body(
                strip_strong_from_headings(
                    convert_text_align_center_to_class(
                        close_unclosed_paragraphs(
                            fix_paragraphs_ending_with_br(ensure_html_paragraphs(content_without_first_img))
                        )
                    )
                )
            ),
            "Post summary": strip_all_html(row.get("Excerpt", "")),
            "Featured": featured,
        })

    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=WEBFLOW_HEADERS, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(out_rows)

    print(f"Wrote {len(out_rows)} rows to {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
