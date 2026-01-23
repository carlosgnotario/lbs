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

## Global Utility Classes (`scss/_classes.scss`)

The `_classes.scss` file contains a comprehensive set of utility classes that can be applied directly to HTML elements. These classes provide consistent styling across the entire project and follow a predictable naming convention.

### Text Color Classes (`.text-*`)

Apply text colors using the `.text-{color}` pattern:

**Primary Colors:**
- `.text-1` - Primary text color (from theme)
- `.text-2` - Secondary text color (from theme)
- `.text-dark-1` - Dark text variant 1
- `.text-dark-2` - Dark text variant 2

**Brand Colors:**
- `.text-orange` - Orange text
- `.text-pink` - Pink text
- `.text-yellow` - Yellow text
- `.text-blue` - Blue text
- `.text-green` - Green text (#93DA08)
- `.text-violet` - Violet text
- `.text-teal` - Teal text
- `.text-black` - Black text
- `.text-white` - White text

**Gray Scale:**
- `.text-gray` - Gray text
- `.text-light-gray` - Light gray (#CED0D3)
- `.text-mid-gray` - Mid gray (#767E83)
- `.text-dark-gray` - Dark gray (#373737)
- `.text-dark-gray-2` - Very dark gray (#1F1F1F)

**Special Colors:**
- `.text-neon-red` - Neon red (#F63C4E)
- `.text-half-way-orange` - Half-way orange
- `.text-blood-orange` - Blood orange (#C53000)
- `.text-honey` - Honey yellow (#FFB000)
- `.text-emerald` - Emerald green (#46C998)
- `.text-sea-blue` - Sea blue (#83ACB2)
- `.text-baby-blue` - Baby blue
- `.text-light-blue` - Light blue (#06CCD3)
- `.text-pastel-blue` - Pastel blue (#7F84DE)
- `.text-note` - Note yellow (#FFFBDE)

**Text Gradient Classes:**
- `.text-gradient-orange` - Gradient from orange to yellow
- `.text-gradient-purple` - Gradient from blue (#52A6E0) to pink (#F379E7)
- `.text-gradient-yellow` - Gradient from #FFB700 to yellow
- `.text-gradient-purple-vertical` - Vertical gradient from #B57DC1 to #9A7DC1
- `.text-gradient-gray-vertical` - Vertical gradient from background-2 to background-1

**Text Size Classes:**
- `.text-s` - Small text (13px)
- `.text-m` - Medium text (16px)
- `.text-l` - Large text (19px)
- `.text-xl` - Extra large text (22px, font-weight: 500)
- `.text-xxl` - Extra extra large text (26px, font-weight: 500)

**Heading Size Classes:**
- `.text-hs` - Small heading (22px)
- `.text-hm` - Medium heading (32px)
- `.text-hl` - Large heading (44px)
- `.text-hxl` - Extra large heading (60px)

**Dynamic Text Size Classes:**
- `.text-{10-100}` - Font size in pixels converted to rem (e.g., `.text-24` = 24px = 1.5rem)

**Text Alignment:**
- `.text-center` - Center align text
- `.text-right` - Right align text
- `.text-left` - Left align text

**Example Usage:**
```html
<h1 class="text-orange text-hl text-center">Welcome</h1>
<p class="text-2 text-m">This is secondary text</p>
<span class="text-gradient-orange text-xl">Gradient Text</span>
```

---

### Background Color Classes (`.bg-*`)

Apply background colors using the `.bg-{color}` pattern. These classes mirror the text color classes and automatically apply the same color to button pseudo-elements when used on buttons.

**Primary Backgrounds:**
- `.bg-1` - Primary background color
- `.bg-2` - Secondary background color
- `.bg-dark-1` - Dark background variant 1
- `.bg-dark-2` - Dark background variant 2

**Brand Backgrounds:**
- `.bg-orange` - Orange background
- `.bg-pink` - Pink background
- `.bg-yellow` - Yellow background
- `.bg-blue` - Blue background
- `.bg-green` - Green background (#93DA08)
- `.bg-violet` - Violet background
- `.bg-teal` - Teal background
- `.bg-black` - Black background
- `.bg-white` - White background

**Gray Scale Backgrounds:**
- `.bg-gray` - Gray background
- `.bg-light-gray` - Light gray (#CED0D3)
- `.bg-mid-gray` - Mid gray (#767E83)
- `.bg-dark-gray` - Dark gray (#373737)
- `.bg-dark-gray-2` - Very dark gray (#1F1F1F)
- `.bg-dark-gray-3` - Dark gray variant (#2E2E2E)

**Special Backgrounds:**
- `.bg-neon-red` - Neon red (#F63C4E)
- `.bg-half-way-orange` - Half-way orange
- `.bg-blood-orange` - Blood orange (#C53000)
- `.bg-honey` - Honey yellow (#FFB000)
- `.bg-emerald` - Emerald green (#46C998)
- `.bg-sea-blue` - Sea blue (#83ACB2)
- `.bg-baby-blue` - Baby blue
- `.bg-light-blue` - Light blue (#06CCD3)
- `.bg-pastel-blue` - Pastel blue (#7F84DE)
- `.bg-note` - Note yellow (#FFFBDE)

**Special Background Variants:**
- `.bg-graycta` - Gray CTA background (#FAFAFA) with border (#E9E9E9)
- `.bg-gray-label` - Gray label background (#81868C)

**Background Gradient Classes:**
- `.bg-gradient-orange` - Horizontal gradient from orange to yellow
- `.bg-gradient-orange-swap` - Horizontal gradient from yellow to orange
- `.bg-gradient-yellow` - Horizontal gradient from #FFB700 to yellow
- `.bg-gradient-purple` - Horizontal gradient from blue (#52A6E0) to pink (#F379E7)
- `.bg-gradient-purple-vertical` - Vertical gradient from #B57DC1 to #9A7DC1
- `.bg-gradient-gray-vertical` - Vertical gradient from background-2 to background-1
- `.bg-gradient-spanish` - Vertical gradient from red (#F92B2B) to orange (#FFB400)

**Example Usage:**
```html
<div class="bg-orange text-white pv-m ph-l">Orange Section</div>
<button class="bg-gradient-orange text-black">Gradient Button</button>
```

---

### Overlay Classes (`.overlay-*`)

Apply color overlays with blend modes:

- `.overlay-orange` - Applies an orange overlay (#FF6F09) with `hard-light` blend mode over the element

**Example Usage:**
```html
<div class="overlay-orange">
  <!-- Content with orange overlay effect -->
</div>
```

---

### Line Height Classes (`.lh-*`)

Control line spacing:

- `.lh-s` - Small line height (1.0)
- `.lh-m` - Medium line height (1.35)
- `.lh-l` - Large line height (1.5)
- `.lh-xl` - Extra large line height (2.0)

**Dynamic Line Height Classes:**
- `.lh-{10-100}` - Line height in pixels converted to rem (e.g., `.lh-24` = 24px = 1.5rem)

**Example Usage:**
```html
<p class="text-m lh-m">Readable paragraph text</p>
```

---

### Margin Classes

Control spacing around elements:

**Margin Bottom (`.mb-*`):**
- `.mb-0` - No bottom margin
- `.mb-xxs` - Extra extra small (12px)
- `.mb-xs` - Extra small (18px)
- `.mb-s` - Small (30px)
- `.mb-r` - Regular (60px)
- `.mb-m` - Medium (75px)
- `.mb-l` - Large (100px)
- `.mb-remove` - Removes margin-bottom from all direct children

**Margin Top (`.mt-*`):**
- `.mt-0` - No top margin
- `.mt-xxs` - Extra extra small (12px)
- `.mt-xs` - Extra small (18px)
- `.mt-s` - Small (30px)
- `.mt-r` - Regular (60px)
- `.mt-m` - Medium (75px)
- `.mt-l` - Large (100px)

**Margin Left (`.ml-*`):**
- `.ml-auto` - Auto left margin (pushes element to the right)
- `.ml-0` - No left margin
- `.ml-xxs` - Extra extra small (12px)
- `.ml-xs` - Extra small (18px)
- `.ml-s` - Small (30px)
- `.ml-r` - Regular (60px)
- `.ml-m` - Medium (75px)
- `.ml-l` - Large (100px)

**Margin Right (`.mr-*`):**
- `.mr-auto` - Auto right margin (pushes element to the left)
- `.mr-0` - No right margin
- `.mr-xxs` - Extra extra small (12px)
- `.mr-xs` - Extra small (18px)
- `.mr-s` - Small (30px)
- `.mr-r` - Regular (60px)
- `.mr-m` - Medium (75px)
- `.mr-l` - Large (100px)

**Dynamic Margin Classes:**
- `.mt-{1-100}` - Top margin in rem (e.g., `.mt-2` = 2rem)
- `.mb-{1-100}` - Bottom margin in rem (e.g., `.mb-2` = 2rem)
- `.ml-{1-100}` - Left margin in rem (e.g., `.ml-2` = 2rem)
- `.mr-{1-100}` - Right margin in rem (e.g., `.mr-2` = 2rem)

**Example Usage:**
```html
<div class="mb-l mt-s">Spaced section</div>
<div class="ml-auto">Right-aligned element</div>
```

---

### Padding Classes

Control internal spacing:

**Vertical Padding (`.pv-*`):**
- `.pv-s` - Small (15px top and bottom)
- `.pv-r` - Regular (35px top and bottom)
- `.pv-m` - Medium (45px top and bottom)
- `.pv-l` - Large (80px top and bottom)
- `.pv-xl` - Extra large (100px top and bottom)
- `.pv-hero` - Hero section padding (255px top, 100px bottom)

**Horizontal Padding (`.ph-*`):**
- `.ph-s` - Small (15px left and right)
- `.ph-r` - Regular (35px left and right)
- `.ph-m` - Medium (45px left and right)
- `.ph-l` - Large (80px left and right)
- `.ph-xl` - Extra large (100px left and right)

**Example Usage:**
```html
<section class="pv-l ph-m bg-2">Padded section</section>
```

---

### Border Radius Classes (`.radius-*`)

Apply rounded corners:

- `.radius-xl` - Extra large radius (80px)
- `.radius-l` - Large radius (40px)
- `.radius-m` - Medium radius (18px)
- `.radius-s` - Small radius (10px)

**Example Usage:**
```html
<div class="bg-orange radius-m pv-m ph-l">Rounded box</div>
```

---

### Shadow Classes (`.shadow-*`)

Apply box shadows:

- `.shadow` - Standard shadow (subtle elevation)
- `.shadow-top` - Top shadow (creates depth from above)

**Example Usage:**
```html
<div class="bg-white shadow radius-m">Card with shadow</div>
```

---

### Layout Classes

**Width:**
- `.full-w` - Full width (100%)

**Centering:**
- `.center` - Centers element horizontally using auto margins

**Content Width:**
- `.padded` - Constrains content to max-width of 920px and centers it

**Example Usage:**
```html
<div class="padded">
  <div class="full-w center">Centered content</div>
</div>
```

---

### Slot Classes (`.slot-*`)

Flexbox and grid layout utilities:

- `.slot.center`, `.slot.right`, `.slot.left` - Centers content using flexbox
- `.slot-dual` - Creates a 2-column grid layout with gap

**Example Usage:**
```html
<div class="slot-dual">
  <div>Column 1</div>
  <div>Column 2</div>
</div>
```

---

### Content Alignment Classes

- `.content-top` - Aligns `.dual-layout-content` children to flex-start with top padding

---

### Grid System (Data Attributes)

The project uses a flexible grid system via data attributes:

**Grid Container:**
- `[data-grid="0"]` - Flexbox layout
- `[data-grid="{1-15}"]` - Creates a grid with 1-15 columns

**Grid Cell Spanning:**
- `[data-grid-cell-span="{1-15}"]` - Makes a cell span 1-15 columns

**Grid Row Spanning:**
- `[data-grid-row-span="{1-15}"]` - Makes a cell span 1-15 rows

**Grid Gaps:**
- `[data-grid-vertical-gap="{1-15}"]` - Sets column gap in rem
- `[data-grid-horizontal-gap="{1-15}"]` - Sets row gap in rem

**Example Usage:**
```html
<div data-grid="3" data-grid-vertical-gap="2">
  <div data-grid-cell-span="2">Spans 2 columns</div>
  <div>Single column</div>
</div>
```

---

### Gap Classes (`.gap-*`)

Control spacing between flex/grid children:

- `.gap-s` - Small gap (24px)
- `.gap-m` - Medium gap (34px)
- `.gap-l` - Large gap (72px)
- `.gap-xl` - Extra large gap (120px)

**Example Usage:**
```html
<div class="flex gap-m">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

### Max Width Classes (`.mw-*`)

Control maximum element width:

- `.mw-{1-100}` - Max width in rem (e.g., `.mw-50` = 50rem)

**Example Usage:**
```html
<div class="mw-80 center">Constrained content</div>
```

---

### Font Weight Classes (`.fw-*`)

Control text weight:

- `.fw-400` - Normal weight
- `.fw-500` - Medium weight
- `.fw-600` - Semi-bold
- `.fw-700` - Bold
- `.fw-800` - Extra bold

**Example Usage:**
```html
<h2 class="fw-700 text-hl">Bold Heading</h2>
```

---

### Utility Classes

**Overflow:**
- `.no-overflow` - Hides overflow content

**Margin Removal:**
- `.marginless` - Removes all margins from all children

**Special Positioning:**
- `.pull-slot` - Negative top margin (-210px) for overlapping elements

**Text Wrapping:**
- `.wrap-balance` - Uses CSS `text-wrap: balance` for better text wrapping

**Example Usage:**
```html
<div class="no-overflow">
  <div class="pull-slot">Overlapping element</div>
</div>
<p class="wrap-balance">Balanced text wrapping</p>
```

---

## Combining Classes

Classes are designed to be combined for maximum flexibility:

```html
<!-- Example: Styled card -->
<div class="bg-white shadow radius-m pv-l ph-m mb-l">
  <h2 class="text-orange text-hl mb-s">Card Title</h2>
  <p class="text-2 text-m lh-m">Card content with proper spacing and styling.</p>
</div>

<!-- Example: Gradient button -->
<button class="bg-gradient-orange text-black fw-700 pv-s ph-l radius-s">
  Click Me
</button>

<!-- Example: Responsive grid -->
<div data-grid="3" data-grid-vertical-gap="2" class="mb-l">
  <div class="bg-1 pv-m ph-s radius-s">Item 1</div>
  <div class="bg-1 pv-m ph-s radius-s">Item 2</div>
  <div class="bg-1 pv-m ph-s radius-s">Item 3</div>
</div>
```

---

## Notes

- All pixel values are automatically converted to rem using the `ptr()` function (pixels-to-rem)
- Color values use CSS custom properties (CSS variables) defined in the theme
- Background classes automatically apply to button pseudo-elements when used on buttons
- The grid system uses data attributes for better semantic HTML
- Dynamic classes (like `.text-{10-100}`) are generated via SCSS loops for consistency
