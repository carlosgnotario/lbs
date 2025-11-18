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

