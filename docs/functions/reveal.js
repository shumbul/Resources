/*
 * Stagger controller for the card grids.
 *
 * The CSS in theme-variables.css does the actual animating. This module only
 * does the two things CSS cannot: work out each card's position in its grid
 * so they can rise one after another, and add .is-inview when the grid
 * scrolls into view so the animation starts at the right moment rather than
 * playing invisibly above the fold.
 *
 * Nothing here changes layout: the animation touches opacity and transform
 * only, so it cannot contribute to Cumulative Layout Shift.
 */

import { motionAllowed, onMotionChange } from './motionpref.js?v=20260816a';

const GRIDS = [
    '.channels',
    '.collab-grid',
    '.values',
    '.kit',
];

// Guide sections get the drawn underline, so they need the same in-view flag.
const SECTIONS = '.gsection';

const STEP_MS = 70;
const MAX_DELAY_MS = 560;

let observer = null;

function stagger(root) {
    Array.prototype.forEach.call(root.children, (child, i) => {
        child.style.setProperty(
            '--rise-delay', Math.min(i * STEP_MS, MAX_DELAY_MS) + 'ms');
    });
}

function watch(el) {
    if (!observer) {
        el.classList.add('is-inview');
        return;
    }
    observer.observe(el);
}

export function initReveal() {
    const grids = [];
    GRIDS.forEach((sel) => {
        document.querySelectorAll(sel).forEach((g) => grids.push(g));
    });
    const sections = Array.prototype.slice.call(
        document.querySelectorAll(SECTIONS));

    if (!grids.length && !sections.length) return;

    grids.forEach(stagger);

    if (!('IntersectionObserver' in window)) {
        // No observer, so no reveal. Leave everything in its normal state
        // rather than marking grids and hiding their cards.
        return;
    }

    observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('is-inview');
            observer.unobserve(e.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    // Marking the grid is what arms the hidden starting state in CSS, so it
    // happens only now that the observer definitely exists.
    grids.forEach((g) => g.classList.add('rv-stagger'));
    grids.concat(sections).forEach(watch);

    /*
     * A safety net: if anything stops the observer from firing, reveal every
     * grid anyway so no card can be left invisible.
     */
    setTimeout(() => {
        grids.concat(sections).forEach((el) => el.classList.add('is-inview'));
    }, 3000);

    // Turning motion back on should re-show whatever is already on screen.
    onMotionChange((on) => {
        if (!on) {
            grids.concat(sections).forEach((el) => el.classList.add('is-inview'));
        }
    });

    if (!motionAllowed()) {
        grids.concat(sections).forEach((el) => el.classList.add('is-inview'));
    }
}

export default initReveal;
