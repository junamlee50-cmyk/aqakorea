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
      { icon: 'fas fa-map-marked-alt', label: '관광정보 관리', section: 'tourism' },
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
                <div class="flex items-center flex-shrink-0">
                  <img src="/static/logo.svg" alt="Aqua Mobility Korea" style="height:28px;width:auto;object-fit:contain;">
                </div>
                <div class="overflow-hidden">
                  <div class="text-white font-bold text-sm whitespace-nowrap" style="display:none;">아쿠아모빌리티</div>
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
            <div class="flex justify-center mb-4">
              <img src="/static/logo.svg" alt="Aqua Mobility Korea" style="height:52px;width:auto;object-fit:contain;">
            </div>
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
    const activeRegions = regions.filter(r => r.status === 'active' || r.status === 'open');
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
            <span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">운영중</span>
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

    // ★ localStorage에서 실제 승인 대기 목록 로드
    const fareApprovals = _getFareApprovals().filter(a => a.status === 'pending');
    const approvalRows = fareApprovals.length === 0
      ? '<tr><td colspan="7" class="text-center py-6 text-gray-400 text-sm">대기 중인 승인 요청이 없습니다.</td></tr>'
      : fareApprovals.map((a, i) => {
        const regionName = (window.REGIONS||[]).find(r=>r.id===a.regionId)?.name || a.regionId || '알 수 없음';
        return `
        <tr class="hover:bg-orange-50" id="hq-appr-row-${i}">
          <td class="px-4 py-3 text-sm font-medium">${regionName}</td>
          <td class="px-4 py-3 text-sm">${a.label}</td>
          <td class="px-4 py-3 text-sm text-center text-gray-500">${a.type||'일반'}</td>
          <td class="px-4 py-3 text-sm text-right font-semibold text-blue-700">₩${(a.price||0).toLocaleString()}</td>
          <td class="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">${a.reason||'-'}</td>
          <td class="px-4 py-3 text-xs text-gray-400 text-center">${a.requestedBy||'지역관리자'}<br>${a.requestedAt||'-'}</td>
          <td class="px-4 py-3 text-center">
            <button onclick="AdminModule.approvefare(${i}, true)" class="bg-green-500 text-white px-2 py-1 rounded text-xs mr-1 hover:bg-green-600">승인</button>
            <button onclick="AdminModule.approvefare(${i}, false)" class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">반려</button>
          </td>
        </tr>`;
      }).join('');

    const pendingScheduleCount = (() => {
      const allSch = Settings.get('schedules') || {};
      return Object.values(allSch).reduce((sum, arr) => sum + (arr||[]).filter(s=>s.status==='active').length, 0);
    })();

    const content = `
      <div class="space-y-6">
        <!-- 상단 요약 카드 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          ${statCard('fas fa-map-marker-alt', '운영 지역', `${activeRegions.length}개`, `전체 ${regions.length}개 중`, 'blue')}
          ${statCard('fas fa-users', '오늘 총 예약', '1,247명', '전일 대비 +12%', 'green')}
          ${statCard('fas fa-won-sign', '오늘 총 매출', '₩38,450,000', '결제 완료 기준', 'purple')}
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

  // ── 지역 대시보드 (지역별 독립 데이터) ───────────────────────
  const _REGION_DASH_DATA = {
    tongyeong: {
      todayRes: 248, todayGoal: 300, todaySales: 8680000, onlineSales: 6944000,
      remainSeats: 42, remainRound: '14:00 회차', wristbands: 221, wristbandRate: 89,
      schedules: [
        { time:'10:00', capacity:45, booked:38, status:'active', label:'1회차' },
        { time:'12:00', capacity:45, booked:45, status:'full',   label:'2회차' },
        { time:'14:00', capacity:45, booked:3,  status:'active', label:'3회차' },
        { time:'15:30', capacity:45, booked:0,  status:'active', label:'4회차' },
      ],
      recentRes: [
        {no:'AMK-20250511-T001',name:'김**',count:4,amount:140000,status:'confirmed'},
        {no:'AMK-20250511-T002',name:'이**',count:2,amount:70000, status:'confirmed'},
        {no:'AMK-20250511-T003',name:'박**',count:6,amount:210000,status:'checkedin'},
        {no:'AMK-20250511-T004',name:'최**',count:3,amount:105000,status:'pending'},
      ],
      monthSales: [320,410,280,520,490,600,380,720,650,580,460,390],
      alerts: [
        { type:'warning', msg:'3회차 좌석 3석만 남아 있습니다.', time:'12:35' },
        { type:'info',    msg:'오늘 단체 예약(20명) 입금 확인이 필요합니다.', time:'11:20' },
        { type:'success', msg:'이번 주 예약률 94% 달성!', time:'09:00' },
      ],
    },
    buyeo: {
      todayRes: 312, todayGoal: 350, todaySales: 10920000, onlineSales: 8736000,
      remainSeats: 38, remainRound: '15:30 회차', wristbands: 287, wristbandRate: 92,
      schedules: [
        { time:'10:00', capacity:45, booked:45, status:'full',   label:'1회차' },
        { time:'13:00', capacity:45, booked:40, status:'active', label:'2회차' },
        { time:'15:30', capacity:45, booked:7,  status:'active', label:'3회차' },
      ],
      recentRes: [
        {no:'RES-2025-052668',name:'김**',count:3,amount:90000, status:'confirmed'},
        {no:'AMK-20250511-B002',name:'박**',count:5,amount:175000,status:'checkedin'},
        {no:'AMK-20250511-B003',name:'이**',count:2,amount:70000, status:'confirmed'},
        {no:'AMK-20250511-B004',name:'정**',count:4,amount:140000,status:'pending'},
      ],
      monthSales: [280,360,420,510,590,680,520,810,760,690,540,470],
      alerts: [
        { type:'success', msg:'오늘 목표 인원 89% 달성 중', time:'13:10' },
        { type:'info',    msg:'15:30 회차 잔여석 38석', time:'12:55' },
        { type:'warning', msg:'우천 예보로 내일 운행 여부 확인 필요', time:'10:30' },
      ],
    },
    hapcheon: {
      todayRes: 95, todayGoal: 150, todaySales: 3325000, onlineSales: 2660000,
      remainSeats: 55, remainRound: '16:00 회차', wristbands: 82, wristbandRate: 86,
      schedules: [
        { time:'10:30', capacity:40, booked:30, status:'active', label:'1회차' },
        { time:'13:30', capacity:40, booked:25, status:'active', label:'2회차' },
        { time:'16:00', capacity:40, booked:0,  status:'active', label:'3회차' },
      ],
      recentRes: [
        {no:'AMK-20250511-H001',name:'오**',count:4,amount:140000,status:'confirmed'},
        {no:'AMK-20250511-H002',name:'강**',count:2,amount:70000, status:'confirmed'},
        {no:'AMK-20250511-H003',name:'윤**',count:3,amount:105000,status:'checkedin'},
        {no:'AMK-20250511-H004',name:'장**',count:1,amount:35000, status:'pending'},
      ],
      monthSales: [60,85,110,130,145,170,120,190,175,155,125,100],
      alerts: [
        { type:'warning', msg:'오늘 목표 대비 63%로 저조합니다.', time:'13:00' },
        { type:'info',    msg:'주말 단체 투어 10명 예약 접수', time:'11:45' },
      ],
    },
  };

  const regionDashboard = async (params) => {
    _adminState.currentSection = 'region-dashboard';
    const user = _adminState.user || {};

    // 로그인 계정 regionId 우선 → URL 파라미터 → 선택값 → 기본값
    const regionId = (user.role === 'regional' && user.regionId)
      ? user.regionId
      : (params?.regionId || _adminState.selectedRegion || 'tongyeong');

    const regions = (window.REGIONS || []).filter(r => r.status !== 'hidden');
    // 지역 데이터가 없을 때도 지역명을 표시할 수 있도록 폴백 처리
    const region = regions.find(r => r.id === regionId) || {
      id: regionId,
      name: regionId === 'buyeo' ? '부여' : regionId === 'tongyeong' ? '통영' : regionId === 'hapcheon' ? '합천' : regionId,
      location: `${regionId} 지역`,
      customerService: '1588-0000',
    };

    const d = _REGION_DASH_DATA[regionId] || _REGION_DASH_DATA.tongyeong;
    const today = new Date().toLocaleDateString('ko-KR', {year:'numeric',month:'long',day:'numeric',weekday:'short'});
    const fmtWon = (v) => v.toLocaleString('ko-KR');

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

    // 회차별 상황 테이블 행
    const roundRows = d.schedules.map(s => {
      const pct = Math.round(s.booked / s.capacity * 100);
      const isFull = s.status === 'full' || s.booked >= s.capacity;
      return `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3 text-sm font-medium">${s.label} <span class="text-gray-400">(${s.time})</span></td>
          <td class="px-4 py-3 text-center">
            <span class="text-sm font-bold ${isFull?'text-red-600':'text-blue-600'}">${s.booked}</span>
            <span class="text-gray-400 text-xs"> / ${s.capacity}석</span>
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

    // 최근 예약 행
    const resRows = d.recentRes.map(r => `
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
      </tr>`).join('');

    // 알림 행
    const alertIcons = { warning:'fas fa-exclamation-triangle text-amber-500', info:'fas fa-info-circle text-blue-500', success:'fas fa-check-circle text-green-500' };
    const alertItems = d.alerts.map(a => `
      <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
        <i class="${alertIcons[a.type]||alertIcons.info} mt-0.5 flex-shrink-0"></i>
        <div class="flex-1">
          <p class="text-sm text-gray-800">${a.msg}</p>
          <p class="text-xs text-gray-400 mt-0.5">${a.time}</p>
        </div>
      </div>`).join('');

    // 월별 매출 미니차트 (bar-style CSS)
    const monthLabels = ['1','2','3','4','5','6','7','8','9','10','11','12'];
    const maxSales = Math.max(...d.monthSales);
    const salesBars = d.monthSales.map((v, i) => {
      const h = Math.round(v / maxSales * 60);
      return `<div class="flex flex-col items-center gap-1">
        <div class="text-xs text-gray-400" style="font-size:10px">${(v/10000).toFixed(0)}만</div>
        <div class="w-5 bg-blue-500 rounded-t" style="height:${h}px;min-height:4px"></div>
        <div class="text-gray-400" style="font-size:10px">${monthLabels[i]}</div>
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
            ${statCard('fas fa-calendar-check','오늘 예약',`${d.todayRes}명`,`목표 ${d.todayGoal}명`,'blue')}
            ${statCard('fas fa-won-sign','오늘 매출',`₩${fmtWon(d.todaySales)}`,`온라인 ₩${fmtWon(d.onlineSales)}`,'green')}
            ${statCard('fas fa-chair','잔여 좌석',`${d.remainSeats}석`,d.remainRound,'purple')}
            ${statCard('fas fa-qrcode','손목밴드',`${d.wristbands}개`,`체크인 대비 ${d.wristbandRate}%`,'orange')}
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
              ${d.schedules.map(s => {
                const pct = Math.round(s.booked / s.capacity * 100);
                const isFull = s.status === 'full' || s.booked >= s.capacity;
                return `<div class="flex items-center gap-3">
                  <div class="w-16 text-xs font-medium text-gray-700">${s.time}</div>
                  <div class="flex-1">
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                      <span>${s.label}</span>
                      <span>${s.booked}/${s.capacity}석 (${pct}%)</span>
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
            ${d.schedules.map(s => {
              const avail = s.capacity - s.booked;
              const pct = Math.round(s.booked / s.capacity * 100);
              return `<div class="border rounded-xl p-4 text-center">
                <div class="text-xs text-gray-500 mb-1">${s.label} (${s.time})</div>
                <div class="text-2xl font-black ${avail===0?'text-red-500':'text-blue-600'}">${avail}</div>
                <div class="text-xs text-gray-400">잔여석</div>
                <div class="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div class="h-1.5 rounded-full bg-blue-400" style="width:${pct}%"></div>
                </div>
                <div class="text-xs text-gray-400 mt-1">${s.booked}/${s.capacity}</div>
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
                {label:'총 탑승 인원',  val:`${d.wristbands}명`, color:'blue'},
                {label:'체크인 완료',   val:`${d.wristbands}명`, color:'green'},
                {label:'체크인 대기',   val:`${d.todayRes - d.wristbands}명`, color:'amber'},
                {label:'탑승 완료율',   val:`${d.wristbandRate}%`, color:'purple'},
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
                {label:'오늘 총 매출',   val:`₩${fmtWon(d.todaySales)}`},
                {label:'온라인 매출',    val:`₩${fmtWon(d.onlineSales)}`},
                {label:'현장 매출',     val:`₩${fmtWon(d.todaySales - d.onlineSales)}`},
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
                  ${(window.REGIONS||[]).filter(r=>r.status==='active'||r.status==='open').map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}
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
    const all = Settings.get('vehicles') || {};
    return (all[regionId] || []).filter(v => v.status !== 'inactive');
  };

  const schedulesPage = async () => {
    _adminState.currentSection = 'schedules';
    const regions = (window.REGIONS||[]).filter(r=>r.status==='active'||r.status==='open');
    const activeRegionId = _adminState.selectedRegion || regions[0]?.id || 'tongyeong';
    const allSchedules = Settings.get('schedules') || window.SCHEDULES || {};
    const schedules = allSchedules[activeRegionId] || [];
    const vehicles = _getVehicles(activeRegionId);

    const regionTabs = regions.map(r=>`
      <button onclick="AdminModule.selectScheduleRegion('${r.id}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${r.id===activeRegionId?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
        ${r.shortName}
      </button>
    `).join('');

    const scheduleRows = schedules.map((s, i) => {
      const sid = s.id || _makeScheduleId(activeRegionId, s.time);
      const hasRes = _hasReservations(activeRegionId, sid);
      const endTime = s.time ? _addMinutes(s.time, s.duration||70) : '-';
      const statusClass = s.status==='active'?'bg-green-100 text-green-700':s.status==='suspended'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-500';
      const statusLabel = s.status==='active'?'운영':s.status==='suspended'?'운휴':'중단';
      return `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 font-medium text-sm text-center">${s.time || '-'}</td>
        <td class="px-4 py-3 text-sm text-center text-gray-500">${endTime}</td>
        <td class="px-4 py-3 text-sm text-center">${s.duration || 70}분</td>
        <td class="px-4 py-3 text-sm text-center">${s.vehicle || (vehicles[i%vehicles.length]?.name) || '-'}</td>
        <td class="px-4 py-3 text-sm text-center">
          <span class="text-xs">${s.capacity || 38}명</span>
          <span class="text-xs text-gray-400 ml-1">(총 ${s.totalSeats||40}석)</span>
        </td>
        <td class="px-4 py-3 text-sm text-center">${s.onlineSeats !== undefined ? s.onlineSeats : Math.ceil((s.capacity||38)*0.7)}석 / ${s.offlineSeats !== undefined ? s.offlineSeats : (s.capacity||38) - Math.ceil((s.capacity||38)*0.7)}석</td>
        <td class="px-4 py-3 text-sm text-center text-xs">${(s.operatingDays||['월','화','수','목','금','토','일']).join('')}</td>
        <td class="px-4 py-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">${statusLabel}</span>
          ${hasRes?'<span class="ml-1 text-xs text-orange-500" title="예약 있음">●</span>':''}
        </td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          <button onclick="AdminModule.editSchedule('${activeRegionId}',${i})" class="text-blue-600 hover:underline text-xs mr-1">수정</button>
          <button onclick="AdminModule.toggleScheduleStatus('${activeRegionId}',${i})" class="text-orange-500 hover:underline text-xs mr-1">${s.status==='active'?'운휴':'재개'}</button>
          <button onclick="AdminModule.deleteSchedule('${activeRegionId}',${i})" class="text-red-500 hover:underline text-xs">삭제</button>
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
            <strong>자동 최적 배차:</strong> 운행소요시간 + 재정비시간 ÷ 차량 수 → 5분 단위 올림 배차간격 자동 계산
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
              <label class="block text-xs font-medium text-gray-700 mb-1">배차 간격 (자동 계산됨)</label>
              <div id="auto-interval-display" class="w-full border border-green-300 bg-green-50 rounded-lg px-3 py-2 text-sm text-green-800 font-bold">
                — 위 값 입력 후 자동 계산
              </div>
              <input id="auto-interval" type="hidden" value="30">
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

  const editSchedule = (regionId, idx) => {
    const allSchedules = Settings.get('schedules') || window.SCHEDULES || {};
    const s = (allSchedules[regionId]||[])[idx];
    if (!s) return;
    const sid = s.id || _makeScheduleId(regionId, s.time);
    _editingScheduleIdx = idx;
    _editingScheduleRegion = regionId;
    document.getElementById('schedule-modal-title').textContent = '일정 수정';
    // 예약 있는 경우 경고 표시
    const warn = document.getElementById('sch-res-warn');
    if (warn) { _hasReservations(regionId, sid) ? warn.classList.remove('hidden') : warn.classList.add('hidden'); }
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val||''; };
    set('s-time', s.time||'');
    set('s-time-select', s.time||'');
    set('s-duration', s.duration||70);
    set('s-capacity', s.capacity||38);
    set('s-online-ratio', s.onlineRatio||70);
    set('s-vehicle', s.vehicle||'');
    set('s-start-date', s.startDate||'');
    set('s-end-date', s.endDate||'');
    // 운영요일 체크박스 설정
    const days = s.operatingDays || ['월','화','수','목','금','토','일'];
    document.querySelectorAll('input[name="s-days"]').forEach(cb => { cb.checked = days.includes(cb.value); });
    document.getElementById('schedule-modal').classList.remove('hidden');
    updateSeatPreview();
  };

  const saveSchedule = () => {
    const get = (id) => document.getElementById(id)?.value||'';
    const timeVal = get('s-time').trim();
    if (!timeVal || !_isValidTime(timeVal)) { Utils.toast('출발 시간을 올바른 형식(HH:mm)으로 입력하세요', 'error'); return; }
    const days = [...document.querySelectorAll('input[name="s-days"]:checked')].map(c=>c.value);
    const cap = parseInt(get('s-capacity'))||38;
    const ratio = parseInt(get('s-online-ratio'))||70;
    if (ratio < 0 || ratio > 100) { Utils.toast('온라인 비율은 0~100 사이여야 합니다', 'error'); return; }
    const regionId = _editingScheduleRegion;
    let allSchedules = Settings.get('schedules') || JSON.parse(JSON.stringify(window.SCHEDULES||{}));
    if (!allSchedules[regionId]) allSchedules[regionId] = [];

    // 중복 일정 검증 (동일 지역 + 동일 출발시간, 수정 시 자기 자신 제외)
    const duplicate = allSchedules[regionId].find((s, i) => s.time === timeVal && i !== _editingScheduleIdx);
    if (duplicate) { Utils.toast(`이미 ${timeVal} 출발 일정이 존재합니다. 중복 생성이 불가합니다.`, 'error'); return; }

    const sData = {
      id: (_editingScheduleIdx !== null ? (allSchedules[regionId][_editingScheduleIdx]?.id || _makeScheduleId(regionId, timeVal)) : _makeScheduleId(regionId, timeVal)),
      time: timeVal,
      duration: parseInt(get('s-duration'))||70,
      vehicle: get('s-vehicle')||'',
      capacity: cap,
      onlineRatio: ratio,
      onlineSeats: Math.round(cap*ratio/100),
      offlineSeats: cap - Math.round(cap*ratio/100),
      operatingDays: days,
      startDate: get('s-start-date'),
      endDate: get('s-end-date'),
      status: 'active',
    };

    if (_editingScheduleIdx !== null) {
      // 예약 있는 회차 시간 변경 시 추가 경고
      const old = allSchedules[regionId][_editingScheduleIdx];
      if (old.time !== sData.time && _hasReservations(regionId, old.id || _makeScheduleId(regionId, old.time))) {
        if (!confirm(`경고: 이 회차에 예약이 있습니다!\n출발시간을 ${old.time} → ${sData.time}으로 변경하면 기존 예약자에게 별도 안내가 필요합니다.\n계속 진행하시겠습니까?`)) return;
      }
      allSchedules[regionId][_editingScheduleIdx] = sData;
    } else {
      allSchedules[regionId].push(sData);
    }
    Settings.set('schedules', allSchedules);
    document.getElementById('schedule-modal').classList.add('hidden');
    Utils.toast('일정이 저장되었습니다.', 'success');
    schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const toggleScheduleStatus = (regionId, idx) => {
    let allSchedules = Settings.get('schedules') || JSON.parse(JSON.stringify(window.SCHEDULES||{}));
    if (!allSchedules[regionId]?.[idx]) return;
    const s = allSchedules[regionId][idx];
    const newStatus = s.status === 'active' ? 'suspended' : 'active';
    allSchedules[regionId][idx].status = newStatus;
    Settings.set('schedules', allSchedules);
    Utils.toast(newStatus === 'active' ? '운영 재개되었습니다.' : '운휴 처리되었습니다.', 'info');
    schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const deleteSchedule = (regionId, idx) => {
    let allSchedules = Settings.get('schedules') || JSON.parse(JSON.stringify(window.SCHEDULES||{}));
    const s = allSchedules[regionId]?.[idx];
    if (!s) return;
    const sid = s.id || _makeScheduleId(regionId, s.time);
    // 예약 있으면 삭제 불가 - 운휴 처리 유도
    if (_hasReservations(regionId, sid)) {
      Utils.toast('이 회차에 예약이 있어 삭제할 수 없습니다. "운휴" 처리를 이용하세요.', 'error');
      return;
    }
    Utils.confirm('이 일정을 삭제하시겠습니까?', () => {
      allSchedules[regionId].splice(idx, 1);
      Settings.set('schedules', allSchedules);
      Utils.toast('삭제되었습니다.', 'success');
      schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
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
    const rotation = duration + maintenance;           // 1대 회전시간
    const raw      = rotation / Math.max(vehicles, 1); // 대수로 나눔
    return Math.ceil(Math.ceil(raw) / 5) * 5;          // 5분 단위 올림
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

  const previewAutoSchedule = () => {
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
      // 자동 최적: minInterval 자동 사용
      interval = minInterval;
      const hiddenEl = document.getElementById('auto-interval');
      if (hiddenEl) hiddenEl.value = interval;
      const displayEl = document.getElementById('auto-interval-display');
      const resultEl  = document.getElementById('auto-optimal-result');
      if (displayEl) displayEl.textContent = `${interval}분 (자동 계산: (${duration}+${maintenance})÷${vCountInput} → ${Math.ceil((duration+maintenance)/vCountInput)}분 → 5분 올림 → ${interval}분)`;
      if (resultEl) { resultEl.textContent = `✅ 최소 가능 배차간격: ${interval}분 (회전시간 ${duration+maintenance}분 ÷ ${vCountInput}대)`; resultEl.classList.remove('hidden'); }
    } else {
      // 수동: 선택 값 사용, 불가능하면 경고
      interval = parseInt(document.getElementById('auto-interval')?.value) || 30;
      if (interval < minInterval) {
        const warnEl  = document.getElementById('auto-conflict-warn');
        const warnMsg = document.getElementById('auto-conflict-msg');
        if (warnEl && warnMsg) {
          warnMsg.textContent = `선택한 차량 수(${vCountInput}대), 운행 소요시간(${duration}분), 재정비시간(${maintenance}분) 기준으로 해당 배차간격(${interval}분)은 운영할 수 없습니다. 최소 가능 배차간격은 ${minInterval}분입니다.`;
          warnEl.classList.remove('hidden');
        }
        document.getElementById('auto-preview-wrap')?.classList.add('hidden');
        return;
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
    const existSchedules = (Settings.get('schedules') || {})[_autoScheduleRegion] || [];
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
      rows.push({ seq: seq+1, depTime, endTime, readyTime, vName: assignedV, onl, off, conflictFlag, isDup });
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

  const confirmAutoSchedule = () => {
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
    const cap         = 38; // 항목2: 고정 38명 (40석-운전자1-가이드1)
    const ratio       = parseInt(document.getElementById('auto-online-ratio')?.value) || 70;
    const startDate   = document.getElementById('auto-start-date')?.value || '';
    const endDate     = document.getElementById('auto-end-date')?.value || '';
    const days        = [...document.querySelectorAll('input[name="auto-days"]:checked')].map(c => c.value);
    const regionId    = _autoScheduleRegion;

    let allSchedules = Settings.get('schedules') || JSON.parse(JSON.stringify(window.SCHEDULES||{}));
    if (!allSchedules[regionId]) allSchedules[regionId] = [];
    const existTimes = new Set(allSchedules[regionId].map(s => s.time));
    let added = 0;

    rows.forEach(r => {
      if (existTimes.has(r.depTime)) return; // 중복 스킵
      allSchedules[regionId].push({
        id: _makeScheduleId(regionId, r.depTime),
        time: r.depTime,
        duration,
        maintenance,
        vehicle: r.vName,
        capacity: cap,        // 38명 고정
        totalSeats: 40,       // 차량 총 좌석
        excludeSeats: 2,      // 운전자+가이드
        onlineRatio: ratio,
        onlineSeats: r.onl,
        offlineSeats: r.off,
        operatingDays: days,
        startDate,
        endDate,
        status: 'active',
      });
      added++;
    });

    // 시간순 정렬
    allSchedules[regionId].sort((a,b) => _toMinutes(a.time) - _toMinutes(b.time));
    Settings.set('schedules', allSchedules);
    document.getElementById('auto-schedule-modal').classList.add('hidden');
    Utils.toast(`${added}개 회차가 생성되었습니다. (중복 ${rows.length - added}건 스킵)`, 'success');
    schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const showRecurringModal = (regionId) => {
    _editingScheduleRegion = regionId;
    document.getElementById('recurring-modal').classList.remove('hidden');
  };
  const addRecTime = () => {
    const wrap = document.getElementById('rec-times');
    if (!wrap) return;
    const allSchedules = Settings.get('schedules') || window.SCHEDULES || {};
    // 시간 옵션 재생성
    let opts = '<option value="">시간 선택</option>';
    for (let h = 6; h <= 21; h++) for (let m of [0,30]) { const hh=String(h).padStart(2,'0'),mm=String(m).padStart(2,'0'); opts+=`<option value="${hh}:${mm}">${hh}:${mm}</option>`; }
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-center';
    div.innerHTML = `<select class="rec-time-select border rounded px-2 py-1.5 text-sm w-24 focus:ring-2 focus:ring-purple-500 outline-none" onchange="this.nextElementSibling.value=this.value">${opts}</select><input type="text" placeholder="HH:mm" maxlength="5" class="rec-time-input border rounded px-2 py-1.5 text-sm w-20 text-center font-mono focus:ring-2 focus:ring-purple-500 outline-none" oninput="this.previousElementSibling.value=this.value"><button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 text-xs px-1">삭제</button>`;
    wrap.appendChild(div);
  };

  const generateRecurring = () => {
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
    let allSchedules = Settings.get('schedules') || JSON.parse(JSON.stringify(window.SCHEDULES||{}));
    if (!allSchedules[regionId]) allSchedules[regionId] = [];
    const existTimes = new Set(allSchedules[regionId].map(s=>s.time));
    const onl = Math.round(cap*ratio/100);
    const off = cap - onl;
    const DAY_NAMES = ['일','월','화','수','목','금','토'];
    let added = 0;

    // 날짜별 반복 생성
    let cur = new Date(start + 'T00:00:00');
    const endD = new Date(end + 'T00:00:00');
    while (cur <= endD) {
      const dayName = DAY_NAMES[cur.getDay()];
      if (days.includes(dayName)) {
        times.forEach(t => {
          if (!existTimes.has(t)) {
            allSchedules[regionId].push({ id:_makeScheduleId(regionId,t), time:t, duration:70, capacity:cap, onlineRatio:ratio, onlineSeats:onl, offlineSeats:off, operatingDays:days, startDate:start, endDate:end, status:'active' });
            existTimes.add(t);
            added++;
          }
        });
      }
      cur.setDate(cur.getDate()+1);
    }
    // 시간순 정렬
    allSchedules[regionId].sort((a,b)=>_toMinutes(a.time)-_toMinutes(b.time));
    Settings.set('schedules', allSchedules);
    document.getElementById('recurring-modal').classList.add('hidden');
    Utils.toast(`반복 일정 ${added}개가 생성되었습니다.`, 'success');
    schedulesPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  // ── 요금 관리 ──────────────────────────────────────────────
  // ── 요금 승인 Store 키 (localStorage 사용 → 탭/세션 간 공유 가능) ──
  const FARE_STORE_KEY = 'amk_fares';
  const FARE_APPROVAL_KEY = 'amk_fare_approvals';

  // localStorage 기반 요금 데이터 로드 (지역관리자↔슈퍼관리자 공유)
  const _getFares = (regionId) => {
    const stored = JSON.parse(localStorage.getItem(FARE_STORE_KEY) || '{}');
    if (stored[regionId]) return stored[regionId];
    const region = (window.REGIONS||[]).find(r=>r.id===regionId);
    return region?.fares || [];
  };
  const _setFares = (regionId, fares) => {
    const stored = JSON.parse(localStorage.getItem(FARE_STORE_KEY) || '{}');
    stored[regionId] = fares;
    localStorage.setItem(FARE_STORE_KEY, JSON.stringify(stored));
  };
  // ★ 핵심 수정: localStorage 사용으로 지역관리자↔슈퍼관리자 실시간 공유
  const _getFareApprovals = () => JSON.parse(localStorage.getItem(FARE_APPROVAL_KEY) || '[]');
  const _setFareApprovals = (list) => localStorage.setItem(FARE_APPROVAL_KEY, JSON.stringify(list));

  // 요금 상태 레이블/색상
  const FARE_STATUS = {
    pending:   { label:'승인대기',  color:'yellow' },
    approved:  { label:'승인완료',  color:'blue'   },
    rejected:  { label:'반려',      color:'red'    },
    active:    { label:'적용중',    color:'green'  },
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
    const fares = _getFares(activeRegionId);
    // ★ 슈퍼관리자: 전체 지역 승인대기 표시 / 지역관리자: 자기 지역만
    const approvals = isSuper
      ? _getFareApprovals().filter(a => a.status !== 'approved' && a.status !== 'rejected')
      : _getFareApprovals().filter(a => a.regionId === activeRegionId);
    const fareMode = Settings.get('fareChangeMode') || 'approval';

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
        <td class="px-4 py-3 text-xs text-gray-400 text-center">${f.effectiveFrom||'-'} ~ ${f.effectiveTo||'무기한'}</td>
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
      : approvals.map((a, i) => {
          const regionLabel = a.regionName || (window.REGIONS||[]).find(r=>r.id===a.regionId)?.name || a.regionId || '-';
          return `
        <tr class="hover:bg-yellow-50" id="appr-row-${i}">
          <td class="px-4 py-3 text-sm font-medium">
            ${a.label}
            ${isSuper ? `<div class="text-xs text-blue-500 mt-0.5">${regionLabel}</div>` : ''}
          </td>
          <td class="px-4 py-3 text-sm text-center text-gray-500">${a.type||'일반'}</td>
          <td class="px-4 py-3 text-right font-semibold">₩${(a.price||0).toLocaleString()}</td>
          <td class="px-4 py-3 text-right text-gray-500">${a.discountPrice ? `₩${a.discountPrice.toLocaleString()}` : '-'}</td>
          <td class="px-4 py-3 text-center text-xs text-gray-500">${a.reason||'-'}</td>
          <td class="px-4 py-3 text-xs text-gray-400 text-center">${a.requestedBy||'지역관리자'} · ${a.requestedAt||'-'}</td>
          <td class="px-4 py-3 text-center">
            ${isSuper ? `
              <button onclick="AdminModule.approvefare(${i}, true)" class="bg-green-500 text-white px-2 py-1 rounded text-xs mr-1 hover:bg-green-600">승인</button>
              <button onclick="AdminModule.approvefare(${i}, false)" class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">반려</button>
            ` : `<span class="text-xs text-yellow-600">승인 대기중</span>`}
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
            ${isSuper ? '<span class="text-xs text-gray-400">승인/반려 처리가 가능합니다</span>' : '<span class="text-xs text-gray-400">본사 승인 대기중인 요금 변경 요청</span>'}
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
  const setFareMode = (mode) => {
    Settings.set('fareChangeMode', mode);
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
    const fareMode = Settings.get('fareChangeMode') || 'approval';
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

  const editFare = (regionId, idx) => {
    const fares = _getFares(regionId);
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
  };

  const saveFare = () => {
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
    const fareMode = Settings.get('fareChangeMode') || 'approval';
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
      // 즉시 저장
      newFare.status = 'active';
      const fares = _getFares(regionId);
      if (_editingFareIdx !== null) {
        fares[_editingFareIdx] = { ...fares[_editingFareIdx], ...newFare };
      } else {
        fares.push(newFare);
      }
      _setFares(regionId, fares);
      Utils.toast('요금이 즉시 저장되었습니다. 고객 예약화면에 반영됩니다.', 'success');
    } else {
      // ★ 승인 요청 - localStorage에 저장 → 슈퍼관리자 로그인 시 즉시 확인 가능
      const approvals = _getFareApprovals();
      const regionName = (window.REGIONS||[]).find(r=>r.id===regionId)?.name || regionId;
      approvals.push({
        ...newFare,
        status: 'pending',
        regionId,
        regionName,
        editIdx: _editingFareIdx !== null ? _editingFareIdx : -1,
        requestedBy: user.name || '지역관리자',
        requestedAt: new Date().toLocaleString('ko-KR'),
        requestedRole: user.role || 'regional',
      });
      _setFareApprovals(approvals);
      Utils.toast(`✅ 승인 요청이 전송되었습니다. 본사 대시보드에서 확인할 수 있습니다.\n승인 전까지 고객 예약화면에 미반영됩니다.`, 'success');
    }
    document.getElementById('fare-modal').classList.add('hidden');
    faresPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  // 요금 활성/비활성 토글
  const toggleFareStatus = (regionId, idx) => {
    const fares = _getFares(regionId);
    if (!fares[idx]) return;
    fares[idx].status = (fares[idx].status === 'active') ? 'inactive' : 'active';
    _setFares(regionId, fares);
    Utils.toast(`요금이 ${fares[idx].status==='active'?'활성화':'비활성화'}되었습니다.`, 'success');
    faresPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  // 요금 승인/반려 (슈퍼관리자) - localStorage 공유로 실시간 반영
  const approvefare = (approvalIdx, isApprove) => {
    const approvals = _getFareApprovals();
    const item = approvals[approvalIdx];
    if (!item) return;

    const processedAt = new Date().toLocaleString('ko-KR');
    const user = _adminState.user || {};

    if (isApprove) {
      // 승인: 요금 목록에 실제 반영 (localStorage에 저장 → 고객화면에도 반영)
      const fares = _getFares(item.regionId);
      const fare = { ...item, status: 'active', approvedAt: processedAt, approvedBy: user.name || '슈퍼관리자' };
      delete fare.regionId; delete fare.editIdx; delete fare.requestedBy; delete fare.requestedAt;
      if (item.editIdx !== null && item.editIdx >= 0 && fares[item.editIdx]) {
        fares[item.editIdx] = fare;
      } else {
        fares.push(fare);
      }
      _setFares(item.regionId, fares);
    }

    // 이력 저장 (승인/반려 모두)
    const history = JSON.parse(localStorage.getItem('amk_fare_history') || '[]');
    history.unshift({
      ...item,
      result: isApprove ? 'approved' : 'rejected',
      processedAt,
      processedBy: user.name || '슈퍼관리자',
    });
    if (history.length > 200) history.splice(200);
    localStorage.setItem('amk_fare_history', JSON.stringify(history));

    // 승인 목록에서 제거
    approvals.splice(approvalIdx, 1);
    _setFareApprovals(approvals);

    Utils.toast(isApprove ? '✅ 요금 변경이 승인되었습니다. 고객 예약화면에 즉시 반영됩니다.' : '❌ 요금 변경 요청이 반려되었습니다.', isApprove ? 'success' : 'info');

    // 현재 페이지 유지하며 갱신
    const section = _adminState.currentSection;
    if (section === 'hq-dashboard') {
      hqDashboard().then(html => { document.getElementById('app').innerHTML = html; });
    } else {
      faresPage().then(html => { document.getElementById('app').innerHTML = html; });
    }
  };

  // ── 좌석 배분 관리 ─────────────────────────────────────────
  const seatsPage = async () => {
    _adminState.currentSection = 'seats';
    const regions = (window.REGIONS||[]).filter(r=>r.status==='active'||r.status==='open');

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
    // 특이사항에서 안전 확인 필요 여부 감지
    const safetyFlags = [];
    if (r.memo) {
      if (/임산부/i.test(r.memo)) safetyFlags.push('임산부 포함');
      if (/유아/i.test(r.memo)) safetyFlags.push('36개월 미만 유아 동반');
      if (/심장|고혈압/i.test(r.memo)) safetyFlags.push('심장·고혈압 질환');
      if (/보행|보조/i.test(r.memo)) safetyFlags.push('보행 보조 필요');
      if (/고령/i.test(r.memo)) safetyFlags.push('고령자 동반');
    }
    // 임의로 일부 예약에 안전 플래그 시뮬레이션 (데모용)
    if (!safetyFlags.length && r.adultCnt >= 3 && Math.random() > 0.6) {
      safetyFlags.push('임산부 포함');
    }
    const safetyBadge = safetyFlags.length > 0 ? `
      <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center gap-1.5 text-red-600 font-semibold text-xs mb-1">
          <i class="fas fa-exclamation-triangle"></i>⚠️ 안전 확인 필요
        </div>
        <div class="flex flex-wrap gap-1">
          ${safetyFlags.map(f=>`<span class="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">${f}</span>`).join('')}
        </div>
        <p class="text-xs text-red-500 mt-1">탑승 전 현장 직원이 반드시 확인해야 합니다.</p>
      </div>` : '';
    Utils.confirm(
      `<div class="text-left space-y-1.5 text-sm">
        <div class="font-bold text-base mb-2 font-mono">${r.id}</div>
        ${safetyBadge}
        <div class="flex justify-between pt-1"><span class="text-gray-500">예약자</span><span class="font-medium">${r.name}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">지역</span><span>${r.regionName}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">날짜·회차</span><span>${r.date} ${r.schedule}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">인원</span><span>성인 ${r.adultCnt}명 / 소아 ${r.childCnt}명</span></div>
        <div class="flex justify-between"><span class="text-gray-500">결제금액</span><span class="font-bold">₩${r.totalAmount.toLocaleString()}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">결제수단</span><span>${r.payMethod}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">유입경로</span><span>${r.source}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">상태</span>
          <span class="px-2 py-0.5 rounded-full text-xs font-medium ${r.status==='confirmed'?'bg-green-100 text-green-700':r.status==='checkedin'?'bg-blue-100 text-blue-700':r.status==='cancelled'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}">
            ${statusLabels[r.status]||r.status}
          </span>
        </div>
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
  // 공지사항 localStorage 키 (admin ↔ customer 공유)
  const NOTICE_STORE_KEY = 'amk_notices';
  const _getNotices = () => { try { return JSON.parse(localStorage.getItem(NOTICE_STORE_KEY) || '[]'); } catch(e) { return []; } };
  const _setNotices = (list) => localStorage.setItem(NOTICE_STORE_KEY, JSON.stringify(list));

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
    const popups = Settings.get('popups') || window.POPUPS || [];
    const user   = _adminState.user || { role: 'super', regionId: null };
    const isSuper = user.role === ROLES.SUPER;

    // 공지 목록: 지역관리자는 자신의 지역만, 슈퍼는 전체
    const allNotices = _getNotices();
    const notices = isSuper
      ? allNotices
      : allNotices.filter(n => n.region === user.regionId);

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
          <span class="px-2 py-0.5 rounded-full text-xs ${p.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}">${p.isActive?'노출중':'비노출'}</span>
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
          <button onclick="AdminModule.hideNotice(${realIdx})" class="text-amber-500 hover:underline text-xs mr-1">${n.visible===false?'공개':'숨김'}</button>
          ${isSuper ? `<button onclick="AdminModule.deleteNotice(${realIdx})" class="text-red-500 hover:underline text-xs">삭제</button>` : ''}
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
                <select id="pop-region" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">전체</option>
                  ${(window.REGIONS||[]).filter(r=>r.status==='active'||r.status==='open').map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}
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
                <select id="ntc-region" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" ${!isSuper ? 'disabled' : ''}>
                  ${regionOptions}
                </select>
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
  const editPopup = (idx) => { _editingPopupIdx = idx; document.getElementById('popup-modal-title').textContent='팝업 수정'; const p=(Settings.get('popups')||window.POPUPS||[])[idx]; if(!p)return; document.getElementById('pop-title').value=p.title||''; document.getElementById('pop-content').value=p.content||''; document.getElementById('popup-modal').classList.remove('hidden'); };
  const savePopup = () => {
    const title = document.getElementById('pop-title')?.value; if(!title){Utils.toast('제목을 입력하세요','error');return;}
    let popups = JSON.parse(JSON.stringify(Settings.get('popups')||window.POPUPS||[]));
    const startDate = document.getElementById('pop-start')?.value||'';
    // id: 수정 시 기존 id 유지, 신규 시 고유 id 생성
    const existingId = (_editingPopupIdx !== null && popups[_editingPopupIdx]?.id) ? popups[_editingPopupIdx].id : null;
    const pData = {
      id: existingId || `popup-${Date.now()}`,
      title,
      content: document.getElementById('pop-content')?.value||'',
      region: document.getElementById('pop-region')?.value||'',
      type: document.getElementById('pop-type')?.value||'normal',
      startDate,
      endDate: document.getElementById('pop-end')?.value||'',
      isActive: document.getElementById('pop-active')?.checked !== false,
      allowHideToday: true,
    };
    if(_editingPopupIdx!==null) popups[_editingPopupIdx]=pData; else popups.push(pData);
    Settings.set('popups', popups);
    document.getElementById('popup-modal').classList.add('hidden');
    Utils.toast('팝업이 저장되었습니다.', 'success');
    popupsPage().then(html=>{document.getElementById('app').innerHTML=html;});
  };
  const deletePopup = (idx) => { Utils.confirm('팝업을 삭제하시겠습니까?',()=>{ let p=JSON.parse(JSON.stringify(Settings.get('popups')||window.POPUPS||[])); p.splice(idx,1); Settings.set('popups',p); Utils.toast('삭제되었습니다.','success'); popupsPage().then(html=>{document.getElementById('app').innerHTML=html;}); }); };

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

  const saveNotice = () => {
    const user = _adminState.user || { role: 'super', regionId: null };
    const isSuper = user.role === ROLES.SUPER;
    const title   = (document.getElementById('ntc-title')?.value || '').trim();
    const content = (document.getElementById('ntc-content')?.value || '').trim();
    if (!title)   { Utils.toast('제목을 입력하세요', 'error'); return; }
    if (!content) { Utils.toast('내용을 입력하세요', 'error'); return; }

    // 지역관리자는 자기 지역만, 슈퍼는 선택값
    const region = isSuper ? (document.getElementById('ntc-region')?.value || '') : (user.regionId || '');

    const now = new Date().toISOString();
    const notices = _getNotices();
    if (_editingNoticeIdx !== null && notices[_editingNoticeIdx]) {
      // 수정: 대상 지역은 원본 유지 (지역관리자), 슈퍼는 변경 가능
      notices[_editingNoticeIdx] = {
        ...notices[_editingNoticeIdx],
        title,
        content,
        type:       document.getElementById('ntc-type')?.value || 'general',
        region:     isSuper ? region : notices[_editingNoticeIdx].region,
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
    _setNotices(notices);
    closeNoticeModal();
    Utils.toast('공지사항이 저장되었습니다.', 'success');
    popupsPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const editNotice = (idx) => {
    const notices = _getNotices();
    const n = notices[idx];
    if (!n) { Utils.toast('공지를 찾을 수 없습니다.', 'error'); return; }
    _openNoticeModal('공지 수정', n, idx);
  };

  const hideNotice = (idx) => {
    const notices = _getNotices();
    if (!notices[idx]) return;
    const isHidden = notices[idx].visible === false;
    notices[idx].visible = isHidden ? true : false;
    _setNotices(notices);
    Utils.toast(isHidden ? '공지가 공개되었습니다.' : '공지가 숨김 처리되었습니다.', 'success');
    popupsPage().then(html => { document.getElementById('app').innerHTML = html; });
  };

  const deleteNotice = (idx) => {
    const user = _adminState.user || { role: 'super' };
    if (user.role !== ROLES.SUPER) { Utils.toast('슈퍼관리자만 삭제할 수 있습니다.', 'error'); return; }
    Utils.confirm('공지사항을 완전히 삭제하시겠습니까?', () => {
      const notices = _getNotices();
      notices.splice(idx, 1);
      _setNotices(notices);
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
  const seoManagePage = async () => {
    _adminState.currentSection = 'seo';
    const regions = (window.REGIONS||[]).filter(r=>r.status==='active'||r.status==='open');
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
  const editRegion = (idx) => { Utils.toast(`지역 ${idx} 수정 (구현 중)`, 'info'); };
  const suspendRegion = (idx) => { Utils.confirm('이 지역 운영을 중단하시겠습니까?', () => Utils.toast('운영이 중단되었습니다.', 'success')); };
  const activateRegion = (idx) => { Utils.confirm('이 지역 운영을 시작하시겠습니까?', () => Utils.toast('운영이 시작되었습니다.', 'success')); };
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

  const saveNewRegion = () => {
    const get = (id) => document.getElementById(id)?.value||'';
    const name = get('reg-name').trim();
    if (!name) { Utils.toast('지역명을 입력하세요', 'error'); return; }
    // 코드가 없으면 자동 생성
    const codeEl = document.getElementById('reg-code');
    if (codeEl && !codeEl.value) { _autoGenRegionCode(name); }
    const code = get('reg-code') || `AMK-${String((window.REGIONS||[]).length+1).padStart(3,'0')}`;
    // 추가 카운터 증가
    const cnt = parseInt(localStorage.getItem('amk_region_added_count') || '0', 10);
    localStorage.setItem('amk_region_added_count', String(cnt + 1));
    Utils.toast(`"${name}" (${code}) 지역이 추가되었습니다. SEO 설정을 구성하세요.`, 'success');
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
      'vehicles': () => vehiclesPage(),
      'schedules': () => schedulesPage(),
      'fares': () => faresPage(),
      'seats': () => seatsPage(),
      'reservations': () => reservationsPage(),
      'wristbands': () => wristbandsPage(),
      'popups': () => popupsPage(),
      'terms': () => termsPage(),
      'seo': () => seoManagePage(),
      'regions': () => regionsPage(),
      'settlement': () => settlementPage(),
      'admins': () => adminsPage(),
      'settings-admin': () => settingsAdminPage(),
      'backup': () => backupPage(),
      'stats-admin': () => statsAdminPage(),
      'tourism': () => tourismManagePage(),
      'reports': () => statsAdminPage(), // /admin/reports → statsAdminPage
    };
    return pageMap[section] ? pageMap[section]() : hqDashboard();
  };

  // ── 공개 API ───────────────────────────────────────────────
  return {
    // 페이지
    loginPage, hqDashboard, regionDashboard, vehiclesPage, schedulesPage, faresPage,
    seatsPage, reservationsPage, wristbandsPage, popupsPage, termsPage, seoManagePage,
    regionsPage, settlementPage, adminsPage, settingsAdminPage, backupPage, statsAdminPage,
    tourismManagePage,
    // 액션
    doLogin, logout, navigate, toggleSidebar, toggleMobileSidebar, closeMobileSidebar, approveFare, fillLogin,
    addVehicle, editVehicle, saveVehicle, deleteVehicle, closeVehicleModal,
    selectScheduleRegion, addSchedule, editSchedule, saveSchedule, toggleScheduleStatus,
    deleteSchedule, showRecurringModal, addRecTime, generateRecurring, updateSeatPreview,
    showAutoScheduleModal, previewAutoSchedule, confirmAutoSchedule, switchDispatchMode,
    switchRecMode, calcRecAutoTimes,
    selectFareRegion, setFareMode, addFare, editFare, saveFare,
    grantInstantPerm, toggleFareStatus, approvefare,
    updateSeatRatio, saveSeatRatio,
    viewReservation, cancelReservation, exportReservations, filterReservations, resetReservationFilter,
    saveWristbandText,
    addPopup, editPopup, savePopup, deletePopup,
    addNotice, editNotice, saveNotice, hideNotice, deleteNotice, closeNoticeModal,
    showTermsTab, saveTerms, previewTerms,
    selectSeoRegion, saveSeoSettings,
    showAddRegionModal, editRegion, suspendRegion, activateRegion, saveNewRegion, _autoGenRegionCode,
    closeDay, viewSettlement, exportSettlement,
    addAdmin, resetPassword, deleteAdmin,
    saveSmsTemplates, resetSettings,
    switchRegionDashboard,
    setTourismFilter, addTourism, editTourism, saveTourism, toggleTourismVisible, deleteTourism,
  };
})();

window.AdminModule = AdminModule;
