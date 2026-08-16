/* Shared site chrome.
 * - Top bar: menu toggle + brand, and (desktop only) Home / About / Contact.
 * - Left sidebar: a live search box + the guides, grouped. On mobile it also
 *   lists Home / About / Contact so the top bar can stay clean.
 * - The menu button (☰) collapses the sidebar on desktop (remembered) and
 *   opens it as a drawer on mobile.
 */

const SITE_LINKS = [
    { href: 'index.html', label: 'Home', icon: '🏠', match: ['index.html', ''] },
    { href: 'about.html', label: 'About', icon: '👋' },
    { href: 'collaborate.html', label: 'Collaborate', icon: '🤝' },
    { href: 'contact.html', label: 'Contact', icon: '📬' },
];

const GROUPS = [
    { title: 'Roadmaps', items: [
        { href: '12-week-roadmap.html', label: '12-Week Roadmap', icon: '📋' },
        { href: 'AI-Roadmap.html', label: 'AI Developer Roadmap', icon: '🤖' },
        { href: 'prompt-engineering-roadmap.html', label: 'Prompt Engineering', icon: '✨' },
        { href: 'cybersecurity-roadmap.html', label: 'Cyber Security Roadmap', icon: '🛡️' },
    ]},
    { title: 'Core Skills', items: [
        { href: 'git-guide.html', label: 'Git Guide', icon: '🚀' },
        { href: 'dsa-practice-guide.html', label: 'DSA Practice', icon: '💻' },
        { href: 'system-design-templates.html', label: 'System Design', icon: '🎯' },
        { href: 'cs-fundamentals-guide.html', label: 'CS Fundamentals', icon: '🧠' },
        { href: 'sql-databases-guide.html', label: 'SQL & Databases', icon: '🗄️' },
    ]},
    { title: 'CS Deep Dives', items: [
        { href: 'operating-systems-deep-dive.html', label: 'Operating Systems', icon: '🖥️' },
        { href: 'dbms-deep-dive.html', label: 'DBMS', icon: '🗃️' },
        { href: 'computer-networks-deep-dive.html', label: 'Computer Networks', icon: '🌐' },
        { href: 'oop-deep-dive.html', label: 'OOP', icon: '🧩' },
    ]},
    { title: 'Learn to Build', items: [
        { href: 'full-stack-developer-path.html', label: 'Full-Stack Path', icon: '🌐' },
        { href: 'cloud-devops-starter.html', label: 'Cloud & DevOps', icon: '☁️' },
        { href: 'open-source-guide.html', label: 'Open Source', icon: '🌍' },
    ]},
    { title: 'Build a Project', items: [
        { href: 'build-a-website.html', label: 'Build a Website', icon: '🌐' },
        { href: 'build-ai-agent.html', label: 'Build an AI Agent', icon: '🤖' },
        { href: 'networking-toolkit.html', label: 'Networking Toolkit', icon: '🛰️' },
    ]},
    { title: 'Land the Job', items: [
        { href: 'trending-tech-roles.html', label: 'Trending Tech Roles', icon: '🚀' },
        { href: 'career-portals.html', label: 'Career Portals', icon: '🏢' },
        { href: 'linkedin-utilization-guide.html', label: 'LinkedIn Guide', icon: '💼' },
        { href: 'resume-portfolio-templates.html', label: 'Resume & Portfolio', icon: '📄' },
        { href: 'interview-prep-kit.html', label: 'Interview Prep', icon: '🗣️' },
        { href: 'star-method.html', label: 'STAR Method', icon: '⭐' },
        { href: 'salary-negotiation-guide.html', label: 'Salary Negotiation', icon: '💰' },
        { href: 'ai-era-job-hunt.html', label: 'AI Era Job Hunt', icon: '🧭' },
        { href: 'big-tech-core-models.html', label: 'Big Tech Models', icon: '🏢' },
    ]},
    { title: 'Tools', items: [
        { href: 'ai-tools.html', label: 'AI Tools', icon: '🛠️' },
    ]},
];

const SIDEBAR_W = 250;
const TOPBAR_H = 56;
const COLLAPSE_KEY = 'sidebar_collapsed';

// Brand mark: a heart shape with an "S" swash through it (original, gradient).
const HEART_S_SVG = `<svg viewBox="0 0 32 32" role="img" aria-label="Resources logo">
    <defs><linearGradient id="heartS" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#ec4899"/>
    </linearGradient></defs>
    <path fill="url(#heartS)" d="M16 28.5C7.5 22.6 2.8 16.6 2.8 10.9 2.8 7.1 5.7 4.4 9.2 4.4c2.6 0 5 1.5 6.8 4 1.8-2.5 4.2-4 6.8-4 3.5 0 6.4 2.7 6.4 6.5 0 5.7-4.7 11.7-13.2 17.6z"/>
    <path fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
        d="M20.2 11.4c-1.2-1.1-3-1.5-4.6-1-1.5.5-2.2 1.9-1.3 3 .9 1.2 3.2 1.2 4.4 2.1 1.2.9.9 2.6-.6 3.2-1.6.6-3.6.2-4.9-.9"/>
</svg>`;

const CSS = `
:root { --sidebar-w: ${SIDEBAR_W}px; --topbar-h: ${TOPBAR_H}px; }

.site-topbar{position:fixed;top:0;left:0;right:0;height:var(--topbar-h);z-index:9500;
    display:flex;align-items:center;gap:.6rem;padding:0 .9rem;
    background:var(--glass-bg, rgba(255,255,255,.85));backdrop-filter:blur(12px);
    border-bottom:1px solid var(--border,#e5e7eb);}
.site-menu-btn{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;
    border:1px solid var(--border);background:var(--bg-primary);border-radius:10px;cursor:pointer;
    font-size:1.15rem;color:var(--text-primary);flex-shrink:0;}
.site-menu-btn:hover{border-color:var(--primary);color:var(--primary);}
.site-topbar__brand{display:inline-flex;align-items:center;gap:.5rem;font-family:var(--font-display,inherit);
    font-weight:700;color:var(--text-primary,#111);text-decoration:none;white-space:nowrap;}
.site-topbar__brand .spark{display:inline-flex;width:30px;height:30px;align-items:center;justify-content:center;}
.site-topbar__brand .spark svg{width:30px;height:30px;display:block;filter:drop-shadow(0 2px 5px rgba(124,58,237,.35));}
.site-topbar__brand .brand-name{display:inline-flex;align-items:baseline;gap:.32rem;}
.site-topbar__brand .brand-name em{font-style:normal;font-weight:600;font-size:.82em;
    color:var(--text-secondary,#666);letter-spacing:.01em;}
@media (max-width:560px){
    .site-topbar__brand .brand-name em{display:none;}
}
.site-topbar__spacer{flex:1;}
.site-topbar__links{display:flex;align-items:center;gap:.3rem;}
.site-topbar__links a{white-space:nowrap;text-decoration:none;font:600 .9rem/1 var(--font-sans,inherit);
    color:var(--text-secondary,#555);padding:.5rem .8rem;border-radius:999px;transition:all .18s ease;}
.site-topbar__links a:hover{color:var(--primary);background:var(--bg-tertiary,#f1f5f9);}
.site-topbar__links a.active{color:#fff;background:linear-gradient(135deg,var(--primary),var(--secondary));}

.site-sidebar{position:fixed;top:var(--topbar-h);left:0;bottom:0;width:var(--sidebar-w);z-index:9400;
    display:flex;flex-direction:column;background:var(--bg-secondary,#f7f8fc);
    border-right:1px solid var(--border,#e5e7eb);transition:transform .25s ease;}
.site-search{padding:.85rem .8rem .4rem;}
.site-search input{width:100%;box-sizing:border-box;padding:.55rem .7rem;border:1px solid var(--border);
    border-radius:10px;background:var(--bg-primary);color:var(--text-primary);
    font:500 .88rem/1 var(--font-sans,inherit);}
.site-search input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px var(--ring);}
.site-sidebar__scroll{flex:1;overflow-y:auto;padding:.4rem .8rem 2rem;}
.site-sidebar__group{margin-bottom:1.05rem;}
.site-sidebar__title{font:700 .72rem/1 var(--font-sans,inherit);text-transform:uppercase;letter-spacing:.08em;
    color:var(--text-secondary,#666);padding:.3rem .7rem .5rem;}
.site-sidebar a{display:flex;align-items:center;gap:.6rem;text-decoration:none;border-radius:10px;
    padding:.55rem .7rem;font:600 .9rem/1.2 var(--font-sans,inherit);color:var(--text-primary,#111);transition:all .16s ease;}
.site-sidebar a .ic{width:1.3rem;text-align:center;}
.site-sidebar a:hover{background:var(--bg-tertiary,#eef1f8);color:var(--primary);}
.site-sidebar a.active{background:linear-gradient(135deg,var(--primary),var(--secondary));color:#fff;}
.site-sidebar__site{display:none;} /* site links appear in sidebar only on mobile */
.site-noresult{display:none;color:var(--text-secondary);font-size:.85rem;padding:.5rem .7rem;}

.site-backdrop{position:fixed;inset:0;z-index:9300;background:rgba(15,23,42,.45);opacity:0;pointer-events:none;transition:opacity .25s ease;}

    /* Layout offsets
       NOTE: body padding is also declared in theme-variables.css so the space is
       reserved before this script runs. Without that, the page painted first and
       then jumped, causing severe layout shift. These rules stay here only to add
       the transition and the collapsed-state behaviour. Keep the values in sync. */
    body{transition:padding-left .25s ease;}
    @media (min-width:1024px){
    body.sidebar-collapsed .site-sidebar{transform:translateX(-100%);}
}
@media (max-width:1023px){
    .site-topbar__links{display:none;}          /* declutter: site links move to the drawer */
    .site-sidebar__site{display:block;}
    .site-sidebar{transform:translateX(-100%);box-shadow:0 12px 40px rgba(2,6,23,.25);}
    body.sidebar-open .site-sidebar{transform:translateX(0);}
    body.sidebar-open .site-backdrop{opacity:1;pointer-events:auto;}
}

.back-nav, [data-component="back-nav"]{display:none !important;}
.theme-switcher{top:calc(var(--topbar-h) + 12px) !important;z-index:9200;}
`;

export function renderNav() {
    if (document.querySelector('.site-topbar')) return;
    injectStyle('site-nav-css', CSS);

    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const isActive = (l) => (l.match || [l.href]).map((m) => m.toLowerCase()).includes(current);

    // Top bar
    const top = document.createElement('nav');
    top.className = 'site-topbar';
    top.setAttribute('aria-label', 'Primary');
    const topLinks = SITE_LINKS.map((l) =>
        `<a href="./${l.href}"${isActive(l) ? ' class="active" aria-current="page"' : ''}>${l.label}</a>`).join('');
    top.innerHTML =
        `<button class="site-menu-btn" id="siteMenuBtn" aria-label="Toggle menu" aria-expanded="false">☰</button>` +
        `<a class="site-topbar__brand" href="./index.html"><span class="spark">${HEART_S_SVG}</span><span class="brand-name">Resources <em>by Shumbul</em></span></a>` +
        `<span class="site-topbar__spacer"></span>` +
        `<div class="site-topbar__links">${topLinks}</div>`;

    // Sidebar
    const side = document.createElement('aside');
    side.className = 'site-sidebar';
    side.setAttribute('aria-label', 'Guides');

    const siteLinksHtml =
        `<div class="site-sidebar__group site-sidebar__site" data-searchgroup>
            <div class="site-sidebar__title">Menu</div>` +
        SITE_LINKS.map((l) =>
            `<a href="./${l.href}" data-label="${l.label.toLowerCase()}"${isActive(l) ? ' class="active" aria-current="page"' : ''}><span class="ic">${l.icon}</span>${l.label}</a>`).join('') +
        `</div>`;

    const groupsHtml = GROUPS.map((g) => {
        const items = g.items.map((it) => {
            const on = it.href.toLowerCase() === current;
            return `<a href="./${it.href}" data-label="${it.label.toLowerCase()}"${on ? ' class="active" aria-current="page"' : ''}><span class="ic">${it.icon}</span>${it.label}</a>`;
        }).join('');
        return `<div class="site-sidebar__group" data-searchgroup><div class="site-sidebar__title">${g.title}</div>${items}</div>`;
    }).join('');

    side.innerHTML =
        `<div class="site-search">
            <input type="search" id="siteSearch" placeholder="Search guides..." aria-label="Search guides" autocomplete="off">
        </div>
        <div class="site-sidebar__scroll">
            ${siteLinksHtml}
            ${groupsHtml}
            <p class="site-noresult" id="siteNoResult">No guides match your search.</p>
        </div>`;

    const backdrop = document.createElement('div');
    backdrop.className = 'site-backdrop';

    document.body.insertBefore(top, document.body.firstChild);
    document.body.appendChild(side);
    document.body.appendChild(backdrop);

    // Restore desktop collapsed state
    if (localStorage.getItem(COLLAPSE_KEY) === '1') document.body.classList.add('sidebar-collapsed');

    const btn = top.querySelector('#siteMenuBtn');
    const isDesktop = () => window.matchMedia('(min-width:1024px)').matches;

    function toggle() {
        if (isDesktop()) {
            const collapsed = document.body.classList.toggle('sidebar-collapsed');
            localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
            btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        } else {
            const open = document.body.classList.toggle('sidebar-open');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
    }
    btn.addEventListener('click', toggle);
    backdrop.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
    side.addEventListener('click', (e) => { if (e.target.closest('a')) document.body.classList.remove('sidebar-open'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.body.classList.remove('sidebar-open'); });

    // Live search filter
    const search = side.querySelector('#siteSearch');
    const noResult = side.querySelector('#siteNoResult');
    search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        let anyVisible = false;
        side.querySelectorAll('[data-searchgroup]').forEach((group) => {
            let groupVisible = false;
            group.querySelectorAll('a[data-label]').forEach((a) => {
                const show = !q || a.getAttribute('data-label').includes(q);
                a.style.display = show ? '' : 'none';
                if (show) { groupVisible = true; anyVisible = true; }
            });
            group.style.display = groupVisible ? '' : 'none';
        });
        noResult.style.display = anyVisible ? 'none' : 'block';
    });
}

function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
}
