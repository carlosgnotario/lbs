# How to Verify VS Code Live Server Extension Settings for Webflow Canvas

## Important Note

**VS Code Live Server doesn't have "domain permissions" for `.canvas.webflow.com`.** The issue is actually the reverse: **Webflow Canvas blocks requests to `localhost`** due to CORS (Cross-Origin Resource Sharing) security policies.

Live Server runs a local development server (typically on `http://127.0.0.1:5500` or `http://localhost:5500`), and Webflow's canvas editor will **block** any requests from `.canvas.webflow.com` to `localhost` URLs.

## Method 1: Check VS Code Live Server Extension Settings

1. **Open VS Code Settings:**
   - Press `Ctrl+,` (or `Cmd+,` on Mac)
   - Or go to **File** → **Preferences** → **Settings**

2. **Search for Live Server Settings:**
   - Type "Live Server" in the settings search bar
   - Look for these settings:
     - `liveServer.settings.host` - Usually `127.0.0.1` or `localhost`
     - `liveServer.settings.port` - Usually `5500`
     - `liveServer.settings.Cors` - CORS settings
     - `liveServer.settings.root` - Root directory

3. **Check CORS Settings:**
   - Look for `liveServer.settings.Cors`
   - If enabled, it adds CORS headers, but **this won't help** because Webflow blocks localhost regardless

## Method 2: Check Extension Configuration File

1. **Open VS Code Settings JSON:**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Preferences: Open User Settings (JSON)"
   - Look for any `liveServer` configuration

2. **Check Workspace Settings:**
   - Look for `.vscode/settings.json` in your project root
   - Check if there are any Live Server configurations there

## Method 3: Verify Live Server is Running

1. **Start Live Server:**
   - Right-click on your `index.html` or any HTML file
   - Select **"Open with Live Server"**
   - Or click the "Go Live" button in the VS Code status bar

2. **Check the Server URL:**
   - Look at the VS Code status bar - it should show something like:
     - `Port: 5500` or `http://127.0.0.1:5500`
   - Note the exact URL

3. **Test in Browser:**
   - Open the Live Server URL directly in your browser
   - Verify your files are accessible at that URL

## Method 4: Test CORS from Webflow Canvas

1. **Open Webflow Canvas:**
   - Go to your Webflow project in canvas mode
   - Open Developer Tools (`F12` or `Ctrl+Shift+I`)

2. **Check Console for CORS Errors:**
   - Look for errors like:
     - `"Access to fetch at 'http://localhost:5500/...' from origin 'https://webflow.com' has been blocked by CORS policy"`
     - `"Mixed Content: The page was loaded over HTTPS, but requested an insecure resource"`
   - These confirm that Webflow is blocking localhost

3. **Test with Console Command:**
   ```javascript
   // Replace with your actual Live Server URL
   fetch('http://127.0.0.1:5500/dist/app.js')
     .then(r => r.text())
     .then(console.log)
     .catch(err => console.error('CORS Error:', err))
   ```
   - If you see a CORS error, this confirms Webflow blocks localhost

## The Real Solution

**VS Code Live Server cannot be used directly with Webflow Canvas** because:
- Webflow Canvas runs on HTTPS (`https://*.canvas.webflow.com`)
- Live Server runs on HTTP (`http://localhost:5500`)
- Browsers block mixed content (HTTPS page loading HTTP resources)
- Webflow blocks localhost/127.0.0.1 for security

**You must use a deployed URL instead:**
- ✅ GitHub Pages: `https://carlosgnotario.github.io/lbs/dist/app.js`
- ✅ jsDelivr CDN: `https://cdn.jsdelivr.net/gh/carlosgnotario/lbs@main/dist/app.js`
- ❌ Live Server: `http://127.0.0.1:5500/dist/app.js` (won't work)

## Quick Verification Checklist

- [ ] Live Server is running (check VS Code status bar)
- [ ] Files are accessible at `http://127.0.0.1:5500` in a regular browser tab
- [ ] Webflow Canvas shows CORS errors when trying to load localhost URLs
- [ ] Using deployed URL (GitHub Pages or jsDelivr) works in Webflow Canvas

