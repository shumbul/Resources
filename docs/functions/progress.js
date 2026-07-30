/* Generic checklist progress tracker.
 * Auto-detects roadmap-style sections (weeks or months), adds a sticky
 * progress bar + a per-item "done" toggle, and remembers state in localStorage.
 * No-op on pages that have no such sections. */

const CSS = `
.fn-progress{position:sticky;top:60px;z-index:50;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;
    margin:0 0 2rem;padding:1rem 1.25rem;background:var(--glass-bg, rgba(255,255,255,.7));backdrop-filter:blur(10px);
    border:1px solid var(--border,#e5e7eb);border-radius:var(--radius,16px);box-shadow:var(--shadow);}
.fn-progress .lbl{font-weight:700;font-family:var(--font-display,inherit);white-space:nowrap;}
.fn-progress .bar{flex:1;min-width:160px;height:10px;border-radius:999px;background:var(--bg-tertiary,#f1f5f9);overflow:hidden;}
.fn-progress .fill{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,var(--primary,#8b5cf6),var(--accent,#a78bfa));transition:width .35s ease;}
.fn-progress .cnt{font-variant-numeric:tabular-nums;color:var(--text-secondary,#666);font-weight:600;white-space:nowrap;}
.fn-progress .rst{border:1px solid var(--border,#e5e7eb);background:var(--bg-primary,#fff);color:var(--text-secondary,#666);
    border-radius:999px;padding:.4rem .8rem;cursor:pointer;font-size:.85rem;}
.fn-progress .rst:hover{color:var(--primary,#8b5cf6);border-color:var(--primary,#8b5cf6);}
.fn-toggle{margin-top:.8rem;display:inline-flex;align-items:center;gap:.5rem;border:1.5px solid var(--border,#e5e7eb);
    background:var(--bg-primary,#fff);color:var(--text-secondary,#666);border-radius:999px;padding:.45rem .9rem;cursor:pointer;
    font-weight:600;font-size:.9rem;transition:all .2s ease;}
.fn-toggle:hover{border-color:var(--primary,#8b5cf6);color:var(--primary,#8b5cf6);}
.fn-item-done .fn-toggle{background:var(--success,#059669);border-color:var(--success,#059669);color:#fff;}
@media (prefers-reduced-motion: reduce){.fn-progress .fill{transition:none;}}
`;

const CONFIGS = [
    { sel: '.week-section', head: '.week-header', unit: 'weeks', key: 'progress_weeks_v1' },
    { sel: '.month-section', head: '.month-header', unit: 'months', key: 'progress_months_v1' },
];

export function initProgress() {
    const cfg = CONFIGS.find((c) => document.querySelector(c.sel));
    if (!cfg) return;
    const items = Array.from(document.querySelectorAll(cfg.sel));
    if (items.length < 2) return;
    if (document.querySelector('.fn-progress')) return;

    if (!document.getElementById('fn-progress-css')) {
        const s = document.createElement('style');
        s.id = 'fn-progress-css';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    let done = {};
    try { done = JSON.parse(localStorage.getItem(cfg.key) || '{}'); } catch { done = {}; }

    const panel = document.createElement('div');
    panel.className = 'fn-progress';
    panel.innerHTML =
        '<span class="lbl">Your progress</span>' +
        '<div class="bar"><div class="fill"></div></div>' +
        '<span class="cnt"></span>' +
        '<button class="rst" type="button">Reset</button>';
    items[0].parentNode.insertBefore(panel, items[0]);
    const fill = panel.querySelector('.fill');
    const cnt = panel.querySelector('.cnt');

    function render() {
        let n = 0;
        items.forEach((sec, i) => {
            const isDone = !!done[i];
            sec.classList.toggle('fn-item-done', isDone);
            const btn = sec.querySelector('.fn-toggle');
            if (btn) btn.textContent = isDone ? '✓ Completed' : 'Mark ' + cfg.unit.replace(/s$/, '') + ' done';
            if (isDone) n++;
        });
        const pct = Math.round((n / items.length) * 100);
        fill.style.width = pct + '%';
        cnt.textContent = n + ' / ' + items.length + ' ' + cfg.unit + ' (' + pct + '%)';
    }

    items.forEach((sec, i) => {
        const header = sec.querySelector(cfg.head) || sec;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fn-toggle';
        btn.addEventListener('click', () => {
            done[i] = !done[i];
            localStorage.setItem(cfg.key, JSON.stringify(done));
            render();
        });
        header.appendChild(btn);
    });

    panel.querySelector('.rst').addEventListener('click', () => {
        done = {}; localStorage.setItem(cfg.key, JSON.stringify(done)); render();
    });

    render();
}
