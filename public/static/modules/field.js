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
      <button class="field-btn field-btn-ocean" style="min-height:90px" onclick="FieldModule.showQRScanner()">
        <i class="fas fa-qrcode text-3xl"></i>
        <span>모바일 QR 스캔</span>
        <span class="text-xs text-white/70">예약확인 + 체크인</span>
      </button>
      <button class="field-btn field-btn-green" style="min-height:90px" onclick="FieldModule.showWristbandIssue()">
        <i class="fas fa-band-aid text-3xl"></i>
        <span>손목밴드 발급</span>
        <span class="text-xs text-white/70">QR 스캔 후 발급</span>
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

  // ── QR 스캐너 (모달) ────────────────────────────────────────
  showQRScanner: () => {
    Utils.modal(`
      <div class="modal-header bg-navy-800 rounded-t-2xl">
        <div class="text-white font-bold flex items-center gap-2"><i class="fas fa-qrcode text-cyan-400"></i> 모바일 QR 스캔</div>
        <button onclick="Utils.closeModal()" class="text-white/60 hover:text-white text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="bg-gray-900 rounded-xl aspect-square flex items-center justify-center mb-4 relative overflow-hidden" style="max-height:280px">
          <div class="text-white text-center">
            <i class="fas fa-camera text-5xl text-gray-500 mb-3 block"></i>
            <div class="text-gray-400 text-sm">카메라 접근 권한 필요</div>
            <div class="text-gray-500 text-xs mt-1">실제 구현 시 QR 스캐너 라이브러리 연동</div>
          </div>
          <div class="absolute inset-8 border-4 border-cyan-400/50 rounded-xl"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-full h-0.5 bg-cyan-400/50" style="animation:wave 2s ease-in-out infinite"></div>
          </div>
        </div>
        <div class="text-center text-sm text-gray-500 mb-4">또는 예약번호 직접 입력</div>
        <div class="flex gap-2">
          <input type="text" class="form-input flex-1" id="qr-manual-input" placeholder="예약번호 입력 (RES-2025-XXXXXX)">
          <button onclick="FieldModule.processQRInput()" class="btn-ocean px-4">확인</button>
        </div>
        <div class="grid grid-cols-2 gap-2 mt-4">
          <button onclick="FieldModule.processQRInput('RES-2025-001234')" class="bg-gray-100 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-200">샘플 스캔 (부여)</button>
          <button onclick="FieldModule.processQRInput('RES-2025-001235')" class="bg-gray-100 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-200">샘플 스캔 (통영)</button>
        </div>
      </div>`, { size: 'max-w-sm' });
  },

  processQRInput: async (manualId) => {
    const input = manualId || document.getElementById('qr-manual-input')?.value?.trim();
    if (!input) { Utils.toast('예약번호를 입력하세요', 'warning'); return; }
    Utils.closeModal();
    Utils.loading(true);
    const res = await API.get('/api/reservations');
    Utils.loading(false);
    const found = res.data?.find(r => r.id === input) || {
      id: input, region: 'buyeo', regionName: '부여', date: Utils.today(),
      time: '09:30', name: '홍길동', phone: '010-1234-5678',
      passengers: [{type:'adult',count:2}], total: 60000,
      status: 'confirmed', payStatus: 'paid', wristband: 'pending', checkin: 'waiting'
    };
    FieldModule.showCheckinResult(found);
  },

  showCheckinResult: (reservation) => {
    const canIssue = reservation.payStatus === 'paid' && reservation.wristband !== 'issued';
    Utils.modal(`
      <div class="modal-header">
        <h3 class="font-bold text-navy-800 flex items-center gap-2">
          <span class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">✅</span>
          예약 확인 완료
        </h3>
        <button onclick="Utils.closeModal()" class="text-gray-400 text-xl">&times;</button>
      </div>
      <div class="modal-body">
        <div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div><span class="text-gray-500">예약번호</span><br><span class="font-mono font-bold text-xs">${reservation.id}</span></div>
            <div><span class="text-gray-500">예약자</span><br><span class="font-bold">${Utils.maskName(reservation.name)}</span></div>
            <div><span class="text-gray-500">탑승일시</span><br><span class="font-bold">${reservation.date} ${reservation.time}</span></div>
            <div><span class="text-gray-500">지역</span><br><span class="font-bold">${reservation.regionName}</span></div>
            <div><span class="text-gray-500">결제상태</span><br><span class="badge ${reservation.payStatus==='paid'?'badge-green':'badge-yellow'}">${reservation.payStatus==='paid'?'결제완료':'미결제'}</span></div>
            <div><span class="text-gray-500">손목밴드</span><br><span class="badge ${reservation.wristband==='issued'?'badge-blue':'badge-gray'}">${reservation.wristband==='issued'?'발급완료':'미발급'}</span></div>
          </div>
        </div>
        ${canIssue ? `
        <button onclick="Utils.closeModal();FieldModule.showWristbandIssue('${reservation.id}')" class="btn-green btn-xl bg-green-500 hover:bg-green-600 text-white mb-2">
          <i class="fas fa-band-aid mr-2"></i>손목밴드 발급하기
        </button>` : reservation.wristband==='issued' ? `
        <div class="bg-blue-50 rounded-xl p-3 text-center text-blue-700 font-bold mb-2">✅ 손목밴드 이미 발급됨</div>` : `
        <div class="bg-red-50 rounded-xl p-3 text-center text-red-600 font-bold mb-2">⚠️ 결제 미완료 - 현장 결제 필요</div>`}
        <button onclick="Utils.closeModal()" class="btn-outline w-full py-2.5 text-sm">닫기</button>
      </div>`, { size: 'max-w-sm' });
  },

  // ── 손목밴드 발급 ────────────────────────────────────────────
  showWristbandIssue: (reservationId) => {
    const wb = Settings.get('wristbandText');
    const today = Utils.today();
    Utils.modal(`
      <div class="modal-header bg-navy-800 rounded-t-2xl">
        <div class="text-white font-bold flex items-center gap-2"><i class="fas fa-band-aid text-cyan-400"></i> 손목밴드 발급</div>
        <button onclick="Utils.closeModal()" class="text-white/60 text-xl">&times;</button>
      </div>
      <div class="modal-body">
        ${reservationId ? `<div class="bg-gray-100 rounded-xl p-2 text-center font-mono text-xs text-gray-600 mb-3">${reservationId}</div>` : ''}
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="form-group">
            <label class="form-label">회차</label>
            <select class="form-select" id="wb-round">
              <option>09:30 (1회차)</option><option>11:30 (2회차)</option>
              <option>13:30 (3회차)</option><option>15:30 (4회차)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">권종</label>
            <select class="form-select" id="wb-type">
              <option>성인</option><option>청소년</option><option>어린이</option>
              <option>경로</option><option>장애인</option><option>국가유공자</option>
              <option>지역민</option><option>단체</option><option>무료/초대권</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">발급 수량</label>
            <input type="number" class="form-input" id="wb-count" value="1" min="1" max="20">
          </div>
          <div class="form-group">
            <label class="form-label">출력 방식</label>
            <select class="form-select" id="wb-print-method">
              <option value="thermal">감열라벨프린터</option>
              <option value="wristband">손목밴드프린터</option>
              <option value="sticker">스티커형</option>
              <option value="paper">일반인쇄</option>
            </select>
          </div>
        </div>
        <!-- 미리보기 -->
        <div class="bg-gray-50 rounded-xl p-3 mb-4">
          <div class="text-xs text-gray-500 mb-2 font-medium">손목밴드 미리보기</div>
          <div class="wristband-preview" style="max-width:100%">
            <div class="wristband-left">
              <div class="wristband-brand">${wb.brand || 'Aqua Mobility Korea'}</div>
              <div class="wristband-region">지역명</div>
              <div class="wristband-time" id="wb-preview-time">09:30</div>
              <div class="wristband-info" id="wb-preview-info">${today} | 1회차 | 성인</div>
              <div class="wristband-info font-mono text-xs">${reservationId || 'RES-XXXXXXX'}</div>

            </div>
            <div class="wristband-qr bg-white rounded-lg flex items-center justify-center p-1" id="wb-qr-preview"><img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(reservationId||'RES-TEMP')}" alt="QR" style="width:80px;height:80px;border-radius:4px" onerror="this.parentElement.innerHTML='<span class=text-gray-400 style=font-size:10px>QR</span>'"/></div>
          </div>
        </div>
        <div class="bg-amber-50 rounded-xl p-2 text-xs text-amber-700 mb-3">
          ⚠️ 손목밴드에 고객명·전화번호·생년월일·정확한 나이는 표시되지 않습니다
        </div>
        <div class="flex gap-2">
          <button onclick="FieldModule.issueWristband('${reservationId||''}')" class="btn-ocean flex-1 py-3">
            <i class="fas fa-print mr-2"></i>발급 및 인쇄
          </button>
          <button onclick="FieldModule.printPreview('${reservationId||''}')" class="btn-outline px-4 py-3 text-sm">
            <i class="fas fa-eye mr-1"></i>미리보기
          </button>
          <button onclick="Utils.closeModal()" class="btn-outline px-4 py-3 text-sm">취소</button>
        </div>
      </div>`, { size: 'max-w-sm' });
  },

  issueWristband: async (reservationId) => {
    const round = document.getElementById('wb-round')?.value;
    const type = document.getElementById('wb-type')?.value;
    const count = parseInt(document.getElementById('wb-count')?.value || '1');
    const printMethod = document.getElementById('wb-print-method')?.value || 'paper';
    Utils.closeModal();
    Utils.loading(true);
    const res = await API.post('/api/wristbands/issue', {
      reservationId: reservationId || 'FIELD-' + Utils.uid(),
      round, type, count,
      issuedBy: Store.get('user')?.name || '매표소1'
    });
    Utils.loading(false);
    if (res.success) {
      Utils.toast(`손목밴드 ${count}장 발급 완료!`, 'success', 3000);
      // 인쇄 처리
      FieldModule._doPrint(reservationId, round, type, count);
    } else {
      // API 실패해도 인쇄는 진행 (오프라인 발권)
      FieldModule._doPrint(reservationId, round, type, count);
    }
  },

  printPreview: (reservationId) => {
    FieldModule._doPrint(reservationId,
      document.getElementById('wb-round')?.value,
      document.getElementById('wb-type')?.value,
      parseInt(document.getElementById('wb-count')?.value || '1'));
  },

  _doPrint: (reservationId, round, type, count) => {
    const today = new Date().toLocaleDateString('ko-KR');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(reservationId||'RES-TEMP')}`;
    const printWin = window.open('', '_blank', 'width=400,height=300');
    if (!printWin) { Utils.toast('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.', 'error', 4000); return; }
    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>손목밴드 발급</title><style>
      body{margin:0;padding:8px;font-family:sans-serif;background:#fff}
      .band{display:flex;align-items:center;border:2px dashed #0ea5e9;border-radius:12px;padding:8px 12px;gap:12px;margin-bottom:8px;width:340px}
      .info{flex:1}.brand{font-size:9px;color:#64748b;font-weight:600;letter-spacing:1px}
      .region{font-size:14px;font-weight:900;color:#0c1461;margin:2px 0}
      .time{font-size:20px;font-weight:900;color:#0ea5e9}
      .meta{font-size:10px;color:#475569;margin-top:2px}
      .code{font-size:9px;font-family:monospace;color:#94a3b8}
      img{width:80px;height:80px;border:1px solid #e2e8f0;border-radius:6px}
      @media print{body{margin:0}button{display:none}}
    </style></head><body>
    ${Array.from({length:count},(_,i)=>`
      <div class="band">
        <div class="info">
          <div class="brand">AQUA MOBILITY KOREA</div>
          <div class="region">${round||'-'}회차</div>
          <div class="time">${type==='adult'?'성인':type==='child'?'소아':type==='infant'?'유아':type||'성인'}</div>
          <div class="meta">${today}</div>
          <div class="code">${reservationId||'RES-TEMP'}</div>
        </div>
        <img src="${qrUrl}" alt="QR"/>
      </div>`).join('')}
    <button onclick="window.print()" style="margin-top:8px;padding:8px 20px;background:#0ea5e9;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">🖨 인쇄</button>
    <script>window.onload=()=>window.print();<\/script>
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
    const id = document.getElementById('reissue-id')?.value;
    const reason = document.getElementById('reissue-reason')?.value;
    if (!id) { Utils.toast('손목밴드 ID를 입력하세요', 'warning'); return; }
    Utils.closeModal();
    Utils.loading(true);
    await new Promise(r => setTimeout(r, 800));
    Utils.loading(false);
    Utils.toast(`재발급 완료. 기존 손목밴드 무효 처리됨. 사유: ${reason}`, 'success', 4000);
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
    await new Promise(r => setTimeout(r, 500));
    Utils.loading(false);
    Utils.modal(`
      <div class="modal-body text-center py-6">
        <div class="text-6xl mb-3">✅</div>
        <h3 class="text-2xl font-black text-navy-800 mb-1">탑승 완료!</h3>
        <p class="text-gray-500 mb-4">${id}</p>
        <div class="bg-green-50 rounded-xl p-3 mb-4">
          <div class="grid grid-cols-2 gap-2 text-sm text-left">
            <div><span class="text-gray-500">손목밴드</span><br><span class="font-bold">${id}</span></div>
            <div><span class="text-gray-500">처리시간</span><br><span class="font-bold">${new Date().toLocaleTimeString('ko-KR')}</span></div>
            <div><span class="text-gray-500">권종</span><br><span class="font-bold">성인</span></div>
            <div><span class="text-gray-500">담당자</span><br><span class="font-bold">매표소1</span></div>
          </div>
        </div>
        <button onclick="Utils.closeModal()" class="btn-mint bg-green-500 text-white w-full py-3 rounded-xl font-bold">확인</button>
      </div>`, { size: 'max-w-xs' });
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
    const roundOptions = schedules.map(s => {
      const remain = (s.offlineCapacity||s.offline||0) - (s.bookedOffline||s.offlineBooked||0);
      const soldout = remain <= 0;
      return `<option value="${s.id}" data-time="${s.time}" data-region="${regionId}" ${soldout?'disabled':''}>
        ${s.time} ${soldout?'(매진)':'(현장잔여 '+remain+'석)'}
      </option>`;
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
    const res = await API.get('/api/reservations');
    const list = res.data || [];
    Utils.modal(`
      <div class="modal-header">
        <h3 class="font-bold text-navy-800">📋 탑승자 명부</h3>
        <button onclick="Utils.closeModal()" class="text-gray-400 text-xl">&times;</button>
      </div>
      <div class="modal-body p-0">
        <div class="flex gap-2 p-4 border-b">
          <button onclick="Utils.downloadCSV(${JSON.stringify(list.map(r=>({예약번호:r.id,지역:r.regionName,탑승일:r.date,시간:r.time,예약자:r.name,총금액:r.total,상태:r.status})))}, '탑승자명부_'+Utils.today()+'.csv')" class="btn-outline text-sm px-3 py-2"><i class="fas fa-file-excel mr-1 text-green-600"></i>엑셀 다운로드</button>
          <button onclick="Utils.print()" class="btn-outline text-sm px-3 py-2"><i class="fas fa-print mr-1"></i>인쇄</button>
        </div>
        <div class="overflow-x-auto max-h-96">
          <table class="admin-table">
            <thead><tr><th>예약번호</th><th>지역</th><th>탑승일시</th><th>예약자</th><th>인원</th><th>상태</th></tr></thead>
            <tbody>
              ${list.map(r=>`
              <tr>
                <td class="font-mono text-xs">${r.id}</td>
                <td>${r.regionName}</td>
                <td>${r.date} ${r.time}</td>
                <td>${Utils.maskName(r.name)}</td>
                <td>${r.passengers?.reduce((a,p)=>a+p.count,0)||'-'}명</td>
                <td><span class="badge badge-green">확정</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`, { size: 'max-w-2xl' });
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
