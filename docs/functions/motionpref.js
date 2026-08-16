/*
 * Motion preference, with an override the visitor actually controls.
 *
 * Why this exists:
 *   Everything animated on this site is gated behind prefers-reduced-motion,
 *   which is correct. But Windows sets that flag whenever "animation effects"
 *   are switched off in Settings, and plenty of people turn that off for
 *   performance or because they once found it distracting, not because motion
 *   makes them unwell. Those visitors then see a site where the gradient does
 *   not drift, cards do not rise, and the quote strip sits still, with no clue
 *   that any of it was ever meant to move, and no way to ask for it.
 *
 *   So: the operating system still decides the default, and nothing moves
 *   until the visitor opts in. But there is now a visible switch, and an
 *   explicit choice beats an inferred one.
 *
 * How it works:
 *   <html> carries data-motion="on" | "off" | "auto" (auto is the default and
 *   simply defers to the media query). CSS re-enables animation under
 *   html[data-motion="on"], which outranks the reduced-motion blocks on
 *   specificity. JavaScript modules call motionAllowed() instead of reading
 *   the media query directly, and can subscribe with onMotionChange().
 *
 *   The choice is remembered in localStorage, per browser.
 */

const KEY = 'motion_pref_v1';
const VALUES = ['auto', 'on', 'off'];

const mq = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false, addEventListener: null, addListener: null };

const listeners = new Set();

function stored() {
    try {
        const v = localStorage.getItem(KEY);
        return VALUES.indexOf(v) >= 0 ? v : 'auto';
    } catch (err) {
        return 'auto';
    }
}

function save(v) {
    try { localStorage.setItem(KEY, v); } catch (err) { /* private mode */ }
}

/** The visitor's stored choice: 'auto', 'on' or 'off'. */
export function motionPreference() {
    return stored();
}

/** True when animation should actually run right now. */
export function motionAllowed() {
    const p = stored();
    if (p === 'on') return true;
    if (p === 'off') return false;
    return !mq.matches;
}

export function onMotionChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function apply() {
    const p = stored();
    document.documentElement.setAttribute('data-motion', p);
    // A resolved flag so CSS can style the toggle without repeating the logic.
    document.documentElement.setAttribute(
        'data-motion-active', motionAllowed() ? 'yes' : 'no');
    listeners.forEach((fn) => {
        try { fn(motionAllowed()); } catch (err) { console.warn('[motion]', err); }
    });
}

export function setMotionPreference(v) {
    if (VALUES.indexOf(v) < 0) return;
    save(v);
    apply();
    syncButtons();
}

const CSS = `
.motion-toggle{display:inline-flex;align-items:center;gap:.4rem;background:none;
  border:1px solid var(--border,#e5e7eb);border-radius:999px;padding:.3rem .7rem;
  font:600 .78rem/1 var(--font-sans,inherit);color:var(--text-secondary,#555);
  cursor:pointer;white-space:nowrap;transition:color .16s ease,border-color .16s ease,
  background .16s ease;}
.motion-toggle:hover{color:var(--primary,#8b5cf6);border-color:var(--primary,#8b5cf6);}
.motion-toggle:focus-visible{outline:2px solid var(--primary,#8b5cf6);outline-offset:2px;}
.motion-toggle .mt-dot{width:7px;height:7px;border-radius:50%;flex:none;
  background:var(--text-secondary,#999);}
html[data-motion-active="yes"] .motion-toggle .mt-dot{background:var(--primary,#8b5cf6);
  box-shadow:0 0 0 3px var(--ring,rgba(139,92,246,.3));}
html[data-motion-active="yes"] .motion-toggle{color:var(--text-primary,#111);}
@media (max-width:900px){ .motion-toggle .mt-label{display:none;} 
  .motion-toggle{padding:.35rem .5rem;} }
`;

function labelFor() {
    const p = stored();
    if (p === 'on') return 'Motion on';
    if (p === 'off') return 'Motion off';
    return mq.matches ? 'Motion off' : 'Motion on';
}

function titleFor() {
    const p = stored();
    if (p === 'auto') {
        return mq.matches
            ? 'Animations are off because your device asks for reduced motion. '
              + 'Click to turn them on anyway.'
            : 'Animations follow your device setting. Click to turn them off.';
    }
    if (p === 'on') return 'Animations are on. Click to turn them off.';
    return 'Animations are off. Click to follow your device setting.';
}

function syncButtons() {
    document.querySelectorAll('.motion-toggle').forEach((btn) => {
        const on = motionAllowed();
        btn.setAttribute('aria-pressed', String(on));
        btn.title = titleFor();
        const lab = btn.querySelector('.mt-label');
        if (lab) lab.textContent = labelFor();
    });
}

/* Cycle: whatever it is now, flip to the opposite explicit value. Two clicks
   should never be needed to see a change, so 'auto' resolves first. */
function nextValue() {
    return motionAllowed() ? 'off' : 'on';
}

function makeButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'motion-toggle';
    btn.setAttribute('aria-pressed', String(motionAllowed()));
    btn.innerHTML = '<span class="mt-dot" aria-hidden="true"></span>'
        + '<span class="mt-label"></span>';
    btn.addEventListener('click', () => setMotionPreference(nextValue()));
    return btn;
}

export function initMotionToggle() {
    apply();

    if (!document.getElementById('fn-motionpref-css')) {
        const s = document.createElement('style');
        s.id = 'fn-motionpref-css';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    // The top bar is built by nav.js during the same init pass, so retry
    // briefly rather than assuming it already exists.
    let tries = 0;
    (function place() {
        const bar = document.querySelector('.site-topbar');
        if (!bar) {
            if (tries++ < 40) setTimeout(place, 50);
            return;
        }
        if (bar.querySelector('.motion-toggle')) return;
        const links = bar.querySelector('.site-topbar__links');
        const btn = makeButton();
        if (links) links.appendChild(btn);
        else bar.appendChild(btn);
        syncButtons();
    })();

    // Follow the operating system while the visitor is on 'auto'.
    const react = () => { apply(); syncButtons(); };
    if (mq.addEventListener) mq.addEventListener('change', react);
    else if (mq.addListener) mq.addListener(react);

    syncButtons();
}

export default initMotionToggle;
