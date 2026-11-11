import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {webcrypto} from 'node:crypto';
const ctx={crypto:webcrypto};vm.createContext(ctx);for(const f of ['wristband-engine','wristband-layout'])vm.runInContext(fs.readFileSync(new URL('../public/static/modules/'+f+'.js',import.meta.url),'utf8'),ctx);
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const config={layout:'buyeo-v1',transport:'bridge',dpi:203,rotation:0,offsetX:0,offsetY:0,mediaConfirmed:true};
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
test('두 번째 인원 응답 유실은 unknown에서 멈추고 세 번째를 보내지 않음',async()=>{const f=fixture();let calls=0;f.bridge.print=async()=>{if(++calls===2)throw Error('network');return {state:'accepted'};};await f.engine.scan('AMK-001',{});assert.equal(calls,2);assert.equal(f.engine.job.items[1].state,'unknown');assert.equal(f.engine.job.items[2].state,'queued');await f.engine.scan('AMK-001',{});assert.equal(calls,2);});
test('잘못된 프린터는 dispatch 전 중단',async()=>{const f=fixture();f.bridge.preflight=async()=>{throw Error('offline');};await assert.rejects(()=>f.engine.scan('AMK-001',{}),/offline/);assert.equal(f.engine.job.items[0].state,'queued');assert.equal(f.printed,0);});
test('결과 보고 유실 후 저장된 결과만 동기화하고 다시 인쇄하지 않음',async()=>{
 const f=fixture();let broken=true;const api=async(p,b)=>{if(broken&&p.endsWith('/result'))throw Error('offline');return f.api(p,b);};const engine=new ctx.WristbandEngine(api,f.bridge,f.state);
 await assert.rejects(()=>engine.scan('AMK-001',{}),/offline/);assert.equal(f.printed,1);assert.ok(f.state.getItem('amk-issue-pending-result'));
 broken=false;await engine.sync();assert.equal(f.printed,1);assert.equal(engine.job.items[0].state,'accepted');await engine.resume();assert.equal(f.printed,3);
});
test('정확한 밴드 크기·양끝 공백 클립·권종별 체크 위치·시험 표식',()=>{
 for(const type of ['adult','teen','child']){const p=ctx.WristbandLayout.commands({type,testMode:true,name:'시험',date:'2026-11-11',time:'14:00',reservationNo:'AMK-001',sequence:1,total:3},config);assert.equal(p.width,250);assert.equal(p.height,25);assert.equal(p.clip.x,25);assert.equal(p.clip.width,200);assert.ok(p.tick.x>25&&p.tick.x<225);assert.ok(p.text.some(t=>t.text.includes('탑승 불가')));}
 assert.throws(()=>ctx.WristbandLayout.commands({type:'adult'},{...config,offsetX:26}));
});
