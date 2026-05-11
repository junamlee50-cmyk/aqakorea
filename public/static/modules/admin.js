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
    { id:'admin',      pw:'admin1234',  name:'본사 슈퍼관리자', role:'super',      regionId:null },
    { id:'tongyeong',  pw:'tong1234',   name:'통영지역관리자',  role:'regional',   regionId:'tongyeong' },
    { id:'buyeo',      pw:'buye1234',   name:'부여지역관리자',  role:'regional',   regionId:'buyeo' },
    { id:'hapcheon',   pw:'hapc1234',   name:'합천지역관리자',  role:'regional',   regionId:'hapcheon' },
    { id:'field01',    pw:'field1234',  name:'현장매표소',      role:'staff',      regionId:'tongyeong' },
    { id:'account',    pw:'acct1234',   name:'회계담당자',      role:'accountant', regionId:null },
    { id:'content',    pw:'cont1234',   name:'콘텐츠담당자',    role:'content',    regionId:null },
    { id:'partner',    pw:'part1234',   name:'여행사파트너',    role:'partner',    regionId:null },
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
      { icon: 'fas fa-qrcode', label: '손목밴드 관리', section: 'wristbands' },
      { icon: 'fas fa-bullhorn', label: '팝업/공지 관리', section: 'popups' },
      { icon: 'fas fa-file-contract', label: '약관/환불정책', section: 'terms' },
      { icon: 'fas fa-search', label: 'SEO 관리', section: 'seo' },
      { icon: 'fas fa-chart-bar', label: '통계/보고서', section: 'stats-admin' },
      { icon: 'fas fa-calculator', label: '정산 관리', section: 'settlement' },
      { icon: 'fas fa-users-cog', label: '관리자 계정', section: 'admins' },
      { icon: 'fas fa-cog', label: '시스템 설정', section: 'settings-admin' },
      { icon: 'fas fa-database', label: '백업/로그', section: 'backup' },
    ];
    const regionalMenus = [
      { icon: 'fas fa-tachometer-alt', label: '지역 대시보드', section: 'region-dashboard' },
      { icon: 'fas fa-bus', label: '차량 관리', section: 'vehicles' },
      { icon: 'fas fa-calendar-alt', label: '일정 관리', section: 'schedules' },
      { icon: 'fas fa-tag', label: '요금 관리', section: 'fares' },
      { icon: 'fas fa-chair', label: '좌석 배분', section: 'seats' },
      { icon: 'fas fa-ticket-alt', label: '예약 관리', section: 'reservations' },
      { icon: 'fas fa-qrcode', label: '손목밴드', section: 'wristbands' },
      { icon: 'fas fa-bullhorn', label: '팝업/공지', section: 'popups' },
      { icon: 'fas fa-file-contract', label: '약관/환불정책', section: 'terms' },
      { icon: 'fas fa-search', label: 'SEO 관리', section: 'seo' },
      { icon: 'fas fa-calculator', label: '정산 관리', section: 'settlement' },
      { icon: 'fas fa-chart-bar', label: '통계', section: 'stats-admin' },
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
                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-water text-white text-sm"></i>
                </div>
                <div class="overflow-hidden">
                  <div class="text-white font-bold text-sm whitespace-nowrap">아쿠아모빌리티</div>
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
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i class="fas fa-water text-white text-2xl"></i>
            </div>
            <h1 class="text-white text-2xl font-bold">아쿠아모빌리티코리아</h1>
            <p class="text-gray-400 text-sm mt-1">통합 관리자 시스템 · Admin Portal</p>
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

            <!-- 데모 계정 안내 -->
            <div class="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p class="text-xs font-semibold text-gray-600 mb-2"><i class="fas fa-info-circle mr-1 text-blue-500"></i>데모 계정 안내</p>
              <div class="grid grid-cols-2 gap-1 text-xs text-gray-500">
                <button onclick="AdminModule.fillLogin('admin','admin1234')" class="text-left hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50">
                  🔑 admin / admin1234 <span class="text-blue-500">(슈퍼관리자)</span>
                </button>
                <button onclick="AdminModule.fillLogin('tongyeong','tong1234')" class="text-left hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50">
                  🗺️ tongyeong / tong1234 <span class="text-green-500">(통영관리자)</span>
                </button>
                <button onclick="AdminModule.fillLogin('buyeo','buye1234')" class="text-left hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50">
                  🗺️ buyeo / buye1234 <span class="text-green-500">(부여관리자)</span>
                </button>
                <button onclick="AdminModule.fillLogin('hapcheon','hapc1234')" class="text-left hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50">
                  🗺️ hapcheon / hapc1234 <span class="text-green-500">(합천관리자)</span>
                </button>
                <button onclick="AdminModule.fillLogin('field01','field1234')" class="text-left hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50">
                  🖥️ field01 / field1234 <span class="text-orange-500">(현장매표소)</span>
                </button>
                <button onclick="AdminModule.fillLogin('account','acct1234')" class="text-left hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50">
                  💰 account / acct1234 <span class="text-purple-500">(회계담당)</span>
                </button>
              </div>
            </div>
          </div>
          <p class="text-center text-gray-500 text-xs mt-4">
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

  const doLogin = () => {
    // 실패 횟수 제한
    const failCount = parseInt(sessionStorage.getItem('amk_fail_count') || '0');
    if (failCount >= 5) {
      Utils.toast('로그인 시도 횟수가 초과되었습니다. 잠시 후 다시 시도하세요.', 'error');
      return;
    }

    const id = document.getElementById('admin-id')?.value?.trim();
    const pw = document.getElementById('admin-pw')?.value;
    if (!id || !pw) { Utils.toast('아이디와 비밀번호를 입력하세요', 'error'); return; }

    const account = DEMO_ACCOUNTS.find(a => a.id === id && a.pw === pw);
    if (!account) {
      sessionStorage.setItem('amk_fail_count', String(failCount + 1));
      const remain = 5 - (failCount + 1);
      Utils.toast(`아이디 또는 비밀번호가 올바르지 않습니다. (${failCount + 1}/5회, 남은 시도: ${remain}회)`, 'error');
      return;
    }

    // 로그인 성공
    sessionStorage.setItem('amk_fail_count', '0');
    _adminState.loggedIn = true;
    _adminState.user = { id: account.id, name: account.name, role: account.role, regionId: account.regionId };
    _adminState.selectedRegion = account.regionId || null;
    Store.set('adminUser', _adminState.user);
    Store.set('adminLoginTime', Date.now());
    _addAccessLog(account.id, '로그인 성공');
    Utils.toast(`${account.name}으로 로그인되었습니다.`, 'success');

    // 권한별 리다이렉트
    if (account.role === ROLES.STAFF) {
      Router.go('/field');
    } else if (account.role === ROLES.REGIONAL) {
      Router.go('/admin/region-dashboard');
    } else {
      Router.go('/admin/dashboard');
    }
  };

  const logout = () => {
    const userName = _adminState.user?.name || 'unknown';
    _addAccessLog(_adminState.user?.id || 'unknown', '로그아웃');
    _adminState.loggedIn = false;
    _adminState.user = null;
    _adminState.mobileOpen = false;
    Store.set('adminUser', null);
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

  const navigate = (section) => {
    _adminState.currentSection = section;
    _adminState.mobileOpen = false; // 모바일에서 메뉴 클릭 시 사이드바 닫기
    Router.go(`/admin/${section}`);
  };

  // ── HQ 슈퍼 대시보드 ───────────────────────────────────────
  const hqDashboard = async () => {
    _adminState.currentSection = 'hq-dashboard';
    const regions = window.REGIONS || [];
    const activeRegions = regions.filter(r => r.status === 'active');
    const today = new Date().toISOString().slice(0, 10);

    const regionRows = activeRegions.map(r => {
      const todayRes = Math.floor(Math.random() * 200) + 50;
      const revenue = todayRes * (r.fares?.[0]?.price || 30000) * 0.7;
      return `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3">
            <div class="font-medium text-gray-800">${r.name}</div>
            <div class="text-xs text-gray-500">${r.code}</div>
          </td>
          <td class="px-4 py-3 text-center">
            <span class="badge-active px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">운영중</span>
          </td>
          <td class="px-4 py-3 text-right font-medium">${todayRes.toLocaleString()}명</td>
          <td class="px-4 py-3 text-right font-medium text-blue-600">₩${revenue.toLocaleString()}</td>
          <td class="px-4 py-3 text-center">
            <span class="text-xs ${r.onlineRatio >= 70 ? 'text-green-600' : 'text-orange-500'}">${r.onlineRatio}% / ${r.offlineRatio}%</span>
          </td>
          <td class="px-4 py-3 text-center">
            <button onclick="AdminModule.navigate('region-dashboard')" class="text-blue-600 hover:underline text-xs">상세</button>
          </td>
        </tr>
      `;
    }).join('');

    const fareApprovals = [
      { region: '통영', type: '성인', oldPrice: 35000, newPrice: 37000, requestedAt: '2025-05-08', status: 'pending' },
      { region: '부여', type: '단체', oldPrice: 25000, newPrice: 23000, requestedAt: '2025-05-09', status: 'pending' },
    ];
    const approvalRows = fareApprovals.map((a, i) => `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-sm">${a.region}</td>
        <td class="px-4 py-3 text-sm">${a.type} 요금</td>
        <td class="px-4 py-3 text-sm text-center">₩${a.oldPrice.toLocaleString()} → <strong class="${a.newPrice > a.oldPrice ? 'text-red-600' : 'text-blue-600'}">₩${a.newPrice.toLocaleString()}</strong></td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${a.requestedAt}</td>
        <td class="px-4 py-3 text-center">
          <button onclick="AdminModule.approveFare(${i}, true)" class="bg-green-500 text-white px-2 py-1 rounded text-xs mr-1">승인</button>
          <button onclick="AdminModule.approveFare(${i}, false)" class="bg-red-500 text-white px-2 py-1 rounded text-xs">반려</button>
        </td>
      </tr>
    `).join('');

    const content = `
      <div class="space-y-6">
        <!-- 상단 요약 카드 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          ${statCard('fas fa-map-marker-alt', '운영 지역', `${activeRegions.length}개`, `전체 ${regions.length}개 중`, 'blue')}
          ${statCard('fas fa-users', '오늘 총 예약', '1,247명', '전일 대비 +12%', 'green')}
          ${statCard('fas fa-won-sign', '오늘 총 매출', '₩38,450,000', '결제 완료 기준', 'purple')}
          ${statCard('fas fa-hourglass-half', '요금 승인 대기', `${fareApprovals.length}건`, '즉시 처리 필요', 'orange')}
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

        <!-- 요금 변경 승인 대기 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i class="fas fa-bell text-orange-500"></i> 요금 변경 승인 대기
          </h2>
          ${fareApprovals.length ? `
          <div class="overflow-x-auto">
            <table class="admin-table w-full" id="fare-approval-table">
              <thead>
                <tr class="bg-gray-50">
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">지역</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">항목</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">변경 내용</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">요청일</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">처리</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100" id="fare-approval-body">${approvalRows}</tbody>
            </table>
          </div>` : '<p class="text-gray-500 text-sm text-center py-4">대기 중인 승인 요청이 없습니다.</p>'}
        </div>

        <!-- 빠른 작업 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-800 mb-4">빠른 작업</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${[
              {icon:'fas fa-plus-circle', label:'새 지역 추가', fn:"AdminModule.navigate('regions')", color:'blue'},
              {icon:'fas fa-calendar-plus', label:'일정 추가', fn:"AdminModule.navigate('schedules')", color:'green'},
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

  const approveFare = (idx, approve) => {
    const tbody = document.getElementById('fare-approval-body');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    if (rows[idx]) rows[idx].remove();
    Utils.toast(approve ? '요금 변경이 승인되었습니다.' : '요금 변경이 반려되었습니다.', approve ? 'success' : 'info');
  };

  // ── 지역 대시보드 ──────────────────────────────────────────
  const regionDashboard = async (params) => {
    _adminState.currentSection = 'region-dashboard';
    const regionId = params?.regionId || _adminState.selectedRegion || _adminState.user?.regionId || 'tongyeong';
    const regions = window.REGIONS || [];
    const region = regions.find(r => r.id === regionId) || regions[0];
    if (!region) return renderAdminLayout('region-dashboard', '<p>지역을 찾을 수 없습니다.</p>', '지역 대시보드');

    const schedules = (window.SCHEDULES || {})[regionId] || [];
    const scheduleCards = schedules.slice(0, 3).map(s => `
      <div class="border rounded-lg p-4">
        <div class="flex justify-between items-center mb-2">
          <span class="font-medium text-gray-800">${s.time || s.name}</span>
          <span class="text-xs px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
            ${s.status === 'active' ? '운영중' : '중단'}
          </span>
        </div>
        <div class="text-sm text-gray-600">좌석: ${Math.floor(Math.random()*30)+10} / ${s.capacity || 45}석</div>
        <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2">
          <div class="bg-blue-500 h-1.5 rounded-full" style="width:${Math.floor(Math.random()*80)+10}%"></div>
        </div>
      </div>
    `).join('');

    const content = `
      <div class="space-y-6">
        <!-- 지역 선택 -->
        <div class="flex items-center gap-4 flex-wrap">
          <select onchange="AdminModule.navigate('region-dashboard')" class="border rounded-lg px-3 py-2 text-sm" id="region-select">
            ${regions.filter(r=>r.status==='active').map(r=>
              `<option value="${r.id}" ${r.id===regionId?'selected':''}>${r.name}</option>`
            ).join('')}
          </select>
          <span class="text-gray-500 text-sm">|</span>
          <span class="text-sm text-gray-600"><i class="fas fa-map-marker-alt text-blue-500 mr-1"></i>${region.location}</span>
          <span class="text-sm text-gray-600"><i class="fas fa-phone text-green-500 mr-1"></i>${region.customerService}</span>
        </div>

        <!-- 통계 카드 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          ${statCard('fas fa-calendar-check', '오늘 예약', '312명', '목표 350명', 'blue')}
          ${statCard('fas fa-won-sign', '오늘 매출', '₩10,920,000', '온라인 ₩8,736,000', 'green')}
          ${statCard('fas fa-chair', '잔여 좌석', '38석', '오후 2시 회차', 'purple')}
          ${statCard('fas fa-qrcode', '손목밴드 발급', '287개', '체크인 대비 92%', 'orange')}
        </div>

        <!-- 오늘 운행 일정 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-800 mb-4">오늘 운행 일정</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">${scheduleCards || '<p class="text-gray-500 text-sm">일정이 없습니다.</p>'}</div>
        </div>

        <!-- 최근 예약 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-gray-800">최근 예약 현황</h2>
            <button onclick="AdminModule.navigate('reservations')" class="text-blue-600 text-sm hover:underline">전체보기</button>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead>
                <tr class="bg-gray-50">
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600">예약번호</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600">예약자</th>
                  <th class="px-3 py-2 text-center text-xs font-semibold text-gray-600">인원</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-600">금액</th>
                  <th class="px-3 py-2 text-center text-xs font-semibold text-gray-600">상태</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${[
                  {no:'AMK-20250511-0001',name:'김**',count:4,amount:140000,status:'confirmed'},
                  {no:'AMK-20250511-0002',name:'이**',count:2,amount:70000,status:'confirmed'},
                  {no:'AMK-20250511-0003',name:'박**',count:6,amount:210000,status:'checkedin'},
                  {no:'AMK-20250511-0004',name:'최**',count:3,amount:105000,status:'pending'},
                ].map(r=>`
                  <tr class="hover:bg-gray-50">
                    <td class="px-3 py-2 text-xs font-mono text-blue-600">${r.no}</td>
                    <td class="px-3 py-2 text-sm">${r.name}</td>
                    <td class="px-3 py-2 text-sm text-center">${r.count}명</td>
                    <td class="px-3 py-2 text-sm text-right">₩${r.amount.toLocaleString()}</td>
                    <td class="px-3 py-2 text-center">
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium ${r.status==='confirmed'?'bg-green-100 text-green-700':r.status==='checkedin'?'bg-blue-100 text-blue-700':'bg-yellow-100 text-yellow-700'}">
                        ${r.status==='confirmed'?'확정':r.status==='checkedin'?'탑승완료':'대기'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('region-dashboard', content, `${region.name} 대시보드`);
  };

  // ── 차량 관리 ──────────────────────────────────────────────
  const vehiclesPage = async () => {
    _adminState.currentSection = 'vehicles';
    const vehicles = Settings.get('vehicles') || window.VEHICLES || [];

    const rows = vehicles.map((v, i) => `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3">
          <div class="font-medium text-sm">${v.name}</div>
          <div class="text-xs text-gray-500">${v.plateNumber}</div>
        </td>
        <td class="px-4 py-3 text-sm text-center">${v.type === 'amphibious' ? '🚌 수륙양용' : '🚐 일반'}</td>
        <td class="px-4 py-3 text-sm text-center">${v.capacity || 45}석</td>
        <td class="px-4 py-3 text-sm text-center">${v.region || '통영'}</td>
        <td class="px-4 py-3 text-sm text-center">
          <span class="px-2 py-0.5 rounded-full text-xs ${v.status==='active'?'bg-green-100 text-green-700':v.status==='maintenance'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}">
            ${v.status==='active'?'운행중':v.status==='maintenance'?'정비중':'운행중단'}
          </span>
        </td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${v.inspectionDate || '2025-12-31'}</td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${v.insuranceDate || '2025-12-31'}</td>
        <td class="px-4 py-3 text-center">
          <button onclick="AdminModule.editVehicle(${i})" class="text-blue-600 hover:underline text-xs mr-2">수정</button>
          <button onclick="AdminModule.deleteVehicle(${i})" class="text-red-500 hover:underline text-xs">삭제</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" class="text-center py-4 text-gray-500 text-sm">차량이 없습니다.</td></tr>';

    const content = `
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="font-semibold text-gray-800">차량 목록</h2>
          <button onclick="AdminModule.addVehicle()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <i class="fas fa-plus"></i> 차량 추가
          </button>
        </div>
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
      <div id="vehicle-modal" class="modal-overlay hidden">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
          <h3 class="font-semibold text-gray-800 text-lg mb-4" id="vehicle-modal-title">차량 추가</h3>
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
                <select id="v-region" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  ${(window.REGIONS||[]).filter(r=>r.status==='active').map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}
                </select>
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
    _editingVehicleIdx = null;
    document.getElementById('vehicle-modal-title').textContent = '차량 추가';
    ['v-name','v-plate','v-capacity','v-memo'].forEach(id => { const el = document.getElementById(id); if(el) el.value = id==='v-capacity'?'45':''; });
    document.getElementById('vehicle-modal').classList.remove('hidden');
  };
  const editVehicle = (idx) => {
    const vehicles = Settings.get('vehicles') || window.VEHICLES || [];
    const v = vehicles[idx]; if(!v) return;
    _editingVehicleIdx = idx;
    document.getElementById('vehicle-modal-title').textContent = '차량 수정';
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val||''; };
    set('v-name', v.name); set('v-plate', v.plateNumber); set('v-capacity', v.capacity||45);
    set('v-type', v.type||'amphibious'); set('v-status', v.status||'active');
    set('v-inspection', v.inspectionDate||''); set('v-insurance', v.insuranceDate||'');
    set('v-memo', v.memo||'');
    document.getElementById('vehicle-modal').classList.remove('hidden');
  };
  const saveVehicle = () => {
    const get = (id) => document.getElementById(id)?.value||'';
    const vData = {
      name: get('v-name'), plateNumber: get('v-plate'), type: get('v-type'),
      capacity: parseInt(get('v-capacity'))||45, region: get('v-region'),
      status: get('v-status'), inspectionDate: get('v-inspection'),
      insuranceDate: get('v-insurance'), memo: get('v-memo'),
    };
    if (!vData.name || !vData.plateNumber) { Utils.toast('차량명과 번호판을 입력하세요', 'error'); return; }
    let vehicles = Settings.get('vehicles') || JSON.parse(JSON.stringify(window.VEHICLES||[]));
    if (_editingVehicleIdx !== null) vehicles[_editingVehicleIdx] = vData;
    else vehicles.push(vData);
    Settings.set('vehicles', vehicles);
    closeVehicleModal();
    Utils.toast('차량이 저장되었습니다.', 'success');
    vehiclesPage().then(html => { document.getElementById('app').innerHTML = html; });
  };
  const deleteVehicle = (idx) => {
    Utils.confirm('이 차량을 삭제하시겠습니까?', () => {
      let vehicles = Settings.get('vehicles') || JSON.parse(JSON.stringify(window.VEHICLES||[]));
      vehicles.splice(idx, 1);
      Settings.set('vehicles', vehicles);
      Utils.toast('삭제되었습니다.', 'success');
      vehiclesPage().then(html => { document.getElementById('app').innerHTML = html; });
    });
  };
  const closeVehicleModal = () => {
    const m = document.getElementById('vehicle-modal');
    if(m) m.classList.add('hidden');
  };

  // ── 일정 관리 ──────────────────────────────────────────────
  const schedulesPage = async () => {
    _adminState.currentSection = 'schedules';
    const regions = (window.REGIONS||[]).filter(r=>r.status==='active');
    const activeRegionId = _adminState.selectedRegion || regions[0]?.id || 'tongyeong';
    const allSchedules = Settings.get('schedules') || window.SCHEDULES || {};
    const schedules = allSchedules[activeRegionId] || [];

    const regionTabs = regions.map(r=>`
      <button onclick="AdminModule.selectScheduleRegion('${r.id}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${r.id===activeRegionId?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
        ${r.shortName}
      </button>
    `).join('');

    const scheduleRows = schedules.map((s, i) => `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 font-medium text-sm">${s.time || s.name}</td>
        <td class="px-4 py-3 text-sm text-center">${s.duration || 70}분</td>
        <td class="px-4 py-3 text-sm text-center">${s.capacity || 45}석</td>
        <td class="px-4 py-3 text-sm text-center">${s.onlineSeats || Math.round((s.capacity||45)*0.7)}석 / ${s.offlineSeats || Math.round((s.capacity||45)*0.3)}석</td>
        <td class="px-4 py-3 text-sm text-center">
          ${(s.operatingDays||['월','화','수','목','금','토','일']).join(', ')}
        </td>
        <td class="px-4 py-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-xs font-medium ${s.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}">
            ${s.status==='active'?'운영':'중단'}
          </span>
        </td>
        <td class="px-4 py-3 text-center">
          <button onclick="AdminModule.editSchedule('${activeRegionId}',${i})" class="text-blue-600 hover:underline text-xs mr-2">수정</button>
          <button onclick="AdminModule.toggleScheduleStatus('${activeRegionId}',${i})" class="text-orange-500 hover:underline text-xs mr-2">${s.status==='active'?'중단':'재개'}</button>
          <button onclick="AdminModule.deleteSchedule('${activeRegionId}',${i})" class="text-red-500 hover:underline text-xs">삭제</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" class="text-center py-4 text-gray-500 text-sm">일정이 없습니다.</td></tr>';

    const content = `
      <div class="space-y-4">
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div class="flex gap-2 flex-wrap">${regionTabs}</div>
          <div class="flex gap-2">
            <button onclick="AdminModule.showRecurringModal('${activeRegionId}')" class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2">
              <i class="fas fa-redo"></i> 반복 일정 생성
            </button>
            <button onclick="AdminModule.addSchedule('${activeRegionId}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
              <i class="fas fa-plus"></i> 일정 추가
            </button>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead>
                <tr class="bg-gray-50">
                  ${['출발시간','소요시간','총 정원','온라인/현장','운영요일','상태','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100" id="schedule-table-body">${scheduleRows}</tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 일정 추가/수정 모달 -->
      <div id="schedule-modal" class="modal-overlay hidden">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
          <h3 class="font-semibold text-gray-800 text-lg mb-4" id="schedule-modal-title">일정 추가</h3>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">출발 시간</label>
                <input id="s-time" type="time" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">소요 시간 (분)</label>
                <input id="s-duration" type="number" value="70" min="10" max="300" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">총 정원</label>
                <input id="s-capacity" type="number" value="45" min="1" max="200" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" oninput="AdminModule.updateSeatPreview()">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">온라인 비율 (%)</label>
                <input id="s-online-ratio" type="number" value="70" min="0" max="100" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" oninput="AdminModule.updateSeatPreview()">
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
                <label class="block text-xs font-medium text-gray-700 mb-1">적용 종료일 (미입력 시 무기한)</label>
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

      <!-- 반복 일정 생성 모달 -->
      <div id="recurring-modal" class="modal-overlay hidden">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
          <h3 class="font-semibold text-gray-800 text-lg mb-4"><i class="fas fa-redo text-purple-500 mr-2"></i>반복 일정 자동 생성</h3>
          <div class="space-y-3">
            <div class="p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
              설정한 시간대를 지정 기간 동안 매일 반복 생성합니다. 운영요일 외에는 자동 제외됩니다.
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
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">운행 시간대 (여러 개 입력 가능)</label>
              <div id="rec-times" class="space-y-2">
                <div class="flex gap-2"><input type="time" value="10:00" class="rec-time-input border rounded px-2 py-1 text-sm flex-1 focus:ring-2 focus:ring-purple-500 outline-none"><button onclick="this.parentElement.remove()" class="text-red-500 text-xs">삭제</button></div>
                <div class="flex gap-2"><input type="time" value="13:00" class="rec-time-input border rounded px-2 py-1 text-sm flex-1 focus:ring-2 focus:ring-purple-500 outline-none"><button onclick="this.parentElement.remove()" class="text-red-500 text-xs">삭제</button></div>
                <div class="flex gap-2"><input type="time" value="15:30" class="rec-time-input border rounded px-2 py-1 text-sm flex-1 focus:ring-2 focus:ring-purple-500 outline-none"><button onclick="this.parentElement.remove()" class="text-red-500 text-xs">삭제</button></div>
              </div>
              <button onclick="AdminModule.addRecTime()" class="mt-2 text-purple-600 text-xs hover:underline">+ 시간 추가</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">총 정원</label>
                <input id="rec-capacity" type="number" value="45" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">온라인 비율 (%)</label>
                <input id="rec-ratio" type="number" value="70" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
              </div>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="AdminModule.generateRecurring()" class="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700">자동 생성</button>
            <button onclick="document.getElementById('recurring-modal').classList.add('hidden')" class="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('schedules', content, '일정 관리');
  };

  const selectScheduleRegion = (regionId) => { _adminState.selectedRegion = regionId; schedulesPage().then(html => { document.getElementById('app').innerHTML = html; }); };
  const updateSeatPreview = () => {
    const cap = parseInt(document.getElementById('s-capacity')?.value)||45;
    const ratio = parseInt(document.getElementById('s-online-ratio')?.value)||70;
    const onl = Math.round(cap * ratio / 100);
    const off = cap - onl;
    if(document.getElementById('sp-online')) document.getElementById('sp-online').textContent = onl;
    if(document.getElementById('sp-offline')) document.getElementById('sp-offline').textContent = off;
  };
  let _editingScheduleIdx = null, _editingScheduleRegion = null;
  const addSchedule = (regionId) => { _editingScheduleIdx = null; _editingScheduleRegion = regionId; document.getElementById('schedule-modal-title').textContent = '일정 추가'; document.getElementById('schedule-modal').classList.remove('hidden'); };
  const editSchedule = (regionId, idx) => {
    const allSchedules = Settings.get('schedules') || window.SCHEDULES || {};
    const s = (allSchedules[regionId]||[])[idx]; if(!s) return;
    _editingScheduleIdx = idx; _editingScheduleRegion = regionId;
    document.getElementById('schedule-modal-title').textContent = '일정 수정';
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val||''; };
    set('s-time', s.time||''); set('s-duration', s.duration||70); set('s-capacity', s.capacity||45); set('s-online-ratio', s.onlineRatio||70);
    document.getElementById('schedule-modal').classList.remove('hidden');
    updateSeatPreview();
  };
  const saveSchedule = () => {
    const get = (id) => document.getElementById(id)?.value||'';
    const days = [...document.querySelectorAll('input[name="s-days"]:checked')].map(c=>c.value);
    const cap = parseInt(get('s-capacity'))||45;
    const ratio = parseInt(get('s-online-ratio'))||70;
    const sData = { time: get('s-time'), duration: parseInt(get('s-duration'))||70, capacity: cap, onlineRatio: ratio, onlineSeats: Math.round(cap*ratio/100), offlineSeats: cap - Math.round(cap*ratio/100), operatingDays: days, startDate: get('s-start-date'), endDate: get('s-end-date'), status: 'active' };
    if (!sData.time) { Utils.toast('출발 시간을 입력하세요', 'error'); return; }
    let allSchedules = Settings.get('schedules') || JSON.parse(JSON.stringify(window.SCHEDULES||{}));
    if (!allSchedules[_editingScheduleRegion]) allSchedules[_editingScheduleRegion] = [];
    if (_editingScheduleIdx !== null) allSchedules[_editingScheduleRegion][_editingScheduleIdx] = sData;
    else allSchedules[_editingScheduleRegion].push(sData);
    Settings.set('schedules', allSchedules);
    document.getElementById('schedule-modal').classList.add('hidden');
    Utils.toast('일정이 저장되었습니다.', 'success');
    schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
  };
  const toggleScheduleStatus = (regionId, idx) => {
    let allSchedules = Settings.get('schedules') || JSON.parse(JSON.stringify(window.SCHEDULES||{}));
    if (allSchedules[regionId]?.[idx]) { allSchedules[regionId][idx].status = allSchedules[regionId][idx].status === 'active' ? 'suspended' : 'active'; }
    Settings.set('schedules', allSchedules);
    schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
  };
  const deleteSchedule = (regionId, idx) => {
    Utils.confirm('이 일정을 삭제하시겠습니까?', () => {
      let allSchedules = Settings.get('schedules') || JSON.parse(JSON.stringify(window.SCHEDULES||{}));
      allSchedules[regionId]?.splice(idx, 1);
      Settings.set('schedules', allSchedules);
      Utils.toast('삭제되었습니다.', 'success');
      schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
    });
  };
  const showRecurringModal = (regionId) => { _editingScheduleRegion = regionId; document.getElementById('recurring-modal').classList.remove('hidden'); };
  const addRecTime = () => {
    const wrap = document.getElementById('rec-times');
    if(!wrap) return;
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `<input type="time" class="rec-time-input border rounded px-2 py-1 text-sm flex-1 focus:ring-2 focus:ring-purple-500 outline-none"><button onclick="this.parentElement.remove()" class="text-red-500 text-xs">삭제</button>`;
    wrap.appendChild(div);
  };
  const generateRecurring = () => {
    const start = document.getElementById('rec-start')?.value;
    const end = document.getElementById('rec-end')?.value;
    const times = [...document.querySelectorAll('.rec-time-input')].map(i=>i.value).filter(Boolean);
    const cap = parseInt(document.getElementById('rec-capacity')?.value)||45;
    const ratio = parseInt(document.getElementById('rec-ratio')?.value)||70;
    if (!start || !end || !times.length) { Utils.toast('시작일, 종료일, 시간을 모두 입력하세요', 'error'); return; }
    const count = times.length * Math.ceil((new Date(end)-new Date(start))/(86400000)+1);
    Utils.toast(`반복 일정 ${count}개가 생성되었습니다.`, 'success');
    document.getElementById('recurring-modal').classList.add('hidden');
  };

  // ── 요금 관리 ──────────────────────────────────────────────
  const faresPage = async () => {
    _adminState.currentSection = 'fares';
    const regions = (window.REGIONS||[]).filter(r=>r.status==='active');
    const activeRegionId = _adminState.selectedRegion || regions[0]?.id || 'tongyeong';
    const region = regions.find(r=>r.id===activeRegionId);
    const fares = region?.fares || [];
    const fareMode = Settings.get('fareChangeMode') || 'approval';

    const regionTabs = regions.map(r=>`
      <button onclick="AdminModule.selectFareRegion('${r.id}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${r.id===activeRegionId?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
        ${r.shortName}
      </button>
    `).join('');

    const fareRows = fares.map((f, i) => `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-sm font-medium">${f.label}</td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${f.type}</td>
        <td class="px-4 py-3 text-right">
          <span class="font-semibold text-gray-800">₩${(f.price||0).toLocaleString()}</span>
        </td>
        <td class="px-4 py-3 text-right text-gray-500">
          ${f.discountPrice ? `₩${f.discountPrice.toLocaleString()}` : '-'}
        </td>
        <td class="px-4 py-3 text-center">
          <button onclick="AdminModule.editFare('${activeRegionId}', ${i})" class="text-blue-600 hover:underline text-xs">수정</button>
        </td>
      </tr>
    `).join('');

    const content = `
      <div class="space-y-4">
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div class="flex gap-2 flex-wrap">${regionTabs}</div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
              <span class="text-xs text-gray-600">요금 변경 방식:</span>
              <select onchange="AdminModule.setFareMode(this.value)" class="text-xs border-0 focus:ring-0 outline-none font-medium">
                <option value="approval" ${fareMode==='approval'?'selected':''}>HQ 승인 후 적용</option>
                <option value="auto" ${fareMode==='auto'?'selected':''}>즉시 자동 적용</option>
              </select>
            </div>
            <button onclick="AdminModule.addFare('${activeRegionId}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
              <i class="fas fa-plus"></i> 요금 추가
            </button>
          </div>
        </div>

        ${fareMode==='approval' ? `
          <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
            <i class="fas fa-info-circle"></i>
            <span>현재 HQ 승인 후 적용 모드입니다. 요금 수정 시 본사 승인 후 적용됩니다.</span>
          </div>` : `
          <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
            <i class="fas fa-bolt"></i>
            <span>현재 즉시 자동 적용 모드입니다. 요금 수정 즉시 고객 화면에 반영됩니다.</span>
          </div>`}

        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <table class="admin-table w-full">
            <thead>
              <tr class="bg-gray-50">
                ${['구분','유형코드','정가','할인가','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">${fareRows || '<tr><td colspan="5" class="text-center py-4 text-gray-500">요금이 없습니다.</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      <!-- 요금 수정 모달 -->
      <div id="fare-modal" class="modal-overlay hidden">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
          <h3 class="font-semibold text-gray-800 text-lg mb-4" id="fare-modal-title">요금 수정</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">구분명</label>
              <input id="f-label" type="text" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">정가 (원)</label>
                <input id="f-price" type="number" min="0" step="1000" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">할인가 (원, 없으면 빈칸)</label>
                <input id="f-discount" type="number" min="0" step="1000" placeholder="없으면 빈칸" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">적용 시작일 (즉시 적용 시 오늘)</label>
              <input id="f-effective" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">변경 사유</label>
              <textarea id="f-reason" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="요금 변경 사유를 입력하세요"></textarea>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="AdminModule.saveFare()" class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">
              ${fareMode==='approval' ? '승인 요청' : '저장'}
            </button>
            <button onclick="document.getElementById('fare-modal').classList.add('hidden')" class="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('fares', content, '요금 관리');
  };

  const selectFareRegion = (regionId) => { _adminState.selectedRegion = regionId; faresPage().then(html => { document.getElementById('app').innerHTML = html; }); };
  const setFareMode = (mode) => { Settings.set('fareChangeMode', mode); Utils.toast(`요금 변경 방식이 "${mode==='approval'?'HQ 승인 후 적용':'즉시 자동 적용'}"으로 변경되었습니다.`, 'info'); };
  let _editingFareRegion = null, _editingFareIdx = null;
  const addFare = (regionId) => { _editingFareRegion = regionId; _editingFareIdx = null; document.getElementById('fare-modal-title').textContent='요금 추가'; ['f-label','f-price','f-discount','f-reason'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';}); document.getElementById('fare-modal').classList.remove('hidden'); };
  const editFare = (regionId, idx) => {
    const region = (window.REGIONS||[]).find(r=>r.id===regionId);
    const f = region?.fares?.[idx]; if(!f) return;
    _editingFareRegion = regionId; _editingFareIdx = idx;
    document.getElementById('fare-modal-title').textContent='요금 수정';
    document.getElementById('f-label').value = f.label||'';
    document.getElementById('f-price').value = f.price||0;
    document.getElementById('f-discount').value = f.discountPrice||'';
    document.getElementById('fare-modal').classList.remove('hidden');
  };
  const saveFare = () => {
    const get = (id) => document.getElementById(id)?.value||'';
    const label = get('f-label'); const price = parseInt(get('f-price'))||0;
    if (!label) { Utils.toast('구분명을 입력하세요', 'error'); return; }
    const fareMode = Settings.get('fareChangeMode') || 'approval';
    if (fareMode === 'approval') { Utils.toast('요금 변경 승인 요청이 접수되었습니다. HQ 승인 후 적용됩니다.', 'success'); }
    else { Utils.toast('요금이 즉시 적용되었습니다.', 'success'); }
    document.getElementById('fare-modal').classList.add('hidden');
  };

  // ── 좌석 배분 관리 ─────────────────────────────────────────
  const seatsPage = async () => {
    _adminState.currentSection = 'seats';
    const regions = (window.REGIONS||[]).filter(r=>r.status==='active');

    const regionCards = regions.map(r => `
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold text-gray-800">${r.name}</h3>
          <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">기본 정원 45석</span>
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
              <div class="font-bold text-blue-600" id="${r.id}-online-seats">${Math.round(45*r.onlineRatio/100)}</div>
              <div class="text-xs text-gray-500">온라인</div>
            </div>
            <div class="flex-1 bg-green-50 rounded-lg p-3 text-center">
              <div class="font-bold text-green-600" id="${r.id}-offline-seats">${45 - Math.round(45*r.onlineRatio/100)}</div>
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
    const cap = 45;
    const onlEl = document.getElementById(`${regionId}-online-val`);
    const onlSeats = document.getElementById(`${regionId}-online-seats`);
    const offSeats = document.getElementById(`${regionId}-offline-seats`);
    if (onlEl) onlEl.textContent = `${ratio}%`;
    if (onlSeats) onlSeats.textContent = Math.round(cap*ratio/100);
    if (offSeats) offSeats.textContent = cap - Math.round(cap*ratio/100);
  };
  const saveSeatRatio = (regionId) => {
    const slider = document.getElementById(`${regionId}-slider`);
    if (!slider) return;
    Utils.toast(`${regionId} 지역 좌석 배분이 저장되었습니다.`, 'success');
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
    const statusColors = { confirmed:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700', pending:'bg-yellow-100 text-yellow-700', checkedin:'bg-blue-100 text-blue-700' };
    const statusLabels = { confirmed:'확정', cancelled:'취소', pending:'대기', checkedin:'탑승완료' };
    if (!list.length) return '<tr><td colspan="10" class="text-center py-8 text-gray-400"><i class="fas fa-search mr-2"></i>검색 결과가 없습니다.</td></tr>';
    return list.slice(0, 50).map(r => `
      <tr class="hover:bg-gray-50" id="res-row-${r.id}">
        <td class="px-3 py-2 text-xs font-mono text-blue-600 whitespace-nowrap">${r.id}</td>
        <td class="px-3 py-2 text-sm font-medium">${r.name}</td>
        <td class="px-3 py-2 text-sm text-center">${r.regionName}</td>
        <td class="px-3 py-2 text-sm text-center whitespace-nowrap">${r.date}</td>
        <td class="px-3 py-2 text-sm text-center">${r.schedule}</td>
        <td class="px-3 py-2 text-sm text-center">${r.totalPassengers}명</td>
        <td class="px-3 py-2 text-right text-sm font-medium whitespace-nowrap">₩${r.totalAmount.toLocaleString()}</td>
        <td class="px-3 py-2 text-center text-xs text-gray-500">${r.payMethod}</td>
        <td class="px-3 py-2 text-center">
          <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]||'bg-gray-100 text-gray-600'}">
            ${statusLabels[r.status]||r.status}
          </span>
        </td>
        <td class="px-3 py-2 text-center whitespace-nowrap">
          <button onclick="AdminModule.viewReservation('${r.id}')" class="text-blue-600 hover:underline text-xs mr-1">상세</button>
          ${r.status !== 'cancelled'
            ? `<button onclick="AdminModule.cancelReservation('${r.id}')" class="text-red-500 hover:underline text-xs">취소</button>`
            : `<span class="text-xs text-gray-400">${r.isRefunded?'환불완료':'환불전'}</span>`}
        </td>
      </tr>
    `).join('');
  };

  // 실제 필터링 실행 함수 (검색 버튼 onclick)
  const filterReservations = () => {
    const user = _adminState.user || { role: 'super', regionId: null };
    const allRes = _generateDemoReservations();
    // 권한별 기본 필터
    let pool = (user.role === 'regional' && user.regionId)
      ? allRes.filter(r => r.regionId === user.regionId)
      : allRes;

    // 필터 값 읽기
    const fRegion = document.getElementById('res-filter-region')?.value || '';
    const fDate   = document.getElementById('res-filter-date')?.value || '';
    const fStatus = document.getElementById('res-filter-status')?.value || '';
    const fKeyword= (document.getElementById('res-filter-keyword')?.value || '').trim().toLowerCase();

    if (fRegion)  pool = pool.filter(r => r.regionId === fRegion);
    if (fDate)    pool = pool.filter(r => r.date === fDate);
    if (fStatus)  pool = pool.filter(r => r.status === fStatus);
    if (fKeyword) pool = pool.filter(r =>
      r.id.toLowerCase().includes(fKeyword) ||
      r.name.toLowerCase().includes(fKeyword)
    );

    // 결과 카운트 업데이트
    const countEl = document.getElementById('res-result-count');
    if (countEl) countEl.textContent = `검색 결과 ${pool.length}건 (최대 50건 표시)`;

    // 테이블 본문 교체
    const tbody = document.getElementById('res-tbody');
    if (tbody) tbody.innerHTML = _renderReservationRows(pool);
  };

  const reservationsPage = async () => {
    _adminState.currentSection = 'reservations';
    const allRes = _generateDemoReservations();
    const user = _adminState.user || { role: 'super', regionId: null };
    // 권한별 초기 데이터
    const reservations = (user.role === 'regional' && user.regionId)
      ? allRes.filter(r => r.regionId === user.regionId)
      : allRes;

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
                <option value="confirmed">확정</option>
                <option value="pending">대기</option>
                <option value="checkedin">탑승완료</option>
                <option value="cancelled">취소</option>
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
                  ${['예약번호','예약자','지역','날짜','회차','인원','금액','결제','상태','관리'].map(h=>`<th class="px-3 py-2 text-xs font-semibold text-gray-600 text-center whitespace-nowrap">${h}</th>`).join('')}
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

  const viewReservation = (id) => {
    const allRes = _generateDemoReservations();
    const r = allRes.find(x => x.id === id);
    if (!r) { Utils.toast('예약 정보를 찾을 수 없습니다.', 'error'); return; }
    const statusLabels = { confirmed:'확정', cancelled:'취소', pending:'대기', checkedin:'탑승완료' };
    Utils.confirm(
      `<div class="text-left space-y-1.5 text-sm">
        <div class="font-bold text-base mb-2">${r.id}</div>
        <div class="flex justify-between"><span class="text-gray-500">예약자</span><span class="font-medium">${r.name}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">지역</span><span>${r.regionName}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">날짜·회차</span><span>${r.date} ${r.schedule}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">인원</span><span>성인 ${r.adultCnt}명 / 소아 ${r.childCnt}명</span></div>
        <div class="flex justify-between"><span class="text-gray-500">결제금액</span><span class="font-bold">₩${r.totalAmount.toLocaleString()}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">결제수단</span><span>${r.payMethod}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">유입경로</span><span>${r.source}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">상태</span><span>${statusLabels[r.status]||r.status}</span></div>
      </div>`,
      () => {},
      { confirmText: '닫기', cancelText: null, title: '예약 상세 정보' }
    );
  };

  const cancelReservation = (id) => {
    Utils.confirm(`예약 ${id}를 취소하시겠습니까?\n취소 후에는 환불 정책에 따라 처리됩니다.`, () => {
      // 실제로는 API 호출; 데모에서는 행 UI만 업데이트
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
    const allRes = _generateDemoReservations();
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
    const allBands = _generateDemoWristbands();
    const user = _adminState.user || { role: 'super', regionId: null };
    const wristbands = user.role === 'regional' && user.regionId
      ? allBands.filter(w => w.regionName === ({tongyeong:'통영',buyeo:'부여',hapcheon:'합천'}[user.regionId]))
      : allBands;
    const wbText = Settings.get('wristbandText') || { brand: 'Aqua Mobility Korea', footer: '분실 시 재발급 불가', warning: '이 밴드는 탑승권입니다' };

    const activeCount = wristbands.filter(w=>w.status==='active').length;
    const usedCount   = wristbands.filter(w=>w.status==='used').length;
    const invalidCount= wristbands.filter(w=>w.status==='invalidated').length;

    const rows = wristbands.slice(0, 20).map(w => `
      <tr class="hover:bg-gray-50">
        <td class="px-3 py-2 text-xs font-mono whitespace-nowrap">${w.id}</td>
        <td class="px-3 py-2 text-xs font-mono text-blue-600 whitespace-nowrap">${w.reservationId}</td>
        <td class="px-3 py-2 text-sm text-center">${w.regionName}</td>
        <td class="px-3 py-2 text-sm text-center whitespace-nowrap">${w.round}</td>
        <td class="px-3 py-2 text-sm text-center">${w.ticketType}</td>
        <td class="px-3 py-2 text-center">
          <span class="px-2 py-0.5 rounded-full text-xs font-medium ${w.status==='active'?'bg-green-100 text-green-700':w.status==='used'?'bg-gray-100 text-gray-500':'bg-red-100 text-red-700'}">
            ${w.status==='active'?'유효':w.status==='used'?'사용완료':'무효화'}
          </span>
        </td>
        <td class="px-3 py-2 text-xs text-gray-500 text-center whitespace-nowrap">${w.issuedAt}</td>
        <td class="px-3 py-2 text-center">
          <button onclick="Utils.toast('QR: ${w.qrCode}', 'info')" class="text-blue-600 hover:underline text-xs">QR확인</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" class="text-center py-4 text-gray-500">발급 내역이 없습니다.</td></tr>';

    const content = `
      <div class="space-y-4">
        <!-- 손목밴드 인쇄 문구 편집 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i class="fas fa-edit text-blue-500"></i> 손목밴드 인쇄 문구 관리 (관리자 직접 편집)
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">브랜드명</label>
              <input id="wb-brand" type="text" value="${wbText.brand}" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">하단 문구</label>
              <input id="wb-footer" type="text" value="${wbText.footer}" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">경고 문구</label>
              <input id="wb-warning" type="text" value="${wbText.warning}" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
          </div>
          <div class="mt-3 p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
            <i class="fas fa-shield-alt mr-1"></i> 개인정보 보호: 손목밴드에는 성명, 전화번호, 생년월일을 절대 인쇄하지 않습니다.
          </div>
          <div class="mt-3 flex justify-end">
            <button onclick="AdminModule.saveWristbandText()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              <i class="fas fa-save mr-1"></i> 저장
            </button>
          </div>
        </div>

        <!-- 밴드 발급 현황 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-800 mb-4">손목밴드 발급 현황</h2>
          <div class="grid grid-cols-3 gap-3 mb-4">
            ${statCard('fas fa-check-circle','유효 밴드',`${activeCount}개`,'체크인 대기','green')}
            ${statCard('fas fa-history','사용 완료',`${usedCount}개`,'탑승 처리됨','blue')}
            ${statCard('fas fa-ban','무효화',`${invalidCount}개`,'취소/만료','red')}
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead>
                <tr class="bg-gray-50">
                  ${['밴드ID','예약번호','지역','회차','유형','상태','발급시간','QR'].map(h=>`<th class="px-3 py-2 text-xs font-semibold text-gray-600 text-center whitespace-nowrap">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">${rows}</tbody>
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

  // ── 팝업/공지 관리 ─────────────────────────────────────────
  const popupsPage = async () => {
    _adminState.currentSection = 'popups';
    const popups = Settings.get('popups') || window.POPUPS || [];
    const notices = Settings.get('notices') || window.NOTICES || [];

    const popupRows = popups.map((p, i) => `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-sm font-medium">${p.title}</td>
        <td class="px-4 py-3 text-sm text-center">${p.region || '전체'}</td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${p.startDate||'-'} ~ ${p.endDate||'-'}</td>
        <td class="px-4 py-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-xs ${p.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}">${p.isActive?'노출중':'비노출'}</span>
        </td>
        <td class="px-4 py-3 text-center">
          <button onclick="AdminModule.editPopup(${i})" class="text-blue-600 hover:underline text-xs mr-2">수정</button>
          <button onclick="AdminModule.deletePopup(${i})" class="text-red-500 hover:underline text-xs">삭제</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5" class="text-center py-4 text-gray-500">팝업이 없습니다.</td></tr>';

    const noticeRows = notices.slice(0, 5).map((n, i) => `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3">
          <span class="px-1.5 py-0.5 rounded text-xs font-medium mr-2 ${n.type==='urgent'?'bg-red-100 text-red-700':n.type==='event'?'bg-purple-100 text-purple-700':'bg-gray-100 text-gray-600'}">${n.type==='urgent'?'긴급':n.type==='event'?'이벤트':'공지'}</span>
          <span class="text-sm">${n.title}</span>
        </td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${n.date||'-'}</td>
        <td class="px-4 py-3 text-center">
          <button onclick="AdminModule.editNotice(${i})" class="text-blue-600 hover:underline text-xs mr-2">수정</button>
          <button onclick="AdminModule.deleteNotice(${i})" class="text-red-500 hover:underline text-xs">삭제</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="3" class="text-center py-4 text-gray-500">공지가 없습니다.</td></tr>';

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
            <thead><tr class="bg-gray-50">${['제목','대상지역','노출기간','상태','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}</tr></thead>
            <tbody class="divide-y divide-gray-100">${popupRows}</tbody>
          </table>
        </div>

        <!-- 공지 관리 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-gray-800">공지사항 관리</h2>
            <button onclick="AdminModule.addNotice()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
              <i class="fas fa-plus"></i> 공지 추가
            </button>
          </div>
          <table class="admin-table w-full">
            <thead><tr class="bg-gray-50">${['제목','날짜','관리'].map(h=>`<th class="px-4 py-3 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}</tr></thead>
            <tbody class="divide-y divide-gray-100">${noticeRows}</tbody>
          </table>
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
                <select id="pop-region" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">전체</option>
                  ${(window.REGIONS||[]).filter(r=>r.status==='active').map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}
                </select>
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
    `;
    return renderAdminLayout('popups', content, '팝업/공지 관리');
  };

  let _editingPopupIdx = null;
  const addPopup = () => { _editingPopupIdx = null; document.getElementById('popup-modal-title').textContent='팝업 추가'; ['pop-title','pop-content'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';}); document.getElementById('popup-modal').classList.remove('hidden'); };
  const editPopup = (idx) => { _editingPopupIdx = idx; document.getElementById('popup-modal-title').textContent='팝업 수정'; const p=(Settings.get('popups')||window.POPUPS||[])[idx]; if(!p)return; document.getElementById('pop-title').value=p.title||''; document.getElementById('pop-content').value=p.content||''; document.getElementById('popup-modal').classList.remove('hidden'); };
  const savePopup = () => {
    const title = document.getElementById('pop-title')?.value; if(!title){Utils.toast('제목을 입력하세요','error');return;}
    let popups = JSON.parse(JSON.stringify(Settings.get('popups')||window.POPUPS||[]));
    const pData = { title, content: document.getElementById('pop-content')?.value||'', region: document.getElementById('pop-region')?.value||'', type: document.getElementById('pop-type')?.value||'normal', startDate: document.getElementById('pop-start')?.value||'', endDate: document.getElementById('pop-end')?.value||'', isActive: document.getElementById('pop-active')?.checked||false };
    if(_editingPopupIdx!==null) popups[_editingPopupIdx]=pData; else popups.push(pData);
    Settings.set('popups', popups);
    document.getElementById('popup-modal').classList.add('hidden');
    Utils.toast('팝업이 저장되었습니다.', 'success');
    popupsPage().then(html=>{document.getElementById('app').innerHTML=html;});
  };
  const deletePopup = (idx) => { Utils.confirm('팝업을 삭제하시겠습니까?',()=>{ let p=JSON.parse(JSON.stringify(Settings.get('popups')||window.POPUPS||[])); p.splice(idx,1); Settings.set('popups',p); Utils.toast('삭제되었습니다.','success'); popupsPage().then(html=>{document.getElementById('app').innerHTML=html;}); }); };
  const addNotice = () => Utils.toast('공지사항 추가 모달 (구현 중)', 'info');
  const editNotice = (idx) => Utils.toast(`공지사항 ${idx} 수정 모달 (구현 중)`, 'info');
  const deleteNotice = (idx) => { Utils.confirm('공지사항을 삭제하시겠습니까?',()=>Utils.toast('삭제되었습니다.','success')); };

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
  const seoManagePage = async () => {
    _adminState.currentSection = 'seo';
    const regions = (window.REGIONS||[]).filter(r=>r.status==='active');
    const seoSettings = Settings.get('seoSettings') || {};
    const activeRegionId = _adminState.selectedRegion || regions[0]?.id || 'tongyeong';
    const region = regions.find(r=>r.id===activeRegionId);
    const regionSeo = (window.REGION_SEO||{})[activeRegionId] || {};
    const saved = seoSettings[activeRegionId] || {};

    const regionTabs = regions.map(r=>`
      <button onclick="AdminModule.selectSeoRegion('${r.id}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${r.id===activeRegionId?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
        ${r.shortName}
      </button>
    `).join('');

    const content = `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          <i class="fas fa-search mr-2"></i>
          <strong>관리자 직접 편집:</strong> 각 지역별 SEO 정보를 직접 수정하세요. 저장 즉시 검색엔진에 반영됩니다.
        </div>

        <div class="flex gap-2 flex-wrap">${regionTabs}</div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- 기본 SEO -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="font-semibold text-gray-800 mb-4">기본 SEO 설정 - ${region?.name||''}</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">페이지 제목 (title 태그)</label>
                <input id="seo-title" type="text" value="${saved.title||regionSeo.title||''}" maxlength="60"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <p class="text-xs text-gray-400 mt-0.5">권장 50-60자</p>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">메타 설명</label>
                <textarea id="seo-desc" rows="3" maxlength="160" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none">${saved.description||regionSeo.description||''}</textarea>
                <p class="text-xs text-gray-400 mt-0.5">권장 150-160자</p>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">키워드 (쉼표 구분)</label>
                <input id="seo-keywords" type="text" value="${(saved.keywords||regionSeo.keywords||[]).join(', ')}"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">H1 제목</label>
                <input id="seo-h1" type="text" value="${saved.h1||regionSeo.h1||''}"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
          </div>

          <!-- OG / SNS -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="font-semibold text-gray-800 mb-4">SNS 공유 (Open Graph)</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">OG 제목</label>
                <input id="seo-og-title" type="text" value="${saved.ogTitle||regionSeo.ogTitle||''}"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">OG 설명</label>
                <textarea id="seo-og-desc" rows="3" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none">${saved.ogDescription||regionSeo.ogDescription||''}</textarea>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">OG 이미지 URL</label>
                <input id="seo-og-img" type="url" value="${saved.ogImage||regionSeo.ogImage||''}"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://...">
              </div>
            </div>
          </div>
        </div>

        <!-- 검색엔진 인증 코드 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="font-semibold text-gray-800 mb-4">검색엔진 인증 코드 (사이트 전체 적용)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"><i class="fab fa-google text-red-500 mr-1"></i>Google Search Console 인증 코드</label>
              <input id="seo-google-verify" type="text" placeholder="예: abc123xyz..."
                value="${(Settings.get('searchConsole')||{}).googleVerification||''}"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"><i class="fas fa-search text-green-500 mr-1"></i>Naver Search Advisor 인증 코드</label>
              <input id="seo-naver-verify" type="text" placeholder="예: abc123xyz..."
                value="${(Settings.get('searchConsole')||{}).naverVerification||''}"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"><i class="fab fa-google text-blue-500 mr-1"></i>Google Analytics ID</label>
              <input id="seo-ga-id" type="text" placeholder="G-XXXXXXXXXX"
                value="${(Settings.get('analytics')||{}).gaId||''}"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">네이버 애널리틱스 ID</label>
              <input id="seo-naver-analytics" type="text" placeholder="na_xxxxxx"
                value="${(Settings.get('analytics')||{}).naverAnalyticsId||''}"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono">
            </div>
          </div>
        </div>

        <!-- 네이버 스마트플레이스 / 구글 비즈니스 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="font-semibold text-gray-800 mb-4">지역 비즈니스 정보 - ${region?.name||''}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2"><i class="fas fa-map-marker-alt text-green-500"></i>네이버 스마트플레이스</h4>
              <div><label class="block text-xs text-gray-600 mb-1">스마트플레이스 URL</label>
                <input type="url" placeholder="https://smartplace.naver.com/..." class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
              <div><label class="block text-xs text-gray-600 mb-1">운영시간</label>
                <input type="text" placeholder="09:00 - 18:00" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
            </div>
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2"><i class="fab fa-google text-blue-500"></i>구글 비즈니스 프로필</h4>
              <div><label class="block text-xs text-gray-600 mb-1">구글 비즈니스 URL</label>
                <input type="url" placeholder="https://business.google.com/..." class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
              <div><label class="block text-xs text-gray-600 mb-1">Google Place ID</label>
                <input type="text" placeholder="ChIJ..." class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"></div>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button onclick="AdminModule.saveSeoSettings('${activeRegionId}')" class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <i class="fas fa-save"></i> SEO 설정 저장
          </button>
        </div>
      </div>
    `;
    return renderAdminLayout('seo', content, 'SEO 관리');
  };

  const selectSeoRegion = (regionId) => { _adminState.selectedRegion = regionId; seoManagePage().then(html=>{document.getElementById('app').innerHTML=html;}); };
  const saveSeoSettings = (regionId) => {
    const get = (id) => document.getElementById(id)?.value||'';
    let allSeo = Settings.get('seoSettings') || {};
    allSeo[regionId] = { title: get('seo-title'), description: get('seo-desc'), keywords: get('seo-keywords').split(',').map(k=>k.trim()).filter(Boolean), h1: get('seo-h1'), ogTitle: get('seo-og-title'), ogDescription: get('seo-og-desc'), ogImage: get('seo-og-img') };
    Settings.set('seoSettings', allSeo);
    Settings.set('searchConsole', { googleVerification: get('seo-google-verify'), naverVerification: get('seo-naver-verify') });
    Settings.set('analytics', { gaId: get('seo-ga-id'), naverAnalyticsId: get('seo-naver-analytics') });
    Utils.toast('SEO 설정이 저장되었습니다.', 'success');
  };

  // ── 새 지역 추가 ───────────────────────────────────────────
  const regionsPage = async () => {
    _adminState.currentSection = 'regions';
    const regions = window.REGIONS || [];

    const regionCards = regions.map((r, i) => `
      <div class="bg-white rounded-xl shadow-sm p-5 border-l-4 ${r.status==='active'?'border-green-500':r.status==='preparing'?'border-yellow-400':'border-gray-300'}">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold text-gray-800">${r.name}</h3>
            <p class="text-xs text-gray-500">${r.code} · ${r.location||''}</p>
          </div>
          <span class="px-2 py-1 rounded-full text-xs font-medium ${r.status==='active'?'bg-green-100 text-green-700':r.status==='preparing'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-500'}">
            ${r.status==='active'?'운영중':r.status==='preparing'?'준비중':'미운영'}
          </span>
        </div>
        ${r.company ? `<p class="text-xs text-gray-600 mb-1"><i class="fas fa-building mr-1"></i>${r.company.name}</p>` : ''}
        ${r.pgMerchant ? `<p class="text-xs text-gray-600 mb-3"><i class="fas fa-credit-card mr-1"></i>${r.pgMerchant.pgName} - <code class="bg-gray-100 px-1 rounded">${r.pgMerchant.merchantId}</code></p>` : ''}
        <div class="flex gap-2 flex-wrap">
          <button onclick="AdminModule.editRegion(${i})" class="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs hover:bg-blue-100">수정</button>
          ${r.status==='active' ? `<button onclick="AdminModule.suspendRegion(${i})" class="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs hover:bg-red-100">운영 중단</button>` : `<button onclick="AdminModule.activateRegion(${i})" class="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs hover:bg-green-100">운영 시작</button>`}
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
                <div><label class="block text-xs text-gray-600 mb-1">지역명</label><input id="reg-name" type="text" placeholder="예: 경주수륙양용투어" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
                <div><label class="block text-xs text-gray-600 mb-1">코드 (3자리)</label><input id="reg-code" type="text" placeholder="예: GYJ" maxlength="5" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"></div>
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
  const editRegion = (idx) => { Utils.toast(`지역 ${idx} 수정 (구현 중)`, 'info'); };
  const suspendRegion = (idx) => { Utils.confirm('이 지역 운영을 중단하시겠습니까?', () => Utils.toast('운영이 중단되었습니다.', 'success')); };
  const activateRegion = (idx) => { Utils.confirm('이 지역 운영을 시작하시겠습니까?', () => Utils.toast('운영이 시작되었습니다.', 'success')); };
  const saveNewRegion = () => {
    const get = (id) => document.getElementById(id)?.value||'';
    const name = get('reg-name'); const code = get('reg-code');
    if (!name || !code) { Utils.toast('지역명과 코드를 입력하세요', 'error'); return; }
    Utils.toast(`"${name}" 지역이 추가되었습니다. SEO 설정을 구성하세요.`, 'success');
    document.getElementById('region-modal').classList.add('hidden');
    regionsPage().then(html=>{document.getElementById('app').innerHTML=html;});
  };

  // ── 정산 관리 ──────────────────────────────────────────────
  const settlementPage = async () => {
    _adminState.currentSection = 'settlement';
    const user = _adminState.user || { role: 'super', regionId: null };

    // 권한별 접근 가능 지역 필터 (hidden 제외, active→open/preparing 통일)
    const allRegions = (window.REGIONS||[]).filter(r => r.status !== 'hidden');
    const visibleRegions = (user.role === 'regional' && user.regionId)
      ? allRegions.filter(r => r.id === user.regionId)
      : allRegions;

    // 지역명 매핑 (regionId → 한글명)
    const REGION_NAMES = { tongyeong:'통영', buyeo:'부여', hapcheon:'합천' };

    // 지역 드롭다운 옵션
    const regionOpts = (user.role === 'regional' && user.regionId)
      ? `<option value="${user.regionId}">${REGION_NAMES[user.regionId]||user.regionId}</option>`
      : [
          '<option value="">전체 지역</option>',
          ...allRegions.map(r=>`<option value="${r.id}">${r.name||REGION_NAMES[r.id]||r.id}</option>`)
        ].join('');

    // 일일 정산 행 생성 (권한에 따른 지역명 동적 반영)
    const settlementRows = [...Array(7)].map((_, i) => {
      const date = new Date(); date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0,10);
      const online  = Math.floor(Math.random()*5000000)+2000000;
      const offline = Math.floor(Math.random()*2000000)+500000;
      const total   = online + offline;
      const cash    = Math.floor(offline*0.3);
      const card    = total - cash;
      const isClosed = i > 0;

      // 지역: regional은 자기 지역명, super는 첫 번째 visible 지역명 순환
      const rowRegion = (user.role === 'regional' && user.regionId)
        ? (REGION_NAMES[user.regionId] || user.regionId)
        : (REGION_NAMES[visibleRegions[i % Math.max(visibleRegions.length,1)]?.id] || '전체');

      return `
        <tr class="hover:bg-gray-50">
          <td class="px-3 py-2 text-sm text-gray-600">${dateStr}</td>
          <td class="px-3 py-2 text-sm text-center font-medium text-gray-700">${rowRegion}</td>
          <td class="px-3 py-2 text-sm text-right">₩${online.toLocaleString()}</td>
          <td class="px-3 py-2 text-sm text-right">₩${offline.toLocaleString()}</td>
          <td class="px-3 py-2 text-sm text-right font-semibold text-gray-800">₩${total.toLocaleString()}</td>
          <td class="px-3 py-2 text-sm text-right text-gray-600">₩${cash.toLocaleString()}</td>
          <td class="px-3 py-2 text-sm text-right text-gray-600">₩${card.toLocaleString()}</td>
          <td class="px-3 py-2 text-center">
            <span class="px-2 py-0.5 rounded-full text-xs font-medium
              ${isClosed ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}">
              ${isClosed ? '마감완료' : '마감전'}
            </span>
          </td>
          <td class="px-3 py-2 text-center">
            ${!isClosed
              ? `<button onclick="AdminModule.closeDay('${dateStr}')"
                   class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">마감</button>`
              : `<button onclick="AdminModule.viewSettlement('${dateStr}')"
                   class="text-blue-600 hover:underline text-xs">상세</button>`}
          </td>
        </tr>
      `;
    }).join('');

    const content = `
      <div class="space-y-6">
        <!-- 요약 카드 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          ${statCard('fas fa-calendar-day', '오늘 정산 대기', '3건', '마감 전', 'orange')}
          ${statCard('fas fa-check-circle', '이번달 완료', '28건', '₩127,450,000', 'green')}
          ${statCard('fas fa-exclamation-triangle', '수정 요청', '1건', 'HQ 승인 필요', 'red')}
          ${statCard('fas fa-calculator', '총 누적 정산', '152건', '₩634,200,000', 'blue')}
        </div>

        ${user.role === 'regional' ? `
        <div class="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <i class="fas fa-info-circle flex-shrink-0"></i>
          <span><strong>${REGION_NAMES[user.regionId]||user.regionId}</strong> 지역 정산 데이터만 표시됩니다.</span>
        </div>` : ''}

        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 class="font-semibold text-gray-800">일일 정산 내역</h2>
            <div class="flex gap-2 flex-wrap">
              <select id="stl-filter-region"
                class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                ${user.role === 'regional' ? 'disabled' : ''}>
                ${regionOpts}
              </select>
              <input type="month" id="stl-filter-month"
                value="${new Date().toISOString().slice(0,7)}"
                class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <button onclick="AdminModule.exportSettlement()"
                class="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
                <i class="fas fa-download"></i> CSV
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table w-full">
              <thead>
                <tr class="bg-gray-50">
                  ${['날짜','지역','온라인 매출','현장 매출','총 매출','현금','카드','상태','관리'].map(h=>
                    `<th class="px-3 py-2 text-xs font-semibold text-gray-600 text-center whitespace-nowrap">${h}</th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">${settlementRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('settlement', content, '정산 관리');
  };

  const closeDay = (date) => {
    Utils.confirm(
      `${date} 정산을 마감하시겠습니까?\n마감 후 수정은 HQ 승인이 필요합니다.`,
      () => Utils.toast('일일 정산이 마감되었습니다.', 'success')
    );
  };
  const viewSettlement = (date) => {
    Utils.toast(`${date} 정산 상세 조회 (구현 중)`, 'info');
  };
  const exportSettlement = () => {
    const user = _adminState.user || { role: 'super', regionId: null };
    const REGION_NAMES = { tongyeong:'통영', buyeo:'부여', hapcheon:'합천' };
    const regionLabel = (user.role === 'regional' && user.regionId)
      ? (REGION_NAMES[user.regionId] || user.regionId)
      : '전체';
    const month = document.getElementById('stl-filter-month')?.value || new Date().toISOString().slice(0,7);
    const rows = [
      ['아쿠아모빌리티코리아 정산 내역'],
      [`기간: ${month}`, `지역: ${regionLabel}`, `생성: ${new Date().toLocaleString('ko-KR')}`],
      [],
      ['날짜','지역','온라인 매출','현장 매출','총 매출','현금','카드','상태'],
      ...[...Array(7)].map((_,i)=>{
        const d = new Date(); d.setDate(d.getDate()-i);
        const on = Math.floor(Math.random()*5000000)+2000000;
        const off= Math.floor(Math.random()*2000000)+500000;
        const tot= on+off;
        return [d.toISOString().slice(0,10), regionLabel, on, off, tot, Math.floor(off*0.3), tot-Math.floor(off*0.3), i>0?'마감완료':'마감전'];
      }),
    ];
    Utils.downloadCSV(rows, `settlement_${month.replace('-','_')}_${new Date().toISOString().slice(0,10)}.csv`);
    Utils.toast('정산 내역 CSV가 다운로드됩니다.', 'success');
  };

  // ── 관리자 계정 관리 ───────────────────────────────────────
  const adminsPage = async () => {
    _adminState.currentSection = 'admins';
    const admins = window.ADMIN_USERS || [];

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
  const backupPage = async () => {
    _adminState.currentSection = 'backup';
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
            <h2 class="font-semibold text-gray-800 mb-4"><i class="fas fa-list text-orange-500 mr-2"></i>시스템 로그</h2>
            <div class="space-y-2 text-xs font-mono text-gray-600 bg-gray-50 rounded-lg p-3 h-40 overflow-y-auto">
              <p>[2025-05-11 09:15] admin 로그인 성공</p>
              <p>[2025-05-11 09:20] 통영 일정 수정 (10:00 회차)</p>
              <p>[2025-05-11 09:35] 부여 요금 변경 요청 (성인 30000→32000)</p>
              <p>[2025-05-11 10:12] 팝업 생성 (통영 특별할인)</p>
              <p>[2025-05-11 11:00] 일일 정산 마감 (2025-05-10)</p>
            </div>
          </div>
        </div>
      </div>
    `;
    return renderAdminLayout('backup', content, '백업/로그');
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

  // ── 공개 API ───────────────────────────────────────────────
  return {
    // 페이지
    loginPage, hqDashboard, regionDashboard, vehiclesPage, schedulesPage, faresPage,
    seatsPage, reservationsPage, wristbandsPage, popupsPage, termsPage, seoManagePage,
    regionsPage, settlementPage, adminsPage, settingsAdminPage, backupPage, statsAdminPage,
    // 액션
    doLogin, logout, navigate, toggleSidebar, toggleMobileSidebar, closeMobileSidebar, approveFare, fillLogin,
    addVehicle, editVehicle, saveVehicle, deleteVehicle, closeVehicleModal,
    selectScheduleRegion, addSchedule, editSchedule, saveSchedule, toggleScheduleStatus,
    deleteSchedule, showRecurringModal, addRecTime, generateRecurring, updateSeatPreview,
    selectFareRegion, setFareMode, addFare, editFare, saveFare,
    updateSeatRatio, saveSeatRatio,
    viewReservation, cancelReservation, exportReservations, filterReservations, resetReservationFilter,
    saveWristbandText,
    addPopup, editPopup, savePopup, deletePopup, addNotice, editNotice, deleteNotice,
    showTermsTab, saveTerms, previewTerms,
    selectSeoRegion, saveSeoSettings,
    showAddRegionModal, editRegion, suspendRegion, activateRegion, saveNewRegion,
    closeDay, viewSettlement, exportSettlement,
    addAdmin, resetPassword, deleteAdmin,
    saveSmsTemplates, resetSettings,
  };
})();

window.AdminModule = AdminModule;
