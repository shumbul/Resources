# Adding a new resource (guide) page

This site is built so a new guide gets navigation, footer, the AI assistant, quick-jump, copy buttons, animations, and theming **for free**, just by following one template. You write only the content.

## 1. Copy the guide template

Start from an existing guide, `docs/dsa-practice-guide.html` is the cleanest reference. Copy it to `docs/your-new-guide.html` and replace the content.

Every guide has this skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Guide Title | Resources by Shumbul Arifa</title>
    <meta name="description" content="One-line description.">
    <link rel="canonical" href="https://shumbul.github.io/Resources/your-new-guide.html">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap">

    <!-- Styles: real stylesheets, so they apply before first paint -->
    <link rel="stylesheet" href="./theme-variables.css">
    <link rel="stylesheet" href="./base.css">
    <link rel="stylesheet" href="./guide.css">
    <link rel="stylesheet" href="./theme-switcher.css">

    <link rel="icon" type="image/svg+xml" href="./favicon.svg">
    <link rel="alternate" type="application/rss+xml" title="Resources by Shumbul Arifa" href="./feed.xml">

    <!-- Social share card: og:url and canonical must point at THIS page -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Resources by Shumbul Arifa">
    <meta property="og:title" content="Your Guide Title, in share-friendly words">
    <meta property="og:description" content="One line that makes someone click on LinkedIn.">
    <meta property="og:url" content="https://shumbul.github.io/Resources/your-new-guide.html">
    <meta property="og:image" content="https://shumbul.github.io/Resources/assets/og-default.png">
    <meta property="og:image:alt" content="Resources by Shumbul Arifa, free tech career guides">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="last-updated" content="2026-08-13">

    <!-- Copy the Article + BreadcrumbList JSON-LD from any existing guide and
         change headline, description, dateModified and the two URLs. -->

    <style>
        /* Shared guide classes live in guide.css. Only add rules that are
           genuinely unique to this page here. */
    </style>
</head>
<body>
    <div data-component="theme-switcher"></div>

    <header class="guide-header">
        <div class="container">
            <h1 class="guide-title">🎯 Your Guide Title</h1>
            <p class="guide-sub">A friendly one-liner about what the reader gets.</p>
        </div>
    </header>

    <main class="container">
        <div class="starter">
            <strong style="font-family:var(--font-display);">🌱 New here? Start with this</strong>
            <p class="muted" style="margin:.5rem 0 0;">A short, encouraging intro. Point them to <strong>✦ Ask AI</strong>.</p>
        </div>

        <div class="gsection">
            <h2>Your first section</h2>
            <p class="muted">Content...</p>
        </div>

        <div class="gsection">
            <h2>Your second section</h2>
            <p class="muted">Content...</p>
        </div>
        <!-- 3+ sections => Quick Jump appears automatically -->
    </main>

    <div data-component="footer"></div>
    <div data-component="scripts-common"></div>
    <script src="./components/component-loader.js"></script>

    <noscript>
        <!-- Copy the whole <noscript> block from any existing guide: it is the
             only navigation a visitor gets if JavaScript fails. -->
    </noscript>

    <script type="module" src="./functions/site.js?v=20260815b"></script>
</body>
</html>
```

> **Cache-busting:** the `?v=` on the `site.js` tag forces browsers to
> re-fetch the shared modules after a deploy. Use the **same version** the other
> pages currently use. When you change any file in `functions/`, bump the version
> in two places: this `?v=` on every page's `site.js` tag, and the matching
> `?v=` on the imports inside `functions/site.js`.

**Rules that keep parity with the rest of the site:**
- Never put a `<div data-component="...">` inside `<head>`. HTML parsers close `<head>` at the first `<div>`, so the placeholder lands in `<body>` and anything it holds arrives after first paint. Styles belong in a stylesheet.
- Reuse the shared classes in `guide.css` (`.guide-header`, `.guide-title`, `.guide-sub`, `.gsection`, `.starter`, `.gcard`, `.muted`, `.tbl`, `.nextlinks`). Only put page-unique rules in the inline `<style>`.
- Use `.container` (already 1200px via the shared style) — do **not** set a custom `max-width`, or the page width will look inconsistent.
- Use `var(--primary)` / `var(--secondary)` for the header gradient — never a hardcoded brand color, so it matches the theme and the theme switcher.
- Wrap content sections in `.gsection` with an `<h2>` each.
- Keep `<meta name="last-updated">` current. `functions/updated.js` renders it under the title, and it is the date readers use to judge whether the advice is stale.

## 2. What you get automatically (leverage these, don't rebuild them)

Just by including `functions/site.js`, the new page gets:

| Feature | How to use it |
|---------|---------------|
| **Top bar + sidebar nav** | Automatic. Add the page to the sidebar in `functions/nav.js` (see step 3). |
| **Footer** | Automatic. |
| **Quick Jump** | Automatic when the page has 3+ `<h2>` sections. Add `data-jump="Short label"` on an `<h2>` for a shorter pill. |
| **Ask AI assistant** | Automatic; it reads the page for context. |
| **Copy buttons** | Automatic on every `<pre>` code block. |
| **Animated numbers** | `<span data-countup="40" data-suffix="%">40%</span>` |
| **Reveal on scroll** | `<div data-reveal>…</div>` |
| **Journey map** | Add a config in `functions/journey.js` if the guide has staged sections (optional). |

Never copy nav/footer/quick-jump HTML into a page. If you need shared behavior that doesn't exist yet, add a small module in `functions/` (see `functions/README.md`) so **every** page can use it.

## 3. Link the new guide in five places

1. **Sidebar** — add an entry to the right group in `docs/functions/nav.js` (the `GROUPS` array).
2. **Homepage** — add a `.resource-card` (and optionally a `.bento-card`) in `docs/index.html`. Cards are plain links: the inner `<a class="resource-link">` stretches over the whole card, so never add an `onclick`.
3. **README** — add a bullet under "Available Resources" in the repo `README.md`.
4. **Sitemap** — add a `<url>` entry to `docs/sitemap.xml`. CI fails if an indexable page is missing.
5. **RSS** — add an `<item>` to `docs/feed.xml` so subscribers see the new guide.

## 4. Validate before committing

```bash
npx htmlhint "docs/**/*.html"     # HTML lint (CI runs this too)
node scripts/check-links.js       # internal links + sitemap coverage (CI runs this too)
```
Then open `docs/your-new-guide.html` through a local server (`python -m http.server` from `docs/`) and check:
- Header is purple (theme), width matches other guides.
- Quick Jump, sidebar, footer, and Ask AI all appear.
- No horizontal scroll on mobile; text is readable on the header.
- The page is styled the instant it appears (no unstyled flash). If it flashes, a stylesheet link is missing or misplaced.

That's it. Content in, everything else is inherited.
