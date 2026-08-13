/**
 * seo.js
 * Injects per-page SEO tags that cannot live in the shared head partial
 * because they depend on the current URL and page content:
 *
 *   - <link rel="canonical">      one authoritative URL per page
 *   - og:title / og:description   filled from the page when missing
 *   - og:image + twitter:image    social share card
 *   - JSON-LD structured data     WebSite + WebPage + BreadcrumbList
 *
 * Runs on every page via site.js. No dependencies.
 */

const ORIGIN = 'https://shumbul.github.io/Resources';
const SITE_NAME = 'Resources by Shumbul Arifa';
const AUTHOR = 'Shumbul Arifa';
const OG_IMAGE = ORIGIN + '/og-image.png';

function head() { return document.head || document.getElementsByTagName('head')[0]; }

function upsertMeta(attr, key, content) {
    if (!content) return;
    let el = head().querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        head().appendChild(el);
    }
    // never clobber a hand-written value
    if (!el.getAttribute('content')) el.setAttribute('content', content);
}

function forceMeta(attr, key, content) {
    if (!content) return;
    let el = head().querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        head().appendChild(el);
    }
    el.setAttribute('content', content);
}

/** current file name, e.g. "about.html" */
function pageFile() {
    const p = location.pathname.split('/').pop();
    return (!p || p === '') ? 'index.html' : p;
}

function canonicalUrl() {
    const f = pageFile();
    return f === 'index.html' ? ORIGIN + '/' : ORIGIN + '/' + f;
}

/** best-effort page description */
function pageDescription() {
    const m = head().querySelector('meta[name="description"]');
    if (m && m.content) return m.content.trim();
    const p = document.querySelector('main p, .guide-sub, .hero-subtitle');
    if (p) return p.textContent.trim().replace(/\s+/g, ' ').slice(0, 158);
    return 'Free, practical tech-career guides and roadmaps by Shumbul Arifa.';
}

/** page title without the site suffix */
function bareTitle() {
    return document.title.split('|')[0].trim() || 'Resources';
}

export function initSeo() {
    const url = canonicalUrl();
    const desc = pageDescription();
    const title = bareTitle();
    const isHome = pageFile() === 'index.html';

    // ---- canonical ----
    let link = head().querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        head().appendChild(link);
    }
    link.href = url;

    // ---- Open Graph ----
    forceMeta('property', 'og:url', url);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', desc);
    forceMeta('property', 'og:site_name', SITE_NAME);
    forceMeta('property', 'og:type', isHome ? 'website' : 'article');
    forceMeta('property', 'og:image', OG_IMAGE);
    forceMeta('property', 'og:image:width', '1200');
    forceMeta('property', 'og:image:height', '630');
    forceMeta('property', 'og:image:alt', SITE_NAME);
    forceMeta('property', 'og:locale', 'en_US');

    // ---- Twitter ----
    forceMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', desc);
    forceMeta('name', 'twitter:image', OG_IMAGE);

    // ---- misc ----
    upsertMeta('name', 'description', desc);
    forceMeta('name', 'author', AUTHOR);
    forceMeta('name', 'robots', 'index, follow, max-image-preview:large');

    // ---- JSON-LD ----
    const graph = [
        {
            '@type': 'WebSite',
            '@id': ORIGIN + '/#website',
            url: ORIGIN + '/',
            name: SITE_NAME,
            description: 'Free, practical tech-career guides, roadmaps and interview prep.',
            inLanguage: 'en',
            publisher: { '@id': ORIGIN + '/#person' }
        },
        {
            '@type': 'Person',
            '@id': ORIGIN + '/#person',
            name: AUTHOR,
            url: ORIGIN + '/about.html',
            jobTitle: 'Software Engineer',
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
            isPartOf: { '@id': ORIGIN + '/#website' },
            about: { '@id': ORIGIN + '/#person' },
            inLanguage: 'en',
            primaryImageOfPage: OG_IMAGE
        }
    ];

    if (!isHome) {
        graph.push({
            '@type': 'BreadcrumbList',
            '@id': url + '#breadcrumb',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Resources', item: ORIGIN + '/' },
                { '@type': 'ListItem', position: 2, name: title, item: url }
            ]
        });
    }

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    head().appendChild(ld);
}
