/*
 * Single entry point for shared site behavior.
 * Every page includes just this one module:
 *
 *   <script type="module" src="./functions/site.js"></script>
 *
 * It composes the reusable functions in this folder. Each call is guarded
 * so one failing feature never breaks the rest of the page.
 */
import { ensureMeta } from './meta.js';
import { renderNav } from './nav.js';
import { renderFooter } from './footer.js';
import { initCopyButtons } from './copyButtons.js';
import { initProgress } from './progress.js';
import { initAssistant } from './assistant.js';
import { makeScrollablesFocusable } from './a11y.js';
import { initMotion } from './motion.js';

const STEPS = [
    ['meta', ensureMeta],
    ['nav', renderNav],
    ['footer', renderFooter],
    ['copy', initCopyButtons],
    ['progress', initProgress],
    ['assistant', initAssistant],
    ['a11y', makeScrollablesFocusable],
    ['motion', initMotion],
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
