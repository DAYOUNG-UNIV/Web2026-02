/* Week 05 diagrams. Each widget owns its state and reset operation. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  $$('[data-console-tour]').forEach(root => {
    let step = 0;
    const steps = [
      ['페이지와 Console', '오른쪽 위 ⋮ 메뉴를 엽니다. 페이지 우클릭 → 검사로도 개발자 도구에 접근할 수 있습니다.', '메뉴 열기'],
      ['개발자 도구 열기', '도구 더보기 → 개발자 도구를 선택합니다. 실제 메뉴의 위치는 창 구성에 따라 조금 다를 수 있습니다.', '개발자 도구 열기'],
      ['Console 탭 선택', '개발자 도구의 Console 탭을 선택합니다. 페이지의 실행 결과와 오류를 확인하는 곳입니다.', 'Console 선택'],
      ['코드 입력', '입력 줄에 console.log("Hello World!")를 작성합니다. 입력 예시 버튼으로 채워 넣습니다.', '입력 예시'],
      ['Enter로 실행', '입력한 코드를 실행합니다. 문자열 출력과 함수가 돌려주는 값을 나누어 확인합니다.', '실행'],
      ['출력과 반환값', 'Hello World!는 console.log가 출력한 문자열입니다. undefined는 console.log 호출의 반환값이며 오류가 아닙니다.', '다시 보기']
    ];
    const input = $('input', root);
    input.readOnly = true;
    function render() {
      $('[data-tour-count]', root).textContent = `STEP ${step + 1} / ${steps.length}`;
      $('[data-tour-title]', root).textContent = steps[step][0];
      $('[data-tour-description]', root).textContent = steps[step][1];
      $('[data-tour-next]', root).textContent = steps[step][2];
      $('[data-tour-prev]', root).disabled = step === 0;
      $('.w5-menu', root).hidden = step !== 1;
      $('.w5-devtools', root).hidden = step < 2;
      input.value = step >= 4 ? 'console.log("Hello World!")' : '';
      input.parentElement.hidden = step < 3;
      $('[data-tour-target="execute"]', root).hidden = step < 4;
      $$('[data-tour-target]', root).forEach(button => button.classList.remove('w5-target'));
      const target = ['menu', 'tools', 'console', null, 'execute', null][step];
      if (target) $(`[data-tour-target="${target}"]`, root).classList.add('w5-target');
      input.classList.toggle('w5-target', step === 3);
      $('.w5-console-log', root).replaceChildren();
      if (step === 5) {
        const localConsole = { log(value) {
          const line = document.createElement('div');
          line.textContent = value;
          $('.w5-console-log', root).append(line);
        } };
        const returned = localConsole.log('Hello World!');
        const line = document.createElement('div');
        line.className = 'w5-return-value';
        line.textContent = String(returned) + '  ← 호출의 반환값';
        $('.w5-console-log', root).append(line);
      }
    }
    function next() { step = step === 5 ? 0 : step + 1; render(); }
    $('[data-tour-next]', root).addEventListener('click', next);
    $('[data-tour-prev]', root).addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
    $('[data-tour-reset]', root).addEventListener('click', () => { step = 0; render(); });
    $$('[data-tour-target]', root).forEach(button => button.addEventListener('click', () => {
      const action = button.dataset.tourTarget;
      if (action === 'inspect') step = 2;
      else if (action === 'menu') step = 1;
      else if (action === 'tools' && step === 1) step = 2;
      else if (action === 'console' && step === 2) step = 3;
      else if (action === 'execute' && step === 4) step = 5;
      render();
    }));
    input.addEventListener('keydown', event => { if (event.key === 'Enter' && step === 4) { step = 5; render(); } });
    render();
  });

  $$('[data-type-inspector]').forEach(root => {
    const values = {
      number: [0, '0', '숫자 0은 값이 없는 상태가 아니라 실제 숫자입니다. 조건에서는 거짓으로 해석됩니다.'],
      string: ['0', '"0"', '한 글자가 있는 문자열입니다. 비어 있지 않으므로 조건에서는 참입니다.'],
      empty: ['', '""', '길이가 0인 문자열입니다. 숫자 0이나 null과 같은 값은 아닙니다.'],
      null: [null, 'null', '값이 없음을 나타내는 원시 값입니다. typeof 결과의 object는 역사적인 예외입니다.'],
      undefined: [undefined, 'undefined', '아직 대입하지 않은 변수에서 읽을 수 있는 값입니다. 명시적으로 대입할 수도 있습니다.'],
      nan: [NaN, 'NaN', '유효한 숫자 결과를 얻지 못했음을 나타내는 number 값입니다.'],
      array: [[], '[]', '빈 배열입니다. 항목이 없어도 조건에서는 참입니다. Array.isArray로 배열을 확인합니다.'],
      object: [{}, '{}', '빈 객체입니다. 조건에서는 참입니다.'],
      boolean: [false, 'false', '참·거짓을 나타내는 Boolean 값 중 거짓입니다.'],
      bigint: [0n, '0n', 'BigInt의 0입니다. 숫자 0과 자료형이 다르며 조건에서는 거짓입니다.']
    };
    function show(key) {
      const [value, label, description] = values[key];
      $('[data-type-value]', root).textContent = label;
      $('[data-type-name]', root).textContent = typeof value;
      $('[data-type-bool]', root).textContent = String(Boolean(value));
      $('[data-type-note]', root).textContent = description;
      $$('[data-value]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === key)));
    }
    $$('[data-value]', root).forEach(b => b.addEventListener('click', () => show(b.dataset.value)));
    $('[data-type-reset]', root).addEventListener('click', () => show('number'));
    show('number');
  });

  $$('[data-coercion]').forEach(root => {
    let step = 0;
    function render() {
      const values = ['"2" + "2" - "2"', JSON.stringify('2' + '2') + ' - "2"', String('2' + '2' - '2')];
      $$('[data-coerce-step]', root).forEach((node, index) => node.classList.toggle('is-active', index === step));
      $('[data-coerce-output]', root).textContent = values[step];
      $('[data-coerce-next]', root).disabled = step === 2;
    }
    $('[data-coerce-next]', root).addEventListener('click', () => { step = Math.min(2, step + 1); render(); });
    $('[data-coerce-reset]', root).addEventListener('click', () => { step = 0; render(); }); render();
  });

  $$('[data-branch-map]').forEach(root => {
    const input = $('[data-score]', root);
    function render() {
      const score = Number(input.value);
      let grade;
      if (score >= 90) grade = 'A'; else if (score >= 80) grade = 'B'; else grade = 'C';
      $('[data-score-value]', root).textContent = score;
      $$('[data-branch]', root).forEach(el => el.classList.toggle('is-active', el.dataset.branch === grade));
      $('[data-branch-code]', root).textContent = `score = ${score}\nscore >= 90 → ${score >= 90}\n` + (score >= 90 ? '첫 분기에서 결정하므로 아래 조건은 검사하지 않습니다.' : `score >= 80 → ${score >= 80}`);
      $('[data-branch-result]', root).textContent = '실행 결과: ' + grade;
    }
    input.addEventListener('input', render);
    $$('[data-score-preset]', root).forEach(b => b.addEventListener('click', () => { input.value = b.dataset.scorePreset; render(); }));
    $('[data-branch-reset]', root).addEventListener('click', () => { input.value = 85; render(); }); render();
  });

  $$('[data-dom-nodes]').forEach(root => {
    const heading = $('[data-dom-preview]', root);
    function choose(kind) {
      heading.classList.toggle('w5-node-element', kind === 'element');
      heading.classList.toggle('w5-node-text', kind === 'text');
      $$('[data-node]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.node === kind)));
      $('[data-node-note]', root).textContent = kind === 'element' ? 'h1 요소 노드: 제목을 담는 요소입니다. id는 이 요소의 속성입니다.' : '텍스트 노드: h1 안에 있는 글자입니다. 별도의 HTML 태그가 아닙니다.';
    }
    $$('[data-node]', root).forEach(b => b.addEventListener('click', () => choose(b.dataset.node)));
    $('[data-node-edit]', root).addEventListener('click', () => { heading.textContent = 'DOM에서 바꾼 제목'; $('[data-node="text"]', root).textContent = '"' + heading.textContent + '" · 텍스트 노드'; choose('text'); });
    $('[data-node-reset]', root).addEventListener('click', () => { heading.textContent = '나의 전시'; $('[data-node="text"]', root).textContent = '"나의 전시" · 텍스트 노드'; heading.classList.remove('w5-node-element', 'w5-node-text'); $$('[data-node]', root).forEach(b => b.setAttribute('aria-pressed', 'false')); $('[data-node-note]', root).textContent = 'h1 요소 또는 그 안의 텍스트 노드를 선택합니다.'; });
  });

  $$('[data-create-node]').forEach(root => {
    let step = 0, item = null;
    const list = $('[data-create-list]', root), next = $('[data-create-next]', root);
    function render() {
      const lines = ['const item = document.createElement("li");', 'item.textContent = "두 번째 작품";', 'list.appendChild(item);'];
      $('[data-create-code]', root).textContent = step ? lines.slice(0, step).join('\n') : '// 아직 실행하지 않았습니다.';
      $('[data-create-state]', root).textContent = item ? 'item.isConnected: ' + item.isConnected + (item.isConnected ? ' · 문서에 연결됨' : ' · 문서 밖의 요소') : '새 요소 없음';
      next.textContent = ['1. 요소 만들기', '2. 내용 넣기', '3. 문서에 붙이기', '문서에 연결됨'][step]; next.disabled = step === 3;
    }
    next.addEventListener('click', () => {
      if (step === 0) item = document.createElement('li');
      else if (step === 1) item.textContent = '두 번째 작품';
      else if (step === 2) list.appendChild(item);
      step = Math.min(3, step + 1); render();
    });
    $('[data-create-reset]', root).addEventListener('click', () => { if (item) item.remove(); item = null; step = 0; render(); }); render();
  });

  $$('[data-array-inspector]').forEach(root => {
    let fruits = ['사과', '바나나', '딸기'];
    const cells = $('[data-array-cells]', root);
    function render(message = '배열의 칸을 선택하면 해당 인덱스의 값을 읽습니다.') {
      cells.replaceChildren();
      fruits.forEach((fruit, index) => {
        const button = document.createElement('button'); button.type = 'button';
        const label = document.createElement('small'); label.textContent = 'index ' + index;
        const value = document.createElement('strong'); value.textContent = fruit;
        button.append(label, value); button.addEventListener('click', () => {
          $('[data-array-result]', root).textContent = `fruits[${index}] → ${JSON.stringify(fruits[index])}`;
          $$('button', cells).forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        }); cells.append(button);
      });
      $('[data-array-code]', root).textContent = 'const fruits = ' + JSON.stringify(fruits) + ';\nfruits.length → ' + fruits.length;
      $('[data-array-result]', root).textContent = message;
      $('[data-array-push]', root).disabled = fruits.length >= 8;
    }
    $('[data-array-push]', root).addEventListener('click', () => { const length = fruits.push('오렌지'); render('push가 돌려준 새 length: ' + length); });
    $('[data-array-pop]', root).addEventListener('click', () => { const removed = fruits.pop(); render('pop이 돌려준 값: ' + String(removed)); });
    $('[data-array-missing]', root).addEventListener('click', () => { $('[data-array-result]', root).textContent = `fruits[${fruits.length}] → ${String(fruits[fruits.length])} · 마지막 인덱스는 length - 1입니다.`; });
    $('[data-array-reset]', root).addEventListener('click', () => { fruits = ['사과', '바나나', '딸기']; render(); }); render();
  });
})();
