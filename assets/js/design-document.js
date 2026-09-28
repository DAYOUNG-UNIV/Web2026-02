/* Explicit document-to-CSS mapping for the beginner lesson. No AI/API calls. */
(() => {
  'use strict';
  const root = document.querySelector('[data-design-document]');
  if (!root) return;
  const data = JSON.parse(document.getElementById('course-data').textContent).designBridge.document;
  const color = root.querySelector('[data-md-color]');
  const space = root.querySelector('[data-md-space]');
  const source = root.querySelector('[data-md-source]');
  const cssSource = root.querySelector('[data-md-css]');
  const frame = root.querySelector('[data-md-frame]');
  const status = root.querySelector('[data-md-status]');
  let applied = {color: '#0f766e', space: '24'};
  const fill = (text, values) => text.replaceAll('__PRIMARY__', values.color).replaceAll('__SPACE__', values.space);
  const values = () => ({color: color.value, space: space.value});
  function updateDocument() {
    source.textContent = fill(data.markdown, values());
    const pending = color.value !== applied.color || space.value !== applied.space;
    root.dataset.pending = String(pending);
    status.textContent = pending
      ? `문서를 수정했습니다. 화면에는 이전 CSS(색 ${applied.color}, 여백 ${applied.space}px)가 남아 있습니다. ‘CSS에 반영’을 눌러 적용합니다.`
      : `문서와 CSS가 같습니다. 두 카드에 색 ${applied.color}, 안쪽 여백 ${applied.space}px를 적용했습니다.`;
  }
  function apply() {
    applied = values();
    const css = fill(data.css, applied);
    cssSource.textContent = css;
    frame.srcdoc = '<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;"><style>' + css + '</style></head><body>' + data.html + '</body></html>';
    window.CourseSyntax?.highlight(cssSource.parentElement);
    updateDocument();
  }
  color.addEventListener('change', updateDocument);
  space.addEventListener('change', updateDocument);
  root.querySelector('[data-md-apply]').addEventListener('click', apply);
  root.querySelector('[data-md-reset]').addEventListener('click', () => {
    color.value = '#0f766e';
    space.value = '24';
    root.querySelector('details').open = false;
    source.parentElement.scrollTop = 0;
    source.parentElement.scrollLeft = 0;
    apply();
  });
  apply();
})();
