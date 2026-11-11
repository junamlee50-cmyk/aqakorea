(function(root){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const states={queued:'미전송',dispatching:'전송 중 · 결과 확인 필요',accepted:'인쇄 대기열 전송 완료',simulated:'모의 출력 완료',failed:'전송 실패',unknown:'결과 확인 필요'};
  const defaults={stationId:'DESK-1',printerName:'SIMULATOR',testMode:true,config:{layout:'buyeo-v1',transport:'simulation',dpi:203,rotation:0,offsetX:0,offsetY:0,mediaConfirmed:false}};
  let engine,container,connection;
  async function fetchJSON(url,options={}){
    const r=await fetch(url,{...options,signal:AbortSignal.timeout(40000),cache:'no-store'});
    const j=await r.json();if(!r.ok || j.success===false)throw Error(j.error||`연결 오류 (${r.status})`);return j.data??j;
  }
  const demo=()=>root.location.pathname.startsWith('/demo') || root.AMK_LOCAL_DEMO===true;
  const settings=()=>JSON.parse(localStorage.getItem('amk-desk-settings')||JSON.stringify(defaults));
  const token=()=>sessionStorage.getItem('amk-bridge-token')||'';
  async function bridgeCall(path,body){
    return fetchJSON('http://127.0.0.1:17864'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-AMK-Token':token()},...(body?{body:JSON.stringify(body)}:{})});
  }
  const bridge={
    async preflight(name){const d=await bridgeCall('/api/printers');if(!d.printers.some(p=>p.name===name && p.available))throw Error('선택한 프린터가 없거나 오프라인입니다. Windows 프린터 설정을 확인해 주세요.');},
    async print(job){const png=root.WristbandLayout.portrait(job.person,job.config).toDataURL('image/png');return bridgeCall('/api/print',{...job,png});}
  };
  function api(path,body){
    const headers={'Content-Type':'application/json'};
    if(demo())headers['X-AMK-Token']=token();else headers.Authorization='Bearer '+(localStorage.getItem('amk_admin_token')||'');
    return fetchJSON((demo()?'/demo-api':'/api/issuance')+path,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{})});
  }
  const el=id=>container?.querySelector('#'+id);
  function message(text,bad=false){if(el('wd-message')){el('wd-message').textContent=text;el('wd-message').className=bad?'wd-alert error':'wd-alert';}}
  async function action(fn){try{await fn();}catch(e){message(e.message,true);}finally{if(el('wd-scan') && !engine?.busy)el('wd-scan').focus();}}
  function renderJob(job){
    if(!el('wd-result'))return;
    const s=settings(), own=job.stationId===s.stationId && job.printerName===s.printerName;
    el('wd-result').innerHTML=`<h2>${esc(job.items[0]?.person.reservationNo)} · ${job.testMode?'시험':'실제'} 발권</h2>
      <p>${esc(job.stationId)} / ${esc(job.printerName)} · 인쇄 대기열 전송은 실물 출력 확인과 다릅니다.</p>
      <div class="wd-scroll"><table><thead><tr><th>순번</th><th>권종 / 성명</th><th>상태</th><th>조치</th></tr></thead><tbody>${job.items.map((i,n)=>`<tr><td>${i.person.sequence}/${i.person.total}</td><td>${esc(root.WristbandLayout.labels[i.person.type])} ${esc(i.person.name)}</td><td>${i.current?esc(states[i.state]||i.state):'새 출력 작업으로 대체됨'}</td><td>${i.current && i.state!=='queued'?`<button type="button" data-reprint="${n}">재출력 검토</button>`:''}</td></tr>`).join('')}</tbody></table></div>
      ${job.items.some(i=>i.current&&i.state==='queued')?`<button id="wd-resume" ${own?'':'disabled'}>미전송 인원 이어서 출력</button>`:''}
      ${own?'':'<p>이 작업을 시작한 창구와 프린터 설정으로 돌아가면 미전송분을 이어서 출력할 수 있습니다.</p>'}
      <p>가변 정보 미리보기 · 양끝 25mm는 인쇄하지 않습니다.</p><div id="wd-preview" class="wd-preview"></div>`;
    for(const i of job.items.slice(0,6)){
      const c=root.WristbandLayout.render(i.person,job.config);c.setAttribute('aria-label','250×25mm 검정 가변 정보');el('wd-preview').appendChild(c);
    }
    el('wd-resume')?.addEventListener('click',()=>action(async()=>{if(!el('wd-ready').checked)throw Error('발권 시작을 체크해 주세요.');const current=settings();if(current.stationId!==engine.job.stationId || current.printerName!==engine.job.printerName)throw Error('창구와 프린터 설정이 다릅니다.');await engine.resume();message('미전송 인원을 처리했습니다. 실물을 확인해 주세요.');}));
    el('wd-result').querySelectorAll('[data-reprint]').forEach(b=>b.addEventListener('click',()=>action(async()=>{
      if(!el('wd-ready').checked)throw Error('발권 시작을 체크해 주세요.');
      const i=job.items[Number(b.dataset.reprint)];
      const reason=prompt('재출력 사유를 3자 이상 입력해 주세요.');if(!reason)return;
      if(!confirm('Windows 인쇄 대기열에서 기존 작업이 남아 있지 않은지 확인하고, 이미 나온 팔찌는 회수·폐기했습니까?\n확인한 경우에만 새 출력 1회를 진행합니다.'))return;
      await engine.reprint(i.id,{...settings(),testMode:job.testMode},reason);message('재출력 요청을 처리했습니다. 실물을 확인해 주세요.');
    })));
  }
  function page(){
    const html=`<link rel="stylesheet" href="/static/wristband-desk.css"><main id="wristband-desk" class="wd-root">
      <header><span class="wd-kicker">AQUA MOBILITY KOREA</span><h1>QR 팔찌 발권</h1><p>${demo()?'이 컴퓨터의 가상 예약으로 시험합니다. 실제 예약·결제·문자는 변경되지 않습니다.':'예약 QR 확인 후 탑승자별로 팔찌를 출력합니다.'}</p></header>
      <section class="wd-card"><h2>1. 이 창구 설정</h2><div class="wd-grid">
      <label>창구 ID<input id="wd-station" maxlength="40" placeholder="DESK-1"></label>
      <label>발권 대상<select id="wd-mode"><option value="test">시험 예약</option>${demo()?'':'<option value="real">실제 예약</option>'}</select></label>
      <label>출력 방식<select id="wd-transport"><option value="simulation">모의 출력 · 용지 사용 없음</option><option value="bridge">Windows 프린터 출력</option></select></label>
      <label>연결 프로그램의 인증 코드<input id="wd-token" type="password" autocomplete="off" placeholder="시작 창의 인증 코드"></label>
      <label>프린터<select id="wd-printer"><option value="SIMULATOR">모의 프린터</option></select></label>
      <button type="button" id="wd-connect">프린터 목록 불러오기</button>
      <label>프린터 해상도<select id="wd-dpi"><option value="203">203 dpi</option><option value="300">300 dpi</option></select></label>
      <label>급지 방향<select id="wd-rotation"><option value="0">기본 방향</option><option value="180">반대 방향 (180°)</option></select></label>
      <label>길이 방향 보정 (mm)<input id="wd-x" type="number" min="-5" max="5" step="0.1"></label>
      <label>폭 방향 보정 (mm)<input id="wd-y" type="number" min="-3" max="3" step="0.1"></label></div>
      <label class="wd-check"><input id="wd-media" type="checkbox">드라이버의 25×250mm 용지·배율 100%·페이지마다 절단 설정을 확인했습니다.</label>
      <p class="wd-help">부여 선인쇄 양식에 맞춘 검정 정보만 출력합니다. 다른 지역이나 다른 디자인의 밴드는 양식을 먼저 맞춰야 합니다.</p>
      <button id="wd-save" type="button">창구 설정 저장</button></section>
      <section class="wd-card"><h2>2. 예약 QR 스캔</h2>
      <label class="wd-check"><input id="wd-ready" type="checkbox">발권 시작 · 새 예약을 스캔하면 인원별로 자동 출력</label>
      <form id="wd-form"><label for="wd-scan">예약 QR 또는 예약번호</label><div class="wd-scan-row"><input id="wd-scan" autocomplete="off" placeholder="여기를 선택한 뒤 스캐너로 QR을 읽어 주세요"><button type="submit">조회·발권</button></div></form>
      <div class="wd-toolbar"><button id="wd-history" type="button">입력한 예약의 발권 내역</button><button id="wd-sync" type="button">미반영 결과 동기화</button></div>
      ${demo()?'<div id="wd-samples" class="wd-samples"></div>':''}<p>같은 예약을 다시 스캔하면 내역만 표시합니다. 결과가 불확실한 경우 자동으로 재출력하지 않습니다.</p>
      <div id="wd-message" class="wd-alert" role="status">설정을 저장하고 발권 시작을 체크해 주세요.</div></section>
      <section id="wd-result" class="wd-card"><h2>출력 내역</h2><p>아직 선택한 발권 작업이 없습니다.</p></section></main>`;
    setTimeout(mount,0);return html;
  }
  function mount(){
    container=document.getElementById('wristband-desk');if(!container)return;
    const fragment=new URLSearchParams(location.hash.slice(1));if(demo() && fragment.get('token')){sessionStorage.setItem('amk-bridge-token',fragment.get('token'));history.replaceState(null,'',location.pathname);}
    const s=settings();let dirty=false;
    el('wd-station').value=s.stationId;el('wd-mode').value=demo()?'test':s.testMode?'test':'real';
    el('wd-transport').value=s.config.transport;el('wd-token').value=token();el('wd-dpi').value=s.config.dpi;el('wd-rotation').value=s.config.rotation;
    el('wd-x').value=s.config.offsetX;el('wd-y').value=s.config.offsetY;el('wd-media').checked=s.config.mediaConfirmed;
    if(s.printerName!=='SIMULATOR'){const option=new Option(s.printerName,s.printerName);el('wd-printer').add(option);el('wd-printer').value=s.printerName;}
    engine=new root.WristbandEngine(api,bridge,localStorage,renderJob);
    el('wd-connect').onclick=()=>action(async()=>{sessionStorage.setItem('amk-bridge-token',el('wd-token').value.trim());connection=await bridgeCall('/api/printers');el('wd-printer').replaceChildren(new Option('모의 프린터','SIMULATOR'));for(const p of connection.printers)el('wd-printer').add(new Option(p.name+(p.available?'':' (오프라인)'),p.name));if(connection.printers.some(p=>p.name===s.printerName))el('wd-printer').value=s.printerName;message(connection.printers.length?'프린터 목록을 불러왔습니다. 사용할 프린터를 선택해 저장해 주세요.':'연결 프로그램은 정상입니다. Windows에 설치된 프린터가 없습니다.');});
    el('wd-save').onclick=()=>action(async()=>{
      if(engine.busy)throw Error('진행 중인 발권이 끝난 후 설정해 주세요.');
      const cfg={layout:'buyeo-v1',transport:el('wd-transport').value,dpi:Number(el('wd-dpi').value),rotation:Number(el('wd-rotation').value),offsetX:Number(el('wd-x').value),offsetY:Number(el('wd-y').value),mediaConfirmed:el('wd-media').checked};
      root.WristbandLayout.validate(cfg);const testMode=el('wd-mode').value==='test';
      if(!testMode && cfg.transport!=='bridge')throw Error('실제 예약은 Windows 프린터 출력을 선택해 주세요.');
      if(cfg.transport==='bridge' && (!cfg.mediaConfirmed || el('wd-printer').value==='SIMULATOR'))throw Error('실제 프린터와 용지·절단 설정 확인이 필요합니다.');
      if(!/^[A-Za-z0-9_-]{1,40}$/.test(el('wd-station').value))throw Error('창구 ID는 영문·숫자·하이픈·밑줄을 사용해 주세요.');
      localStorage.setItem('amk-desk-settings',JSON.stringify({stationId:el('wd-station').value,printerName:cfg.transport==='simulation'?'SIMULATOR':el('wd-printer').value,testMode,config:cfg}));
      sessionStorage.setItem('amk-bridge-token',el('wd-token').value.trim());dirty=false;el('wd-ready').checked=false;message('설정이 저장됐습니다. 발권 시작을 체크하면 스캔할 수 있습니다.');
    });
    container.querySelectorAll('.wd-grid input,.wd-grid select,#wd-media').forEach(i=>i.addEventListener('change',()=>{dirty=true;el('wd-ready').checked=false;message('설정을 변경했습니다. 저장 후 발권 시작을 체크해 주세요.');}));
    el('wd-form').onsubmit=e=>{e.preventDefault();action(async()=>{
      if(!el('wd-ready').checked)throw Error('설정을 저장하고 발권 시작을 체크해 주세요.');
      const scan=el('wd-scan').value.trim();if(!scan)throw Error('QR 또는 예약번호를 입력해 주세요.');
      message('예약과 결제를 확인하고 있습니다…');const result=await engine.scan(scan,settings());
      const uncertain=result.job.items.some(i=>i.current && ['unknown','dispatching','failed'].includes(i.state));
      message(uncertain?'출력 확인이 필요하여 중단했습니다. Windows 대기열과 팔찌 실물을 확인한 뒤 재출력을 검토해 주세요.':result.duplicate?'이미 발권 작업이 있습니다. 자동 재출력하지 않았습니다. 아래 내역을 확인해 주세요.':'출력 요청을 처리했습니다. 아래 상태와 팔찌 실물을 확인해 주세요.',uncertain);el('wd-scan').select();
    });};
    el('wd-ready').onchange=()=>{if(dirty){el('wd-ready').checked=false;message('변경한 설정부터 저장해 주세요.',true);return;}if(el('wd-ready').checked)el('wd-scan').focus();};
    el('wd-sync').onclick=()=>action(async()=>{await engine.sync();message('저장된 출력 결과를 서버에 반영했습니다.');});
    el('wd-history').onclick=()=>action(async()=>{if(engine.busy)throw Error('발권 처리 중입니다.');const jobs=await api('/jobs?scan='+encodeURIComponent(el('wd-scan').value.trim()));if(!jobs.length)throw Error('발권 내역이 없습니다.');engine.job=jobs[0];renderJob(engine.job);message('최근 작업을 표시했습니다.');const list=document.createElement('div');list.className='wd-toolbar';for(const j of jobs){const b=document.createElement('button');b.type='button';b.textContent=`${j.stationId} / ${j.createdAt.slice(11,19)} / ${j.items.length}명`;b.onclick=()=>{if(!engine.busy){engine.job=j;renderJob(j);}};list.appendChild(b);}el('wd-result').appendChild(list);});
    if(demo())action(async()=>{const samples=await api('/samples');el('wd-samples').innerHTML='<strong>시험 예약</strong>';for(const p of samples){const b=document.createElement('button');b.type='button';b.textContent=p.label;b.onclick=()=>{el('wd-scan').value=p.scan;el('wd-scan').focus();};el('wd-samples').appendChild(b);}message('시험 예약 버튼으로 번호를 채우거나, 같은 값을 담은 QR을 스캔해 주세요.');});
  }
  root.WristbandDesk={page,mount};
})(globalThis);
