# Body-level HTML components

This directory holds the small set of HTML fragments that `component-loader.js` injects into the body of a page. Everything else that used to live here has moved:

- **Styles** now load as real stylesheets (`theme-variables.css`, `base.css`, `guide.css`, `theme-switcher.css`). They must never come back into a component, because a `<div data-component="...">` inside `<head>` is invalid: the parser closes `<head>` at the first `<div>`, the placeholder ends up in `<body>`, and the styles only arrive after JavaScript fetches them. That is what caused the unstyled flash on every page.
- **Behaviour** lives in `../functions/`, composed by the single entry point `../functions/site.js`.

## Components

- **`theme-switcher.html`** - theme switcher UI with the colour options
- **`footer.html`** - footer with social links and credits
- **`scripts-common.html`** - shared inline script hooks
- **`component-loader.js`** - fetches the fragments above and swaps them into their placeholders

## Usage

Include the loader once, near the end of `<body>`:

```html
<script src="./components/component-loader.js"></script>
```

Then place a `<div data-component="...">` wherever the fragment should render. Placeholders are only valid inside `<body>`:

```html
<div data-component="theme-switcher"></div>
<div data-component="footer"></div>
<div data-component="scripts-common"></div>
```

## Creating a new page

Copy an existing guide (for example `../dsa-practice-guide.html`) and follow [`../ADDING-A-RESOURCE.md`](../ADDING-A-RESOURCE.md). It lists the exact `<head>` block to use, including the canonical URL, Open Graph tags and JSON-LD.

## Customisation

### Theme colours

Edit the CSS custom properties in `../theme-variables.css`.

### Social links

Edit `footer.html`.

## File structure

```
components/
├── theme-switcher.html   # Theme switcher UI
├── footer.html           # Footer component
├── scripts-common.html   # Shared inline script hooks
├── component-loader.js   # Component loading utility
└── README.md             # This file
```

## Notes

- Components are fetched once and cached in memory for the page.
- Nothing here is required for a page to be readable: every page ships its content and a `<noscript>` fallback nav in the HTML.
- Anything that must be visible before first paint belongs in a stylesheet, not in a component.
