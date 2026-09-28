/* Three actual CSS implementations; the lesson controls do not run inside the preview. */
(() => {
  'use strict';
  const root = document.querySelector('[data-design-bridge]');
  if (!root) return;
  const data = JSON.parse(document.getElementById('course-data').textContent).designBridge;
  if (!data) return;
  let kind = 'direct';
  const connected = root.querySelector('[data-design-connected]');
  const frame = root.querySelector('[data-design-frame]');
  const source = root.querySelector('[data-design-code]');
  const cssSource = root.querySelector('[data-design-css-code]');
  const status = root.querySelector('[data-design-status]');
  const names = { direct: '직접 CSS', bootstrap: 'Bootstrap', tailwind: 'Tailwind' };
  const descriptions = {
    direct: 'exhibit-button에 직접 작성한 색·여백·초점 규칙을 적용했습니다.',
    bootstrap: 'btn의 공통 규칙과 btn-primary의 주요 버튼 색이 적용되었습니다.',
    tailwind: '여백·색·글자·초점의 유틸리티 클래스를 조합했습니다.'
  };
  const cssExamples = {
    direct: data.css.direct,
    bootstrap: '/* btn: 공통 버튼 규칙의 일부 */\n.btn {\n  padding: var(--bs-btn-padding-y)\n           var(--bs-btn-padding-x);\n  background-color: var(--bs-btn-bg);\n}\n\n/* btn-primary: 주요 버튼의 값 일부 */\n.btn-primary {\n  --bs-btn-bg: #0d6efd;\n  --bs-btn-color: #fff;\n}',
    tailwind: '/* 기본 테마의 간격 값 */\n:root {\n  --spacing: 0.25rem;\n}\n\n/* 생성된 유틸리티 규칙의 일부 */\n.px-4 {\n  padding-inline: calc(var(--spacing) * 4);\n}\n.py-3 {\n  padding-block: calc(var(--spacing) * 3);\n}'
  };
  function render() {
    root.querySelectorAll('[data-design-kind]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.designKind === kind));
    });
    source.textContent = (connected.checked ? '<!-- head 안: CSS 연결 -->\n<link rel="stylesheet" href="style.css">' : '<!-- head 안: CSS 연결을 뺀 상태 -->') + '\n\n<!-- body 안: 같은 목적의 버튼 -->\n' + data.samples[kind];
    cssSource.textContent = cssExamples[kind];
    root.querySelector('[data-design-css-note]').textContent = kind === 'direct' ? '직접 작성한 전체 CSS입니다.' : '관련 규칙의 일부입니다. 미리보기에는 해당 라이브러리의 실제 CSS를 적용합니다.';
    frame.title = names[kind] + ' · ' + (connected.checked ? 'CSS 적용' : '브라우저 기본 버튼');
    const css = connected.checked ? data.css[kind] : '';
    frame.srcdoc = '<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;"><style>' + css.replace(/<\/style/gi, '<\\/style') + '</style></head><body><main style="padding:24px">' + data.samples[kind] + '</main></body></html>';
    status.textContent = connected.checked ? descriptions[kind] : 'CSS를 연결하지 않아 브라우저의 기본 버튼으로 표시됩니다. HTML의 문구와 type 속성은 그대로입니다.';
    window.CourseSyntax?.highlight(source.parentElement);
    window.CourseSyntax?.highlight(cssSource.parentElement);
  }
  root.querySelectorAll('[data-design-kind]').forEach(button => button.addEventListener('click', () => {
    kind = button.dataset.designKind;
    render();
  }));
  connected.addEventListener('change', render);
  root.querySelector('[data-design-reset]').addEventListener('click', () => {
    kind = 'direct'; connected.checked = true;
    root.querySelector('details').open = false;
    render();
  });
  render();
})();
/* A shared design rule changes both sample screens; measurements come from CSS. */
(() => {
  'use strict';
  const root = document.querySelector('[data-design-system-demo]');
  if (!root) return;
  const color = root.querySelector('[data-ds-color]');
  const space = root.querySelector('[data-ds-space]');
  const screens = [...root.querySelectorAll('[data-ds-screen]')];
  const status = root.querySelector('[data-ds-status]');
  const source = root.querySelector('[data-ds-code]');
  let mode = 'separate';

  function hex(rgb) {
    const channels = rgb.match(/\d+/g);
    return '#' + channels.slice(0, 3).map(value => Number(value).toString(16).padStart(2, '0')).join('');
  }
  function render() {
    root.querySelectorAll('[data-ds-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.dsMode === mode));
    });
    root.style.setProperty('--demo-action', color.value);
    root.style.setProperty('--demo-space', space.value + 'px');
    const actual = screens.map((screen, index) => {
      if (mode === 'shared') {
        screen.style.removeProperty('--demo-action');
        screen.style.removeProperty('--demo-space');
      } else {
        screen.style.setProperty('--demo-action', index === 0 ? color.value : '#6d28d9');
        screen.style.setProperty('--demo-space', index === 0 ? space.value + 'px' : '28px');
      }
      const buttonColor = hex(getComputedStyle(screen.querySelector('.ds-primary')).backgroundColor);
      const padding = getComputedStyle(screen).paddingTop;
      root.querySelector('[data-ds-reading="' + screen.dataset.dsScreen + '"]').textContent =
        '화면 ' + (index + 1) + ' · ' + buttonColor + ' · 여백 ' + padding;
      return {color: buttonColor, padding};
    });
    root.querySelector('[data-ds-origin]').textContent = mode === 'shared' ? '두 화면의 공통 기준' : '첫 화면의 기준';
    root.querySelector('[data-ds-target]').textContent = mode === 'shared' ? '소개 화면 + 질문 화면' : '소개 화면에만 적용';
    const same = actual[0].color === actual[1].color && actual[0].padding === actual[1].padding;
    status.textContent = same ? '두 화면의 주요 버튼 색과 카드 여백이 같습니다. 문구와 화면 내용은 그대로입니다.' : '두 화면의 주요 버튼 색과 카드 여백이 다릅니다. 공통 기준을 선택해 비교합니다.';
    source.textContent = mode === 'shared'
      ? '/* 두 화면이 함께 사용하는 기준 */\n.design-system-demo {\n  --demo-action: ' + color.value + ';\n  --demo-space: ' + space.value + 'px;\n}\n\n.ds-example {\n  padding: var(--demo-space);\n}\n\n.ds-primary {\n  background: var(--demo-action);\n  color: #ffffff;\n}'
      : '/* 화면별로 따로 정한 값 */\n[data-ds-screen="intro"] {\n  --demo-action: ' + color.value + ';\n  --demo-space: ' + space.value + 'px;\n}\n\n[data-ds-screen="question"] {\n  --demo-action: #6d28d9;\n  --demo-space: 28px;\n}';
    window.CourseSyntax?.highlight(source.parentElement);
  }
  root.querySelectorAll('[data-ds-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.dsMode;
    render();
  }));
  color.addEventListener('change', render);
  space.addEventListener('change', render);
  root.querySelector('[data-ds-reset]').addEventListener('click', () => {
    mode = 'separate'; color.value = '#0f766e'; space.value = '16';
    root.querySelector('details').open = false;
    render();
  });
  root.querySelectorAll('[data-ds-sample]').forEach(button => button.addEventListener('click', () => {
    status.textContent = button.dataset.dsSample === 'primary'
      ? '주요 버튼은 다음 단계로 진행하는 동작에 사용합니다. 이 예제에서는 실제 테스트로 이동하지 않습니다.'
      : '보조 버튼은 설명을 보거나 이전으로 돌아가는 동작에 사용합니다. 이 예제에서는 화면을 이동하지 않습니다.';
  }));
  render();
})();
