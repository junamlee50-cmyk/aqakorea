// ============================================================
// ADMIN MODULE - 관리자 대시보드 전체
// 아쿠아모빌리티코리아 통합 플랫폼
// ============================================================

const AdminModule = (() => {

  // ── 관리자 상태 ────────────────────────────────────────────
  let _adminState = {
    loggedIn: false,
    user: null,
    currentSection: 'dashboard',
    selectedRegion: null,
    fareApprovals: [],
    pendingChanges: {},
    sidebarCollapsed: false,
    mobileOpen: false,
  };

  // ── 데모 계정 목록 ──────────────────────────────────────────
  const DEMO_ACCOUNTS = [
    { id:'admin',      pw:'admin1234',      name:'본사 슈퍼관리자', role:'super',      regionId:null },
    { id:'tongyeong',  pw:'tongyeong1234',  name:'통영지역관리자',  role:'regional',   regionId:'tongyeong', regionName:'통영해양관광' },
    { id:'buyeo',      pw:'buyeo1234',      name:'부여지역관리자',  role:'regional',   regionId:'buyeo',      regionName:'부여수륙양용투어' },
    { id:'hapcheon',   pw:'hapcheon1234',   name:'합천지역관리자',  role:'regional',   regionId:'hapcheon' },
    { id:'field01',    pw:'field1234',      name:'현장매표소',      role:'staff',      regionId:'tongyeong' },
    { id:'account',    pw:'account1234',    name:'회계담당자',      role:'accountant', regionId:null },
    { id:'content',    pw:'cont1234',       name:'콘텐츠담당자',    role:'content',    regionId:null },
    { id:'partner',    pw:'part1234',       name:'여행사파트너',    role:'partner',    regionId:null },
  ];

  // ── 접속 로그 ──────────────────────────────────────────────
  const _addAccessLog = (userId, action) => {
    const logs = JSON.parse(sessionStorage.getItem('amk_access_logs') || '[]');
    logs.unshift({ time: new Date().toLocaleString('ko-KR'), userId, action });
    if (logs.length > 50) logs.splice(50);
    sessionStorage.setItem('amk_access_logs', JSON.stringify(logs));
  };

  // ── 권한 레벨 정의 ─────────────────────────────────────────
  const ROLES = {
    SUPER: 'super',       // HQ 슈퍼관리자
    REGIONAL: 'regional', // 지역관리자
    STAFF: 'staff',       // 현장직원
    ACCOUNTANT: 'accountant', // 정산담당
    CONTENT: 'content',   // 콘텐츠
    PARTNER: 'partner',   // 여행사
  };

  const ROLE_LABELS = {
    super: '본사 슈퍼관리자', regional: '지역관리자', staff: '현장직원',
    accountant: '정산담당', content: '콘텐츠담당', partner: '여행사',
  };

  // ── 관리자 사이드바 메뉴 ───────────────────────────────────
  const getMenuItems = (role, regionId) => {
    const superMenus = [
      { icon: 'fas fa-tachometer-alt', label: '본사 대시보드', section: 'hq-dashboard' },
      { icon: 'fas fa-map-marker-alt', label: '지역 관리', section: 'regions' },
      { icon: 'fas fa-bus', label: '차량 관리', section: 'vehicles' },
      { icon: 'fas fa-calendar-alt', label: '일정 관리', section: 'schedules' },
      { icon: 'fas fa-tag', label: '요금 관리', section: 'fares' },
      { icon: 'fas fa-chair', label: '좌석 배분 관리', section: 'seats' },
      { icon: 'fas fa-ticket-alt', label: '예약 관리', section: 'reservations' },
      { icon: 'fas fa-comment-dots', label: '문의 관리', section: 'inquiries' },
      { icon: 'fas fa-qrcode', label: '손목밴드 관리', section: 'wristbands' },
      { icon: 'fas fa-bullhorn', label: '팝업/공지 관리', section: 'popups' },
      { icon: 'fas fa-file-contract', label: '약관/환불정책', section: 'terms' },
      { icon: 'fas fa-search', label: 'SEO 관리', section: 'seo' },
      { icon: 'fas fa-sms', label: 'SMS 관리', section: 'sms' },
      { icon: 'fas fa-chart-bar', label: '통계/보고서', section: 'stats-admin' },
      { icon: 'fas fa-calculator', label: '정산 관리', section: 'settlement' },
      { icon: 'fas fa-users-cog', label: '관리자 계정', section: 'admins' },
      { icon: 'fas fa-cog', label: '시스템 설정', section: 'settings-admin' },
      { icon: 'fas fa-map-marked-alt', label: '여행가이드 관리', section: 'travel-guides' },
      { icon: 'fas fa-handshake', label: '파트너 관리', section: 'partners' },
      { icon: 'fas fa-id-badge', label: '기사/해설사 관리', section: 'staff' },
      { icon: 'fas fa-clipboard-list', label: '근무일지', section: 'work-log' },
      { icon: 'fas fa-users', label: '고객 DB', section: 'customers' },
      { icon: 'fas fa-paper-plane', label: '단체문자 캠페인', section: 'sms-campaign' },
      { icon: 'fas fa-database', label: '백업/로그', section: 'backup' },
      { icon: 'fas fa-id-badge', label: '기사/해설사 관리', section: 'staff' },
      { icon: 'fas fa-clipboard-list', label: '근무일지', section: 'work-log' },
      { icon: 'fas fa-users', label: '고객 누적 DB', section: 'customers' },
      { icon: 'fas fa-paper-plane', label: '단체문자 캠페인', section: 'sms-campaign' },
      { icon: 'fas fa-envelope', label: '우편 주소 관리', section: 'mailing' },
    ];
    const regionalMenus = [
      { icon: 'fas fa-tachometer-alt', label: '지역 대시보드', section: 'region-dashboard' },
      { icon: 'fas fa-bus', label: '차량 관리', section: 'vehicles' },
      { icon: 'fas fa-calendar-alt', label: '일정 관리', section: 'schedules' },
      { icon: 'fas fa-tag', label: '요금 관리', section: 'fares' },
      { icon: 'fas fa-chair', label: '좌석 배분', section: 'seats' },
      { icon: 'fas fa-ticket-alt', label: '예약 관리', section: 'reservations' },
      { icon: 'fas fa-comment-dots', label: '문의 관리', section: 'inquiries' },
      { icon: 'fas fa-qrcode', label: '손목밴드', section: 'wristbands' },
      { icon: 'fas fa-bullhorn', label: '팝업/공지', section: 'popups' },
      { icon: 'fas fa-file-contract', label: '약관/환불정책', section: 'terms' },
      { icon: 'fas fa-sms', label: 'SMS 발송', section: 'sms' },
      { icon: 'fas fa-calculator', label: '정산 관리', section: 'settlement' },
      { icon: 'fas fa-chart-bar', label: '통계', section: 'stats-admin' },
      { icon: 'fas fa-map-marked-alt', label: '여행가이드 관리', section: 'travel-guides' },
      { icon: 'fas fa-handshake', label: '파트너 관리', section: 'partners' },
      { icon: 'fas fa-id-badge', label: '기사/해설사 관리', section: 'staff' },
      { icon: 'fas fa-clipboard-list', label: '근무일지', section: 'work-log' },
      { icon: 'fas fa-users', label: '고객 DB', section: 'customers' },
      { icon: 'fas fa-paper-plane', label: '단체문자 캠페인', section: 'sms-campaign' },
    ];
    return role === ROLES.SUPER ? superMenus : regionalMenus;
  };

  // ── 관리자 레이아웃 렌더링 ─────────────────────────────────
  const renderAdminLayout = (section, contentHtml, title) => {
    const user = _adminState.user || { name: '관리자', role: 'super', regionId: null };
    const menus = getMenuItems(user.role, user.regionId);
    const collapsed = _adminState.sidebarCollapsed;
    const mobileOpen = _adminState.mobileOpen;

    const menuHtml = menus.map(m => {
      const isActive = _adminState.currentSection === m.section;
      return `
        <button onclick="AdminModule.navigate('${m.section}')"
          title="${m.label}"
          class="w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg mb-0.5 transition-all
            ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}">
          <i class="${m.icon} flex-shrink-0 ${collapsed ? 'text-lg' : 'w-5 text-center text-sm'}"></i>
          ${collapsed ? '' : `<span class="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">${m.label}</span>`}
        </button>
      `;
    }).join('');

    return `
      <div class="flex h-screen bg-gray-100 overflow-hidden" id="admin-root">

        <!-- 모바일 오버레이 -->
        <div id="sb-overlay"
          class="fixed inset-0 bg-black/50 z-20 transition-opacity duration-300 lg:hidden ${mobileOpen ? '' : 'hidden'}"
          onclick="AdminModule.closeMobileSidebar()"></div>

        <!-- 사이드바 -->
        <aside id="admin-sidebar"
          class="fixed lg:static inset-y-0 left-0 z-30 flex-shrink-0 bg-gray-900 text-white flex flex-col
                 transition-all duration-300 ease-in-out overflow-hidden
                 ${collapsed ? 'lg:w-16' : 'lg:w-64'}
                 ${mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'}">

          <!-- 로고 + 햄버거 -->
          <div class="flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 border-b border-gray-700 flex-shrink-0 h-16">
            ${collapsed ? `
              <button onclick="AdminModule.toggleSidebar()" class="text-gray-400 hover:text-white" title="메뉴 펼치기">
                <i class="fas fa-bars text-lg"></i>
              </button>
            ` : `
              <div class="flex items-center gap-2 overflow-hidden">
                <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:3px;border:1px solid rgba(255,255,255,0.25);flex-shrink:0">
                  <img src="/static/logo_emblem.png" alt="CI" style="width:32px;height:32px;object-fit:contain;display:block">
                </div>
                <div class="overflow-hidden">
                  <div class="whitespace-nowrap" style="font-size:12px;font-weight:800;color:#fff;letter-spacing:0.3px">AQUA MOBILITY <span style="font-weight:500;opacity:0.75;font-size:10px">KOREA</span></div>
                  <div class="text-gray-400 text-xs whitespace-nowrap">${ROLE_LABELS[user.role] || '관리자'}</div>
                </div>
              </div>
              <button onclick="AdminModule.toggleSidebar()" class="text-gray-400 hover:text-white flex-shrink-0 ml-2" title="메뉴 접기">
                <i class="fas fa-bars"></i>
              </button>
            `}
          </div>

          <!-- 유저 정보 -->
          ${collapsed ? '' : `
          <div class="px-3 py-2 border-b border-gray-700 flex-shrink-0">
            <div class="bg-gray-800 rounded-lg p-2.5 flex items-center gap-2">
              <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                ${(user.name || '관').charAt(0)}
              </div>
              <div class="overflow-hidden">
                <div class="text-white text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis">${user.name || '관리자'}</div>
                <div class="text-gray-400 text-xs whitespace-nowrap">${user.regionId ? (user.regionId + ' 지역') : '본사'}</div>
              </div>
            </div>
          </div>
          `}

          <!-- 메뉴 목록 -->
          <nav class="flex-1 p-2 overflow-y-auto overflow-x-hidden">
            ${menuHtml}
          </nav>

          <!-- 로그아웃 -->
          <div class="border-t border-gray-700 p-2 flex-shrink-0">
            <button onclick="AdminModule.logout()"
              class="w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
              title="로그아웃">
              <i class="fas fa-sign-out-alt flex-shrink-0 ${collapsed ? 'text-lg' : 'w-5 text-center text-sm'}"></i>
              ${collapsed ? '' : `<span class="text-sm whitespace-nowrap">로그아웃</span>`}
            </button>
          </div>
        </aside>

        <!-- 메인 콘텐츠 영역 -->
        <div class="flex-1 flex flex-col overflow-hidden min-w-0">
          <!-- 상단 헤더 -->
          <header class="bg-white border-b px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0 h-16">
            <div class="flex items-center gap-3 min-w-0">
              <!-- 모바일 햄버거 -->
              <button onclick="AdminModule.toggleMobileSidebar()" class="lg:hidden text-gray-500 hover:text-gray-800 flex-shrink-0">
                <i class="fas fa-bars"></i>
              </button>
              <h1 class="text-gray-800 font-semibold text-base lg:text-lg truncate">${title || section}</h1>
            </div>
            <div class="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              <span class="hidden md:block text-xs text-gray-500">${new Date().toLocaleDateString('ko-KR', {year:'numeric',month:'long',day:'numeric'})}</span>
              <a href="/" target="_blank"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-100 hover:border-blue-300 transition-colors">
                <i class="fas fa-external-link-alt text-xs"></i>
                <span>고객사이트</span>
              </a>
              <a href="/field" target="_blank"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-medium hover:bg-green-100 hover:border-green-300 transition-colors">
                <i class="fas fa-tablet-alt text-xs"></i>
                <span class="hidden sm:inline">현장매표소</span>
              </a>
            </div>
          </header>
          <!-- 페이지 콘텐츠 -->
          <main class="flex-1 overflow-y-auto p-4 lg:p-6" id="admin-content">
            ${contentHtml}
          </main>
        </div>
      </div>
    `;
  };

  // ── 공통 통계 카드 ─────────────────────────────────────────
  const statCard = (icon, label, value, sub, color='blue') => `
    <div class="stat-card bg-white rounded-xl shadow-sm p-5 border-l-4 border-${color}-500">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-gray-500 text-xs font-medium uppercase tracking-wide">${label}</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">${value}</p>
          ${sub ? `<p class="text-xs text-gray-500 mt-1">${sub}</p>` : ''}
        </div>
        <div class="w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center">
          <i class="${icon} text-${color}-600 text-xl"></i>
        </div>
      </div>
    </div>
  `;

  // ── 로그인 페이지 ──────────────────────────────────────────
  const loginPage = async () => {
    const failCount = parseInt(sessionStorage.getItem('amk_fail_count') || '0');
    const isLocked = failCount >= 5;
    return `
      <div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div class="w-full max-w-md">
          <div class="mb-4">
            <a href="/" data-link class="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors">
              <i class="fas fa-arrow-left"></i> 메인으로 돌아가기
            </a>
          </div>
          <div class="text-center mb-8">
            <div class="flex justify-center mb-3">
              <img src="/static/logo_emblem.png" alt="Aqua Mobility Korea" style="width:90px;height:auto;object-fit:contain;">
            </div>
            <div class="text-white font-bold text-xl tracking-wide mb-1">AQUA MOBILITY KOREA</div>
            <p class="text-gray-400 text-sm">통합 관리자 시스템 · Admin Portal</p>
          </div>
          <div class="bg-white rounded-2xl shadow-2xl p-8">
            <div class="flex items-center gap-2 mb-6">
              <i class="fas fa-lock text-blue-500"></i>
              <h2 class="text-gray-800 font-semibold text-lg">관리자 로그인</h2>
            </div>
            ${isLocked ? `
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <i class="fas fa-ban"></i>
              <span>로그인 시도 횟수가 초과되었습니다. 브라우저를 새로고침 후 다시 시도하세요.</span>
            </div>` : failCount > 0 ? `
            <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
              <i class="fas fa-exclamation-triangle"></i>
              <span>로그인 실패 ${failCount}회. ${5 - failCount}회 더 실패 시 잠금됩니다.</span>
            </div>` : ''}
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                <input id="admin-id" type="text" placeholder="관리자 아이디" ${isLocked ? 'disabled' : ''}
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${isLocked ? 'bg-gray-100' : ''}"
                  onkeypress="if(event.key==='Enter') AdminModule.doLogin()">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <div class="relative">
                  <input id="admin-pw" type="password" placeholder="비밀번호" ${isLocked ? 'disabled' : ''}
                    class="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${isLocked ? 'bg-gray-100' : ''}"
                    onkeypress="if(event.key==='Enter') AdminModule.doLogin()">
                  <button type="button" onclick="(function(){const el=document.getElementById('admin-pw');el.type=el.type==='password'?'text':'password';})()"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <i class="fas fa-eye text-sm"></i>
                  </button>
                </div>
              </div>
              <button onclick="AdminModule.doLogin()" ${isLocked ? 'disabled' : ''}
                class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                <i class="fas fa-sign-in-alt"></i>로그인
              </button>
            </div>

          </div>
          <!-- 테스트 계정 안내 (오픈 전까지 유지) -->
          <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs">
            <div class="font-semibold text-blue-700 mb-2"><i class="fas fa-info-circle mr-1"></i>테스트 계정</div>
            <div class="space-y-1" id="demo-account-list">
              ${DEMO_ACCOUNTS.map(a =>
                `<div class="flex justify-between items-center cursor-pointer hover:bg-blue-100 px-2 py-1 rounded demo-account-row"
                  data-id="${a.id}" data-pw="${a.pw}">
                  <span class="text-blue-800 font-medium">${a.name}</span>
                  <span class="text-gray-500 font-mono">${a.id} / ${a.pw}</span>
                </div>`
              ).join('')}
            </div>
            <div class="text-gray-400 mt-1">※ 클릭하면 자동 입력됩니다</div>
          </div>
          <p class="text-center text-gray-500 text-xs mt-3">
            <i class="fas fa-shield-alt mr-1"></i>보안 접속 · 무단 접근 시 법적 조치
          </p>
        </div>
      </div>
    `;
  };

  // 로그인 폼 자동 채우기 (데모용)
  const fillLogin = (id, pw) => {
    const idEl = document.getElementById('admin-id');
    const pwEl = document.getElementById('admin-pw');
    if (idEl) idEl.value = id;
    if (pwEl) pwEl.value = pw;
  };

  const doLogin = async () => {
    // 실패 횟수 제한
    const failCount = parseInt(sessionStorage.getItem('amk_fail_count') || '0');
    if (failCount >= 5) {
      Utils.toast('로그인 시도 횟수가 초과되었습니다. 잠시 후 다시 시도하세요.', 'error');
      return;
    }

    const id = document.getElementById('admin-id')?.value?.trim();
    const pw = document.getElementById('admin-pw')?.value;
    if (!id || !pw) { Utils.toast('아이디와 비밀번호를 입력하세요', 'error'); return; }

    Utils.loading(true);
    try {
      // ★ DB API 로그인 (하드코딩 제거)
      const res = await API.post('/api/admin/login', { username: id, password: pw });
      Utils.loading(false);

      if (!res.success) {
        sessionStorage.setItem('amk_fail_count', String(failCount + 1));
        const remain = 5 - (failCount + 1);
        Utils.toast(`아이디 또는 비밀번호가 올바르지 않습니다. (${failCount+1}/5회, 남은 시도: ${remain}회)`, 'error');
        return;
      }

      const u = res.data;
      // 로그인 성공
      sessionStorage.setItem('amk_fail_count', '0');
      _adminState.loggedIn = true;
      _adminState.user = {
        id: u.username || u.id,
        name: u.name,
        role: u.role,
        regionId: u.regionId || null,
        regionName: u.regionName || u.regionId || '',
      };
      _adminState.selectedRegion = u.regionId || null;
      Store.set('adminUser', _adminState.user);
      Store.set('adminLoginTime', Date.now());
      try {
        localStorage.setItem('amk_admin_user', JSON.stringify(_adminState.user));
        localStorage.setItem('amk_admin_login_time', String(Date.now()));
        window._adminUser = _adminState.user; // API 헤더용
      } catch(e) {}
      _addAccessLog(u.username || u.id, '로그인 성공');
      Utils.toast(`${u.name}으로 로그인되었습니다.`, 'success');

      // 권한별 리다이렉트
      if (u.role === ROLES.STAFF) {
        Router.go('/field');
      } else if (u.role === ROLES.REGIONAL) {
        Router.go('/admin/region-dashboard');
      } else {
        Router.go('/admin/dashboard');
      }
    } catch(e) {
      Utils.loading(false);
      Utils.toast('로그인 중 오류가 발생했습니다.', 'error');
    }
  };

  const logout = () => {
    const userName = _adminState.user?.name || 'unknown';
    _addAccessLog(_adminState.user?.id || 'unknown', '로그아웃');
    _adminState.loggedIn = false;
    _adminState.user = null;
    _adminState.mobileOpen = false;
    Store.set('adminUser', null);
    try { localStorage.removeItem('amk_admin_user'); } catch(e) {}
    Store.set('adminLoginTime', null);
    Utils.toast(`${userName} 로그아웃되었습니다.`, 'info');
    Router.go('/admin/login');
  };

  const toggleSidebar = () => {
    _adminState.sidebarCollapsed = !_adminState.sidebarCollapsed;
    // DOM 직접 조작 - 리렌더링 없이 즉시 적용
    const sb = document.getElementById('admin-sidebar');
    if (!sb) return;
    if (_adminState.sidebarCollapsed) {
      sb.classList.remove('lg:w-64');
      sb.classList.add('lg:w-16');
    } else {
      sb.classList.remove('lg:w-16');
      sb.classList.add('lg:w-64');
    }
    // 현재 섹션 재렌더링하여 메뉴 텍스트 표시/숨김 동기화
    const section = _adminState.currentSection;
    Router.go(`/admin/${section}`, false);
  };

  const toggleMobileSidebar = () => {
    _adminState.mobileOpen = !_adminState.mobileOpen;
    const sb = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sb-overlay');
    if (!sb) return;
    if (_adminState.mobileOpen) {
      sb.classList.remove('-translate-x-full');
      sb.classList.add('translate-x-0', 'w-64');
      if (overlay) overlay.classList.remove('hidden');
    } else {
      sb.classList.add('-translate-x-full');
      sb.classList.remove('translate-x-0');
      if (overlay) overlay.classList.add('hidden');
    }
  };

  const closeMobileSidebar = () => {
    _adminState.mobileOpen = false;
    const sb = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sb-overlay');
    if (sb) { sb.classList.add('-translate-x-full'); sb.classList.remove('translate-x-0'); }
    if (overlay) overlay.classList.add('hidden');
  };

  // ── SENS 설정 저장 ────────────────────────────────────────
  const saveGroupDiscount = async () => {
    const enabled  = document.getElementById('gd-enabled')?.checked ? '1' : '0';
    const tier1Min = document.getElementById('gd-tier1-min')?.value;
    const tier1Rate= document.getElementById('gd-tier1-rate')?.value;
    const tier2Min = document.getElementById('gd-tier2-min')?.value;
    const tier2Rate= document.getElementById('gd-tier2-rate')?.value;
    if (parseInt(tier2Min) <= parseInt(tier1Min)) {
      Utils.toast('2구간 시작 인원은 1구간보다 커야 합니다', 'warning'); return;
    }
    try {
      await API.put('/api/settings/group-discount/config', { enabled, tier1Min, tier1Rate, tier2Min, tier2Rate });
      Utils.toast('단체할인 설정이 저장되었습니다', 'success');
    } catch(e) { Utils.toast('저장 실패: ' + e.message, 'error'); }
  };

  const saveSensConfig = async () => {
    const accessKey  = document.getElementById('sens-access-key')?.value?.trim();
    const secretKey  = document.getElementById('sens-secret-key')?.value?.trim();
    const serviceId  = document.getElementById('sens-service-id')?.value?.trim();
    const senderPhone = document.getElementById('sens-sender')?.value?.trim();
    const enabled    = document.getElementById('sens-enabled')?.checked || false;
    if (!accessKey || !serviceId || !senderPhone) {
      Utils.toast('Access Key / Service ID / 발신번호는 필수입니다', 'warning'); return;
    }
    const body = { accessKey, serviceId, senderPhone, enabled };
    if (secretKey) body.secretKey = secretKey;
    Utils.loading(true);
    const res = await API.post('/api/sms-settings/config', body);
    Utils.loading(false);
    if (res.success) {
      Utils.toast('SENS 설정이 저장되었습니다' + (enabled ? ' (자동 발송 활성화)' : ' (비활성)'), 'success', 3000);
    } else {
      Utils.toast('저장 실패: ' + (res.error || ''), 'error');
    }
  };

  const testSms = async () => {
    Utils.modal(`
      <div class="modal-header"><h3 class="font-bold text-lg">테스트 문자 발송</h3></div>
      <div class="modal-body space-y-3 pt-2">
        <div>
          <label class="text-xs text-gray-500 font-medium block mb-1">수신번호</label>
          <input id="test-sms-phone" type="tel" placeholder="010-1234-5678"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="text-xs text-gray-500 font-medium block mb-1">메시지</label>
          <textarea id="test-sms-msg" rows="3"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none">[아쿠아모빌리티코리아] 테스트 메시지입니다.</textarea>
        </div>
        <div class="flex gap-2 pt-1">
          <button onclick="Utils.closeModal()" class="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">취소</button>
          <button onclick="AdminModule._doTestSms()" class="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-bold hover:bg-green-700">발송</button>
        </div>
      </div>`);
  };

  const _doTestSms = async () => {
    const phone = document.getElementById('test-sms-phone')?.value?.trim();
    const message = document.getElementById('test-sms-msg')?.value?.trim();
    if (!phone) { Utils.toast('수신번호를 입력하세요', 'warning'); return; }
    Utils.closeModal();
    Utils.loading(true);
    const res = await API.post('/api/sms-settings/test', { phone, message });
    Utils.loading(false);
    if (res.success) {
      Utils.toast('테스트 문자 발송 완료!', 'success', 3000);
    } else if (res.reason === 'not_configured') {
      Utils.toast('SENS 설정을 먼저 저장하고 활성화해주세요', 'warning', 4000);
    } else {
      Utils.toast('발송 실패: ' + JSON.stringify(res.error || ''), 'error', 4000);
    }
  };

  const navigate = (section) => {
    _adminState.currentSection = section;
    _adminState.mobileOpen = false; // 모바일에서 메뉴 클릭 시 사이드바 닫기
    Router.go(`/admin/${section}`);
  };

  // ── HQ 슈퍼 대시보드 ───────────────────────────────────────
  const hqDashboard = async () => {
    _adminState.currentSection = 'hq-dashboard';
    // DB에서 지역 및 통계 로드
    const [regRes, statsRes] = await Promise.all([
      API.get('/api/regions'),
      API.get('/api/stats/overview'),
    ]);
    const regions = (regRes.success && regRes.data) ? regRes.data : [];
    const stats = (statsRes.success && statsRes.data) ? statsRes.data : {};
    // window.REGIONS도 업데이트 (다른 함수들이 사용)
    window.REGIONS = regions;
    const activeRegions = regions.filter(r => r.status === 'active' || r.status === 'open');
    const today = new Date().toISOString().slice(0, 10);
    const regionStats = stats.regionStats || [];

    const statusLabel = (s) => ({
      open:'운영중', active:'운영중', preparing:'준비중', closed:'운영중단', hidden:'숨김'
    })[s] || s;
    const statusColor = (s) => ({
      open:'bg-green-100 text-green-700', active:'bg-green-100 text-green-700',
      preparing:'bg-yellow-100 text-yellow-700', closed:'bg-red-100 text-red-700'
    })[s] || 'bg-gray-100 text-gray-600';

    const regionRows = regions.map(r => {
      const rs = regionStats.find(s => s.id === r.id) || {};
      return `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3">
            <div class="font-medium text-gray-800">${r.name}</div>
            <div class="text-xs text-gray-500">${r.code || ''}</div>
          </td>
          <td class="px-4 py-3 text-center">
            <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}">${statusLabel(r.status)}</span>
          </td>
          <td class="px-4 py-3 text-right font-medium">${(rs.reservations||0).toLocaleString()}건</td>
          <td class="px-4 py-3 text-right font-medium text-blue-600">₩${(rs.revenue||0).toLocaleString()}</td>
          <td class="px-4 py-3 text-center">
            <span class="text-xs ${r.onlineRatio >= 70 ? 'text-green-600' : 'text-orange-500'}">${r.onlineRatio||70}% / ${r.offlineRatio||30}%</span>
          </td>
          <td class="px-4 py-3 text-center">
            <button onclick="AdminModule.navigate('region-dashboard')" class="text-blue-600 hover:underline text-xs">상세</button>
          </td>
        </tr>
      `;
    }).join('');

    // ★ localStorage에서 실제 승인 대기 목록 로드
    const fareApprovals = (await _getFareApprovals(null, 'pending'));
    const approvalRows = fareApprovals.length === 0
      ? '<tr><td colspan="7" class="text-center py-6 text-gray-400 text-sm">대기 중인 승인 요청이 없습니다.</td></tr>'
      : fareApprovals.map((a) => {
        const regionName = (window.REGIONS||[]).find(r=>r.id===a.region_id)?.name || a.region_id || '알 수 없음';
        const oldPriceHtml = a.old_price != null ? `<div class="text-xs text-gray-400 line-through">₩${(a.old_price||0).toLocaleString()}</div>` : '';
        return `
        <tr class="hover:bg-orange-50" id="hq-appr-row-${a.id}">
          <td class="px-4 py-3 text-sm font-medium">${regionName}</td>
          <td class="px-4 py-3 text-sm">${a.fare_label||'-'}</td>
          <td class="px-4 py-3 text-sm text-center text-gray-500">${a.fare_type||'일반'}</td>
          <td class="px-4 py-3 text-sm text-right font-semibold text-blue-700">${oldPriceHtml}₩${(a.new_price||0).toLocaleString()}</td>
          <td class="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">${a.reason||'-'}</td>
          <td class="px-4 py-3 text-xs text-gray-400 text-center">${a.requested_by||'지역관리자'}<br>${(a.requested_at||'').replace('T',' ').slice(0,16)}</td>
          <td class="px-4 py-3 text-center">
            <button onclick="AdminModule.approvefare('${a.id}', true)" class="bg-green-500 text-white px-2 py-1 rounded text-xs mr-1 hover:bg-green-600">승인</button>
            <button onclick="AdminModule.approvefare('${a.id}', false)" class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">반려</button>
          </td>
        </tr>`;
      }).join('');

    const pendingScheduleCount = 0; // DB 기반 스케줄

    const content = `
      <div class="space-y-6">
        <!-- 상단 요약 카드 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          ${statCard('fas fa-map-marker-alt', '운영 지역', `${activeRegions.length}개`, `전체 ${regions.length}개 중`, 'blue')}
          ${statCard('fas fa-users', '오늘 총 예약', `${(stats.today?.reservations||0).toLocaleString()}건`, `이달 ${(stats.month?.reservations||0).toLocaleString()}건`, 'green')}
          ${statCard('fas fa-won-sign', '오늘 총 매출', `₩${(stats.today?.revenue||0).toLocaleString()}`, `이달 누계 ₩${(stats.month?.revenue||0).toLocaleString()}`, 'purple')}
          ${statCard('fas fa-hourglass-half', '요금 승인 대기', `${fareApprovals.length}건`, fareApprovals.length > 0 ? '⚠ 즉시 처리 필요' : '대기 없음', fareApprovals.length > 0 ? 'orange' : 'gray')}
        </div>

        <!-- 요금 변경 승인 대기 (실시간 연동) -->
        <div class="bg-white rounded-xl shadow-sm p-6 ${fareApprovals.length > 0 ? 'ring-2 ring-orange-200' : ''}">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-800 flex items-center gap-2">
              <i class="fas fa-bell ${fareApprovals.length > 0 ? 'text-orange-500 animate-pulse' : 'text-gray-400'}"></i>
              요금 변경 승인 대기
              ${fareApprovals.length > 0 ? `<span class="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">${fareApprovals.length}</span>` : ''}
            </h2>
            <button onclick="AdminModule.navigate('fares')" class="text-blue-600 hover:underline text-xs flex items-center gap-1">
              <i class="fas fa-external-link-alt"></i> 요금 관리로 이동
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead>
                <tr class="bg-gray-50">
                  ${['지역','구분명','유형','정가','변경사유','요청자·일시','처리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100" id="hq-fare-approval-body">${approvalRows}</tbody>
            </table>
          </div>
        </div>

        <!-- 지역별 현황 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-800">지역별 오늘 현황</h2>
            <span class="text-xs text-gray-500">${today} 기준</span>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead>
                <tr class="bg-gray-50">
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">지역</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">상태</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600">예약</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600">매출</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">온라인/현장</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">관리</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">${regionRows}</tbody>
            </table>
          </div>
        </div>

        <!-- 빠른 작업 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-800 mb-4">빠른 작업</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${[
              {icon:'fas fa-plus-circle', label:'새 지역 추가', fn:"AdminModule.navigate('regions')", color:'blue'},
              {icon:'fas fa-calendar-plus', label:'일정 관리', fn:"AdminModule.navigate('schedules')", color:'green'},
              {icon:'fas fa-bullhorn', label:'공지 작성', fn:"AdminModule.navigate('popups')", color:'purple'},
              {icon:'fas fa-chart-line', label:'통계 보기', fn:"AdminModule.navigate('stats-admin')", color:'orange'},
            ].map(a => `
              <button onclick="${a.fn}" class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-${a.color}-100 hover:border-${a.color}-300 hover:bg-${a.color}-50 transition-all">
                <i class="${a.icon} text-${a.color}-500 text-xl"></i>
                <span class="text-xs font-medium text-gray-700">${a.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('hq-dashboard', content, '본사 슈퍼 대시보드');
  };

  // hqDashboard의 approveFare - faresPage의 approvefare와 동일 로직 공유
  const approveFare = (idx, approve) => {
    // hqDashboard에서 호출되는 경우 → approvefare 위임
    approvefare(idx, approve);
    // 대시보드 갱신
    hqDashboard().then(html => { document.getElementById('app').innerHTML = html; });
  };


  const regionDashboard = async (params) => {
    _adminState.currentSection = 'region-dashboard';
    const user = _adminState.user || {};

    // 로그인 계정 regionId 우선 → URL 파라미터 → 선택값 → 기본값
    const regionId = (user.role === 'regional' && user.regionId)
      ? user.regionId
      : (params?.regionId || _adminState.selectedRegion || 'tongyeong');

    const todayStr = new Date().toISOString().split('T')[0];
    const fmtWon = (v) => (v||0).toLocaleString('ko-KR');

    // ── 실시간 API 병렬 호출 ──────────────────────────────────────
    const [regRes, statsRes, resRes, schRes, wbStatsRes] = await Promise.all([
      API.get('/api/regions'),
      API.get(`/api/stats/${regionId}`),
      API.get(`/api/reservations?regionId=${regionId}&date=${todayStr}&limit=5`),
      API.get(`/api/schedules/${regionId}?date=${todayStr}`),
      API.get(`/api/wristbands/stats?regionId=${regionId}&date=${todayStr}`),
    ]);

    const regions = (regRes.success && regRes.data ? regRes.data : (window.REGIONS||[])).filter(r => r.status !== 'hidden');
    if (regRes.success && regRes.data) window.REGIONS = regRes.data;

    const region = regions.find(r => r.id === regionId) || {
      id: regionId,
      name: regionId === 'buyeo' ? '부여' : regionId === 'tongyeong' ? '통영' : regionId === 'hapcheon' ? '합천' : regionId,
      location: `${regionId} 지역`,
      customerService: '1588-0000',
    };

    // 통계 데이터
    const stats = (statsRes.success && statsRes.data) || {};
    const todayPax  = stats.today?.pax  || 0;
    const todayCnt  = stats.today?.cnt  || 0;
    const todayRev  = stats.today?.revenue || 0;
    const totalCnt  = stats.total?.cnt  || 0;
    const totalRev  = stats.total?.revenue || 0;

    // 스케줄 (오늘 예약 건수 포함)
    const schedules = (schRes.success && schRes.data) ? schRes.data : [];
    const totalCap    = schedules.reduce((s, sc) => s + (sc.capacity || 0), 0);
    const totalBooked = schedules.reduce((s, sc) => s + (sc.booked  || 0), 0);
    const totalAvail  = schedules.reduce((s, sc) => s + (sc.available || 0), 0);

    // 손목밴드 통계
    const wbStats   = (wbStatsRes.success && wbStatsRes.data) || {};
    const wbIssued  = wbStats.issued  || 0;
    const wbBoarded = wbStats.boarded || 0;
    const wbRate    = wbIssued > 0 ? Math.round(wbBoarded / wbIssued * 100) : 0;

    // 최근 예약
    const recentResList = (resRes.success && resRes.data) ? resRes.data : [];

    // 이번달 일별 매출 (stats.daily)
    const dailyData = stats.daily || [];
    const monthRevArr = Array.from({length: new Date().getDate()}, (_, i) => {
      const d = String(i+1).padStart(2,'0');
      const dateStr = `${todayStr.slice(0,7)}-${d}`;
      const row = dailyData.find(r => r.date === dateStr);
      return row ? (row.revenue || 0) : 0;
    });
    const maxRev = Math.max(...monthRevArr, 1);

    const today = new Date().toLocaleDateString('ko-KR', {year:'numeric',month:'long',day:'numeric',weekday:'short'});

    // 지역관리자는 자기 지역만 / 슈퍼는 전 지역 선택 가능
    const regionSelector = (user.role === 'regional')
      ? `<span class="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"><i class="fas fa-map-marker-alt mr-1"></i>${region.name} 전용</span>`
      : `<div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">지역 선택:</span>
          <select onchange="AdminModule.switchRegionDashboard(this.value)" class="border rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
            ${['tongyeong','buyeo','hapcheon'].map(id => {
              const nm = id==='tongyeong'?'통영':id==='buyeo'?'부여':'합천';
              return `<option value="${id}" ${id===regionId?'selected':''}>${nm}</option>`;
            }).join('')}
          </select>
        </div>`;

    // 회차별 상황 테이블 행 (실제 API 스케줄 데이터)
    const roundRows = schedules.map((s, idx) => {
      const booked = s.booked || 0;
      const cap = s.capacity || 0;
      const pct = cap > 0 ? Math.round(booked / cap * 100) : 0;
      const isFull = s.isSoldout || booked >= cap;
      const label = `${idx+1}회차`;
      return `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3 text-sm font-medium">${label} <span class="text-gray-400">(${s.time})</span></td>
          <td class="px-4 py-3 text-center">
            <span class="text-sm font-bold ${isFull?'text-red-600':'text-blue-600'}">${booked}</span>
            <span class="text-gray-400 text-xs"> / ${cap}석</span>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div class="h-2 rounded-full ${isFull?'bg-red-500':pct>70?'bg-amber-500':'bg-blue-500'}" style="width:${pct}%"></div>
              </div>
              <span class="text-xs text-gray-600 w-8 text-right">${pct}%</span>
            </div>
          </td>
          <td class="px-4 py-3 text-center">
            <span class="px-2 py-0.5 rounded-full text-xs font-medium ${isFull?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}">
              ${isFull?'매진':'예약가능'}
            </span>
          </td>
        </tr>`;
    }).join('');

    // 최근 예약 행 (실제 API 데이터)
    const statusLabelMap = {confirmed:'✅ 확정', checkedin:'🎫 발권', boarded:'🚌 탑승', cancelled:'❌ 취소', refunded:'💰 환불'};
    const statusClsMap   = {confirmed:'bg-green-100 text-green-700', checkedin:'bg-blue-100 text-blue-700', boarded:'bg-indigo-100 text-indigo-700', cancelled:'bg-red-100 text-red-600', refunded:'bg-gray-100 text-gray-500'};
    const resRows = recentResList.length === 0
      ? `<tr><td colspan="5" class="px-3 py-6 text-center text-gray-400 text-sm">오늘 예약이 없습니다</td></tr>`
      : recentResList.map(r => {
          const nameDisplay = r.name ? r.name.slice(0,1) + '**' : '-';
          return `
          <tr class="hover:bg-gray-50">
            <td class="px-3 py-2 text-xs font-mono text-blue-600 cursor-pointer hover:underline" onclick="AdminModule.viewReservation('${r.id}')">${r.reservationNo||r.id?.slice(0,8)}</td>
            <td class="px-3 py-2 text-sm">${nameDisplay}</td>
            <td class="px-3 py-2 text-sm text-center">${r.pax||0}명</td>
            <td class="px-3 py-2 text-sm text-right">₩${(r.totalPrice||0).toLocaleString()}</td>
            <td class="px-3 py-2 text-center">
              <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusClsMap[r.status]||'bg-gray-100 text-gray-600'}">
                ${statusLabelMap[r.status]||r.status}
              </span>
            </td>
          </tr>`;
        }).join('');

    // 알림 (저좌석 경고 동적 생성)
    const alertItems_arr = [];
    schedules.forEach((s, idx) => {
      const avail = s.available || 0;
      const cap   = s.capacity  || 0;
      if (avail > 0 && avail <= 5) {
        alertItems_arr.push({ type:'warning', msg:`${idx+1}회차(${s.time}) 잔여석 ${avail}석만 남았습니다.`, time:'' });
      }
      if (s.isSoldout) {
        alertItems_arr.push({ type:'info', msg:`${idx+1}회차(${s.time}) 매진되었습니다.`, time:'' });
      }
    });
    if (totalBooked > 0 && totalBooked >= totalCap * 0.9) {
      alertItems_arr.push({ type:'success', msg:`오늘 전체 좌석 점유율 ${Math.round(totalBooked/totalCap*100)}% 달성!`, time:'' });
    }
    const alertIcons = { warning:'fas fa-exclamation-triangle text-amber-500', info:'fas fa-info-circle text-blue-500', success:'fas fa-check-circle text-green-500' };
    const alertItems = alertItems_arr.map(a => `
      <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
        <i class="${alertIcons[a.type]||alertIcons.info} mt-0.5 flex-shrink-0"></i>
        <div class="flex-1">
          <p class="text-sm text-gray-800">${a.msg}</p>
          ${a.time ? `<p class="text-xs text-gray-400 mt-0.5">${a.time}</p>` : ''}
        </div>
      </div>`).join('');

    // 이번달 일별 매출 차트 (bar-style CSS)
    const salesBars = monthRevArr.map((v, i) => {
      const h = Math.round(v / maxRev * 60);
      return `<div class="flex flex-col items-center gap-1">
        <div class="w-4 bg-blue-400 rounded-t hover:bg-blue-600 transition-colors" style="height:${h}px;min-height:${v>0?4:2}px;opacity:${v>0?1:0.3}"></div>
        <div class="text-gray-400" style="font-size:9px">${i+1}</div>
      </div>`;
    }).join('');

    const content = `
      <div class="space-y-6">
        <!-- 헤더: 지역 선택 + 날짜 -->
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3 flex-wrap">
            ${regionSelector}
            <span class="text-sm text-gray-500">${today}</span>
            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              <i class="fas fa-phone mr-1"></i>${region.customerService}
            </span>
          </div>
          <button onclick="location.reload()" class="text-xs text-gray-500 border rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1">
            <i class="fas fa-sync-alt"></i> 새로고침
          </button>
        </div>

        <!-- ① 예약현황 (4개 통계 카드) -->
        <section>
          <h2 class="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <span class="w-5 h-5 bg-blue-500 rounded text-white flex items-center justify-center text-xs">①</span>예약현황
          </h2>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            ${statCard('fas fa-calendar-check','오늘 예약',`${todayPax}명`,`전체 ${todayCnt}건`,'blue')}
            ${statCard('fas fa-won-sign','오늘 매출',`₩${fmtWon(todayRev)}`,`전체 ₩${fmtWon(totalRev)}`,'green')}
            ${statCard('fas fa-chair','잔여 좌석',`${totalAvail}석`,`전체 ${totalCap}석 중`,'purple')}
            ${statCard('fas fa-qrcode','손목밴드',`${wbIssued}개`,`탑승완료 ${wbRate}%`,'orange')}
          </div>
        </section>

        <!-- ② 운행현황 + ③ 회차별현황 -->
        <div class="grid lg:grid-cols-2 gap-6">
          <!-- ② 운행현황 -->
          <section class="bg-white rounded-xl shadow-sm p-5">
            <h2 class="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <span class="w-5 h-5 bg-green-500 rounded text-white flex items-center justify-center text-xs">②</span>운행현황
            </h2>
            <div class="space-y-3">
              ${schedules.length === 0 ? '<p class="text-gray-400 text-sm text-center py-4">스케줄 없음</p>' : schedules.map((s, idx) => {
                const booked = s.booked || 0;
                const cap    = s.capacity || 0;
                const pct    = cap > 0 ? Math.round(booked / cap * 100) : 0;
                const isFull = s.isSoldout || booked >= cap;
                return `<div class="flex items-center gap-3">
                  <div class="w-16 text-xs font-medium text-gray-700">${s.time}</div>
                  <div class="flex-1">
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                      <span>${idx+1}회차</span>
                      <span>${booked}/${cap}석 (${pct}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                      <div class="h-2.5 rounded-full transition-all ${isFull?'bg-red-500':pct>70?'bg-amber-400':'bg-green-500'}" style="width:${pct}%"></div>
                    </div>
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded-full ${isFull?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}">${isFull?'매진':'운행중'}</span>
                </div>`;
              }).join('')}
            </div>
          </section>

          <!-- ③ 회차별현황 -->
          <section class="bg-white rounded-xl shadow-sm p-5">
            <h2 class="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <span class="w-5 h-5 bg-purple-500 rounded text-white flex items-center justify-center text-xs">③</span>회차별현황
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead><tr class="bg-gray-50 text-xs text-gray-600">
                  <th class="px-4 py-2">회차</th><th class="px-4 py-2 text-center">예약/정원</th>
                  <th class="px-4 py-2">점유율</th><th class="px-4 py-2 text-center">상태</th>
                </tr></thead>
                <tbody class="divide-y divide-gray-100">${roundRows}</tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- ④ 좌석현황 -->
        <section class="bg-white rounded-xl shadow-sm p-5">
          <h2 class="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
            <span class="w-5 h-5 bg-cyan-500 rounded text-white flex items-center justify-center text-xs">④</span>좌석현황
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${schedules.map((s, idx) => {
              const booked = s.booked    || 0;
              const cap    = s.capacity  || 0;
              const avail  = s.available ?? Math.max(0, cap - booked);
              const pct    = cap > 0 ? Math.round(booked / cap * 100) : 0;
              return `<div class="border rounded-xl p-4 text-center">
                <div class="text-xs text-gray-500 mb-1">${idx+1}회차 (${s.time})</div>
                <div class="text-2xl font-black ${avail===0?'text-red-500':'text-blue-600'}">${avail}</div>
                <div class="text-xs text-gray-400">잔여석</div>
                <div class="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div class="h-1.5 rounded-full bg-blue-400" style="width:${pct}%"></div>
                </div>
                <div class="text-xs text-gray-400 mt-1">${booked}/${cap}</div>
              </div>`;
            }).join('')}
          </div>
        </section>

        <!-- ⑤ 탑승현황 + ⑥ 매출현황 -->
        <div class="grid lg:grid-cols-2 gap-6">
          <!-- ⑤ 탑승현황 -->
          <section class="bg-white rounded-xl shadow-sm p-5">
            <h2 class="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <span class="w-5 h-5 bg-amber-500 rounded text-white flex items-center justify-center text-xs">⑤</span>탑승현황 (오늘)
            </h2>
            <div class="space-y-3 mb-4">
              ${[
                {label:'수배 발급',  val:`${wbIssued}개`, color:'blue'},
                {label:'탑승 완료',   val:`${wbBoarded}명`, color:'green'},
                {label:'탑승 대기',   val:`${Math.max(0, wbIssued - wbBoarded)}명`, color:'amber'},
                {label:'탑승 완료율',   val:`${wbRate}%`, color:'purple'},
              ].map(i=>`
                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                  <span class="text-sm text-gray-600">${i.label}</span>
                  <span class="font-bold text-${i.color}-600">${i.val}</span>
                </div>`).join('')}
            </div>
            <button onclick="AdminModule.navigate('wristbands')" class="w-full border border-blue-200 text-blue-600 py-2 rounded-lg text-xs hover:bg-blue-50 transition-colors">
              <i class="fas fa-qrcode mr-1"></i>손목밴드 관리로 이동
            </button>
          </section>

          <!-- ⑥ 매출현황 -->
          <section class="bg-white rounded-xl shadow-sm p-5">
            <h2 class="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <span class="w-5 h-5 bg-green-600 rounded text-white flex items-center justify-center text-xs">⑥</span>매출현황
            </h2>
            <div class="space-y-2 mb-4">
              ${[
                {label:'오늘 총 매출',   val:`₩${fmtWon(todayRev)}`},
                {label:'온라인 예약 건',    val:`${todayCnt}건`},
                {label:'오늘 총 탑승',     val:`${todayPax}명`},
              ].map(i=>`
                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                  <span class="text-sm text-gray-600">${i.label}</span>
                  <span class="font-bold text-gray-800">${i.val}</span>
                </div>`).join('')}
            </div>
            <div class="mt-3">
              <div class="text-xs text-gray-500 mb-2">월별 매출 추이 (만원)</div>
              <div class="flex items-end gap-1 h-20">${salesBars}</div>
            </div>
          </section>
        </div>

        <!-- ⑦ 알림 -->
        <section class="bg-white rounded-xl shadow-sm p-5">
          <h2 class="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
            <span class="w-5 h-5 bg-red-500 rounded text-white flex items-center justify-center text-xs">⑦</span>알림
          </h2>
          <div class="space-y-2">${alertItems || '<p class="text-gray-400 text-sm text-center py-4">알림이 없습니다.</p>'}</div>
        </section>

        <!-- ⑧ 바로가기 -->
        <section class="bg-white rounded-xl shadow-sm p-5">
          <h2 class="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
            <span class="w-5 h-5 bg-gray-600 rounded text-white flex items-center justify-center text-xs">⑧</span>바로가기
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${[
              {icon:'fas fa-ticket-alt',   label:'예약 관리',   section:'reservations',  color:'blue'},
              {icon:'fas fa-bus',          label:'차량 관리',   section:'vehicles',      color:'green'},
              {icon:'fas fa-calendar-alt', label:'일정 관리',   section:'schedules',     color:'purple'},
              {icon:'fas fa-tag',          label:'요금 관리',   section:'fares',         color:'amber'},
              {icon:'fas fa-calculator',   label:'정산 관리',   section:'settlement',    color:'red'},
              {icon:'fas fa-chart-bar',    label:'통계 보기',   section:'stats-admin',   color:'cyan'},
              {icon:'fas fa-qrcode',       label:'손목밴드',    section:'wristbands',    color:'indigo'},
              {icon:'fas fa-map-marked-alt',label:'관광정보 관리', section:'tourism',    color:'teal'},
            ].map(b=>`
              <button onclick="AdminModule.navigate('${b.section}')"
                class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-${b.color}-100 hover:border-${b.color}-300 hover:bg-${b.color}-50 transition-all text-center">
                <i class="${b.icon} text-${b.color}-500 text-xl"></i>
                <span class="text-xs font-medium text-gray-700">${b.label}</span>
              </button>`).join('')}
          </div>
        </section>

        <!-- 최근 예약 현황 -->
        <section class="bg-white rounded-xl shadow-sm p-5">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-gray-700 text-sm">최근 예약 현황 <span class="text-xs text-gray-400 font-normal">(${region.name})</span></h2>
            <button onclick="AdminModule.navigate('reservations')" class="text-blue-600 text-xs hover:underline">전체보기 →</button>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead><tr class="bg-gray-50">
                ${['예약번호','예약자','인원','금액','상태'].map(h=>`<th class="px-3 py-2 text-xs font-semibold text-gray-600">${h}</th>`).join('')}
              </tr></thead>
              <tbody class="divide-y divide-gray-100">${resRows}</tbody>
            </table>
          </div>
        </section>
      </div>
    `;
    return renderAdminLayout('region-dashboard', content, `${region.name} 대시보드`);
  };

  // 지역 대시보드 지역 전환 (슈퍼관리자 전용)
  const switchRegionDashboard = (regionId) => {
    _adminState.selectedRegion = regionId;
    regionDashboard({ regionId }).then(html => { document.getElementById('app').innerHTML = html; });
  };

  // ── 차량 관리 ──────────────────────────────────────────────
  const vehiclesPage = async (filterRegion) => {
    _adminState.currentSection = 'vehicles';
    const user = _adminState.user || Store.get('adminUser') || { role: 'super', regionId: null };

    // 지역 목록 로드
    const regRes = await API.get('/api/regions');
    const allRegions = (regRes.success && regRes.data ? regRes.data : (window.REGIONS||[])).filter(r => r.status !== 'hidden');
    if (regRes.success && regRes.data) window.REGIONS = regRes.data;

    const vRes = await API.get('/api/vehicles');
    const allVehicles = (vRes.success && Array.isArray(vRes.data)) ? vRes.data : [];

    // 필터 결정: 지역관리자=본인공정, 슈퍼=파라미터 or 'all'
    let activeFilter;
    if (user.role === 'regional' && user.regionId) {
      activeFilter = user.regionId;
    } else {
      activeFilter = (typeof filterRegion === 'string' && filterRegion) ? filterRegion : 'all';
    }

    const vehicles = activeFilter !== 'all'
      ? allVehicles.filter(v => v.regionId === activeFilter)
      : allVehicles;

    const rows = vehicles.map((v, i) => `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3">
          <div class="font-medium text-sm">${v.name}</div>
          <div class="text-xs text-gray-500">${v.plateNumber}</div>
        </td>
        <td class="px-4 py-3 text-sm text-center">${v.type === 'amphibious' ? '🚌 수륙양용' : '🚐 일반'}</td>
        <td class="px-4 py-3 text-sm text-center">${v.capacity || 45}석</td>
        <td class="px-4 py-3 text-sm text-center">${v.regionName || v.regionId || '-'}</td>
        <td class="px-4 py-3 text-sm text-center">
          <span class="px-2 py-0.5 rounded-full text-xs ${v.status==='active'?'bg-green-100 text-green-700':v.status==='maintenance'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}">
            ${v.status==='active'?'운행중':v.status==='maintenance'?'정비중':'운행중단'}
          </span>
        </td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${v.inspectionDue || '-'}</td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${v.insuranceDue || '-'}</td>
        <td class="px-4 py-3 text-center">
          <button onclick="AdminModule.editVehicle('${v.id}')" class="text-blue-600 hover:underline text-xs mr-2">수정</button>
          <button onclick="AdminModule.deleteVehicle('${v.id}')" class="text-red-500 hover:underline text-xs">삭제</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" class="text-center py-4 text-gray-500 text-sm">차량이 없습니다.</td></tr>';

    // 지역 필터 탭 (슈퍼관리자만 표시)
    const allTabActive = activeFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600';
    const regionTabsHtml = allRegions.map(r => {
      const cnt = allVehicles.filter(v => v.regionId === r.id).length;
      const cls = activeFilter === r.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600';
      return '<button onclick="AdminModule.filterVehicles(\'' + r.id + '\')" class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' + cls + '">' + r.name + ' (' + cnt + '대)</button>';
    }).join('');
    const filterTabs = (user.role !== 'regional')
      ? '<div class="flex gap-2 flex-wrap">'
        + '<button onclick="AdminModule.filterVehicles(\'all\')" class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' + allTabActive + '">전체 (' + allVehicles.length + '대)</button>'
        + regionTabsHtml
        + '</div>'
      : '';

    const content = `
      <div class="space-y-4">
        <div class="flex justify-between items-center flex-wrap gap-3">
          <h2 class="font-semibold text-gray-800">차량 목록
            <span class="ml-2 text-sm font-normal text-gray-500">
              ${activeFilter && activeFilter !== 'all'
                ? `${allRegions.find(r=>r.id===activeFilter)?.name||activeFilter} &middot; ${vehicles.length}대`
                : `전체 ${allVehicles.length}대`}
            </span>
          </h2>
          <button onclick="AdminModule.addVehicle()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <i class="fas fa-plus"></i> 차량 추가
          </button>
        </div>

        ${filterTabs}

        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead>
                <tr class="bg-gray-50">
                  ${['차량명/번호판','유형','정원','배정지역','상태','검사만료','보험만료','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100" id="vehicle-table-body">${rows}</tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 차량 추가/수정 모달 -->
      <div id="vehicle-modal" class="modal-overlay hidden" onclick="if(event.target===this)AdminModule.closeVehicleModal()">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800 text-lg" id="vehicle-modal-title">차량 추가</h3>
            <button onclick="AdminModule.closeVehicleModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div class="space-y-3" id="vehicle-form">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">차량명</label>
                <input id="v-name" type="text" placeholder="예: 아쿠아버스 1호" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">번호판</label>
                <input id="v-plate" type="text" placeholder="예: 경남 12가 3456" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">유형</label>
                <select id="v-type" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="amphibious">수륙양용버스</option>
                  <option value="bus">일반버스</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">정원 (석)</label>
                <input id="v-capacity" type="number" value="45" min="1" max="100" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">배정 지역</label>
                ${user.role === 'regional' && user.regionId
                  ? `<input type="hidden" id="v-region" value="${user.regionId}">
                     <div class="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600">${user.regionName || user.regionId}</div>`
                  : `<select id="v-region" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      ${(window.REGIONS||[]).filter(r=>r.status==='active'||r.status==='open').map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}
                    </select>`}
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">상태</label>
                <select id="v-status" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="active">운행중</option>
                  <option value="maintenance">정비중</option>
                  <option value="retired">운행중단</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">정기검사 만료일</label>
                <input id="v-inspection" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">보험 만료일</label>
                <input id="v-insurance" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">메모</label>
              <textarea id="v-memo" rows="2" placeholder="특이사항, 점검 메모 등" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="AdminModule.saveVehicle()" class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">저장</button>
            <button onclick="AdminModule.closeVehicleModal()" class="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('vehicles', content, '차량 관리');
  };

  let _editingVehicleIdx = null;
  const addVehicle = () => {
    const user = _adminState.user || { role: 'super', regionId: null };
    _editingVehicleIdx = null;
    document.getElementById('vehicle-modal-title').textContent = '차량 추가';
    ['v-name','v-plate','v-capacity','v-memo'].forEach(id => { const el = document.getElementById(id); if(el) el.value = id==='v-capacity'?'45':''; });
    // 지역관리자: 지역 기본값 세팅
    const vRegEl = document.getElementById('v-region');
    if (vRegEl && user.role === 'regional' && user.regionId) vRegEl.value = user.regionId;
    document.getElementById('vehicle-modal').classList.remove('hidden');
  };
  const editVehicle = async (idx) => {
    // idx = vehicle DB id
    const vRes = await API.get(`/api/vehicles/${idx}`);
    const v = vRes.data; if(!v) return;
    _editingVehicleIdx = idx;
    document.getElementById('vehicle-modal-title').textContent = '차량 수정';
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val||''; };
    set('v-name', v.name); set('v-plate', v.plateNumber); set('v-capacity', v.capacity||45);
    set('v-type', v.type||'amphibious'); set('v-status', v.status||'active');
    set('v-region', v.regionId||''); set('v-inspection', v.inspectionDue||v.inspectionDate||'');
    set('v-insurance', v.insuranceDue||v.insuranceDate||''); set('v-memo', v.notes||v.memo||'');
    document.getElementById('vehicle-modal').classList.remove('hidden');
  };
  const saveVehicle = async () => {
    const get = (id) => document.getElementById(id)?.value||'';
    const vData = {
      name: get('v-name'), plateNumber: get('v-plate'), type: get('v-type'),
      capacity: parseInt(get('v-capacity'))||45, regionId: get('v-region'),
      status: get('v-status'), inspectionDue: get('v-inspection'),
      insuranceDue: get('v-insurance'), notes: get('v-memo'),
    };
    if (!vData.name) { Utils.toast('차량명을 입력하세요', 'error'); return; }
    Utils.loading(true);
    let res;
    if (_editingVehicleIdx !== null) {
      res = await API.put(`/api/vehicles/${_editingVehicleIdx}`, vData);
    } else {
      res = await API.post('/api/vehicles', vData);
    }
    Utils.loading(false);
    if (res.success) {
      closeVehicleModal();
      Utils.toast('차량이 저장되었습니다.', 'success');
      vehiclesPage().then(html => { document.getElementById('app').innerHTML = html; });
    } else {
      Utils.toast(res.message || '저장 중 오류가 발생했습니다.', 'error');
    }
  };
  const deleteVehicle = (idx) => {
    Utils.confirm('이 차량을 삭제하시겠습니까?', async () => {
      Utils.loading(true);
      const res = await API.delete(`/api/vehicles/${idx}`);
      Utils.loading(false);
      Utils.closeModal();
      if (res.success) {
        Utils.toast('삭제되었습니다.', 'success');
        vehiclesPage().then(html => { document.getElementById('app').innerHTML = html; });
      } else {
        Utils.toast(res.message || '삭제 중 오류가 발생했습니다.', 'error');
      }
    });
  };
  const closeVehicleModal = () => {
    const m = document.getElementById('vehicle-modal');
    if(m) m.classList.add('hidden');
  };

  // ── ESC 키로 열린 모달 닫기 (vehicle / schedule / auto-schedule / recurring) ──
  if (!window._amkEscHandlerAdded) {
    window._amkEscHandlerAdded = true;
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      // vehicle-modal
      const vm = document.getElementById('vehicle-modal');
      if (vm && !vm.classList.contains('hidden')) { vm.classList.add('hidden'); return; }
      // schedule-modal
      const sm = document.getElementById('schedule-modal');
      if (sm && !sm.classList.contains('hidden')) { sm.classList.add('hidden'); return; }
      // auto-schedule-modal
      const am = document.getElementById('auto-schedule-modal');
      if (am && !am.classList.contains('hidden')) { am.classList.add('hidden'); return; }
      // recurring-modal
      const rm = document.getElementById('recurring-modal');
      if (rm && !rm.classList.contains('hidden')) { rm.classList.add('hidden'); return; }
    });
  }

  // 지역 필터 탭 클릭 → 페이지 재렌더링
  const filterVehicles = (regionId) => {
    vehiclesPage(regionId).then(html => { document.getElementById('app').innerHTML = html; });
  };

  // ── 일정 관리 ──────────────────────────────────────────────
  // ── 시간 유틸 ────────────────────────────────────────────────
  // HH:mm 형식 검증
  const _isValidTime = (t) => /^\d{2}:\d{2}$/.test(t) && parseInt(t.split(':')[0]) < 24 && parseInt(t.split(':')[1]) < 60;
  // 분 더하기 → HH:mm
  const _addMinutes = (hhmm, mins) => {
    const [h, m] = hhmm.split(':').map(Number);
    const total = h * 60 + m + mins;
    const rh = Math.floor(total / 60) % 24;
    const rm = total % 60;
    return `${String(rh).padStart(2,'0')}:${String(rm).padStart(2,'0')}`;
  };
  // HH:mm → 분 단위 정수
  const _toMinutes = (hhmm) => { const [h,m] = (hhmm||'00:00').split(':').map(Number); return h*60+m; };
  // 예약 존재 여부 확인 (regionId + scheduleId)
  const _hasReservations = (regionId, scheduleId) => {
    const res = JSON.parse(localStorage.getItem('amk_reservations') || '[]');
    return res.some(r => r.regionId === regionId && r.scheduleId === scheduleId && r.status !== 'cancelled');
  };
  // 스케줄 ID 생성
  const _makeScheduleId = (regionId, time) => `${regionId}-${time.replace(':','')}`;
  // 차량 목록 가져오기
  const _getVehicles = (regionId) => {
    // Check window cache (populated by schedulesPage via API)
    if (window._vehicleCache && window._vehicleCache[regionId]) {
      return window._vehicleCache[regionId].filter(v => v.status !== 'inactive');
    }
    const all = Settings.get('vehicles') || {};
    return (all[regionId] || []).filter(v => v.status !== 'inactive');
  };

  const schedulesPage = async () => {
    _adminState.currentSection = 'schedules';
    const user = _adminState.user || { role: 'super', regionId: null };
    // DB에서 지역 및 스케줄 로드
    const regRes = await API.get('/api/regions');
    const allRegions = (regRes.success && regRes.data) ? regRes.data : (window.REGIONS || []);
    window.REGIONS = allRegions;
    // 지역관리자: 본인 지역만 표시
    const regions = user.role === 'regional' && user.regionId
      ? allRegions.filter(r => r.id === user.regionId)
      : allRegions.filter(r => r.status !== 'hidden');
    const activeRegionId = (user.role === 'regional' && user.regionId)
      ? user.regionId
      : (_adminState.selectedRegion || regions[0]?.id || 'buyeo');
    const schRes = await API.get(`/api/schedules/${activeRegionId}`);
    const schedules = (schRes.success && schRes.data) ? schRes.data : [];
    // Load vehicles from API and cache for _getVehicles()
    const vehRes = await API.get(`/api/vehicles/${activeRegionId}`);
    if (vehRes.success && vehRes.data) {
      if (!window._vehicleCache) window._vehicleCache = {};
      window._vehicleCache[activeRegionId] = vehRes.data;
    }
    const vehicles = _getVehicles(activeRegionId);

    const regionTabs = regions.map(r=>`
      <button onclick="AdminModule.selectScheduleRegion('${r.id}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${r.id===activeRegionId?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
        ${r.shortName}
      </button>
    `).join('');

    const _dayKor = { mon:'월', tue:'화', wed:'수', thu:'목', fri:'금', sat:'토', sun:'일' };
    const scheduleRows = schedules.map((s, i) => {
      const sid = s.id || _makeScheduleId(activeRegionId, s.time);
      const hasRes = _hasReservations(activeRegionId, sid);
      const dur = s.duration || 45;
      const endTime = s.time ? _addMinutes(s.time, dur) : '-';
      const statusClass = s.status==='active'?'bg-green-100 text-green-700':s.status==='suspended'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-500';
      const statusLabel = s.status==='active'?'운영':s.status==='suspended'?'운휴':'중단';
      // 배정차량: vehicleId로 DB에서 이름 찾기
      const assignedV = s.vehicleId
        ? (vehicles.find(v=>v.id===s.vehicleId)?.name || s.vehicleId)
        : '-';
      // 운영요일: mon/tue... 형식이면 한글 변환
      const rawDays = s.days || s.operatingDays || ['월','화','수','목','금','토','일'];
      const displayDays = rawDays.map(d => _dayKor[d] || d).join('');
      return `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 font-medium text-sm text-center">${s.time || '-'}</td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${endTime}</td>
        <td class="px-4 py-3 text-sm text-center">${dur}분</td>
        <td class="px-4 py-3 text-sm text-center font-medium text-blue-700">${assignedV}</td>
        <td class="px-4 py-3 text-sm text-center">
          <span class="text-xs">${s.capacity || 38}명</span>
          <span class="text-xs text-gray-400 ml-1">(총 ${s.totalSeats||40}석)</span>
        </td>
        <td class="px-4 py-3 text-sm text-center">${s.onlineCapacity !== undefined ? s.onlineCapacity : Math.ceil((s.capacity||38)*0.7)}석 / ${s.offlineCapacity !== undefined ? s.offlineCapacity : (s.capacity||38) - Math.ceil((s.capacity||38)*0.7)}석</td>
        <td class="px-4 py-3 text-sm text-center text-xs">${displayDays}</td>
        <td class="px-4 py-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">${statusLabel}</span>
          ${hasRes?'<span class="ml-1 text-xs text-orange-500" title="예약 있음">●</span>':''}
        </td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          <button onclick="AdminModule.editSchedule('${activeRegionId}','${s.id||i}')" class="text-blue-600 hover:underline text-xs mr-1">수정</button>
          <button onclick="AdminModule.toggleScheduleStatus('${activeRegionId}','${s.id||i}')" class="text-orange-500 hover:underline text-xs mr-1">${s.status==='active'?'운휴':'재개'}</button>
          <button onclick="AdminModule.deleteSchedule('${activeRegionId}','${s.id||i}')" class="text-red-500 hover:underline text-xs">삭제</button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="10" class="text-center py-6 text-gray-400 text-sm">등록된 일정이 없습니다.</td></tr>';

    // 24시간제 시간 select 옵션 (08:00~19:30, 30분 단위)
    const timeOptions = (() => {
      let opts = '<option value="">시간 선택</option>';
      for (let h = 6; h <= 21; h++) {
        for (let m of [0, 30]) {
          const hh = String(h).padStart(2,'0');
          const mm = String(m).padStart(2,'0');
          opts += `<option value="${hh}:${mm}">${hh}:${mm}</option>`;
        }
      }
      return opts;
    })();

    // 반복모달 차량 옵션
    const vehicleOpts = vehicles.map(v=>`<option value="${v.name||v.id}">${v.name||v.id} (${v.capacity||45}석)</option>`).join('') || '<option value="1호차">1호차</option><option value="2호차">2호차</option>';

    const content = `
      <div class="space-y-4">
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div class="flex gap-2 flex-wrap">${regionTabs}</div>
          <div class="flex gap-2">
            <button onclick="AdminModule.showAutoScheduleModal('${activeRegionId}')" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
              <i class="fas fa-magic"></i> 자동 스케줄 생성
            </button>
            <button onclick="AdminModule.showRecurringModal('${activeRegionId}')" class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2">
              <i class="fas fa-redo"></i> 반복 일정 생성
            </button>
            <button onclick="AdminModule.addSchedule('${activeRegionId}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
              <i class="fas fa-plus"></i> 일정 추가
            </button>
          </div>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-700 flex items-center gap-2">
          <i class="fas fa-info-circle"></i>
          시간은 24시간제(HH:mm)로 표시됩니다. <strong>●</strong> 표시는 예약이 있는 회차로 시간 변경 시 주의가 필요합니다.
        </div>
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead>
                <tr class="bg-gray-50">
                  ${['출발시간','종료예상','소요시간','배정차량','총정원','온라인/현장','운영요일','상태','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100" id="schedule-table-body">${scheduleRows}</tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 일정 추가/수정 모달 -->
      <div id="schedule-modal" class="modal-overlay hidden" onclick="if(event.target===this)this.classList.add('hidden')">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800 text-lg" id="schedule-modal-title">일정 추가</h3>
            <button onclick="document.getElementById('schedule-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
          <div id="sch-res-warn" class="hidden mb-3 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
            <i class="fas fa-exclamation-triangle mr-1"></i>
            이 회차에 예약이 있습니다. 시간 변경 시 기존 예약자에게 별도 안내가 필요합니다.
          </div>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">출발 시간 (24시간제)</label>
                <div class="flex gap-1">
                  <select id="s-time-select" class="flex-1 border rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" onchange="document.getElementById('s-time').value=this.value">
                    ${timeOptions}
                  </select>
                  <input id="s-time" type="text" placeholder="HH:mm" maxlength="5"
                    class="w-20 border rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono"
                    oninput="this.value=this.value.replace(/[^0-9:]/g,'');if(this.value.length===2&&!this.value.includes(':'))this.value+=':';document.getElementById('s-time-select').value=this.value">
                </div>
                <p class="text-xs text-gray-400 mt-1">예: 09:00, 14:30</p>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">소요 시간 (분)</label>
                <input id="s-duration" type="number" value="70" min="10" max="300"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  oninput="AdminModule.updateSeatPreview()">
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">배정 차량</label>
              <select id="s-vehicle" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">자동 배정</option>
                ${vehicleOpts}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">고객 정원 (총40석-2석)</label>
                <input id="s-capacity" type="number" value="38" min="1" max="200"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  oninput="AdminModule.updateSeatPreview()">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">온라인 비율 (%)</label>
                <input id="s-online-ratio" type="number" value="70" min="0" max="100"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  oninput="AdminModule.updateSeatPreview()">
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 text-sm" id="seat-preview">
              <span class="text-gray-600">온라인 좌석: <strong id="sp-online">32</strong>석 | 현장 좌석: <strong id="sp-offline">13</strong>석</span>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">운영 요일</label>
              <div class="flex flex-wrap gap-2">
                ${['월','화','수','목','금','토','일'].map(d=>`
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" name="s-days" value="${d}" checked class="rounded text-blue-600">
                    <span class="text-sm">${d}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">적용 시작일</label>
                <input id="s-start-date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">적용 종료일 (미입력=무기한)</label>
                <input id="s-end-date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="AdminModule.saveSchedule()" class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">저장</button>
            <button onclick="document.getElementById('schedule-modal').classList.add('hidden')" class="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>

      <!-- 자동 스케줄 생성 모달 (세션7: 배차 로직 개선) -->
      <div id="auto-schedule-modal" class="modal-overlay hidden" onclick="if(event.target===this)this.classList.add('hidden')">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800 text-lg"><i class="fas fa-magic text-green-500 mr-2"></i>자동 스케줄 생성</h3>
            <button onclick="document.getElementById('auto-schedule-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>

          <!-- 배차 방식 선택 탭 -->
          <div class="flex gap-2 mb-4 border-b">
            <button id="dispatch-tab-manual" onclick="AdminModule.switchDispatchMode('manual')"
              class="px-4 py-2 text-sm font-medium border-b-2 border-green-500 text-green-700 -mb-px">
              ① 수동 배차간격 지정
            </button>
            <button id="dispatch-tab-auto" onclick="AdminModule.switchDispatchMode('auto')"
              class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 -mb-px">
              ② 차량 수 기준 자동 최적 배차
            </button>
          </div>

          <!-- ① 수동 모드 -->
          <div id="dispatch-manual-section" class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 mb-4">
            <i class="fas fa-hand-pointer mr-1"></i>
            <strong>수동 배차간격 지정:</strong> 5분 단위로 배차간격을 직접 선택합니다. 차량 충돌 여부는 미리보기에서 자동 확인됩니다.
          </div>
          <!-- ② 자동 최적 모드 -->
          <div id="dispatch-auto-section" class="hidden bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 mb-4">
            <i class="fas fa-calculator mr-1"></i>
            <strong>자동 최적 배차:</strong> 운행소요시간 + 재정비시간 ÷ 차량 수 → 5분 단위 내림 배차간격 자동 계산
            <div id="auto-optimal-result" class="mt-2 font-bold text-green-700 hidden"></div>
          </div>

          <div class="space-y-4">
            <!-- 기본 설정: 첫차/막차 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">첫차 시간</label>
                <select id="auto-first" class="w-full border rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" onchange="AdminModule.previewAutoSchedule()">
                  ${timeOptions}
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">막차 시간</label>
                <select id="auto-last" class="w-full border rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" onchange="AdminModule.previewAutoSchedule()">
                  ${timeOptions}
                </select>
              </div>
            </div>

            <!-- 운행 파라미터 -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">운행 소요시간 (분)</label>
                <input id="auto-duration" type="number" value="45" min="10" max="300"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  oninput="AdminModule.previewAutoSchedule()">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">재정비시간 (분)</label>
                <input id="auto-maintenance" type="number" value="10" min="0" max="120"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  oninput="AdminModule.previewAutoSchedule()">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">운행 차량 수</label>
                <input id="auto-vehicle-count" type="number" value="2" min="1" max="20"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  oninput="AdminModule.previewAutoSchedule()">
              </div>
            </div>

            <!-- 배차간격: 수동/자동 분기 -->
            <div id="dispatch-interval-manual" class="">
              <label class="block text-xs font-medium text-gray-700 mb-1">배차 간격 (5분 단위)</label>
              <select id="auto-interval" class="w-full border rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" onchange="AdminModule.previewAutoSchedule()">
                ${[5,10,15,20,25,30,35,40,45,50,55,60].map(v=>`<option value="${v}"${v===30?' selected':''}>${v}분</option>`).join('')}
              </select>
            </div>
            <div id="dispatch-interval-auto" class="hidden">
              <label class="block text-xs font-medium text-gray-700 mb-1">배차 간격 (자동 계산 — 조정 가능)</label>
              <div id="auto-interval-display" class="text-xs text-green-700 mb-1 font-medium">— 위 값 입력 후 자동 계산</div>
              <select id="auto-interval" class="w-full border border-green-400 bg-green-50 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold text-green-800" onchange="AdminModule.previewAutoSchedule()">
                ${[5,10,15,20,25,30,35,40,45,50,55,60].map(v=>`<option value="${v}"${v===30?' selected':''}>${v}분</option>`).join('')}
              </select>
            </div>

            <!-- 정원 설정 -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">총 좌석</label>
                <input id="auto-total-seats" type="number" value="40" min="1" max="200" readonly
                  class="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">제외 (운전자+가이드)</label>
                <input id="auto-exclude-seats" type="number" value="2" min="0" max="10" readonly
                  class="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">고객 가능 정원</label>
                <input id="auto-capacity" type="number" value="38" min="1" max="200" readonly
                  class="w-full border border-green-300 bg-green-50 rounded-lg px-3 py-2 text-sm font-bold text-green-800">
              </div>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
              <i class="fas fa-info-circle mr-1"></i>
              총 40석 / 제외 2석(운전자+가이드) / 고객 예약 가능 <strong>38명</strong> |
              온라인 70%: <strong>27석</strong> / 현장: <strong>11석</strong>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">온라인 비율 (%)</label>
              <input id="auto-online-ratio" type="number" value="70" min="0" max="100"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                oninput="AdminModule.previewAutoSchedule()">
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">운영 요일</label>
              <div class="flex flex-wrap gap-2">
                ${['월','화','수','목','금','토','일'].map(d=>`
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" name="auto-days" value="${d}" checked class="rounded text-green-600" onchange="AdminModule.previewAutoSchedule()">
                    <span class="text-sm">${d}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">적용 시작일</label>
                <input id="auto-start-date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">적용 종료일 (미입력=무기한)</label>
                <input id="auto-end-date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none">
              </div>
            </div>

            <!-- 미리보기 -->
            <div id="auto-preview-wrap" class="hidden">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-semibold text-gray-700"><i class="fas fa-eye mr-1 text-green-500"></i>생성 미리보기</h4>
                <span id="auto-preview-count" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"></span>
              </div>
              <div id="auto-conflict-warn" class="hidden mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                <i class="fas fa-exclamation-triangle mr-1"></i>
                <span id="auto-conflict-msg"></span>
              </div>
              <div class="overflow-x-auto max-h-56 overflow-y-auto border rounded-lg">
                <table class="w-full text-xs">
                  <thead class="bg-gray-50 sticky top-0">
                    <tr>
                      ${['회차','출발','운행종료','재정비종료','배정차량','온라인석','현장석','상태'].map(h=>`<th class="px-3 py-2 text-gray-600 text-center font-semibold">${h}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody id="auto-preview-body" class="divide-y divide-gray-100"></tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="AdminModule.previewAutoSchedule()" class="border border-green-500 text-green-600 px-4 py-2 rounded-lg text-sm hover:bg-green-50 flex items-center gap-1">
              <i class="fas fa-eye"></i> 미리보기
            </button>
            <button onclick="AdminModule.confirmAutoSchedule()" class="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 font-medium">
              <i class="fas fa-check mr-1"></i> 생성 확정
            </button>
            <button onclick="document.getElementById('auto-schedule-modal').classList.add('hidden')" class="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>

      <!-- 반복 일정 생성 모달 (개선) -->
      <div id="recurring-modal" class="modal-overlay hidden" onclick="if(event.target===this)this.classList.add('hidden')">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl max-h-screen overflow-y-auto" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800 text-lg"><i class="fas fa-redo text-purple-500 mr-2"></i>반복 일정 생성</h3>
            <button onclick="document.getElementById('recurring-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
          <!-- 모드 선택 -->
          <div class="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
            <button id="rec-mode-manual-btn" onclick="AdminModule.switchRecMode('manual')"
              class="flex-1 py-1.5 rounded-lg text-xs font-medium bg-white shadow text-purple-700 transition-all">
              ✏️ 직접 입력
            </button>
            <button id="rec-mode-auto-btn" onclick="AdminModule.switchRecMode('auto')"
              class="flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-500 transition-all">
              ⚡ 자동 계산 (첫차/막차/배차간격)
            </button>
          </div>
          <div class="space-y-3">
            <div class="p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
              설정한 시간대를 지정 기간 동안 반복 생성합니다. 운영요일 외에는 자동 제외됩니다.
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">시작일</label>
                <input id="rec-start" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">종료일</label>
                <input id="rec-end" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
              </div>
            </div>
            <!-- 직접 입력 모드 -->
            <div id="rec-manual-section">
              <label class="block text-xs font-medium text-gray-700 mb-2">운행 시간 (24시간제, 여러 개 가능)</label>
              <div id="rec-times" class="space-y-2">
                <div class="flex gap-2 items-center">
                  <select class="rec-time-select border rounded px-2 py-1.5 text-sm w-24 focus:ring-2 focus:ring-purple-500 outline-none" onchange="this.nextElementSibling.value=this.value">${timeOptions}</select>
                  <input type="text" value="09:00" placeholder="HH:mm" maxlength="5" class="rec-time-input border rounded px-2 py-1.5 text-sm w-20 text-center font-mono focus:ring-2 focus:ring-purple-500 outline-none" oninput="this.previousElementSibling.value=this.value">
                  <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 text-xs px-1">삭제</button>
                </div>
                <div class="flex gap-2 items-center">
                  <select class="rec-time-select border rounded px-2 py-1.5 text-sm w-24 focus:ring-2 focus:ring-purple-500 outline-none" onchange="this.nextElementSibling.value=this.value">${timeOptions}</select>
                  <input type="text" value="13:00" placeholder="HH:mm" maxlength="5" class="rec-time-input border rounded px-2 py-1.5 text-sm w-20 text-center font-mono focus:ring-2 focus:ring-purple-500 outline-none" oninput="this.previousElementSibling.value=this.value">
                  <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 text-xs px-1">삭제</button>
                </div>
              </div>
              <button onclick="AdminModule.addRecTime()" class="mt-2 text-purple-600 text-xs hover:underline flex items-center gap-1"><i class="fas fa-plus-circle"></i> 시간 추가</button>
            </div>
            <!-- 자동 계산 모드 -->
            <div id="rec-auto-section" class="hidden space-y-3">
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">첫차</label>
                  <select id="rec-auto-first" class="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none" onchange="AdminModule.calcRecAutoTimes()">${timeOptions}</select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">막차</label>
                  <select id="rec-auto-last" class="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none" onchange="AdminModule.calcRecAutoTimes()">${timeOptions}</select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">배차간격</label>
                  <select id="rec-auto-interval" class="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none" onchange="AdminModule.calcRecAutoTimes()">
                    <option value="30">30분</option>
                    <option value="60" selected>60분</option>
                    <option value="90">90분</option>
                    <option value="120">120분</option>
                  </select>
                </div>
              </div>
              <div id="rec-auto-calc-result" class="hidden bg-purple-50 rounded-lg p-3 text-xs text-purple-700"></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">총 정원</label>
                <input id="rec-capacity" type="number" value="38" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">온라인 비율 (%)</label>
                <input id="rec-ratio" type="number" value="70" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">운영 요일</label>
              <div class="flex flex-wrap gap-2">
                ${['월','화','수','목','금','토','일'].map(d=>`
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" name="rec-days" value="${d}" checked class="rounded text-purple-600">
                    <span class="text-sm">${d}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="AdminModule.generateRecurring()" class="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700 font-medium"><i class="fas fa-magic mr-1"></i>생성</button>
            <button onclick="document.getElementById('recurring-modal').classList.add('hidden')" class="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('schedules', content, '일정 관리');
  };

  // ── 반복모달 모드 전환 ──────────────────────────────────────
  const switchRecMode = (mode) => {
    const manualBtn = document.getElementById('rec-mode-manual-btn');
    const autoBtn   = document.getElementById('rec-mode-auto-btn');
    const manualSec = document.getElementById('rec-manual-section');
    const autoSec   = document.getElementById('rec-auto-section');
    if (!manualBtn) return;
    if (mode === 'manual') {
      manualBtn.className = 'flex-1 py-1.5 rounded-lg text-xs font-medium bg-white shadow text-purple-700 transition-all';
      autoBtn.className   = 'flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-500 transition-all';
      manualSec.classList.remove('hidden');
      autoSec.classList.add('hidden');
    } else {
      autoBtn.className   = 'flex-1 py-1.5 rounded-lg text-xs font-medium bg-white shadow text-purple-700 transition-all';
      manualBtn.className = 'flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-500 transition-all';
      manualSec.classList.add('hidden');
      autoSec.classList.remove('hidden');
      calcRecAutoTimes();
    }
  };
  // 자동 계산 모드 - 첫차/막차/간격으로 시간 목록 계산
  const calcRecAutoTimes = () => {
    const first = document.getElementById('rec-auto-first')?.value;
    const last  = document.getElementById('rec-auto-last')?.value;
    const interval = parseInt(document.getElementById('rec-auto-interval')?.value) || 60;
    const resultEl = document.getElementById('rec-auto-calc-result');
    if (!first || !last || !resultEl) return;
    const firstM = _toMinutes(first);
    const lastM  = _toMinutes(last);
    if (firstM >= lastM) { resultEl.className = 'bg-red-50 rounded-lg p-3 text-xs text-red-700'; resultEl.textContent = '첫차가 막차보다 이른 시간이어야 합니다.'; resultEl.classList.remove('hidden'); return; }
    const times = [];
    for (let m = firstM; m <= lastM; m += interval) {
      const h = Math.floor(m/60), min = m%60;
      times.push(`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`);
    }
    resultEl.className = 'bg-purple-50 rounded-lg p-3 text-xs text-purple-700';
    resultEl.innerHTML = `<strong>계산된 운행 시간 ${times.length}회차:</strong> ${times.join(' / ')}`;
    resultEl.classList.remove('hidden');
    resultEl.dataset.times = JSON.stringify(times);
  };

  const selectScheduleRegion = (regionId) => { _adminState.selectedRegion = regionId; schedulesPage().then(html => { document.getElementById('app').innerHTML = html; }); };
  const updateSeatPreview = () => {
    const cap = parseInt(document.getElementById('s-capacity')?.value)||38;
    const ratio = parseInt(document.getElementById('s-online-ratio')?.value)||70;
    const onl = Math.round(cap * ratio / 100);
    const off = cap - onl;
    if(document.getElementById('sp-online')) document.getElementById('sp-online').textContent = onl;
    if(document.getElementById('sp-offline')) document.getElementById('sp-offline').textContent = off;
  };
  let _editingScheduleIdx = null, _editingScheduleRegion = null;

  const addSchedule = (regionId) => {
    _editingScheduleIdx = null;
    _editingScheduleRegion = regionId;
    document.getElementById('schedule-modal-title').textContent = '일정 추가';
    const warn = document.getElementById('sch-res-warn');
    if (warn) warn.classList.add('hidden');
    document.getElementById('schedule-modal').classList.remove('hidden');
  };

  const editSchedule = async (regionId, scheduleId) => {
    const schRes = await API.get(`/api/schedules/${regionId}`);
    const s = schRes.data?.find(sch => String(sch.id) === String(scheduleId));
    if (!s) { Utils.toast('일정 정보를 불러올 수 없습니다', 'error'); return; }
    _editingScheduleIdx = scheduleId;
    _editingScheduleRegion = regionId;
    document.getElementById('schedule-modal-title').textContent = '일정 수정';
    // 예약 있는 경우 경고 표시
    const warn = document.getElementById('sch-res-warn');
    if (warn) { _hasReservations(regionId, scheduleId) ? warn.classList.remove('hidden') : warn.classList.add('hidden'); }
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val??''; };
    set('s-time', s.time||'');
    set('s-time-select', s.time||'');
    set('s-duration', s.duration||45);
    set('s-capacity', s.capacity||38);
    // onlineCapacity → 비율 역산 (없으면 70%)
    const cap = s.capacity || 38;
    const onlCap = s.onlineCapacity ?? Math.round(cap * 0.7);
    const ratio = Math.round((onlCap / cap) * 100);
    set('s-online-ratio', ratio);
    set('s-vehicle', s.vehicle||'');
    set('s-start-date', s.startDate||'');
    set('s-end-date', s.endDate||'');
    // 운영요일: DB days 배열은 영문('mon'...) 또는 한글('월'...) 혼용 가능
    const dayMap = { mon:'월', tue:'화', wed:'수', thu:'목', fri:'금', sat:'토', sun:'일' };
    const rawDays = s.days || s.operatingDays || [];
    const korDays = rawDays.map(d => dayMap[d] || d);
    document.querySelectorAll('input[name="s-days"]').forEach(cb => {
      cb.checked = korDays.length === 0 || korDays.includes(cb.value);
    });
    document.getElementById('schedule-modal').classList.remove('hidden');
    updateSeatPreview();
  };

  const saveSchedule = async () => {
    const get = (id) => document.getElementById(id)?.value||'';
    const timeVal = get('s-time').trim();
    if (!timeVal || !_isValidTime(timeVal)) { Utils.toast('출발 시간을 올바른 형식(HH:mm)으로 입력하세요', 'error'); return; }
    const days = [...document.querySelectorAll('input[name="s-days"]:checked')].map(c=>c.value);
    const cap = parseInt(get('s-capacity'))||38;
    const ratio = parseInt(get('s-online-ratio'))||70;
    if (ratio < 0 || ratio > 100) { Utils.toast('온라인 비율은 0~100 사이여야 합니다', 'error'); return; }
    const regionId = _editingScheduleRegion;
    const dayMapRev = { '월':'mon','화':'tue','수':'wed','목':'thu','금':'fri','토':'sat','일':'sun' };
    const sData = {
      time: timeVal,
      duration: parseInt(get('s-duration'))||45,
      vehicleId: get('s-vehicle') || null,
      capacity: cap,
      onlineCapacity: Math.round(cap*ratio/100),
      offlineCapacity: cap - Math.round(cap*ratio/100),
      days: days.map(d => dayMapRev[d] || d),
      startDate: get('s-start-date') || null,
      endDate: get('s-end-date') || null,
      status: 'active',
    };
    Utils.loading(true);
    let res;
    if (_editingScheduleIdx !== null) {
      res = await API.put(`/api/schedules/${regionId}/${_editingScheduleIdx}`, sData);
    } else {
      res = await API.post(`/api/schedules/${regionId}`, sData);
    }
    Utils.loading(false);
    if (res.success) {
      document.getElementById('schedule-modal').classList.add('hidden');
      Utils.toast('일정이 저장되었습니다.', 'success');
      schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
    } else {
      Utils.toast(res.message || '저장 중 오류가 발생했습니다.', 'error');
    }
  };
  const toggleScheduleStatus = async (regionId, scheduleId) => {
    // scheduleId = DB id
    const schRes = await API.get(`/api/schedules/${regionId}`);
    const sch = schRes.data?.find(s => s.id === scheduleId || String(s.id) === String(scheduleId));
    if (!sch) return;
    const newStatus = sch.status === 'active' ? 'suspended' : 'active';
    const res = await API.put(`/api/schedules/${regionId}/${scheduleId}`, { status: newStatus });
    if (res.success) {
      Utils.toast(newStatus === 'active' ? '운영 재개되었습니다.' : '운휴 처리되었습니다.', 'info');
      schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
    } else Utils.toast('상태 변경 실패', 'error');
  };

  const deleteSchedule = (regionId, scheduleId) => {
    Utils.confirm('이 일정을 삭제하시겠습니까?', async () => {
      Utils.loading(true);
      const res = await API.delete(`/api/schedules/${regionId}/${scheduleId}`);
      Utils.loading(false);
      Utils.closeModal();
      if (res.success) {
        Utils.toast('삭제되었습니다.', 'success');
        schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
      } else {
        Utils.toast(res.message || '삭제 실패: ' + (res.error||''), 'error');
      }
    });
  };

  // ── 자동 스케줄 생성 ────────────────────────────────────────
  let _autoScheduleRegion = null;
  let _dispatchMode = 'manual'; // 'manual' | 'auto'

  // 배차 방식 탭 전환
  const switchDispatchMode = (mode) => {
    _dispatchMode = mode;
    const manualTab = document.getElementById('dispatch-tab-manual');
    const autoTab   = document.getElementById('dispatch-tab-auto');
    const manualInfo = document.getElementById('dispatch-manual-section');
    const autoInfo   = document.getElementById('dispatch-auto-section');
    const intervalManual = document.getElementById('dispatch-interval-manual');
    const intervalAuto   = document.getElementById('dispatch-interval-auto');
    if (mode === 'manual') {
      manualTab?.classList.add('border-green-500','text-green-700');
      manualTab?.classList.remove('border-transparent','text-gray-500');
      autoTab?.classList.remove('border-green-500','text-green-700');
      autoTab?.classList.add('border-transparent','text-gray-500');
      manualInfo?.classList.remove('hidden');
      autoInfo?.classList.add('hidden');
      intervalManual?.classList.remove('hidden');
      intervalAuto?.classList.add('hidden');
    } else {
      autoTab?.classList.add('border-green-500','text-green-700');
      autoTab?.classList.remove('border-transparent','text-gray-500');
      manualTab?.classList.remove('border-green-500','text-green-700');
      manualTab?.classList.add('border-transparent','text-gray-500');
      autoInfo?.classList.remove('hidden');
      manualInfo?.classList.add('hidden');
      intervalAuto?.classList.remove('hidden');
      intervalManual?.classList.add('hidden');
    }
    previewAutoSchedule();
  };

  // 최소 가능 배차간격 계산: ceil(ceil((duration+maintenance)/vehicles)/5)*5
  const _calcMinInterval = (duration, maintenance, vehicles) => {
    // 최소 배차간격 = (운행소요시간 + 재정비시간) / 차량대수, 5분 단위 내림
    // 예: 45분+10분=55분, 2대 → 55/2=27.5 → 5분 단위 내림 → 25분
    // (27.5분 간격으로 2대 운영 시 55분 후 1대 돌아오므로 가능)
    const rotation = duration + maintenance;
    const raw      = rotation / Math.max(vehicles, 1);
    return Math.max(5, Math.floor(raw / 5) * 5);  // 5분 단위 내림 (최소 5분)
  };

  const showAutoScheduleModal = (regionId) => {
    _autoScheduleRegion = regionId;
    _dispatchMode = 'manual';
    setTimeout(() => {
      const fEl = document.getElementById('auto-first');
      const lEl = document.getElementById('auto-last');
      if (fEl) fEl.value = '09:00';
      if (lEl) lEl.value = '21:00';
      // 모드 초기화
      switchDispatchMode('manual');
      document.getElementById('auto-preview-wrap')?.classList.add('hidden');
      // 차량 수 기본값: 등록 차량 수
      const vCount = Math.max(_getVehicles(regionId).length, 2);
      const vcEl = document.getElementById('auto-vehicle-count');
      if (vcEl) vcEl.value = vCount;
    }, 50);
    document.getElementById('auto-schedule-modal').classList.remove('hidden');
  };

  const previewAutoSchedule = async () => {
    const first       = document.getElementById('auto-first')?.value;
    const last        = document.getElementById('auto-last')?.value;
    const duration    = parseInt(document.getElementById('auto-duration')?.value) || 45;
    const maintenance = parseInt(document.getElementById('auto-maintenance')?.value) || 10;
    const vCountInput = parseInt(document.getElementById('auto-vehicle-count')?.value) || 2;
    const cap         = 38; // 항목2: 고정 38명
    const ratio       = parseInt(document.getElementById('auto-online-ratio')?.value) || 70;

    if (!first || !last) { Utils.toast('첫차와 막차 시간을 선택하세요', 'warning'); return; }
    const firstM = _toMinutes(first);
    const lastM  = _toMinutes(last);
    if (firstM >= lastM) { Utils.toast('첫차가 막차보다 이른 시간이어야 합니다.', 'error'); return; }

    // 배차간격 결정
    let interval;
    const minInterval = _calcMinInterval(duration, maintenance, vCountInput);

    if (_dispatchMode === 'auto') {
      // 자동 최적: minInterval 감안해 select 기본값 설정 (수동 조정 가능)
      const selectEl = document.getElementById('auto-interval');
      // 현재 select 값이 minInterval보다 작으면 minInterval로 조정, 아니면 유지
      const curVal = parseInt(selectEl?.value) || 30;
      if (curVal < minInterval && selectEl) selectEl.value = minInterval;
      interval = parseInt(selectEl?.value) || minInterval;
      const displayEl = document.getElementById('auto-interval-display');
      const resultEl  = document.getElementById('auto-optimal-result');
      if (displayEl) displayEl.textContent = `✅ 최소 가능 배차간격: ${minInterval}분 ((${duration}+${maintenance})÷${vCountInput}대 = ${Math.floor((duration+maintenance)/vCountInput)}분 → 5분 내림)`;
      if (resultEl) { resultEl.textContent = `현재 선택된 배차간격: ${interval}분 (최소 ${minInterval}분 이상 선택 가능)`; resultEl.classList.remove('hidden'); }
    } else {
      // 수동: 선택 값 사용, 불가능하면 경고
      interval = parseInt(document.getElementById('auto-interval')?.value) || 30;
      if (interval < minInterval) {
        const warnEl  = document.getElementById('auto-conflict-warn');
        const warnMsg = document.getElementById('auto-conflict-msg');
        if (warnEl && warnMsg) {
          warnMsg.textContent = `⚠️ 선택한 배차간격(${interval}분)이 최소 가능 간격(${minInterval}분)보다 짧습니다. 차량 충돌이 발생할 수 있습니다. 미리보기에서 충돌 여부를 확인하세요.`;
          warnEl.classList.remove('hidden');
        }
        // 경고만 표시하고 미리보기는 계속 진행 (차단하지 않음)
      } else {
        document.getElementById('auto-conflict-warn')?.classList.add('hidden');
      }
    }

    const vehicles = _getVehicles(_autoScheduleRegion);
    const vCount   = Math.max(vehicles.length, vCountInput);
    // 온라인 27석(70%), 현장 11석 (38명 기준)
    const onl = Math.ceil(cap * ratio / 100);
    const off = cap - onl;

    // 차량별 재정비 종료시간 추적 (충돌 검증)
    const vehicleReadyAt = {}; // vName → 분 단위 가용 시간
    const rows = [];
    let conflicts = [];
    // 기존 스케줄은 비동기로 가져옴 (이 함수는 saveAutoSchedule에서 await로 호출됨)
    const _existSchRes = await API.get(`/api/schedules/${_autoScheduleRegion}`);
    const existSchedules = _existSchRes.data || [];
    const existTimes = new Set(existSchedules.map(s => s.time));

    for (let m = firstM, seq = 0; m <= lastM; m += interval, seq++) {
      const hh = Math.floor(m/60), mm = m%60;
      const depTime  = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
      const endTime  = _addMinutes(depTime, duration);             // 운행 종료
      const readyTime= _addMinutes(depTime, duration + maintenance); // 재정비 완료

      // 차량 배정: 가용 차량 중 가장 일찍 준비되는 차량 우선
      let assignedV = null;
      let minReady  = Infinity;
      const vNames  = vehicles.length > 0
        ? vehicles.map(v => v.name || `${vehicles.indexOf(v)+1}호차`)
        : Array.from({length: vCountInput}, (_, i) => `${i+1}호차`);

      for (const vn of vNames) {
        const ready = vehicleReadyAt[vn] ?? 0;
        if (ready <= m && ready < minReady) { minReady = ready; assignedV = vn; }
      }
      // 가용 차량 없으면 가장 일찍 가용되는 차량 배정 (충돌 표시)
      let conflictFlag = false;
      if (!assignedV) {
        let earliest = Infinity, earliestV = vNames[seq % vNames.length];
        for (const vn of vNames) { const r = vehicleReadyAt[vn] ?? 0; if (r < earliest) { earliest = r; earliestV = vn; } }
        assignedV = earliestV;
        conflictFlag = true;
        conflicts.push(`${depTime}: 가용 차량 없음 (최소 대기 ${earliestV})`);
      }
      // 배정 후 해당 차량 가용시간 업데이트
      vehicleReadyAt[assignedV] = _toMinutes(readyTime);

      const isDup = existTimes.has(depTime);
      // assignedV는 차량 이름 → 실제 vehicle ID 찾기
      const assignedVehicle = vehicles.find(v => (v.name||`${vehicles.indexOf(v)+1}호차`) === assignedV);
      rows.push({ seq: seq+1, depTime, endTime, readyTime, vName: assignedV,
        vehicleId: assignedVehicle?.id || null, onl, off, conflictFlag, isDup });
    }

    // 미리보기 테이블 렌더
    const wrap    = document.getElementById('auto-preview-wrap');
    const tbody   = document.getElementById('auto-preview-body');
    const cntEl   = document.getElementById('auto-preview-count');
    const warnEl  = document.getElementById('auto-conflict-warn');
    const warnMsg = document.getElementById('auto-conflict-msg');
    if (!wrap || !tbody) return;

    tbody.innerHTML = rows.map(r => {
      const rowClass  = r.conflictFlag ? 'bg-red-50' : r.isDup ? 'bg-yellow-50' : '';
      const statusTxt = r.conflictFlag
        ? '<span class="text-red-600 font-bold">⚠ 충돌</span>'
        : r.isDup
          ? '<span class="text-yellow-600">중복</span>'
          : '<span class="text-green-600">정상</span>';
      return `<tr class="${rowClass}">
        <td class="px-3 py-1.5 text-center font-medium">${r.seq}회차</td>
        <td class="px-3 py-1.5 text-center font-mono font-bold">${r.depTime}</td>
        <td class="px-3 py-1.5 text-center font-mono text-gray-500">${r.endTime}</td>
        <td class="px-3 py-1.5 text-center font-mono text-blue-500">${r.readyTime}</td>
        <td class="px-3 py-1.5 text-center">${r.vName}</td>
        <td class="px-3 py-1.5 text-center">${r.onl}석</td>
        <td class="px-3 py-1.5 text-center">${r.off}석</td>
        <td class="px-3 py-1.5 text-center">${statusTxt}</td>
      </tr>`;
    }).join('');

    cntEl.textContent = `총 ${rows.length}회차`;
    wrap.classList.remove('hidden');

    if (conflicts.length > 0) {
      warnMsg.textContent = `차량 충돌 ${conflicts.length}건: ${conflicts.join(' | ')}`;
      warnEl.classList.remove('hidden');
    } else {
      warnEl.classList.add('hidden');
    }
    wrap.dataset.rows = JSON.stringify(rows);
  };

  const confirmAutoSchedule = async () => {
    const wrap = document.getElementById('auto-preview-wrap');
    if (!wrap || wrap.classList.contains('hidden')) {
      Utils.toast('먼저 미리보기를 확인하세요', 'warning'); return;
    }
    const rows = JSON.parse(wrap.dataset.rows || '[]');
    if (!rows.length) { Utils.toast('생성할 회차가 없습니다', 'error'); return; }
    const conflictRows = rows.filter(r => r.conflictFlag);
    if (conflictRows.length > 0 && !confirm(`차량 충돌이 ${conflictRows.length}건 있습니다. 그래도 생성하시겠습니까?`)) return;

    const duration    = parseInt(document.getElementById('auto-duration')?.value) || 45;
    const maintenance = parseInt(document.getElementById('auto-maintenance')?.value) || 10;
    const cap         = 38;
    const ratio       = parseInt(document.getElementById('auto-online-ratio')?.value) || 70;
    const startDate   = document.getElementById('auto-start-date')?.value || '';
    const endDate     = document.getElementById('auto-end-date')?.value || '';
    const days        = [...document.querySelectorAll('input[name="auto-days"]:checked')].map(c => c.value);
    const regionId    = _autoScheduleRegion;

    // Fetch existing schedules from API to check for duplicates
    const existRes = await API.get(`/api/schedules/${regionId}`);
    const existTimes = new Set((existRes.data || []).map(s => s.time));
    let added = 0;
    const promises = [];

    const onl = Math.round(cap * ratio / 100);
    const off = cap - onl;
    const daysArr = days.length ? days : ['mon','tue','wed','thu','fri','sat','sun'];

    rows.forEach(r => {
      const schData = {
        id: _makeScheduleId(regionId, r.depTime),
        regionId,
        time: r.depTime,
        capacity: cap,
        onlineCapacity: onl,
        offlineCapacity: off,
        status: 'active',
        days: daysArr,
        duration: duration,
        vehicleId: r.vehicleId || null,
      };
      if (existTimes.has(r.depTime)) {
        // 이미 존재 → PUT으로 업데이트 (막차 변경 등 반영)
        const existId = (existRes.data||[]).find(s=>s.time===r.depTime)?.id || schData.id;
        promises.push(API.put(`/api/schedules/${regionId}/${existId}`, schData));
      } else {
        promises.push(API.post('/api/schedules', schData));
        existTimes.add(r.depTime);
      }
      added++;
    });

    await Promise.all(promises);

    // 미리보기에 없는 기존 회차 제거 (막차 이후 시간 정리)
    // 단, 예약이 있는 회차는 삭제하지 않고 운휴 처리
    const newTimes = new Set(rows.map(r => r.depTime));
    const toRemove = (existRes.data||[]).filter(s => !newTimes.has(s.time));
    const removePromises = [];
    for (const s of toRemove) {
      const resCheck = await API.get(`/api/reservations?regionId=${regionId}&scheduleId=${s.id}`);
      const hasRes = (resCheck.data||[]).some(r => r.status !== 'cancelled' && r.status !== 'refunded');
      if (hasRes) {
        // 예약 있음 → 삭제 대신 운휴 처리
        removePromises.push(API.put(`/api/schedules/${regionId}/${s.id}`, { status: 'suspended' }));
      } else {
        removePromises.push(API.delete(`/api/schedules/${regionId}/${s.id}`));
      }
    }
    await Promise.all(removePromises);

    document.getElementById('auto-schedule-modal').classList.add('hidden');
    Utils.toast(`${added}개 회차 생성/업데이트 완료${toRemove.length ? ` (범위 밖 ${toRemove.length}건 정리)` : ''}`, 'success');
    schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const showRecurringModal = (regionId) => {
    _editingScheduleRegion = regionId;
    document.getElementById('recurring-modal').classList.remove('hidden');
  };
  const addRecTime = () => {
    const wrap = document.getElementById('rec-times');
    if (!wrap) return;
    // allSchedules는 더 이상 localStorage 사용 안함
    // 시간 옵션 재생성
    let opts = '<option value="">시간 선택</option>';
    for (let h = 6; h <= 21; h++) for (let m of [0,30]) { const hh=String(h).padStart(2,'0'),mm=String(m).padStart(2,'0'); opts+=`<option value="${hh}:${mm}">${hh}:${mm}</option>`; }
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-center';
    div.innerHTML = `<select class="rec-time-select border rounded px-2 py-1.5 text-sm w-24 focus:ring-2 focus:ring-purple-500 outline-none" onchange="this.nextElementSibling.value=this.value">${opts}</select><input type="text" placeholder="HH:mm" maxlength="5" class="rec-time-input border rounded px-2 py-1.5 text-sm w-20 text-center font-mono focus:ring-2 focus:ring-purple-500 outline-none" oninput="this.previousElementSibling.value=this.value"><button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 text-xs px-1">삭제</button>`;
    wrap.appendChild(div);
  };

  const generateRecurring = async () => {
    const start = document.getElementById('rec-start')?.value;
    const end   = document.getElementById('rec-end')?.value;
    if (!start || !end) { Utils.toast('시작일과 종료일을 입력하세요', 'error'); return; }
    if (new Date(start) > new Date(end)) { Utils.toast('시작일이 종료일보다 늦을 수 없습니다', 'error'); return; }

    const cap   = parseInt(document.getElementById('rec-capacity')?.value) || 38;
    const ratio = parseInt(document.getElementById('rec-ratio')?.value) || 70;
    const days  = [...document.querySelectorAll('input[name="rec-days"]:checked')].map(c=>c.value);

    // 직접입력 vs 자동계산
    const autoSection = document.getElementById('rec-auto-section');
    const isAutoMode  = autoSection && !autoSection.classList.contains('hidden');
    let times = [];
    if (isAutoMode) {
      const resultEl = document.getElementById('rec-auto-calc-result');
      times = JSON.parse(resultEl?.dataset?.times || '[]');
      if (!times.length) { calcRecAutoTimes(); times = JSON.parse(document.getElementById('rec-auto-calc-result')?.dataset?.times || '[]'); }
      if (!times.length) { Utils.toast('첫차/막차/배차간격을 설정하세요', 'error'); return; }
    } else {
      times = [...document.querySelectorAll('.rec-time-input')].map(i=>i.value.trim()).filter(t=>_isValidTime(t));
      if (!times.length) { Utils.toast('유효한 운행 시간을 1개 이상 입력하세요', 'error'); return; }
    }

    const regionId = _editingScheduleRegion;
    // 기존 스케줄 API에서 로드
    const _existSchRes2 = await API.get(`/api/schedules/${regionId}`);
    const existSchList = _existSchRes2.data || [];
    const existTimes = new Set(existSchList.map(s=>s.time));
    const onl = Math.round(cap*ratio/100);
    const off = cap - onl;
    const DAY_NAMES = ['일','월','화','수','목','금','토'];
    let added = 0;
    const recurSchedules = [];

    // 날짜별 반복 생성
    let cur = new Date(start + 'T00:00:00');
    const endD = new Date(end + 'T00:00:00');
    while (cur <= endD) {
      const dayName = DAY_NAMES[cur.getDay()];
      if (days.includes(dayName)) {
        times.forEach(t => {
          if (!existTimes.has(t)) {
            recurSchedules.push({ id:_makeScheduleId(regionId,t), time:t, duration:70, capacity:cap, onlineRatio:ratio, onlineSeats:onl, offlineSeats:off, operatingDays:days, startDate:start, endDate:end, status:'active' });
            existTimes.add(t);
            added++;
          }
        });
      }
      cur.setDate(cur.getDate()+1);
    }
    // API로 일괄 저장
    Utils.loading(true);
    let savedCount = 0;
    for (const sch of recurSchedules) {
      const r = await API.post(`/api/schedules/${regionId}`, sch);
      if (r.success) savedCount++;
    }
    Utils.loading(false);
    document.getElementById('recurring-modal').classList.add('hidden');
    Utils.toast(`반복 일정 ${savedCount}개가 생성되었습니다.`, 'success');
    schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  // ── 요금 관리 ──────────────────────────────────────────────
  // ── 요금 승인 Store 키 (localStorage 사용 → 탭/세션 간 공유 가능) ──
  const FARE_STORE_KEY = 'amk_fares';
  const FARE_APPROVAL_KEY = 'amk_fare_approvals';

  // API 기반 요금 데이터 로드
  const _getFares = async (regionId) => {
    // 관리자는 예정/종료 포함 전체 조회
    const path = regionId.includes('?') ? `/api/fares/${regionId}` : `/api/fares/${regionId}?all=1`;
    const res = await API.get(path);
    if (res.success && res.data) return res.data;
    const region = (window.REGIONS||[]).find(r=>r.id===regionId);
    return region?.fares || [];
  };
  const _setFares = async (regionId, fares) => {
    await API.put(`/api/fares/${regionId}`, { fares });
  };
  const _getFareApprovals = async (regionId, status) => {
    let url = '/api/fares/approvals/list';
    const params = [];
    if (regionId) params.push('regionId='+regionId);
    if (status)   params.push('status='+status);
    if (params.length) url += '?' + params.join('&');
    const res = await API.get(url);
    return res.data || [];
  };

  // 요금 상태 레이블/색상
  const FARE_STATUS = {
    pending:   { label:'승인대기',  color:'yellow' },
    approved:  { label:'승인완료',  color:'blue'   },
    rejected:  { label:'반려',      color:'red'    },
    active:    { label:'적용중',    color:'green'  },
    scheduled: { label:'적용예정',  color:'purple' },
    ended:     { label:'종료',      color:'gray'   },
    inactive:  { label:'비활성',    color:'gray'   },
  };
  const fareStatusBadge = (s) => {
    const st = FARE_STATUS[s] || { label: s, color:'gray' };
    return `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-${st.color}-100 text-${st.color}-700">${st.label}</span>`;
  };

  const faresPage = async () => {
    _adminState.currentSection = 'fares';
    const user = _adminState.user || {};
    const isSuper = user.role === 'super' || user.role === 'accountant';

    // 지역관리자는 자기 지역만, 슈퍼는 선택 가능
    let activeRegionId;
    if (user.role === 'regional' && user.regionId) {
      activeRegionId = user.regionId;
    } else {
      const allRegions = (window.REGIONS||[]).filter(r=>r.status!=='hidden');
      activeRegionId = _adminState.selectedRegion || allRegions[0]?.id || 'tongyeong';
    }

    const allRegions = (window.REGIONS||[]).filter(r=>r.status!=='hidden');
    const region = allRegions.find(r=>r.id===activeRegionId) || { id: activeRegionId, name: activeRegionId, shortName: activeRegionId };
    const fares = await _getFares(activeRegionId);
    // ★ 슈퍼관리자: 전체 지역 승인대기 표시 / 지역관리자: 자기 지역만
    const _allApprovals = await _getFareApprovals(isSuper ? null : activeRegionId);
    const approvals = isSuper
      ? _allApprovals.filter(a => a.status === 'pending')
      : _allApprovals.filter(a => a.region_id === activeRegionId && a.status === 'pending');

    // 지역관리자: 최근 처리 결과(승인/반려) 표시용
    const recentResults = isSuper ? [] : _allApprovals.filter(a =>
      a.region_id === activeRegionId && (a.status === 'approved' || a.status === 'rejected')
    ).slice(0, 10);
    const recentResultSection = recentResults.length === 0 ? '' : `
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
          <i class="fas fa-history text-gray-400"></i>
          <h3 class="font-semibold text-gray-700 text-sm">최근 처리 결과</h3>
          <span class="text-xs text-gray-400">(최근 10건)</span>
        </div>
        <div class="overflow-x-auto">
          <table class="admin-table w-full">
            <thead><tr class="bg-gray-50">
              \${['구분명','변경금액','사유','처리','처리자·일시'].map(h=>\`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">\${h}</th>\`).join('')}
            </tr></thead>
            <tbody class="divide-y divide-gray-100">
              \${recentResults.map(a => {
                const isApproved = a.status === 'approved';
                const badge = isApproved
                  ? '<span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">✅ 승인</span>'
                  : '<span class="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">❌ 반려</span>';
                return \`<tr class="hover:bg-gray-50 \${isApproved ? '' : 'bg-red-50/30'}">
                  <td class="px-4 py-3 text-sm font-medium">\${a.fare_label||'-'}</td>
                  <td class="px-4 py-3 text-right text-sm">\${a.old_price != null ? \`<span class="line-through text-gray-400 text-xs mr-1">₩\${(a.old_price||0).toLocaleString()}</span>\` : ''}₩\${(a.new_price||0).toLocaleString()}</td>
                  <td class="px-4 py-3 text-xs text-gray-500 text-center">\${a.reason||'-'}</td>
                  <td class="px-4 py-3 text-center">\${badge}</td>
                  <td class="px-4 py-3 text-xs text-gray-400 text-center">\${a.reviewed_by||'-'}<br>\${(a.reviewed_at||'').replace('T',' ').slice(0,16)}</td>
                </tr>\`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    // fareChangeMode를 서버에서 읽어와서 전역에 캐시
    let fareMode;
    try {
      const fmRes = await API.get('/api/settings/fareChangeMode');
      fareMode = fmRes.success ? (fmRes.data || 'approval') : (Settings.get('fareChangeMode') || 'approval');
    } catch(e) { fareMode = Settings.get('fareChangeMode') || 'approval'; }
    window._fareChangeMode = fareMode; // addFare/saveFare에서 사용

    // 지역관리자: 즉시적용 권한 여부 확인
    const instantPerm = JSON.parse(localStorage.getItem('amk_instant_perm') || '{}');
    const hasInstantPerm = isSuper || instantPerm[activeRegionId];

    // 지역 탭 (슈퍼만)
    const regionTabs = isSuper ? allRegions.map(r=>`
      <button onclick="AdminModule.selectFareRegion('${r.id}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${r.id===activeRegionId?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
        ${r.shortName || r.name}
      </button>`).join('') : `<span class="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"><i class="fas fa-map-marker-alt mr-1"></i>${region.name} 전용</span>`;

    // 적용중 요금 행
    const fareRows = fares.map((f, i) => `
      <tr class="hover:bg-gray-50" id="fare-row-${i}">
        <td class="px-4 py-3 text-sm font-medium">${f.label}</td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${f.type||'일반'}</td>
        <td class="px-4 py-3 text-right font-semibold text-gray-800">₩${(f.price||0).toLocaleString()}</td>
        <td class="px-4 py-3 text-right text-gray-500">${f.discountPrice ? `₩${f.discountPrice.toLocaleString()}` : '-'}</td>
        <td class="px-4 py-3 text-center">${fareStatusBadge(f.status||'active')}</td>
        <td class="px-4 py-3 text-xs text-gray-400 text-center">
          ${f.effectiveFrom ? `<span class="font-medium text-gray-600">${f.effectiveFrom}</span>` : '즉시'} ~
          ${f.effectiveTo   ? f.effectiveTo : '<span class="text-gray-400">무기한</span>'}
        </td>
        <td class="px-4 py-3 text-center">
          <button onclick="AdminModule.editFare('${activeRegionId}', ${i})" class="text-blue-600 hover:underline text-xs mr-2">수정</button>
          <button onclick="AdminModule.toggleFareStatus('${activeRegionId}', ${i})" class="text-gray-500 hover:underline text-xs">
            ${(f.status||'active')==='active'?'비활성화':'활성화'}
          </button>
        </td>
      </tr>`).join('');

    // 승인 대기 행
    const approvalRows = approvals.length === 0
      ? '<tr><td colspan="7" class="text-center py-4 text-gray-400 text-sm">승인 대기 요청이 없습니다.</td></tr>'
      : approvals.map((a) => {
          const regionLabel = a.region_id ? ((window.REGIONS||[]).find(r=>r.id===a.region_id)?.name || a.region_id) : '-';
          const oldP = a.old_price != null ? `<div class="text-xs text-gray-400 line-through">₩${(a.old_price||0).toLocaleString()}</div>` : '';
          return `
        <tr class="hover:bg-yellow-50" id="appr-row-${a.id}">
          <td class="px-4 py-3 text-sm font-medium">
            ${a.fare_label||a.label||'-'}
            ${isSuper ? `<div class="text-xs text-blue-500 mt-0.5">${regionLabel}</div>` : ''}
          </td>
          <td class="px-4 py-3 text-sm text-center text-gray-500">${a.fare_type||a.type||'일반'}</td>
          <td class="px-4 py-3 text-right font-semibold">${oldP}₩${(a.new_price||a.price||0).toLocaleString()}</td>
          <td class="px-4 py-3 text-right text-gray-500">${a.discount_price != null ? `₩${a.discount_price.toLocaleString()}` : '-'}</td>
          <td class="px-4 py-3 text-center text-xs text-gray-500">${a.reason||'-'}</td>
          <td class="px-4 py-3 text-xs text-gray-400 text-center">${a.requested_by||'지역관리자'}<br>${(a.requested_at||'').replace('T',' ').slice(0,16)}</td>
          <td class="px-4 py-3 text-center">
            ${isSuper ? `
              <button onclick="AdminModule.approvefare('${a.id}', true)" class="bg-green-500 text-white px-2 py-1 rounded text-xs mr-1 hover:bg-green-600">승인</button>
              <button onclick="AdminModule.approvefare('${a.id}', false)" class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">반려</button>
            ` : `
              <span class="text-xs text-yellow-600 font-medium">승인 대기중</span>
              <button onclick="AdminModule.cancelFareApproval('${a.id}')" class="ml-1 text-xs text-gray-400 hover:text-red-500 underline">철회</button>
            `}
          </td>
        </tr>`;
        }).join('');

    const content = `
      <div class="space-y-6">
        <!-- 상단 탭 + 버튼 -->
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div class="flex gap-2 flex-wrap items-center">${regionTabs}</div>
          <div class="flex items-center gap-2">
            ${isSuper ? `
              <div class="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-xs">
                <span class="text-gray-600">요금 변경 방식:</span>
                <select onchange="AdminModule.setFareMode(this.value)" class="border-0 focus:ring-0 outline-none font-medium text-xs">
                  <option value="approval" ${fareMode==='approval'?'selected':''}>HQ 승인 후 적용</option>
                  <option value="auto" ${fareMode==='auto'?'selected':''}>즉시 자동 적용</option>
                </select>
              </div>
              <button onclick="AdminModule.grantInstantPerm('${activeRegionId}')"
                class="border border-purple-300 text-purple-600 px-3 py-2 rounded-lg text-xs hover:bg-purple-50 flex items-center gap-1">
                <i class="fas fa-bolt"></i>즉시적용 권한 부여
              </button>
            ` : (hasInstantPerm ? `<span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"><i class="fas fa-bolt mr-1"></i>즉시 적용 권한 있음</span>` : '')}
            <button onclick="AdminModule.addFare('${activeRegionId}')"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
              <i class="fas fa-plus"></i>요금 추가
            </button>
          </div>
        </div>

        <!-- 안내 배너 -->
        ${fareMode==='approval' && !hasInstantPerm ? `
          <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
            <i class="fas fa-shield-alt"></i>
            <span>HQ 승인 후 적용 모드 · 요금 변경 요청 → 본사 승인 → 고객 화면 반영 순으로 처리됩니다. 기존 예약 금액은 변경되지 않습니다.</span>
          </div>` : `
          <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-center gap-2">
            <i class="fas fa-bolt"></i>
            <span>즉시 적용 모드 · 저장 즉시 고객 예약 화면에 반영됩니다. 기존 예약 금액은 변경되지 않습니다.</span>
          </div>`}

        <!-- 적용중 요금 목록 -->
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
            <h3 class="font-semibold text-gray-700 text-sm">요금 목록 <span class="text-xs text-gray-400 font-normal ml-1">(고객 예약화면: 승인완료·적용중·활성 요금만 표시)</span></h3>
            <span class="text-xs text-gray-400">${fares.length}건</span>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead><tr class="bg-gray-50">
                ${['구분명','유형','정가','할인가','상태','적용기간','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
              </tr></thead>
              <tbody class="divide-y divide-gray-100">
                ${fareRows || '<tr><td colspan="7" class="text-center py-6 text-gray-400 text-sm">등록된 요금이 없습니다. 요금 추가 버튼을 눌러 추가해주세요.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 승인 대기 요금 -->
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 bg-yellow-50 border-b flex items-center justify-between">
            <h3 class="font-semibold text-gray-700 text-sm flex items-center gap-2">
              <i class="fas fa-clock text-yellow-500"></i>승인 대기 요금
              ${approvals.length > 0 ? `<span class="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">${approvals.length}</span>` : ''}
            </h3>
            ${isSuper ? '<span class="text-xs text-gray-400">승인/반려 처리가 가능합니다</span>' : '<span class="text-xs text-gray-400">본사 승인 대기중인 요금 변경 요청 · 철회 가능</span>'}
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead><tr class="bg-gray-50">
                ${['구분명','유형','정가','할인가','변경사유','요청자·일시','처리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
              </tr></thead>
              <tbody class="divide-y divide-gray-100">${approvalRows}</tbody>
            </table>
          </div>
        </div>
        ${!isSuper ? recentResultSection : ''}
      </div>

      <!-- 요금 추가/수정 모달 -->
      <div id="fare-modal" class="modal-overlay hidden" onclick="if(event.target===this)this.classList.add('hidden')">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-semibold text-gray-800 text-lg" id="fare-modal-title">요금 추가</h3>
            <button onclick="document.getElementById('fare-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 mb-1">구분명 <span class="text-red-500">*</span></label>
                <input id="f-label" type="text" placeholder="예: 성인, 청소년, 경로우대" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">유형 코드</label>
                <select id="f-type" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="adult">adult (성인)</option>
                  <option value="child">child (소아)</option>
                  <option value="senior">senior (경로)</option>
                  <option value="group">group (단체)</option>
                  <option value="etc">etc (기타)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">상태</label>
                <select id="f-status" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="active">적용중</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">정가 (원) <span class="text-red-500">*</span></label>
                <input id="f-price" type="number" min="0" step="1000" placeholder="35000" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">할인가 (원, 없으면 빈칸)</label>
                <input id="f-discount" type="number" min="0" step="1000" placeholder="빈칸 = 없음" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">적용 시작일</label>
                <input id="f-effective" type="date" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">적용 종료일 (빈칸=무기한)</label>
                <input id="f-effective-to" type="date" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 mb-1">변경 사유 <span class="text-red-500">*</span></label>
                <textarea id="f-reason" rows="2" placeholder="요금 변경 사유를 입력하세요" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
              </div>
            </div>
            <div id="f-mode-notice" class="text-xs text-gray-500 bg-gray-50 rounded-lg p-3"></div>
          </div>
          <div class="flex gap-2 mt-5">
            <button onclick="AdminModule.saveFare()" id="fare-save-btn"
              class="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">저장</button>
            <button onclick="document.getElementById('fare-modal').classList.add('hidden')"
              class="flex-1 border py-2.5 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('fares', content, '요금 관리');
  };

  const selectFareRegion = (regionId) => {
    _adminState.selectedRegion = regionId;
    faresPage().then(html => { document.getElementById('app').innerHTML = html; });
  };
  const setFareMode = async (mode) => {
    Settings.set('fareChangeMode', mode);
    // 서버에도 저장 (지역관리자들이 동일하게 인식하도록)
    await API.put('/api/settings/fareChangeMode', { value: mode }).catch(()=>{});
    faresPage().then(html => { document.getElementById('app').innerHTML = html; });
    Utils.toast(`요금 변경 방식이 "${mode==='approval'?'HQ 승인 후 적용':'즉시 자동 적용'}"으로 변경되었습니다.`, 'info');
  };

  // 즉시적용 권한 부여 (슈퍼 → 지역관리자)
  const grantInstantPerm = (regionId) => {
    Utils.confirm(`<div class="text-sm">
      <p class="mb-2"><strong>${regionId}</strong> 지역 관리자에게 즉시 적용 권한을 부여하시겠습니까?</p>
      <p class="text-gray-500 text-xs">이 권한이 있으면 HQ 승인 없이 요금을 즉시 적용할 수 있습니다.</p>
    </div>`, () => {
      const perms = JSON.parse(localStorage.getItem('amk_instant_perm') || '{}');
      perms[regionId] = true;
      localStorage.setItem('amk_instant_perm', JSON.stringify(perms));
      Utils.toast(`${regionId} 지역에 즉시 적용 권한이 부여되었습니다.`, 'success');
      faresPage().then(html => { document.getElementById('app').innerHTML = html; });
    });
  };

  let _editingFareRegion = null, _editingFareIdx = null;

  const addFare = (regionId) => {
    _editingFareRegion = regionId;
    _editingFareIdx = null;
    const user = _adminState.user || {};
    const isSuper = user.role === 'super';
    const instantPerm = JSON.parse(localStorage.getItem('amk_instant_perm') || '{}');
    const hasInstant = isSuper || instantPerm[regionId];
    const fareMode = window._fareChangeMode || Settings.get('fareChangeMode') || 'approval';
    document.getElementById('fare-modal-title').textContent = '요금 추가';
    ['f-label','f-price','f-discount','f-reason','f-effective','f-effective-to'].forEach(id => {
      const el = document.getElementById(id); if(el) el.value = '';
    });
    const ftype = document.getElementById('f-type'); if(ftype) ftype.value = 'adult';
    const fstatus = document.getElementById('f-status'); if(fstatus) fstatus.value = 'active';
    const notice = document.getElementById('f-mode-notice');
    if (notice) {
      if (hasInstant || fareMode === 'auto') {
        notice.innerHTML = '<i class="fas fa-bolt text-green-500 mr-1"></i>저장 즉시 고객 예약화면에 반영됩니다. 기존 예약 금액은 변경되지 않습니다.';
        notice.className = 'text-xs text-green-700 bg-green-50 rounded-lg p-3';
      } else {
        notice.innerHTML = '<i class="fas fa-clock text-amber-500 mr-1"></i>본사 승인 후 적용됩니다. 승인 요청이 접수되며 HQ에서 검토 후 반영됩니다.';
        notice.className = 'text-xs text-amber-700 bg-amber-50 rounded-lg p-3';
      }
    }
    const saveBtn = document.getElementById('fare-save-btn');
    if (saveBtn) saveBtn.textContent = (hasInstant || fareMode === 'auto') ? '저장' : '승인 요청';
    document.getElementById('fare-modal').classList.remove('hidden');
  };

  const editFare = async (regionId, idx) => {
    const fares = await _getFares(regionId);
    const f = fares[idx]; if (!f) return;
    _editingFareRegion = regionId; _editingFareIdx = idx;
    document.getElementById('fare-modal-title').textContent = '요금 수정';
    document.getElementById('f-label').value = f.label || '';
    document.getElementById('f-price').value = f.price || 0;
    document.getElementById('f-discount').value = f.discountPrice || '';
    document.getElementById('f-reason').value = '';
    document.getElementById('f-effective').value = f.effectiveFrom || '';
    document.getElementById('f-effective-to').value = f.effectiveTo || '';
    const ftype = document.getElementById('f-type'); if(ftype) ftype.value = f.type || 'adult';
    const fstatus = document.getElementById('f-status'); if(fstatus) fstatus.value = f.status || 'active';
    addFare(regionId); // 안내 문구 갱신
    document.getElementById('fare-modal-title').textContent = '요금 수정';
    document.getElementById('f-label').value = f.label || '';
    document.getElementById('f-price').value = f.price || 0;
    document.getElementById('f-discount').value = f.discountPrice || '';
    // oldPrice를 hidden input에 보관
    let hiddenOld = document.getElementById('f-old-price');
    if (!hiddenOld) { hiddenOld = document.createElement('input'); hiddenOld.type='hidden'; hiddenOld.id='f-old-price'; document.getElementById('fare-modal').appendChild(hiddenOld); }
    hiddenOld.value = f.price || 0;
  };

  const saveFare = async () => {
    const get = (id) => document.getElementById(id)?.value || '';
    const label = get('f-label').trim();
    const price = parseInt(get('f-price')) || 0;
    const reason = get('f-reason').trim();
    if (!label) { Utils.toast('구분명을 입력하세요', 'error'); return; }
    if (!price) { Utils.toast('정가를 입력하세요', 'error'); return; }
    if (!reason) { Utils.toast('변경 사유를 입력하세요', 'error'); return; }

    const user = _adminState.user || {};
    const isSuper = user.role === 'super';
    const instantPerm = JSON.parse(localStorage.getItem('amk_instant_perm') || '{}');
    const hasInstant = isSuper || instantPerm[_editingFareRegion];
    const fareMode = window._fareChangeMode || Settings.get('fareChangeMode') || 'approval';
    const regionId = _editingFareRegion;

    const newFare = {
      label,
      type: get('f-type') || 'adult',
      price,
      discountPrice: parseInt(get('f-discount')) || null,
      effectiveFrom: get('f-effective') || new Date().toISOString().slice(0,10),
      effectiveTo: get('f-effective-to') || null,
      reason,
    };

    if (hasInstant || fareMode === 'auto') {
      // 즉시 저장 - effectiveFrom이 미래면 scheduled
      const todayStr = new Date().toISOString().slice(0,10);
      newFare.status = (newFare.effectiveFrom && newFare.effectiveFrom > todayStr) ? 'scheduled' : 'active';
      const fares = await _getFares(regionId + '?all=1');
      if (_editingFareIdx !== null) {
        fares[_editingFareIdx] = { ...fares[_editingFareIdx], ...newFare };
      } else {
        fares.push(newFare);
      }
      await _setFares(regionId, fares);
      Utils.toast('요금이 즉시 저장되었습니다. 고객 예약화면에 반영됩니다.', 'success');
    } else {
      // ★ 승인 요청 — DB API로 저장 (슈퍼관리자 로그인 시 즉시 확인)
      Utils.loading(true);
      const approvalRes = await API.post('/api/fares/approvals', {
        regionId,
        fareId: newFare.id || ('fare-' + Date.now()),
        fareLabel: newFare.label,
        fareType: newFare.type,
        oldPrice: _editingFareIdx !== null ? (parseInt(document.getElementById('f-old-price')?.value)||null) : null,
        newPrice: newFare.price,
        discountPrice: newFare.discountPrice || null,
        reason: newFare.reason || '',
        requestedBy: user.name || '지역관리자',
        effectiveFrom: newFare.effectiveFrom || null,
        effectiveTo: newFare.effectiveTo || null,
      });
      Utils.loading(false);
      if (approvalRes.success) {
        Utils.toast('✅ 승인 요청이 전송되었습니다. 본사 대시보드에서 확인할 수 있습니다.\n승인 전까지 고객 예약화면에 미반영됩니다.', 'success');
      } else {
        Utils.toast('승인 요청 실패: ' + (approvalRes.message||''), 'error');
      }
    }
    document.getElementById('fare-modal').classList.add('hidden');
    faresPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  // 요금 승인 요청 철회 (지역관리자용)
  const cancelFareApproval = async (approvalId) => {
    const ok = await Utils.confirm('승인 요청을 철회하시겠습니까?', '철회하면 본사 대기 목록에서 삭제됩니다.');
    if (!ok) return;
    Utils.loading(true);
    const res = await API.delete(`/api/fares/approvals/${approvalId}`);
    Utils.loading(false);
    if (res.success) {
      Utils.toast('승인 요청이 철회되었습니다.', 'info');
      faresPage().then(html => { document.getElementById('app').innerHTML = html; });
    } else {
      Utils.toast('철회 실패: ' + (res.message||''), 'error');
    }
  };

  // 요금 활성/비활성 토글
  const toggleFareStatus = async (regionId, idx) => {
    const fares = await _getFares(regionId);
    if (!fares[idx]) return;
    fares[idx].status = (fares[idx].status === 'active') ? 'inactive' : 'active';
    await _setFares(regionId, fares);
    Utils.toast(`요금이 ${fares[idx].status==='active'?'활성화':'비활성화'}되었습니다.`, 'success');
    faresPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  // 요금 승인/반려 (슈퍼관리자) - localStorage 공유로 실시간 반영
  const approvefare = async (approvalId, isApprove) => {
    const user = _adminState.user || {};
    Utils.loading(true);
    const res = await API.put(`/api/fares/approvals/${approvalId}`, {
      status: isApprove ? 'approved' : 'rejected',
      reviewedBy: user.name || '슈퍼관리자',
    });
    Utils.loading(false);

    if (!res.success) {
      Utils.toast('처리 실패: ' + (res.message||''), 'error');
      return;
    }
    Utils.toast(isApprove ? '✅ 요금 변경이 승인되었습니다. 고객 예약화면에 즉시 반영됩니다.' : '❌ 요금 변경 요청이 반려되었습니다.', isApprove ? 'success' : 'info');

    // 현재 페이지 갱신
    const section = _adminState.currentSection;
    if (section === 'hq-dashboard') {
      hqDashboard().then(html => { document.getElementById('app').innerHTML = html; });
    } else {
      faresPage().then(html => { document.getElementById('app').innerHTML = html; });
    }
  };

  // ── 좌석 배분 관리 ─────────────────────────────────────────

  // ── 문의 관리 페이지 ──────────────────────────────────────
  const inquiriesPage = async () => {
    _adminState.currentSection = 'inquiries';
    const user = _adminState.user || {};
    const isSuper = user.role === 'super';
    const regionId = user.regionId || '';
    const url = isSuper ? '/api/inquiries' : `/api/inquiries?regionId=${regionId}`;
    const res = await API.get(url);
    const list = res.data || [];
    const pending = list.filter(i => i.status === 'pending').length;

    const statusBadge = (s) => {
      const m = { pending:'bg-yellow-100 text-yellow-700', answered:'bg-green-100 text-green-700', closed:'bg-gray-100 text-gray-500' };
      const l = { pending:'미답변', answered:'답변완료', closed:'종료' };
      return `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${m[s]||'bg-gray-100 text-gray-600'}">${l[s]||s}</span>`;
    };
    const catLabel = { general:'일반문의', reservation:'예약문의', refund:'환불문의', complaint:'불만접수' };

    const rows = list.length === 0
      ? '<tr><td colspan="7" class="text-center py-8 text-gray-400">문의가 없습니다.</td></tr>'
      : list.map(i => `
        <tr class="hover:bg-gray-50 cursor-pointer" onclick="AdminModule.viewInquiry('${i.id}')">
          <td class="px-3 py-2 text-xs text-gray-400">${(i.createdAt||'').slice(0,10)}</td>
          <td class="px-3 py-2 text-sm font-medium">${i.name}</td>
          <td class="px-3 py-2 text-xs text-center">${catLabel[i.category]||i.category||'일반'}</td>
          <td class="px-3 py-2 text-sm">${i.subject||i.content?.slice(0,30)||'-'}</td>
          <td class="px-3 py-2 text-xs text-center text-gray-500">${isSuper ? (i.regionId||'전체') : ''}</td>
          <td class="px-3 py-2 text-center">${statusBadge(i.status||'pending')}</td>
          <td class="px-3 py-2 text-center">
            <button onclick="event.stopPropagation();AdminModule.replyInquiry('${i.id}')" 
              class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">답변</button>
          </td>
        </tr>`).join('');

    const _inqContent = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-800">문의 관리</h2>
            <p class="text-sm text-gray-500 mt-0.5">총 ${list.length}건 · 미답변 <span class="text-red-500 font-bold">${pending}건</span></p>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead><tr class="bg-gray-50">
                ${['접수일','문의자','유형','내용','지역','상태','처리'].map(h=>`<th class="px-3 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
              </tr></thead>
              <tbody class="divide-y divide-gray-100">${rows}</tbody>
            </table>
          </div>
        </div>
      </div>`;
    return renderAdminLayout('inquiries', _inqContent, '문의 관리');
  };

  const viewInquiry = async (id) => {
    const res = await API.get(`/api/inquiries/${id}`);
    if (!res.success) return Utils.toast('조회 실패', 'error');
    const i = res.data;
    Utils.modal(`
      <div class="p-6 space-y-4">
        <h3 class="font-bold text-lg">문의 상세</h3>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500">문의자</span> <strong>${i.name}</strong></div>
          <div><span class="text-gray-500">연락처</span> ${i.phone}</div>
          <div><span class="text-gray-500">이메일</span> ${i.email||'-'}</div>
          <div><span class="text-gray-500">접수일</span> ${(i.createdAt||'').slice(0,16).replace('T',' ')}</div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 text-sm">
          <div class="font-medium mb-1">${i.subject||'(제목 없음)'}</div>
          <div class="text-gray-700 whitespace-pre-wrap">${i.content}</div>
        </div>
        ${i.reply ? `<div class="bg-blue-50 rounded-lg p-3 text-sm">
          <div class="font-medium text-blue-700 mb-1">답변 (${(i.repliedAt||'').slice(0,10)})</div>
          <div class="whitespace-pre-wrap">${i.reply}</div>
        </div>` : ''}
        <div class="flex justify-end gap-2">
          <button onclick="AdminModule.replyInquiry('${i.id}');Utils.closeModal()" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">답변하기</button>
          <button onclick="Utils.closeModal()" class="border px-4 py-2 rounded-lg text-sm">닫기</button>
        </div>
      </div>`);
  };

  const replyInquiry = async (id) => {
    const res = await API.get(`/api/inquiries/${id}`);
    if (!res.success) return;
    const i = res.data;
    Utils.modal(`
      <div class="p-6 space-y-4">
        <h3 class="font-bold text-lg">문의 답변</h3>
        <div class="bg-gray-50 rounded-lg p-3 text-sm">
          <div class="font-medium mb-1">${i.subject||i.content?.slice(0,40)||''}</div>
          <div class="text-gray-500 text-xs">${i.name} · ${(i.createdAt||'').slice(0,10)}</div>
        </div>
        <textarea id="inq-reply" rows="5" class="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-300" placeholder="답변 내용을 입력하세요...">${i.reply||''}</textarea>
        <div class="flex justify-end gap-2">
          <button onclick="AdminModule.submitInquiryReply('${i.id}')" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">답변 저장</button>
          <button onclick="Utils.closeModal()" class="border px-4 py-2 rounded-lg text-sm">취소</button>
        </div>
      </div>`);
  };

  const submitInquiryReply = async (id) => {
    const reply = document.getElementById('inq-reply')?.value?.trim();
    if (!reply) return Utils.toast('답변 내용을 입력하세요', 'warning');
    Utils.loading(true);
    const res = await API.put(`/api/inquiries/${id}`, { reply, status: 'answered' });
    Utils.loading(false);
    if (res.success) {
      Utils.toast('답변이 저장되었습니다', 'success');
      Utils.closeModal();
      inquiriesPage().then(html => { document.getElementById('app').innerHTML = html; });
    } else {
      Utils.toast('저장 실패', 'error');
    }
  };

    const seatsPage = async () => {
    _adminState.currentSection = 'seats';
    const user = _adminState.user || {};
    const isSuper = user.role === 'super';
    // 지역관리자는 본인 지역만, 슈퍼는 전체
    const allRegions = (window.REGIONS||[]).filter(r=>r.status==='active'||r.status==='open');
    const regions = isSuper ? allRegions : allRegions.filter(r => r.id === user.regionId);

    const regionCards = regions.map(r => `
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold text-gray-800">${r.name}</h3>
          <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">총 40석 / 제외 2석 / 가능 38명</span>
        </div>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between text-xs text-gray-600 mb-1">
              <span>온라인 예약</span>
              <span id="${r.id}-online-val">${r.onlineRatio}%</span>
            </div>
            <input type="range" min="0" max="100" value="${r.onlineRatio}" step="5"
              oninput="AdminModule.updateSeatRatio('${r.id}', this.value)"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              id="${r.id}-slider">
          </div>
          <div class="flex gap-2 text-sm">
            <div class="flex-1 bg-blue-50 rounded-lg p-3 text-center">
              <div class="font-bold text-blue-600" id="${r.id}-online-seats">${Math.ceil(38*r.onlineRatio/100)}</div>
              <div class="text-xs text-gray-500">온라인</div>
            </div>
            <div class="flex-1 bg-green-50 rounded-lg p-3 text-center">
              <div class="font-bold text-green-600" id="${r.id}-offline-seats">${38 - Math.ceil(38*r.onlineRatio/100)}</div>
              <div class="text-xs text-gray-500">현장</div>
            </div>
          </div>
          <button onclick="AdminModule.saveSeatRatio('${r.id}')" class="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">적용</button>
        </div>
      </div>
    `).join('');

    const content = `
      <div class="space-y-4">
        <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <i class="fas fa-info-circle mr-2"></i>
          좌석 배분 비율을 조정합니다. 운행 시작 전 자동으로 남은 현장 좌석을 온라인으로 전환할 수 있습니다.
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">${regionCards}</div>

        <!-- 자동 전환 설정 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-800 mb-4">자동 좌석 전환 설정</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-700">출발 전 자동 전환 활성화</label>
                <input type="checkbox" checked class="rounded text-blue-600 w-5 h-5 cursor-pointer">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">전환 시점 (출발 몇 분 전)</label>
                <input type="number" value="30" min="5" max="120"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">좌석 잠금 시간 (분)</label>
                <input type="number" value="${Settings.get('seatLockMinutes')||10}" min="5" max="30"
                  oninput="Settings.set('seatLockMinutes', parseInt(this.value))"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <p class="text-xs text-gray-500 mt-1">결제 중 임시 좌석 예약 유지 시간</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('seats', content, '좌석 배분 관리');
  };

  const updateSeatRatio = (regionId, value) => {
    const ratio = parseInt(value);
    const cap = 38; // 항목2: 40석 - 운전자1 - 가이드1 = 38명
    const onlEl = document.getElementById(`${regionId}-online-val`);
    const onlSeats = document.getElementById(`${regionId}-online-seats`);
    const offSeats = document.getElementById(`${regionId}-offline-seats`);
    if (onlEl) onlEl.textContent = `${ratio}%`;
    if (onlSeats) onlSeats.textContent = Math.ceil(cap*ratio/100);
    if (offSeats) offSeats.textContent = cap - Math.ceil(cap*ratio/100);
  };
  const saveSeatRatio = async (regionId) => {
    const slider = document.getElementById(`${regionId}-slider`);
    const autoRelease = document.getElementById(`${regionId}-auto-release`);
    const autoMin = document.getElementById(`${regionId}-auto-min`);
    if (!slider) return;
    const online = parseInt(slider.value) || 70;
    const value = {
      online,
      offline: 100 - online,
      autoRelease: autoRelease?.checked || false,
      autoReleaseMinutes: parseInt(autoMin?.value) || 30,
    };
    try {
      const res = await API.put(`/api/settings/seatAllocation_${regionId}`, { value });
      if (res.success) {
        Utils.toast(`${regionId} 지역 좌석 배분이 저장되었습니다. (온라인 ${online}% / 현장 ${100-online}%)`, 'success');
      } else {
        Utils.toast('저장 실패: ' + (res.message || ''), 'error');
      }
    } catch(e) {
      Utils.toast('저장 중 오류: ' + e.message, 'error');
    }
  };

  // ── 예약 데모 데이터 생성 ──────────────────────────────────
  const _generateDemoReservations = () => {
    const regions = [
      { id:'tongyeong', name:'통영', count:120, fareBase:35000 },
      { id:'buyeo',     name:'부여', count:80,  fareBase:30000 },
      { id:'hapcheon',  name:'합천', count:45,  fareBase:28000 },
    ];
    const schedules = ['10:00','12:00','14:00','15:30','17:00'];
    const statuses = ['confirmed','confirmed','confirmed','confirmed','checkedin','checkedin','pending','cancelled'];
    const names = ['김민준','이서연','박지호','최하늘','정다은','강민서','윤재원','임수아','한도윤','오지수',
                   '신현우','황예린','조성민','류나연','백준혁','전수빈','홍태양','문지아','안준서','장하은'];
    const sources = ['네이버','카카오','인스타그램','블로그','지인소개','여행사','현수막QR'];
    const res = [];
    let seq = 1;
    const today = new Date();

    regions.forEach(reg => {
      for (let i = 0; i < reg.count; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        const dateStr = d.toISOString().slice(0,10);
        const pax = Math.floor(Math.random() * 5) + 1;
        const adultCnt = Math.ceil(pax * 0.6);
        const childCnt = pax - adultCnt;
        const amount = adultCnt * reg.fareBase + childCnt * Math.round(reg.fareBase * 0.5);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const seqStr = String(seq).padStart(4,'0');
        res.push({
          id: `AMK-${dateStr.replace(/-/g,'')}-${seqStr}`,
          regionId: reg.id, regionName: reg.name,
          name: names[Math.floor(Math.random()*names.length)],
          date: dateStr,
          schedule: schedules[Math.floor(Math.random()*schedules.length)],
          totalPassengers: pax, adultCnt, childCnt,
          totalAmount: amount,
          status,
          payMethod: Math.random() > 0.3 ? '카드' : '간편결제',
          source: sources[Math.floor(Math.random()*sources.length)],
          isRefunded: status === 'cancelled' && Math.random() > 0.3,
        });
        seq++;
      }
    });

    // 날짜 내림차순 정렬
    res.sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    return res;
  };

  // ── 예약 관리 ──────────────────────────────────────────────
  // 필터링된 예약 목록을 테이블 행으로 변환
  const _renderReservationRows = (list) => {
    const statusColors = {
      confirmed: 'bg-green-100 text-green-700',
      checkedin: 'bg-blue-100 text-blue-700',
      boarded:   'bg-indigo-100 text-indigo-700',
      cancelled: 'bg-red-100 text-red-700',
      refunded:  'bg-gray-100 text-gray-500',
      pending:   'bg-yellow-100 text-yellow-700',
    };
    const statusLabels = {
      confirmed: '✅ 예약확정',
      checkedin: '🎫 발권완료',
      boarded:   '🚌 탑승완료',
      cancelled: '❌ 취소',
      refunded:  '💰 환불완료',
      pending:   '⏳ 대기',
    };
    const statusIcons = {
      confirmed: 'fas fa-check-circle text-green-500',
      checkedin: 'fas fa-ticket-alt text-blue-500',
      boarded:   'fas fa-bus text-indigo-500',
      cancelled: 'fas fa-times-circle text-red-400',
      refunded:  'fas fa-undo text-gray-400',
      pending:   'fas fa-clock text-yellow-500',
    };
    const payColors = { paid:'bg-green-100 text-green-700', unpaid:'bg-red-100 text-red-700', pending:'bg-yellow-100 text-yellow-700', refunded:'bg-gray-100 text-gray-600' };
    const payLabels = { paid:'결제완료', unpaid:'미결제', pending:'결제대기', refunded:'환불' };
    if (!list.length) return '<tr><td colspan="11" class="text-center py-8 text-gray-400"><i class="fas fa-search mr-2"></i>검색 결과가 없습니다.</td></tr>';
    return list.slice(0, 50).map(r => `
      <tr class="hover:bg-gray-50" id="res-row-${r.id}">
        <td class="px-3 py-2 text-xs font-mono text-blue-600 whitespace-nowrap">${r.id}</td>
        <td class="px-3 py-2 text-sm font-medium">
          ${r.notes ? `<span title="${r.notes}" class="inline-flex items-center gap-0.5">
            <span class="text-red-500 text-xs" title="${r.notes}">⚠️</span>${r.name}
          </span>` : r.name}
        </td>
        <td class="px-3 py-2 text-sm text-center">${r.regionName}</td>
        <td class="px-3 py-2 text-sm text-center whitespace-nowrap">${r.date}</td>
        <td class="px-3 py-2 text-sm text-center">${r.schedule}</td>
        <td class="px-3 py-2 text-sm text-center">${r.totalPassengers}명</td>
        <td class="px-3 py-2 text-right text-sm font-medium whitespace-nowrap">
          ₩${r.totalAmount.toLocaleString()}
          ${r.groupDiscountRate > 0 ? `<div class="text-xs text-green-600 font-normal">단체${r.groupDiscountRate}%↓</div>` : ''}
          ${r.specialDiscountType ? `<div class="text-xs text-blue-600 font-normal">${{'military':'🪖군인','police':'👮경찰','fire':'🚒소방','local':'🏠지역민','senior':'👴노인','disabled':'♿장애','veteran':'🎖️국가유공자','multi_child':'👨‍👩‍👧‍👦다자녀'}[r.specialDiscountType]||r.specialDiscountType}${r.specialDiscountRate||10}%↓ <span class="text-orange-500">⚠️</span></div>` : ''}
        </td>
        <td class="px-3 py-2 text-center text-xs text-gray-500">${r.payMethod}</td>
        <td class="px-3 py-2 text-center">
          <span class="px-2 py-0.5 rounded-full text-xs font-medium ${payColors[r.paymentStatus]||'bg-gray-100 text-gray-600'}">
            ${payLabels[r.paymentStatus]||r.paymentStatus||'결제완료'}
          </span>
        </td>
        <td class="px-3 py-2 text-center">
          <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]||'bg-gray-100 text-gray-600'}">
            ${statusLabels[r.status]||r.status}
          </span>
        </td>
        <td class="px-3 py-2 text-center whitespace-nowrap">
          <div class="flex gap-1 justify-center flex-wrap">
            <button onclick="AdminModule.viewReservation('${r.id}')" class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100">상세</button>
            ${r.status === 'confirmed'
              ? `<button onclick="AdminModule.issueWristbandFromReservation('${r._dbId||r.id}','${r.id}')" class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded hover:bg-green-100">🎫 발권</button>`
              : ''}
            ${r.status !== 'cancelled' && r.status !== 'boarded'
              ? `<button onclick="AdminModule.cancelReservation('${r.id}','${r._dbId||r.id}')" class="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded hover:bg-red-100">취소</button>`
              : `<span class="text-xs text-gray-400">${r.status==='boarded'?'탑승완료':r.isRefunded?'환불완료':'환불전'}</span>`}
          </div>
        </td>
      </tr>
    `).join('');
  };

  // ── DB API 기반 예약 데이터 로드 ─────────────────────────────────
  const _loadRealReservations = async (filters = {}) => {
    const REGION_NAMES = { tongyeong:'통영', buyeo:'부여', hapcheon:'합천' };
    try {
      let url = '/api/reservations?limit=200';
      if (filters.regionId) url += `&regionId=${filters.regionId}`;
      if (filters.date) url += `&date=${filters.date}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
      const res = await API.get(url);
      if (res.success && res.data) {
        return res.data.map(r => ({
          id: r.reservationNo || r.id,
          regionId: r.regionId,
          regionName: REGION_NAMES[r.regionId] || r.regionId || '-',
          name: r.name || '-',
          date: r.date || '-',
          schedule: (() => {
            const sid = r.scheduleId || '';
            const m = sid.match(/(\d{4})$/);
            if (m) return m[1].slice(0,2)+':'+m[1].slice(2); // "1000" → "10:00"
            return sid || '-';
          })(),
          totalPassengers: r.pax || 1,
          adultCnt: r.paxDetail?.find(p=>p.type==='adult')?.count || r.pax || 1,
          childCnt: r.paxDetail?.find(p=>p.type==='child')?.count || 0,
          totalAmount: r.totalPrice || 0,
          originalPrice: r.originalPrice || r.totalPrice || 0,
          groupDiscountRate:    r.groupDiscountRate    || 0,
          groupDiscountAmount:  r.groupDiscountAmount  || 0,
          specialDiscountType:  r.specialDiscountType  || null,
          specialDiscountId:    r.specialDiscountId    || null,
          specialDiscountRate:  r.specialDiscountRate  || 0,
          specialDiscountAmount:r.specialDiscountAmount|| 0,
          specialDiscountFamily:r.specialDiscountFamily|| 1,
          payMethod: r.paymentMethod || '온라인결제',
          paymentStatus: r.paymentStatus || 'paid',
          source: r.channel || '온라인',
          status: r.status || 'confirmed',
          isRefunded: r.status === 'refunded' || r.paymentStatus === 'refunded',
          createdAt: r.createdAt || '',
          phone: r.phone || '',
          email: r.email || '',
          memo: r.notes || '',
          notes: r.notes || '',
          _dbId: r.id,
        }));
      }
    } catch(e) { console.error('reservations load error:', e); }
    // 폴백: 더미
    return _generateDemoReservations();
  };

  // 실제 필터링 실행 함수 (검색 버튼 onclick)
  const filterReservations = async () => {
    const user = _adminState.user || { role: 'super', regionId: null };
    const filters = {};
    if (user.role === 'regional' && user.regionId) filters.regionId = user.regionId;
    const fRegion = document.getElementById('res-filter-region')?.value || '';
    const fDate   = document.getElementById('res-filter-date')?.value || '';
    const fStatus = document.getElementById('res-filter-status')?.value || '';
    const fKeyword= (document.getElementById('res-filter-keyword')?.value || '').trim();
    if (fRegion) filters.regionId = fRegion;
    if (fDate) filters.date = fDate;
    if (fStatus) filters.status = fStatus;
    if (fKeyword) filters.search = fKeyword;

    const tbody = document.getElementById('res-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="text-center py-8 text-gray-400">검색 중...</td></tr>';

    let pool = await _loadRealReservations(filters);

    // 할인 필터 (클라이언트 사이드)
    const fDiscount = document.getElementById('res-filter-discount')?.value || '';
    const UNIFORM = ['military','police','fire'];
    if (fDiscount === 'group')      pool = pool.filter(r => r.groupDiscountRate > 0);
    else if (fDiscount === 'special') pool = pool.filter(r => r.specialDiscountType);
    else if (fDiscount === 'need_check') pool = pool.filter(r => UNIFORM.includes(r.specialDiscountType));
    else if (fDiscount)             pool = pool.filter(r => r.specialDiscountType === fDiscount);

    const countEl = document.getElementById('res-result-count');
    if (countEl) countEl.textContent = `검색 결과 ${pool.length}건`;
    if (tbody) tbody.innerHTML = _renderReservationRows(pool);
  };

  const reservationsPage = async () => {
    _adminState.currentSection = 'reservations';
    const user = _adminState.user || { role: 'super', regionId: null };
    const filters = {};
    if (user.role === 'regional' && user.regionId) filters.regionId = user.regionId;
    const reservations = await _loadRealReservations(filters);

    // 통계 카드용 집계
    const totalRevenue  = reservations.filter(r=>r.status!=='cancelled').reduce((s,r)=>s+r.totalAmount,0);
    const todayRes      = reservations.filter(r=>r.date===new Date().toISOString().slice(0,10));
    const cancelCount   = reservations.filter(r=>r.status==='cancelled').length;

    // 지역 옵션: super는 전체, regional은 자기 지역만
    const regionOpts = user.role === 'regional' && user.regionId
      ? `<option value="${user.regionId}" selected>${({tongyeong:'통영',buyeo:'부여',hapcheon:'합천'}[user.regionId]||user.regionId)}</option>`
      : `<option value="">전체 지역</option>
         <option value="tongyeong">통영</option>
         <option value="buyeo">부여</option>
         <option value="hapcheon">합천</option>`;

    const content = `
      <div class="space-y-4">
        <!-- 통계 요약 카드 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          ${statCard('fas fa-ticket-alt', '전체 예약', `${reservations.length.toLocaleString()}건`, '최근 30일', 'blue')}
          ${statCard('fas fa-won-sign', '총 매출', '₩'+totalRevenue.toLocaleString(), '취소 제외', 'green')}
          ${statCard('fas fa-calendar-day', '오늘 예약', `${todayRes.length}건`, new Date().toLocaleDateString('ko-KR'), 'purple')}
          ${statCard('fas fa-times-circle', '취소 건수', `${cancelCount}건`, `취소율 ${Math.round(cancelCount/reservations.length*100)}%`, 'red')}
        </div>

        <!-- 필터 -->
        <div class="bg-white rounded-xl shadow-sm p-4">
          <div class="flex flex-wrap gap-2 items-end">
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500 font-medium">지역</label>
              <select id="res-filter-region" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[100px]">
                ${regionOpts}
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500 font-medium">날짜</label>
              <input type="date" id="res-filter-date" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500 font-medium">상태</label>
              <select id="res-filter-status" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[100px]">
                <option value="">전체 상태</option>
                <option value="confirmed">✅ 예약확정</option>
                <option value="checkedin">🎫 발권완료</option>
                <option value="boarded">🚌 탑승완료</option>
                <option value="pending">⏳ 대기</option>
                <option value="cancelled">❌ 취소</option>
                <option value="refunded">💰 환불완료</option>
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500 font-medium">할인 유형</label>
              <select id="res-filter-discount" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[120px]">
                <option value="">전체</option>
                <option value="group">단체할인</option>
                <option value="special">특별할인(전체)</option>
                <option value="military">🪖 군인</option>
                <option value="police">👮 경찰</option>
                <option value="fire">🚒 소방공무원</option>
                <option value="local">🏠 지역민</option>
                <option value="senior">👴 노인</option>
                <option value="disabled">♿ 장애인</option>
                <option value="veteran">🎖️ 국가유공자</option>
                <option value="multi_child">👨‍👩‍👧‍👦 다자녀가정</option>
                <option value="need_check">⚠️ 서류확인 필요</option>
              </select>
            </div>
            <div class="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label class="text-xs text-gray-500 font-medium">예약번호 / 예약자명</label>
              <input type="text" id="res-filter-keyword" placeholder="검색어 입력..."
                class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                onkeydown="if(event.key==='Enter') AdminModule.filterReservations()">
            </div>
            <button onclick="AdminModule.filterReservations()"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 self-end">
              <i class="fas fa-search"></i> 검색
            </button>
            <button onclick="AdminModule.resetReservationFilter()"
              class="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 self-end">
              초기화
            </button>
            <button onclick="AdminModule.exportReservations()"
              class="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 self-end">
              <i class="fas fa-download"></i> CSV
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b flex items-center justify-between">
            <span id="res-result-count" class="text-sm font-medium text-gray-700">총 ${reservations.length}건 (최대 50건 표시)</span>
            <span class="text-xs text-gray-400">${user.role === 'regional' ? `${({tongyeong:'통영',buyeo:'부여',hapcheon:'합천'}[user.regionId]||'')} 지역 데이터` : '전체 지역 데이터'}</span>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead>
                <tr class="bg-gray-50">
                  ${['예약번호','예약자','지역','날짜','회차','인원','금액','결제수단','결제상태','예약상태','관리'].map(h=>`<th class="px-3 py-2 text-xs font-semibold text-gray-600 text-center whitespace-nowrap">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody id="res-tbody" class="divide-y divide-gray-100">${_renderReservationRows(reservations)}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('reservations', content, '예약 관리');
  };

  const resetReservationFilter = () => {
    ['res-filter-region','res-filter-date','res-filter-status','res-filter-keyword'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    filterReservations();
  };

  const viewReservation = async (id) => {
    const allRes = await _loadRealReservations();
    const r = allRes.find(x => x.id === id);
    if (!r) { Utils.toast('예약 정보를 찾을 수 없습니다.', 'error'); return; }
    const statusLabels = { confirmed:'✅ 예약확정', cancelled:'❌ 취소', pending:'⏳ 대기', checkedin:'🎫 발권완료', boarded:'🚌 탑승완료', refunded:'💰 환불완료' };
    // 특이사항 — notes 필드에서 실제 데이터 파싱
    const notesRaw = r.notes || r.memo || '';
    const safetyFlags = [];
    if (notesRaw) {
      // "보행 보조 필요 / 임산부 포함" 같은 형식 분리
      const parts = notesRaw.split(/[,/\n]+/).map(s => s.trim()).filter(Boolean);
      safetyFlags.push(...parts);
    }
    const safetyBadge = safetyFlags.length > 0 ? `
      <div style="margin-top:6px;padding:8px;background:#fef2f2;border:2px solid #fca5a5;border-radius:12px;margin-bottom:6px;">
        <div style="color:#b91c1c;font-weight:700;font-size:12px;margin-bottom:5px;">⚠️ 현장 직원 확인 필요 — 특이사항</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${safetyFlags.map(f=>`<span style="background:#fee2e2;color:#b91c1c;font-size:11px;padding:2px 8px;border-radius:20px;font-weight:600;">${f}</span>`).join('')}
        </div>
        <p style="font-size:11px;color:#ef4444;margin-top:5px;">⚠️ 탑승 전 반드시 확인하세요.</p>
      </div>` : '';
    // 탑승자 명단 — DB에서 직접 조회
    let passengersList = r.passengers || [];
    if (!passengersList.length) {
      try {
        const dbRes = await API.get(`/api/reservations/ticket/${r.id}`);
        if (dbRes.success) passengersList = dbRes.data.passengers || [];
      } catch(e) {}
    }
    const passengersHtml = passengersList.length > 0
      ? `<div style="margin-top:10px;border-top:1px solid #e2e8f0;padding-top:10px;">
          <div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:6px;">
            <i class="fas fa-users" style="color:#60a5fa;margin-right:4px;"></i> 탑승자 명단 (${passengersList.length}명)
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${passengersList.map((p,i) => `
              <div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border-radius:8px;padding:5px 8px;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="width:18px;height:18px;background:#3b82f6;color:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;">${i+1}</span>
                  <span style="font-weight:600;color:#111827;font-size:12px;">${p.name||'미입력'}</span>
                </div>
                <span style="color:#9ca3af;font-size:11px;">${p.birth||''} ${p.gender==='M'?'남':p.gender==='F'?'여':''}</span>
              </div>`).join('')}
          </div>
        </div>`
      : '<div style="margin-top:10px;border-top:1px solid #e2e8f0;padding-top:10px;font-size:12px;color:#9ca3af;text-align:center;">탑승자 정보 미입력 (구형 예약)</div>';

    Utils.confirm(
      `<div style="text-align:left;font-size:14px;color:#111827;">
        <div style="font-weight:700;font-size:15px;margin-bottom:8px;font-family:monospace;color:#1e40af;">${r.id}</div>
        ${safetyBadge}
        <div style="display:flex;justify-content:space-between;padding-top:4px;margin-bottom:4px;"><span style="color:#6b7280;">예약자</span><span style="font-weight:600;color:#111827;">${r.name}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#6b7280;">지역</span><span style="color:#111827;">${r.regionName}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#6b7280;">날짜·회차</span><span style="color:#111827;">${r.date} ${r.schedule}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#111827;"><span style="color:#6b7280;">인원</span>
          <span>${
            (() => {
              const pd = r.paxDetail || [];
              if (pd.length > 0) return pd.map(p=>{const l=p.type==='adult'?'성인':p.type==='child'?'소아':p.type==='infant'?'유아':p.type==='senior'?'경로':p.type; return l+' '+p.count+'명';}).join(' / ');
              return '성인 '+(r.adultCnt||r.pax||1)+'명'+(r.childCnt?' / 소아 '+r.childCnt+'명':'');
            })()
          }</span>
        </div>
        <!-- 정산 소계 블록 -->
        <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:6px 0;">
          <div style="background:#f8fafc;padding:6px 12px;font-size:11px;font-weight:700;color:#475569;">💰 요금 정산 내역</div>
          <div style="padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;font-size:13px;color:#374151;margin-bottom:4px;">
              <span>정상가</span>
              <span>₩${(r.originalPrice||r.totalAmount).toLocaleString()}</span>
            </div>
            ${r.groupDiscountRate > 0 ? `
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#15803d;margin-bottom:4px;">
              <span>단체할인 (${r.groupDiscountRate}% / ${r.totalPassengers}인)</span>
              <span style="font-weight:700;">-₩${(r.groupDiscountAmount||0).toLocaleString()}</span>
            </div>` : ''}
            ${r.specialDiscountType ? `
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#1d4ed8;margin-bottom:4px;">
              <span>특별할인 (${{ military:'🪖 군인', police:'👮 경찰', fire:'🚒 소방공무원', local:'🏠 지역민', senior:'👴 노인(65세+)', disabled:'♿ 장애인', veteran:'🎖️ 국가유공자', multi_child:'👨‍👩‍👧‍👦 다자녀가정' }[r.specialDiscountType]||r.specialDiscountType} ${r.specialDiscountRate||10}%${ ['military','police','fire'].includes(r.specialDiscountType) ? ' / 직계가족 포함 전원' : ' / 본인 1명' })</span>
              <span style="font-weight:700;">-₩${(r.specialDiscountAmount||0).toLocaleString()}</span>
            </div>
            ${['military','police','fire'].includes(r.specialDiscountType) ? `
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:8px 10px;font-size:11px;color:#92400e;margin-top:4px;">
              <div style="font-weight:700;margin-bottom:3px;">⚠️ 현장 서류확인 필수</div>
              <div>· 공무원 신분증 (군인증/경찰증/소방관증)</div>
              <div>· 주민등록등본 또는 가족관계증명서</div>
              <div style="margin-top:4px;font-weight:700;color:#78350f;">미제출 시 할인 취소 → 차액 현장 결제</div>
              ${r.specialDiscountId ? `<div style="margin-top:3px;color:#6b7280;">신고번호: ${r.specialDiscountId}</div>` : ''}
            </div>` : ''}
            ` : ''}
            <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:6px;color:#1e40af;">
              <span style="color:#111827;">최종 결제금액</span>
              <span>₩${r.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#6b7280;">결제수단</span><span style="color:#111827;">${r.payMethod}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#6b7280;">유입경로</span><span style="color:#111827;">${r.source}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;align-items:center;"><span style="color:#6b7280;">상태</span>
          <span style="padding:2px 8px;border-radius:20px;font-size:12px;font-weight:600;${r.status==='confirmed'?'background:#dcfce7;color:#15803d;':r.status==='checkedin'?'background:#dbeafe;color:#1d4ed8;':r.status==='cancelled'?'background:#fee2e2;color:#dc2626;':'background:#fef9c3;color:#a16207;'}">
            ${statusLabels[r.status]||r.status}
          </span>
        </div>
        ${passengersHtml}
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;display:flex;gap:8px;">
          <a href="/ticket/${r.id}" target="_blank"
            style="flex:1;text-align:center;background:#eff6ff;color:#2563eb;padding:8px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">
            🎫 탑승권 QR 보기
          </a>
        </div>
      </div>`,
      () => {},
      { confirmText: '닫기', cancelText: null, title: '예약 상세 정보' }
    );
  };

  // ── 예약에서 직접 발권 ──────────────────────────────────
  const issueWristbandFromReservation = async (dbId, displayId) => {
    // 예약 정보 조회
    Utils.loading(true);
    const res = await API.get(`/api/reservations/ticket/${displayId}`);
    Utils.loading(false);
    if (!res.success) { Utils.toast('예약 정보 조회 실패', 'error'); return; }
    const r = res.data;
    const typeLabel = { adult:'성인', child:'소아', infant:'유아', senior:'경로' };
    const pd = r.paxDetail || [];
    const types = pd.length ? pd : [{ type:'adult', count: r.pax||1 }];

    Utils.modal(`
      <div class="modal-header"><h3 class="font-bold text-green-700">🎫 손목밴드 발권</h3></div>
      <div class="modal-body space-y-3 pt-2">
        <div class="bg-green-50 rounded-lg p-3 text-sm space-y-1">
          <div class="flex justify-between"><span class="text-gray-500">예약번호</span><span class="font-mono font-bold text-blue-600">${r.reservationNo}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">예약자</span><span class="font-bold">${r.name}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">지역/일자</span><span>${r.regionName} ${r.date}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">회차</span><span>${r.time||'-'} 출발</span></div>
          <div class="flex justify-between"><span class="text-gray-500">인원</span><span>${r.pax}명</span></div>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-medium block mb-1">발권 권종 선택</label>
          <select id="issue-wb-type" class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400">
            ${types.map(t=>`<option value="${t.type}">${typeLabel[t.type]||t.type} (${t.count}명)</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-medium block mb-1">발권 수량</label>
          <input type="number" id="issue-wb-count" value="${r.pax||1}" min="1" max="${r.pax||10}"
            class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400">
        </div>
        <div class="flex gap-2">
          <button onclick="Utils.closeModal()" class="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">취소</button>
          <button onclick="AdminModule._doIssueWristbandFromRes('${dbId}','${r.time||''}','${r.regionName||''}')"
            class="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700">🎫 발권하기</button>
        </div>
      </div>`);
  };

  const _doIssueWristbandFromRes = async (reservationId, round, regionName) => {
    const type  = document.getElementById('issue-wb-type')?.value || 'adult';
    const count = parseInt(document.getElementById('issue-wb-count')?.value || '1');
    const user  = Store.get('adminUser') || {};
    Utils.closeModal();
    Utils.loading(true);
    const res = await API.post('/api/wristbands/issue', {
      reservationId, round, type, count,
      issuedBy: user.name || '관리자',
    });
    Utils.loading(false);
    if (res.success) {
      const ids = res.data?.wristbandIds || [];
      Utils.toast(`발권 완료! 밴드 ${ids.length}개 발급 (${ids.join(', ')})`, 'success', 4000);
      // 예약 목록 새로고침
      reservationsPage().then(html => { document.getElementById('app').innerHTML = html; });
    } else {
      Utils.toast('발권 실패: ' + (res.error||''), 'error');
    }
  };

  const cancelReservation = (id, dbId) => {
    Utils.confirm(`예약 ${id}를 취소하시겠습니까?\n취소 후에는 환불 정책에 따라 처리됩니다.`, async () => {
      // API 취소 처리
      const targetId = dbId || id;
      const res = await API.put(`/api/reservations/${targetId}`, { status: 'cancelled' });
      // UI 업데이트
      const row = document.getElementById(`res-row-${id}`);
      if (row) {
        const statusCell = row.querySelector('td:nth-child(9)');
        if (statusCell) statusCell.innerHTML = '<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">취소</span>';
        const actCell = row.querySelector('td:nth-child(10)');
        if (actCell) actCell.innerHTML = '<span class="text-xs text-gray-400">환불전</span>';
      }
      Utils.toast(`예약 ${id}가 취소되었습니다.`, 'success');
    });
  };

  const exportReservations = () => {
    const user = _adminState.user || { role: 'super', regionId: null };
    const allRes = _loadRealReservations();
    const pool = (user.role === 'regional' && user.regionId)
      ? allRes.filter(r => r.regionId === user.regionId)
      : allRes;
    const rows = [
      ['예약번호','예약자','지역','날짜','회차','성인','소아','총인원','금액','결제수단','상태','유입경로'],
      ...pool.map(r=>[r.id,r.name,r.regionName,r.date,r.schedule,r.adultCnt,r.childCnt,r.totalPassengers,r.totalAmount,r.payMethod,r.status,r.source]),
    ];
    Utils.downloadCSV(rows, `reservations_${new Date().toISOString().slice(0,10)}.csv`);
    Utils.toast('예약 목록 CSV가 다운로드됩니다.', 'success');
  };

  // ── 손목밴드 데모 데이터 생성 ──────────────────────────────
  const _generateDemoWristbands = () => {
    const ticketTypes = ['성인','어린이','청소년','경로','단체'];
    const statuses = ['used','used','used','active','active','invalidated'];
    const regions = [
      { id:'tongyeong', name:'통영', schedules:['10:00','12:00','14:00','15:30'] },
      { id:'buyeo',     name:'부여', schedules:['10:00','13:00','15:30'] },
      { id:'hapcheon',  name:'합천', schedules:['10:30','13:30','16:00'] },
    ];
    const bands = [];
    let seq = 1;
    const today = new Date();

    regions.forEach(reg => {
      const count = reg.id === 'tongyeong' ? 40 : reg.id === 'buyeo' ? 25 : 15;
      for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 14);
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        const dateStr = d.toISOString().slice(0,10);
        const hour = d.getHours() < 10 ? '0'+d.getHours() : d.getHours();
        const min  = d.getMinutes() < 10 ? '0'+d.getMinutes() : d.getMinutes();
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        bands.push({
          id: `WB-${reg.id.slice(0,3).toUpperCase()}-${String(seq).padStart(5,'0')}`,
          reservationId: `AMK-${dateStr.replace(/-/g,'')}-${String(Math.floor(Math.random()*9000)+1000).padStart(4,'0')}`,
          regionName: reg.name,
          round: reg.schedules[Math.floor(Math.random()*reg.schedules.length)] + ' 회차',
          ticketType: ticketTypes[Math.floor(Math.random()*ticketTypes.length)],
          status,
          issuedAt: `${dateStr} ${hour}:${min}`,
          qrCode: `QR-${String(seq).padStart(8,'0')}`,
        });
        seq++;
      }
    });
    return bands.sort((a,b) => b.issuedAt.localeCompare(a.issuedAt));
  };

  // ── 손목밴드 관리 ──────────────────────────────────────────
  const wristbandsPage = async () => {
    _adminState.currentSection = 'wristbands';
    const user = _adminState.user || Store.get('adminUser') || { role: 'super', regionId: null };
    const wbText = Settings.get('wristbandText') || { brand: 'Aqua Mobility Korea', footer: '안전하고 즐거운 투어 되세요!', warning: '' };

    // DB에서 실제 데이터 로드
    const regionId = user.role === 'regional' ? user.regionId : null;
    const queryStr = regionId ? `?regionId=${regionId}&limit=100` : '?limit=100';
    const wbRes = await API.get(`/api/wristbands/search${queryStr}`);
    const wristbands = wbRes.success ? (wbRes.data || []) : [];

    const activeCount  = wristbands.filter(w=>w.status==='active').length;
    const usedCount    = wristbands.filter(w=>w.status==='used').length;
    const voidedCount  = wristbands.filter(w=>w.status==='voided').length;

    const _statusBadge = (s) => {
      const m = { active:'bg-green-100 text-green-700', used:'bg-gray-100 text-gray-500', voided:'bg-red-100 text-red-600' };
      const l = { active:'✅ 유효', used:'🔘 사용완료', voided:'🚫 무효화' };
      return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold ${m[s]||'bg-gray-100 text-gray-500'}">${l[s]||s}</span>`;
    };
    const _typeLabel = (t) => ({adult:'성인',child:'소아',infant:'유아',senior:'경로',group:'단체',youth:'청소년'})[t]||t||'-';

    const rows = wristbands.length ? wristbands.map((w,i) => `
      <tr class="hover:bg-gray-50 cursor-pointer" onclick="AdminModule.showWristbandDetail('${w.id}')">
        <td class="px-3 py-2 text-xs font-mono text-navy-700 whitespace-nowrap">${w.id}</td>
        <td class="px-3 py-2">
          <div class="text-xs font-mono text-blue-600">${w.reservationNo || '-'}</div>
          <div class="text-xs font-bold text-gray-800">${w.passengerName}</div>
          ${w.passengerBirth ? `<div class="text-xs text-gray-400">${w.passengerBirth} ${w.passengerGender==='M'?'남':w.passengerGender==='F'?'여':''}</div>` : ''}
        </td>
        <td class="px-3 py-2 text-xs text-center text-gray-600">${w.regionName||'-'}</td>
        <td class="px-3 py-2 text-xs text-center whitespace-nowrap text-gray-600">${w.round||'-'}</td>
        <td class="px-3 py-2 text-xs text-center">${_typeLabel(w.type)}</td>
        <td class="px-3 py-2 text-center">${_statusBadge(w.status)}</td>
        <td class="px-3 py-2 text-xs text-gray-500 text-center whitespace-nowrap">${(w.issuedAt||'').slice(0,16)}</td>
        <td class="px-3 py-2 text-xs text-gray-500 text-center">${w.issuedBy||'-'}</td>
        <td class="px-3 py-2 text-center">
          <div class="flex gap-1 justify-center flex-wrap">
            <button onclick="event.stopPropagation(); AdminModule.showWristbandDetail('${w.id}')"
              class="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">상세</button>
            ${w.status==='active'?`
            <button onclick="event.stopPropagation(); AdminModule.voidWristband('${w.id}','${w.reservationId}')"
              class="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">무효화</button>
            <button onclick="event.stopPropagation(); AdminModule.reissueWristband('${w.id}','${w.reservationId}','${w.round}','${w.type}')"
              class="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-100">재발급</button>`:''}
            ${w.status==='voided'?`
            <button onclick="event.stopPropagation(); AdminModule.reissueWristband('${w.id}','${w.reservationId}','${w.round}','${w.type}')"
              class="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-100">재발급</button>`:''}
          </div>
        </td>
      </tr>`) .join('')
    : '<tr><td colspan="9" class="text-center py-8 text-gray-400">발급된 손목밴드가 없습니다.</td></tr>';

    const content = `
      <div class="space-y-4">
        <!-- 손목밴드 인쇄 문구 편집 -->
        <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 class="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
            <i class="fas fa-edit text-blue-500"></i> 손목밴드 인쇄 문구 관리
          </h2>
          <div class="grid grid-cols-3 gap-3">
            <div><label class="block text-xs text-gray-500 mb-1">브랜드명</label>
              <input id="wb-brand" type="text" value="${wbText.brand}" class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"></div>
            <div><label class="block text-xs text-gray-500 mb-1">하단 문구</label>
              <input id="wb-footer" type="text" value="${wbText.footer}" class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"></div>
            <div><label class="block text-xs text-gray-500 mb-1">경고 문구</label>
              <input id="wb-warning" type="text" value="${wbText.warning||''}" class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"></div>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <p class="text-xs text-amber-600"><i class="fas fa-shield-alt mr-1"></i>개인정보 보호: 손목밴드에는 성명·전화번호·생년월일을 인쇄하지 않습니다.</p>
            <button onclick="AdminModule.saveWristbandText()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex-shrink-0">
              <i class="fas fa-save mr-1"></i> 저장
            </button>
          </div>
        </div>

        <!-- 통계 카드 -->
        <div class="grid grid-cols-3 gap-3">
          ${statCard('fas fa-check-circle','유효 밴드',`${activeCount}개`,'체크인 대기','green')}
          ${statCard('fas fa-check-double','사용 완료',`${usedCount}개`,'탑승 처리됨','blue')}
          ${statCard('fas fa-ban','무효화',`${voidedCount}개`,'취소/훼손','red')}
        </div>

        <!-- 검색 + 스캔 확인 -->
        <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div class="flex gap-3 flex-wrap">
            <div class="flex-1 min-w-[200px]">
              <label class="text-xs text-gray-500 font-medium block mb-1">이름 / 예약번호 / 밴드ID 검색</label>
              <div class="flex gap-2">
                <input type="text" id="wb-search-q" placeholder="홍길동 / BYO-... / WB-..."
                  class="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  onkeydown="if(event.key==='Enter') AdminModule.searchWristbands()">
                <button onclick="AdminModule.searchWristbands()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  <i class="fas fa-search"></i>
                </button>
              </div>
            </div>
            <div class="flex-1 min-w-[200px]">
              <label class="text-xs text-gray-500 font-medium block mb-1">🔍 밴드 스캔 상태 확인 (사용완료·무효화 경고)</label>
              <div class="flex gap-2">
                <input type="text" id="wb-scan-check-id" placeholder="손목밴드 ID (WB-...)"
                  class="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  onkeydown="if(event.key==='Enter') AdminModule.scanCheckWristband()">
                <button onclick="AdminModule.scanCheckWristband()"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  <i class="fas fa-qrcode"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 발급 현황 테이블 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
            <span class="font-semibold text-sm text-gray-700">발급 현황 <span class="text-gray-400 font-normal">(행 클릭 → 상세보기)</span></span>
            <span class="text-xs text-gray-400">총 ${wristbands.length}건</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b">
                  ${['밴드ID','예약번호 / 탑승자','지역','회차','유형','상태','발급시간','발급자','작업'].map(h=>`<th class="px-3 py-2 text-xs font-semibold text-gray-500 text-center whitespace-nowrap">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody id="wb-table-body" class="divide-y divide-gray-50">${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('wristbands', content, '손목밴드 관리');
  };
  const saveWristbandText = () => {
    const text = { brand: document.getElementById('wb-brand')?.value||'', footer: document.getElementById('wb-footer')?.value||'', warning: document.getElementById('wb-warning')?.value||'' };
    Settings.set('wristbandText', text);
    Utils.toast('손목밴드 인쇄 문구가 저장되었습니다.', 'success');
  };

  // ── 손목밴드 상세보기 모달 ────────────────────────────────
  const showWristbandDetail = async (wbId) => {
    Utils.loading(true);
    const res = await API.get(`/api/wristbands/${wbId}`);
    Utils.loading(false);
    if (!res.success) { Utils.toast('조회 실패: ' + (res.error||''), 'error'); return; }
    const w = res.data;
    const stMap = { active:'✅ 유효', used:'🔘 사용완료', voided:'🚫 무효화' };
    const stCls = { active:'bg-green-100 text-green-700', used:'bg-gray-100 text-gray-500', voided:'bg-red-100 text-red-600' };
    const typeLabel = {adult:'성인',child:'소아',infant:'유아',senior:'경로',group:'단체',youth:'청소년'};
    const passengersHtml = w.passengers && w.passengers.length ? `
      <div class="mt-3 border-t pt-3">
        <div class="text-xs font-bold text-gray-500 mb-2">👥 탑승자 명단</div>
        <div class="space-y-1">
          ${w.passengers.map((p,i)=>`
            <div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 text-xs">
              <span class="font-bold">${i+1}. ${p.name||'-'}</span>
              <span class="text-gray-400">${p.birth||''} ${p.gender==='M'?'남':p.gender==='F'?'여':''}</span>
            </div>`).join('')}
        </div>
      </div>` : '';
    const logsHtml = w.logs && w.logs.length ? `
      <div class="mt-3 border-t pt-3">
        <div class="text-xs font-bold text-gray-500 mb-2">📋 처리 이력</div>
        <div class="space-y-1">
          ${w.logs.map(l=>`
            <div class="flex items-start gap-2 text-xs">
              <span class="text-gray-400 whitespace-nowrap">${(l.created_at||'').slice(0,16)}</span>
              <span class="px-1.5 py-0.5 rounded text-xs font-medium ${l.action==='issue'?'bg-green-100 text-green-700':l.action==='void'||l.action==='void_for_reissue'?'bg-red-100 text-red-600':l.action==='reissue'?'bg-blue-100 text-blue-700':l.action==='board'?'bg-indigo-100 text-indigo-600':'bg-gray-100 text-gray-500'}">
                ${{issue:'발급',void:'무효화',void_for_reissue:'무효화(재발급)',reissue:'재발급',board:'탑승확인'}[l.action]||l.action}
              </span>
              <span class="text-gray-600">${l.actor||''} ${l.reason?'— '+l.reason:''}</span>
            </div>`).join('')}
        </div>
      </div>` : '';
    Utils.modal(`
      <div class="modal-header"><h3 class="font-bold">손목밴드 상세</h3></div>
      <div class="modal-body space-y-2 text-sm pt-2">
        <div class="flex justify-between items-center">
          <span class="font-mono font-bold text-navy-800">${w.id}</span>
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${stCls[w.status]||''}">${stMap[w.status]||w.status}</span>
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm border-t pt-2">
          <div><span class="text-gray-400 text-xs block">예약번호</span><span class="font-semibold text-blue-600">${w.reservationNo||'-'}</span></div>
          <div><span class="text-gray-400 text-xs block">예약자</span><span class="font-semibold">${w.passengerName}</span></div>
          <div><span class="text-gray-400 text-xs block">생년월일</span><span>${w.passengerBirth||'-'}</span></div>
          <div><span class="text-gray-400 text-xs block">성별</span><span>${w.passengerGender==='M'?'남성':w.passengerGender==='F'?'여성':'-'}</span></div>
          <div><span class="text-gray-400 text-xs block">지역</span><span>${w.regionName||'-'}</span></div>
          <div><span class="text-gray-400 text-xs block">회차</span><span>${w.round||'-'}</span></div>
          <div><span class="text-gray-400 text-xs block">권종</span><span>${typeLabel[w.type]||w.type||'-'}</span></div>
          <div><span class="text-gray-400 text-xs block">발급자</span><span>${w.issuedBy||'-'}</span></div>
          <div><span class="text-gray-400 text-xs block">발급시간</span><span>${(w.issuedAt||'').slice(0,16)}</span></div>
          ${w.boardedAt?`<div><span class="text-gray-400 text-xs block">탑승확인</span><span class="text-indigo-600">${(w.boardedAt||'').slice(0,16)}</span></div>`:''}
          ${w.voidedAt?`<div><span class="text-gray-400 text-xs block">무효화</span><span class="text-red-600">${(w.voidedAt||'').slice(0,16)} (${w.voidedBy||'-'})</span></div>`:''}
          ${w.voidReason?`<div class="col-span-2"><span class="text-gray-400 text-xs block">무효화 사유</span><span class="text-red-600">${w.voidReason}</span></div>`:''}
          ${w.reissuedFrom?`<div class="col-span-2"><span class="text-gray-400 text-xs block">재발급 원본</span><span class="text-blue-600">${w.reissuedFrom} — ${w.reissueReason||''}</span></div>`:''}
        </div>
        ${passengersHtml}
        ${logsHtml}
        ${w.status==='active'?`
        <div class="flex gap-2 pt-2 border-t flex-wrap">
          <button onclick="Utils.closeModal(); AdminModule.voidWristband('${w.id}','${w.reservationId}')"
            class="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-100">🚫 무효화</button>
          <button onclick="Utils.closeModal(); AdminModule.reissueWristband('${w.id}','${w.reservationId}','${w.round}','${w.type}')"
            class="flex-1 bg-yellow-50 text-yellow-700 py-2 rounded-lg text-sm font-medium hover:bg-yellow-100">🔄 재발급</button>
          <button onclick="Utils.closeModal()"
            class="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">닫기</button>
        </div>`
        : w.status==='voided'?`
        <div class="flex gap-2 pt-2 border-t">
          <button onclick="Utils.closeModal(); AdminModule.reissueWristband('${w.id}','${w.reservationId}','${w.round}','${w.type}')"
            class="flex-1 bg-yellow-50 text-yellow-700 py-2 rounded-lg text-sm font-medium hover:bg-yellow-100">🔄 재발급</button>
          <button onclick="Utils.closeModal()"
            class="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">닫기</button>
        </div>` : `<button onclick="Utils.closeModal()" class="w-full border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 mt-2">닫기</button>`}
      </div>`);
  };

  // ── 이름/예약번호 검색 ────────────────────────────────────
  const searchWristbands = async () => {
    const q = document.getElementById('wb-search-q')?.value?.trim();
    if (!q) { Utils.toast('검색어를 입력하세요', 'warning'); return; }
    Utils.loading(true);
    const res = await API.get(`/api/wristbands/search?q=${encodeURIComponent(q)}&limit=50`);
    Utils.loading(false);
    if (!res.success) { Utils.toast('검색 실패', 'error'); return; }
    const wristbands = res.data || [];
    const stBadge = (s) => {
      const m = {active:'bg-green-100 text-green-700',used:'bg-gray-100 text-gray-500',voided:'bg-red-100 text-red-600'};
      const l = {active:'✅ 유효',used:'🔘 사용완료',voided:'🚫 무효화'};
      return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold ${m[s]||''}">${l[s]||s}</span>`;
    };
    const typeLabel = {adult:'성인',child:'소아',infant:'유아',senior:'경로',group:'단체',youth:'청소년'};
    const rows = wristbands.length
      ? wristbands.map(w=>`
          <tr class="hover:bg-gray-50 cursor-pointer" onclick="AdminModule.showWristbandDetail('${w.id}')">
            <td class="px-3 py-2 text-xs font-mono text-navy-700">${w.id}</td>
            <td class="px-3 py-2">
              <div class="text-xs font-mono text-blue-600">${w.reservationNo||'-'}</div>
              <div class="text-xs font-bold">${w.passengerName}</div>
              ${w.passengerBirth?`<div class="text-xs text-gray-400">${w.passengerBirth} ${w.passengerGender==='M'?'남':w.passengerGender==='F'?'여':''}</div>`:''}
            </td>
            <td class="px-3 py-2 text-xs text-center">${w.regionName||'-'}</td>
            <td class="px-3 py-2 text-xs text-center">${w.round||'-'}</td>
            <td class="px-3 py-2 text-xs text-center">${typeLabel[w.type]||w.type||'-'}</td>
            <td class="px-3 py-2 text-center">${stBadge(w.status)}</td>
            <td class="px-3 py-2 text-xs text-gray-500 text-center">${(w.issuedAt||'').slice(0,16)}</td>
          </tr>`).join('')
      : '<tr><td colspan="7" class="text-center py-6 text-gray-400">검색 결과가 없습니다.</td></tr>';
    Utils.modal(`
      <div class="modal-header"><h3 class="font-bold">검색 결과: "${q}" (${wristbands.length}건)</h3></div>
      <div class="modal-body p-0" style="max-height:400px;overflow-y:auto">
        <table class="w-full text-sm">
          <thead><tr class="bg-gray-50 border-b">
            ${['밴드ID','예약번호/탑승자','지역','회차','권종','상태','발급시간'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 font-semibold text-center">${h}</th>`).join('')}
          </tr></thead>
          <tbody class="divide-y divide-gray-100">${rows}</tbody>
        </table>
      </div>`, { size: 'max-w-3xl' });
  };

  // ── 재발급 ────────────────────────────────────────────────
  const reissueWristband = (originalId, reservationId, round, type) => {
    Utils.modal(`
      <div class="modal-header"><h3 class="font-bold text-yellow-700">🔄 손목밴드 재발급</h3></div>
      <div class="modal-body space-y-3 pt-2">
        <div class="bg-yellow-50 rounded-lg p-3 text-sm">
          <div class="text-yellow-700 font-bold mb-1">원본 밴드: <span class="font-mono">${originalId}</span></div>
          <div class="text-xs text-yellow-600">원본 밴드는 자동으로 무효화됩니다.</div>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-medium block mb-1">재발급 사유 <span class="text-red-400">*</span></label>
          <select id="reissue-reason-select" class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400 mb-2"
            onchange="document.getElementById('reissue-reason-custom').style.display=this.value==='직접입력'?'block':'none'">
            <option value="훼손">훼손으로 인한 재발급</option>
            <option value="분실">분실로 인한 재발급</option>
            <option value="오발급">오발급 정정</option>
            <option value="직접입력">직접 입력</option>
          </select>
          <input id="reissue-reason-custom" type="text" placeholder="재발급 사유 직접 입력"
            class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400 hidden">
        </div>
        <div class="flex gap-2">
          <button onclick="Utils.closeModal()" class="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">취소</button>
          <button onclick="AdminModule._doReissueWristband('${originalId}','${reservationId}','${round}','${type}')"
            class="flex-1 bg-yellow-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-yellow-600">재발급 처리</button>
        </div>
      </div>`);
  };

  const _doReissueWristband = async (originalId, reservationId, round, type) => {
    const sel = document.getElementById('reissue-reason-select')?.value;
    const custom = document.getElementById('reissue-reason-custom')?.value?.trim();
    const reason = sel === '직접입력' ? (custom||'사유없음') : sel;
    const user = Store.get('adminUser') || {};
    Utils.closeModal();
    Utils.loading(true);
    const res = await API.post('/api/wristbands/reissue', {
      originalId, reason,
      issuedBy: user.name || '관리자',
      reservationId, round, type,
    });
    Utils.loading(false);
    if (res.success) {
      const newId = res.data?.newId || '';
      Utils.toast(`재발급 완료! 새 밴드: ${newId}`, 'success', 4000);
      wristbandsPage().then(html => { document.getElementById('app').innerHTML = html; });
    } else {
      Utils.toast('재발급 실패: ' + (res.error||''), 'error');
    }
  };

  // ── 무효화 ────────────────────────────────────────────────
  const voidWristband = (wbId, reservationId) => {
    const user = Store.get('adminUser') || {};
    Utils.modal(`
      <div class="modal-header"><h3 class="font-bold text-red-600">🚫 손목밴드 무효화</h3></div>
      <div class="modal-body space-y-3 pt-2">
        <div class="bg-red-50 rounded-lg p-3 text-sm text-red-600">
          밴드 ID: <strong>${wbId}</strong>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-medium block mb-1">무효화 사유 <span class="text-red-400">*</span></label>
          <select id="void-reason-select" class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400 mb-2"
            onchange="document.getElementById('void-reason-custom').style.display=this.value==='직접입력'?'block':'none'">
            <option value="분실">분실</option>
            <option value="훼손">훼손</option>
            <option value="예약취소">예약취소로 인한 무효화</option>
            <option value="재발급">재발급으로 무효화</option>
            <option value="직접입력">직접 입력</option>
          </select>
          <input id="void-reason-custom" type="text" placeholder="무효화 사유 직접 입력"
            class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400 hidden">
        </div>
        <div class="flex gap-2">
          <button onclick="Utils.closeModal()" class="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">취소</button>
          <button onclick="AdminModule._doVoidWristband('${wbId}')"
            class="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-700">무효화 처리</button>
        </div>
      </div>`);
  };

  const _doVoidWristband = async (wbId) => {
    const sel = document.getElementById('void-reason-select')?.value;
    const custom = document.getElementById('void-reason-custom')?.value?.trim();
    const reason = sel === '직접입력' ? (custom||'사유없음') : sel;
    const user = Store.get('adminUser') || {};
    Utils.closeModal();
    Utils.loading(true);
    const res = await API.post('/api/wristbands/void', { wristbandId: wbId, reason, voidedBy: user.name||'관리자' });
    const _resvId = window._voidReservationId || '';
    Utils.loading(false);
    if (res.success) {
      Utils.toast('무효화 완료 — 이 밴드는 더 이상 사용할 수 없습니다.', 'success', 3000);
      // 테이블 새로고침
      wristbandsPage().then(html => { document.getElementById('app').innerHTML = html; });
    } else {
      Utils.toast('무효화 실패: ' + (res.error||''), 'error');
    }
  };

  // ── 스캔 상태 확인 (사용완료·무효화 경고) ────────────────
  const scanCheckWristband = async () => {
    const id = document.getElementById('wb-scan-check-id')?.value?.trim();
    if (!id) { Utils.toast('밴드 ID를 입력하세요', 'warning'); return; }
    Utils.loading(true);
    const res = await API.post('/api/wristbands/scan-check', { wristbandId: id });
    Utils.loading(false);
    if (!res.success) { Utils.toast('조회 오류', 'error'); return; }
    const d = res.data;
    if (!d.found) {
      Utils.modal(`
        <div class="modal-body text-center py-6">
          <div class="text-5xl mb-3">🔴</div>
          <h3 class="text-xl font-black text-red-600 mb-2">등록되지 않은 밴드</h3>
          <p class="text-gray-500 text-sm mb-4">${id}</p>
          <button onclick="Utils.closeModal()" class="w-full bg-gray-100 py-3 rounded-xl text-sm font-medium">닫기</button>
        </div>`, { size: 'max-w-xs' });
      return;
    }
    const isOk = d.level === 'ok';
    const icon = isOk ? '✅' : '⛔';
    const color = isOk ? 'text-green-600' : 'text-red-600';
    const bgColor = isOk ? 'bg-green-50' : 'bg-red-50';
    const logsHtml = d.logs && d.logs.length ? `
      <div class="mt-3 text-left">
        <div class="text-xs font-bold text-gray-500 mb-1">처리 이력</div>
        ${d.logs.map(l=>`<div class="text-xs text-gray-500">${(l.created_at||'').slice(0,16)} ${l.actor||''} — ${l.action} ${l.reason?'('+l.reason+')':''}</div>`).join('')}
      </div>` : '';
    Utils.modal(`
      <div class="modal-body text-center py-5">
        <div class="text-5xl mb-3">${icon}</div>
        <h3 class="text-xl font-black ${color} mb-3">${d.alert || '유효한 밴드'}</h3>
        <div class="${bgColor} rounded-xl p-3 text-sm text-left space-y-1">
          <div class="flex justify-between"><span class="text-gray-500">밴드ID</span><span class="font-mono font-bold">${d.wristbandId}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">예약번호</span><span class="font-semibold">${d.reservationNo||'-'}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">예약자</span><span class="font-semibold">${d.passengerName}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">발급자</span><span>${d.issuedBy||'-'}</span></div>
          ${d.boardedAt?`<div class="flex justify-between"><span class="text-gray-500">탑승시간</span><span class="text-indigo-600 font-semibold">${(d.boardedAt||'').slice(0,16)}</span></div>`:''}
          ${d.voidedBy?`<div class="flex justify-between"><span class="text-gray-500">무효화</span><span class="text-red-600">${d.voidedBy} — ${d.voidReason||''}</span></div>`:''}
        </div>
        ${logsHtml}
        <button onclick="Utils.closeModal()" class="w-full border py-3 rounded-xl text-sm font-medium mt-3 hover:bg-gray-50">닫기</button>
      </div>`, { size: 'max-w-xs' });
  };

  // ── 팝업/공지 관리 ─────────────────────────────────────────
  // 공지사항 localStorage 키 (admin ↔ customer 공유)
  const NOTICE_STORE_KEY = 'amk_notices';
  const _getNotices = async () => {
    try {
      const res = await API.get('/api/notices');
      if (res.success && res.data) return res.data;
    } catch(e) {}
    try { return JSON.parse(localStorage.getItem(NOTICE_STORE_KEY) || '[]'); } catch(e) { return []; }
  };
  const _setNotices = async (list) => {
    // Use PUT /api/notices/bulk or individual calls
    // For now, store locally as well
    localStorage.setItem(NOTICE_STORE_KEY, JSON.stringify(list));
  };

  // 지역 ID → 한글 레이블 변환
  const _regionLabel = (rid) => rid === 'buyeo' ? '부여' : rid === 'tongyeong' ? '통영' : rid === 'hapcheon' ? '합천' : rid ? rid : '전체';

  // 공지 유형 → 한글 레이블/색상
  const NOTICE_TYPE_MAP = {
    general:    { label: '일반공지',   cls: 'bg-gray-100 text-gray-600' },
    operation:  { label: '운행안내',   cls: 'bg-blue-100 text-blue-700' },
    fare:       { label: '요금변경',   cls: 'bg-yellow-100 text-yellow-700' },
    suspend:    { label: '운휴안내',   cls: 'bg-orange-100 text-orange-700' },
    event:      { label: '이벤트',     cls: 'bg-purple-100 text-purple-700' },
    safety:     { label: '안전공지',   cls: 'bg-cyan-100 text-cyan-700' },
    urgent:     { label: '긴급공지',   cls: 'bg-red-100 text-red-700' },
  };
  const _noticeTypeLabel = (t) => (NOTICE_TYPE_MAP[t] || NOTICE_TYPE_MAP.general).label;
  const _noticeTypeCls   = (t) => (NOTICE_TYPE_MAP[t] || NOTICE_TYPE_MAP.general).cls;

  const popupsPage = async () => {
    _adminState.currentSection = 'popups';
    const user   = _adminState.user || Store.get('adminUser') || { role: 'super', regionId: null };
    const isSuper = user.role === ROLES.SUPER;

    // 팝업/공지 목록: DB(notices API)에서 로드
    const allNotices = await _getNotices();
    const POPUP_TYPES  = new Set(['popup','normal','urgent','event','banner']);
    const NOTICE_TYPES = new Set(['general','operation','fare','suspend','safety','info','warning']);

    // DB 팝업
    const dbPopups = allNotices.filter(n => POPUP_TYPES.has(n.type));
    // localStorage 팝업 (이전 방식 폴백 + 미마이그레이션 데이터)
    const localPopups = (() => { try { return JSON.parse(JSON.stringify(Settings.get('popups') || [])); } catch(e) { return []; } })();
    // 중복 제거: DB에 이미 있는 id는 local에서 제외
    const dbIds = new Set(dbPopups.map(p => p.id));
    const onlyLocalPopups = localPopups.filter(p => !dbIds.has(p.id));
    // 합치기
    const allPopups = [...dbPopups, ...onlyLocalPopups];
    const popups = isSuper ? allPopups : allPopups.filter(n => !n.region || n.region==='' || n.region===user.regionId);

    // 공지
    const allNoticeList = allNotices.filter(n => NOTICE_TYPES.has(n.type) || (!POPUP_TYPES.has(n.type) && !NOTICE_TYPES.has(n.type) ? false : NOTICE_TYPES.has(n.type)));
    const notices = isSuper ? allNoticeList : allNoticeList.filter(n => !n.region || n.region==='' || n.region===user.regionId);

    // 노출수/클릭수 통계 로드
    const popupStats = (() => { try { return JSON.parse(localStorage.getItem('amk_popup_stats')||'{}'); } catch(e) { return {}; } })();

    const popupRows = popups.map((p, i) => {
      const pid = p.id || (p.title + (p.startDate||''));
      const stat = popupStats[pid] || { impressions: 0, clicks: 0 };
      const regionLabel = _regionLabel(p.region);
      return `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-sm font-medium">${p.title}</td>
        <td class="px-4 py-3 text-sm text-center">${regionLabel}</td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${p.startDate||'-'} ~ ${p.endDate||'-'}</td>
        <td class="px-4 py-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-xs ${(p.isActive!==false&&p.is_active!==0)?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}">${(p.isActive!==false&&p.is_active!==0)?'노출중':'비노출'}</span>
        </td>
        <td class="px-4 py-3 text-center text-xs">
          <span class="text-blue-600 font-medium">${stat.impressions}</span>회 /
          <span class="text-green-600 font-medium">${stat.clicks}</span>클릭
        </td>
        <td class="px-4 py-3 text-center">
          <button onclick="AdminModule.editPopup(${i})" class="text-blue-600 hover:underline text-xs mr-2">수정</button>
          <button onclick="AdminModule.deletePopup(${i})" class="text-red-500 hover:underline text-xs">삭제</button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" class="text-center py-4 text-gray-500">팝업이 없습니다.</td></tr>';

    // 공지 목록 테이블 행 생성 (상세 컬럼 포함)
    const noticeRows = notices.map((n, i) => {
      // allNotices에서의 실제 인덱스 (수정/삭제 시 사용)
      const realIdx = allNotices.indexOf(n);
      const typeCls   = _noticeTypeCls(n.type);
      const typeLabel = _noticeTypeLabel(n.type);
      const regionLbl = _regionLabel(n.region);
      const pinBadge  = n.pinned    ? '<span class="inline-block bg-blue-50 text-blue-600 text-xs px-1 py-0.5 rounded mr-1">📌</span>' : '';
      const impBadge  = n.important ? '<span class="inline-block bg-red-50 text-red-600 text-xs px-1 py-0.5 rounded mr-1">중요</span>' : '';
      const statusCls = n.visible === false ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700';
      const statusLbl = n.visible === false ? '숨김' : '공개';
      return `
      <tr class="hover:bg-gray-50 ${n.visible===false?'opacity-60':''}">
        <td class="px-4 py-3 text-sm">
          ${pinBadge}${impBadge}
          <span class="px-1.5 py-0.5 rounded text-xs font-medium ${typeCls} mr-1">${typeLabel}</span>
          <span class="font-medium">${n.title}</span>
        </td>
        <td class="px-4 py-3 text-xs text-center text-gray-500">${regionLbl}</td>
        <td class="px-4 py-3 text-xs text-center text-gray-500">${n.startDate||'-'} ~ ${n.endDate||'-'}</td>
        <td class="px-4 py-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-xs ${statusCls}">${statusLbl}</span>
        </td>
        <td class="px-4 py-3 text-xs text-center text-gray-400">${n.createdAt ? n.createdAt.slice(0,10) : (n.date||'-')}</td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          <button onclick="AdminModule.editNotice(${realIdx})" class="text-blue-600 hover:underline text-xs mr-1">수정</button>
          <button onclick="AdminModule.deleteNotice(${realIdx})" class="text-red-500 hover:underline text-xs">삭제</button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" class="text-center py-4 text-gray-500">공지가 없습니다.</td></tr>';

    // 공지 추가 모달의 대상 지역 옵션 (슈퍼: 전체+지역 / 지역관리자: 자기 지역만)
    const regionOptions = isSuper
      ? `<option value="">전체</option>${(window.REGIONS||[]).filter(r=>r.status==='active'||r.status==='open').map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}`
      : `<option value="${user.regionId}" selected>${_regionLabel(user.regionId)}</option>`;

    const content = `
      <div class="space-y-6">
        <!-- 팝업 관리 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-gray-800">팝업 관리</h2>
            <button onclick="AdminModule.addPopup()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
              <i class="fas fa-plus"></i> 팝업 추가
            </button>
          </div>
          <table class="admin-table w-full">
            <thead><tr class="bg-gray-50">${['제목','대상지역','노출기간','상태','노출/클릭','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}</tr></thead>
            <tbody class="divide-y divide-gray-100">${popupRows}</tbody>
          </table>
        </div>

        <!-- 공지사항 관리 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-gray-800">공지사항 관리</h2>
            <button onclick="AdminModule.addNotice()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
              <i class="fas fa-plus"></i> 공지 추가
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead><tr class="bg-gray-50">${['제목','대상지역','노출기간','공개상태','작성일','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}</tr></thead>
              <tbody class="divide-y divide-gray-100">${noticeRows}</tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 팝업 추가/수정 모달 -->
      <div id="popup-modal" class="modal-overlay hidden">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
          <h3 class="font-semibold text-gray-800 text-lg mb-4" id="popup-modal-title">팝업 추가</h3>
          <div class="space-y-3">
            <div><label class="block text-xs font-medium text-gray-700 mb-1">제목</label><input id="pop-title" type="text" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
            <div><label class="block text-xs font-medium text-gray-700 mb-1">내용</label><textarea id="pop-content" rows="4" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-xs font-medium text-gray-700 mb-1">대상 지역</label>
                ${(() => {
                  const u = _adminState.user || Store.get('adminUser') || {};
                  if (u.role === 'regional' && u.regionId) {
                    const rName = (window.REGIONS||[]).find(r=>r.id===u.regionId)?.name || u.regionId;
                    return `<input type="hidden" id="pop-region" value="${u.regionId}">
                    <div class="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600">${rName} (고정)</div>`;
                  }
                  return `<select id="pop-region" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">전체</option>
                    ${(window.REGIONS||[]).filter(r=>r.status==='active'||r.status==='open').map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}
                  </select>`;
                })()}
              </div>
              <div><label class="block text-xs font-medium text-gray-700 mb-1">유형</label>
                <select id="pop-type" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="normal">일반</option><option value="urgent">긴급</option><option value="event">이벤트</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-xs font-medium text-gray-700 mb-1">노출 시작일</label><input id="pop-start" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
              <div><label class="block text-xs font-medium text-gray-700 mb-1">노출 종료일</label><input id="pop-end" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
            </div>
            <div class="flex items-center gap-2"><input type="checkbox" id="pop-active" checked class="rounded text-blue-600"><label for="pop-active" class="text-sm text-gray-700 cursor-pointer">즉시 노출</label></div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="AdminModule.savePopup()" class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">저장</button>
            <button onclick="document.getElementById('popup-modal').classList.add('hidden')" class="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>

      <!-- 공지사항 추가/수정 모달 -->
      <div id="notice-modal" class="modal-overlay hidden" style="z-index:9999">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl max-h-screen overflow-y-auto">
          <h3 class="font-semibold text-gray-800 text-lg mb-4" id="notice-modal-title">공지 추가</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">제목 <span class="text-red-400">*</span></label>
              <input id="ntc-title" type="text" placeholder="공지 제목을 입력하세요" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">내용 <span class="text-red-400">*</span></label>
              <textarea id="ntc-content" rows="5" placeholder="공지 내용을 입력하세요" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">대상 지역</label>
                ${isSuper
                  ? `<select id="ntc-region" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      ${regionOptions}
                    </select>`
                  : `<input type="hidden" id="ntc-region" value="${user.regionId||''}">
                     <div class="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600">${_regionLabel(user.regionId)} (고정)</div>`
                }
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">공지 유형</label>
                <select id="ntc-type" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="general">일반공지</option>
                  <option value="operation">운행안내</option>
                  <option value="fare">요금변경</option>
                  <option value="suspend">운휴안내</option>
                  <option value="event">이벤트</option>
                  <option value="safety">안전공지</option>
                  <option value="urgent">긴급공지</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">노출 시작일</label>
                <input id="ntc-startDate" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">노출 종료일</label>
                <input id="ntc-endDate" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">작성자</label>
                <input id="ntc-author" type="text" value="${user.name||''}" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
            <div class="flex flex-wrap gap-4 pt-1">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" id="ntc-important" class="rounded text-red-500">
                <span class="text-gray-700">중요 공지</span>
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" id="ntc-pinned" class="rounded text-blue-500">
                <span class="text-gray-700">상단 고정</span>
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" id="ntc-visible" checked class="rounded text-green-500">
                <span class="text-gray-700">공개</span>
              </label>
            </div>
          </div>
          <div class="flex gap-2 mt-5">
            <button onclick="AdminModule.saveNotice()" class="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">저장</button>
            <button onclick="AdminModule.closeNoticeModal()" class="flex-1 border py-2.5 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('popups', content, '팝업/공지 관리');
  };

  let _editingPopupIdx = null;
  const addPopup = () => { _editingPopupIdx = null; document.getElementById('popup-modal-title').textContent='팝업 추가'; ['pop-title','pop-content'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';}); document.getElementById('popup-modal').classList.remove('hidden'); };
  const editPopup = async (idx) => {
    _editingPopupIdx = idx;
    document.getElementById('popup-modal-title').textContent = '팝업 수정';
    const allNotices = await _getNotices();
    const POPUP_TYPES = new Set(['popup','normal','urgent','event','banner']);
    const popupList = allNotices.filter(n => POPUP_TYPES.has(n.type));
    const p = popupList[idx];
    if (!p) return;
    document.getElementById('pop-title').value   = p.title   || '';
    document.getElementById('pop-content').value = p.content || '';
    const regionEl = document.getElementById('pop-region');
    if (regionEl && regionEl.tagName === 'SELECT') regionEl.value = p.region || '';
    const typeEl = document.getElementById('pop-type');
    if (typeEl) typeEl.value = p.type || 'normal';
    const startEl = document.getElementById('pop-start');
    if (startEl) startEl.value = p.startDate || p.start_date || '';
    const endEl = document.getElementById('pop-end');
    if (endEl) endEl.value = p.endDate || p.end_date || '';
    const activeEl = document.getElementById('pop-active');
    if (activeEl) activeEl.checked = p.isActive !== false && p.is_active !== 0;
    document.getElementById('popup-modal').classList.remove('hidden');
  };
  const savePopup = async () => {
    const title = document.getElementById('pop-title')?.value?.trim();
    if (!title) { Utils.toast('제목을 입력하세요', 'error'); return; }
    const user = _adminState.user || Store.get('adminUser') || {};
    const isSuper = user.role === ROLES.SUPER;
    // 지역: 지역관리자는 자기지역 고정
    const region = isSuper
      ? (document.getElementById('pop-region')?.value || '')
      : (user.regionId || '');
    const pData = {
      title,
      content:   document.getElementById('pop-content')?.value || '',
      region,
      type:      document.getElementById('pop-type')?.value || 'normal',
      startDate: document.getElementById('pop-start')?.value || '',
      endDate:   document.getElementById('pop-end')?.value   || '',
      isActive:  document.getElementById('pop-active')?.checked !== false,
      is_active: document.getElementById('pop-active')?.checked !== false ? 1 : 0,
      allowHideToday: true,
    };
    document.getElementById('popup-modal').classList.add('hidden');
    Utils.loading(true);
    let ok = false;
    // 수정 vs 신규
    const allNotices = await _getNotices();
    const POPUP_TYPES = new Set(['popup','normal','urgent','event','banner']);
    const popupList = allNotices.filter(n => POPUP_TYPES.has(n.type));
    if (_editingPopupIdx !== null && popupList[_editingPopupIdx]) {
      const existId = popupList[_editingPopupIdx].id;
      const res = await API.put(`/api/notices/${existId}`, pData);
      ok = res.success;
    } else {
      const res = await API.post('/api/notices', { ...pData, id: `popup-${Date.now()}` });
      ok = res.success;
    }
    Utils.loading(false);
    if (!ok) {
      // localStorage 폴백
      let localPopups = JSON.parse(JSON.stringify(Settings.get('popups') || []));
      if (_editingPopupIdx !== null) localPopups[_editingPopupIdx] = pData; else localPopups.push(pData);
      Settings.set('popups', localPopups);
    }
    Utils.toast('팝업이 저장되었습니다.', 'success');
    popupsPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const deletePopup = async (idx) => {
    Utils.confirm('팝업을 삭제하시겠습니까?', async () => {
      const allNotices = await _getNotices();
      const POPUP_TYPES = new Set(['popup','normal','urgent','event','banner']);
      const dbPopups = allNotices.filter(n => POPUP_TYPES.has(n.type));
      const localPopups = (() => { try { return JSON.parse(JSON.stringify(Settings.get('popups')||[])); } catch(e){ return []; } })();
      const dbIds = new Set(dbPopups.map(p=>p.id));
      const onlyLocal = localPopups.filter(p=>!dbIds.has(p.id));
      const allPopups = [...dbPopups, ...onlyLocal];
      const target = allPopups[idx];
      Utils.loading(true);
      if (target?.id && dbIds.has(target.id)) {
        await API.delete(`/api/notices/${target.id}`);
      } else {
        // localStorage에서 삭제
        const localIdx = localPopups.findIndex(p => p.id === target?.id);
        if (localIdx >= 0) localPopups.splice(localIdx, 1);
        Settings.set('popups', localPopups);
      }
      Utils.loading(false);
      Utils.toast('삭제되었습니다.', 'success');
      popupsPage().then(html => { document.getElementById('app').innerHTML = html; });
    });
  };

  // ── 공지사항 CRUD ────────────────────────────────────────────
  let _editingNoticeIdx = null;

  const _openNoticeModal = (title, notice = null, idx = null) => {
    _editingNoticeIdx = idx;
    const user = _adminState.user || { role: 'super', regionId: null };
    const isSuper = user.role === ROLES.SUPER;
    // 모달 제목
    const titleEl = document.getElementById('notice-modal-title');
    if (titleEl) titleEl.textContent = title;
    // 필드 초기화/채우기
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
    setVal('ntc-title',     notice?.title     || '');
    setVal('ntc-content',   notice?.content   || '');
    setVal('ntc-type',      notice?.type      || 'general');
    setVal('ntc-startDate', notice?.startDate || '');
    setVal('ntc-endDate',   notice?.endDate   || '');
    setVal('ntc-author',    notice?.author    || user.name || '');
    setChk('ntc-important', notice?.important ?? false);
    setChk('ntc-pinned',    notice?.pinned    ?? false);
    setChk('ntc-visible',   notice ? (notice.visible !== false) : true);
    // 지역: 지역관리자는 자기 지역 고정
    const regionEl = document.getElementById('ntc-region');
    if (regionEl) {
      if (!isSuper) {
        regionEl.value = user.regionId || '';
        regionEl.disabled = true;
      } else {
        regionEl.disabled = false;
        regionEl.value = notice?.region || '';
      }
    }
    document.getElementById('notice-modal').classList.remove('hidden');
  };

  const addNotice = () => _openNoticeModal('공지 추가', null, null);

  const closeNoticeModal = () => document.getElementById('notice-modal').classList.add('hidden');

  const saveNotice = async () => {
    const user = _adminState.user || { role: 'super', regionId: null };
    const isSuper = user.role === ROLES.SUPER;
    const title   = (document.getElementById('ntc-title')?.value || '').trim();
    const content = (document.getElementById('ntc-content')?.value || '').trim();
    if (!title)   { Utils.toast('제목을 입력하세요', 'error'); return; }
    if (!content) { Utils.toast('내용을 입력하세요', 'error'); return; }

    // 지역관리자는 자기 지역만, 슈퍼는 선택값
    const region = isSuper ? (document.getElementById('ntc-region')?.value || '') : (user.regionId || '');

    const now = new Date().toISOString();
    const notices = await _getNotices();
    if (_editingNoticeIdx !== null && notices[_editingNoticeIdx]) {
      // 수정: 대상 지역은 원본 유지 (지역관리자), 슈퍼는 변경 가능
      notices[_editingNoticeIdx] = {
        ...notices[_editingNoticeIdx],
        title,
        content,
        type:       document.getElementById('ntc-type')?.value || 'general',
        region:     region,  // 지역관리자는 hidden input으로 자기 지역 고정
        startDate:  document.getElementById('ntc-startDate')?.value || '',
        endDate:    document.getElementById('ntc-endDate')?.value   || '',
        important:  document.getElementById('ntc-important')?.checked || false,
        pinned:     document.getElementById('ntc-pinned')?.checked    || false,
        visible:    document.getElementById('ntc-visible')?.checked !== false,
        author:     document.getElementById('ntc-author')?.value || user.name || '',
        updatedAt:  now,
      };
    } else {
      // 신규 등록
      const record = {
        id:        `notice-${Date.now()}`,
        title,
        content,
        type:      document.getElementById('ntc-type')?.value || 'general',
        region,
        startDate: document.getElementById('ntc-startDate')?.value || '',
        endDate:   document.getElementById('ntc-endDate')?.value   || '',
        important: document.getElementById('ntc-important')?.checked || false,
        pinned:    document.getElementById('ntc-pinned')?.checked    || false,
        visible:   document.getElementById('ntc-visible')?.checked !== false,
        author:    document.getElementById('ntc-author')?.value || user.name || '',
        createdAt: now,
        updatedAt: now,
      };
      notices.unshift(record);
    }
    // Save via API
    Utils.loading(true);
    let apiOk = false;
    if (_editingNoticeIdx !== null && notices[_editingNoticeIdx]) {
      const n = notices[_editingNoticeIdx];
      const r = await API.put(`/api/notices/${n.id}`, n);
      apiOk = r.success;
    } else {
      const r = await API.post('/api/notices', notices[0]);
      apiOk = r.success;
    }
    Utils.loading(false);
    if (!apiOk) await _setNotices(notices); // fallback localStorage
    closeNoticeModal();
    Utils.toast('공지사항이 저장되었습니다.', 'success');
    popupsPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const editNotice = async (idx) => {
    const notices = await _getNotices();
    const n = notices[idx];
    if (!n) { Utils.toast('공지를 찾을 수 없습니다.', 'error'); return; }
    _openNoticeModal('공지 수정', n, idx);
  };

  const hideNotice = async (idx) => {
    const notices = await _getNotices();
    if (!notices[idx]) return;
    const isHidden = notices[idx].visible === false;
    notices[idx].visible = isHidden ? true : false;
    // Update via API if possible
    if (notices[idx].id) {
      await API.put(`/api/notices/${notices[idx].id}`, { isActive: !isHidden });
    }
    await _setNotices(notices);
    Utils.toast(isHidden ? '공지가 공개되었습니다.' : '공지가 숨김 처리되었습니다.', 'success');
    popupsPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const deleteNotice = async (idx) => {
    const user = _adminState.user || Store.get('adminUser') || { role: 'super' };
    const isSuper = user.role === ROLES.SUPER;
    const notices = await _getNotices();
    const n = notices[idx];
    if (!n) return;
    // 권한 체크: 슈퍼는 전체 삭제 가능 / 지역관리자는 자기 지역 공지만 삭제 가능
    if (!isSuper) {
      if (n.region && n.region !== '' && n.region !== user.regionId) {
        Utils.toast('해당 지역 관리자만 삭제할 수 있습니다.', 'error'); return;
      }
    }
    Utils.confirm('공지사항을 완전히 삭제하시겠습니까?', async () => {
      if (n.id) {
        const r = await API.delete(`/api/notices/${n.id}`);
        if (!r?.success) { notices.splice(idx, 1); await _setNotices(notices); }
      } else {
        notices.splice(idx, 1);
        await _setNotices(notices);
      }
      Utils.toast('삭제되었습니다.', 'success');
      popupsPage().then(html => { document.getElementById('app').innerHTML = html; });
    });
  };

  // ── 약관/환불정책 관리 ─────────────────────────────────────
  const termsPage = async () => {
    _adminState.currentSection = 'terms';
    const terms = Settings.get('terms') || {};

    const tabItems = [
      { id: 'refundPolicy', label: '환불 정책' },
      { id: 'safetyRules', label: '안전 수칙' },
      { id: 'privacyPolicy', label: '개인정보처리방침' },
      { id: 'serviceTerms', label: '이용약관' },
    ];

    const content = `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          <i class="fas fa-edit mr-2"></i>
          <strong>관리자 직접 편집 가능:</strong> 아래 내용은 고객 화면에 즉시 반영됩니다. 버전 이력이 자동 저장됩니다.
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <!-- 탭 -->
          <div class="flex gap-2 mb-4 flex-wrap">
            ${tabItems.map(t=>`
              <button onclick="AdminModule.showTermsTab('${t.id}')"
                class="terms-tab px-4 py-2 rounded-lg text-sm font-medium transition-colors" id="tab-${t.id}">
                ${t.label}
              </button>
            `).join('')}
          </div>

          ${tabItems.map(t=>`
            <div id="terms-panel-${t.id}" class="terms-panel hidden">
              <div class="flex justify-between items-center mb-2">
                <label class="text-sm font-medium text-gray-700">${t.label}</label>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <i class="fas fa-history"></i> 최근 수정: 2025-05-01
                  <button class="text-blue-600 hover:underline">이력 보기</button>
                </div>
              </div>
              <textarea id="terms-${t.id}" rows="15" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono">${terms[t.id] || getDefaultTerms(t.id)}</textarea>
            </div>
          `).join('')}

          <div class="flex gap-2 mt-4">
            <button onclick="AdminModule.saveTerms()" class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
              <i class="fas fa-save mr-1"></i> 저장 및 즉시 반영
            </button>
            <button onclick="AdminModule.previewTerms()" class="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-50">
              <i class="fas fa-eye mr-1"></i> 미리보기
            </button>
          </div>
        </div>
      </div>
    `;
    const result = renderAdminLayout('terms', content, '약관/환불정책 관리');
    setTimeout(() => { AdminModule.showTermsTab('refundPolicy'); }, 50);
    return result;
  };

  const showTermsTab = (tabId) => {
    document.querySelectorAll('.terms-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.terms-tab').forEach(t => { t.classList.remove('bg-blue-600','text-white'); t.classList.add('bg-gray-100','text-gray-600'); });
    const panel = document.getElementById(`terms-panel-${tabId}`);
    const tab = document.getElementById(`tab-${tabId}`);
    if(panel) panel.classList.remove('hidden');
    if(tab) { tab.classList.add('bg-blue-600','text-white'); tab.classList.remove('bg-gray-100','text-gray-600'); }
  };

  const getDefaultTerms = (id) => {
    const defaults = {
      refundPolicy: `【환불 규정】\n\n▶ 출발 7일 전 취소: 전액 환불\n▶ 출발 3~6일 전: 결제금액의 20% 위약금\n▶ 출발 1~2일 전: 결제금액의 30% 위약금\n▶ 출발 당일: 환불 불가\n▶ 천재지변·운항불가: 전액 환불\n\n현장 구매 티켓은 현장에서만 환불 처리됩니다.`,
      safetyRules: `【안전 수칙】\n\n1. 탑승 전 안전벨트를 반드시 착용하세요.\n2. 투어 중 창문 밖으로 손이나 머리를 내밀지 마세요.\n3. 음식물 반입 및 흡연은 금지됩니다.\n4. 임산부, 심장·고혈압 환자는 탑승 전 직원에게 문의하세요.`,
      privacyPolicy: `【개인정보처리방침】\n\n수집 항목: 성명, 연락처, 이메일\n수집 목적: 예약 및 탑승 확인\n보유 기간: 3년 (관련 법령에 따름)\n제3자 제공: 없음 (법령 근거 시 예외)`,
      serviceTerms: `【서비스 이용약관】\n\n제1조 (목적)\n이 약관은 아쿠아모빌리티코리아가 제공하는 수륙양용투어 온라인 예약 서비스 이용에 관한 기본 사항을 규정합니다.\n\n제2조 (이용자 의무)\n이용자는 본인의 예약 정보를 정확히 입력해야 하며, 부정 예약 시 예약이 취소될 수 있습니다.`,
    };
    return defaults[id] || '';
  };

  const saveTerms = () => {
    const terms = {};
    ['refundPolicy','safetyRules','privacyPolicy','serviceTerms'].forEach(id => {
      const el = document.getElementById(`terms-${id}`);
      if(el) terms[id] = el.value;
    });
    Settings.set('terms', terms);
    Utils.toast('약관이 저장되어 즉시 반영됩니다.', 'success');
  };
  const previewTerms = () => Utils.toast('약관 미리보기 창 열기 (구현 중)', 'info');

  // ── SEO 관리 ───────────────────────────────────────────────
  // ── SMS 발송 관리 ────────────────────────────────────────
  const smsPage = async () => {
    if (typeof _adminState !== 'undefined') _adminState.currentSection = 'sms';
    const user = (typeof _adminState !== 'undefined' && _adminState.user) || Store.get('adminUser') || JSON.parse(localStorage.getItem('amk_admin_user')||'{}');
    const isSuper = user.role === 'super';
    const myRegionId = user.regionId || null;
    const RNAMES = {tongyeong:'통영',buyeo:'부여',hapcheon:'합천'};

    const smsHistory = JSON.parse(localStorage.getItem('amk_sms_history')||'[]');

    /* ── 본사: 발송현황 조회만 ── */
    if (isSuper) {
      const byRegion = {};
      smsHistory.forEach(h => {
        const r = h.regionId||'unknown';
        if (!byRegion[r]) byRegion[r] = {count:0, recipients:0, last:''};
        byRegion[r].count++;
        byRegion[r].recipients += (h.count||0);
        if (!byRegion[r].last || h.sentAt > byRegion[r].last) byRegion[r].last = h.sentAt;
      });

      window._smsSuperData = smsHistory.slice().reverse().slice(0,20);
      const historyRows = smsHistory.length ? `
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="bg-gray-50">
              ${['발송일시','지역','날짜','회차','유형','내용','수신자수','발송자'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 font-medium text-left whitespace-nowrap">${h}</th>`).join('')}
            </tr></thead>
            <tbody class="divide-y divide-gray-100">
              ${smsHistory.slice().reverse().slice(0,20).map((h,i)=>`
                <tr class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-xs text-gray-500">${(h.sentAt||'').slice(0,16).replace('T',' ')}</td>
                  <td class="px-3 py-2"><span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">${RNAMES[h.regionId]||h.regionId||'전체'}</span></td>
                  <td class="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">${(h.scheduleDate||(h.sentAt||'').slice(0,10))||'-'}</td>
                  <td class="px-3 py-2 text-xs whitespace-nowrap">${h.scheduleName ? `<span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">${h.scheduleName}</span>` : '<span class="text-gray-300">-</span>'}</td>
                  <td class="px-3 py-2"><span class="px-2 py-0.5 rounded-full text-xs ${h.type==='emergency'?'bg-red-100 text-red-600':h.type==='weather'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}">${{emergency:'긴급',weather:'기상',info:'일반',reservation:'예약'}[h.type]||h.type}</span></td>
                  <td class="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">${h.message||''}</td>
                  <td class="px-3 py-2 text-center">
                    ${(h.recipients && h.recipients.length) ? `
                      <button onclick="AdminModule.showSmsRecipientsByIdx(event,${i},'super')"
                        class="font-bold text-blue-600 hover:underline bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors">
                        ${h.count||0}<span class="text-xs text-blue-400 ml-0.5">명</span>
                      </button>` : `<span class="text-gray-500 font-medium">${h.count||0}명</span>`}
                  </td>
                  <td class="px-3 py-2 text-xs text-gray-500">${h.sender||'-'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : '<div class="text-center py-8 text-gray-400 text-sm">발송 이력이 없습니다.</div>';

      const regionCards = Object.entries(byRegion).map(([rid, stat])=>`
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
          onclick="AdminModule.showSmsDetail('all','${rid}')">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">${(RNAMES[rid]||rid||'?')[0]}</span>
            <div class="flex-1">
              <div class="font-semibold text-sm">${RNAMES[rid]||rid}</div>
              <div class="text-xs text-gray-400">최근 ${(stat.last||'').slice(0,10)}</div>
            </div>
            <i class="fas fa-chevron-right text-gray-300 text-xs"></i>
          </div>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div class="bg-blue-50 rounded-lg p-2"><div class="font-bold text-blue-700">${stat.count}건</div><div class="text-xs text-gray-400">발송건수</div></div>
            <div class="bg-green-50 rounded-lg p-2"><div class="font-bold text-green-700">${stat.recipients}명</div><div class="text-xs text-gray-400">수신자수</div></div>
          </div>
        </div>`).join('') || '<div class="col-span-3 text-center py-4 text-gray-400 text-sm">아직 발송 내역이 없습니다.</div>';

      // SENS 설정 로드
      let sensConfig = {};
      try {
        const cfgRes = await API.get('/api/sms-settings/config');
        sensConfig = cfgRes.success ? cfgRes.data : {};
      } catch(e) {}

      // 단체할인 설정 로드
      let gdConfig = {};
      try {
        const gdRes = await API.get('/api/settings/group-discount/config');
        gdConfig = gdRes.success ? gdRes.data : {};
      } catch(e) {}

      const contentHtml = `
        <div class="space-y-5">

          <!-- 단체할인 설정 카드 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="fas fa-users text-blue-400"></i>
                <span class="font-semibold text-sm text-gray-700">단체예약 할인 설정</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-xs font-bold ${gdConfig.group_discount_enabled==='1' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                ${gdConfig.group_discount_enabled==='1' ? '✅ 활성화' : '⏸️ 비활성'}
              </span>
            </div>
            <div class="p-5 space-y-4">
              <div class="flex items-center gap-3">
                <label class="text-sm font-medium text-gray-700">단체할인 사용</label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="gd-enabled" ${gdConfig.group_discount_enabled==='1' ? 'checked' : ''} class="w-4 h-4 accent-blue-500">
                  <span class="text-sm text-gray-600">활성화</span>
                </label>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div class="font-bold text-blue-700 text-sm mb-3">1구간 할인</div>
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <label class="text-xs text-gray-500 w-16">시작 인원</label>
                      <input type="number" id="gd-tier1-min" value="${gdConfig.group_discount_tier1_min || 20}" min="2" max="100"
                        class="flex-1 border border-blue-200 rounded-lg px-2 py-1.5 text-sm text-center font-bold">
                      <span class="text-xs text-gray-400">인 이상</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="text-xs text-gray-500 w-16">할인율</label>
                      <input type="number" id="gd-tier1-rate" value="${gdConfig.group_discount_tier1_rate || 10}" min="1" max="50" step="0.5"
                        class="flex-1 border border-blue-200 rounded-lg px-2 py-1.5 text-sm text-center font-bold">
                      <span class="text-xs text-gray-400">%</span>
                    </div>
                  </div>
                </div>
                <div class="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div class="font-bold text-purple-700 text-sm mb-3">2구간 할인</div>
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <label class="text-xs text-gray-500 w-16">시작 인원</label>
                      <input type="number" id="gd-tier2-min" value="${gdConfig.group_discount_tier2_min || 30}" min="2" max="200"
                        class="flex-1 border border-purple-200 rounded-lg px-2 py-1.5 text-sm text-center font-bold">
                      <span class="text-xs text-gray-400">인 이상</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="text-xs text-gray-500 w-16">할인율</label>
                      <input type="number" id="gd-tier2-rate" value="${gdConfig.group_discount_tier2_rate || 15}" min="1" max="50" step="0.5"
                        class="flex-1 border border-purple-200 rounded-lg px-2 py-1.5 text-sm text-center font-bold">
                      <span class="text-xs text-gray-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                현재 설정: <strong>${gdConfig.group_discount_tier1_min || 20}인~${(parseInt(gdConfig.group_discount_tier2_min)||30)-1}인</strong> → ${gdConfig.group_discount_tier1_rate || 10}% 할인,
                <strong>${gdConfig.group_discount_tier2_min || 30}인 이상</strong> → ${gdConfig.group_discount_tier2_rate || 15}% 할인
              </div>
              <button onclick="AdminPages.saveGroupDiscount()" class="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-blue-700">
                <i class="fas fa-save mr-1"></i> 단체할인 설정 저장
              </button>
            </div>
          </div>

          <!-- SENS API 설정 카드 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="fas fa-cog text-gray-400"></i>
                <span class="font-semibold text-sm text-gray-700">Naver Cloud SENS 설정</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-xs font-bold ${sensConfig.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}">
                ${sensConfig.enabled ? '✅ 활성화' : '⚠️ 미설정'}
              </span>
            </div>
            <div class="p-5 space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-gray-500 font-medium block mb-1">Access Key</label>
                  <input id="sens-access-key" type="text" placeholder="Naver Cloud Access Key"
                    value="${sensConfig.accessKey || ''}"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono">
                </div>
                <div>
                  <label class="text-xs text-gray-500 font-medium block mb-1">Secret Key</label>
                  <input id="sens-secret-key" type="password" placeholder="Secret Key (변경 시만 입력)"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono">
                </div>
                <div>
                  <label class="text-xs text-gray-500 font-medium block mb-1">Service ID</label>
                  <input id="sens-service-id" type="text" placeholder="ncp:sms:kr:xxxxx"
                    value="${sensConfig.serviceId || ''}"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono">
                </div>
                <div>
                  <label class="text-xs text-gray-500 font-medium block mb-1">발신번호</label>
                  <input id="sens-sender" type="text" placeholder="01012345678"
                    value="${sensConfig.senderPhone || ''}"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
              </div>
              <div class="flex items-center gap-3 flex-wrap">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="sens-enabled" ${sensConfig.enabled ? 'checked' : ''}
                    class="w-4 h-4 rounded accent-blue-600">
                  <span class="text-sm text-gray-700">SMS 자동 발송 활성화</span>
                </label>
                <div class="flex gap-2 ml-auto">
                  <button onclick="AdminModule.saveSensConfig()"
                    class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
                    💾 설정 저장
                  </button>
                  <button onclick="AdminModule.testSms()"
                    class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium">
                    📱 테스트 발송
                  </button>
                </div>
              </div>
              <div class="text-xs text-gray-400 bg-blue-50 rounded-lg p-3 space-y-1">
                <div class="font-medium text-blue-600 mb-1">📌 SENS 설정 방법</div>
                <div>① Naver Cloud Console → SENS → SMS 서비스 생성</div>
                <div>② 발신번호 등록 (사업자번호 인증 필요)</div>
                <div>③ IAM Access Key / Secret Key 발급 후 위에 입력</div>
                <div>④ "활성화" 체크 후 저장 → 예약/발권/탑승 시 자동 발송</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-3">
            <div class="bg-white rounded-xl p-4 shadow-sm text-center border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
              onclick="AdminModule.showSmsDetail('all')">
              <div class="font-bold text-blue-700 text-2xl group-hover:scale-110 transition-transform">${smsHistory.length}</div>
              <div class="text-xs text-gray-500 mt-1">총 발송건수</div>
              <div class="text-xs text-blue-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 상세보기</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm text-center border border-gray-100 cursor-pointer hover:shadow-md hover:border-green-300 transition-all group"
              onclick="AdminModule.showSmsDetail('thismonth')">
              <div class="font-bold text-green-700 text-2xl group-hover:scale-110 transition-transform">${smsHistory.filter(h=>(h.sentAt||'').startsWith(new Date().toISOString().slice(0,7))).length}</div>
              <div class="text-xs text-gray-500 mt-1">이번달 발송</div>
              <div class="text-xs text-green-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 상세보기</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm text-center border border-gray-100 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group"
              onclick="AdminModule.showSmsDetail('byregion')">
              <div class="font-bold text-purple-700 text-2xl group-hover:scale-110 transition-transform">${[...new Set(smsHistory.map(h=>h.regionId))].filter(Boolean).length}</div>
              <div class="text-xs text-gray-500 mt-1">발송 지역수</div>
              <div class="text-xs text-purple-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 상세보기</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm text-center border border-gray-100 cursor-pointer hover:shadow-md hover:border-orange-300 transition-all group"
              onclick="AdminModule.showSmsDetail('all')">
              <div class="font-bold text-orange-700 text-2xl group-hover:scale-110 transition-transform">${smsHistory.reduce((s,h)=>s+(h.count||0),0)}</div>
              <div class="text-xs text-gray-500 mt-1">총 수신자수</div>
              <div class="text-xs text-orange-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 상세보기</div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-5">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i class="fas fa-map-marker-alt text-blue-500"></i>지역별 발송 현황
            </h3>
            <div class="grid grid-cols-3 gap-3">${regionCards}</div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-5">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i class="fas fa-history text-gray-500"></i>전체 발송 이력
            </h3>
            ${historyRows}
          </div>
        </div>`;
      return renderAdminLayout('sms', contentHtml, 'SMS 발송 현황');
    }

    /* ── 지역관리자: 발송 ── */
    let schedules = [];
    try {
      const sr = await API.get('/api/schedules?regionId='+myRegionId);
      schedules = (sr.data||[]).filter(s=>s.status!=='inactive');
    } catch(e) {}

    const myHistory = smsHistory.filter(h=>h.regionId===myRegionId);
    const regionLabel = RNAMES[myRegionId]||myRegionId||'';

    window._smsRegionData = myHistory.slice().reverse().slice(0,15);
    const historyRows = myHistory.length ? `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="bg-gray-50">
            ${['발송일시','회차','유형','내용','수신자수'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 font-medium text-left">${h}</th>`).join('')}
          </tr></thead>
          <tbody class="divide-y divide-gray-100">
            ${myHistory.slice().reverse().slice(0,15).map((h,i)=>`
              <tr class="hover:bg-gray-50">
                <td class="px-3 py-2 text-xs text-gray-500">${(h.sentAt||'').slice(0,16).replace('T',' ')}</td>
                <td class="px-3 py-2 text-xs">${h.scheduleName||'-'}</td>
                <td class="px-3 py-2"><span class="px-2 py-0.5 rounded-full text-xs ${h.type==='emergency'?'bg-red-100 text-red-600':h.type==='weather'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}">${{emergency:'긴급',weather:'기상',info:'일반',reservation:'예약'}[h.type]||h.type}</span></td>
                <td class="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">${h.message||''}</td>
                <td class="px-3 py-2 text-center">
                  ${(h.recipients && h.recipients.length) ? `
                    <button onclick="AdminModule.showSmsRecipientsByIdx(event,${i},'region')"
                      class="font-bold text-blue-600 hover:underline bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors">
                      ${h.count||0}<span class="text-xs text-blue-400 ml-0.5">명</span>
                    </button>` : `<span class="text-gray-500 font-medium">${h.count||0}명</span>`}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '<div class="text-center py-6 text-gray-400 text-sm">발송 이력 없음</div>';

    // 시간순 정렬 후 회차 번호 부여
    const sortedSchedules = schedules.slice().sort((a,b)=>a.time.localeCompare(b.time));
    sortedSchedules.forEach((s, i) => { s._roundNum = i + 1; });
    const scheduleOptions = sortedSchedules.map(s=>`<option value="${s.id}" data-time="${s.time}" data-cap="${s.capacity}" data-round="${s._roundNum}">${s.time} (${s._roundNum}회차) — 정원 ${s.capacity}명</option>`).join('');

    const contentHtml = `
      <div class="space-y-5">

        <!-- STEP 1: 날짜 + 회차 선택 -->
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h2 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="w-6 h-6 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center font-bold">1</span>
            날짜 및 회차 선택
            <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">${regionLabel}</span>
          </h2>
          <div class="flex gap-3 items-end flex-wrap">
            <div class="flex-1 min-w-40">
              <label class="block text-xs font-medium text-gray-600 mb-1">날짜</label>
              <input type="date" id="sms-date" value="${new Date().toISOString().slice(0,10)}"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                onchange="AdminModule.loadSmsPassengers()">
            </div>
            <div class="flex-1 min-w-48">
              <label class="block text-xs font-medium text-gray-600 mb-1">회차</label>
              <select id="sms-schedule-id" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                onchange="AdminModule.loadSmsPassengers()">
                <option value="">-- 회차 선택 --</option>
                ${scheduleOptions}
              </select>
            </div>
            <div class="flex-1 min-w-32">
              <label class="block text-xs font-medium text-gray-600 mb-1">유형</label>
              <select id="sms-type" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                onchange="AdminModule.onSmsTypeChange()">
                <option value="all">전체 예약자 발송</option>
                <option value="select">예약자 직접 선택</option>
              </select>
            </div>
          </div>
          <div id="sms-passenger-area" class="mt-4 hidden">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-700">예약자 목록</span>
              <div class="flex gap-2">
                <button onclick="AdminModule.smsSelectAll(true)" class="text-xs text-blue-600 hover:underline">전체 선택</button>
                <span class="text-gray-300">|</span>
                <button onclick="AdminModule.smsSelectAll(false)" class="text-xs text-gray-500 hover:underline">전체 해제</button>
                <span class="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full" id="sms-selected-count">0명 선택</span>
              </div>
            </div>
            <div id="sms-passenger-list" class="border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <div class="text-center py-6 text-gray-400 text-sm">날짜와 회차를 선택하세요.</div>
            </div>
          </div>
          <div id="sms-all-count" class="mt-3 hidden">
            <div class="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <i class="fas fa-users mr-1"></i>선택된 회차 전체 예약자에게 발송합니다.
              수신자: <span id="sms-all-num" class="font-bold">0</span>명
            </div>
          </div>
        </div>

        <!-- STEP 2: 메시지 작성 -->
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h2 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="w-6 h-6 bg-green-500 rounded-full text-white text-xs flex items-center justify-center font-bold">2</span>
            메시지 작성
          </h2>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <button onclick="AdminModule.setSmsTemplate('reservation','%5B%EC%95%84%EC%BF%A0%EC%95%84%EB%AA%A8%EB%B9%8C%EB%A6%AC%ED%8B%B0%5D+%EC%98%88%EC%95%BD%EC%9D%B4+%ED%99%95%EC%A0%95%EB%90%98%EC%97%88%EC%8A%B5%EB%8B%88%EB%8B%A4.%0A%EC%9D%BC%EC%8B%9C%3A+%7B%EB%82%A0%EC%A7%9C%7D+%7B%ED%9A%8C%EC%B0%A8%7D%0A%ED%83%91%EC%8A%B9+10%EB%B6%84+%EC%A0%84+%EC%A4%80%EB%B9%84+%EB%B6%80%ED%83%81%EB%93%9C%EB%A6%BD%EB%8B%88%EB%8B%A4.')"
              class="p-2.5 border-2 rounded-xl text-sm font-medium hover:border-green-400 hover:bg-green-50 text-left transition-colors">📋 예약 안내</button>
            <button onclick="AdminModule.setSmsTemplate('weather','%5B%EC%95%84%EC%BF%A0%EC%95%84%EB%AA%A8%EB%B9%8C%EB%A6%AC%ED%8B%B0-${regionLabel}%5D+%EA%B8%B0%EC%83%81%EC%95%85%ED%99%94%EB%A1%9C+%EC%98%A4%EB%8A%98+%EC%9A%B4%ED%96%89%EC%9D%B4+%EC%B7%A8%EC%86%8C%EB%90%98%EC%97%88%EC%8A%B5%EB%8B%88%EB%8B%A4.%0A%EC%A0%84%EC%95%A1+%ED%99%98%EB%B6%88+%EC%B2%98%EB%A6%AC%EB%90%A9%EB%8B%88%EB%8B%A4.+%EB%B6%88%ED%8E%B8%EC%9D%84+%EB%93%9C%EB%A0%A4+%EC%A3%84%EC%86%A1%ED%95%A9%EB%8B%88%EB%8B%A4.')"
              class="p-2.5 border-2 rounded-xl text-sm font-medium hover:border-yellow-400 hover:bg-yellow-50 text-left transition-colors">🌧 기상 취소</button>
            <button onclick="AdminModule.setSmsTemplate('emergency','%5B%EC%95%84%EC%BF%A0%EC%95%84%EB%AA%A8%EB%B9%8C%EB%A6%AC%ED%8B%B0-${regionLabel}%5D+%EA%B8%B4%EA%B8%89+%EC%95%88%EB%82%B4%3A%0A')"
              class="p-2.5 border-2 rounded-xl text-sm font-medium hover:border-red-400 hover:bg-red-50 text-left transition-colors">🚨 긴급 공지</button>
            <button onclick="AdminModule.setSmsTemplate('info','%5B%EC%95%84%EC%BF%A0%EC%95%84%EB%AA%A8%EB%B9%8C%EB%A6%AC%ED%8B%B0-${regionLabel}%5D+')"
              class="p-2.5 border-2 rounded-xl text-sm font-medium hover:border-blue-400 hover:bg-blue-50 text-left transition-colors">📢 일반 안내</button>
          </div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-sm font-semibold text-gray-700">메시지 내용</label>
            <span id="sms-char-count" class="text-xs text-gray-400">0 / 90자</span>
          </div>
          <textarea id="sms-message" rows="5" placeholder="발송할 메시지를 입력하세요."
            class="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            oninput="AdminModule.updateSmsCharCount()"></textarea>
          <div class="flex justify-between mt-1">
            <p class="text-xs text-gray-400">※ 90자 초과 시 장문(LMS) 발송</p>
            <span id="sms-type-badge" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">단문(SMS)</span>
          </div>
          <div class="bg-gray-900 rounded-xl p-4 mt-3">
            <div class="text-xs text-gray-400 mb-2"><i class="fas fa-mobile-alt mr-1"></i>미리보기</div>
            <div class="bg-gray-800 rounded-lg p-3 text-sm text-white min-h-12 whitespace-pre-wrap" id="sms-preview">메시지를 입력하면 미리보기가 표시됩니다.</div>
          </div>
        </div>

        <!-- 발송 버튼 -->
        <div class="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
          <p class="text-xs text-gray-400"><i class="fas fa-info-circle text-blue-400 mr-1"></i>PG 연동 전까지는 발송 이력만 저장됩니다.</p>
          <button onclick="AdminModule.sendSms('${myRegionId}')"
            class="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm hover:bg-green-700 flex items-center gap-2 font-medium shadow-sm">
            <i class="fas fa-paper-plane"></i> 발송
          </button>
        </div>

        <!-- 발송 이력 -->
        <div class="bg-white rounded-xl shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <i class="fas fa-history text-gray-500"></i>발송 이력
              <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">${regionLabel}</span>
            </h3>
            <div class="flex gap-2">
              <button onclick="AdminModule.showSmsDetail('all','${myRegionId}')"
                class="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1">
                <i class="fas fa-list"></i> 전체 ${myHistory.length}건
              </button>
              <button onclick="AdminModule.showSmsDetail('thismonth','${myRegionId}')"
                class="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1">
                <i class="fas fa-calendar"></i> 이번달 ${myHistory.filter(h=>(h.sentAt||'').startsWith(new Date().toISOString().slice(0,7))).length}건
              </button>
            </div>
          </div>
          ${historyRows}
        </div>
      </div>
    `;
    return renderAdminLayout('sms', contentHtml, 'SMS 발송 관리');
  };

  // SMS 수신자 목록 모달
  const showSmsRecipients = (event, recipients, sentAt) => {
    if (event) event.stopPropagation();
    const list = Array.isArray(recipients) ? recipients : [];

    const rows = list.length ? list.map((r, i) => `
      <tr class="hover:bg-gray-50 border-b border-gray-50">
        <td class="px-3 py-2.5 text-xs text-gray-400 text-center">${i+1}</td>
        <td class="px-3 py-2.5 text-sm font-medium text-gray-800">${r.name||'-'}</td>
        <td class="px-3 py-2.5 text-sm text-gray-600 font-mono">${r.phone||'-'}</td>
      </tr>`).join('')
    : '<tr><td colspan="3" class="text-center py-6 text-gray-400 text-sm">수신자 정보 없음</td></tr>';

    const modal = document.createElement('div');
    modal.id = 'sms-recipients-modal';
    modal.className = 'fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        <div class="flex items-center justify-between p-5 border-b">
          <div class="flex items-center gap-2">
            <i class="fas fa-users text-blue-500"></i>
            <h2 class="font-bold text-gray-800">수신자 목록</h2>
            <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">${list.length}명</span>
          </div>
          <button onclick="document.getElementById('sms-recipients-modal').remove()"
            class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>
        <div class="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
          <i class="fas fa-clock mr-1"></i>발송일시: ${sentAt||'-'}
        </div>
        <div class="overflow-y-auto flex-1">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-white border-b">
              <tr class="bg-gray-50">
                <th class="px-3 py-2 text-xs text-gray-400 font-medium text-center w-8">#</th>
                <th class="px-3 py-2 text-xs text-gray-500 font-medium text-left">이름</th>
                <th class="px-3 py-2 text-xs text-gray-500 font-medium text-left">연락처</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-end">
          <button onclick="document.getElementById('sms-recipients-modal').remove()"
            class="px-5 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700">닫기</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
  };

  // SMS 수신자 인덱스 기반 조회 (template literal 이스케이프 문제 우회)
  const showSmsRecipientsByIdx = (event, idx, source) => {
    if (event) event.stopPropagation();
    const data = source === 'region' ? window._smsRegionData
               : source === 'super'  ? window._smsSuperData
               : window._smsDetailData;
    if (!data || !data[idx]) {
      alert('수신자 정보를 찾을 수 없습니다. 페이지를 새로고침 후 다시 시도해 주세요.');
      return;
    }
    const h = data[idx];
    showSmsRecipients(null, h.recipients||[], (h.sentAt||'').slice(0,16).replace('T',' '));
  };

  // SMS 상세 이력 모달
  const showSmsDetail = (filter, regionFilter) => {
    const RNAMES = {tongyeong:'통영',buyeo:'부여',hapcheon:'합천'};
    const TYPE_NAMES = {emergency:'🚨 긴급',weather:'🌧 기상',info:'📢 일반',reservation:'📋 예약'};
    const allHistory = JSON.parse(localStorage.getItem('amk_sms_history')||'[]');
    const thisMonth = new Date().toISOString().slice(0,7);

    let filtered = regionFilter
      ? allHistory.filter(h=>h.regionId===regionFilter)
      : allHistory;

    let title = '전체 발송 이력';
    if (filter === 'thismonth') {
      filtered = filtered.filter(h=>(h.sentAt||'').startsWith(thisMonth));
      title = '이번달 발송 이력';
    } else if (filter === 'byregion' && !regionFilter) {
      // 지역별 그룹핑 뷰
      title = '지역별 발송 이력';
    }
    if (regionFilter) title += ' — ' + (RNAMES[regionFilter]||regionFilter);

    // 지역별 그룹핑
    const byRegion = {};
    filtered.forEach(h => {
      const r = h.regionId||'unknown';
      if (!byRegion[r]) byRegion[r] = [];
      byRegion[r].push(h);
    });

    window._smsDetailData = filtered.slice().reverse();
    const tableRows = (rows) => rows.length ? rows.slice().reverse().map((h, i) => `
      <tr class="hover:bg-gray-50 border-b border-gray-50">
        <td class="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">${(h.sentAt||'').slice(0,16).replace('T',' ')}</td>
        <td class="px-3 py-2.5"><span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">${RNAMES[h.regionId]||h.regionId||'전체'}</span></td>
        <td class="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">${h.scheduleDate||'-'}</td>
        <td class="px-3 py-2.5 text-xs whitespace-nowrap">${h.scheduleName ? `<span class="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">${h.scheduleName}</span>` : '<span class="text-gray-300">-</span>'}</td>
        <td class="px-3 py-2.5"><span class="px-2 py-0.5 rounded-full text-xs ${h.type==='emergency'?'bg-red-100 text-red-600':h.type==='weather'?'bg-yellow-100 text-yellow-700':h.type==='reservation'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}">${TYPE_NAMES[h.type]||h.type}</span></td>
        <td class="px-3 py-2.5 text-xs text-gray-700 max-w-xs">
          <div class="truncate max-w-64" title="${(h.message||'').replace(/"/g,"'")}">${h.message||''}</div>
          ${h.scheduleName ? `<div class="text-gray-400 text-xs mt-0.5">회차: ${h.scheduleName}</div>` : ''}
        </td>
        <td class="px-3 py-2.5 text-center">
          ${(h.recipients && h.recipients.length) ? `
            <button onclick="AdminModule.showSmsRecipientsByIdx(event,${i},'detail')"
              class="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors">
              ${h.count||0}<span class="text-xs text-blue-400 ml-0.5">명</span>
            </button>` : `<span class="font-bold text-gray-500">${h.count||0}<span class="text-xs text-gray-400 ml-0.5">명</span></span>`}
        </td>
        <td class="px-3 py-2.5 text-xs text-gray-500">${h.sender||'-'}</td>
      </tr>`).join('') : '<tr><td colspan="6" class="text-center py-6 text-gray-400 text-sm">발송 이력 없음</td></tr>';

    const byRegionHtml = filter === 'byregion' && !regionFilter ? `
      <div class="mb-4 grid grid-cols-3 gap-3">
        ${Object.entries(byRegion).map(([rid, rows])=>`
          <div class="bg-blue-50 rounded-xl p-3 text-center cursor-pointer hover:bg-blue-100 transition-colors"
            onclick="AdminModule.showSmsDetail('all','${rid}')">
            <div class="font-bold text-blue-700 text-lg">${rows.length}건</div>
            <div class="text-sm text-gray-600">${RNAMES[rid]||rid}</div>
            <div class="text-xs text-gray-400 mt-0.5">수신 ${rows.reduce((s,h)=>s+(h.count||0),0)}명</div>
          </div>`).join('') || '<div class="col-span-3 text-center text-gray-400 py-4">데이터 없음</div>'}
      </div>` : '';

    const summaryBar = `
      <div class="flex gap-3 mb-4 bg-gray-50 rounded-xl p-3">
        <div class="text-center flex-1">
          <div class="font-bold text-gray-800">${filtered.length}</div>
          <div class="text-xs text-gray-500">총 발송건</div>
        </div>
        <div class="text-center flex-1">
          <div class="font-bold text-gray-800">${filtered.reduce((s,h)=>s+(h.count||0),0)}</div>
          <div class="text-xs text-gray-500">총 수신자</div>
        </div>
        <div class="text-center flex-1">
          <div class="font-bold text-gray-800">${filtered.filter(h=>h.type==='weather').length}</div>
          <div class="text-xs text-gray-500">기상취소</div>
        </div>
        <div class="text-center flex-1">
          <div class="font-bold text-gray-800">${filtered.filter(h=>h.type==='emergency').length}</div>
          <div class="text-xs text-gray-500">긴급공지</div>
        </div>
      </div>`;

    const modal = document.createElement('div');
    modal.id = 'sms-detail-modal';
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between p-5 border-b">
          <div class="flex items-center gap-2">
            <i class="fas fa-sms text-blue-500 text-lg"></i>
            <h2 class="font-bold text-gray-800">${title}</h2>
            <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">${filtered.length}건</span>
          </div>
          <button onclick="document.getElementById('sms-detail-modal').remove()"
            class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>
        <div class="p-5 overflow-y-auto flex-1">
          ${summaryBar}
          ${byRegionHtml}
          ${filter === 'byregion' && !regionFilter ? '<h3 class="text-sm font-semibold text-gray-700 mb-3">전체 발송 목록</h3>' : ''}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-white">
                <tr class="bg-gray-50">
                  ${['발송일시','지역','날짜','회차','유형','메시지 내용','수신자','발송자'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 font-medium text-left whitespace-nowrap">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>${tableRows(filtered)}</tbody>
            </table>
          </div>
        </div>
        <div class="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-end">
          <button onclick="document.getElementById('sms-detail-modal').remove()"
            class="px-5 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700">닫기</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
  };

  // 회차 선택 시 예약자 목록 로드
  const loadSmsPassengers = async () => {
    const scheduleSel = document.getElementById('sms-schedule');
    const scheduleId = scheduleSel?.value || document.getElementById('sms-schedule-id')?.value;
    const selOpt = scheduleSel?.options[scheduleSel?.selectedIndex];
    if (selOpt && selOpt.dataset.round) {
      // hidden input에 data 속성 동기화
      const hi = document.getElementById('sms-schedule-id');
      if (hi) { hi.value = scheduleId; hi.dataset.time = selOpt.dataset.time||''; hi.dataset.round = selOpt.dataset.round||''; }
    }
    const date = document.getElementById('sms-date')?.value;
    const type = document.getElementById('sms-type')?.value || 'all';
    const passengerArea = document.getElementById('sms-passenger-area');
    const allArea = document.getElementById('sms-all-count');
    const allNum = document.getElementById('sms-all-num');
    if (!scheduleId || !date) return;

    // 예약 조회
    const user = _adminState.user || {};
    let reservations = [];
    try {
      const r = await API.get(`/api/reservations?regionId=${user.regionId}&scheduleId=${scheduleId}&limit=200`);
      reservations = (r.data||[]).filter(rv => rv.status !== 'cancelled' && rv.status !== 'refunded');
    } catch(e) {}

    // 날짜 필터 (예약일 기준)
    const dayRes = reservations.filter(r => {
      const d = (r.date||r.reservationDate||r.created_at||'').slice(0,10);
      return d === date || !r.date; // date 없으면 일단 포함
    });
    const useRes = dayRes.length > 0 ? dayRes : reservations;

    window._smsPassengers = useRes;

    if (type === 'select') {
      if (passengerArea) passengerArea.classList.remove('hidden');
      if (allArea) allArea.classList.add('hidden');
      const listEl = document.getElementById('sms-passenger-list');
      if (listEl) {
        if (!useRes.length) {
          listEl.innerHTML = '<div class="text-center py-6 text-gray-400 text-sm">해당 날짜/회차 예약자가 없습니다.</div>';
        } else {
          listEl.innerHTML = `
            <table class="w-full text-sm">
              <thead><tr class="bg-gray-50 sticky top-0">
                <th class="px-3 py-2 w-10"><input type="checkbox" id="sms-check-all" onchange="AdminModule.smsSelectAll(this.checked)" class="rounded"></th>
                <th class="px-3 py-2 text-left text-xs text-gray-500 font-medium">예약자명</th>
                <th class="px-3 py-2 text-left text-xs text-gray-500 font-medium">연락처</th>
                <th class="px-3 py-2 text-left text-xs text-gray-500 font-medium">인원</th>
                <th class="px-3 py-2 text-left text-xs text-gray-500 font-medium">상태</th>
              </tr></thead>
              <tbody class="divide-y divide-gray-100">
                ${useRes.map((r,i)=>`
                  <tr class="hover:bg-blue-50 cursor-pointer" onclick="document.getElementById('sms-chk-${i}').click()">
                    <td class="px-3 py-2.5 text-center">
                      <input type="checkbox" id="sms-chk-${i}" class="sms-passenger-chk rounded" value="${r.phone||''}"
                        data-name="${r.name||''}" onchange="AdminModule.updateSmsSelectedCount()" onclick="event.stopPropagation()">
                    </td>
                    <td class="px-3 py-2.5 font-medium text-gray-800">${r.name||'-'}</td>
                    <td class="px-3 py-2.5 text-gray-600">${r.phone||'-'}</td>
                    <td class="px-3 py-2.5 text-gray-500">${r.pax||1}명</td>
                    <td class="px-3 py-2.5">
                      <span class="px-2 py-0.5 rounded-full text-xs ${r.status==='confirmed'?'bg-green-100 text-green-700':r.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600'}">${{confirmed:'확정',pending:'대기',boarded:'탑승',checkedin:'탑승완료'}[r.status]||r.status}</span>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>`;
          AdminModule.updateSmsSelectedCount();
        }
      }
    } else {
      if (passengerArea) passengerArea.classList.add('hidden');
      if (allArea) allArea.classList.remove('hidden');
      if (allNum) allNum.textContent = useRes.length;
    }
  };

  const onSmsTypeChange = () => {
    const type = document.getElementById('sms-type')?.value;
    const passengerArea = document.getElementById('sms-passenger-area');
    const allArea = document.getElementById('sms-all-count');
    if (type === 'select') {
      if (passengerArea) passengerArea.classList.remove('hidden');
      if (allArea) allArea.classList.add('hidden');
      loadSmsPassengers();
    } else {
      if (passengerArea) passengerArea.classList.add('hidden');
      if (allArea) allArea.classList.remove('hidden');
      loadSmsPassengers();
    }
  };

  const smsSelectAll = (checked) => {
    document.querySelectorAll('.sms-passenger-chk').forEach(el => el.checked = checked);
    const allChk = document.getElementById('sms-check-all');
    if (allChk) allChk.checked = checked;
    updateSmsSelectedCount();
  };

  const updateSmsSelectedCount = () => {
    const checked = document.querySelectorAll('.sms-passenger-chk:checked');
    const el = document.getElementById('sms-selected-count');
    if (el) el.textContent = checked.length + '명 선택';
  };

  const updateSmsCharCount = () => {
    const msg = document.getElementById('sms-message')?.value || '';
    const len = msg.length;
    const el = document.getElementById('sms-char-count');
    const badge = document.getElementById('sms-type-badge');
    const preview = document.getElementById('sms-preview');
    if (el) el.textContent = len + ' / 90자 ' + (len > 90 ? '(장문)' : '(단문)');
    if (badge) { badge.textContent = len > 90 ? '장문(LMS)' : '단문(SMS)'; badge.className = 'text-xs px-2 py-0.5 rounded-full ' + (len > 90 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'); }
    if (preview) preview.textContent = msg || '메시지를 입력하면 미리보기가 표시됩니다.';
  };

  const updateSmsPreview = () => {
    const target = document.querySelector('input[name="sms-target"]:checked')?.value || 'all';
    const countEl = document.getElementById('sms-count-num');
    if (!countEl) return;
    if (target === 'custom') {
      const phones = (document.getElementById('sms-custom-phones')?.value||'').split('\n').filter(p=>p.trim());
      countEl.textContent = phones.length;
    }
    updateSmsCharCount();
  };

  const setSmsTemplate = (type, encodedMsg) => {
    try {
      const msg = decodeURIComponent(encodedMsg);
      const el = document.getElementById('sms-message');
      if (el) { el.value = msg; updateSmsCharCount(); }
    } catch(e) {}
  };

  const previewSms = () => {
    const msg = document.getElementById('sms-message')?.value?.trim();
    const countEl = document.getElementById('sms-count-num');
    const count = parseInt(countEl?.textContent||'0');
    if (!msg) { Utils.toast('메시지를 입력하세요.', 'error'); return; }
    Utils.confirm(
      `📱 발송 확인\n\n수신자: ${count}명\n\n내용:\n${msg}\n\n발송하시겠습니까?`,
      () => { /* confirmed */ }
    );
  };

  const sendSms = (regionId) => {
    const msg = document.getElementById('sms-message')?.value?.trim();
    if (!msg) { Utils.toast('메시지를 입력하세요.', 'error'); return; }
    // sms-schedule select 드롭다운 우선, 없으면 hidden input 폴백
    const scheduleDropdown = document.getElementById('sms-schedule');
    const scheduleEl = document.getElementById('sms-schedule-id');
    const scheduleId = scheduleDropdown?.value || scheduleEl?.value || '';
    const selOpt = scheduleDropdown
      ? scheduleDropdown.options[scheduleDropdown.selectedIndex]
      : null;
    const rawTime = selOpt?.dataset?.time || selOpt?.text?.match(/^\d{2}:\d{2}/)?.[0] || '';
    const roundNum = selOpt?.dataset?.round || '';
    const scheduleName = scheduleId && rawTime ? `${rawTime} (${roundNum}회차)` : '';
    const type = document.getElementById('sms-type')?.value || 'all';
    const user = _adminState.user || {};

    let recipients = [];
    if (type === 'select') {
      document.querySelectorAll('.sms-passenger-chk:checked').forEach(el => {
        recipients.push({ phone: el.value, name: el.dataset.name });
      });
      if (!recipients.length) { Utils.toast('수신자를 1명 이상 선택하세요.', 'error'); return; }
    } else {
      const passengers = window._smsPassengers || [];
      recipients = passengers.map(r => ({ phone: r.phone, name: r.name }));
      if (!recipients.length) { Utils.toast('회차와 날짜를 먼저 선택하세요.', 'error'); return; }
    }

    const msgType = msg.includes('기상') ? 'weather' : msg.includes('긴급') ? 'emergency' : msg.includes('예약') ? 'reservation' : 'info';
    const history = JSON.parse(localStorage.getItem('amk_sms_history')||'[]');
    const scheduleDate = document.getElementById('sms-date')?.value || new Date().toISOString().slice(0,10);
    history.push({
      sentAt: new Date().toISOString(),
      regionId: regionId || user.regionId || 'all',
      type: msgType,
      message: msg,
      count: recipients.length,
      scheduleId,
      scheduleName,
      scheduleDate,
      sender: user.name || '관리자',
      recipients: recipients.slice(0, 200),
    });
    localStorage.setItem('amk_sms_history', JSON.stringify(history));
    Utils.toast('✅ ' + recipients.length + '명에게 발송 완료', 'success');
    setTimeout(() => smsPage().then(html => { document.getElementById('app').innerHTML = html; }), 1500);
  };

  const seoManagePage = async () => {
    _adminState.currentSection = 'seo';
    const regions = (window.REGIONS||[]).filter(r=>r.status==='active'||r.status==='open');
    const seoSettings = Settings.get('seoSettings') || {};
    const activeRegionId = _adminState.selectedRegion || regions[0]?.id || 'tongyeong';
    const region = regions.find(r=>r.id===activeRegionId);
    const regionSeo = (window.REGION_SEO||{})[activeRegionId] || {};
    const saved = seoSettings[activeRegionId] || {};
    const sc = Settings.get('searchConsole') || {};
    const an = Settings.get('analytics') || {};

    const regionTabs = regions.map(r=>`
      <button onclick="AdminModule.selectSeoRegion('${r.id}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${r.id===activeRegionId?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
        ${r.shortName||r.name}
      </button>
    `).join('');

    const content = `
      <div class="space-y-6">

        <!-- ═══ 섹션 1: 사이트 전체 공통 설정 (지역 무관) ═══ -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <div class="flex items-center gap-2 mb-1">
            <i class="fas fa-globe text-blue-600"></i>
            <h2 class="font-bold text-gray-800">사이트 전체 공통 설정</h2>
            <span class="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full ml-1">모든 지역에 자동 적용</span>
          </div>
          <p class="text-xs text-gray-500 mb-4">아래 설정은 지역 구분 없이 사이트 전체에 한 번만 입력하면 됩니다.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 검색엔진 인증 -->
            <div class="bg-white rounded-xl p-4 shadow-sm">
              <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="fas fa-key text-orange-500"></i>검색엔진 소유 확인 코드
                <a href="https://search.google.com/search-console" target="_blank" class="ml-auto text-xs text-blue-500 hover:underline">Google →</a>
              </h3>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    <i class="fab fa-google text-red-500 mr-1"></i>Google Search Console 인증 코드
                    <span class="text-gray-400 font-normal ml-1">(google-site-verification= 뒤의 코드값만)</span>
                  </label>
                  <input id="seo-google-verify" type="text" placeholder="예: googlee9064f654e79faa3"
                    value="${sc.googleVerification || (typeof SEO_CONFIG !== 'undefined' ? SEO_CONFIG.searchConsole?.googleVerification : '') || ''}"
                    class="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    <span class="text-green-600 font-bold mr-1">N</span>Naver Search Advisor 인증 코드
                    <a href="https://searchadvisor.naver.com" target="_blank" class="ml-1 text-xs text-blue-500 hover:underline">네이버 서치어드바이저 →</a>
                  </label>
                  <input id="seo-naver-verify" type="text" placeholder="예: abc123xyz..."
                    value="${sc.naverVerification||''}"
                    class="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    Bing Webmaster 인증 코드
                  </label>
                  <input id="seo-bing-verify" type="text" placeholder="예: abc123..."
                    value="${sc.bingVerification||''}"
                    class="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
              </div>
            </div>

            <!-- 분석 도구 -->
            <div class="bg-white rounded-xl p-4 shadow-sm">
              <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="fas fa-chart-bar text-purple-500"></i>방문자 분석 도구
              </h3>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    <i class="fab fa-google text-blue-500 mr-1"></i>Google Analytics 4 ID
                  </label>
                  <input id="seo-ga-id" type="text" placeholder="G-XXXXXXXXXX"
                    value="${an.gaId||''}"
                    class="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    <span class="text-green-600 font-bold mr-1">N</span>네이버 애널리틱스 ID
                  </label>
                  <input id="seo-naver-analytics" type="text" placeholder="na_xxxxxx"
                    value="${an.naverAnalyticsId||''}"
                    class="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    카카오 픽셀 ID
                  </label>
                  <input id="seo-kakao-pixel" type="text" placeholder="픽셀 ID"
                    value="${an.kakaoPixelId||''}"
                    class="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
              </div>
            </div>
          </div>

          <!-- 사이트맵/robots 상태 -->
          <div class="mt-4 grid grid-cols-3 gap-3 text-xs">
            <a href="/sitemap.xml" target="_blank" class="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border hover:border-blue-400 transition-colors">
              <i class="fas fa-sitemap text-blue-500"></i>
              <div><div class="font-medium text-gray-700">sitemap.xml</div><div class="text-gray-400">클릭하여 확인</div></div>
              <i class="fas fa-external-link-alt text-gray-300 ml-auto"></i>
            </a>
            <a href="/robots.txt" target="_blank" class="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border hover:border-blue-400 transition-colors">
              <i class="fas fa-robot text-gray-500"></i>
              <div><div class="font-medium text-gray-700">robots.txt</div><div class="text-gray-400">클릭하여 확인</div></div>
              <i class="fas fa-external-link-alt text-gray-300 ml-auto"></i>
            </a>
            <div class="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
              <i class="fas fa-check-circle text-green-500"></i>
              <div><div class="font-medium text-green-700">도메인</div><div class="text-green-600">aquamobility.co.kr ✓</div></div>
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <button onclick="AdminModule.saveSeoGlobal()" class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 font-medium">
              <i class="fas fa-save"></i> 공통 설정 저장
            </button>
          </div>
        </div>

        <!-- ═══ 섹션 2: 지역별 SEO 설정 ═══ -->
        <div class="bg-white rounded-xl shadow-sm p-5">
          <div class="flex items-center gap-2 mb-1">
            <i class="fas fa-map-marker-alt text-indigo-500"></i>
            <h2 class="font-bold text-gray-800">지역별 SEO 설정</h2>
            <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-1">지역마다 다른 키워드/설명</span>
          </div>
          <p class="text-xs text-gray-500 mb-4">각 지역 투어 페이지에 표시되는 제목·설명·키워드를 설정합니다. 검색 결과에서 각 지역 페이지가 어떻게 보이는지를 결정합니다.</p>

          <div class="flex gap-2 flex-wrap mb-5">${regionTabs}</div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- 기본 SEO -->
            <div class="border rounded-xl p-4">
              <h3 class="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
                <i class="fas fa-tags text-blue-500"></i>기본 SEO - ${region?.name||activeRegionId}
              </h3>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">페이지 제목 (title 태그) <span class="text-gray-400">권장 50-60자</span></label>
                  <input id="seo-title" type="text" value="${saved.title||regionSeo.title||''}" maxlength="70"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <p class="text-xs text-gray-400 mt-0.5" id="seo-title-count">${(saved.title||regionSeo.title||'').length}/70자</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">메타 설명 <span class="text-gray-400">권장 150-160자</span></label>
                  <textarea id="seo-desc" rows="3" maxlength="160" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none">${saved.description||regionSeo.description||''}</textarea>
                  <p class="text-xs text-gray-400 mt-0.5">${(saved.description||regionSeo.description||'').length}/160자</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">검색 키워드 <span class="text-gray-400">쉼표로 구분, 10~15개 권장</span></label>
                  <textarea id="seo-keywords" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none">${(saved.keywords||regionSeo.keywords||[]).join(', ')}</textarea>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">H1 제목 <span class="text-gray-400">페이지 대표 제목</span></label>
                  <input id="seo-h1" type="text" value="${saved.h1||regionSeo.h1||''}"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
              </div>
            </div>

            <!-- OG + 비즈니스 -->
            <div class="space-y-4">
              <div class="border rounded-xl p-4">
                <h3 class="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
                  <i class="fas fa-share-alt text-pink-500"></i>SNS 공유 (Open Graph)
                </h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">OG 제목 <span class="text-gray-400">SNS 공유 시 표시</span></label>
                    <input id="seo-og-title" type="text" value="${saved.ogTitle||regionSeo.ogTitle||''}"
                      class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">OG 설명</label>
                    <textarea id="seo-og-desc" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none">${saved.ogDescription||regionSeo.ogDescription||''}</textarea>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">OG 이미지 URL <span class="text-gray-400">1200×630px 권장</span></label>
                    <input id="seo-og-img" type="url" value="${saved.ogImage||regionSeo.ogImage||''}"
                      class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://...">
                  </div>
                </div>
              </div>

              <div class="border rounded-xl p-4">
                <h3 class="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
                  <i class="fas fa-map-pin text-green-500"></i>지역 비즈니스 등록 URL
                  <span class="text-xs text-gray-400 font-normal">(지도 검색 노출용)</span>
                </h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">
                      <span class="text-green-600 font-bold mr-1">N</span>네이버 스마트플레이스 URL
                      <a href="https://smartplace.naver.com" target="_blank" class="ml-1 text-blue-500 hover:underline text-xs">등록하기 →</a>
                    </label>
                    <input id="seo-smartplace" type="url" value="${saved.smartplaceUrl||''}"
                      placeholder="https://smartplace.naver.com/..."
                      class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">
                      <i class="fab fa-google text-blue-500 mr-1"></i>구글 비즈니스 프로필 URL
                      <a href="https://business.google.com" target="_blank" class="ml-1 text-blue-500 hover:underline text-xs">등록하기 →</a>
                    </label>
                    <input id="seo-gbusiness" type="url" value="${saved.googleBusinessUrl||''}"
                      placeholder="https://business.google.com/..."
                      class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Google Place ID</label>
                    <input id="seo-place-id" type="text" value="${saved.googlePlaceId||''}"
                      placeholder="ChIJ..."
                      class="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <button onclick="AdminModule.saveSeoSettings('${activeRegionId}')" class="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2 font-medium">
              <i class="fas fa-save"></i> ${region?.name||''} SEO 저장
            </button>
          </div>
        </div>

      </div>
    `;
    return renderAdminLayout('seo', content, 'SEO 관리');
  };
  const selectSeoRegion = (regionId) => { _adminState.selectedRegion = regionId; seoManagePage().then(html=>{document.getElementById('app').innerHTML=html;}); };
  const saveSeoGlobal = () => {
    const get = id => document.getElementById(id)?.value?.trim() || '';
    Settings.set('searchConsole', {
      googleVerification: get('seo-google-verify'),
      naverVerification: get('seo-naver-verify'),
      bingVerification: get('seo-bing-verify'),
    });
    Settings.set('analytics', {
      gaId: get('seo-ga-id'),
      naverAnalyticsId: get('seo-naver-analytics'),
      kakaoPixelId: get('seo-kakao-pixel'),
    });
    Utils.toast('✅ 공통 설정이 저장되었습니다. 검색엔진에 즉시 반영됩니다.', 'success');
  };

  const saveSeoSettings = (regionId) => {
    const get = id => document.getElementById(id)?.value?.trim() || '';
    let allSeo = Settings.get('seoSettings') || {};
    allSeo[regionId] = {
      title: get('seo-title'), description: get('seo-desc'),
      keywords: get('seo-keywords').split(',').map(k=>k.trim()).filter(Boolean),
      h1: get('seo-h1'), ogTitle: get('seo-og-title'),
      ogDescription: get('seo-og-desc'), ogImage: get('seo-og-img'),
      smartplaceUrl: get('seo-smartplace'),
      googleBusinessUrl: get('seo-gbusiness'),
      googlePlaceId: get('seo-place-id'),
    };
    Settings.set('seoSettings', allSeo);
    const rnames = {tongyeong:'통영',buyeo:'부여',hapcheon:'합천'};
    Utils.toast('✅ ' + (rnames[regionId]||regionId) + ' SEO 설정이 저장되었습니다.', 'success');
  };

  // ── 새 지역 추가 ───────────────────────────────────────────
  const regionsPage = async () => {
    _adminState.currentSection = 'regions';
    // DB에서 지역 목록 로드
    const regRes = await API.get('/api/regions');
    const regions = (regRes.success && regRes.data) ? regRes.data : (window.REGIONS || []);

    const regionCards = regions.map((r, i) => `
      <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 ${r.status==='open'||r.status==='active'?'border-green-500':r.status==='preparing'?'border-yellow-400':'border-gray-300'}">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold text-gray-800">${r.name}</h3>
            <p class="text-xs text-gray-500">${r.code} · ${r.location||''}</p>
          </div>
          <span class="px-2 py-1 rounded-full text-xs font-medium ${r.status==='open'||r.status==='active'?'bg-green-100 text-green-700':r.status==='preparing'?'bg-yellow-100 text-yellow-700':r.status==='closed'?'bg-red-100 text-red-600':'bg-gray-100 text-gray-500'}">
            ${r.status==='open'||r.status==='active'?'운영중':r.status==='preparing'?'준비중':r.status==='closed'?'운영중단':'미운영'}
          </span>
        </div>
        ${r.company ? `<p class="text-xs text-gray-600 mb-1"><i class="fas fa-building mr-1"></i>${r.company.name}</p>` : ''}
        ${r.pgMerchant ? `<p class="text-xs text-gray-600 mb-3"><i class="fas fa-credit-card mr-1"></i>${r.pgMerchant.pgName} - <code class="bg-gray-100 px-1 rounded">${r.pgMerchant.merchantId}</code></p>` : ''}
        <div class="flex gap-2 flex-wrap">
          <button onclick="AdminModule.editRegion('${r.id}')" class="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs hover:bg-blue-100">수정</button>
          ${r.status==='open' ? `<button onclick="AdminModule.suspendRegion('${r.id}')" class="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs hover:bg-red-100">운영 중단</button>` : `<button onclick="AdminModule.activateRegion('${r.id}')" class="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs hover:bg-green-100">운영 시작</button>`}
          <button onclick="AdminModule.deleteRegion('${r.id}','${r.name}')" class="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs hover:bg-red-100">삭제</button>
        </div>
      </div>
    `).join('');

    const content = `
      <div class="space-y-4">
        <div class="flex justify-end">
          <button onclick="AdminModule.showAddRegionModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <i class="fas fa-plus"></i> 새 지역 추가
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${regionCards}</div>
      </div>

      <!-- 새 지역 추가 모달 -->
      <div id="region-modal" class="modal-overlay hidden">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
          <h3 class="font-semibold text-gray-800 text-lg mb-4">새 지역 추가</h3>
          <div class="space-y-4">
            <div class="border-b pb-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">기본 정보</h4>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-xs text-gray-600 mb-1">지역명</label><input id="reg-name" type="text" placeholder="예: 경주수륙양용투어" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" oninput="AdminModule._autoGenRegionCode(this.value)"></div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">지역 코드 <span class="text-gray-400 font-normal">(자동 생성)</span></label>
                  <div class="flex items-center gap-2">
                    <input id="reg-code" type="text" readonly placeholder="지역명 입력 시 자동 생성" class="flex-1 border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600 font-mono cursor-not-allowed" title="코드는 자동으로 생성됩니다">
                    <span class="text-xs text-gray-400 whitespace-nowrap">AMK-001 형식</span>
                  </div>
                </div>
                <div class="col-span-2"><label class="block text-xs text-gray-600 mb-1">위치</label><input id="reg-location" type="text" placeholder="예: 경북 경주시 황남동 xxx" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
                <div><label class="block text-xs text-gray-600 mb-1">고객센터 전화</label><input id="reg-phone" type="text" placeholder="054-xxx-xxxx" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
                <div><label class="block text-xs text-gray-600 mb-1">온라인 비율 (%)</label><input id="reg-online-ratio" type="number" value="70" min="0" max="100" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
              </div>
            </div>
            <div class="border-b pb-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">법인 정보</h4>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-xs text-gray-600 mb-1">법인명</label><input id="reg-company-name" type="text" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
                <div><label class="block text-xs text-gray-600 mb-1">사업자등록번호</label><input id="reg-biz-no" type="text" placeholder="xxx-xx-xxxxx" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"></div>
                <div><label class="block text-xs text-gray-600 mb-1">대표자명</label><input id="reg-rep" type="text" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
                <div><label class="block text-xs text-gray-600 mb-1">정산 계좌</label><input id="reg-bank" type="text" placeholder="은행명 계좌번호" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-3">PG 결제 정보 (독립 결제)</h4>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-xs text-gray-600 mb-1">PG사</label>
                  <select id="reg-pg-name" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>KG이니시스</option><option>NHN KCP</option><option>토스페이먼츠</option><option>카카오페이</option><option>네이버페이</option>
                  </select>
                </div>
                <div><label class="block text-xs text-gray-600 mb-1">Merchant ID</label><input id="reg-merchant-id" type="text" placeholder="예: gyeongju_pg_mid" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"></div>
              </div>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="AdminModule.saveNewRegion()" class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">지역 추가</button>
            <button onclick="document.getElementById('region-modal').classList.add('hidden')" class="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('regions', content, '지역 관리');
  };

  const showAddRegionModal = () => { document.getElementById('region-modal').classList.remove('hidden'); };
  const editRegion = async (regionId) => {
    const res = await API.get(`/api/regions/${regionId}`);
    if (!res.success) { Utils.toast('지역 정보를 불러올 수 없습니다', 'error'); return; }
    const r = res.data;
    Utils.modal(`
      <div class="modal-header"><h3 class="font-bold text-lg">${r.name} 수정</h3></div>
      <div class="modal-body space-y-3">
        <div><label class="text-xs text-gray-600">지역명</label><input id="edit-reg-name" value="${r.name||''}" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
        <div><label class="text-xs text-gray-600">상태</label><select id="edit-reg-status" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"><option value="open" ${r.status==='open'?'selected':''}>운영중</option><option value="preparing" ${r.status==='preparing'?'selected':''}>준비중</option><option value="closed" ${r.status==='closed'?'selected':''}>운영중단</option></select></div>
        <div><label class="text-xs text-gray-600">위치</label><input id="edit-reg-location" value="${r.location||''}" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
        <div><label class="text-xs text-gray-600">고객센터</label><input id="edit-reg-phone" value="${r.customerService||''}" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
        <div><label class="text-xs text-gray-600">탑승 장소</label><input id="edit-reg-boarding" value="${r.boardingPlace||''}" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
      </div>
      <div class="modal-footer">
        <button onclick="Utils.closeModal()" class="btn-outline px-4 py-2 text-sm">취소</button>
        <button onclick="AdminModule._saveEditRegion('${r.id}')" class="btn-primary px-4 py-2 text-sm">저장</button>
      </div>`);
  };
  const _saveEditRegion = async (regionId) => {
    const data = {
      name: document.getElementById('edit-reg-name')?.value,
      status: document.getElementById('edit-reg-status')?.value,
      location: document.getElementById('edit-reg-location')?.value,
      customerService: document.getElementById('edit-reg-phone')?.value,
      boardingPlace: document.getElementById('edit-reg-boarding')?.value,
    };
    Utils.loading(true);
    const res = await API.put(`/api/regions/${regionId}`, data);
    Utils.loading(false);
    Utils.closeModal();
    if (res.success) {
      Utils.toast('지역 정보가 저장되었습니다', 'success');
      regionsPage().then(html=>{document.getElementById('app').innerHTML=html;});
    } else { Utils.toast('저장 실패: ' + res.error, 'error'); }
  };
  const suspendRegion = (regionId) => { Utils.confirm('이 지역 운영을 중단하시겠습니까?', async () => {
    const res = await API.put(`/api/regions/${regionId}`, { status: 'closed' });
    Utils.closeModal();
    if (res.success) { Utils.toast('운영이 중단되었습니다.', 'success'); regionsPage().then(html=>{document.getElementById('app').innerHTML=html;}); }
    else Utils.toast('실패: ' + res.error, 'error');
  }); };
  const activateRegion = (regionId) => { Utils.confirm('이 지역 운영을 시작하시겠습니까?', async () => {
    const res = await API.put(`/api/regions/${regionId}`, { status: 'open' });
    Utils.closeModal();
    if (res.success) { Utils.toast('운영이 시작되었습니다.', 'success'); regionsPage().then(html=>{document.getElementById('app').innerHTML=html;}); }
    else Utils.toast('실패: ' + res.error, 'error');
  }); };
  const deleteRegion = (regionId, regionName) => { Utils.confirm(`"${regionName}" 지역을 삭제하시겠습니까? 관련 스케줄도 함께 삭제됩니다.`, async () => {
    const res = await API.delete(`/api/regions/${regionId}`);
    Utils.closeModal();
    if (res.success) { Utils.toast('지역이 삭제되었습니다', 'success'); regionsPage().then(html=>{document.getElementById('app').innerHTML=html;}); }
    else Utils.toast('삭제 실패: ' + res.error, 'error');
  }); };
  // 지역명 → 자동 코드 생성 (AMK-001 형식)
  const _autoGenRegionCode = (name) => {
    const codeEl = document.getElementById('reg-code');
    if (!codeEl) return;
    if (!name || name.trim().length === 0) { codeEl.value = ''; return; }
    // 기존 지역 수 기반 시퀀스 번호
    const existingCount = (window.REGIONS || []).length;
    // localStorage에 추가된 지역 수
    const addedCount = parseInt(localStorage.getItem('amk_region_added_count') || '0', 10);
    const seq = existingCount + addedCount + 1;
    const seqStr = String(seq).padStart(3, '0');
    codeEl.value = `AMK-${seqStr}`;
  };

  const saveNewRegion = async () => {
    const get = (id) => document.getElementById(id)?.value||'';
    const name = get('reg-name').trim();
    if (!name) { Utils.toast('지역명을 입력하세요', 'error'); return; }
    const codeEl = document.getElementById('reg-code');
    if (codeEl && !codeEl.value) { _autoGenRegionCode(name); }
    const code = get('reg-code') || `AMK-${String((window.REGIONS||[]).length+1).padStart(3,'0')}`;
    const data = {
      name, code,
      location: get('reg-location'),
      customerService: get('reg-phone'),
      onlineRatio: parseInt(get('reg-online-ratio'))||70,
      offlineRatio: 100 - (parseInt(get('reg-online-ratio'))||70),
      company: { name: get('reg-company-name'), bizNo: get('reg-biz-no'), representative: get('reg-rep'), bankAccount: get('reg-bank') },
      pgMerchant: { pgName: get('reg-pg-name'), merchantId: get('reg-merchant-id'), testMode: true },
      status: 'preparing',
    };
    Utils.loading(true);
    const res = await API.post('/api/regions', data);
    Utils.loading(false);
    if (res.success) {
      Utils.toast(`"${name}" 지역이 추가되었습니다`, 'success');
      document.getElementById('region-modal')?.classList.add('hidden');
      regionsPage().then(html=>{document.getElementById('app').innerHTML=html;});
    } else { Utils.toast('추가 실패: ' + res.error, 'error'); }
  };

  // ── 정산 관리 ──────────────────────────────────────────────

  // ── 정산 관리 (DB API 기반) ────────────────────────────────

  // 정산 집계: DB API에서 날짜+지역 기준 집계
  const _fetchSettlementRows = async (filterRegion, filterMonth) => {
    const monthPrefix = filterMonth || new Date().toISOString().slice(0,7);
    let url = `/api/reservations?limit=1000&month=${monthPrefix}`;
    if (filterRegion) url += `&regionId=${filterRegion}`;
    const res = await API.get(url);
    const allRes = (res.data || []).filter(r =>
      r.status !== 'cancelled' && r.status !== 'refunded'
    );

    // 날짜별 집계
    const byDate = {};
    allRes.forEach(r => {
      const date = r.date || '';
      if (!date) return;
      if (!byDate[date]) byDate[date] = { date, online:0, onsite:0, cash:0, card:0, count:0 };
      const amt = r.totalPrice || 0;
      const isOnsite = r.channel === 'onsite';
      if (isOnsite) {
        byDate[date].onsite += amt;
        if (r.paymentMethod === 'cash') byDate[date].cash += amt;
        else byDate[date].card += amt;
      } else {
        byDate[date].online += amt;
        byDate[date].card += amt;
      }
      byDate[date].count++;
    });

    const today = new Date().toISOString().slice(0,10);
    const rows = [];
    // 해당 월의 모든 날짜 순회 (최신순)
    const [mYear, mMonth] = monthPrefix.split('-').map(Number);
    const daysInMonth = new Date(mYear, mMonth, 0).getDate();
    for (let day = daysInMonth; day >= 1; day--) {
      const dateStr = `${monthPrefix}-${String(day).padStart(2,'0')}`;
      const agg = byDate[dateStr];
      const online = agg ? agg.online : 0;
      const onsite = agg ? agg.onsite : 0;
      const total  = online + onsite;
      const cash   = agg ? agg.cash : 0;
      const card   = agg ? agg.card : 0;
      const count  = agg ? agg.count : 0;
      const RNAMES = {tongyeong:'통영',buyeo:'부여',hapcheon:'합천'};
      const rLabel = filterRegion ? (RNAMES[filterRegion]||filterRegion) : '전체';
      const isClosed = dateStr < today;
      rows.push(`
        <tr class="hover:bg-gray-50">
          <td class="px-3 py-2 text-sm text-gray-600">${dateStr}</td>
          <td class="px-3 py-2 text-sm text-center font-medium text-gray-700">${rLabel}</td>
          <td class="px-3 py-2 text-sm text-right ${online>0?'text-blue-600 font-medium':'text-gray-400'}">₩${online.toLocaleString()}</td>
          <td class="px-3 py-2 text-sm text-right ${onsite>0?'text-green-600 font-medium':'text-gray-400'}">₩${onsite.toLocaleString()}</td>
          <td class="px-3 py-2 text-sm text-right font-semibold ${total>0?'text-gray-800':'text-gray-300'}">₩${total.toLocaleString()}</td>
          <td class="px-3 py-2 text-sm text-right text-gray-500">₩${cash.toLocaleString()}</td>
          <td class="px-3 py-2 text-sm text-right text-gray-500">₩${card.toLocaleString()}</td>
          <td class="px-3 py-2 text-sm text-center ${count>0?'text-gray-700 font-medium':'text-gray-300'}">${count}건</td>
          <td class="px-3 py-2 text-center">
            <span class="px-2 py-0.5 rounded-full text-xs font-medium ${isClosed?'bg-blue-100 text-blue-700':'bg-yellow-100 text-yellow-700'}">
              ${isClosed?'마감완료':'마감전'}
            </span>
          </td>
          <td class="px-3 py-2 text-center">
            <button onclick="AdminModule.viewSettlement('${dateStr}')" class="text-blue-600 hover:underline text-xs">상세</button>
          </td>
        </tr>`);
    }
    return rows.length ? rows.join('') : '<tr><td colspan="10" class="text-center py-8 text-gray-400">해당 기간 정산 데이터가 없습니다.</td></tr>';
  };

  const filterSettlement = async () => {
    const user = _adminState.user || { role: 'super', regionId: null };
    const fRegion = user.role === 'regional' ? user.regionId : (document.getElementById('stl-filter-region')?.value || '');
    const fMonth  = document.getElementById('stl-filter-month')?.value || new Date().toISOString().slice(0,7);
    const tbody = document.getElementById('stl-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>조회중...</td></tr>';
    const rows = await _fetchSettlementRows(fRegion, fMonth);
    if (tbody) tbody.innerHTML = rows;
    // 요약 카드 갱신
    await _updateSettlementSummary(fRegion, fMonth);
  };

  const _updateSettlementSummary = async (filterRegion, filterMonth) => {
    const monthPrefix = filterMonth || new Date().toISOString().slice(0,7);
    const todayStr = new Date().toISOString().slice(0,10);
    let urlMonth = `/api/reservations?limit=1000&month=${monthPrefix}`;
    if (filterRegion) urlMonth += `&regionId=${filterRegion}`;
    const resMonth = await API.get(urlMonth);
    const monthData = (resMonth.data || []).filter(r => r.status !== 'cancelled' && r.status !== 'refunded');
    const todayData = monthData.filter(r => r.date === todayStr);
    const monthTotal = monthData.reduce((s,r) => s+(r.totalPrice||0), 0);
    // 누적 정산 (전체)
    let urlAll = `/api/reservations?limit=5000`;
    if (filterRegion) urlAll += `&regionId=${filterRegion}`;
    const resAll = await API.get(urlAll);
    const allActive = (resAll.data || []).filter(r => r.status !== 'cancelled' && r.status !== 'refunded');
    const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
    el('stl-sum-today', `${todayData.length}건`);
    el('stl-sum-month', `${monthData.length}건`);
    el('stl-sum-total', `₩${monthTotal.toLocaleString()}`);
    el('stl-sum-total2', `₩${allActive.reduce((s,r)=>s+(r.totalPrice||0),0).toLocaleString()}`);
  };

  const settlementPage = async () => {
    _adminState.currentSection = 'settlement';
    const user = _adminState.user || { role: 'super', regionId: null };
    const isRegional = user.role === 'regional';
    const allRegions = (window.REGIONS||[]).filter(r => r.status !== 'hidden');
    const RNAMES = {tongyeong:'통영',buyeo:'부여',hapcheon:'합천'};

    const initRegion = isRegional ? user.regionId : '';
    const initMonth  = new Date().toISOString().slice(0,7);

    // DB에서 실제 데이터 조회 (월 필터 적용)
    const todayStr = new Date().toISOString().slice(0,10);
    let urlM = `/api/reservations?limit=1000&month=${initMonth}`;
    if (initRegion) urlM += `&regionId=${initRegion}`;
    const resM = await API.get(urlM);
    const monthData = (resM.data || []).filter(r => r.status !== 'cancelled' && r.status !== 'refunded');
    const todayData = monthData.filter(r => r.date === todayStr);
    const monthTotal = monthData.reduce((s,r) => s+(r.totalPrice||0), 0);
    let urlAll2 = `/api/reservations?limit=5000`;
    if (initRegion) urlAll2 += `&regionId=${initRegion}`;
    const resAll2 = await API.get(urlAll2);
    const allRes = (resAll2.data || []).filter(r => r.status !== 'cancelled' && r.status !== 'refunded');

    const regionOpts = isRegional
      ? `<option value="${user.regionId}">${RNAMES[user.regionId]||user.regionId}</option>`
      : ['<option value="">전체 지역</option>',
          ...allRegions.map(r=>`<option value="${r.id}">${r.name||RNAMES[r.id]||r.id}</option>`)
        ].join('');

    const settlementRows = await _fetchSettlementRows(initRegion, initMonth);

    const content = `
      <div class="space-y-6">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl shadow-sm p-4">
            <div class="text-xs text-gray-500 mb-1"><i class="fas fa-calendar-day mr-1 text-orange-400"></i>오늘 예약</div>
            <div id="stl-sum-today" class="text-2xl font-bold text-gray-800">${todayData.length}건</div>
            <div class="text-xs text-gray-400 mt-1">마감 전</div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-4">
            <div class="text-xs text-gray-500 mb-1"><i class="fas fa-check-circle mr-1 text-green-400"></i>이번달 예약</div>
            <div id="stl-sum-month" class="text-2xl font-bold text-gray-800">${monthData.length}건</div>
            <div class="text-xs text-gray-400 mt-1">${initMonth}</div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-4">
            <div class="text-xs text-gray-500 mb-1"><i class="fas fa-won-sign mr-1 text-blue-400"></i>이번달 매출</div>
            <div id="stl-sum-total" class="text-xl font-bold text-gray-800">₩${monthTotal.toLocaleString()}</div>
            <div class="text-xs text-gray-400 mt-1">취소 제외</div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-4">
            <div class="text-xs text-gray-500 mb-1"><i class="fas fa-calculator mr-1 text-purple-400"></i>누적 정산</div>
            <div id="stl-sum-total2" class="text-xl font-bold text-gray-800">₩${allRes.reduce((s,r)=>s+(r.totalPrice||0),0).toLocaleString()}</div>
            <div class="text-xs text-gray-400 mt-1">전체 기간</div>
          </div>
        </div>

        ${isRegional ? `
        <div class="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <i class="fas fa-info-circle flex-shrink-0"></i>
          <span><strong>${RNAMES[user.regionId]||user.regionId}</strong> 지역 정산 데이터만 표시됩니다.</span>
        </div>` : ''}

        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 class="font-semibold text-gray-800">일일 정산 내역</h2>
            <div class="flex gap-2 flex-wrap items-center">
              <select id="stl-filter-region" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" ${isRegional?'disabled':''}>
                ${regionOpts}
              </select>
              <input type="month" id="stl-filter-month" value="${initMonth}" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <button onclick="AdminModule.filterSettlement()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
                <i class="fas fa-search"></i>조회
              </button>
              <button onclick="AdminModule.exportSettlementCSV()" class="border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                <i class="fas fa-download"></i>CSV
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table w-full text-sm">
              <thead><tr class="bg-gray-50">
                ${['날짜','지역','온라인 매출','현장 매출','총 매출','현금','카드','건수','상태','관리'].map(h=>`<th class="px-3 py-3 text-xs font-semibold text-gray-600 text-center whitespace-nowrap">${h}</th>`).join('')}
              </tr></thead>
              <tbody id="stl-tbody" class="divide-y divide-gray-100">${settlementRows}</tbody>
            </table>
          </div>
        </div>
      </div>`;
    return renderAdminLayout('settlement', content, '정산 관리');
  };

  const closeDay = (date) => {
    Utils.confirm(
      `${date} 정산을 마감하시겠습니까?\n마감 후 수정은 HQ 승인이 필요합니다.`,
      () => Utils.toast('일일 정산이 마감되었습니다.', 'success')
    );
  };
  const exportSettlementCSV = async () => {
    const user = _adminState.user || {};
    const fRegion = user.role === 'regional' ? user.regionId : (document.getElementById('stl-filter-region')?.value || '');
    const fMonth  = document.getElementById('stl-filter-month')?.value || new Date().toISOString().slice(0,7);
    let url = `/api/reservations?limit=1000`;
    if (fRegion) url += `&regionId=${fRegion}`;
    const res = await API.get(url);
    const allRes = (res.data||[]).filter(r=>r.status!=='cancelled'&&(r.date||'').startsWith(fMonth));
    const RNAMES={tongyeong:'통영',buyeo:'부여',hapcheon:'합천'};
    const header = '날짜,예약번호,예약자,지역,채널,결제방식,금액,상태';
    const rows = allRes.map(r =>
      `${r.date},${r.reservationNo},${r.name},${RNAMES[r.regionId]||r.regionId},${r.channel},${r.paymentMethod},${r.totalPrice||0},${r.status}`
    );
    const csv = [header,...rows].join('\n');
    const blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `정산_${fMonth}.csv`;
    a.click();
    Utils.toast('CSV 다운로드 완료', 'success');
  };

  const viewSettlement = (date) => {
    // 해당 날짜 실제 예약 목록 표시
    let allRes = [];
    try { allRes = JSON.parse(localStorage.getItem('amk_reservations') || '[]'); } catch(e) {}
    let onsiteRes = [];
    try { onsiteRes = JSON.parse(localStorage.getItem('amk_onsite_tickets') || '[]'); } catch(e) {}
    const combined = [...allRes, ...onsiteRes].filter(r => {
      const rDate = r.date || r.createdAt?.slice(0,10) || '';
      return rDate === date && r.status !== 'cancelled';
    });
    if (!combined.length) {
      Utils.toast(`${date} 정산 데이터가 없습니다.`, 'info');
      return;
    }
    const REGION_NAMES = { tongyeong:'통영', buyeo:'부여', hapcheon:'합천' };
    const total = combined.reduce((s,r)=>s+(r.totalAmount||r.total||0),0);
    const rows = combined.map(r=>`
      <div class="flex justify-between text-sm py-1 border-b border-gray-100">
        <span class="font-mono text-xs text-blue-600">${r.id||r.reservationId||'-'}</span>
        <span>${r.name||'-'}</span>
        <span class="text-gray-500">${REGION_NAMES[r.regionId]||r.regionId||'-'}</span>
        <span class="font-medium">₩${(r.totalAmount||r.total||0).toLocaleString()}</span>
        <span class="text-gray-400 text-xs">${r.payMethod||'온라인'}</span>
      </div>`).join('');
    Utils.confirm(
      `<div class="text-left">
        <div class="font-bold text-base mb-3">${date} 정산 상세 (${combined.length}건)</div>
        <div class="max-h-60 overflow-y-auto space-y-0.5">${rows}</div>
        <div class="mt-3 pt-3 border-t flex justify-between font-bold">
          <span>합계</span><span>₩${total.toLocaleString()}</span>
        </div>
      </div>`,
      () => {},
      { confirmText: '닫기', cancelText: null, title: '정산 상세' }
    );
  };
  const exportSettlement = () => {
    const user = _adminState.user || { role: 'super', regionId: null };
    const REGION_NAMES = { tongyeong:'통영', buyeo:'부여', hapcheon:'합천' };
    const fRegion = user.role === 'regional' ? user.regionId : (document.getElementById('stl-filter-region')?.value || '');
    const month = document.getElementById('stl-filter-month')?.value || new Date().toISOString().slice(0,7);
    const regionLabel = fRegion ? (REGION_NAMES[fRegion] || fRegion) : '전체';

    // 실제 데이터 기반 CSV
    let allRes = [];
    try { allRes = JSON.parse(localStorage.getItem('amk_reservations') || '[]'); } catch(e) {}
    let onsiteRes = [];
    try { onsiteRes = JSON.parse(localStorage.getItem('amk_onsite_tickets') || '[]'); } catch(e) {}
    const combined = [...allRes, ...onsiteRes].filter(r => {
      const date = r.date || r.createdAt?.slice(0,10) || '';
      return date.startsWith(month) && r.status !== 'cancelled' && (!fRegion || r.regionId === fRegion);
    });

    const csvRows = [
      ['아쿠아모빌리티코리아 정산 내역'],
      [`기간: ${month}`, `지역: ${regionLabel}`, `생성: ${new Date().toLocaleString('ko-KR')}`],
      [],
      ['예약번호','예약자','지역','날짜','금액','결제방식','채널','상태'],
      ...combined.map(r=>[
        r.id||r.reservationId||'-',
        r.name||'-',
        REGION_NAMES[r.regionId]||r.regionId||'-',
        r.date||r.createdAt?.slice(0,10)||'-',
        r.totalAmount||r.total||0,
        r.payMethod||'온라인',
        r.channel||'online',
        r.status||'-',
      ]),
    ];
    Utils.downloadCSV(csvRows, `settlement_${month.replace('-','_')}_${new Date().toISOString().slice(0,10)}.csv`);
    Utils.toast('정산 내역 CSV가 다운로드됩니다.', 'success');
  };

  // ── 관리자 계정 관리 ───────────────────────────────────────
  const adminsPage = async () => {
    _adminState.currentSection = 'admins';
    const aRes = await API.get('/api/admin/users');
    const rawAdmins = (aRes.success && aRes.data) ? aRes.data : (window.ADMIN_USERS || []);
    // region_id → regionId 정규화
    const admins = rawAdmins.map(a => ({ ...a, regionId: a.regionId || a.region_id || null, id: a.username || a.id }));

    const rows = admins.map((a, i) => `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-sm font-medium">${a.name||'관리자'}</td>
        <td class="px-4 py-3 text-sm text-gray-500">${a.id||'admin'}</td>
        <td class="px-4 py-3 text-sm text-center">
          <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">${ROLE_LABELS[a.role]||a.role}</span>
        </td>
        <td class="px-4 py-3 text-sm text-center">${a.regionId ? `${a.regionId}지역` : '본사'}</td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${a.lastLogin||'-'}</td>
        <td class="px-4 py-3 text-center">
          <button onclick="AdminModule.resetPassword(${i})" class="text-orange-500 hover:underline text-xs mr-2">비번 초기화</button>
          <button onclick="AdminModule.deleteAdmin(${i})" class="text-red-500 hover:underline text-xs">삭제</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="text-center py-4 text-gray-500">관리자가 없습니다.</td></tr>';

    const content = `
      <div class="space-y-4">
        <div class="flex justify-end">
          <button onclick="AdminModule.addAdmin()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <i class="fas fa-user-plus"></i> 관리자 추가
          </button>
        </div>
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <table class="admin-table w-full">
            <thead><tr class="bg-gray-50">${['이름','아이디','역할','담당지역','최근 로그인','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}</tr></thead>
            <tbody class="divide-y divide-gray-100">${rows}</tbody>
          </table>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-800 mb-3">역할별 권한 요약</h2>
          <div class="overflow-x-auto">
            <table class="admin-table w-full text-xs">
              <thead><tr class="bg-gray-50"><th class="px-3 py-2">기능</th>${Object.values(ROLE_LABELS).map(l=>`<th class="px-3 py-2 text-center">${l}</th>`).join('')}</tr></thead>
              <tbody class="divide-y divide-gray-100">
                ${[
                  ['예약 조회', true, true, true, true, false, false],
                  ['요금 수정', true, false, false, false, false, false],
                  ['정산 마감', true, true, false, true, false, false],
                  ['지역 추가', true, false, false, false, false, false],
                  ['SEO 관리', true, true, false, false, true, false],
                  ['관리자 계정', true, false, false, false, false, false],
                ].map(row=>`
                  <tr class="hover:bg-gray-50">
                    <td class="px-3 py-2 font-medium">${row[0]}</td>
                    ${row.slice(1).map(v=>`<td class="px-3 py-2 text-center">${v?'<i class="fas fa-check text-green-500"></i>':'<i class="fas fa-times text-gray-300"></i>'}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('admins', content, '관리자 계정 관리');
  };
  const addAdmin = () => Utils.toast('관리자 추가 모달 (구현 중)', 'info');
  const resetPassword = (idx) => Utils.confirm('비밀번호를 초기화하시겠습니까?', () => Utils.toast('비밀번호가 초기화되었습니다.', 'success'));
  const deleteAdmin = (idx) => Utils.confirm('관리자를 삭제하시겠습니까?', () => Utils.toast('삭제되었습니다.', 'success'));

  // ── 시스템 설정 ────────────────────────────────────────────
  const settingsAdminPage = async () => {
    _adminState.currentSection = 'settings-admin';
    const content = `
      <div class="space-y-4">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-800 mb-4">SMS 알림 템플릿 (관리자 직접 편집)</h2>
          <div class="space-y-4">
            ${[
              { id: 'bookingConfirm', label: '예약 확정 SMS', placeholder: '[아쿠아모빌리티] 예약이 확정되었습니다...' },
              { id: 'reminder', label: '탑승 전날 리마인더', placeholder: '[아쿠아모빌리티] 내일 탑승 예약이 있습니다...' },
              { id: 'suspension', label: '운행 중단 SMS', placeholder: '[아쿠아모빌리티] 금일 운행이 중단되었습니다...' },
            ].map(t => {
              const templates = Settings.get('smsTemplates') || {};
              return `
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">${t.label}</label>
                  <textarea id="sms-${t.id}" rows="3" placeholder="${t.placeholder}"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none">${templates[t.id]||''}</textarea>
                  <p class="text-xs text-gray-400 mt-0.5">사용 가능 변수: {예약번호}, {날짜}, {시간}, {지역명}, {인원}, {금액}</p>
                </div>
              `;
            }).join('')}
            <button onclick="AdminModule.saveSmsTemplates()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">SMS 템플릿 저장</button>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-800 mb-4">시스템 초기화</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p class="text-sm font-medium text-gray-800">관리자 설정 초기화</p>
                <p class="text-xs text-gray-500">모든 localStorage 설정을 기본값으로 되돌립니다.</p>
              </div>
              <button onclick="AdminModule.resetSettings()" class="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs hover:bg-red-100">초기화</button>
            </div>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('settings-admin', content, '시스템 설정');
  };

  const saveSmsTemplates = () => {
    const templates = {};
    ['bookingConfirm','reminder','suspension'].forEach(id => {
      const el = document.getElementById(`sms-${id}`); if(el) templates[id] = el.value;
    });
    Settings.set('smsTemplates', templates);
    Utils.toast('SMS 템플릿이 저장되었습니다.', 'success');
  };
  const resetSettings = () => { Utils.confirm('모든 관리자 설정을 기본값으로 초기화하시겠습니까?', () => { Settings.reset(); Utils.toast('설정이 초기화되었습니다.', 'success'); }); };

  // ── 백업/로그 ──────────────────────────────────────────────
  
  // ── 여행 가이드 관리 ─────────────────────────────────────
  const travelGuidesPage = async () => {
    _adminState.currentSection = 'travel-guides';
    const user = _adminState.user || { role: 'super', regionId: null };
    const regRes = await API.get('/api/regions');
    const allRegions = regRes.data || [];
    const regions = user.role === 'regional' && user.regionId
      ? allRegions.filter(r => r.id === user.regionId)
      : allRegions;
    const activeRegionId = _adminState.selectedRegion || regions[0]?.id || '';
    const guidesRes = await API.get(`/api/guides/all${activeRegionId ? '?regionId='+activeRegionId : ''}`);
    const guides = guidesRes.data || [];
    const regionTabs = regions.map(r => `
      <button onclick="AdminModule.selectGuideRegion('${r.id}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${r.id===activeRegionId?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
        ${r.name}
      </button>`).join('');
    const typeMap = { daytrip:'당일치기', overnight:'1박2일', package:'패키지' };
    const rows = guides.map(g => `
      <tr class="hover:bg-gray-50 border-b border-gray-100">
        <td class="px-4 py-3"><img src="${g.imageUrl||''}" class="w-16 h-10 object-cover rounded" onerror="this.style.display='none'"></td>
        <td class="px-4 py-3 text-sm font-medium">${g.title}</td>
        <td class="px-4 py-3 text-sm text-gray-500">${g.description||''}</td>
        <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-bold ${g.type==='overnight'?'bg-purple-100 text-purple-700':'bg-cyan-100 text-cyan-700'}">${typeMap[g.type]||g.type}</span></td>
        <td class="px-4 py-3 text-center text-sm">${g.duration}</td>
        <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs ${g.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}">${g.isActive?'활성':'비활성'}</span></td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          <button onclick="AdminModule.editGuide('${g.id}')" class="text-blue-600 hover:underline text-xs mr-2">수정</button>
          <button onclick="AdminModule.deleteGuide('${g.id}')" class="text-red-500 hover:underline text-xs">삭제</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="7" class="py-8 text-center text-gray-400">등록된 여행 가이드가 없습니다</td></tr>';
    return renderAdminLayout('travel-guides', `
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800">여행 가이드 관리</h2>
        <button onclick="AdminModule.addGuide('${activeRegionId}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ 가이드 추가</button>
      </div>
      ${user.role !== 'regional' ? `<div class="flex gap-2 mb-4 flex-wrap">${regionTabs}</div>` : ''}
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50"><tr>
            ${['이미지','제목','설명','유형','소요시간','상태','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <!-- 가이드 추가/수정 모달 -->
      <div id="guide-modal" class="modal-overlay hidden" onclick="if(event.target===this)this.classList.add('hidden')">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" onclick="event.stopPropagation()">
          <h3 id="guide-modal-title" class="text-lg font-bold mb-4">여행 가이드 추가</h3>
          <div class="space-y-3">
            <div><label class="text-xs font-medium text-gray-700 mb-1 block">제목 *</label>
              <input id="g-title" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="예: 부여 당일치기 여행코스"></div>
            <div><label class="text-xs font-medium text-gray-700 mb-1 block">설명</label>
              <textarea id="g-desc" class="w-full border rounded-lg px-3 py-2 text-sm h-20" placeholder="코스 설명"></textarea></div>
            <div><label class="text-xs font-medium text-gray-700 mb-1 block">대표 이미지 URL</label>
              <input id="g-img" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..."></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-medium text-gray-700 mb-1 block">유형</label>
                <select id="g-type" class="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="daytrip">당일치기</option>
                  <option value="overnight">1박2일</option>
                  <option value="package">패키지</option>
                </select></div>
              <div><label class="text-xs font-medium text-gray-700 mb-1 block">소요시간</label>
                <input id="g-duration" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="예: 4시간, 1박2일"></div>
            </div>
            <div><label class="text-xs font-medium text-gray-700 mb-1 block">태그 (쉼표 구분)</label>
              <input id="g-tags" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="가족, 커플, 역사"></div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="g-active" checked class="rounded">
              <label class="text-sm text-gray-700" for="g-active">활성화</label>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="AdminModule.saveGuide()" class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">저장</button>
            <button onclick="document.getElementById('guide-modal').classList.add('hidden')" class="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>`, '여행 가이드 관리');
  };

  let _editingGuideId = null;
  let _editingGuideRegion = null;

  const selectGuideRegion = (regionId) => {
    _adminState.selectedRegion = regionId;
    travelGuidesPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const addGuide = (regionId) => {
    _editingGuideId = null;
    _editingGuideRegion = regionId;
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val||''; };
    document.getElementById('guide-modal-title').textContent = '여행 가이드 추가';
    set('g-title',''); set('g-desc',''); set('g-img',''); set('g-type','daytrip');
    set('g-duration','4시간'); set('g-tags','');
    const activeEl = document.getElementById('g-active'); if(activeEl) activeEl.checked = true;
    document.getElementById('guide-modal').classList.remove('hidden');
  };

  const editGuide = async (guideId) => {
    const res = await API.get('/api/guides/all');
    const g = (res.data||[]).find(x => x.id === guideId);
    if (!g) return;
    _editingGuideId = guideId;
    _editingGuideRegion = g.regionId;
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val??''; };
    document.getElementById('guide-modal-title').textContent = '여행 가이드 수정';
    set('g-title', g.title); set('g-desc', g.description); set('g-img', g.imageUrl);
    set('g-type', g.type); set('g-duration', g.duration);
    set('g-tags', (g.tags||[]).join(', '));
    const activeEl = document.getElementById('g-active'); if(activeEl) activeEl.checked = g.isActive;
    document.getElementById('guide-modal').classList.remove('hidden');
  };

  const saveGuide = async () => {
    const get = (id) => document.getElementById(id)?.value?.trim()||'';
    const title = get('g-title');
    if (!title) { Utils.toast('제목을 입력하세요', 'error'); return; }
    const tags = get('g-tags').split(',').map(t=>t.trim()).filter(Boolean);
    const isActive = document.getElementById('g-active')?.checked ?? true;
    const data = { title, description: get('g-desc'), imageUrl: get('g-img'),
      type: get('g-type'), duration: get('g-duration'), tags, isActive,
      regionId: _editingGuideRegion };
    Utils.loading(true);
    const res = _editingGuideId
      ? await API.put(`/api/guides/${_editingGuideId}`, data)
      : await API.post('/api/guides', data);
    Utils.loading(false);
    if (res.success) {
      document.getElementById('guide-modal').classList.add('hidden');
      Utils.toast(_editingGuideId ? '수정되었습니다.' : '추가되었습니다.', 'success');
      travelGuidesPage().then(html => { document.getElementById('app').innerHTML = html; });
    } else Utils.toast(res.message||'저장 실패', 'error');
  };

  const deleteGuide = (guideId) => {
    Utils.confirm('이 여행 가이드를 삭제하시겠습니까?', async () => {
      Utils.loading(true);
      const res = await API.delete(`/api/guides/${guideId}`);
      Utils.loading(false);
      Utils.closeModal();
      if (res.success) {
        Utils.toast('삭제되었습니다.', 'success');
        travelGuidesPage().then(html => { document.getElementById('app').innerHTML = html; });
      } else Utils.toast('삭제 실패', 'error');
    });
  };

  // ── 파트너(숙박/식당) 관리 ──────────────────────────────────
  const partnersPage = async () => {
    _adminState.currentSection = 'partners';
    const user = _adminState.user || { role: 'super', regionId: null };
    const regRes = await API.get('/api/regions');
    const allRegions = regRes.data || [];
    const regions = user.role === 'regional' && user.regionId
      ? allRegions.filter(r => r.id === user.regionId)
      : allRegions;
    const activeRegionId = _adminState.selectedRegion || regions[0]?.id || '';
    const pRes = await API.get(`/api/guides/partners/all${activeRegionId ? '?regionId='+activeRegionId : ''}`);
    const partners = pRes.data || [];
    const regionTabs = regions.map(r => `
      <button onclick="AdminModule.selectPartnerRegion('${r.id}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${r.id===activeRegionId?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
        ${r.name}
      </button>`).join('');
    const typeIcon = { hotel:'🏨', pension:'🏡', restaurant:'🍽️', cafe:'☕' };
    const typeLabel = { hotel:'숙박', pension:'펜션', restaurant:'식당', cafe:'카페' };
    const rows = partners.map(p => `
      <tr class="hover:bg-gray-50 border-b border-gray-100">
        <td class="px-4 py-3 text-center">${typeIcon[p.type]||'🏢'}</td>
        <td class="px-4 py-3 text-sm font-medium">${p.name}</td>
        <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">${typeLabel[p.type]||p.type}</span></td>
        <td class="px-4 py-3 text-sm text-gray-500 text-xs">${p.discountInfo||'-'}</td>
        <td class="px-4 py-3 text-sm text-gray-500 text-xs">${p.phone||'-'}</td>
        <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs ${p.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}">${p.isActive?'활성':'비활성'}</span></td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          <button onclick="AdminModule.editPartner('${p.id}')" class="text-blue-600 hover:underline text-xs mr-2">수정</button>
          <button onclick="AdminModule.deletePartner('${p.id}')" class="text-red-500 hover:underline text-xs">삭제</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="7" class="py-8 text-center text-gray-400">등록된 파트너가 없습니다</td></tr>';
    return renderAdminLayout('partners', `
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800">파트너 관리 (숙박·식당·카페)</h2>
        <button onclick="AdminModule.addPartner('${activeRegionId}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ 파트너 추가</button>
      </div>
      ${user.role !== 'regional' ? `<div class="flex gap-2 mb-4 flex-wrap">${regionTabs}</div>` : ''}
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50"><tr>
            ${['유형','업체명','분류','할인혜택','전화','상태','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <!-- 파트너 추가/수정 모달 -->
      <div id="partner-modal" class="modal-overlay hidden" onclick="if(event.target===this)this.classList.add('hidden')">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-screen overflow-y-auto" onclick="event.stopPropagation()">
          <h3 id="partner-modal-title" class="text-lg font-bold mb-4">파트너 추가</h3>
          <div class="space-y-3">
            <div><label class="text-xs font-medium text-gray-700 mb-1 block">업체명 *</label>
              <input id="p-name" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="예: 통영 한산마리나호텔"></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-medium text-gray-700 mb-1 block">분류</label>
                <select id="p-type" class="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="hotel">🏨 숙박</option>
                  <option value="pension">🏡 펜션</option>
                  <option value="restaurant">🍽️ 식당</option>
                  <option value="cafe">☕ 카페</option>
                </select></div>
              <div><label class="text-xs font-medium text-gray-700 mb-1 block">전화번호</label>
                <input id="p-phone" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0xx-xxx-xxxx"></div>
            </div>
            <div><label class="text-xs font-medium text-gray-700 mb-1 block">설명</label>
              <textarea id="p-desc" class="w-full border rounded-lg px-3 py-2 text-sm h-16"></textarea></div>
            <div><label class="text-xs font-medium text-gray-700 mb-1 block">주소</label>
              <input id="p-address" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
            <div><label class="text-xs font-medium text-gray-700 mb-1 block">예약 URL</label>
              <input id="p-url" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..."></div>
            <div><label class="text-xs font-medium text-gray-700 mb-1 block">대표 이미지 URL</label>
              <input id="p-img" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..."></div>
            <div><label class="text-xs font-medium text-gray-700 mb-1 block">🎁 할인 혜택 (수륙양용투어 예약자 대상)</label>
              <input id="p-discount" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="예: 탑승권 제시 시 10% 할인"></div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="p-active" checked class="rounded">
              <label class="text-sm text-gray-700" for="p-active">활성화</label>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="AdminModule.savePartner()" class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">저장</button>
            <button onclick="document.getElementById('partner-modal').classList.add('hidden')" class="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>`, '파트너 관리');
  };

  let _editingPartnerId = null;
  let _editingPartnerRegion = null;

  const selectPartnerRegion = (regionId) => {
    _adminState.selectedRegion = regionId;
    partnersPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const addPartner = (regionId) => {
    _editingPartnerId = null;
    _editingPartnerRegion = regionId;
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val||''; };
    document.getElementById('partner-modal-title').textContent = '파트너 추가';
    ['p-name','p-phone','p-desc','p-address','p-url','p-img','p-discount'].forEach(id => set(id,''));
    set('p-type','hotel');
    const activeEl = document.getElementById('p-active'); if(activeEl) activeEl.checked = true;
    document.getElementById('partner-modal').classList.remove('hidden');
  };

  const editPartner = async (partnerId) => {
    const res = await API.get('/api/guides/partners/all');
    const p = (res.data||[]).find(x => x.id === partnerId);
    if (!p) return;
    _editingPartnerId = partnerId;
    _editingPartnerRegion = p.regionId;
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val??''; };
    document.getElementById('partner-modal-title').textContent = '파트너 수정';
    set('p-name', p.name); set('p-type', p.type); set('p-phone', p.phone);
    set('p-desc', p.description); set('p-address', p.address);
    set('p-url', p.url); set('p-img', p.imageUrl); set('p-discount', p.discountInfo);
    const activeEl = document.getElementById('p-active'); if(activeEl) activeEl.checked = p.isActive;
    document.getElementById('partner-modal').classList.remove('hidden');
  };

  const savePartner = async () => {
    const get = (id) => document.getElementById(id)?.value?.trim()||'';
    const name = get('p-name');
    if (!name) { Utils.toast('업체명을 입력하세요', 'error'); return; }
    const isActive = document.getElementById('p-active')?.checked ?? true;
    const data = { name, type: get('p-type'), phone: get('p-phone'),
      description: get('p-desc'), address: get('p-address'),
      url: get('p-url'), imageUrl: get('p-img'), discountInfo: get('p-discount'),
      isActive, regionId: _editingPartnerRegion };
    Utils.loading(true);
    const res = _editingPartnerId
      ? await API.put(`/api/guides/partners/${_editingPartnerId}`, data)
      : await API.post('/api/guides/partners', data);
    Utils.loading(false);
    if (res.success) {
      document.getElementById('partner-modal').classList.add('hidden');
      Utils.toast(_editingPartnerId ? '수정되었습니다.' : '추가되었습니다.', 'success');
      partnersPage().then(html => { document.getElementById('app').innerHTML = html; });
    } else Utils.toast(res.message||'저장 실패', 'error');
  };

  const deletePartner = (partnerId) => {
    Utils.confirm('이 파트너를 삭제하시겠습니까?', async () => {
      Utils.loading(true);
      const res = await API.delete(`/api/guides/partners/${partnerId}`);
      Utils.loading(false);
      Utils.closeModal();
      if (res.success) {
        Utils.toast('삭제되었습니다.', 'success');
        partnersPage().then(html => { document.getElementById('app').innerHTML = html; });
      } else Utils.toast('삭제 실패', 'error');
    });
  };

const backupPage = async () => {
    _adminState.currentSection = 'backup';
    // 실제 admin_logs API 호출
    let logRows = [];
    let logTotal = 0;
    try {
      const resp = await API.get('/api/admin/logs?limit=50');
      if (resp.success) { logRows = resp.data || []; logTotal = resp.total || 0; }
    } catch(e) {}

    const actionColor = (a) => {
      if (a.includes('로그인')) return 'text-blue-600';
      if (a.includes('취소') || a.includes('삭제')) return 'text-red-600';
      if (a.includes('환불') || a.includes('배불')) return 'text-orange-600';
      if (a.includes('등록') || a.includes('저장')) return 'text-green-600';
      if (a.includes('로그아웃')) return 'text-gray-500';
      return 'text-gray-700';
    };

    const logHtml = logRows.length ? logRows.map(l => `
      <div class="flex gap-2 py-1 border-b border-gray-100 last:border-0">
        <span class="text-gray-400 shrink-0 w-36">${(l.created_at||'').slice(0,16)}</span>
        <span class="font-medium ${actionColor(l.action)} w-20 shrink-0">[${l.action}]</span>
        <span class="text-gray-600 shrink-0 w-24">${l.admin_name||''}</span>
        <span class="text-gray-500 truncate">${l.detail||''}</span>
      </div>`).join('') : '<p class="text-gray-400">로그 데이터가 없습니다.</p>';

    const content = `
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="font-semibold text-gray-800 mb-4"><i class="fas fa-database text-blue-500 mr-2"></i>데이터 백업</h2>
            <div class="space-y-3">
              <button onclick="Utils.toast('예약 데이터 백업 다운로드 시작', 'success')" class="w-full border rounded-lg px-4 py-3 text-sm text-left hover:bg-gray-50 flex items-center justify-between">
                <span><i class="fas fa-ticket-alt mr-2 text-blue-500"></i>예약 데이터 (CSV)</span>
                <i class="fas fa-download text-gray-400"></i>
              </button>
              <button onclick="Utils.toast('정산 데이터 백업 다운로드 시작', 'success')" class="w-full border rounded-lg px-4 py-3 text-sm text-left hover:bg-gray-50 flex items-center justify-between">
                <span><i class="fas fa-calculator mr-2 text-green-500"></i>정산 데이터 (Excel)</span>
                <i class="fas fa-download text-gray-400"></i>
              </button>
              <button onclick="Utils.toast('전체 설정 백업 다운로드 시작', 'success')" class="w-full border rounded-lg px-4 py-3 text-sm text-left hover:bg-gray-50 flex items-center justify-between">
                <span><i class="fas fa-cog mr-2 text-purple-500"></i>시스템 설정 (JSON)</span>
                <i class="fas fa-download text-gray-400"></i>
              </button>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-semibold text-gray-800"><i class="fas fa-list text-orange-500 mr-2"></i>관리자 활동 로그</h2>
              <span class="text-xs text-gray-400">전체 ${logTotal.toLocaleString()}건 (최근 50건)</span>
            </div>
            <div class="space-y-0 text-xs font-mono text-gray-600 bg-gray-50 rounded-lg p-3 h-64 overflow-y-auto">
              ${logHtml}
            </div>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('backup', content, '백업/로그');
  };

  // ── 관광정보 관리 ───────────────────────────────────────────
  const TOURISM_STORE_KEY = 'amk_tourism_contents';
  const TOURISM_TYPES = [
    { id:'attraction', label:'관광지',   icon:'fas fa-landmark',    color:'blue'   },
    { id:'restaurant', label:'맛집',     icon:'fas fa-utensils',    color:'red'    },
    { id:'cafe',       label:'카페',     icon:'fas fa-coffee',      color:'amber'  },
    { id:'course',     label:'코스',     icon:'fas fa-route',       color:'green'  },
    { id:'lodging',    label:'숙박',     icon:'fas fa-bed',         color:'purple' },
    { id:'parking',    label:'주차',     icon:'fas fa-parking',     color:'gray'   },
    { id:'toilet',     label:'화장실',   icon:'fas fa-restroom',    color:'gray'   },
    { id:'partner',    label:'제휴업체', icon:'fas fa-handshake',   color:'indigo' },
    { id:'event',      label:'이벤트',   icon:'fas fa-calendar-star',color:'pink'  },
    { id:'etc',        label:'기타',     icon:'fas fa-ellipsis-h',  color:'gray'   },
  ];
  // ★ localStorage 사용 → 고객 페이지와 데이터 공유 가능 (sessionStorage는 탭/새로고침 시 소멸)
  const _getTourismContents = () => JSON.parse(localStorage.getItem(TOURISM_STORE_KEY) || '[]');
  const _setTourismContents = (list) => localStorage.setItem(TOURISM_STORE_KEY, JSON.stringify(list));

  // 관광정보 관리 페이지
  const tourismManagePage = async () => {
    _adminState.currentSection = 'tourism';
    const user = _adminState.user || {};
    const isSuper = user.role === 'super' || user.role === 'content';
    const userRegionId = user.regionId || null;

    // 지역 필터
    const filterRegion = _adminState.tourismFilter?.region ||
      (userRegionId ? userRegionId : 'all');
    const filterType = _adminState.tourismFilter?.type || 'all';

    const allContents = _getTourismContents();
    // 데모 초기 데이터 (없을 경우)
    if (allContents.length === 0) {
      const demoContents = [
        { id:1, regionId:'buyeo', type:'attraction', title:'부소산성', desc:'백제 왕도의 핵심 유적지. 낙화암, 고란사 등을 포함합니다.', address:'충남 부여군 부여읍 관북리', mapLink:'https://maps.google.com', phone:'041-830-2330', hours:'09:00~18:00', tags:['백제','역사','유네스코'], visible:true, order:1 },
        { id:2, regionId:'buyeo', type:'restaurant', title:'부여한정식', desc:'백제 전통 음식을 현대적으로 재해석한 한정식 맛집.', address:'충남 부여군 부여읍', mapLink:'', phone:'041-830-0000', hours:'11:00~21:00', tags:['한식','전통'], visible:true, order:2 },
        { id:3, regionId:'tongyeong', type:'attraction', title:'한산도 이충무공 유적', desc:'이순신 장군의 주요 거점이었던 역사 유적지.', address:'경남 통영시 한산면', mapLink:'https://maps.google.com', phone:'055-650-4681', hours:'09:00~18:00', tags:['이순신','역사'], visible:true, order:1 },
        { id:4, regionId:'hapcheon', type:'course', title:'합천 드라이브 코스', desc:'합천호를 따라 달리는 아름다운 드라이브 코스.', address:'경남 합천군', mapLink:'', phone:'', hours:'상시', tags:['드라이브','자연'], visible:true, order:1 },
      ];
      _setTourismContents(demoContents);
    }

    // 필터 적용
    let contents = _getTourismContents();
    if (userRegionId && user.role === 'regional') {
      contents = contents.filter(c => c.regionId === userRegionId);
    } else if (filterRegion !== 'all') {
      contents = contents.filter(c => c.regionId === filterRegion);
    }
    if (filterType !== 'all') contents = contents.filter(c => c.type === filterType);

    const allRegions = (window.REGIONS||[]).filter(r=>r.status!=='hidden');
    const regionName = (id) => {
      if (id==='buyeo') return '부여'; if (id==='tongyeong') return '통영'; if (id==='hapcheon') return '합천';
      return allRegions.find(r=>r.id===id)?.name || id;
    };

    // 지역 필터 탭 (슈퍼/콘텐츠만)
    const regionFilterHtml = isSuper ? `
      <div class="flex gap-2 flex-wrap">
        ${[{id:'all',label:'전체'},...(['tongyeong','buyeo','hapcheon'].map(id=>({id,label:regionName(id)})))].map(r=>`
          <button onclick="AdminModule.setTourismFilter('region','${r.id}')"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterRegion===r.id?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
            ${r.label}
          </button>`).join('')}
      </div>` : `<span class="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"><i class="fas fa-map-marker-alt mr-1"></i>${regionName(userRegionId)} 전용</span>`;

    // 유형 필터 탭
    const typeFilterHtml = `
      <div class="flex gap-2 flex-wrap">
        <button onclick="AdminModule.setTourismFilter('type','all')"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType==='all'?'bg-gray-700 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">전체</button>
        ${TOURISM_TYPES.map(t=>`
          <button onclick="AdminModule.setTourismFilter('type','${t.id}')"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType===t.id?'bg-'+t.color+'-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
            <i class="${t.icon} mr-1"></i>${t.label}
          </button>`).join('')}
      </div>`;

    // 콘텐츠 카드 목록
    const contentCards = contents.length === 0
      ? `<div class="col-span-full text-center py-16 text-gray-400">
          <i class="fas fa-map-marked-alt text-4xl mb-3"></i>
          <p class="text-sm">등록된 관광정보가 없습니다.</p>
          <button onclick="AdminModule.addTourism()" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">첫 콘텐츠 등록하기</button>
        </div>`
      : contents.sort((a,b)=>(a.order||99)-(b.order||99)).map(c => {
          const tt = TOURISM_TYPES.find(t=>t.id===c.type) || TOURISM_TYPES[9];
          return `
            <div class="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${!c.visible?'opacity-60':''}">
              <div class="h-2 bg-${tt.color}-400"></div>
              <div class="p-4">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 bg-${tt.color}-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i class="${tt.icon} text-${tt.color}-600 text-xs"></i>
                    </span>
                    <div>
                      <div class="font-semibold text-gray-800 text-sm">${c.title}</div>
                      <div class="text-xs text-gray-400">${regionName(c.regionId)} · ${tt.label}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <span class="px-1.5 py-0.5 rounded text-xs ${c.visible?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}">${c.visible?'공개':'비공개'}</span>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mb-3 line-clamp-2">${c.desc}</p>
                ${c.address ? `<p class="text-xs text-gray-400 mb-1"><i class="fas fa-map-marker-alt mr-1"></i>${c.address}</p>` : ''}
                ${c.phone ? `<p class="text-xs text-gray-400 mb-1"><i class="fas fa-phone mr-1"></i>${c.phone}</p>` : ''}
                ${c.hours ? `<p class="text-xs text-gray-400 mb-2"><i class="fas fa-clock mr-1"></i>${c.hours}</p>` : ''}
                ${c.tags?.length ? `<div class="flex flex-wrap gap-1 mb-3">${c.tags.map(t=>`<span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">#${t}</span>`).join('')}</div>` : ''}
                <div class="flex gap-2 border-t pt-3">
                  <button onclick="AdminModule.editTourism(${c.id})" class="flex-1 text-blue-600 border border-blue-200 py-1.5 rounded-lg text-xs hover:bg-blue-50">수정</button>
                  <button onclick="AdminModule.toggleTourismVisible(${c.id})" class="text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">
                    ${c.visible?'숨기기':'공개'}
                  </button>
                  ${isSuper ? `<button onclick="AdminModule.deleteTourism(${c.id})" class="text-red-500 border border-red-200 px-3 py-1.5 rounded-lg text-xs hover:bg-red-50">삭제</button>` : ''}
                </div>
              </div>
            </div>`;
        }).join('');

    const content = `
      <div class="space-y-6">
        <!-- 헤더 -->
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
              <i class="fas fa-map-marked-alt text-white"></i>
            </div>
            <div>
              <h2 class="font-semibold text-gray-800">관광정보 관리</h2>
              <p class="text-xs text-gray-500">등록 즉시 고객 지역 페이지에 반영됩니다</p>
            </div>
          </div>
          <button onclick="AdminModule.addTourism()"
            class="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 flex items-center gap-2">
            <i class="fas fa-plus"></i>콘텐츠 등록
          </button>
        </div>

        <!-- 지역 필터 -->
        <div class="bg-white rounded-xl shadow-sm p-4 space-y-3">
          ${regionFilterHtml}
          <div class="border-t pt-3">${typeFilterHtml}</div>
          <div class="text-xs text-gray-400 text-right">${contents.length}건 표시중</div>
        </div>

        <!-- 콘텐츠 카드 그리드 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${contentCards}</div>

        ${!isSuper ? `
          <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
            <i class="fas fa-info-circle"></i>
            <span>완전 삭제는 본사 슈퍼관리자만 가능합니다. "숨기기"로 비공개 처리할 수 있습니다.</span>
          </div>` : ''}
      </div>

      <!-- 관광정보 등록/수정 모달 -->
      <div id="tourism-modal" class="modal-overlay hidden" onclick="if(event.target===this)this.classList.add('hidden')">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-semibold text-gray-800 text-lg" id="tourism-modal-title">관광정보 등록</h3>
            <button onclick="document.getElementById('tourism-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="${isSuper?'':'hidden'}">
              <label class="block text-xs font-medium text-gray-700 mb-1">지역 <span class="text-red-500">*</span></label>
              <select id="tm-region" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                ${['tongyeong','buyeo','hapcheon'].map(id=>`<option value="${id}">${regionName(id)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">유형 <span class="text-red-500">*</span></label>
              <select id="tm-type" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                ${TOURISM_TYPES.map(t=>`<option value="${t.id}">${t.label}</option>`).join('')}
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">제목 <span class="text-red-500">*</span></label>
              <input id="tm-title" type="text" placeholder="관광지/맛집/카페 이름" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">설명</label>
              <textarea id="tm-desc" rows="3" placeholder="간단한 소개를 입력해주세요" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"></textarea>
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">주소</label>
              <input id="tm-address" type="text" placeholder="도로명 주소" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">지도 링크</label>
              <input id="tm-map" type="url" placeholder="https://map.naver.com/..." class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">전화번호</label>
              <input id="tm-phone" type="tel" placeholder="031-123-4567" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">운영시간</label>
              <input id="tm-hours" type="text" placeholder="09:00~18:00" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">노출 순서</label>
              <input id="tm-order" type="number" min="1" value="99" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">이미지 URL</label>
              <input id="tm-image" type="url" placeholder="https://..." class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">태그 (쉼표로 구분)</label>
              <input id="tm-tags" type="text" placeholder="역사, 유네스코, 백제" class="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
            </div>
            <div class="col-span-2 flex items-center gap-3">
              <input type="checkbox" id="tm-visible" checked class="rounded text-teal-600 w-4 h-4">
              <label for="tm-visible" class="text-sm text-gray-700 cursor-pointer">고객 페이지에 공개</label>
            </div>
          </div>
          <div class="flex gap-2 mt-5">
            <button onclick="AdminModule.saveTourism()"
              class="flex-1 bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">저장</button>
            <button onclick="document.getElementById('tourism-modal').classList.add('hidden')"
              class="flex-1 border py-2.5 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('tourism', content, '관광정보 관리');
  };

  // 관광정보 필터 변경
  const setTourismFilter = (key, val) => {
    if (!_adminState.tourismFilter) _adminState.tourismFilter = {};
    _adminState.tourismFilter[key] = val;
    tourismManagePage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  let _editingTourismId = null;

  const addTourism = () => {
    _editingTourismId = null;
    const user = _adminState.user || {};
    document.getElementById('tourism-modal-title').textContent = '관광정보 등록';
    ['tm-title','tm-desc','tm-address','tm-map','tm-phone','tm-hours','tm-tags','tm-image'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
    const tmRegion = document.getElementById('tm-region');
    if (tmRegion && user.regionId) tmRegion.value = user.regionId;
    const tmOrder = document.getElementById('tm-order'); if(tmOrder) tmOrder.value = 99;
    const tmVisible = document.getElementById('tm-visible'); if(tmVisible) tmVisible.checked = true;
    document.getElementById('tourism-modal').classList.remove('hidden');
  };

  const editTourism = (id) => {
    const contents = _getTourismContents();
    const c = contents.find(x=>x.id===id);
    if (!c) return;
    _editingTourismId = id;
    document.getElementById('tourism-modal-title').textContent = '관광정보 수정';
    const set = (eid, v) => { const el=document.getElementById(eid); if(el) el.value=v||''; };
    set('tm-title', c.title); set('tm-desc', c.desc); set('tm-address', c.address);
    set('tm-map', c.mapLink); set('tm-phone', c.phone); set('tm-hours', c.hours);
    set('tm-image', c.image); set('tm-order', c.order||99);
    set('tm-tags', (c.tags||[]).join(', '));
    const tmRegion = document.getElementById('tm-region'); if(tmRegion) tmRegion.value = c.regionId;
    const tmType = document.getElementById('tm-type'); if(tmType) tmType.value = c.type;
    const tmVisible = document.getElementById('tm-visible'); if(tmVisible) tmVisible.checked = !!c.visible;
    document.getElementById('tourism-modal').classList.remove('hidden');
  };

  const saveTourism = () => {
    const get = (id) => document.getElementById(id)?.value || '';
    const user = _adminState.user || {};
    const title = get('tm-title').trim();
    if (!title) { Utils.toast('제목을 입력하세요', 'error'); return; }
    const regionId = user.role === 'regional' ? (user.regionId||get('tm-region')) : get('tm-region');
    const contents = _getTourismContents();
    const item = {
      id: _editingTourismId || (Date.now()),
      regionId,
      type: get('tm-type') || 'attraction',
      title,
      desc: get('tm-desc'),
      address: get('tm-address'),
      mapLink: get('tm-map'),
      phone: get('tm-phone'),
      hours: get('tm-hours'),
      image: get('tm-image'),
      tags: get('tm-tags').split(',').map(t=>t.trim()).filter(Boolean),
      order: parseInt(get('tm-order'))||99,
      visible: document.getElementById('tm-visible')?.checked !== false,
      updatedAt: new Date().toLocaleDateString('ko-KR'),
    };
    if (_editingTourismId) {
      const idx = contents.findIndex(x=>x.id===_editingTourismId);
      if (idx>=0) contents[idx] = item;
    } else {
      contents.push(item);
    }
    _setTourismContents(contents);
    Utils.toast(_editingTourismId ? '관광정보가 수정되었습니다.' : '관광정보가 등록되었습니다. 고객 페이지에 즉시 반영됩니다.', 'success');
    document.getElementById('tourism-modal').classList.add('hidden');
    tourismManagePage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const toggleTourismVisible = (id) => {
    const contents = _getTourismContents();
    const c = contents.find(x=>x.id===id);
    if (!c) return;
    c.visible = !c.visible;
    _setTourismContents(contents);
    Utils.toast(c.visible ? '콘텐츠가 공개되었습니다.' : '콘텐츠가 비공개 처리되었습니다.', 'success');
    tourismManagePage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const deleteTourism = (id) => {
    Utils.confirm('이 콘텐츠를 완전히 삭제하시겠습니까?<br><span class="text-xs text-gray-500">삭제 후에는 복구할 수 없습니다.</span>', () => {
      const contents = _getTourismContents().filter(x=>x.id!==id);
      _setTourismContents(contents);
      Utils.toast('콘텐츠가 삭제되었습니다.', 'success');
      tourismManagePage().then(html => { document.getElementById('app').innerHTML = html; });
    });
  };

  // ── 통계 빠른 링크 ─────────────────────────────────────────
  const statsAdminPage = async () => {
    _adminState.currentSection = 'stats-admin';
    return renderAdminLayout('stats-admin', `
      <div class="flex items-center justify-center min-h-64">
        <div class="text-center">
          <i class="fas fa-chart-bar text-blue-400 text-5xl mb-4"></i>
          <p class="text-gray-600 font-medium">통계 모듈 로딩 중...</p>
          <p class="text-sm text-gray-400 mt-1">Stats 모듈에서 관리됩니다.</p>
          <button onclick="Router.go('/stats')" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            통계 페이지로 이동
          </button>
        </div>
      </div>
    `, '통계/보고서');
  };

  // ── navigate 라우터 (tourism 추가) ──────────────────────────
  const _navigateInternal = (section, params) => {
    const pageMap = {
      'hq-dashboard': () => hqDashboard(),
      'region-dashboard': () => regionDashboard(params),
      'vehicles': () => vehiclesPage(_adminState.vehicleRegionFilter),
      'schedules': () => schedulesPage(),
      'fares': () => faresPage(),
      'seats': () => seatsPage(),
      'reservations': () => reservationsPage(),
      'inquiries': () => inquiriesPage(),
      'wristbands': () => wristbandsPage(),
      'popups': () => popupsPage(),
      'terms': () => termsPage(),
      'seo': () => seoManagePage(),
      'sms': () => smsPage(),
      'regions': () => regionsPage(),
      'settlement': () => settlementPage(),
      'admins': () => adminsPage(),
      'settings-admin': () => settingsAdminPage(),
      'backup': () => backupPage(),
      'stats-admin': () => statsAdminPage(),
      'tourism': () => tourismManagePage(),
      'travel-guides': () => travelGuidesPage(),
      'partners': () => partnersPage(),
      'staff': () => staffPage(),
      'work-log': () => workLogPage(),
      'reports': () => statsAdminPage(), // /admin/reports → statsAdminPage
    };
    return pageMap[section] ? pageMap[section]() : hqDashboard();
  };

  // ══════════════════════════════════════════════════════════
  // 근무일지 페이지
  // ══════════════════════════════════════════════════════════
  const workLogPage = async () => {
    _adminState.currentSection = 'work-log';
    const user = _adminState.user || {};
    const isSuper = user.role === 'super';

    // 상태: 선택한 지역/월
    if (!window._wlState) window._wlState = {};
    const today = new Date();
    const wlState = window._wlState;
    if (!wlState.year) wlState.year = today.getFullYear();
    if (!wlState.month) wlState.month = today.getMonth() + 1;
    if (!wlState.regionId) wlState.regionId = user.regionId || 'tongyeong';

    const year = wlState.year;
    const month = wlState.month;
    const regionId = wlState.regionId;
    const monthStr = `${year}-${String(month).padStart(2,'0')}`;

    // 데이터 로드
    const [assignRes, dayoffRes, staffRes, scheduleRes] = await Promise.all([
      API.get(`/api/assignment/monthly?regionId=${regionId}&year=${year}&month=${month}`),
      API.get(`/api/assignment/dayoff?regionId=${regionId}&startDate=${monthStr}-01&endDate=${monthStr}-31`),
      API.get(`/api/staff?region_id=${regionId}`),
      API.get(`/api/schedules?regionId=${regionId}`),
    ]);

    const assignments = assignRes.success ? assignRes.data : {};
    const dayoffs = dayoffRes.success ? dayoffRes.data : [];
    const staffList = staffRes.success ? staffRes.data : [];
    const schedules = scheduleRes.success ? scheduleRes.data : [];

    // 직원 맵
    const staffMap = {};
    staffList.forEach(s => { staffMap[s.id] = s; });

    // 스케줄 맵 (id → {time, ...})
    const schedMap = {};
    schedules.forEach(sc => { schedMap[sc.id] = sc; });

    // 이번 달 날짜 목록
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({length: daysInMonth}, (_,i) => {
      const d = new Date(year, month-1, i+1);
      const dateStr = d.toISOString().slice(0,10);
      const dayNames = ['일','월','화','수','목','금','토'];
      return { date: dateStr, day: i+1, dayName: dayNames[d.getDay()], isWeekend: d.getDay()===0||d.getDay()===6 };
    });

    // 지역 목록
    const regions = window.REGIONS || [];

    // 지역 탭 (슈퍼관리자만)
    const regionTabsHtml = isSuper ? `
      <div class="flex gap-2 flex-wrap mb-4">
        ${regions.filter(r=>r.status==='active'||r.status==='open').map(r => `
          <button onclick="window._wlState.regionId='${r.id}';AdminModule.navigate('work-log')"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${regionId===r.id?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}">
            ${r.name}
          </button>`).join('')}
      </div>` : '';

    // 월 이동
    const prevMonth = month === 1 ? `year=${year-1}&month=12` : `year=${year}&month=${month-1}`;
    const nextMonth = month === 12 ? `year=${year+1}&month=1` : `year=${year}&month=${month+1}`;

    // 달력 형태로 근무일지 생성
    const calendarRows = days.map(({date, day, dayName, isWeekend}) => {
      const dayAssigns = assignments[date] || [];
      const dayOffs = dayoffs.filter(d => d.off_date === date);
      const offNames = dayOffs.map(d => staffMap[d.staff_id]?.name || d.staff_id).join(', ');

      // 기사/해설사 그룹핑
      const driverAssigns = dayAssigns.filter(a => a.role === 'driver');
      const guideAssigns = dayAssigns.filter(a => a.role === 'guide');

      const assignHtml = dayAssigns.length === 0
        ? '<span class="text-gray-300 text-xs">-</span>'
        : `<div class="space-y-0.5">
            ${driverAssigns.map(a => {
              const sc = schedMap[a.schedule_id] || {};
              return `<div class="text-xs bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 flex items-center gap-1">
                <span class="text-blue-600">🚌</span>
                <span class="font-medium text-blue-800">${a.staff_name||'?'}</span>
                <span class="text-gray-400">${sc.time||''}회</span>
              </div>`;
            }).join('')}
            ${guideAssigns.map(a => {
              const sc = schedMap[a.schedule_id] || {};
              return `<div class="text-xs bg-green-50 border border-green-100 rounded px-1.5 py-0.5 flex items-center gap-1">
                <span class="text-green-600">🎤</span>
                <span class="font-medium text-green-800">${a.staff_name||'?'}</span>
                <span class="text-gray-400">${sc.time||''}회</span>
              </div>`;
            }).join('')}
          </div>`;

      return `
        <tr class="${isWeekend?'bg-red-50/30':''} hover:bg-gray-50 border-b border-gray-100">
          <td class="px-3 py-2 text-center">
            <span class="font-bold text-sm ${isWeekend?'text-red-500':'text-gray-700'}">${day}</span>
            <span class="text-xs ml-1 ${isWeekend?'text-red-400':'text-gray-400'}">${dayName}</span>
          </td>
          <td class="px-3 py-2">${assignHtml}</td>
          <td class="px-3 py-2">
            ${dayOffs.length > 0
              ? `<span class="text-xs bg-red-100 text-red-700 border border-red-200 rounded px-1.5 py-0.5">${offNames}</span>`
              : '<span class="text-gray-300 text-xs">-</span>'}
          </td>
          <td class="px-3 py-2 text-xs text-gray-500">${dayAssigns.length > 0 ? dayAssigns[0]?.notes||'' : ''}</td>
        </tr>`;
    }).join('');

    // 직원별 월간 근무 요약
    const staffSummary = staffList.map(s => {
      const workDays = Object.values(assignments).flat().filter(a => a.staff_name === s.name || a.staff_id === s.id).length;
      const offDays = dayoffs.filter(d => d.staff_id === s.id).length;
      const assignedSchedules = Object.values(assignments).flat().filter(a => a.staff_name === s.name);
      // 차량 정보
      return { ...s, workDays, offDays };
    });

    const summaryRows = staffSummary.map(s => `
      <tr class="hover:bg-gray-50">
        <td class="px-3 py-2">
          <span class="px-2 py-0.5 rounded-full text-xs font-bold ${s.role==='driver'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}">
            ${s.role==='driver'?'🚌 기사':'🎤 해설사'}
          </span>
        </td>
        <td class="px-3 py-2 font-medium text-gray-800">${s.name}</td>
        <td class="px-3 py-2 text-center">
          <span class="font-semibold text-blue-600">${s.workDays}</span><span class="text-xs text-gray-400">회</span>
        </td>
        <td class="px-3 py-2 text-center">
          <span class="font-semibold ${s.offDays>0?'text-red-500':'text-gray-400'}">${s.offDays}</span><span class="text-xs text-gray-400">일</span>
        </td>
        <td class="px-3 py-2 text-center text-xs text-gray-500">${s.phone||'-'}</td>
      </tr>`).join('') || '<tr><td colspan="5" class="text-center py-4 text-gray-400 text-sm">직원이 없습니다.</td></tr>';

    const content = `
      <div class="space-y-4">
        <div class="flex justify-between items-center flex-wrap gap-3">
          <h2 class="font-semibold text-gray-800">
            <i class="fas fa-clipboard-list text-blue-500 mr-2"></i>근무일지
            <span class="ml-2 text-sm font-normal text-gray-500">${year}년 ${month}월 · ${(regions.find(r=>r.id===regionId)||{}).name||regionId}</span>
          </h2>
          <div class="flex items-center gap-2">
            <button onclick="const p='${prevMonth}'.split('&');window._wlState.year=+p[0].split('=')[1];window._wlState.month=+p[1].split('=')[1];AdminModule.navigate('work-log')"
              class="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50">← 이전달</button>
            <span class="font-medium text-gray-700">${year}.${String(month).padStart(2,'0')}</span>
            <button onclick="const n='${nextMonth}'.split('&');window._wlState.year=+n[0].split('=')[1];window._wlState.month=+n[1].split('=')[1];AdminModule.navigate('work-log')"
              class="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50">다음달 →</button>
            <button onclick="AdminModule.autoAssignWorkLog('${regionId}','${monthStr}')"
              class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
              <i class="fas fa-magic"></i>자동배정
            </button>
          </div>
        </div>

        ${regionTabsHtml}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- 월간 달력 근무표 -->
          <div class="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <i class="fas fa-calendar-check text-blue-500"></i>
              <span class="font-medium text-gray-700 text-sm">일별 근무 현황</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50 border-b">
                    <th class="px-3 py-2 text-center text-xs font-semibold text-gray-600 w-16">날짜</th>
                    <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600">배정 기사/해설사</th>
                    <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-28">휴무</th>
                    <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">비고</th>
                  </tr>
                </thead>
                <tbody>${calendarRows}</tbody>
              </table>
            </div>
          </div>

          <!-- 직원별 월간 요약 -->
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <i class="fas fa-users text-green-500"></i>
              <span class="font-medium text-gray-700 text-sm">직원별 월간 요약</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50 border-b">
                    <th class="px-3 py-2 text-xs font-semibold text-gray-600">구분</th>
                    <th class="px-3 py-2 text-xs font-semibold text-gray-600">이름</th>
                    <th class="px-3 py-2 text-center text-xs font-semibold text-gray-600">근무</th>
                    <th class="px-3 py-2 text-center text-xs font-semibold text-gray-600">휴무</th>
                    <th class="px-3 py-2 text-center text-xs font-semibold text-gray-600">연락처</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">${summaryRows}</tbody>
              </table>
            </div>
            <!-- 범례 -->
            <div class="px-4 py-3 border-t bg-gray-50 space-y-1">
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span class="bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 text-blue-600">🚌 기사</span>
                <span class="bg-green-50 border border-green-100 rounded px-1.5 py-0.5 text-green-600">🎤 해설사</span>
                <span class="bg-red-100 text-red-700 rounded px-1.5 py-0.5">휴무</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 휴무 등록 안내 -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
          <i class="fas fa-info-circle mt-0.5 text-amber-500"></i>
          <span>휴무를 등록하면 해당 날짜는 자동배정에서 제외됩니다. 기사/해설사 관리에서 휴무를 먼저 등록한 후 <strong>자동배정</strong>을 실행하면 일정이 갱신됩니다.</span>
        </div>
      </div>
    `;
    return renderAdminLayout('work-log', content, '근무일지');
  };

  // 근무일지 자동배정
  const autoAssignWorkLog = async (regionId, monthStr) => {
    const [year, month] = monthStr.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${monthStr}-01`;
    const endDate = `${monthStr}-${String(lastDay).padStart(2,'0')}`;
    Utils.loading(true);
    try {
      const res = await API.post('/api/assignment/auto', { regionId, startDate, endDate });
      if (res.success) {
        Utils.toast(`✅ 자동배정 완료: 신규 ${res.data.assigned}건 배정, 건너뜀 ${res.data.skipped}건${res.data.conflicts?.length?`, ⚠️ 충돌 ${res.data.conflicts.length}건`:''}`, 'success');
      } else {
        Utils.toast('자동배정 실패: ' + (res.message || res.error), 'error');
      }
    } catch(e) {
      Utils.toast('오류: ' + e.message, 'error');
    } finally {
      Utils.loading(false);
      workLogPage().then(html => { document.getElementById('app').innerHTML = html; });
    }
  };

  // ══════════════════════════════════════════════════════════
  // 기사/해설사 관리 페이지
  // ══════════════════════════════════════════════════════════
  const staffPage = async () => {
    _adminState.currentSection = 'staff';
    const regionId = _adminState.selectedRegion || '';
    const [staffRes, dayoffRes] = await Promise.all([
      API.get('/api/staff' + (regionId ? `?region_id=${regionId}` : '')),
      API.get('/api/staff/dayoff/date/' + new Date().toISOString().slice(0,10)),
    ]);
    const staff = (staffRes.success && staffRes.data) ? staffRes.data : [];
    const todayOff = (dayoffRes.success && dayoffRes.data) ? dayoffRes.data : [];
    const offIds = todayOff.map(d => d.staff_id);

    const rows = staff.length ? staff.map(s => `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3">
          <span class="px-2 py-1 rounded-full text-xs font-bold ${s.role==='driver'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}">
            ${s.role==='driver'?'🚌 기사':'🎤 해설사'}
          </span>
        </td>
        <td class="px-4 py-3 font-medium text-gray-800">${s.name}</td>
        <td class="px-4 py-3 text-gray-600">${s.region_id}</td>
        <td class="px-4 py-3 text-gray-600">${s.phone||'-'}</td>
        <td class="px-4 py-3 text-gray-600 text-xs">${s.license_no||'-'}</td>
        <td class="px-4 py-3 text-center">
          ${offIds.includes(s.id)
            ? '<span class="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">오늘 휴무</span>'
            : '<span class="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">근무가능</span>'}
        </td>
        <td class="px-4 py-3 text-center">
          <button onclick="AdminModule.staffDayoffModal('${s.id}','${s.name}')"
            class="text-xs px-3 py-1 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 mr-1">
            휴무관리
          </button>
          <button onclick="AdminModule.deleteStaff('${s.id}','${s.name}')"
            class="text-xs px-2 py-1 bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-100">
            삭제
          </button>
        </td>
      </tr>`).join('') : '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">등록된 직원이 없습니다</td></tr>';

    const _staffContent = `
      <div class="p-6 max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-id-badge text-blue-500"></i> 기사/해설사 관리
            </h1>
            <p class="text-sm text-gray-500 mt-1">차량 기사 및 해설사 등록, 휴무 신청 관리</p>
          </div>
          <button onclick="AdminModule.staffAddModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <i class="fas fa-plus"></i> 직원 등록
          </button>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">구분</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">이름</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">지역</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">연락처</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">면허/자격번호</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">오늘 상태</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">${rows}</tbody>
          </table>
        </div>
      </div>

      <!-- 직원 등록 모달 -->
      <div id="staff-add-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:none;align-items:center;justify-content:center">
        <div style="background:white;border-radius:12px;padding:28px;width:420px;max-width:95vw">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:16px">직원 등록</h3>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">구분</label>
              <select id="staff-role" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px">
                <option value="driver">🚌 기사</option>
                <option value="guide">🎤 해설사</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">이름 *</label>
              <input id="staff-name" type="text" placeholder="홍길동" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">지역 *</label>
              ${(()=>{
                const u = _adminState.user || {};
                const isSuper = u.role === 'super';
                if (isSuper) {
                  return `<select id="staff-region" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px">
                    <option value="tongyeong">통영</option>
                    <option value="buyeo">부여</option>
                    <option value="hapcheon">합천</option>
                  </select>`;
                } else {
                  const rLabel = {tongyeong:'통영',buyeo:'부여',hapcheon:'합천'}[u.regionId] || u.regionId;
                  return `<input type="hidden" id="staff-region" value="${u.regionId}">
                    <div style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;font-size:14px;background:#f9fafb;color:#374151">
                      ${rLabel} <span style="font-size:11px;color:#6b7280">(담당 지역 고정)</span>
                    </div>`;
                }
              })()}
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">연락처</label>
              <input id="staff-phone" type="text" placeholder="010-0000-0000" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">면허/자격번호</label>
              <input id="staff-license" type="text" placeholder="면허번호 또는 자격증 번호" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;box-sizing:border-box">
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:20px">
            <button onclick="AdminModule.staffAddSubmit()" style="flex:1;background:#2563eb;color:white;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:600;cursor:pointer">등록</button>
            <button onclick="document.getElementById('staff-add-modal').style.display='none'" style="flex:1;background:#f3f4f6;color:#374151;border:none;border-radius:8px;padding:10px;font-size:14px;cursor:pointer">취소</button>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('staff', _staffContent, '기사/해설사 관리');
  };

  const staffAddModal = () => {
    document.getElementById('staff-add-modal').style.display = 'flex';
  };

  const staffAddSubmit = async () => {
    const data = {
      role: document.getElementById('staff-role').value,
      name: document.getElementById('staff-name').value,
      region_id: document.getElementById('staff-region').value,
      phone: document.getElementById('staff-phone').value,
      license_no: document.getElementById('staff-license').value,
    };
    if (!data.name) return alert('이름을 입력하세요');
    const res = await API.post('/api/staff', data);
    if (res.success) {
      document.getElementById('staff-add-modal').style.display = 'none';
      AdminModule.navigate('staff');
    } else {
      alert('등록 실패: ' + (res.error || '오류'));
    }
  };

  const staffDayoffModal = async (staffId, staffName) => {
    const res = await API.get('/api/staff/' + staffId + '/dayoff');
    const offs = (res.success && res.data) ? res.data : [];
    const offList = offs.length
      ? offs.map(o => `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6">
          <span style="font-size:13px">${o.off_date}</span>
          <span style="font-size:12px;color:#6b7280">${o.reason||''}</span>
          <button onclick="AdminModule.staffDayoffDelete('${staffId}','${o.off_date}','${staffName}')" style="font-size:11px;color:#ef4444;background:none;border:none;cursor:pointer">삭제</button>
        </div>`).join('')
      : '<p style="color:#9ca3af;font-size:13px;text-align:center;padding:12px">등록된 휴무 없음</p>';

    const modal = document.createElement('div');
    modal.id = 'dayoff-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = `
      <div style="background:white;border-radius:12px;padding:24px;width:380px;max-width:95vw">
        <h3 style="font-size:15px;font-weight:700;margin-bottom:4px">휴무 관리 - ${staffName}</h3>
        <p style="font-size:12px;color:#6b7280;margin-bottom:16px">휴무일 등록/삭제</p>
        <div style="max-height:180px;overflow-y:auto;margin-bottom:16px">${offList}</div>
        <div style="border-top:1px solid #e5e7eb;padding-top:16px">
          <p style="font-size:12px;font-weight:600;color:#374151;margin-bottom:8px">새 휴무 추가</p>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="date" id="dayoff-date" style="flex:1;border:1px solid #d1d5db;border-radius:8px;padding:8px;font-size:13px"
              value="${new Date().toISOString().slice(0,10)}">
            <input type="text" id="dayoff-reason" placeholder="사유(선택)" style="flex:1;border:1px solid #d1d5db;border-radius:8px;padding:8px;font-size:13px">
          </div>
          <button onclick="AdminModule.staffDayoffAdd('${staffId}','${staffName}')" style="width:100%;margin-top:10px;background:#f97316;color:white;border:none;border-radius:8px;padding:9px;font-size:13px;font-weight:600;cursor:pointer">휴무 등록</button>
        </div>
        <button onclick="document.getElementById('dayoff-modal').remove()" style="width:100%;margin-top:8px;background:#f3f4f6;color:#374151;border:none;border-radius:8px;padding:9px;font-size:13px;cursor:pointer">닫기</button>
      </div>`;
    document.body.appendChild(modal);
  };

  const staffDayoffAdd = async (staffId, staffName) => {
    const date = document.getElementById('dayoff-date')?.value;
    const reason = document.getElementById('dayoff-reason')?.value;
    if (!date) return alert('날짜를 선택하세요');
    const res = await API.post('/api/staff/' + staffId + '/dayoff', { off_date: date, reason });
    if (res.success) {
      document.getElementById('dayoff-modal')?.remove();
      staffDayoffModal(staffId, staffName);
    } else alert(res.error || '등록 실패');
  };

  const staffDayoffDelete = async (staffId, date, staffName) => {
    if (!confirm(`${date} 휴무를 삭제하시겠습니까?`)) return;
    await API.delete('/api/staff/' + staffId + '/dayoff/' + date);
    document.getElementById('dayoff-modal')?.remove();
    staffDayoffModal(staffId, staffName);
  };

  const deleteStaff = async (id, name) => {
    if (!confirm(`${name}을(를) 삭제하시겠습니까?`)) return;
    await API.delete('/api/staff/' + id);
    AdminModule.navigate('staff');
  };

  // ══════════════════════════════════════════════════════════
  // 고객 누적 DB 페이지
  // ══════════════════════════════════════════════════════════
  const customersPage = async () => {
    _adminState.currentSection = 'customers';
    const res = await API.get('/api/customers?limit=100');
    const customers = (res.success && res.data) ? res.data : [];
    const total = res.total || customers.length;

    const rows = customers.length ? customers.map(c => `
      <tr class="hover:bg-gray-50 cursor-pointer" onclick="AdminModule.customerDetail('${c.phone}')">
        <td class="px-4 py-3 font-medium text-gray-800">${c.name}</td>
        <td class="px-4 py-3 text-gray-600">${c.phone}</td>
        <td class="px-4 py-3 text-gray-500 text-sm">${c.email||'-'}</td>
        <td class="px-4 py-3 text-center">
          <span class="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">${c.visit_count}회</span>
        </td>
        <td class="px-4 py-3 text-right font-medium text-gray-800">₩${(c.total_spent||0).toLocaleString()}</td>
        <td class="px-4 py-3 text-gray-500 text-sm">${c.last_visit||'-'}</td>
        <td class="px-4 py-3 text-gray-500 text-sm">${c.region_id||'-'}</td>
        <td class="px-4 py-3 text-center">
          ${c.sms_opt_out ? '<span class="text-xs text-red-500">수신거부</span>' : '<span class="text-xs text-green-600">수신동의</span>'}
        </td>
      </tr>`).join('')
      : '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">예약 고객 데이터가 없습니다. 예약이 완료되면 자동으로 저장됩니다.</td></tr>';

    const _custContent = `
      <div class="p-6 max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-users text-green-500"></i> 고객 누적 DB
            </h1>
            <p class="text-sm text-gray-500 mt-1">예약 완료 시 자동 저장 · 총 ${total.toLocaleString()}명</p>
          </div>
          <button onclick="AdminModule.navigate('sms-campaign')" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2">
            <i class="fas fa-paper-plane"></i> 단체문자 보내기
          </button>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">이름</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">연락처</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">이메일</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">방문횟수</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">누적금액</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">최근방문</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">지역</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">SMS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">${rows}</tbody>
          </table>
        </div>
      </div>`;
    return renderAdminLayout('customers', _custContent, '고객 누적 DB');
  };

  const customerDetail = async (phone) => {
    const res = await API.get('/api/customers/' + encodeURIComponent(phone));
    if (!res.success) return alert('고객 정보를 불러올 수 없습니다.');
    const c = res.data;
    const resRows = (res.reservations||[]).map(r => `
      <tr><td class="py-1 text-sm">${r.date}</td><td class="py-1 text-sm">${r.reservation_no}</td>
      <td class="py-1 text-sm">${r.region_id}</td><td class="py-1 text-sm text-right">₩${(r.total_price||0).toLocaleString()}</td>
      <td class="py-1 text-sm text-center"><span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs">${r.status}</span></td></tr>`).join('');

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = `
      <div style="background:white;border-radius:12px;padding:24px;width:520px;max-width:95vw;max-height:80vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">
          <h3 style="font-size:16px;font-weight:700">${c.name} 고객 정보</h3>
          <button onclick="this.closest('[style]').remove()" style="background:none;border:none;font-size:20px;color:#9ca3af;cursor:pointer">×</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px">
          <div><div style="font-size:11px;color:#6b7280">연락처</div><div style="font-weight:600">${c.phone}</div></div>
          <div><div style="font-size:11px;color:#6b7280">이메일</div><div style="font-weight:600">${c.email||'-'}</div></div>
          <div><div style="font-size:11px;color:#6b7280">방문횟수</div><div style="font-weight:700;color:#2563eb">${c.visit_count}회</div></div>
          <div><div style="font-size:11px;color:#6b7280">누적금액</div><div style="font-weight:700;color:#059669">₩${(c.total_spent||0).toLocaleString()}</div></div>
          <div><div style="font-size:11px;color:#6b7280">첫 방문</div><div>${c.first_visit||'-'}</div></div>
          <div><div style="font-size:11px;color:#6b7280">최근 방문</div><div>${c.last_visit||'-'}</div></div>
        </div>
        <h4 style="font-size:13px;font-weight:700;margin-bottom:8px">예약 이력</h4>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="border-bottom:1px solid #e5e7eb">
            <th style="text-align:left;font-size:11px;color:#6b7280;padding-bottom:6px">날짜</th>
            <th style="text-align:left;font-size:11px;color:#6b7280">예약번호</th>
            <th style="text-align:left;font-size:11px;color:#6b7280">지역</th>
            <th style="text-align:right;font-size:11px;color:#6b7280">금액</th>
            <th style="text-align:center;font-size:11px;color:#6b7280">상태</th>
          </tr></thead>
          <tbody>${resRows || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:12px;font-size:13px">예약 이력 없음</td></tr>'}</tbody>
        </table>
      </div>`;
    document.body.appendChild(modal);
  };

  // ══════════════════════════════════════════════════════════
  // 단체문자 캠페인 페이지
  // ══════════════════════════════════════════════════════════
  const smsCampaignPage = async () => {
    _adminState.currentSection = 'sms-campaign';
    const res = await API.get('/api/customers/sms/campaigns');
    const campaigns = (res.success && res.data) ? res.data : [];

    const statusBadge = (s) => ({
      draft: '<span style="background:#fef9c3;color:#854d0e;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700">작성중</span>',
      scheduled: '<span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700">예약발송</span>',
      sent: '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700">발송완료</span>',
    })[s] || s;

    const rows = campaigns.length ? campaigns.map(c => `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 font-medium text-gray-800">${c.title}</td>
        <td class="px-4 py-3 text-gray-600 text-sm max-w-xs truncate">${c.message}</td>
        <td class="px-4 py-3 text-center">${statusBadge(c.status)}</td>
        <td class="px-4 py-3 text-center text-sm">${c.sent_count}명</td>
        <td class="px-4 py-3 text-gray-500 text-sm">${(c.sent_at||c.created_at||'').slice(0,16)}</td>
        <td class="px-4 py-3 text-center">
          ${c.status !== 'sent' ? `<button onclick="AdminModule.sendCampaign(${c.id},'${c.title}')"
            style="background:#16a34a;color:white;border:none;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;cursor:pointer">발송</button>` : ''}
        </td>
      </tr>`).join('')
      : '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">캠페인이 없습니다. 새 캠페인을 작성하세요.</td></tr>';

    const _smsContent = `
      <div class="p-6 max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-paper-plane text-blue-500"></i> 단체문자 캠페인
            </h1>
            <p class="text-sm text-gray-500 mt-1">고객 DB 기반 단체/개별 문자 발송</p>
          </div>
          <button onclick="AdminModule.smsCampaignNewModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <i class="fas fa-plus"></i> 새 캠페인 작성
          </button>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">제목</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">내용</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500">상태</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500">발송수</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">발송일시</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">${rows}</tbody>
          </table>
        </div>
      </div>

      <!-- 새 캠페인 모달 -->
      <div id="campaign-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center">
        <div style="background:white;border-radius:12px;padding:28px;width:480px;max-width:95vw">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:16px">새 단체문자 캠페인</h3>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">캠페인 제목 *</label>
              <input id="camp-title" type="text" placeholder="예: 2024 여름 프로모션" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">발송 대상</label>
              <select id="camp-target" onchange="AdminModule.campTargetChange()" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px">
                <option value="all">전체 고객 (수신동의)</option>
                <option value="region">특정 지역 고객</option>
                <option value="custom">번호 직접 입력</option>
              </select>
            </div>
            <div id="camp-region-wrap" style="display:none">
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">지역 선택</label>
              <div style="display:flex;gap:8px">
                <label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="checkbox" value="tongyeong"> 통영</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="checkbox" value="buyeo"> 부여</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="checkbox" value="hapcheon"> 합천</label>
              </div>
            </div>
            <div id="camp-phones-wrap" style="display:none">
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">전화번호 (줄바꿈으로 구분)</label>
              <textarea id="camp-phones" rows="4" placeholder="010-1234-5678&#10;010-9876-5432" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:13px;box-sizing:border-box;resize:vertical"></textarea>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">문자 내용 * <span style="font-weight:400;color:#9ca3af">(최대 80자 권장)</span></label>
              <textarea id="camp-message" rows="4" placeholder="안녕하세요! 아쿠아모빌리티코리아입니다..." style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;box-sizing:border-box;resize:vertical"></textarea>
              <div id="camp-msg-count" style="text-align:right;font-size:11px;color:#9ca3af;margin-top:2px">0자</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:20px">
            <button onclick="AdminModule.smsCampaignSave()" style="flex:1;background:#2563eb;color:white;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:600;cursor:pointer">저장</button>
            <button onclick="document.getElementById('campaign-modal').style.display='none'" style="flex:1;background:#f3f4f6;color:#374151;border:none;border-radius:8px;padding:10px;font-size:14px;cursor:pointer">취소</button>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('sms-campaign', _smsContent, '단체문자 캠페인');
  };

  const smsCampaignNewModal = () => {
    document.getElementById('campaign-modal').style.display = 'flex';
    const msg = document.getElementById('camp-message');
    if (msg) msg.addEventListener('input', () => {
      document.getElementById('camp-msg-count').textContent = msg.value.length + '자';
    });
  };

  const campTargetChange = () => {
    const v = document.getElementById('camp-target').value;
    document.getElementById('camp-region-wrap').style.display = v==='region' ? 'block' : 'none';
    document.getElementById('camp-phones-wrap').style.display = v==='custom' ? 'block' : 'none';
  };

  const smsCampaignSave = async () => {
    const title = document.getElementById('camp-title')?.value;
    const message = document.getElementById('camp-message')?.value;
    const targetType = document.getElementById('camp-target')?.value;
    if (!title || !message) return alert('제목과 내용을 입력하세요');
    let targetJson = [];
    if (targetType === 'region') {
      targetJson = Array.from(document.querySelectorAll('#camp-region-wrap input:checked')).map(el => el.value);
    } else if (targetType === 'custom') {
      targetJson = (document.getElementById('camp-phones')?.value || '').split('\n').map(s => s.trim()).filter(Boolean);
    }
    const res = await API.post('/api/customers/sms/campaigns', { title, message, target_type: targetType, target_json: targetJson, created_by: 'admin' });
    if (res.success) {
      document.getElementById('campaign-modal').style.display = 'none';
      alert(`캠페인 저장 완료! 대상: ${res.target_count}명\n발송하려면 목록에서 "발송" 버튼을 클릭하세요.`);
      AdminModule.navigate('sms-campaign');
    } else alert('저장 실패: ' + (res.error || '오류'));
  };

  const sendCampaign = async (id, title) => {
    if (!confirm(`"${title}" 캠페인을 발송하시겠습니까?\n(SENS API 미연동 시 발송 목록만 저장됩니다)`)) return;
    const res = await API.post('/api/customers/sms/campaigns/' + id + '/send', {});
    if (res.success) {
      alert(`발송 완료! ${res.sent_count}명에게 발송되었습니다.\n${res.message}`);
      AdminModule.navigate('sms-campaign');
    } else alert('발송 실패: ' + (res.error || '오류'));
  };

  // ══════════════════════════════════════════════════════════
  // 우편 주소 관리 페이지
  // ══════════════════════════════════════════════════════════
  const mailingPage = async () => {
    _adminState.currentSection = 'mailing';
    const res = await API.get('/api/mailing?limit=200');
    const items = (res.success && res.data) ? res.data : [];
    const catLabel = { travel_agency:'여행사', school:'교육기관', institution:'기관/단체', other:'기타' };
    const catColor = { travel_agency:'bg-blue-50 text-blue-700', school:'bg-green-50 text-green-700', institution:'bg-purple-50 text-purple-700', other:'bg-gray-50 text-gray-600' };

    const rows = items.length ? items.map(i => `
      <tr class="hover:bg-gray-50">
        <td class="px-3 py-2.5 text-center">
          <span class="px-2 py-0.5 rounded text-xs font-medium ${catColor[i.category]||'bg-gray-50 text-gray-600'}">${catLabel[i.category]||i.category}</span>
        </td>
        <td class="px-3 py-2.5 font-medium text-gray-800 text-sm">${i.org_name}${i.dept?' <span class="text-gray-400 font-normal">'+i.dept+'</span>':''}</td>
        <td class="px-3 py-2.5 text-gray-600 text-sm">${i.contact_name||'-'}</td>
        <td class="px-3 py-2.5 text-gray-600 text-sm">[${i.zipcode||'     '}] ${i.address1}${i.address2?' '+i.address2:''}</td>
        <td class="px-3 py-2.5 text-gray-500 text-sm">${i.region||'-'}</td>
        <td class="px-3 py-2.5 text-center">
          <button onclick="AdminModule.mailingDelete(${i.id},'${i.org_name}')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:13px">삭제</button>
        </td>
      </tr>`).join('')
      : '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">등록된 주소가 없습니다.</td></tr>';

    const _mailContent = `
      <div class="p-6 max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-envelope text-purple-500"></i> 우편 주소 관리
            </h1>
            <p class="text-sm text-gray-500 mt-1">여행사/교육기관 우편 주소 · 총 ${(res.total||items.length).toLocaleString()}건</p>
          </div>
          <div class="flex gap-2">
            <a href="/api/mailing/labels/print" target="_blank" class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2">
              <i class="fas fa-print"></i> 라벨 인쇄
            </a>
            <button onclick="AdminModule.mailingAddModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <i class="fas fa-plus"></i> 주소 추가
            </button>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-3 py-3 text-center text-xs font-semibold text-gray-500">구분</th>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-500">기관명</th>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-500">담당자</th>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-500">주소</th>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-500">지역</th>
                <th class="px-3 py-3 text-center text-xs font-semibold text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">${rows}</tbody>
          </table>
        </div>
      </div>

      <!-- 주소 추가 모달 -->
      <div id="mailing-add-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center">
        <div style="background:white;border-radius:12px;padding:28px;width:460px;max-width:95vw;max-height:85vh;overflow-y:auto">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:16px">주소 추가</h3>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:3px">구분</label>
              <select id="mail-cat" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:7px 10px;font-size:13px">
                <option value="travel_agency">여행사</option>
                <option value="school">교육기관</option>
                <option value="institution">기관/단체</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:3px">기관명 *</label>
              <input id="mail-org" type="text" placeholder="(주)○○여행사" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:7px 10px;font-size:13px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:3px">부서명</label>
              <input id="mail-dept" type="text" placeholder="영업팀" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:7px 10px;font-size:13px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:3px">담당자명</label>
              <input id="mail-contact" type="text" placeholder="홍길동" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:7px 10px;font-size:13px;box-sizing:border-box">
            </div>
            <div style="display:flex;gap:8px">
              <div style="width:120px">
                <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:3px">우편번호</label>
                <input id="mail-zip" type="text" placeholder="12345" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:7px 10px;font-size:13px;box-sizing:border-box">
              </div>
              <div style="flex:1">
                <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:3px">지역(시도)</label>
                <input id="mail-region" type="text" placeholder="경남" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:7px 10px;font-size:13px;box-sizing:border-box">
              </div>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:3px">주소 *</label>
              <input id="mail-addr1" type="text" placeholder="경남 통영시 ○○로 123" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:7px 10px;font-size:13px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:3px">상세주소</label>
              <input id="mail-addr2" type="text" placeholder="○○빌딩 5층" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:7px 10px;font-size:13px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:3px">연락처</label>
              <input id="mail-phone" type="text" placeholder="055-000-0000" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:7px 10px;font-size:13px;box-sizing:border-box">
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:18px">
            <button onclick="AdminModule.mailingAddSubmit()" style="flex:1;background:#7c3aed;color:white;border:none;border-radius:8px;padding:9px;font-size:14px;font-weight:600;cursor:pointer">추가</button>
            <button onclick="document.getElementById('mailing-add-modal').style.display='none'" style="flex:1;background:#f3f4f6;color:#374151;border:none;border-radius:8px;padding:9px;font-size:14px;cursor:pointer">취소</button>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('mailing', _mailContent, '우편 주소 관리');
  };

  const mailingAddModal = () => {
    document.getElementById('mailing-add-modal').style.display = 'flex';
  };

  const mailingAddSubmit = async () => {
    const data = {
      category: document.getElementById('mail-cat')?.value,
      org_name: document.getElementById('mail-org')?.value,
      dept:     document.getElementById('mail-dept')?.value,
      contact_name: document.getElementById('mail-contact')?.value,
      zipcode:  document.getElementById('mail-zip')?.value,
      address1: document.getElementById('mail-addr1')?.value,
      address2: document.getElementById('mail-addr2')?.value,
      phone:    document.getElementById('mail-phone')?.value,
      region:   document.getElementById('mail-region')?.value,
    };
    if (!data.org_name || !data.address1) return alert('기관명과 주소는 필수입니다');
    const res = await API.post('/api/mailing', data);
    if (res.success) {
      document.getElementById('mailing-add-modal').style.display = 'none';
      AdminModule.navigate('mailing');
    } else alert('추가 실패: ' + (res.error || '오류'));
  };

  const mailingDelete = async (id, name) => {
    if (!confirm(`"${name}" 주소를 삭제하시겠습니까?`)) return;
    await API.delete('/api/mailing/' + id);
    AdminModule.navigate('mailing');
  };


  // ── 공개 API ───────────────────────────────────────────────
  return {
    // 페이지
  loginPage, hqDashboard, regionDashboard, vehiclesPage, schedulesPage, faresPage,
    seatsPage, reservationsPage, inquiriesPage, viewInquiry, replyInquiry, submitInquiryReply, wristbandsPage, popupsPage, termsPage, seoManagePage,
    regionsPage, settlementPage, adminsPage, settingsAdminPage, backupPage, statsAdminPage,
    tourismManagePage,
    travelGuidesPage, partnersPage,
    selectGuideRegion, addGuide, editGuide, saveGuide, deleteGuide,
    selectPartnerRegion, addPartner, editPartner, savePartner, deletePartner,
    // 액션
    doLogin, logout, navigate, toggleSidebar, toggleMobileSidebar, closeMobileSidebar, approveFare, fillLogin,
    staffPage, staffAddModal, staffAddSubmit, staffDayoffModal, staffDayoffAdd, staffDayoffDelete, deleteStaff,
    customersPage, customerDetail,
    smsCampaignPage, smsCampaignNewModal, campTargetChange, smsCampaignSave, sendCampaign,
    mailingPage, mailingAddModal, mailingAddSubmit, mailingDelete,
    addVehicle, editVehicle, saveVehicle, deleteVehicle, closeVehicleModal, filterVehicles,
    selectScheduleRegion, addSchedule, editSchedule, saveSchedule, toggleScheduleStatus,
    deleteSchedule, showRecurringModal, addRecTime, generateRecurring, updateSeatPreview,
    showAutoScheduleModal, previewAutoSchedule, confirmAutoSchedule, switchDispatchMode,
    switchRecMode, calcRecAutoTimes,
    selectFareRegion, setFareMode, addFare, editFare, saveFare,
    grantInstantPerm, toggleFareStatus, approvefare, cancelFareApproval,
    updateSeatRatio, saveSeatRatio, saveGroupDiscount, saveSensConfig, testSms, _doTestSms,
    showWristbandDetail, searchWristbands, voidWristband, _doVoidWristband, scanCheckWristband, reissueWristband, _doReissueWristband,
    viewReservation, cancelReservation, exportReservations, filterReservations, resetReservationFilter, issueWristbandFromReservation, _doIssueWristbandFromRes,
    saveWristbandText,
    addPopup, editPopup, savePopup, deletePopup,
    addNotice, editNotice, saveNotice, hideNotice, deleteNotice, closeNoticeModal,
    showTermsTab, saveTerms, previewTerms,
    selectSeoRegion, saveSeoGlobal, saveSeoSettings, smsPage, showSmsDetail, showSmsRecipients, showSmsRecipientsByIdx, loadSmsPassengers, onSmsTypeChange, smsSelectAll, updateSmsSelectedCount, sendSms, setSmsTemplate, updateSmsCharCount, updateSmsPreview, previewSms,
    showAddRegionModal, editRegion, suspendRegion, activateRegion, deleteRegion, saveNewRegion, _autoGenRegionCode, _saveEditRegion,
    closeDay, viewSettlement, exportSettlement, exportSettlementCSV, filterSettlement,
    addAdmin, resetPassword, deleteAdmin,
    saveSmsTemplates, resetSettings,
    switchRegionDashboard,
    setTourismFilter, addTourism, editTourism, saveTourism, toggleTourismVisible, deleteTourism,
    workLogPage, autoAssignWorkLog,
  };
})();

window.AdminModule = AdminModule;
