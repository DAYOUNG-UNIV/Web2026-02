/* Editable HTML rendered with the actual Bootstrap / generated Tailwind styles. */
(() => {
  'use strict';
  const root = document.querySelector('[data-framework-cards]');
  if (!root) return;
  const data = JSON.parse(document.getElementById('course-data').textContent).designBridge.cards;
  const find = selector => root.querySelector(selector);
  const kind = find('[data-fw-kind]');
  const space = find('[data-fw-space]');
  const outline = find('[data-fw-outline]');
  const editor = find('[data-fw-editor]');
  const frame = find('[data-fw-frame]');
  const shell = find('.framework-preview-shell');
  const status = find('[data-fw-status]');
  let width = data.defaultWidth;
  let renderedSource = '';
  let renderCount = 0;
  window.CourseSyntax?.attachEditor(editor, 'markup');

  function resize() {
    const available = shell.clientWidth;
    if (!available) return;
    const scale = Math.min(1, available / width);
    frame.style.width = width + 'px';
    frame.style.height = '480px';
    frame.style.transform = 'scale(' + scale + ')';
    shell.style.height = (480 * scale) + 'px';
    find('[data-fw-scale]').textContent = '미리보기 너비 ' + width + 'px' + (scale < 0.99 ? ' · 영역에 맞춰 축소 표시' : '');
  }
  function render() {
    const css = data.css[kind.value];
    const title = kind.value === 'bootstrap' ? 'Bootstrap' : 'Tailwind CSS';
    renderedSource = editor.value;
    root.dataset.render = String(++renderCount);
    frame.title = title + ' 전시 카드 · ' + width + 'px';
    frame.srcdoc = '<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;">' +
      '<style>' + css.replace(/<\/style/gi, '<\\/style') + '</style></head><body>' + renderedSource + '</body></html>';
    status.textContent = title + ' CSS로 입력한 HTML을 표시했습니다.';
    root.dataset.edited = 'false';
    resize();
  }
  function preset() {
    editor.value = data.variants[kind.value][space.value + '-' + outline.value];
    editor.scrollTop = 0; editor.scrollLeft = 0;
    window.CourseSyntax?.refreshEditor(editor, 'markup');
    editor.dispatchEvent(new Event('scroll'));
    render();
  }
  for (const control of [kind, space, outline]) control.addEventListener('change', preset);
  root.querySelectorAll('[data-fw-width]').forEach(button => button.addEventListener('click', () => {
    width = Number(button.dataset.fwWidth);
    root.querySelectorAll('[data-fw-width]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    frame.title = (kind.value === 'bootstrap' ? 'Bootstrap' : 'Tailwind CSS') + ' 전시 카드 · ' + width + 'px';
    resize();
  }));
  find('[data-fw-run]').addEventListener('click', render);
  find('[data-fw-reset]').addEventListener('click', () => {
    kind.value = 'bootstrap'; space.value = '0'; outline.value = '0'; width = data.defaultWidth;
    root.querySelectorAll('[data-fw-width]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.fwWidth) === width)));
    preset();
  });
  editor.addEventListener('input', () => {
    root.dataset.edited = 'true';
    status.textContent = '수정한 코드는 아직 적용하지 않았습니다. 오른쪽에는 이전 결과가 표시됩니다.';
  });
  editor.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); render(); }
  });
  new ResizeObserver(resize).observe(shell);
  preset();
})();
