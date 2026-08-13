/**
 * readaloud.js
 * A "Listen" control that reads the page's main content using the browser's
 * built-in speech synthesis. No network calls, no API key, nothing leaves
 * the device.
 *
 * - Reads section by section so the highlight tracks progress
 * - Play / pause / stop, plus a speed control
 * - Highlights the sentence currently being spoken
 * - Hidden entirely if the browser has no speechSynthesis
 * - Cancels cleanly on navigation
 */

const CSS = `
.ra-bar{position:fixed;left:50%;transform:translateX(-50%) translateY(120%);
    bottom:18px;z-index:9997;display:flex;align-items:center;gap:.4rem;
    padding:.45rem .55rem;border-radius:999px;
    background:var(--bg-primary,#fff);border:1px solid var(--border,#e5e7eb);
    box-shadow:0 10px 30px rgba(15,23,42,.18);
    transition:transform .3s cubic-bezier(.4,0,.2,1);}
.ra-bar.show{transform:translateX(-50%) translateY(0);}
.ra-bar button{display:inline-flex;align-items:center;justify-content:center;
    gap:.35rem;border:none;cursor:pointer;border-radius:999px;
    background:transparent;color:var(--text-primary,#111);
    font:600 .85rem/1 Inter,Segoe UI,sans-serif;padding:.45rem .7rem;
    transition:background .15s ease,color .15s ease;}
.ra-bar button:hover{background:var(--bg-tertiary,#f1f5f9);color:var(--primary,#8b5cf6);}
.ra-bar button:focus-visible{outline:2px solid var(--primary,#8b5cf6);outline-offset:2px;}
.ra-bar .ra-main{background:linear-gradient(135deg,var(--primary,#8b5cf6),var(--secondary,#7c3aed));
    color:#fff;padding:.5rem .95rem;}
.ra-bar .ra-main:hover{filter:brightness(1.07);color:#fff;}
.ra-bar .ra-rate{font:600 .78rem/1 Inter,sans-serif;color:var(--text-secondary,#666);
    background:var(--bg-tertiary,#f1f5f9);border-radius:999px;padding:.4rem .6rem;
    cursor:pointer;border:none;min-width:42px;}
.ra-bar .ra-sep{width:1px;height:20px;background:var(--border,#e5e7eb);}
.ra-bar .ra-prog{font:500 .74rem/1 Inter,sans-serif;color:var(--text-secondary,#777);
    padding:0 .3rem;min-width:52px;text-align:center;}

.ra-fab{position:fixed;left:20px;bottom:20px;z-index:9996;
    display:inline-flex;align-items:center;gap:.45rem;
    padding:.6rem .9rem;border:1px solid var(--border,#e5e7eb);border-radius:999px;
    background:var(--bg-primary,#fff);color:var(--text-primary,#111);
    font:600 .88rem/1 Inter,Segoe UI,sans-serif;cursor:pointer;
    box-shadow:0 6px 18px rgba(15,23,42,.12);
    transition:transform .2s ease,box-shadow .2s ease,opacity .25s ease;}
.ra-fab:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(15,23,42,.18);
    color:var(--primary,#8b5cf6);}
.ra-fab:focus-visible{outline:2px solid var(--primary,#8b5cf6);outline-offset:2px;}
.ra-fab.hide{opacity:0;pointer-events:none;}

.ra-speaking{background:linear-gradient(90deg,
    color-mix(in srgb,var(--primary,#8b5cf6) 18%,transparent),
    color-mix(in srgb,var(--primary,#8b5cf6) 6%,transparent));
    border-radius:6px;box-shadow:0 0 0 3px color-mix(in srgb,var(--primary,#8b5cf6) 10%,transparent);
    transition:background .2s ease;}

@media (max-width:640px){
    .ra-fab{left:14px;bottom:14px;padding:.55rem .8rem;font-size:.82rem;}
    .ra-bar{bottom:14px;gap:.25rem;padding:.4rem .45rem;width:calc(100vw - 28px);
        justify-content:center;}
    .ra-bar button{padding:.4rem .55rem;font-size:.8rem;}
    .ra-bar .ra-main{padding:.45rem .75rem;}
    .ra-bar .ra-prog{min-width:44px;font-size:.7rem;}
}
`;

const RATES = [0.85, 1, 1.15, 1.35, 1.6];

export function initReadAloud() {
    if (!('speechSynthesis' in window)) return;          // unsupported, stay silent
    if (document.querySelector('.ra-fab')) return;

    const main = document.querySelector('main') || document.body;

    // Collect readable blocks in document order.
    const blocks = [...main.querySelectorAll('h1,h2,h3,p,li')]
        .filter(el => {
            if (el.closest('pre, code, .ra-bar, nav, .mot-strip')) return false;
            const txt = el.textContent.trim();
            if (txt.length < 12) return false;
            // skip a list item whose text is already inside a child we captured
            if (el.tagName === 'LI' && el.querySelector('p')) return false;
            return true;
        });

    if (!blocks.length) return;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // ---------- UI ----------
    const fab = document.createElement('button');
    fab.className = 'ra-fab';
    fab.type = 'button';
    fab.innerHTML = '<span aria-hidden="true">&#128266;</span> Listen';
    fab.setAttribute('aria-label', 'Read this page aloud');

    const bar = document.createElement('div');
    bar.className = 'ra-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Read aloud controls');
    bar.innerHTML =
        '<button class="ra-main" id="raToggle" aria-label="Pause reading">' +
            '<span aria-hidden="true">&#10074;&#10074;</span> Pause</button>' +
        '<span class="ra-prog" id="raProg">0 / 0</span>' +
        '<span class="ra-sep"></span>' +
        '<button class="ra-rate" id="raRate" aria-label="Change speed">1.0x</button>' +
        '<button id="raStop" aria-label="Stop reading">' +
            '<span aria-hidden="true">&#9632;</span> Stop</button>';

    document.body.appendChild(fab);
    document.body.appendChild(bar);

    const btnToggle = bar.querySelector('#raToggle');
    const btnStop   = bar.querySelector('#raStop');
    const btnRate   = bar.querySelector('#raRate');
    const progEl    = bar.querySelector('#raProg');

    // ---------- state ----------
    let idx = 0;
    let rateI = 1;
    let reading = false;
    let current = null;

    const synth = window.speechSynthesis;

    function clearHighlight() {
        if (current) current.classList.remove('ra-speaking');
        current = null;
    }

    function updateProg() {
        progEl.textContent = `${Math.min(idx + 1, blocks.length)} / ${blocks.length}`;
    }

    function speakFrom(i) {
        if (i >= blocks.length) { stop(); return; }
        idx = i;
        clearHighlight();

        const el = blocks[i];
        current = el;
        el.classList.add('ra-speaking');
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        updateProg();

        const u = new SpeechSynthesisUtterance(el.textContent.trim());
        u.rate = RATES[rateI];
        u.lang = document.documentElement.lang || 'en-US';
        u.onend = () => { if (reading) speakFrom(idx + 1); };
        u.onerror = () => { if (reading) speakFrom(idx + 1); };
        synth.speak(u);
    }

    function start() {
        reading = true;
        bar.classList.add('show');
        fab.classList.add('hide');
        setPauseLabel(false);
        synth.cancel();
        speakFrom(idx);
    }

    function stop() {
        reading = false;
        synth.cancel();
        clearHighlight();
        idx = 0;
        updateProg();
        bar.classList.remove('show');
        fab.classList.remove('hide');
    }

    function setPauseLabel(paused) {
        btnToggle.innerHTML = paused
            ? '<span aria-hidden="true">&#9654;</span> Resume'
            : '<span aria-hidden="true">&#10074;&#10074;</span> Pause';
        btnToggle.setAttribute('aria-label', paused ? 'Resume reading' : 'Pause reading');
    }

    // ---------- events ----------
    fab.addEventListener('click', start);

    btnToggle.addEventListener('click', () => {
        if (synth.paused) { synth.resume(); setPauseLabel(false); }
        else { synth.pause(); setPauseLabel(true); }
    });

    btnStop.addEventListener('click', stop);

    btnRate.addEventListener('click', () => {
        rateI = (rateI + 1) % RATES.length;
        btnRate.textContent = RATES[rateI].toFixed(2).replace(/0$/, '') + 'x';
        if (reading) {                 // restart current block at the new speed
            synth.cancel();
            speakFrom(idx);
        }
    });

    // Chrome stops speaking if the tab is hidden for a while
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && reading) { synth.pause(); setPauseLabel(true); }
    });

    window.addEventListener('beforeunload', () => synth.cancel());

    updateProg();
}
