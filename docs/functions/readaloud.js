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
    visibility:hidden;
    transition:transform .3s cubic-bezier(.4,0,.2,1),visibility .3s;}
.ra-bar.show{transform:translateX(-50%) translateY(0);visibility:visible;}
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
.ra-bar .ra-prog{font:500 .75rem/1 Inter,sans-serif;color:var(--text-secondary,#777);
    padding:0 .3rem;min-width:52px;text-align:center;}

/* The Listen button.
 *
 * Positioning note, because this was got wrong once already. The button is
 * fixed at bottom-left, which on desktop is directly on top of the sidebar
 * (the sidebar spans 0 to --sidebar-w at z-index 9400; this sits at 9996).
 * It therefore covers whichever sidebar links happen to fall at its height.
 *
 * The first attempt at fixing that added padding-bottom to the sidebar's
 * scroll container. That only clears the button when the sidebar is scrolled
 * all the way down, which is the single position it was tested in. At the top
 * of the list, which is the default, two links were still underneath it.
 *
 * The actual fix is to not overlap at all: on desktop the button sits just to
 * the right of the sidebar, and slides back to the edge when the sidebar is
 * collapsed. Below 1024px the sidebar is an off-canvas drawer, so the edge is
 * already free.
 */
.ra-fab{position:fixed;left:20px;bottom:20px;z-index:9996;
    display:inline-flex;align-items:center;gap:.45rem;
    padding:.6rem .9rem;border:1px solid var(--border,#e5e7eb);border-radius:999px;
    background:var(--bg-primary,#fff);color:var(--text-primary,#111);
    font:600 .88rem/1 Inter,Segoe UI,sans-serif;cursor:pointer;
    box-shadow:0 6px 18px rgba(15,23,42,.12);
    transition:transform .2s ease,box-shadow .2s ease,opacity .25s ease,left .25s ease;}
@media (min-width:1024px){
    .ra-fab{left:calc(var(--sidebar-w,250px) + 20px);}
    body.sidebar-collapsed .ra-fab{left:20px;}
}
@media (prefers-reduced-motion:reduce){
    .ra-fab{transition:opacity .25s ease;}
}
.ra-fab:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(15,23,42,.18);
    color:var(--primary,#8b5cf6);}
.ra-fab:focus-visible{outline:2px solid var(--primary,#8b5cf6);outline-offset:2px;}
.ra-fab.hide{opacity:0;pointer-events:none;visibility:hidden;}

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
    .ra-bar .ra-prog{min-width:46px;font-size:.75rem;}
}
`;

const RATES = [0.85, 1, 1.15, 1.35, 1.6];

/**
 * Voice selection.
 *
 * SpeechSynthesisVoice has no reliable gender field (it was dropped from the
 * spec), so the only portable way to prefer a female voice is to recognise the
 * known female voice names each platform ships. Listed best-first.
 */
const FEMALE_VOICES = [
    // Chrome / Edge, usually the highest quality available
    'Google UK English Female',
    'Google US English',            // this one is female
    'Microsoft Aria',               // Edge, natural
    'Microsoft Jenny',
    'Microsoft Michelle',
    'Microsoft Zira',               // classic Windows female
    'Microsoft Hazel',
    'Microsoft Susan',
    'Microsoft Linda',
    'Microsoft Heera',              // Indian English female
    'Microsoft Neerja',             // Indian English female, natural
    // Apple
    'Samantha', 'Karen', 'Moira', 'Tessa', 'Fiona', 'Victoria', 'Serena',
    'Allison', 'Ava', 'Susan', 'Vicki', 'Kate',
    // Android / misc
    'English United States female', 'en-us-x-sfg#female_1',
];

/** Words that usually indicate a female voice when the name is unfamiliar. */
const FEMALE_HINTS = /female|woman|\bshe\b/i;

/** Names that are definitely male, used to rule candidates out. */
const MALE_HINTS = /male(?!.*female)|\bman\b|david|mark|george|daniel|alex|fred|thomas|oliver|james|ravi|guy|tom|rishi|prabhat/i;

/**
 * Pick the best available female English voice.
 * Falls back to any English voice, then to the browser default.
 */
function pickVoice(voices) {
    if (!voices || !voices.length) return null;

    const english = voices.filter(v => /^en\b|^en[-_]/i.test(v.lang || ''));
    const pool = english.length ? english : voices;

    // 1. exact match against the known-female list, in preference order
    for (const wanted of FEMALE_VOICES) {
        const hit = pool.find(v => (v.name || '').toLowerCase() === wanted.toLowerCase());
        if (hit) return hit;
    }
    // 2. partial match, e.g. "Microsoft Zira - English (United States)"
    for (const wanted of FEMALE_VOICES) {
        const hit = pool.find(v => (v.name || '').toLowerCase().includes(wanted.toLowerCase()));
        if (hit) return hit;
    }
    // 3. anything self-describing as female and not male
    const hinted = pool.find(v => FEMALE_HINTS.test(v.name || '') && !MALE_HINTS.test(v.name || ''));
    if (hinted) return hinted;

    // 4. any English voice that is not obviously male
    const notMale = pool.find(v => !MALE_HINTS.test(v.name || ''));
    if (notMale) return notMale;

    return pool[0] || null;
}

/**
 * Voices load asynchronously in Chrome. getVoices() is often empty on the first
 * call, so resolve once the list is populated (or give up after a short wait).
 */
function whenVoicesReady() {
    return new Promise(resolve => {
        const synth = window.speechSynthesis;
        const now = synth.getVoices();
        if (now && now.length) { resolve(now); return; }

        let settled = false;
        const done = () => {
            if (settled) return;
            settled = true;
            resolve(synth.getVoices() || []);
        };
        synth.addEventListener('voiceschanged', done, { once: true });
        setTimeout(done, 1500);   // some browsers never fire the event
    });
}

export function initReadAloud() {
    if (!('speechSynthesis' in window)) return;          // unsupported, stay silent
    if (document.querySelector('.ra-fab')) return;

    const main = document.querySelector('main') || document.body;
    const scopedToMain = !!document.querySelector('main');

    // Collect readable blocks in document order.
    const blocks = [...main.querySelectorAll('h1,h2,h3,p,li')]
        .filter(el => {
            // never read chrome: nav, footer, the ticker, or our own controls
            if (el.closest('pre, code, .ra-bar, nav, footer, .mot-strip, ' +
                           '.site-topbar, .site-sidebar, .ai-panel, ' +
                           '[data-component="footer"], .footer-content')) return false;
            // when there is no <main>, body-wide search would sweep up chrome,
            // so require the element to sit inside a plausible content region
            if (!scopedToMain && !el.closest('main, article, .container, .content')) return false;
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
    let voice = null;

    const synth = window.speechSynthesis;

    // Resolve the preferred voice up front so the first utterance already
    // uses it. Chrome populates the list asynchronously.
    whenVoicesReady().then(list => {
        voice = pickVoice(list);
    });

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

        // Prefer a female voice. Resolve late in case the list arrived after
        // init, and fall back silently to the browser default if none matched.
        if (!voice) voice = pickVoice(synth.getVoices());
        if (voice) {
            u.voice = voice;
            u.lang = voice.lang || u.lang;
        }
        u.pitch = 1.05;   // a touch brighter, reads as warmer on most engines

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
