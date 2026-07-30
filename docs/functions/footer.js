/* Shared footer. Injected ONLY when the page has no footer of its own,
 * so nothing is hardcoded per page. Call renderFooter() once. */

const CSS = `
.site-footer{margin-top:3rem;padding:2rem 1rem;text-align:center;border-top:1px solid var(--border,#e5e7eb);
    background:var(--bg-secondary,#f9fafb);}
.site-footer .row{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-bottom:.75rem;}
.site-footer a{color:var(--primary,#8b5cf6);text-decoration:none;font-weight:600;font-size:.9rem;}
.site-footer a:hover{text-decoration:underline;}
.site-footer p{color:var(--text-secondary,#777);font-size:.85rem;margin:0;}
`;

export function renderFooter() {
    // Respect any existing footer (real <footer> or component placeholder).
    if (document.querySelector('footer, .site-footer, [data-component="footer"]')) return;

    if (!document.getElementById('site-footer-css')) {
        const s = document.createElement('style');
        s.id = 'site-footer-css';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    const f = document.createElement('footer');
    f.className = 'site-footer';
    f.innerHTML =
        `<div class="row">
            <a href="./index.html">All Resources</a>
            <a href="https://github.com/shumbul" target="_blank" rel="noopener">GitHub</a>
            <a href="https://linkedin.com/in/shumbul" target="_blank" rel="noopener">LinkedIn</a>
            <a href="https://www.youtube.com/@Shumbul" target="_blank" rel="noopener">YouTube</a>
        </div>
        <p>Created with care by Shumbul Arifa &middot; &copy; 2026</p>`;
    document.body.appendChild(f);
}
