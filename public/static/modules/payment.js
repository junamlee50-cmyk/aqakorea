// ============================================================
// PAYMENT MODULE - 결제 목업 + QR 탑승권 + 대기예약
// ============================================================

const PaymentModule = {

  // ── 스케줄 시간 추출 헬퍼 (24시간제) ──────────────────────
  // scheduleId에서 실제 시간 추출 (localStorage 저장 스케줄 우선)
  _getScheduleTime: (scheduleId, regionId) => {
    if (!scheduleId) return '-';
    // localStorage에 저장된 스케줄 데이터에서 검색
    try {
      const allSch = JSON.parse(localStorage.getItem('amk_settings') || '{}').schedules || {};
      const regionSch = allSch[regionId] || [];
      const found = regionSch.find(s => s.id === scheduleId);
      if (found?.time) return found.time;
      // ID 패턴에서 추출: 예) tongyeong-0900 → 09:00
      const match = scheduleId.match(/[-_](\d{4})$/);
      if (match) { const t = match[1]; return `${t.slice(0,2)}:${t.slice(2,4)}`; }
    } catch(e) {}
    return '-';
  },

  // ── 결제 페이지 ────────────────────────────────────────────
  page: async () => {
    const cart = Store.get('cart');
    if (!cart) { Router.go('/reservation'); return ''; }
    const regRes = await API.get(`/api/regions/${cart.regionId}`);
    if (!regRes.success || !BookingState.canBook(regRes.data)) { Utils.toast('현재 예약 접수가 불가능하거나 운영 상태를 확인할 수 없습니다.', 'warning'); Router.go('/reservation'); return ''; }
    const region = regRes.data;
    setTimeout(() => Navbar.init(), 100);
    return `
${Navbar.render()}
<div style="padding-top:64px" class="min-h-screen bg-gray-50">
<div class="max-w-5xl mx-auto px-4 py-8">
  <!-- 진행 단계 -->
  <div class="bg-white rounded-2xl p-4 mb-6 shadow-sm">
    <div class="progress-steps justify-center">
      ${[['날짜선택','✓'],['인원선택','✓'],['탑승신고서','✓'],['결제','4'],['완료','5']].map(([l,n],i)=>`
      <div class="step-item">
        <div class="flex flex-col items-center">
          <div class="step-circle ${i<3?'completed':i===3?'active':'pending'}">${i<3?'✓':n}</div>
          <div class="step-label mt-1">${l}</div>
        </div>
        ${i<4?`<div class="step-line ${i<3?'completed':''}"></div>`:''}
      </div>`).join('')}
    </div>
  </div>

  <div class="grid md:grid-cols-3 gap-6">
    <!-- 결제 정보 -->
    <div class="md:col-span-2 space-y-4">
      <!-- 실제 판매자 표시 (중요!) -->
      <div class="payment-seller-box">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center text-xl">🏢</div>
          <div>
            <div class="text-xs text-cyan-600 font-bold">실제 판매자</div>
            <div class="font-black text-navy-800 text-lg">${region.company?.name || '운영법인'}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><span class="text-gray-500">PG 상점ID</span><br><code class="bg-white px-2 py-0.5 rounded text-xs font-mono text-navy-800">${region.pgMerchant?.merchantId || '-'}</code></div>
          <div><span class="text-gray-500">PG사</span><br><span class="font-medium">${region.pgMerchant?.pgName || '-'} <span class="badge badge-yellow text-xs">테스트모드</span></span></div>
          <div><span class="text-gray-500">환불 주체</span><br><span class="font-medium">${region.company?.name || '-'}</span></div>
          <div><span class="text-gray-500">정산 계좌</span><br><span class="text-xs font-medium">${region.company?.bankAccount || '-'}</span></div>
        </div>
        <div class="mt-3 text-xs text-cyan-700 bg-cyan-50 rounded-lg p-2">
          <i class="fas fa-info-circle mr-1"></i> 결제금은 아쿠아모빌리티코리아 본사가 아닌 <strong>${region.company?.name || '해당 지역 운영법인'}</strong>으로 직접 정산됩니다.
        </div>
      </div>

      <!-- 예약 정보 -->
      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <h2 class="font-bold text-navy-800 mb-4">📋 예약 정보</h2>
        <table class="w-full text-sm">
          <tr class="border-b border-gray-100"><td class="py-2.5 text-gray-500 w-28">상품명</td><td class="py-2.5 font-medium">${region.name} 수륙양용 시티투어 탑승권</td></tr>
          <tr class="border-b border-gray-100"><td class="py-2.5 text-gray-500">예약지역</td><td class="py-2.5 font-medium">${region.location || region.name}</td></tr>
          <tr class="border-b border-gray-100"><td class="py-2.5 text-gray-500">탑승일자</td><td class="py-2.5 font-bold">${Utils.dateKo(cart.date)}</td></tr>
          <tr class="border-b border-gray-100"><td class="py-2.5 text-gray-500">탑승시간</td><td class="py-2.5 font-bold">${PaymentModule._getScheduleTime(cart.scheduleId, cart.regionId)}</td></tr>
          <tr class="border-b border-gray-100"><td class="py-2.5 text-gray-500">탑승인원</td><td class="py-2.5">${cart.paxList?.join(', ') || cart.pax+'명'}</td></tr>
          <tr class="border-b border-gray-100"><td class="py-2.5 text-gray-500">탑승장</td><td class="py-2.5 text-xs">${region.boardingPlace}</td></tr>
          <tr class="border-b border-gray-100"><td class="py-2.5 text-gray-500">예약자</td><td class="py-2.5">${cart.name} / ${Utils.maskPhone(cart.phone)}</td></tr>
          <tr><td class="py-2.5 text-gray-500">고객센터</td><td class="py-2.5 text-cyan-600 font-bold">${region.customerService}</td></tr>
        </table>
      </div>

      <!-- 결제 수단 -->
      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <h2 class="font-bold text-navy-800 mb-4">💳 결제 수단</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          ${[
            {id:'card',icon:'💳',label:'신용카드'},
            {id:'transfer',icon:'🏦',label:'실시간계좌이체'},
            {id:'vbank',icon:'🏧',label:'가상계좌'},
            {id:'wired',icon:'📋',label:'무통장입금'},
            {id:'free',icon:'🎫',label:'무료/초대권'},
          ].map(m=>`
          <button class="payment-method-btn ${m.id==='card'?'selected':''}" id="pm-${m.id}" onclick="PaymentModule.selectMethod('${m.id}')">
            <div class="text-2xl mb-1">${m.icon}</div>
            <div class="text-sm font-medium">${m.label}</div>
          </button>`).join('')}
        </div>

        <!-- 카드 결제 안내 -->
        <div id="pm-detail-card" class="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
          <div class="font-bold mb-1">💳 신용/체크카드 결제</div>
          <p>결제 클릭 시 ${region.pgMerchant?.pgName || 'PG'} 결제창이 열립니다.<br>
          <span class="text-xs text-blue-600">실제 PG 계약 전 목업 처리됩니다.</span></p>
        </div>
        <div id="pm-detail-vbank" class="hidden bg-purple-50 rounded-xl p-4 text-sm text-purple-800">
          <div class="font-bold mb-1">🏧 가상계좌 발급</div>
          <p>입금 완료 시 자동 예약 확정됩니다.<br>입금 기한: 결제 후 24시간 이내</p>
        </div>
        <div id="pm-detail-wired" class="hidden bg-green-50 rounded-xl p-4 text-sm text-green-800">
          <div class="font-bold mb-2">📋 무통장입금 계좌</div>
          <div class="bg-white rounded-lg p-3 font-mono text-sm">
            <div class="font-bold text-navy-800">${region.company?.bankAccount || '계좌정보 없음'}</div>
            <div class="text-gray-500 text-xs mt-1">예금주: ${region.company?.name || '-'}</div>
          </div>
          <p class="text-xs mt-2">⚠️ 본사 계좌가 아닌 <strong>${region.company?.name}</strong> 계좌로 입금하세요.</p>
        </div>
        <div id="pm-detail-transfer" class="hidden bg-teal-50 rounded-xl p-4 text-sm text-teal-800">
          <div class="font-bold mb-1">🏦 실시간 계좌이체</div>
          <p>공인인증서 또는 간편인증으로 즉시 이체 처리됩니다.</p>
        </div>
        <div id="pm-detail-free" class="hidden bg-yellow-50 rounded-xl p-4 text-sm text-yellow-800">
          <div class="font-bold mb-1">🎫 무료/초대권</div>
          <div class="form-group mt-2">
            <input type="text" class="form-input" placeholder="초대권 코드 입력" id="invite-code">
          </div>
        </div>
      </div>
    </div>

    <!-- 오른쪽: 결제 요약 -->
    <div>
      <div class="summary-box sticky top-20">
        <div class="text-white/60 text-sm mb-1">결제 금액</div>
        <div class="summary-total text-4xl mb-6">${Utils.money(cart.total)}</div>
        <div class="space-y-2 text-sm mb-4">
          <div class="summary-row"><span class="text-white/70">지역</span><span class="text-white font-bold">${region.name}</span></div>
          <div class="summary-row"><span class="text-white/70">탑승일</span><span class="text-white font-bold">${Utils.dateKo(cart.date)}</span></div>
          <div class="summary-row"><span class="text-white/70">인원</span><span class="text-white font-bold">${cart.pax}명</span></div>
          <div class="summary-row"><span class="text-white/70">매출 귀속</span><span class="text-cyan-400 text-xs font-bold">${region.company?.name}</span></div>
        </div>
        <button onclick="PaymentModule.processPayment('${cart.regionId}')" class="btn-ocean btn-xl mb-3">
          <i class="fas fa-lock mr-2"></i>${Utils.money(cart.total)} 결제하기
        </button>
        <div class="text-center text-xs text-white/40">
          <i class="fas fa-shield-alt mr-1"></i> SSL 보안 결제 | ${region.pgMerchant?.merchantId}
        </div>
        <div class="mt-4 pt-4 border-t border-white/10 text-xs text-white/40 leading-relaxed">
          결제 클릭 시 위의 예약 정보 및 환불규정에 동의하는 것으로 간주합니다.<br>
          환불 문의: ${region.customerService}
        </div>
      </div>
    </div>
  </div>
</div>
</div>
${Footer.render()}`;
  },

  _selectedMethod: 'card',
  selectMethod: (method) => {
    PaymentModule._selectedMethod = method;
    document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById(`pm-${method}`)?.classList.add('selected');
    ['card','vbank','wired','transfer','free'].forEach(m => {
      const el = document.getElementById(`pm-detail-${m}`);
      if (el) el.classList.toggle('hidden', m !== method);
    });
  },

  processPayment: async (regionId) => {
    const cart = Store.get('cart');
    if (!cart || cart.regionId !== regionId) { Router.go('/reservation'); return; }
    const regRes = await API.get(`/api/regions/${encodeURIComponent(regionId)}`);
    if (!regRes.success || !BookingState.canBook(regRes.data)) { Utils.toast('현재 예약 접수가 불가능합니다.', 'warning'); return; }
    Utils.loading(true);
    // PG 분기 - 지역별 merchantId 결정
    const pgRes = await API.post('/api/payment/request', { regionId, amount: cart.total });
    await new Promise(r => setTimeout(r, 1500));
    Utils.loading(false);
    if (!pgRes.success || !pgRes.data) { Utils.toast(pgRes.message || '결제 요청에 실패했습니다. 다시 시도해 주세요.', 'error'); return; }
    // 목업 결제창 표시
    PaymentModule.showMockPG(pgRes.data, cart, regionId);
  },

  showMockPG: (pgData, cart, regionId) => {
    const m = Utils.modal(`
      <div style="background:linear-gradient(135deg,#071f4e,#0a2d6b);border-radius:16px 16px 0 0;padding:20px;color:white">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs text-white/60 mb-1">결제 (테스트 모드)</div>
            <div class="font-bold">${pgData?.pgName || 'PG'} 결제창</div>
          </div>
          <div class="text-right">
            <div class="text-xs text-white/60">PG 상점ID</div>
            <code class="text-cyan-400 text-xs font-mono">${pgData?.merchantId}</code>
          </div>
        </div>
      </div>
      <div class="p-6">
        <div class="bg-blue-50 rounded-xl p-4 mb-4 text-sm text-blue-800">
          <div class="font-bold mb-2">⚠️ 목업 결제 안내</div>
          <p>실제 PG 계약 전이므로 테스트 모드로 동작합니다.<br>실제 결제와 예약 확정은 처리되지 않습니다. 정식 결제 연동 후 이용해 주세요.</p>
        </div>
        <div class="space-y-2 text-sm mb-4">
          <div class="flex justify-between border-b pb-2"><span class="text-gray-500">주문번호</span><span class="font-mono text-xs">${pgData?.orderId}</span></div>
          <div class="flex justify-between border-b pb-2"><span class="text-gray-500">상품명</span><span>수륙양용투어 탑승권 ${cart.pax}명</span></div>
          <div class="flex justify-between border-b pb-2"><span class="text-gray-500">결제금액</span><span class="font-black text-xl text-navy-800">${Utils.money(cart.total)}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">판매자</span><span class="text-cyan-600 font-bold text-xs">${pgData?.seller}</span></div>
        </div>
        <div class="flex gap-3">
          <button onclick="Utils.closeModal()" class="btn-ocean flex-1 py-3">
            <i class="fas fa-check mr-2"></i>확인 (결제·예약 미처리)
          </button>
          <button onclick="Utils.closeModal()" class="btn-outline px-4 py-3 text-sm">취소</button>
        </div>
      </div>`, { size: 'max-w-sm' });
  },

  completePayment: async (regionId) => {
    const cart = Store.get('cart');
    if (PaymentModule._submitting || !cart || cart.regionId !== regionId) return;
    PaymentModule._submitting = true;
    Utils.loading(true);
    try {
      const regRes = await API.get(`/api/regions/${encodeURIComponent(regionId)}`);
      if (!regRes.success || !BookingState.canBook(regRes.data)) { Utils.toast('현재 예약 접수가 불가능합니다.', 'warning'); return; }
      const seats = await API.get(`/api/schedules/${encodeURIComponent(regionId)}/availability?date=${encodeURIComponent(cart.date)}`);
      const schedule = seats.success && Array.isArray(seats.data) && seats.data.find(s => s.id === cart.scheduleId);
      if (!schedule || !['active','available'].includes(schedule.status) || !Number.isFinite(schedule.available) || !Number.isInteger(cart.pax) || cart.pax <= 0 || schedule.available < cart.pax) {
        Utils.toast('선택한 회차의 잔여석을 확인할 수 없거나 좌석이 부족합니다. 다시 선택해 주세요.', 'warning'); return;
      }
      const res = await API.post('/api/reservations', { ...cart, totalAmount: cart.total, channel: 'online' });
      if (!res.success || !BookingState.number(res.data)) { Utils.toast(res.message || '예약 접수에 실패했습니다. 예약내역을 확인한 후 다시 시도해 주세요.', 'error'); return; }
      Store.set('lastReservation', { ...res.data, reservationId: BookingState.number(res.data) });
      Router.go('/payment/complete');
    } catch (e) {
      Utils.toast('예약 처리 결과를 확인할 수 없습니다. 예약내역을 먼저 확인해 주세요.', 'error');
    } finally {
      PaymentModule._submitting = false;
      Utils.loading(false);
    }
  },

  // ── 결제 완료 + QR 탑승권 ───────────────────────────────────
  complete: async () => {
    const reservation = Store.get('lastReservation');
    if (!reservation) { Router.go('/'); return ''; }
    return TicketPage.show(BookingState.number(reservation));
  },


  renderWristbandPreview: (data) => {
    const wb = Settings.get('wristbandText');
    return `
    <div class="wristband-preview" id="wristband-print-area">
      <div class="wristband-left">
        <div class="wristband-brand">${wb.brand || 'Aqua Mobility Korea'}</div>
        <div class="wristband-region">${data.region}</div>
        <div class="wristband-time">${data.time}</div>
        <div class="wristband-info">${data.date} | ${data.round} | ${data.type}</div>
        <div class="wristband-info font-mono text-xs mt-1">${data.reservationId}</div>

      </div>
      <canvas id="qr-wristband-preview" class="wristband-qr"></canvas>
    </div>`;
  },

  // ── 대기예약 페이지 ─────────────────────────────────────────
  waitlist: async (regionId) => {
    const regRes = await API.get(`/api/regions/${regionId || 'buyeo'}`);
    const region = regRes.data || {};
    setTimeout(() => Navbar.init(), 100);
    return `
${Navbar.render()}
<div style="padding-top:64px" class="min-h-screen bg-gray-50">
<div class="max-w-xl mx-auto px-4 py-12">
  <div class="text-center mb-8">
    <div class="text-5xl mb-4">⏳</div>
    <h1 class="text-2xl font-black text-navy-800 mb-2">대기예약 신청</h1>
    <p class="text-gray-500">원하는 회차가 매진되었나요? 대기 신청 후 취소석 발생 시 알림을 받으세요.</p>
  </div>
  <div class="bg-white rounded-2xl p-6 shadow-sm">
    <div class="grid gap-4">
      <div class="form-group">
        <label class="form-label required">성함</label>
        <input type="text" class="form-input" id="wl-name" placeholder="이름">
      </div>
      <div class="form-group">
        <label class="form-label required">연락처</label>
        <input type="tel" class="form-input" id="wl-phone" placeholder="010-0000-0000">
      </div>
      <div class="form-group">
        <label class="form-label required">희망 지역</label>
        <select class="form-select" id="wl-region">
          <option value="tongyeong">통영해양관광</option>
          <option value="buyeo" ${regionId==='buyeo'?'selected':''}>부여수륙양용투어</option>
          <option value="hapcheon">합천수륙양용투어</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">희망 날짜</label>
        <input type="date" class="form-input" id="wl-date" min="${Utils.today()}">
      </div>
      <div class="form-group">
        <label class="form-label required">희망 회차</label>
        <select class="form-select" id="wl-time">
          <option value="09:00">09:00</option><option value="09:30">09:30</option><option value="10:00">10:00</option><option value="11:00">11:00</option><option value="12:00">12:00</option><option value="13:00">13:00</option><option value="14:00">14:00</option><option value="15:00">15:00</option><option value="15:30">15:30</option><option value="16:00">16:00</option><option value="17:00">17:00</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">희망 인원</label>
        <input type="number" class="form-input" id="wl-pax" min="1" max="20" value="2">
      </div>
    </div>
    <div class="bg-amber-50 rounded-xl p-3 text-xs text-amber-800 mt-3 mb-4">
      <i class="fas fa-info-circle mr-1"></i>취소석 발생 시 문자로 알려드립니다. 알림 수신 후 30분 이내 예약하지 않으면 다음 대기자에게 기회가 넘어갑니다.
    </div>
    <button onclick="PaymentModule.submitWaitlist()" class="btn-primary btn-xl">대기예약 신청하기</button>
  </div>
</div>
</div>
${Footer.render()}`;
  },

  submitWaitlist: async () => {
    const data = {
      name: document.getElementById('wl-name')?.value,
      phone: document.getElementById('wl-phone')?.value,
      region: document.getElementById('wl-region')?.value,
      date: document.getElementById('wl-date')?.value,
      time: document.getElementById('wl-time')?.value,
      pax: document.getElementById('wl-pax')?.value,
    };
    if (!data.name || !data.phone || !data.date) { Utils.toast('필수 항목을 모두 입력해주세요', 'warning'); return; }
    Utils.loading(true);
    await new Promise(r => setTimeout(r, 800));
    Utils.loading(false);
    Utils.toast(`대기예약 접수 완료! 대기순번 3번입니다. 취소석 발생 시 ${Utils.maskPhone(data.phone)}으로 문자드립니다.`, 'success', 5000);
  },
};

window.PaymentModule = PaymentModule;
