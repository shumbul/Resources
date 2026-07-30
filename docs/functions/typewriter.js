/* Animated "typewriter" placeholder for search inputs.
 * Cycles through a list of terms, typing and deleting each inside quotes, e.g.
 *   Search "Data Structures and Algorithms"
 * Pauses while the user is focused or has typed something. Respects
 * prefers-reduced-motion (falls back to a static, helpful placeholder).
 *
 * Opt in by giving an input:  data-typewriter='["Term one","Term two"]'
 * Optional prefix:            data-typewriter-prefix='Search '
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initTypewriter() {
    document.querySelectorAll('input[data-typewriter]').forEach((input) => {
        if (input.__twStarted) return;
        input.__twStarted = true;

        let terms;
        try { terms = JSON.parse(input.getAttribute('data-typewriter')); } catch { terms = []; }
        if (!Array.isArray(terms) || !terms.length) return;

        const prefix = input.getAttribute('data-typewriter-prefix') || '';
        const quote = (s) => `${prefix}"${s}"`;

        if (REDUCED) { input.setAttribute('placeholder', quote(terms[0])); return; }

        new Typewriter(input, terms, prefix, quote).start();
    });
}

class Typewriter {
    constructor(input, terms, prefix, quote) {
        this.input = input;
        this.terms = terms;
        this.quote = quote;
        this.ti = 0;   // term index
        this.ci = 0;   // char index
        this.deleting = false;
        this.timer = null;

        // Pause the animation whenever the user is actually using the box.
        const pause = () => { this.paused = true; };
        const resume = () => { if (!input.value) this.paused = false; };
        input.addEventListener('focus', pause);
        input.addEventListener('input', () => { this.paused = !!input.value; });
        input.addEventListener('blur', resume);
    }

    start() { this.tick(); }

    tick() {
        const term = this.terms[this.ti];
        if (this.paused) { this.schedule(400); return; }

        if (!this.deleting) {
            this.ci++;
            this.input.setAttribute('placeholder', this.quote(term.slice(0, this.ci)));
            if (this.ci >= term.length) { this.deleting = true; this.schedule(1400); return; }
            this.schedule(70 + Math.random() * 50);
        } else {
            this.ci--;
            this.input.setAttribute('placeholder', this.quote(term.slice(0, this.ci)));
            if (this.ci <= 0) {
                this.deleting = false;
                this.ti = (this.ti + 1) % this.terms.length;
                this.schedule(350);
                return;
            }
            this.schedule(35);
        }
    }

    schedule(ms) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.tick(), ms);
    }
}
