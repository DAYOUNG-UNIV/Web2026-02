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
})();