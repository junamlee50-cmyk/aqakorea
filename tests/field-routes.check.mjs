import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/_worker.js';
async function get(path){const response=await worker.fetch(new Request('https://aquamobility.co.kr'+path),{});return {response,text:await response.text()};}
test('현장 직접 주소/새로고침은 noindex 앱 문서를 200으로 반환',async()=>{
 for(const path of ['/field','/field/dashboard','/field/issuance','/field/issuance?reservation=BYO-TEST']){
  const {response,text}=await get(path);assert.equal(response.status,200,path);
  assert.match(text,/<meta name="robots" content="noindex,nofollow">/);
  assert.match(text,/window\.__PAGE_DATA__ = \{"page":"field"\}/);
  assert.match(text,/modules\/wristband-desk.js/);
 }
});
test('등록하지 않은 현장 경로는 포괄적인 SPA 성공 응답으로 숨기지 않음',async()=>{
 for(const path of ['/field/unknown-route','/field/scan'])assert.equal((await get(path)).response.status,404);
});
