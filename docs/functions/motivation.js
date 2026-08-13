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
.mot-track{display:flex;width:max-content;gap:0;animation:motScroll 64s linear infinite;}
.mot-strip:hover .mot-track,.mot-strip:focus-within .mot-track{animation-play-state:paused;}
@keyframes motScroll{from{transform:translateX(0);}to{transform:translateX(-50%);}}
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
@media (prefers-reduced-motion:reduce){
    .mot-track{animation:none;width:100%;justify-content:center;}
    .mot-item{display:none;}
    .mot-item.mot-solo{display:inline-flex;white-space:normal;text-align:center;}
}
`;

function itemHtml(l) {
    const who = l.a ? `<span class="a">&mdash; ${l.a}</span>` : '';
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
    strip.setAttribute('role', 'complementary');
    strip.setAttribute('aria-label', 'Words of encouragement');

    // the track is duplicated so translateX(-50%) loops seamlessly
    const half = order.map(itemHtml).join('');
    strip.innerHTML = `<div class="mot-track" aria-hidden="false">${half}${half}</div>`;

    // reduced-motion fallback: show a single line, rotate it slowly
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) {
        const items = strip.querySelectorAll('.mot-item');
        let i = 0;
        items[0].classList.add('mot-solo');
        setInterval(() => {
            items[i % items.length].classList.remove('mot-solo');
            i++;
            items[i % items.length].classList.add('mot-solo');
        }, 7000);
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
