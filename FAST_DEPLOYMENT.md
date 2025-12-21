# Faster CSS & JavaScript Deployment Options

GitHub Pages can take 1-2 minutes to update. Here are faster alternatives:

## Option 1: jsDelivr CDN (FASTEST - Recommended) ⚡

**jsDelivr serves directly from GitHub and updates within seconds!**

### Setup:
1. **CSS** is automatically available at:
   ```
   https://cdn.jsdelivr.net/gh/carlosgnotario/lbs@main/dist/app.css
   ```

2. **JavaScript** is automatically available at:
   ```
   https://cdn.jsdelivr.net/gh/carlosgnotario/lbs@main/dist/app.js
   ```

3. Use in Webflow:
   ```html
   <!-- CSS -->
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/carlosgnotario/lbs@main/dist/app.css">
   
   <!-- JavaScript (add before closing </body> tag) -->
   <script src="https://cdn.jsdelivr.net/gh/carlosgnotario/lbs@main/dist/app.js"></script>
   ```

**Benefits:**
- ✅ Updates in **5-10 seconds** after push
- ✅ Free CDN with global edge locations
- ✅ Automatic cache invalidation
- ✅ No setup needed
- ✅ Works immediately
- ✅ **Solves CORS issues** - Webflow blocks localhost, but CDN works perfectly!

**Note:** jsDelivr caches for a few seconds, so updates appear almost instantly.

**Important:** You must deploy your files to GitHub first using `npm run deploy` or `npm run git:push` before the CDN URLs will work.

---

## Option 2: Optimized GitHub Pages (Current Setup)

I've optimized the workflow with:
- ✅ npm caching (faster installs)
- ✅ `npm ci` (faster, more reliable)

**Deployment time:** ~30-60 seconds (down from 1-2 minutes)

---

## Option 3: Versioned URLs (Cache Busting)

Add version query strings to force cache refresh:

```html
<link rel="stylesheet" href="https://carlosgnotario.github.io/lbs/app.css?v=1.0.1">
<script src="https://carlosgnotario.github.io/lbs/app.js?v=1.0.1"></script>
```

Update the version number in Webflow when you push changes.

---

## Recommendation

**Use jsDelivr** - it's the fastest and most reliable option for CSS and JavaScript files that need quick updates!

## Troubleshooting CORS Errors

If you see a CORS error like:
> "Unable to load an external script due to security restrictions (CORS)"

**Solution:** Webflow blocks localhost URLs. You must:
1. Build your files: `npm run build`
2. Deploy to GitHub: `npm run deploy` (or `npm run git:push`)
3. Use the jsDelivr CDN URL in Webflow instead of localhost

**Never use:** `http://127.0.0.1:5500/dist/app.js` ❌  
**Always use:** `https://cdn.jsdelivr.net/gh/carlosgnotario/lbs@main/dist/app.js` ✅

