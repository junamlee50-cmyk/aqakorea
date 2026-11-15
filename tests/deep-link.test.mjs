import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
async function boot(path, page, signedIn=false){
  const url=new URL(path,'https://aquamobility.co.kr'),events={},routes=new Map(),calls=[],store=new Map();
  const ctx={console:{log(){},warn(){},error(){}},URLSearchParams,setTimeout:()=>0,Date,history:{back(){}},navigator:{},location:url,
    document:{readyState:'loading',addEventListener:(type,fn)=>{events[type]=fn;}},
    localStorage:{getItem:()=>null,removeItem(){}},addEventListener(){},__PAGE_DATA__:{page},
    Store:{get:k=>store.get(k),set:(k,v)=>store.set(k,v)},Router:{add:(path,handler)=>routes.set(path,handler),go:path=>calls.push(path)},
    API:{get:async()=>({success:true,data:[]})},Utils:{toast(){}},Settings:{get:()=>null},
    Navbar:{},Footer:{},PopupManager:{},CustomerPages:{},PaymentModule:{},FieldModule:{},
    AdminModule:{loginPage:()=>'<login>'},StatsModule:{},SeoModule:{},WristbandDesk:{page:()=>'<issuance>'}};
  ctx.window=ctx;if(signedIn){store.set('adminUser',{id:'test-admin',role:'regional'});store.set('adminLoginTime',Date.now());}
  vm.createContext(ctx);vm.runInContext(readFileSync(new URL('../public/static/app.js',import.meta.url),'utf8'),ctx);
  await events.DOMContentLoaded();return {routes,calls};
}
test('주소 직접 입력/새로고침은 현장·예약상세 경로와 쿼리를 유지',async()=>{
 for(const [url,page] of [['/field/issuance?reservation=BYO-TEST','field'],['/field/dashboard','field'],['/admin/reservations?detail=BYO-TEST','admin'],['/ticket/BYO-TEST?from=admin','ticket']]){
  const f=await boot(url,page,true);assert.equal(f.calls[0],url);
 }
});
test('현장 발권 직접 접속도 로그인 검사를 거치고 로그인 사용자만 화면에 진입',async()=>{
 const guest=await boot('/field/issuance','field');assert.equal(await guest.routes.get('/field/issuance')({}),'<login>');assert.equal(guest.calls.at(-1),'/admin/login');
 const admin=await boot('/field/issuance','field',true);assert.equal(await admin.routes.get('/field/issuance')({}),'<issuance>');
});
