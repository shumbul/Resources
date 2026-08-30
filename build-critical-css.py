# -*- coding: utf-8 -*-
"""
Move the critical stylesheets out of the JavaScript-loaded partial and into
each page's real <head>.

Why this matters:
    components/head-common.html carried the stylesheets that define the
    layout: theme-variables.css, theme-switcher.css, and a large inline
    <style> block with the box-sizing reset and the base margins for body,
    headings, paragraphs and .container (now extracted to base.css).

    That partial is fetched by component-loader.js, so on 32 of 33 pages none
    of it existed until JavaScript had run. The page painted unstyled and then
    jumped when the CSS finally applied. That was the dominant cause of the
    measured CLS of 1.49 on guide pages, and the leftover inline block was
    still worth up to 0.61 after the two <link> tags had been hoisted.

    index.html already linked them directly, which is exactly why it measured
    0.265 instead.

    base.css is linked last of the three so it keeps the cascade position the
    inline block used to have.

Idempotent: safe to re-run.
"""
import os
import re
import sys

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")
SKIP = {"component-demo.html"}

BEGIN = "<!-- BEGIN critical-css (build-critical-css.py) -->"
END = "<!-- END critical-css -->"

# Cache-busting version for the stylesheets. Bump this whenever any of the
# sheets below changes, and keep it equal to the ?v= on the site.js script tag.
#
# This matters more than it looks. These sheets carry layout that used to be
# injected by JavaScript. A browser holding an older copy of the CSS together
# with the newer HTML and JS gets neither: the JS no longer injects the rules
# and the cached file does not have them yet, so the hero collapses. The
# version query makes the two move together.
VERSION = "20260830a"

SHEETS = [
    "./theme-variables.css",
    "./theme-switcher.css",
    "./base.css",
]


def link(href):
    return '<link rel="stylesheet" href="{0}?v={1}">'.format(href, VERSION)


BLOCK = "\n".join([BEGIN] + [link(h) for h in SHEETS] + [END])


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


def version_links(src, upto):
    """Point every existing link at the current version of these sheets."""
    changed = False
    head, tail = src[:upto], src[upto:]
    for h in SHEETS:
        pat = re.compile(
            r'<link\b[^>]*\bhref="' + re.escape(h) + r'(?:\?v=[^"]*)?"[^>]*>')
        new_head, n = pat.subn(link(h), head)
        if n:
            changed = changed or new_head != head
            head = new_head
    return head + tail, changed


def head_boundary(src):
    """
    Where the real <head> ends.

    Pages carry <div data-component="head-common"> inside <head>. A <div> is
    not valid head content, so the parser implicitly closes <head> there and
    everything after it lands in <body>. Stylesheets have to go before it.
    """
    m = re.search(r'<div\s+data-component=["\']head-common["\']', src)
    if m is not None:
        return m.start()
    i = src.find("</head>")
    return i if i > 0 else len(src)


def process(path, check_only=False):
    src = read(path)
    original = src
    if "<head>" not in src:
        return None

    # Refresh the version on any link the page already carries. This runs
    # first: it changes the length of the document, so doing it after the
    # insertion point had been chosen would shift that point into the middle
    # of a tag.
    src, _ = version_links(src, head_boundary(src))

    # Strip any previously generated block, so the sheet list can change and
    # so a page that links some sheets itself is measured correctly.
    anchor = None
    if BEGIN in src:
        i = src.index(BEGIN)
        j = src.index(END, i) + len(END)
        while j < len(src) and src[j] in "\r\n":
            j += 1
        k = i
        while k > 0 and src[k - 1] in "\r\n":
            k -= 1
        anchor = k
        src = src[:k] + src[j:]

    boundary = head_boundary(src)
    real_head = src[:boundary]

    missing = [h for h in SHEETS if 'href="{0}?v='.format(h) not in real_head]
    if not missing:
        if src == original:
            return False
        if not check_only:
            write(path, src)
        return True

    block = "\n".join([BEGIN] + [link(h) for h in missing] + [END])

    if anchor is not None:
        i = anchor
    else:
        linked = [h for h in SHEETS if 'href="{0}?v='.format(h) in real_head]
        if linked:
            # Keep the documented order: place it after the last sheet the
            # page already links itself, at the end of that whole tag.
            last = max(real_head.rfind('href="{0}?v='.format(h)) for h in linked)
            i = src.index(">", last) + 1
        else:
            # insert right after <meta charset>, which must stay first
            m = re.search(r'<meta\s+charset=[^>]*>', src, re.I)
            i = m.end() if m else src.index("<head>") + len("<head>")

    # Always terminate the block with exactly one newline. strip_existing()
    # consumes the trailing newlines, so this round-trips cleanly no matter
    # which order the build scripts ran in. Without it, a page written by
    # build-seo.py after this script kept an extra blank line and --check
    # reported it as stale forever.
    out = src[:i] + "\n" + block + "\n" + src[i:]
    if out == original:
        return False
    if not check_only:
        write(path, out)
    return True


def main():
    check = "--check" in sys.argv
    pages = sorted(f for f in os.listdir(DOCS)
                   if f.endswith(".html") and f not in SKIP)
    changed = []
    for f in pages:
        if process(os.path.join(DOCS, f), check_only=check):
            changed.append(f)

    if check:
        if changed:
            print(f"MISSING critical CSS ({len(changed)}): " + ", ".join(changed))
            sys.exit(1)
        print(f"All {len(pages)} pages link the critical CSS from <head>.")
        return

    print(f"scanned {len(pages)} pages, updated {len(changed)}")
    for f in changed:
        print("   ", f)


if __name__ == "__main__":
    main()
