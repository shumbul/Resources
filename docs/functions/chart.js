/*
 * Lightweight, dependency-free SVG charts.
 *
 * Usage (same convention as quiz.js and flow.js: a container plus an
 * inline JSON payload):
 *
 *   <div class="chartblock" data-chart-title="Demand vs entry difficulty">
 *       <script type="application/json">
 *       { "type": "scatter", ... }
 *       </script>
 *   </div>
 *
 * Charts are drawn as inline SVG (no image weight, scales to any screen,
 * follows the active theme) and animate in when scrolled into view.
 * Everything degrades gracefully: if JS never runs, the neighbouring
 * table or list still carries the same information.
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
let uid = 0;

function injectCss() {
    if (cssInjected) return;
    cssInjected = true;
    const css = `
.chartblock{margin:24px 0;padding:18px 18px 14px;border:1px solid var(--border);
  border-radius:var(--radius);background:var(--bg-primary);box-shadow:var(--shadow)}
.chartblock .ch-head{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;
  justify-content:space-between;margin-bottom:6px}
.chartblock .ch-title{font-family:var(--font-display);font-weight:700;
  font-size:1.02rem;color:var(--text-primary);margin:0}
.chartblock .ch-note{font-size:.82rem;color:var(--text-secondary);margin:0}
.chartblock svg{display:block;width:100%;height:auto;overflow:visible}
.chartblock .ch-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:10px}
.chartblock .ch-key{display:inline-flex;align-items:center;gap:6px;
  font-size:.8rem;color:var(--text-secondary);background:none;border:0;
  padding:2px 4px;cursor:pointer;border-radius:6px;font-family:inherit}
.chartblock .ch-key:hover,.chartblock .ch-key:focus-visible{color:var(--text-primary);
  background:var(--bg-secondary)}
.chartblock .ch-key[aria-pressed="false"]{opacity:.38}
.chartblock .ch-swatch{width:10px;height:10px;border-radius:50%;flex:none}
.ch-grid{stroke:var(--border);stroke-width:1}
.ch-axis{fill:var(--text-secondary);font-size:11px;font-family:var(--font-sans)}
.ch-axislabel{fill:var(--text-secondary);font-size:11px;font-weight:600;
  font-family:var(--font-sans);letter-spacing:.04em;text-transform:uppercase}
.ch-quad{fill:var(--primary);opacity:.05}
.ch-quadtext{fill:var(--text-secondary);font-size:10px;font-weight:600;
  font-family:var(--font-sans);opacity:.75}
.ch-dot{cursor:default;transition:r .18s ease}
.ch-dot circle{stroke:var(--bg-primary);stroke-width:2}
.ch-dot text{fill:var(--text-primary);font-size:10.5px;font-family:var(--font-sans)}
.ch-dot:hover circle,.ch-dot:focus-visible circle{stroke:var(--text-primary)}
.ch-hidden{opacity:.06;pointer-events:none}
.ch-bar rect{rx:5}
.ch-barlabel{fill:var(--text-primary);font-size:11.5px;font-family:var(--font-sans)}
.ch-barvalue{fill:var(--text-secondary);font-size:11px;font-weight:600;
  font-family:var(--font-sans)}
.chartblock[data-anim="in"] .ch-dot{animation:chPop .5s cubic-bezier(.34,1.56,.64,1) both}
.chartblock[data-anim="in"] .ch-bar rect{animation:chGrow .7s cubic-bezier(.22,1,.36,1) both;
  transform-origin:left center}
@keyframes chPop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
@keyframes chGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.ch-dot{transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion: reduce){
  .chartblock[data-anim="in"] .ch-dot,
  .chartblock[data-anim="in"] .ch-bar rect{animation:none}
}
@media (max-width:640px){
  .chartblock{padding:14px 12px 12px}
  .ch-dot text{font-size:9px}
}`;
    const el = document.createElement('style');
    el.setAttribute('data-chart-css', '');
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

function readPayload(host) {
    const tag = host.querySelector('script[type="application/json"]');
    if (!tag) return null;
    try {
        return JSON.parse(tag.textContent);
    } catch (err) {
        console.warn('[chart] bad JSON payload:', err);
        return null;
    }
}

/* ---------------------------------------------------------------- scatter */

function drawScatter(cfg) {
    const W = 720;
    const H = 430;
    const pad = { t: 16, r: 58, b: 48, l: 62 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;

    const xTicks = cfg.x.ticks;
    const yTicks = cfg.y.ticks;
    const svg = svgEl('svg', {
        viewBox: `0 0 ${W} ${H}`,
        role: 'img',
        'aria-label': cfg.alt || cfg.title || 'Chart',
    });

    // Position ticks at slot centres so points never sit on an axis line.
    const xAt = (i) => pad.l + (plotW / xTicks.length) * (i + 0.5);
    const yAt = (i) => pad.t + plotH - (plotH / yTicks.length) * (i + 0.5);

    // Highlight the "sweet spot" quadrant (easy entry, high demand) when asked.
    if (cfg.highlight) {
        const h = cfg.highlight;
        svg.appendChild(svgEl('rect', {
            class: 'ch-quad',
            x: pad.l + (plotW / xTicks.length) * h.x0,
            y: pad.t + plotH - (plotH / yTicks.length) * h.y1,
            width: (plotW / xTicks.length) * (h.x1 - h.x0),
            height: (plotH / yTicks.length) * (h.y1 - h.y0),
        }));
        if (h.label) {
            const t = svgEl('text', {
                class: 'ch-quadtext',
                x: pad.l + (plotW / xTicks.length) * h.x0 + 8,
                y: pad.t + plotH - (plotH / yTicks.length) * h.y1 + 16,
            });
            t.textContent = h.label;
            svg.appendChild(t);
        }
    }

    // Grid + tick labels.
    yTicks.forEach((label, i) => {
        const y = pad.t + plotH - (plotH / yTicks.length) * (i + 1);
        svg.appendChild(svgEl('line', {
            class: 'ch-grid', x1: pad.l, x2: W - pad.r, y1: y, y2: y,
        }));
        const t = svgEl('text', {
            class: 'ch-axis', x: pad.l - 10, y: yAt(i) + 4, 'text-anchor': 'end',
        });
        t.textContent = label;
        svg.appendChild(t);
    });
    svg.appendChild(svgEl('line', {
        class: 'ch-grid', x1: pad.l, x2: W - pad.r,
        y1: pad.t + plotH, y2: pad.t + plotH,
    }));
    svg.appendChild(svgEl('line', {
        class: 'ch-grid', x1: pad.l, x2: pad.l, y1: pad.t, y2: pad.t + plotH,
    }));

    xTicks.forEach((label, i) => {
        const t = svgEl('text', {
            class: 'ch-axis', x: xAt(i), y: pad.t + plotH + 20, 'text-anchor': 'middle',
        });
        t.textContent = label;
        svg.appendChild(t);
    });

    if (cfg.x.label) {
        const t = svgEl('text', {
            class: 'ch-axislabel', x: pad.l + plotW / 2,
            y: H - 8, 'text-anchor': 'middle',
        });
        t.textContent = cfg.x.label;
        svg.appendChild(t);
    }
    if (cfg.y.label) {
        const t = svgEl('text', {
            class: 'ch-axislabel', x: 14, y: pad.t + plotH / 2,
            'text-anchor': 'middle',
            transform: `rotate(-90 14 ${pad.t + plotH / 2})`,
        });
        t.textContent = cfg.y.label;
        svg.appendChild(t);
    }

    // Group points that land on the same slot so labels do not overlap.
    const groups = new Map();
    cfg.points.forEach((p) => {
        const key = `${p.x}|${p.y}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(p);
    });

    const families = cfg.series.map((s) => s.name);
    const colorOf = (name) => {
        const i = families.indexOf(name);
        const s = cfg.series[i];
        return (s && s.color) || PALETTE[i % PALETTE.length] || 'var(--primary)';
    };

    let n = 0;
    groups.forEach((pts) => {
        const cols = pts.length > 3 ? 2 : 1;
        pts.forEach((p, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const rows = Math.ceil(pts.length / cols);
            const cx = xAt(p.x) + (cols > 1 ? (col - 0.5) * 116 : 0);
            const cy = yAt(p.y) + (row - (rows - 1) / 2) * 21;

            const g = svgEl('g', {
                class: 'ch-dot',
                'data-group': p.g,
                tabindex: '0',
                role: 'listitem',
                style: `animation-delay:${Math.min(n, 24) * 26}ms`,
            });
            const title = svgEl('title');
            title.textContent =
                `${p.label} — ${cfg.y.ticks[p.y]} demand, ${cfg.x.ticks[p.x]} entry`;
            g.appendChild(title);
            g.appendChild(svgEl('circle', {
                cx, cy, r: 5.5, fill: colorOf(p.g),
            }));
            const label = svgEl('text', { x: cx + 10, y: cy + 3.5 });
            label.textContent = p.label;
            g.appendChild(label);
            svg.appendChild(g);
            n++;
        });
    });

    return svg;
}

/* ------------------------------------------------------------------- bars */

function drawBars(cfg) {
    const rows = cfg.bars;
    const rowH = 30;
    const W = 720;
    const labelW = cfg.labelWidth || 190;
    const pad = { t: 8, r: 54, b: 8, l: labelW };
    const H = pad.t + pad.b + rows.length * rowH;
    const plotW = W - pad.l - pad.r;
    const max = Math.max(...rows.map((r) => r.value)) || 1;

    const svg = svgEl('svg', {
        viewBox: `0 0 ${W} ${H}`,
        role: 'img',
        'aria-label': cfg.alt || cfg.title || 'Chart',
    });

    rows.forEach((r, i) => {
        const y = pad.t + i * rowH;
        const w = Math.max(2, (r.value / max) * plotW);
        const color = r.color || PALETTE[i % PALETTE.length];

        const label = svgEl('text', {
            class: 'ch-barlabel', x: pad.l - 12, y: y + rowH / 2 + 4,
            'text-anchor': 'end',
        });
        label.textContent = r.label;
        svg.appendChild(label);

        const g = svgEl('g', {
            class: 'ch-bar',
            style: `animation-delay:${i * 55}ms`,
        });
        const bg = svgEl('rect', {
            x: pad.l, y: y + 6, width: plotW, height: rowH - 14,
            fill: 'var(--bg-tertiary)', rx: 5,
        });
        svg.appendChild(bg);
        const bar = svgEl('rect', {
            x: pad.l, y: y + 6, width: w, height: rowH - 14, fill: color,
            style: `animation-delay:${i * 55}ms`,
        });
        const title = svgEl('title');
        title.textContent = `${r.label}: ${r.display || r.value}`;
        bar.appendChild(title);
        g.appendChild(bar);
        svg.appendChild(g);

        const val = svgEl('text', {
            class: 'ch-barvalue', x: pad.l + w + 8, y: y + rowH / 2 + 4,
        });
        val.textContent = r.display || r.value;
        svg.appendChild(val);
    });

    return svg;
}

/* ------------------------------------------------------------------ mount */

function buildLegend(cfg, host, svg) {
    if (!cfg.series || cfg.series.length < 2) return null;
    const wrap = document.createElement('div');
    wrap.className = 'ch-legend';
    cfg.series.forEach((s, i) => {
        const color = s.color || PALETTE[i % PALETTE.length];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ch-key';
        btn.setAttribute('aria-pressed', 'true');
        btn.innerHTML =
            `<span class="ch-swatch" style="background:${color}"></span>` +
            `<span></span>`;
        btn.lastElementChild.textContent = s.name;
        btn.addEventListener('click', () => {
            const on = btn.getAttribute('aria-pressed') === 'true';
            btn.setAttribute('aria-pressed', on ? 'false' : 'true');
            svg.querySelectorAll(`.ch-dot[data-group="${CSS.escape(s.name)}"]`)
                .forEach((d) => d.classList.toggle('ch-hidden', on));
        });
        wrap.appendChild(btn);
    });
    return wrap;
}

/*
 * Wrap the drawing in a sideways scroller. On phones the SVG keeps a
 * readable minimum width (see theme-variables.css) instead of shrinking
 * its text to nothing, so the region becomes scrollable and therefore
 * needs to be reachable by keyboard.
 */
function scroller(svg, label) {
    const box = document.createElement('div');
    box.className = 'viz-scroll';
    box.tabIndex = 0;
    box.setAttribute('role', 'group');
    if (label) box.setAttribute('aria-label', label);
    box.appendChild(svg);
    return box;
}

/* Only shown on the narrow screens where the visual actually scrolls. */
function scrollHint(what) {
    const p = document.createElement('p');
    p.className = 'viz-hint';
    p.textContent = `Scroll sideways to see the whole ${what}.`;
    return p;
}

function render(host) {
    if (host.dataset.chartReady) return;
    const cfg = readPayload(host);
    if (!cfg) return;
    host.dataset.chartReady = '1';

    const title = host.dataset.chartTitle || cfg.title;
    const head = document.createElement('div');
    head.className = 'ch-head';
    if (title) {
        const h = document.createElement('p');
        h.className = 'ch-title';
        h.textContent = title;
        head.appendChild(h);
    }
    if (cfg.note) {
        const n = document.createElement('p');
        n.className = 'ch-note';
        n.textContent = cfg.note;
        head.appendChild(n);
    }

    let svg;
    if (cfg.type === 'bar') svg = drawBars(cfg);
    else svg = drawScatter(cfg);

    const id = `chart-${++uid}`;
    svg.setAttribute('id', id);
    if (head.childElementCount) host.appendChild(head);
    host.appendChild(scroller(svg, cfg.alt || title));
    host.appendChild(scrollHint('chart'));

    const legend = buildLegend(cfg, host, svg);
    if (legend) host.appendChild(legend);

    // Animate once, when it actually comes into view.
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

export function initCharts() {
    const hosts = document.querySelectorAll('.chartblock');
    if (!hosts.length) return;
    injectCss();
    hosts.forEach((h) => {
        try { render(h); } catch (err) { console.warn('[chart] render failed:', err); }
    });
}

export default initCharts;
