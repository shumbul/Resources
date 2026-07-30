/* Accessibility helper: any horizontally-scrollable code block must be reachable
 * by keyboard so keyboard-only users can scroll it. Adds tabindex + a role/label
 * to scrollable <pre> blocks. Idempotent. */

export function makeScrollablesFocusable() {
    apply();
    // Re-run once layout is final (fonts/images can change what scrolls).
    if (document.readyState !== 'complete') {
        window.addEventListener('load', apply, { once: true });
    }
    // A light resize pass so rotating a phone keeps scroll regions reachable.
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(apply, 250); });
}

function apply() {
    document.querySelectorAll('pre, .code-block, .code-block-content').forEach((el) => {
        if (el.hasAttribute('data-a11y-scroll')) return;
        markRegion(el, 'Code block, scrollable');
    });
    document.querySelectorAll('.gsection').forEach((el) => {
        if (el.hasAttribute('data-a11y-scroll')) return;
        if (el.scrollWidth > el.clientWidth + 1) {
            const h = el.querySelector('h2');
            markRegion(el, (h ? h.textContent.trim() : 'Section') + ', scrollable');
        }
    });
    document.querySelectorAll('.gsection table, .infosection table').forEach((el) => {
        if (el.hasAttribute('data-a11y-scroll')) return;
        // These tables use overflow-x:auto, so they can scroll at narrow widths.
        // Mark them focusable unconditionally to avoid fragile width measuring.
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', 'Table, scroll horizontally to see more');
        el.setAttribute('data-a11y-scroll', 'true');
    });
}

function markRegion(el, label) {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'region');
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
    el.setAttribute('data-a11y-scroll', 'true');
}
