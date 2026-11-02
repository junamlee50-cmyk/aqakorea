import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
function setup() {
  const elements = {};
  const listeners = {};
  const ctx = vm.createContext({ console, URLSearchParams, setTimeout: () => 0, clearTimeout() {},
    localStorage: {getItem: () => null}, location:{pathname:'/',search:''},
    document: {getElementById: id => elements[id] || null, querySelector: () => null, querySelectorAll: () => []},
    history: {pushState(){}}, navigator: {},
  });
  ctx.window = ctx; ctx.addEventListener = (name, fn) => { listeners[name] = fn; };
  ctx.location.origin = 'http://localhost';
  for (const name of ['core','customer','payment','ticket']) vm.runInContext(readFileSync(`public/static/modules/${name}.js`,'utf8'),ctx);
  const run = s => vm.runInContext(s, ctx);
  run(`Utils.toast = (...args) => window.message = args[0]; Utils.loading = () => {}; Navbar.render = Footer.render = () => ''; Router.go = path => window.destination = path;`);
  return {ctx, run, elements, listeners};
}
const region = {id:'buyeo',name:'부여',status:'open', fares:[], company:{}, course:[]};
test('home/hub reflect API states and omit unverified metrics', async () => {
  for (const status of ['open','preparing','closed','suspended','unexpected']) {
    const {run,ctx} = setup(); ctx.region = {...region,status};
    run(`API.get = async () => ({success:true,data:[region]});`);
    const home = await run('CustomerPages.home()');
    assert.match(home, new RegExp(run('BookingState.label(region)')));
    assert.doesNotMatch(home,/4531|4,531|4\.9|부여 예약 가능|25,000원|09:30 \/ 11:30/);
    const hub = await run('CustomerPages.reservationHub()');
    assert.equal(hub.includes("Router.go('/reservation/buyeo')"), status === 'open');
    if(status !== 'open') assert.doesNotMatch(await run(`CustomerPages.regionPage('buyeo')`), /id="schedule-list"/);
  }
});
test('API failures show unavailable state without claiming reservations open', async () => {
  const {run} = setup(); run('API.get = async () => ({success:false});');
  assert.match(await run('CustomerPages.home()'),/운영 상태를 확인할 수 없습니다/);
  assert.match(await run('CustomerPages.reservationHub()'),/운영 상태를 확인할 수 없습니다/);
});
test('availability uses server seats, closes missing/suspended rows and respects date ranges', async () => {
  const {run,ctx} = setup(); ctx.region = region;
  run(`API.get = async p => p.includes('/regions/') ? {success:true,data:region} : p.includes('/schedules/') ? {success:true,data:[{id:'s1',time:'09:00',status:'active'},{id:'s2',time:'10:00',status:'active'},{id:'s3',time:'11:00',status:'active',startDate:'2026-12-01'}]} : {success:true,data:[]};`);
  const html = await run(`CustomerPages.regionPage('buyeo')`);
  assert.match(html,/날짜 선택 후 확인/);
  run(`API.get=async()=>({success:true,data:[{id:'s1',available:5,status:'active',onlineBooked:2}]});`);
  let seats = await run(`window._getAvailableSchedules('2026-11-03')`);
  assert.equal(seats.length,2); assert.equal(seats[0].available,5); assert.equal(seats[1].available,0);
  run(`API.get=async()=>({success:true,data:[{id:'s1',available:5,status:'suspended'}]});`);
  seats=await run(`window._getAvailableSchedules('2026-11-03')`); assert.equal(seats[0].available,0);
  run('API.get = async () => ({success:false});');
  assert.equal((await run(`window._getAvailableSchedules('2026-11-03')`)).length,0);
});
test('fare counters still work independently of ticket status', () => {
  const {run} = setup(); run(`CustomerPages._state.fares={adult:{count:0}}; CustomerPages.updateSummary=CustomerPages.renderPassengersForm=()=>{}; CustomerPages.changeFare('adult',1);`);
  assert.equal(run('CustomerPages._state.fares.adult.count'),1);
});
test('QR is limited to confirmed states, including completion fresh server lookup', async () => {
  for(const status of ['confirmed','payment_done','checkedin','payment_pending','cancelled','refunded','noshow','boarded','unknown']) {
    const {run,ctx} = setup(); ctx.ticket = {reservationNo:'RES-TEST',status};
    run('API.get=async()=>({success:true,data:ticket});');
    const html=await run(`TicketPage.show('RES-TEST')`);
    assert.equal(html.includes('id="ticket-qr-canvas"'),['confirmed','payment_done','checkedin'].includes(status));
    run(`Store.set('lastReservation', {reservationId:'RES-TEST',status:'confirmed'});`);
    assert.equal(await run('PaymentModule.complete()'), html);
    assert.match(html,/Router.go\('\/reservation\/check'\)/);
  }
});
test('lookup does not invent bookings or trust local data after server failure', async () => {
  const {run,ctx,elements} = setup();
  elements['booking-result']={innerHTML:''}; elements['chk-resId']={value:'RES-2025-052668'}; elements['chk-phone']={value:'01012345678'};
  ctx.localStorage.getItem = () => JSON.stringify([{id:'RES-2025-052668',phone:'01012345678',status:'confirmed'}]);
  run('API.get=async()=>({success:false});');
  await run('CustomerPages.checkBooking()'); assert.match(elements['booking-result'].innerHTML,/예약 정보를 찾을 수 없습니다/);
  await run(`CustomerPages._autoCheckBooking('RES-2025-052668')`); assert.doesNotMatch(elements['booking-result'].innerHTML,/canvas|예약 확정/);
});
test('phone suffix collision rejected; full phone match accepted', async () => {
  const {run,ctx,elements} = setup();
  elements['booking-result']={innerHTML:''}; elements['chk-resId']={value:'RES-TEST'}; elements['chk-phone']={value:'01099995678'};
  ctx.ticket = {reservationNo:'RES-TEST', phone:'01012345678',status:'confirmed'};
  run('API.get=async()=>({success:true,data:ticket});');
  await run('CustomerPages.checkBooking()'); assert.match(elements['booking-result'].innerHTML,/예약 정보를 찾을 수 없습니다/);
  elements['chk-phone'].value='01012345678'; await run('CustomerPages.checkBooking()'); assert.match(elements['booking-result'].innerHTML,/예약 확정/);
});
test('test payment does not expose a reservation confirmation action', () => {
  const {run,ctx} = setup(); run(`Utils.modal = html => window.modalHtml=html; PaymentModule.showMockPG({}, {pax:1,total:1000}, 'buyeo');`);
  assert.doesNotMatch(ctx.modalHtml,/PaymentModule.completePayment/); assert.match(ctx.modalHtml,/예약 미처리/);
});
test('submission rechecks seats, handles failure, and prevents double submit', async () => {
  for(const mode of ['closed','missing','insufficient','error','success']) {
    const {run,ctx} = setup(); ctx.mode=mode; ctx.calls=0;
    run(`Store.set('cart',{regionId:'buyeo',date:'2026-11-03',scheduleId:'s1',pax:2,total:1000});
    API.get=async p=>p.includes('/regions/')?{success:true,data:{status:mode==='closed'?'closed':'open'}}:{success:mode!=='missing',data:[{id:'s1',status:'active',available:mode==='insufficient'?1:3}]};
    API.post=async()=>{calls++; return mode==='error'?{success:false}:{success:true,data:{reservationId:'RES-TEST',status:'payment_pending'}}};`);
    await Promise.all([run(`PaymentModule.completePayment('buyeo')`),run(`PaymentModule.completePayment('buyeo')`)]);
    assert.equal(ctx.calls,['success','error'].includes(mode)?1:0);
    assert.equal(ctx.destination,mode==='success'?'/payment/complete':undefined);
    assert.equal(run('PaymentModule._submitting'),false);
  }
});
