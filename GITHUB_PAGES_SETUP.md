# GitHub Pages Setup Instructions

## Option 1: Using GitHub Actions (Recommended - Automatic)

### Step 1: Enable GitHub Pages
1. Go to: `https://github.com/carlosgnotario/lbs`
2. Click **Settings** (top menu)
3. Click **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Click **Save**

### Step 2: Wait for Deployment
- The workflow will run automatically after you enable it
- Go to the **Actions** tab to see the deployment progress
- Once complete (1-2 minutes), your site will be live at:
  ```
  https://carlosgnotario.github.io/lbs/app.css
  ```

### Step 3: Use in Webflow
Add this to your Webflow project's **Custom Code** → **Head Code**:
```html
<link rel="stylesheet" href="https://carlosgnotario.github.io/lbs/app.css">
```

**Note:** Every time you push to `main`, it will automatically rebuild and deploy.

---

## Option 2: Using gh-pages Branch (Alternative - Manual)

### Step 1: Enable GitHub Pages
1. Go to: `https://github.com/carlosgnotario/lbs`
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select **gh-pages** branch and **/ (root)** folder
5. Click **Save**

### Step 2: Deploy
Run this command whenever you want to update:
```bash
npm run pages:deploy
```

This will:
- Build your CSS
- Deploy the `dist` folder to the `gh-pages` branch
- Your CSS will be available at: `https://carlosgnotario.github.io/lbs/app.css`

### Step 3: Use in Webflow
Same as Option 1 - add the link tag to your Webflow project.

---

## Quick Reference

**GitHub Pages URL:** `https://carlosgnotario.github.io/lbs/app.css`

**Webflow Code:**
```html
<link rel="stylesheet" href="https://carlosgnotario.github.io/lbs/app.css">
```

