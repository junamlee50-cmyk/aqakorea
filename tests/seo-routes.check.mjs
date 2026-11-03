import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/_worker.js';
async function get(path){const response=await worker.fetch(new Request('https://aquamobility.co.kr'+path),{});return {response,text:await response.text()};}
test('home includes search terms and crawlable content without JavaScript',async()=>{
 const {response,text}=await get('/');assert.equal(response.status,200);
 assert.match(text,/<title>아쿠아모빌리티코리아.*수륙양용버스/);
 const body=text.split('<div id="app">')[1].split('<div id="toast-container">')[0];
 for(const term of ['수륙양용버스','수륙양용시티투어','통영','부여','부산'])assert.ok(body.includes(term));
 assert.match(text,/window\.tailwind=window\.tailwind\|\|\{\}/);
});
test('regional info pages have unique canonical, visible body, and valid service links',async()=>{
 for(const slug of ['amphibious-bus','buyeo-amphibious-bus','tongyeong-amphibious-bus','busan-amphibious-bus']){
  const {response,text}=await get('/'+slug);assert.equal(response.status,200);
  assert.ok(text.includes(`rel="canonical" href="https://aquamobility.co.kr/${slug}"`));
  assert.match(text,/<h1[^>]*>.+<\/h1>/);assert.match(text,/<a[^>]+href="\/reservation"/);
  assert.doesNotMatch(text,/http-equiv="refresh"/);
  if(slug.startsWith('busan')){assert.match(text,/운행 중인 상품의 판매 페이지가 아닙니다/);assert.doesNotMatch(text,/href="\/reservation\/busan"/);}
  if(slug.startsWith('buyeo'))assert.match(text,/아직 실제 운행 전/);
  if(slug.startsWith('tongyeong'))assert.match(text,/<title>통영수륙양용시티투어·통영수륙양용버스/);
 }
});
test('sitemap is unique and includes all regional information pages without customer records',async()=>{
 const {text}=await get('/sitemap.xml');const locs=[...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(locs).size,locs.length);
 for(const slug of ['amphibious-bus','buyeo-amphibious-bus','tongyeong-amphibious-bus','busan-amphibious-bus'])assert.ok(locs.includes('https://aquamobility.co.kr/'+slug));
 assert.doesNotMatch(text,/\/ticket\/|\/payment\/|\/reservation\/check|\/reservation\/detail/);
});
test('crawler groups retain private-route exclusions',async()=>{
 const {response,text}=await get('/robots.txt');assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/plain/);
 assert.equal((text.match(/User-agent:/g)||[]).length,1);
 for(const route of ['/api/','/ticket/','/reservation/check','/reservation/detail/','/admin','/field'])assert.ok(text.includes('Disallow: '+route));
 assert.match(text,/Sitemap: https:\/\/aquamobility.co.kr\/sitemap.xml/);
});
test('booking lookup, payment and QR documents are not indexed',async()=>{
 for(const path of ['/reservation/check','/reservation/detail/RES-QA','/ticket/RES-QA','/payment']){
  const {text}=await get(path);assert.match(text,/<meta name="robots" content="noindex,nofollow">/);
 }
});
