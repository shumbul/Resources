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
import { ensureMeta } from './meta.js?v=20260814f';
import { renderNav } from './nav.js?v=20260814f';
import { renderFooter } from './footer.js?v=20260814f';
import { renderBackLink } from './header.js?v=20260814f';
import { initCopyButtons } from './copyButtons.js?v=20260814f';
import { initProgress } from './progress.js?v=20260814f';
import { initAssistant } from './assistant.js?v=20260814f';
import { makeScrollablesFocusable } from './a11y.js?v=20260814f';
import { initMotion } from './motion.js?v=20260814f';
import { initJourney } from './journey.js?v=20260814f';
import { initTypewriter } from './typewriter.js?v=20260814f';
import { initQuickJump } from './quickjump.js?v=20260814f';
import { initQuizzes } from './quiz.js?v=20260814f';
import { initFlowMaps } from './flow.js?v=20260814f';
import { initPractice } from './practice.js?v=20260814f';
import { initSeo } from './seo.js?v=20260814f';
import { initMotivation } from './motivation.js?v=20260814f';
import { initReadAloud } from './readaloud.js?v=20260814f';
import { initFuturistic } from './futuristic.js?v=20260814f';

const STEPS = [
    ['meta', ensureMeta],
    ['seo', initSeo],
    ['nav', renderNav],
    ['backlink', renderBackLink],
    ['footer', renderFooter],
    ['motivation', initMotivation],
    ['copy', initCopyButtons],
    ['progress', initProgress],
    ['journey', initJourney],
    ['quickjump', initQuickJump],
    ['assistant', initAssistant],
    ['readaloud', initReadAloud],
    ['a11y', makeScrollablesFocusable],
    ['motion', initMotion],
    ['typewriter', initTypewriter],
    ['quiz', initQuizzes],
    ['flow', initFlowMaps],
    ['practice', initPractice],
    ['futuristic', initFuturistic],
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
