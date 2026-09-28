/* Small, fixed-program explorations. Editable examples run separately in the course labs. */
(() => {
  'use strict';
  const q = (root, selector) => root.querySelector(selector);
  const display = value => value === undefined ? 'undefined' : typeof value === 'string' ? JSON.stringify(value) : String(value);
  function values(root, entries) {
    const holder = q(root, '[data-f-values]'); holder.replaceChildren();
    entries.forEach(([name,value]) => {
      const box=document.createElement('div'),label=document.createElement('span'),output=document.createElement('output');
      label.textContent=name;output.textContent=String(value);box.append(label,output);holder.append(box);
    });
  }
  function source(root, text, active=-1, breakpoint=-1) {
    const code=q(root,'[data-f-code]');code.replaceChildren();
    text.split('\n').forEach((text,index)=>{
      const row=document.createElement('span');row.className='concept-code-line';row.textContent=text||' ';
      row.classList.toggle('is-current',index===active);
      if(index===active)row.setAttribute('aria-current','step');
      if(root.dataset.foundation==='debugger'){const number=document.createElement('i');number.textContent=String(index+1);number.setAttribute('aria-hidden','true');row.prepend(number);row.classList.toggle('has-breakpoint',index===breakpoint);}
      code.append(row);
    });
  }
  function message(root,text){q(root,'[data-f-status]').textContent=text;}
  function actions(root,fn){root.addEventListener('click',event=>{const b=event.target.closest('[data-f-action]');if(b&&root.contains(b))fn(b.dataset.fAction);});}

  document.querySelectorAll('[data-foundation="strings"]').forEach(root=>{
    const raw=q(root,'[data-f-raw]'),query=q(root,'[data-f-query]');
    function render(){
      const clean=raw.value.trim(),found=clean.includes(query.value);
      source(root,`const raw = ${JSON.stringify(raw.value)};\nconst clean = raw.trim();\nconst found = clean.includes(${JSON.stringify(query.value)});`);
      values(root,[['raw · 원문',display(raw.value)],['clean · 반환된 문자열',display(clean)],['clean.length',clean.length],['found · 포함 여부',found]]);
      message(root,query.value===''?'빈 문자열은 모든 문자열에 포함된 것으로 판단합니다.':clean===''?'공백을 제외하면 빈 문자열입니다. 원문에 있던 공백이 자동으로 지워진 것은 아닙니다.':'trim은 양끝 공백만 제거한 값을 돌려줍니다. 원문 raw는 그대로입니다.');
    }
    root.addEventListener('input',render);actions(root,a=>{if(a==='reset'){raw.value='  사진 전시  ';query.value='사진';}else if(a==='spaces')raw.value='   ';render();});render();
  });

  document.querySelectorAll('[data-foundation="property"]').forEach(root=>{
    const artwork={title:'숲',year:2026},key=q(root,'[data-f-key]');
    function render(){
      source(root,`const artwork = {\n  title: "숲",\n  year: 2026\n};\nconst key = "${key.value}";\nconsole.log(artwork[key]);`,key.value==='title'?1:key.value==='year'?2:5);
      values(root,[['key의 값',display(key.value)],['artwork[key]',display(artwork[key.value])],['artwork.key',display(artwork.key)],['읽은 값의 typeof',typeof artwork[key.value]]]);
      message(root,key.value==='missing'?'이 객체에는 missing 속성이 없습니다. 속성을 읽은 결과는 undefined입니다.':`대괄호 안의 key를 읽어 "${key.value}" 속성을 찾았습니다. artwork.key는 별도로 key라는 이름을 찾습니다.`);
    }
    key.addEventListener('change',render);actions(root,()=>{key.value='title';render();});render();
  });

  document.querySelectorAll('[data-foundation="path"]').forEach(root=>{
    const questions=[{text:'관람 방식',options:[{text:'공간 둘러보기',type:'walk'},{text:'작품 자세히 보기',type:'look'}]},
      {text:'남길 기록',options:[{text:'전체 동선',type:'walk'},{text:'한 장면',type:'look'}]}];
    const qi=q(root,'[data-f-question]'),oi=q(root,'[data-f-option]');
    function render(){
      const i=Number(qi.value),j=Number(oi.value),question=questions[i];
      source(root,`// questions: 오른쪽의 질문 목록\nconst questionIndex = ${i};\nconst optionIndex = ${j};\nconst question = questions[questionIndex];\nconst option = question.options[optionIndex];\nconst type = option.type;`,question?5:4);
      const path=q(root,'[data-f-path]');path.replaceChildren();
      const rows=[['questions','질문 2개 · [0] 관람 방식 / [1] 남길 기록'],[`questions[${i}]`,question?question.text:'undefined · 이 위치에 질문 없음']];
      if(question){rows.push(['.options',question.options.map((x,n)=>`[${n}] ${x.text}`).join(' / ')],[`[${j}].type`,question.options[j].type]);}
      else rows.push(['.options','여기서 중단 · undefined의 속성을 읽을 수 없음']);
      rows.forEach(([label,text],index)=>{const li=document.createElement('li'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=label;span.textContent=text;li.append(strong,span);li.classList.toggle('is-current',index===rows.length-1);path.append(li);});
      values(root,[['마지막 결과',question?display(question.options[j].type):'TypeError'],['인덱스의 시작',0]]);
      message(root,question?'배열의 인덱스 → 객체의 속성 → 다시 배열의 인덱스 → 객체의 속성 순서입니다.':'questions[2]까지는 undefined를 읽습니다. 그 다음 .options를 읽으려 하면 오류가 납니다.');
    }
    qi.addEventListener('change',render);oi.addEventListener('change',render);actions(root,()=>{qi.value='0';oi.value='1';render();});render();
  });

  document.querySelectorAll('[data-foundation="random"]').forEach(root=>{
    const options=['쉬는 시간','여행','전시 관람'],slider=q(root,'[data-f-r]'),size=q(root,'[data-f-size]');let r=0.5,drawn=false;
    function render(){
      const items=options.slice(0,Number(size.value)),product=r*items.length,index=items.length?Math.floor(product):null;
      source(root,`const topics = ${JSON.stringify(items)};\nconst r = ${r}; // ${drawn?'Math.random()으로 얻은 값':'직접 정한 값'}\nif (topics.length > 0) {\n  const index = Math.floor(r * topics.length);\n  console.log(topics[index]);\n}`);
      const holder=q(root,'[data-f-array]');holder.replaceChildren();
      items.forEach((item,i)=>{const box=document.createElement('div');box.textContent=`[${i}] ${item}${i===index?' · 선택':''}`;box.classList.toggle('is-current',i===index);holder.append(box);});
      if(!items.length)holder.textContent='[] · 고를 항목이 없습니다.';
      values(root,[['r · 0 이상 1 미만',r],['r × length',product],['floor · 인덱스',index===null?'계산하지 않음':index],['선택 결과',index===null?'없음':items[index]]]);
      message(root,!items.length?'빈 배열에서는 인덱스 계산과 항목 선택을 하지 않습니다.':`항목 ${items.length}개 → 인덱스 0~${items.length-1}. ${drawn?'다시 뽑아도 같은 항목이 나올 수 있습니다.':'슬라이더 값을 바꿔 구간별 결과를 비교합니다.'}`);
    }
    slider.addEventListener('input',()=>{r=Number(slider.value);drawn=false;render();});size.addEventListener('change',render);
    actions(root,a=>{if(a==='draw'){r=Math.random();drawn=true;slider.value=String(r);}else{r=0.5;slider.value='0.5';size.value='3';drawn=false;}render();});render();
  });

  document.querySelectorAll('[data-foundation="debugger"]').forEach(root=>{
    const input=q(root,'[data-f-raw]'),fix=q(root,'[data-f-fix]'),next=q(root,'[data-f-action="next"]');let step=0;
    function render(){
      const raw=input.value,quantity=fix.value==='number'?Number(raw):raw,total=quantity+1;
      const program=`const raw = "${raw}";\nconst quantity = ${fix.value==='number'?'Number(raw)':'raw'};\nconst total = quantity + 1;\nconsole.log(total);`;
      source(root,program,step===2?2:step===3?3:-1,step>0?2:-1);
      values(root,[['raw',step>=2?display(raw):'아직 실행 전'],['quantity · 값과 자료형',step>=2?display(quantity)+' · '+typeof quantity:'아직 실행 전'],['total',step>=3?display(total):step===2?'초기화 전':'아직 실행 전']]);
      q(root,'[data-f-output]').textContent=step===4?String(total):'아직 출력 없음';
      next.textContent=['1 · 3번 줄에 중단점 설정','2 · 실행해 중단점까지','3 · 한 줄 실행 (Step over)','4 · 계속 (Resume)','실행 완료'][step];next.disabled=step===4;
      const messages=['3번 줄의 계산 전에 멈추도록 설정합니다.','중단점만 설정했습니다. 코드는 아직 실행하지 않았습니다.',`3번 줄 실행 전입니다. quantity의 자료형은 ${typeof quantity}입니다. total은 아직 계산하지 않았습니다.`,typeof quantity==='string'?`문자열 ${display(quantity)}에 1을 이어 붙여 ${display(total)}이 됐습니다. 마지막 출력 줄은 아직 실행 전입니다.`:`숫자 ${quantity}에 1을 더해 ${total}이 됐습니다. 마지막 출력 줄은 아직 실행 전입니다.`,`출력 완료: ${display(total)}. ${typeof quantity==='string'?'Number로 변환하도록 바꾸어 비교합니다.':'문자열을 숫자로 변환한 뒤 계산했습니다.'}`];
      message(root,messages[step]);
    }
    [input,fix].forEach(el=>el.addEventListener('change',()=>{step=0;render();}));
    actions(root,a=>{if(a==='reset'){step=0;input.value='2';fix.value='text';}else step=Math.min(4,step+1);render();});render();
  });
  document.querySelectorAll('[data-foundation="binding-first"]').forEach(root => {
    const initial = q(root, '[data-f-initial]');
    let step = 0;
    function render() {
      const start = Number(initial.value);
      let count = start;
      const snapshots = [{value:null, output:''}, {value:count, output:''}];
      count = count + 1;
      snapshots.push({value:count, output:''}, {value:count, output:String(count)});
      const now = snapshots[step];
      source(root, `let count = ${start};\ncount = count + 1;\nconsole.log(count);`, step - 1);
      values(root, [['실행한 문장', step + ' / 3'], ['count의 현재 값', now.value === null ? '선언문 실행 전' : now.value]]);
      q(root, '[data-f-output]').textContent = now.output || '아직 출력 없음';
      const explanations = [
        '아직 문장을 실행하지 않았습니다. 다음 문장을 눌러 시작합니다.',
        `count라는 변수를 선언하면서 ${start}로 초기화했습니다.`,
        `오른쪽의 ${start} + 1을 먼저 계산하고 ${start + 1}을 count에 다시 대입했습니다.`,
        `count의 현재 값 ${start + 1}을 출력했습니다. 출력한다고 값이 바뀌지는 않습니다.`
      ];
      message(root, explanations[step]);
      q(root, '[data-f-action="prev"]').disabled = step === 0;
      q(root, '[data-f-action="next"]').disabled = step === 3;
      window.CourseSyntax?.highlight(q(root, '[data-f-code]').parentElement);
    }
    initial.addEventListener('change', () => {step = 0; render();});
    actions(root, action => {
      if (action === 'next') step = Math.min(3, step + 1);
      else if (action === 'prev') step = Math.max(0, step - 1);
      else {step = 0; initial.value = '1';}
      render();
    });
    render();
  });

  document.querySelectorAll('[data-foundation="scope-boundaries"]').forEach(root => {
    const declaration = q(root, '[data-f-declaration]');
    const position = q(root, '[data-f-position]');
    const output = q(root, '[data-f-output]');
    const labels = {block:'if 블록 안', function:'if 블록 밖 · 함수 안', outer:'함수 밖'};
    let pending = null, objectURL = null, timer = null, generation = 0;
    function clean() {
      if (pending) pending.terminate();
      if (objectURL) URL.revokeObjectURL(objectURL);
      clearTimeout(timer); pending = null; objectURL = null; timer = null;
    }
    function render() {
      clean(); const request = ++generation;
      const kind = ['let','const','var'].includes(declaration.value) ? declaration.value : 'let';
      const place = Object.hasOwn(labels, position.value) ? position.value : 'block';
      const lines = ['function checkScope() {', '  if (true) {', `    ${kind} count = 2;`];
      if (place === 'block') lines.push('    console.log(count);');
      lines.push('  }');
      if (place === 'function') lines.push('  console.log(count);');
      lines.push('}', 'checkScope();');
      if (place === 'outer') lines.push('console.log(count);');
      const program = lines.join('\n');
      source(root, program, lines.findIndex(line => line.includes('console.log')));
      q(root, '[data-f-location]').textContent = '값을 읽는 위치: ' + labels[place];
      root.querySelectorAll('[data-f-zone]').forEach(zone => {
        const active = zone.dataset.fZone === place;
        zone.classList.toggle('is-current', active);
        if (active) zone.setAttribute('aria-current','true'); else zone.removeAttribute('aria-current');
      });
      output.textContent = '실행 중…';
      message(root, '선택한 코드를 독립된 실행 환경에서 실행합니다.');
      window.CourseSyntax?.highlight(q(root, '[data-f-code]').parentElement);
      // Only three fixed keywords and locations are accepted; no user code is injected.
      const runner = '"use strict";\nconst messages = [];\nconst console = {log(value) { messages.push(String(value)); }};\nlet failure = null;\ntry {\n' + program + '\n} catch (error) { failure = error.name; }\nself.postMessage({messages, failure});';
      try {
        objectURL = URL.createObjectURL(new Blob([runner], {type:'text/javascript'}));
        pending = new Worker(objectURL);
        pending.onmessage = event => {
          if (generation !== request) return;
          const result = event.data;
          output.textContent = result.failure ? result.failure : result.messages.join('\n');
          const explanation = result.failure
            ? `${labels[place]}에서는 count라는 이름을 찾을 수 없어 ReferenceError가 발생했습니다.`
            : kind === 'var' && place === 'function'
              ? 'var는 if 블록에 제한되지 않아 같은 함수 안에서 2를 읽습니다.'
              : `${kind}로 선언한 count를 선언한 블록 안에서 읽어 2를 출력했습니다.`;
          message(root, explanation); clean();
        };
        pending.onerror = event => {
          if (generation !== request) return;
          event.preventDefault(); output.textContent = '실행 환경 오류';
          message(root, '아래 코드 실험실에서 같은 예제를 실행할 수 있습니다.'); clean();
        };
        timer = setTimeout(() => {
          if (generation !== request) return;
          output.textContent = '실행 시간 초과'; message(root, '처음 상태로 되돌린 뒤 다시 선택합니다.'); clean();
        }, 2500);
      } catch (error) {
        output.textContent = '실행 환경을 열 수 없습니다.';
        message(root, '아래 코드 실험실에서 같은 예제를 실행할 수 있습니다.'); clean();
      }
    }
    declaration.addEventListener('change', render); position.addEventListener('change', render);
    actions(root, () => {declaration.value = 'let'; position.value = 'block'; render();});
    addEventListener('pagehide', clean);
    render();
  });

  // Three primitive values, before the complete type catalogue.
  document.querySelectorAll('[data-foundation="primitive-first"]').forEach(root => {
    const kind=q(root,'[data-f-kind]');
    const choices={number:2,string:'2',boolean:true};
    let revealed=false;
    function render(){
      const value=choices[kind.value],literal=JSON.stringify(value);
      source(root,`const value = ${literal};\nconsole.log(value);\nconsole.log(typeof value);`);
      values(root,[['코드에 적은 값',literal],['console.log(value)',revealed?String(value):'결과 확인 전'],['typeof value',revealed?typeof value:'결과 확인 전']]);
      message(root, revealed ? (kind.value==='string'?'따옴표는 문자열의 경계입니다. 출력된 2는 숫자처럼 보이지만 자료형은 string입니다.':kind.value==='number'?'출력은 2, 자료형은 number입니다. 문자열 "2"를 선택해 비교합니다.':'true는 참을 나타내는 불리언입니다. 따옴표를 붙인 "true"와는 다른 자료형입니다.'):'값의 종류를 예상한 뒤 결과 확인을 누릅니다. 선택을 바꾸면 이전 결과를 지웁니다.');
      q(root,'[data-f-action="reveal"]').disabled=revealed;
    }
    kind.addEventListener('change',()=>{revealed=false;render();});
    actions(root, action=>{
      if(action==='reset'){kind.value='number';revealed=false;}
      if(action==='reveal')revealed=true;
      render();
    });render();
  });

  // Trace the displayed, bounded for-loop; arbitrary lab edits are separate.
  document.querySelectorAll('[data-foundation="loop-first"]').forEach(root=>{
    const limitSelect=q(root,'[data-f-limit]');
    let position=0,trace=[];
    function build(){
      const limit=Number(limitSelect.value),logs=[];
      trace=[];
      const record=(phase,count,line,text)=>trace.push({phase,count,line,text,logs:[...logs]});
      record('ready',null,-1,'반복문 실행 전입니다. 다음 단계로 시작 값을 정합니다.');
      function initialize(){record('init',1,1,'count를 1로 시작합니다. 시작 부분은 한 번 실행합니다.');return 1;}
      function test(count){const ok=count<=limit;record('test',count,2,`${count} <= ${limit}는 ${ok}입니다. ${ok?'본문으로 이동합니다.':'본문을 실행하지 않고 반복을 끝냅니다.'}`);return ok;}
      function update(count){const next=count+1;record('update',next,3,`count를 ${next}로 갱신했습니다. 다시 조건을 검사합니다.`);return next;}
      for(let count=initialize();test(count);count=update(count)){
        logs.push(count);record('body',count,5,`출력값은 ${count}입니다. 이제 갱신 부분으로 이동합니다.`);
      }
      record('end',null,6,'반복이 끝났습니다. 이 반복문 안에서 선언한 count의 범위도 끝났습니다.');
      position=0;render();
    }
    function render(){
      const item=trace[position],limit=limitSelect.value;
      source(root,`for (\n  let count = 1;\n  count <= ${limit};\n  count = count + 1\n) {\n  console.log(count);\n}`,item.line);
      const phases=q(root,'[data-f-phases]');phases.replaceChildren();
      [['init','시작 · 한 번'],['test','조건 검사'],['body','출력 본문'],['update','1 증가 후 조건으로'],['end','반복 종료']].forEach(([key,label])=>{
        const li=document.createElement('li');li.textContent=label;
        if(key===item.phase){li.dataset.state='current';li.setAttribute('aria-current','step');}
        phases.append(li);
      });
      values(root,[['현재 count',item.count===null?(item.phase==='end'?'범위 끝':'선언 전'):item.count],['본문 실행 횟수',item.logs.length]]);
      q(root,'[data-f-output]').textContent=item.logs.length?item.logs.join('\n'):'아직 출력 없음';
      message(root,item.text);
      q(root,'[data-f-action="prev"]').disabled=position===0;
      q(root,'[data-f-action="next"]').disabled=position===trace.length-1;
      root.dataset.traceStep=String(position);root.dataset.traceCount=String(trace.length);
    }
    limitSelect.addEventListener('change',build);
    actions(root,action=>{
      if(action==='reset'){limitSelect.value='3';build();return;}
      if(action==='next')position=Math.min(position+1,trace.length-1);
      if(action==='prev')position=Math.max(0,position-1);
      render();
    });build();
  });

  // Final audit: Boolean combinations, function return/output, and quiz screens.
  document.querySelectorAll('[data-foundation="boolean-conditions"]').forEach(root => {
    const first=q(root,'[data-f-a]'),second=q(root,'[data-f-b]'),operation=q(root,'[data-f-operator]');
    function render() {
      const a=first.value==='true',b=second.value==='true',op=operation.value;
      let result,expression,explanation;
      if(op==='and') { result=a&&b;expression='a && b';explanation='두 조건이 모두 true일 때만 true입니다.'; }
      else if(op==='or') { result=a||b;expression='a || b';explanation='둘 중 하나 이상 true이면 true입니다. 둘 다 true여도 포함합니다.'; }
      else { result=!a;expression='!a';explanation='A의 참·거짓을 뒤집습니다. 이 식에서 B는 사용하지 않습니다.'; }
      source(root,`const a = ${a}; // 시간이 있음\nconst b = ${b}; // 관심이 있음\nconst allowed = ${expression};\nconsole.log(allowed);`,2);
      q(root,'[data-f-operands]').textContent=`A = ${a}\nB = ${b}${op==='not'?' · 미사용':''}`;
      q(root,'[data-f-gate]').textContent=op==='and'?'&& · AND':op==='or'?'|| · OR':'! · NOT';
      const output=q(root,'[data-f-answer]');output.textContent=String(result);output.dataset.value=String(result);
      message(root,`${expression} → ${result}. ${explanation}`);
    }
    [first,second,operation].forEach(control=>control.addEventListener('change',render));
    actions(root,action=>{if(action==='reset'){first.value='true';second.value='false';operation.value='and';render();}});
    render();
  });

  document.querySelectorAll('[data-foundation="return-or-log"]').forEach(root=>{
    const mode=q(root,'[data-f-mode]');let called=false,result,logs=[];
    function render(){
      const body=mode.value==='log'?'  console.log(value * 2);':mode.value==='both'?'  console.log(value * 2);\n  return value * 2;':'  return value * 2;';
      source(root,`function double(value) {\n${body}\n}\n\nconst result = double(3);`,called?body.split('\n').length+3:-1);
      values(root,[['result에 저장된 반환값',called?display(result):'호출 전'],['반환값의 typeof',called?typeof result:'호출 전']]);
      q(root,'[data-f-output]').textContent=logs.length?logs.map(display).join('\n'):called?'출력 없음':'출력 없음 · 호출 전';
      message(root,!called?'본문을 선택한 뒤 double(3)을 호출합니다.':mode.value==='log'?'Console에는 6이 출력되지만, return 없이 끝나므로 result에는 undefined가 저장됩니다.':mode.value==='both'?'Console에 6을 출력하고, 별도로 6을 반환해 result에 저장합니다.':'6을 반환해 result에 저장했습니다. console.log가 없으므로 Console에는 출력하지 않습니다.');
    }
    function call(){
      logs=[];
      // A local console records actual log calls without replacing the page console.
      const console={log(value){logs.push(value);}};
      const functions={
        return:function double(value){return value*2;},
        log:function double(value){console.log(value*2);},
        both:function double(value){console.log(value*2);return value*2;}
      };
      result=functions[mode.value](3);called=true;render();
    }
    mode.addEventListener('change',()=>{called=false;result=undefined;logs=[];render();});
    actions(root,action=>{if(action==='call')call();else if(action==='reset'){mode.value='return';called=false;result=undefined;logs=[];render();}});
    render();
  });

  document.querySelectorAll('[data-foundation="quiz-screen-flow"]').forEach(root=>{
    const questions=JSON.parse(root.dataset.fQuestions);
    const resultTitles={walk:'공간을 연결하는 감상',look:'한 장면에 머무는 감상'};
    let questionIndex=0,scores={walk:0,look:0},screen='start',lastType=null;
    const start=q(root,'[data-f-action="start"]'),preview=q(root,'[data-f-preview]');
    function render(){
      root.dataset.screen=screen;
      root.querySelectorAll('[data-f-screen]').forEach(item=>{
        const active=item.dataset.fScreen===screen;item.classList.toggle('is-current',active);
        if(active)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
      });
      const answers=q(root,'[data-f-answers]');answers.replaceChildren();
      start.textContent=screen==='start'?'테스트 시작':'다시 시작 (0점)';
      values(root,[['questionIndex · 0부터',questionIndex],['questions.length · 질문 수',questions.length],['scores.walk · 공간',scores.walk],['scores.look · 장면',scores.look]]);
      let title,description;
      if(screen==='start'){
        title='나의 전시 감상 방식';description='세 질문에 답하면 선택한 유형의 점수를 합산합니다.';
        source(root,'let questionIndex = 0;\nlet scores = { walk: 0, look: 0 };\n// 시작 버튼에 startQuiz를 연결합니다.');
        message(root,'아직 질문을 표시하지 않았습니다. 테스트 시작을 누르면 0번째 질문부터 보여 줍니다.');
      }else{
        if(lastType===null){
          source(root,'function startQuiz() {\n  questionIndex = 0;\n  scores = { walk: 0, look: 0 };\n  startScreen.hidden = true;\n  resultScreen.hidden = true;\n  questionScreen.hidden = false;\n  showQuestion();\n}',6);
          message(root,'startQuiz() → showQuestion(). 위치와 점수를 초기화하고 첫 질문을 표시했습니다.');
        }else{
          source(root,'function selectAnswer(type) {\n  scores[type] = scores[type] + 1;\n  questionIndex = questionIndex + 1;\n  if (questionIndex < questions.length) {\n    showQuestion();\n  } else {\n    showResult();\n  }\n}',screen==='question'?4:6);
          message(root,`선택한 type: "${lastType}" → 점수 +1, 위치 +1. ${questionIndex} < ${questions.length} → ${questionIndex<questions.length}. ${screen==='question'?'showQuestion()으로 다음 질문을 표시합니다.':'showResult()로 이동합니다. questions[3]은 읽지 않습니다.'}`);
        }
        if(screen==='question'){
          const question=questions[questionIndex];title=question.text;description=`${questionIndex+1} / ${questions.length}번째 질문 · 아래 선택지에서 하나를 고릅니다.`;
          question.options.forEach(option=>{
            const button=document.createElement('button');button.type='button';button.textContent=option.text;button.dataset.fType=option.type;
            button.addEventListener('click',()=>selectAnswer(option.type));answers.append(button);
          });
        }else{
          let resultType='walk';if(scores.look>scores.walk)resultType='look';
          title=resultTitles[resultType];description=`${questions.length}개 응답 완료 · 다시 시작하면 점수와 위치를 모두 초기화합니다.`;
        }
      }
      q(root,'[data-f-title]').textContent=title;q(root,'[data-f-description]').textContent=description;
    }
    function startQuiz(){questionIndex=0;scores={walk:0,look:0};screen='question';lastType=null;render();preview.focus({preventScroll:true});}
    function selectAnswer(type){
      if(screen!=='question'||!questions[questionIndex].options.some(option=>option.type===type))return;
      scores[type]=scores[type]+1;questionIndex=questionIndex+1;lastType=type;
      if(questionIndex<questions.length)screen='question';else screen='result';
      render();preview.focus({preventScroll:true});
    }
    actions(root,action=>{
      if(action==='start')startQuiz();
      else if(action==='reset'){questionIndex=0;scores={walk:0,look:0};screen='start';lastType=null;render();}
    });
    render();
  });

})();