/* Shared header extras.
 *
 * Adds a "Back to Resources" link to the top of every page header, matching the
 * roadmap treatment, so navigation is consistent everywhere. The styling lives
 * once in theme-variables.css (.back-link / .back-link-row); this just injects
 * the markup where a header exists.
 *
 * Rules:
 * - Skip the home page (index) since that IS the resources list.
 * - Never add a second one: pages that already ship a .back-link are left alone.
 * - Insert into the header's inner content wrapper so it sits above the title.
 */

const HEADER_SELECTOR =
    '.guide-header, .git-header, .header, .hero, .ai-header, .demo-header, header';
const INNER_SELECTOR = '.header-content, .container, .hero-content';

function isHome() {
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return file === '' || file === 'index.html';
}

export function renderBackLink() {
    if (isHome()) return;

    const header = document.querySelector(HEADER_SELECTOR);
    if (!header) return;

    // Respect a back link the page already provides (e.g. the roadmaps).
    if (header.querySelector('.back-link, .back-nav, [data-component="back-nav"]')) return;

    const inner = header.querySelector(INNER_SELECTOR) || header;

    const row = document.createElement('div');
    row.className = 'back-link-row';

    const link = document.createElement('a');
    link.className = 'back-link';
    link.href = './index.html';
    link.innerHTML = '<span aria-hidden="true">&larr;</span> Back to Resources';

    row.appendChild(link);
    inner.insertBefore(row, inner.firstChild);
}
