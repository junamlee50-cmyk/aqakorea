// ============================================================
// CUSTOMER MODULE - 고객용 메인 + 예약 흐름
// ============================================================

const CustomerPages = {

  // ── 메인 홈 ────────────────────────────────────────────────
  home: async () => {
    const [regRes, statsRes] = await Promise.all([
      API.get('/api/regions'),
      API.get('/api/stats'),
    ]);
    const regions = (regRes.data || []).filter(r => r.status === 'open' || r.status === 'preparing');
    const today = Utils.today();
    setTimeout(() => { Navbar.init(); PopupManager.show('all'); }, 100);
    return `
${Navbar.render('home')}
<!-- HERO -->
<section class="hero-section" style="padding-top:64px">
  <div class="hero-bg-waves"><div class="wave wave-1"></div><div class="wave wave-2"></div><div class="wave wave-3"></div></div>
  <div class="bubble" style="width:120px;height:120px;top:15%;left:8%;animation-delay:0s"></div>
  <div class="bubble" style="width:60px;height:60px;top:60%;right:12%;animation-delay:1.5s"></div>
  <div class="bubble" style="width:80px;height:80px;top:30%;right:25%;animation-delay:0.8s"></div>
  <div class="max-w-6xl mx-auto px-4 py-20 relative z-10 text-white">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div class="slide-up">
        <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
          <span class="w-2 h-2 bg-green-400 rounded-full pulse-anim"></span>
          부여 예약가능 · 통영/합천 준비중
        </div>
        <h1 class="text-4xl md:text-6xl font-black leading-tight mb-6">
          수륙양용버스로<br>
          <span class="brand-gradient">육지와 바다</span>를<br>
          한 번에 누비다
        </h1>
        <p class="text-white/70 text-lg mb-8 leading-relaxed">
          전국 수륙양용투어 통합 예약 플랫폼<br>
          아쿠아모빌리티코리아와 함께하는 특별한 관광 체험
        </p>
        <div class="flex flex-wrap gap-3">
          <button onclick="Router.go('/reservation')" class="btn-ocean btn-xl" style="width:auto;padding:16px 32px">
            <i class="fas fa-ticket-alt"></i> 지금 바로 예약하기
          </button>
          <button onclick="Router.go('/faq')" class="btn-outline" style="color:white;border-color:rgba(255,255,255,0.4);padding:16px 24px">
            <i class="fas fa-question-circle"></i> 자주 묻는 질문
          </button>
        </div>
        <div class="flex items-center gap-6 mt-8 text-sm text-white/60">
          <div><span class="text-white font-bold text-xl" data-count="4531"></span>명 탑승 완료</div>
          <div class="w-px h-8 bg-white/20"></div>
          <div><span class="text-white font-bold text-xl">4.9</span> ⭐ 만족도</div>
          <div class="w-px h-8 bg-white/20"></div>
          <div><span class="text-white font-bold text-xl">3</span>개 지역 운행</div>
        </div>
      </div>
      <div class="hidden md:flex justify-center fade-in">
        <div class="relative">
          <div class="w-80 h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 float-anim">
            <img src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600" alt="수륙양용버스 수상 진입" class="w-full h-full object-cover" loading="eager">
          </div>
          <div class="absolute -bottom-4 -left-8 bg-white rounded-2xl p-3 shadow-xl flex items-center gap-3 slide-up" style="animation-delay:0.3s">
            <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🎫</div>
            <div><div class="font-bold text-navy-800 text-sm">부여 예약 가능</div><div class="text-blue-600 font-bold">온라인 즉시 예약</div></div>
          </div>
          <div class="absolute -top-4 -right-4 bg-cyan-500 text-white rounded-2xl p-3 shadow-xl slide-up" style="animation-delay:0.5s">
            <div class="font-bold text-sm">QR 손목밴드</div>
            <div class="text-xs text-white/80">현장 즉시 발급</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 지역 선택 -->
<section class="max-w-6xl mx-auto px-4 py-16">
  <div class="text-center mb-10">
    <h2 class="text-3xl font-black text-navy-800 mb-3">전국 수륙양용투어 예약</h2>
    <p class="text-gray-500">원하는 지역을 선택하고 바로 예약하세요</p>
  </div>
  <div class="grid md:grid-cols-3 gap-6">
    ${regions.map(r => `
    <div class="region-card ${r.status==='preparing'?'opacity-80':''}"
      onclick="${r.status==='open'?`Router.go('/reservation/${r.id}')`:''}"
      style="${r.status==='preparing'?'cursor:default':'cursor:pointer'}">
      <div class="relative overflow-hidden" style="height:200px">
        <img src="${r.image}" alt="${r.name} 수륙양용버스" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" loading="lazy">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div class="absolute bottom-3 left-3">
          ${r.status==='open'
            ? '<span class="region-status status-active"><i class="fas fa-circle text-xs"></i> 예약 가능</span>'
            : '<span class="region-status status-preparing">🔧 준비중</span>'}
        </div>
        <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-bold text-navy-800">
          ${r.status==='open'?`성인 ${Utils.money(r.fares?.find(f=>f.type==='adult')?.price||0).replace('원','')}~`:'오픈 예정'}
        </div>
      </div>
      <div class="region-card-body">
        <h3 class="font-black text-navy-800 text-xl mb-1">${r.name}</h3>
        <p class="text-gray-500 text-sm mb-4 leading-relaxed">${r.tagline}</p>
        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-400"><i class="fas fa-map-marker-alt mr-1 text-cyan-500"></i>${r.location}</div>
          ${r.status==='open'
            ? '<button class="btn-ocean text-sm px-4 py-2" style="border-radius:10px">예약하기 →</button>'
            : '<span class="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">🔔 오픈 알림 신청</span>'}
        </div>
      </div>
    </div>`).join('')}
  </div>
</section>

<!-- 서비스 특징 -->
<section class="bg-gradient-to-br from-navy-900 to-ocean-800 py-16">
  <div class="max-w-6xl mx-auto px-4">
    <div class="text-center mb-10">
      <h2 class="text-3xl font-black text-white mb-3">왜 아쿠아모빌리티코리아인가요?</h2>
      <p class="text-white/60">전국 수륙양용 관광의 표준, 안전하고 편리한 예약 시스템</p>
    </div>
    <div class="grid md:grid-cols-4 gap-6">
      ${[
        {icon:'📱',t:'모바일 QR 탑승권',d:'예약 즉시 QR 발급. 종이 없이 스마트하게'},
        {icon:'🎫',t:'QR 손목밴드 발급',d:'현장 도착 후 QR 손목밴드로 탑승 완료'},
        {icon:'🏦',t:'지역 법인 직접 결제',d:'각 지역 운영 법인에 직접 결제, 안전한 정산'},
        {icon:'🌊',t:'날씨 실시간 안내',d:'기상 악화 시 즉시 알림 및 전액 환불'},
      ].map(f => `
      <div class="text-center p-6">
        <div class="text-5xl mb-4">${f.icon}</div>
        <h3 class="text-white font-bold mb-2">${f.t}</h3>
        <p class="text-white/50 text-sm">${f.d}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- 이용 흐름 -->
<section class="max-w-6xl mx-auto px-4 py-16">
  <h2 class="text-3xl font-black text-navy-800 text-center mb-10">예약부터 탑승까지</h2>
  <div class="grid md:grid-cols-6 gap-4 items-start">
    ${[
      {n:'1',icon:'🗓️',t:'날짜/지역\n선택'},
      {n:'2',icon:'👥',t:'인원/요금\n선택'},
      {n:'3',icon:'📋',t:'탑승신고서\n작성'},
      {n:'4',icon:'💳',t:'온라인\n결제'},
      {n:'5',icon:'📱',t:'QR 탑승권\n발급'},
      {n:'6',icon:'🎫',t:'현장 QR\n손목밴드'},
    ].map((s,i) => `
    <div class="text-center relative">
      ${i<5?'<div class="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400 z-0" style="width:100%"></div>':''}
      <div class="relative z-10 w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg">${s.icon}</div>
      <div class="text-xs font-bold text-navy-800 whitespace-pre-line">${s.t}</div>
    </div>`).join('')}
  </div>
</section>

<!-- 지금 예약 가능한 지역 + 서비스 안내 -->
<section class="bg-gradient-to-br from-cyan-50 to-blue-50 py-14">
  <div class="max-w-6xl mx-auto px-4">
    <div class="text-center mb-10">
      <h2 class="text-2xl font-black text-navy-800 mb-2">지금 바로 예약하세요</h2>
      <p class="text-gray-500 text-sm">부여 수륙양용투어 온라인 예약 운영 중 · 통영/합천 오픈 예정</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <!-- 부여 예약 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border-2 border-cyan-400 relative overflow-hidden">
        <div class="absolute top-3 right-3 bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full">예약 가능</div>
        <div class="text-4xl mb-3">🌊</div>
        <h3 class="font-black text-navy-800 text-lg mb-1">부여 수륙양용투어</h3>
        <p class="text-gray-500 text-sm mb-4">백제의 수도 부여에서 펼쳐지는<br>수륙양용버스 체험 · 백마강 수상 진입 코스</p>
        <div class="space-y-1.5 text-xs text-gray-500 mb-5">
          <div><i class="fas fa-clock text-cyan-500 mr-1"></i> 09:30 / 11:30 / 13:30 / 15:30 (4회차)</div>
          <div><i class="fas fa-map-marker-alt text-cyan-500 mr-1"></i> 충남 부여군 백마강 선착장</div>
          <div><i class="fas fa-won-sign text-cyan-500 mr-1"></i> 성인 25,000원 ~ (소아/경로 할인)</div>
        </div>
        <button onclick="Router.go('/reservation/buyeo')" class="btn-ocean w-full text-sm py-2.5" style="border-radius:10px">
          <i class="fas fa-ticket-alt mr-1"></i> 부여 예약하기
        </button>
      </div>
      <!-- 단체예약 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div class="text-4xl mb-3">🚌</div>
        <h3 class="font-black text-navy-800 text-lg mb-1">단체·학교·기업 예약</h3>
        <p class="text-gray-500 text-sm mb-4">20인 이상 단체는 별도 문의 주세요<br>단체 할인 · 전용 서비스 · 맞춤 코스 제공</p>
        <div class="space-y-1.5 text-xs text-gray-500 mb-5">
          <div><i class="fas fa-users text-blue-500 mr-1"></i> 20인 이상 단체 특가</div>
          <div><i class="fas fa-school text-blue-500 mr-1"></i> 학교 체험학습 전용 프로그램</div>
          <div><i class="fas fa-building text-blue-500 mr-1"></i> 기업 워크숍 / 여행사 패키지</div>
        </div>
        <button onclick="Router.go('/inquiry')" class="w-full border-2 border-navy-800 text-navy-800 font-bold text-sm py-2.5 rounded-xl hover:bg-navy-800 hover:text-white transition-all">
          <i class="fas fa-phone mr-1"></i> 단체예약 문의하기
        </button>
      </div>
      <!-- QR 손목밴드 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div class="text-4xl mb-3">🎫</div>
        <h3 class="font-black text-navy-800 text-lg mb-1">QR 손목밴드 시스템</h3>
        <p class="text-gray-500 text-sm mb-4">현장 도착 후 QR 손목밴드 즉시 발급<br>탑승부터 탈출까지 스마트하게</p>
        <div class="space-y-1.5 text-xs text-gray-500 mb-5">
          <div><i class="fas fa-qrcode text-purple-500 mr-1"></i> 예약번호 QR로 현장 수령</div>
          <div><i class="fas fa-tint text-purple-500 mr-1"></i> 방수 소재 손목밴드</div>
          <div><i class="fas fa-bolt text-purple-500 mr-1"></i> 5초 탑승 완료 · 줄서기 없음</div>
        </div>
        <div class="bg-purple-50 rounded-xl px-4 py-2.5 text-xs text-purple-700 font-medium text-center">
          <i class="fas fa-info-circle mr-1"></i> 온라인 예약 후 현장에서 수령
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 관광 콘텐츠 -->
<section class="max-w-6xl mx-auto px-4 py-16">
  <h2 class="text-2xl font-black text-navy-800 mb-6">수륙양용버스 여행 가이드</h2>
  <div class="grid md:grid-cols-3 gap-6">
    ${[
      {href:'/content/buyeo-daytrip',img:'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',tag:'부여',t:'부여 당일치기 여행코스',d:'수륙양용버스+백제역사유적지구 완벽 코스'},
      {href:'/content/tongyeong-marine',img:'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',tag:'통영',t:'통영 해양관광 추천코스',d:'한려수도의 절경을 수상에서 즐기는 투어'},
      {href:'/content/hapcheon-family',img:'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=400',tag:'합천',t:'합천 가족여행 추천',d:'합천호+해인사 가족여행 완성 코스'},
    ].map(c => `
    <a href="${c.href}" data-link class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
      <div class="h-44 overflow-hidden">
        <img src="${c.img}" alt="${c.t}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
      </div>
      <div class="p-4">
        <span class="text-xs font-bold text-cyan-500 bg-cyan-50 px-2 py-1 rounded-md">${c.tag}</span>
        <h3 class="font-bold text-navy-800 mt-2 mb-1">${c.t}</h3>
        <p class="text-gray-500 text-sm">${c.d}</p>
      </div>
    </a>`).join('')}
  </div>
</section>

${Footer.render()}
<!-- 모바일 고정 예약 버튼 -->
<button onclick="Router.go('/reservation')" class="sticky-book-btn md:hidden">
  <i class="fas fa-ticket-alt"></i> 수륙양용투어 예약하기
</button>`;
  },

  // ── 예약 허브 ───────────────────────────────────────────────
  reservationHub: async () => {
    const res = await API.get('/api/regions');
    const regions = (res.data || []).filter(r => r.status !== 'hidden');
    setTimeout(() => Navbar.init(), 100);
    return `
${Navbar.render('reservation')}
<div style="padding-top:64px" class="min-h-screen bg-gray-50">
  <div class="bg-gradient-to-r from-navy-900 to-ocean-700 py-12 text-white text-center">
    <h1 class="text-3xl md:text-4xl font-black mb-2">수륙양용투어 예약</h1>
    <p class="text-white/70">지역을 선택하고 날짜·인원을 설정하세요</p>
  </div>
  <div class="max-w-5xl mx-auto px-4 py-10">
    <div class="grid md:grid-cols-3 gap-6 mb-10">
      ${regions.map(r => `
      <div class="region-card ${r.status==='preparing'?'opacity-80':''}"
        onclick="${r.status==='open'?`Router.go('/reservation/${r.id}')`:''}"
        style="${r.status==='preparing'?'cursor:default':'cursor:pointer'}">
        <div class="relative overflow-hidden" style="height:180px">
          <img src="${r.image}" alt="${r.name} 수륙양용버스" class="w-full h-full object-cover" loading="lazy">
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div class="absolute bottom-3 left-3">
            <span class="region-status ${r.status==='open'?'status-active':'status-preparing'}">
              ${r.status==='open'?'✅ 예약 가능':'🔧 준비중'}
            </span>
          </div>
        </div>
        <div class="p-4">
          <h2 class="font-black text-navy-800 text-lg mb-1">${r.name}</h2>
          <p class="text-gray-500 text-sm mb-3">${r.tagline}</p>
          ${r.status==='open' ? `
          <div class="text-xs text-gray-400 mb-3"><i class="fas fa-map-marker-alt text-cyan-500 mr-1"></i>${r.boardingPlace}</div>
          <div class="flex items-center justify-between">
            <div class="text-sm"><span class="font-bold text-navy-800">성인 ${Utils.money(r.fares?.find(f=>f.type==='adult')?.price||0)}</span><span class="text-gray-400">~</span></div>
            <button class="btn-ocean text-sm px-4 py-2" style="border-radius:10px">예약 →</button>
          </div>` : `
          <div class="text-center py-3">
            <p class="text-gray-400 text-sm mb-2">오픈 준비 중입니다</p>
            <button onclick="event.stopPropagation();Utils.toast('오픈 시 알림을 보내드립니다 📢','info')"
              class="text-xs text-blue-500 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-all">
              🔔 오픈 알림 신청
            </button>
          </div>`}
        </div>
      </div>`).join('')}
    </div>
    <!-- 단체예약 -->
    <div class="bg-gradient-to-r from-navy-800 to-ocean-700 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
      <div><h3 class="font-bold text-xl mb-1">🚌 단체예약 문의</h3><p class="text-white/70 text-sm">20인 이상 단체·학교·기업·여행사 단체예약은 별도 문의 주세요. 단체 할인 및 전용 서비스 제공.</p></div>
      <button onclick="Router.go('/inquiry')" class="btn-ocean whitespace-nowrap px-6 py-3" style="border-radius:12px">단체예약 문의 →</button>
    </div>
  </div>
</div>
${Footer.render()}
<button onclick="Router.go('/reservation')" class="sticky-book-btn md:hidden"><i class="fas fa-ticket-alt"></i> 지역 선택하기</button>`;
  },

  // ── 지역별 예약 페이지 ──────────────────────────────────────
  regionPage: async (regionId) => {
    const [regRes, schRes] = await Promise.all([
      API.get(`/api/regions/${regionId}`),
      API.get(`/api/schedules/${regionId}`),
    ]);
    if (!regRes.success) return CustomerPages._404();
    const region = regRes.data;
    const schedules = schRes.data || [];
    if (region.status === 'hidden') return CustomerPages._404();
    if (region.status === 'preparing') return CustomerPages._preparingPage(region);
    setTimeout(() => { Navbar.init(); CustomerPages.initRegionPage(region, schedules); }, 100);
    return `
${Navbar.render('reservation')}
<div style="padding-top:64px">
<!-- 히어로 -->
<section class="relative h-72 md:h-96 overflow-hidden">
  <img src="${region.heroImage}" alt="${region.name} 수륙양용버스" class="w-full h-full object-cover">
  <div class="absolute inset-0 bg-gradient-to-r from-navy-900/80 to-transparent"></div>
  <div class="absolute inset-0 flex items-center">
    <div class="max-w-6xl mx-auto px-4 text-white">
      <nav class="flex items-center gap-2 text-xs text-white/60 mb-3">
        <a href="/" data-link class="hover:text-white">홈</a> <span>/</span>
        <a href="/reservation" data-link class="hover:text-white">예약</a> <span>/</span>
        <span class="text-white">${region.name}</span>
      </nav>
      <h1 class="text-3xl md:text-5xl font-black mb-2">${region.name}</h1>
      <p class="text-white/80 text-lg">${region.tagline}</p>
    </div>
  </div>
</section>

<!-- 예약 메인 -->
<div class="max-w-6xl mx-auto px-4 py-8">
  <div class="grid md:grid-cols-3 gap-8">
    <!-- 왼쪽: 예약 폼 -->
    <div class="md:col-span-2 space-y-6">
      <!-- 날짜 선택 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h2 class="font-bold text-navy-800 text-lg mb-4">📅 날짜 선택</h2>
        <div class="flex items-center gap-3 mb-4">
          <button onclick="CustomerPages.prevMonth()" class="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><i class="fas fa-chevron-left text-sm"></i></button>
          <span id="cal-month" class="font-bold text-navy-800 flex-1 text-center"></span>
          <button onclick="CustomerPages.nextMonth()" class="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><i class="fas fa-chevron-right text-sm"></i></button>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
          ${['일','월','화','수','목','금','토'].map(d=>`<div class="font-bold">${d}</div>`).join('')}
        </div>
        <div id="cal-grid" class="calendar-grid gap-1"></div>
      </div>

      <!-- 회차 선택 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm" id="schedule-section">
        <h2 class="font-bold text-navy-800 text-lg mb-4">🕐 회차 선택</h2>
        <div id="schedule-list" class="grid grid-cols-2 gap-3">
          ${schedules.map(s => `
          <div class="schedule-card ${s.status==='soldout'?'soldout':''}" data-schedule-id="${s.id}" onclick="CustomerPages.selectSchedule('${s.id}', this)">
            <div class="flex justify-between items-start mb-2">
              <span class="schedule-card-time">${s.time}</span>
              <span class="text-xs ${s.status==='soldout'?'text-red-500 font-bold':'text-green-600 font-bold'}">
                ${s.status==='soldout'?'매진':s.onlineBooked>=s.online?'온라인 마감':'잔여 '+(s.online-s.onlineBooked)+'석'}
              </span>
            </div>
            <div class="text-xs text-gray-500">${s.course.split('→')[0].trim()} 출발</div>
            <div class="seat-bar mt-2"><div class="seat-bar-fill ${(s.onlineBooked/s.online)>0.8?'danger':(s.onlineBooked/s.online)>0.6?'warning':''}" style="width:${Math.min(100,Math.round(s.onlineBooked/s.online*100))}%"></div></div>
            <div class="text-xs text-gray-400 mt-1">온라인 예약 ${s.online-s.onlineBooked}/${s.online}석</div>
          </div>`).join('')}
        </div>
      </div>

      <!-- 인원/요금 선택 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm" id="fare-section">
        <h2 class="font-bold text-navy-800 text-lg mb-4">👥 인원 선택</h2>
        <div id="fare-list">
          ${region.fares?.map(f => `
          <div class="fare-row" id="fare-${f.id}">
            <div>
              <div class="font-medium text-navy-800">${f.label}</div>
              <div class="text-sm text-gray-500">${Utils.money(f.price)}</div>
            </div>
            <div class="fare-counter">
              <button class="counter-btn" onclick="CustomerPages.changeFare('${f.id}', -1)" disabled>−</button>
              <span class="counter-num" id="cnt-${f.id}">0</span>
              <button class="counter-btn" onclick="CustomerPages.changeFare('${f.id}', 1)">+</button>
            </div>
          </div>`).join('')}
        </div>
        <div class="mt-4 p-3 bg-yellow-50 rounded-xl text-xs text-yellow-800">
          <i class="fas fa-info-circle mr-1"></i> 만 36개월 미만 유아는 무료(좌석 미제공). 경로/장애인/국가유공자는 현장 증빙 확인
        </div>
      </div>

      <!-- 탑승신고서 (전원 입력 방식) -->
      <div class="bg-white rounded-2xl p-6 shadow-sm" id="form-section">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-bold text-navy-800 text-lg">📋 온라인 탑승신고서</h2>
          <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">탑승자 전원 입력</span>
        </div>

        <!-- 섹션 1: 예약자 정보 -->
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</div>
            <h3 class="font-semibold text-navy-800 text-sm">예약자 정보 (대표)</h3>
          </div>
          <div class="grid md:grid-cols-2 gap-4 pl-8">
            <div class="form-group">
              <label class="form-label required">예약자명</label>
              <input type="text" class="form-input" id="inp-name" placeholder="실명 입력">
            </div>
            <div class="form-group">
              <label class="form-label required">휴대폰번호</label>
              <input type="tel" class="form-input" id="inp-phone" placeholder="010-0000-0000">
            </div>
            <div class="form-group">
              <label class="form-label">이메일 (선택)</label>
              <input type="email" class="form-input" id="inp-email" placeholder="example@email.com">
            </div>
            <div class="form-group">
              <label class="form-label required">거주지역</label>
              <select class="form-select" id="inp-region">
                <option value="">선택하세요</option>
                ${['서울','경기','인천','부산','대구','광주','대전','울산','세종','강원','충북','충남','전북','전남','경북','경남','제주'].map(r=>`<option>${r}</option>`).join('')}
              </select>
            </div>
            <div class="form-group md:col-span-2">
              <label class="form-label">방문 경로</label>
              <div class="flex flex-wrap gap-2">
                ${['네이버','카카오','인스타그램','유튜브','블로그','지자체홍보','현수막QR','여행사','지인소개','기타'].map(src=>`
                <button class="px-3 py-1.5 rounded-lg border-2 border-gray-200 text-sm hover:border-cyan-400 transition-all source-btn" onclick="CustomerPages.selectSource('${src}', this)">${src}</button>`).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- 섹션 2: 탑승자 전원 정보 -->
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</div>
            <h3 class="font-semibold text-navy-800 text-sm">탑승자 정보 <span class="text-xs text-gray-500 font-normal">(예약자 포함 전원 입력)</span></h3>
          </div>
          <div class="pl-8">
            <div class="bg-cyan-50 rounded-xl p-3 mb-3 text-xs text-cyan-800">
              <i class="fas fa-info-circle mr-1"></i>
              인원을 선택하시면 탑승자 입력란이 자동 생성됩니다. 만 36개월 미만 유아는 제외합니다.
            </div>
            <div id="passengers-container">
              <p class="text-sm text-gray-400 text-center py-4"><i class="fas fa-arrow-up mr-1"></i>위에서 탑승 인원을 먼저 선택해주세요</p>
            </div>
          </div>
        </div>

        <!-- 섹션 3: 특이사항 -->
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</div>
            <h3 class="font-semibold text-navy-800 text-sm">특이사항 <span class="text-xs text-gray-500 font-normal">(선택)</span></h3>
          </div>
          <div class="pl-8">
            <div class="grid grid-cols-2 gap-2 mb-3">
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                <input type="checkbox" id="sp-wheelchair" class="rounded text-cyan-600">
                <span class="text-sm text-gray-700">휠체어 탑승자</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                <input type="checkbox" id="sp-pregnant" class="rounded text-cyan-600">
                <span class="text-sm text-gray-700">임산부 포함</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                <input type="checkbox" id="sp-infant" class="rounded text-cyan-600">
                <span class="text-sm text-gray-700">36개월 미만 유아 동반</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                <input type="checkbox" id="sp-heart" class="rounded text-cyan-600">
                <span class="text-sm text-gray-700">심장·고혈압 환자</span>
              </label>
            </div>
            <textarea id="inp-memo" rows="2" placeholder="기타 요청사항 (선택)"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-400 outline-none resize-none"></textarea>
          </div>
        </div>

        <!-- 섹션 4: 동의항목 -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div class="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">4</div>
            <h3 class="font-semibold text-navy-800 text-sm">약관 동의</h3>
          </div>
          <div class="pl-8 space-y-2.5">
            ${[
              {id:'agree1',label:'안전수칙 확인 및 구명조끼 착용 의무 동의',req:true},
              {id:'agree2',label:'기상악화·차량점검 시 운휴 가능성 동의',req:true},
              {id:'agree3',label:'개인정보 수집 및 이용 동의',req:true},
              {id:'agree4',label:'환불규정 동의',req:true},
              {id:'agree5',label:'마케팅 정보 수신 동의',req:false},
            ].map(a=>`
            <div class="form-check">
              <input type="checkbox" id="${a.id}" ${a.req?'required':''}>
              <label class="form-check-label ${a.req?'required':''}" for="${a.id}">${a.label} ${a.req?'<span style=\"color:#ef4444\">(필수)</span>':'(선택)'}</label>
            </div>`).join('')}
            <div class="mt-3 flex items-center gap-4">
              <button onclick="CustomerPages.checkAll()" class="text-cyan-600 text-sm font-medium hover:underline">
                <i class="fas fa-check-double mr-1"></i>전체 동의
              </button>
              <button onclick="Utils.modal(CustomerPages.termsModal())" class="text-gray-400 text-sm hover:text-gray-600 underline">약관 상세보기</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 오른쪽: 예약 요약 -->
    <div class="space-y-4">
      <div class="summary-box sticky top-20">
        <div class="text-white/60 text-sm mb-2">${region.name}</div>
        <div class="text-white font-black text-xl mb-4" id="summary-region">${region.name} 수륙양용투어</div>
        <div class="space-y-2">
          <div class="summary-row"><span class="text-white/70 text-sm">선택 날짜</span><span class="text-white text-sm font-bold" id="sum-date">날짜를 선택하세요</span></div>
          <div class="summary-row"><span class="text-white/70 text-sm">선택 회차</span><span class="text-white text-sm font-bold" id="sum-time">회차를 선택하세요</span></div>
          <div class="summary-row"><span class="text-white/70 text-sm">탑승 인원</span><span class="text-white text-sm font-bold" id="sum-pax">0명</span></div>
        </div>
        <div class="border-t border-white/20 mt-4 pt-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-white/70 text-sm">예약 금액</span>
            <span class="summary-total" id="sum-total">₩0</span>
          </div>
          <div class="text-xs text-white/40 mb-4">
            실제 판매자: ${region.company?.name || '-'}<br>
            PG: ${region.pgMerchant?.merchantId || '-'}
          </div>
          <button onclick="CustomerPages.goPayment('${regionId}')" class="btn-ocean btn-xl" id="pay-btn">
            <i class="fas fa-lock mr-2"></i>결제하기
          </button>
          <div class="text-center text-xs text-white/40 mt-2">
            <i class="fas fa-shield-alt mr-1"></i>SSL 보안 결제
          </div>
        </div>

        <!-- 지역 정보 -->
        <div class="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm">
          <div class="flex items-start gap-2 text-white/60">
            <i class="fas fa-map-marker-alt mt-0.5 text-cyan-400 flex-shrink-0"></i>
            <span>${region.boardingPlace}</span>
          </div>
          <div class="flex items-start gap-2 text-white/60">
            <i class="fas fa-parking mt-0.5 text-cyan-400 flex-shrink-0"></i>
            <span>${region.parkingInfo}</span>
          </div>
          <div class="flex items-start gap-2 text-white/60">
            <i class="fas fa-phone mt-0.5 text-cyan-400 flex-shrink-0"></i>
            <a href="tel:${region.customerService}" class="text-cyan-400 font-bold">${region.customerService}</a>
          </div>
        </div>
      </div>

      <!-- 예약 전 안내 -->
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div class="font-bold text-amber-800 text-sm mb-2">⚠️ 예약 전 필수 확인</div>
        <ul class="text-xs text-amber-700 space-y-1">
          <li>• 구명조끼 착용 의무화</li>
          <li>• 탑승 20분 전 도착 권장</li>
          <li>• 기상악화 시 운휴 가능</li>
          <li>• 음식물 반입 금지</li>
          <li>• 경로/장애인 현장 증빙 필수</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- 지역 정보 탭 -->
  <div class="mt-12 bg-white rounded-2xl shadow-sm overflow-hidden">
    <div class="tab-nav p-2" style="border-radius:0">
      ${['코스안내','요금표','운행시간','탑승장안내','주변관광지','FAQ'].map((t,i)=>`
      <button class="tab-item ${i===0?'active':''}" data-tab="${t}" data-tab-group="region-info">${t}</button>`).join('')}
    </div>
    <div class="p-6">
      <div data-tab-content="코스안내" data-tab-content-group="region-info">
        <h3 class="font-bold text-navy-800 mb-3">운행 코스</h3>
        <div class="bg-gray-50 rounded-xl p-4">
          <div class="flex flex-wrap gap-2 items-center text-sm">
            ${(schedules[0]?.course||'').split('→').map((s,i,a)=>`
            <span class="bg-white border border-gray-200 rounded-lg px-3 py-1.5 font-medium">${s.trim()}</span>
            ${i<a.length-1?'<i class="fas fa-arrow-right text-cyan-500"></i>':''}`).join('')}
          </div>
          <p class="text-sm text-gray-500 mt-3">총 소요시간: 약 1시간 30분 (육상 50분 + 수상 40분)</p>
        </div>
      </div>
      <div data-tab-content="요금표" data-tab-content-group="region-info" class="hidden">
        <h3 class="font-bold text-navy-800 mb-3">요금표</h3>
        <table class="admin-table">
          <tr><th>구분</th><th>요금</th><th>비고</th></tr>
          ${region.fares?.map(f=>`<tr><td>${f.label}</td><td class="font-bold text-navy-800">${Utils.money(f.price)}</td><td class="text-gray-400 text-xs">${f.type==='infant'?'좌석 미제공':f.type==='disabled'||f.type==='veteran'?'현장 증빙 필수':''}</td></tr>`).join('')}
        </table>
      </div>
      <div data-tab-content="운행시간" data-tab-content-group="region-info" class="hidden">
        <h3 class="font-bold text-navy-800 mb-3">운행 회차</h3>
        <div class="grid md:grid-cols-2 gap-3">
          ${schedules.map(s=>`
          <div class="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div><div class="font-bold text-navy-800">${s.time} ~ ${s.endTime}</div><div class="text-xs text-gray-500">온라인 ${s.online}석 / 현장 ${s.offline}석</div></div>
            <span class="${s.status==='soldout'?'badge badge-red':'badge badge-green'}">${s.status==='soldout'?'매진':'운행'}</span>
          </div>`).join('')}
        </div>
      </div>
      <div data-tab-content="탑승장안내" data-tab-content-group="region-info" class="hidden">
        <h3 class="font-bold text-navy-800 mb-3">탑승장 위치</h3>
        <div class="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-500">
          <div class="text-center"><i class="fas fa-map-marked-alt text-4xl mb-2 text-cyan-500"></i><p class="font-bold">${region.boardingPlace}</p><p class="text-sm mt-1">${region.parkingInfo}</p></div>
        </div>
        <a href="https://map.kakao.com/?q=${encodeURIComponent(region.boardingPlace)}" target="_blank" class="btn-outline w-full mt-3 text-sm text-center block py-3" style="border-radius:12px"><i class="fas fa-map mr-2"></i>카카오맵으로 길찾기</a>
      </div>
      <div data-tab-content="주변관광지" data-tab-content-group="region-info" class="hidden">
        <h3 class="font-bold text-navy-800 mb-3">주변 관광지</h3>
        <div class="grid md:grid-cols-3 gap-3 text-sm text-gray-600">
          ${regionId==='buyeo'?['국립부여박물관','부소산성','낙화암','정림사지','백제문화단지','궁남지'].map(s=>`<div class="bg-gray-50 rounded-xl p-3 flex items-center gap-2"><i class="fas fa-landmark text-cyan-500"></i>${s}</div>`).join(''):
            regionId==='tongyeong'?['통영케이블카','한산도이순신공원','통영중앙시장','남망산조각공원','달아공원','미륵산'].map(s=>`<div class="bg-gray-50 rounded-xl p-3 flex items-center gap-2"><i class="fas fa-mountain text-cyan-500"></i>${s}</div>`).join(''):
            ['해인사','팔만대장경','황매산','합천영상테마파크','황매산철쭉','합천호수공원'].map(s=>`<div class="bg-gray-50 rounded-xl p-3 flex items-center gap-2"><i class="fas fa-tree text-cyan-500"></i>${s}</div>`).join('')}
        </div>
      </div>
      <div data-tab-content="FAQ" data-tab-content-group="region-info" class="hidden">
        <h3 class="font-bold text-navy-800 mb-3">자주 묻는 질문</h3>
        <div id="region-faq-list" class="space-y-3"></div>
        <button onclick="Router.go('/faq')" class="btn-outline w-full mt-4 text-sm">전체 FAQ 보기</button>
      </div>
    </div>
  </div>
</div>
</div>

${regionId === 'buyeo' ? `
<!-- 부여 지역 콘텐츠 섹션 -->
<div class="bg-gray-50 py-14">
  <div class="max-w-6xl mx-auto px-4">
    <div class="text-center mb-10">
      <span class="inline-block bg-cyan-100 text-cyan-700 text-xs font-bold px-3 py-1 rounded-full mb-3">부여 여행 가이드</span>
      <h2 class="text-2xl font-black text-navy-800 mb-2">수륙양용투어와 함께하는 부여 여행</h2>
      <p class="text-gray-500 text-sm">백제 역사와 자연이 어우러진 부여의 숨은 보석을 만나보세요</p>
    </div>

    <!-- 4탭 콘텐츠 -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
      <div class="tab-nav p-2" style="border-radius:0">
        ${['주변관광지','맛집추천','카페·디저트','추천코스'].map((t,i)=>`
        <button class="tab-item ${i===0?'active':''}" data-tab="buyeo-${t}" data-tab-group="buyeo-content">${t}</button>`).join('')}
      </div>
      <div class="p-6">
        <!-- 주변관광지 -->
        <div data-tab-content="buyeo-주변관광지" data-tab-content-group="buyeo-content">
          <div class="grid md:grid-cols-2 gap-4">
            ${[
              {icon:'🏛️', name:'국립부여박물관', desc:'백제 유물 6만여 점 보유. 수륙양용 출발지에서 도보 15분', time:'09:00~18:00', tip:'무료입장'},
              {icon:'🏯', name:'부소산성·낙화암', desc:'백제 최후의 성과 삼천 궁녀 전설의 낙화암', time:'상시개방', tip:'도보 30분'},
              {icon:'🌿', name:'백제문화단지', desc:'백제 왕궁을 재현한 대규모 역사테마파크', time:'09:00~18:00', tip:'유료입장'},
              {icon:'🌸', name:'궁남지', desc:'우리나라 최초의 인공연못. 7월 연꽃축제', time:'상시개방', tip:'무료'},
              {icon:'⛩️', name:'정림사지 5층석탑', desc:'백제 시대 석탑. 국보 제9호', time:'상시', tip:'무료'},
              {icon:'🌊', name:'백마강 황포돛배', desc:'수륙양용 코스와 연계되는 전통 황포돛배 체험', time:'10:00~17:00', tip:'유료'},
            ].map(p=>`
            <div class="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <div class="text-2xl flex-shrink-0">${p.icon}</div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-navy-800 text-sm">${p.name}</div>
                <div class="text-xs text-gray-500 mt-0.5">${p.desc}</div>
                <div class="flex gap-2 mt-1.5">
                  <span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">${p.time}</span>
                  <span class="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">${p.tip}</span>
                </div>
              </div>
            </div>`).join('')}
          </div>
        </div>
        <!-- 맛집추천 -->
        <div data-tab-content="buyeo-맛집추천" data-tab-content-group="buyeo-content" class="hidden">
          <div class="grid md:grid-cols-2 gap-4">
            ${[
              {icon:'🍖', name:'연잎밥 정식', place:'부여읍 구드래 일원', desc:'백제시대 전통 연잎밥. 부여 대표 향토음식', price:'12,000~15,000원', tip:'점심만 운영'},
              {icon:'🐟', name:'백마강 민물매운탕', place:'백마강 선착장 인근', desc:'이어, 쏘가리 등 백마강 민물고기 매운탕', price:'20,000~35,000원', tip:'현지 강추'},
              {icon:'🥩', name:'부여 한우 갈비', place:'부여시내 한우거리', desc:'충남 청양산 한우 갈비. 1인분부터 가능', price:'30,000~50,000원', tip:'예약 권장'},
              {icon:'🍜', name:'칼국수 & 손두부', place:'정림사지 인근', desc:'손으로 만든 쫄깃한 칼국수와 순두부찌개', price:'8,000~10,000원', tip:'웨이팅 있음'},
            ].map(p=>`
            <div class="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <div class="text-2xl flex-shrink-0">${p.icon}</div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-navy-800 text-sm">${p.name}</div>
                <div class="text-xs text-cyan-600 mb-0.5">${p.place}</div>
                <div class="text-xs text-gray-500">${p.desc}</div>
                <div class="flex gap-2 mt-1.5">
                  <span class="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">${p.price}</span>
                  <span class="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">${p.tip}</span>
                </div>
              </div>
            </div>`).join('')}
          </div>
        </div>
        <!-- 카페·디저트 -->
        <div data-tab-content="buyeo-카페·디저트" data-tab-content-group="buyeo-content" class="hidden">
          <div class="grid md:grid-cols-2 gap-4">
            ${[
              {icon:'☕', name:'백마강 뷰 카페', place:'백마강 선착장 인근', desc:'수륙양용버스가 보이는 테라스 카페. 아메리카노 추천', price:'5,000~8,000원', tip:'포토스팟'},
              {icon:'🍰', name:'백제 빵집', place:'부여읍 중심가', desc:'연꽃 모양 케이크와 백제 캐릭터 쿠키', price:'3,000~15,000원', tip:'선물용 인기'},
              {icon:'🧋', name:'연꽃 라떼 전문점', place:'궁남지 인근', desc:'부여 특산 연꽃 추출물로 만든 시그니처 라떼', price:'6,000~8,000원', tip:'SNS 필수템'},
              {icon:'🍦', name:'황포돛배 아이스크림', place:'구드래나루터', desc:'부여 쌀로 만든 수제 아이스크림', price:'3,000~5,000원', tip:'여름 필수'},
            ].map(p=>`
            <div class="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <div class="text-2xl flex-shrink-0">${p.icon}</div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-navy-800 text-sm">${p.name}</div>
                <div class="text-xs text-cyan-600 mb-0.5">${p.place}</div>
                <div class="text-xs text-gray-500">${p.desc}</div>
                <div class="flex gap-2 mt-1.5">
                  <span class="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">${p.price}</span>
                  <span class="text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded">${p.tip}</span>
                </div>
              </div>
            </div>`).join('')}
          </div>
        </div>
        <!-- 추천코스 -->
        <div data-tab-content="buyeo-추천코스" data-tab-content-group="buyeo-content" class="hidden">
          <div class="space-y-4">
            ${[
              {tag:'당일치기', title:'수륙양용 + 백제역사 코스', items:['09:30 수륙양용버스 탑승','11:00 국립부여박물관 관람','12:30 연잎밥 정식 점심','14:00 부소산성·낙화암 산책','16:00 궁남지 산책 후 귀가']},
              {tag:'1박2일', title:'부여 완전정복 코스', items:['1일: 수륙양용 + 백제문화단지 + 한우 저녁','2일: 정림사지 + 부여장터 + 연꽃라떼 + 귀가']},
              {tag:'가족여행', title:'어린이 역사 체험 코스', items:['수륙양용버스 탑승 (어린이 최고 인기)','백제문화단지 어린이 체험관','궁남지 자연학습 + 연꽃 관찰','부여 캐릭터 쿠키 만들기']},
            ].map(c=>`
            <div class="border border-gray-200 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded">${c.tag}</span>
                <span class="font-bold text-navy-800 text-sm">${c.title}</span>
              </div>
              <div class="space-y-1.5">
                ${c.items.map((item,i)=>`
                <div class="flex gap-2 text-sm text-gray-600">
                  <span class="text-cyan-500 font-bold flex-shrink-0">${i+1}.</span>
                  <span>${item}</span>
                </div>`).join('')}
              </div>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>` : ''}

${Footer.render()}
<button onclick="CustomerPages.goPayment('${regionId}')" class="sticky-book-btn md:hidden"><i class="fas fa-ticket-alt"></i> 결제하기 (<span id="mob-total">₩0</span>)</button>`;
  },

  // ── 예약 전 공통 상태 ───────────────────────────────────────
  _state: { date: '', scheduleId: '', fares: {}, source: '', regionId: '' },

  initRegionPage: (region, schedules) => {
    CustomerPages._state.regionId = region.id;
    CustomerPages._state.fares = {};
    region.fares?.forEach(f => { CustomerPages._state.fares[f.id] = { count: 0, price: f.price, label: f.label }; });
    CustomerPages.renderCalendar(new Date());

    // FAQ 로드
    API.get(`/api/faq?region=${region.id}`).then(res => {
      const el = document.getElementById('region-faq-list');
      if (!el || !res.data) return;
      const faqs = res.data.regional?.slice(0,5) || [];
      el.innerHTML = faqs.map(f => `
        <div class="border border-gray-200 rounded-xl overflow-hidden">
          <button class="w-full text-left p-4 font-medium text-navy-800 text-sm flex justify-between items-center hover:bg-gray-50" onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('i').classList.toggle('fa-chevron-down');this.querySelector('i').classList.toggle('fa-chevron-up')">
            Q. ${f.q} <i class="fas fa-chevron-down text-gray-400 flex-shrink-0"></i>
          </button>
          <div class="hidden p-4 pt-0 text-sm text-gray-600 leading-relaxed">A. ${f.a}</div>
        </div>`).join('');
    });
  },

  _calCurrentDate: new Date(),
  prevMonth: () => { CustomerPages._calCurrentDate.setMonth(CustomerPages._calCurrentDate.getMonth()-1); CustomerPages.renderCalendar(CustomerPages._calCurrentDate); },
  nextMonth: () => { CustomerPages._calCurrentDate.setMonth(CustomerPages._calCurrentDate.getMonth()+1); CustomerPages.renderCalendar(CustomerPages._calCurrentDate); },

  renderCalendar: (date) => {
    const el = document.getElementById('cal-grid');
    const mEl = document.getElementById('cal-month');
    if (!el || !mEl) return;
    const year = date.getFullYear(), month = date.getMonth();
    mEl.textContent = `${year}년 ${month+1}월`;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);
    let html = '';
    for (let i=0;i<firstDay;i++) html += '<div></div>';
    for (let d=1;d<=daysInMonth;d++) {
      const dt = new Date(year, month, d);
      const isPast = dt < today;
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isSelected = CustomerPages._state.date === dateStr;
      const isTod = dt.toDateString() === today.toDateString();
      html += `<div class="cal-day ${isPast?'unavailable':''} ${isTod?'today':''} ${isSelected?'selected':''}"
        onclick="${isPast?'':`CustomerPages.selectDate('${dateStr}', this)`}">
        <div class="relative flex flex-col items-center justify-center w-full h-full">${d}</div>
      </div>`;
    }
    el.innerHTML = html;
  },

  selectDate: (dateStr, el) => {
    document.querySelectorAll('.cal-day.selected').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    CustomerPages._state.date = dateStr;
    const sumDate = document.getElementById('sum-date');
    if (sumDate) sumDate.textContent = Utils.dateKo(dateStr);
    CustomerPages.updateSummary();
  },

  selectSchedule: (id, el) => {
    if (el.classList.contains('soldout')) return;
    document.querySelectorAll('.schedule-card.selected').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    CustomerPages._state.scheduleId = id;
    const timeEl = el.querySelector('.schedule-card-time');
    const sumTime = document.getElementById('sum-time');
    if (sumTime && timeEl) sumTime.textContent = timeEl.textContent + ' 회차';
    CustomerPages.updateSummary();
  },

  changeFare: (fareId, delta) => {
    const f = CustomerPages._state.fares[fareId];
    if (!f) return;
    f.count = Math.max(0, (f.count||0) + delta);
    const el = document.getElementById(`cnt-${fareId}`);
    if (el) el.textContent = f.count;
    const minusBtn = document.querySelector(`#fare-${fareId} .counter-btn`);
    if (minusBtn) minusBtn.disabled = f.count <= 0;
    CustomerPages.updateSummary();
    CustomerPages.renderPassengersForm();
  },

  // 탑승자 전원 입력 폼 동적 생성
  renderPassengersForm: () => {
    const container = document.getElementById('passengers-container');
    if (!container) return;
    const fares = CustomerPages._state.fares;
    let pax = 0;
    // 탑승자 목록 구성 (fareId + label 기준)
    const paxList = [];
    Object.values(fares).forEach(f => {
      for (let i = 0; i < (f.count||0); i++) {
        paxList.push({ label: f.label, fareId: f.id || '' });
      }
    });
    pax = paxList.length;

    if (pax === 0) {
      container.innerHTML = '<p class="text-sm text-gray-400 text-center py-4"><i class="fas fa-arrow-up mr-1"></i>위에서 탑승 인원을 먼저 선택해주세요</p>';
      return;
    }

    // 기존 입력값 보존
    const saved = {};
    container.querySelectorAll('.passenger-card').forEach((card, idx) => {
      saved[idx] = {
        name: card.querySelector('.pax-name')?.value || '',
        birth: card.querySelector('.pax-birth')?.value || '',
        gender: card.querySelector('.pax-gender')?.value || '',
        nationality: card.querySelector('.pax-nationality')?.value || 'KR',
      };
    });

    const html = paxList.map((p, idx) => {
      const isFirst = idx === 0;
      const sv = saved[idx] || {};
      return `
        <div class="passenger-card border border-gray-100 rounded-xl p-4 mb-3 bg-gray-50">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-5 h-5 bg-cyan-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">${idx+1}</span>
            <span class="text-sm font-medium text-gray-700">${isFirst ? '예약자 (대표 탑승자)' : `탑승자 ${idx+1}`}</span>
            <span class="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border">${p.label}</span>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div class="col-span-2 md:col-span-1">
              <label class="block text-xs text-gray-500 mb-0.5">성명 <span class="text-red-400">*</span></label>
              <input type="text" class="pax-name w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400 outline-none bg-white"
                placeholder="${isFirst?'예약자 실명':'탑승자 실명'}" value="${sv.name||''}">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-0.5">생년월일 <span class="text-red-400">*</span></label>
              <input type="date" class="pax-birth w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400 outline-none bg-white"
                value="${sv.birth||''}">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-0.5">성별 <span class="text-red-400">*</span></label>
              <select class="pax-gender w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400 outline-none bg-white">
                <option value="">선택</option>
                <option value="M" ${sv.gender==='M'?'selected':''}>남</option>
                <option value="F" ${sv.gender==='F'?'selected':''}>여</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-0.5">국적</label>
              <select class="pax-nationality w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400 outline-none bg-white">
                <option value="KR" ${(sv.nationality||'KR')==='KR'?'selected':''}>대한민국</option>
                <option value="CN" ${sv.nationality==='CN'?'selected':''}>중국</option>
                <option value="JP" ${sv.nationality==='JP'?'selected':''}>일본</option>
                <option value="US" ${sv.nationality==='US'?'selected':''}>미국</option>
                <option value="OTHER" ${sv.nationality==='OTHER'?'selected':''}>기타</option>
              </select>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <i class="fas fa-users text-cyan-500"></i> 총 <strong class="text-cyan-600">${pax}명</strong>의 탑승자 정보를 입력해주세요
      </div>
      ${html}
    `;
  },

  updateSummary: () => {
    const fares = CustomerPages._state.fares;
    let total = 0, pax = 0;
    Object.values(fares).forEach(f => { total += (f.count||0)*f.price; pax += (f.count||0); });
    const sumTotal = document.getElementById('sum-total');
    const sumPax = document.getElementById('sum-pax');
    const mobTotal = document.getElementById('mob-total');
    if (sumTotal) sumTotal.textContent = '₩' + Utils.num(total);
    if (sumPax) sumPax.textContent = pax + '명';
    if (mobTotal) mobTotal.textContent = '₩' + Utils.num(total);
  },

  selectSource: (src, btn) => {
    document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('border-cyan-400','bg-cyan-50'));
    btn.classList.add('border-cyan-400','bg-cyan-50');
    CustomerPages._state.source = src;
  },

  checkAll: () => {
    ['agree1','agree2','agree3','agree4','agree5'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = true;
    });
    Utils.toast('전체 동의 처리되었습니다', 'success');
  },

  termsModal: () => {
    const terms = Settings.get('terms');
    return `
      <div class="modal-header"><h3 class="font-bold">약관 및 규정</h3><button onclick="Utils.closeModal()" class="text-gray-400">&times;</button></div>
      <div class="modal-body space-y-4">
        <div><h4 class="font-bold text-navy-800 mb-2">환불 규정</h4><pre class="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-xl">${terms.refundPolicy}</pre></div>
        <div><h4 class="font-bold text-navy-800 mb-2">안전 수칙</h4><pre class="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-xl">${terms.safetyRules}</pre></div>
        <div><h4 class="font-bold text-navy-800 mb-2">개인정보 수집·이용 동의</h4><pre class="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-xl">${terms.privacyPolicy}</pre></div>
      </div>`;
  },

  goPayment: (regionId) => {
    const s = CustomerPages._state;
    const fares = s.fares;
    let total = 0, pax = 0;
    const paxList = [];
    Object.entries(fares).forEach(([id,f]) => {
      if (f.count > 0) { total += f.count*f.price; pax += f.count; paxList.push(`${f.label} ${f.count}명`); }
    });
    if (!s.date) { Utils.toast('날짜를 선택해주세요', 'warning'); return; }
    if (!s.scheduleId) { Utils.toast('회차를 선택해주세요', 'warning'); return; }
    if (pax === 0) { Utils.toast('탑승 인원을 선택해주세요', 'warning'); return; }
    const name = document.getElementById('inp-name')?.value;
    const phone = document.getElementById('inp-phone')?.value;
    if (!name) { Utils.toast('예약자명을 입력해주세요', 'warning'); return; }
    if (!phone) { Utils.toast('휴대폰번호를 입력해주세요', 'warning'); return; }
    const requiredAgrees = ['agree1','agree2','agree3','agree4'];
    for (const id of requiredAgrees) {
      if (!document.getElementById(id)?.checked) { Utils.toast('필수 동의 항목을 확인해주세요', 'warning'); return; }
    }
    Store.set('cart', { regionId, date: s.date, scheduleId: s.scheduleId, paxList, pax, total, name, phone, email: document.getElementById('inp-email')?.value, source: s.source });
    Router.go('/payment');
  },

  // ── 예약 확인/취소 ──────────────────────────────────────────
  bookingCheck: async () => {
    setTimeout(() => Navbar.init(), 100);
    return `
${Navbar.render()}
<div style="padding-top:64px" class="min-h-screen bg-gray-50">
  <div class="max-w-xl mx-auto px-4 py-12">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-black text-navy-800 mb-2">예약 확인 / 취소</h1>
      <p class="text-gray-500">예약번호로 탑승권을 확인하거나 예약을 취소하세요</p>
    </div>
    <div class="bg-white rounded-2xl p-6 shadow-sm mb-4">
      <div class="form-group">
        <label class="form-label">예약번호</label>
        <input type="text" class="form-input" id="chk-resId" placeholder="RES-2025-000000">
      </div>
      <div class="form-group">
        <label class="form-label">예약자 휴대폰번호</label>
        <input type="tel" class="form-input" id="chk-phone" placeholder="010-0000-0000">
      </div>
      <button onclick="CustomerPages.checkBooking()" class="btn-primary btn-xl">조회하기</button>
    </div>
    <div id="booking-result"></div>
  </div>
</div>
${Footer.render()}`;
  },

  checkBooking: async () => {
    const resId = document.getElementById('chk-resId')?.value?.trim();
    const phone = document.getElementById('chk-phone')?.value?.trim();
    if (!resId || !phone) { Utils.toast('예약번호와 휴대폰번호를 모두 입력해주세요', 'warning'); return; }
    const res = await API.get('/api/reservations');
    const found = res.data?.find(r => r.id === resId);
    const el = document.getElementById('booking-result');
    if (!found) { el.innerHTML = `<div class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600"><i class="fas fa-times-circle text-3xl mb-2"></i><p>예약 정보를 찾을 수 없습니다</p></div>`; return; }
    el.innerHTML = `
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <span class="font-black text-navy-800">${found.id}</span>
          <span class="badge badge-green">예약 확정</span>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">지역</span><span class="font-medium">${found.regionName}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">탑승일자</span><span class="font-medium">${Utils.dateKo(found.date)}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">탑승시간</span><span class="font-medium">${found.time}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">예약자</span><span class="font-medium">${Utils.maskName(found.name)}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">결제금액</span><span class="font-bold text-navy-800">${Utils.money(found.total)}</span></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button onclick="Router.go('/ticket/${found.id}')" class="btn-ocean flex-1 text-sm py-3"><i class="fas fa-qrcode mr-2"></i>QR 탑승권 보기</button>
          <button onclick="Utils.confirm('예약을 취소하시겠습니까?\\n당일 취소는 환불이 불가합니다.', ()=>Utils.toast('취소 요청이 접수되었습니다','success'))" class="btn-danger text-sm px-4">취소</button>
        </div>
      </div>`;
  },

  // ── 문의 페이지 ─────────────────────────────────────────────
  inquiry: async () => {
    setTimeout(() => Navbar.init(), 100);
    return `
${Navbar.render()}
<div style="padding-top:64px" class="min-h-screen bg-gray-50">
  <div class="max-w-2xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-black text-navy-800 mb-2">고객 문의</h1>
    <p class="text-gray-500 mb-8">예약·결제·환불·단체예약 등 무엇이든 문의해주세요</p>
    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <div class="grid md:grid-cols-2 gap-4">
        <div class="form-group">
          <label class="form-label required">문의 유형</label>
          <select class="form-select" id="inq-type">
            ${['예약문의','결제문의','환불문의','단체예약문의','운휴문의','분실물문의','손목밴드분실문의','불만/민원','제휴문의'].map(t=>`<option>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">관련 지역</label>
          <select class="form-select" id="inq-region">
            <option value="all">공통</option>
            <option value="tongyeong">통영</option>
            <option value="buyeo">부여</option>
            <option value="hapcheon">합천</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">성함</label>
          <input type="text" class="form-input" id="inq-name" placeholder="이름">
        </div>
        <div class="form-group">
          <label class="form-label required">연락처</label>
          <input type="tel" class="form-input" id="inq-phone" placeholder="010-0000-0000">
        </div>
        <div class="form-group md:col-span-2">
          <label class="form-label required">제목</label>
          <input type="text" class="form-input" id="inq-subject" placeholder="문의 제목을 입력하세요">
        </div>
        <div class="form-group md:col-span-2">
          <label class="form-label required">내용</label>
          <textarea class="form-input" id="inq-content" rows="5" placeholder="문의 내용을 자세히 입력해주세요"></textarea>
        </div>
      </div>
      <button onclick="CustomerPages.submitInquiry()" class="btn-primary btn-xl mt-4">문의 접수하기</button>
    </div>
  </div>
</div>
${Footer.render()}`;
  },

  submitInquiry: async () => {
    const data = {
      type: document.getElementById('inq-type')?.value,
      region: document.getElementById('inq-region')?.value,
      name: document.getElementById('inq-name')?.value,
      phone: document.getElementById('inq-phone')?.value,
      subject: document.getElementById('inq-subject')?.value,
      content: document.getElementById('inq-content')?.value,
    };
    if (!data.name || !data.phone || !data.subject || !data.content) { Utils.toast('모든 필수 항목을 입력해주세요', 'warning'); return; }
    Utils.loading(true);
    const res = await API.post('/api/inquiries', data);
    Utils.loading(false);
    if (res.success) {
      Utils.toast('문의가 접수되었습니다. 빠르게 답변 드리겠습니다 😊', 'success', 4000);
      ['inq-name','inq-phone','inq-subject','inq-content'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    }
  },

  // ── 공지사항 페이지 ─────────────────────────────────────────
  notice: async () => {
    const res = await API.get('/api/notices');
    const notices = res.data || [];
    setTimeout(() => Navbar.init(), 100);
    return `
${Navbar.render()}
<div style="padding-top:64px" class="min-h-screen bg-gray-50">
  <div class="max-w-4xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-black text-navy-800 mb-8">공지사항</h1>
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      ${notices.length ? notices.map(n => `
      <div class="flex items-center gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            ${n.important?'<span class="badge badge-red">중요</span>':''}
            ${n.pinned?'<span class="badge badge-blue">📌 상단고정</span>':''}
            <span class="badge badge-gray">${n.type}</span>
          </div>
          <div class="font-medium text-navy-800">${n.title}</div>
        </div>
        <div class="text-xs text-gray-400">${n.date}</div>
      </div>`).join('') : Utils.empty('공지사항이 없습니다')}
    </div>
  </div>
</div>
${Footer.render()}`;
  },

  // ── 404 ────────────────────────────────────────────────────
  _404: () => `
${Navbar.render()}
<div style="padding-top:64px" class="min-h-screen flex items-center justify-center">
  <div class="text-center p-8">
    <div class="text-8xl mb-6">🌊</div>
    <h1 class="text-4xl font-black text-navy-800 mb-4">페이지를 찾을 수 없습니다</h1>
    <p class="text-gray-500 mb-8">요청하신 페이지가 존재하지 않거나 이동되었습니다</p>
    <button onclick="Router.go('/')" class="btn-ocean px-8 py-3">홈으로 돌아가기</button>
  </div>
</div>`,

  _preparingPage: (region) => `
${Navbar.render('reservation')}
<div style="padding-top:64px" class="min-h-screen bg-gray-50">
  <!-- 히어로 -->
  <div class="relative h-56 overflow-hidden">
    <img src="${region.heroImage||region.image}" alt="${region.name}" class="w-full h-full object-cover opacity-60">
    <div class="absolute inset-0 bg-gradient-to-r from-navy-900/80 to-ocean-700/60"></div>
    <div class="absolute inset-0 flex items-center justify-center text-center text-white">
      <div>
        <span class="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full mb-3">🔧 준비중</span>
        <h1 class="text-3xl font-black mb-1">${region.name}</h1>
        <p class="text-white/70">${region.tagline}</p>
      </div>
    </div>
  </div>

  <div class="max-w-3xl mx-auto px-4 py-10">
    <!-- 오픈 예정 안내 -->
    <div class="bg-white rounded-2xl p-8 shadow-sm text-center mb-6">
      <div class="text-5xl mb-4">🚧</div>
      <h2 class="text-xl font-black text-navy-800 mb-2">${region.name} 오픈 준비 중</h2>
      <p class="text-gray-500 text-sm leading-relaxed mb-6">
        현재 PG 결제 계약 및 운영 법인 등록 절차가 진행 중입니다.<br>
        오픈 즉시 온라인 예약 서비스를 제공해 드립니다.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button onclick="Utils.toast('오픈 시 알림을 보내드립니다 📢 (기능 준비 중)','info')"
          class="btn-ocean px-6 py-2.5">
          🔔 오픈 알림 신청하기
        </button>
        <button onclick="Router.go('/inquiry')"
          class="border-2 border-navy-800 text-navy-800 font-bold px-6 py-2.5 rounded-xl hover:bg-navy-800 hover:text-white transition-all">
          📞 단체예약 문의하기
        </button>
      </div>
    </div>

    <!-- 코스/요금 미리보기 -->
    ${region.fares?.length ? `
    <div class="bg-white rounded-2xl p-6 shadow-sm mb-6">
      <h3 class="font-bold text-navy-800 mb-4">💰 예상 요금 안내 <span class="text-xs text-gray-400 font-normal">(오픈 후 예약 적용)</span></h3>
      <div class="space-y-2">
        ${(region.fares||[]).map(f => `
        <div class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
          <span class="text-gray-700 text-sm">${f.label}</span>
          <span class="font-bold text-navy-800">${Utils.money(f.price)}</span>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- 다른 지역 예약 -->
    <div class="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-5 text-center">
      <p class="text-gray-600 text-sm mb-3">지금 예약 가능한 지역도 둘러보세요</p>
      <button onclick="Router.go('/reservation')" class="btn-ocean px-6 py-2">
        다른 지역 예약하기 →
      </button>
    </div>
  </div>
</div>
${Footer.render()}`,
};

window.CustomerPages = CustomerPages;
