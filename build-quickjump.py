# -*- coding: utf-8 -*-
"""
Pre-render what sits at the top of the page content.

Two things get inserted there at runtime, and neither used to reserve space:

    Quick Jump   the "on this page" section navigator (quickjump.js)
    Journey map  the roadmap progress visual (journey.js)

Why this matters:
    quickjump.js used to build the whole navigator in the browser and insert
    it at the top of <main>. Nothing held that space, so the entire page body
    jumped down the moment it appeared. Measured on a phone viewport that
    single insertion was worth 0.40 of Cumulative Layout Shift on
    git-guide.html, by far the largest shift on the site.

    A static site has no reason to build static markup in the browser, so the
    navigator is written into the HTML here and is present in the very first
    paint. quickjump.js now finds it already there and only wires up the
    behaviour (smooth scroll and the active-section highlight).

    The journey map cannot be pre-rendered the same way, because it reflects
    per-visitor progress held in localStorage. Instead this script leaves a
    correctly sized slot behind, which journey.js swaps itself into.

    Side benefits: the section links exist for crawlers and for anyone with
    JavaScript disabled, and the browser does one less DOM insertion.

Rules mirrored from docs/functions/quickjump.js and journey.js:
    * a page gets the journey map when it has .week-section or .month-section
      blocks, or is one of the three pages journey.js claims by name
    * a page that gets the journey map does not also get a Quick Jump, since
      the map is already the overview
    * Quick Jump needs at least 3 usable <h2> headings
    * a heading may supply a short pill label with data-jump="..."
    * ids come from the same slug rule, so existing #anchors keep working

Idempotent: safe to re-run. Use --check in CI to verify pages are current.
"""
import html
import os
import re
import sys

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")
SKIP = {"component-demo.html", "404.html"}

BEGIN = "<!-- BEGIN quick-jump (build-quickjump.py) -->"
END = "<!-- END quick-jump -->"

J_BEGIN = "<!-- BEGIN journey-slot (build-quickjump.py) -->"
J_END = "<!-- END journey-slot -->"

MIN_SECTIONS = 3

# Pages where journey.js draws a map, so quickjump.js bails out.
JOURNEY_PAGES = {
    "dsa-practice-guide.html",
    "system-design-templates.html",
    "cybersecurity-roadmap.html",
}
JOURNEY_MARKERS = ('class="week-section"', 'class="month-section"')

# Rendered height of the journey map, measured per page at 1280px and 390px.
# The slot holds exactly this much so the swap costs nothing. Anything not
# listed falls back to the average, which is still far better than zero.
JOURNEY_SIZE = {
    "dsa-practice-guide.html": (501, 369),
    "system-design-templates.html": (501, 369),
    "cybersecurity-roadmap.html": (473, 369),
    "12-week-roadmap.html": (473, 349),
    "AI-Roadmap.html": (468, 464),
}
JOURNEY_DEFAULT = (485, 380)

H2_RE = re.compile(r"<h2\b([^>]*)>(.*?)</h2>", re.I | re.S)
TAG_RE = re.compile(r"<[^>]+>")
ATTR_RE = re.compile(r'(\w[\w-]*)\s*=\s*"([^"]*)"')


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


def strip_existing(src):
    """Remove previously generated blocks so the script can re-run."""
    changed = False
    for begin, end in ((BEGIN, END), (J_BEGIN, J_END)):
        i = src.find(begin)
        if i < 0:
            continue
        j = src.find(end, i)
        if j < 0:
            continue
        j += len(end)
        while j < len(src) and src[j] in "\r\n":
            j += 1
        k = i
        while k > 0 and src[k - 1] in " \t":
            k -= 1
        src = src[:k] + src[j:]
        changed = True
    return src, changed


def slugify(text):
    t = re.sub(r"[^a-z0-9]+", "-", text.lower())
    return t.strip("-")[:40]


def clean_label(text):
    t = re.sub(r"\s+", " ", text).strip()
    t = re.sub(r"\s*\([^)]*\)\s*$", "", t)
    if len(t) > 26:
        t = t[:24].strip() + "\u2026"
    return t


def main_region(src):
    """The slice of the document quickjump.js would scan for headings."""
    for open_re, close in ((r"<main\b[^>]*>", "</main>"),
                           (r'<div\s+class="[^"]*\bmain\b[^"]*"[^>]*>', "</div>")):
        m = re.search(open_re, src, re.I)
        if m:
            end = src.find(close, m.end())
            return m.end(), (end if end > 0 else len(src))
    m = re.search(r'<div\s+class="[^"]*\bcontainer\b[^"]*"[^>]*>', src, re.I)
    if m:
        return m.end(), len(src)
    return None


def drop_redundant_ids(src):
    """
    Remove an h2 id that just repeats the id of the wrapper it opens.

    Earlier runs of this script stamped a slug onto every heading without
    checking the rest of the document, which produced duplicate ids where a
    section wrapper already used the same slug. Duplicate ids are invalid and
    make an in-page anchor ambiguous.
    """
    out = []
    last = 0
    skip = comment_spans(src)
    for m in H2_RE.finditer(src):
        if in_spans(m.start(), skip):
            continue
        attrs = dict(ATTR_RE.findall(m.group(1)))
        hid = attrs.get("id")
        if not hid or wrapper_id(src, m.start()) != hid:
            continue
        head = re.sub(r'\s*\bid\s*=\s*"' + re.escape(hid) + r'"', "", m.group(1))
        out.append(src[last:m.start()])
        out.append("<h2" + head + ">" + m.group(2) + "</h2>")
        last = m.end()
    out.append(src[last:])
    return "".join(out)


def comment_spans(src):
    """Character ranges covered by HTML comments, so we can ignore them."""
    return [(m.start(), m.end())
            for m in re.finditer(r"<!--.*?-->", src, re.S)]


def in_spans(pos, spans):
    return any(a <= pos < b for a, b in spans)


def collect(src):
    """Return [(id, label, original_h2_span, attrs)] for usable headings."""
    span = main_region(src)
    if not span:
        return []
    lo, hi = span

    # Commented-out markup is not on the page. Scanning it produced a Quick
    # Jump pill pointing at a heading that does not exist.
    skip = comment_spans(src)

    # Ids already used anywhere in the document. Slugs are derived from the
    # heading text and can easily collide with an id a section wrapper is
    # already using, which would produce invalid HTML and send the anchor to
    # the wrong element.
    taken = set(re.findall(r'\bid\s*=\s*"([^"]+)"', src))

    out = []
    for m in H2_RE.finditer(src, lo, hi):
        if in_spans(m.start(), skip):
            continue
        attrs = dict(ATTR_RE.findall(m.group(1)))
        inner = m.group(2)
        text = html.unescape(TAG_RE.sub("", inner)).strip()
        if not text:
            continue
        label = attrs.get("data-jump") or clean_label(text)
        if "id" in attrs:
            hid = attrs["id"]
            needs_id = False
        else:
            slug = slugify(text) or "section"
            owner = wrapper_id(src, m.start())
            if owner and owner == slug:
                # The section wrapper this heading opens already carries the
                # same id. Point the pill at the wrapper instead of stamping a
                # duplicate id on the heading, which would be invalid HTML.
                hid = owner
                needs_id = False
            else:
                hid = unique(slug, taken)
                needs_id = True
            taken.add(hid)
        out.append({"id": hid, "label": label, "match": m,
                    "attrs": attrs, "needs_id": needs_id})
    return out


def wrapper_id(src, h2_start):
    """The id of the element opening immediately before this heading, if any."""
    before = src[max(0, h2_start - 400):h2_start]
    m = None
    for m in re.finditer(r'<\w+\b[^>]*>', before):
        pass
    if not m or before[m.end():].strip():
        return None
    got = re.search(r'\bid\s*=\s*"([^"]+)"', m.group(0))
    return got.group(1) if got else None


def unique(base, taken):
    if base not in taken:
        return base
    n = 2
    while "{0}-{1}".format(base, n) in taken:
        n += 1
    return "{0}-{1}".format(base, n)


def ensure_ids(src, items):
    """Give every heading a stable id, editing from the end so spans hold."""
    changed = False
    for it in reversed(items):
        if not it.get("needs_id"):
            continue
        m = it["match"]
        src = src[:m.start()] + '<h2 id="' + it["id"] + '"' + m.group(1) + ">" \
            + m.group(2) + "</h2>" + src[m.end():]
        changed = True
    return src, changed


def build_nav(items, indent):
    pad = " " * indent
    links = "".join(
        '<a href="#{0}">{1}</a>'.format(it["id"], html.escape(it["label"]))
        for it in items
    )
    return (
        "{p}{b}\n"
        '{p}<nav class="quick-jump" aria-label="Quick jump to section">\n'
        '{p}    <div class="quick-jump__label">\u26a1 Quick jump</div>\n'
        '{p}    <div class="quick-jump__links">{l}</div>\n'
        "{p}</nav>\n"
        "{p}{e}\n"
    ).format(p=pad, b=BEGIN, l=links, e=END)


def insertion_point(src):
    """Mirror quickjump.js placement: top of <main>, else after the header."""
    m = re.search(r"<main\b[^>]*>", src, re.I)
    if m:
        return m.end(), 8
    m = re.search(r'</header>|</div>\s*<!--\s*/?header', src, re.I)
    if m:
        return m.end(), 8
    m = re.search(r'<div\s+class="[^"]*\bheader\b[^"]*"[^>]*>', src, re.I)
    if m:
        # close of that header div is hard to find reliably; fall back to
        # the container so the nav never lands above the page title
        m2 = re.search(r'<div\s+class="[^"]*\bcontainer\b[^"]*"[^>]*>',
                       src[m.end():], re.I)
        if m2:
            return m.end() + m2.end(), 8
    return None, 8


def wants_nav(name, src):
    return not journey_section(name, src)


def journey_section(name, src):
    """Which section class journey.js will group, or None if it will not run."""
    for cls in ("week-section", "month-section"):
        if 'class="{0}"'.format(cls) in src:
            return cls
    if name in JOURNEY_PAGES and 'class="gsection"' in src:
        return "gsection"
    return None


def add_journey_slot(src, name):
    """
    Build the source with a correctly sized gap where journey.js will mount.

    journey.js inserts the panel as the first child of the element that holds
    the sections. It now prefers to replace this slot instead, which keeps the
    position identical and makes the swap cost no layout shift at all.
    """
    cls = journey_section(name, src)
    if not cls:
        return None

    m = re.search(r'<(\w+)\b[^>]*\bclass\s*=\s*"[^"]*(?<![\w-])'
                  + re.escape(cls) + r'(?![\w-])[^"]*"[^>]*>', src, re.I)
    if not m:
        return None
    if len(re.findall(r'class\s*=\s*"[^"]*(?<![\w-])' + re.escape(cls)
                      + r'(?![\w-])', src, re.I)) < 3:
        return None

    wide, narrow = JOURNEY_SIZE.get(name, JOURNEY_DEFAULT)
    line_start = src.rfind("\n", 0, m.start()) + 1
    indent = len(src[line_start:m.start()]) - len(src[line_start:m.start()].lstrip())
    pad = " " * max(indent, 4)

    block = (
        '{p}{b}\n'
        '{p}<div class="journey-slot" aria-hidden="true" '
        'style="--j-h:{w}px;--j-hm:{n}px"></div>\n'
        '{p}{e}\n'
    ).format(p=pad, b=J_BEGIN, e=J_END, w=wide, n=narrow)

    return src[:line_start] + block + src[line_start:]


def process(path, check_only=False):
    name = os.path.basename(path)
    src = read(path)
    original = src

    src, had = strip_existing(src)
    src = drop_redundant_ids(src)

    if not wants_nav(name, src):
        out = add_journey_slot(src, name)
        if out is None:
            out = src
        if out == original:
            return False
        if not check_only:
            write(path, out)
        return "updated" if had else "added"

    items = collect(src)
    if len(items) < MIN_SECTIONS:
        if src == original:
            return False
        if not check_only:
            write(path, src)
        return "removed"

    src, _ = ensure_ids(src, items)

    at, indent = insertion_point(src)
    if at is None:
        return None

    out = src[:at] + "\n" + build_nav(items, indent) + src[at:]
    if out == original:
        return False
    if not check_only:
        write(path, out)
    return "updated" if had else "added"


def main():
    check = "--check" in sys.argv
    pages = sorted(f for f in os.listdir(DOCS)
                   if f.endswith(".html") and f not in SKIP)
    changed = []
    for f in pages:
        r = process(os.path.join(DOCS, f), check_only=check)
        if r:
            changed.append((f, r))

    if check:
        if changed:
            print("Quick Jump markup is stale on {0} page(s):".format(len(changed)))
            for f, r in changed:
                print("    {0}  ({1})".format(f, r))
            print("Run: python build-quickjump.py")
            sys.exit(1)
        print("All {0} pages have current Quick Jump markup.".format(len(pages)))
        return

    print("scanned {0} pages, updated {1}".format(len(pages), len(changed)))
    for f, r in changed:
        print("    {0}  ({1})".format(f, r))


if __name__ == "__main__":
    main()
