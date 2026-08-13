#!/usr/bin/env node
/*
 * Internal link and metadata checker for the docs/ site.
 *
 * Catches the failures that HTMLHint cannot see:
 *  - a link, image, script or stylesheet pointing at a file that does not exist
 *  - an in-page #anchor with no matching id
 *  - an indexable page missing from sitemap.xml
 *  - a sitemap or RSS entry pointing at a page that was deleted or renamed
 *  - a page with no canonical, no og:url, or an og:url that is not its canonical
 *
 * Run with: node scripts/check-links.js
 * Exits non-zero (and prints every problem) when something is wrong.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const SITE = 'https://shumbul.github.io/Resources/';

// Pages that should stay out of the sitemap.
const NOINDEX = new Set(['404.html', 'component-demo.html']);

// Ids that the shared modules create at runtime, so they are not in the HTML.
const RUNTIME_IDS = new Set(['main-content']);

const problems = [];
const fail = (file, message) => problems.push(`${file}: ${message}`);

const read = (file) => fs.readFileSync(path.join(DOCS, file), 'utf8');

// Markup built inside <script> or shown inside <noscript>-adjacent examples is
// not a real reference, so scan only the static markup of the page. The end-tag
// patterns allow trailing whitespace (</script >) and the loop keeps stripping
// until nothing changes, so a nested or malformed block cannot leave a live
// <script> behind for the link scanner to read as real markup.
const BLOCK_RE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
function stripScripts(html) {
    let out = html;
    for (let pass = 0; pass < 10; pass += 1) {
        const next = out.replace(BLOCK_RE, '');
        if (next === out) break;
        out = next;
    }
    return out;
}

function attrValues(html, tag, attr) {
    const out = [];
    const re = new RegExp(`<${tag}\\b[^>]*?\\s${attr}\\s*=\\s*"([^"]*)"`, 'gi');
    let m;
    while ((m = re.exec(html)) !== null) out.push(m[1]);
    return out;
}

function idSet(html) {
    const out = new Set();
    const re = /\sid\s*=\s*"([^"]+)"/gi;
    let m;
    while ((m = re.exec(html)) !== null) out.add(m[1]);
    return out;
}

const isExternal = (href) => /^(https?:|mailto:|tel:|data:|javascript:)/i.test(href);

const pages = fs.readdirSync(DOCS).filter((f) => f.endsWith('.html')).sort();
const pageSet = new Set(pages);

// 1. Every local reference resolves to a file that exists, every anchor has an id.
for (const page of pages) {
    const source = read(page);
    const html = stripScripts(source);
    const pageIds = idSet(source);
    const refs = [
        ...attrValues(html, 'a', 'href'),
        ...attrValues(html, 'link', 'href'),
        ...attrValues(html, 'img', 'src'),
        ...attrValues(html, 'img', 'srcset'),
        ...attrValues(html, 'source', 'srcset'),
        ...attrValues(html, 'script', 'src'),
    ];

    for (const raw of refs) {
        for (const candidate of raw.split(',')) {
            const ref = candidate.trim().split(/\s+/)[0];
            if (!ref || isExternal(ref)) continue;

            if (ref.startsWith('#')) {
                const id = ref.slice(1);
                if (id && !RUNTIME_IDS.has(id) && !pageIds.has(id)) {
                    fail(page, `anchor "${ref}" has no matching id`);
                }
                continue;
            }

            const clean = ref.split('#')[0].split('?')[0];
            if (!clean) continue;
            const target = path.join(DOCS, clean.replace(/^\.\//, ''));
            if (!fs.existsSync(target)) fail(page, `broken link "${ref}"`);
        }
    }

    // 2. Canonical and og:url must exist and agree, or every share points home.
    const canonical = (source.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    const ogUrl = (source.match(/<meta property="og:url" content="([^"]+)"/) || [])[1];
    if (!canonical) fail(page, 'missing <link rel="canonical">');
    if (!ogUrl) fail(page, 'missing og:url');
    if (canonical && ogUrl && canonical !== ogUrl) {
        fail(page, `og:url (${ogUrl}) does not match canonical (${canonical})`);
    }
    if (canonical && !canonical.startsWith(SITE)) {
        fail(page, `canonical does not start with ${SITE}: ${canonical}`);
    }
    if (canonical && canonical.includes('/docs/')) {
        fail(page, `canonical contains /docs/, which is not part of the published URL: ${canonical}`);
    }
    if (!/<meta property="og:title"/.test(source)) fail(page, 'missing og:title');
    if (!/<meta property="og:image"/.test(source)) fail(page, 'missing og:image');
}

// 3. Sitemap covers every indexable page, and nothing else.
const sitemapPath = path.join(DOCS, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
    problems.push('sitemap.xml: missing');
} else {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const listed = new Set(locs.map((loc) => {
        const rel = loc.replace(SITE, '');
        return rel === '' ? 'index.html' : rel;
    }));

    for (const page of pages) {
        if (NOINDEX.has(page)) {
            if (listed.has(page)) fail('sitemap.xml', `${page} should not be listed (it is noindex)`);
            continue;
        }
        if (!listed.has(page)) fail('sitemap.xml', `${page} is missing`);
    }
    for (const entry of listed) {
        if (!pageSet.has(entry)) fail('sitemap.xml', `lists "${entry}", which does not exist`);
    }
    for (const loc of locs) {
        if (!loc.startsWith(SITE)) fail('sitemap.xml', `<loc> outside the site: ${loc}`);
    }
}

// 4. RSS items must point at real pages.
const feedPath = path.join(DOCS, 'feed.xml');
if (!fs.existsSync(feedPath)) {
    problems.push('feed.xml: missing');
} else {
    const feed = fs.readFileSync(feedPath, 'utf8');
    const links = [...feed.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]);
    for (const link of links) {
        if (!link.startsWith(SITE)) continue;
        const rel = link.replace(SITE, '');
        if (rel && !pageSet.has(rel)) fail('feed.xml', `links to "${rel}", which does not exist`);
    }
}

if (problems.length) {
    console.error(`\n${problems.length} problem(s) found:\n`);
    for (const p of problems) console.error(`  - ${p}`);
    console.error('');
    process.exit(1);
}

console.log(`Checked ${pages.length} pages: links, anchors, canonical/og tags, sitemap and RSS all clean.`);
