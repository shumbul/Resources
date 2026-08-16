/* Quick Jump: the "on this page" section navigator.
 *
 * The markup is pre-rendered into every eligible page by build-quickjump.py
 * and styled by theme-variables.css, so it is part of the first paint. This
 * module only wires up the behaviour: smooth scrolling and highlighting the
 * section you are currently reading.
 *
 * Building it here instead used to insert roughly 125px at the top of <main>
 * after the page had already painted, which pushed everything down. On a
 * phone viewport that single insertion measured 0.40 of Cumulative Layout
 * Shift, the largest shift anywhere on the site.
 *
 * The runtime builder is kept as a fallback for any page the build script has
 * not covered, so nothing silently loses its navigator.
 *
 * A heading can supply a short pill label with  data-jump="Short label"
 * (it falls back to the heading text). Skipped on the roadmaps, where the
 * journey map already serves as the overview, and on pages with too few
 * sections.
 */

const FALLBACK_CSS = `
.quick-jump{margin:0 0 2rem;padding:1rem 1.25rem;border:1px solid var(--border,#e5e7eb);
    border-radius:var(--radius,16px);background:var(--bg-secondary,#f7f8fc);box-sizing:border-box;}
.quick-jump__label{font:800 .72rem/1 var(--font-sans,inherit);letter-spacing:.09em;text-transform:uppercase;
    color:var(--text-secondary,#666);margin-bottom:.7rem;display:flex;align-items:center;gap:.4rem;}
.quick-jump__links{display:flex;flex-wrap:wrap;gap:.5rem;}
.quick-jump__links a{text-decoration:none;font:600 .85rem/1 var(--font-sans,inherit);
    padding:.45rem .8rem;border-radius:999px;background:var(--bg-primary,#fff);color:var(--text-secondary,#555);
    border:1px solid var(--border,#e5e7eb);transition:all .16s ease;}
.quick-jump__links a:hover{color:var(--primary,#8b5cf6);border-color:var(--primary,#8b5cf6);}
.quick-jump__links a.active{color:#fff;background:linear-gradient(135deg,var(--primary),var(--secondary));border-color:transparent;}
`;

const MIN_SECTIONS = 3;

export function initQuickJump() {
    const existing = document.querySelector('.quick-jump');
    if (existing) {
        // Pre-rendered by the build. If a journey map also ended up on the
        // page, that map is the better overview, so drop the duplicate.
        if (document.querySelector('.journey')) {
            existing.remove();
            return;
        }
        activate(existing);
        return;
    }

    if (document.querySelector('.journey')) return;

    const nav = buildNav();
    if (nav) activate(nav);
}

/* ------------------------------------------------------- behaviour wiring */

function activate(nav) {
    const headings = Array.from(nav.querySelectorAll('a'))
        .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
        .filter(Boolean);
    wireSmoothScroll(nav);
    wireActiveHighlight(nav, headings);
}

function wireSmoothScroll(nav) {
    nav.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href').slice(1);
            const target = document.getElementById(id);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', '#' + id);
        });
    });
}

function wireActiveHighlight(nav, headings) {
    if (!('IntersectionObserver' in window) || !headings.length) return;
    const linkFor = (id) => nav.querySelector(`a[href="#${CSS.escape(id)}"]`);
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            nav.querySelectorAll('a.active').forEach((a) => a.classList.remove('active'));
            const link = linkFor(entry.target.id);
            if (link) link.classList.add('active');
        });
    }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });
    headings.forEach((h) => io.observe(h));
}

/* ------------------------------------ fallback builder for uncovered pages */

function buildNav() {
    const container = document.querySelector('main')
        || document.querySelector('.main')
        || document.querySelector('.container');
    if (!container) return null;

    const headings = collectHeadings(container);
    if (headings.length < MIN_SECTIONS) return null;

    injectStyle('fn-quickjump-css', FALLBACK_CSS);

    const items = headings.map((h, i) => {
        if (!h.id) h.id = slugify(h.textContent) || ('section-' + i);
        return { id: h.id, label: h.getAttribute('data-jump') || cleanLabel(h.textContent) };
    });

    const nav = document.createElement('nav');
    nav.className = 'quick-jump';
    nav.setAttribute('aria-label', 'Quick jump to section');
    nav.innerHTML =
        '<div class="quick-jump__label">\u26a1 Quick jump</div>' +
        '<div class="quick-jump__links">' +
        items.map((it) => `<a href="#${it.id}">${escapeHtml(it.label)}</a>`).join('') +
        '</div>';

    // Always below the page header: top of <main> where one exists, otherwise
    // straight after the header so it never lands above the title.
    const main = document.querySelector('main');
    if (main) {
        main.insertBefore(nav, main.firstChild);
    } else {
        const header = document.querySelector('.header, header, .hero');
        if (header && header.parentNode) {
            header.parentNode.insertBefore(nav, header.nextSibling);
        } else {
            container.insertBefore(nav, container.firstChild);
        }
    }
    return nav;
}

function collectHeadings(container) {
    return Array.from(container.querySelectorAll('h2')).filter((h) => {
        if (h.closest('.journey, .quick-jump, .fn-progress')) return false;
        return h.textContent.trim().length > 0;
    });
}

function cleanLabel(text) {
    let t = text.replace(/\s+/g, ' ').trim();
    t = t.replace(/\s*\([^)]*\)\s*$/, '');
    if (t.length > 26) t = t.slice(0, 24).trim() + '\u2026';
    return t;
}

function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
}
