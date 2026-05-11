// ============================================================
// SEO MODULE - FAQ / 관광 콘텐츠 / SEO 지원
// 아쿠아모빌리티코리아 통합 플랫폼
// ============================================================

const SeoModule = (() => {

  // ── 공통 FAQ 데이터 ────────────────────────────────────────
  const COMMON_FAQ = [
    {
      category: '예약',
      items: [
        { q: '예약은 어떻게 하나요?', a: '홈페이지에서 원하는 지역을 선택한 후, 날짜·회차·인원을 선택하고 온라인 탑승신고서를 작성하면 됩니다. 결제 완료 후 QR 티켓이 발급됩니다.' },
        { q: '예약 후 취소·환불은 어떻게 하나요?', a: '출발 7일 전까지는 전액 환불, 3~6일 전 20% 위약금, 1~2일 전 30% 위약금이 발생합니다. 출발 당일은 환불이 불가합니다. 예약확인 페이지에서 직접 취소할 수 있습니다.' },
        { q: '예약 번호를 분실했어요.', a: '예약 시 입력한 연락처로 "예약 조회" 페이지에서 확인하실 수 있습니다. 예약 확정 시 발송된 SMS/이메일에서도 확인 가능합니다.' },
        { q: '단체 예약은 어떻게 하나요?', a: '20인 이상 단체 예약은 고객센터(전화·이메일)로 문의 주시면 단체 할인가와 전용 좌석 배정을 안내해 드립니다.' },
        { q: '대기 예약이 무엇인가요?', a: '원하는 날짜·회차가 매진된 경우 대기자 명단에 등록할 수 있습니다. 취소 발생 시 자동으로 예약이 전환되며 SMS로 알려드립니다.' },
      ],
    },
    {
      category: '탑승',
      items: [
        { q: '탑승 당일 어떻게 해야 하나요?', a: '출발 20분 전 탑승 장소에 도착하여 현장 직원에게 QR 티켓을 보여주세요. 스캔 후 손목밴드를 수령하고 안전교육을 받으신 후 탑승합니다.' },
        { q: '손목밴드는 왜 발급하나요?', a: '탑승 확인 및 안전 관리를 위한 것입니다. 손목밴드에는 개인 정보(성명·연락처·생년월일)는 일절 기재되지 않으며, 예약ID와 QR코드만 포함됩니다.' },
        { q: '현장에서 바로 구매할 수 있나요?', a: '네, 현장 매표소에서 직접 구매 가능합니다. 단, 현장 판매석은 전체의 20~30%이며 성수기에는 조기 매진될 수 있어 사전 예약을 권장합니다.' },
        { q: '어린이·유아도 탑승 가능한가요?', a: '36개월 미만 유아는 무료이며, 보호자 동반 시 탑승 가능합니다. 어린이는 보호자와 함께 탑승하며 안전벨트를 반드시 착용해야 합니다.' },
        { q: '임산부나 노약자도 탑승할 수 있나요?', a: '임산부·심장질환·고혈압·멀미 심한 분은 안전을 위해 탑승을 자제하시길 권고합니다. 의문이 있으시면 출발 전 직원에게 상담해 주세요.' },
      ],
    },
    {
      category: '결제',
      items: [
        { q: '어떤 결제 수단을 사용할 수 있나요?', a: '신용·체크카드, 카카오페이, 네이버페이, 토스페이, 가상계좌, 계좌이체 등 다양한 방법으로 결제 가능합니다.' },
        { q: '결제 영수증은 어떻게 받나요?', a: '결제 완료 시 입력한 이메일로 영수증이 발송됩니다. "예약 조회" 페이지에서도 출력 가능합니다.' },
        { q: '세금계산서 발급이 가능한가요?', a: '사업자 고객의 경우 예약 후 고객센터로 문의하시면 세금계산서를 발급해 드립니다.' },
        { q: '각 지역 결제가 별도 법인으로 처리되나요?', a: '네, 맞습니다. 아쿠아모빌리티코리아는 각 지역 운영 법인이 독립적으로 결제를 처리합니다. 카드 명세서에는 각 지역 법인명이 표시됩니다.' },
      ],
    },
    {
      category: '운영',
      items: [
        { q: '날씨가 나쁠 때도 운행하나요?', a: '기상 악화(강풍·폭우·안개·해무 등) 시 안전을 위해 운행이 중단될 수 있습니다. 운행 취소 시 예약자에게 SMS로 즉시 통보하며 전액 환불됩니다.' },
        { q: '소요 시간은 얼마나 걸리나요?', a: '지역에 따라 다르며, 통영은 약 70분, 부여는 약 60분, 합천은 약 65분입니다. 탑승 전 안전교육·대기 시간 포함 총 90분 정도를 여유있게 잡으시기 바랍니다.' },
        { q: '주차는 가능한가요?', a: '각 출발지 인근에 공영주차장이 마련되어 있습니다. 지역별 상세 주차 안내는 각 지역 예약 페이지에서 확인하실 수 있습니다.' },
        { q: '반려동물을 동반할 수 있나요?', a: '안전 및 위생상 이유로 반려동물 동반은 불가합니다. 단, 장애인 보조견은 허용됩니다.' },
      ],
    },
  ];

  // ── 관광 콘텐츠 데이터 ─────────────────────────────────────
  const TOUR_CONTENT = {
    'buyeo-daytrip': {
      title: '부여 당일치기 완전정복 | 백제문화 + 수륙양용투어',
      description: '부여 수륙양용투어와 함께하는 당일치기 여행 코스. 백제 역사 유적과 금강의 절경을 하루에 즐기는 최적 동선을 소개합니다.',
      regionId: 'buyeo',
      heroImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200',
      readTime: '5분',
      tags: ['부여여행', '수륙양용', '백제문화', '당일치기', '가족여행'],
      sections: [
        { heading: '부여 수륙양용투어란?', body: '충남 부여는 백제의 마지막 수도로, 금강과 백마강이 만나는 독특한 지형을 자랑합니다. 아쿠아모빌리티 부여 투어는 육상 주행으로 부여 시내 문화유적을 둘러본 뒤, 구드래 나루터에서 금강으로 입수하는 스릴 넘치는 수상 구간을 경험합니다. 약 60분 코스로 어른도 아이도 모두 즐길 수 있는 체험형 관광입니다.' },
        { heading: '추천 당일치기 코스', body: '09:00 서울/대전 출발 → 11:00 부여 도착, 구드래 나루터 → 11:30 수륙양용투어 탑승 (1회차) → 13:00 점심 - 연잎밥 전문점 or 굿뜨래 시장 → 14:00 국립부여박물관 (국보 관람) → 15:30 궁남지 산책 → 16:30 부소산성·낙화암 트레킹 → 18:00 귀가' },
        { heading: '수륙양용 탑승 팁', body: '부여 투어는 오전 10시, 오후 1시, 오후 3시 30분 3회 운행합니다. 성수기(7~8월, 연휴)에는 최소 1주일 전 예약 필수! 현장 판매석은 30%로 제한되어 있어 오전 이른 시간에 매진될 수 있습니다. 탑승 후 손목밴드를 수령하고, 투어 중에는 핸드폰·카메라 방수 케이스를 꼭 준비하세요.' },
        { heading: '주변 함께 가볼 곳', body: '■ 정림사지 5층 석탑 (국보 9호): 백제 멸망의 역사가 새겨진 천년의 탑\n■ 능산리 고분군: 유네스코 세계유산 백제왕릉원\n■ 백제문화단지: 백제 사비시대 왕궁 복원\n■ 궁남지: 우리나라 최초의 인공 연못, 연꽃 축제 명소' },
      ],
    },
    'tongyeong-ocean': {
      title: '통영 수륙양용투어 완벽 가이드 | 한려해상 절경 탐방',
      description: '아름다운 통영 한려해상국립공원을 수륙양용버스로 즐기는 특별한 경험. 예약 방법부터 주변 맛집·관광지까지 총정리.',
      regionId: 'tongyeong',
      heroImage: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
      readTime: '6분',
      tags: ['통영여행', '수륙양용', '한려해상', '해양관광', '1박2일'],
      sections: [
        { heading: '통영 수륙양용투어 소개', body: '경남 통영은 "동양의 나폴리"라 불리는 항구 도시로, 한려해상국립공원의 수많은 섬과 청정 바다가 펼쳐집니다. 아쿠아모빌리티 통영 투어는 도남관광단지 선착장에서 출발하여 통영 항구를 육로로 탐방한 뒤 바다로 입수, 미륵도와 한산도 앞바다를 수상에서 감상하는 70분 코스입니다.' },
        { heading: '1박2일 추천 코스', body: '[1일차]\n09:00 서울 출발 → 13:00 통영 도착\n13:30 케이블카 탑승 (미륵산 조망)\n15:30 수륙양용투어 (오후 3시 30분 회차)\n17:30 통영 중앙시장 - 꿀빵·충무김밥·해산물\n저녁: 강구안 문화마당 야경\n\n[2일차]\n09:00 통영 수산시장 아침 해산물\n10:00 수륙양용투어 (오전 10시 회차) → 재탑승 할인 적용\n12:00 점심 후 귀가' },
        { heading: '통영 수륙양용 탑승 팁', body: '통영 투어는 오전 10시, 오후 12시, 오후 2시, 오후 3시 30분, 오후 5시 총 5회 운행합니다 (시즌별 변동). 오후 3시 30분 회차는 낙조 감상으로 인기가 높아 3일 전부터 매진됩니다. 멀미 우려가 있으신 분은 오전 잔잔한 시간대를 권장합니다.' },
        { heading: '주변 함께 가볼 곳', body: '■ 통영 케이블카: 미륵산 정상에서 한려해상 파노라마 감상\n■ 동피랑 벽화마을: 좁은 골목 감성 사진 명소\n■ 한산도 이충무공 유적: 이순신 장군의 역사 현장\n■ 통영 중앙시장: 꿀빵·도다리쑥국·멍게비빔밥 필수' },
      ],
    },
    'hapcheon-lake': {
      title: '합천 수륙양용투어 가이드 | 합천호 내륙 바다 체험',
      description: '경남 합천호의 비경을 수륙양용버스로 탐방하는 국내 유일 내륙 호수 수륙양용 투어. 해인사·황매산과 함께 즐기는 합천 여행 가이드.',
      regionId: 'hapcheon',
      heroImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
      readTime: '5분',
      tags: ['합천여행', '수륙양용', '합천호', '해인사', '내륙바다'],
      sections: [
        { heading: '합천 수륙양용투어 소개', body: '합천 영상테마파크 인근에 위치한 합천호는 황강이 만든 아름다운 내륙 호수입니다. 아쿠아모빌리티 합천 투어는 합천호 주변 육상을 달린 뒤 호수로 입수하여 65분 동안 합천호의 비경을 즐기는 국내 유일의 내륙 호수 수륙양용 코스입니다.' },
        { heading: '추천 코스', body: '09:00 대구/부산 출발 → 11:00 합천 도착\n11:30 합천 수륙양용투어 (11시 30분 회차)\n13:00 합천 황강 주변 점심 (메기매운탕·은어회)\n14:30 해인사 방문 (팔만대장경 관람)\n16:30 황매산 자락 드라이브\n17:30 귀가' },
        { heading: '합천 수륙양용 탑승 팁', body: '합천 투어는 오전 10시, 오전 11시 30분, 오후 1시 30분, 오후 3시 총 4회 운행합니다. 가을(10~11월) 단풍 시즌에는 합천호 수면 위 단풍 감상으로 특히 인기! 저렴한 요금과 한적한 분위기를 원한다면 주중 이용을 추천합니다.' },
        { heading: '주변 함께 가볼 곳', body: '■ 해인사: 팔만대장경 봉안, 세계문화유산\n■ 황매산 철쭉: 5월 철쭉 군락지 (100만 평)\n■ 합천 영상테마파크: 1960~70년대 세트장\n■ 합천댐: 합천호 전경 조망 포인트' },
      ],
    },
  };

  // ── 콘텐츠 목록 ───────────────────────────────────────────
  const CONTENT_LIST = [
    { slug: 'buyeo-daytrip', regionId: 'buyeo', label: '부여', title: '부여 당일치기 완전정복', thumb: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600', tags: ['부여','당일치기','백제'] },
    { slug: 'tongyeong-ocean', regionId: 'tongyeong', label: '통영', title: '통영 해양투어 완벽 가이드', thumb: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600', tags: ['통영','해양','1박2일'] },
    { slug: 'hapcheon-lake', regionId: 'hapcheon', label: '합천', title: '합천호 내륙 바다 체험', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', tags: ['합천','호수','해인사'] },
  ];

  // ── 공통 페이지 헤더/푸터 ──────────────────────────────────
  const renderBreadcrumb = (items) => `
    <nav aria-label="breadcrumb" class="text-xs text-gray-500 mb-4 flex items-center gap-1 flex-wrap">
      ${items.map((b, i) => `
        ${i > 0 ? '<i class="fas fa-chevron-right text-gray-300 text-xs"></i>' : ''}
        ${b.href ? `<a href="${b.href}" onclick="Router.go('${b.href}');return false;" class="hover:text-blue-600 transition-colors">${b.label}</a>` : `<span class="text-gray-800 font-medium">${b.label}</span>`}
      `).join('')}
    </nav>
  `;

  // ── FAQ 페이지 ─────────────────────────────────────────────
  const faqPage = async () => {
    const regionSeo = window.REGION_SEO || {};
    // 지역별 FAQ 수집
    const regionFaqs = Object.entries(regionSeo).map(([id, seo]) => ({
      regionId: id,
      regionName: (window.REGIONS||[]).find(r=>r.id===id)?.name || id,
      items: seo.faq || [],
    })).filter(r => r.items.length > 0);

    const allCategoryHtml = COMMON_FAQ.map((cat, catIdx) => `
      <div class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span class="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">${catIdx+1}</span>
          ${cat.category}
        </h2>
        <div class="space-y-2" id="faq-cat-${catIdx}">
          ${cat.items.map((item, itemIdx) => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden faq-item">
              <button
                onclick="SeoModule.toggleFaq('faq-${catIdx}-${itemIdx}')"
                class="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                aria-expanded="false"
                id="faq-btn-${catIdx}-${itemIdx}">
                <span class="font-medium text-gray-800 text-sm">${item.q}</span>
                <i class="fas fa-plus text-blue-500 flex-shrink-0 transition-transform duration-200" id="faq-icon-${catIdx}-${itemIdx}"></i>
              </button>
              <div class="faq-answer hidden px-5 pb-4" id="faq-${catIdx}-${itemIdx}">
                <div class="border-t border-gray-100 pt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">${item.a}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    const regionFaqHtml = regionFaqs.map((rf, rfIdx) => `
      <div class="mb-6">
        <h2 class="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span class="px-2 py-0.5 bg-ocean-100 text-ocean-700 rounded-full text-xs font-medium" style="background:#e0f7fa;color:#006064;">${rf.regionName}</span>
          지역별 FAQ
        </h2>
        <div class="space-y-2">
          ${rf.items.map((item, idx) => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onclick="SeoModule.toggleFaq('rfaq-${rfIdx}-${idx}')"
                class="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                <span class="font-medium text-gray-800 text-sm">${item.q}</span>
                <i class="fas fa-plus text-blue-500 flex-shrink-0" id="faq-icon-rfaq-${rfIdx}-${idx}"></i>
              </button>
              <div class="faq-answer hidden px-5 pb-4" id="rfaq-${rfIdx}-${idx}">
                <div class="border-t border-gray-100 pt-3 text-sm text-gray-600 leading-relaxed">${item.a}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    return `
      <div class="min-h-screen bg-gray-50">
        ${Navbar.render('faq')}
        <div class="max-w-3xl mx-auto px-4 py-10">
          ${renderBreadcrumb([{label:'홈',href:'/'},{label:'자주 묻는 질문'}])}

          <div class="text-center mb-10">
            <h1 class="text-3xl font-bold text-gray-900 mb-3">자주 묻는 질문</h1>
            <p class="text-gray-500 text-base">수륙양용 투어에 대해 궁금한 점을 모아놓았습니다.</p>
          </div>

          <!-- 검색 -->
          <div class="relative mb-8">
            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="text" id="faq-search" placeholder="질문 검색..."
              oninput="SeoModule.searchFaq(this.value)"
              class="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
          </div>

          <!-- 카테고리 필터 -->
          <div class="flex gap-2 mb-8 overflow-x-auto pb-1">
            <button onclick="SeoModule.filterFaqCat('all')" id="faq-filter-all"
              class="faq-filter whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium bg-blue-600 text-white">전체</button>
            ${COMMON_FAQ.map(cat => `
              <button onclick="SeoModule.filterFaqCat('${cat.category}')"
                class="faq-filter whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
                ${cat.category}
              </button>
            `).join('')}
            <button onclick="SeoModule.filterFaqCat('지역별')"
              class="faq-filter whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">지역별</button>
          </div>

          <!-- FAQ 목록 -->
          <div id="faq-list">
            ${allCategoryHtml}
            ${regionFaqHtml}
          </div>

          <!-- 더 궁금한 점 -->
          <div class="mt-12 bg-blue-50 rounded-2xl p-8 text-center">
            <i class="fas fa-headset text-blue-400 text-4xl mb-3"></i>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">답변을 찾지 못하셨나요?</h3>
            <p class="text-gray-500 text-sm mb-4">1:1 문의를 남겨주시면 빠르게 답변드리겠습니다.</p>
            <button onclick="Router.go('/inquiry')" class="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              <i class="fas fa-envelope mr-2"></i>1:1 문의하기
            </button>
          </div>
        </div>
        ${Footer.render()}
      </div>
    `;
  };

  const toggleFaq = (id) => {
    const panel = document.getElementById(id);
    if (!panel) return;
    const isOpen = !panel.classList.contains('hidden');
    // 모두 닫기 (옵션: 아코디언)
    // document.querySelectorAll('.faq-answer').forEach(p => { p.classList.add('hidden'); });
    if (isOpen) {
      panel.classList.add('hidden');
    } else {
      panel.classList.remove('hidden');
    }
    // 아이콘 변경
    const iconId = id.replace('faq-', 'faq-icon-');
    const icon = document.getElementById(iconId) || panel.previousElementSibling?.querySelector('i.fas');
    if (icon) {
      icon.classList.toggle('fa-plus', isOpen);
      icon.classList.toggle('fa-minus', !isOpen);
      icon.style.transform = !isOpen ? 'rotate(45deg)' : '';
    }
  };

  const searchFaq = (query) => {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('.faq-item').forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = !q || text.includes(q) ? '' : 'none';
    });
  };

  const filterFaqCat = (cat) => {
    // 필터 버튼 스타일
    document.querySelectorAll('.faq-filter').forEach(b => {
      b.classList.remove('bg-blue-600','text-white');
      b.classList.add('bg-gray-100','text-gray-600');
    });
    event?.target?.classList.add('bg-blue-600','text-white');
    event?.target?.classList.remove('bg-gray-100','text-gray-600');

    // 섹션 표시/숨김
    const sections = document.querySelectorAll('#faq-list > div');
    sections.forEach((sec, i) => {
      if (cat === 'all') { sec.style.display = ''; return; }
      const heading = sec.querySelector('h2')?.textContent?.trim() || '';
      if (cat === '지역별') { sec.style.display = heading.includes('지역별') ? '' : 'none'; }
      else { sec.style.display = heading.includes(cat) ? '' : 'none'; }
    });
  };

  // ── 관광 콘텐츠 목록 페이지 ───────────────────────────────
  const contentListPage = async () => {
    const cards = CONTENT_LIST.map(c => `
      <article class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
        onclick="Router.go('/content/${c.slug}')">
        <div class="relative overflow-hidden h-48">
          <img src="${c.thumb}" alt="${c.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
          <div class="absolute top-3 left-3">
            <span class="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">${c.label}</span>
          </div>
        </div>
        <div class="p-5">
          <h2 class="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">${c.title}</h2>
          <div class="flex flex-wrap gap-1.5 mt-3">
            ${c.tags.map(t=>`<span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">#${t}</span>`).join('')}
          </div>
          <div class="mt-3 flex items-center gap-2 text-blue-600 text-sm font-medium">
            <span>자세히 보기</span><i class="fas fa-arrow-right text-xs"></i>
          </div>
        </div>
      </article>
    `).join('');

    return `
      <div class="min-h-screen bg-gray-50">
        ${Navbar.render()}
        <div class="max-w-5xl mx-auto px-4 py-10">
          ${renderBreadcrumb([{label:'홈',href:'/'},{label:'여행 정보'}])}
          <div class="text-center mb-10">
            <h1 class="text-3xl font-bold text-gray-900 mb-3">수륙양용 여행 가이드</h1>
            <p class="text-gray-500">지역별 여행 코스, 팁, 주변 볼거리를 소개합니다.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">${cards}</div>
        </div>
        ${Footer.render()}
      </div>
    `;
  };

  // ── 관광 콘텐츠 상세 페이지 ───────────────────────────────
  const contentDetailPage = async (params) => {
    const slug = params?.slug || params?.['*'] || '';
    const content = TOUR_CONTENT[slug];
    if (!content) {
      return `
        <div class="min-h-screen bg-gray-50">
          ${Navbar.render()}
          <div class="max-w-3xl mx-auto px-4 py-20 text-center">
            <i class="fas fa-map-signs text-gray-300 text-6xl mb-6"></i>
            <h1 class="text-2xl font-bold text-gray-800 mb-3">콘텐츠를 찾을 수 없습니다</h1>
            <p class="text-gray-500 mb-6">요청하신 여행 가이드가 존재하지 않습니다.</p>
            <button onclick="Router.go('/content')" class="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm hover:bg-blue-700">
              여행 가이드 목록으로
            </button>
          </div>
          ${Footer.render()}
        </div>
      `;
    }

    const region = (window.REGIONS||[]).find(r=>r.id===content.regionId);
    const sectionsHtml = content.sections.map((sec, i) => `
      <section class="mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span class="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm flex-shrink-0">${i+1}</span>
          ${sec.heading}
        </h2>
        <p class="text-gray-700 leading-relaxed whitespace-pre-line">${sec.body}</p>
      </section>
    `).join('');

    const relatedContent = CONTENT_LIST.filter(c => c.slug !== slug).slice(0, 2);
    const relatedHtml = relatedContent.map(c => `
      <div class="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors"
        onclick="Router.go('/content/${c.slug}')">
        <img src="${c.thumb}" alt="${c.title}" class="w-20 h-16 object-cover rounded-lg flex-shrink-0" loading="lazy">
        <div>
          <p class="text-sm font-medium text-gray-800 line-clamp-2">${c.title}</p>
          <div class="flex gap-1 mt-1 flex-wrap">
            ${c.tags.slice(0,2).map(t=>`<span class="text-xs text-gray-400">#${t}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="min-h-screen bg-gray-50">
        ${Navbar.render()}

        <!-- 히어로 -->
        <div class="relative h-72 md:h-96 overflow-hidden">
          <img src="${content.heroImage}" alt="${content.title}" class="w-full h-full object-cover" loading="eager">
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-6 max-w-4xl mx-auto">
            <div class="flex flex-wrap gap-1.5 mb-3">
              ${content.tags.map(t=>`<span class="px-2 py-0.5 bg-white/20 backdrop-blur text-white text-xs rounded-full">#${t}</span>`).join('')}
            </div>
            <h1 class="text-2xl md:text-3xl font-bold text-white">${content.title}</h1>
            <p class="text-white/80 text-sm mt-2 flex items-center gap-3">
              <span><i class="fas fa-clock mr-1"></i>읽는 시간: ${content.readTime}</span>
              ${region ? `<span><i class="fas fa-map-marker-alt mr-1"></i>${region.location || region.name}</span>` : ''}
            </p>
          </div>
        </div>

        <!-- 본문 -->
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="flex gap-8">
            <!-- 메인 콘텐츠 -->
            <main class="flex-1 min-w-0">
              ${renderBreadcrumb([{label:'홈',href:'/'},{label:'여행 가이드',href:'/content'},{label:content.title}])}

              <div class="bg-blue-50 rounded-xl p-4 mb-8 text-sm text-blue-800">
                <i class="fas fa-info-circle mr-2"></i>${content.description}
              </div>

              ${sectionsHtml}

              <!-- CTA -->
              <div class="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white text-center mt-10">
                <h3 class="text-xl font-bold mb-2">${region?.name || ''} 수륙양용투어 예약하기</h3>
                <p class="text-blue-100 text-sm mb-4">지금 바로 예약하고 특별한 경험을 만들어보세요!</p>
                <button onclick="Router.go('/reservation/${content.regionId}')"
                  class="bg-white text-blue-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
                  <i class="fas fa-ticket-alt mr-2"></i>예약하기
                </button>
              </div>
            </main>

            <!-- 사이드바 -->
            <aside class="hidden lg:block w-64 flex-shrink-0">
              <div class="sticky top-4 space-y-4">
                <!-- 빠른 예약 -->
                <div class="bg-white rounded-2xl shadow-sm p-5 border">
                  <h3 class="font-semibold text-gray-800 mb-3 text-sm">빠른 예약</h3>
                  ${region ? `
                    <div class="space-y-2 text-xs text-gray-600 mb-3">
                      <p><i class="fas fa-map-marker-alt text-blue-400 mr-1.5"></i>${region.location}</p>
                      <p><i class="fas fa-phone text-green-400 mr-1.5"></i>${region.customerService}</p>
                      <p><i class="fas fa-won-sign text-purple-400 mr-1.5"></i>성인 ₩${(region.fares?.[0]?.price||30000).toLocaleString()}~</p>
                    </div>
                    <button onclick="Router.go('/reservation/${content.regionId}')"
                      class="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                      <i class="fas fa-calendar-alt mr-1.5"></i>날짜 선택
                    </button>
                  ` : ''}
                </div>

                <!-- 관련 콘텐츠 -->
                <div class="bg-white rounded-2xl shadow-sm p-5 border">
                  <h3 class="font-semibold text-gray-800 mb-3 text-sm">다른 여행 가이드</h3>
                  <div class="space-y-3">${relatedHtml}</div>
                </div>

                <!-- SNS 공유 -->
                <div class="bg-white rounded-2xl shadow-sm p-5 border">
                  <h3 class="font-semibold text-gray-800 mb-3 text-sm">공유하기</h3>
                  <div class="flex gap-2">
                    <button onclick="SeoModule.share('kakao')" class="flex-1 py-2 bg-yellow-400 text-gray-800 rounded-lg text-xs font-medium hover:bg-yellow-500">
                      <i class="fas fa-comment mr-1"></i>카카오
                    </button>
                    <button onclick="SeoModule.share('naver')" class="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">
                      <i class="fas fa-blog mr-1"></i>블로그
                    </button>
                    <button onclick="SeoModule.share('copy')" class="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
                      <i class="fas fa-link mr-1"></i>복사
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <!-- 모바일 CTA -->
          <div class="lg:hidden mt-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-5 text-white text-center">
            <p class="font-semibold mb-2">${region?.name || ''} 수륙양용투어 예약</p>
            <button onclick="Router.go('/reservation/${content.regionId}')"
              class="bg-white text-blue-600 font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-50">
              예약하기
            </button>
          </div>
        </div>

        ${Footer.render()}
      </div>
    `;
  };

  const share = (type) => {
    const url = window.location.href;
    const title = document.title;
    if (type === 'copy') {
      navigator.clipboard?.writeText(url).then(() => Utils.toast('링크가 복사되었습니다!', 'success'))
        .catch(() => Utils.toast('복사 실패. 주소창에서 직접 복사해주세요.', 'error'));
    } else if (type === 'kakao') {
      Utils.toast('카카오톡 공유 (카카오 SDK 연동 필요)', 'info');
    } else if (type === 'naver') {
      window.open(`https://share.naver.com/web/shareView?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`);
    }
  };

  // ── 사이트맵 안내 페이지 ───────────────────────────────────
  const sitemapPage = async () => {
    const regions = (window.REGIONS||[]).filter(r=>r.status==='active');

    const regionLinks = regions.map(r => `
      <li>
        <a href="/reservation/${r.id}" onclick="Router.go('/reservation/${r.id}');return false;"
          class="text-blue-600 hover:underline text-sm">${r.name} 예약</a>
        <span class="text-gray-300 mx-2">|</span>
        <a href="/content/${r.id}-daytrip" onclick="Router.go('/content/${r.id}-daytrip');return false;"
          class="text-blue-600 hover:underline text-sm">${r.shortName||r.name} 여행 가이드</a>
      </li>
    `).join('');

    return `
      <div class="min-h-screen bg-gray-50">
        ${Navbar.render()}
        <div class="max-w-3xl mx-auto px-4 py-10">
          <h1 class="text-2xl font-bold text-gray-900 mb-8">사이트맵</h1>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">고객 서비스</h2>
              <ul class="space-y-2">
                ${[
                  {href:'/',label:'홈'},
                  {href:'/reservation',label:'투어 예약 허브'},
                  {href:'/booking-check',label:'예약 확인/취소'},
                  {href:'/faq',label:'자주 묻는 질문'},
                  {href:'/inquiry',label:'1:1 문의'},
                  {href:'/notice',label:'공지사항'},
                ].map(l=>`<li><a href="${l.href}" onclick="Router.go('${l.href}');return false;" class="text-blue-600 hover:underline text-sm">${l.label}</a></li>`).join('')}
              </ul>
            </div>
            <div>
              <h2 class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">지역별 투어</h2>
              <ul class="space-y-2">${regionLinks}</ul>
            </div>
            <div>
              <h2 class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">여행 정보</h2>
              <ul class="space-y-2">
                <li><a href="/content" onclick="Router.go('/content');return false;" class="text-blue-600 hover:underline text-sm">여행 가이드 전체</a></li>
                ${CONTENT_LIST.map(c=>`<li><a href="/content/${c.slug}" onclick="Router.go('/content/${c.slug}');return false;" class="text-blue-600 hover:underline text-sm">${c.title}</a></li>`).join('')}
              </ul>
            </div>
            <div>
              <h2 class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">법적 고지</h2>
              <ul class="space-y-2">
                ${[
                  {href:'/terms/service',label:'이용약관'},
                  {href:'/terms/privacy',label:'개인정보처리방침'},
                  {href:'/terms/refund',label:'환불 정책'},
                  {href:'/terms/safety',label:'안전 수칙'},
                ].map(l=>`<li><a href="${l.href}" onclick="Router.go('${l.href}');return false;" class="text-blue-600 hover:underline text-sm">${l.label}</a></li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
        ${Footer.render()}
      </div>
    `;
  };

  // ── 약관 페이지 ────────────────────────────────────────────
  const termsPage = async (params) => {
    const type = params?.type || 'service';
    const typeMap = {
      service: { label: '이용약관', key: 'serviceTerms' },
      privacy: { label: '개인정보처리방침', key: 'privacyPolicy' },
      refund:  { label: '환불 정책', key: 'refundPolicy' },
      safety:  { label: '안전 수칙', key: 'safetyRules' },
    };
    const info = typeMap[type] || typeMap.service;
    const terms = Settings.get('terms') || {};
    const content = terms[info.key] || getDefaultTerms(info.key);

    const tabBtns = Object.entries(typeMap).map(([k, v]) => `
      <button onclick="Router.go('/terms/${k}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${k===type?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
        ${v.label}
      </button>
    `).join('');

    return `
      <div class="min-h-screen bg-gray-50">
        ${Navbar.render()}
        <div class="max-w-3xl mx-auto px-4 py-10">
          ${renderBreadcrumb([{label:'홈',href:'/'},{label:info.label}])}
          <h1 class="text-2xl font-bold text-gray-900 mb-6">${info.label}</h1>
          <div class="flex gap-2 flex-wrap mb-6">${tabBtns}</div>
          <div class="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <div class="text-xs text-gray-400 mb-4">최종 업데이트: 2025년 5월 1일</div>
            <div class="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">${content}</div>
          </div>
        </div>
        ${Footer.render()}
      </div>
    `;
  };

  const getDefaultTerms = (key) => {
    const defaults = {
      refundPolicy: '【환불 규정】\n\n▶ 출발 7일 전 취소: 전액 환불\n▶ 출발 3~6일 전: 결제금액의 20% 위약금\n▶ 출발 1~2일 전: 결제금액의 30% 위약금\n▶ 출발 당일: 환불 불가\n▶ 천재지변·운항불가: 전액 환불\n\n현장 구매 티켓은 현장에서만 환불 처리됩니다.',
      safetyRules: '【안전 수칙】\n\n1. 탑승 전 안전벨트를 반드시 착용하세요.\n2. 투어 중 창문 밖으로 손이나 머리를 내밀지 마세요.\n3. 음식물 반입 및 흡연은 금지됩니다.\n4. 임산부, 심장·고혈압 환자는 탑승 전 직원에게 문의하세요.',
      privacyPolicy: '【개인정보처리방침】\n\n수집 항목: 성명, 연락처, 이메일\n수집 목적: 예약 및 탑승 확인\n보유 기간: 3년 (관련 법령에 따름)\n제3자 제공: 없음 (법령 근거 시 예외)',
      serviceTerms: '【서비스 이용약관】\n\n제1조 (목적)\n이 약관은 아쿠아모빌리티코리아가 제공하는 수륙양용투어 온라인 예약 서비스 이용에 관한 기본 사항을 규정합니다.\n\n제2조 (이용자 의무)\n이용자는 본인의 예약 정보를 정확히 입력해야 하며, 부정 예약 시 예약이 취소될 수 있습니다.',
    };
    return defaults[key] || '';
  };

  // ── JSON-LD 구조화 데이터 삽입 헬퍼 ───────────────────────
  const injectFaqSchema = (faqItems) => {
    const existing = document.getElementById('faq-jsonld');
    if (existing) existing.remove();
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  };

  const injectBreadcrumbSchema = (items) => {
    const existing = document.getElementById('breadcrumb-jsonld');
    if (existing) existing.remove();
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.label,
        item: item.href ? (window.SEO_CONFIG?.siteUrl || '') + item.href : undefined,
      })).filter(i => i.item),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'breadcrumb-jsonld';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  };

  // FAQ 페이지 후처리: 구조화 데이터 삽입
  const afterFaqPage = () => {
    const allItems = COMMON_FAQ.flatMap(cat => cat.items);
    injectFaqSchema(allItems);
    injectBreadcrumbSchema([
      { label: '홈', href: '/' },
      { label: '자주 묻는 질문', href: '/faq' },
    ]);
  };

  // 콘텐츠 상세 페이지 후처리
  const afterContentPage = (slug) => {
    const content = TOUR_CONTENT[slug];
    if (!content) return;
    injectBreadcrumbSchema([
      { label: '홈', href: '/' },
      { label: '여행 가이드', href: '/content' },
      { label: content.title, href: `/content/${slug}` },
    ]);
  };

  return {
    // 페이지
    faqPage, contentListPage, contentDetailPage, sitemapPage, termsPage,
    // 인터랙션
    toggleFaq, searchFaq, filterFaqCat, share,
    // 스키마 주입
    injectFaqSchema, injectBreadcrumbSchema, afterFaqPage, afterContentPage,
  };
})();

window.SeoModule = SeoModule;
