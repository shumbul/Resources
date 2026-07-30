/* Journey map: an animated, winding-road overview of a roadmap.
 * Auto-detects the 12-week or 6-month roadmap, groups its sections into phases,
 * and renders a "highway" with milestone stops, a live stats header, and a
 * "next up" goal card. Stays in sync with the existing progress tracker via the
 * shared localStorage key and the 'progress:change' event.
 *
 * Pure SVG + CSS. No libraries. Respects prefers-reduced-motion.
 */

const MAPS = {
    week: {
        sel: '.week-section', titleSel: '.week-title', focusSel: '.week-focus',
        key: 'progress_weeks_v1', unit: 'week', unitLabel: 'WEEKS', unitHours: 10,
        heading: 'The Career Highway',
        phases: [
            { name: 'Foundations', from: 0, to: 4 },
            { name: 'Modern Skills', from: 4, to: 8 },
            { name: 'Career Launch', from: 8, to: 12 },
        ],
    },
    month: {
        sel: '.month-section', titleSel: 'h2', focusSel: '.month-header .month-number',
        key: 'progress_months_v1', unit: 'month', unitLabel: 'MONTHS', unitHours: 40,
        heading: 'The AI Journey',
        titleSelFallback: true,
        phases: [
            { name: 'Foundations', from: 0, to: 2 },
            { name: 'Core AI', from: 2, to: 4 },
            { name: 'Ship It', from: 4, to: 6 },
        ],
    },
};

const CSS = `
.journey{position:relative;border-radius:20px;overflow:hidden;margin:0 0 2.5rem;
    background:radial-gradient(120% 120% at 20% 0%, #16233c 0%, #0a1220 60%);
    border:1px solid #24304a;color:#e2e8f0;font-family:var(--font-sans,inherit);}
.journey__top{display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-start;justify-content:space-between;padding:1.4rem 1.6rem .4rem;}
.journey__title{font-family:var(--font-display,inherit);font-weight:700;font-size:1.4rem;margin:0;}
.journey__title b{background:linear-gradient(90deg,#8b5cf6,#38bdf8);-webkit-background-clip:text;background-clip:text;color:transparent;}
.journey__stats{display:flex;gap:1.4rem;flex-wrap:wrap;}
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
.j-node{cursor:pointer;}
.j-ring{fill:#0a1220;stroke-width:4;}
.j-core{}
.j-plabel{fill:#e2e8f0;font-family:var(--font-display,sans-serif);font-weight:700;font-size:15px;}
.j-prange{fill:#94a3b8;font-family:var(--font-sans,sans-serif);font-size:12px;}
.j-cap{fill:#cbd5e1;font-family:var(--font-display,sans-serif);font-weight:700;font-size:13px;}
.j-pulse{animation:jpulse 1.7s ease-in-out infinite;transform-origin:center;transform-box:fill-box;}
@keyframes jpulse{0%,100%{opacity:.5;}50%{opacity:1;}}
@media (prefers-reduced-motion: reduce){ .j-dash,.j-pulse{animation:none;} }
@media (max-width:640px){ .journey__title{font-size:1.15rem;} .journey__stat .n{font-size:1.2rem;} .journey__goal{min-width:0;} }
`;

export function initJourney() {
    const cfg = document.querySelector(MAPS.week.sel) ? MAPS.week
        : document.querySelector(MAPS.month.sel) ? MAPS.month : null;
    if (!cfg) return;
    const sections = Array.from(document.querySelectorAll(cfg.sel));
    if (sections.length < 3) return;
    if (document.querySelector('.journey')) return;

    injectStyle('fn-journey-css', CSS);

    const panel = document.createElement('section');
    panel.className = 'journey';
    panel.setAttribute('aria-label', 'Your learning journey overview');
    // Place as a hero at the very top of the section container (above any intro).
    const wrap = sections[0].parentNode;
    wrap.insertBefore(panel, wrap.firstChild);

    const titleOf = (i) => (sections[i].querySelector(cfg.titleSel)?.textContent || (cfg.unit + ' ' + (i + 1))).trim();

    function readDone() {
        try { return JSON.parse(localStorage.getItem(cfg.key) || '{}'); } catch { return {}; }
    }

    // Smooth wave the road follows.
    const X0 = 60, X1 = 940, MID = 175, AMP = 62, WAVE = 150;
    const yAt = (x) => MID + AMP * Math.sin((x - X0) / WAVE);

    function roadPath() {
        let d = `M${X0},${yAt(X0).toFixed(1)}`;
        for (let x = X0 + 12; x <= X1; x += 12) d += ` L${x},${yAt(x).toFixed(1)}`;
        return d;
    }

    function phaseX(i, n) {
        if (n === 1) return (X0 + X1) / 2;
        const a = 190, b = 810;
        return a + ((b - a) / (n - 1)) * i;
    }

    const COLORS = ['#22c55e', '#38bdf8', '#f59e0b', '#a855f7', '#ef4444'];

    function build() {
        const done = readDone();
        const total = sections.length;
        const doneCount = Object.values(done).filter(Boolean).length;
        const pct = Math.round((doneCount / total) * 100);
        const hours = total * cfg.unitHours;

        // next incomplete section
        let nextIdx = sections.findIndex((_, i) => !done[i]);
        const finished = nextIdx === -1;
        if (finished) nextIdx = total - 1;

        // phase completion
        const phaseState = cfg.phases.map((p) => {
            let d = 0, t = 0;
            for (let i = p.from; i < p.to && i < total; i++) { t++; if (done[i]) d++; }
            const complete = t > 0 && d === t;
            const current = !complete && nextIdx >= p.from && nextIdx < p.to && !finished;
            return { complete, current, d, t };
        });

        const goalTitle = finished ? '🎉 Journey complete!' : titleOf(nextIdx);
        const goalSub = finished ? 'You finished every ' + cfg.unit + '. Amazing work.' :
            'Your next stop on the ' + cfg.unit + '-by-' + cfg.unit + ' plan';

        // Build node markup
        const n = cfg.phases.length;
        let nodes = '';
        cfg.phases.forEach((p, i) => {
            const x = phaseX(i, n);
            const y = yAt(x);
            const st = phaseState[i];
            const color = st.complete ? '#22c55e' : (st.current ? (COLORS[i] || '#8b5cf6') : '#3b4a6b');
            const labelAbove = y > MID;
            const ly = labelAbove ? y - 62 : y + 44;
            const ry = labelAbove ? y - 44 : y + 62;
            const from = (cfg.unit === 'week' ? 'Weeks ' : 'Months ') + (p.from + 1) + '-' + p.to;
            nodes += `
                <g class="j-node" data-goto="${p.from}">
                    ${st.current ? `<circle class="j-pulse" cx="${x}" cy="${y}" r="26" fill="${color}" opacity=".35"/>` : ''}
                    <circle class="j-ring" cx="${x}" cy="${y}" r="17" stroke="${color}"/>
                    <circle class="j-core" cx="${x}" cy="${y}" r="8" fill="${color}"/>
                    ${st.complete ? `<path d="M${x - 4},${y} l3,3 l6,-7" fill="none" stroke="#0a1220" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
                    <text class="j-plabel" x="${x}" y="${ly}" text-anchor="middle">${p.name}</text>
                    <text class="j-prange" x="${x}" y="${ry}" text-anchor="middle">${from}${st.t ? ' · ' + st.d + '/' + st.t : ''}</text>
                </g>`;
        });

        const startColor = doneCount > 0 ? '#22c55e' : '#8b5cf6';
        const masteryColor = finished ? '#fbbf24' : '#3b4a6b';

        panel.innerHTML = `
            <div class="journey__top">
                <div>
                    <h2 class="journey__title">The <b>${cfg.heading.replace(/^The /, '')}</b></h2>
                    <div class="journey__stats">
                        <div class="journey__stat"><div class="n">${doneCount}</div><div class="k">Done</div></div>
                        <div class="journey__stat"><div class="n">${total}</div><div class="k">${cfg.unitLabel}</div></div>
                        <div class="journey__stat"><div class="n">~${hours}h</div><div class="k">Hours</div></div>
                        <div class="journey__stat"><div class="n">${n}</div><div class="k">Phases</div></div>
                    </div>
                </div>
                <div class="journey__goal" data-goto="${nextIdx}" role="button" tabindex="0" aria-label="Jump to ${goalTitle}">
                    <div class="lead">${finished ? 'All done' : "Next up"}</div>
                    <div class="g-title">${goalTitle}</div>
                    <div class="g-sub">${goalSub} <span class="g-go">→</span></div>
                </div>
            </div>
            <div class="journey__barwrap"><div class="journey__bar"><span style="width:${pct}%"></span></div></div>
            <svg class="journey__road" viewBox="0 0 1000 340" preserveAspectRatio="xMidYMid meet" role="img"
                 aria-label="Journey map: ${doneCount} of ${total} ${cfg.unit}s complete, ${pct} percent.">
                <path class="j-road" d="${roadPath()}"/>
                <path class="j-road2" d="${roadPath()}"/>
                <path class="j-dash" d="${roadPath()}"/>
                <g class="j-node" data-goto="0">
                    <circle class="j-ring" cx="${X0}" cy="${yAt(X0)}" r="15" stroke="${startColor}"/>
                    <circle cx="${X0}" cy="${yAt(X0)}" r="6" fill="${startColor}"/>
                    <text class="j-cap" x="${X0}" y="${yAt(X0) + 40}" text-anchor="middle">START</text>
                </g>
                ${nodes}
                <g>
                    <circle class="j-ring" cx="${X1}" cy="${yAt(X1)}" r="17" stroke="${masteryColor}"/>
                    <text x="${X1}" y="${yAt(X1) + 5}" text-anchor="middle" font-size="15" fill="${masteryColor}">★</text>
                    <text class="j-cap" x="${X1}" y="${yAt(X1) - 30}" text-anchor="middle" fill="${masteryColor}">MASTERY</text>
                </g>
            </svg>`;

        // Wire jump-to-section
        panel.querySelectorAll('[data-goto]').forEach((el) => {
            const go = () => {
                const idx = parseInt(el.getAttribute('data-goto'), 10);
                const target = sections[idx] || sections[0];
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
            el.addEventListener('click', go);
            el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
        });
    }

    build();
    document.addEventListener('progress:change', build);
}

function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
}
