/* Skip link, on every page.
 *
 * Keyboard and screen-reader users land on the injected top bar and sidebar
 * first, which is a long tab journey before the actual content. This puts a
 * "Skip to content" link as the very first focusable element of every page.
 *
 * The link is hidden until focused (see .skip-link in base.css) and is
 * idempotent, so a page that already ships one is left alone.
 */

export function renderSkipLink() {
    if (document.querySelector('.skip-link, [data-skip-link]')) return;

    const target = mainTarget();
    if (!target) return;

    if (!target.id) target.id = 'main-content';
    // A programmatic focus target: without this, some browsers move the
    // viewport but leave keyboard focus behind at the top of the page.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');

    const link = document.createElement('a');
    link.className = 'skip-link';
    link.href = '#' + target.id;
    link.textContent = 'Skip to content';
    link.setAttribute('data-skip-link', 'true');
    link.addEventListener('click', () => {
        // Defer so the hash change lands first, then take focus.
        setTimeout(() => target.focus({ preventScroll: true }), 0);
    });

    document.body.insertBefore(link, document.body.firstChild);
}

function mainTarget() {
    return document.querySelector('main')
        || document.querySelector('[role="main"]')
        || document.querySelector('.container')
        || document.body;
}
