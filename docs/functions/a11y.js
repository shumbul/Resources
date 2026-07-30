/* Accessibility helper: any horizontally-scrollable code block must be reachable
 * by keyboard so keyboard-only users can scroll it. Adds tabindex + a role/label
 * to scrollable <pre> blocks. Idempotent. */

export function makeScrollablesFocusable() {
    document.querySelectorAll('pre, .code-block, .code-block-content').forEach((el) => {
        if (el.hasAttribute('data-a11y-scroll')) return;
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'region');
        if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Code block, scrollable');
        el.setAttribute('data-a11y-scroll', 'true');
    });
}
