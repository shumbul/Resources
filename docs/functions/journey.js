/* Journey map: an animated, winding-road overview that turns a roadmap or a
 * guide into a "highway" you travel, with milestone stops, live stats, moving
 * traffic dots, and a "next up" card. Stays in sync with the progress tracker
 * via the shared localStorage key and the 'progress:change' event.
 *
 * Design: a single JourneyType descriptor drives everything (polymorphism by
 * configuration). Adding a new journey = add one descriptor to TYPES. Pure
 * SVG + CSS, no libraries, respects prefers-reduced-motion.
 */

/* ---- Journey descriptors (the "polymorphic" types) ---------------------- */
const TYPES = [
    {
        id: 'weeks',
        sectionSel: '.week-section',
        titleSel: '.week-title',
        storageKey: 'progress_weeks_v1',
        unit: 'week',
        heading: 'The Career Highway',
        rangeWord: 'Weeks',
        phases: [
            { name: 'Foundations', from: 0, to: 4 },
            { name: 'Modern Skills', from: 4, to: 8 },
            { name: 'Career Launch', from: 8, to: 12 },
        ],
    },
    {
        id: 'months',
        sectionSel: '.month-section',
        titleSel: 'h2',
        storageKey: 'progress_months_v1',
        unit: 'month',
        heading: 'The AI Journey',
        rangeWord: 'Months',
        phases: [
            { name: 'Foundations', from: 0, to: 2 },
            { name: 'Core AI', from: 2, to: 4 },
            { name: 'Ship It', from: 4, to: 6 },
        ],
    },
    {
        id: 'dsa',
        sectionSel: '.gsection',
        titleSel: 'h2',
        storageKey: 'progress_dsa_v1',
        unit: 'stage',
        heading: 'The DSA Path',
        rangeWord: 'Stages',
        // built from the H2 sections on the DSA page (see labels below)
        phases: [
            { name: 'Patterns', from: 0, to: 2 },
            { name: 'Practice', from: 2, to: 4 },
        ],
        pageMatch: 'dsa-practice-guide.html',
    },
    {
        id: 'sysdesign',
        sectionSel: '.gsection',
        titleSel: 'h2',
        storageKey: 'progress_sysdesign_v1',
        unit: 'stage',
        heading: 'The System Design Path',
        rangeWord: 'Stages',
        phases: [
            { name: 'Framework', from: 0, to: 2 },
            { name: 'Apply', from: 2, to: 5 },
        ],
        pageMatch: 'system-design-templates.html',
    },
];

/* ---- Geometry helpers (shared, pure) ------------------------------------ */
const GEO = { X0: 60, X1: 940, MID: 175, AMP: 62, WAVE: 150 };
const yAt = (x) => GEO.MID + GEO.AMP * Math.sin((x - GEO.X0) / GEO.WAVE);

function roadPath() {
    let d = `M${GEO.X0},${yAt(GEO.X0).toFixed(1)}`;
    for (let x = GEO.X0 + 12; x <= GEO.X1; x += 12) d += ` L${x},${yAt(x).toFixed(1)}`;
    return d;
}
function phaseX(i, n) {
    if (n <= 1) return (GEO.X0 + GEO.X1) / 2;
    const a = 190, b = 810;
    return a + ((b - a) / (n - 1)) * i;
}

const PHASE_COLORS = ['#22c55e', '#38bdf8', '#f59e0b', '#a855f7', '#ef4444'];

/* ---- CSS ----------------------------------------------------------------- */
const CSS = `
.journey{position:relative;border-radius:20px;overflow:hidden;margin:0 0 2.5rem;
    background:radial-gradient(120% 120% at 20% 0%, #16233c 0%, #0a1220 60%);
    border:1px solid #24304a;color:#e2e8f0;font-family:var(--font-sans,inherit);}
.journey__top{display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-start;justify-content:space-between;padding:1.4rem 1.6rem .4rem;}
.journey__title{font-family:var(--font-display,inherit);font-weight:700;font-size:1.4rem;margin:0;}
.journey__title b{background:linear-gradient(90deg,#8b5cf6,#38bdf8);-webkit-background-clip:text;background-clip:text;color:transparent;}
.journey__stats{display:flex;gap:1.4rem;flex-wrap:wrap;margin-top:.5rem;}
.journey__stat{text-align:center;}
.journey__stat .n{font-family:var(--font-display,inherit);font-weight:700;font-size:1.5rem;line-height:1;}
.journey__stat .k{font-size:.68rem;letter-spacing:.09em;color:#94a3b8;text-transform:uppercase;}
.journey__goal{background:#111c30;border:1px solid #2a3a58;border-radius:14px;padding:.85rem 1rem;min-width:230px;max-width:320px;cursor:pointer;transition:border-color .2s ease, transform .2s ease;}
.journey__goal:hover{border-color:#8b5cf6;transform:translateY(-2px);}
.journey__goal .lead{font-size:.66rem;letter-spacing:.1em;color:#a78bfa;text-transform:uppercase;font-weight:700;}
.journey__goal .g-title{font-family:var(--font-display,inherit);font-weight:700;margin:.15rem 0;}
.journey__goal .g-sub{font-size:.82rem;color:#94a3b8;}
.journey__goal .g-go{color:#38bdf8;font-weight:700;}
.journey__barwrap{padding:0 1.6rem .4rem;}
.journey__bar{height:7px;border-radius:999px;background:#1b2740;overflow:hidden;}
.journey__bar span{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#8b5cf6,#38bdf8);transition:width .5s ease;}
.journey__road{display:block;width:100%;height:auto;}
.j-road{fill:none;stroke:#1f2c48;stroke-width:26;stroke-linecap:round;}
.j-road2{fill:none;stroke:#2b3a5c;stroke-width:20;stroke-linecap:round;}
.j-dash{fill:none;stroke:#5b6b8f;stroke-width:2.5;stroke-dasharray:2 16;stroke-linecap:round;animation:jdash 8s linear infinite;}
@keyframes jdash{to{stroke-dashoffset:-180;}}
.j-plabel{fill:#e2e8f0;font-family:var(--font-display,sans-serif);font-weight:700;font-size:15px;}
.j-prange{fill:#94a3b8;font-family:var(--font-sans,sans-serif);font-size:12px;}
.j-cap{fill:#cbd5e1;font-family:var(--font-display,sans-serif);font-weight:700;font-size:13px;}
.j-node{cursor:pointer;}
.j-ring{fill:#0a1220;stroke-width:4;}
.j-pulse{animation:jpulse 1.7s ease-in-out infinite;transform-origin:center;transform-box:fill-box;}
@keyframes jpulse{0%,100%{opacity:.5;}50%{opacity:1;}}
@media (prefers-reduced-motion: reduce){ .j-dash,.j-pulse,.j-car{animation:none;} .j-car circle{display:none;} }
@media (max-width:640px){ .journey__title{font-size:1.15rem;} .journey__stat .n{font-size:1.2rem;} .journey__goal{min-width:0;} }
`;

/* ---- Public entry point ------------------------------------------------- */
export function initJourney() {
    if (document.querySelector('.journey')) return;
    const page = (location.pathname.split('/').pop() || '').toLowerCase();
    const type = pickType(page);
    if (!type) return;

    const sections = Array.from(document.querySelectorAll(type.sectionSel));
    if (sections.length < 3) return;

    injectStyle('fn-journey-css', CSS);

    const panel = document.createElement('section');
    panel.className = 'journey';
    panel.setAttribute('aria-label', 'Your learning journey overview');
    const wrap = sections[0].parentNode;
    wrap.insertBefore(panel, wrap.firstChild);

    const view = new JourneyView(type, sections, panel);
    view.render();
    document.addEventListener('progress:change', () => view.render());
}

function pickType(page) {
    // Page-specific types win (dsa, sysdesign); otherwise match by section presence.
    const byPage = TYPES.find((t) => t.pageMatch && t.pageMatch === page && document.querySelector(t.sectionSel));
    if (byPage) return byPage;
    return TYPES.find((t) => !t.pageMatch && document.querySelector(t.sectionSel)) || null;
}

/* ---- JourneyView: one instance renders one journey ---------------------- */
class JourneyView {
    constructor(type, sections, panel) {
        this.type = type;
        this.sections = sections;
        this.panel = panel;
    }

    readDone() {
        try { return JSON.parse(localStorage.getItem(this.type.storageKey) || '{}'); } catch { return {}; }
    }

    titleOf(i) {
        const el = this.sections[i].querySelector(this.type.titleSel);
        return (el ? el.textContent : `${this.type.unit} ${i + 1}`).trim();
    }

    computeState() {
        const { sections, type } = this;
        const done = this.readDone();
        const total = sections.length;
        const doneCount = Object.values(done).filter(Boolean).length;
        const pct = Math.round((doneCount / total) * 100);

        let nextIdx = sections.findIndex((_, i) => !done[i]);
        const finished = nextIdx === -1;
        if (finished) nextIdx = total - 1;

        const phases = type.phases.map((p, i) => {
            let d = 0, t = 0;
            for (let k = p.from; k < p.to && k < total; k++) { t++; if (done[k]) d++; }
            const complete = t > 0 && d === t;
            const current = !complete && !finished && nextIdx >= p.from && nextIdx < p.to;
            return { ...p, i, d, t, complete, current };
        });

        return { total, doneCount, pct, nextIdx, finished, phases };
    }

    render() {
        const { type } = this;
        const s = this.computeState();

        this.panel.innerHTML =
            this.headerHtml(s) +
            `<div class="journey__barwrap"><div class="journey__bar"><span style="width:${s.pct}%"></span></div></div>` +
            this.roadHtml(s);

        this.wireJumps();
    }

    headerHtml(s) {
        const { type } = this;
        const goalTitle = s.finished ? '🎉 Journey complete!' : this.titleOf(s.nextIdx);
        const goalSub = s.finished
            ? `You finished every ${type.unit}. Amazing work.`
            : `Your next stop on the path`;
        return `
            <div class="journey__top">
                <div>
                    <h2 class="journey__title">${type.heading.replace(/^The\s/, 'The <b>') }</b></h2>
                    <div class="journey__stats">
                        <div class="journey__stat"><div class="n">${s.doneCount}</div><div class="k">Done</div></div>
                        <div class="journey__stat"><div class="n">${s.total}</div><div class="k">${type.rangeWord}</div></div>
                        <div class="journey__stat"><div class="n">${s.pct}%</div><div class="k">Progress</div></div>
                        <div class="journey__stat"><div class="n">${type.phases.length}</div><div class="k">Phases</div></div>
                    </div>
                </div>
                <div class="journey__goal" data-goto="${s.nextIdx}" role="button" tabindex="0" aria-label="Jump to ${goalTitle}">
                    <div class="lead">${s.finished ? 'All done' : 'Next up'}</div>
                    <div class="g-title">${goalTitle}</div>
                    <div class="g-sub">${goalSub} <span class="g-go">→</span></div>
                </div>
            </div>`;
    }

    roadHtml(s) {
        const { type } = this;
        const n = type.phases.length;
        const startColor = s.doneCount > 0 ? '#22c55e' : '#8b5cf6';
        const masteryColor = s.finished ? '#fbbf24' : '#3b4a6b';
        const path = roadPath();

        const nodes = s.phases.map((p) => {
            const x = phaseX(p.i, n), y = yAt(x);
            const color = p.complete ? '#22c55e' : (p.current ? (PHASE_COLORS[p.i] || '#8b5cf6') : '#3b4a6b');
            const above = y > GEO.MID;
            const ly = above ? y - 62 : y + 44;
            const ry = above ? y - 44 : y + 62;
            const range = `${type.rangeWord} ${p.from + 1}-${p.to}`;
            return `
                <g class="j-node" data-goto="${p.from}">
                    ${p.current ? `<circle class="j-pulse" cx="${x}" cy="${y}" r="26" fill="${color}" opacity=".35"/>` : ''}
                    <circle class="j-ring" cx="${x}" cy="${y}" r="17" stroke="${color}"/>
                    <circle cx="${x}" cy="${y}" r="8" fill="${color}"/>
                    ${p.complete ? `<path d="M${x - 4},${y} l3,3 l6,-7" fill="none" stroke="#0a1220" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
                    <text class="j-plabel" x="${x}" y="${ly}" text-anchor="middle">${p.name}</text>
                    <text class="j-prange" x="${x}" y="${ry}" text-anchor="middle">${range} · ${p.d}/${p.t}</text>
                </g>`;
        }).join('');

        // Moving "traffic" dots that travel the whole road (animateMotion).
        const cars = this.carsHtml(path, s);

        return `
            <svg class="journey__road" viewBox="0 0 1000 340" preserveAspectRatio="xMidYMid meet" role="img"
                 aria-label="Journey map: ${s.doneCount} of ${s.total} ${type.unit}s complete, ${s.pct} percent.">
                <path id="jRoad" class="j-road" d="${path}"/>
                <path class="j-road2" d="${path}"/>
                <path class="j-dash" d="${path}"/>
                ${cars}
                <g class="j-node" data-goto="0">
                    <circle class="j-ring" cx="${GEO.X0}" cy="${yAt(GEO.X0)}" r="15" stroke="${startColor}"/>
                    <circle cx="${GEO.X0}" cy="${yAt(GEO.X0)}" r="6" fill="${startColor}"/>
                    <text class="j-cap" x="${GEO.X0}" y="${yAt(GEO.X0) + 40}" text-anchor="middle">START</text>
                </g>
                ${nodes}
                <g>
                    <circle class="j-ring" cx="${GEO.X1}" cy="${yAt(GEO.X1)}" r="17" stroke="${masteryColor}"/>
                    <text x="${GEO.X1}" y="${yAt(GEO.X1) + 5}" text-anchor="middle" font-size="15" fill="${masteryColor}">★</text>
                    <text class="j-cap" x="${GEO.X1}" y="${yAt(GEO.X1) - 30}" text-anchor="middle" fill="${masteryColor}">MASTERY</text>
                </g>
            </svg>`;
    }

    carsHtml(path, s) {
        // A few glowing dots continuously driving along the road. More progress =
        // more (and greener) dots, so the road feels busier as you advance.
        const count = 3 + Math.min(3, Math.floor(s.pct / 25));
        const dur = 6.5;
        let out = '';
        for (let k = 0; k < count; k++) {
            const begin = (-(dur / count) * k).toFixed(2);
            const color = k % 2 === 0 ? '#38bdf8' : '#8b5cf6';
            out += `
                <g class="j-car">
                    <circle r="5" fill="${color}">
                        <animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" rotate="auto" path="${path}"/>
                    </circle>
                    <circle r="9" fill="${color}" opacity="0.25">
                        <animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" rotate="auto" path="${path}"/>
                    </circle>
                </g>`;
        }
        return out;
    }

    wireJumps() {
        this.panel.querySelectorAll('[data-goto]').forEach((el) => {
            const go = () => {
                const idx = parseInt(el.getAttribute('data-goto'), 10);
                (this.sections[idx] || this.sections[0]).scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
            el.addEventListener('click', go);
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
            });
        });
    }
}

function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
}
