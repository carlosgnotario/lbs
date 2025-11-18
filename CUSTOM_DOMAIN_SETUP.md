# Custom Domain Setup for GitHub Pages

To use a neutral domain instead of `carlosgnotario.github.io`, you have several options:

## Option 1: Custom Domain (Recommended)

### If you own a domain (e.g., `yourdomain.com`):

1. **Add CNAME file to your repository:**
   - Create a file named `CNAME` in the `dist` folder (or root)
   - Add your domain: `css.yourdomain.com` or `lbs.yourdomain.com`

2. **Configure DNS:**
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add a CNAME record:
     - **Name/Host:** `css` (or `lbs`, or `cdn`)
     - **Value/Target:** `carlosgnotario.github.io`
     - **TTL:** 3600 (or default)

3. **Enable in GitHub:**
   - Go to: `https://github.com/carlosgnotario/lbs/settings/pages`
   - Under **Custom domain**, enter: `css.yourdomain.com`
   - Check **Enforce HTTPS**
   - Click **Save**

4. **Wait for DNS propagation** (can take up to 24 hours, usually 1-2 hours)

**Result:** Your CSS will be at `https://css.yourdomain.com/app.css`

---

## Option 2: Free Subdomain Services

### Using Freenom or other free domain services:
- Get a free `.tk`, `.ml`, `.ga`, or `.cf` domain
- Follow the same steps as Option 1
- Example: `lbs-css.tk` or `lbs-styles.ml`

---

## Option 3: Use a CDN Proxy (No Domain Needed)

### Using jsDelivr (for GitHub repos):
Your files can be accessed via:
```
https://cdn.jsdelivr.net/gh/carlosgnotario/lbs@main/dist/app.css
```

**Pros:** Free, fast, no setup needed
**Cons:** Still references your username in the path

---

## Option 4: GitHub Pages with Organization/User Site

If you create a repository named `carlosgnotario.github.io`, you can access files at:
```
https://carlosgnotario.github.io/app.css
```

But this requires a different repository structure.

---

## Quick Setup Script

I can create a script to automatically add/update the CNAME file. Just provide your desired domain name!

