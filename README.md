# LBS Project

## Setup

Install dependencies:
```bash
npm install
```

## Usage

### Development
Start the development server with auto-compilation:
```bash
npm start
```

This will:
- Watch and compile SCSS files (`app.scss` → `dist/app.css`)
- Watch and run JavaScript files

### Build
Compile SCSS for production:
```bash
npm run build
```

### Git Push
Push to GitHub with a single command (add, commit, and push all in one):
```bash
npm run git:push -- "Your commit message"
```

Or use the shorter alias:
```bash
npm run gp -- "Your commit message"
```

If no message is provided, it defaults to "Update".

Or use the deploy command (builds first, then pushes):
```bash
npm run deploy
```

## GitHub Pages Setup

Your CSS files are automatically deployed to GitHub Pages when you push to the `main` branch.

### Initial Setup (One-time)

1. Go to your GitHub repository: `https://github.com/carlosgnotario/lbs`
2. Click on **Settings** (top menu)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Save the settings

### Using Your CSS in Webflow

After the first deployment (takes a few minutes), your CSS file will be available at:

```
https://carlosgnotario.github.io/lbs/app.css
```

**To link in Webflow:**
1. Go to your Webflow project settings
2. Navigate to **Custom Code** → **Head Code**
3. Add this line:
   ```html
   <link rel="stylesheet" href="https://carlosgnotario.github.io/lbs/app.css">
   ```

**Note:** After each push to `main`, GitHub Actions will automatically rebuild and deploy your CSS. The deployment usually takes 1-2 minutes.

## Project Structure

```
├── app.scss          # Main SCSS file
├── app.js            # Main JavaScript file
├── scss/             # SCSS modules folder
│   └── _modules.scss
├── js/               # JavaScript modules folder
│   └── modules.js
└── dist/             # Compiled output (generated)
    └── app.css
```

