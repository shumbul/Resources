/**
 * instant.js
 *
 * Removes the ~660ms of blank screen between page clicks.
 *
 * Two native platform features, no libraries, no build step:
 *
 *  1. Speculation Rules API
 *     The browser prerenders a likely-next page in a hidden tab. When the
 *     click happens the document is already parsed, styled and painted, so
 *     navigation is effectively instant instead of a fresh round trip.
 *
 *  2. Cross-document View Transitions
 *     Replaces the white flash between pages with a short cross-fade, and
 *     holds the nav and footer still so only the content changes.
 *
 * Both degrade silently. Unsupported browsers get a plain prefetch instead,
 * which still removes the network wait even though it does not pre-paint.
 *
 * Cost control:
 *   - 'moderate' eagerness only speculates on hover or pointerdown, never on
 *     every visible link, so we do not download the whole site speculatively
 *   - Skipped entirely on Save-Data and 2g connections
 *   - The browser enforces its own concurrency limits and abandons
 *     speculation under memory pressure
 */

const CSS = `
/* ---- cross-document view transitions ---- */
@view-transition { navigation: auto; }

::view-transition-old(root) { animation: instOut .16s cubic-bezier(.4,0,1,1) both; }
::view-transition-new(root) { animation: instIn  .22s cubic-bezier(0,0,.2,1) both; }
@keyframes instOut { to   { opacity: 0; } }
@keyframes instIn  { from { opacity: 0; } }

/* Chrome should stay put rather than cross-fade with the content. */
.site-topbar  { view-transition-name: inst-topbar; }
.site-sidebar { view-transition-name: inst-sidebar; }
.mot-strip    { view-transition-name: inst-ticker; }
::view-transition-group(inst-topbar),
::view-transition-group(inst-sidebar),
::view-transition-group(inst-ticker) { animation-duration: .01s; }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) { animation: none !important; }
}
`;

/** Same-origin internal page link that is safe to speculate. */
function isInternalPage(a) {
    if (!a || !a.getAttribute) return false;
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:')) return false;
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;
    let u;
    try { u = new URL(a.href, location.href); } catch { return false; }
    if (u.origin !== location.origin) return false;
    if (u.pathname === location.pathname) return false;
    return /\.html?$/.test(u.pathname) || u.pathname.endsWith('/');
}

/** Do not burn someone's data plan. */
function shouldSkip() {
    const c = navigator.connection;
    if (!c) return false;
    if (c.saveData) return true;
    return /(^|-)2g$/.test(c.effectiveType || '');
}

function addSpeculationRules() {
    if (!HTMLScriptElement.supports ||
        !HTMLScriptElement.supports('speculationrules')) return false;

    // directory this site lives in, e.g. /Resources/
    const base = location.pathname.replace(/[^/]*$/, '');

    const rules = {
        prerender: [{
            where: {
                and: [
                    { href_matches: base + '*.html' },
                    { not: { href_matches: base + '404.html' } }
                ]
            },
            eagerness: 'moderate'
        }]
    };

    const s = document.createElement('script');
    s.type = 'speculationrules';
    s.textContent = JSON.stringify(rules);
    document.head.appendChild(s);
    return true;
}

/** Fallback: warm the HTTP cache when the pointer settles on a link. */
function prefetchFallback() {
    const done = new Set();
    let timer = null;

    function warm(href) {
        if (done.has(href) || done.size >= 10) return;
        done.add(href);
        const l = document.createElement('link');
        l.rel = 'prefetch';
        l.as = 'document';
        l.href = href;
        document.head.appendChild(l);
    }

    document.addEventListener('pointerover', (e) => {
        const a = e.target.closest && e.target.closest('a[href]');
        if (!isInternalPage(a)) return;
        clearTimeout(timer);
        timer = setTimeout(() => warm(a.href), 100);
    }, { passive: true });

    document.addEventListener('pointerout', () => clearTimeout(timer), { passive: true });

    document.addEventListener('touchstart', (e) => {
        const a = e.target.closest && e.target.closest('a[href]');
        if (isInternalPage(a)) warm(a.href);
    }, { passive: true });
}

export function initInstant() {
    const style = document.createElement('style');
    style.id = 'instant-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    if (shouldSkip()) return;

    if (!addSpeculationRules()) prefetchFallback();
}
