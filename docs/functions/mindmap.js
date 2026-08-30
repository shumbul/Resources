/* Mind map renderer.
 *
 * The origin of this is a hand-built infographic (shumbul-portfolio-mindmap.html),
 * which looked great and had two problems that stopped it being a web page:
 *
 *   1. It was built at poster width. At 390px it overflowed by 705px and had
 *      no media queries at all, so on a phone it was unusable. Most readers
 *      of this site are on phones.
 *   2. It was 27KB of hand-written markup for a single map. Ten maps would
 *      have meant ten near-identical copies, and every site-wide change made
 *      ten times.
 *
 * So the layout lives here, once, and each map is just data. Adding a map is
 * about sixty lines in mindmaps.js, not eight hundred lines of HTML.
 *
 * Layout, and why it changes shape
 * --------------------------------
 * Wide screens get the poster: a spine down the left, branches fanning out,
 * each branch's nodes in a row. That is the version worth screenshotting and
 * posting.
 *
 * Narrow screens get something genuinely different rather than the same thing
 * shrunk. Branches become collapsible sections and nodes stack. Squeezing six
 * columns into 390px is how you end up with the 8.5px text the original had.
 * A phone reader wants to work through one branch at a time anyway.
 *
 * The connector curves are decorative and drawn with CSS, not SVG, so there
 * is no viewBox to keep in sync with a layout that reflows.
 */

const TAGS = {
    must: { label: 'MUST', title: 'Non-negotiable' },
    edge: { label: 'EDGE', title: 'Makes you stand out' },
};

function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function nodeHtml(n, tone) {
    const tag = n.tag && TAGS[n.tag] ? TAGS[n.tag] : null;
    return '<li class="mm-node">'
        + '<div class="mm-node__top">'
        +   '<span class="mm-ic mm-ic--' + esc(tone || 'slate') + '" aria-hidden="true">'
        +     esc(n.icon || '') + '</span>'
        +   (tag ? '<span class="mm-tag mm-tag--' + esc(n.tag) + '" title="'
                + esc(tag.title) + '">' + tag.label + '</span>' : '')
        + '</div>'
        + '<b class="mm-node__label">' + esc(n.label) + '</b>'
        + (n.sub ? '<span class="mm-node__sub">' + esc(n.sub) + '</span>' : '')
        + '</li>';
}

/* Each branch can point at a guide. This is the whole reason the maps are on
 * this site rather than on Instagram: the map tells you what to do, the link
 * tells you how. A branch without one renders nothing here rather than a
 * dead-end "coming soon". */
function branchLinkHtml(b) {
    if (!b.href) return '';
    return '<a class="mm-branch__link" href="./' + esc(b.href) + '">'
        + esc(b.linkLabel || 'Read the guide')
        + ' <span aria-hidden="true">&#8594;</span></a>';
}

function branchHtml(b, i) {
    const id = 'mmb-' + i;
    return '<section class="mm-branch" data-tone="' + esc(b.tone || 'blue') + '">'
        // The heading is a real <button> on mobile so it is focusable and
        // announces its expanded state. On desktop CSS reverts it to a plain
        // label and the panel is always open.
        + '<h3 class="mm-branch__h">'
        +   '<button type="button" class="mm-branch__btn" aria-expanded="false"'
        +     ' aria-controls="' + id + '">'
        +     '<span class="mm-branch__ic" aria-hidden="true">' + esc(b.icon || '') + '</span>'
        +     '<span class="mm-branch__title">' + esc(b.title) + '</span>'
        +     '<span class="mm-branch__n">' + b.nodes.length + '</span>'
        +     '<span class="mm-branch__chev" aria-hidden="true"></span>'
        +   '</button>'
        + '</h3>'
        + '<div class="mm-branch__panel" id="' + id + '">'
        +   '<ul class="mm-nodes">'
        +     b.nodes.map((n) => nodeHtml(n, b.tone)).join('')
        +   '</ul>'
        +   branchLinkHtml(b)
        + '</div>'
        + '</section>';
}

function legendHtml(map) {
    const used = new Set();
    map.branches.forEach((b) => b.nodes.forEach((n) => { if (n.tag) used.add(n.tag); }));
    if (!used.size) return '';
    return '<div class="mm-legend">'
        + [...used].map((k) =>
            '<span class="mm-legend__item"><span class="mm-tag mm-tag--' + k + '">'
            + TAGS[k].label + '</span>' + esc(TAGS[k].title) + '</span>').join('')
        + '</div>';
}

function relatedHtml(map) {
    if (!map.related || !map.related.length) return '';
    return '<div class="mm-related">'
        + '<h3>Where to go from here</h3>'
        + '<div class="mm-related__links">'
        + map.related.map((r) =>
            '<a href="./' + esc(r.href) + '">'
            + (r.icon ? '<span aria-hidden="true">' + esc(r.icon) + '</span> ' : '')
            + esc(r.label) + '</a>').join('')
        + '</div></div>';
}

export function renderMindmap(host, map) {
    const total = map.branches.reduce((n, b) => n + b.nodes.length, 0);

    host.classList.add('mm');
    host.innerHTML =
        '<div class="mm-hd">'
        +   '<div class="mm-spine">'
        +     '<span class="mm-spine__kicker">' + esc(map.kicker || 'Mind map') + '</span>'
        +     '<span class="mm-spine__count">' + map.branches.length + ' branches</span>'
        +     '<span class="mm-spine__count">' + total + ' things to cover</span>'
        +   '</div>'
        +   legendHtml(map)
        +   '<div class="mm-tools">'
        +     '<button type="button" class="mm-tool" data-mm="expand">Expand all</button>'
        +     '<button type="button" class="mm-tool" data-mm="collapse">Collapse all</button>'
        +   '</div>'
        + '</div>'
        + '<div class="mm-body">' + map.branches.map(branchHtml).join('') + '</div>'
        + relatedHtml(map);

    wire(host);
    return host;
}

/* Accordion behaviour is only meaningful in the narrow layout. Rather than
 * duplicating the breakpoint in JS, where it would drift from the CSS, ask
 * the browser what it actually did: .mm-body reports a CSS custom property
 * that only the narrow media query sets. */
function isStacked(host) {
    return getComputedStyle(host.querySelector('.mm-body'))
        .getPropertyValue('--mm-stacked').trim() === '1';
}

function setOpen(branch, open) {
    const btn = branch.querySelector('.mm-branch__btn');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    branch.classList.toggle('is-open', open);
}

function wire(host) {
    const branches = [...host.querySelectorAll('.mm-branch')];

    branches.forEach((b, i) => {
        const btn = b.querySelector('.mm-branch__btn');
        // The first branch starts open on mobile so the page never looks like
        // a wall of closed bars with nothing to read.
        setOpen(b, i === 0);
        btn.addEventListener('click', () => {
            if (!isStacked(host)) return;
            setOpen(b, btn.getAttribute('aria-expanded') !== 'true');
        });
    });

    host.querySelectorAll('[data-mm]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const open = btn.dataset.mm === 'expand';
            branches.forEach((b) => setOpen(b, open));
        });
    });

    /* On a wide screen every panel is open via CSS, so aria-expanded must say
     * so too or a screen reader is told the opposite of what is rendered.
     * Re-sync whenever the layout crosses the breakpoint. */
    const sync = () => {
        if (isStacked(host)) return;
        branches.forEach((b) => {
            b.querySelector('.mm-branch__btn').setAttribute('aria-expanded', 'true');
        });
    };
    sync();
    if (window.matchMedia) {
        const mq = window.matchMedia('(max-width: 900px)');
        const onChange = () => {
            if (mq.matches) branches.forEach((b, i) => setOpen(b, i === 0));
            else sync();
        };
        mq.addEventListener ? mq.addEventListener('change', onChange)
                            : mq.addListener(onChange);
    }
}

/* Page hook: <div data-mindmap="slug"></div> */
export function initMindmaps() {
    const hosts = document.querySelectorAll('[data-mindmap]');
    if (!hosts.length) return;

    import('./mindmaps.js?v=20260830d').then(({ MAPS }) => {
        hosts.forEach((host) => {
            const map = MAPS[host.dataset.mindmap];
            if (!map) {
                console.warn('[mindmap] no data for "' + host.dataset.mindmap + '"');
                return;
            }
            renderMindmap(host, map);
        });
    }).catch((err) => console.warn('[mindmap] failed to load data:', err));
}
