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
    setTimeout(() => {
      Navbar.init();
      PopupManager.show('all');
      _loadGuides('all');
    }, 100);
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
        <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20 whitespace-nowrap max-w-full overflow-hidden">
          <span class="w-2 h-2 bg-green-400 rounded-full pulse-anim flex-shrink-0"></span>
          <span class="truncate">
            ${(() => {
              const shorten = n => n.replace('수륙양용투어','').replace('해양관광','').replace('수륙양용','').trim() || n;
              const open = regions.filter(r=>r.status==='open').map(r=>shorten(r.name));
              const prep = regions.filter(r=>r.status==='preparing').map(r=>shorten(r.name));
              return open.join(' · ') + ' 예약가능' + (prep.length ? ' · ' + prep.join('/') + ' 준비중' : '');
            })()}
          </span>
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
          <div><span class="text-white font-bold text-xl">${regions.length}</span>개 지역 운행</div>
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

<!-- 브랜드 스토리 섹션 (CI 기반) -->
<section class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-4">
    <!-- 섹션 헤더 -->
    <div class="text-center mb-16">
      <span class="inline-block bg-cyan-50 text-cyan-600 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider">BRAND STORY</span>
      <h2 class="text-3xl md:text-4xl font-black text-navy-900 mb-4">물과 육지를 잇는 새로운 이동의 시작</h2>
      <p class="text-gray-500 max-w-2xl mx-auto text-base leading-relaxed">
        아쿠아모빌리티코리아는 물과 육지를 연결하는 미래형 수륙양용 모빌리티 브랜드로,<br>
        <strong class="text-navy-800">안전 · 혁신 · 친환경</strong> 가치를 담은 통합 이동 플랫폼입니다.
      </p>
    </div>

    <!-- 로고 + CI 전달 메시지 -->
    <div class="flex flex-col md:flex-row items-center gap-10 mb-20 bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-8 md:p-12">
      <div class="flex-shrink-0 text-center">
        <img src="/static/logo_symbol.png" alt="Aqua Drive Shield 로고" class="w-56 md:w-72 mx-auto drop-shadow-xl">
        <div class="mt-3 text-xs text-gray-400 font-medium tracking-wider">Innovative Logo Concept<br><span class="text-navy-700 font-bold text-sm">Aqua Drive Shield</span></div>
      </div>
      <div class="flex-1">
        <div class="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-4">CI가 전달하는 메시지</div>
        <p class="text-gray-600 text-base leading-relaxed mb-5">
          이 CI는 단순한 관광 로고가 아니라,<br>
          <strong class="text-navy-900 text-lg">"수상과 육상을 연결하는 안전하고 혁신적인 미래형 모빌리티 기업"</strong><br>
          이라는 메시지를 담고 있습니다.
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
            <span class="text-xl">🛡️</span><span class="text-sm font-bold text-navy-800">안전하게</span>
          </div>
          <div class="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
            <span class="text-xl">💡</span><span class="text-sm font-bold text-navy-800">혁신적으로</span>
          </div>
          <div class="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
            <span class="text-xl">🌊</span><span class="text-sm font-bold text-navy-800">물과 육지를 하나로 연결</span>
          </div>
          <div class="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
            <span class="text-xl">🇰🇷</span><span class="text-sm font-bold text-navy-800">대한민국 대표 수륙양용 브랜드</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 브랜드명 의미 -->
    <div class="grid md:grid-cols-3 gap-6 mb-16">
      <div class="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
        <div class="bg-gradient-to-br from-cyan-400 to-blue-500 p-6 text-white text-center">
          <div class="text-4xl mb-2">🌊</div>
          <div class="text-2xl font-black tracking-wide">Aqua</div>
        </div>
        <div class="bg-white p-5">
          <p class="text-gray-600 text-sm leading-relaxed">물, 수상, 해양을 의미합니다. 바다와 강을 자유롭게 누비는 수상 이동의 정수를 담았습니다.</p>
        </div>
      </div>
      <div class="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
        <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white text-center">
          <div class="text-4xl mb-2">🚌</div>
          <div class="text-2xl font-black tracking-wide">Mobility</div>
        </div>
        <div class="bg-white p-5">
          <p class="text-gray-600 text-sm leading-relaxed">이동, 운송, 모빌리티 기술을 의미합니다. 첨단 기술로 만들어가는 미래형 교통수단입니다.</p>
        </div>
      </div>
      <div class="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
        <div class="bg-gradient-to-br from-indigo-500 to-blue-900 p-6 text-white text-center">
          <div class="text-4xl mb-2">🇰🇷</div>
          <div class="text-2xl font-black tracking-wide">Korea</div>
        </div>
        <div class="bg-white p-5">
          <p class="text-gray-600 text-sm leading-relaxed">대한민국을 대표하는 기업이라는 정체성입니다. K-관광의 새로운 기준을 제시합니다.</p>
        </div>
      </div>
    </div>

    <!-- 로고 심볼 의미 (상세) -->
    <div class="mb-16">
      <h3 class="text-2xl font-black text-navy-900 text-center mb-2">심볼 로고가 담은 4가지 의미</h3>
      <p class="text-gray-400 text-center text-sm mb-10">각 요소가 전달하는 브랜드 가치</p>
      <div class="grid md:grid-cols-2 gap-6">
        <!-- 방패 -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🛡️</div>
            <div>
              <div class="font-black text-navy-800">방패 (Shield)</div>
              <div class="text-xs text-blue-500 font-medium">안전성 · 신뢰성 · 보호</div>
            </div>
          </div>
          <ul class="space-y-1.5">
            <li class="flex items-start gap-2 text-sm text-gray-600"><span class="text-blue-400 mt-0.5">•</span>안전성, 신뢰성, 보호를 상징</li>
            <li class="flex items-start gap-2 text-sm text-gray-600"><span class="text-blue-400 mt-0.5">•</span>승객의 안전한 이동과 기업의 책임감을 표현</li>
            <li class="flex items-start gap-2 text-sm text-gray-600"><span class="text-blue-400 mt-0.5">•</span>수륙양용 운송수단이 갖춰야 할 <strong>안전한 기술력</strong>을 강조</li>
          </ul>
        </div>
        <!-- 파도 -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-cyan-100 text-cyan-700 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🌊</div>
            <div>
              <div class="font-black text-navy-800">파도 (Wave)</div>
              <div class="text-xs text-cyan-500 font-medium">물길 · 해양 · 역동성</div>
            </div>
          </div>
          <ul class="space-y-1.5">
            <li class="flex items-start gap-2 text-sm text-gray-600"><span class="text-cyan-400 mt-0.5">•</span>물길, 해양, 역동성, 자유로운 이동을 상징</li>
            <li class="flex items-start gap-2 text-sm text-gray-600"><span class="text-cyan-400 mt-0.5">•</span>수상 이동 기술과 친환경적 이미지를 표현</li>
            <li class="flex items-start gap-2 text-sm text-gray-600"><span class="text-cyan-400 mt-0.5">•</span>"아쿠아"의 정체성을 가장 직관적으로 보여주는 요소</li>
          </ul>
        </div>
        <!-- 도로 -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🛣️</div>
            <div>
              <div class="font-black text-navy-800">도로 (Road)</div>
              <div class="text-xs text-green-500 font-medium">육상 운행 · 연결성 · 확장성</div>
            </div>
          </div>
          <ul class="space-y-1.5">
            <li class="flex items-start gap-2 text-sm text-gray-600"><span class="text-green-400 mt-0.5">•</span>육상 운행, 연결성, 확장성을 의미</li>
            <li class="flex items-start gap-2 text-sm text-gray-600"><span class="text-green-400 mt-0.5">•</span>수상과 육상을 하나로 연결하는 사업 구조를 표현</li>
            <li class="flex items-start gap-2 text-sm text-gray-600"><span class="text-green-400 mt-0.5">•</span>관광, 교통, 레저를 잇는 <strong>통합 이동 플랫폼</strong>의 의미 포함</li>
          </ul>
        </div>
        <!-- 차량 -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🚌</div>
            <div>
              <div class="font-black text-navy-800">차량/모빌리티 형상</div>
              <div class="text-xs text-purple-500 font-medium">혁신성 · 미래형 운송</div>
            </div>
          </div>
          <ul class="space-y-1.5">
            <li class="flex items-start gap-2 text-sm text-gray-600"><span class="text-purple-400 mt-0.5">•</span>수륙양용 차량, 미래형 운송수단, 혁신성을 상징</li>
            <li class="flex items-start gap-2 text-sm text-gray-600"><span class="text-purple-400 mt-0.5">•</span>단순 관광이 아니라 <strong>기술 기반의 이동 산업</strong>임을 보여줌</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 색상 의미 -->
    <div class="grid md:grid-cols-3 gap-6 mb-16">
      <div class="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="w-12 h-12 rounded-xl flex-shrink-0" style="background:#0f2a5e"></div>
        <div>
          <div class="text-xs text-gray-400 mb-0.5">딥 네이비</div>
          <div class="font-bold text-navy-800 text-sm mb-1">신뢰 · 전문성 · 안정성</div>
          <p class="text-gray-500 text-xs leading-relaxed">공공사업·관광사업·모빌리티 사업에 적합한 기업 이미지를 전달합니다.</p>
        </div>
      </div>
      <div class="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="w-12 h-12 rounded-xl flex-shrink-0" style="background:#06b6d4"></div>
        <div>
          <div class="text-xs text-gray-400 mb-0.5">블루/시안</div>
          <div class="font-bold text-navy-800 text-sm mb-1">물 · 첨단기술 · 미래성</div>
          <p class="text-gray-500 text-xs leading-relaxed">수상 관광과 스마트 모빌리티의 청량하고 미래적인 느낌을 표현합니다.</p>
        </div>
      </div>
      <div class="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="w-12 h-12 rounded-xl flex-shrink-0" style="background:#22c55e"></div>
        <div>
          <div class="text-xs text-gray-400 mb-0.5">그린</div>
          <div class="font-bold text-navy-800 text-sm mb-1">친환경 · 지속가능성</div>
          <p class="text-gray-500 text-xs leading-relaxed">관광과 자연환경을 연결하는 브랜드 철학을 담고 있습니다.</p>
        </div>
      </div>
    </div>

    <!-- 브랜드 메시지 -->
    <div class="text-center bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl p-10 text-white">
      <div class="text-4xl mb-4">🌊</div>
      <blockquote class="text-2xl md:text-3xl font-black leading-relaxed mb-4">
        "안전하게, 혁신적으로,<br>물과 길을 하나로"
      </blockquote>
      <p class="text-white/70 text-sm">대한민국 수륙양용 모빌리티의 새로운 기준, 아쿠아모빌리티코리아</p>
    </div>
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

<!-- 여행 가이드 (API 연동) -->
<section class="max-w-6xl mx-auto px-4 py-16" id="travel-guide-section">
  <div class="flex items-center justify-between mb-2">
    <h2 class="text-2xl font-black text-navy-800">수륙양용버스 여행 가이드</h2>
  </div>
  <!-- 탭 필터 -->
  <div class="flex gap-2 mb-6 flex-wrap">
    <button onclick="CustomerModule.filterGuides('all')" id="guide-tab-all"
      class="guide-tab-btn px-4 py-1.5 rounded-full text-sm font-bold bg-navy-800 text-white border border-navy-800">전체</button>
    <button onclick="CustomerModule.filterGuides('daytrip')" id="guide-tab-daytrip"
      class="guide-tab-btn px-4 py-1.5 rounded-full text-sm font-bold bg-white text-gray-600 border border-gray-200 hover:border-navy-400">🌅 당일치기</button>
    <button onclick="CustomerModule.filterGuides('overnight')" id="guide-tab-overnight"
      class="guide-tab-btn px-4 py-1.5 rounded-full text-sm font-bold bg-white text-gray-600 border border-gray-200 hover:border-navy-400">🌙 1박2일</button>
  </div>
  <div id="guide-grid" class="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
    <div class="col-span-4 text-center py-10 text-gray-400">
      <div class="animate-spin text-3xl mb-2">⏳</div>로딩 중...
    </div>
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
    if (region.status === 'hidden') return CustomerPages._404();
    if (region.status === 'preparing') return CustomerPages._preparingPage(region);

    // API로부터 스케줄 로드 (DB 직접 조회)
    const apiSchedules = schRes.data || [];
    let rawSchedules = [...apiSchedules];

    // ★ 오늘 날짜 기준 운영/예약가능 상태 필터링
    // status: 'active'(관리자 저장값) 또는 'available'(API 기본값) 모두 허용
    const today = new Date().toISOString().slice(0,10);
    rawSchedules = rawSchedules.filter(s => {
      const st = s.status || 'active';
      if (st !== 'active' && st !== 'available') return false;
      if (s.startDate && s.startDate > today) return false;
      if (s.endDate && s.endDate < today) return false;
      return true;
    });
    console.log(`[AMK DEBUG] regionPage schedules 로드: region=${regionId}, API=${apiSchedules.length}개, 병합후=${rawSchedules.length}개, 시간=[${rawSchedules.map(s=>s.time).join(',')}]`);

    // ★ 스케줄 객체를 고객화면 형식으로 변환
    const schedules = rawSchedules.map((s, i) => {
      // 항목2: 38명 기준 (40석-운전자1-가이드1=38)
      const cap38 = s.capacity || 38;
      // API 응답에 online/offline 필드가 있으면 그대로 사용, 없으면 70/30 비율 계산
      const onl = s.online !== undefined ? s.online : (s.onlineSeats !== undefined ? s.onlineSeats : Math.ceil(cap38 * 0.7));
      const off = s.offline !== undefined ? s.offline : (s.offlineSeats !== undefined ? s.offlineSeats : cap38 - Math.ceil(cap38 * 0.7));
      // API 응답에 onlineBooked 필드가 있으면 그대로 사용, 없으면 시뮬레이션
      const booked = s.onlineBooked !== undefined ? s.onlineBooked : Math.floor(Math.random() * Math.floor(onl * 0.6));
      const isSoldout = s.status === 'soldout' || booked >= onl;
      return {
        id: s.id || `${regionId}-${(s.time||'').replace(':','')}`,
        time: s.time || '-',
        endTime: s.endTime || (s.time ? (() => { const [h,m]=s.time.split(':').map(Number); const t=h*60+m+(s.duration||70); return `${String(Math.floor(t/60)%24).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`; })() : '-'),
        capacity: cap38,
        online: onl,
        offline: off,
        onlineBooked: booked,
        status: isSoldout ? 'soldout' : 'active',
        course: s.course || `${region.name} 수륙양용 코스`,
        vehicle: s.vehicle || '',
        operatingDays: s.operatingDays || ['월','화','수','목','금','토','일'],
      };
    });

    // 요금은 API(region.fares)에서 직접 사용

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
<div class="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
  <div class="grid md:grid-cols-3 gap-4 sm:gap-8">
    <!-- 왼쪽: 예약 폼 -->
    <div class="md:col-span-2 space-y-4 sm:space-y-6 min-w-0">
      <!-- 날짜 선택 -->
      <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
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
      <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm" id="schedule-section">
        <h2 class="font-bold text-navy-800 text-lg mb-4">🕐 회차 선택</h2>
        <div id="schedule-list" class="grid grid-cols-2 gap-2 sm:gap-3">
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
      <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm" id="fare-section">
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
      <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm" id="form-section">
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
            <!-- 휠체어 탑승 제한 안내 -->
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-start gap-2">
              <i class="fas fa-exclamation-triangle text-amber-500 mt-0.5 flex-shrink-0"></i>
              <div class="text-xs text-amber-800 leading-relaxed">
                <strong>휠체어 탑승 제한 안내</strong><br>
                수륙양용버스의 특수 구조상 <strong>휠체어 상태로의 탑승이 제한</strong>됩니다. 거동이 불편하신 분은 탑승 전 반드시 고객센터에 사전 문의해 주시기 바랍니다.
                <div class="mt-1.5">
                  <button onclick="Router.go('/inquiry')"
                    class="inline-flex items-center gap-1 bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors font-medium">
                    <i class="fas fa-headset"></i> 사전 문의하기
                  </button>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-3">
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
                <span class="text-sm text-gray-700">심장·고혈압 질환</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                <input type="checkbox" id="sp-mobility" class="rounded text-cyan-600">
                <span class="text-sm text-gray-700">보행 보조 필요</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                <input type="checkbox" id="sp-elderly" class="rounded text-cyan-600">
                <span class="text-sm text-gray-700">고령자 동반</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                <input type="checkbox" id="sp-other" class="rounded text-cyan-600">
                <span class="text-sm text-gray-700">기타 특이사항</span>
              </label>
            </div>
            <textarea id="inp-memo" rows="2" placeholder="기타 요청사항 또는 특이사항을 입력해주세요 (선택)"
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

    <!-- 오른쪽: 예약 요약 (모바일: 예약 폼 아래 표시, md+: 사이드바 sticky) -->
    <div class="space-y-4 min-w-0">
      <div class="summary-box md:sticky md:top-20">
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
      <div data-tab-content="주변관광지" data-tab-content-group="region-info" class="hidden" id="tourism-tab-${regionId}">
        <h3 class="font-bold text-navy-800 mb-3">주변 관광지</h3>
        <div class="grid md:grid-cols-3 gap-3 text-sm text-gray-600" id="tourism-list-${regionId}">
          ${(() => {
            // ★ localStorage amk_tourism_contents 기반 (관리자 관광정보관리와 동일 저장소)
            try {
              const allContents = [];
              const list = allContents.filter(t =>
                t.regionId === regionId &&
                t.visible !== false &&
                (t.type === 'attraction' || (!t.type && !['restaurant','cafe','course'].includes(t.type)))
              );
              if (list.length > 0) {
                return list.map(t => `
                  <div class="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                    <i class="fas fa-landmark text-cyan-500 mt-0.5 flex-shrink-0"></i>
                    <div>
                      <div class="font-medium text-navy-800 text-sm">${t.title || ''}</div>
                      ${t.desc ? `<div class="text-xs text-gray-500 mt-0.5">${t.desc}</div>` : ''}
                      ${t.address ? `<div class="text-xs text-cyan-600 mt-0.5">${t.address}</div>` : ''}
                      ${t.hours ? `<div class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mt-1">${t.hours}</div>` : ''}
                    </div>
                  </div>`).join('');
              }
            } catch(e) {}
            return '<div class="col-span-3 text-center text-gray-400 py-6 text-sm">등록된 관광지 정보가 없습니다.</div>';
          })()}
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
        <!-- 주변관광지 (관리자 관광정보관리 데이터 기반) -->
        <div data-tab-content="buyeo-주변관광지" data-tab-content-group="buyeo-content">
          ${(() => {
            try {
              const allContents = [];
              const list = allContents.filter(t => t.regionId === 'buyeo' && t.visible !== false && t.type === 'attraction');
              if (list.length > 0) {
                return `<div class="grid md:grid-cols-2 gap-4">${list.sort((a,b)=>(a.order||99)-(b.order||99)).map(p=>`
                  <div class="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <div class="text-2xl flex-shrink-0">🏛️</div>
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-navy-800 text-sm">${p.title||''}</div>
                      ${p.desc?`<div class="text-xs text-gray-500 mt-0.5">${p.desc}</div>`:''}
                      <div class="flex flex-wrap gap-1.5 mt-1.5">
                        ${p.hours?`<span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">${p.hours}</span>`:''}
                        ${p.address?`<span class="text-xs text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">${p.address}</span>`:''}
                        ${p.tags&&p.tags.length?p.tags.map(tag=>`<span class="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">${tag}</span>`).join(''):''}
                      </div>
                    </div>
                  </div>`).join('')}</div>`;
              }
            } catch(e) {}
            return '<div class="text-center text-gray-400 py-8 text-sm"><i class="fas fa-landmark text-3xl mb-2 block text-gray-300"></i>등록된 관광지 정보가 없습니다.<br><span class="text-xs">관리자 관광정보관리에서 등록해 주세요.</span></div>';
          })()}
        </div>
        <!-- 맛집추천 (관리자 관광정보관리 데이터 기반) -->
        <div data-tab-content="buyeo-맛집추천" data-tab-content-group="buyeo-content" class="hidden">
          ${(() => {
            try {
              const allContents = [];
              const list = allContents.filter(t => t.regionId === 'buyeo' && t.visible !== false && t.type === 'restaurant');
              if (list.length > 0) {
                return `<div class="grid md:grid-cols-2 gap-4">${list.sort((a,b)=>(a.order||99)-(b.order||99)).map(p=>`
                  <div class="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <div class="text-2xl flex-shrink-0">🍽️</div>
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-navy-800 text-sm">${p.title||''}</div>
                      ${p.address?`<div class="text-xs text-cyan-600 mb-0.5">${p.address}</div>`:''}
                      ${p.desc?`<div class="text-xs text-gray-500">${p.desc}</div>`:''}
                      <div class="flex flex-wrap gap-1.5 mt-1.5">
                        ${p.hours?`<span class="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">${p.hours}</span>`:''}
                        ${p.phone?`<span class="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">${p.phone}</span>`:''}
                        ${p.tags&&p.tags.length?p.tags.map(tag=>`<span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">${tag}</span>`).join(''):''}
                      </div>
                    </div>
                  </div>`).join('')}</div>`;
              }
            } catch(e) {}
            return '<div class="text-center text-gray-400 py-8 text-sm"><i class="fas fa-utensils text-3xl mb-2 block text-gray-300"></i>등록된 맛집 정보가 없습니다.<br><span class="text-xs">관리자 관광정보관리에서 맛집을 등록해 주세요.</span></div>';
          })()}
        </div>
        <!-- 카페·디저트 (관리자 관광정보관리 데이터 기반) -->
        <div data-tab-content="buyeo-카페·디저트" data-tab-content-group="buyeo-content" class="hidden">
          ${(() => {
            try {
              const allContents = [];
              const list = allContents.filter(t => t.regionId === 'buyeo' && t.visible !== false && t.type === 'cafe');
              if (list.length > 0) {
                return `<div class="grid md:grid-cols-2 gap-4">${list.sort((a,b)=>(a.order||99)-(b.order||99)).map(p=>`
                  <div class="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <div class="text-2xl flex-shrink-0">☕</div>
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-navy-800 text-sm">${p.title||''}</div>
                      ${p.address?`<div class="text-xs text-cyan-600 mb-0.5">${p.address}</div>`:''}
                      ${p.desc?`<div class="text-xs text-gray-500">${p.desc}</div>`:''}
                      <div class="flex flex-wrap gap-1.5 mt-1.5">
                        ${p.hours?`<span class="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">${p.hours}</span>`:''}
                        ${p.phone?`<span class="text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded">${p.phone}</span>`:''}
                        ${p.tags&&p.tags.length?p.tags.map(tag=>`<span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">${tag}</span>`).join(''):''}
                      </div>
                    </div>
                  </div>`).join('')}</div>`;
              }
            } catch(e) {}
            return '<div class="text-center text-gray-400 py-8 text-sm"><i class="fas fa-coffee text-3xl mb-2 block text-gray-300"></i>등록된 카페·디저트 정보가 없습니다.<br><span class="text-xs">관리자 관광정보관리에서 카페를 등록해 주세요.</span></div>';
          })()}
        </div>
        <!-- 추천코스 (관리자 관광정보관리 데이터 기반) -->
        <div data-tab-content="buyeo-추천코스" data-tab-content-group="buyeo-content" class="hidden">
          ${(() => {
            try {
              const allContents = [];
              const list = allContents.filter(t => t.regionId === 'buyeo' && t.visible !== false && t.type === 'course');
              if (list.length > 0) {
                return `<div class="space-y-4">${list.sort((a,b)=>(a.order||99)-(b.order||99)).map(p=>`
                  <div class="border border-gray-200 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-3">
                      <span class="bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded">추천코스</span>
                      <span class="font-bold text-navy-800 text-sm">${p.title||''}</span>
                    </div>
                    ${p.desc?`<div class="text-sm text-gray-600 mb-2">${p.desc}</div>`:''}
                    ${p.address?`<div class="text-xs text-cyan-600">${p.address}</div>`:''}
                    ${p.tags&&p.tags.length?`<div class="flex flex-wrap gap-1 mt-2">${p.tags.map(tag=>`<span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">${tag}</span>`).join('')}</div>`:''}
                  </div>`).join('')}</div>`;
              }
            } catch(e) {}
            return '<div class="text-center text-gray-400 py-8 text-sm"><i class="fas fa-route text-3xl mb-2 block text-gray-300"></i>등록된 추천코스가 없습니다.<br><span class="text-xs">관리자 관광정보관리에서 코스를 등록해 주세요.</span></div>';
          })()}
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
  _allSchedules: [], // 날짜별 필터링을 위한 전체 회차 목록 저장

  initRegionPage: (region, schedules) => {
    CustomerPages._state.regionId = region.id;
    CustomerPages._state.fares = {};

    // ★ 페이지 초기화 시 전달받은 schedules를 그대로 사용
    //   (regionPage()에서 이미 API+localStorage 병합 완료된 상태)
    const regionId = region.id;
    CustomerPages._allSchedules = schedules; // 전체 회차 저장
    console.log(`[AMK DEBUG] initRegionPage: region=${regionId}, 전체회차=${schedules.length}개, 시간=[${schedules.map(s=>s.time).join(',')}]`);
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
    CustomerPages._state.scheduleId = ''; // 날짜 바뀌면 회차 선택 초기화
    const sumDate = document.getElementById('sum-date');
    if (sumDate) sumDate.textContent = Utils.dateKo(dateStr);
    // ★ 날짜 선택 시 해당 요일에 운행하는 회차만 재렌더링
    CustomerPages.renderSchedulesByDate(dateStr);
    CustomerPages.updateSummary();
  },

  // ★ 날짜 기준 요일 필터링 후 회차 목록 재렌더링
  renderSchedulesByDate: (dateStr) => {
    const listEl = document.getElementById('schedule-list');
    if (!listEl) return;
    const allSchedules = CustomerPages._allSchedules || [];
    if (allSchedules.length === 0) {
      listEl.innerHTML = '<div class="col-span-2 text-center text-gray-400 py-6 text-sm"><i class="fas fa-calendar-times text-2xl mb-2 block"></i>이 날짜에 운행하는 회차가 없습니다.</div>';
      return;
    }
    const DAY_NAMES = ['일','월','화','수','목','금','토'];
    const dayOfWeek = DAY_NAMES[new Date(dateStr + 'T00:00:00').getDay()];
    const today = new Date().toISOString().slice(0, 10);
    // operatingDays 포함 여부 + startDate/endDate 범위 체크
    const filtered = allSchedules.filter(s => {
      const days = s.operatingDays || ['일','월','화','수','목','금','토'];
      if (!days.includes(dayOfWeek)) return false;
      if (s.startDate && dateStr < s.startDate) return false;
      if (s.endDate && dateStr > s.endDate) return false;
      return true;
    });
    console.log(`[AMK DEBUG] renderSchedulesByDate: date=${dateStr}(${dayOfWeek}), 전체=${allSchedules.length}개, 필터후=${filtered.length}개, 표시시간=[${filtered.map(s=>s.time).join(',')}]`);
    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="col-span-2 text-center text-gray-400 py-6 text-sm"><i class="fas fa-calendar-times text-2xl mb-2 block"></i>이 날짜(' + dayOfWeek + '요일)에 운행하는 회차가 없습니다.</div>';
      return;
    }
    listEl.innerHTML = filtered.map(s => `
      <div class="schedule-card ${s.status==='soldout'?'soldout':''}" data-schedule-id="${s.id}" onclick="CustomerPages.selectSchedule('${s.id}', this)">
        <div class="flex justify-between items-start mb-2">
          <span class="schedule-card-time">${s.time}</span>
          <span class="text-xs ${s.status==='soldout'?'text-red-500 font-bold':'text-green-600 font-bold'}">
            ${s.status==='soldout'?'매진':s.onlineBooked>=s.online?'온라인 마감':'잔여 '+(s.online-s.onlineBooked)+'석'}
          </span>
        </div>
        <div class="text-xs text-gray-500">${(s.course||'').split('→')[0].trim()} 출발</div>
        <div class="seat-bar mt-2"><div class="seat-bar-fill ${(s.onlineBooked/s.online)>0.8?'danger':(s.onlineBooked/s.online)>0.6?'warning':''}" style="width:${Math.min(100,Math.round(s.onlineBooked/s.online*100))}%"></div></div>
        <div class="text-xs text-gray-400 mt-1">온라인 예약 ${s.online-s.onlineBooked}/${s.online}석</div>
      </div>`).join('');
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
    Store.set('cart', { regionId, date: s.date, scheduleId: s.scheduleId, paxList, pax, total, totalAmount: total, name, phone, email: document.getElementById('inp-email')?.value, source: s.source });
    Router.go('/payment');
  },

  // ── 예약 확인/취소 ──────────────────────────────────────────
  // ★ 핫픽스: params 수신 가능하도록 변경 (/reservation/detail/:reservationNo 라우트 지원)
  bookingCheck: async (params) => {
    // URL 파라미터로 예약번호 자동 채우기 (id, reservationNo, reservationId 모두 지원)
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = (
      (params && (params.reservationNo || params.id)) ||
      urlParams.get('id') ||
      urlParams.get('reservationNo') ||
      urlParams.get('reservationId') ||
      ''
    ).toUpperCase();
    // 자동 조회 여부: URL에 예약번호가 포함된 경우 페이지 렌더 후 자동 실행
    const autoSearch = !!urlId;
    setTimeout(() => {
      Navbar.init();
      // ★ 예약번호가 URL에 있으면 자동 조회 실행
      if (autoSearch) {
        CustomerPages._autoCheckBooking(urlId);
      }
    }, 200);
    return `
${Navbar.render()}
<div style="padding-top:64px" class="min-h-screen bg-gray-50">
  <div class="max-w-xl mx-auto px-4 py-10">

    <!-- 헤더 -->
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🎫</div>
      <h1 class="text-2xl font-black text-navy-800 mb-2">예약 확인 / 취소</h1>
      <p class="text-gray-500 text-sm">예약번호와 휴대폰번호로 탑승권을 조회하거나 예약을 취소할 수 있습니다</p>
    </div>

    <!-- 기본 조회: 예약번호 + 전화번호 -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-3">
      <div class="flex items-center gap-2 mb-4">
        <span class="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
        <h2 class="font-semibold text-gray-700 text-sm">예약번호 + 휴대폰번호로 조회</h2>
      </div>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">예약번호 <span class="text-red-400">*</span></label>
          <input type="text" class="form-input" id="chk-resId"
            placeholder="예약번호를 입력하세요 (예: RES-2025-052668)"
            value="${urlId || ''}"
            oninput="this.value=this.value.toUpperCase()">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">예약자 휴대폰번호 <span class="text-red-400">*</span></label>
          <input type="tel" class="form-input" id="chk-phone" placeholder="010-0000-0000">
        </div>
        <button onclick="CustomerPages.checkBooking('primary')"
          class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <i class="fas fa-search"></i> 예약 조회하기
        </button>
      </div>
    </div>

    <!-- 보조 조회: 전화번호 + 탑승일자 -->
    <div class="bg-white rounded-2xl shadow-sm p-5 mb-4 border border-dashed border-gray-200">
      <button onclick="document.getElementById('alt-search').classList.toggle('hidden')"
        class="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700">
        <span class="flex items-center gap-2">
          <span class="w-6 h-6 bg-gray-100 text-gray-500 text-xs font-bold rounded-full flex items-center justify-center">2</span>
          예약번호를 모르시나요? <strong class="text-blue-600 ml-1">휴대폰번호로 조회</strong>
        </span>
        <i class="fas fa-chevron-down text-xs"></i>
      </button>
      <div id="alt-search" class="hidden mt-4 space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">휴대폰번호 <span class="text-red-400">*</span></label>
          <input type="tel" class="form-input" id="chk-alt-phone" placeholder="010-0000-0000">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">탑승일자 <span class="text-gray-400">(선택 — 입력하면 해당 날짜만 조회)</span></label>
          <input type="date" class="form-input" id="chk-alt-date">
        </div>
        <button onclick="CustomerPages.checkBooking('alt')"
          class="w-full border border-blue-300 text-blue-600 py-2.5 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm">
          <i class="fas fa-search"></i> 예약 조회하기
        </button>
      </div>
    </div>

    <!-- 결과 영역 -->
    <div id="booking-result"></div>

    <!-- 고객센터 안내 -->
    <div class="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
      <div class="flex items-start gap-2">
        <i class="fas fa-headset mt-0.5 text-amber-500"></i>
        <div>
          <div class="font-semibold mb-0.5">고객센터 운영안내</div>
          <div class="text-xs text-amber-700">평일 09:00–18:00 | ☎ 1588-0000 | 카카오톡 채널: 아쿠아모빌리티코리아</div>
          <div class="text-xs text-amber-600 mt-1">예약번호를 모르시거나 조회가 안 될 경우 고객센터로 문의해주세요.</div>
        </div>
      </div>
    </div>

  </div>
</div>
${Footer.render()}`;
  },

  // ★ 핫픽스: 예약번호가 URL에 있을 때 자동 조회 (휴대폰 입력 없이 예약번호만으로 상세 표시)
  _autoCheckBooking: async (reservationId) => {
    if (!reservationId) return;
    const el = document.getElementById('booking-result');
    if (!el) return;
    el.innerHTML = `<div class="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
      <i class="fas fa-spinner fa-spin text-3xl text-blue-400"></i>
      <span class="text-sm">예약 정보를 조회 중입니다...</span>
    </div>`;

    const statusLabelMap = {
      confirmed:       { cls:'bg-green-100 text-green-700',  label:'예약 확정' },
      payment_pending: { cls:'bg-yellow-100 text-yellow-700',label:'결제 대기' },
      payment_done:    { cls:'bg-blue-100 text-blue-700',    label:'결제 완료' },
      checkedin:       { cls:'bg-cyan-100 text-cyan-700',    label:'탑승 완료' },
      cancelled:       { cls:'bg-red-100 text-red-700',      label:'예약 취소' },
      refunded:        { cls:'bg-gray-100 text-gray-600',    label:'환불 완료' },
      noshow:          { cls:'bg-orange-100 text-orange-700',label:'노쇼' },
    };

    let found = null;
    try {
      // DB API로 직접 조회
      const apiRes = await API.get(`/api/reservations/check/${encodeURIComponent(reservationId)}`);
      if (apiRes.success && apiRes.data) {
        const r = apiRes.data; const st = r.status || 'confirmed';
        found = {
          id: r.reservationNo || r.id,
          regionName: r.regionName || r.regionId || '-',
          boardingPlace: r.boardingPlace || '-',
          date: r.date || '-',
          schedule: r.scheduleTime || r.scheduleId || '-',
          pax: r.pax || 1,
          totalAmount: r.totalPrice || 0,
          name: r.name || '-', phone: r.phone || '-', status: st,
          statusBadge: statusLabelMap[st] || { cls:'bg-gray-100 text-gray-600', label: st },
          cancelable: ['confirmed'].includes(st),
          wristband: ['confirmed','checkedin'].includes(st), qr: true,
        };
      }
    } catch(e) {}
    // localStorage 폴백
    if (!found) try {
      const stored = JSON.parse(localStorage.getItem('amk_reservations') || '[]');
      const raw = stored.find(r => (r.reservationId === reservationId || r.id === reservationId));
      if (raw) {
        const st = raw.status || 'confirmed';
        found = {
          id:              raw.reservationId || raw.id,
          regionName:      raw.regionName || raw.regionId || '-',
          boardingPlace:   raw.boardingPlace || '-',
          parkingInfo:     raw.parkingInfo || '-',
          customerService: raw.customerService || '1588-0000',
          date:            raw.date || '-',
          schedule:        raw.schedule || raw.time || '-',
          pax:             raw.pax || raw.totalPassengers || 1,
          paxList:         raw.paxList || [],
          totalAmount:     raw.totalAmount || raw.total || 0,
          name:            raw.name || '-',
          phone:           raw.phone || '-',
          status:          st,
          statusBadge:     statusLabelMap[st] || { cls:'bg-gray-100 text-gray-600', label: st },
          cancelable:      ['confirmed','payment_done','payment_pending'].includes(st),
          wristband:       ['confirmed','payment_done','checkedin'].includes(st),
          qr:              ['confirmed','payment_done','checkedin'].includes(st),
        };
      }
    } catch(e) {}

    if (!found) {
      el.innerHTML = `<div class="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <div class="text-3xl mb-2">🔍</div>
        <p class="font-bold text-amber-700 mb-1">예약번호로 바로 조회할 수 없습니다</p>
        <p class="text-sm text-amber-600 mb-4">보안을 위해 예약번호와 휴대폰번호를 함께 입력해주세요.</p>
      </div>`;
      // 입력창에 예약번호 자동 채우기
      const inp = document.getElementById('chk-resId');
      if (inp) inp.value = reservationId;
      return;
    }

    // 조회 성공 → 결과 렌더링 (checkBooking과 동일 포맷)
    CustomerPages._renderBookingResult(el, found);
  },

  // ★ 핫픽스: 예약 결과 렌더링 공통 함수 (checkBooking과 _autoCheckBooking에서 공유)
  _renderBookingResult: (el, found) => {
    const badge = found.statusBadge || { cls:'bg-gray-100 text-gray-600', label: found.status };
    const isCancelled = ['cancelled','refunded','noshow'].includes(found.status);
    const isCancelable = found.cancelable !== false && !isCancelled;
    const boardingDate = new Date(found.date + 'T00:00:00');
    const hoursUntil   = (boardingDate - Date.now()) / 36e5;
    const cancelWarning = hoursUntil > 0 && hoursUntil < 24
      ? '<p class="text-xs text-orange-600 mt-1"><i class="fas fa-exclamation-triangle mr-1"></i>탑승 24시간 이내 취소 시 수수료가 발생합니다.</p>'
      : '';
    const maskPhone = (p) => {
      const d = (p||'').replace(/[^0-9]/g,'');
      if (d.length < 8) return p;
      return d.slice(0,3) + '-****-' + d.slice(-4);
    };
    const qrUrl = `${window.location.origin}/reservation/check?id=${found.id}`;

    el.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-navy-900 to-blue-800 px-5 py-4 text-white">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-white/60 mb-1">예약번호</p>
              <span class="font-black tracking-widest text-lg">${found.id}</span>
            </div>
            <span class="px-3 py-1.5 rounded-full text-xs font-bold ${badge.cls}">${badge.label}</span>
          </div>
        </div>
        <div class="p-5">
          <div class="space-y-2.5 text-sm mb-4">
            <div class="flex justify-between items-center border-b border-gray-50 pb-2">
              <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-map-marker-alt w-4 text-center text-blue-400"></i>운행 지역</span>
              <span class="font-semibold">${found.regionName}</span>
            </div>
            <div class="flex justify-between items-center border-b border-gray-50 pb-2">
              <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-calendar-alt w-4 text-center text-blue-400"></i>탑승일자</span>
              <span class="font-semibold">${found.date}</span>
            </div>
            <div class="flex justify-between items-center border-b border-gray-50 pb-2">
              <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-clock w-4 text-center text-blue-400"></i>탑승시간</span>
              <span class="font-semibold">${found.schedule || '-'}</span>
            </div>
            <div class="flex justify-between items-center border-b border-gray-50 pb-2">
              <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-users w-4 text-center text-blue-400"></i>탑승인원</span>
              <span class="font-semibold">${found.pax}명${found.paxList?.length ? ' (' + found.paxList.join(', ') + ')' : ''}</span>
            </div>
            <div class="flex justify-between items-center border-b border-gray-50 pb-2">
              <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-user w-4 text-center text-blue-400"></i>예약자</span>
              <span class="font-semibold">${found.name} / ${maskPhone(found.phone)}</span>
            </div>
            <div class="flex justify-between items-center border-b border-gray-50 pb-2">
              <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-map-pin w-4 text-center text-blue-400"></i>탑승장</span>
              <span class="font-semibold text-xs text-right">${found.boardingPlace}</span>
            </div>
            ${found.parkingInfo && found.parkingInfo !== '-' ? `
            <div class="flex justify-between items-center border-b border-gray-50 pb-2">
              <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-parking w-4 text-center text-blue-400"></i>주차 안내</span>
              <span class="font-semibold text-xs text-right">${found.parkingInfo}</span>
            </div>` : ''}
            <div class="flex justify-between items-center pt-1">
              <span class="text-gray-500 font-medium">결제금액</span>
              <span class="font-black text-xl text-blue-700">₩${(found.totalAmount||0).toLocaleString()}</span>
            </div>
          </div>

          ${found.wristband ? `
          <div class="flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-xs text-cyan-800 mb-3">
            <i class="fas fa-band-aid text-cyan-500"></i>
            <span><strong>QR 손목밴드</strong> — 현장 도착 시 직원에게 QR 제시 → 손목밴드 수령</span>
          </div>` : ''}

          ${isCancelled ? `
          <div class="bg-red-50 rounded-xl p-3 text-xs text-red-700 text-center mb-3">
            <i class="fas fa-info-circle mr-1"></i>
            ${found.status==='cancelled'?'취소된 예약입니다. 환불 문의: ☎ '+found.customerService:
              found.status==='refunded'?'환불 처리가 완료된 예약입니다.':
              '노쇼 처리된 예약입니다. 고객센터 문의 요망.'}
          </div>` : cancelWarning ? `<div class="mb-3">${cancelWarning}</div>` : ''}

          <!-- QR 탑승권 영역 -->
          ${found.qr ? `
          <div class="border border-dashed border-gray-300 rounded-xl p-4 mb-4 text-center">
            <p class="text-xs text-gray-400 mb-2">QR 탑승권 (현장 스캔용)</p>
            <div class="flex justify-center">
              <canvas id="auto-qr-canvas" style="border-radius:8px;border:2px solid #e2e8f0;max-width:160px"></canvas>
            </div>
            <p class="font-mono text-xs text-gray-400 mt-2">${found.id}</p>
          </div>` : ''}

          <!-- 액션 버튼 -->
          <div class="mt-4 space-y-2">
            ${!isCancelled ? `
            <div class="grid grid-cols-2 gap-2">
              <button onclick="Utils.print()"
                class="bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                <i class="fas fa-print"></i>탑승권 인쇄
              </button>
              <button onclick="Utils.copy('${found.id}');Utils.toast('예약번호가 복사되었습니다','success')"
                class="border border-blue-300 text-blue-600 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                <i class="fas fa-copy"></i>예약번호 복사
              </button>
            </div>
            ${isCancelable ? `
            <button onclick="Utils.confirm('예약을 취소하시겠습니까?\\n\\n취소 정책:\\n• 탑승 7일 전: 전액 환불\\n• 탑승 3일 전: 90% 환불\\n• 탑승 1일 전: 50% 환불\\n• 당일: 환불 불가', () => {
                document.getElementById('booking-result').innerHTML='<div class=\\'bg-green-50 border border-green-200 rounded-2xl p-6 text-center\\'><i class=\\'fas fa-check-circle text-green-400 text-3xl mb-3\\'></i><p class=\\'font-bold text-green-700 mb-1\\'>취소 요청이 접수되었습니다</p><p class=\\'text-sm text-gray-500\\'>환불 처리는 영업일 3~5일 소요됩니다.</p></div>';
                Utils.toast('취소 요청 접수 완료','success');
              })"
              class="w-full border border-red-300 text-red-500 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <i class="fas fa-times-circle"></i>예약 취소 신청
            </button>` : ''}` : ''}
            <div class="grid grid-cols-2 gap-2 mt-1">
              <button onclick="document.getElementById('booking-result').innerHTML=''"
                class="border border-gray-200 text-gray-500 py-2.5 rounded-xl text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                <i class="fas fa-search"></i>다시 조회
              </button>
              <button onclick="Router.go('/inquiry')"
                class="border border-gray-200 text-gray-500 py-2.5 rounded-xl text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                <i class="fas fa-headset"></i>고객센터
              </button>
            </div>
          </div>
        </div>
      </div>`;

    // QR 생성
    if (found.qr) {
      setTimeout(async () => {
        try { await Utils.generateQR('auto-qr-canvas', qrUrl); } catch(e) {}
      }, 300);
    }
  },

  // ── alt 조회 복수 결과 목록 렌더링 ─────────────────────────
  _renderAltMultiResult: (el, list, statusLabelMap) => {
    const defaultMap = {
      confirmed:      { cls:'bg-green-100 text-green-700',  label:'예약 확정' },
      payment_pending:{ cls:'bg-yellow-100 text-yellow-700',label:'결제 대기' },
      payment_done:   { cls:'bg-blue-100 text-blue-700',    label:'결제 완료' },
      checkedin:      { cls:'bg-cyan-100 text-cyan-700',    label:'탑승 완료' },
      cancelled:      { cls:'bg-red-100 text-red-700',      label:'예약 취소' },
      refunded:       { cls:'bg-gray-100 text-gray-600',    label:'환불 완료' },
      noshow:         { cls:'bg-orange-100 text-orange-700',label:'노쇼' },
    };
    const smap = statusLabelMap || defaultMap;
    const rows = list.map((r, i) => {
      const st = r.status || 'confirmed';
      const badge = r.statusBadge || smap[st] || { cls:'bg-gray-100 text-gray-600', label: st };
      const resId = r.reservationId || r.id || '-';
      const date  = r.date || r.boardingDate || '-';
      const region = r.regionName || r.region || r.regionId || '-';
      const name  = r.name || r.booker || '-';
      // 선택 시 primary 모드로 재조회
      return `
        <button onclick="(function(){
          var el=document.getElementById('chk-resId');
          var ph=document.getElementById('chk-phone');
          if(el) el.value='${resId}';
          if(ph) ph.value=(document.getElementById('chk-alt-phone')?.value||'');
          CustomerPages.checkBooking('primary');
        })()"
          class="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-sm text-gray-800 truncate">${resId}</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${badge.cls}">${badge.label}</span>
            </div>
            <div class="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5">
              <span><i class="fas fa-calendar-alt mr-1 text-blue-300"></i>${date}</span>
              <span><i class="fas fa-map-marker-alt mr-1 text-blue-300"></i>${region}</span>
              <span><i class="fas fa-user mr-1 text-blue-300"></i>${(name).slice(0,1)}${'*'.repeat(Math.max(0,name.length-1))}</span>
            </div>
          </div>
          <i class="fas fa-chevron-right text-gray-300 shrink-0"></i>
        </button>`;
    }).join('');

    if (el) el.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-white">
          <p class="font-bold text-base"><i class="fas fa-list mr-2"></i>조회된 예약 ${list.length}건</p>
          <p class="text-xs text-white/70 mt-0.5">확인하실 예약을 선택해주세요</p>
        </div>
        <div class="p-4 space-y-2">${rows}</div>
        <div class="px-4 pb-4">
          <button onclick="document.getElementById('booking-result').innerHTML=''"
            class="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
            <i class="fas fa-redo"></i>다시 조회하기
          </button>
        </div>
      </div>`;
  },

  // ── 예약 조회 실행 ──────────────────────────────────────────
  checkBooking: async (mode = 'primary') => {
    const el = document.getElementById('booking-result');

    // ── 입력값 수집 ─────────────────────────────────────────
    let resId = '', phone = '', altDate = '';
    if (mode === 'primary') {
      resId = (document.getElementById('chk-resId')?.value || '').trim().toUpperCase();
      phone = (document.getElementById('chk-phone')?.value || '').trim().replace(/[^0-9]/g, '');
      if (!resId) { Utils.toast('예약번호를 입력해주세요', 'warning'); return; }
      if (!phone || phone.length < 10) { Utils.toast('휴대폰번호를 정확히 입력해주세요', 'warning'); return; }
    } else {
      phone   = (document.getElementById('chk-alt-phone')?.value || '').trim().replace(/[^0-9]/g, '');
      altDate = (document.getElementById('chk-alt-date')?.value  || '').trim();
      if (!phone || phone.length < 10) { Utils.toast('휴대폰번호를 정확히 입력해주세요', 'warning'); return; }
      // altDate는 선택사항 — 입력 시 해당 날짜만 필터, 미입력 시 전체 조회
    }

    // 로딩
    if (el) el.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
        <i class="fas fa-spinner fa-spin text-3xl text-blue-400"></i>
        <span class="text-sm">예약 정보를 조회 중입니다...</span>
      </div>`;

    // 휴대폰 번호 매칭: normalized_phone 우선, phone fallback, 끝 4자리도 허용
    const phoneMatch = (raw, input) => {
      const normalized = (raw.normalized_phone || '').replace(/[^0-9]/g, '');
      const plain      = (raw.phone           || '').replace(/[^0-9]/g, '');
      const inp        = (input || '').replace(/[^0-9]/g, '');
      if (!inp) return false;
      // 정규화 번호 완전 일치 우선
      if (normalized && normalized === inp) return true;
      // phone 원본 숫자 완전 일치
      if (plain && plain === inp) return true;
      // 끝 4자리 일치 (보조)
      const ref = normalized || plain;
      if (ref && ref.length >= 4 && inp.length >= 4 && ref.slice(-4) === inp.slice(-4)) return true;
      return false;
    };

    try {
      let found = null;

      // 1) DB API 직접 조회 (주요 경로)
      try {
        const statusLabelMap = {
          confirmed:      { cls:'bg-green-100 text-green-700',  label:'예약 확정' },
          payment_pending:{ cls:'bg-yellow-100 text-yellow-700',label:'결제 대기' },
          payment_done:   { cls:'bg-blue-100 text-blue-700',    label:'결제 완료' },
          checkedin:      { cls:'bg-cyan-100 text-cyan-700',    label:'탑승 완료' },
          cancelled:      { cls:'bg-red-100 text-red-700',      label:'예약 취소' },
          refunded:       { cls:'bg-gray-100 text-gray-600',    label:'환불 완료' },
          noshow:         { cls:'bg-orange-100 text-orange-700',label:'노쇼' },
        };
        if (mode === 'primary' && resId) {
          // 예약번호로 직접 조회
          const apiRes = await API.get(`/api/reservations/check/${encodeURIComponent(resId)}`);
          if (apiRes.success && apiRes.data) {
            const r = apiRes.data;
            // 휴대폰 번호 매칭
            const dbPhone = (r.phone || '').replace(/[^0-9]/g, '');
            const inPhone = phone.replace(/[^0-9]/g, '');
            if (dbPhone === inPhone || dbPhone.slice(-4) === inPhone.slice(-4)) {
              const st = r.status || 'confirmed';
              found = {
                id: r.reservationNo || r.id,
                regionName: r.regionName || r.regionId || '-',
                boardingPlace: r.boardingPlace || '-',
                parkingInfo: r.parkingInfo || '-',
                customerService: r.customerService || '1588-0000',
                date: r.date || '-',
                schedule: r.scheduleTime || r.scheduleId || '-',
                pax: r.pax || 1,
                paxDetail: r.paxDetail || [],
                totalAmount: r.totalPrice || 0,
                name: r.name || '-',
                phone: r.phone || '-',
                status: st,
                statusBadge: statusLabelMap[st] || { cls:'bg-gray-100 text-gray-600', label: st },
                cancelable: ['confirmed','payment_done','payment_pending'].includes(st),
                wristband: ['confirmed','payment_done','checkedin'].includes(st),
                qr: ['confirmed','payment_done','checkedin'].includes(st),
              };
            }
          }
        } else if (mode === 'alt') {
          // 휴대폰번호로 조회
          let url = `/api/reservations?limit=50`;
          if (altDate) url += `&date=${altDate}`;
          const apiRes = await API.get(url);
          if (apiRes.success && apiRes.data) {
            const inPhone = phone.replace(/[^0-9]/g, '');
            const matched = apiRes.data.filter(r => {
              const dbPhone = (r.phone || '').replace(/[^0-9]/g, '');
              return dbPhone === inPhone || dbPhone.slice(-4) === inPhone.slice(-4);
            });
            if (matched.length === 1) {
              const r = matched[0]; const st = r.status || 'confirmed';
              found = {
                id: r.reservationNo || r.id, regionName: r.regionId || '-',
                boardingPlace: '-', date: r.date || '-',
                schedule: r.scheduleId || '-', pax: r.pax || 1,
                totalAmount: r.totalPrice || 0, name: r.name || '-',
                phone: r.phone || '-', status: st,
                statusBadge: statusLabelMap[st] || { cls:'bg-gray-100 text-gray-600', label: st },
                cancelable: ['confirmed'].includes(st), wristband: ['confirmed'].includes(st), qr: true,
              };
            } else if (matched.length > 1) {
              const items = matched.map(r => ({ id: r.reservationNo || r.id, date: r.date, regionName: r.regionId, name: r.name, status: r.status }));
              CustomerPages._renderAltMultiResult(el, items, statusLabelMap);
              return;
            }
          }
        }
      } catch(apiErr) { console.warn('API 조회 실패:', apiErr); }

      // 2) localStorage 폴백 (오프라인 등)
      if (!found) try {
        const stored = JSON.parse(localStorage.getItem('amk_reservations') || '[]');
        if (stored.length > 0) {
          const statusLabelMap = {
            confirmed:      { cls:'bg-green-100 text-green-700',  label:'예약 확정' },
            payment_pending:{ cls:'bg-yellow-100 text-yellow-700',label:'결제 대기' },
            payment_done:   { cls:'bg-blue-100 text-blue-700',    label:'결제 완료' },
            checkedin:      { cls:'bg-cyan-100 text-cyan-700',    label:'탑승 완료' },
            cancelled:      { cls:'bg-red-100 text-red-700',      label:'예약 취소' },
            refunded:       { cls:'bg-gray-100 text-gray-600',    label:'환불 완료' },
            noshow:         { cls:'bg-orange-100 text-orange-700',label:'노쇼' },
          };
          let raw = null;
          if (mode === 'primary') {
            // reservationId 또는 id 필드 모두 지원 + normalized_phone 비교
            raw = stored.find(r =>
              (r.reservationId === resId || r.id === resId) &&
              phoneMatch(r, phone)
            );
          } else {
            // altDate 미입력 시 전화번호만으로 복수 조회
            const matched = stored.filter(r => phoneMatch(r, phone) && (altDate ? (r.date === altDate || r.boardingDate === altDate) : true));
            raw = matched.length === 1 ? matched[0] : null;
            if (matched.length > 1) {
              // 복수 결과 → 목록 표시 후 리턴
              CustomerPages._renderAltMultiResult(el, matched, statusLabelMap);
              return;
            }
          }
          if (raw) {
            const st = raw.status || 'confirmed';
            found = {
              id:               raw.reservationId || raw.id,
              regionName:       raw.regionName || raw.region || raw.regionId || '-',
              boardingPlace:    raw.boardingPlace || '-',
              date:             raw.date || raw.boardingDate || '-',
              schedule:         raw.schedule || raw.scheduleTime || raw.time || '-',
              adultCnt:         raw.adultCnt || raw.adults || (raw.pax ? raw.pax : 1),
              childCnt:         raw.childCnt || raw.children || 0,
              totalPassengers:  raw.totalPassengers || raw.pax || 1,
              totalAmount:      raw.totalAmount || raw.total || raw.amount || 0,
              name:             raw.name || raw.booker || '-',
              phone:            raw.phone || '-',
              status:           st,
              statusBadge:      statusLabelMap[st] || { cls:'bg-gray-100 text-gray-600', label: st },
              cancelable:       ['confirmed','payment_done','payment_pending'].includes(st),
              wristband:        ['confirmed','payment_done','checkedin'].includes(st),
              qr:               ['confirmed','payment_done','checkedin'].includes(st),
            };
          }
        }
      } catch (_) { /* localStorage 오류 무시 */ }

      // 2) 실제 API 시도
      if (!found) {
        try {
          const res = await API.get('/api/reservations');
          const list = res.data || [];
          const apiStatusMap = {
            confirmed:      { cls:'bg-green-100 text-green-700',  label:'예약 확정' },
            payment_pending:{ cls:'bg-yellow-100 text-yellow-700',label:'결제 대기' },
            payment_done:   { cls:'bg-blue-100 text-blue-700',    label:'결제 완료' },
            checkedin:      { cls:'bg-cyan-100 text-cyan-700',    label:'탑승 완료' },
            cancelled:      { cls:'bg-red-100 text-red-700',      label:'예약 취소' },
            refunded:       { cls:'bg-gray-100 text-gray-600',    label:'환불 완료' },
            noshow:         { cls:'bg-orange-100 text-orange-700',label:'노쇼' },
          };
          // API 원시 객체 → 표시용 normalized 객체 변환
          const normalizeApiItem = (r) => {
            const st = r.status || 'confirmed';
            // passengers 배열에서 adultCnt/childCnt 추출
            const passengers = r.passengers || [];
            const adultCnt = passengers.find(p => p.type === 'adult')?.count ||
                             r.adultCnt || r.adults || r.pax || 1;
            const childCnt = passengers.filter(p => p.type !== 'adult')
                             .reduce((s, p) => s + (p.count || 0), 0) ||
                             r.childCnt || r.children || 0;
            return {
              id:            r.id || r.reservationId,
              regionName:    r.regionName || r.region || '-',
              boardingPlace: r.boardingPlace || '-',
              date:          r.date || r.boardingDate || '-',
              schedule:      r.time || r.schedule || r.scheduleTime || '-',
              adultCnt,
              childCnt,
              totalPassengers: adultCnt + childCnt,
              totalAmount:   r.total || r.totalAmount || r.amount || 0,
              name:          r.name || r.booker || '-',
              phone:         r.phone || '-',
              status:        st,
              statusBadge:   apiStatusMap[st] || { cls:'bg-gray-100 text-gray-600', label: st },
              cancelable:    ['confirmed','payment_done','payment_pending'].includes(st),
              wristband:     ['confirmed','payment_done','checkedin'].includes(st),
              qr:            ['confirmed','payment_done','checkedin'].includes(st),
            };
          };
          if (mode === 'primary') {
            // phoneMatch는 객체를 첫 번째 인자로 받음
            const raw = list.find(r => (r.id === resId || r.reservationId === resId) && phoneMatch(r, phone));
            if (raw) found = normalizeApiItem(raw);
          } else {
            const apiMatched = list.filter(r => phoneMatch(r, phone) && (altDate ? (r.date === altDate || r.boardingDate === altDate) : true));
            if (apiMatched.length > 1) { CustomerPages._renderAltMultiResult(el, apiMatched.map(normalizeApiItem), null); return; }
            if (apiMatched[0]) found = normalizeApiItem(apiMatched[0]);
          }
        } catch (_) { /* fallback */ }
      }

      // 3) 데모 데이터 fallback
      if (!found) {
        const DEMO_RESERVATIONS = (() => {
          const regions = [
            { id:'tongyeong', name:'통영해양관광',     boardingPlace:'통영 해양공원 선착장', fareBase:35000 },
            { id:'buyeo',     name:'부여수륙양용투어', boardingPlace:'부여 구드래 나루터',   fareBase:30000 },
            { id:'hapcheon',  name:'합천수륙양용투어', boardingPlace:'합천 황강 선착장',     fareBase:28000 },
          ];
          const names   = ['김민준','이서연','박지호','최하늘','정다은','오현우','강지수','임도현'];
          const schedules = ['10:00','12:00','14:00','15:30'];
          // 8가지 상태
          const statuses = [
            'confirmed','confirmed','confirmed','confirmed',
            'payment_pending','payment_done','checkedin',
            'cancelled','refunded','noshow',
          ];
          const statusLabelMap = {
            confirmed:      { cls:'bg-green-100 text-green-700',  label:'예약 확정' },
            payment_pending:{ cls:'bg-yellow-100 text-yellow-700',label:'결제 대기' },
            payment_done:   { cls:'bg-blue-100 text-blue-700',    label:'결제 완료' },
            checkedin:      { cls:'bg-cyan-100 text-cyan-700',    label:'탑승 완료' },
            cancelled:      { cls:'bg-red-100 text-red-700',      label:'예약 취소' },
            refunded:       { cls:'bg-gray-100 text-gray-600',    label:'환불 완료' },
            noshow:         { cls:'bg-orange-100 text-orange-700',label:'노쇼' },
          };
          const res = [];
          let seq = 1;
          const today = new Date();
          // RES-2025-XXXXXX 형식 고정 데이터 (조회 예시)
          const FIXED = [
            { id:'RES-2025-052668', regionId:'buyeo',     name:'김민준', phone:'010-1234-5678',
              date:'2025-06-15', schedule:'10:00', adultCnt:2, childCnt:1, status:'confirmed',
              wristband:true, qr:true },
            { id:'RES-2025-000001', regionId:'tongyeong', name:'이서연', phone:'010-9876-5432',
              date:'2025-06-20', schedule:'14:00', adultCnt:1, childCnt:0, status:'payment_pending',
              wristband:false, qr:false },
            { id:'RES-2025-001234', regionId:'hapcheon',  name:'박지호', phone:'010-5555-1111',
              date:'2025-05-30', schedule:'12:00', adultCnt:2, childCnt:2, status:'checkedin',
              wristband:true, qr:true },
            { id:'RES-2025-099999', regionId:'buyeo',     name:'최하늘', phone:'010-2222-3333',
              date:'2025-05-10', schedule:'15:30', adultCnt:1, childCnt:0, status:'cancelled',
              wristband:false, qr:false },
          ];
          FIXED.forEach(f => {
            const reg = regions.find(r => r.id === f.regionId);
            const adultFare = reg.fareBase;
            const childFare = Math.round(reg.fareBase * 0.5);
            res.push({
              ...f,
              regionName: reg.name,
              boardingPlace: reg.boardingPlace,
              totalPassengers: f.adultCnt + f.childCnt,
              totalAmount: f.adultCnt * adultFare + f.childCnt * childFare,
              statusBadge: statusLabelMap[f.status] || { cls:'bg-gray-100 text-gray-600', label: f.status },
              cancelable: ['confirmed','payment_done','payment_pending'].includes(f.status),
            });
          });
          // 동적 생성 데모 데이터
          regions.forEach(reg => {
            for (let i = 0; i < 30; i++) {
              const d = new Date(today);
              d.setDate(d.getDate() - Math.floor(Math.random() * 60));
              const dateStr = d.toISOString().slice(0, 10);
              const adultCnt = Math.floor(Math.random() * 3) + 1;
              const childCnt = Math.floor(Math.random() * 2);
              const st = statuses[seq % statuses.length];
              const seqStr = String(10000 + seq).padStart(6, '0');
              const yr = dateStr.slice(0, 4);
              res.push({
                id: `RES-${yr}-${seqStr}`,
                regionId: reg.id, regionName: reg.name,
                boardingPlace: reg.boardingPlace,
                name: names[seq % names.length],
                phone: `010-${String(3000 + seq).padStart(4, '0')}-${String(7000 + seq).padStart(4, '0')}`,
                date: dateStr,
                schedule: schedules[seq % schedules.length],
                adultCnt, childCnt,
                totalPassengers: adultCnt + childCnt,
                totalAmount: adultCnt * reg.fareBase + childCnt * Math.round(reg.fareBase * 0.5),
                status: st,
                statusBadge: statusLabelMap[st] || { cls:'bg-gray-100 text-gray-600', label: st },
                cancelable: ['confirmed','payment_done','payment_pending'].includes(st),
                wristband: ['confirmed','payment_done','checkedin'].includes(st),
                qr: ['confirmed','payment_done','checkedin'].includes(st),
              });
              seq++;
            }
          });
          return res;
        })();

        if (mode === 'primary') {
          // RES-XXXX 또는 AMK-XXXX 형식 모두 지원
          found = DEMO_RESERVATIONS.find(r => r.id === resId);
          if (found && phone.length >= 4) {
            // 고정 데모: 전화번호 뒤 4자리 허용
            const storedLast4 = (found.phone || '').replace(/[^0-9]/g, '').slice(-4);
            const inputLast4  = phone.slice(-4);
            if (storedLast4 !== inputLast4) found = null;
          }
        } else {
          // phoneMatch는 객체를 첫 번째 인자로 받음
          const demoMatched = DEMO_RESERVATIONS.filter(r => phoneMatch(r, phone) && (altDate ? r.date === altDate : true));
          if (demoMatched.length > 1) { CustomerPages._renderAltMultiResult(el, demoMatched, null); return; }
          found = demoMatched[0] || null;
        }
      }

      // ── 조회 실패 ───────────────────────────────────────────
      if (!found) {
        if (el) el.innerHTML = `
          <div class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <div class="text-4xl mb-3">😔</div>
            <p class="font-bold text-red-700 mb-1 text-lg">예약 정보를 찾을 수 없습니다</p>
            <p class="text-sm text-red-500 mb-4">
              ${mode === 'primary'
                ? '예약번호 또는 휴대폰번호를 다시 확인해주세요.<br>예약번호 형식: <strong>RES-2025-052668</strong> 또는 <strong>AMK-20250501-0001</strong>'
                : '입력하신 휴대폰번호 또는 탑승일자와 일치하는 예약을 찾을 수 없습니다.'}
            </p>
            <div class="flex flex-col sm:flex-row gap-2 justify-center">
              <button onclick="document.getElementById('booking-result').innerHTML=''"
                class="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
                <i class="fas fa-redo mr-1"></i>다시 조회하기
              </button>
              <button onclick="Router.go('/inquiry')"
                class="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
                <i class="fas fa-headset mr-1"></i>고객센터 문의
              </button>
            </div>
          </div>`;
        return;
      }

      // ── 조회 성공 ───────────────────────────────────────────
      // 전역 임시 변수에 저장 → onclick 속성에서 JSON 직렬화 없이 호출 (따옴표 충돌 방지)
      window.__amkTicket = found;
      const badge = found.statusBadge || { cls:'bg-gray-100 text-gray-600', label: found.status };
      const isCancelled = ['cancelled','refunded','noshow'].includes(found.status);
      const isCancelable = found.cancelable !== false && !isCancelled;
      // 탑승일 기준 취소 가능 여부 (24시간 전)
      const boardingDate  = new Date(found.date + 'T00:00:00');
      const hoursUntil    = (boardingDate - Date.now()) / 36e5;
      const cancelWarning = hoursUntil > 0 && hoursUntil < 24
        ? '<p class="text-xs text-orange-600 mt-1"><i class="fas fa-exclamation-triangle mr-1"></i>탑승 24시간 이내 취소 시 수수료가 발생합니다.</p>'
        : '';

      if (el) el.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <!-- 상단 헤더 바 -->
          <div class="bg-gradient-to-r from-navy-900 to-blue-800 px-5 py-4 text-white">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-white/60 mb-1">예약번호</p>
                <span class="font-black tracking-widest text-lg">${found.id}</span>
              </div>
              <span class="px-3 py-1.5 rounded-full text-xs font-bold ${badge.cls}">${badge.label}</span>
            </div>
          </div>

          <!-- 탑승 정보 -->
          <div class="p-5">
            <div class="space-y-2.5 text-sm">
              <div class="flex justify-between items-center border-b border-gray-50 pb-2">
                <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-map-marker-alt w-4 text-center text-blue-400"></i>운행 지역</span>
                <span class="font-semibold">${found.regionName}</span>
              </div>
              <div class="flex justify-between items-center border-b border-gray-50 pb-2">
                <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-calendar-alt w-4 text-center text-blue-400"></i>탑승일자</span>
                <span class="font-semibold">${found.date}</span>
              </div>
              <div class="flex justify-between items-center border-b border-gray-50 pb-2">
                <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-clock w-4 text-center text-blue-400"></i>출발 회차</span>
                <span class="font-semibold">${found.schedule} 출발</span>
              </div>
              <div class="flex justify-between items-center border-b border-gray-50 pb-2">
                <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-anchor w-4 text-center text-blue-400"></i>탑승장</span>
                <span class="font-medium text-xs text-right max-w-[180px]">${found.boardingPlace || '현장 안내 확인'}</span>
              </div>
              <div class="flex justify-between items-center border-b border-gray-50 pb-2">
                <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-user w-4 text-center text-blue-400"></i>예약자</span>
                <span class="font-medium">${(found.name||'').slice(0,1)}${'*'.repeat(Math.max(0,(found.name||'').length-1))}</span>
              </div>
              <div class="flex justify-between items-center border-b border-gray-50 pb-2">
                <span class="text-gray-500 flex items-center gap-1.5"><i class="fas fa-users w-4 text-center text-blue-400"></i>탑승인원</span>
                <span class="font-medium">성인 ${found.adultCnt}명${found.childCnt ? ' · 소아 '+found.childCnt+'명' : ''}</span>
              </div>
              <div class="flex justify-between items-center pt-1">
                <span class="text-gray-500 font-medium">결제금액</span>
                <span class="font-black text-xl text-blue-700">₩${(found.totalAmount||0).toLocaleString()}</span>
              </div>
            </div>

            <!-- 안내 배지 -->
            ${found.wristband ? `
            <div class="mt-4 flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-xs text-cyan-800">
              <i class="fas fa-band-aid text-cyan-500"></i>
              <span><strong>QR 손목밴드</strong> — 현장 도착 시 탑승신고서 작성 후 직원에게 QR 제시 → 손목밴드 수령</span>
            </div>` : ''}
            ${isCancelled ? `
            <div class="mt-4 bg-red-50 rounded-xl p-3 text-xs text-red-700 text-center">
              <i class="fas fa-info-circle mr-1"></i>
              ${found.status === 'cancelled' ? '취소된 예약입니다. 환불 문의: ☎ 1588-0000' :
                found.status === 'refunded'  ? '환불 처리가 완료된 예약입니다.' :
                '노쇼 처리된 예약입니다. 환불 불가 — 고객센터 문의 요망.'}
            </div>` : cancelWarning ? `<div class="mt-3">${cancelWarning}</div>` : ''}

            <!-- 액션 버튼 -->
            <div class="mt-5 space-y-2">
              ${!isCancelled ? `
              <div class="grid grid-cols-2 gap-2">
                <button onclick="CustomerPages._openTicketModal()"
                  class="bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                  <i class="fas fa-qrcode"></i>QR 탑승권 보기
                </button>
                <button onclick="Router.go('/reservation/check?id=${found.id}')"
                  class="border border-blue-300 text-blue-600 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                  <i class="fas fa-share-alt"></i>링크 공유
                </button>
              </div>
              ${isCancelable ? `
              <button onclick="Utils.confirm('예약을 취소하시겠습니까?\\n\\n취소 정책:\\n• 탑승 7일 전: 전액 환불\\n• 탑승 3일 전: 90% 환불\\n• 탑승 1일 전: 50% 환불\\n• 당일: 환불 불가', () => {
                document.getElementById('booking-result').innerHTML = '<div class=\\'bg-green-50 border border-green-200 rounded-2xl p-6 text-center\\'>'+
                  '<i class=\\'fas fa-check-circle text-green-400 text-3xl mb-3\\'></i>'+
                  '<p class=\\'font-bold text-green-700 mb-1\\'>취소 요청이 접수되었습니다</p>'+
                  '<p class=\\'text-sm text-gray-500\\'>환불 처리는 영업일 3~5일 소요됩니다.</p>'+
                  '<button onclick=\\'Router.go(\\\\\\'/ \\\\\\')\\'  class=\\'mt-4 btn-ocean px-6 py-2 text-sm\\'>홈으로</button>'+
                  '</div>';
                Utils.toast(\\'취소 요청 접수 완료\\', \\'success\\');
              })"
                class="w-full border border-red-300 text-red-500 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                <i class="fas fa-times-circle"></i>예약 취소 신청
              </button>` : ''}` : ''}

              <div class="grid grid-cols-2 gap-2 mt-1">
                <button onclick="document.getElementById('booking-result').innerHTML='';document.getElementById('chk-resId').value='';document.getElementById('chk-phone').value=''"
                  class="border border-gray-200 text-gray-500 py-2.5 rounded-xl text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                  <i class="fas fa-search"></i>다시 조회
                </button>
                <button onclick="Router.go('/inquiry')"
                  class="border border-gray-200 text-gray-500 py-2.5 rounded-xl text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                  <i class="fas fa-headset"></i>고객센터
                </button>
              </div>
            </div>
          </div>
        </div>`;

    } catch (err) {
      console.error('checkBooking error:', err);
      if (el) el.innerHTML = `
        <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
          <i class="fas fa-exclamation-triangle text-yellow-400 text-2xl mb-2"></i>
          <p class="font-semibold text-yellow-700">조회 중 오류가 발생했습니다</p>
          <p class="text-sm text-gray-500 mt-1">잠시 후 다시 시도해주세요.</p>
          <div class="flex gap-2 justify-center mt-4">
            <button onclick="CustomerPages.checkBooking()"
              class="border border-yellow-300 text-yellow-600 px-5 py-2 rounded-xl text-sm hover:bg-yellow-50">
              <i class="fas fa-redo mr-1"></i>다시 시도
            </button>
            <button onclick="Router.go('/inquiry')"
              class="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-blue-700">
              <i class="fas fa-headset mr-1"></i>고객센터
            </button>
          </div>
        </div>`;
    }
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
  // 공지 유형 → 한글 레이블/색상 (admin과 동일 체계)
  _noticeTypeMeta: (t) => {
    const MAP = {
      general:   { label: '일반공지', cls: 'bg-gray-100 text-gray-600' },
      operation: { label: '운행안내', cls: 'bg-blue-100 text-blue-700' },
      fare:      { label: '요금변경', cls: 'bg-yellow-100 text-yellow-700' },
      suspend:   { label: '운휴안내', cls: 'bg-orange-100 text-orange-700' },
      event:     { label: '이벤트',   cls: 'bg-purple-100 text-purple-700' },
      safety:    { label: '안전공지', cls: 'bg-cyan-100 text-cyan-700' },
      urgent:    { label: '긴급공지', cls: 'bg-red-100 text-red-700' },
      // 구형 호환
      normal:    { label: '공지',     cls: 'bg-gray-100 text-gray-600' },
    };
    return MAP[t] || MAP.general;
  },

  notice: async (params) => {
    // URL 쿼리에서 상세 보기 대상 ID 확인
    const urlParams = new URLSearchParams(window.location.search);
    const detailId  = (params && params.noticeId) || urlParams.get('id') || '';

    // localStorage에서 공지 데이터 로드 (amk_notices)
    const today = new Date().toISOString().slice(0, 10);
    const allNotices = (() => {
      try { return JSON.parse(localStorage.getItem('amk_notices') || '[]'); } catch(e) { return []; }
    })();

    // 고객 표시 기준 필터링:
    // - visible !== false (숨김 아님)
    // - startDate 이전이 아님
    // - endDate 이후가 아님
    const notices = allNotices
      .filter(n => {
        if (n.visible === false) return false;
        if (n.startDate && today < n.startDate) return false;
        if (n.endDate   && today > n.endDate)   return false;
        return true;
      })
      // 상단고정 우선, 그 다음 최신순
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || '');
      });

    setTimeout(() => {
      Navbar.init();
      // URL에 상세 ID 있으면 바로 열기
      if (detailId) {
        const target = notices.find(n => n.id === detailId);
        if (target) CustomerPages._openNoticeDetail(target);
      }
    }, 150);

    const renderRow = (n) => {
      const meta = CustomerPages._noticeTypeMeta(n.type);
      const dateStr = (n.createdAt || n.date || '').slice(0, 10);
      return `
      <div class="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
           onclick="CustomerPages._openNoticeDetail(${JSON.stringify(JSON.stringify(n))})">
        <div class="flex items-start gap-3 px-6 py-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
              ${n.important ? '<span class="inline-block bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">중요</span>' : ''}
              ${n.pinned    ? '<span class="inline-block text-blue-500 text-xs">📌</span>' : ''}
              <span class="inline-block text-xs font-medium px-2 py-0.5 rounded-full ${meta.cls}">${meta.label}</span>
            </div>
            <div class="font-semibold text-gray-800 text-sm leading-snug truncate">${n.title}</div>
            ${n.content ? `<div class="text-xs text-gray-400 mt-0.5 truncate">${n.content.slice(0, 60)}${n.content.length > 60 ? '...' : ''}</div>` : ''}
          </div>
          <div class="shrink-0 text-xs text-gray-400 mt-0.5">${dateStr}</div>
        </div>
      </div>`;
    };

    return `
${Navbar.render()}
<div style="padding-top:64px" class="min-h-screen bg-gray-50">
  <div class="max-w-4xl mx-auto px-4 py-10">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">📢</div>
      <h1 class="text-2xl font-black text-navy-800">공지사항</h1>
    </div>
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      ${notices.length
        ? notices.map(renderRow).join('')
        : `<div class="text-center py-16 text-gray-400">
            <div class="text-5xl mb-3">📭</div>
            <div class="text-sm">등록된 공지사항이 없습니다</div>
           </div>`}
    </div>
  </div>
</div>

<!-- 공지 상세 모달 -->
<div id="notice-detail-modal" class="modal-overlay hidden" style="z-index:9000" onclick="if(event.target===this)CustomerPages._closeNoticeDetail()">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6">
    <div class="flex items-start justify-between mb-4">
      <div id="nd-badges" class="flex flex-wrap gap-1.5"></div>
      <button onclick="CustomerPages._closeNoticeDetail()" class="text-gray-400 hover:text-gray-600 text-lg ml-2 shrink-0">✕</button>
    </div>
    <h2 id="nd-title" class="text-lg font-black text-gray-800 mb-1"></h2>
    <div id="nd-meta"  class="text-xs text-gray-400 mb-4"></div>
    <hr class="mb-4">
    <div id="nd-content" class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"></div>
  </div>
</div>

${Footer.render()}`;
  },

  // 공지 상세 모달 열기
  _openNoticeDetail: (noticeOrJson) => {
    let n = noticeOrJson;
    // onclick에서 JSON.stringify를 두 번 한 경우 대비
    if (typeof n === 'string') { try { n = JSON.parse(n); } catch(e) { return; } }
    const meta    = CustomerPages._noticeTypeMeta(n.type);
    const dateStr = (n.createdAt || n.date || '').slice(0, 10);
    const modal   = document.getElementById('notice-detail-modal');
    if (!modal) return;
    const badgesEl  = document.getElementById('nd-badges');
    const titleEl   = document.getElementById('nd-title');
    const metaEl    = document.getElementById('nd-meta');
    const contentEl = document.getElementById('nd-content');
    if (badgesEl) {
      badgesEl.innerHTML = [
        n.important ? '<span class="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">중요</span>' : '',
        n.pinned    ? '<span class="text-blue-500 text-sm">📌</span>' : '',
        `<span class="text-xs font-medium px-2 py-0.5 rounded-full ${meta.cls}">${meta.label}</span>`,
      ].join('');
    }
    if (titleEl)   titleEl.textContent   = n.title   || '';
    if (metaEl)    metaEl.textContent    = `작성일: ${dateStr}${n.author ? '  |  작성자: ' + n.author : ''}`;
    if (contentEl) contentEl.textContent = n.content || '';
    modal.classList.remove('hidden');
  },

  // 공지 상세 모달 닫기
  _closeNoticeDetail: () => {
    const modal = document.getElementById('notice-detail-modal');
    if (modal) modal.classList.add('hidden');
  },

  // ── QR 탑승권 모달 ─────────────────────────────────────────
  _openTicketModal: (foundJson) => {
    // 인자 없으면 전역 임시 변수에서 읽음 (onclick 속성 따옴표 충돌 방지)
    let f;
    if (foundJson === undefined || foundJson === null) {
      f = window.__amkTicket || null;
    } else {
      try { f = typeof foundJson === 'string' ? JSON.parse(foundJson) : foundJson; } catch(e) { f = null; }
    }
    if (!f) return;

    // 기존 모달 제거 후 재생성
    let existing = document.getElementById('ticket-modal');
    if (existing) existing.remove();

    const badge = f.statusBadge || { cls:'bg-gray-100 text-gray-600', label: f.status || '' };
    const qrData = `AMK:${f.id}:${(f.date||'').replace(/-/g,'')}:${(f.schedule||'').replace(':','')}`;

    const modal = document.createElement('div');
    modal.id = 'ticket-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9100;display:flex;align-items:center;justify-content:center;padding:1rem';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <!-- 헤더 -->
        <div class="bg-gradient-to-r from-navy-900 to-blue-700 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <p class="text-xs text-white/60 mb-0.5">QR 탑승권</p>
            <p class="font-black tracking-widest text-base">${f.id}</p>
          </div>
          <button onclick="document.getElementById('ticket-modal').remove()" class="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        <!-- QR 코드 영역 -->
        <div class="flex flex-col items-center py-6 px-5 bg-gray-50">
          <div class="bg-white rounded-xl p-3 shadow-md mb-3">
            <canvas id="ticket-qr-canvas" width="180" height="180"></canvas>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold ${badge.cls}">${badge.label}</span>
          <p class="text-xs text-gray-400 mt-2">현장 직원에게 이 QR을 제시해 주세요</p>
        </div>

        <!-- 탑승 정보 요약 -->
        <div class="px-5 pb-5 space-y-2 text-sm">
          <div class="flex justify-between border-b border-gray-50 pb-1.5">
            <span class="text-gray-500">탑승일자</span>
            <span class="font-semibold">${f.date || '-'}</span>
          </div>
          <div class="flex justify-between border-b border-gray-50 pb-1.5">
            <span class="text-gray-500">출발 회차</span>
            <span class="font-semibold">${f.schedule ? f.schedule + ' 출발' : '-'}</span>
          </div>
          <div class="flex justify-between border-b border-gray-50 pb-1.5">
            <span class="text-gray-500">운행 지역</span>
            <span class="font-semibold">${f.regionName || '-'}</span>
          </div>
          <div class="flex justify-between pb-1.5">
            <span class="text-gray-500">탑승인원</span>
            <span class="font-semibold">성인 ${f.adultCnt || 1}명${f.childCnt ? ' · 소아 ' + f.childCnt + '명' : ''}</span>
          </div>
          <!-- 안전 안내 -->
          <div class="mt-2 bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-xs text-cyan-800 flex items-start gap-2">
            <i class="fas fa-shield-alt text-cyan-500 mt-0.5 shrink-0"></i>
            <span>현장 직원의 <strong>안전 안내를 확인</strong>해 주세요. 탑승 20분 전 탑승장 도착 바랍니다.</span>
          </div>
          <button onclick="document.getElementById('ticket-modal').remove()"
            class="mt-2 w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            닫기
          </button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    // QR 생성 (Utils.generateQR 있으면 사용, 없으면 간단한 텍스트 표시)
    setTimeout(async () => {
      const canvas = document.getElementById('ticket-qr-canvas');
      if (!canvas) return;
      try {
        if (typeof Utils !== 'undefined' && Utils.generateQR) {
          await Utils.generateQR('ticket-qr-canvas', qrData);
        } else if (typeof QRCode !== 'undefined') {
          new QRCode(canvas, { text: qrData, width: 180, height: 180 });
        } else {
          // fallback: 텍스트 표시
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#f9fafb';
          ctx.fillRect(0, 0, 180, 180);
          ctx.fillStyle = '#374151';
          ctx.font = '11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('QR 생성 라이브러리', 90, 80);
          ctx.fillText('미로드 상태', 90, 100);
          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#1d4ed8';
          ctx.fillText(f.id, 90, 125);
        }
      } catch(e) {
        console.warn('QR 생성 오류:', e);
      }
    }, 100);
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

// ── 여행 가이드 로드/필터 ────────────────────────────────
let _guideData = [];

const _typeLabel = { daytrip:'당일치기', overnight:'1박2일', package:'패키지' };
const _regionShort = (id) => {
  const m = { tongyeong:'통영', buyeo:'부여', hapcheon:'합천' };
  if (m[id]) return m[id];
  if (id.includes('목포')) return '목포';
  return id;
};

const _renderGuideGrid = (guides) => {
  const grid = document.getElementById('guide-grid');
  if (!grid) return;
  if (!guides.length) {
    grid.innerHTML = '<div class="col-span-4 text-center py-10 text-gray-400">해당하는 가이드가 없습니다.</div>';
    return;
  }
  grid.innerHTML = guides.map(g => `
  <div class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer" onclick="Router.go('/guide/${g.id}')">
    <div class="h-44 overflow-hidden relative">
      <img src="${g.imageUrl||'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'}"
        alt="${g.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"
        onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'">
      <div class="absolute top-2 left-2 flex gap-1">
        <span class="text-xs font-bold bg-white/90 text-cyan-600 px-2 py-0.5 rounded-full">${_regionShort(g.regionId)}</span>
        <span class="text-xs font-bold px-2 py-0.5 rounded-full ${g.type==='overnight'?'bg-purple-600 text-white':'bg-cyan-500 text-white'}">${_typeLabel[g.type]||g.type}</span>
      </div>
    </div>
    <div class="p-4">
      <h3 class="font-bold text-navy-800 mb-1 text-sm leading-tight">${g.title}</h3>
      <p class="text-gray-500 text-xs mb-2 line-clamp-2">${g.description||''}</p>
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400">⏱ ${g.duration}</span>
        <div class="flex gap-1">
          ${(g.tags||[]).slice(0,2).map(t=>`<span class="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  </div>`).join('');
};

const _loadGuides = async (filterType) => {
  // 매번 서버에서 최신 가이드 목록을 가져옴 (캐시 없음)
  const res = await API.get('/api/guides');
  _guideData = res.data || [];
  const filtered = filterType === 'all' ? _guideData : _guideData.filter(g => g.type === filterType);
  _renderGuideGrid(filtered);
  // 탭 활성화
  document.querySelectorAll('.guide-tab-btn').forEach(b => {
    b.classList.remove('bg-navy-800','text-white','border-navy-800');
    b.classList.add('bg-white','text-gray-600','border-gray-200');
  });
  const activeTab = document.getElementById('guide-tab-' + filterType);
  if (activeTab) {
    activeTab.classList.remove('bg-white','text-gray-600','border-gray-200');
    activeTab.classList.add('bg-navy-800','text-white','border-navy-800');
  }
};

// 전역 노출 (onclick에서 호출)
// ── 여행 가이드 상세 페이지 ────────────────────────────────
const guideDetailPage = async (params) => {
  const guideId = params?.guideId || params?.id || '';
  const res = await API.get(`/api/guides/${guideId}/detail`);
  if (!res.success || !res.data) {
    return CustomerPages._404 ? CustomerPages._404() : '<div class="p-10 text-center text-gray-500">가이드를 찾을 수 없습니다.</div>';
  }
  const { guide, itinerary, partners, attractions } = res.data;
  const typeLabel = { daytrip:'당일치기', overnight:'1박2일', package:'패키지' };
  const typeColor = guide.type === 'overnight' ? 'bg-purple-600' : 'bg-cyan-500';
  const regionShort = (id) => {
    const m = { tongyeong:'통영', buyeo:'부여', hapcheon:'합천' };
    if (m[id]) return m[id];
    if (id.includes('목포')) return '목포';
    return id;
  };
  const partnerTypeIcon = { hotel:'🏨', pension:'🏡', restaurant:'🍽️', cafe:'☕' };
  const attrTypeIcon = { sightseeing:'🗺️', museum:'🏛️', food:'🍴', activity:'🎯' };

  setTimeout(() => Navbar.init(), 100);

  return `
${Navbar.render('home')}
<div class="min-h-screen bg-gray-50" style="padding-top:64px">

  <!-- 히어로 -->
  <div class="relative h-72 md:h-96 overflow-hidden">
    <img src="${guide.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200'}"
      alt="${guide.title}" class="w-full h-full object-cover"
      onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200'">
    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
    <div class="absolute bottom-6 left-6 right-6">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-bold bg-white/20 backdrop-blur text-white px-2 py-0.5 rounded-full">${regionShort(guide.regionId)}</span>
        <span class="text-xs font-bold text-white px-2 py-0.5 rounded-full ${typeColor}">${typeLabel[guide.type] || guide.type}</span>
        <span class="text-xs text-white/80">⏱ ${guide.duration}</span>
      </div>
      <h1 class="text-2xl md:text-3xl font-black text-white drop-shadow">${guide.title}</h1>
      <p class="text-white/80 text-sm mt-1">${guide.description || ''}</p>
    </div>
    <button onclick="history.back()" class="absolute top-4 left-4 w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/40 transition">
      <i class="fas fa-arrow-left text-sm"></i>
    </button>
  </div>

  <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">

    <!-- 태그 -->
    <div class="flex flex-wrap gap-2">
      ${(guide.tags||[]).map(t => `<span class="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full font-medium">#${t}</span>`).join('')}
    </div>

    <!-- 추천 일정 타임라인 -->
    ${itinerary.length ? `
    <div class="bg-white rounded-2xl shadow-sm p-6">
      <h2 class="text-lg font-black text-navy-800 mb-6 flex items-center gap-2">
        <span class="w-7 h-7 bg-cyan-100 text-cyan-600 rounded-lg flex items-center justify-center text-sm">📅</span>
        추천 여행 일정
      </h2>
      <div class="relative">
        <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 to-blue-200"></div>
        <div class="space-y-5">
          ${itinerary.map((item, idx) => `
          <div class="flex gap-4 relative">
            <div class="w-12 h-12 rounded-full bg-white border-2 border-cyan-400 flex items-center justify-center text-xl flex-shrink-0 z-10 shadow-sm">${item.icon}</div>
            <div class="flex-1 pt-1 pb-4 ${idx < itinerary.length-1 ? 'border-b border-gray-50' : ''}">
              <div class="text-xs font-bold text-cyan-600 mb-0.5">${item.timeLabel}</div>
              <div class="font-bold text-navy-800">${item.title}</div>
              <div class="text-gray-500 text-sm mt-0.5">${item.description || ''}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>` : ''}

    <!-- 주변 관광지 -->
    ${attractions.length ? `
    <div>
      <h2 class="text-lg font-black text-navy-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-orange-100 text-orange-500 rounded-lg flex items-center justify-center text-sm">🗺️</span>
        ${regionShort(guide.regionId)} 주요 관광지
      </h2>
      <div class="grid md:grid-cols-3 gap-4">
        ${attractions.map(a => `
        <div class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div class="h-36 overflow-hidden">
            <img src="${a.imageUrl || ''}" alt="${a.name}"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              onerror="this.parentElement.innerHTML='<div class=\"h-36 bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center text-4xl\">${attrTypeIcon[a.type]||'📍'}</div>'">
          </div>
          <div class="p-4">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-navy-800 text-sm">${a.name}</span>
              <span class="text-xs text-gray-400">${attrTypeIcon[a.type]||'📍'}</span>
            </div>
            <p class="text-gray-500 text-xs leading-relaxed mb-2">${a.description || ''}</p>
            ${a.admission ? `<div class="text-xs text-emerald-600 font-medium">💰 ${a.admission}</div>` : ''}
            ${a.tip ? `<div class="mt-1.5 text-xs bg-amber-50 text-amber-700 rounded-lg px-2 py-1">💡 ${a.tip}</div>` : ''}
          </div>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- 연계 파트너 (숙박·식당) -->
    ${partners.length ? `
    <div>
      <h2 class="text-lg font-black text-navy-800 mb-4 flex items-center gap-2">
        <span class="w-7 h-7 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm">🤝</span>
        제휴 숙박 · 식당 (수륙양용투어 예약자 할인)
      </h2>
      <div class="grid md:grid-cols-2 gap-4">
        ${partners.map(p => `
        <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">${partnerTypeIcon[p.type]||'🏢'}</div>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-navy-800 text-sm">${p.name}</div>
              <div class="text-gray-500 text-xs mt-0.5 mb-2">${p.description || ''}</div>
              ${p.discountInfo ? `<div class="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-lg">🎁 ${p.discountInfo}</div>` : ''}
              <div class="flex items-center gap-3 mt-2">
                ${p.phone ? `<a href="tel:${p.phone}" class="text-xs text-blue-600 flex items-center gap-1"><i class="fas fa-phone text-xs"></i> ${p.phone}</a>` : ''}
                ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" class="text-xs text-cyan-600 flex items-center gap-1"><i class="fas fa-external-link-alt text-xs"></i> 예약하기</a>` : ''}
              </div>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- 예약 CTA -->
    <div class="bg-gradient-to-r from-navy-800 to-blue-700 rounded-2xl p-8 text-center text-white">
      <div class="text-2xl mb-2">🚌</div>
      <h3 class="text-xl font-black mb-2">${regionShort(guide.regionId)} 수륙양용버스 지금 예약하기</h3>
      <p class="text-white/70 text-sm mb-5">온라인 예약 시 현장보다 빠른 탑승 가능</p>
      <button onclick="Router.go('/reservation/${guide.regionId}')"
        class="bg-white text-navy-800 font-black px-8 py-3 rounded-xl hover:bg-cyan-50 transition-colors text-sm">
        예약하러 가기 →
      </button>
    </div>

  </div>
</div>
${Footer.render()}`;
};

// CustomerPages에 guideDetail 추가
CustomerPages.guideDetail = guideDetailPage;

window.CustomerModule = {
  filterGuides: (type) => {
    _loadGuides(type).catch(e => console.error('[guide]', e));
  }
};

window.CustomerPages = CustomerPages;
