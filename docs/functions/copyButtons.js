/* Adds a "Copy" button to any <pre> code block that doesn't already have one.
 * Pages that ship their own copy UI (e.g. .code-block-copy) are left untouched. */

const CSS = `
.fn-pre-wrap{position:relative;}
.fn-copy-btn{position:absolute;top:8px;right:8px;z-index:2;border:1px solid var(--border,#e5e7eb);
    background:var(--bg-primary,#fff);color:var(--text-secondary,#555);border-radius:8px;
    padding:.3rem .6rem;font:600 .75rem/1 var(--font-sans,inherit);cursor:pointer;opacity:.85;}
.fn-copy-btn:hover{color:var(--primary,#8b5cf6);border-color:var(--primary,#8b5cf6);opacity:1;}
.fn-copy-btn.copied{color:#fff;background:var(--success,#059669);border-color:var(--success,#059669);}
`;

export function initCopyButtons() {
    const blocks = Array.from(document.querySelectorAll('pre')).filter((pre) => {
        // Skip blocks that already have a custom copy button nearby.
        if (pre.closest('.code-block-container')) return false;
        if (pre.querySelector('.fn-copy-btn')) return false;
        return (pre.textContent || '').trim().length > 0;
    });
    if (!blocks.length) return;

    if (!document.getElementById('fn-copy-css')) {
        const s = document.createElement('style');
        s.id = 'fn-copy-css';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    blocks.forEach((pre) => {
        if (getComputedStyle(pre).position === 'static') pre.classList.add('fn-pre-wrap');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fn-copy-btn';
        btn.textContent = 'Copy';
        btn.addEventListener('click', async () => {
            const code = pre.querySelector('code') || pre;
            const text = code.textContent || '';
            try {
                await navigator.clipboard.writeText(text);
            } catch {
                const ta = document.createElement('textarea');
                ta.value = text; document.body.appendChild(ta); ta.select();
                try { document.execCommand('copy'); } catch {}
                ta.remove();
            }
            btn.classList.add('copied');
            const prev = btn.textContent; btn.textContent = 'Copied!';
            setTimeout(() => { btn.classList.remove('copied'); btn.textContent = prev; }, 1800);
        });
        pre.appendChild(btn);
    });
}
