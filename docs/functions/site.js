/*
 * Single entry point for shared site behavior.
 * Every page includes just this one module:
 *
 *   <script type="module" src="./functions/site.js?v=VERSION"></script>
 *
 * It composes the reusable functions in this folder. Each call is guarded
 * so one failing feature never breaks the rest of the page.
 *
 * Cache-busting: the ?v=... below (and on the <script> tag in every page)
 * force browsers to fetch the latest modules after a deploy. When you change
 * any file in functions/, bump this version in TWO places:
 *   1. the SITE_VERSION query on the imports just below, and
 *   2. the ?v=... on the site.js <script> tag in the HTML pages
 *      (docs uses a single value; see ADDING-A-RESOURCE.md).
 */
import { ensureMeta } from './meta.js?v=20260731';
import { renderNav } from './nav.js?v=20260731';
import { renderFooter } from './footer.js?v=20260731';
import { renderBackLink } from './header.js?v=20260731';
import { initCopyButtons } from './copyButtons.js?v=20260731';
import { initProgress } from './progress.js?v=20260731';
import { initAssistant } from './assistant.js?v=20260731';
import { makeScrollablesFocusable } from './a11y.js?v=20260731';
import { initMotion } from './motion.js?v=20260731';
import { initJourney } from './journey.js?v=20260731';
import { initTypewriter } from './typewriter.js?v=20260731';
import { initQuickJump } from './quickjump.js?v=20260731';

const STEPS = [
    ['meta', ensureMeta],
    ['nav', renderNav],
    ['backlink', renderBackLink],
    ['footer', renderFooter],
    ['copy', initCopyButtons],
    ['progress', initProgress],
    ['journey', initJourney],
    ['quickjump', initQuickJump],
    ['assistant', initAssistant],
    ['a11y', makeScrollablesFocusable],
    ['motion', initMotion],
    ['typewriter', initTypewriter],
];

function run() {
    for (const [name, fn] of STEPS) {
        try { fn(); } catch (err) { console.warn('[site] ' + name + ' failed:', err); }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
} else {
    run();
}
