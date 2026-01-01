# Modular HTML Component System

This directory contains reusable components for building consistent HTML pages across the website. The system eliminates code duplication and makes it easy to maintain common elements like headers, footers, and theme switchers.

## Components

### Core Components

- **`head-common.html`** - Common head section with meta tags, CSS variables, and base styles
- **`theme-switcher.html`** - Theme switcher UI with color options
- **`footer.html`** - Footer with social links and credits
- **`back-nav.html`** - Customizable back navigation
- **`scripts-common.html`** - Common JavaScript functionality

### Utilities

- **`component-loader.js`** - JavaScript utility to load components dynamically
- **`page-template.html`** - Template for creating new pages
- **`page-creator.js`** - Script to generate new pages from template

## Usage

### Method 1: Component Loader (Recommended)

1. Include the component loader script in your HTML:
```html
<script src="./components/component-loader.js"></script>
```

2. Use data-component attributes to include components:
```html
<div data-component="theme-switcher"></div>
<div data-component="back-nav"></div>
<div data-component="footer"></div>
<div data-component="scripts-common"></div>
```

### Method 2: Manual Copy-Paste (For offline reliability)

Copy the content from component files directly into your HTML when you need offline reliability.

## Creating New Pages

### Using the Template

1. Copy `page-template.html` to create a new page
2. Replace `{{PAGE_TITLE}}` and `{{PAGE_DESCRIPTION}}` placeholders
3. Add your content between the header and footer components
4. Save with a descriptive filename

### Using the Page Creator Script

```bash
node components/page-creator.js "my-new-page.html" "My Page Title" "Description of my page"
```

## Customization

### Theme Colors

Edit the CSS variables in `head-common.html` to change the color scheme:
```css
:root {
    --primary: #8b5cf6;    /* Purple theme */
    --secondary: #7c3aed;
    --accent: #a78bfa;
}
```

### Back Navigation

Customize the back navigation by setting `window.backNavConfig`:
```javascript
window.backNavConfig = {
    url: '../index.html',
    text: 'Back to Home'
};
```

### Social Links

Edit `footer.html` to update social media links and information.

## File Structure

```
components/
├── head-common.html      # Common head section
├── theme-switcher.html   # Theme switcher UI
├── footer.html           # Footer component
├── back-nav.html         # Back navigation
├── scripts-common.html   # Common JavaScript
├── component-loader.js   # Component loading utility
├── page-template.html    # Template for new pages
├── page-creator.js       # Page creation script
└── README.md            # This file
```

## Benefits

1. **No Code Duplication** - Common elements are defined once
2. **Easy Maintenance** - Update components in one place
3. **Consistency** - All pages use the same styling and functionality
4. **Fast Development** - Create new pages quickly from template
5. **Offline Reliability** - Components work without server dependency

## Examples

### Creating a Resource Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <div data-component="head-common"></div>
    <title>My Resource | Resources by Shumbul Arifa</title>
    <meta name="description" content="Description of my resource">
</head>
<body>
    <div data-component="theme-switcher"></div>
    <div data-component="back-nav"></div>
    
    <!-- Your content here -->
    
    <div data-component="footer"></div>
    <div data-component="scripts-common"></div>
    <script src="./components/component-loader.js"></script>
</body>
</html>
```

### Adding Custom Styles

Add page-specific styles after including `head-common`:
```html
<div data-component="head-common"></div>
<style>
    .my-custom-class {
        background: var(--primary);
        color: white;
    }
</style>
```

## Notes

- Components are loaded asynchronously and cached for performance
- The system works both online and offline
- All existing pages can be gradually migrated to use components
- The theme switcher and common functionality work consistently across all pages
