/**
 * notfound.js
 *
 * Smart recovery for mistyped URLs.
 *
 * Rather than dumping people on a dead end, this looks at the URL they
 * actually asked for and tries to work out what they meant:
 *
 *   /dsa-practise-guide.html   ->  dsa-practice-guide.html   (typo)
 *   /resume                    ->  resume-portfolio-templates.html (prefix)
 *   /interview_prep            ->  interview-prep-kit.html   (separator)
 *   /completenonsense          ->  home page
 *
 * Behaviour:
 *   - A confident match auto-redirects after a short, visible countdown
 *   - A weak match is offered as a suggestion, no auto-redirect
 *   - No match at all falls back to the home page after a longer countdown
 *   - Every redirect can be cancelled, and cancelling is remembered
 *   - Announced politely to screen readers via aria-live
 *
 * Only runs on the 404 page.
 */

import { PAGES } from './pages.js?v=20260814n';

const CSS = `
.nf-redirect{
  max-width:560px;margin:1.6rem auto 0;padding:1rem 1.2rem;border-radius:14px;
  background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.34);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  color:#fff;text-align:left;
}
.nf-redirect .nf-rd-top{display:flex;align-items:flex-start;gap:.7rem;}
.nf-redirect .nf-rd-ic{font-size:1.35rem;line-height:1.2;flex-shrink:0;}
.nf-redirect strong{display:block;font-size:1.02rem;margin-bottom:.15rem;}
.nf-redirect .nf-rd-url{
  font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.84rem;
  background:rgba(0,0,0,.22);padding:.1rem .4rem;border-radius:5px;
  word-break:break-all;
}
.nf-redirect .nf-rd-msg{font-size:.92rem;color:rgba(255,255,255,.92);line-height:1.5;}
.nf-redirect .nf-rd-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.85rem;}
.nf-redirect button,.nf-redirect a.nf-btn{
  font:700 .88rem/1 Inter,Segoe UI,sans-serif;cursor:pointer;text-decoration:none;
  padding:.55rem .95rem;border-radius:10px;border:1px solid rgba(255,255,255,.42);
  background:rgba(255,255,255,.18);color:#fff;transition:background .18s ease;
}
.nf-redirect button:hover,.nf-redirect a.nf-btn:hover{background:rgba(255,255,255,.3);}
.nf-redirect button:focus-visible,.nf-redirect a.nf-btn:focus-visible{
  outline:2px solid #fff;outline-offset:2px;}
.nf-redirect .nf-go{background:#fff;color:var(--primary,#7c3aed);border-color:#fff;}
.nf-redirect .nf-go:hover{background:rgba(255,255,255,.9);}
.nf-bar{height:3px;border-radius:2px;background:rgba(255,255,255,.25);
  margin-top:.85rem;overflow:hidden;}
.nf-bar i{display:block;height:100%;width:100%;background:#fff;border-radius:2px;
  transform-origin:left center;animation:nfCount linear forwards;}
@keyframes nfCount{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@media (prefers-reduced-motion:reduce){.nf-bar i{animation:none;}}
`;

/* ---------- fuzzy matching ---------- */

/** Levenshtein distance, capped for speed. */
function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= n; j++) {
            cur[j] = Math.min(
                prev[j] + 1,
                cur[j - 1] + 1,
                prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
        prev = cur;
    }
    return prev[n];
}

/** Normalise a slug so separators and case never affect the comparison. */
function norm(s) {
    return s.toLowerCase()
        .replace(/\.html?$/, '')
        .replace(/[^a-z0-9]+/g, '');
}

/** What did the user actually type? */
function requestedSlug() {
    // GitHub Pages preserves the original path when it serves 404.html
    const path = location.pathname.split('/').filter(Boolean).pop() || '';
    // ignore the 404 page itself
    if (!path || /^404\.html?$/i.test(path)) return '';
    return decodeURIComponent(path);
}

/**
 * Score a candidate against the typed slug.
 * Returns 0..1 where 1 is a perfect match.
 */
function score(typed, candidate) {
    const a = norm(typed), b = norm(candidate);
    if (!a) return 0;
    if (a === b) return 1;

    // strong signal: one contains the other (e.g. "resume" -> "resumeportfolio...")
    if (b.startsWith(a) || a.startsWith(b)) {
        return 0.88 - Math.min(0.25, Math.abs(b.length - a.length) / 60);
    }
    if (b.includes(a) && a.length >= 4) return 0.78;

    const d = lev(a, b);
    const longest = Math.max(a.length, b.length);
    return 1 - d / longest;
}

function bestMatches(typed) {
    return PAGES
        .filter(p => p.f !== '404.html')
        .map(p => ({ ...p, s: score(typed, p.f) }))
        .sort((x, y) => y.s - x.s);
}

/* ---------- UI ---------- */

function buildPanel({ typed, match, confident }) {
    const wrap = document.createElement('div');
    wrap.className = 'nf-redirect';
    wrap.setAttribute('role', 'status');
    wrap.setAttribute('aria-live', 'polite');

    const target = match ? './' + match.f : './index.html';
    const targetName = match ? match.t : 'the home page';
    const secs = confident ? 4 : 6;

    const icon = confident ? '&#10140;' : '&#128269;';
    const heading = confident
        ? 'Did you mean <em style="font-style:normal;text-decoration:underline">'
          + targetName + '</em>?'
        : 'No page matches that address';
    const body = confident
        ? 'Taking you there in <span class="nf-secs">' + secs + '</span> seconds.'
        : 'Taking you to the home page in <span class="nf-secs">' + secs
          + '</span> seconds, where you can browse everything.';

    wrap.innerHTML =
        '<div class="nf-rd-top">' +
          '<span class="nf-rd-ic" aria-hidden="true">' + icon + '</span>' +
          '<div>' +
            '<strong>' + heading + '</strong>' +
            (typed ? '<div class="nf-rd-msg">You asked for ' +
                     '<span class="nf-rd-url">' + typed + '</span></div>' : '') +
            '<div class="nf-rd-msg" style="margin-top:.35rem">' + body + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="nf-bar"><i style="animation-duration:' + secs + 's"></i></div>' +
        '<div class="nf-rd-actions">' +
          '<a class="nf-btn nf-go" href="' + target + '">Go now</a>' +
          '<button type="button" class="nf-stay">Stay here</button>' +
        '</div>';

    return { wrap, target, secs };
}

export function initNotFound() {
    // only on the 404 page
    const header = document.querySelector('.nf-header .container');
    if (!header) return;

    const typed = requestedSlug();
    const ranked = typed ? bestMatches(typed) : [];
    const top = ranked[0];

    // thresholds tuned so real typos match but nonsense does not
    const confident = !!top && top.s >= 0.62;
    const weak = !!top && !confident && top.s >= 0.42;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // A weak match is only ever a suggestion. Never auto-navigate on a guess
    // we are not reasonably sure about.
    if (weak) {
        const wrap = document.createElement('div');
        wrap.className = 'nf-redirect';
        wrap.setAttribute('role', 'status');
        wrap.innerHTML =
            '<div class="nf-rd-top">' +
              '<span class="nf-rd-ic" aria-hidden="true">&#128269;</span>' +
              '<div><strong>Were you looking for ' + top.t + '?</strong>' +
              (typed ? '<div class="nf-rd-msg">You asked for ' +
                       '<span class="nf-rd-url">' + typed + '</span></div>' : '') +
              '</div></div>' +
            '<div class="nf-rd-actions">' +
              '<a class="nf-btn nf-go" href="./' + top.f + '">Yes, take me there</a>' +
              '<a class="nf-btn" href="./index.html">Browse everything</a>' +
            '</div>';
        header.appendChild(wrap);
        return;
    }

    const { wrap, target, secs } = buildPanel({ typed, match: confident ? top : null, confident });
    header.appendChild(wrap);

    // Respect a previous "stay here" for this session so we do not fight the user
    if (sessionStorage.getItem('nf-stay') === '1') {
        wrap.querySelector('.nf-bar').remove();
        wrap.querySelector('.nf-rd-msg:last-of-type').textContent =
            'Use the links below, or the sidebar, to find what you need.';
        return;
    }

    let remaining = secs;
    const secsEl = wrap.querySelector('.nf-secs');
    const timer = setInterval(() => {
        remaining -= 1;
        if (secsEl) secsEl.textContent = Math.max(0, remaining);
        if (remaining <= 0) {
            clearInterval(timer);
            location.replace(target);
        }
    }, 1000);

    function cancel() {
        clearInterval(timer);
        sessionStorage.setItem('nf-stay', '1');
        const bar = wrap.querySelector('.nf-bar');
        if (bar) bar.remove();
        const msg = wrap.querySelectorAll('.nf-rd-msg');
        if (msg.length) {
            msg[msg.length - 1].textContent =
                'Staying put. Use the links below to find what you need.';
        }
        wrap.querySelector('.nf-stay').remove();
    }

    wrap.querySelector('.nf-stay').addEventListener('click', cancel);

    // Any sign the visitor is engaging with the page should stop the countdown
    ['keydown', 'pointerdown', 'wheel'].forEach(ev => {
        window.addEventListener(ev, function once(e) {
            // ignore the "Go now" button, that is an intentional navigation
            if (e.target && e.target.closest && e.target.closest('.nf-go')) return;
            cancel();
            window.removeEventListener(ev, once);
        }, { passive: true });
    });
}
