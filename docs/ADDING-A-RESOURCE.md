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
    <!-- Fonts: keep these three lines so text renders instantly (no flash) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap">
    <div data-component="head-common"></div>

    <title>Your Guide Title | Resources by Shumbul Arifa</title>
    <meta name="description" content="One-line description.">

    <style>
        /* Reuse the standard guide classes so widths and cards match every page */
        .guide-header { background: linear-gradient(135deg, var(--primary), var(--secondary)); color:#fff; padding:3.5rem 0; text-align:center; margin-bottom:2.5rem; }
        .guide-title { font-size:2.6rem; font-weight:800; margin-bottom:.6rem; color:#fff; }
        .guide-sub { font-size:1.15rem; color:rgba(255,255,255,.94); max-width:680px; margin:0 auto; }
        .gsection { background:var(--bg-secondary); border:1px solid var(--border); border-radius:16px; padding:1.6rem 1.75rem; margin-bottom:1.75rem; }
        .starter { background:var(--bg-primary); border:1px solid var(--border); border-left:4px solid var(--primary); border-radius:12px; padding:1.1rem 1.3rem; margin-bottom:1.75rem; }
        .muted { color:var(--text-secondary); }
    </style>
</head>
<body>
    <div data-component="theme-switcher"></div>
    <div data-component="back-nav"></div>

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
    <script type="module" src="./functions/site.js?v=20260731"></script>
</body>
</html>
```

> **Cache-busting:** the `?v=20260731` on the `site.js` tag forces browsers to
> re-fetch the shared modules after a deploy. Use the **same version** the other
> pages currently use. When you change any file in `functions/`, bump the version
> in two places: this `?v=` on every page's `site.js` tag, and the matching
> `?v=` on the imports inside `functions/site.js`.

**Rules that keep parity with the rest of the site:**
- Use `.container` (already 1200px via the shared style) — do **not** set a custom `max-width`, or the page width will look inconsistent.
- Use `var(--primary)` / `var(--secondary)` for the header gradient — never a hardcoded brand color, so it matches the theme and the theme switcher.
- Wrap content sections in `.gsection` with an `<h2>` each.

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

## 3. Link the new guide in three places

1. **Sidebar** — add an entry to the right group in `docs/functions/nav.js` (the `GROUPS` array).
2. **Homepage** — add a `.resource-card` (and optionally a `.bento-card`) in `docs/index.html`.
3. **README** — add a bullet under "Available Resources" in the repo `README.md`.

## 4. Validate before committing

```bash
npx htmlhint "docs/**/*.html"     # HTML lint (CI runs this too)
```
Then open `docs/your-new-guide.html` through a local server (`python -m http.server` from `docs/`) and check:
- Header is purple (theme), width matches other guides.
- Quick Jump, sidebar, footer, and Ask AI all appear.
- No horizontal scroll on mobile; text is readable on the header.

That's it. Content in, everything else is inherited.

## Adding a new page

After creating a new HTML page in `docs/`, run:

```bash
python build-seo.py
```

This writes canonical, Open Graph, Twitter card and JSON-LD tags directly into
the page source. Social crawlers (LinkedIn, WhatsApp, Slack, X) do not execute
JavaScript, so these tags cannot be injected at runtime and must live in the
HTML itself.

CI runs `python build-seo.py --check` and fails if any page is out of date.

If you set a page-specific `og:image`, the build script preserves it and only
converts a relative path to an absolute URL.
