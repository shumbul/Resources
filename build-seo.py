# -*- coding: utf-8 -*-
"""
build-seo.py

Writes SEO metadata directly into each HTML file so that social crawlers
(Facebook, LinkedIn, WhatsApp, Slack, X) can read it. Those crawlers do NOT
execute JavaScript, so runtime injection is not enough for share cards.

Idempotent: rewrites the managed block on every run, never duplicates it.

Usage:
    python build-seo.py            # write tags
    python build-seo.py --check    # exit 1 if any page is out of date
"""
import os
import re
import sys
import html
import json

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")
ORIGIN = "https://shumbul.github.io/Resources"
SITE_NAME = "Resources by Shumbul Arifa"
AUTHOR = "Shumbul Arifa"
DEFAULT_IMAGE = ORIGIN + "/og-image.png"

BEGIN = "<!-- BEGIN generated-seo (build-seo.py) -->"
END = "<!-- END generated-seo -->"

SKIP = {"component-demo.html"}

DEFAULT_DESC = ("Free, practical tech-career guides and roadmaps by Shumbul Arifa. "
                "Learn DSA, system design, AI and interview prep.")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


def strip_managed(src):
    """Remove any previously generated block."""
    return re.sub(re.escape(BEGIN) + r".*?" + re.escape(END) + r"\s*", "", src, flags=re.S)


def get_tag(src, pattern, group=1):
    m = re.search(pattern, src, re.I | re.S)
    return m.group(group).strip() if m else None


def page_url(fname):
    return ORIGIN + "/" if fname == "index.html" else ORIGIN + "/" + fname


def bare_title(title):
    return title.split("|")[0].strip() if title else "Resources"


def build_block(fname, src):
    title = get_tag(src, r"<title>(.*?)</title>") or SITE_NAME
    desc = get_tag(src, r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']') \
        or DEFAULT_DESC
    # respect a hand-written og:image if the author set one
    existing_img = get_tag(
        src, r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']')
    img = existing_img or DEFAULT_IMAGE
    if img.startswith("./"):
        img = ORIGIN + "/" + img[2:]

    og_title = get_tag(
        src, r'<meta\s+property=["\']og:title["\']\s+content=["\'](.*?)["\']') \
        or bare_title(title)
    og_desc = get_tag(
        src, r'<meta\s+property=["\']og:description["\']\s+content=["\'](.*?)["\']') or desc

    url = page_url(fname)
    is_home = fname == "index.html"
    e = html.escape

    graph = [
        {"@type": "WebSite", "@id": ORIGIN + "/#website", "url": ORIGIN + "/",
         "name": SITE_NAME, "inLanguage": "en",
         "description": "Free, practical tech-career guides, roadmaps and interview prep.",
         "publisher": {"@id": ORIGIN + "/#person"}},
        {"@type": "Person", "@id": ORIGIN + "/#person", "name": AUTHOR,
         "url": ORIGIN + "/about.html", "jobTitle": "Software Engineer",
         "sameAs": ["https://github.com/shumbul",
                    "https://linkedin.com/in/shumbul",
                    "https://instagram.com/shumbul.arifa",
                    "https://www.youtube.com/@Shumbul"]},
        {"@type": "CollectionPage" if is_home else "WebPage",
         "@id": url + "#webpage", "url": url, "name": title,
         "description": desc, "inLanguage": "en",
         "isPartOf": {"@id": ORIGIN + "/#website"},
         "about": {"@id": ORIGIN + "/#person"},
         "primaryImageOfPage": img},
    ]
    if not is_home:
        graph.append({
            "@type": "BreadcrumbList", "@id": url + "#breadcrumb",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Resources",
                 "item": ORIGIN + "/"},
                {"@type": "ListItem", "position": 2, "name": bare_title(title),
                 "item": url}]})

    ld = json.dumps({"@context": "https://schema.org", "@graph": graph},
                    ensure_ascii=False, separators=(",", ":"))

    lines = [
        BEGIN,
        f'<link rel="canonical" href="{e(url)}">',
        f'<meta name="description" content="{e(desc)}">',
        f'<meta name="author" content="{e(AUTHOR)}">',
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        f'<meta property="og:type" content="{"website" if is_home else "article"}">',
        f'<meta property="og:url" content="{e(url)}">',
        f'<meta property="og:site_name" content="{e(SITE_NAME)}">',
        f'<meta property="og:title" content="{e(og_title)}">',
        f'<meta property="og:description" content="{e(og_desc)}">',
        f'<meta property="og:image" content="{e(img)}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:image:alt" content="{e(SITE_NAME)}">',
        '<meta property="og:locale" content="en_US">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(og_title)}">',
        f'<meta name="twitter:description" content="{e(og_desc)}">',
        f'<meta name="twitter:image" content="{e(img)}">',
        f'<script type="application/ld+json">{ld}</script>',
        END,
    ]
    return "\n".join(lines)


def process(path, fname, check_only=False):
    src = read(path)
    if "</head>" not in src:
        return None
    cleaned = strip_managed(src)
    block = build_block(fname, cleaned)

    # The pages contain `<div data-component="head-common">` inside <head>.
    # A <div> is not valid head content, so the HTML parser implicitly closes
    # <head> at that point and everything after it lands in <body>. Metadata in
    # <body> is ignored by crawlers, so the block MUST be inserted before that
    # div. Fall back to </head> for pages that do not use the partial.
    m = re.search(r'[ \t]*<div\s+data-component=["\']head-common["\']', cleaned)
    i = m.start() if m else cleaned.index("</head>")

    out = cleaned[:i] + block + "\n" + cleaned[i:]

    # Compare the managed block only. Whitespace elsewhere in the file must not
    # make --check report a false positive.
    def managed(s):
        mm = re.search(re.escape(BEGIN) + r"(.*?)" + re.escape(END), s, re.S)
        return mm.group(1) if mm else None

    if managed(src) == managed(out) and BEGIN in src:
        return False          # already up to date
    if not check_only:
        write(path, out)
    return True               # changed


def main():
    check = "--check" in sys.argv
    pages = sorted(f for f in os.listdir(DOCS)
                   if f.endswith(".html") and f not in SKIP)
    changed = []
    for f in pages:
        r = process(os.path.join(DOCS, f), f, check_only=check)
        if r:
            changed.append(f)

    if check:
        if changed:
            print(f"OUT OF DATE ({len(changed)}): " + ", ".join(changed))
            sys.exit(1)
        print(f"All {len(pages)} pages have current SEO tags.")
        return

    print(f"scanned {len(pages)} pages, updated {len(changed)}")
    for f in changed:
        print("   ", f)


if __name__ == "__main__":
    main()
