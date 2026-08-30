/* Readable code blocks.
 *
 * Eleven pages each shipped their own `pre { background:#0f172a; color:#e2e8f0 }`.
 * That gave every block the same flat wall of near-white text on near-black,
 * which is hard to scan and fights the rest of the site, which is light. It
 * also meant the Copy button, styled for a light surface, sat on a dark box.
 *
 * This module does two things:
 *   1. marks every code block so the shared light styling in theme-variables.css
 *      applies (the per-page dark rules have been removed)
 *   2. colours the tokens, so the eye has something to anchor on
 *
 * Most blocks on this site are prompts, not code, so "prompt" is a first-class
 * language here: it colours the [placeholders] you are meant to replace, the
 * SECTION: labels, and quoted text. That is the part readers actually need to
 * spot.
 *
 * How the highlighting works
 * --------------------------
 * The naive approach, running a series of string replaces, corrupts itself:
 * rule 2 happily matches inside the <span> that rule 1 just inserted. Instead
 * every rule is matched against the raw, untouched text to produce a list of
 * {start, end, cls} spans. Overlaps are resolved by rule order, earliest match
 * wins, and only then is the HTML built in one pass with escaping. A token can
 * therefore never be found inside markup, because no markup exists yet.
 */

const KW = {
    python: /\b(?:def|class|return|import|from|as|if|elif|else|for|while|in|not|and|or|is|None|True|False|with|try|except|finally|raise|yield|lambda|async|await|pass|break|continue|global|assert|del)\b/g,
    js: /\b(?:const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|this|null|undefined|true|false|break|continue|switch|case|do|yield)\b/g,
    sql: /\b(?:SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|ON|GROUP|ORDER|BY|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|AS|AND|OR|NOT|NULL|IS|IN|BETWEEN|LIKE|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|UNION|ALL|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|WITH)\b/gi,
    bash: /(?:^|[|&;(]\s*)\b(?:npm|npx|node|python3?|pip3?|git|cd|ls|mkdir|rm|cp|mv|cat|echo|curl|wget|sudo|apt|brew|docker|kubectl|export|source|chmod|ssh|grep|make)\b/g,
};

/* Ordered. The first rule to claim a stretch of text keeps it, so anything
 * that can contain another token (comments, strings) has to come first. */
const RULES = {
    prompt: [
        ['hl-com', /^\s*(?:#|\/\/)[^\n]*/gm],
        ['hl-str', /"[^"\n]*"|\u201c[^\u201d\n]*\u201d/g],
        // The bracketed bits are the whole point of a prompt: replace these.
        ['hl-ph', /\[[^\]\n]{1,80}\]|\{\{[^}\n]{1,80}\}\}/g],
        // A leading SECTION: label, e.g. "PROJECT:" or "ME:".
        ['hl-lbl', /^[ \t]*[A-Z][A-Z0-9 _-]{1,28}:/gm],
        // A numbered or bulleted step marker.
        ['hl-num', /^[ \t]*(?:\d{1,2}[.)]|[-*\u2022])(?=\s)/gm],
    ],
    python: [
        ['hl-com', /#[^\n]*/g],
        ['hl-str', /(?:[rfbRFB]{1,2})?(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g],
        // Before hl-fn, or "@mcp.tool" loses its second half to the function
        // rule and the decorator ends up two different colours.
        ['hl-dec', /@[A-Za-z_][\w.]*/g],
        ['hl-kw', KW.python],
        ['hl-fn', /\b[A-Za-z_]\w*(?=\s*\()/g],
        ['hl-num', /\b\d+(?:\.\d+)?\b/g],
    ],
    js: [
        ['hl-com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//g],
        ['hl-str', /`(?:[^`\\]|\\.)*`|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g],
        ['hl-kw', KW.js],
        ['hl-fn', /\b[A-Za-z_$][\w$]*(?=\s*\()/g],
        ['hl-num', /\b\d+(?:\.\d+)?\b/g],
    ],
    json: [
        ['hl-key', /"(?:[^"\\]|\\.)*"(?=\s*:)/g],
        ['hl-str', /"(?:[^"\\]|\\.)*"/g],
        ['hl-kw', /\b(?:true|false|null)\b/g],
        ['hl-num', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g],
    ],
    html: [
        ['hl-com', /<!--[\s\S]*?-->/g],
        ['hl-str', /"[^"\n]*"|'[^'\n]*'/g],
        ['hl-tag', /<\/?[A-Za-z][\w-]*|\/?>/g],
        ['hl-attr', /\b[a-zA-Z-]+(?==)/g],
    ],
    css: [
        ['hl-com', /\/\*[\s\S]*?\*\//g],
        ['hl-str', /"[^"\n]*"|'[^'\n]*'/g],
        ['hl-attr', /[-a-z]+(?=\s*:)/g],
        ['hl-num', /-?\b\d+(?:\.\d+)?(?:px|rem|em|%|s|ms|vh|vw|fr|deg)?\b|#[0-9a-fA-F]{3,8}\b/g],
    ],
    sql: [
        ['hl-com', /--[^\n]*|\/\*[\s\S]*?\*\//g],
        ['hl-str', /'(?:[^'\\\n]|\\.)*'/g],
        ['hl-kw', KW.sql],
        ['hl-num', /\b\d+(?:\.\d+)?\b/g],
    ],
    bash: [
        ['hl-com', /^\s*#[^\n]*/gm],
        ['hl-str', /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g],
        ['hl-kw', KW.bash],
        ['hl-flag', /(?:^|\s)--?[A-Za-z][\w-]*/g],
    ],
    text: [],
};

/* ------------------------------------------------------------- detection */

/* Only used when the author has not said. Deliberately conservative: an
 * unrecognised block falls through to "prompt", which is both the most common
 * case here and the safest, since its rules only match unambiguous shapes. */
function detect(text) {
    const t = text.trim();
    if (!t) return 'text';

    if (/^\s*[[{][\s\S]*[\]}]\s*$/.test(t) && /"\s*:/.test(t)) return 'json';
    if (/^\s*<(?:!DOCTYPE|html|div|p|a|section|head|body|span|ul|li|script)\b/i.test(t)) return 'html';
    if (/^\s*[.#a-z][\w-]*[^{}\n]*\{[^}]*:[^}]*\}/i.test(t) && !/\bfunction\b|=>/.test(t)) return 'css';
    if (/^\s*(?:def |class |import |from \w+ import|@\w)/m.test(t)) return 'python';
    if (/\b(?:const|let|var|function)\b\s+\w+|=>|document\.|console\./.test(t)) return 'js';
    if (/^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/im.test(t)) return 'sql';
    if (/^\s*[$>]?\s*(?:npm|npx|node|python3?|pip3?|git|cd|mkdir|curl|docker|sudo)\s/m.test(t)) return 'bash';

    return 'prompt';
}

/* ---------------------------------------------------------------- render */

function escape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Collect non-overlapping spans, earlier rules winning, then emit once. */
function paint(text, rules) {
    const taken = [];

    for (const [cls, re] of rules) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text)) !== null) {
            // A zero-width match would spin forever.
            if (m[0].length === 0) { re.lastIndex += 1; continue; }

            // Some patterns need leading context (a space, a pipe) to match at
            // all but should not colour it, so trim to the meaningful part.
            let start = m.index;
            let end = start + m[0].length;
            const lead = m[0].match(/^[\s|&;(]+/);
            if (lead && cls !== 'hl-com' && cls !== 'hl-str') start += lead[0].length;
            if (start >= end) continue;

            let clash = false;
            for (const s of taken) {
                if (start < s.end && end > s.start) { clash = true; break; }
            }
            if (!clash) taken.push({ start, end, cls });
        }
    }

    if (!taken.length) return escape(text);

    taken.sort((a, b) => a.start - b.start);

    let out = '';
    let at = 0;
    for (const s of taken) {
        out += escape(text.slice(at, s.start));
        out += '<span class="' + s.cls + '">' + escape(text.slice(s.start, s.end)) + '</span>';
        at = s.end;
    }
    return out + escape(text.slice(at));
}

function langOf(el) {
    const attr = (el.getAttribute('data-lang')
        || (el.className.match(/\blanguage-([\w-]+)/) || [])[1]
        || '').toLowerCase();
    if (attr && RULES[attr]) return attr;
    if (attr === 'sh' || attr === 'shell' || attr === 'console') return 'bash';
    if (attr === 'py') return 'python';
    if (attr === 'javascript') return 'js';
    return detect(el.textContent || '');
}

export function initHighlight() {
    const blocks = document.querySelectorAll('pre');
    if (!blocks.length) return;

    blocks.forEach((pre) => {
        if (pre.dataset.hl) return;

        // The block is marked whatever happens, so the light styling applies
        // even to blocks we choose not to colour.
        const code = pre.querySelector('code');
        const target = code || pre;
        const text = target.textContent || '';

        const lang = langOf(target);
        pre.dataset.hl = lang;

        // Below this the colour is noise, not signal.
        if (text.trim().length < 12) return;
        if (!RULES[lang] || !RULES[lang].length) return;

        // Never touch a block that already contains markup an author put there
        // on purpose. Rewriting innerHTML would throw it away.
        if (target.children.length) return;

        try {
            const html = paint(text, RULES[lang]);
            // Cheap guard: the visible text must be unchanged.
            const probe = document.createElement('div');
            probe.innerHTML = html;
            if ((probe.textContent || '') === text) target.innerHTML = html;
        } catch (err) {
            console.warn('[highlight] skipped a block:', err);
        }
    });
}
