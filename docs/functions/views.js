/* Page view counter.
 *
 * Why GoatCounter and not something else
 * --------------------------------------
 * The site is static, on GitHub Pages, with no backend, so the count has to
 * come from somewhere else. The options were:
 *
 *   localStorage      Not views. It counts one browser's visits and resets on
 *                     a cache clear. It would be a made-up number.
 *   a free counter API  No account needed, but the endpoint is public and
 *                     unauthenticated, so anyone can inflate it with a loop.
 *   Google Analytics  Cookies, a consent banner, and it does not expose a
 *                     public count anyway.
 *   GoatCounter       Free for non-commercial use, no cookies, nothing stored
 *                     that identifies a person, so no consent banner needed,
 *                     and it is the only one of these that will hand back a
 *                     public per-page count as JSON.
 *
 * So: GoatCounter counts the visit, and this module separately asks for the
 * total and prints it. Two different endpoints, one script tag.
 *
 * SETUP, one time, about two minutes
 * ----------------------------------
 *   1. Sign up at https://www.goatcounter.com. Pick a code, e.g. "shumbul".
 *   2. Settings -> Tracking -> tick "Allow adding visitor counts on your
 *      website". This is off by default and the count endpoint returns 403
 *      without it.
 *   3. Put the code in SITE below.
 *
 * Until step 3 is done SITE is empty and this module does nothing at all: no
 * request, no element, no layout shift. The site behaves exactly as it does
 * today, so shipping this before the account exists is safe.
 */

const SITE = '';   // <- your GoatCounter code goes here

const ENDPOINT = (code) => 'https://' + code + '.goatcounter.com';

/* GoatCounter keys a page by its path. On GitHub Pages this site lives under
 * /Resources/, and locally it does not, so the same page would otherwise be
 * counted under two different keys and each would show half the real number.
 * Normalising to a leading-slash filename keeps one key per page everywhere. */
function pagePath() {
    let file = (location.pathname.split('/').pop() || '').trim();
    if (!file) file = 'index.html';
    return '/' + file;
}

/* colour: inherit, deliberately. The counter usually lands in the guide
 * header's badge row, which sits on the purple gradient and is white text.
 * Pinning it to --text-secondary put dark slate on purple. Inheriting means
 * the counter is legible wherever it is placed, including a [data-views]
 * slot somewhere light, without this module needing to know the surface. */
const CSS = `
.views {
    display: inline-flex; align-items: baseline; gap: .3rem;
    font: 600 .8rem/1.4 var(--font-sans, inherit);
    color: inherit;
}
.views__n { font-variant-numeric: tabular-nums; font-weight: 700; }
.views__label { font-weight: 500; opacity: .85; }
`;

function inject() {
    if (document.getElementById('fn-views-css')) return;
    const s = document.createElement('style');
    s.id = 'fn-views-css';
    s.textContent = CSS;
    document.head.appendChild(s);
}

/* Count the visit. This is the standard GoatCounter snippet, loaded async so
 * it is never on the critical path, and skipped on localhost so that working
 * on the site does not pollute the numbers. */
function track() {
    if (document.getElementById('gc-count')) return;
    const local = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(location.hostname)
        || location.protocol === 'file:';
    if (local) return;

    const s = document.createElement('script');
    s.id = 'gc-count';
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', ENDPOINT(SITE) + '/count');
    document.body.appendChild(s);
}

/* Read the total back. Deliberately not using goatcounter.visit_count(),
 * which injects a fixed 200x80 branded box that would look pasted on. The
 * .json endpoint returns just the number, so it can be rendered in the site's
 * own type. Responses are cached for up to four hours at their end, so a
 * fresh view will not appear immediately, which is expected. */
async function fetchCount(path) {
    const url = ENDPOINT(SITE) + '/counter' + path + '.json';
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('counter responded ' + res.status);
    const data = await res.json();
    // GoatCounter returns a pre-formatted string using thin spaces as the
    // thousands separator, e.g. "1 090 059". Reformat it for this locale.
    const raw = String(data.count == null ? '' : data.count).replace(/[^\d]/g, '');
    if (!raw) throw new Error('counter returned no number');
    return Number(raw);
}

function render(host, n) {
    const el = document.createElement('span');
    el.className = 'views';
    el.innerHTML = '<span aria-hidden="true">\u{1F440}</span>'
        + '<span class="views__n">' + n.toLocaleString('en-IN') + '</span>'
        + '<span class="views__label">' + (n === 1 ? 'view' : 'views') + '</span>';
    // One announcement for a screen reader instead of three fragments.
    el.setAttribute('aria-label', n.toLocaleString('en-IN')
        + (n === 1 ? ' view' : ' views') + ' on this page');
    host.appendChild(el);
    return el;
}

export function initViews() {
    if (!SITE) return;

    /* Where it goes: a page can opt in explicitly with
     *   <span data-views></span>
     * otherwise it lands in the guide header's badge row, next to "12 prompts"
     * and friends, which is where a reader is already looking for facts about
     * the page. If neither exists, nothing is rendered. */
    let host = document.querySelector('[data-views]');
    let asBadge = false;
    if (!host) {
        host = document.querySelector('.guide-badges, .hero-badges');
        asBadge = !!host;
    }

    track();
    if (!host) return;

    inject();

    /* Nothing is inserted until the number actually arrives. An empty
     * placeholder that later grows would push the badge row and cost layout
     * shift on a page currently measuring CLS 0.000, and a counter is not
     * worth that. If the request fails, the reader simply never learns there
     * was meant to be one. */
    fetchCount(pagePath())
        .then((n) => {
            const el = render(host, n);
            if (asBadge) el.classList.add('guide-badge');
        })
        .catch((err) => console.warn('[views] ' + err.message));
}
