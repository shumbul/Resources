/* Lightweight, dependency-free motion helpers. All respect prefers-reduced-motion.
 *
 * 1. Scroll-reveal: elements with [data-reveal] fade/slide in when they enter view.
 * 2. Count-up: elements with [data-countup] animate their number when first seen.
 *
 * Both use IntersectionObserver, so they cost nothing until an element is near
 * the viewport, and never block rendering.
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CSS = `
[data-reveal]{opacity:0;transform:translateY(16px);transition:opacity .6s ease, transform .6s ease;}
[data-reveal].revealed{opacity:1;transform:none;}
@media (prefers-reduced-motion: reduce){ [data-reveal]{opacity:1 !important;transform:none !important;transition:none;} }
`;

export function initMotion() {
    injectStyle('fn-motion-css', CSS);

    if (REDUCED) {
        document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('revealed'));
        document.querySelectorAll('[data-countup]').forEach((el) => { el.textContent = formatTarget(el); });
        return;
    }

    // Reveal on scroll
    const reveals = document.querySelectorAll('[data-reveal]');
    if (reveals.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    const el = e.target;
                    const delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
                    setTimeout(() => el.classList.add('revealed'), delay);
                    io.unobserve(el);
                }
            });
        }, { threshold: 0.12 });
        reveals.forEach((el) => io.observe(el));
    }

    // Count-up numbers
    const counters = document.querySelectorAll('[data-countup]');
    if (counters.length) {
        const io2 = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) { runCount(e.target); io2.unobserve(e.target); }
            });
        }, { threshold: 0.6 });
        counters.forEach((el) => io2.observe(el));
    }
}

function formatTarget(el) {
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    return prefix + (el.getAttribute('data-countup') || '') + suffix;
}

function runCount(el) {
    const target = parseFloat(el.getAttribute('data-countup'));
    if (!isFinite(target)) { el.textContent = formatTarget(el); return; }
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const dur = 1100;
    const start = performance.now();
    function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * eased);
        el.textContent = prefix + val + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target + suffix;
    }
    requestAnimationFrame(tick);
}

function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
}
