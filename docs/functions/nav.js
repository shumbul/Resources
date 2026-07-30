/* Shared site chrome: a top bar for site-level links (Home, About, Contact)
 * plus a left sidebar that lists the guides, grouped. Call renderNav() once.
 *
 * - Desktop (>=1024px): sidebar is always visible and gently pushes content right.
 * - Mobile/tablet: sidebar becomes an off-canvas drawer toggled by the menu button.
 * - Any legacy per-page "Back to Resources" nav is hidden, since the sidebar replaces it.
 */

const TOP_LINKS = [
    { href: 'index.html', label: 'Home', match: ['index.html', ''] },
    { href: 'about.html', label: 'About' },
    { href: 'contact.html', label: 'Contact' },
];

// Guides grouped for the sidebar.
const GROUPS = [
    { title: 'Roadmaps', items: [
        { href: '12-week-roadmap.html', label: '12-Week Roadmap', icon: '📋' },
        { href: 'AI-Roadmap.html', label: 'AI Developer Roadmap', icon: '🤖' },
    ]},
    { title: 'Core Skills', items: [
        { href: 'git-guide.html', label: 'Git Guide', icon: '🚀' },
        { href: 'dsa-practice-guide.html', label: 'DSA Practice', icon: '💻' },
        { href: 'system-design-templates.html', label: 'System Design', icon: '🎯' },
    ]},
    { title: 'Land the Job', items: [
        { href: 'linkedin-utilization-guide.html', label: 'LinkedIn Guide', icon: '💼' },
        { href: 'resume-portfolio-templates.html', label: 'Resume & Portfolio', icon: '📄' },
        { href: 'interview-prep-kit.html', label: 'Interview Prep', icon: '🗣️' },
        { href: 'ai-era-job-hunt.html', label: 'AI Era Job Hunt', icon: '🧭' },
        { href: 'big-tech-core-models.html', label: 'Big Tech Models', icon: '🏢' },
    ]},
    { title: 'Tools', items: [
        { href: 'ai-tools.html', label: 'AI Tools', icon: '🛠️' },
    ]},
];

const SIDEBAR_W = 250;
const TOPBAR_H = 56;

const CSS = `
:root { --sidebar-w: ${SIDEBAR_W}px; --topbar-h: ${TOPBAR_H}px; }

/* Top bar (site level) */
.site-topbar{position:fixed;top:0;left:0;right:0;height:var(--topbar-h);z-index:9500;
    display:flex;align-items:center;gap:.75rem;padding:0 1rem;
    background:var(--glass-bg, rgba(255,255,255,.8));backdrop-filter:blur(12px);
    border-bottom:1px solid var(--border,#e5e7eb);}
.site-topbar__brand{display:inline-flex;align-items:center;gap:.5rem;font-family:var(--font-display,inherit);
    font-weight:700;color:var(--text-primary,#111);text-decoration:none;white-space:nowrap;}
.site-topbar__brand .spark{display:inline-flex;width:28px;height:28px;align-items:center;justify-content:center;
    border-radius:8px;color:#fff;background:linear-gradient(135deg,var(--primary),var(--secondary));font-size:.95rem;}
.site-topbar__spacer{flex:1;}
.site-topbar__links{display:flex;align-items:center;gap:.3rem;}
.site-topbar__links a{white-space:nowrap;text-decoration:none;font:600 .9rem/1 var(--font-sans,inherit);
    color:var(--text-secondary,#555);padding:.5rem .8rem;border-radius:999px;transition:all .18s ease;}
.site-topbar__links a:hover{color:var(--primary);background:var(--bg-tertiary,#f1f5f9);}
.site-topbar__links a.active{color:#fff;background:linear-gradient(135deg,var(--primary),var(--secondary));}
.site-menu-btn{display:none;align-items:center;justify-content:center;width:40px;height:40px;border:1px solid var(--border);
    background:var(--bg-primary);border-radius:10px;cursor:pointer;font-size:1.1rem;color:var(--text-primary);}

/* Sidebar (guides) */
.site-sidebar{position:fixed;top:var(--topbar-h);left:0;bottom:0;width:var(--sidebar-w);z-index:9400;
    overflow-y:auto;padding:1rem .8rem 2rem;background:var(--bg-secondary,#f7f8fc);
    border-right:1px solid var(--border,#e5e7eb);transition:transform .25s ease;}
.site-sidebar__group{margin-bottom:1.1rem;}
.site-sidebar__title{font:700 .72rem/1 var(--font-sans,inherit);text-transform:uppercase;letter-spacing:.08em;
    color:var(--text-secondary,#666);padding:.3rem .7rem .5rem;}
.site-sidebar a{display:flex;align-items:center;gap:.6rem;text-decoration:none;border-radius:10px;
    padding:.55rem .7rem;font:600 .9rem/1.2 var(--font-sans,inherit);color:var(--text-primary,#111);transition:all .16s ease;}
.site-sidebar a .ic{width:1.3rem;text-align:center;}
.site-sidebar a:hover{background:var(--bg-tertiary,#eef1f8);color:var(--primary);}
.site-sidebar a.active{background:linear-gradient(135deg,var(--primary),var(--secondary));color:#fff;}
.site-sidebar__foot{margin-top:1rem;padding-top:.7rem;border-top:1px solid var(--border);}

.site-backdrop{position:fixed;inset:0;z-index:9300;background:rgba(15,23,42,.45);opacity:0;pointer-events:none;transition:opacity .25s ease;}

/* Layout offsets */
body{padding-top:var(--topbar-h);}
@media (min-width:1024px){ body{padding-left:var(--sidebar-w);} }
@media (max-width:1023px){
    .site-sidebar{transform:translateX(-100%);box-shadow:0 12px 40px rgba(2,6,23,.25);}
    body.sidebar-open .site-sidebar{transform:translateX(0);}
    body.sidebar-open .site-backdrop{opacity:1;pointer-events:auto;}
    .site-menu-btn{display:inline-flex;}
}

/* Hide legacy per-page back links for a consistent nav experience. */
.back-nav, [data-component="back-nav"]{display:none !important;}

/* Nudge the floating theme switcher clear of the fixed top bar. */
.theme-switcher{top:calc(var(--topbar-h) + 12px) !important;z-index:9200;}
`;

export function renderNav() {
    if (document.querySelector('.site-topbar')) return;
    injectStyle('site-nav-css', CSS);

    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    // Top bar
    const top = document.createElement('nav');
    top.className = 'site-topbar';
    top.setAttribute('aria-label', 'Primary');
    const topLinks = TOP_LINKS.map((l) => {
        const active = (l.match || [l.href]).map((m) => m.toLowerCase()).includes(current);
        return `<a href="./${l.href}"${active ? ' class="active" aria-current="page"' : ''}>${l.label}</a>`;
    }).join('');
    top.innerHTML =
        `<button class="site-menu-btn" id="siteMenuBtn" aria-label="Open guides menu" aria-expanded="false">☰</button>` +
        `<a class="site-topbar__brand" href="./index.html"><span class="spark">✦</span><span>Resources</span></a>` +
        `<span class="site-topbar__spacer"></span>` +
        `<div class="site-topbar__links">${topLinks}</div>`;

    // Sidebar
    const side = document.createElement('aside');
    side.className = 'site-sidebar';
    side.setAttribute('aria-label', 'Guides');
    const groupsHtml = GROUPS.map((g) => {
        const items = g.items.map((it) => {
            const on = it.href.toLowerCase() === current;
            return `<a href="./${it.href}"${on ? ' class="active" aria-current="page"' : ''}><span class="ic">${it.icon}</span>${it.label}</a>`;
        }).join('');
        return `<div class="site-sidebar__group"><div class="site-sidebar__title">${g.title}</div>${items}</div>`;
    }).join('');
    side.innerHTML = groupsHtml;

    const backdrop = document.createElement('div');
    backdrop.className = 'site-backdrop';

    document.body.insertBefore(top, document.body.firstChild);
    document.body.appendChild(side);
    document.body.appendChild(backdrop);

    // Drawer toggle (mobile)
    const btn = top.querySelector('#siteMenuBtn');
    const setOpen = (open) => {
        document.body.classList.toggle('sidebar-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    btn.addEventListener('click', () => setOpen(!document.body.classList.contains('sidebar-open')));
    backdrop.addEventListener('click', () => setOpen(false));
    side.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
}
