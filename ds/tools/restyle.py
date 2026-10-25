#!/usr/bin/env python3
"""restyle.py — make re-themed COPIES of the older course pages.

The originals are never modified. Each copy is written to an output folder
(default: <repo>/restyled/) with:

  1. a link to the Pretendard web font and to ds/bridge.css, placed right after
     the existing <link ... course-design.css> (or before </head> when a page
     does not use course-design.css);
  2. every relative href / src / poster / data-src attribute and CSS url(...)
     that points at a file that really exists in the repository rewritten so it
     still resolves from the output folder (normally by prefixing "../");
  3. a small note right after <body> ("디자인 통일 시안 · 원본: <link>") that
     links back to the untouched original. bridge.css styles it (.ds-restyle-note)
     as a thin fixed strip in the top-left corner, so it never changes the layout;
  4. when the page carries its own Content-Security-Policy <meta> (week4), the
     copy's style-src and font-src also allow https://cdn.jsdelivr.net, so the
     Pretendard link added in step 1 is not blocked.

Running the tool again simply regenerates the same copies (the output carries
no timestamps and is never read back), so it is safe to repeat.

Values are rewritten only when the target file exists. Text inside <textarea>
and inside <script> elements is left alone, so teaching code such as
<img src="cat.png"> in an editor, or 'assets/x.json' in JavaScript, keeps its
original spelling (such JavaScript paths are listed as warnings instead).

Usage
  python3 ds/tools/restyle.py week5.html            # one page  -> restyled/week5.html
  python3 ds/tools/restyle.py --all                 # week2–5, the *show pages, guide/lab pages, midterm, index
  python3 ds/tools/restyle.py --all --link-siblings # links between restyled pages stay inside restyled/
  python3 ds/tools/restyle.py week5.html --out /tmp/preview

Then open restyled/week5.html next to week5.html to compare. Delete the
restyled/ folder when you are done; it is a preview, not a source.
"""
import argparse
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BRIDGE = os.path.join(REPO, 'ds', 'bridge.css')
PRETENDARD = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'
DEFAULT_PAGES = ['week2.html', 'week2_show.html', 'week2guide.html', 'week3.html', 'week3show.html',
                 'week4.html', 'week4show.html', 'week5.html', 'week5show.html', 'midterm.html',
                 'github-team-lab.html', 'index.html']
NOTE_ATTR = 'data-ds-restyle-note'
NOTE_HTML = ('<div class="ds-restyle-note" role="note" %s>디자인 통일 시안 · 원본: '
             '<a href="%%s">%%s</a></div>' % NOTE_ATTR)
BODY_RE = re.compile(r'<body\b[^>]*>', re.I)

SKIP_SCHEMES = re.compile(r'^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|//|#|\?|/|\{|\$|<)')
ATTR_RE = re.compile(r'''(?P<pre>\s(?:href|src|poster|data-src)\s*=\s*)(?P<q>["'])(?P<val>[^"'<>]*?)(?P=q)''', re.I)
URL_RE = re.compile(r'''url\(\s*(?P<q>["']?)(?P<val>[^"')]+?)(?P=q)\s*\)''', re.I)
PROTECT_RE = re.compile(r'<(script|textarea)\b[^>]*>.*?</\1\s*>', re.I | re.S)
COURSE_LINK_RE = re.compile(r'<link\b[^>]*href\s*=\s*["\'][^"\']*course-design\.css[^"\']*["\'][^>]*>', re.I)
META_RE = re.compile(r'<meta\b[^>]*>', re.I)
CSP_EQUIV_RE = re.compile(r'''http-equiv\s*=\s*["']Content-Security-Policy["']''', re.I)
CSP_CONTENT_RE = re.compile(r'''(\bcontent\s*=\s*)(?:"(?P<d>[^"]*)"|'(?P<s>[^']*)')''', re.I)
CDN_HOST = 'https://cdn.jsdelivr.net'
JS_PATH_RE = re.compile(r'''["'`]((?:\./)?(?:assets|images|img|css|js|data|media)/[^"'`\s]+)["'`]''')


def split_path(value):
    """'a/b.png?x=1#y' -> ('a/b.png', '?x=1#y')"""
    m = re.match(r'([^?#]*)(.*)$', value, re.S)
    return m.group(1), m.group(2)


class Rewriter:
    def __init__(self, src_dir, out_dir, siblings):
        self.src_dir = src_dir
        self.out_dir = out_dir
        self.siblings = siblings  # set of absolute paths of pages that are also restyled
        self.count = 0

    def fix(self, value):
        if not value or SKIP_SCHEMES.match(value.strip()):
            return value
        path, tail = split_path(value)
        if not path:
            return value
        target = os.path.normpath(os.path.join(self.src_dir, path))
        if not target.startswith(REPO + os.sep) and target != REPO:
            return value
        if not os.path.exists(target):
            return value
        if target in self.siblings:
            new = os.path.relpath(os.path.join(self.out_dir, os.path.basename(target)), self.out_dir)
        else:
            new = os.path.relpath(target, self.out_dir)
        new = new.replace(os.sep, '/')
        if path.endswith('/') and not new.endswith('/'):
            new += '/'
        if new == path:
            return value
        self.count += 1
        return new + tail

    def attrs(self, html):
        return ATTR_RE.sub(lambda m: m.group('pre') + m.group('q') + self.fix(m.group('val')) + m.group('q'), html)

    def css_urls(self, css):
        return URL_RE.sub(lambda m: 'url(' + m.group('q') + self.fix(m.group('val')) + m.group('q') + ')', css)


def rewrite_markup(html, rw):
    """Rewrite attributes and url() everywhere except inside <script> and <textarea>."""
    out, last = [], 0
    for m in PROTECT_RE.finditer(html):
        chunk = html[last:m.start()]
        out.append(rw.css_urls(rw.attrs(chunk)))
        block = m.group(0)
        # the opening <script src="…"> tag itself is markup: rewrite its attributes only
        open_end = block.index('>') + 1
        out.append(rw.attrs(block[:open_end]) + block[open_end:])
        last = m.end()
    out.append(rw.css_urls(rw.attrs(html[last:])))
    return ''.join(out)


def widen_csp_value(csp):
    """Allow the Pretendard stylesheet and its font files next to an existing
    Content-Security-Policy. Only style-src and font-src are touched."""
    parts = [p.strip() for p in csp.split(';')]
    names = [p.split()[0].lower() for p in parts if p]
    changed = False
    for i, p in enumerate(parts):
        if not p:
            continue
        name = p.split()[0].lower()
        if name in ('style-src', 'font-src') and CDN_HOST not in p:
            parts[i] = p + ' ' + CDN_HOST
            changed = True
    if 'font-src' not in names and 'default-src' in names:
        parts.append('font-src ' + CDN_HOST)
        changed = True
    return '; '.join(p for p in parts if p), changed


def widen_csp(html):
    """Apply widen_csp_value to CSP <meta> tags in the page's own markup (CSP
    strings quoted inside <script> or <textarea> teaching code are left alone)."""
    count = [0]

    def sub_content(m):
        old = m.group('d') if m.group('d') is not None else m.group('s')
        q = '"' if m.group('d') is not None else "'"
        new, changed = widen_csp_value(old)
        if changed:
            count[0] += 1
        return m.group(1) + q + new + q

    def sub_meta(m):
        tag = m.group(0)
        if not CSP_EQUIV_RE.search(tag):
            return tag
        return CSP_CONTENT_RE.sub(sub_content, tag, count=1)

    out, last = [], 0
    for m in PROTECT_RE.finditer(html):
        out.append(META_RE.sub(sub_meta, html[last:m.start()]))
        out.append(m.group(0))
        last = m.end()
    out.append(META_RE.sub(sub_meta, html[last:]))
    return ''.join(out), count[0]


def js_warnings(html, src_dir):
    found = set()
    for m in re.finditer(r'<script\b(?![^>]*\btype\s*=\s*["\']text/(?:plain|template))[^>]*>(.*?)</script\s*>', html, re.I | re.S):
        for p in JS_PATH_RE.findall(m.group(1)):
            path, _ = split_path(p)
            if os.path.exists(os.path.normpath(os.path.join(src_dir, path))):
                found.add(p)
    return sorted(found)


def inject(html, bridge_href, add_font):
    links = ''
    if add_font:
        links += '\n<link rel="stylesheet" href="%s">' % PRETENDARD
    links += '\n<link rel="stylesheet" href="%s" data-ds-bridge>' % bridge_href
    m = COURSE_LINK_RE.search(html)
    if m:
        return html[:m.end()] + links + html[m.end():], 'after course-design.css'
    m = re.search(r'</head\s*>', html, re.I)
    if m:
        return html[:m.start()] + links.lstrip('\n') + '\n' + html[m.start():], 'before </head>'
    m = re.search(r'<head\b[^>]*>', html, re.I)
    if m:
        return html[:m.end()] + links + html[m.end():], 'after <head>'
    return links.lstrip('\n') + '\n' + html, 'at top (no <head> found)'


def add_note(html, original_href, label):
    """Insert the preview note as the first child of <body>. Idempotent: a page
    that already carries the note is returned unchanged."""
    if NOTE_ATTR in html:
        return html, 'already present'
    m = BODY_RE.search(html)
    if not m:
        return html, 'no <body> found; skipped'
    note = NOTE_HTML % (original_href, label)
    return html[:m.end()] + '\n' + note + html[m.end():], 'after <body>'


def restyle(src, out_dir, siblings):
    src = os.path.abspath(src)
    if not os.path.isfile(src):
        raise SystemExit('not found: %s' % src)
    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, os.path.basename(src))
    if os.path.abspath(dst) == src:
        raise SystemExit('refusing to overwrite the original: %s (choose another --out)' % src)
    with open(src, encoding='utf-8') as f:
        html = f.read()
    if 'data-ds-bridge' in html:
        raise SystemExit('%s already links bridge.css; nothing to do' % src)
    rw = Rewriter(os.path.dirname(src), out_dir, siblings)
    html = rewrite_markup(html, rw)
    bridge_href = os.path.relpath(BRIDGE, out_dir).replace(os.sep, '/')
    add_font = 'pretendard' not in html.lower()
    html, where = inject(html, bridge_href, add_font)
    html, csp_count = widen_csp(html) if add_font else (html, 0)
    original_href = os.path.relpath(src, out_dir).replace(os.sep, '/')
    html, note_where = add_note(html, original_href, os.path.basename(src))
    note = '<!-- Re-themed preview generated by ds/tools/restyle.py from %s. Do not edit; edit the original. -->\n' % os.path.relpath(src, REPO)
    m = re.match(r'\s*<!doctype[^>]*>\s*', html, re.I)
    html = html[:m.end()] + note + html[m.end():] if m else note + html
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(html)
    warns = js_warnings(html, os.path.dirname(src))
    print('%-22s -> %s  (bridge %s, note %s, %d URL%s rewritten%s)' % (
        os.path.relpath(src, REPO), os.path.relpath(dst, os.getcwd()), where, note_where, rw.count, '' if rw.count == 1 else 's',
        ', CSP widened for the font CDN' if csp_count else ''))
    for w in warns:
        print('    warning: JavaScript refers to %r; not rewritten, may not load in the copy' % w)
    return dst


def main(argv=None):
    ap = argparse.ArgumentParser(description='Make re-themed copies of old course pages (originals are never touched).')
    ap.add_argument('pages', nargs='*', help='HTML files to restyle (relative to the repo or absolute)')
    ap.add_argument('--all', action='store_true', help='restyle week2–5, the *show pages, week2guide, midterm, github-team-lab and index.html')
    ap.add_argument('--out', default=os.path.join(REPO, 'restyled'), help='output folder (default: <repo>/restyled)')
    ap.add_argument('--link-siblings', action='store_true',
                    help='links to other pages restyled in the same run point at their restyled copies')
    a = ap.parse_args(argv)
    pages = list(a.pages)
    if a.all:
        pages += [p for p in DEFAULT_PAGES if p not in pages]
    if not pages:
        ap.print_help()
        return 2
    paths = [p if os.path.isabs(p) else os.path.join(REPO, p) if not os.path.exists(p) else os.path.abspath(p) for p in pages]
    out_dir = os.path.abspath(a.out)
    if out_dir == REPO:
        raise SystemExit('--out must not be the repository root')
    siblings = set(os.path.abspath(p) for p in paths) if a.link_siblings else set()
    for p in paths:
        restyle(p, out_dir, siblings)
    return 0


if __name__ == '__main__':
    sys.exit(main())
