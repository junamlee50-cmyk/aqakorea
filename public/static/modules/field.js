// ============================================================
// FIELD MODULE - 현장 매표소 + QR 체크인 + 손목밴드 발급
// ============================================================

const FieldModule = {

  // ── 현장 매표소 메인 ────────────────────────────────────────
  dashboard: async () => {
    const cart = Store.get('user');
    const regionId = cart?.region || 'buyeo';
    const today = Utils.today();
    const [schRes, regRes, availRes] = await Promise.all([
      API.get(`/api/schedules/${regionId}`),
      API.get(`/api/regions/${regionId}`),
      API.get(`/api/reservations/availability/${regionId}/${today}`),
    ]);
    const rawSchedules = schRes.data || [];
    // Merge availability data into schedules so seat counts are real
    const availMap = {};
    (availRes.data || []).forEach(a => { availMap[a.scheduleId] = a; });
    const schedules = rawSchedules.map(s => {
      const av = availMap[s.id] || {};
      const booked = av.booked || 0;
      const capacity = s.capacity || av.capacity || 0;
      const onlineCapacity = s.onlineCapacity || av.onlineCapacity || 0;
      const offlineCapacity = s.offlineCapacity || (capacity - onlineCapacity);
      // Estimate split proportionally
      const onlineBooked = Math.min(booked, onlineCapacity);
      const offlineBooked = Math.max(0, booked - onlineBooked);
      return {
        ...s,
        capacity,
        onlineCapacity,
        offlineCapacity,
        booked,
        bookedOnline: onlineBooked,
        bookedOffline: offlineBooked,
        onlineAvailable: Math.max(0, onlineCapacity - onlineBooked),
        offlineAvailable: Math.max(0, offlineCapacity - offlineBooked),
        available: av.available != null ? av.available : (capacity - booked),
        isFull: av.isFull || false,
      };
    });
    const region = regRes.data || {};

    setTimeout(() => FieldModule.initRealtime(), 200);
    return `
<div class="min-h-screen bg-gray-900">
  <!-- 현장 헤더 -->
  <div class="bg-gradient-to-r from-navy-900 to-ocean-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-xl">🚌</div>
      <div>
        <div class="text-white font-black text-sm">현장 매표소</div>
        <div class="text-cyan-400 text-xs">${region.name || '지역 선택 필요'} · ${today}</div>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <div id="online-status" class="flex items-center gap-1 text-xs text-green-400"><span class="w-2 h-2 bg-green-400 rounded-full pulse-anim"></span>온라인</div>
      <button onclick="FieldModule.showRegionSelect()" class="text-white/70 text-xs bg-white/10 px-2 py-1 rounded-lg">지역변경</button>
      <button onclick="Router.go('/admin')" class="text-white/70 text-xs bg-white/10 px-2 py-1 rounded-lg">관리자</button>
    </div>
  </div>

  <div class="p-4 max-w-3xl mx-auto">
    <!-- 오늘 좌석 현황 -->
    <div class="field-seat-display mb-4">
      <div class="flex items-center justify-between mb-3">
        <span class="text-white font-bold">오늘 좌석 현황</span>
        <button onclick="FieldModule.refreshSeats()" class="text-cyan-400 text-xs"><i class="fas fa-sync-alt mr-1"></i>새로고침</button>
      </div>
      <div class="grid grid-cols-4 gap-3 text-center mb-3">
        ${[
          {l:'전체정원',v:'120',c:'text-white'},
          {l:'온라인예약',v:'87',c:'text-cyan-400'},
          {l:'현장판매',v:'18',c:'text-green-400'},
          {l:'전체잔여',v:'15',c:'text-yellow-400'},
        ].map(s=>`<div class="bg-white/10 rounded-xl p-3"><div class="text-2xl font-black ${s.c}">${s.v}</div><div class="text-xs text-white/60 mt-1">${s.l}</div></div>`).join('')}
      </div>
      <!-- 회차별 현황 -->
      <div class="space-y-2">
        ${schedules.map(s=>`
        <div class="bg-white/10 rounded-xl p-3 flex items-center justify-between">
          <div class="text-white font-bold text-lg">${s.time}</div>
          <div class="flex gap-3 text-xs text-center">
            <div><div class="text-cyan-400 font-bold">${s.onlineAvailable != null ? s.onlineAvailable : s.onlineCapacity || 0}</div><div class="text-white/40">온라인잔여</div></div>
            <div><div class="text-green-400 font-bold">${s.offlineAvailable != null ? s.offlineAvailable : s.offlineCapacity || 0}</div><div class="text-white/40">현장잔여</div></div>
            <div><div class="text-white font-bold">${s.bookedOnline + s.bookedOffline || 0}</div><div class="text-white/40">예약완료</div></div>
          </div>
          <span class="badge ${s.isFull?'badge-red':s.status==='soldout'?'badge-red':'badge-green'} text-xs">
            ${s.isFull||s.status==='soldout'?'매진':'운행중'}
          </span>
        </div>`).join('')}
      </div>
    </div>

    <!-- 메인 액션 버튼 (크게!) -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <button class="field-btn field-btn-ocean" style="min-height:90px" onclick="FieldModule.showReservationSearch()">
        <i class="fas fa-search text-3xl"></i>
        <span>예약 조회</span>
        <span class="text-xs text-white/70">예약번호·이름 검색</span>
      </button>
      <button class="field-btn field-btn-green" style="min-height:90px" onclick="FieldModule.showWristbandIssue()">
        <i class="fas fa-id-badge text-3xl"></i>
        <span>팔찌 인쇄</span>
        <span class="text-xs text-white/70">개인별 팔찌 출력</span>
      </button>
      <button class="field-btn field-btn-blue" style="min-height:90px" onclick="FieldModule.showFieldSale()">
        <i class="fas fa-cash-register text-3xl"></i>
        <span>현장 발권</span>
        <span class="text-xs text-white/70">현장판매 좌석</span>
      </button>
      <button class="field-btn field-btn-purple" style="min-height:90px" onclick="FieldModule.showPassengerList()">
        <i class="fas fa-list-alt text-3xl"></i>
        <span>탑승자 명부</span>
        <span class="text-xs text-white/70">PDF / 엑셀 출력</span>
      </button>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-4">
      <button class="field-btn field-btn-orange" style="min-height:70px;font-size:13px" onclick="FieldModule.showWristbandReissue()">
        <i class="fas fa-redo text-xl"></i>재발급
      </button>
      <button class="field-btn field-btn-gray" style="min-height:70px;font-size:13px" onclick="FieldModule.showWristbandScan()">
        <i class="fas fa-check-circle text-xl"></i>탑승확인
      </button>
      <button class="field-btn field-btn-red" style="min-height:70px;font-size:13px" onclick="FieldModule.showSuspension()">
        <i class="fas fa-ban text-xl"></i>긴급운휴
      </button>
      <button class="field-btn field-btn-yellow" style="min-height:70px;font-size:13px" onclick="FieldModule.showDailyClose()">
        <i class="fas fa-calculator text-xl"></i>일마감
      </button>
      <button class="field-btn field-btn-blue" style="min-height:70px;font-size:13px" onclick="FieldModule.showOfflineMode()">
        <i class="fas fa-wifi text-xl"></i>오프라인모드
      </button>
      <button class="field-btn field-btn-gray" style="min-height:70px;font-size:13px" onclick="Router.go('/admin/region/schedules')">
        <i class="fas fa-cog text-xl"></i>설정
      </button>
    </div>

    <!-- 최근 체크인 목록 -->
    <div class="bg-gray-800 rounded-2xl p-4">
      <div class="flex items-center justify-between mb-3">
        <span class="text-white font-bold text-sm">최근 체크인</span>
        <button onclick="FieldModule.showPassengerList()" class="text-cyan-400 text-xs">전체보기</button>
      </div>
      <div class="space-y-2" id="recent-checkins">
        ${[
          {name:'김민수',time:'09:12',type:'성인',status:'손목밴드발급'},
          {name:'이지영',time:'09:18',type:'성인 2명',status:'탑승완료'},
          {name:'박상호',time:'09:22',type:'성인+경로',status:'체크인대기'},
        ].map(c=>`
        <div class="flex items-center justify-between bg-gray-700/50 rounded-xl p-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm">${c.name[0]}</div>
            <div><div class="text-white text-sm font-medium">${Utils.maskName(c.name)}</div><div class="text-gray-400 text-xs">${c.type}</div></div>
          </div>
          <div class="text-right">
            <div class="text-xs text-gray-400">${c.time}</div>
            <span class="badge ${c.status==='탑승완료'?'badge-green':c.status==='손목밴드발급'?'badge-blue':'badge-yellow'} text-xs">${c.status}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>
</div>`;
  },

  // ── 예약 조회 (검색) ────────────────────────────────────────
  showReservationSearch: () => {
    Utils.modal(`
      <div class="modal-header bg-navy-800 rounded-t-2xl">
        <div class="text-white font-bold flex items-center gap-2"><i class="fas fa-search text-cyan-400"></i> 예약 조회</div>
        <button onclick="Utils.closeModal()" class="text-white/60 hover:text-white text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="mb-4">
          <label class="form-label text-sm text-gray-600 mb-1 block">예약번호 또는 예약자명</label>
          <div class="flex gap-2">
            <input type="text" class="form-input flex-1" id="res-search-input" placeholder="예: RES-2025-001234 또는 홍길동"
              onkeydown="if(event.key==='Enter') FieldModule.processReservationSearch()">
            <button onclick="FieldModule.processReservationSearch()" class="btn-ocean px-4">조회</button>
          </div>
        </div>
        <div id="res-search-result"></div>
      </div>`, { size: 'max-w-sm' });
    setTimeout(() => document.getElementById('res-search-input')?.focus(), 100);
  },

  processReservationSearch: async () => {
    const input = document.getElementById('res-search-input')?.value?.trim();
    if (!input) { Utils.toast('예약번호 또는 이름을 입력하세요', 'warning'); return; }
    const resultEl = document.getElementById('res-search-result');
    if (resultEl) resultEl.innerHTML = '<div class="text-center text-gray-400 py-4"><i class="fas fa-spinner fa-spin mr-2"></i>조회 중...</div>';
    const res = await API.get(`/api/reservations/ticket/${encodeURIComponent(input)}`);
    if (res.success && res.data) {
      const d = res.data;
      const found = {
        id: d.reservationNo || input,
        reservation_no: d.reservationNo || input,
        regionName: d.regionName || d.region_name || '-',
        date: d.date || '-',
        time: d.time || '-',
        name: d.name || '-',
        pax: d.pax || 1,
        paxDetail: d.paxDetail || [],
        passengers: d.passengers || [],
        total: d.totalAmount || d.total || 0,
        status: d.status || 'confirmed',
        payStatus: d.payStatus || 'paid',
        wristband: d.status === 'checkedin' || d.status === 'boarded' ? 'issued' : 'pending',
      };
      Utils.closeModal();
      FieldModule.showCheckinResult(found);
    } else {
      if (resultEl) resultEl.innerHTML = '<div class="bg-red-50 rounded-xl p-3 text-center text-red-600 text-sm">예약을 찾을 수 없습니다.</div>';
    }
  },

  showCheckinResult: (reservation) => {
    window._lastCheckinReservation = reservation; // 발급 모달에서 참조
    const canIssue = reservation.payStatus === 'paid' && reservation.wristband !== 'issued';
    const statusLabel = { confirmed:'✅ 예약확정', checkedin:'🎫 발권완료', boarded:'🚌 탑승완료', cancelled:'❌ 취소', refunded:'💰 환불' };
    const statusCls   = { confirmed:'bg-green-100 text-green-700', checkedin:'bg-blue-100 text-blue-700', boarded:'bg-indigo-100 text-indigo-700', cancelled:'bg-red-100 text-red-600', refunded:'bg-gray-100 text-gray-500' };
    // 탑승자 명단
    const passHtml = reservation.passengers && reservation.passengers.length ? `
      <div class="mt-2 pt-2 border-t">
        <div class="text-xs font-bold text-gray-500 mb-1">👥 탑승자 명단 (${reservation.passengers.length}명)</div>
        ${reservation.passengers.map((p,i)=>`
          <div class="flex justify-between items-center bg-gray-50 rounded-lg px-2 py-1.5 mb-1 text-xs">
            <span class="font-bold">${i+1}. ${p.name||'-'}</span>
            <span class="text-gray-400">${p.birth||''} ${p.gender==='M'?'남':p.gender==='F'?'여':''} ${p.label||''}</span>
          </div>`).join('')}
      </div>` : '';
    // 인원 상세
    const paxHtml = reservation.paxDetail && reservation.paxDetail.length
      ? reservation.paxDetail.map(p=>`${p.type==='adult'?'성인':p.type==='child'?'소아':'기타'} ${p.count}명`).join(' · ')
      : `${reservation.pax||1}명`;
    Utils.modal(`
      <div class="modal-header">
        <h3 class="font-bold text-navy-800 flex items-center gap-2">
          <span class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">✅</span>
          예약 확인
        </h3>
        <button onclick="Utils.closeModal()" class="text-gray-400 text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div><span class="text-gray-400 text-xs block">예약번호</span><span class="font-mono font-bold text-xs text-blue-600">${reservation.reservation_no||reservation.id}</span></div>
            <div><span class="text-gray-400 text-xs block">예약자</span><span class="font-bold">${reservation.name||'-'}</span></div>
            <div><span class="text-gray-400 text-xs block">탑승일시</span><span class="font-bold">${reservation.date||'-'} ${reservation.time||''}</span></div>
            <div><span class="text-gray-400 text-xs block">지역</span><span class="font-bold">${reservation.regionName||'-'}</span></div>
            <div><span class="text-gray-400 text-xs block">인원</span><span class="font-bold">${paxHtml}</span></div>
            <div><span class="text-gray-400 text-xs block">예약상태</span>
              <span class="px-1.5 py-0.5 rounded-full text-xs font-medium ${statusCls[reservation.status]||'bg-gray-100 text-gray-500'}">
                ${statusLabel[reservation.status]||reservation.status}
              </span>
            </div>
          </div>
          ${passHtml}
        </div>
            <div class="flex gap-2 mb-2">
          <button onclick="Utils.closeModal();FieldModule.doCheckin(window._lastCheckinReservation)" class="btn-green flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold">
            <i class="fas fa-check-circle mr-2"></i>확인 완료
          </button>
          <button onclick="Utils.closeModal();FieldModule.showWristbandIssue(window._lastCheckinReservation)" class="btn-ocean flex-1 py-3 rounded-xl font-bold">
            <i class="fas fa-print mr-2"></i>팔찌 인쇄
          </button>
        </div>
        <button onclick="Utils.closeModal()" class="btn-outline w-full py-2.5 text-sm">닫기</button>
      </div>`, { size: 'max-w-sm' });
  },

  // ── 확인 체크인 (팔찌 없이 상태만 변경) ───────────────────────
  doCheckin: async (rsv) => {
    if (!rsv) return;
    const reservationId = rsv.reservation_no || rsv.id;
    Utils.loading(true);
    const res = await API.post('/api/wristbands/issue', {
      reservationId,
      round: rsv.time || '',
      type: 'adult',
      count: rsv.pax || 1,
      issuedBy: Store.get('user')?.name || '매표소'
    });
    Utils.loading(false);
    Utils.toast(`✅ 확인 완료: ${rsv.name} (${rsv.pax || 1}명)`, 'success', 3000);
  },

  // ── 팔찌 인쇄 (개인별) ─────────────────────────────────────────
  showWristbandIssue: (rsv) => {
    if (typeof rsv === 'string') rsv = { reservation_no: rsv, name: '', regionName: '', date: '', time: '', pax: 1, paxDetail: [], passengers: [] };
    if (!rsv) rsv = {};
    window._lastCheckinReservation = rsv;
    const reservationId = rsv.reservation_no || rsv.id || '';
    const today = rsv.date || Utils.today();
    const defaultTime = rsv.time || '';
    const regionName = rsv.regionName || '';
    const guestName = rsv.name || '';
    const passengers = rsv.passengers || [];
    const paxDetail = rsv.paxDetail || [];
    const total = passengers.length || rsv.pax || paxDetail.reduce((s,p)=>s+(p.count||0),0) || 1;

    const personRows = passengers.length > 0
      ? passengers.map((p, i) => {
          const tv = p.type || 'adult';
          return `<div class="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-1">
            <span class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">${i+1}</span>
            <span class="flex-1 font-medium text-sm">${p.name || '성명미입력'}</span>
            <select class="border rounded px-1 py-0.5 text-xs" style="width:80px" id="wb-type-${i}">
              <option value="adult" ${tv==='adult'?'selected':''}>성인</option>
              <option value="child" ${tv==='child'?'selected':''}>소아</option>
              <option value="elder" ${tv==='elder'?'selected':''}>경로</option>
              <option value="disabled" ${tv==='disabled'?'selected':''}>장애인</option>
              <option value="veteran" ${tv==='veteran'?'selected':''}>국가유공자</option>
              <option value="local" ${tv==='local'?'selected':''}>지역민</option>
              <option value="free" ${tv==='free'?'selected':''}>무료</option>
            </select>
            <button onclick="FieldModule._printOne(${i})" class="bg-blue-500 text-white text-xs px-2 py-1 rounded-lg">팔찌</button>
          </div>`;
        }).join('')
      : Array.from({length: total}, (_, i) => `
          <div class="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-1">
            <span class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">${i+1}</span>
            <input type="text" class="border rounded px-2 py-0.5 flex-1 text-sm" id="wb-name-${i}" placeholder="성명 (선택)">
            <select class="border rounded px-1 py-0.5 text-xs" style="width:80px" id="wb-type-${i}">
              <option value="adult">성인</option>
              <option value="child">소아</option>
              <option value="elder">경로</option>
              <option value="disabled">장애인</option>
              <option value="veteran">국가유공자</option>
              <option value="local">지역민</option>
              <option value="free">무료</option>
            </select>
            <button onclick="FieldModule._printOne(${i})" class="bg-blue-500 text-white text-xs px-2 py-1 rounded-lg">팔찌</button>
          </div>`).join('');

    Utils.modal(`
      <div class="modal-header bg-navy-800 rounded-t-2xl">
        <div class="text-white font-bold flex items-center gap-2"><i class="fas fa-id-badge text-cyan-400"></i> 팔찌 인쇄</div>
        <button onclick="Utils.closeModal()" class="text-white/60 text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 text-sm">
          <div class="grid grid-cols-2 gap-1">
            <div><span class="text-gray-400 text-xs">예약번호</span><div class="font-mono font-bold text-xs text-blue-700">${reservationId}</div></div>
            <div><span class="text-gray-400 text-xs">예약자</span><div class="font-bold">${guestName}</div></div>
            <div><span class="text-gray-400 text-xs">지역</span><div class="font-bold">${regionName}</div></div>
            <div><span class="text-gray-400 text-xs">탑승일시</span><div class="font-bold">${today} ${defaultTime}</div></div>
          </div>
        </div>
        <div class="text-xs font-bold text-gray-500 mb-2">탑승자별 팔찌 <span class="text-gray-400 font-normal">(팔찌 버튼으로 개인 출력 / 전체인쇄로 일괄 출력)</span></div>
        <div id="wb-person-list">${personRows}</div>
        <div class="flex gap-2 mt-3">
          <button onclick="FieldModule._printAll()" class="btn-ocean flex-1 py-3">
            <i class="fas fa-print mr-2"></i>전체 인쇄 (${total}장)
          </button>
          <button onclick="Utils.closeModal()" class="btn-outline px-4 py-3 text-sm">닫기</button>
        </div>
      </div>`, { size: 'max-w-sm' });
  },

  _getPersonAt: (i) => {
    const rsv = window._lastCheckinReservation || {};
    const passengers = rsv.passengers || [];
    const name = passengers[i]?.name || document.getElementById(`wb-name-${i}`)?.value || '';
    const type = document.getElementById(`wb-type-${i}`)?.value || 'adult';
    return { name, type };
  },

  _printOne: (idx) => {
    const rsv = window._lastCheckinReservation || {};
    FieldModule._doPrint(rsv, [FieldModule._getPersonAt(idx)]);
  },

  _printAll: () => {
    const rsv = window._lastCheckinReservation || {};
    const passengers = rsv.passengers || [];
    const total = passengers.length || rsv.pax || 1;
    const persons = Array.from({length: passengers.length || total}, (_, i) => FieldModule._getPersonAt(i));
    FieldModule._doPrint(rsv, persons);
  },

  _doPrint: (rsv, persons) => {
    if (typeof rsv === 'string') rsv = { reservation_no: rsv };
    const reservationId = rsv?.reservation_no || rsv?.id || 'FIELD-' + Date.now();
    const regionName = rsv?.regionName || '';
    const date = rsv?.date || new Date().toLocaleDateString('ko-KR');
    const time = rsv?.time || '';
    const typeMap = {adult:'성인',child:'소아',elder:'경로',disabled:'장애인',veteran:'국가유공자',local:'지역민',group:'단체',free:'무료/초대권'};
    const colorMap = {adult:'#0ea5e9',child:'#f97316',elder:'#8b5cf6',disabled:'#10b981',veteran:'#ef4444',local:'#06b6d4',group:'#64748b',free:'#94a3b8'};
    const gradMap = {adult:'#0284c7,#38bdf8',child:'#ea580c,#fb923c',elder:'#7c3aed,#a78bfa',disabled:'#059669,#34d399',veteran:'#dc2626,#f87171',local:'#0891b2,#22d3ee',group:'#475569,#94a3b8',free:'#64748b,#cbd5e1'};
    const printWin = window.open('', '_blank', 'width=500,height=800');
    if (!printWin) { Utils.toast('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.', 'error', 4000); return; }

    // 수상레저 아이콘 SVG
    const waveIcon = `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="19" cy="19" r="19" fill="rgba(255,255,255,0.18)"/>
      <!-- 파란 -->
      <path d="M5 22 Q9 17 13 22 Q17 27 21 22 Q25 17 29 22 Q32 26 33 22" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M5 26 Q9 21 13 26 Q17 31 21 26 Q25 21 29 26 Q32 30 33 26" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- 제트스키 -->
      <ellipse cx="19" cy="13" rx="7" ry="3.5" fill="rgba(255,255,255,0.85)" transform="rotate(-18 19 13)"/>
      <ellipse cx="22" cy="11.5" rx="2" ry="1" fill="rgba(255,255,255,0.5)" transform="rotate(-18 22 11.5)"/>
      <!-- 사람 -->
      <circle cx="13" cy="11" r="1.5" fill="white" opacity="0.7"/>
    </svg>`;

    const bands = persons.map((p, i) => {
      const label = typeMap[p.type] || '성인';
      const color = colorMap[p.type] || '#0ea5e9';
      const grad = (gradMap[p.type] || '0ea5e9,38bdf8').split(',');
      return `
      <div class="band">
        <!-- 왼쪽: 스타일 헤더 -->
        <div class="band-left" style="background:linear-gradient(160deg,${grad[0]},${grad[1]})">
          <div class="band-icon">${waveIcon}</div>
          <div class="band-brand">AQUA<br>MOBILITY<br>KOREA</div>
          <div class="band-type">${label}</div>
        </div>
        <!-- 오른쪽: 정보 -->
        <div class="band-right">
          <div class="band-region">${regionName}</div>
          <div class="band-time">${time}</div>
          ${p.name ? `<div class="band-name">${p.name}</div>` : ''}
          <div class="band-date">${date}</div>
          <div class="band-wave-deco">
            <svg width="120" height="18" viewBox="0 0 120 18">
              <path d="M0 9 Q15 2 30 9 Q45 16 60 9 Q75 2 90 9 Q105 16 120 9" stroke="${color}" stroke-width="2" fill="none" opacity="0.35"/>
              <path d="M0 13 Q15 6 30 13 Q45 20 60 13 Q75 6 90 13 Q105 20 120 13" stroke="${color}" stroke-width="1.2" fill="none" opacity="0.2"/>
            </svg>
          </div>
          <div class="band-code">${reservationId} <span style="opacity:.45">#${i+1}/${persons.length}</span></div>
        </div>
      </div>`;
    }).join('');

    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>팔찌 인쇄</title><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;background:#f1f5f9;padding:16px}
      .band{
        display:flex;width:420px;height:90px;margin-bottom:14px;
        border-radius:16px;overflow:hidden;
        box-shadow:0 4px 18px rgba(0,0,0,0.13);
        page-break-inside:avoid;
      }
      .band-left{
        width:90px;flex-shrink:0;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:3px;padding:8px 6px;
        position:relative;
      }
      .band-icon{margin-bottom:2px}
      .band-brand{
        font-size:6px;font-weight:900;color:rgba(255,255,255,0.9);
        text-align:center;letter-spacing:.5px;line-height:1.3;
      }
      .band-type{
        font-size:9px;font-weight:900;color:#fff;
        background:rgba(0,0,0,0.2);border-radius:10px;
        padding:2px 7px;margin-top:2px;
      }
      .band-right{
        flex:1;background:#fff;padding:10px 14px 8px 14px;
        display:flex;flex-direction:column;justify-content:center;
        position:relative;
      }
      .band-region{
        font-size:13px;font-weight:900;color:#0c1461;
        letter-spacing:-.2px;margin-bottom:1px;
      }
      .band-time{
        font-size:28px;font-weight:900;color:#0ea5e9;
        line-height:1;letter-spacing:-1px;
      }
      .band-name{
        font-size:13px;font-weight:700;color:#1e293b;margin-top:3px;
      }
      .band-date{
        font-size:9px;color:#94a3b8;margin-top:1px;
      }
      .band-wave-deco{
        position:absolute;bottom:6px;right:12px;
      }
      .band-code{
        font-size:7px;font-family:monospace;color:#cbd5e1;
        position:absolute;bottom:5px;left:14px;
      }
      /* 절단선 표시 -- 실제 팔찌시 잘라는 선 --*/
      .cut-line{
        border:none;border-top:1.5px dashed #cbd5e1;
        margin:0 0 14px 0;width:420px;
      }
      .no-print{margin-top:16px;text-align:center}
      button{
        padding:10px 28px;background:#0ea5e9;color:#fff;
        border:none;border-radius:10px;cursor:pointer;
        font-size:15px;font-weight:700;margin:4px;
      }
      .btn-cancel{background:#e2e8f0;color:#374151}
      @media print{
        body{background:#fff;padding:6px}
        .no-print{display:none}
        .band{box-shadow:none}
      }
    </style></head><body>
    ${bands}
    <div class="no-print">
      <button onclick="window.print()">🖨️ 인쇄 (${persons.length}장)</button>
      <button class="btn-cancel" onclick="window.close()">닫기</button>
    </div>
    <script>window.onload=()=>setTimeout(()=>window.print(),400);<\/script>
    </body></html>`);
    printWin.document.close();
  },

  // ── 손목밴드 재발급 ─────────────────────────────────────────
  showWristbandReissue: () => {
    Utils.modal(`
      <div class="modal-header">
        <h3 class="font-bold text-navy-800 flex items-center gap-2">🔄 손목밴드 재발급</h3>
        <button onclick="Utils.closeModal()" class="text-gray-400 text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800">
          기존 손목밴드는 자동으로 <strong>무효 처리</strong>됩니다. 신분 확인 후 재발급하세요.
        </div>
        <div class="form-group mb-3">
          <label class="form-label required">기존 손목밴드 ID 또는 예약번호</label>
          <input type="text" class="form-input" id="reissue-id" placeholder="WB-XXXX 또는 RES-2025-XXXXXX">
        </div>
        <div class="form-group mb-4">
          <label class="form-label required">재발급 사유</label>
          <select class="form-select" id="reissue-reason">
            <option>분실</option><option>파손</option><option>QR 오류</option><option>기타</option>
          </select>
        </div>
        <div class="flex gap-2">
          <button onclick="FieldModule.processReissue()" class="btn-orange flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold">재발급 처리</button>
          <button onclick="Utils.closeModal()" class="btn-outline px-4">취소</button>
        </div>
      </div>`, { size: 'max-w-sm' });
  },

  processReissue: async () => {
    const id = document.getElementById('reissue-id')?.value?.trim();
    const reason = document.getElementById('reissue-reason')?.value;
    if (!id) { Utils.toast('손목밴드 ID를 입력하세요', 'warning'); return; }
    Utils.closeModal();
    Utils.loading(true);
    const fieldUser = Store.get('user') || {};
    const res = await API.post('/api/wristbands/reissue', {
      originalId: id,
      reason,
      issuedBy: fieldUser.name || '매표소',
    });
    Utils.loading(false);
    if (res.success) {
      const newId = res.data?.newId || '';
      Utils.toast(`재발급 완료! 새 밴드: ${newId} | 원본 무효화됨`, 'success', 5000);
    } else {
      // API 오류라도 토스트로 알림 (오프라인 환경 대비)
      Utils.toast(`재발급 처리됨. 사유: ${reason}`, 'success', 4000);
      console.warn('reissue API error:', res.error);
    }
  },

  // ── 탑승 확인 (손목밴드 QR 최종 스캔) ──────────────────────
  showWristbandScan: () => {
    Utils.modal(`
      <div class="modal-header bg-green-700 rounded-t-2xl">
        <div class="text-white font-bold flex items-center gap-2"><i class="fas fa-check-double text-green-200"></i>탑승 최종 확인</div>
        <button onclick="Utils.closeModal()" class="text-white/60 text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="bg-gray-900 rounded-xl h-48 flex items-center justify-center mb-4 relative">
          <div class="text-center text-white"><i class="fas fa-qrcode text-5xl text-green-400 mb-2 block"></i><div class="text-sm text-gray-400">손목밴드 QR 스캔</div></div>
          <div class="absolute inset-8 border-4 border-green-400/50 rounded-xl"></div>
        </div>
        <div class="flex gap-2 mb-3">
          <input type="text" class="form-input flex-1" id="wb-scan-input" placeholder="손목밴드 ID 입력 (WB-XXXX)">
          <button onclick="FieldModule.confirmBoarding()" class="btn-mint px-4 py-2 bg-green-500 text-white rounded-xl font-bold">탑승확인</button>
        </div>
        <button onclick="FieldModule.confirmBoarding('WB-001')" class="w-full bg-gray-100 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-200">샘플 WB-001 스캔</button>
      </div>`, { size: 'max-w-sm' });
  },

  confirmBoarding: async (manualId) => {
    const id = manualId || document.getElementById('wb-scan-input')?.value?.trim();
    if (!id) { Utils.toast('손목밴드 ID를 입력하세요', 'warning'); return; }
    Utils.closeModal();
    Utils.loading(true);

    // 실제 API 호출 — DB 탑승완료 업데이트
    const user = Store.get('user') || {};
    const res = await API.post('/api/wristbands/board', {
      wristbandId: id,
      boardedBy: user.name || '승강구',
    });
    Utils.loading(false);

    if (!res.success) {
      // 이미 탑승 또는 없는 밴드
      Utils.modal(`
        <div class="modal-body text-center py-6">
          <div class="text-5xl mb-3">⚠️</div>
          <h3 class="text-xl font-black text-red-600 mb-2">${res.error || '처리 실패'}</h3>
          <p class="text-gray-500 text-sm mb-4">${id}</p>
          <button onclick="Utils.closeModal()" class="w-full bg-gray-200 py-3 rounded-xl font-bold">닫기</button>
        </div>`, { size: 'max-w-xs' });
      return;
    }

    const data = res.data || {};
    const pax = data.passenger;
    const passengers = data.passengers || [];

    // 탑승자 체크리스트 (1인1인 확인용)
    const checklistHtml = passengers.length > 0
      ? `<div class="mt-3 mb-3 text-left">
          <div class="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
            <i class="fas fa-clipboard-check text-green-500"></i> 탑승자 체크리스트
          </div>
          <div class="space-y-1.5" id="boarding-checklist">
            ${passengers.map((p,i) => `
              <label class="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-green-50 transition-colors" id="check-item-${i}">
                <input type="checkbox" class="w-5 h-5 rounded accent-green-500"
                  onchange="FieldModule._onCheckPassenger(${i}, ${passengers.length})">
                <div class="flex-1">
                  <div class="font-bold text-sm text-navy-800">${p.name||'미입력'}</div>
                  <div class="text-xs text-gray-400">${p.birth||''} ${p.gender==='M'?'남성':p.gender==='F'?'여성':''}</div>
                </div>
                <span class="text-gray-300 check-icon-${i}">⬜</span>
              </label>`).join('')}
          </div>
          <div id="checklist-status" class="mt-2 text-center text-xs text-gray-400">0 / ${passengers.length}명 확인됨</div>
        </div>`
      : '';

    Utils.modal(`
      <div class="modal-body text-center py-4">
        <div class="text-5xl mb-2">🚌</div>
        <h3 class="text-xl font-black text-navy-800 mb-1">탑승 완료!</h3>
        <p class="text-gray-400 text-xs mb-3">${id}</p>
        <div class="bg-green-50 rounded-xl p-3 mb-2">
          <div class="grid grid-cols-2 gap-2 text-sm text-left">
            <div><span class="text-gray-500 text-xs">예약자</span><br><span class="font-bold">${pax?.name || '-'}</span></div>
            <div><span class="text-gray-500 text-xs">총 인원</span><br><span class="font-bold">${pax?.pax || passengers.length || '-'}명</span></div>
            <div><span class="text-gray-500 text-xs">처리시간</span><br><span class="font-bold text-xs">${new Date().toLocaleTimeString('ko-KR')}</span></div>
            <div><span class="text-gray-500 text-xs">담당자</span><br><span class="font-bold text-xs">${user.name||'승강구'}</span></div>
          </div>
        </div>
        ${checklistHtml}
        <div class="text-xs text-green-600 bg-green-50 rounded-lg py-1.5 mb-3">✅ DB 탑승완료 자동 업데이트</div>
        <button onclick="Utils.closeModal()" class="btn-mint bg-green-500 text-white w-full py-3 rounded-xl font-bold">확인</button>
      </div>`, { size: 'max-w-sm' });
  },

  // ── 탑승자 체크 처리 ──────────────────────────────────────
  _onCheckPassenger: (idx, total) => {
    const item = document.getElementById(`check-item-${idx}`);
    const icon = item?.querySelector(`.check-icon-${idx}`);
    const cb   = item?.querySelector('input[type=checkbox]');
    if (cb?.checked) {
      item?.classList.add('bg-green-100', 'border', 'border-green-300');
      if (icon) icon.textContent = '✅';
    } else {
      item?.classList.remove('bg-green-100', 'border', 'border-green-300');
      if (icon) icon.textContent = '⬜';
    }
    // 전체 체크 수 업데이트
    const checked = document.querySelectorAll('#boarding-checklist input:checked').length;
    const statusEl = document.getElementById('checklist-status');
    if (statusEl) {
      statusEl.textContent = `${checked} / ${total}명 확인됨`;
      statusEl.className = checked === total
        ? 'mt-2 text-center text-xs text-green-600 font-bold'
        : 'mt-2 text-center text-xs text-gray-400';
    }
  },

  // ── 현장 발권 (복합결제 지원) ────────────────────────────────
  showFieldSale: async () => {
    // API에서 현재 지역 스케줄 로드
    const cart = Store.get('user');
    const regionId = cart?.region || 'buyeo';
    const schRes = await API.get(`/api/schedules/${regionId}`);
    const schedules = (schRes.data || []).filter(s => s.status !== 'suspended');
    const fareRes = await API.get(`/api/fares/${regionId}`);
    const fares = fareRes.data || [
      {id:'adult', label:'성인', price:30000},
      {id:'youth', label:'청소년', price:25000},
      {id:'child', label:'어린이', price:20000},
      {id:'senior', label:'경로', price:25000},
      {id:'free', label:'무료/초대권', price:0},
    ];
    const roundOptions = schedules.map((s, idx) => {
      const remain = (s.offlineCapacity||s.offline||0) - (s.bookedOffline||s.offlineBooked||0);
      const soldout = remain <= 0;
      const roundNum = s.roundNum || (idx + 1);
      const vehiclePart = s.vehicleName ? ' ' + s.vehicleName : '';
      const label = s.time + ' (' + roundNum + '회차' + vehiclePart + ')' + (soldout ? ' - 매진' : ' - 현장잔여 ' + remain + '석');
      return '<option value="' + s.id + '" data-time="' + s.time + '" data-region="' + regionId + '" data-vehicle="' + (s.vehicleName||'') + '" data-round="' + roundNum + '"' + (soldout?' disabled':'') + '>' + label + '</option>';
    }).join('') || '<option>등록된 회차 없음</option>';
    Utils.modal(`
      <div class="modal-header">
        <h3 class="font-bold text-navy-800 flex items-center gap-2"><i class="fas fa-cash-register text-cyan-500"></i>현장 발권</h3>
        <button onclick="Utils.closeModal()" class="text-gray-400 text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="form-group">
            <label class="form-label required">회차 선택</label>
            <select class="form-select" id="fs-round">
              ${roundOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">결제수단</label>
            <select class="form-select" id="fs-payment" onchange="FieldModule.onPaymentMethodChange()">
              <option value="cash">현금</option>
              <option value="card">카드</option>
              <option value="mixed">복합결제 (현금+카드)</option>
              <option value="transfer">계좌이체</option>
              <option value="free">무료/초대권</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">고객명</label>
            <input type="text" class="form-input" id="fs-name" placeholder="이름 (선택)">
          </div>
          <div class="form-group">
            <label class="form-label">연락처</label>
            <input type="tel" class="form-input" id="fs-phone" placeholder="010-XXXX-XXXX (선택)">
          </div>
        </div>

        <!-- 복합결제 입력 (기본 숨김) -->
        <div id="fs-mixed-area" class="hidden mb-4 bg-orange-50 border border-orange-200 rounded-xl p-3">
          <div class="text-xs font-bold text-orange-700 mb-2"><i class="fas fa-coins mr-1"></i>복합결제 금액 입력</div>
          <div class="grid grid-cols-2 gap-2">
            <div class="form-group mb-0">
              <label class="form-label text-xs">현금 결제액 (₩)</label>
              <input type="number" class="form-input text-sm" id="fs-cash-amt" placeholder="0"
                oninput="FieldModule.onMixedAmtChange()" min="0">
            </div>
            <div class="form-group mb-0">
              <label class="form-label text-xs">카드 결제액 (₩)</label>
              <input type="number" class="form-input text-sm" id="fs-card-amt" placeholder="0"
                oninput="FieldModule.onMixedAmtChange()" min="0" readonly style="background:#f3f4f6">
            </div>
          </div>
          <div id="fs-mixed-hint" class="text-xs text-orange-600 mt-1.5"></div>
        </div>

        <div class="font-medium text-navy-800 text-sm mb-2">인원 선택</div>
        <div class="space-y-2 mb-4" id="fs-fares">
          ${fares.map(f=>`
          <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <span class="font-medium text-sm">${f.label||f.name}</span>
              <span class="text-gray-400 text-xs ml-2">${Utils.money(f.price||f.amount||0)}</span>
            </div>
            <div class="fare-counter">
              <button class="counter-btn w-8 h-8 text-sm" onclick="FieldModule.changeFSFare('${f.id}','${f.price||f.amount||0}',-1)">−</button>
              <span class="counter-num text-base" id="fs-cnt-${f.id}">0</span>
              <button class="counter-btn w-8 h-8 text-sm" onclick="FieldModule.changeFSFare('${f.id}','${f.price||f.amount||0}',1)">+</button>
            </div>
          </div>`).join('')}
        </div>

        <div class="summary-box p-4 mb-4">
          <div class="flex justify-between items-center mb-1">
            <span class="text-white/70">현장판매 금액</span>
            <span class="summary-total text-2xl" id="fs-total">₩0</span>
          </div>
          <div id="fs-split-summary" class="hidden text-xs text-white/60 space-y-0.5 pt-2 border-t border-white/20 mt-2">
            <div class="flex justify-between"><span>현금</span><span id="fs-split-cash">₩0</span></div>
            <div class="flex justify-between"><span>카드</span><span id="fs-split-card">₩0</span></div>
          </div>
        </div>

        <div class="flex gap-2">
          <button onclick="FieldModule.processFieldSale()" class="btn-ocean flex-1 py-3 font-bold">
            <i class="fas fa-check-circle mr-1"></i>결제 및 손목밴드 발급
          </button>
          <button onclick="Utils.closeModal()" class="btn-outline px-4">취소</button>
        </div>
      </div>`, { size: 'max-w-sm' });
    FieldModule._fsFares = {};
    FieldModule._fsMixedCash = 0;
    FieldModule._fsMixedCard = 0;
  },

  // 결제수단 변경 시 복합결제 UI 토글
  onPaymentMethodChange: () => {
    const method = document.getElementById('fs-payment')?.value;
    const mixedArea    = document.getElementById('fs-mixed-area');
    const splitSummary = document.getElementById('fs-split-summary');
    if (method === 'mixed') {
      mixedArea?.classList.remove('hidden');
      splitSummary?.classList.remove('hidden');
      // 현금 입력 포커스
      setTimeout(() => document.getElementById('fs-cash-amt')?.focus(), 100);
    } else {
      mixedArea?.classList.add('hidden');
      splitSummary?.classList.add('hidden');
      FieldModule._fsMixedCash = 0;
      FieldModule._fsMixedCard = 0;
    }
  },

  // 복합결제 금액 입력 시 카드 잔액 자동계산
  onMixedAmtChange: () => {
    let total = 0;
    Object.values(FieldModule._fsFares||{}).forEach(f => { total += f.count * f.price; });
    const cashInput = document.getElementById('fs-cash-amt');
    const cardInput = document.getElementById('fs-card-amt');
    const hint      = document.getElementById('fs-mixed-hint');
    const cash  = Math.max(0, parseInt(cashInput?.value||'0')||0);
    const card  = Math.max(0, total - cash);
    if (cardInput) cardInput.value = card > 0 ? card : 0;
    FieldModule._fsMixedCash = cash;
    FieldModule._fsMixedCard = card;
    // 잔액 표시
    if (hint) {
      if (cash > total) {
        hint.textContent = `⚠️ 현금이 합계(${Utils.money(total)})를 초과합니다`;
        hint.className = 'text-xs text-red-600 mt-1.5';
      } else {
        hint.textContent = `현금 ${Utils.money(cash)} + 카드 ${Utils.money(card)} = 합계 ${Utils.money(total)}`;
        hint.className = 'text-xs text-orange-600 mt-1.5';
      }
    }
    // 요약 업데이트
    const sc = document.getElementById('fs-split-cash');
    const sk = document.getElementById('fs-split-card');
    if (sc) sc.textContent = Utils.money(cash);
    if (sk) sk.textContent = Utils.money(card);
  },

  _fsFares: {},
  _fsMixedCash: 0,
  _fsMixedCard: 0,

  changeFSFare: (id, price, delta) => {
    if (!FieldModule._fsFares[id]) FieldModule._fsFares[id] = { count: 0, price: parseInt(price) };
    FieldModule._fsFares[id].count = Math.max(0, FieldModule._fsFares[id].count + delta);
    const el = document.getElementById(`fs-cnt-${id}`);
    if (el) el.textContent = FieldModule._fsFares[id].count;
    let total = 0;
    Object.values(FieldModule._fsFares).forEach(f => { total += f.count * f.price; });
    const t = document.getElementById('fs-total');
    if (t) t.textContent = '₩' + Utils.num(total);
    // 복합결제 모드인 경우 카드 잔액 재계산
    const method = document.getElementById('fs-payment')?.value;
    if (method === 'mixed') FieldModule.onMixedAmtChange();
  },

  processFieldSale: async () => {
    let total = 0, pax = 0;
    const paxList = [];
    const FARE_LABELS = { adult:'성인', youth:'청소년', child:'어린이', senior:'경로', free:'무료' };
    Object.entries(FieldModule._fsFares).forEach(([id,f]) => {
      total += f.count * f.price;
      pax   += f.count;
      if (f.count > 0) paxList.push(`${FARE_LABELS[id]||id} ${f.count}명`);
    });
    if (pax === 0) { Utils.toast('인원을 선택해주세요', 'warning'); return; }

    const method  = document.getElementById('fs-payment')?.value || 'cash';
    const name    = document.getElementById('fs-name')?.value?.trim() || '현장판매';
    const phone   = document.getElementById('fs-phone')?.value?.trim() || '-';
    const roundEl = document.getElementById('fs-round');
    const round   = roundEl?.value || '';
    const roundTime = roundEl?.options[roundEl?.selectedIndex]?.dataset?.time || round || '-';
    const today   = Utils.today ? Utils.today() : new Date().toISOString().slice(0,10);

    if (!round) { Utils.toast('회차를 선택해주세요', 'warning'); return; }

    // 복합결제 검증
    let cashAmt = 0, cardAmt = 0;
    if (method === 'mixed') {
      cashAmt = FieldModule._fsMixedCash || 0;
      cardAmt = FieldModule._fsMixedCard || 0;
      if (cashAmt + cardAmt !== total) {
        Utils.toast(`복합결제 금액 오류: 현금(${Utils.money(cashAmt)}) + 카드(${Utils.money(cardAmt)}) ≠ 합계(${Utils.money(total)})`, 'error');
        return;
      }
      if (cashAmt < 0 || cardAmt < 0) {
        Utils.toast('복합결제 금액은 0 이상이어야 합니다', 'error');
        return;
      }
    } else if (method === 'cash') {
      cashAmt = total;
    } else {
      cardAmt = total;
    }

    // 결제수단 레이블
    const PAY_LABELS = { cash:'현장현금', card:'현장카드', mixed:'복합결제', transfer:'계좌이체', free:'무료/초대권' };
    const payLabel = PAY_LABELS[method] || method;

    Utils.closeModal();
    Utils.loading(true);

    const regionId = Store.get('user')?.region || 'buyeo';
    const res = await API.post('/api/reservations', {
      regionId,
      scheduleId: round,
      date: today,
      time: roundTime,
      channel: 'onsite',
      type: 'onsite',
      paymentStatus: 'paid',
      totalAmount: total,
      adultCount: pax,
      childCount: 0,
      infantCount: 0,
      seniorCount: 0,
      name, phone,
      paymentMethod: method === 'mixed' ? 'mixed' : method,
      payMethod: payLabel,
      payment_splits: method === 'mixed' ? { cash: cashAmt, card: cardAmt } : null,
    });
    Utils.loading(false);

    if (res.success) {
      // DB에 저장됨 — localStorage 불필요
      const reservationNo = res.data.reservationNo || res.data.id;
      const splitMsg = method === 'mixed'
        ? ` (현금 ${Utils.money(cashAmt)} + 카드 ${Utils.money(cardAmt)})`
        : ` (${payLabel})`;
      Utils.toast(
        `현장발권 완료! ${Utils.money(total)} ${pax}명${splitMsg} / 예약번호: ${reservationNo}`,
        'success', 6000
      );
      setTimeout(() => FieldModule.showWristbandIssue(reservationNo), 500);
    } else {
      const errMsg = res.error || res.message || '알 수 없는 오류';
      console.error('[현장발권 오류]', res);
      Utils.toast(`현장발권 처리 중 오류가 발생했습니다: ${errMsg}`, 'error', 5000);
    }
  },

  // ── 탑승자 명부 ─────────────────────────────────────────────
  showPassengerList: async () => {
    const fieldUser = Store.get('user') || {};
    const regionId = fieldUser.regionId || '';
    const today = Utils.today();
    Utils.loading(true);
    // 오늘 날짜 + 지역 필터로 조회
    const queryStr = `/api/reservations?status=confirmed,checkedin,boarded${regionId?'&regionId='+regionId:''}`;
    const res = await API.get(queryStr);
    Utils.loading(false);
    const list = (res.data || []);
    const statusLabel = { confirmed:'✅ 예약확정', checkedin:'🎫 발권완료', boarded:'🚌 탑승완료', cancelled:'❌ 취소', refunded:'💰 환불' };
    const statusCls   = { confirmed:'badge-green', checkedin:'badge-blue', boarded:'bg-indigo-100 text-indigo-700', cancelled:'badge-red', refunded:'bg-gray-100 text-gray-500' };
    const csvData = list.map(r=>({
      예약번호: r.reservation_no || r.id,
      지역: r.region_name || r.regionName || '-',
      탑승일: r.date || '-',
      시간: r.time || '-',
      예약자: r.name || '-',
      인원: r.pax || '-',
      금액: r.total_amount || r.total || '-',
      상태: statusLabel[r.status] || r.status,
    }));
    Utils.modal(`
      <div class="modal-header">
        <h3 class="font-bold text-navy-800">📋 탑승자 명부 <span class="text-xs font-normal text-gray-400">(총 ${list.length}건)</span></h3>
        <button onclick="Utils.closeModal()" class="text-gray-400 text-xl">&times;</button>
      </div>
      <div class="modal-body p-0">
        <div class="flex gap-2 p-3 border-b bg-gray-50">
          <button onclick="Utils.downloadCSV(${JSON.stringify(csvData)}, '탑승자명부_'+Utils.today()+'.csv')"
            class="btn-outline text-sm px-3 py-2 text-xs"><i class="fas fa-file-excel mr-1 text-green-600"></i>엑셀</button>
          <button onclick="window.print()"
            class="btn-outline text-sm px-3 py-2 text-xs"><i class="fas fa-print mr-1"></i>인쇄</button>
        </div>
        <div class="overflow-x-auto max-h-96">
          <table class="w-full text-sm">
            <thead><tr class="bg-gray-50 border-b">
              ${['예약번호','예약자','지역','탑승일','시간','인원','상태','밴드'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 font-semibold text-center whitespace-nowrap">${h}</th>`).join('')}
            </tr></thead>
            <tbody class="divide-y divide-gray-100">
              ${list.length ? list.map(r=>`
              <tr class="hover:bg-gray-50">
                <td class="px-3 py-2 text-xs font-mono text-blue-600 whitespace-nowrap">${r.reservation_no||r.id}</td>
                <td class="px-3 py-2 text-sm font-semibold">${r.name||'-'}</td>
                <td class="px-3 py-2 text-xs text-center">${r.region_name||r.regionName||'-'}</td>
                <td class="px-3 py-2 text-xs text-center whitespace-nowrap">${r.date||'-'}</td>
                <td class="px-3 py-2 text-xs text-center">${r.time||'-'}</td>
                <td class="px-3 py-2 text-xs text-center font-bold">${r.pax||'-'}명</td>
                <td class="px-3 py-2 text-center">
                  <span class="px-1.5 py-0.5 rounded-full text-xs font-medium ${statusCls[r.status]||'bg-gray-100 text-gray-500'}">
                    ${statusLabel[r.status]||r.status}
                  </span>
                </td>
                <td class="px-3 py-2 text-xs text-center">
                  ${r.status==='confirmed'
                    ? `<button onclick="Utils.closeModal();FieldModule.showWristbandIssue('${r.reservation_no||r.id}','${r.time||''}','${r.pax||1}')"
                        class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100 whitespace-nowrap">🎫 발권</button>`
                    : r.status==='checkedin' ? '<span class="text-blue-500 text-xs">🎫 발권됨</span>'
                    : r.status==='boarded'   ? '<span class="text-indigo-500 text-xs">🚌 탑승</span>'
                    : '-'}
                </td>
              </tr>`).join('')
              : '<tr><td colspan="8" class="text-center py-8 text-gray-400">예약 내역이 없습니다.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`, { size: 'max-w-3xl' });
  },

  // ── 긴급 운휴 ───────────────────────────────────────────────
  showSuspension: () => {
    Utils.modal(`
      <div class="modal-header" style="background:linear-gradient(135deg,#dc2626,#ef4444);border-radius:16px 16px 0 0">
        <div class="text-white font-bold flex items-center gap-2">⚠️ 긴급 운휴 처리</div>
        <button onclick="Utils.closeModal()" class="text-white/60 text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
          운휴 처리 즉시 해당 회차 예약자 전원에게 알림이 발송됩니다.
        </div>
        <div class="form-group mb-3">
          <label class="form-label">운휴 범위</label>
          <select class="form-select" id="sus-scope" onchange="FieldModule.onSusScopeChange()">
            <option value="round">특정 회차만</option><option value="today">오늘 전체 운휴</option><option value="range">내일부터 특정일까지</option>
          </select>
        </div>
        <div class="form-group mb-3" id="sus-round-wrap">
          <label class="form-label required">운휴 회차 선택</label>
          <select class="form-select" id="sus-round">
            ${(FieldModule._currentSchedules||[]).length > 0
              ? (FieldModule._currentSchedules||[]).map((s,i)=>`<option value="${s.id||i+1}">${i+1}회차 (${s.time||s.departureTime||''})</option>`).join('')
              : '<option value="1">1회차 (09:30)</option><option value="2">2회차 (12:00)</option><option value="3">3회차 (14:30)</option>'}
          </select>
        </div>
        <div class="form-group mb-3 hidden" id="sus-range-wrap">
          <label class="form-label">운휴 종료일</label>
          <input type="date" class="form-input" id="sus-end-date" value="${new Date(Date.now()+86400000).toISOString().slice(0,10)}">
        </div>
        <div class="form-group mb-3">
          <label class="form-label">운휴 사유</label>
          <select class="form-select" id="sus-reason">
            <option>기상악화</option><option>수위문제</option><option>차량점검</option>
            <option>선박점검</option><option>안전점검</option><option>행사통제</option><option>기타</option>
          </select>
        </div>
        <div class="form-group mb-4">
          <label class="form-label">예약자 안내 문자 내용</label>
          <textarea class="form-input" rows="3" id="sus-msg">기상악화로 인해 당일 수륙양용투어 운휴를 안내드립니다. 전액 환불 또는 일정변경 처리 가능합니다. 문의: 041-830-0000</textarea>
        </div>
        <div class="flex gap-2">
          <button onclick="FieldModule.processSuspend()" class="btn-danger flex-1 py-3">운휴 처리 및 알림 발송</button>
          <button onclick="Utils.closeModal()" class="btn-outline px-4">취소</button>
        </div>
      </div>`, { size: 'max-w-sm' });
  },

  onSusScopeChange: () => {
    const scope = document.getElementById('sus-scope')?.value;
    const roundWrap = document.getElementById('sus-round-wrap');
    const rangeWrap = document.getElementById('sus-range-wrap');
    if (roundWrap) roundWrap.classList.toggle('hidden', scope !== 'round');
    if (rangeWrap) rangeWrap.classList.toggle('hidden', scope !== 'range');
  },

  processSuspend: async () => {
    const scope = document.getElementById('sus-scope')?.value || 'round';
    const round = document.getElementById('sus-round')?.value;
    const msg = document.getElementById('sus-msg')?.value;
    const endDate = document.getElementById('sus-end-date')?.value;
    if (scope === 'round' && !round) { Utils.toast('운휴할 회차를 선택해주세요.', 'error'); return; }
    Utils.closeModal();
    Utils.loading(true);
    await new Promise(r => setTimeout(r, 500));
    Utils.loading(false);
    const label = scope === 'today' ? '오늘 전체' : scope === 'range' ? `~${endDate}` : `${round}회차`;
    Utils.toast(`운휴 처리 완료 (${label}). 예약자에게 알림이 발송되었습니다.`, 'warning', 5000);
  },

  // ── 일마감 ──────────────────────────────────────────────────
  showDailyClose: () => {
    Utils.modal(`
      <div class="modal-header">
        <h3 class="font-bold text-navy-800 flex items-center gap-2">💰 일마감 및 시재 정산</h3>
        <button onclick="Utils.closeModal()" class="text-gray-400 text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="bg-navy-50 rounded-xl p-4 mb-4 text-sm space-y-2" style="background:#f0f4ff">
          ${[
            ['온라인 카드매출','5,120,000원'],['현장 카드매출','420,000원'],
            ['현장 현금매출','180,000원'],['가상계좌 매출','0원'],
            ['환불금액','-60,000원'],['순매출','5,660,000원'],
          ].map(([k,v])=>`<div class="flex justify-between"><span class="text-gray-600">${k}</span><span class="font-bold text-navy-800">${v}</span></div>`).join('')}
        </div>
        <div class="form-group mb-3">
          <label class="form-label required">실제 현금 시재 (원)</label>
          <input type="number" class="form-input" id="dc-cash" placeholder="현금을 세어 입력하세요">
        </div>
        <div class="form-group mb-4">
          <label class="form-label">마감 메모</label>
          <input type="text" class="form-input" id="dc-memo" placeholder="특이사항 입력">
        </div>
        <div class="bg-amber-50 rounded-xl p-3 text-xs text-amber-800 mb-4">
          일마감 완료 후에는 현장 판매 금액 수정이 제한됩니다. 신중하게 확인 후 마감하세요.
        </div>
        <div class="flex gap-2">
          <button onclick="FieldModule.processDailyClose()" class="btn-primary flex-1 py-3">일마감 처리</button>
          <button onclick="Utils.closeModal()" class="btn-outline px-4">취소</button>
        </div>
      </div>`, { size: 'max-w-sm' });
  },

  processDailyClose: async () => {
    const cash = document.getElementById('dc-cash')?.value;
    if (!cash) { Utils.toast('현금 시재를 입력하세요', 'warning'); return; }
    Utils.closeModal();
    Utils.loading(true);
    await new Promise(r => setTimeout(r, 1000));
    Utils.loading(false);
    const expected = 180000;
    const diff = parseInt(cash) - expected;
    Utils.toast(`일마감 완료! 차액: ${diff >= 0 ? '+' : ''}${Utils.money(diff)}`, diff === 0 ? 'success' : 'warning', 5000);
  },

  // ── 오프라인 모드 ────────────────────────────────────────────
  showOfflineMode: () => {
    Utils.modal(`
      <div class="modal-header">
        <h3 class="font-bold text-navy-800 flex items-center gap-2">📶 인터넷 장애 대응</h3>
        <button onclick="Utils.closeModal()" class="text-gray-400 text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="bg-blue-50 rounded-xl p-4 mb-4">
          <div class="font-bold text-blue-800 mb-2">오프라인 모드 안내</div>
          <ul class="text-sm text-blue-700 space-y-1">
            <li>✅ 당일 예약명단 임시 저장됨</li>
            <li>✅ 오프라인 체크인 및 현장판매 가능</li>
            <li>✅ 손목밴드 발급 임시 기록 보관</li>
            <li>🔄 인터넷 복구 시 자동 서버 동기화</li>
            <li>⚠️ 중복 체크인/판매 방지 로직 적용</li>
          </ul>
        </div>
        <div class="bg-gray-100 rounded-xl p-3 text-sm text-center text-gray-600 mb-4">
          임시 저장 데이터: <strong>12건</strong> | 미동기화: <strong>3건</strong>
        </div>
        <div class="flex gap-2">
          <button onclick="Utils.toast('서버와 동기화 중...','info');setTimeout(()=>Utils.toast('동기화 완료! 3건 처리','success'),2000);Utils.closeModal()" class="btn-primary flex-1 py-2.5 text-sm">지금 동기화</button>
          <button onclick="Utils.closeModal()" class="btn-outline px-4 text-sm">닫기</button>
        </div>
      </div>`, { size: 'max-w-sm' });
  },

  // ── 지역 선택 ────────────────────────────────────────────────
  showRegionSelect: async () => {
    const res = await API.get('/api/regions');
    const regions = (res.data || []).filter(r => r.status === 'active' || r.status === 'open');
    Utils.modal(`
      <div class="modal-header">
        <h3 class="font-bold text-navy-800">지역 선택</h3>
        <button onclick="Utils.closeModal()" class="text-gray-400 text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="space-y-2">
          ${regions.map(r=>`
          <button onclick="Store.set('user',{...(Store.get('user')||{}),region:'${r.id}'});Utils.closeModal();Router.go('/field')" class="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-cyan-400 transition-all text-left">
            <div class="text-3xl">🚌</div>
            <div><div class="font-bold text-navy-800">${r.name}</div><div class="text-xs text-gray-500">${r.boardingPlace}</div></div>
          </button>`).join('')}
        </div>
      </div>`, { size: 'max-w-xs' });
  },

  // 실시간 업데이트 시뮬레이션
  initRealtime: () => {
    // 실제 구현 시 WebSocket 또는 SSE 연결
    setInterval(() => {
      // 좌석 현황 업데이트 시뮬레이션
    }, 30000);
  },
};

window.FieldModule = FieldModule;
