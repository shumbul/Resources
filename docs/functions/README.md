# Shared functions (`docs/functions/`)

All shared behavior lives here so pages never copy-paste it. Every page includes **one** module:

```html
<script type="module" src="./functions/site.js"></script>
```

`site.js` composes the functions below. Each runs inside its own try/catch, so one failing feature never breaks the page. Every function is **idempotent** (safe to run once) and **auto-detecting** (it no-ops on pages it doesn't apply to).

| File | Function | What it does | Applies to |
|------|----------|--------------|------------|
| `meta.js` | `ensureMeta()` | Injects favicon + charset if missing | all |
| `nav.js` | `renderNav()` | Top bar (Home/About/Contact) + left sidebar of guides with live search + collapse | all |
| `footer.js` | `renderFooter()` | Shared footer, only if the page has none | all |
| `copyButtons.js` | `initCopyButtons()` | Adds a Copy button to any `<pre>` lacking one | pages with code |
| `progress.js` | `initProgress()` | Sticky "mark done" progress tracker | roadmaps + DSA/System Design |
| `journey.js` | `initJourney()` | Animated highway overview with moving dots + a walking/waving traveler | roadmaps + DSA/System Design |
| `quickjump.js` | `initQuickJump()` | "On this page" section navigator, auto-built from `<h2>`s | any content page with 3+ sections |
| `assistant.js` | `initAssistant()` | Floating "Ask AI" helper (on-device / proxy / own key) | all |
| `a11y.js` | `makeScrollablesFocusable()` | Makes scrollable code blocks keyboard-focusable | all |
| `motion.js` | `initMotion()` | `data-reveal` scroll-in + `data-countup` number animations | opt-in via attributes |
| `typewriter.js` | `initTypewriter()` | Animated cycling placeholder for search inputs | opt-in via `data-typewriter` |

## Opt-in attributes (no JS needed)
- **Count-up number:** `<span data-countup="5" data-suffix="x">5x</span>`
- **Reveal on scroll:** `<div data-reveal data-reveal-delay="100">…</div>`
- **Typewriter search:** `<input data-typewriter='["Term A","Term B"]' data-typewriter-prefix="Search ">`
- **Quick-jump short label:** `<h2 data-jump="Short label">Full heading text</h2>`

## Design rules
- **No dependencies, no build step.** Plain ES modules.
- **Config-driven / polymorphic.** e.g. `journey.js` and `progress.js` add a new roadmap/guide by adding one descriptor object, not new code.
- **CSS injected once** per feature; the only heavy thing (the AI model) loads lazily on demand.
- **Respects `prefers-reduced-motion`** everywhere there is animation.

## Adding a new shared feature
1. Create `functions/myFeature.js` exporting a single `initMyFeature()`.
2. Make it idempotent (bail if it already ran or its target isn't present).
3. Add it to the `STEPS` array in `site.js`.
That's it, it now runs on every page.
