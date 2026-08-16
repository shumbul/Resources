/**
 * motivation.js
 * A slow marquee of short, ethical, attributed encouragement lines that sits
 * just above the footer. Chosen to suit a learn-to-code audience: honest about
 * effort, never hustle-culture, no false promises.
 *
 * - Pauses on hover and on focus
 * - Fully paused under prefers-reduced-motion (becomes a static rotating line)
 * - Duplicated track so the loop is seamless
 */

const LINES = [
    { t: 'Everybody who is good at something was once bad at it.', a: null },
    { t: 'The expert in anything was once a beginner.', a: 'Helen Hayes' },
    { t: 'It always seems impossible until it is done.', a: 'Nelson Mandela' },
    { t: 'Small daily improvements are what create stunning results.', a: null },
    { t: 'You do not have to be great to start, but you have to start to be great.', a: 'Zig Ziglar' },
    { t: 'Consistency beats intensity. Two problems a day for six months wins.', a: null },
    { t: 'Confusion is what learning feels like from the inside.', a: null },
    { t: 'Comparison is the thief of joy.', a: 'Theodore Roosevelt' },
    { t: 'Your first project will be bad. Build it anyway.', a: null },
    { t: 'Fall seven times, stand up eight.', a: 'Japanese proverb' },
    { t: 'The best time to plant a tree was 20 years ago. The second best time is now.', a: 'Proverb' },
    { t: 'Ask the question. Everyone else is wondering the same thing.', a: null },
    { t: 'Progress, not perfection.', a: null },
    { t: 'Rest is part of the work, not a reward for finishing it.', a: null },
    { t: 'You are not behind. There is no schedule.', a: null }
];

const CSS = `
.mot-strip{position:relative;overflow:hidden;border-top:1px solid var(--border,#e5e7eb);
    border-bottom:1px solid var(--border,#e5e7eb);
    background:var(--bg-secondary,#f8fafc);padding:.7rem 0;margin-top:3rem;
    -webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);
    mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);}
.mot-strip:focus-visible{outline:2px solid var(--primary,#8b5cf6);outline-offset:-2px;}
.mot-track{display:flex;width:max-content;gap:0;animation:motScroll 64s linear infinite;}
.mot-strip:hover .mot-track,.mot-strip:focus-within .mot-track,
.mot-strip:focus .mot-track,.mot-strip.is-paused .mot-track{animation-play-state:paused;}
/* Travels rightwards: the track starts shifted one full copy to the left and
   slides back to zero, so each quote enters from the left edge and exits at
   the right. The duplicated copy makes the wrap seamless. */
@keyframes motScroll{from{transform:translateX(-50%);}to{transform:translateX(0);}}
.mot-half{display:inline-flex;}
.mot-item{display:inline-flex;align-items:center;gap:.5rem;white-space:nowrap;
    padding:0 1.6rem;font-size:.92rem;color:var(--text-secondary,#555);}
.mot-item .q{color:var(--text-primary,#111);font-weight:500;}
.mot-item .a{font-size:.82rem;opacity:.75;}
.mot-item .sep{color:var(--primary,#8b5cf6);opacity:.55;font-size:1.1rem;line-height:1;}
@media (max-width:640px){
    .mot-strip{padding:.6rem 0;margin-top:2.2rem;}
    .mot-item{font-size:.84rem;padding:0 1.1rem;}
    .mot-item .a{font-size:.75rem;}
    .mot-track{animation-duration:48s;}
}
/* Reduced motion: no sliding at all. One quote at a time, cross-faded, which
   is the recommended substitution because a fade has no direction of travel
   and cannot trigger vestibular discomfort. The strip still changes, so the
   feature is not silently dead for anyone who turns animations off in their
   operating system. */
.mot-strip.mot-fade{padding:.7rem 1rem;}
.mot-strip.mot-fade .mot-track{animation:none;width:100%;display:block;
    position:relative;min-height:1.5rem;}
.mot-strip.mot-fade .mot-half[aria-hidden]{display:none;}
.mot-strip.mot-fade .mot-half{display:block;}
.mot-strip.mot-fade .mot-item{position:absolute;inset:0;justify-content:center;
    white-space:normal;text-align:center;opacity:0;transition:opacity .6s ease;
    pointer-events:none;}
.mot-strip.mot-fade .mot-item.mot-solo{opacity:1;pointer-events:auto;}
`;

function itemHtml(l) {
    const who = l.a ? `<span class="a">- ${l.a}</span>` : '';
    return `<span class="mot-item"><span class="sep">&#10022;</span>` +
           `<span class="q">${l.t}</span>${who}</span>`;
}

export function initMotivation() {
    if (document.querySelector('.mot-strip')) return;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // shuffle so repeat visitors do not always see the same order
    const order = LINES.slice().sort(() => Math.random() - 0.5);

    const strip = document.createElement('div');
    strip.className = 'mot-strip';
    strip.setAttribute('role', 'region');
    strip.setAttribute('aria-label',
        'Words of encouragement. Focus this region to pause the scrolling.');
    // focusable so keyboard users can actually reach the pause behaviour
    strip.tabIndex = 0;

    // The track is duplicated so translateX(-50%) loops seamlessly, but the
    // second copy is decorative: hide it from assistive tech so screen-reader
    // users do not hear all 15 lines twice.
    const half = order.map(itemHtml).join('');
    strip.innerHTML =
        `<div class="mot-track">` +
        `<span class="mot-half">${half}</span>` +
        `<span class="mot-half" aria-hidden="true">${half}</span>` +
        `</div>`;

    // Explicit pause on focus as well, for browsers where :focus-within on a
    // container with no focusable children behaves inconsistently.
    strip.addEventListener('focus', () => strip.classList.add('is-paused'));
    strip.addEventListener('blur', () => strip.classList.remove('is-paused'));

    // Reduced motion: swap the slide for a cross-fade carousel. The media
    // query is watched live, so toggling the operating system setting takes
    // effect without a reload.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer = null;

    function startFade() {
        strip.classList.add('mot-fade');
        const items = strip.querySelectorAll('.mot-half:not([aria-hidden]) .mot-item');
        if (!items.length) return;
        let i = 0;
        items[0].classList.add('mot-solo');
        timer = setInterval(() => {
            items[i % items.length].classList.remove('mot-solo');
            i++;
            items[i % items.length].classList.add('mot-solo');
        }, 6000);
    }

    function stopFade() {
        strip.classList.remove('mot-fade');
        strip.querySelectorAll('.mot-solo').forEach((el) => el.classList.remove('mot-solo'));
        if (timer) { clearInterval(timer); timer = null; }
    }

    function applyMotionPreference() {
        if (reduce.matches) startFade();
        else stopFade();
    }

    applyMotionPreference();
    if (reduce.addEventListener) {
        reduce.addEventListener('change', applyMotionPreference);
    } else if (reduce.addListener) {
        reduce.addListener(applyMotionPreference);
    }

    // place it directly before the footer
    const footer = document.querySelector('footer') ||
                   document.querySelector('[data-component="footer"]');
    if (footer && footer.parentNode) {
        footer.parentNode.insertBefore(strip, footer);
    } else {
        document.body.appendChild(strip);
    }
}
