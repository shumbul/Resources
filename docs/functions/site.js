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
import { ensureMeta } from './meta.js?v=20260815b';
import { renderSkipLink } from './skiplink.js?v=20260815b';
import { renderNav } from './nav.js?v=20260815b';
import { renderFooter } from './footer.js?v=20260815b';
import { renderBackLink } from './header.js?v=20260815b';
import { initCopyButtons } from './copyButtons.js?v=20260815b';
import { initProgress } from './progress.js?v=20260815b';
import { initAssistant } from './assistant.js?v=20260815b';
import { makeScrollablesFocusable } from './a11y.js?v=20260815b';
import { initMotion } from './motion.js?v=20260815b';
import { initJourney } from './journey.js?v=20260815b';
import { initTypewriter } from './typewriter.js?v=20260815b';
import { initQuickJump } from './quickjump.js?v=20260815b';
import { initQuizzes } from './quiz.js?v=20260815b';
import { initFlowMaps } from './flow.js?v=20260815b';
import { initPractice } from './practice.js?v=20260815b';
import { renderUpdated } from './updated.js?v=20260815b';
import { initAnalytics } from './analytics.js?v=20260815b';

const STEPS = [
    ['meta', ensureMeta],
    ['skiplink', renderSkipLink],
    ['nav', renderNav],
    ['backlink', renderBackLink],
    ['updated', renderUpdated],
    ['footer', renderFooter],
    ['copy', initCopyButtons],
    ['progress', initProgress],
    ['journey', initJourney],
    ['quickjump', initQuickJump],
    ['assistant', initAssistant],
    ['a11y', makeScrollablesFocusable],
    ['motion', initMotion],
    ['typewriter', initTypewriter],
    ['quiz', initQuizzes],
    ['flow', initFlowMaps],
    ['practice', initPractice],
    ['analytics', initAnalytics],
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
