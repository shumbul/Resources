/*
 * Inline SVG explainer diagrams.
 *
 * Two shapes, both driven by an inline JSON payload just like chart.js:
 *
 *   "stack" -> labelled layers stacked top to bottom, each with a short
 *              note on the right. Good for "anatomy of X" explainers.
 *   "loop"  -> nodes arranged on a circle with arrows between them.
 *              Good for cycles: plan, act, observe, repeat.
 *
 * The diagrams are decorative reinforcements of text that is already on
 * the page, so they are marked role="img" with a plain-language label
 * and never carry information that exists nowhere else.
 */

const PALETTE = [
    'var(--primary)',
    '#0ea5e9',
    '#059669',
    '#d97706',
    '#db2777',
    '#7c3aed',
];

let cssInjected = false;

function injectCss() {
    if (cssInjected) return;
    cssInjected = true;
    const css = `
.diagram{margin:24px 0;padding:18px 18px 14px;border:1px solid var(--border);
  border-radius:var(--radius);background:var(--bg-primary);box-shadow:var(--shadow)}
.diagram .dg-title{font-family:var(--font-display);font-weight:700;font-size:1.02rem;
  color:var(--text-primary);margin:0 0 4px}
.diagram .dg-note{font-size:.82rem;color:var(--text-secondary);margin:0 0 10px}
.diagram svg{display:block;width:100%;height:auto;overflow:visible}
.dg-box{fill:var(--bg-secondary);stroke:var(--border);stroke-width:1.5}
.dg-label{fill:var(--text-primary);font-size:13px;font-weight:600;
  font-family:var(--font-sans)}
.dg-sub{fill:var(--text-secondary);font-size:11px;font-family:var(--font-sans)}
.dg-side{fill:var(--text-secondary);font-size:11.5px;font-family:var(--font-sans)}
.dg-num{fill:#fff;font-size:11px;font-weight:700;font-family:var(--font-sans)}
.dg-arrow{stroke:var(--text-secondary);stroke-width:1.6;fill:none;opacity:.55}
.dg-center{fill:var(--text-primary);font-size:12.5px;font-weight:700;
  font-family:var(--font-display)}
.dg-centersub{fill:var(--text-secondary);font-size:10.5px;font-family:var(--font-sans)}
.dg-node{cursor:default}
.dg-node:hover .dg-box,.dg-node:focus-visible .dg-box{stroke:var(--primary);
  stroke-width:2.2}
.diagram[data-anim="in"] .dg-node{animation:dgIn .55s cubic-bezier(.22,1,.36,1) both}
.diagram[data-anim="in"] .dg-arrow{animation:dgDraw 1.1s ease both;
  stroke-dasharray:var(--dgl,200);stroke-dashoffset:var(--dgl,200)}
@keyframes dgIn{from{opacity:0;transform:translateY(10px)}
  to{opacity:1;transform:translateY(0)}}
@keyframes dgDraw{to{stroke-dashoffset:0}}
.dg-node{transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion: reduce){
  .diagram[data-anim="in"] .dg-node{animation:none}
  .diagram[data-anim="in"] .dg-arrow{animation:none;stroke-dashoffset:0}
}
@media (max-width:640px){
  .diagram{padding:14px 12px 12px}
  .dg-side{font-size:10px}
}`;
    const el = document.createElement('style');
    el.setAttribute('data-diagram-css', '');
    el.textContent = css;
    document.head.appendChild(el);
}

function svgEl(name, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const k in attrs) {
        if (attrs[k] !== undefined && attrs[k] !== null) el.setAttribute(k, attrs[k]);
    }
    return el;
}

function text(cls, x, y, str, extra) {
    const t = svgEl('text', Object.assign({ class: cls, x, y }, extra || {}));
    t.textContent = str;
    return t;
}

/* Wrap a long note into at most `max` lines of roughly `perLine` chars. */
function wrap(str, perLine, max) {
    const words = String(str).split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
        if ((cur + ' ' + w).trim().length > perLine && cur) {
            lines.push(cur);
            cur = w;
            if (lines.length === max) break;
        } else {
            cur = (cur + ' ' + w).trim();
        }
    }
    if (cur && lines.length < max) lines.push(cur);
    return lines;
}

/* ------------------------------------------------------------------ stack */

function drawStack(cfg) {
    const layers = cfg.layers;
    const W = 720;
    const boxW = cfg.notes === false ? 660 : 330;
    const rowH = 62;
    const gap = 10;
    const H = 10 + layers.length * (rowH + gap);

    const svg = svgEl('svg', {
        viewBox: `0 0 ${W} ${H}`,
        role: 'img',
        'aria-label': cfg.alt || cfg.title || 'Diagram',
    });

    layers.forEach((l, i) => {
        const y = 6 + i * (rowH + gap);
        const color = l.color || PALETTE[i % PALETTE.length];
        const g = svgEl('g', {
            class: 'dg-node', tabindex: '0',
            style: `animation-delay:${i * 70}ms`,
        });
        const title = svgEl('title');
        title.textContent = l.note ? `${l.label}: ${l.note}` : l.label;
        g.appendChild(title);

        g.appendChild(svgEl('rect', {
            class: 'dg-box', x: 34, y, width: boxW, height: rowH, rx: 12,
        }));
        // Colour spine on the left edge of each layer.
        g.appendChild(svgEl('rect', {
            x: 34, y, width: 5, height: rowH, rx: 2.5, fill: color,
        }));
        g.appendChild(svgEl('circle', { cx: 16, cy: y + rowH / 2, r: 13, fill: color }));
        g.appendChild(text('dg-num', 16, y + rowH / 2 + 4, String(i + 1), {
            'text-anchor': 'middle',
        }));
        g.appendChild(text('dg-label', 54, y + (l.sub ? 26 : rowH / 2 + 5), l.label));
        if (l.sub) g.appendChild(text('dg-sub', 54, y + 44, l.sub));

        if (l.note && cfg.notes !== false) {
            const lines = wrap(l.note, 46, 3);
            const startY = y + rowH / 2 - ((lines.length - 1) * 15) / 2 + 4;
            lines.forEach((line, li) => {
                g.appendChild(text('dg-side', boxW + 54, startY + li * 15, line));
            });
        }
        svg.appendChild(g);
    });

    return svg;
}

/* ------------------------------------------------------------------- loop */

function drawLoop(cfg) {
    const nodes = cfg.nodes;
    const W = 720;
    const H = 430;
    const cx = W / 2;
    const cy = H / 2;
    const R = 146;
    const boxW = 200;
    const boxH = 58;

    const svg = svgEl('svg', {
        viewBox: `0 0 ${W} ${H}`,
        role: 'img',
        'aria-label': cfg.alt || cfg.title || 'Diagram',
    });

    const defs = svgEl('defs');
    const marker = svgEl('marker', {
        id: 'dg-head', viewBox: '0 0 10 10', refX: '8', refY: '5',
        markerWidth: '5', markerHeight: '5', orient: 'auto',
    });
    marker.appendChild(svgEl('path', {
        d: 'M 0 0.5 L 9 5 L 0 9.5 z', fill: 'var(--text-secondary)', opacity: '.55',
    }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Start at the top and go clockwise. The horizontal spread is stretched
    // so the wide boxes on the left and right still clear the centre label.
    const at = (i) => {
        const a = -Math.PI / 2 + (i / nodes.length) * Math.PI * 2;
        return { x: cx + R * Math.cos(a) * 1.44, y: cy + R * Math.sin(a) };
    };

    /*
     * Walk out from a node centre until we leave its box, so the connector
     * starts and ends on the box edge. Without this the line runs all the
     * way to the centre and the arrowhead is painted over by the box.
     */
    const edge = (from, dx, dy, gap) => {
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const tx = Math.abs(ux) < 1e-6 ? Infinity : (boxW / 2) / Math.abs(ux);
        const ty = Math.abs(uy) < 1e-6 ? Infinity : (boxH / 2) / Math.abs(uy);
        return { x: from.x + ux * (Math.min(tx, ty) + gap),
                 y: from.y + uy * (Math.min(tx, ty) + gap) };
    };

    // Arrows first so the boxes paint over any remaining stub.
    nodes.forEach((_, i) => {
        const p = at(i);
        const q = at((i + 1) % nodes.length);
        const mx = (p.x + q.x) / 2;
        const my = (p.y + q.y) / 2;
        // Bow the connector outwards, away from the centre.
        const bx = mx + (mx - cx) * 0.2;
        const by = my + (my - cy) * 0.2;

        const start = edge(p, bx - p.x, by - p.y, 7);
        const end = edge(q, bx - q.x, by - q.y, 10);

        svg.appendChild(svgEl('path', {
            class: 'dg-arrow',
            d: `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} ` +
               `Q ${bx.toFixed(1)} ${by.toFixed(1)} ` +
               `${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
            'marker-end': 'url(#dg-head)',
            style: `--dgl:420;animation-delay:${i * 90}ms`,
        }));
    });

    if (cfg.center) {
        svg.appendChild(text('dg-center', cx, cy - 2, cfg.center, {
            'text-anchor': 'middle',
        }));
        if (cfg.centerSub) {
            wrap(cfg.centerSub, 30, 2).forEach((line, i) => {
                svg.appendChild(text('dg-centersub', cx, cy + 16 + i * 14, line, {
                    'text-anchor': 'middle',
                }));
            });
        }
    }

    nodes.forEach((n, i) => {
        const p = at(i);
        const color = n.color || PALETTE[i % PALETTE.length];
        const g = svgEl('g', {
            class: 'dg-node', tabindex: '0',
            style: `animation-delay:${i * 80}ms`,
        });
        const title = svgEl('title');
        title.textContent = n.sub ? `${n.label}: ${n.sub}` : n.label;
        g.appendChild(title);

        const x = p.x - boxW / 2;
        const y = p.y - boxH / 2;
        g.appendChild(svgEl('rect', {
            class: 'dg-box', x, y, width: boxW, height: boxH, rx: 12,
        }));
        g.appendChild(svgEl('rect', {
            x, y, width: 5, height: boxH, rx: 2.5, fill: color,
        }));
        g.appendChild(text('dg-label', x + 16, y + (n.sub ? 24 : boxH / 2 + 5), n.label));
        if (n.sub) {
            g.appendChild(text('dg-sub', x + 16, y + 42, n.sub));
        }
        svg.appendChild(g);
    });

    return svg;
}

/* ------------------------------------------------------------------ mount */

function render(host) {
    if (host.dataset.diagramReady) return;
    const tag = host.querySelector('script[type="application/json"]');
    if (!tag) return;
    let cfg;
    try {
        cfg = JSON.parse(tag.textContent);
    } catch (err) {
        console.warn('[diagram] bad JSON payload:', err);
        return;
    }
    host.dataset.diagramReady = '1';

    const title = host.dataset.diagramTitle || cfg.title;
    if (title) {
        const h = document.createElement('p');
        h.className = 'dg-title';
        h.textContent = title;
        host.appendChild(h);
    }
    if (cfg.note) {
        const n = document.createElement('p');
        n.className = 'dg-note';
        n.textContent = cfg.note;
        host.appendChild(n);
    }

    const svg = cfg.type === 'loop' ? drawLoop(cfg) : drawStack(cfg);

    // On phones the SVG keeps a readable minimum width (see
    // theme-variables.css) and scrolls sideways rather than shrinking its
    // text to nothing, so the region has to be keyboard reachable.
    const box = document.createElement('div');
    box.className = 'viz-scroll';
    box.tabIndex = 0;
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', cfg.alt || title || 'Diagram');
    box.appendChild(svg);
    host.appendChild(box);

    // Only shown on the narrow screens where the visual actually scrolls.
    const hint = document.createElement('p');
    hint.className = 'viz-hint';
    hint.textContent = 'Scroll sideways to see the whole diagram.';
    host.appendChild(hint);

    if (!('IntersectionObserver' in window)) {
        host.dataset.anim = 'in';
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            host.dataset.anim = 'in';
            io.disconnect();
        });
    }, { threshold: 0.15 });
    io.observe(host);
}

export function initDiagrams() {
    const hosts = document.querySelectorAll('.diagram');
    if (!hosts.length) return;
    injectCss();
    hosts.forEach((h) => {
        try { render(h); } catch (err) { console.warn('[diagram] render failed:', err); }
    });
}

export default initDiagrams;
