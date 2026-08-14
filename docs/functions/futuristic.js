/**
 * futuristic.js
 *
 * A 2026-era visual layer, applied opt-in via `data-futuristic` on <body>.
 * Everything here is progressive enhancement: if the module fails to load or
 * the browser is old, the page still renders exactly as before.
 *
 * Techniques used (all native, no libraries):
 *   - Animated mesh-gradient hero with drifting orbs
 *   - Fluid typography via clamp()
 *   - Scroll-driven reveals (native animation-timeline, JS fallback)
 *   - Cursor-following spotlight on cards
 *   - Magnetic buttons
 *   - Glass nav that solidifies on scroll
 *   - Aurora ribbon behind the bento grid
 *
 * Accessibility: every motion effect is disabled under
 * prefers-reduced-motion, and nothing is conveyed by motion alone.
 */


/* The stylesheet for this module now lives at the end of
 * theme-variables.css, so it is part of the first paint. See the
 * "Futuristic visual layer" section there. Keep the two in sync:
 * class names used below must exist in that stylesheet. */

const REDUCE = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Build the floating bubble layer.
 * Sizes, positions, durations and delays are randomised per load so the
 * motion never looks like a repeating loop. Negative delays mean bubbles are
 * already mid-flight on first paint rather than all launching together.
 */
function makeBubbles(compact) {
    const wrap = document.createElement('div');
    wrap.className = 'fx-bubbles';
    wrap.setAttribute('aria-hidden', 'true');
    if (REDUCE()) return wrap;          // no motion, no bubbles

    const count = compact ? 9 : 14;
    for (let i = 0; i < count; i++) {
        const b = document.createElement('span');
        b.className = 'fx-bubble';
        const size = compact
            ? 8 + Math.random() * 26
            : 10 + Math.random() * 42;
        const dur = 14 + Math.random() * 16;
        b.style.width = size + 'px';
        b.style.height = size + 'px';
        b.style.left = (Math.random() * 98) + '%';
        b.style.animationDuration = dur + 's';
        b.style.animationDelay = (-Math.random() * dur) + 's';
        wrap.appendChild(b);
    }
    return wrap;
}

/* ---------- hero decoration ---------- */
function decorateHero() {
    const header = document.querySelector('header');
    if (!header || header.querySelector('.fx-orb')) return;

    // Guide headers are much shorter than the home hero, so scale the
    // decoration down or the orbs simply swamp the text.
    const compact = header.getBoundingClientRect().height < 320;
    if (compact) header.classList.add('fx-compact');

    const frag = document.createDocumentFragment();
    ['o1', 'o2', 'o3', 'o4'].forEach(c => {
        const d = document.createElement('div');
        d.className = 'fx-orb ' + c;
        d.setAttribute('aria-hidden', 'true');
        frag.appendChild(d);
    });
    const grid = document.createElement('div');
    grid.className = 'fx-mesh-grid';
    grid.setAttribute('aria-hidden', 'true');
    const grain = document.createElement('div');
    grain.className = 'fx-grain';
    grain.setAttribute('aria-hidden', 'true');
    frag.appendChild(grid);
    frag.appendChild(grain);
    frag.appendChild(makeBubbles(compact));
    header.insertBefore(frag, header.firstChild);

    // staged entrance for hero content
    const h1 = header.querySelector('h1');
    const sub = header.querySelector('.hero-subtitle');
    const cta = header.querySelector('.cta-button');
    [[h1, 'fx-d1'], [sub, 'fx-d2'], [cta, 'fx-d3']].forEach(([el, d]) => {
        if (!el) return;
        el.classList.add('fx-in', d);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
        header.querySelectorAll('.fx-in').forEach(e => e.classList.add('fx-shown'));
    }));
}

/* ---------- hero stats ---------- */
function addStats() {
    // Only meaningful on the home page. Guide headers have their own badges.
    const host = document.querySelector('header .hero-content');
    if (!host || host.querySelector('.fx-stats')) return;
    if (!document.querySelector('.resources-grid')) return;

    const guides = document.querySelectorAll('.resource-card').length || 30;
    // Each stat must read as a complete claim on its own. A "0 / Signups"
    // item was tried here and read as "nobody signed up" rather than "no
    // signup is required", so the point is made in the copy instead.
    const stats = [
        [guides, '+', 'Guides'],
        [100, '%', 'Free'],
    ];

    const wrap = document.createElement('div');
    wrap.className = 'fx-stats fx-in fx-d4';
    wrap.innerHTML = stats.map(([n, suf, label]) =>
        `<div class="fx-stat"><b data-to="${n}" data-suffix="${suf}">0${suf}</b>` +
        `<span>${label}</span></div>`).join('');
    host.appendChild(wrap);

    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('fx-shown')));

    if (REDUCE()) {
        wrap.querySelectorAll('b').forEach(b => {
            b.textContent = b.dataset.to + (b.dataset.suffix || '');
        });
        return;
    }
    // count up
    wrap.querySelectorAll('b').forEach((b, i) => {
        const to = +b.dataset.to, suf = b.dataset.suffix || '';
        const dur = 1100, start = performance.now() + 350 + i * 90;
        function tick(now) {
            if (now < start) { requestAnimationFrame(tick); return; }
            const k = Math.min(1, (now - start) / dur);
            const e = 1 - Math.pow(1 - k, 3);
            b.textContent = Math.round(to * e) + suf;
            if (k < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });
}

/* ---------- aurora behind the page ---------- */
function addAurora() {
    if (document.querySelector('.fx-aurora')) return;
    const a = document.createElement('div');
    a.className = 'fx-aurora';
    a.setAttribute('aria-hidden', 'true');
    a.innerHTML = '<i></i><i></i><i></i>';
    document.body.appendChild(a);
}

/* ---------- cursor spotlight ---------- */
function spotlight() {
    if (REDUCE()) return;
    if (!window.matchMedia('(hover: hover)').matches) return;   // skip touch

    const sel = '.resource-card, .bento-card, .cta-button';
    let raf = null, pending = null;

    document.addEventListener('pointermove', (e) => {
        const card = e.target.closest(sel);
        if (!card) return;
        pending = [card, e];
        if (raf) return;
        raf = requestAnimationFrame(() => {
            raf = null;
            const [c, ev] = pending;
            const r = c.getBoundingClientRect();
            c.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
            c.style.setProperty('--my', (ev.clientY - r.top) + 'px');
        });
    }, { passive: true });
}

/* ---------- magnetic CTA ---------- */
function magnetic() {
    if (REDUCE()) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    document.querySelectorAll('.cta-button').forEach(btn => {
        btn.addEventListener('pointermove', (e) => {
            const r = btn.getBoundingClientRect();
            const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
            const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
            btn.style.transform = `translate(${dx * 7}px, ${dy * 7}px)`;
        });
        btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
}

/* ---------- scroll reveal ---------- */
function reveals() {
    const targets = document.querySelectorAll(
        '.resource-card, .bento-card, .nav-section, .search-section');
    targets.forEach(t => t.classList.add('fx-reveal'));

    // native scroll timeline handles it where supported
    if (CSS.supports && CSS.supports('animation-timeline: view()')) return;
    if (REDUCE()) { targets.forEach(t => t.classList.add('fx-shown')); return; }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
            if (en.isIntersecting) {
                en.target.classList.add('fx-shown');
                io.unobserve(en.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(t => io.observe(t));
}

/* ---------- glass nav ---------- */
function glassNav() {
    const bar = document.querySelector('.site-topbar');
    if (!bar) return;
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            bar.classList.toggle('fx-solid', window.scrollY > 24);
            ticking = false;
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

export function initFuturistic() {
    // opt-in: only pages that declare it
    if (!document.body.hasAttribute('data-futuristic')) return;

    decorateHero();
    addStats();
    addAurora();
    reveals();
    spotlight();
    magnetic();
    // nav is injected by nav.js, so wait a tick for it
    setTimeout(glassNav, 60);
}
