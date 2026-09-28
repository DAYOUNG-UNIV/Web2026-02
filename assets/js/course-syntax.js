/* Shared JS/HTML/CSS syntax colors. Prism tokenization never changes source text. */
(() => {
  'use strict';
  if (!window.Prism) return;
  const P = window.Prism;
  const editors = new WeakMap();
  const rendered = new WeakMap();
  const explicit = {
    'dom-source': 'markup', 'function-call': 'javascript', 'function-inside': 'javascript',
    'syntax-example': 'javascript', 'selector-code': 'javascript', 'loop-current': 'javascript'
  };
  const controls = new Set('if else return for while do switch case break continue throw try catch finally import export from as default await yield new'.split(' '));
  // Plain variable names are light blue in VS Code's Dark+ palette.
  P.languages.javascript['identifier'] = /[$\p{L}_][$\p{L}\p{N}_]*/u;
  function kind(type, value) {
    if (type === 'keyword' && controls.has(value)) return 'control';
    return type;
  }
  P.hooks.add('wrap', env => {
    if (env.type === 'keyword' && controls.has(env.content)) env.classes.push('control');
  });
  function language(pre) {
    if (window.CourseSyntaxLegacy && !pre.dataset.codeLanguage) return window.CourseSyntaxLegacy.language(pre);
    const fixed = pre.dataset.codeLanguage || explicit[pre.id];
    if (fixed) return fixed;
    if (pre.querySelector('[data-trace-line], .concept-code-line')) return 'javascript';
    const code = pre.querySelector(':scope > code');
    if (!code) return null; // Console output is not source code.
    const text = code.textContent.trim();
    if (/[├└]─/.test(text) || /^[가-힣]/.test(text)) return null;
    if (/^\s*<(?:!doctype|[a-z][\w-]*\b|!--)/i.test(text)) return 'markup';
    if (/^(?:const|let|var|function|class|if|for|while|import|export|async|return)\b/.test(text)) return 'javascript';
    if (/^\s*(?:[.#:]|@(?:media|supports|layer|font-face))[^;]*\{/.test(text) || /^\s*[a-z][\w\s,.#:[\]="'-]*\{[\s\S]*[\w-]+\s*:/.test(text)) return 'css';
    return 'javascript';
  }
  function ranges(source, grammar) {
    const output = []; let offset = 0;
    function walk(item, type = '') {
      if (typeof item === 'string') {
        output.push({start: offset, end: offset + item.length, type: kind(type, item)});
        offset += item.length;
      } else if (Array.isArray(item)) item.forEach(x => walk(x, type));
      else walk(item.content, item.type);
    }
    walk(P.tokenize(source, grammar)); return output;
  }
  function colorCode(pre) {
    if (!pre.isConnected || pre.closest('.course-code-editor, noscript')) return;
    const lang = language(pre);
    if (!lang || !P.languages[lang] || rendered.get(pre) === pre.innerHTML) return;
    // Preserve line wrappers, execution markers, IDs, and existing event handlers.
    pre.querySelectorAll('[data-course-token]').forEach(span => span.replaceWith(...span.childNodes));
    pre.normalize();
    const root = pre.querySelector(':scope > code') || pre;
    const records = []; let source = '';
    function collect(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const start = source.length; source += node.data;
        records.push({node, start, end: source.length}); return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE || node.matches('i, [data-code-line-number]')) return;
      if (node.matches('.concept-code-line, [data-trace-line], #gitw-code > .l') && source && !source.endsWith('\n')) source += '\n';
      [...node.childNodes].forEach(collect);
    }
    collect(root);
    const tokens = ranges(source, P.languages[lang]);
    let cursor = 0;
    for (const record of records) {
      while (cursor < tokens.length && tokens[cursor].end <= record.start) cursor++;
      const fragment = document.createDocumentFragment();
      for (let j = cursor; j < tokens.length && tokens[j].start < record.end; j++) {
        const token = tokens[j], begin = Math.max(record.start, token.start), end = Math.min(record.end, token.end);
        if (end <= begin) continue;
        const text = source.slice(begin, end);
        if (!token.type) fragment.append(document.createTextNode(text));
        else {
          const span = document.createElement('span'); span.className = 'token ' + token.type;
          span.dataset.courseToken = ''; span.textContent = text; fragment.append(span);
        }
      }
      record.node.replaceWith(fragment);
    }
    pre.classList.add('course-code'); pre.dataset.syntaxLanguage = lang;
    rendered.set(pre, pre.innerHTML);
  }
  function syncScroll(state) {
    state.colors.scrollTop = state.editor.scrollTop;
    state.colors.scrollLeft = state.editor.scrollLeft;
  }
  function fitEditor(state) {
    const style = getComputedStyle(state.editor);
    for (const name of ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','tabSize','paddingTop','paddingRight','paddingBottom','paddingLeft','textIndent','textAlign']) state.colors.style[name] = style[name];
    // Match the textarea's scrollport, excluding its native scrollbar.
    state.colors.style.left = state.editor.offsetLeft + state.editor.clientLeft + 'px';
    state.colors.style.top = state.editor.offsetTop + state.editor.clientTop + 'px';
    state.colors.style.width = state.editor.clientWidth + 'px';
    state.colors.style.height = state.editor.clientHeight + 'px';
    syncScroll(state);
  }
  function refreshEditor(editor, lang) {
    const state = editors.get(editor); if (!state) return;
    state.lang = lang || state.lang || 'javascript';
    const key = state.lang === 'js' ? 'javascript' : state.lang === 'html' ? 'markup' : state.lang;
    const source = editor.value;
    if (!state.composing) {
      // Prism escapes all source HTML. This layer is visual only, never executable.
      state.code.innerHTML = P.highlight(source + (source.endsWith('\n') ? ' ' : ''), P.languages[key] || P.languages.javascript, key);
    }
    fitEditor(state);
  }
  const resize = new ResizeObserver(entries => entries.forEach(entry => {
    const state = editors.get(entry.target); if (state) fitEditor(state);
  }));
  function attachEditor(editor, lang) {
    if (editors.has(editor)) return;
    const wrapper = document.createElement('div'); wrapper.className = 'course-code-editor';
    const colors = document.createElement('pre'); colors.className = 'course-editor-colors'; colors.setAttribute('aria-hidden','true');
    const code = document.createElement('code'); colors.append(code);
    editor.before(wrapper); wrapper.append(colors, editor);
    const state = {editor, wrapper, colors, code, lang, composing:false};editors.set(editor,state);
    editor.addEventListener('input',()=>refreshEditor(editor));
    editor.addEventListener('scroll',()=>syncScroll(state),{passive:true});
    editor.addEventListener('compositionstart',()=>{state.composing=true;wrapper.classList.add('is-composing');});
    editor.addEventListener('compositionend',()=>{state.composing=false;wrapper.classList.remove('is-composing');refreshEditor(editor);});
    resize.observe(editor);refreshEditor(editor,lang);
  }
  let observer, queued = false;
  const pending = new Set();
  function add(pre) {if (pre && pre.tagName==='PRE' && !pre.closest('.course-code-editor, noscript')) pending.add(pre);}
  function scan(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    add(node.closest('pre'));node.querySelectorAll('pre').forEach(add);
  }
  function flush() {
    queued=false;observer.disconnect();
    try {pending.forEach(colorCode);pending.clear();}
    finally {observer.observe(document.querySelector('main')||document.body,{childList:true,subtree:true,characterData:true});}
  }
  function start() {
    observer=new MutationObserver(changes=>{
      for(const m of changes){
        const el=m.target.nodeType===Node.ELEMENT_NODE?m.target:m.target.parentElement;
        if(el?.closest('.course-code-editor'))continue;
        add(el?.closest('pre'));
        if(m.type==='childList')m.addedNodes.forEach(scan);
      }
      if(pending.size&&!queued){queued=true;queueMicrotask(flush);}
    });
    document.querySelectorAll('pre').forEach(add);flush();
    const refitAll=()=>document.querySelectorAll('.course-code-editor textarea').forEach(editor=>{const state=editors.get(editor);if(state)fitEditor(state);});
    document.fonts?.ready.then(refitAll);
    // Offscreen lesson panels can postpone ResizeObserver delivery. Refit after
    // viewport changes as well, without tokenizing their source again.
    let refitQueued=false;
    window.addEventListener('resize',()=>{if(refitQueued)return;refitQueued=true;requestAnimationFrame(()=>{refitQueued=false;refitAll();});},{passive:true});
  }
  window.CourseSyntax={attachEditor,refreshEditor,highlight:colorCode};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
