import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function fixture(status='checkedin'){
  const calls=[],toasts=[];let modal;
  const ctx={window:{},console,Router:{go:p=>calls.push(['route',p])},document:{getElementById:()=>null,addEventListener(){}},
    Utils:{closeModal(){},toast:(m,t)=>toasts.push([m,t]),modal:html=>{
      const fields=Object.fromEntries(['save','reason','ack','error','close'].map(k=>[k,{value:'',checked:false,disabled:k==='save',textContent:''}]));
      modal={html,fields,removed:false,querySelector:s=>fields[s.slice(6,-1)],remove(){this.removed=true;}};return modal;
    }},API:{
      get:async p=>p.endsWith('/review')?{success:true,data:{id:'r1',reservationNo:'AMK-1',name:'시험예약',date:'2026-11-15',pax:2,status,paymentStatus:'paid',revision:'revision-1'}}:{success:true,data:[]},
      post:async(p,b)=>{calls.push(['post',p,b]);return {success:false,error:'시험용 서버 오류'};}
    }};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../public/static/modules/admin.js',import.meta.url),'utf8'),ctx);
  return {ctx,calls,toasts,get modal(){return modal;},admin:ctx.window.AdminModule};
}
test('예약 목록 발권 버튼과 캐시된 이전 확인 버튼은 DB를 변경하지 않음',()=>{
  const f=fixture('confirmed');f.admin.issueWristbandFromReservation('r1','AMK-1');f.admin._doIssueWristbandFromRes('r1');
  assert.deepEqual(f.calls,[['route','/field/issuance?reservation=AMK-1']]);
});
test('발권 실수와 예약취소는 서로 다른 확인창·API를 사용',async()=>{
  const f=fixture();await f.admin.undoReservationIssuance('AMK-1','r1');
  assert.match(f.modal.html,/예약·결제·좌석은 유지/);
  assert.equal(f.modal.fields.save.disabled,true);await f.modal.fields.save.onclick();assert.equal(f.calls.length,0);
  const g=fixture('confirmed');await g.admin.cancelReservation('AMK-1','r1');assert.match(g.modal.html,/고객의 예약 자체를 취소/);
  g.modal.fields.reason.value='고객 요청 취소';g.modal.fields.reason.oninput();assert.equal(g.modal.fields.save.disabled,true);
  g.modal.fields.ack.checked=true;g.modal.fields.ack.onchange();assert.equal(g.modal.fields.save.disabled,false);
  await g.modal.fields.save.onclick();assert.equal(g.calls[0][1],'/api/issuance/reservations/r1/cancel');
  assert.equal(g.calls[0][2].cancelConfirmed,true);
});
test('서버 오류는 성공으로 표시하지 않고 중복 클릭은 한 번만 전송',async()=>{
  const f=fixture();let release;
  f.ctx.API.post=(p,b)=>{f.calls.push(['post',p,b]);return new Promise(r=>release=r);};
  await f.admin.undoReservationIssuance('AMK-1','r1');
  f.modal.fields.reason.value='잘못 누른 발권';f.modal.fields.ack.checked=true;f.modal.fields.ack.onchange();
  const first=f.modal.fields.save.onclick();await f.modal.fields.save.onclick();
  assert.equal(f.calls.length,1);assert.equal(f.calls[0][1],'/api/issuance/reservations/r1/undo');
  assert.equal(f.calls[0][2].recoveryChecked,true);
  release({success:false,error:'다른 창구에서 변경됨'});await first;
  assert.equal(f.modal.fields.error.textContent,'다른 창구에서 변경됨');assert.equal(f.modal.removed,false);
  assert.equal(f.toasts.some(([,type])=>type==='success'),false);
});
test('취소된 예약을 발권 되돌리기로 복구하거나 발권완료를 예약취소로 처리하지 않음',async()=>{
  const f=fixture('cancelled');await f.admin.undoReservationIssuance('AMK-1','r1');assert.equal(f.modal,undefined);
  const g=fixture('checkedin');await g.admin.cancelReservation('AMK-1','r1');assert.equal(g.modal,undefined);
  assert.equal(f.calls.length+g.calls.length,0);
});
