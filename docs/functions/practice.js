/* Reusable practice widgets: a countdown timer and a random-question picker.
 *
 * Both are opt-in via simple markup, so any page (STAR, Interview Prep, ...) can
 * add real rehearsal tools with no custom JS.
 *
 * 1) Practice timer:
 *    <div class="practice-timer" data-seconds="90"></div>
 *    Renders a big MM:SS readout with Start / Pause / Reset and a shrinking bar.
 *    Beeps softly (WebAudio, no asset) and flashes when time is up.
 *
 * 2) Random question picker: point it at a list of questions on the page.
 *    <div class="practice-picker" data-source="#star-practice-list"></div>
 *    Shows one random <li> from that list at a time, with a "Next question"
 *    button and a progress counter, so people rehearse instead of skimming.
 *
 * Idempotent. Respects prefers-reduced-motion for the flash.
 */

const CSS = `
.practice-timer{background:var(--bg-primary,#fff);border:1px solid var(--border,#e5e7eb);
    border-radius:14px;padding:1.1rem 1.25rem;margin:1rem 0;text-align:center;}
.pt-time{font-family:var(--font-display,ui-monospace,monospace);font-weight:700;font-variant-numeric:tabular-nums;
    font-size:2.6rem;line-height:1;color:var(--text-primary,#111);letter-spacing:.02em;}
.pt-time.warn{color:#b45309;} .pt-time.done{color:#b3261e;}
.pt-bar{height:8px;border-radius:999px;background:var(--bg-tertiary,#eef1f8);overflow:hidden;margin:.7rem 0 .9rem;}
.pt-bar span{display:block;height:100%;width:100%;border-radius:999px;
    background:linear-gradient(90deg,var(--primary,#7c3aed),var(--secondary,#6d28d9));transition:width 1s linear;}
.pt-actions{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;}
.pt-btn{border:none;border-radius:999px;padding:.5rem 1.1rem;font-weight:700;cursor:pointer;font-size:.9rem;
    color:#fff;background:linear-gradient(135deg,var(--primary,#7c3aed),var(--secondary,#6d28d9));}
.pt-btn.ghost{background:var(--bg-secondary,#f1f5f9);color:var(--text-secondary,#475569);border:1px solid var(--border,#e5e7eb);}
.pt-hint{color:var(--text-secondary,#666);font-size:.82rem;margin:.55rem 0 0;}
.practice-timer.flash{animation:ptFlash .5s ease 2;}
@keyframes ptFlash{0%,100%{background:var(--bg-primary,#fff);}50%{background:#fee2e2;}}
@media (prefers-reduced-motion: reduce){ .practice-timer.flash{animation:none;} .pt-bar span{transition:none;} }

.practice-picker{background:var(--bg-primary,#fff);border:1px solid var(--border,#e5e7eb);
    border-left:4px solid var(--primary,#7c3aed);border-radius:14px;padding:1.15rem 1.3rem;margin:1rem 0;}
.pp-label{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--primary,#7c3aed);margin:0 0 .35rem;}
.pp-q{font-size:1.15rem;font-weight:600;color:var(--text-primary,#111);margin:0 0 .9rem;min-height:2.4em;
    display:flex;align-items:center;font-family:var(--font-display,inherit);}
.pp-actions{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;}
.pp-btn{border:none;border-radius:999px;padding:.5rem 1.1rem;font-weight:700;cursor:pointer;font-size:.9rem;
    color:#fff;background:linear-gradient(135deg,var(--primary,#7c3aed),var(--secondary,#6d28d9));}
.pp-count{color:var(--text-secondary,#666);font-size:.85rem;font-variant-numeric:tabular-nums;}
`;

export function initPractice() {
    const timers = Array.from(document.querySelectorAll('.practice-timer'));
    const pickers = Array.from(document.querySelectorAll('.practice-picker'));
    if (!timers.length && !pickers.length) return;
    injectStyle('fn-practice-css', CSS);
    timers.forEach(buildTimer);
    pickers.forEach(buildPicker);
}

function buildTimer(root) {
    if (root.getAttribute('data-practice-ready') === '1') return;
    const total = Math.max(5, parseInt(root.getAttribute('data-seconds'), 10) || 90);
    root.innerHTML =
        `<div class="pt-time">${fmt(total)}</div>
        <div class="pt-bar"><span></span></div>
        <div class="pt-actions">
            <button type="button" class="pt-btn start">Start</button>
            <button type="button" class="pt-btn ghost reset">Reset</button>
        </div>
        <p class="pt-hint">Answer out loud before it hits zero. Aim to finish with a few seconds to spare.</p>`;

    const timeEl = root.querySelector('.pt-time');
    const bar = root.querySelector('.pt-bar span');
    const startBtn = root.querySelector('.start');
    const resetBtn = root.querySelector('.reset');

    let left = total, id = null, running = false;

    function paint() {
        timeEl.textContent = fmt(left);
        bar.style.width = (left / total * 100) + '%';
        timeEl.classList.toggle('warn', left <= 15 && left > 5);
        timeEl.classList.toggle('done', left <= 5);
    }
    function stop() { clearInterval(id); id = null; running = false; startBtn.textContent = left < total ? 'Resume' : 'Start'; }
    function tick() {
        left--;
        paint();
        if (left <= 0) {
            stop(); startBtn.textContent = 'Start'; left = total;
            beep();
            if (!reduceMotion()) { root.classList.add('flash'); setTimeout(() => root.classList.remove('flash'), 1100); }
            setTimeout(paint, 1100);
        }
    }
    startBtn.addEventListener('click', () => {
        if (running) { stop(); startBtn.textContent = 'Resume'; return; }
        running = true; startBtn.textContent = 'Pause';
        id = setInterval(tick, 1000);
    });
    resetBtn.addEventListener('click', () => { stop(); left = total; startBtn.textContent = 'Start'; paint(); });

    paint();
    root.setAttribute('data-practice-ready', '1');
}

function buildPicker(root) {
    if (root.getAttribute('data-practice-ready') === '1') return;
    const sel = root.getAttribute('data-source');
    const src = sel ? document.querySelector(sel) : null;
    const items = src ? Array.from(src.querySelectorAll('li')).map((li) => li.textContent.trim()).filter(Boolean) : [];
    if (items.length < 2) return;

    const label = root.getAttribute('data-label') || 'Your practice question';
    root.innerHTML =
        `<p class="pp-label">🎲 ${escapeText(label)}</p>
        <p class="pp-q"></p>
        <div class="pp-actions">
            <button type="button" class="pp-btn next">Give me a question</button>
            <span class="pp-count"></span>
        </div>`;

    const qEl = root.querySelector('.pp-q');
    const btn = root.querySelector('.next');
    const count = root.querySelector('.pp-count');

    // Shuffle once, then walk through so every question appears before repeats.
    let order = shuffle(items.map((_, i) => i));
    let pos = -1;
    function next() {
        pos++;
        if (pos >= order.length) { order = shuffle(order); pos = 0; }
        qEl.textContent = items[order[pos]];
        count.textContent = (pos + 1) + ' / ' + items.length;
        btn.textContent = 'Next question';
    }
    btn.addEventListener('click', next);
    root.setAttribute('data-practice-ready', '1');
}

/* ---- helpers ---- */
function fmt(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return m + ':' + String(sec).padStart(2, '0');
}
function beep() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 660;
        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.5);
    } catch { /* audio not available; the visual flash still fires */ }
}
function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
function escapeText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
}
