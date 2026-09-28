/* Font Awesome webfont preview: supplied CSS/font stay inside a sandboxed frame. */
(() => {
 'use strict';
 function start() {
  const root=document.querySelector('[data-icon-workshop]');if(!root)return;
  const config=JSON.parse(document.getElementById('icon-workshop-data').textContent);
  const q=s=>root.querySelector(s);
  const editor=q('[data-icon-editor]'),frame=q('[data-icon-preview]');
  const choice=q('[data-icon-choice]'),tag=q('[data-icon-tag]'),display=q('[data-icon-label]');
  const size=q('[data-icon-size]'),color=q('[data-icon-color]'),connected=q('[data-icon-connected]');
  const labels={heart:'관심 작품',star:'우수작',user:'자기소개','magnifying-glass':'검색',download:'내려받기'};
  let timer;
  function clean(source) {
   const doc=new DOMParser().parseFromString(source,'text/html');
   doc.querySelectorAll('script,style,link,meta,iframe,object,embed,svg,math').forEach(n=>n.remove());
   const allowed=new Set(['BUTTON','I','SPAN','P','DIV','STRONG','EM','BR']);
   [...doc.body.querySelectorAll('*')].forEach(n=>{
    if(!allowed.has(n.tagName)){n.replaceWith(...n.childNodes);return;}
    [...n.attributes].forEach(a=>{if(!['class','aria-label','aria-hidden','type','disabled'].includes(a.name))n.removeAttribute(a.name);});
    if(n.tagName==='BUTTON')n.setAttribute('type','button');
   });
   return doc.body.innerHTML;
  }
  function render() {
   clearTimeout(timer);
   const css='.demo-icon {\n  color: '+color.value+';\n  font-size: '+size.value+'px;\n  vertical-align: middle;\n}';
   q('[data-icon-css]').textContent=css;q('[data-icon-size-value]').textContent=size.value+'px';
   const styles=config.previewCss+'\n'+(connected.checked?config.css:'')+'\n'+css;
   frame.srcdoc='<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; font-src data:"><style>'+styles.replace(/<\/style/gi,'<\\/style')+'</style></head><body>'+clean(editor.value)+'</body></html>';
   q('[data-icon-status]').textContent=connected.checked?'Font Awesome CSS와 폰트 연결됨 · 아이콘도 글꼴처럼 color와 font-size의 영향을 받습니다.':'Font Awesome 연결 해제됨 · 아이콘 모양은 표시되지 않습니다. 버튼의 글자나 aria-label은 HTML에 남아 있습니다.';
   window.CourseSyntax?.highlight(q('[data-icon-css]').parentElement);
  }
  function example() {
   const label=labels[choice.value],only=display.value==='icon';
   editor.value='<button type="button"'+(only?' aria-label="'+label+'"':'')+'>\n  <'+tag.value+' class="fa-solid fa-'+choice.value+' demo-icon" aria-hidden="true"></'+tag.value+'>\n'+(only?'':'  '+label+'\n')+'</button>';
   window.CourseSyntax?.refreshEditor(editor,'markup');render();
  }
  [choice,tag,display].forEach(n=>n.addEventListener('change',example));
  [size,color,connected].forEach(n=>n.addEventListener('input',render));
  editor.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(render,120);});
  q('[data-icon-reset]').addEventListener('click',()=>{
   choice.value='heart';tag.value='i';display.value='text';size.value='24';color.value='#0f766e';connected.checked=true;
   root.querySelector('details').open=false;editor.value=config.html;window.CourseSyntax?.refreshEditor(editor,'markup');render();
  });
  editor.value=config.html;window.CourseSyntax?.attachEditor(editor,'markup');render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();