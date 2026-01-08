# Live Server Configuration for Webflow Canvas

## ✅ Configuration Applied

I've created `.vscode/settings.json` with the following Live Server settings:

- **CORS Enabled**: `liveServer.settings.Cors: true` - Allows cross-origin requests
- **Root Directory**: Set to `/dist` - Serves files from your dist folder
- **Port**: 5500 (default)
- **Host**: 127.0.0.1

## 🚀 How to Use

1. **Build your files:**
   ```bash
   npm run build
   ```
   This compiles your SCSS and JS into the `dist` folder.

2. **Start Live Server:**
   - Right-click on any file in the `dist` folder
   - Select **"Open with Live Server"**
   - Or click the **"Go Live"** button in VS Code status bar

3. **Your files will be available at:**
   ```
   http://127.0.0.1:5500/app.js
   http://127.0.0.1:5500/app.css
   ```

4. **Use in Webflow Canvas:**
   Add to your Webflow project's **Custom Code** → **Head Code**:
   ```html
   <link rel="stylesheet" href="http://127.0.0.1:5500/app.css">
   <script src="http://127.0.0.1:5500/app.js"></script>
   ```

## ⚠️ Important Limitations

### Mixed Content Issue (HTTPS vs HTTP)

**Webflow Canvas runs on HTTPS** (`https://*.canvas.webflow.com`), but **Live Server runs on HTTP** (`http://127.0.0.1:5500`).

Modern browsers **block mixed content** - an HTTPS page cannot load HTTP resources for security reasons. You may see errors like:
- `"Mixed Content: The page was loaded over HTTPS, but requested an insecure resource"`
- `"This request has been blocked; the content must be served over HTTPS"`

### Possible Workarounds

1. **Disable Browser Security (Development Only):**
   - **Chrome**: Launch with `--disable-web-security --user-data-dir="C:/temp/chrome_dev"`
   - **Edge**: Launch with `--disable-web-security --user-data-dir="C:/temp/edge_dev"`
   - ⚠️ **Warning**: Only use this for local development! Never browse the web with these flags.

2. **Use ngrok or similar tunnel:**
   - Creates an HTTPS tunnel to your localhost
   - Example: `ngrok http 5500` gives you `https://xxxxx.ngrok.io`
   - This provides HTTPS, which Webflow will accept

3. **Use a local HTTPS server:**
   - Configure Live Server or use a different tool with HTTPS support
   - Requires SSL certificates (can use self-signed for local dev)

## 🔄 Development Workflow

For the best development experience:

1. **During Development:**
   ```bash
   # Terminal 1: Watch and build files
   npm start
   
   # Terminal 2: (Optional) If using ngrok
   ngrok http 5500
   ```

2. **Files auto-rebuild** when you save changes (thanks to watch mode)

3. **Live Server auto-reloads** the browser when files change

4. **For Webflow testing**, you may need to:
   - Use ngrok for HTTPS access, OR
   - Temporarily disable browser security (development only), OR
   - Use the deployed CDN URL for final testing

## 📝 Testing CORS

To verify CORS is working:

1. Open Webflow Canvas
2. Open Developer Tools (`F12`)
3. Go to Console tab
4. Run:
   ```javascript
   fetch('http://127.0.0.1:5500/app.js')
     .then(r => r.text())
     .then(console.log)
     .catch(console.error)
   ```

If CORS is properly configured, you should see the file content. If you see a "Mixed Content" error, that's the HTTPS/HTTP issue mentioned above.

## 🎯 Recommended Approach

For the best balance of speed and compatibility:

1. **Development**: Use Live Server with CORS enabled (as configured)
2. **Quick Testing**: Use jsDelivr CDN (updates in 5-10 seconds after `npm run deploy`)
3. **Production**: Use GitHub Pages or your custom domain

This gives you:
- ✅ Fast local development with auto-reload
- ✅ Quick testing in Webflow via CDN
- ✅ Stable production URLs











