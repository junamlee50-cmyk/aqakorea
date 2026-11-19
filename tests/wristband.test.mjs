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
  assert.equal(250-p.tick.cx,len,type+' 체크 길이좌표');
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
