/* Concept explorers: fixed teaching programs with real values and reversible steps. */
(() => {
  'use strict';
  const one = (root, selector) => root.querySelector(selector);
  const all = (root, selector) => [...root.querySelectorAll(selector)];
  const show = value => typeof value === 'string' ? JSON.stringify(value) :
    value === undefined ? 'undefined' : typeof value === 'number' ? String(value) : JSON.stringify(value);
  function values(root, entries) {
    const holder = one(root, '[data-d-values]');
    holder.replaceChildren();
    for (const [label, value] of entries) {
      const box = document.createElement('div');
      const title = document.createElement('span');
      const output = document.createElement('output');
      title.textContent = label; output.textContent = String(value);
      box.append(title, output); holder.append(box);
    }
  }
  function lines(root, source, current = -1) {
    const code = one(root, '[data-d-code]');
    code.replaceChildren();
    source.split('\n').forEach((line, i) => {
      const span = document.createElement('span');
      span.className = 'concept-code-line';
      span.classList.toggle('is-current', i === current);
      if (i === current) span.setAttribute('aria-current', 'step');
      span.textContent = line || ' '; code.append(span);
    });
  }
  function steps(root, rows) {
    const holder = one(root, '[data-d-steps]'); holder.replaceChildren();
    for (const row of rows) {
      const li = document.createElement('li');
      li.textContent = row[0];li.dataset.state = row[1] || '';
      holder.append(li);
    }
  }
  const status = (root, text) => {one(root, '[data-d-status]').textContent = text;};
  function action(root, callback) {
    root.addEventListener('click', event => {
      const b = event.target.closest('[data-d-action]');
      if (b && root.contains(b)) callback(b.dataset.dAction);
    });
  }
  function nav(root, n, last) {
    const prev=one(root,'[data-d-action="prev"]'),next=one(root,'[data-d-action="next"]');
    if(prev)prev.disabled=n===0;if(next)next.disabled=n>=last;
  }

  document.querySelectorAll('[data-deep="expression"]').forEach(root => {
    let step=0;const mode=one(root,'[data-d-mode]');
    function render(){
      const grouped=mode.value==='group';
      const result=grouped?(3000+500)*2:3000+500*2;
      const expressions=grouped?['(3000 + 500) * 2',`${3000+500} * 2`,String(result)]:
        ['3000 + 500 * 2',`3000 + ${500*2}`,String(result)];
      lines(root,'const total = '+expressions[0]+';',0);
      steps(root,expressions.map((x,i)=>[i>step?'아직 계산하지 않음':x,i===step?'current':i<step?'done':'waiting']));
      status(root,['실행 전: 어느 부분을 먼저 계산할까요?',grouped?'괄호 안의 합을 먼저 구했습니다.':'곱셈을 먼저 계산했습니다.',`표현식의 결과 ${result}을 total에 대입합니다.`][step]);
      nav(root,step,2);
    }
    mode.addEventListener('change',()=>{step=0;render()});
    action(root,a=>{if(a==='reset'){mode.value='normal';step=0}else step=Math.max(0,Math.min(2,step+(a==='next'?1:-1)));render()});render();
  });

  document.querySelectorAll('[data-deep="snapshot"]').forEach(root=>{
    let step=0;const source=one(root,'[data-d-code]').textContent;
    function render(){
      let price,quantity,total;
      if(step>=1)price=3000;
      if(step>=2)quantity=2;
      if(step>=3)total=price*quantity;
      if(step>=4)quantity=3;
      if(step>=5)total=price*quantity;
      lines(root,source,step-1);
      values(root,[['price',step>=1?price:'선언 전'],['quantity',step>=2?quantity:'선언 전'],['total',step>=3?total:'선언 전']]);
      status(root,['아직 문장을 실행하지 않았습니다.','price를 3000으로 정했습니다.','quantity를 2로 정했습니다.','현재 수량 2로 합계 6000을 계산했습니다.','quantity만 3으로 바뀌었습니다. total은 이전 계산 결과 6000입니다.','계산문을 다시 실행해 total이 9000이 되었습니다.'][step]);
      nav(root,step,5);
    }
    action(root,a=>{step=a==='reset'?0:Math.max(0,Math.min(5,step+(a==='next'?1:-1)));render()});render();
  });

  document.querySelectorAll('[data-deep="number-check"]').forEach(root=>{
    const input=one(root,'[data-d-raw]');
    function render(){
      const raw=input.value,quantity=Number(raw);
      const passed=[raw.trim()!=='',Number.isFinite(quantity),Number.isInteger(quantity),quantity>=1&&quantity<=5];
      const fail=passed.findIndex(x=>!x);
      values(root,[['input.value',JSON.stringify(raw)],['Number(raw)',show(quantity)],['typeof 변환 결과',typeof quantity]]);
      steps(root,['빈 값이 아닌가?','유한한 숫자인가?','정수인가?','1~5 사이인가?'].map((label,i)=>[
        label+' → '+(fail>=0&&i>fail?'이후 검사 생략':passed[i]?'통과':'실패'),fail>=0&&i>fail?'waiting':passed[i]?'done':'failed']));
      status(root,fail===-1?`검사 통과: ${quantity} × 3000 = ${quantity*3000}원`:'계산하지 않습니다. '+['값을 입력하세요.','숫자로 입력하세요.','정수로 입력하세요.','1~5 사이의 수량을 입력하세요.'][fail]);
    }
    input.addEventListener('input',render);action(root,a=>{if(a==='reset')input.value='2';else if(a.startsWith('input:'))input.value=a.slice(6);render()});render();
  });

  document.querySelectorAll('[data-deep="short-circuit"]').forEach(root=>{
    const leftSelect=one(root,'[data-d-left]'),op=one(root,'[data-d-op]');
    const available={false:false,true:true,zero:0,string:'0',null:null};
    function render(){
      const left=available[leftSelect.value];let calls=0;
      function readRight(){calls=calls+1;return '오른쪽 값'}
      let result;
      if(op.value==='&&')result=left&&readRight();
      else if(op.value==='||')result=left||readRight();
      else result=left??readRight();
      lines(root,`const left = ${show(left)};\nlet calls = 0;\nfunction readRight() {\n  calls = calls + 1;\n  return "오른쪽 값";\n}\nconst result = left ${op.value} readRight();`,calls?3:6);
      values(root,[['최종 반환값',show(result)],['오른쪽 함수 호출 횟수',calls],['반환값의 종류',typeof result]]);
      steps(root,[[`왼쪽 값: ${show(left)}`,'done'],[calls?'오른쪽 함수를 호출함':'오른쪽 함수를 건너뜀',calls?'current':'waiting'],[`반환: ${show(result)}`,'done']]);
      status(root,op.value==='??'?'??는 null·undefined인 경우에만 오른쪽을 평가합니다.':`왼쪽의 Boolean 변환은 ${Boolean(left)}입니다. 결과는 반드시 Boolean인 것은 아닙니다.`);
    }
    leftSelect.addEventListener('change',render);op.addEventListener('change',render);
    action(root,a=>{if(a==='reset'){leftSelect.value='false';op.value='&&';render()}});render();
  });

  document.querySelectorAll('[data-deep="calls"]').forEach(root=>{
    let step=0;const input=one(root,'[data-d-count]');
    function render(){
      const count=Number(input.value);
      function multiply(price,count){return price*count}
      function checkout(count){const subtotal=multiply(3000,count);return subtotal+500}
      const subtotal=multiply(3000,count),total=checkout(count);
      const stack=[step===0?'바깥 코드 · 함수 정의 완료':step>=6?'바깥 코드 · 호출 결과를 받음':'바깥 코드 · 호출 결과를 기다림'];
      if(step>=1&&step<=5)stack.push(`checkout(count=${count})`);
      if(step>=2&&step<=3)stack.push(`multiply(price=3000, count=${count})`);
      const holder=one(root,'[data-d-stack]');holder.replaceChildren();
      stack.forEach((text,i)=>{const li=document.createElement('li');li.textContent=text;li.classList.toggle('is-current',i===stack.length-1);holder.prepend(li)});
      values(root,[['checkout의 subtotal',step>=4?subtotal:'아직 대입 전'],['바깥 total',step>=6?total:'아직 대입 전'],['Console',step>=7?total:'출력 전']]);
      lines(root,`function multiply(price, count) {\n  return price * count;\n}\nfunction checkout(count) {\n  const subtotal = multiply(3000, count);\n  return subtotal + 500;\n}\nconst total = checkout(${count});\nconsole.log(total);`,[-1,7,4,1,4,5,7,8][step]);
      status(root,['함수는 정의되었지만 아직 호출하지 않았습니다.','checkout을 호출하고 매개변수 count에 인수를 전달합니다.','multiply를 호출합니다. checkout의 나머지 계산은 기다립니다.',`${subtotal}을 반환하고 multiply를 끝냅니다.`,`checkout으로 돌아와 subtotal에 ${subtotal}을 대입합니다.`,`${total}을 반환하고 checkout을 끝냅니다.`,`호출한 자리로 돌아와 total에 ${total}을 대입합니다.`,`Console에 ${total}을 출력합니다.`][step]);
      nav(root,step,7);
    }
    input.addEventListener('change',()=>{step=0;render()});
    action(root,a=>{if(a==='reset'){input.value='2';step=0}else step=Math.max(0,Math.min(7,step+(a==='next'?1:-1)));render()});render();
  });

  document.querySelectorAll('[data-deep="references"]').forEach(root=>{
    let original,shared,copy,latest,changed;
    function reset(){original={title:'숲'};shared=original;copy={title:original.title};changed=null;latest='두 이름은 객체 A, copy는 별도의 객체 B를 가리킵니다.'}
    function render(){
      const holder=one(root,'[data-d-map]');holder.replaceChildren();
      for(const [names,obj,label] of [['original · shared',original,'객체 A'],['copy',copy,'객체 B']]){
        const row=document.createElement('div');const name=document.createElement('strong');name.textContent=names;
        const arrow=document.createElement('span');arrow.textContent='→';arrow.setAttribute('aria-label','가리킴');
        const box=document.createElement('div');box.textContent=`${label}\ntitle: ${show(obj.title)}`;row.append(name,arrow,box);holder.append(row);
      }
      const program = 'const original = { title: "숲" };\nconst shared = original;\nconst copy = { title: original.title };';
      const changes = [];
      if (original.title !== '숲') changes.push('shared.title = "바다";');
      if (copy.title !== '숲') changes.push('copy.title = "도시";');
      lines(root, program + (changes.length ? '\n' + changes.join('\n') : '\n// 오른쪽 버튼으로 속성을 바꿉니다.'), changed ? 3 + changes.findIndex(line => line.startsWith(changed + '.')) : -1);
      values(root,[['original.title',show(original.title)],['shared.title',show(shared.title)],['copy.title',show(copy.title)],['original === shared',original===shared],['original === copy',original===copy]]);
      status(root,latest);
    }
    action(root,a=>{if(a==='shared'){shared.title='바다';changed='shared';latest='객체 A의 title을 바꾸었습니다. original과 shared에서 같은 값이 읽힙니다.'}else if(a==='copy'){copy.title='도시';changed='copy';latest='별도 객체 B만 바뀌었습니다. 객체 A는 그대로입니다.'}else if(a==='reset')reset();render()});reset();render();
  });

  document.querySelectorAll('[data-deep="state"]').forEach(root=>{
    let count=0;const output=one(root,'[data-d-screen]'),source=one(root,'[data-d-code]').textContent;
    function sync(){one(root,'[data-d-count-value]').textContent=count;status(root,Number(output.textContent)===count?'현재 값과 화면의 표시가 일치합니다.':'값은 바뀌었지만 화면은 이전 표시입니다. 화면에 반영을 누릅니다.');}
    action(root,a=>{if(a==='reset'){count=0;output.textContent='0'}else if(a==='value'){count=count+1}else if(a==='render'){output.textContent=String(count)}else if(a==='both'){count=count+1;output.textContent=String(count)}lines(root,source,a==='value'?5:a==='reset'?0:7);sync()});lines(root,source,0);sync();
  });

  document.querySelectorAll('[data-deep="loop"]').forEach(root=>{
    const list=one(root,'[data-d-list]'),comparison=one(root,'[data-d-condition]');let step=0;
    function timeline(items){
      const states=[{i:0,stage:'init',output:[],message:'i를 0으로 초기화했습니다.'}];
      let i=0,output=[];
      while(true){
        const valid=comparison.value==='less'?i<items.length:i<=items.length;
        states.push({i,stage:'condition',output:[...output],message:`조건은 ${valid}입니다.`});
        if(!valid){states.push({i,stage:'end',output:[...output],message:'조건이 거짓이므로 반복을 끝냅니다.'});break}
        output.push(`i=${i} → ${show(items[i])}`);
        states.push({i,stage:'body',output:[...output],message:i<items.length?'현재 항목을 출력했습니다.':'항목이 없는 위치입니다. undefined가 출력됐습니다.'});
        i=i+1;states.push({i,stage:'update',output:[...output],message:'i를 1 늘리고 조건 검사로 돌아갑니다.'});
      }
      return states;
    }
    function render(){
      const items=list.value==='empty'?[]:['숲','바다','도시'],states=timeline(items);
      step=Math.min(step,states.length-1);const st=states[step],operator=comparison.value==='less'?'<':'<=';
      lines(root,`const items = ${JSON.stringify(items)};\nfor (let i = 0; i ${operator} items.length; i = i + 1) {\n  console.log(items[i]);\n}`,st.stage==='body'?2:st.stage==='end'?-1:1);
      const holder=one(root,'[data-d-array]');holder.replaceChildren();
      items.forEach((value,i)=>{const el=document.createElement('div');el.textContent=`[${i}] ${value}`;el.classList.toggle('is-current',st.i===i);holder.append(el)});
      if(!items.length)holder.textContent='[] · 항목이 없습니다.';
      values(root,[['현재 i',st.i],['items.length',items.length],['실행 단계',st.stage],['현재 위치의 값',show(items[st.i])]]);
      one(root,'[data-d-output]').textContent=st.output.join('\n')||'아직 출력 없음';status(root,st.message);nav(root,step,states.length-1);
    }
    for(const input of [list,comparison])input.addEventListener('change',()=>{step=0;render()});
    action(root,a=>{if(a==='reset'){list.value='three';comparison.value='less';step=0}else step=Math.max(0,step+(a==='next'?1:-1));render()});render();
  });

  document.querySelectorAll('[data-deep="array-methods"]').forEach(root=>{
    const method=one(root,'[data-d-method]'),limit=one(root,'[data-d-limit]');
    const works=[{title:'숲',price:1000},{title:'바다',price:3000},{title:'도시',price:5000}];
    function render(){
      const max=Number(limit.value),log=[];let result,program;
      function affordable(work){return work.price<=max}
      if(method.value==='forEach'){result=works.forEach(function(work){log.push(work.title)});program='const result = works.forEach(function (work) {\n  console.log(work.title);\n});'}
      if(method.value==='map'){result=works.map(function(work){return work.title});program='const result = works.map(function (work) {\n  return work.title;\n});'}
      if(method.value==='filter'){result=works.filter(affordable);program=`const result = works.filter(function (work) {\n  return work.price <= ${max};\n});`}
      if(method.value==='find'){result=works.find(affordable);program=`const result = works.find(function (work) {\n  return work.price <= ${max};\n});`}
      lines(root,'const works = '+JSON.stringify(works,null,2)+';\n\n'+program+'\nconsole.log(result);');
      const holder=one(root,'[data-d-array]');holder.replaceChildren();
      works.forEach(work=>{const el=document.createElement('div');el.textContent=`${work.title} · ${work.price}원`;el.classList.toggle('is-current',method.value==='filter'?result.includes(work):method.value==='find'?result===work:false);holder.append(el)});
      values(root,[['반환 종류',Array.isArray(result)?'배열':result===undefined?'undefined':'객체'],['반환값',show(result)],['원본 항목 수',works.length]]);
      one(root,'[data-d-output]').textContent=(log.length?'각 항목 출력: '+log.join(', ')+'\n':'')+'메서드 반환값: '+show(result);
      status(root,method.value==='forEach'?'각 항목을 출력했지만 forEach의 반환값은 undefined입니다.':method.value==='map'?'세 항목을 각각 제목 문자열로 바꾸어 새 배열을 만들었습니다.':method.value==='filter'?'조건에 맞는 객체를 모은 새 배열입니다. 항목이 없으면 []입니다.':'처음 조건에 맞는 객체 하나입니다. 없으면 undefined입니다.');
      limit.disabled=method.value==='map'||method.value==='forEach';
    }
    method.addEventListener('change',render);limit.addEventListener('change',render);
    action(root,a=>{if(a==='reset'){method.value='forEach';limit.value='3000';render()}});render();
  });

  document.querySelectorAll('[data-deep="quiz"]').forEach(root=>{
    let answers=[];const tie=one(root,'[data-d-tie]');
    function render(){
      const scores={walk:0,look:0};answers.forEach(function(type){scores[type]=scores[type]+1});
      values(root,[['응답 수',`${answers.length} / 2`],['공간 walk',scores.walk],['장면 look',scores.look]]);
      const holder=one(root,'[data-d-answers]');holder.replaceChildren();
      answers.forEach((type,i)=>{const li=document.createElement('li');li.textContent=`질문 ${i+1} → ${type}에 1점`;holder.append(li)});
      if(!answers.length){const li=document.createElement('li');li.textContent='아직 응답 없음';holder.append(li)}
      one(root,'[data-d-question]').textContent=['1. 전시에 들어서면 무엇을 먼저 보나요?','2. 전시를 보고 무엇이 기억에 남나요?','두 질문에 모두 응답했습니다.'][answers.length];
      let result='다음 선택을 기다립니다.';
      if(answers.length===2){
        if(scores.walk>scores.look)result='결과: 공간·동선';
        else if(scores.look>scores.walk)result='결과: 한 작품·장면';
        else result=tie.value==='both'?'동점: 두 감상 방식을 함께 표시합니다.':tie.value==='walk'?'동점 규칙에 따라 공간·동선 결과를 표시합니다.':'동점 규칙에 따라 한 작품·장면 결과를 표시합니다.';
      }
      status(root,result);
      lines(root,`const answers = ${JSON.stringify(answers)};\nconst scores = { walk: 0, look: 0 };\nanswers.forEach(function (type) {\n  scores[type] = scores[type] + 1;\n});\n// 현재 점수: walk ${scores.walk}, look ${scores.look}`);
      for(const key of ['walk','look'])one(root,`[data-d-action="${key}"]`).disabled=answers.length>=2;
      one(root,'[data-d-action="undo"]').disabled=!answers.length;
    }
    tie.addEventListener('change',render);action(root,a=>{if(a==='reset'){answers=[];tie.value='both'}else if(a==='undo')answers.pop();else if(['walk','look'].includes(a)&&answers.length<2)answers.push(a);render()});render();
  });
})();
