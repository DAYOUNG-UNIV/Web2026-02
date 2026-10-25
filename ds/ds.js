/* ==========================================================================
   웹프로그래밍개론 · Design System — ds.js
   Vanilla JS, no build step, works from file:// and GitHub Pages.
   Progressive enhancement: every page is readable with JS off.
   Components initialise from classes / data-attributes on DOMContentLoaded.
   Public API: window.DS = { init(root), highlight(code, lang), version }
               window.deck = { count, show(i), current, next(), prev() }  (deck pages)
   ========================================================================== */
(function () {
  'use strict';

  var D = document, R = D.documentElement;
  R.classList.add('js');

  /* ------------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------------ */
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(tag, attrs, html) {
    var e = D.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v == null) return;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v === true ? '' : v);
    });
    if (html != null) e.innerHTML = html;
    return e;
  }
  function pad2(n) { return String(n).padStart(2, '0'); }
  var uidN = 0;
  function uid(p) { uidN += 1; return (p || 'ds') + '-' + uidN; }
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable: keep working */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  function pageType() { return R.getAttribute('data-page') || (D.body && D.body.getAttribute('data-page')) || ''; }
  function dedent(s) {
    s = String(s).replace(/^\s*\n/, '').replace(/\s+$/, '');
    var lines = s.split('\n'), min = Infinity;
    lines.forEach(function (l) { if (l.trim()) { var m = l.match(/^[ \t]*/)[0].length; if (m < min) min = m; } });
    return min && min !== Infinity ? lines.map(function (l) { return l.slice(min); }).join('\n') : s;
  }
  function onScrollFrame(fn) {
    var busy = false;
    window.addEventListener('scroll', function () { if (busy) return; busy = true; requestAnimationFrame(function () { busy = false; fn(); }); }, { passive: true });
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var t = el('textarea', { 'aria-hidden': 'true', style: 'position:fixed;left:-9999px;top:0;opacity:0' });
    t.value = text; D.body.appendChild(t); t.select();
    try { D.execCommand('copy'); } catch (e) { }
    t.remove();
  }

  var ICON = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17A8.5 8.5 0 0 0 12 3.5z" fill="currentColor"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/></svg>',
    toc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6h16M4 12h11M4 18h14"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M17.5 3.5l3 3L12 15l-4 1 1-4z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 5h14v10H9l-4 4z"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 9h16"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    tools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M7 3.5h7l4.5 4.5v12.5H7z"/><path d="M14 3.5V8h4.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* ------------------------------------------------------------------------
     Theme: system by default; the toggle stores an explicit choice
     ------------------------------------------------------------------------ */
  (function applySavedTheme() {
    var t = store.get('ds-theme', null);
    if (t === 'light' || t === 'dark') R.setAttribute('data-theme', t);
  })();
  function effectiveTheme() {
    var t = R.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; }
  }
  function themeButton(cls) {
    var b = el('button', { type: 'button', class: cls || 'icon-btn theme-btn' }, ICON.sun);
    function label() {
      var next = effectiveTheme() === 'dark' ? '밝은 화면으로' : '어두운 화면으로';
      b.setAttribute('aria-label', next); b.title = next;
      if (cls && cls.indexOf('hb') > -1) b.innerHTML = ICON.sun + '<span>' + (effectiveTheme() === 'dark' ? '밝게' : '어둡게') + '</span>';
    }
    b.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      R.setAttribute('data-theme', next); store.set('ds-theme', next); label();
      $$('.theme-btn').forEach(function (x) { if (x !== b && x._label) x._label(); });
    });
    b._label = label; label();
    return b;
  }

  /* ------------------------------------------------------------------------
     Syntax highlighting: tiny tokenizers for html · css · js · json · bash
     Output uses .tk-c comment · .tk-s string · .tk-n number/literal · .tk-k keyword
     .tk-g tag/selector · .tk-a attribute/flag · .tk-p property/key · .tk-f function/command · .tk-m muted
     ------------------------------------------------------------------------ */
  function span(c, s) { return c ? '<span class="tk-' + c + '">' + esc(s) + '</span>' : esc(s); }
  function runRules(src, rules) {
    var out = '', i = 0, plain = '', n = src.length;
    outer: while (i < n) {
      for (var r = 0; r < rules.length; r++) {
        var re = rules[r][1]; re.lastIndex = i;
        var m = re.exec(src);
        if (m && m[0].length) {
          if (plain) { out += esc(plain); plain = ''; }
          out += span(rules[r][0], m[0]); i += m[0].length; continue outer;
        }
      }
      plain += src[i]; i += 1;
    }
    if (plain) out += esc(plain);
    return out;
  }
  var JS_KW = 'const|let|var|function|return|if|else|for|while|do|break|continue|switch|case|default|new|class|extends|import|from|export|async|await|try|catch|finally|throw|typeof|instanceof|in|of|this|delete|void|yield|super|static';
  var RULES_JS = [
    ['c', /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
    ['s', /`(?:\\[\s\S]|[^\\`])*`?|'(?:\\.|[^\\'\n])*'?|"(?:\\.|[^\\"\n])*"?/y],
    ['k', new RegExp('(?:' + JS_KW + ')(?![\\w$])', 'y')],
    ['n', /(?:true|false|null|undefined|NaN|Infinity)(?![\w$])|(?:0[xX][\da-fA-F]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)n?(?![\w$])/y],
    ['f', /[A-Za-z_$][\w$]*(?=\s*\()/y],
    ['', /[A-Za-z_$][\w$]*|\s+/y]
  ];
  var RULES_JSON = [
    ['p', /"(?:\\.|[^\\"\n])*"(?=\s*:)/y],
    ['s', /"(?:\\.|[^\\"\n])*"?/y],
    ['n', /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/y],
    ['', /\s+/y]
  ];
  var RULES_CSSVAL = [
    ['c', /\/\*[\s\S]*?(?:\*\/|$)/y],
    ['s', /"(?:\\.|[^\\"\n])*"?|'(?:\\.|[^\\'\n])*'?/y],
    ['k', /!important/y],
    ['n', /#[\da-fA-F]{3,8}(?![\w-])|-?(?:\d*\.)?\d+(?:[a-zA-Z%]+)?/y],
    ['f', /[\w-]+(?=\()/y],
    ['', /[\w-]+|\s+/y]
  ];
  function hlJS(s) { return runRules(s, RULES_JS); }
  function hlJSON(s) { return runRules(s, RULES_JSON); }
  function hlCSS(src) {
    var out = '', i = 0, n = src.length;
    while (i < n) {
      var c = src[i];
      if (/\s/.test(c)) { var w = /\s+/y; w.lastIndex = i; var ws = w.exec(src)[0]; out += ws; i += ws.length; continue; }
      if (src.startsWith('/*', i)) { var e = src.indexOf('*/', i + 2); e = e < 0 ? n : e + 2; out += span('c', src.slice(i, e)); i = e; continue; }
      if (c === '{' || c === '}' || c === ';') { out += c; i += 1; continue; }
      var j = i, q = null;
      while (j < n) {
        var d = src[j];
        if (q) { if (d === '\\') j += 1; else if (d === q) q = null; }
        else if (d === '"' || d === "'") q = d;
        else if (d === '{' || d === '}' || d === ';' || src.startsWith('/*', j)) break;
        j += 1;
      }
      var seg = src.slice(i, j);
      if (src[j] === '{') {
        if (seg.trim()[0] === '@') { var at = /^(\s*@[\w-]+)/.exec(seg); out += span('k', at[1]) + runRules(seg.slice(at[1].length), RULES_CSSVAL); }
        else out += span('g', seg);
      } else {
        var k = seg.indexOf(':');
        if (k > -1 && seg.trim()[0] !== '@') out += span('p', seg.slice(0, k)) + ':' + runRules(seg.slice(k + 1), RULES_CSSVAL);
        else if (seg.trim()[0] === '@') { var at2 = /^(\s*@[\w-]+)/.exec(seg); out += span('k', at2[1]) + runRules(seg.slice(at2[1].length), RULES_CSSVAL); }
        else out += runRules(seg, RULES_CSSVAL);
      }
      i = j;
    }
    return out;
  }
  function hlHTML(src) {
    var out = '', i = 0, n = src.length;
    while (i < n) {
      if (src.startsWith('<!--', i)) { var e = src.indexOf('-->', i + 4); e = e < 0 ? n : e + 3; out += span('c', src.slice(i, e)); i = e; continue; }
      if (src[i] === '<' && /^<!doctype/i.test(src.slice(i, i + 9))) { var e2 = src.indexOf('>', i); e2 = e2 < 0 ? n : e2 + 1; out += span('m', src.slice(i, e2)); i = e2; continue; }
      if (src[i] === '<' && /[A-Za-z\/]/.test(src[i + 1] || '')) {
        var tre = /<\/?[A-Za-z][\w:-]*/y; tre.lastIndex = i; var tm = tre.exec(src);
        if (tm) {
          var name = tm[0].replace(/[<\/]/g, '').toLowerCase(), closing = tm[0][1] === '/';
          out += span('g', tm[0]); i += tm[0].length;
          while (i < n) {
            var wre = /\s+/y; wre.lastIndex = i; var wm = wre.exec(src);
            if (wm) { out += wm[0]; i += wm[0].length; continue; }
            if (src.startsWith('/>', i)) { out += span('g', '/>'); i += 2; break; }
            if (src[i] === '>') { out += span('g', '>'); i += 1; break; }
            if (src[i] === '=') {
              out += '='; i += 1;
              var vre = /"[^"]*"?|'[^']*'?|[^\s>]+/y; vre.lastIndex = i; var vm = vre.exec(src);
              if (vm) { out += span('s', vm[0]); i += vm[0].length; }
              continue;
            }
            var are = /[^\s=>\/"']+/y; are.lastIndex = i; var am = are.exec(src);
            if (am) { out += span('a', am[0]); i += am[0].length; continue; }
            out += esc(src[i]); i += 1;
          }
          if (!closing && (name === 'script' || name === 'style')) {
            var endRe = new RegExp('</' + name + '\\s*>', 'ig'); endRe.lastIndex = i;
            var em = endRe.exec(src), stop = em ? em.index : n;
            var inner = src.slice(i, stop);
            out += name === 'script' ? hlJS(inner) : hlCSS(inner); i = stop;
          }
          continue;
        }
      }
      var txt = /[^<]+/y; txt.lastIndex = i; var tx = txt.exec(src);
      if (tx) { out += esc(tx[0]); i += tx[0].length; continue; }
      out += esc(src[i]); i += 1;
    }
    return out;
  }
  function hlBashLine(line) {
    var out = '', i = 0, n = line.length, cmdNext = true;
    while (i < n) {
      var c = line[i];
      if (/\s/.test(c)) { var w = /\s+/y; w.lastIndex = i; var ws = w.exec(line)[0]; out += ws; i += ws.length; continue; }
      if (c === '#') { out += span('c', line.slice(i)); break; }
      if (c === '"' || c === "'") { var j = i + 1; while (j < n && line[j] !== c) { if (line[j] === '\\') j += 1; j += 1; } out += span('s', line.slice(i, j + 1)); i = j + 1; cmdNext = false; continue; }
      var op = /&&|\|\||[|;]/y; op.lastIndex = i; var om = op.exec(line);
      if (om) { out += span('k', om[0]); i += om[0].length; cmdNext = true; continue; }
      var wr = /[^\s"'|;&]+/y; wr.lastIndex = i; var word = wr.exec(line)[0];
      if (cmdNext) { out += span('f', word); cmdNext = false; }
      else if (/^--?[\w-]/.test(word)) out += span('a', word);
      else if (/^\$\{?\w+\}?$/.test(word)) out += span('n', word);
      else out += esc(word);
      i += word.length;
    }
    return out;
  }
  function hlBash(src) {
    var lines = src.split('\n');
    var hasPrompt = lines.some(function (l) { return /^\s*\$\s/.test(l); });
    return lines.map(function (l) {
      if (/^\s*#/.test(l) && !hasPrompt) return span('c', l);
      var p = /^(\s*\$\s)/.exec(l);
      if (p) return span('m', p[1]) + hlBashLine(l.slice(p[1].length));
      if (hasPrompt) return span('m', l);
      return hlBashLine(l);
    }).join('\n');
  }
  function highlight(code, lang) {
    lang = String(lang || '').toLowerCase();
    if (/^(javascript|jsx|mjs|cjs|ts|typescript|tsx|js)$/.test(lang)) return hlJS(code);
    if (/^(html|markup|xml|svg|vue)$/.test(lang)) return hlHTML(code);
    if (/^(css|scss)$/.test(lang)) return hlCSS(code);
    if (/^(json|jsonc)$/.test(lang)) return hlJSON(code);
    if (/^(bash|sh|shell|zsh|console|terminal|powershell|ps)$/.test(lang)) return hlBash(code);
    return esc(code);
  }
  var LANG_LABEL = { js: 'JavaScript', javascript: 'JavaScript', jsx: 'JSX', html: 'HTML', css: 'CSS', json: 'JSON', bash: 'Terminal', sh: 'Terminal', shell: 'Terminal', console: 'Terminal', md: 'Markdown', markdown: 'Markdown', text: 'Text', txt: 'Text', diff: 'Diff' };

  /* ------------------------------------------------------------------------
     Code blocks: header (file / language) + copy button + highlighting
     <pre class="code" data-lang="js" data-file="app.js"><code>…</code></pre>
     ------------------------------------------------------------------------ */
  function copyButton(getText, label) {
    var b = el('button', { type: 'button', class: 'copy-btn', 'aria-label': label || '코드 복사' }, ICON.copy + '<span>복사</span>');
    b.addEventListener('click', function () {
      copyText(getText()).then(function () {
        b.classList.add('is-done'); b.innerHTML = ICON.check + '<span>복사됨</span>';
        setTimeout(function () { b.classList.remove('is-done'); b.innerHTML = ICON.copy + '<span>복사</span>'; }, 1600);
      });
    });
    return b;
  }
  var codeQueue = [];
  function enhanceCode(pre) {
    if (pre.dataset.dsReady) return;
    pre.dataset.dsReady = '1';
    var code = $('code', pre) || pre;
    var lang = pre.dataset.lang || ((pre.className + ' ' + code.className).match(/language-([\w-]+)/) || [])[1] || '';
    var file = pre.dataset.file || '';
    var wrap = el('div', { class: 'codeblock' + (pre.classList.contains('bad') ? ' bad' : '') + (pre.classList.contains('good') ? ' good' : '') });
    var head = el('div', { class: 'codeblock-head' });
    if (file) head.appendChild(el('span', { class: 'file', text: file }));
    if (lang && (!file || !/\./.test(file))) head.appendChild(el('span', { class: 'lang', text: LANG_LABEL[lang] || lang }));
    var shell = /^(bash|sh|shell|zsh|console|terminal|powershell|ps)$/.test(lang);
    head.appendChild(copyButton(function () { return shell ? code.textContent.replace(/^\s*\$ /gm, '') : code.textContent; }));
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(head); wrap.appendChild(pre);
    if (lang && pre.dataset.plain === undefined) codeQueue.push({ code: code, lang: lang });
  }
  function paintCode(item) {
    if (item.done) return; item.done = true;
    item.code.innerHTML = highlight(item.code.textContent, item.lang);
  }
  function initCode(root) {
    $$('pre.code, pre[data-lang], pre[data-file]', root).forEach(function (pre) {
      if (pre.closest('.lab, .sim, .diff, .prompt, .no-enhance, .codeblock')) return;
      enhanceCode(pre);
    });
    var items = codeQueue.splice(0);
    if (items.length < 40 || !('IntersectionObserver' in window)) { items.forEach(paintCode); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); paintCode(e.target._dsCode); } });
    }, { rootMargin: '800px 0px' });
    items.forEach(function (it) { var p = it.code.closest('pre') || it.code; p._dsCode = it; io.observe(p); lazyCode.push(it); });
  }
  var lazyCode = [];

  /* Diff: <figure class="diff" data-file="app.js"><pre>- old\n+ new</pre></figure> */
  function diffHTML(text) {
    return text.replace(/\n$/, '').split('\n').map(function (l) {
      var c = l[0], cls = c === '+' ? 'add' : c === '-' ? 'del' : c === '@' ? 'hunk' : '';
      var body = (c === '+' || c === '-' || c === ' ') ? l.slice(1) : l;
      return '<span class="ln' + (cls ? ' ' + cls : '') + '">' + esc(body) + '</span>';
    }).join('');
  }
  function initDiff(root) {
    $$('.diff', root).forEach(function (f) {
      if (f.dataset.dsReady) return; f.dataset.dsReady = '1';
      var pre = $('pre', f); if (!pre) return;
      var code = $('code', pre) || pre;
      var text = dedent(code.textContent);
      code.innerHTML = diffHTML(text);
      code.setAttribute('aria-label', '변경 내용: 더한 줄은 +, 지운 줄은 −');
    });
  }

  /* ------------------------------------------------------------------------
     Page chrome: top bar tools, TOC, progress, part select, part nav, anchors
     ------------------------------------------------------------------------ */
  function headingText(h) {
    var c = h.cloneNode(true);
    $$('.anchor, .sr-only', c).forEach(function (x) { x.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function slug(s, used) {
    var b = s.toLowerCase().replace(/[^\w가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'sec';
    var k = b, n = 2; while (used[k] || D.getElementById(k)) { k = b + '-' + n; n += 1; }
    used[k] = 1; return k;
  }
  function initChrome() {
    var page = pageType();
    var bar = $('.topbar');
    var tools = null;
    if (bar) {
      tools = $('.topbar-tools', bar);
      if (!tools) { tools = el('div', { class: 'topbar-tools' }); bar.appendChild(tools); }
    }
    var doc = $('.doc');
    var isReading = page === 'reading' || page === 'module';
    if (doc && isReading) buildToc(doc, bar, tools);
    if (tools && $('.deep')) tools.appendChild(deepAllButton());
    if (tools) tools.appendChild(themeButton());
    if (bar && doc && (isReading || page === 'summary')) {
      var prog = el('div', { class: 'progress', 'aria-hidden': 'true' }, '<span></span>');
      bar.appendChild(prog);
      var fill = prog.firstChild;
      fill.style.transformOrigin = '0 50%'; fill.style.width = '100%'; fill.style.transform = 'scaleX(0)';
      var upd = function () {
        var h = R.scrollHeight - innerHeight;
        fill.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0) + ')';
      };
      onScrollFrame(upd); window.addEventListener('resize', upd); upd();
    }
    if (!bar && page !== 'deck' && page) {
      var floating = themeButton('icon-btn theme-btn');
      floating.style.cssText = 'position:fixed;right:.75rem;top:.6rem;z-index:60';
      D.body.appendChild(floating);
    }
  }

  function buildToc(doc, bar, tools) {
    var parts = $$('.part', doc);
    var used = {};
    var model = [];
    if (parts.length) {
      parts.forEach(function (p, pi) {
        var h = $('.part-head h2', p) || $('h2', p);
        if (!p.id) p.id = 'part-' + pad2(pi + 1);
        var entry = { el: p, n: pad2(pi + 1), title: h ? headingText(h) : 'PART ' + pad2(pi + 1), secs: [], head: $('.part-head', p) || h };
        var sn = 0;
        $$(':scope > .sec', p).forEach(function (s) {
          var sh = $(':scope > h2, :scope > h3', s);
          var num = s.classList.contains('unnumbered') ? '' : entry.n + '.' + (++sn);
          if (!s.id) s.id = slug(sh ? headingText(sh) : 's', used);
          entry.secs.push({ el: s, n: num, title: sh ? headingText(sh) : '' });
        });
        model.push(entry);
      });
    } else {
      var sn2 = 0;
      var flat = { el: doc, n: '', title: '', secs: [] };
      $$(':scope > .sec, :scope > main > .sec', doc).forEach(function (s) {
        var sh = $(':scope > h2, :scope > h3', s);
        if (!s.id) s.id = slug(sh ? headingText(sh) : 's', used);
        flat.secs.push({ el: s, n: s.classList.contains('unnumbered') ? '' : pad2(++sn2), title: sh ? headingText(sh) : '' });
      });
      model.push(flat);
    }
    var total = model.reduce(function (a, m) { return a + m.secs.length; }, 0);
    if (!total && !parts.length) return;

    // anchors
    model.forEach(function (m) {
      m.secs.forEach(function (s) {
        var h = $(':scope > h2, :scope > h3', s.el);
        if (h && !$('.anchor', h)) h.appendChild(el('a', { class: 'anchor', href: '#' + s.el.id, 'aria-label': '이 절의 링크' }, '#'));
      });
    });

    var toc = $('.toc');
    var layout = $('.layout');
    if (!toc) {
      toc = el('nav', { class: 'toc', 'aria-label': '목차' });
      if (layout) layout.insertBefore(toc, layout.firstChild); else D.body.appendChild(toc);
    }
    if (!toc.id) toc.id = 'toc';
    var html = '<div class="toc-head"><span class="kicker">목차</span><button type="button" class="icon-btn toc-close" aria-label="목차 닫기">' + ICON.close + '</button></div>';
    var navLinks = bar ? $$('.topbar-nav a', bar) : [];
    if (navLinks.length) html += '<div class="toc-links">' + navLinks.map(function (a) { return '<a href="' + esc(a.getAttribute('href')) + '">' + esc(a.textContent) + '</a>'; }).join('') + '</div>';
    if (parts.length) {
      html += '<ol>';
      model.forEach(function (m, mi) {
        html += '<li class="toc-part" data-i="' + mi + '"><a href="#' + m.el.id + '"><span class="n">' + m.n + '</span><span>' + esc(m.title) + '</span></a><ol>';
        m.secs.forEach(function (s) { html += '<li><a href="#' + s.el.id + '"><span class="n">' + s.n + '</span><span>' + esc(s.title) + '</span></a></li>'; });
        html += '</ol></li>';
      });
      html += '</ol>';
    } else {
      html += '<ol class="toc-flat">' + model[0].secs.map(function (s) { return '<li><a href="#' + s.el.id + '"><span class="n">' + s.n + '</span><span>' + esc(s.title) + '</span></a></li>'; }).join('') + '</ol>';
    }
    toc.innerHTML = html;
    var backdrop = el('div', { class: 'toc-backdrop' });
    D.body.appendChild(backdrop);

    // part select + toc button in the top bar
    var select = null, tocBtn = null, jumpAt = 0;
    if (tools) {
      tocBtn = el('button', { type: 'button', class: 'icon-btn toc-btn', 'aria-label': '목차 열기', 'aria-controls': toc.id, 'aria-expanded': 'false' }, ICON.toc);
      tools.appendChild(tocBtn);
      if (parts.length > 1) {
        select = el('select', { class: 'part-select', 'aria-label': '파트로 이동' });
        select.innerHTML = model.map(function (m) { return '<option value="' + m.el.id + '">' + m.n + ' · ' + esc(m.title) + '</option>'; }).join('');
        select.addEventListener('change', function () { var t = D.getElementById(select.value); if (t) { jumpAt = Date.now(); t.scrollIntoView({ behavior: 'instant', block: 'start' }); try { history.replaceState(null, '', '#' + select.value); } catch (e) { } } });
        tools.insertBefore(select, tools.firstChild);
      }
    }
    function openToc(open) {
      toc.classList.toggle('is-open', open); backdrop.classList.toggle('is-open', open);
      if (tocBtn) tocBtn.setAttribute('aria-expanded', String(open));
      if (open) { var c = $('a.is-current', toc) || $('a', toc); if (c) c.focus({ preventScroll: false }); }
      else if (tocBtn && toc.contains(D.activeElement)) tocBtn.focus();
    }
    if (tocBtn) tocBtn.addEventListener('click', function () { openToc(!toc.classList.contains('is-open')); });
    backdrop.addEventListener('click', function () { openToc(false); });
    $('.toc-close', toc).addEventListener('click', function () { openToc(false); });
    toc.addEventListener('click', function (e) { if (e.target.closest('a') && toc.classList.contains('is-open')) openToc(false); });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && toc.classList.contains('is-open')) openToc(false); });

    // part prev/next footers
    if (parts.length > 1) {
      model.forEach(function (m, mi) {
        if ($(':scope > .part-nav', m.el)) return;
        var prev = model[mi - 1], next = model[mi + 1];
        var nav = el('nav', { class: 'part-nav', 'aria-label': '파트 이동' });
        if (prev) nav.appendChild(el('a', { class: 'prev', href: '#' + prev.el.id }, '<span>← 이전 파트 ' + prev.n + '</span>' + esc(prev.title)));
        if (next) nav.appendChild(el('a', { class: 'next', href: '#' + next.el.id }, '<span>다음 파트 ' + next.n + ' →</span>' + esc(next.title)));
        m.el.appendChild(nav);
      });
    }
    if (total > 30) parts.forEach(function (p) { p.classList.add('is-lazy'); });

    // current section tracking
    var links = {};
    $$('a', toc).forEach(function (a) { var id = (a.getAttribute('href') || '').slice(1); if (id) links[id] = a; });
    var targets = [];
    model.forEach(function (m) { if (m.head && parts.length) targets.push({ el: m.head, part: m }); m.secs.forEach(function (s) { targets.push({ el: s.el, part: m, sec: s }); }); });
    var vis = new Set(), current = null;
    function setCurrent(t) {
      if (!t || t === current) return;
      current = t;
      $$('a.is-current', toc).forEach(function (a) { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
      var la = t.sec ? links[t.sec.el.id] : null, pa = parts.length ? links[t.part.el.id] : null;
      if (la) { la.classList.add('is-current'); la.setAttribute('aria-current', 'true'); }
      if (pa) pa.classList.add('is-current');
      if (parts.length) $$('.toc-part', toc).forEach(function (li) { li.classList.toggle('is-open', li.firstChild === pa); });
      if (select && t.part.el.id !== select.value && Date.now() - jumpAt > 1500) select.value = t.part.el.id;
      var a = la || pa;
      if (a && toc.offsetParent && toc.scrollHeight > toc.clientHeight) {
        var top = a.offsetTop - toc.offsetTop, h = toc.clientHeight;
        if (top < toc.scrollTop + 40 || top > toc.scrollTop + h - 80) toc.scrollTop = Math.max(0, top - h / 3);
      }
    }
    if ('IntersectionObserver' in window && targets.length) {
      var topOff = (bar ? bar.offsetHeight : 0) + 8;
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { if (e.isIntersecting) vis.add(e.target); else vis.delete(e.target); });
        for (var k = targets.length - 1; k >= 0; k--) { if (vis.has(targets[k].el)) { setCurrent(targets[k]); break; } }
      }, { rootMargin: '-' + topOff + 'px 0px -62% 0px' });
      targets.forEach(function (t) { io.observe(t.el); });
    }
    setCurrent(targets[0]);
    if (location.hash) {
      var id = decodeURIComponent(location.hash.slice(1));
      var tgt = targets.filter(function (t) { return (t.sec && t.sec.el.id === id) || (!t.sec && t.part.el.id === id); })[0];
      if (tgt) setCurrent(tgt);
    }
  }

  /* ------------------------------------------------------------------------
     심화 (.deep): collapsible boxes + one global toggle; hidden="until-found"
     keeps collapsed text findable with Ctrl+F
     ------------------------------------------------------------------------ */
  var deepBoxes = [];
  function deepPref() { return store.get('ds-deep', R.getAttribute('data-deep') === 'open' ? 'open' : 'closed'); }
  function setDeep(box, open) {
    var body = box._body, btn = box._btn;
    if (open) body.removeAttribute('hidden'); else body.setAttribute('hidden', 'until-found');
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('.deep-state').textContent = open ? '접기' : '펼치기';
    box.classList.toggle('is-collapsed', !open);
  }
  function initDeep(root) {
    var pref = deepPref();
    $$('.deep', root).forEach(function (box) {
      if (box.classList.contains('is-ready')) return;
      var title = $(':scope > .deep-title, :scope > .callout-title, :scope > h3, :scope > h4, :scope > h5', box);
      var label = box.getAttribute('data-label') || '심화';
      var body = el('div', { class: 'deep-body', id: uid('deep') });
      Array.prototype.slice.call(box.childNodes).forEach(function (n) { if (n !== title) body.appendChild(n); });
      var holder = title || el('p', { class: 'deep-title' });
      var name = title ? title.innerHTML : '심화 내용';
      var btn = el('button', { type: 'button', class: 'deep-toggle', 'aria-controls': body.id }, '<span class="deep-label">' + esc(label) + '</span><span class="deep-name">' + name + '</span><span class="deep-state"></span>');
      holder.innerHTML = ''; holder.appendChild(btn); holder.style.margin = '0';
      box.innerHTML = ''; box.appendChild(holder); box.appendChild(body);
      box._body = body; box._btn = btn; box.classList.add('is-ready');
      btn.addEventListener('click', function () { setDeep(box, box.classList.contains('is-collapsed')); syncDeepAll(); });
      body.addEventListener('beforematch', function () { setDeep(box, true); syncDeepAll(); });
      setDeep(box, pref === 'open');
      deepBoxes.push(box);
    });
  }
  var deepAllBtn = null;
  function deepAllButton() {
    deepAllBtn = el('button', { type: 'button', class: 'deep-all', 'aria-pressed': 'false' });
    deepAllBtn.addEventListener('click', function () {
      var openAll = deepAllBtn.getAttribute('aria-pressed') !== 'true';
      deepBoxes.forEach(function (b) { setDeep(b, openAll); });
      store.set('ds-deep', openAll ? 'open' : 'closed');
      syncDeepAll();
    });
    setTimeout(syncDeepAll, 0);
    return deepAllBtn;
  }
  function syncDeepAll() {
    if (!deepAllBtn) return;
    var allOpen = deepBoxes.length && deepBoxes.every(function (b) { return !b.classList.contains('is-collapsed'); });
    deepAllBtn.setAttribute('aria-pressed', String(!!allOpen));
    deepAllBtn.innerHTML = allOpen ? '심화 <span class="long">내용 </span>접기' : '심화 <span class="long">내용 </span>펼치기';
    deepAllBtn.title = allOpen ? '모든 심화 상자를 접습니다' : '모든 심화 상자를 펼칩니다';
  }

  /* ------------------------------------------------------------------------
     Quiz: single (radio), multiple (checkbox), short answer (input[data-accept])
     ------------------------------------------------------------------------ */
  function norm(s) { return String(s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.。!]+$/, '').replace(/^["'`]|["'`]$/g, ''); }
  function initQuiz(q) {
    if (q.classList.contains('is-ready')) return;
    q.classList.add('is-ready');
    var items = $$('.quiz-item', q); if (!items.length) items = [q];
    var tries = 0;
    var foot = $('.quiz-foot', q);
    if (!foot) { foot = el('div', { class: 'quiz-foot' }); q.appendChild(foot); }
    var btn = $('.quiz-check, button[type="submit"]', q);
    if (!btn) { btn = el('button', { type: 'button', class: 'btn quiz-check' }, '확인'); foot.appendChild(btn); }
    var res = $('.quiz-result', q);
    if (!res) { res = el('p', { class: 'quiz-result', role: 'status' }); foot.appendChild(res); }
    res.setAttribute('aria-live', 'polite');
    items.forEach(function (it) {
      it.addEventListener('change', function () { clearItem(it); });
      var t = $('input[data-accept]', it);
      if (t) t.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    });
    function clearItem(it) {
      $$('.is-right, .is-wrong, .is-missed, .is-revealed', it).forEach(function (x) { x.classList.remove('is-right', 'is-wrong', 'is-missed', 'is-revealed'); });
      var m = $('.quiz-mark', it); if (m) m.remove();
    }
    function evalItem(it) {
      clearItem(it);
      var text = $('input[data-accept]', it);
      if (text) {
        var ok0 = text.getAttribute('data-accept').split('|').map(norm).indexOf(norm(text.value)) > -1 && norm(text.value) !== '';
        text.classList.add(ok0 ? 'is-right' : 'is-wrong');
        var mark = el('span', { class: 'quiz-mark ' + (ok0 ? 'ok' : 'no') }, ok0 ? '맞습니다' : '아직 아닙니다');
        text.insertAdjacentElement('afterend', mark);
        if (ok0 || tries >= 2) $$('.quiz-why', it).forEach(function (w) { w.classList.add('is-revealed'); });
        return ok0;
      }
      var inputs = $$('input[type="radio"], input[type="checkbox"]', it), ok = true, any = false;
      inputs.forEach(function (inp) {
        var li = inp.closest('li') || inp.parentElement;
        var correct = inp.hasAttribute('data-answer') || !!inp.closest('[data-answer]');
        if (inp.checked) { any = true; li.classList.add(correct ? 'is-right' : 'is-wrong', 'is-revealed'); if (!correct) ok = false; }
        else if (correct) ok = false;
      });
      if (!ok && tries >= 2) inputs.forEach(function (inp) {
        var li = inp.closest('li') || inp.parentElement;
        if ((inp.hasAttribute('data-answer') || inp.closest('[data-answer]')) && !inp.checked) li.classList.add('is-missed', 'is-revealed');
      });
      return ok && any;
    }
    function check() {
      tries += 1;
      var right = 0;
      items.forEach(function (it) { if (evalItem(it)) right += 1; });
      var all = right === items.length;
      if (items.length > 1) res.textContent = right + ' / ' + items.length + ' 정답' + (all ? '. 모두 맞혔습니다.' : tries >= 2 ? '. 정답과 설명을 함께 표시했습니다.' : '. 틀린 문항의 설명을 읽고 다시 골라 보세요.');
      else res.textContent = all ? '정답입니다.' : tries >= 2 ? '정답과 설명을 표시했습니다.' : '아직 아닙니다. 설명을 읽고 다시 골라 보세요.';
      res.className = 'quiz-result ' + (all ? 'ok' : 'no');
    }
    btn.addEventListener('click', function (e) { e.preventDefault(); check(); });
    if (q.tagName === 'FORM') q.addEventListener('submit', function (e) { e.preventDefault(); check(); });
  }

  /* ------------------------------------------------------------------------
     Self-check list: <ul class="checklist" data-checklist="week9-goals">
     ------------------------------------------------------------------------ */
  function initChecklist(list) {
    if (list.classList.contains('is-ready')) return;
    list.classList.add('is-ready');
    var page = (location.pathname.split('/').pop() || 'index').replace(/\.html?$/, '');
    var key = 'ds-check:' + page + ':' + (list.getAttribute('data-checklist') || $$('.checklist').indexOf(list));
    var boxes = $$('input[type="checkbox"]', list);
    boxes.forEach(function (b) {
      var lab = b.closest('label');
      if (lab && !(b.nextElementSibling && b.nextElementSibling.tagName === 'SPAN')) {
        var s = el('span'); var n = b.nextSibling;
        while (n) { var nx = n.nextSibling; s.appendChild(n); n = nx; }
        lab.appendChild(s);
      }
    });
    var saved = store.get(key, []);
    boxes.forEach(function (b, i) { if (saved.indexOf(i) > -1) b.checked = true; });
    var prog = null;
    if (list.getAttribute('data-progress') !== 'off') {
      prog = el('div', { class: 'checklist-progress', 'aria-live': 'polite' }, '<span class="t"></span><span class="bar" aria-hidden="true"><i></i></span>');
      var reset = el('button', { type: 'button', class: 'btn small quiet' }, '지우기');
      reset.addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); save(); });
      prog.appendChild(reset);
      list.parentNode.insertBefore(prog, list);
    }
    function save() {
      var on = []; boxes.forEach(function (b, i) { if (b.checked) on.push(i); });
      store.set(key, on);
      if (prog) {
        $('.t', prog).innerHTML = '<b>' + on.length + '</b> / ' + boxes.length + ' 확인';
        $('.bar i', prog).style.width = (boxes.length ? on.length / boxes.length * 100 : 0) + '%';
        $('.btn', prog).hidden = !on.length;
      }
    }
    boxes.forEach(function (b) { b.addEventListener('change', save); });
    save();
  }

  /* ------------------------------------------------------------------------
     Tabs: <div class="tabs" data-tabs="os"><section class="tab" data-tab="Windows">…
     Same data-tabs name ⇒ groups stay in sync and remember the choice.
     ------------------------------------------------------------------------ */
  var tabGroups = {};
  function initTabs(box) {
    if (box.classList.contains('is-ready')) return;
    var panels = $$(':scope > .tab, :scope > [data-tab]', box);
    if (!panels.length) return;
    box.classList.add('is-ready');
    var group = box.getAttribute('data-tabs') || '';
    var list = el('div', { class: 'tablist', role: 'tablist', 'aria-label': box.getAttribute('data-label') || '보기 선택' });
    var btns = panels.map(function (p, i) {
      if (!p.id) p.id = uid('tab');
      var b = el('button', { type: 'button', role: 'tab', id: p.id + '-t', 'aria-controls': p.id, 'aria-selected': 'false', tabindex: '-1' });
      b.textContent = p.getAttribute('data-tab') || ('탭 ' + (i + 1));
      p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); p.tabIndex = 0;
      b.addEventListener('click', function () { select(i, true); });
      b.addEventListener('keydown', function (e) {
        var k = e.key, j = null;
        if (k === 'ArrowRight') j = (i + 1) % panels.length; else if (k === 'ArrowLeft') j = (i - 1 + panels.length) % panels.length;
        else if (k === 'Home') j = 0; else if (k === 'End') j = panels.length - 1;
        if (j !== null) { e.preventDefault(); select(j, true); btns[j].focus(); }
      });
      list.appendChild(b);
      return b;
    });
    box.insertBefore(list, box.firstChild);
    function select(i, user) {
      btns.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; panels[k].hidden = k !== i; });
      if (user && group) {
        var name = panels[i].getAttribute('data-tab');
        store.set('ds-tab:' + group, name);
        (tabGroups[group] || []).forEach(function (f) { if (f !== selectByName) f(name); });
      }
    }
    function selectByName(name) { var k = panels.map(function (p) { return p.getAttribute('data-tab'); }).indexOf(name); if (k > -1) select(k, false); }
    var start = 0;
    if (group) {
      (tabGroups[group] = tabGroups[group] || []).push(selectByName);
      var saved = store.get('ds-tab:' + group, null);
      var k0 = panels.map(function (p) { return p.getAttribute('data-tab'); }).indexOf(saved);
      if (k0 > -1) start = k0;
    }
    var preset = panels.findIndex(function (p) { return p.hasAttribute('data-default'); });
    if (preset > -1 && !(group && store.get('ds-tab:' + group, null))) start = preset;
    select(start, false);
  }

  /* ------------------------------------------------------------------------
     Glossary terms: <dfn title="정의">용어</dfn> → popover on hover/focus/tap
     ------------------------------------------------------------------------ */
  var pop = null, popFor = null, popTimer = 0;
  function initTerms(root) {
    var terms = $$('dfn[title], .term[title], dfn[data-def], .term[data-def]', root).filter(function (t) { return !t.classList.contains('is-ready'); });
    if (!terms.length) return;
    if (!pop) {
      pop = el('div', { class: 'ds-pop', role: 'tooltip', id: 'ds-pop' }); pop.hidden = true; D.body.appendChild(pop);
      D.addEventListener('keydown', function (e) { if (e.key === 'Escape') hidePop(); });
      window.addEventListener('scroll', function () { if (popFor) hidePop(); }, { passive: true });
      D.addEventListener('click', function (e) { if (popFor && !e.target.closest('dfn, .term')) hidePop(); });
      pop.addEventListener('mouseenter', function () { clearTimeout(popTimer); });
      pop.addEventListener('mouseleave', function () { popTimer = setTimeout(hidePop, 150); });
    }
    terms.forEach(function (t) {
      var def = t.getAttribute('data-def') || t.getAttribute('title');
      t.setAttribute('data-def', def); t.removeAttribute('title');
      t.classList.add('is-ready');
      if (!t.hasAttribute('tabindex')) t.tabIndex = 0;
      t.setAttribute('role', 'button');
      t.setAttribute('aria-label', t.textContent.trim() + ' — 뜻 보기');
      t.addEventListener('mouseenter', function () { clearTimeout(popTimer); showPop(t); });
      t.addEventListener('mouseleave', function () { popTimer = setTimeout(hidePop, 150); });
      t.addEventListener('focus', function () { showPop(t); });
      t.addEventListener('blur', function () { popTimer = setTimeout(hidePop, 100); });
      t.addEventListener('click', function (e) { e.preventDefault(); if (popFor === t && !pop.hidden) hidePop(); else showPop(t); });
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (popFor === t && !pop.hidden) hidePop(); else showPop(t); } });
    });
  }
  function showPop(t) {
    popFor = t;
    pop.innerHTML = '<b>' + esc(t.textContent.trim()) + '</b>' + esc(t.getAttribute('data-def'));
    pop.hidden = false;
    t.setAttribute('aria-describedby', 'ds-pop');
    var r = t.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    var top = r.bottom + 8; if (top + ph > innerHeight - 8) top = Math.max(8, r.top - ph - 8);
    var left = Math.min(Math.max(8, r.left), innerWidth - pw - 8);
    pop.style.top = top + 'px'; pop.style.left = left + 'px';
  }
  function hidePop() { if (!pop) return; pop.hidden = true; if (popFor) popFor.removeAttribute('aria-describedby'); popFor = null; }

  /* ------------------------------------------------------------------------
     Assignment card: "n일 남음" next to <time datetime> in the 마감 row
     Prompt card: copy button
     Stack map: default layers when the <ol> is omitted
     ------------------------------------------------------------------------ */
  function initAssignment(card) {
    if (card.classList.contains('is-ready')) return; card.classList.add('is-ready');
    var t = $('.due time[datetime]', card);
    if (!t || card.getAttribute('data-countdown') === 'off') return;
    var d = new Date(t.getAttribute('datetime'));
    if (isNaN(d)) return;
    var diff = d - Date.now(), s = el('span', { class: 'due-left' });
    if (diff < 0) { s.textContent = '마감 지남'; s.classList.add('is-past'); }
    else {
      var days = Math.floor(diff / 864e5), hours = Math.floor(diff / 36e5);
      s.textContent = days >= 1 ? days + '일 남음' : hours >= 1 ? hours + '시간 남음' : '곧 마감';
    }
    t.insertAdjacentElement('afterend', s);
  }
  function initPrompt(p) {
    if (p.classList.contains('is-ready')) return; p.classList.add('is-ready');
    var text = $('.prompt-text', p); if (!text) return;
    var head = $('.prompt-head', p);
    if (!head) { head = el('div', { class: 'prompt-head' }, '<span class="prompt-tool">AI 요청 예시</span>'); p.insertBefore(head, p.firstChild); }
    var b = copyButton(function () { return text.innerText.replace(/\n{3,}/g, '\n\n').trim(); }, '요청 문장 복사');
    head.appendChild(b);
  }
  var LAYERS = [
    ['user', '사용자', '보고, 누르고, 입력합니다'],
    ['client', 'HTML · CSS · JS', '화면의 구조, 모양, 동작'],
    ['network', '브라우저 · 네트워크', 'URL, 요청과 응답, HTTP'],
    ['server', 'API · 서버 · 데이터', '데이터를 저장하고 돌려줍니다']
  ];
  function initStackMap(f) {
    if (f.classList.contains('is-ready')) return; f.classList.add('is-ready');
    if ($('ol', f)) return;
    var ol = el('ol');
    LAYERS.forEach(function (L) {
      var note = f.getAttribute('data-note-' + L[0]);
      ol.appendChild(el('li', { 'data-layer': L[0] }, '<b>' + L[1] + '</b><span>' + L[2] + '</span>' + (note ? '<em>' + esc(note) + '</em>' : '')));
    });
    f.insertBefore(ol, f.firstChild);
    if (!f.getAttribute('aria-label') && !$('figcaption', f)) f.setAttribute('aria-label', '웹서비스 구조 지도');
  }

  /* ------------------------------------------------------------------------
     Code-lab
     <div class="lab" data-title="…">
       <script type="text/plain" data-lab="html|css|js|server|test">…</script>
     </div>
     ------------------------------------------------------------------------ */
  var LAB_ORDER = ['html', 'css', 'js', 'server', 'test'];
  var LAB_NAME = { html: 'HTML', css: 'CSS', js: 'JS', server: '서버', test: '테스트' };
  var LIBS = {
    react: [
      ['React', 'https://unpkg.com/react@18.3.1/umd/react.development.js'],
      ['ReactDOM', 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js'],
      ['Babel', 'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js']
    ],
    babel: [['Babel', 'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js']],
    chart: [['Chart.js', 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js']],
    d3: [['D3', 'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js']]
  };
  var STATUS = { 200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content', 301: 'Moved Permanently', 304: 'Not Modified', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict', 422: 'Unprocessable Entity', 429: 'Too Many Requests', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout' };

  /* Runs inside the sandboxed iframe (stringified). Must stay self-contained. */
  function labRuntime(cfg) {
    var P = window.parent;
    function send(type, data) { try { P.postMessage({ __dslab: cfg.id, type: type, data: data }, '*'); } catch (e) { } }
    function fmt(v, d) {
      d = d || 0;
      try {
        if (v === null) return 'null';
        if (v === undefined) return 'undefined';
        var t = typeof v;
        if (t === 'string') return d ? JSON.stringify(v) : v;
        if (t === 'number' || t === 'boolean') return String(v);
        if (t === 'bigint') return String(v) + 'n';
        if (t === 'symbol') return v.toString();
        if (t === 'function') return 'ƒ ' + (v.name || '익명') + '()';
        if (v instanceof Error) return v.name + ': ' + v.message;
        if (typeof Element !== 'undefined' && v instanceof Element) {
          var s = '<' + v.tagName.toLowerCase();
          if (v.id) s += '#' + v.id;
          if (typeof v.className === 'string' && v.className.trim()) s += '.' + v.className.trim().split(/\s+/).join('.');
          return s + '>';
        }
        if (typeof Node !== 'undefined' && v instanceof Node) return v.nodeName;
        if (typeof Promise !== 'undefined' && v instanceof Promise) return 'Promise {…}';
        if (typeof Response !== 'undefined' && v instanceof Response) return 'Response { status: ' + v.status + ', ok: ' + v.ok + ' }';
        if (v instanceof Date) return isNaN(v) ? 'Invalid Date' : v.toISOString();
        if (v instanceof RegExp) return String(v);
        if (d > 3) return Array.isArray(v) ? '[…]' : '{…}';
        if (Array.isArray(v)) return '[' + v.slice(0, 100).map(function (x) { return fmt(x, d + 1); }).join(', ') + (v.length > 100 ? ', …' : '') + ']';
        if (typeof Map !== 'undefined' && v instanceof Map) return 'Map(' + v.size + ') {' + Array.from(v).slice(0, 50).map(function (p) { return fmt(p[0], d + 1) + ' => ' + fmt(p[1], d + 1); }).join(', ') + '}';
        if (typeof Set !== 'undefined' && v instanceof Set) return 'Set(' + v.size + ') {' + Array.from(v).slice(0, 50).map(function (x) { return fmt(x, d + 1); }).join(', ') + '}';
        if (typeof NodeList !== 'undefined' && (v instanceof NodeList || v instanceof HTMLCollection)) return (v instanceof NodeList ? 'NodeList' : 'HTMLCollection') + '(' + v.length + ') [' + Array.prototype.slice.call(v, 0, 20).map(function (x) { return fmt(x, d + 1); }).join(', ') + ']';
        var keys = Object.keys(v);
        var cn = v.constructor && v.constructor.name && v.constructor.name !== 'Object' ? v.constructor.name + ' ' : '';
        return cn + '{' + (keys.length ? ' ' : '') + keys.slice(0, 50).map(function (k) { return (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)) + ': ' + fmt(v[k], d + 1); }).join(', ') + (keys.length > 50 ? ', …' : '') + (keys.length ? ' ' : '') + '}';
      } catch (e) { return String(v); }
    }
    ['log', 'info', 'warn', 'error', 'debug'].forEach(function (lv) {
      var orig = console[lv];
      console[lv] = function () {
        var args = Array.prototype.slice.call(arguments);
        send('log', { level: lv === 'debug' ? 'log' : lv, text: args.map(function (a) { return typeof a === 'string' ? a : fmt(a, 0); }).join(' ') });
        // log/info also reach the browser's own console; warnings and errors stay in the lab panel
        if (orig && (lv === 'log' || lv === 'info' || lv === 'debug')) try { orig.apply(console, args); } catch (e) { }
      };
    });
    console.table = function (t) { send('log', { level: 'log', text: fmt(t, 0) }); };
    console.clear = function () { send('clear'); };
    console.assert = function (c) { if (!c) send('log', { level: 'error', text: 'Assertion failed: ' + Array.prototype.slice.call(arguments, 1).map(function (a) { return typeof a === 'string' ? a : fmt(a, 0); }).join(' ') }); };
    window.addEventListener('error', function (e) {
      var t = e.target;
      if (t && t !== window && t.tagName) {
        if (t.hasAttribute && t.hasAttribute('data-ds-lib')) return;
        send('log', { level: 'error', text: '파일을 불러오지 못했습니다: ' + (t.getAttribute('src') || t.getAttribute('href') || t.tagName.toLowerCase()) });
        return;
      }
      var msg = e.error && e.error.name ? e.error.name + ': ' + e.error.message : String(e.message || '오류').replace(/^Uncaught /, '');
      send('log', { level: 'error', text: msg, line: e.lineno || 0 });
    }, true);
    window.addEventListener('unhandledrejection', function (e) {
      var r = e.reason;
      send('log', { level: 'error', text: '처리하지 않은 Promise 오류 · ' + (r && r.name ? r.name + ': ' + r.message : fmt(r, 1)) });
    });
    window.__dsLib = function (name, src) { send('lib', { name: name, src: src }); };
    /* storage: a sandboxed frame has no localStorage, so provide one that survives re-runs of this lab */
    (function () {
      var data = cfg.store || {};
      function mk(persist) {
        var d = persist ? data : {}, has = Object.prototype.hasOwnProperty;
        function sync() { if (persist) send('store', d); }
        var api = {
          getItem: function (k) { k = String(k); return has.call(d, k) ? d[k] : null; },
          setItem: function (k, v) { d[String(k)] = String(v); sync(); },
          removeItem: function (k) { delete d[String(k)]; sync(); },
          clear: function () { Object.keys(d).forEach(function (k) { delete d[k]; }); sync(); },
          key: function (i) { return Object.keys(d)[i] || null; }
        };
        Object.defineProperty(api, 'length', { get: function () { return Object.keys(d).length; } });
        return api;
      }
      var blocked = false;
      try { void window.localStorage.length; } catch (e) { blocked = true; }
      if (!blocked) return;
      try { Object.defineProperty(window, 'localStorage', { value: mk(true), configurable: true }); } catch (e) { }
      try { Object.defineProperty(window, 'sessionStorage', { value: mk(false), configurable: true }); } catch (e) { }
    })();
    /* infinite-loop guard (inserted into for / while / do bodies) */
    var lp = {};
    window.__dsLP = function (id) {
      var now = Date.now(), s = lp[id];
      if (!s || now - s.last > 50) { s = lp[id] = { start: now, last: now }; }
      s.last = now;
      if (now - s.start > 1500) { delete lp[id]; throw new RangeError('반복문이 1.5초 넘게 끝나지 않아 멈췄습니다. 반복 조건이 언젠가 거짓이 되는지 확인하세요.'); }
    };

    /* mock server (Express-style) */
    var routes = [], latency = cfg.latency, offline = !!cfg.offline;
    window.addEventListener('message', function (e) {
      var m = e.data; if (!m || m.__dslab !== cfg.id || e.source !== P) return;
      if (m.type === 'offline') offline = !!m.on;
      if (m.type === 'latency') latency = +m.ms || 0;
    });
    function compile(p) {
      var keys = [], src = String(p).replace(/\/+$/, '') || '/';
      var re = src.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\/:([A-Za-z_]\w*)/g, function (_, k) { keys.push(k); return '/([^/]+)'; }).replace(/\*/g, '.*');
      return { re: new RegExp('^' + re + '/?$'), keys: keys };
    }
    var app = { routes: routes };
    ['get', 'post', 'put', 'patch', 'delete', 'all'].forEach(function (m) {
      app[m] = function (p) { var c = compile(p); routes.push({ method: m.toUpperCase(), re: c.re, keys: c.keys, hs: Array.prototype.slice.call(arguments, 1) }); return app; };
    });
    app.use = function (a) {
      var args = Array.prototype.slice.call(arguments);
      if (typeof a === 'function') routes.push({ mw: true, prefix: '', hs: args });
      else routes.push({ mw: true, prefix: String(a), hs: args.slice(1) });
      return app;
    };
    app.listen = function (port, cb) { console.info('[서버] 연습용 서버가 준비되었습니다' + (port ? ' (포트 ' + port + '는 실제로 열리지 않습니다)' : '')); if (typeof cb === 'function') cb(); return app; };
    function express() { return app; }
    express.json = function () { return function (q, s, n) { n(); }; };
    express.urlencoded = express.json;
    express.static = function () { return function (q, s, n) { n(); }; };
    express.Router = function () { return app; };
    function req(name) {
      if (name === 'express') return express;
      if (name === 'cors') return function () { return function (q, s, n) { n(); }; };
      throw new Error("연습용 서버에서는 '" + name + "' 모듈을 쓸 수 없습니다");
    }
    window.__dsApp = app; window.__dsExpress = express; window.__dsRequire = req;
    var STATUS = cfg.status || {};
    function handle(method, full, bodyText, headers) {
      var qi = full.indexOf('?'), path = qi < 0 ? full : full.slice(0, qi), search = qi < 0 ? '' : full.slice(qi + 1);
      var query = {}; if (search) new URLSearchParams(search).forEach(function (v, k) { query[k] = v; });
      var body = {};
      if (bodyText) { try { body = JSON.parse(bodyText); } catch (e) { body = bodyText; } }
      var rq = { method: method, path: path, url: full, originalUrl: full, query: query, params: {}, body: body, headers: headers, get: function (h) { return headers[String(h).toLowerCase()]; } };
      return new Promise(function (resolve) {
        var done = false;
        var rs = {
          statusCode: 200, headers: {}, body: '',
          status: function (c) { rs.statusCode = +c; return rs; },
          set: function (k, v) { rs.headers[String(k).toLowerCase()] = String(v); return rs; },
          json: function (o) { rs.headers['content-type'] = 'application/json; charset=utf-8'; return finish(o === undefined ? '' : JSON.stringify(o)); },
          send: function (x) {
            if (x !== null && typeof x === 'object') return rs.json(x);
            if (!rs.headers['content-type']) rs.headers['content-type'] = 'text/plain; charset=utf-8';
            return finish(x == null ? '' : String(x));
          },
          end: function (x) { return finish(x == null ? '' : String(x)); },
          sendStatus: function (c) { rs.statusCode = +c; return rs.send(STATUS[c] || String(c)); },
          type: function (t) { rs.headers['content-type'] = t.indexOf('/') > 0 ? t : t === 'json' ? 'application/json' : 'text/' + t; return rs; }
        };
        rs.setHeader = rs.set; rs.header = rs.set;
        function finish(b) {
          if (done) { console.warn('[서버] 응답을 두 번 보냈습니다. 두 번째 응답은 무시됩니다.'); return rs; }
          done = true; rs.body = b; resolve(rs); return rs;
        }
        var chain = [];
        routes.forEach(function (r) {
          if (r.mw) { if (path.indexOf(r.prefix) === 0) r.hs.forEach(function (h) { chain.push({ h: h }); }); return; }
          if (r.method !== method && r.method !== 'ALL') return;
          var m = r.re.exec(path); if (!m) return;
          var params = {}; r.keys.forEach(function (k, i) { params[k] = decodeURIComponent(m[i + 1]); });
          r.hs.forEach(function (h) { chain.push({ h: h, params: params }); });
        });
        var i = 0;
        function fail(err) {
          console.error('[서버] ' + (err && err.name ? err.name + ': ' + err.message : String(err)));
          if (!done) rs.status(500).json({ error: err && err.message ? err.message : String(err) });
        }
        function next(err) {
          if (done) return;
          if (err) return fail(err);
          var c = chain[i++];
          if (!c) { rs.status(404).json({ error: 'Not Found', message: method + ' ' + path + ' 에 맞는 경로가 없습니다' }); return; }
          if (c.params) rq.params = c.params;
          try { var r = c.h(rq, rs, next); if (r && typeof r.then === 'function') r.then(null, fail); } catch (e) { fail(e); }
        }
        next();
        setTimeout(function () { if (!done) { console.warn('[서버] 5초 동안 응답이 없어 504를 돌려줍니다. res.json()이나 res.send()를 호출했나요?'); rs.status(504).json({ error: 'Gateway Timeout' }); } }, 5000);
      });
    }
    function bodyStr(b) {
      if (b == null) return '';
      if (typeof b === 'string') return b;
      if (typeof URLSearchParams !== 'undefined' && b instanceof URLSearchParams) return b.toString();
      if (typeof FormData !== 'undefined' && b instanceof FormData) { var o = {}; b.forEach(function (v, k) { o[k] = typeof v === 'string' ? v : '[파일]'; }); return JSON.stringify(o); }
      try { return JSON.stringify(b); } catch (e) { return String(b); }
    }
    function hdrs(h) {
      var o = {}; if (!h) return o;
      if (typeof Headers !== 'undefined' && h instanceof Headers) h.forEach(function (v, k) { o[k.toLowerCase()] = v; });
      else if (Array.isArray(h)) h.forEach(function (p) { o[String(p[0]).toLowerCase()] = String(p[1]); });
      else Object.keys(h).forEach(function (k) { o[k.toLowerCase()] = String(h[k]); });
      return o;
    }
    function apiPath(url) {
      if (!cfg.server) return null;
      var m = /^(?:https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?)?(\/[^#]*)$/.exec(url);
      var p = m ? m[1] : /^api\//.test(url) ? '/' + url : null;
      return p && p.indexOf(cfg.prefix) === 0 ? p : null;
    }
    var realFetch = window.fetch ? window.fetch.bind(window) : null;
    window.fetch = function (input, init) {
      init = init || {};
      var url = typeof input === 'string' ? input : input && input.url ? input.url : String(input);
      var method = String(init.method || (input && input.method) || 'GET').toUpperCase();
      var path = apiPath(url), t0 = performance.now(), reqText = bodyStr(init.body);
      if (path == null) {
        if (!realFetch) return Promise.reject(new TypeError('Failed to fetch'));
        return realFetch(input, init).then(function (res) {
          var ms = Math.round(performance.now() - t0);
          res.clone().text().then(function (t) { send('net', { method: method, path: url, status: res.status, ms: ms, req: reqText, res: t.slice(0, 4000), ext: true }); }, function () { });
          return res;
        }, function (err) {
          send('net', { method: method, path: url, status: 0, ms: Math.round(performance.now() - t0), req: reqText, res: String(err && err.message || err), ext: true });
          throw err;
        });
      }
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (offline) {
            send('net', { method: method, path: path, status: 0, ms: Math.round(performance.now() - t0), req: reqText, res: '(오프라인 흉내: 응답 없음)' });
            reject(new TypeError('Failed to fetch')); return;
          }
          handle(method, path, reqText, hdrs(init.headers)).then(function (r) {
            send('net', { method: method, path: path, status: r.statusCode, ms: Math.round(performance.now() - t0), req: reqText, res: r.body });
            var nobody = r.statusCode === 204 || r.statusCode === 304 || method === 'HEAD';
            try { resolve(new Response(nobody ? null : r.body, { status: r.statusCode, statusText: STATUS[r.statusCode] || '', headers: r.headers })); }
            catch (e) { reject(e); }
          }, reject);
        }, latency);
      });
    };

    /* tests */
    window.__dsTest = function (register) {
      var list = [];
      function AssertionError(msg) { this.name = 'AssertionError'; this.message = msg; }
      AssertionError.prototype = Object.create(Error.prototype);
      function show(v) { return fmt(v, 1); }
      function deepEq(a, b) {
        if (Object.is(a, b)) return true;
        if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
        if (Array.isArray(a) !== Array.isArray(b)) return false;
        if (a instanceof Date && b instanceof Date) return +a === +b;
        var ka = Object.keys(a), kb = Object.keys(b);
        if (ka.length !== kb.length) return false;
        for (var i = 0; i < ka.length; i++) { if (!Object.prototype.hasOwnProperty.call(b, ka[i]) || !deepEq(a[ka[i]], b[ka[i]])) return false; }
        return true;
      }
      function expect(actual) {
        function make(neg) {
          function chk(pass, msg, nmsg) { if (neg ? pass : !pass) throw new AssertionError(neg ? nmsg : msg); }
          return {
            toBe: function (e) { chk(Object.is(actual, e), '기대한 값: ' + show(e) + ' · 실제 값: ' + show(actual), show(actual) + '이(가) 아니어야 합니다'); },
            toEqual: function (e) { chk(deepEq(actual, e), '기대한 값: ' + show(e) + ' · 실제 값: ' + show(actual), show(e) + '과(와) 달라야 합니다'); },
            toContain: function (x) {
              var ok = actual != null && (typeof actual === 'string' ? actual.indexOf(x) > -1 : typeof actual.length === 'number' ? Array.prototype.some.call(actual, function (y) { return deepEq(y, x); }) : false);
              chk(ok, show(actual) + '에 ' + show(x) + '이(가) 들어 있어야 합니다', show(actual) + '에 ' + show(x) + '이(가) 없어야 합니다');
            },
            toBeTruthy: function () { chk(!!actual, '참으로 평가되는 값이어야 합니다 · 실제 값: ' + show(actual), '거짓으로 평가되는 값이어야 합니다 · 실제 값: ' + show(actual)); },
            toBeFalsy: function () { chk(!actual, '거짓으로 평가되는 값이어야 합니다 · 실제 값: ' + show(actual), '참으로 평가되는 값이어야 합니다 · 실제 값: ' + show(actual)); },
            toBeDefined: function () { chk(actual !== undefined, '값이 정의되어 있어야 합니다', 'undefined여야 합니다'); },
            toBeUndefined: function () { chk(actual === undefined, 'undefined여야 합니다 · 실제 값: ' + show(actual), 'undefined가 아니어야 합니다'); },
            toBeNull: function () { chk(actual === null, 'null이어야 합니다 · 실제 값: ' + show(actual), 'null이 아니어야 합니다'); },
            toBeGreaterThan: function (n) { chk(actual > n, show(actual) + '은(는) ' + n + '보다 커야 합니다', show(actual) + '은(는) ' + n + '보다 크지 않아야 합니다'); },
            toBeGreaterThanOrEqual: function (n) { chk(actual >= n, show(actual) + '은(는) ' + n + ' 이상이어야 합니다', show(actual) + '은(는) ' + n + '보다 작아야 합니다'); },
            toBeLessThan: function (n) { chk(actual < n, show(actual) + '은(는) ' + n + '보다 작아야 합니다', show(actual) + '은(는) ' + n + '보다 작지 않아야 합니다'); },
            toHaveLength: function (n) { var l = actual != null ? actual.length : undefined; chk(l === n, '길이가 ' + n + '이어야 합니다 · 실제 길이: ' + l, '길이가 ' + n + '이 아니어야 합니다'); },
            toMatch: function (re) { var ok = typeof actual === 'string' && (re instanceof RegExp ? re.test(actual) : actual.indexOf(re) > -1); chk(ok, show(actual) + '이(가) ' + String(re) + '와(과) 맞아야 합니다', show(actual) + '이(가) ' + String(re) + '와(과) 맞지 않아야 합니다'); },
            toBeInstanceOf: function (C) { chk(actual instanceof C, (C && C.name) + '의 인스턴스여야 합니다', (C && C.name) + '의 인스턴스가 아니어야 합니다'); },
            toThrow: function (m) {
              var threw = false, err = null; try { actual(); } catch (e) { threw = true; err = e; }
              var ok = threw && (m == null || (err && String(err.message).indexOf(m) > -1));
              chk(ok, '오류가 나야 합니다' + (m ? ' (' + m + ')' : ''), '오류가 나지 않아야 합니다');
            }
          };
        }
        var api = make(false); api.not = make(true); return api;
      }
      function test(name, f) { list.push({ name: String(name), f: f }); }
      function describe(name, f) { f(); }
      function q(s) { return document.querySelector(s); }
      function qa(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
      function wait(ms) { return new Promise(function (r) { setTimeout(r, ms || 0); }); }
      function until(f, ms) {
        ms = ms || 3000; var t0 = Date.now();
        return new Promise(function (res, rej) {
          (function tick() {
            var v; try { v = f(); } catch (e) { }
            if (v) return res(v);
            if (Date.now() - t0 > ms) return rej(new AssertionError((ms / 1000) + '초 안에 조건이 만족되지 않았습니다'));
            setTimeout(tick, 30);
          })();
        });
      }
      function pick(x) { var e = typeof x === 'string' ? document.querySelector(x) : x; if (!e) throw new AssertionError('요소를 찾지 못했습니다: ' + x); return e; }
      function click(x) { pick(x).click(); return wait(0); }
      function type(x, text) {
        var e = pick(x); e.focus(); e.value = text;
        e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
        return wait(0);
      }
      try { register(test, test, expect, q, qa, wait, until, click, type, describe); }
      catch (e) { send('tests', { error: '테스트 코드를 읽는 중 오류 · ' + (e && e.message), results: [] }); return; }
      function run() {
        var results = [], k = 0;
        (function step() {
          if (k >= list.length) { send('tests', { results: results }); return; }
          var t = list[k++], timer;
          var p = new Promise(function (res) { res(t.f()); });
          var to = new Promise(function (_, rej) { timer = setTimeout(function () { rej(new AssertionError('3초 안에 끝나지 않았습니다')); }, 3000); });
          Promise.race([p, to]).then(function () { clearTimeout(timer); results.push({ name: t.name, ok: true }); step(); },
            function (e) { clearTimeout(timer); results.push({ name: t.name, ok: false, msg: e && e.message ? e.message : String(e) }); step(); });
        })();
      }
      function go() { setTimeout(run, 40); }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
    };
  }

  /* Insert __dsLP(n); at the start of for / while / do bodies (outside strings and comments) */
  function loopGuard(src) {
    var out = '', i = 0, n = src.length, id = 0;
    function skipStr(j, q) { j += 1; while (j < n && src[j] !== q) { if (src[j] === '\\') j += 1; j += 1; } return j + 1; }
    while (i < n) {
      var c = src[i];
      if (c === '/' && src[i + 1] === '/') { var e = src.indexOf('\n', i); e = e < 0 ? n : e; out += src.slice(i, e); i = e; continue; }
      if (c === '/' && src[i + 1] === '*') { var e2 = src.indexOf('*/', i + 2); e2 = e2 < 0 ? n : e2 + 2; out += src.slice(i, e2); i = e2; continue; }
      if (c === '"' || c === "'" || c === '`') { var e3 = skipStr(i, c); out += src.slice(i, e3); i = e3; continue; }
      if (/[A-Za-z_$]/.test(c) && !/[\w$.]/.test(src[i - 1] || '')) {
        var word = /^[\w$]+/.exec(src.slice(i, i + 40))[0];
        if (word === 'for' || word === 'while' || word === 'do') {
          out += word; i += word.length;
          if (word !== 'do') {
            var j = i; while (j < n && /\s/.test(src[j])) j += 1;
            if (src[j] !== '(') continue;
            var depth = 0, k = j;
            for (; k < n; k++) {
              var d = src[k];
              if (d === '"' || d === "'" || d === '`') { k = skipStr(k, d) - 1; continue; }
              if (d === '(') depth += 1; else if (d === ')') { depth -= 1; if (depth === 0) break; }
            }
            out += src.slice(i, k + 1); i = k + 1;
          }
          var m = i; while (m < n && /\s/.test(src[m])) m += 1;
          if (src[m] === '{') { id += 1; out += src.slice(i, m + 1) + '__dsLP(' + id + ');'; i = m + 1; }
          continue;
        }
        out += word; i += word.length; continue;
      }
      out += c; i += 1;
    }
    return out;
  }

  var labs = {};
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || !d.__dslab) return;
    var lab = labs[d.__dslab];
    if (!lab || !lab.frame || e.source !== lab.frame.contentWindow) return;
    lab.onMsg(d);
  });

  function Lab(root) {
    this.root = root;
    this.id = uid('lab');
    labs[this.id] = this;
    var self = this;
    this.orig = {};
    $$(':scope > script[data-lab]', root).forEach(function (s) {
      self.orig[s.getAttribute('data-lab')] = dedent(s.textContent.replace(/<\\\/(script|style)/gi, '</$1'));
    });
    this.kinds = LAB_ORDER.filter(function (k) { return k in self.orig; });
    var hide = (root.getAttribute('data-hide') || '').split(/[\s,|]+/);
    this.tabs = this.kinds.filter(function (k) { return hide.indexOf(k) < 0; });
    if (!this.tabs.length) this.tabs = this.kinds.slice(0, 1);
    var a = root.getAttribute('data-active');
    this.active = a && this.tabs.indexOf(a) > -1 ? a : this.tabs[0];
    this.libs = (root.getAttribute('data-libs') || '').split(/[\s,|]+/).filter(Boolean);
    this.babel = this.libs.indexOf('react') > -1 || root.hasAttribute('data-jsx');
    var lat = root.getAttribute('data-latency');
    this.latency = lat !== null && lat !== '' && !isNaN(+lat) ? +lat : 300;
    this.offline = false;
    this.hasServer = 'server' in this.orig;
    this.hasTests = 'test' in this.orig;
    this.showNet = this.hasServer || root.hasAttribute('data-network');
    this.ran = false;
    this.build();
  }
  Lab.prototype.build = function () {
    var r = this.root, self = this;
    var h = r.getAttribute('data-height');
    if (h) r.style.setProperty('--lab-h', (/^\d+$/.test(h) ? h + 'px' : h));
    if (r.hasAttribute('data-stacked')) r.classList.add('stacked');
    var title = r.getAttribute('data-title') || '코드 실습';
    var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    var head = el('div', { class: 'lab-head' },
      '<p class="lab-title"><span class="kicker">' + esc(r.getAttribute('data-kicker') || '실습') + '</span>' + esc(title) + '</p>' +
      '<span class="lab-hint">' + (mac ? '⌘' : 'Ctrl') + '+Enter 실행</span>');
    this.resetBtn = el('button', { type: 'button', class: 'btn small quiet lab-reset', title: '처음 코드로 되돌립니다 (연습용 저장소도 비웁니다)' }, ICON.reset + '<span>처음 코드로</span>');
    this.runBtn = el('button', { type: 'button', class: 'btn small primary lab-run' }, ICON.play + '<span>실행</span>');
    head.appendChild(this.resetBtn); head.appendChild(this.runBtn);

    var main = el('div', { class: 'lab-main' });
    var edit = el('div', { class: 'lab-edit' });
    var tabs = el('div', { class: 'lab-tabs', role: 'tablist', 'aria-label': '코드 파일' });
    var editor = el('div', { class: 'lab-editor' });
    this.gutter = el('pre', { class: 'lab-gutter', 'aria-hidden': 'true' });
    editor.appendChild(this.gutter);
    this.areas = {}; this.tabBtns = {};
    this.kinds.forEach(function (k) {
      var ta = el('textarea', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', wrap: 'off', 'aria-label': LAB_NAME[k] + ' 코드 편집기', id: self.id + '-' + k });
      ta.value = self.orig[k];
      ta.hidden = k !== self.active;
      self.bindEditor(ta, k);
      editor.appendChild(ta);
      self.areas[k] = ta;
      if (self.tabs.indexOf(k) > -1) {
        var b = el('button', { type: 'button', role: 'tab', class: 'lab-tab', 'aria-controls': ta.id, 'aria-selected': String(k === self.active) }, LAB_NAME[k]);
        b.addEventListener('click', function () { self.select(k); });
        b.addEventListener('keydown', function (e) {
          var i = self.tabs.indexOf(k), j = null;
          if (e.key === 'ArrowRight') j = (i + 1) % self.tabs.length; else if (e.key === 'ArrowLeft') j = (i - 1 + self.tabs.length) % self.tabs.length;
          if (j !== null) { e.preventDefault(); self.select(self.tabs[j]); self.tabBtns[self.tabs[j]].focus(); }
        });
        tabs.appendChild(b); self.tabBtns[k] = b;
      }
    });
    edit.appendChild(tabs); edit.appendChild(editor);
    var view = el('div', { class: 'lab-view' });
    this.status = el('span', { class: 'status', 'aria-live': 'polite' });
    var vh = el('div', { class: 'lab-view-head' }, '<span>결과</span>'); vh.appendChild(this.status);
    this.libmsg = el('div', { class: 'lab-libmsg', role: 'status' }); this.libmsg.hidden = true;
    this.frameBox = el('div', { class: 'lab-frame' }, '<div class="lab-idle">실행하면 결과가 여기에 나타납니다</div>');
    view.appendChild(vh); view.appendChild(this.libmsg); view.appendChild(this.frameBox);
    main.appendChild(edit); main.appendChild(view);

    var out = el('div', { class: 'lab-out' });
    var otabs = el('div', { class: 'lab-out-tabs', role: 'tablist', 'aria-label': '실행 정보' });
    this.panels = {}; this.outBtns = {};
    var panes = [['console', '콘솔']];
    if (this.hasTests) panes.push(['tests', '테스트']);
    if (this.showNet) panes.push(['net', '네트워크']);
    panes.forEach(function (p) {
      var pid = self.id + '-out-' + p[0];
      var b = el('button', { type: 'button', role: 'tab', class: 'lab-out-tab', 'aria-controls': pid, 'aria-selected': 'false' }, p[1] + ' <span class="count">0</span>');
      b.addEventListener('click', function () { self.outSelect(p[0]); });
      otabs.appendChild(b); self.outBtns[p[0]] = b;
      var panel = el('div', { class: 'lab-panel', role: 'tabpanel', id: pid, tabindex: '0' });
      panel.hidden = true;
      if (p[0] === 'console') panel.setAttribute('role', 'log');
      self.panels[p[0]] = panel;
    });
    if (this.showNet) {
      var tools = el('div', { class: 'lab-out-tools' },
        '<label>지연 <select aria-label="응답 지연 시간"><option value="0">0ms</option><option value="300">300ms</option><option value="1000">1초</option><option value="3000">3초</option></select></label>' +
        '<label><input type="checkbox"> 오프라인</label>');
      var sel = $('select', tools), chk = $('input', tools);
      if (!$('option[value="' + this.latency + '"]', sel)) sel.insertAdjacentHTML('beforeend', '<option value="' + this.latency + '">' + this.latency + 'ms</option>');
      sel.value = String(this.latency);
      sel.addEventListener('change', function () { self.latency = +sel.value; self.post({ type: 'latency', ms: self.latency }); });
      chk.addEventListener('change', function () { self.offline = chk.checked; self.post({ type: 'offline', on: self.offline }); });
      otabs.appendChild(tools);
    }
    out.appendChild(otabs);
    Object.keys(this.panels).forEach(function (k) { out.appendChild(self.panels[k]); });

    r.appendChild(head); r.appendChild(main); r.appendChild(out);
    this.outSelect(this.hasTests ? 'tests' : 'console');
    this.clearOut();
    this.runBtn.addEventListener('click', function () { self.run(); });
    this.resetBtn.addEventListener('click', function () { self.reset(); });
    this.select(this.active);
    r.classList.add('is-ready');

    if (r.getAttribute('data-autorun') !== 'false') {
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (ents) {
          if (ents.some(function (e) { return e.isIntersecting; })) { io.disconnect(); if (!self.ran) self.run(); }
        }, { rootMargin: '300px 0px' });
        io.observe(r);
      } else this.run();
    }
  };
  Lab.prototype.bindEditor = function (ta, kind) {
    var self = this, escaped = false, live = this.root.hasAttribute('data-live'), lt = 0;
    ta.addEventListener('keydown', function (e) {
      if (e.isComposing || e.keyCode === 229) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); self.run(); return; }
      if (e.key === 'Escape') { escaped = true; return; }
      if (e.key === 'Tab' && !escaped && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); indent(ta, e.shiftKey); return; }
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var v = ta.value, s = ta.selectionStart, ls = v.lastIndexOf('\n', s - 1) + 1;
        var ind = /^[ \t]*/.exec(v.slice(ls, s))[0];
        if (/[{[(]$/.test(v.slice(ls, s).trimEnd())) ind += '  ';
        if (ind) { e.preventDefault(); insertText(ta, '\n' + ind); }
      }
      escaped = false;
    });
    ta.addEventListener('input', function () {
      self.paintGutter(); self.markDirty(kind);
      if (live) { clearTimeout(lt); lt = setTimeout(function () { self.run(); }, 700); }
    });
    ta.addEventListener('scroll', function () { if (!ta.hidden) self.gutter.scrollTop = ta.scrollTop; });
    if ('ResizeObserver' in window) new ResizeObserver(function () { if (!ta.hidden && ta.offsetHeight) self.gutter.style.height = ta.offsetHeight + 'px'; }).observe(ta);
  };
  function insertText(ta, text) {
    ta.focus();
    var ok = false;
    try { ok = D.execCommand('insertText', false, text); } catch (e) { ok = false; }
    if (!ok) { ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
  }
  function indent(ta, out) {
    var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
    if (s === e && !out) { insertText(ta, '  '); return; }
    var ls = v.lastIndexOf('\n', s - 1) + 1, le = v.indexOf('\n', e - (e > s && v[e - 1] === '\n' ? 1 : 0)); if (le < 0) le = v.length;
    var block = v.slice(ls, le);
    var nb = out ? block.replace(/^( {1,2}|\t)/gm, '') : block.replace(/^/gm, '  ');
    ta.setSelectionRange(ls, le);
    insertText(ta, nb);
    ta.setSelectionRange(ls, ls + nb.length);
  }
  Lab.prototype.paintGutter = function () {
    var ta = this.areas[this.active]; if (!ta) return;
    var n = ta.value.split('\n').length, s = '';
    for (var i = 1; i <= n; i++) s += i + '\n';
    this.gutter.textContent = s;
    this.gutter.style.height = ta.offsetHeight ? ta.offsetHeight + 'px' : '';
    this.gutter.scrollTop = ta.scrollTop;
  };
  Lab.prototype.select = function (k) {
    var self = this;
    this.active = k;
    Object.keys(this.areas).forEach(function (x) { self.areas[x].hidden = x !== k; });
    Object.keys(this.tabBtns).forEach(function (x) { self.tabBtns[x].setAttribute('aria-selected', String(x === k)); self.tabBtns[x].tabIndex = x === k ? 0 : -1; });
    this.paintGutter();
  };
  Lab.prototype.markDirty = function (k) {
    var b = this.tabBtns[k];
    var changed = this.areas[k].value !== this.orig[k];
    if (b) { var dot = $('.dot', b); if (changed && !dot) b.insertAdjacentHTML('beforeend', '<span class="dot" title="수정됨"></span>'); if (!changed && dot) dot.remove(); }
    if (this.ran) this.status.textContent = '코드가 바뀌었습니다 · 실행해서 확인하세요';
  };
  Lab.prototype.reset = function () {
    var self = this;
    this.kinds.forEach(function (k) { self.areas[k].value = self.orig[k]; self.markDirty(k); });
    this.store = {};
    this.paintGutter();
    this.run();
  };
  Lab.prototype.outSelect = function (k) {
    var self = this;
    Object.keys(this.panels).forEach(function (x) { self.panels[x].hidden = x !== k; self.outBtns[x].setAttribute('aria-selected', String(x === k)); });
  };
  Lab.prototype.post = function (msg) {
    if (!this.frame || !this.frame.contentWindow) return;
    msg.__dslab = this.id;
    try { this.frame.contentWindow.postMessage(msg, '*'); } catch (e) { }
  };
  Lab.prototype.clearOut = function () {
    this.logs = 0; this.errs = 0; this.nets = 0;
    this.panels.console.innerHTML = '<div class="lab-empty">console.log로 출력한 값과 오류가 여기에 표시됩니다.</div>';
    this.setCount('console', 0);
    if (this.panels.tests) { this.panels.tests.innerHTML = '<div class="lab-empty">실행하면 자동 테스트 결과가 여기에 표시됩니다.</div>'; this.setCount('tests', '–'); }
    if (this.panels.net) { this.panels.net.innerHTML = '<div class="lab-empty">fetch로 보낸 요청이 여기에 표시됩니다. 줄을 누르면 요청과 응답 본문을 볼 수 있습니다.</div>'; this.setCount('net', 0); }
    this.libmsg.hidden = true; this.libFail = [];
  };
  Lab.prototype.setCount = function (k, v, cls) {
    var c = $('.count', this.outBtns[k]); if (!c) return;
    c.textContent = v; c.className = 'count' + (cls ? ' ' + cls : '');
  };
  Lab.prototype.buildDoc = function () {
    var c = {}, self = this;
    this.kinds.forEach(function (k) { c[k] = self.areas[k].value; });
    var text = '', line = 1, map = [];
    function add(s) { text += s; line += (s.match(/\n/g) || []).length; }
    function addCode(kind, s) { map.push({ kind: kind, start: line, end: line + (s.match(/\n/g) || []).length }); add(s); }
    var cfg = { id: this.id, latency: this.latency, offline: this.offline, server: this.hasServer, prefix: this.root.getAttribute('data-api') || '/api', status: STATUS, store: this.store || {} };
    var html = c.html || '';
    var full = /<html[\s>]|<!doctype/i.test(html);
    var headOpen = full ? /<head[^>]*>/i.exec(html) : null;
    var pre = '';
    if (full) {
      var cut = headOpen ? headOpen.index + headOpen[0].length : (/<html[^>]*>/i.exec(html) || { index: 0, 0: '' });
      if (!headOpen) cut = cut.index + cut[0].length;
      pre = html.slice(0, cut); html = html.slice(cut);
      add(pre + '\n');
    } else {
      add('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n');
    }
    add('<script>(' + labRuntime.toString() + ')(' + JSON.stringify(cfg).replace(/</g, '\\u003c') + ');<\/script>\n');
    var libs = this.libs.slice();
    if (this.babel && libs.indexOf('react') < 0 && libs.indexOf('babel') < 0) libs.push('babel');
    libs.forEach(function (name) {
      var list = LIBS[name] || (/^https:\/\//.test(name) ? [[name.split('/').pop(), name]] : []);
      list.forEach(function (L) { add('<script src="' + esc(L[1]) + '" data-ds-lib="' + esc(L[0]) + '" onerror="__dsLib(this.getAttribute(\'data-ds-lib\'), this.src)"><\/script>\n'); });
    });
    if (this.hasServer) {
      add('<script>\n(function(app, express, require, process, module){(function(){\n');
      addCode('server', loopGuard(c.server).replace(/<\/script/gi, '<\\/script'));
      add('\n})();})(window.__dsApp, window.__dsExpress, window.__dsRequire, {env:{}}, {exports:{}});\n<\/script>\n');
    }
    if (c.css != null) { add('<style>\n'); addCode('css', c.css.replace(/<\/style/gi, '<\\/style')); add('\n</style>\n'); }
    var bodyClose = '';
    if (full) {
      var bc = /<\/body\s*>/i.exec(html);
      if (bc) { bodyClose = html.slice(bc.index); html = html.slice(0, bc.index); }
      addCode('html', html); add('\n');
    } else {
      add('</head>\n<body>\n');
      addCode('html', html); add('\n');
    }
    var typ = this.babel ? ' type="text/babel" data-presets="react"' : '';
    if (c.js != null) {
      add('<script' + typ + '>\n');
      addCode('js', (this.babel ? c.js : loopGuard(c.js)).replace(/<\/script/gi, '<\\/script'));
      add('\n<\/script>\n');
    }
    if (this.hasTests) {
      add('<script' + typ + '>\nwindow.__dsTest(function(test, it, expect, $, $$, wait, until, click, type, describe){\n');
      addCode('test', c.test.replace(/<\/script/gi, '<\\/script'));
      add('\n});\n<\/script>\n');
    }
    add(full ? (bodyClose || '</body>\n</html>') : '</body>\n</html>');
    this.map = map;
    return text;
  };
  Lab.prototype.where = function (ln) {
    if (!ln || !this.map || this.babel) return '';
    for (var i = 0; i < this.map.length; i++) { var m = this.map[i]; if (ln >= m.start && ln <= m.end) return LAB_NAME[m.kind] + ' ' + (ln - m.start + 1) + '번째 줄'; }
    return '';
  };
  Lab.prototype.run = function () {
    var self = this;
    this.ran = true;
    this.clearOut();
    var doc = this.buildDoc();
    var fr = el('iframe', { sandbox: 'allow-scripts allow-modals allow-forms', title: (this.root.getAttribute('data-title') || '코드 실습') + ' 실행 결과', loading: 'eager' });
    fr.srcdoc = doc;
    this.frameBox.innerHTML = '';
    this.frameBox.appendChild(fr);
    this.frame = fr;
    var t = new Date();
    this.status.textContent = pad2(t.getHours()) + ':' + pad2(t.getMinutes()) + ':' + pad2(t.getSeconds()) + ' 실행';
    clearTimeout(this.testTimer);
    if (this.hasTests) {
      this.gotTests = false;
      this.testTimer = setTimeout(function () {
        if (self.gotTests) return;
        var why = self.libFail.length ? '라이브러리를 불러오지 못해 테스트를 실행하지 못했습니다.' : '테스트 결과를 받지 못했습니다. 콘솔의 오류를 먼저 확인하세요.';
        self.panels.tests.innerHTML = '<div class="lab-sum some">' + esc(why) + '</div>';
        self.setCount('tests', '!', 'err');
      }, this.libs.length ? 15000 : 6000);
    }
  };
  Lab.prototype.log = function (level, text, where) {
    var p = this.panels.console;
    if (!this.logs) p.innerHTML = '';
    this.logs += 1;
    if (this.logs > 500) { if (this.logs === 501) p.appendChild(el('div', { class: 'lab-log sys' }, '출력이 500줄을 넘어 이후 내용은 생략합니다.')); return; }
    var lv = { log: '›', info: '정보', warn: '경고', error: '오류', sys: '' }[level] || '›';
    var row = el('div', { class: 'lab-log ' + level }, '<span class="lv">' + lv + '</span><span class="tx"></span>' + (where ? '<span class="where">' + esc(where) + '</span>' : ''));
    $('.tx', row).textContent = text;
    p.appendChild(row);
    if (level === 'error') this.errs += 1;
    this.setCount('console', this.logs, this.errs ? 'err' : '');
    p.scrollTop = p.scrollHeight;
  };
  Lab.prototype.onMsg = function (m) {
    var d = m.data || {}, self = this;
    if (m.type === 'log') {
      this.log(d.level, d.text, this.where(d.line));
      if (d.level === 'error' && !this.hasTests) this.outSelect('console');
    } else if (m.type === 'store') {
      this.store = d && typeof d === 'object' ? d : {};
    } else if (m.type === 'clear') {
      this.logs = 0; this.errs = 0; this.panels.console.innerHTML = '<div class="lab-empty">콘솔을 지웠습니다.</div>'; this.setCount('console', 0);
    } else if (m.type === 'lib') {
      this.libFail.push(d.name);
      this.libmsg.hidden = false;
      this.libmsg.textContent = this.libFail.join(', ') + ' 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 실행하세요. 이 실습은 인터넷에 연결되어 있어야 실행됩니다.';
      this.log('warn', d.name + ' 불러오기 실패 · ' + d.src);
    } else if (m.type === 'tests') {
      this.gotTests = true; clearTimeout(this.testTimer);
      var res = d.results || [], pass = res.filter(function (r) { return r.ok; }).length;
      var html = '';
      if (d.error) html += '<div class="lab-sum some">' + esc(d.error) + '</div>';
      else html += '<div class="lab-sum ' + (pass === res.length ? 'all' : 'some') + '"><b>' + pass + ' / ' + res.length + '</b> 통과' + (pass === res.length && res.length ? ' · 모든 테스트를 통과했습니다' : '') + '</div>';
      html += '<ul class="lab-tests">' + res.map(function (r) {
        return '<li class="lab-test ' + (r.ok ? 'pass' : 'fail') + '">' + (r.ok ? ICON.check : ICON.cross) + '<span><span class="sr-only">' + (r.ok ? '통과: ' : '실패: ') + '</span>' + esc(r.name) + '</span>' + (r.ok ? '' : '<span class="msg">' + esc(r.msg || '') + '</span>') + '</li>';
      }).join('') + '</ul>';
      this.panels.tests.innerHTML = html;
      this.setCount('tests', pass + '/' + res.length, pass === res.length && res.length ? 'ok' : 'err');
    } else if (m.type === 'net') {
      var p = this.panels.net; if (!p) return;
      if (!this.nets) p.innerHTML = '';
      this.nets += 1; this.setCount('net', this.nets);
      var st = d.status, sc = st >= 200 && st < 300 ? 'ok' : st >= 400 || st === 0 ? 'err' : 'warn';
      var row = el('details', { class: 'lab-net' });
      row.innerHTML = '<summary><span class="m"></span><span class="p"></span><span class="s ' + sc + '"></span><span class="t"></span></summary><div class="lab-net-body"><div><b>요청 본문</b><pre></pre></div><div><b>응답 본문</b><pre></pre></div></div>';
      $('.m', row).textContent = d.method; $('.p', row).textContent = d.path; $('.s', row).textContent = st || '실패'; $('.t', row).textContent = d.ms + 'ms';
      var pres = $$('pre', row);
      pres[0].textContent = pretty(d.req) || '(없음)';
      pres[1].textContent = pretty(d.res) || '(없음)';
      p.appendChild(row);
    }
  };
  function pretty(s) {
    if (!s) return '';
    try { return JSON.stringify(JSON.parse(s), null, 2); } catch (e) { return String(s); }
  }

  /* ------------------------------------------------------------------------
     Simulations: shared helpers
     ------------------------------------------------------------------------ */
  function md(text) {
    // minimal markdown: ``` fences, `code`, **bold**, - / 1. lists, paragraphs
    var out = '', lines = String(text || '').replace(/\r/g, '').split('\n'), i = 0;
    function inline(s) {
      return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    }
    while (i < lines.length) {
      var l = lines[i];
      var f = /^```(\w*)\s*(.*)$/.exec(l);
      if (f) {
        var buf = []; i += 1;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i += 1; }
        i += 1;
        var lang = f[1], file = f[2];
        out += '<div class="codeblock"><div class="codeblock-head">' + (file ? '<span class="file">' + esc(file) + '</span>' : '') + (lang ? '<span class="lang">' + esc(LANG_LABEL[lang] || lang) + '</span>' : '') + '</div><pre class="code"><code>' + highlight(buf.join('\n'), lang) + '</code></pre></div>';
        continue;
      }
      if (/^\s*[-*]\s+/.test(l)) {
        out += '<ul>'; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { out += '<li>' + inline(lines[i].replace(/^\s*[-*]\s+/, '')) + '</li>'; i += 1; } out += '</ul>'; continue;
      }
      if (/^\s*\d+[.)]\s+/.test(l)) {
        out += '<ol>'; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { out += '<li>' + inline(lines[i].replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; i += 1; } out += '</ol>'; continue;
      }
      if (!l.trim()) { i += 1; continue; }
      var para = [];
      while (i < lines.length && lines[i].trim() && !/^```|^\s*[-*]\s+|^\s*\d+[.)]\s+/.test(lines[i])) { para.push(inline(lines[i])); i += 1; }
      out += '<p>' + para.join('<br>') + '</p>';
    }
    return out;
  }
  function inlineMd(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); }
  /* reveal already-rendered HTML progressively, text node by text node */
  function stream(container, html, done, speed, onTick) {
    container.innerHTML = html;
    if (reduced() || speed === 0) { if (onTick) onTick(); done(); return function () { }; }
    var walker = D.createTreeWalker(container, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walker.nextNode())) { nodes.push({ node: n, text: n.nodeValue }); n.nodeValue = ''; }
    var caret = el('span', { class: 'caret', 'aria-hidden': 'true' });
    var k = 0, pos = 0, step = speed || 3, timer = 0, stopped = false;
    function tick() {
      var budget = step;
      while (budget > 0 && k < nodes.length) {
        var cur = nodes[k], take = Math.min(budget, cur.text.length - pos);
        pos += take; budget -= take; cur.node.nodeValue = cur.text.slice(0, pos);
        if (pos >= cur.text.length) { k += 1; pos = 0; }
      }
      if (k < nodes.length) { var tn = nodes[k].node; if (tn.parentNode) tn.parentNode.insertBefore(caret, tn.nextSibling); }
      if (onTick) onTick();
      if (k >= nodes.length) { caret.remove(); done(); return; }
      timer = setTimeout(tick, 16);
    }
    tick();
    return function finish() {
      if (stopped) return; stopped = true; clearTimeout(timer);
      nodes.forEach(function (x) { x.node.nodeValue = x.text; }); caret.remove(); if (onTick) onTick(); done();
    };
  }
  function simJSON(root) {
    var s = $(':scope > script[data-sim]', root);
    if (!s) return null;
    try { return JSON.parse(s.textContent); } catch (e) {
      root.insertAdjacentHTML('beforeend', '<p class="callout warn">연습 화면 설정(JSON)을 읽지 못했습니다: ' + esc(e.message) + '</p>');
      return null;
    }
  }
  function simStrip(sim, total) {
    var strip = el('div', { class: 'sim-strip' }, '<span class="sim-flag">연습용 화면 · 실제 서비스가 아닙니다</span><span class="sim-count num"></span><span class="sim-ctrl"></span>');
    var restart = el('button', { type: 'button', class: 'btn small quiet' }, ICON.reset + '<span>처음부터</span>');
    var skip = el('button', { type: 'button', class: 'btn small quiet', title: '지금 단계를 건너뜁니다 (발표용)' }, '<span>다음 단계</span>');
    $('.sim-ctrl', strip).appendChild(restart); $('.sim-ctrl', strip).appendChild(skip);
    restart.addEventListener('click', function () { sim.engaged = true; sim.restart(); });
    skip.addEventListener('click', function () { sim.engaged = true; sim.skip(); });
    sim.countEl = $('.sim-count', strip);
    return strip;
  }
  function coachBox(sim) {
    var c = el('div', { class: 'sim-coach', role: 'status', 'aria-live': 'polite' }, '<p class="say"></p><div class="acts"></div>');
    sim.coachEl = c; return c;
  }
  function setCoach(sim, text, opts) {
    opts = opts || {};
    var c = sim.coachEl, total = sim.steps.length;
    c.classList.toggle('is-done', !!opts.done);
    var n = Math.min(sim.i + 1, total);
    $('.say', c).innerHTML = (opts.done ? '' : '<b>' + n + ' / ' + total + '</b>') + inlineMd(text || '');
    var old = $('.suggest', c); if (old) old.remove();
    if (opts.suggest) { var sg = el('p', { class: 'suggest' }); sg.textContent = opts.suggest; c.insertBefore(sg, $('.acts', c)); }
    var acts = $('.acts', c); acts.innerHTML = '';
    (opts.acts || []).forEach(function (a) {
      var b = el('button', { type: 'button', class: 'btn small' + (a.primary ? ' primary' : '') }, esc(a.label));
      b.addEventListener('click', function () { sim.engaged = true; a.fn(); });
      acts.appendChild(b);
      if (a.primary && sim.engaged && opts.focus !== false) setTimeout(function () { if (b.isConnected) b.focus({ preventScroll: true }); }, 0);
    });
    if (sim.countEl) sim.countEl.textContent = opts.done ? '완료' : '단계 ' + n + ' / ' + total;
  }
  function transcript(steps, who) {
    var d = el('details', { class: 'sim-transcript' }, '<summary>전체 과정을 글로 보기</summary>');
    var ol = el('ol');
    steps.forEach(function (s) {
      var role = s.role || s.type || '';
      var label = who[role] || role;
      var text = s.text || s.cmd || s.question || (s.lines ? [].concat(s.lines).join('\n') : '') || s.diff || (s.name ? s.name + '(' + (s.arg || '') + ')' + (s.result ? ' → ' + s.result : '') : '');
      if (role === 'permission' && s.options) text = (s.question || '') + '\n' + s.options.map(function (o, i) { return (i + 1) + '. ' + (o.label || o); }).join('\n');
      if (s.expectInput && !s.text) text = s.expectInput;
      var li = el('li', null, '<b>' + esc(label) + '</b>'); li.appendChild(D.createTextNode(text));
      ol.appendChild(li);
    });
    d.appendChild(ol);
    return d;
  }

  /* ------------------------------------------------------------------------
     sim-chat: scripted AI chat app (data-variant="chatgpt" | "claude")
     ------------------------------------------------------------------------ */
  var CHAT_UI = {
    chatgpt: { newChat: '새 채팅', search: '채팅 검색', projects: '프로젝트', history: '채팅', placeholder: '무엇이든 물어보세요', attach: '파일 추가', send: '보내기', panel: '캔버스', empty: '무엇을 도와드릴까요?', note: 'AI는 실수를 할 수 있습니다. 중요한 정보는 확인하세요.', me: '학생' },
    claude: { newChat: '새 채팅', search: '검색', projects: '프로젝트', history: '최근 항목', placeholder: '오늘 어떤 도움을 드릴까요?', attach: '파일 첨부', send: '보내기', panel: '아티팩트', empty: '무엇을 함께 만들어 볼까요?', note: 'AI의 답변은 틀릴 수 있습니다. 직접 확인하세요.', me: '학생' }
  };
  function SimChat(root) {
    this.root = root;
    var cfg = simJSON(root); if (!cfg) return;
    this.cfg = cfg;
    this.variant = root.getAttribute('data-variant') || cfg.variant || 'chatgpt';
    if (!CHAT_UI[this.variant]) this.variant = 'chatgpt';
    this.ui = Object.assign({}, CHAT_UI[this.variant], cfg.ui || {});
    this.steps = cfg.steps || [];
    this.engaged = false;
    this.build();
    this.restart(true);
    root.classList.add('is-ready');
  }
  SimChat.prototype.build = function () {
    var u = this.ui, cfg = this.cfg, self = this, r = this.root;
    var h = r.getAttribute('data-height'); if (h) r.style.setProperty('--sim-h', /^\d+$/.test(h) ? h + 'px' : h);
    var projects = cfg.projects || [], history = cfg.history || cfg.conversations || [];
    var side = '<button type="button" class="side-item" data-t="new-chat">' + ICON.edit + '<span>' + esc(u.newChat) + '</span></button>' +
      '<button type="button" class="side-item" data-t="search">' + ICON.search + '<span>' + esc(u.search) + '</span></button>';
    if (this.variant === 'claude') side += '<button type="button" class="side-item" data-t="artifacts">' + ICON.box + '<span>' + esc(u.panel) + '</span></button>';
    side += '<div class="side-sec">' + esc(u.projects) + '</div>';
    side += (projects.length ? projects : ['새 프로젝트']).map(function (p, i) { return '<button type="button" class="side-item" data-t="' + (i === 0 ? 'projects' : 'project-' + i) + '">' + ICON.folder + '<span class="side-hist">' + esc(p) + '</span></button>'; }).join('');
    side += '<div class="side-sec">' + esc(u.history) + '</div>';
    side += history.map(function (c, i) { return '<button type="button" class="side-item" data-t="history-' + i + '"><span class="side-hist">' + esc(c) + '</span></button>'; }).join('');
    side += '<div class="side-foot"><span class="avatar" aria-hidden="true">나</span><span>' + esc(u.me) + '</span></div>';
    var app = el('div', { class: 'chat-app', 'data-variant': this.variant });
    app.innerHTML =
      '<aside class="chat-side" aria-label="사이드바" data-t="sidebar">' + side + '</aside>' +
      '<section class="chat-main" aria-label="대화">' +
      '<div class="chat-top"><button type="button" class="icon-btn chat-menu" data-t="menu" aria-label="사이드바 열기">' + ICON.menu + '</button>' +
      '<button type="button" class="chat-model" data-t="model"><span>' + esc(cfg.model || '기본 모델') + '</span>' + ICON.down + '</button><span class="chat-title"></span></div>' +
      '<div class="chat-thread" role="log" aria-live="polite" tabindex="0" aria-label="대화 내용"></div>' +
      '<div class="chat-compose"><div class="composer" data-t="composer"><div class="atts"></div>' +
      '<button type="button" class="c-btn c-attach" data-t="attach" aria-label="' + esc(u.attach) + '" title="' + esc(u.attach) + '">' + ICON.plus + '</button>' +
      '<button type="button" class="c-btn c-tools" data-t="tools" aria-label="도구" title="도구">' + ICON.tools + '</button>' +
      '<textarea rows="1" placeholder="' + esc(u.placeholder) + '" aria-label="메시지 입력"></textarea>' +
      '<span class="c-model">' + esc(cfg.model || '기본 모델') + '</span>' +
      '<button type="button" class="c-btn c-send" data-t="send" aria-label="' + esc(u.send) + '" title="' + esc(u.send) + '">' + ICON.up + '</button></div>' +
      '<p class="chat-note">' + esc(u.note) + '</p></div>' +
      '</section>' +
      '<aside class="chat-panel" data-t="panel" aria-label="' + esc(u.panel) + '"><div class="chat-panel-head"><span class="kind">' + esc(u.panel) + '</span><b></b><button type="button" class="icon-btn" data-t="panel-close" aria-label="닫기">' + ICON.close + '</button></div><div class="chat-panel-body"></div></aside>';
    this.app = app;
    this.thread = $('.chat-thread', app); this.ta = $('textarea', app); this.atts = $('.composer .atts', app);
    this.titleEl = $('.chat-title', app);
    r.appendChild(simStrip(this));
    r.appendChild(app);
    r.appendChild(coachBox(this));
    var labels = cfg.labels || [];
    if (!Array.isArray(labels)) labels = Object.keys(labels).map(function (k) { return { target: k, text: labels[k] }; });
    if (labels.length) {
      var lg = el('ol', { class: 'sim-legend', 'aria-label': '화면 구성' });
      labels.forEach(function (L, i) {
        var t = self.t(L.target);
        if (t) t.appendChild(el('span', { class: 'sim-badge', 'aria-hidden': 'true' }, String(i + 1)));
        lg.appendChild(el('li', null, '<i>' + (i + 1) + '</i><span>' + inlineMd(L.text) + '</span>'));
      });
      r.appendChild(lg);
    }
    r.appendChild(transcript(this.steps, { user: '나', assistant: 'AI', tool: '도구', 'system-note': '안내', note: '안내' }));

    app.addEventListener('click', function (e) {
      var t = e.target.closest('[data-t]'); if (!t) return;
      var name = t.getAttribute('data-t');
      self.engaged = true;
      if (name === 'menu') { app.classList.toggle('side-open'); return; }
      if (name === 'panel-close') { self.closePanel(); return; }
      if (name === 'send') { self.trySend(); return; }
      if (self.waiting && self.waiting.target === name) {
        var cb = self.waiting.cb; self.clearFocus(); self.waiting = null;
        if (name === 'new-chat') self.newChat();
        if (t.closest('.chat-side') && matchMedia('(max-width: 47.99rem)').matches) app.classList.remove('side-open');
        cb(); return;
      }
      if (name === 'composer' || name === 'sidebar' || name === 'panel') return;
      if (self.waiting || self.waitInput) self.nudge();
    });
    this.ta.addEventListener('keydown', function (e) {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self.trySend(); }
    });
    this.ta.addEventListener('input', function () { self.fit(); });
  };
  SimChat.prototype.t = function (name) { return $('[data-t="' + name + '"]', this.app); };
  SimChat.prototype.fit = function () { var ta = this.ta; ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 112) + 'px'; };
  SimChat.prototype.scrollEnd = function () { var th = this.thread; th.scrollTop = th.scrollHeight; };
  SimChat.prototype.newChat = function () {
    this.thread.innerHTML = '<div class="chat-empty">' + esc(this.ui.empty) + '</div>';
    this.titleEl.textContent = '';
    this.closePanel();
  };
  SimChat.prototype.restart = function (initial) {
    clearTimeout(this.timer); if (this.finishStream) this.finishStream();
    this.finishStream = null; this.waiting = null; this.waitInput = null; this.clearFocus();
    this.i = -1; this.ta.value = ''; this.atts.innerHTML = ''; this.fit();
    this.app.classList.remove('side-open');
    this.newChat();
    if (this.cfg.title) this.titleEl.textContent = this.cfg.title;
    if (this.cfg.start === 'thread' && this.cfg.thread) this.thread.innerHTML = '';
    this.next();
  };
  SimChat.prototype.skip = function () {
    if (this.finishStream) { this.finishStream(); return; }
    clearTimeout(this.timer);
    var w = this.waiting, wi = this.waitInput;
    this.clearFocus();
    if (w) { this.waiting = null; if (w.target === 'new-chat') this.newChat(); w.cb(); return; }
    if (wi) { if (!this.ta.value.trim()) this.ta.value = wi.suggest || '…'; this.trySend(); return; }
    if (this.onContinue) { var f = this.onContinue; this.onContinue = null; f(); return; }
    this.next();
  };
  SimChat.prototype.next = function () {
    this.i += 1; this.onContinue = null;
    if (this.i >= this.steps.length) { this.finish(); return; }
    this.runStep(this.steps[this.i]);
  };
  SimChat.prototype.later = function (fn, ms) { var self = this; clearTimeout(this.timer); this.timer = setTimeout(fn, reduced() ? 0 : ms); };
  SimChat.prototype.focusEl = function (t) {
    this.clearFocus(); if (!t) return;
    t.classList.add('sim-focus'); this.focused = t;
    if (t.closest('.chat-side') && matchMedia('(max-width: 47.99rem)').matches) this.app.classList.add('side-open');
    if (this.engaged) { var f = t.matches('button, textarea') ? t : $('textarea', t); if (f) f.focus({ preventScroll: true }); }
  };
  SimChat.prototype.clearFocus = function () { if (this.focused) this.focused.classList.remove('sim-focus'); this.focused = null; };
  SimChat.prototype.nudge = function () {
    var c = this.coachEl; c.classList.remove('nudge'); void c.offsetWidth; c.classList.add('nudge');
    var say = $('.say', c);
    if (!$('.nudge-text', say)) say.insertAdjacentHTML('beforeend', ' <span class="nudge-text muted">· 강조된 곳을 눌러 진행합니다.</span>');
  };
  SimChat.prototype.continueBtn = function (text) {
    var self = this;
    this.onContinue = function () { self.next(); };
    setCoach(this, text, { acts: [{ label: '계속', primary: true, fn: function () { if (self.onContinue) { self.onContinue = null; self.next(); } } }] });
  };
  SimChat.prototype.runStep = function (s) {
    var self = this, role = s.role || s.type || 'note';
    if (s.newChat) this.newChat();
    if (s.title) this.titleEl.textContent = s.title;
    if (s.panel && role !== 'assistant') this.openPanel(s.panel);
    if (role === 'system-note' || role === 'note') {
      var target = s.expect ? String(s.expect).replace(/^click:/, '') : null;
      if (target && this.t(target)) {
        setCoach(this, s.text);
        this.waiting = { target: target, cb: function () { self.next(); } };
        this.focusEl(this.t(target));
      } else if (s.wait === false) { setCoach(this, s.text); this.later(function () { self.next(); }, 600); }
      else this.continueBtn(s.text);
      return;
    }
    if (role === 'user') { this.userStep(s); return; }
    if (role === 'assistant') { this.assistantStep(s); return; }
    if (role === 'tool') {
      var m = el('div', { class: 'msg tool' }, '<span class="spin" aria-hidden="true"></span><span></span>');
      $('span:last-child', m).textContent = s.text || '작업 중';
      this.clearEmpty(); this.thread.appendChild(m); this.scrollEnd();
      setCoach(this, s.coach || 'AI가 도구를 쓰는 중입니다.');
      this.later(function () { m.classList.add('done'); $('span:last-child', m).textContent = s.done || ((s.text || '작업') + ' · 완료'); self.next(); }, s.ms || 1100);
      return;
    }
    if (role === 'panel') { this.openPanel(s.panel || s); this.later(function () { self.next(); }, 300); return; }
    this.next();
  };
  SimChat.prototype.clearEmpty = function () { var e = $('.chat-empty', this.thread); if (e) e.remove(); };
  SimChat.prototype.attHTML = function (list) {
    return (list || []).map(function (a) { return '<span class="att">' + ICON.file + '<span>' + esc(a) + '</span></span>'; }).join('');
  };
  SimChat.prototype.userStep = function (s) {
    var self = this;
    var input = s.expectInput || s.suggest || (s.input === true ? s.text : null);
    var attach = s.attachments && s.attachments.length;
    var needAttachClick = attach && (s.expect === 'click:attach' || s.expect === 'attach');
    function inputPhase() {
      if (attach) self.atts.innerHTML = self.attHTML(s.attachments);
      if (input) {
        self.waitInput = { suggest: input, step: s };
        setCoach(self, s.coach || '아래 문장을 입력창에 입력하고 보내기를 누르세요. 그대로 쓰지 않고 내 말로 바꿔 써도 됩니다.', {
          suggest: input,
          acts: [{ label: '자동 입력', fn: function () { self.ta.value = input; self.fit(); self.ta.focus(); } }]
        });
        self.focusEl(self.t('composer'));
      } else {
        self.later(function () { self.postUser(s.text || '', s.attachments); self.next(); }, 500);
        setCoach(self, s.coach || '질문을 보냅니다.');
      }
    }
    if (needAttachClick) {
      setCoach(this, s.attachCoach || '먼저 입력창 왼쪽의 + 버튼을 눌러 파일을 첨부하세요.');
      this.waiting = { target: 'attach', cb: inputPhase };
      this.focusEl(this.t('attach'));
    } else inputPhase();
  };
  SimChat.prototype.trySend = function () {
    if (!this.waitInput) { if (this.waiting) this.nudge(); return; }
    var text = this.ta.value.trim();
    if (!text) { setCoach(this, '입력창이 비어 있습니다. 문장을 입력하거나 **자동 입력**을 누르세요.', { suggest: this.waitInput.suggest, acts: [{ label: '자동 입력', fn: (function (self, sg) { return function () { self.ta.value = sg; self.fit(); self.ta.focus(); }; })(this, this.waitInput.suggest) }] }); return; }
    var s = this.waitInput.step; this.waitInput = null; this.clearFocus();
    this.postUser(text, s.attachments);
    this.ta.value = ''; this.atts.innerHTML = ''; this.fit();
    this.next();
  };
  SimChat.prototype.postUser = function (text, atts) {
    this.clearEmpty();
    var m = el('div', { class: 'msg user' });
    if (atts && atts.length) m.appendChild(el('div', { class: 'atts' }, this.attHTML(atts)));
    var b = el('div', { class: 'bubble' }); b.textContent = text; m.appendChild(b);
    this.thread.appendChild(m); this.scrollEnd();
    if (!this.titleEl.textContent && this.cfg.autoTitle !== false) this.titleEl.textContent = text.slice(0, 28) + (text.length > 28 ? '…' : '');
  };
  SimChat.prototype.assistantStep = function (s) {
    var self = this;
    this.clearEmpty();
    var m = el('div', { class: 'msg assistant' }, '<div class="body"></div>');
    this.thread.appendChild(m);
    if (s.panel) this.openPanel(s.panel);
    setCoach(this, s.while || 'AI가 답하는 중입니다.');
    var stick = true;
    var th = this.thread;
    var onScroll = function () { stick = th.scrollHeight - th.scrollTop - th.clientHeight < 40; };
    th.addEventListener('scroll', onScroll);
    var speed = this.cfg.speed != null ? this.cfg.speed : 4;
    this.finishStream = stream($('.body', m), md(s.text || ''), function () {
      th.removeEventListener('scroll', onScroll);
      self.finishStream = null;
      if (s.coach) self.continueBtn(s.coach);
      else self.later(function () { self.next(); }, 450);
    }, speed, function () { if (stick) self.scrollEnd(); });
  };
  SimChat.prototype.openPanel = function (p) {
    if (!p) return;
    var body = $('.chat-panel-body', this.app);
    $('.chat-panel-head b', this.app).textContent = p.title || '';
    if (p.kind) $('.chat-panel-head .kind', this.app).textContent = p.kind;
    if (p.lang || p.type === 'code') body.innerHTML = '<div class="codeblock"><pre class="code"><code>' + highlight(p.content || '', p.lang) + '</code></pre></div>';
    else body.innerHTML = md(p.content || '');
    this.app.classList.add('has-panel');
  };
  SimChat.prototype.closePanel = function () { this.app.classList.remove('has-panel'); };
  SimChat.prototype.finish = function () {
    var self = this; this.clearFocus();
    setCoach(this, this.cfg.end || '끝까지 따라 했습니다. 답을 그대로 믿지 말고, 직접 실행하고 확인한 내용을 AI USE NOTE에 적어 두세요.', { done: true, acts: [{ label: '처음부터 다시', fn: function () { self.restart(); } }] });
  };

  /* ------------------------------------------------------------------------
     sim-term: scripted terminal / agent CLI (data-variant="shell" | "claude-code" | "codex")
     ------------------------------------------------------------------------ */
  function SimTerm(root) {
    this.root = root;
    var cfg = simJSON(root); if (!cfg) return;
    this.cfg = cfg;
    this.variant = root.getAttribute('data-variant') || cfg.variant || 'shell';
    this.steps = cfg.steps || [];
    this.engaged = false;
    this.build();
    this.restart();
    root.classList.add('is-ready');
  }
  SimTerm.prototype.build = function () {
    var self = this, r = this.root, cfg = this.cfg;
    var h = r.getAttribute('data-height'); if (h) r.style.setProperty('--sim-h', /^\d+$/.test(h) ? h + 'px' : h);
    var app = el('div', { class: 'term-app' + (cfg.files ? ' has-files' : ''), 'data-variant': this.variant });
    var title = cfg.title || (this.variant === 'shell' ? '터미널' : 'AI 코딩 에이전트 (연습)');
    app.innerHTML = '<div class="term-bar"><span class="t-title"></span>' + (cfg.files ? '<button type="button" class="t-files-btn" aria-expanded="false">파일</button>' : '') + '</div>' +
      (cfg.files ? '<div class="term-files" aria-label="프로젝트 파일"></div>' : '') +
      '<div class="term-screen" role="log" aria-live="polite" tabindex="0" aria-label="터미널 출력"></div>';
    $('.t-title', app).textContent = title + ' — ' + (cfg.cwd || '~/project');
    this.app = app; this.screen = $('.term-screen', app); this.filesEl = $('.term-files', app);
    if (cfg.files) {
      var fb = $('.t-files-btn', app);
      fb.addEventListener('click', function () { var o = app.classList.toggle('files-open'); fb.setAttribute('aria-expanded', String(o)); });
    }
    r.appendChild(simStrip(this));
    r.appendChild(app);
    r.appendChild(coachBox(this));
    r.appendChild(transcript(this.steps, { command: '$', prompt: '나', output: '출력', agent: 'AI', tool: '도구', diff: '변경', permission: '권한', note: '안내' }));
  };
  SimTerm.prototype.paintFiles = function () {
    if (!this.filesEl) return;
    this.app.classList.toggle('has-files', this.files.length > 0);
    var st = this.fileState;
    this.filesEl.innerHTML = this.files.map(function (f) {
      var dir = /\/$/.test(f), depth = f.replace(/\/$/, '').split('/').length - 1, name = f.replace(/\/$/, '').split('/').pop();
      var cls = 'f' + (dir ? ' dir' : '') + (st[f] === 'mod' ? ' mod' : st[f] === 'new' ? ' new' : '') + (st.hot === f ? ' hot' : '');
      return '<div class="' + cls + '" style="padding-left:' + (0.4 + depth * 0.9) + 'rem"><span>' + esc(name) + (dir ? '/' : '') + '</span><span class="flag"></span></div>';
    }).join('');
  };
  SimTerm.prototype.restart = function () {
    clearTimeout(this.timer); if (this.stopOut) this.stopOut();
    this.stopOut = null; this.waiting = null;
    this.screen.innerHTML = '';
    this.files = (this.cfg.files || []).slice(); this.fileState = {};
    this.paintFiles();
    this.mode = this.cfg.mode || (this.variant === 'shell' ? 'shell' : 'shell');
    this.i = -1;
    this.next();
  };
  SimTerm.prototype.skip = function () {
    if (this.stopOut) { this.stopOut(); return; }
    clearTimeout(this.timer);
    var w = this.waiting;
    if (w && w.type === 'input') { w.input.value = w.expect || w.input.value || '…'; w.submit(true); return; }
    if (w && w.type === 'perm') { w.choose(w.expect != null ? w.expect : 0, true); return; }
    if (w && w.type === 'note') { this.waiting = null; this.next(); return; }
    this.next();
  };
  SimTerm.prototype.next = function () {
    this.i += 1; this.waiting = null;
    if (this.i >= this.steps.length) { this.finish(); return; }
    this.runStep(this.steps[this.i]);
  };
  SimTerm.prototype.later = function (fn, ms) { clearTimeout(this.timer); this.timer = setTimeout(fn, reduced() ? 0 : ms); };
  SimTerm.prototype.scrollEnd = function () { this.screen.scrollTop = this.screen.scrollHeight; };
  SimTerm.prototype.ps = function () {
    var cwd = this.cfg.cwd || '~/project';
    return '<span class="ps"><span class="cwd">' + esc(cwd) + '</span> $</span>';
  };
  SimTerm.prototype.row = function (html, cls) { var d = el('div', { class: 'row' + (cls ? ' ' + cls : '') }, html); this.screen.appendChild(d); this.scrollEnd(); return d; };
  SimTerm.prototype.lines = function (text, cls, done) {
    var self = this, arr = String(text == null ? '' : text).split('\n'), k = 0;
    function out() {
      if (k >= arr.length) { self.stopOut = null; done(); return; }
      var L = arr[k++], c = cls || '';
      if (!c) { if (/^(✓|✔|ok\b|done|PASS)/i.test(L.trim())) c = 'ok'; else if (/^(error|err!|✗|✘|fail)/i.test(L.trim())) c = 'err'; else if (/^(warn|⚠)/i.test(L.trim())) c = 'warn'; }
      self.row(esc(L) || ' ', c);
      self.timer = setTimeout(out, reduced() ? 0 : 28);
    }
    this.stopOut = function () {
      clearTimeout(self.timer);
      while (k < arr.length) { var L = arr[k++]; self.row(esc(L) || ' ', cls || ''); }
      self.stopOut = null; done();
    };
    out();
  };
  SimTerm.prototype.input = function (opts) {
    var self = this, agent = opts.agent;
    var row = el('div', { class: 'term-input' + (agent ? ' boxed' : '') }, (agent ? '<span class="ps">&gt;</span>' : this.ps()) + '<input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="' + (agent ? '에이전트에게 보낼 요청' : '명령 입력') + '">');
    this.screen.appendChild(row); this.scrollEnd();
    var inp = $('input', row);
    var w = { type: 'input', input: inp, expect: opts.expect, submit: submit };
    this.waiting = w;
    function submit(force) {
      var v = inp.value.trim();
      if (!v && !force) return;
      if (!agent && opts.expect && !force && v.replace(/\s+/g, ' ') !== opts.expect.replace(/\s+/g, ' ')) {
        self.row('<span class="warn">연습 화면에서는 이 단계에 <b>' + esc(opts.expect) + '</b> 을(를) 입력합니다. 다시 입력해 보세요.</span>');
        inp.value = ''; self.screen.appendChild(row); self.scrollEnd(); inp.focus({ preventScroll: true });
        return;
      }
      if (force && !v) v = opts.expect || '';
      row.remove();
      if (agent) self.row('<span class="user-line">&gt; <b></b></span>').querySelector('b').textContent = v;
      else { var rr = self.row(self.ps() + ' <span class="cmd"></span>'); $('.cmd', rr).innerHTML = hlBashLine(v); }
      self.waiting = null;
      opts.done(v);
    }
    inp.addEventListener('keydown', function (e) {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter') { e.preventDefault(); self.engaged = true; submit(false); }
    });
    if (this.engaged) inp.focus({ preventScroll: true });
    return inp;
  };
  SimTerm.prototype.autoType = function (inp, text) {
    var k = 0, self = this;
    inp.focus({ preventScroll: true });
    if (reduced()) { inp.value = text; return; }
    inp.value = '';
    (function t() { if (k > text.length) return; inp.value = text.slice(0, k++); self.timer = setTimeout(t, 22); })();
  };
  SimTerm.prototype.runStep = function (s) {
    var self = this, type = s.type || 'output';
    if (type === 'mode') { this.mode = s.mode || 'agent'; this.next(); return; }
    if (type === 'clear') { this.screen.innerHTML = ''; this.next(); return; }
    if (type === 'files') {
      if (s.files) this.files = s.files.slice();
      (s.add || []).forEach(function (f) { if (self.files.indexOf(f) < 0) self.files.push(f); self.fileState[f] = 'new'; });
      (s.modified || []).forEach(function (f) { self.fileState[f] = 'mod'; });
      this.paintFiles(); this.next(); return;
    }
    if (type === 'note') {
      if (s.wait === false) { setCoach(this, s.text); this.later(function () { self.next(); }, 500); return; }
      this.waiting = { type: 'note' };
      setCoach(this, s.text, { acts: [{ label: '계속', primary: true, fn: function () { if (self.waiting && self.waiting.type === 'note') { self.waiting = null; self.next(); } } }] });
      return;
    }
    if (type === 'command') {
      var inp = this.input({ expect: s.cmd, done: function () { self.later(function () { self.next(); }, 200); } });
      setCoach(this, s.coach || ('터미널에 `' + s.cmd + '` 을(를) 입력하고 Enter를 누르세요.' + (s.hint ? ' ' + s.hint : '')), {
        suggest: s.cmd,
        acts: [{ label: '자동 입력', fn: function () { self.autoType(inp, s.cmd); } }]
      });
      return;
    }
    if (type === 'prompt') {
      var text = s.text || s.expectInput || '';
      var inp2 = this.input({ agent: true, expect: text, done: function () { self.later(function () { self.next(); }, 250); } });
      setCoach(this, s.coach || '에이전트에게 보낼 요청을 입력하고 Enter를 누르세요. 내 말로 바꿔 써도 됩니다.', {
        suggest: text, acts: [{ label: '자동 입력', fn: function () { self.autoType(inp2, text); } }]
      });
      return;
    }
    if (type === 'output') {
      setCoach(this, s.coach || '출력을 읽어 보세요.');
      this.lines(s.text != null ? s.text : [].concat(s.lines || []).join('\n'), s.cls || '', function () {
        if (s.coach && s.wait !== false) { self.waiting = { type: 'note' }; setCoach(self, s.coach, { acts: [{ label: '계속', primary: true, fn: function () { if (self.waiting) { self.waiting = null; self.next(); } } }] }); }
        else self.later(function () { self.next(); }, 250);
      });
      return;
    }
    if (type === 'agent') {
      var a = el('div', { class: 'agent' }); this.screen.appendChild(a);
      setCoach(this, s.coach || '에이전트의 설명을 읽어 보세요.');
      var fin = stream(a, inlineMd(s.text || ''), function () {
        self.stopOut = null;
        if (s.coach && s.wait !== false) { self.waiting = { type: 'note' }; setCoach(self, s.coach, { acts: [{ label: '계속', primary: true, fn: function () { if (self.waiting) { self.waiting = null; self.next(); } } }] }); }
        else self.later(function () { self.next(); }, 350);
      }, this.cfg.speed != null ? this.cfg.speed : 5, function () { self.scrollEnd(); });
      this.stopOut = fin;
      return;
    }
    if (type === 'tool') {
      var t = el('div', { class: 'agent tool' }, '<span class="tname"></span><span class="targ"></span>' + (s.result ? '<span class="tres"></span>' : ''));
      $('.tname', t).textContent = s.name || 'Tool'; $('.targ', t).textContent = '(' + (s.arg || '') + ')';
      if (s.result) $('.tres', t).textContent = s.result;
      if (s.arg && this.files.indexOf(s.arg) > -1) { this.fileState.hot = s.arg; this.paintFiles(); }
      this.screen.appendChild(t); this.scrollEnd();
      setCoach(this, s.coach || '에이전트가 도구를 사용합니다.');
      this.later(function () { self.next(); }, s.ms || 500);
      return;
    }
    if (type === 'diff') {
      var lines = s.lines ? [].concat(s.lines) : String(s.diff || s.text || '').split('\n');
      var d = el('div', { class: 't-diff' }, (s.file ? '<div class="fn"></div>' : '') + lines.map(function (l) {
        var c = l[0], cls = c === '+' ? 'add' : c === '-' ? 'del' : c === '@' ? 'hunk' : '';
        return '<span class="ln ' + cls + '">' + esc(l) + '</span>';
      }).join(''));
      if (s.file) { $('.fn', d).textContent = s.file; if (this.files.indexOf(s.file) > -1 && this.fileState[s.file] !== 'new') this.fileState[s.file] = 'mod'; this.fileState.hot = s.file; this.paintFiles(); }
      this.screen.appendChild(d); this.scrollEnd();
      if (s.coach) { this.waiting = { type: 'note' }; setCoach(this, s.coach, { acts: [{ label: '계속', primary: true, fn: function () { if (self.waiting) { self.waiting = null; self.next(); } } }] }); }
      else this.later(function () { self.next(); }, 400);
      return;
    }
    if (type === 'permission') { this.permission(s); return; }
    this.next();
  };
  SimTerm.prototype.permission = function (s) {
    var self = this;
    var opts = (s.options || ['Yes', 'No']).map(function (o) { return typeof o === 'string' ? { label: o } : o; });
    var expect = s.expect != null ? +s.expect - 1 : null;
    var box = el('div', { class: 'term-perm', role: 'group', 'aria-label': '권한 요청' });
    box.innerHTML = (s.title ? '<div class="dim"></div>' : '') + (s.detail ? '<div class="detail"></div>' : '') + '<div class="q"></div><div class="opts"></div><div class="fb" aria-live="polite"></div>';
    if (s.title) $('.dim', box).textContent = s.title;
    if (s.detail) $('.detail', box).textContent = s.detail;
    $('.q', box).textContent = s.question || '이 작업을 허용할까요?';
    var sel = 0, btns = opts.map(function (o, i) {
      var b = el('button', { type: 'button', class: 'opt' + (i === 0 ? ' is-sel' : ''), 'data-i': i });
      b.textContent = (i + 1) + '. ' + o.label;
      b.addEventListener('click', function () { self.engaged = true; choose(i); });
      b.addEventListener('focus', function () { mark(i); });
      $('.opts', box).appendChild(b);
      return b;
    });
    function mark(i) { sel = i; btns.forEach(function (b, k) { b.classList.toggle('is-sel', k === i); }); }
    box.addEventListener('keydown', function (e) {
      var k = e.key;
      if (/^[1-9]$/.test(k) && +k <= btns.length) { e.preventDefault(); choose(+k - 1); }
      else if (k === 'ArrowDown') { e.preventDefault(); mark((sel + 1) % btns.length); btns[sel].focus(); }
      else if (k === 'ArrowUp') { e.preventDefault(); mark((sel - 1 + btns.length) % btns.length); btns[sel].focus(); }
      else if (k === 'Escape') { e.preventDefault(); choose(btns.length - 1); }
    });
    function choose(i, forced) {
      var o = opts[i];
      if (expect !== null && i !== expect && !forced) {
        $('.fb', box).textContent = o.feedback || s.feedback || '이 연습에서는 다른 선택지를 골라 보세요. 무엇을 허락하는지 다시 읽어 보세요.';
        mark(i); return;
      }
      btns.forEach(function (b) { b.disabled = true; });
      mark(i); box.classList.add('is-answered');
      $('.fb', box).textContent = '';
      self.waiting = null;
      if (o.result) self.row('<span class="dim"></span>').firstChild.textContent = '  ⎿  ' + o.result;
      if (o.coach || s.after) { self.waiting = { type: 'note' }; setCoach(self, o.coach || s.after, { acts: [{ label: '계속', primary: true, fn: function () { if (self.waiting) { self.waiting = null; self.next(); } } }] }); }
      else self.later(function () { self.next(); }, 300);
    }
    this.screen.appendChild(box); this.scrollEnd();
    this.waiting = { type: 'perm', expect: expect, choose: choose };
    setCoach(this, s.coach || '에이전트가 허락을 구합니다. 무엇을 하려는지 읽고, 숫자 키나 클릭으로 답하세요.');
    if (this.engaged) btns[0].focus({ preventScroll: true });
  };
  SimTerm.prototype.finish = function () {
    var self = this;
    setCoach(this, this.cfg.end || '끝까지 따라 했습니다. 실제 터미널에서도 같은 순서로 해 보고, 바뀐 파일을 diff로 확인하세요.', { done: true, acts: [{ label: '처음부터 다시', fn: function () { self.restart(); } }] });
  };

  /* ------------------------------------------------------------------------
     Deck (수업용 발표): one slide at a time — keys, ToC, notes, timer, swipe
     ------------------------------------------------------------------------ */
  function initDeck() {
    var deckEl = $('.deck') || D.body;
    var slides = $$('.slide', deckEl);
    if (!slides.length) return;
    var title = deckEl.getAttribute('data-title') || D.title;
    var phases = [];
    slides.forEach(function (s) { var p = s.getAttribute('data-phase'); if (p && phases.indexOf(p) < 0) phases.push(p); });

    var steps = el('nav', { class: 'deck-steps', 'aria-label': '진행 단계' });
    phases.forEach(function (p, k) {
      if (k) steps.appendChild(el('span', { class: 'gap', 'aria-hidden': 'true' }));
      var first = slides.findIndex(function (s) { return s.getAttribute('data-phase') === p; });
      var b = el('button', { type: 'button' }, '<i>' + (k + 1) + '</i><span>' + esc(p) + '</span>');
      b.addEventListener('click', function () { show(first); });
      steps.appendChild(b);
    });
    if (!phases.length) steps.hidden = true;
    var stepBtns = $$('button', steps);

    var notes = el('div', { class: 'deck-notes', 'aria-live': 'polite', role: 'region', 'aria-label': '진행 메모' });
    var toc = el('div', { class: 'deck-toc', role: 'dialog', 'aria-label': '슬라이드 목차' });
    var last = null, tocHtml = '';
    slides.forEach(function (s, k) {
      var ph = s.getAttribute('data-phase') || '안내';
      if (ph !== last) { tocHtml += '<h5>' + esc(ph) + '</h5>'; last = ph; }
      tocHtml += '<button type="button" data-k="' + k + '"><i>' + (k + 1) + '</i><span>' + esc(s.getAttribute('data-title') || (($('h1, h2', s) || {}).textContent || '')) + '</span></button>';
    });
    toc.innerHTML = tocHtml;
    var tocBtns = $$('button', toc);
    tocBtns.forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-k')); togglePanel(toc, bToc, false); }); });

    var timer = el('div', { class: 'deck-timer', role: 'timer', 'aria-label': '타이머' });
    timer.hidden = true;
    timer.innerHTML = '<div class="pre"><button type="button" data-sec="180" class="on">3분</button><button type="button" data-sec="300">5분</button><button type="button" data-sec="600">10분</button><button type="button" data-sec="900">15분</button></div>' +
      '<div class="row"><span class="num">3:00</span><button type="button" class="go">시작</button><button type="button" class="rs">처음으로</button></div>';

    var hud = el('footer', { class: 'deck-hud' });
    hud.innerHTML = '<div class="l"><b></b><span class="deck-cur" aria-live="polite"></span></div><div class="r"></div>';
    $('.l b', hud).textContent = title;
    var hr = $('.r', hud);
    function hb(label, key, cls) { var b = el('button', { type: 'button', class: 'hb' + (cls ? ' ' + cls : '') }, '<span>' + label + '</span>' + (key ? '<kbd>' + key + '</kbd>' : '')); hr.appendChild(b); return b; }
    var bToc = hb('목차', 'T'), bNotes = hb('메모', 'N'), bTimer = hb('타이머', ''), bFs = hb('전체 화면', 'F', 'opt');
    var bTheme = themeButton('hb theme-btn opt'); hr.appendChild(bTheme);
    var bPrev = el('button', { type: 'button', class: 'hb nav', 'aria-label': '이전 슬라이드' }, '‹');
    var pg = el('span', { class: 'deck-pg' });
    var bNext = el('button', { type: 'button', class: 'hb nav', 'aria-label': '다음 슬라이드' }, '›');
    hr.appendChild(bPrev); hr.appendChild(pg); hr.appendChild(bNext);
    var bar = el('div', { class: 'deck-bar', 'aria-hidden': 'true' });
    [steps, notes, toc, timer, hud, bar].forEach(function (x) { D.body.appendChild(x); });

    var cur = 0;
    function show(i) {
      cur = Math.max(0, Math.min(slides.length - 1, i | 0));
      slides.forEach(function (s, k) {
        var on = k === cur;
        s.classList.toggle('active', on);
        if (on) { s.removeAttribute('aria-hidden'); s.inert = false; s.scrollTop = 0; } else { s.setAttribute('aria-hidden', 'true'); s.inert = true; }
      });
      var s = slides[cur], t = s.getAttribute('data-title') || (($('h1, h2', s) || {}).textContent || '');
      $('.deck-cur', hud).textContent = '· ' + t;
      pg.textContent = (cur + 1) + ' / ' + slides.length;
      bar.style.width = ((cur + 1) / slides.length * 100) + '%';
      var pi = phases.indexOf(s.getAttribute('data-phase') || '');
      stepBtns.forEach(function (b, k) { b.classList.toggle('on', k === pi); b.classList.toggle('done', pi > -1 && k < pi); if (k === pi) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      D.body.classList.toggle('is-cover', s.classList.contains('cover'));
      var n = $(':scope > .notes', s);
      notes.innerHTML = '<h4>진행 메모 · ' + (cur + 1) + ' ' + esc(t) + '</h4>' + (n ? n.innerHTML : '<p>메모 없음</p>');
      tocBtns.forEach(function (b, k) { b.classList.toggle('cur', k === cur); });
      try { history.replaceState(null, '', '#s=' + (cur + 1)); } catch (e) { }
    }
    function togglePanel(p, btn, force) {
      var open = force != null ? force : !p.classList.contains('open');
      p.classList.toggle('open', open); if (btn) { btn.classList.toggle('on', open); btn.setAttribute('aria-pressed', String(open)); }
    }
    function fs() {
      if (!D.fullscreenElement) { if (R.requestFullscreen) R.requestFullscreen().catch(function () { }); }
      else if (D.exitFullscreen) D.exitFullscreen();
    }
    bPrev.addEventListener('click', function () { show(cur - 1); });
    bNext.addEventListener('click', function () { show(cur + 1); });
    bToc.addEventListener('click', function () { togglePanel(toc, bToc); });
    bNotes.addEventListener('click', function () { togglePanel(notes, bNotes); });
    bFs.addEventListener('click', fs);
    bTimer.addEventListener('click', function () { timer.hidden = !timer.hidden; bTimer.classList.toggle('on', !timer.hidden); });

    D.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      var t = e.target, k = e.key;
      if (t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], .term-perm')) return;
      var onControl = t.closest && t.closest('button, a, summary, [role="button"], [role="tab"]');
      if ((k === ' ' || k === 'Enter') && onControl) return;
      if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); show(cur + 1); }
      else if (k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); show(cur - 1); }
      else if (k === 'Home') { e.preventDefault(); show(0); }
      else if (k === 'End') { e.preventDefault(); show(slides.length - 1); }
      else if (k === 't' || k === 'T') togglePanel(toc, bToc);
      else if (k === 'n' || k === 'N') togglePanel(notes, bNotes);
      else if (k === 'f' || k === 'F') fs();
      else if (k === 'Escape') { togglePanel(toc, bToc, false); togglePanel(notes, bNotes, false); }
    });
    var tx = null, ty = null;
    D.addEventListener('touchstart', function (e) {
      if (e.target.closest('.lab, pre, .codeblock, .table-wrap, .sim, textarea, input, .timeline, .deck-steps')) { tx = null; return; }
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    }, { passive: true });
    D.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) show(dx < 0 ? cur + 1 : cur - 1);
      tx = ty = null;
    }, { passive: true });
    function fromHash() {
      var h = location.hash.replace(/^#/, ''), m = /^(?:s=)?(\d+)$/.exec(h);
      return m ? +m[1] - 1 : null;
    }
    window.addEventListener('hashchange', function () { var n = fromHash(); if (n !== null && n !== cur) show(n); });

    // timer
    var num = $('.num', timer), go = $('.go', timer), total = 180, left = 180, running = false, prev = 0, raf = 0;
    function fmtT(s) { var a = Math.abs(Math.round(s)); return (s < 0 ? '+' : '') + Math.floor(a / 60) + ':' + pad2(a % 60); }
    function paintT() { num.textContent = fmtT(left); timer.classList.toggle('warn', left <= 30 && left > 0); timer.classList.toggle('over', left <= 0); }
    function loop(ts) { if (!running) return; left -= (ts - prev) / 1000; prev = ts; paintT(); raf = requestAnimationFrame(loop); }
    function preset(sec) {
      total = left = sec; running = false; cancelAnimationFrame(raf); go.textContent = '시작'; paintT();
      $$('.pre button', timer).forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-sec') === sec); });
    }
    go.addEventListener('click', function () { running = !running; go.textContent = running ? '멈춤' : '계속'; if (running) { prev = performance.now(); raf = requestAnimationFrame(loop); } });
    $('.rs', timer).addEventListener('click', function () { preset(total); });
    $$('.pre button', timer).forEach(function (b) { b.addEventListener('click', function () { preset(+b.getAttribute('data-sec')); }); });
    $$('[data-timer]').forEach(function (b) {
      b.addEventListener('click', function () { preset(+b.getAttribute('data-timer')); timer.hidden = false; bTimer.classList.add('on'); });
    });
    paintT();

    window.deck = {
      get count() { return slides.length; },
      get current() { return cur; },
      show: show,
      next: function () { show(cur + 1); },
      prev: function () { show(cur - 1); },
      slides: slides
    };
    var start = fromHash();
    show(start !== null ? start : 0);
  }

  /* ------------------------------------------------------------------------
     Print: open 심화 and <details>, paint lazy code, restore afterwards
     ------------------------------------------------------------------------ */
  var printRestore = [];
  window.addEventListener('beforeprint', function () {
    printRestore = [];
    lazyCode.forEach(paintCode);
    $$('.deep-body[hidden]').forEach(function (b) { printRestore.push(function () { b.setAttribute('hidden', 'until-found'); }); b.removeAttribute('hidden'); });
    $$('details:not([open])').forEach(function (d) { printRestore.push(function () { d.open = false; }); d.open = true; });
  });
  window.addEventListener('afterprint', function () { printRestore.forEach(function (f) { f(); }); printRestore = []; });

  /* ------------------------------------------------------------------------
     Init
     ------------------------------------------------------------------------ */
  var booted = false;
  function init(root) {
    var whole = !root || root === D;
    root = root || D;
    if (whole && !R.getAttribute('data-page') && D.body && D.body.getAttribute('data-page')) R.setAttribute('data-page', D.body.getAttribute('data-page'));
    function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.error('[DS] ' + name + ':', e); } }
    safe('deep', function () { initDeep(root); });
    if (whole && !booted) safe('chrome', initChrome);
    safe('code', function () { initCode(root); });
    safe('diff', function () { initDiff(root); });
    safe('quiz', function () { $$('.quiz', root).forEach(initQuiz); });
    safe('checklist', function () { $$('.checklist', root).forEach(initChecklist); });
    safe('tabs', function () { $$('.tabs', root).forEach(initTabs); });
    safe('terms', function () { initTerms(root); });
    safe('assignment', function () { $$('.assignment', root).forEach(initAssignment); });
    safe('prompt', function () { $$('.prompt', root).forEach(initPrompt); });
    safe('stack-map', function () { $$('.stack-map', root).forEach(initStackMap); });
    safe('lab', function () { $$('.lab', root).forEach(function (l) { if (!l.classList.contains('is-ready')) new Lab(l); }); });
    safe('sim-chat', function () { $$('.sim-chat', root).forEach(function (s) { if (!s.classList.contains('is-ready')) new SimChat(s); }); });
    safe('sim-term', function () { $$('.sim-term', root).forEach(function (s) { if (!s.classList.contains('is-ready')) new SimTerm(s); }); });
    if (whole && !booted && pageType() === 'deck') safe('deck', initDeck);
    if (whole) booted = true;
  }
  window.DS = { init: init, highlight: highlight, version: '1.0.0' };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
