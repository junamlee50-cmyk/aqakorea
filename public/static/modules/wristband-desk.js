(function(root){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const states={queued:'미전송',dispatching:'전송 중 · 결과 확인 필요',accepted:'인쇄 대기열 전송 · 실물 확인 전',simulated:'모의 출력 완료',failed:'전송 실패',unknown:'결과 확인 필요',voided:'발권 되돌림 · 자동 재출력 안 함'};
  const defaults={stationId:'DESK-1',printerName:'SIMULATOR',testMode:true,config:{layout:'buyeo-v2-30x250',transport:'simulation',dpi:203,rotation:0,offsetX:0,offsetY:0,mediaConfirmed:false}};
  let engine,container,connection;
  async function fetchJSON(url,options={}){
    const r=await fetch(url,{...options,signal:AbortSignal.timeout(40000),cache:'no-store'});
    const j=await r.json();if(!r.ok || j.success===false)throw Error(j.error||`연결 오류 (${r.status})`);return j.data??j;
  }
  const demo=()=>root.location.pathname.startsWith('/demo') || root.AMK_LOCAL_DEMO===true;
  const settings=()=>JSON.parse(localStorage.getItem('amk-desk-settings-30x250')||JSON.stringify(defaults));
  const REMEMBER_KEY='amk-bridge-token-remember';
  const token=()=>sessionStorage.getItem('amk-bridge-token')||localStorage.getItem(REMEMBER_KEY)||'';
  const remembered=()=>!!localStorage.getItem(REMEMBER_KEY);
  // 연결 기억 저장/삭제: 창구 설정(amk-desk-settings-30x250)·미반영 출력 결과·인쇄 저널은 건드리지 않는다.
  const saveToken=(t,remember)=>{sessionStorage.setItem('amk-bridge-token',t);if(remember)localStorage.setItem(REMEMBER_KEY,t);else localStorage.removeItem(REMEMBER_KEY);};
  const forgetToken=()=>{localStorage.removeItem(REMEMBER_KEY);sessionStorage.removeItem('amk-bridge-token');};
  async function bridgeCall(path,body){
    return fetchJSON('http://127.0.0.1:17864'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-AMK-Token':token()},...(body?{body:JSON.stringify(body)}:{})});
  }
  const bridge={
    async preflight(name){const d=await bridgeCall('/api/printers');if(!d.supportedLayouts?.includes('buyeo-v2-30x250'))throw Error('이전 연결 프로그램을 종료하고 30mm용 1.1 버전을 실행해 주세요.');if(!d.printers.some(p=>p.name===name && p.available))throw Error('선택한 프린터가 없거나 오프라인입니다. Windows 프린터 설정을 확인해 주세요.');},
    async print(job){const png=root.WristbandLayout.portrait(job.person,job.config).toDataURL('image/png');return bridgeCall('/api/print',{...job,png});}
  };
  function api(path,body){
    const headers={'Content-Type':'application/json'};
    if(demo())headers['X-AMK-Token']=token();else headers.Authorization='Bearer '+(localStorage.getItem('amk_admin_token')||'');
    return fetchJSON((demo()?'/demo-api':'/api/issuance')+path,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{})});
  }
  const el=id=>container?.querySelector('#'+id);
  function setMsg(text,bad=false){const n=el('wd-setmsg');if(n){n.textContent=text;n.className=bad?'wd-alert error':'wd-alert';n.hidden=false;}}
  function message(text,bad=false){if(el('wd-message')){el('wd-message').textContent=text;el('wd-message').className=bad?'wd-alert error':'wd-alert';}}
  async function settingsAction(fn){try{await fn();}catch(e){setMsg(e.message,true);}}
  async function action(fn){try{await fn();}catch(e){message(e.message,true);}finally{if(el('wd-scan') && !engine?.busy)el('wd-scan').focus();}}
  function renderJob(job){
    if(!el('wd-result'))return;
    const s=settings(), compatible=job.config.layout==='buyeo-v2-30x250', own=compatible && job.stationId===s.stationId && job.printerName===s.printerName;
    el('wd-result').innerHTML=`<h2>${esc(job.items[0]?.person.reservationNo)} · ${job.testMode?'시험':'실제'} 발권</h2>
      <p>${esc(job.stationId)} / ${esc(job.printerName)} · 인쇄 대기열 전송은 실물 출력 확인과 다릅니다.</p>
      <div class="wd-scroll"><table><thead><tr><th>순번</th><th>권종 / 성명</th><th>상태</th><th>조치</th></tr></thead><tbody>${job.items.map((i,n)=>`<tr><td>${i.person.sequence}/${i.person.total}</td><td>${esc(root.WristbandLayout.labels[i.person.type])} ${esc(i.person.name)}</td><td>${i.current?esc(i.state==='accepted'&&i.confirmedAt?'실물 확인 완료':states[i.state]||i.state):'새 출력 작업으로 대체됨'}</td><td>${i.current && (i.state!=='queued'||!compatible)?`<button type="button" data-reprint="${n}">재출력 검토</button>`:''}</td></tr>`).join('')}</tbody></table></div>
      ${job.readyToConfirm&&!job.physicalConfirmed?'<button id="wd-confirm" type="button">실물 확인 · 발권완료 처리</button><p>예약 인원 전원의 팔찌가 정확히 출력됐는지 확인한 뒤 누르세요.</p>':''}
      ${job.items.some(i=>i.current&&i.state==='queued')?`<button id="wd-resume" ${own?'':'disabled'}>미전송 인원 이어서 출력</button>`:''}
      ${own?'':'<p>이 작업을 시작한 창구와 프린터 설정으로 돌아가면 미전송분을 이어서 출력할 수 있습니다.</p>'}
      <p>가변 정보 미리보기 · 양끝 25mm는 인쇄하지 않습니다.</p><div id="wd-preview" class="wd-preview"></div>`;
    if(!compatible)el('wd-preview').textContent='이전 25mm 양식의 작업입니다. 새 30mm 양식으로 재출력 검토를 진행해 주세요.';
    for(const i of (compatible?job.items.slice(0,6):[])){
      const c=root.WristbandLayout.render(i.person,job.config);c.setAttribute('aria-label','250×30mm 검정 가변 정보');el('wd-preview').appendChild(c);
    }
    el('wd-confirm')?.addEventListener('click',()=>action(async()=>{
      if(!confirm('예약 인원 전원의 팔찌가 실제로 출력되었고 날짜·회차·권종·수량이 맞습니까?\n확인하면 발권완료로 처리합니다.'))return;
      await engine.confirmOutput();message('팔찌 실물을 확인하여 발권완료로 처리했습니다.');
    }));
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
      <div class="wd-help"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="wd-remember" style="width:auto"> 이 PC에서 프린터 연결 기억</label>
        <span>체크하면 이 PC의 이 브라우저에서 이 사이트를 다시 열 때 인증 코드를 불러옵니다. 공용 PC에서는 체크하지 마세요. 체크하지 않으면 탭을 닫을 때까지만 유지됩니다.</span>
        <button type="button" id="wd-forget" style="margin-left:6px">이 PC의 연결 기억 삭제</button>
        <div id="wd-remember-msg" role="status" aria-live="polite"></div></div>
      <label>프린터<select id="wd-printer"><option value="SIMULATOR">모의 프린터</option></select></label>
      <div><button type="button" id="wd-connect">프린터 목록 불러오기</button><div id="wd-printer-msg" class="wd-help" role="status" aria-live="polite"></div></div>
      <label>프린터 해상도<select id="wd-dpi"><option value="203">203 dpi</option><option value="300">300 dpi</option></select></label>
      <label>급지 방향<select id="wd-rotation"><option value="0">기본 방향</option><option value="180">반대 방향 (180°)</option></select></label>
      <p class="wd-help" style="grid-column:1/-1"><strong>용지 규격: 폭 30mm × 길이 250mm</strong> (고정, 양끝 각 25mm 무인쇄). 아래 보정값은 용지 크기가 아니라 <strong>인쇄 위치를 조금 옮기는 값</strong>입니다. 처음에는 모두 0으로 두세요.</p>
      <label>길이 방향 위치 보정 (mm, 기본 0, 허용 -5~+5)<input id="wd-x" type="number" min="-5" max="5" step="0.1"><small id="wd-x-err" class="wd-alert error" hidden></small></label>
      <label>폭 방향 위치 보정 (mm, 기본 0, 허용 -3~+3)<input id="wd-y" type="number" min="-3" max="3" step="0.1"><small id="wd-y-err" class="wd-alert error" hidden></small></label></div>
      <p id="wd-transport-note" class="wd-help"></p><div id="wd-setmsg" class="wd-alert" role="status" aria-live="polite" hidden></div>
      <label class="wd-check"><input id="wd-media" type="checkbox">실제 밴드를 넣고 30×250mm·배율 100%·감열 인쇄·뜯어내기 설정을 확인했습니다.</label>
      <p class="wd-help">부여 선인쇄 양식에 맞춘 검정 정보만 출력합니다. 다른 지역이나 다른 디자인의 밴드는 양식을 먼저 맞춰야 합니다.</p>
      <button id="wd-save" type="button">창구 설정 저장</button></section>
      <section class="wd-card"><h2>2. 예약 QR 스캔</h2>
      <label class="wd-check"><input id="wd-ready" type="checkbox">발권 시작</label>
      <label class="wd-check"><input id="wd-auto" type="checkbox">QR 스캔 즉시 출력 (켜면 예약 확인창을 생략합니다)</label>
      <form id="wd-form"><label for="wd-scan">예약 QR 또는 예약번호</label><div class="wd-scan-row"><input id="wd-scan" autocomplete="off" placeholder="여기를 선택한 뒤 스캐너로 QR을 읽어 주세요"><button type="submit">예약 확인 · 출력</button></div></form>
      <div class="wd-toolbar"><button id="wd-history" type="button">입력한 예약의 발권 내역</button><button id="wd-sync" type="button">미반영 결과 동기화</button></div>
      ${demo()?'<div id="wd-samples" class="wd-samples"></div>':''}<p>같은 예약을 다시 스캔하면 내역만 표시합니다. 결과가 불확실한 경우 자동으로 재출력하지 않습니다.</p>
      <div id="wd-message" class="wd-alert" role="status">설정을 저장하고 발권 시작을 체크해 주세요.</div></section>
      <section id="wd-result" class="wd-card"><h2>출력 내역</h2><p>아직 선택한 발권 작업이 없습니다.</p></section></main>`;
    setTimeout(mount,0);return html;
  }
  function mount(){
    container=document.getElementById('wristband-desk');if(!container)return;
    const fragment=new URLSearchParams(location.hash.slice(1));if(demo() && fragment.get('token')){sessionStorage.setItem('amk-bridge-token',fragment.get('token'));history.replaceState(null,'',location.pathname);}
    const s=settings();let dirty=false,reviewing=false;
    const prefill=new URLSearchParams(location.search).get('reservation');
    if(prefill)el('wd-scan').value=prefill;
    el('wd-station').value=s.stationId;el('wd-mode').value=demo()?'test':s.testMode?'test':'real';
    el('wd-transport').value=s.config.transport;el('wd-token').value=token();el('wd-dpi').value=s.config.dpi;el('wd-rotation').value=s.config.rotation;
    el('wd-x').value=s.config.offsetX;el('wd-y').value=s.config.offsetY;el('wd-media').checked=s.config.mediaConfirmed;
    if(s.printerName!=='SIMULATOR'){const option=new Option(s.printerName,s.printerName);el('wd-printer').add(option);el('wd-printer').value=s.printerName;}
    const updateNote=()=>{const n=el('wd-transport-note');if(!n)return;n.textContent=el('wd-transport').value==='simulation'?'현재 "모의 출력"입니다. 실제 프린터로는 인쇄되지 않으며 용지도 쓰지 않습니다. 선택한 프린터는 "Windows 프린터 출력"을 고를 때만 사용됩니다.':'"Windows 프린터 출력"입니다. 선택한 프린터로 실제 인쇄됩니다.';};
    el('wd-printer').onchange=()=>{dirty=true;setMsg('프린터 선택이 바뀌었습니다. "창구 설정 저장"을 눌러야 적용됩니다.');};
    el('wd-transport').onchange=()=>{dirty=true;updateNote();};updateNote();
    engine=new root.WristbandEngine(api,bridge,localStorage,renderJob);
    const rememberMsg=(t,err)=>{const m=el('wd-remember-msg');if(m){m.textContent=t;m.className=err?'wd-alert error':'wd-help';}};
    el('wd-remember').checked=remembered();
    el('wd-forget').onclick=()=>{forgetToken();el('wd-token').value='';el('wd-remember').checked=false;rememberMsg('이 PC의 연결 기억을 삭제했습니다. 창구 설정·인쇄 기록·미반영 출력 결과는 그대로 남아 있습니다. 다시 사용하려면 인증 코드를 입력하세요.');};
    el('wd-remember').onchange=()=>{if(!el('wd-remember').checked&&remembered()){localStorage.removeItem(REMEMBER_KEY);rememberMsg('연결 기억을 해제했습니다. 이 탭을 닫으면 인증 코드를 다시 입력해야 합니다.');}};
    // 기억된 코드가 있으면 복원 후 연결 프로그램에 인증 요청을 보내 유효성 확인
    if(!demo()&&remembered()&&!sessionStorage.getItem('amk-bridge-token')){
      el('wd-token').value=localStorage.getItem(REMEMBER_KEY)||'';rememberMsg('기억된 연결 정보를 확인하는 중...');
      bridgeCall('/api/printers').then(d=>{connection=d;rememberMsg('기억된 인증 코드로 연결 프로그램 인증이 확인됐습니다. (프린터 '+d.printers.length+'대 조회 가능 · 아직 실제 출력은 하지 않았습니다)');})
      .catch(e=>{const m=String(e.message||e);
        if(/401|403|인증|token/i.test(m))rememberMsg('저장된 인증 코드가 더 이상 맞지 않습니다. 연결 프로그램을 다시 시작해 새 인증 코드를 입력해 주세요.',true);
        else rememberMsg('연결 프로그램에 연결하지 못했습니다. 연결 프로그램(START.cmd)을 실행하세요. 실행 중이라면 브라우저의 로컬 네트워크 접근 허용을 확인해 주세요.',true);});
    }
    el('wd-connect').onclick=()=>settingsAction(async()=>{
      const pm=el('wd-printer-msg'),btn=el('wd-connect');
      if(!el('wd-token').value.trim()){pm.textContent='연결 프로그램의 인증 코드를 먼저 입력해 주세요. (검은 실행 창의 "인증 코드:" 값)';pm.className='wd-alert error';return;}
      btn.disabled=true;pm.className='wd-help';pm.textContent='프린터 목록을 불러오는 중...';
      try{
        saveToken(el('wd-token').value.trim(),el('wd-remember').checked);
        try{connection=await bridgeCall('/api/printers');}
        catch(e){const m=String(e.message||e);pm.className='wd-alert error';
          pm.textContent=/401|403|인증|token/i.test(m)?'인증 코드가 맞지 않습니다. 검은 실행 창의 최신 인증 코드를 다시 붙여넣어 주세요.':(/Failed to fetch|NetworkError|Load failed|JSON|Unexpected end|응답/i.test(m)?'연결 프로그램에 연결하지 못했습니다. 검은 실행 창이 켜져 있는지, 브라우저가 이 사이트의 로컬 네트워크 접근을 막지 않았는지 확인해 주세요.':'목록 조회 실패: '+m);return;}
        const cur=el('wd-printer').value;
        el('wd-printer').replaceChildren(new Option('모의 프린터','SIMULATOR'));
        for(const p of connection.printers)el('wd-printer').add(new Option(p.name+(p.available?'':' (오프라인)'),p.name));
        const saved=settings().printerName;
        if(connection.printers.some(p=>p.name===saved))el('wd-printer').value=saved;else if(connection.printers.some(p=>p.name===cur))el('wd-printer').value=cur;
        dirty=true;
        pm.className='wd-alert';pm.textContent=connection.printers.length?'프린터 '+connection.printers.length+'대를 불러왔습니다. 옆의 프린터 목록에서 사용할 기기를 선택한 뒤 "창구 설정 저장"을 눌러 주세요. (아직 저장 전입니다)':'연결 프로그램은 정상이지만 Windows에 설치된 프린터가 없습니다.';
        el('wd-printer').focus({preventScroll:true});
      }finally{btn.disabled=false;}
    });
    el('wd-save').onclick=()=>settingsAction(async()=>{
      const rx=Number(el('wd-x').value),ry=Number(el('wd-y').value);let bad=false;
      for(const [id,v,lim,name] of [['wd-x',rx,5,'길이 방향'],['wd-y',ry,3,'폭 방향']]){const e=el(id+'-err');if(!Number.isFinite(v)||Math.abs(v)>lim){e.textContent=name+' 위치 보정은 -'+lim+' ~ +'+lim+'mm 범위입니다. 용지 크기(30×250)를 입력하는 칸이 아닙니다. 기본값은 0입니다.';e.hidden=false;bad=true;}else e.hidden=true;}
      if(bad)throw Error('위치 보정값 범위를 확인해 주세요.');
      if(engine.busy)throw Error('진행 중인 발권이 끝난 후 설정해 주세요.');
      const cfg={layout:'buyeo-v2-30x250',transport:el('wd-transport').value,dpi:Number(el('wd-dpi').value),rotation:Number(el('wd-rotation').value),offsetX:Number(el('wd-x').value),offsetY:Number(el('wd-y').value),mediaConfirmed:el('wd-media').checked};
      root.WristbandLayout.validate(cfg);const testMode=el('wd-mode').value==='test';
      if(!testMode && cfg.transport!=='bridge')throw Error('실제 예약은 Windows 프린터 출력을 선택해 주세요.');
      if(cfg.transport==='bridge' && (!cfg.mediaConfirmed || el('wd-printer').value==='SIMULATOR'))throw Error('실제 프린터와 용지·뜯어내기 설정 확인이 필요합니다.');
      if(!/^[A-Za-z0-9_-]{1,40}$/.test(el('wd-station').value))throw Error('창구 ID는 영문·숫자·하이픈·밑줄을 사용해 주세요.');
      localStorage.setItem('amk-desk-settings-30x250',JSON.stringify({stationId:el('wd-station').value,printerName:cfg.transport==='simulation'?'SIMULATOR':el('wd-printer').value,testMode,config:cfg}));
      saveToken(el('wd-token').value.trim(),el('wd-remember').checked);dirty=false;el('wd-ready').checked=false;setMsg('설정이 저장됐습니다. 저장된 프린터: '+(cfg.transport==='simulation'?'모의 프린터(실제 인쇄 없음)':el('wd-printer').value)+'. 아래에서 발권 시작을 체크하면 스캔할 수 있습니다.');updateNote();
    });
    container.querySelectorAll('.wd-grid input,.wd-grid select,#wd-media').forEach(i=>i.addEventListener('change',()=>{dirty=true;el('wd-ready').checked=false;message('설정을 변경했습니다. 저장 후 발권 시작을 체크해 주세요.');}));
    el('wd-form').onsubmit=e=>{e.preventDefault();if(reviewing||engine.busy)return;reviewing=true;action(async()=>{
      try{
      if(!el('wd-ready').checked)throw Error('설정을 저장하고 발권 시작을 체크해 주세요.');
      const scan=el('wd-scan').value.trim();if(!scan)throw Error('QR 또는 예약번호를 입력해 주세요.');
      const chosen=settings();
      if(chosen.config.transport==='bridge')await bridge.preflight(chosen.printerName);
      const preview=await api('/preview?scan='+encodeURIComponent(scan)+'&testMode='+chosen.testMode);
      if(!el('wd-auto').checked && !confirm(`${preview.reservationNo}\n${preview.name} · ${preview.date} ${preview.time}\n${preview.pax}명 / ${chosen.printerName}\n\n이 예약의 팔찌를 출력하시겠습니까?`)){message('출력을 시작하지 않았습니다. 예약·결제 상태는 그대로입니다.');return;}
      if(dirty||!el('wd-ready').checked||JSON.stringify(chosen)!==JSON.stringify(settings()))throw Error('설정이 변경됐습니다. 다시 확인해 주세요.');
      message('예약과 결제를 확인하고 있습니다…');const result=await engine.scan(scan,{...chosen,reviewRevision:preview.revision});
      const uncertain=result.job.items.some(i=>i.current && ['unknown','dispatching','failed'].includes(i.state));
      message(uncertain?'출력 확인이 필요하여 중단했습니다. Windows 대기열과 팔찌 실물을 확인한 뒤 재출력을 검토해 주세요.':result.duplicate?'이미 발권 작업이 있습니다. 자동 재출력하지 않았습니다. 아래 내역을 확인해 주세요.':'출력 요청을 처리했습니다. 아래 상태와 팔찌 실물을 확인해 주세요.',uncertain);el('wd-scan').select();
      try{await showCurrentStatus(scan,true);}catch(e){}
      }finally{reviewing=false;}
    });};
    el('wd-ready').onchange=()=>{if(dirty){el('wd-ready').checked=false;message('변경한 설정부터 저장해 주세요.',true);return;}if(el('wd-ready').checked)el('wd-scan').focus();};
    el('wd-sync').onclick=()=>action(async()=>{await engine.sync();message('저장된 출력 결과를 서버에 반영했습니다.');});
    const showCurrentStatus=async(scanText,quiet)=>{const jobs=await api('/jobs?scan='+encodeURIComponent(scanText));if(!jobs.length){if(quiet)return;throw Error('발권 내역이 없습니다.');}
      const cur=[];for(const j of jobs)for(const i of j.items)if(i.current)cur.push({j,i});cur.sort((x,y)=>x.i.person.sequence-y.i.person.sequence);
      const first=(cur[0]&&cur[0].j)||jobs[0];engine.job=first;renderJob(first);if(!quiet)message('현재 유효한 탑승자별 출력 상태를 맨 위에 표시했습니다. 이전 작업은 아래 이력 버튼으로 볼 수 있습니다.');
      const box=document.createElement('div');box.className='wd-card';const sm=cur.map(({j,i})=>`<tr><td>${i.person.sequence}/${i.person.total}</td><td>${esc(root.WristbandLayout.labels[i.person.type])} ${esc(i.person.name)}</td><td>${esc(i.state==='accepted'&&i.confirmedAt?'실물 확인 완료':states[i.state]||i.state)}</td><td>${esc(j.stationId)} / ${esc(j.createdAt.slice(11,19))}</td><td><button type="button" data-showjob="${esc(j.id)}">해당 작업 보기</button></td></tr>`).join('');
      box.innerHTML='<h2>현재 유효한 출력 상태 (탑승자별)</h2><div class="wd-scroll"><table><thead><tr><th>순번</th><th>권종 / 성명</th><th>상태</th><th>작업(창구/시각)</th><th>조치</th></tr></thead><tbody>'+(sm||'<tr><td colspan="5">현재 유효한 출력 항목이 없습니다.</td></tr>')+'</tbody></table></div><p class="wd-help">이전 작업의 "새 출력 작업으로 대체됨" 항목은 과거 이력입니다. 재출력해도 QR 없는 기존 팔찌는 자동으로 무효화되지 않으므로 반드시 회수·폐기하세요.</p>';
      box.querySelectorAll('[data-showjob]').forEach(bt=>bt.onclick=()=>{const j=jobs.find(x=>x.id===bt.dataset.showjob);if(j&&!engine.busy){engine.job=j;renderJob(j);el('wd-result').prepend(box);}});
      el('wd-result').prepend(box);
      const list=document.createElement('div');list.className='wd-toolbar';const lt=document.createElement('strong');lt.textContent='작업 이력: ';list.appendChild(lt);for(const j of jobs){const b=document.createElement('button');b.type='button';b.textContent=`${j.stationId} / ${j.createdAt.slice(11,19)} / ${j.items.length}명${j.items.some(i=>i.current)?'':' (모두 대체됨)'}`;b.onclick=()=>{if(!engine.busy){engine.job=j;renderJob(j);el('wd-result').prepend(box);el('wd-result').appendChild(list);}};list.appendChild(b);}el('wd-result').appendChild(list);};
    el('wd-history').onclick=()=>action(async()=>{if(engine.busy)throw Error('발권 처리 중입니다.');await showCurrentStatus(el('wd-scan').value.trim(),false);});
    if(demo())action(async()=>{const samples=await api('/samples');el('wd-samples').innerHTML='<strong>시험 예약</strong>';for(const p of samples){const b=document.createElement('button');b.type='button';b.textContent=p.label;b.onclick=()=>{el('wd-scan').value=p.scan;el('wd-scan').focus();};el('wd-samples').appendChild(b);}message('시험 예약 버튼으로 번호를 채우거나, 같은 값을 담은 QR을 스캔해 주세요.');});
  }
  root.WristbandDesk={page,mount};
})(globalThis);
