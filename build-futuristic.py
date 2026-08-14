# -*- coding: utf-8 -*-
"""
Enable the shared visual layer on every page by adding `data-futuristic` to
<body>.

Previously only index.html carried the attribute, so the home page had the
animated mesh gradient and drifting orbs while the other 32 pages fell back to
a flat two-stop gradient. That inconsistency was visible the moment anyone
clicked through from the home page.

Idempotent: safe to re-run.

Usage:
    python build-futuristic.py
    python build-futuristic.py --check
"""
import os
import re
import sys

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")
SKIP = {"component-demo.html"}


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


def process(path, check_only=False):
    src = read(path)
    m = re.search(r"<body\b([^>]*)>", src, re.I)
    if not m:
        return None
    attrs = m.group(1)
    if "data-futuristic" in attrs:
        return False                     # already enabled

    new_tag = "<body" + attrs + " data-futuristic>"
    out = src[:m.start()] + new_tag + src[m.end():]
    if not check_only:
        write(path, out)
    return True


def main():
    check = "--check" in sys.argv
    pages = sorted(f for f in os.listdir(DOCS)
                   if f.endswith(".html") and f not in SKIP)
    changed = [f for f in pages
               if process(os.path.join(DOCS, f), check_only=check)]

    if check:
        if changed:
            print(f"MISSING data-futuristic ({len(changed)}): " + ", ".join(changed))
            sys.exit(1)
        print(f"All {len(pages)} pages have the visual layer enabled.")
        return

    print(f"scanned {len(pages)} pages, updated {len(changed)}")
    for f in changed:
        print("   ", f)


if __name__ == "__main__":
    main()
