# Webflow Setup Instructions

## Problem
The `classes-reference.html` file is **36,712 characters**, which exceeds Webflow's **10,000 character limit** for custom code embeds.

## Solutions

### Option 1: HTML Embed Element (Recommended)
1. In Webflow, add an **HTML Embed** element to your page
2. Copy the **entire contents** of `classes-reference.html`
3. Paste it into the HTML Embed element
4. This bypasses the custom code character limit

### Option 2: External Hosting + iframe
1. Host `classes-reference.html` on your server or a CDN
2. In Webflow, add an **HTML Embed** element
3. Paste this code:
```html
<iframe src="YOUR_URL/classes-reference.html" style="width:100%;height:100vh;border:none;"></iframe>
```

### Option 3: Split into Head + Body (Partial)
The file has been split into:
- `webflow-head-code.html` (3,142 chars) - Paste in **Page Settings > Custom Code > Head Code**
- Body content is still too large for Body Code section

**Note:** The body content alone is ~33,000 characters, still exceeding the 10k limit.

## Recommended Approach
Use **Option 1 (HTML Embed)** - it's the simplest and works perfectly for this use case.
