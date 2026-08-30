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
import { ensureMeta } from './meta.js?v=20260830b';
import { renderNav } from './nav.js?v=20260830b';
import { renderFooter } from './footer.js?v=20260830b';
import { renderBackLink } from './header.js?v=20260830b';
import { initCopyButtons } from './copyButtons.js?v=20260830b';
import { initProgress } from './progress.js?v=20260830b';
import { initAssistant } from './assistant.js?v=20260830b';
import { makeScrollablesFocusable } from './a11y.js?v=20260830b';
import { initMotion } from './motion.js?v=20260830b';
import { initJourney } from './journey.js?v=20260830b';
import { initTypewriter } from './typewriter.js?v=20260830b';
import { initQuickJump } from './quickjump.js?v=20260830b';
import { initQuizzes } from './quiz.js?v=20260830b';
import { initFlowMaps } from './flow.js?v=20260830b';
import { initCharts } from './chart.js?v=20260830b';
import { initDiagrams } from './diagram.js?v=20260830b';
import { initPractice } from './practice.js?v=20260830b';
import { initSeo } from './seo.js?v=20260830b';
import { initMotivation } from './motivation.js?v=20260830b';
import { initReadAloud } from './readaloud.js?v=20260830b';
import { initFuturistic } from './futuristic.js?v=20260830b';
import { initNotFound } from './notfound.js?v=20260830b';
import { initInstant } from './instant.js?v=20260830b';
import { initHighlight } from './highlight.js?v=20260830b';
import { initViews } from './views.js?v=20260830b';

const STEPS = [
    ['meta', ensureMeta],
    ['seo', initSeo],
    ['nav', renderNav],
    ['backlink', renderBackLink],
    ['footer', renderFooter],
    ['motivation', initMotivation],
    ['highlight', initHighlight],
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
    ['chart', initCharts],
    ['diagram', initDiagrams],
    ['practice', initPractice],
    ['futuristic', initFuturistic],
    ['notfound', initNotFound],
    ['instant', initInstant],
    ['views', initViews],
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
