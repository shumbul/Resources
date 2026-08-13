/**
 * seo.js
 *
 * IMPORTANT: the authoritative SEO tags are written into each HTML file by
 * `build-seo.py` at build time. Social crawlers (Facebook, LinkedIn, WhatsApp,
 * Slack, X) do not execute JavaScript, so anything injected here is invisible
 * to them.
 *
 * This module is therefore only a *safety net*. It fills in tags that are
 * genuinely absent, which can happen if a page was hand-created and the build
 * script has not been run yet. It never overwrites a value that already exists.
 *
 * If you add a page: run `python build-seo.py` from the repo root.
 */

const ORIGIN = 'https://shumbul.github.io/Resources';
const SITE_NAME = 'Resources by Shumbul Arifa';
const AUTHOR = 'Shumbul Arifa';
const DEFAULT_IMAGE = ORIGIN + '/og-image.png';

function head() { return document.head || document.getElementsByTagName('head')[0]; }

/** Only create the tag when it is missing. Never clobbers author intent. */
function fillMeta(attr, key, content) {
    if (!content) return;
    const existing = head().querySelector(`meta[${attr}="${key}"]`);
    if (existing && existing.getAttribute('content')) return;   // already set, leave alone
    const el = existing || document.createElement('meta');
    if (!existing) el.setAttribute(attr, key);
    el.setAttribute('content', content);
    if (!existing) head().appendChild(el);
}

function pageFile() {
    const p = location.pathname.split('/').pop();
    return (!p || p === '') ? 'index.html' : p;
}

function canonicalUrl() {
    const f = pageFile();
    return f === 'index.html' ? ORIGIN + '/' : ORIGIN + '/' + f;
}

function pageDescription() {
    const m = head().querySelector('meta[name="description"]');
    if (m && m.content) return m.content.trim();
    const p = document.querySelector('main p, .guide-sub, .hero-subtitle');
    if (p) return p.textContent.trim().replace(/\s+/g, ' ').slice(0, 158);
    return 'Free, practical tech-career guides and roadmaps by Shumbul Arifa.';
}

function bareTitle() {
    return document.title.split('|')[0].trim() || 'Resources';
}

export function initSeo() {
    // If build-seo.py has already run, there is nothing to do.
    const built = head().querySelector('link[rel="canonical"]');
    const hasLd = head().querySelector('script[type="application/ld+json"]');
    if (built && hasLd) return;

    const url = canonicalUrl();
    const desc = pageDescription();
    const title = bareTitle();
    const isHome = pageFile() === 'index.html';

    if (!built) {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = url;
        head().appendChild(link);
    }

    fillMeta('property', 'og:url', url);
    fillMeta('property', 'og:title', title);
    fillMeta('property', 'og:description', desc);
    fillMeta('property', 'og:site_name', SITE_NAME);
    fillMeta('property', 'og:type', isHome ? 'website' : 'article');
    fillMeta('property', 'og:image', DEFAULT_IMAGE);
    fillMeta('property', 'og:locale', 'en_US');

    fillMeta('name', 'twitter:card', 'summary_large_image');
    fillMeta('name', 'twitter:title', title);
    fillMeta('name', 'twitter:description', desc);
    fillMeta('name', 'twitter:image', DEFAULT_IMAGE);

    fillMeta('name', 'description', desc);
    fillMeta('name', 'author', AUTHOR);
    fillMeta('name', 'robots', 'index, follow, max-image-preview:large');

    if (hasLd) return;

    const graph = [
        {
            '@type': 'WebSite',
            '@id': ORIGIN + '/#website',
            url: ORIGIN + '/',
            name: SITE_NAME,
            inLanguage: 'en',
            publisher: { '@id': ORIGIN + '/#person' }
        },
        {
            '@type': 'Person',
            '@id': ORIGIN + '/#person',
            name: AUTHOR,
            url: ORIGIN + '/about.html',
            sameAs: [
                'https://github.com/shumbul',
                'https://linkedin.com/in/shumbul',
                'https://instagram.com/shumbul.arifa',
                'https://www.youtube.com/@Shumbul'
            ]
        },
        {
            '@type': isHome ? 'CollectionPage' : 'WebPage',
            '@id': url + '#webpage',
            url: url,
            name: document.title,
            description: desc,
            inLanguage: 'en',
            isPartOf: { '@id': ORIGIN + '/#website' }
        }
    ];

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    head().appendChild(ld);
}
