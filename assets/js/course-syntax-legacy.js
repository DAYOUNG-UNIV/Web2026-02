/* Bridge earlier lesson editors to the shared, non-executing syntax layer. */
(() => {
  'use strict';
  const fixed = {
    'gitw-code':'markup', 'preview-editor':'markup', 'git-editor':'markup', 'git-working':'markup', 'git-staged':'markup',
    'box-layer-code':'css', 'flex-code':'css', 'box-measure-code':'css',
    'flex-current-code':'css', 'grid-term-code':'css', 'gradient-live-code':'css',
    'dom-source':'markup', 'function-call':'javascript', 'function-inside':'javascript',
    'syntax-example':'javascript', 'selector-code':'javascript', 'loop-current':'javascript'
  };
  const outputs = new Set(['request-result','tour-prompt','git-local','git-remote','trace-output','conversion-string','conversion-number','function-result','selector-result','event-demo-log','loop-output']);
  function detect(source) {
    const text=source.trim();
    if (!text || /[├└]─/.test(text)) return null;
    if (/^(?:(?:git|npm|npx)\s|\$\s*git\s)/.test(text)) return 'bash';
    if (/^(?:#{1,6}\s|`|~{3}|\|.*\|\s*$|!?\[[^\]]+\]\(|---\s*\n)/m.test(text) || /^```/m.test(text)) return 'markdown';
    if (/^(?:[-+] <|<{7} )/.test(text)) return 'diff';
    if (/^(?:\+\s*)?<(?:!doctype|\/?[a-z][\w-]*\b|!--)/i.test(text)) return 'markup';
    const plain=text.replace(/^(?:\s*\/\*[\s\S]*?\*\/\s*|\s*\/\/[^\n]*\n)*/,'');
    if (/^(?:const|let|var|function|class|if|for|while|import|export|async|return)\b/.test(plain)) return 'javascript';
    if (/^(?:[\w-]+\s*:[\s\S]+?;|@(?:import|charset)\s|[^{};=]+\{)/.test(plain) || /^\/\*/.test(text)) return 'css';
    if (/^(?:console\.|document\.|window\.|alert\(|[a-zA-Z_$][\w$]*\([^\n]*\))/.test(plain)) return 'javascript';
    if (/^['"]use strict['"];/.test(text) || /^[a-zA-Z_$][\w$]*(?:\.[\w$]+)+(?:\(|\s*=)/.test(plain) || /^[a-zA-Z_$][\w$]*\s*(?:\+\+|--|\s[+*<>=]\s)/.test(plain)) return 'javascript';
    return null;
  }
  function language(pre) {
    if (outputs.has(pre.id) || pre.matches('.error-text,.lab-console')) return null;
    if (pre.querySelector('[data-trace-line]')) return 'javascript';
    if (fixed[pre.id]) return /^[가-힣]/.test(pre.textContent.trim()) ? null : fixed[pre.id];
    if (pre.closest('.md-code-types') || detect(pre.textContent)==='markdown') return 'markdown';
    if (!pre.querySelector(':scope > code') && !pre.matches('.demo-print,.cp-added,#tour-code,#fw-extra')) return null;
    return detect(pre.textContent);
  }
  function editorLanguage(el) {
    if (el.matches('#pg-in,.demo-editor,#fw-html')) return 'markup';
    if (el.matches('#md-in,#md-editor')) return 'markdown';
    if (!el.closest('.lab')) return null;
    const label=el.getAttribute('aria-label')||'';
    if (/HTML 코드/i.test(label)) return 'markup';
    if (/CSS 코드/i.test(label)) return 'css';
    if (/(?:JS|JavaScript) 코드/i.test(label)) return 'javascript';
    return detect(el.value);
  }
  const attached=new WeakSet(), pending=new Set();let queued=false;
  function schedule(el){pending.add(el);if(!queued){queued=true;queueMicrotask(()=>{queued=false;for(const e of pending)connect(e);pending.clear();});}}
  function connect(el) {
    if(!el.isConnected)return;
    const lang=editorLanguage(el);if(!lang)return;
    if(!attached.has(el)){
      window.CourseSyntax.attachEditor(el,lang);attached.add(el);
      // Existing reset/preset buttons assign .value without firing an input event.
      const native=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value');
      Object.defineProperty(el,'value',{configurable:true,enumerable:native.enumerable,
        get(){return native.get.call(this);},set(value){native.set.call(this,value);schedule(this);}});
    }
    const wrapper=el.closest('.course-code-editor');
    if(wrapper.hidden!==el.hidden)wrapper.hidden=el.hidden;
    window.CourseSyntax.refreshEditor(el,lang);
  }
  function start(){
    document.querySelectorAll('textarea').forEach(connect);
    const observer=new MutationObserver(changes=>{
      for(const m of changes){
        if(m.target.tagName==='TEXTAREA'){schedule(m.target);continue;}
        if(m.target.closest?.('.course-code-editor'))continue;
        for(const node of m.addedNodes||[]){if(node.nodeType!==1)continue;if(node.tagName==='TEXTAREA')schedule(node);node.querySelectorAll('textarea').forEach(schedule);}
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-label']});
  }
  window.CourseSyntaxLegacy={language,detect};
  if(!window.CourseSyntax || document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();