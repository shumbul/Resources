# -*- coding: utf-8 -*-
"""
Move the critical stylesheet links out of the JavaScript-loaded partial and
into each page's real <head>.

Why this matters:
    components/head-common.html carries the two stylesheets that define the
    layout (theme-variables.css, theme-switcher.css). That partial is fetched
    by component-loader.js, so on 32 of 33 pages the CSS did not exist until
    JavaScript had run. The page therefore painted unstyled, then jumped when
    the CSS finally applied. That is the dominant cause of the measured CLS
    of 1.49 on guide pages.

    index.html already linked them directly, which is exactly why it measured
    0.265 instead.

Idempotent: safe to re-run.
"""
import os
import re
import sys

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")
SKIP = {"component-demo.html"}

BEGIN = "<!-- BEGIN critical-css (build-critical-css.py) -->"
END = "<!-- END critical-css -->"

BLOCK = "\n".join([
    BEGIN,
    '<link rel="stylesheet" href="./theme-variables.css">',
    '<link rel="stylesheet" href="./theme-switcher.css">',
    END,
])


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


def process(path, check_only=False):
    src = read(path)
    if "<head>" not in src:
        return None

    # already correct?
    if BEGIN in src:
        return False

    # If the page already links theme-variables.css directly in head, leave it.
    head_end = src.find("</head>")
    head_region = src[:head_end] if head_end > 0 else src
    # but the div forces an implicit head close, so measure to that instead
    m_div = re.search(r'<div\s+data-component=["\']head-common["\']', src)
    boundary = m_div.start() if m_div else head_end
    real_head = src[:boundary]

    if 'href="./theme-variables.css"' in real_head:
        return False

    # insert right after <meta charset>, which must stay first
    m = re.search(r'<meta\s+charset=[^>]*>', src, re.I)
    if m:
        i = m.end()
    else:
        i = src.index("<head>") + len("<head>")

    out = src[:i] + "\n" + BLOCK + src[i:]
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
