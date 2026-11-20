import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {webcrypto} from 'node:crypto';
const ctx={crypto:webcrypto};vm.createContext(ctx);for(const f of ['wristband-engine','wristband-layout'])vm.runInContext(fs.readFileSync(new URL('../public/static/modules/'+f+'.js',import.meta.url),'utf8'),ctx);
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const config={layout:'buyeo-v2-30x250',transport:'bridge',dpi:203,rotation:0,offsetX:0,offsetY:0,mediaConfirmed:true};
function fixture(){let job,printed=0,created=0;const state=storage();
 const api=async(path,body)=>{
   if(path==='/jobs'){created++;if(job)return {...structuredClone(job),duplicate:true};job={id:'job',stationId:'DESK-1',printerName:'XD5',config,items:[1,2,3].map(n=>({id:'item'+n,state:'queued',current:true,person:{sequence:n}}))};return structuredClone(job);}
   if(path==='/jobs/job')return structuredClone(job);
   const i=job.items.find(i=>path.includes('/'+i.id+'/'));
   if(path.endsWith('/dispatch')){const permitted=i.state==='queued';if(permitted)i.state='dispatching';return {permitted,job:structuredClone(job)};}
   if(path.endsWith('/result')){i.state=body.state;return structuredClone(job);}throw Error('bad route');
 };const bridge={preflight:async()=>{},print:async()=>{printed++;return {state:'accepted'};}};
 const engine=new ctx.WristbandEngine(api,bridge,state);
 return {engine,api,bridge,state,get printed(){return printed;},get created(){return created;}};
}
test('한 예약 3명 출력 후 재스캔은 추가 출력하지 않음',async()=>{const f=fixture();await f.engine.scan('AMK-001',{});assert.equal(f.printed,3);assert.equal((await f.engine.scan('AMK-001',{})).duplicate,true);assert.equal(f.printed,3);});
test('스캐너 Enter 연타는 동시 발권 요청을 차단',async()=>{const f=fixture(),p=f.engine.scan('AMK-001',{});await assert.rejects(()=>f.engine.scan('AMK-001',{}),/처리/);await p;assert.equal(f.created,1);});
test('프린터 연결 실패는 서버 발권 작업 생성 전 차단',async()=>{
  const f=fixture();f.bridge.preflight=async()=>{throw Error('프린터 미연결');};
  await assert.rejects(()=>f.engine.scan('AMK-001',{config,printerName:'ZDesigner ZD230-203dpi ZPL'}),/미연결/);
  assert.equal(f.created,0);assert.equal(f.printed,0);
});
test('두 번째 인원 응답 유실은 unknown에서 멈추고 세 번째를 보내지 않음',async()=>{const f=fixture();let calls=0;f.bridge.print=async()=>{if(++calls===2)throw Error('network');return {state:'accepted'};};await f.engine.scan('AMK-001',{});assert.equal(calls,2);assert.equal(f.engine.job.items[1].state,'unknown');assert.equal(f.engine.job.items[2].state,'queued');await f.engine.scan('AMK-001',{});assert.equal(calls,2);});
test('잘못된 프린터는 dispatch 전 중단',async()=>{const f=fixture();f.bridge.preflight=async()=>{throw Error('offline');};await assert.rejects(()=>f.engine.scan('AMK-001',{}),/offline/);assert.equal(f.engine.job.items[0].state,'queued');assert.equal(f.printed,0);});
test('결과 보고 유실 후 저장된 결과만 동기화하고 다시 인쇄하지 않음',async()=>{
 const f=fixture();let broken=true;const api=async(p,b)=>{if(broken&&p.endsWith('/result'))throw Error('offline');return f.api(p,b);};const engine=new ctx.WristbandEngine(api,f.bridge,f.state);
 await assert.rejects(()=>engine.scan('AMK-001',{}),/offline/);assert.equal(f.printed,1);assert.ok(f.state.getItem('amk-issue-pending-result'));
 broken=false;await engine.sync();assert.equal(f.printed,1);assert.equal(engine.job.items[0].state,'accepted');await engine.resume();assert.equal(f.printed,3);
});
test('정확한 밴드 크기·양끝 공백 클립·권종별 체크 위치·시험 표식',()=>{
 for(const type of ['adult','teen','child']){const p=ctx.WristbandLayout.commands({type,testMode:true,name:'시험',date:'2026-11-11',time:'14:00',reservationNo:'AMK-001',sequence:1,total:3},config);assert.equal(p.width,250);assert.equal(p.height,30);assert.equal(p.clip.x,25);assert.equal(p.clip.width,200);assert.ok(p.tick.cx>25&&p.tick.cx<225);assert.ok(p.text.some(t=>t.text.includes('탑승 불가')));}
 assert.throws(()=>ctx.WristbandLayout.commands({type:'adult'},{...config,offsetX:26}));
});

test('실물 좌표: 체크 중심=절취선 0mm 기준 성인149·청소년119·소아93, 예약정보는 길이 30~83mm 안',()=>{
 const L=ctx.WristbandLayout;
 const base={testMode:true,name:'시험A',date:'2026-11-19',time:'23:50',reservationNo:'SBX-20261119-P1',sequence:1,total:1};
 for(const [type,len] of [['adult',149],['teen',119],['child',93]]){
  const p=L.commands({...base,type},config);
  const exp=type==='teen'?len-1.3:len;   // 청소년만 실측 보정 -1.3mm
  assert.ok(Math.abs(250-p.tick.cx-exp)<1e-9,type+' 체크 길이좌표');
 }
 const p=L.commands({...base,type:'teen'},config);
 for(const t of p.text){
  const lenA=250-t.x, lenB=250-(t.x+t.max);   // 글자 시작·끝의 실물 길이
  assert.ok(lenB>=30 && lenA<=83, `예약정보가 흰 여백(30~83mm) 밖: ${t.text} ${lenB.toFixed(1)}~${lenA.toFixed(1)}`);
 }
 assert.ok(p.clip.x===25 && p.clip.width===200);
});
test('보정값 0일 때 예약정보와 체크는 서로 독립(offset이 둘 다 같이 움직이는 것은 사용자 보정뿐)',()=>{
 const L=ctx.WristbandLayout;
 const a=L.commands({type:'teen',testMode:true,name:'A',date:'2026-11-19',time:'10:00',reservationNo:'R',sequence:1,total:1},config);
 const b=L.commands({type:'child',testMode:true,name:'A',date:'2026-11-19',time:'10:00',reservationNo:'R',sequence:1,total:1},config);
 assert.deepEqual(a.text,b.text);           // 권종이 달라도 예약정보 위치는 같다
 assert.notEqual(a.tick.cx,b.tick.cx);
});

test('진단 출력: 진단 예약(시험 모드)에서만 기준선·십자 표시, 운영 양식은 그대로',()=>{
 const L=ctx.WristbandLayout;
 const base={type:'teen',name:'청소년A',date:'2026-11-20',time:'23:50',sequence:1,total:1};
 const normal=L.commands({...base,testMode:true,reservationNo:'SBX-20261120-T1'},config);
 const real=L.commands({...base,testMode:false,reservationNo:'SBX-20261120-DG1'},config);
 const diag=L.commands({...base,testMode:true,reservationNo:'SBX-20261120-DG1'},config);
 assert.equal(normal.diag,null); assert.equal(real.diag,null);
 assert.ok(diag.diag);
 // 체크·예약정보는 일반 시험과 완전히 동일
 assert.deepEqual(diag.tick,normal.tick);   // 같은 청소년이므로 보정 포함 동일
 assert.deepEqual(diag.text.map(t=>[t.x,t.y,t.max]),normal.text.map(t=>[t.x,t.y,t.max]));
 // 기준선 길이 위치 == 체크 설계 중심(119mm), 양쪽 흰 여백, 컬러 인쇄면(실제 폭 약 6~23.6mm) 밖
 for(const l of diag.diag.lines){assert.equal(250-l.x,119);}
 const off=diag.offsetY;
 const real0=diag.diag.lines.map(l=>[l.y0+off,l.y1+off]);
 assert.ok(real0[0][1]<=5.5 && real0[1][0]>=24.5);
 // 십자: 체크와 같은 폭 위치, 예약정보 바로 옆(길이 77~83 사이)
 assert.equal(diag.diag.cross.y,12.25);   // 십자는 설계 중심 폭 위치(보정 안 함)
 const len=250-diag.diag.cross.x; assert.ok(len>77 && len<83);
 // 양끝 25mm 무인쇄 영역 밖
 for(const l of diag.diag.lines) assert.ok(l.x>25&&l.x<225);
 assert.ok(diag.diag.cross.x>25&&diag.diag.cross.x<225);
});

test('청소년 ✓만 실측 보정(길이 -1.3, 폭 +1.3), 성인·소아·예약정보·기준선은 불변',()=>{
 const L=ctx.WristbandLayout;
 const base={testMode:true,name:'청소년A',date:'2026-11-20',time:'23:50',sequence:1,total:1,reservationNo:'SBX-20261120-DG3'};
 const g=type=>L.commands({...base,type},config);
 const teen=g('teen'),adult=g('adult'),child=g('child');
 assert.ok(Math.abs(250-teen.tick.cx-117.7)<1e-9); assert.ok(Math.abs(teen.tick.cy-13.55)<1e-9);
 assert.equal(250-adult.tick.cx,149); assert.equal(adult.tick.cy,12.25);
 assert.equal(250-child.tick.cx,93); assert.equal(child.tick.cy,12.25);
 for(const l of teen.diag.lines) assert.equal(250-l.x,119);
 assert.equal(teen.diag.cross.y,12.25);
 assert.deepEqual(teen.text,adult.text);
});
