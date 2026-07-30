/* Reusable animated flow map.
 *
 * Turns a simple attribute into a horizontal pipeline of nodes with a glowing
 * "packet" that travels along the path, the same lively style as the agent-loop
 * diagram, but reusable anywhere (a URL request, a CI/CD pipeline, a request
 * lifecycle, a git flow). Pure SVG + SMIL, no libraries. Respects reduced motion.
 *
 * Usage:
 *   <div class="flowmap"
 *        data-flow-title="What happens when you visit a URL"
 *        data-flow="DNS lookup|🔎, TCP handshake|🤝, TLS|🔒, HTTP request|📤, Render|🖼️">
 *   </div>
 *
 * Each stage is "Label|emoji" (emoji optional), separated by commas.
 */

const CSS = `
.flowmap{margin:1.1rem 0;}
.flowmap__title{font-weight:700;font-family:var(--font-display,inherit);font-size:.95rem;margin:0 0 .5rem;color:var(--text-primary,#111);}
.flowmap svg{display:block;width:100%;height:auto;}
.fm-line{fill:none;stroke:var(--border,#e5e7eb);stroke-width:4;stroke-linecap:round;}
.fm-node{fill:var(--bg-primary,#fff);stroke:var(--primary,#7c3aed);stroke-width:2.5;}
.fm-ico{font-size:20px;}
.fm-lbl{fill:var(--text-primary,#111);font:600 13px var(--font-sans,sans-serif);}
.fm-arrow{fill:var(--secondary,#6d28d9);}
.fm-packet{fill:var(--accent,#a78bfa);filter:drop-shadow(0 0 4px var(--primary,#7c3aed));}
.fm-glow{fill:var(--primary,#7c3aed);opacity:.25;}
@media (prefers-reduced-motion: reduce){ .flowmap .fm-packet, .flowmap .fm-glow{display:none;} }
`;

const GEO = { W: 1000, Y: 66, R: 30, X0: 70, X1: 930, LBL_Y: 128 };

export function initFlowMaps() {
    const maps = Array.from(document.querySelectorAll('.flowmap[data-flow]'));
    if (!maps.length) return;
    injectStyle('fn-flowmap-css', CSS);
    maps.forEach((el, i) => build(el, i));
}

function build(el, index) {
    if (el.getAttribute('data-flow-ready') === '1') return;
    const stages = (el.getAttribute('data-flow') || '')
        .split(',').map((s) => s.trim()).filter(Boolean)
        .map((s) => {
            const [label, icon] = s.split('|').map((x) => (x || '').trim());
            return { label, icon: icon || '' };
        });
    if (stages.length < 2) return;

    const n = stages.length;
    const title = el.getAttribute('data-flow-title') || '';
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const span = (GEO.X1 - GEO.X0) / (n - 1);
    const xAt = (i) => GEO.X0 + span * i;

    // Connecting track (behind the nodes).
    const line = `<path class="fm-line" d="M${GEO.X0} ${GEO.Y} H${GEO.X1}"/>`;

    // Direction arrows sitting between consecutive nodes.
    let arrows = '';
    for (let i = 0; i < n - 1; i++) {
        const mx = (xAt(i) + xAt(i + 1)) / 2;
        arrows += `<path class="fm-arrow" d="M${mx - 5} ${GEO.Y - 6} L${mx + 6} ${GEO.Y} L${mx - 5} ${GEO.Y + 6} Z"/>`;
    }

    // Nodes with an icon inside and a label below.
    const nodes = stages.map((st, i) => {
        const x = xAt(i);
        const above = false; // labels below keeps it clean on one row
        return `
            <g>
                <circle class="fm-node" cx="${x}" cy="${GEO.Y}" r="${GEO.R}"/>
                ${st.icon ? `<text class="fm-ico" x="${x}" y="${GEO.Y + 7}" text-anchor="middle">${st.icon}</text>` : ''}
                <text class="fm-lbl" x="${x}" y="${GEO.LBL_Y}" text-anchor="middle">${escapeText(st.label)}</text>
            </g>`;
    }).join('');

    // The traveling packet (glow + core), looping along the whole track.
    const dur = Math.max(3, n * 0.9).toFixed(1);
    const packet = reduce ? '' : `
        <circle class="fm-glow" r="11">
            <animateMotion dur="${dur}s" repeatCount="indefinite" path="M${GEO.X0} ${GEO.Y} H${GEO.X1}"/>
        </circle>
        <circle class="fm-packet" r="6">
            <animateMotion dur="${dur}s" repeatCount="indefinite" path="M${GEO.X0} ${GEO.Y} H${GEO.X1}"/>
        </circle>`;

    const label = title || 'Flow diagram';
    el.innerHTML =
        (title ? `<p class="flowmap__title">${escapeText(title)}</p>` : '') +
        `<svg viewBox="0 0 ${GEO.W} 150" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeAttr(label)}: ${stages.map((s) => escapeAttr(s.label)).join(', then ')}.">
            ${line}${arrows}${packet}${nodes}
        </svg>`;
    el.setAttribute('data-flow-ready', '1');
}

function escapeText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
    return escapeText(s).replace(/"/g, '&quot;');
}
function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
}
