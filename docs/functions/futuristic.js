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

const CSS = `
/* ============ FLUID TYPE SCALE ============ */
[data-futuristic] {
  --fx-step--1: clamp(0.83rem, 0.80rem + 0.15vw, 0.92rem);
  --fx-step-0:  clamp(1.00rem, 0.95rem + 0.25vw, 1.13rem);
  --fx-step-1:  clamp(1.25rem, 1.15rem + 0.50vw, 1.55rem);
  --fx-step-2:  clamp(1.56rem, 1.35rem + 1.05vw, 2.20rem);
  --fx-step-3:  clamp(1.95rem, 1.55rem + 2.00vw, 3.20rem);
  --fx-step-4:  clamp(2.44rem, 1.70rem + 3.70vw, 4.60rem);
  --fx-ease: cubic-bezier(.22,1,.36,1);
}

/* ============ HERO: ANIMATED MESH ============ */
[data-futuristic] header {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: linear-gradient(150deg,
      color-mix(in oklab, var(--primary) 92%, #000 8%),
      color-mix(in oklab, var(--secondary) 88%, #4c1d95 12%));
}
.fx-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(58px);
  pointer-events: none;
  z-index: 0;
  will-change: transform;
  mix-blend-mode: screen;
}
.fx-orb.o1 { width: 44vw; height: 44vw; max-width:520px; max-height:520px;
  background: radial-gradient(circle, rgba(167,139,250,.85), transparent 68%);
  top: -14%; left: -8%;  animation: fxDrift1 19s ease-in-out infinite; }
.fx-orb.o2 { width: 38vw; height: 38vw; max-width:460px; max-height:460px;
  background: radial-gradient(circle, rgba(56,189,248,.62), transparent 68%);
  bottom: -20%; right: -6%; animation: fxDrift2 24s ease-in-out infinite; }
.fx-orb.o3 { width: 30vw; height: 30vw; max-width:380px; max-height:380px;
  background: radial-gradient(circle, rgba(244,114,182,.55), transparent 70%);
  top: 40%; right: 22%;  animation: fxDrift3 28s ease-in-out infinite; }
.fx-orb.o4 { width: 26vw; height: 26vw; max-width:320px; max-height:320px;
  background: radial-gradient(circle, rgba(52,211,153,.42), transparent 70%);
  bottom: 8%; left: 24%;  animation: fxDrift4 22s ease-in-out infinite; }

@keyframes fxDrift1 { 0%,100%{transform:translate3d(0,0,0) scale(1)}
  33%{transform:translate3d(9vw,7vh,0) scale(1.16)}
  66%{transform:translate3d(4vw,14vh,0) scale(.9)} }
@keyframes fxDrift2 { 0%,100%{transform:translate3d(0,0,0) scale(1)}
  40%{transform:translate3d(-10vw,-6vh,0) scale(1.2)}
  70%{transform:translate3d(-3vw,-13vh,0) scale(.92)} }
@keyframes fxDrift3 { 0%,100%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(-12vw,8vh,0) scale(1.24)} }
@keyframes fxDrift4 { 0%,100%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(10vw,-9vh,0) scale(1.14)} }

/* fine grain so the gradient never looks like flat plastic */
.fx-grain {
  position:absolute; inset:0; z-index:1; pointer-events:none; opacity:.055;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
}
/* faint dot grid for depth */
.fx-mesh-grid {
  position:absolute; inset:-40px; z-index:1; pointer-events:none; opacity:.14;
  background-image: radial-gradient(circle, #fff 1px, transparent 1px);
  background-size: 30px 30px;
  animation: fxGridDrift 26s linear infinite;
}
@keyframes fxGridDrift { to { transform: translate(30px, 30px); } }

[data-futuristic] header .container { position: relative; z-index: 2; }

/* ============ HERO TYPE ============ */
[data-futuristic] .hero-content h1 {
  font-size: var(--fx-step-4);
  line-height: 1.02;
  letter-spacing: -.03em;
  font-weight: 800;
  background: linear-gradient(180deg, #fff 30%, rgba(255,255,255,.72));
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
  text-wrap: balance;
}
[data-futuristic] .hero-subtitle {
  font-size: var(--fx-step-0);
  color: rgba(255,255,255,.88);
  max-width: 62ch; margin-inline: auto;
  text-wrap: pretty;
}

/* animated entrance */
.fx-in { opacity:0; transform: translateY(20px); }
.fx-in.fx-shown { opacity:1; transform:none;
  transition: opacity .7s var(--fx-ease), transform .7s var(--fx-ease); }
.fx-d1{transition-delay:.05s}.fx-d2{transition-delay:.15s}
.fx-d3{transition-delay:.25s}.fx-d4{transition-delay:.35s}

/* ============ HERO STATS ============ */
.fx-stats{display:flex;gap:clamp(1rem,4vw,2.6rem);justify-content:center;
  flex-wrap:wrap;margin-top:2rem;position:relative;z-index:2;}
.fx-stat{text-align:center;min-width:74px;}
.fx-stat b{display:block;font-size:var(--fx-step-2);font-weight:800;color:#fff;
  line-height:1;font-variant-numeric:tabular-nums;
  text-shadow:0 2px 22px rgba(0,0,0,.24);}
.fx-stat span{display:block;font-size:.76rem;letter-spacing:.12em;
  text-transform:uppercase;color:rgba(255,255,255,.7);margin-top:.4rem;font-weight:600;}

/* ============ MAGNETIC CTA ============ */
[data-futuristic] .cta-button{
  position:relative; overflow:hidden; isolation:isolate;
  color:#fff;                                  /* keep AA contrast on the mesh */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(255,255,255,.18);
  border: 1px solid rgba(255,255,255,.42);
  box-shadow: 0 8px 30px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.30);
  text-shadow: 0 1px 10px rgba(0,0,0,.28);
  font-weight: 700;
  transition: transform .25s var(--fx-ease), box-shadow .25s var(--fx-ease),
              background .25s ease;
  will-change: transform;
}
[data-futuristic] .cta-button:hover,
[data-futuristic] .cta-button:focus-visible{
  color:#fff;
  background: rgba(255,255,255,.30);
  border-color: rgba(255,255,255,.60);
  box-shadow: 0 14px 40px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.45);
}
[data-futuristic] .cta-button:focus-visible{
  outline:2px solid #fff; outline-offset:3px;
}
[data-futuristic] .cta-button::after{
  content:''; position:absolute; inset:0; z-index:-1; opacity:0;
  background: radial-gradient(120px circle at var(--mx,50%) var(--my,50%),
              rgba(255,255,255,.34), transparent 62%);
  transition: opacity .3s ease;
}
[data-futuristic] .cta-button:hover::after{opacity:1;}

/* ============ SPOTLIGHT CARDS ============ */
[data-futuristic] .resource-card,
[data-futuristic] .bento-card{
  position:relative; isolation:isolate;
  transition: transform .35s var(--fx-ease), box-shadow .35s var(--fx-ease),
              border-color .35s ease;
  will-change: transform;
}
[data-futuristic] .resource-card::before,
[data-futuristic] .bento-card::before{
  content:''; position:absolute; inset:0; border-radius:inherit; z-index:-1;
  opacity:0; transition:opacity .35s ease;
  background: radial-gradient(340px circle at var(--mx,50%) var(--my,50%),
              color-mix(in oklab, var(--primary) 16%, transparent), transparent 62%);
}
[data-futuristic] .resource-card:hover::before,
[data-futuristic] .bento-card:hover::before{opacity:1;}
[data-futuristic] .resource-card:hover,
[data-futuristic] .bento-card:hover{
  transform: translateY(-5px);
  border-color: color-mix(in oklab, var(--primary) 42%, transparent);
  box-shadow: 0 18px 44px -18px color-mix(in oklab, var(--primary) 55%, transparent),
              0 4px 12px rgba(15,23,42,.08);
}
/* thin gradient hairline on hover */
[data-futuristic] .resource-card::after{
  content:''; position:absolute; left:0; right:0; top:0; height:2px;
  border-radius:inherit inherit 0 0; opacity:0; transition:opacity .35s ease;
  background: linear-gradient(90deg, transparent,
              color-mix(in oklab, var(--primary) 85%, transparent), transparent);
}
[data-futuristic] .resource-card:hover::after{opacity:1;}

/* ============ SCROLL REVEAL ============ */
@supports (animation-timeline: view()) {
  [data-futuristic] .fx-reveal{
    animation: fxRise linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 26%;
  }
}
@supports not (animation-timeline: view()) {
  [data-futuristic] .fx-reveal{opacity:0;transform:translateY(24px);}
  [data-futuristic] .fx-reveal.fx-shown{opacity:1;transform:none;
    transition:opacity .6s var(--fx-ease),transform .6s var(--fx-ease);}
}
@keyframes fxRise{from{opacity:0;transform:translateY(30px) scale(.985)}
  to{opacity:1;transform:none}}

/* ============ GLASS NAV ON SCROLL ============ */
[data-futuristic] .site-topbar{
  transition: background .3s ease, backdrop-filter .3s ease,
              box-shadow .3s ease, border-color .3s ease;
}
[data-futuristic] .site-topbar.fx-solid{
  background: color-mix(in oklab, var(--bg-primary) 78%, transparent);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  box-shadow: 0 6px 26px -14px rgba(15,23,42,.34);
}

/* ============ AURORA BEHIND CONTENT ============ */
.fx-aurora{position:fixed;inset:0;z-index:-2;pointer-events:none;overflow:hidden;}
.fx-aurora i{position:absolute;display:block;border-radius:50%;filter:blur(80px);
  opacity:.30;will-change:transform;}
.fx-aurora i:nth-child(1){width:520px;height:520px;top:8%;left:-14%;
  background:radial-gradient(circle,color-mix(in oklab,var(--primary) 62%,transparent),transparent 70%);
  animation:fxDrift1 34s ease-in-out infinite;}
.fx-aurora i:nth-child(2){width:440px;height:440px;bottom:4%;right:-12%;
  background:radial-gradient(circle,rgba(56,189,248,.42),transparent 70%);
  animation:fxDrift2 42s ease-in-out infinite;}
.fx-aurora i:nth-child(3){width:380px;height:380px;top:52%;left:38%;
  background:radial-gradient(circle,rgba(244,114,182,.30),transparent 72%);
  animation:fxDrift3 48s ease-in-out infinite;}

/* ============ SECTION HEADINGS ============ */
[data-futuristic] .section-title,
[data-futuristic] .nav-section h2:not(.sr-only){
  font-size: var(--fx-step-2); letter-spacing:-.02em; text-wrap:balance;
}

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .fx-orb, .fx-mesh-grid, .fx-aurora i { animation: none !important; }
  [data-futuristic] .fx-reveal { animation: none !important;
    opacity:1 !important; transform:none !important; }
  .fx-in { opacity:1 !important; transform:none !important; transition:none !important; }
  [data-futuristic] .resource-card:hover,
  [data-futuristic] .bento-card:hover,
  [data-futuristic] .cta-button:hover { transform:none !important; }
}

/* ============ MOBILE ============ */
@media (max-width: 640px) {
  .fx-orb { filter: blur(44px); }
  .fx-aurora { display:none; }           /* save GPU on phones */
  .fx-stats { gap:1.1rem; margin-top:1.5rem; }
  .fx-stat b { font-size:var(--fx-step-1); }
  .fx-stat span { font-size:.66rem; letter-spacing:.09em; }
}
`;

const REDUCE = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- hero decoration ---------- */
function decorateHero() {
    const header = document.querySelector('header');
    if (!header || header.querySelector('.fx-orb')) return;

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
    const host = document.querySelector('header .hero-content');
    if (!host || host.querySelector('.fx-stats')) return;

    const guides = document.querySelectorAll('.resource-card').length || 30;
    const stats = [
        [guides, '+', 'Guides'],
        [100, '%', 'Free'],
        [0, '', 'Signups'],
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

    const style = document.createElement('style');
    style.id = 'fx-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    decorateHero();
    addStats();
    addAurora();
    reveals();
    spotlight();
    magnetic();
    // nav is injected by nav.js, so wait a tick for it
    setTimeout(glassNav, 60);
}
