/* "Updated on" stamp.
 *
 * Career and AI advice goes stale fast, so every guide declares when it was
 * last touched:
 *
 *   <meta name="last-updated" content="2026-08-13">
 *
 * This renders that date into the page header as a real <time> element, which
 * builds reader trust and gives search engines a machine-readable signal
 * (the same date is in each page's Article JSON-LD).
 */

const HEADER_SELECTOR = '.guide-header, .git-header, .header, .hero, .ai-header';
const INNER_SELECTOR = '.header-content, .container, .hero-content';

export function renderUpdated() {
    if (document.querySelector('.guide-updated')) return;

    const meta = document.querySelector('meta[name="last-updated"]');
    const raw = meta && meta.content && meta.content.trim();
    if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return;

    const date = new Date(raw + 'T00:00:00Z');
    if (Number.isNaN(date.getTime())) return;

    const header = document.querySelector(HEADER_SELECTOR);
    if (!header) return;
    const inner = header.querySelector(INNER_SELECTOR) || header;

    const stamp = document.createElement('p');
    stamp.className = 'guide-updated';
    stamp.innerHTML = '<span aria-hidden="true">🕒</span> Updated on <time datetime="' + raw + '">'
        + date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
        + '</time>';
    inner.appendChild(stamp);
}
