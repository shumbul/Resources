# Shared functions

Reusable behavior for every page lives here. Instead of copy-pasting nav, footer, copy buttons, or trackers into each HTML file, every page includes ONE line:

```html
<script type="module" src="./functions/site.js"></script>
```

`site.js` composes the functions below. Each runs inside a try/catch, so one failing feature never breaks the page.

| File | Function | What it does |
|------|----------|--------------|
| `meta.js` | `ensureMeta()` | Injects favicon + charset if the page lacks them |
| `nav.js` | `renderNav()` | Sticky top navigation across all guides, highlights the current page |
| `footer.js` | `renderFooter()` | Slim shared footer, injected ONLY when a page has no footer of its own |
| `copyButtons.js` | `initCopyButtons()` | Adds a Copy button to any `<pre>` block that doesn't already have one |
| `progress.js` | `initProgress()` | Auto-detects roadmap weeks/months, adds a saved progress tracker |
| `assistant.js` | `initAssistant()` | The floating "Ask AI" helper (on-device model, shared proxy, or own key) |

## Design rules
- **Idempotent:** every function checks before acting, so double-loads and pages that already have the feature are safe.
- **No dependencies:** plain ES modules, no build step, no libraries.
- **Fast:** CSS is injected once per feature; the only heavy thing (the AI model) loads lazily, on demand.

## Adding a new shared feature
1. Create `functions/myFeature.js` exporting a single `initMyFeature()`.
2. Make it idempotent (bail if it already ran or the target isn't present).
3. Add it to the `STEPS` array in `site.js`.
That's it, it now runs on every page.
