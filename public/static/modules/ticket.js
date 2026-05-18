// ============================================================
// TICKET PAGE — 탑승권 QR 확인 페이지
// URL: /ticket/{예약번호}
// SMS로 전송된 링크를 고객이 열면 이 페이지가 표시됨
// ============================================================

const TicketPage = {

  show: async (reservationNo) => {
    if (!reservationNo) {
      return TicketPage._error('예약번호가 없습니다.');
    }

    // API에서 예약 정보 조회
    const res = await API.get(`/api/reservations/ticket/${encodeURIComponent(reservationNo)}`);

    if (!res.success || !res.data) {
      return TicketPage._error('예약 정보를 찾을 수 없습니다.<br>예약번호를 다시 확인해 주세요.');
    }

    const r = res.data;
    const statusMap = {
      confirmed: { label: '예약확정', color: 'bg-green-500', icon: '✅' },
      checkedin: { label: '발권완료', color: 'bg-blue-500',  icon: '🎫' },
      boarded:   { label: '탑승완료', color: 'bg-indigo-500',icon: '🚌' },
      cancelled: { label: '취소됨',   color: 'bg-red-500',   icon: '❌' },
    };
    const st = statusMap[r.status] || { label: r.status, color: 'bg-gray-500', icon: '📋' };

    // 캔버스 QR 생성용 데이터
    const qrData = r.reservationNo;

    // QR 코드 렌더링 — 라이브러리 로딩 완료 대기
    const _renderQR = (attempt = 0) => {
      const canvas = document.getElementById('ticket-qr-canvas');
      if (!canvas) return; // 취소된 예약은 캔버스 없음
      if (window.QRCode) {
        QRCode.toCanvas(canvas, qrData, {
          width: 200,
          margin: 2,
          color: { dark: '#0a2d6b', light: '#ffffff' },
        }, (err) => {
          if (err) {
            console.error('QR 생성 오류:', err);
            // 실패 시 이미지 API 폴백
            const img = document.createElement('img');
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&color=0a2d6b`;
            img.className = 'rounded-xl shadow w-48 h-48';
            canvas.replaceWith(img);
          }
        });
      } else if (attempt < 20) {
        // 최대 2초 대기
        setTimeout(() => _renderQR(attempt + 1), 100);
      } else {
        // QRCode 라이브러리 없으면 이미지 API로 폴백
        const img = document.createElement('img');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&color=0a2d6b`;
        img.className = 'rounded-xl shadow w-48 h-48';
        canvas.replaceWith(img);
      }
    };
    setTimeout(() => _renderQR(), 150);

    return `
<div class="min-h-screen bg-gradient-to-br from-navy-900 via-ocean-700 to-navy-800 flex items-center justify-center p-4">
  <div class="w-full max-w-sm">

    <!-- 상단 로고 -->
    <div class="text-center mb-6">
      <div class="text-white text-2xl font-black tracking-tight">🌊 아쿠아모빌리티코리아</div>
      <div class="text-white/60 text-sm mt-1">수륙양용 투어 탑승권</div>
    </div>

    <!-- 탑승권 카드 -->
    <div class="bg-white rounded-3xl shadow-2xl overflow-hidden">

      <!-- 상태 헤더 -->
      <div class="${st.color} px-6 py-4 text-white text-center">
        <div class="text-3xl mb-1">${st.icon}</div>
        <div class="text-xl font-black">${st.label}</div>
        <div class="text-white/80 text-xs mt-1">${r.reservationNo}</div>
      </div>

      <!-- QR 코드 영역 -->
      <div class="flex justify-center items-center py-6 bg-gray-50 border-b-2 border-dashed border-gray-200">
        ${r.status === 'cancelled'
          ? `<div class="text-center text-gray-400"><div class="text-5xl mb-2">🚫</div><div class="text-sm">취소된 예약입니다</div></div>`
          : `<div class="flex flex-col items-center">
               <canvas id="ticket-qr-canvas" class="rounded-xl shadow"></canvas>
               <div class="text-xs text-gray-400 mt-2">매표소에서 스캔</div>
             </div>`
        }
      </div>

      <!-- 예약 정보 -->
      <div class="px-6 py-4 space-y-3">
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-500 text-sm">지역</span>
          <span class="font-bold text-navy-800">${r.regionName || r.regionId}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-500 text-sm">탑승일</span>
          <span class="font-bold text-navy-800">${r.date}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-500 text-sm">회차</span>
          <span class="font-bold text-navy-800">${r.time || '-'} 출발</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-500 text-sm">예약자</span>
          <span class="font-bold text-navy-800">${r.name}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-500 text-sm">인원</span>
          <span class="font-bold text-navy-800">${r.pax}명</span>
        </div>
        <div class="flex justify-between items-center py-2">
          <span class="text-gray-500 text-sm">결제금액</span>
          <span class="font-bold text-ocean-600">₩${Number(r.totalPrice || 0).toLocaleString()}</span>
        </div>
      </div>

      <!-- 안내사항 -->
      ${r.status !== 'cancelled' ? `
      <div class="mx-4 mb-4 bg-blue-50 rounded-xl p-3 text-xs text-blue-700 space-y-1">
        <div class="font-bold mb-1">📌 탑승 안내</div>
        <div>• 탑승 30분 전까지 매표소에서 QR 제시</div>
        <div>• 손목밴드 착용 후 탑승구로 이동</div>
        <div>• 구명조끼는 탑승 후 착용 안내 드립니다</div>
      </div>` : ''}

      <!-- 하단 버튼 -->
      <div class="px-4 pb-4 flex gap-2">
        <button onclick="history.back()"
          class="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">
          ← 뒤로
        </button>
        <button onclick="window.print()"
          class="flex-1 bg-navy-800 text-white py-3 rounded-xl text-sm font-bold hover:bg-navy-700">
          🖨 인쇄
        </button>
      </div>
    </div>

    <!-- 고객센터 -->
    <div class="text-center mt-4 text-white/60 text-xs">
      문의: aquamobility.co.kr | 예약번호: ${r.reservationNo}
    </div>
  </div>
</div>

<style>
  @media print {
    nav, button, .no-print { display: none !important; }
    body { background: white !important; }
    .bg-gradient-to-br { background: white !important; }
  }
</style>`;
  },

  _error: (msg) => `
<div class="min-h-screen bg-gradient-to-br from-navy-900 to-ocean-700 flex items-center justify-center p-4">
  <div class="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
    <div class="text-5xl mb-4">😕</div>
    <h2 class="text-xl font-black text-navy-800 mb-2">탑승권을 찾을 수 없습니다</h2>
    <p class="text-gray-500 text-sm mb-6">${msg}</p>
    <a href="/" class="block bg-navy-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-navy-700">
      홈으로 이동
    </a>
  </div>
</div>`,
};
