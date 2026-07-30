/* Quick Jump: an auto-generated "on this page" section navigator.
 * Scans the main content for section headings (h2), gives them ids if missing,
 * and renders a compact card of pill links that smooth-scroll to each section
 * and highlight the one you're currently reading.
 *
 * Reusable by design: every content page gets it for free. A heading can supply
 * a short label with  data-jump="Short label"  (falls back to the heading text).
 * Skipped on the roadmaps (their journey map already serves as the overview) and
 * on pages with too few sections.
 */

const CSS = `
.quick-jump{margin:0 0 2rem;padding:1rem 1.25rem;border:1px solid var(--border,#e5e7eb);
    border-radius:var(--radius,16px);background:var(--bg-secondary,#f7f8fc);}
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
    if (document.querySelector('.quick-jump')) return;
    // Roadmaps already have the journey map as their overview.
    if (document.querySelector('.journey')) return;

    const container = document.querySelector('main') || document.querySelector('.main') || document.querySelector('.container');
    if (!container) return;

    const headings = collectHeadings(container);
    if (headings.length < MIN_SECTIONS) return;

    injectStyle('fn-quickjump-css', CSS);

    const items = headings.map((h, i) => {
        if (!h.id) h.id = slugify(h.textContent) || ('section-' + i);
        return { id: h.id, label: (h.getAttribute('data-jump') || cleanLabel(h.textContent)) };
    });

    const nav = document.createElement('nav');
    nav.className = 'quick-jump';
    nav.setAttribute('aria-label', 'Quick jump to section');
    nav.innerHTML =
        `<div class="quick-jump__label">⚡ Quick jump</div>` +
        `<div class="quick-jump__links">` +
        items.map((it) => `<a href="#${it.id}">${it.label}</a>`).join('') +
        `</div>`;

    // Place it at the start of the content, always BELOW the page header.
    // - Pages with <main>: top of main (header sits outside main).
    // - Pages without <main> (header lives inside the same container): right
    //   after the header so it never appears above the title.
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

    wireSmoothScroll(nav);
    wireActiveHighlight(nav, headings);
}

function collectHeadings(container) {
    return Array.from(container.querySelectorAll('h2')).filter((h) => {
        if (h.closest('.journey, .quick-jump, .fn-progress')) return false;
        return h.textContent.trim().length > 0;
    });
}

function cleanLabel(text) {
    // Trim to a short, pill-friendly label.
    let t = text.replace(/\s+/g, ' ').trim();
    // Drop trailing parenthetical asides, e.g. "(use it every time)".
    t = t.replace(/\s*\([^)]*\)\s*$/, '');
    if (t.length > 26) t = t.slice(0, 24).trim() + '…';
    return t;
}

function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
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
    if (!('IntersectionObserver' in window)) return;
    const linkFor = (id) => nav.querySelector(`a[href="#${id}"]`);
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                nav.querySelectorAll('a.active').forEach((a) => a.classList.remove('active'));
                const link = linkFor(entry.target.id);
                if (link) link.classList.add('active');
            }
        });
    }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });
    headings.forEach((h) => io.observe(h));
}

function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
}
