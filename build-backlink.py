# -*- coding: utf-8 -*-
"""
Pre-render the "Back to Resources" link into every page header.

Why this matters:
    header.js injected this link at runtime, as the first child of the
    header's inner wrapper. Nothing held the space, so the header grew by
    roughly 35 to 57px after the page had already painted and pushed the
    whole document down.

    theme-variables.css did carry a ::before placeholder for it, but that
    rule only matched `.guide-header .container` and `.header-content`. Pages
    built on other header classes, git-guide.html among them, matched
    nothing and took the full shift. Writing the markup at build time
    removes the guesswork entirely: the link is in the first paint, so there
    is no insertion to absorb.

Rules mirrored from docs/functions/header.js:
    * index.html is skipped, since that page IS the resources list
    * the first element matching the header selector wins
    * a page that already ships its own .back-link is left alone

Idempotent: safe to re-run. Use --check in CI to verify pages are current.
"""
import os
import re
import sys

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")
SKIP = {"index.html", "component-demo.html", "404.html"}

BEGIN = "<!-- BEGIN back-link (build-backlink.py) -->"
END = "<!-- END back-link -->"

BLOCK = (
    '{p}{b}\n'
    '{p}<div class="back-link-row">'
    '<a class="back-link" href="./index.html">'
    '<span aria-hidden="true">&larr;</span> Back to Resources</a></div>\n'
    '{p}{e}\n'
)

# Same order header.js uses, so the same header is chosen.
HEADER_CLASSES = ["guide-header", "git-header", "header", "hero",
                  "ai-header", "demo-header"]
INNER_CLASSES = ["header-content", "container", "hero-content"]


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


def strip_existing(src):
    i = src.find(BEGIN)
    if i < 0:
        return src, False
    j = src.find(END, i)
    if j < 0:
        return src, False
    j += len(END)
    while j < len(src) and src[j] in "\r\n":
        j += 1
    k = i
    while k > 0 and src[k - 1] in " \t":
        k -= 1
    return src[:k] + src[j:], True


def find_open_tag(src, cls, start=0):
    """Locate an opening tag carrying the given class as a whole word."""
    pat = re.compile(
        r'<(\w+)\b[^>]*\bclass\s*=\s*"[^"]*(?<![\w-])'
        + re.escape(cls) + r'(?![\w-])[^"]*"[^>]*>', re.I)
    return pat.search(src, start)


def find_header(src):
    best = None
    for cls in HEADER_CLASSES:
        m = find_open_tag(src, cls)
        if m and (best is None or m.start() < best.start()):
            best = m
    m = re.search(r"<header\b[^>]*>", src, re.I)
    if m and (best is None or m.start() < best.start()):
        best = m
    return best


def close_of(src, open_match):
    """Find the matching close tag for a well-formed element."""
    tag = open_match.group(1) if open_match.re.groups else "header"
    tag = tag.lower()
    depth = 1
    pat = re.compile(r"<(/?)" + tag + r"\b[^>]*>", re.I)
    pos = open_match.end()
    while depth:
        m = pat.search(src, pos)
        if not m:
            return None
        depth += -1 if m.group(1) else 1
        pos = m.end()
    return pos


def process(path, check_only=False):
    name = os.path.basename(path)
    src = read(path)
    original = src
    src, had = strip_existing(src)

    if "back-link" in src:
        # The page ships its own back navigation; header.js would skip it too.
        if had and not check_only:
            write(path, src)
        return "removed" if had else None

    header = find_header(src)
    if not header:
        return None
    header_end = close_of(src, header) or len(src)
    region = src[header.end():header_end]

    at = None
    for cls in INNER_CLASSES:
        m = find_open_tag(region, cls)
        if m:
            at = header.end() + m.end()
            break
    if at is None:
        at = header.end()

    # Match the indentation of whatever follows, so the diff stays readable.
    line_start = src.rfind("\n", 0, at) + 1
    indent = len(src[line_start:at]) - len(src[line_start:at].lstrip()) or 8

    out = src[:at] + "\n" + BLOCK.format(p=" " * indent, b=BEGIN, e=END) + src[at:]
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
            print("Back link markup is stale on {0} page(s):".format(len(changed)))
            for f, r in changed:
                print("    {0}  ({1})".format(f, r))
            print("Run: python build-backlink.py")
            sys.exit(1)
        print("All {0} pages have a static back link.".format(len(pages)))
        return

    print("scanned {0} pages, updated {1}".format(len(pages), len(changed)))
    for f, r in changed:
        print("    {0}  ({1})".format(f, r))


if __name__ == "__main__":
    main()
