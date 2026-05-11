// ============================================================
// APP.JS - 아쿠아모빌리티코리아 통합 플랫폼 진입점
// 모든 모듈 로드 후 라우터 등록 및 앱 초기화
// ============================================================

(function () {
  'use strict';

  // ── 앱 초기화 가드 ─────────────────────────────────────────
  let _initialized = false;

  // ── 서버 주입 페이지 데이터 ────────────────────────────────
  // index.tsx가 window.__PAGE_DATA__를 주입
  const PAGE = window.__PAGE_DATA__ || {};

  // ── 전역 데이터 확인 헬퍼 ─────────────────────────────────
  const waitForModules = (names, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        const missing = names.filter(n => !window[n]);
        if (missing.length === 0) { resolve(); return; }
        if (Date.now() - start > timeout) {
          console.warn('[App] 모듈 로드 타임아웃:', missing);
          resolve(); // 타임아웃 후에도 진행
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
  };

  // ── 라우트 등록 ────────────────────────────────────────────
  const registerRoutes = () => {
    // ── 고객 페이지 ───────────────────────────────────────
    Router.add('/', async () => {
      const html = await CustomerPages.home();
      setTimeout(() => PopupManager.show(), 300);
      return html;
    });

    Router.add('/reservation', CustomerPages.reservationHub);

    Router.add('/reservation/:regionId', async (params) => {
      return CustomerPages.regionPage(params.regionId);
    });

    // ── 결제 플로우 ───────────────────────────────────────
    Router.add('/payment', PaymentModule.page);
    Router.add('/payment/complete', PaymentModule.complete);
    Router.add('/payment/waitlist', async (params) => {
      const regionId = new URLSearchParams(window.location.search).get('region') || 'tongyeong';
      return PaymentModule.waitlist(regionId);
    });
    Router.add('/payment/waitlist/:regionId', async (params) => {
      return PaymentModule.waitlist(params.regionId);
    });

    // ── 고객 서비스 ───────────────────────────────────────
    Router.add('/booking-check', CustomerPages.bookingCheck);
    Router.add('/inquiry',       CustomerPages.inquiry);
    Router.add('/notice',        CustomerPages.notice);

    // ── SEO / 콘텐츠 ──────────────────────────────────────
    Router.add('/faq', async () => {
      const html = await SeoModule.faqPage();
      setTimeout(SeoModule.afterFaqPage, 100);
      return html;
    });

    Router.add('/content', SeoModule.contentListPage);

    Router.add('/content/:slug', async (params) => {
      const html = await SeoModule.contentDetailPage(params);
      setTimeout(() => SeoModule.afterContentPage(params.slug), 100);
      return html;
    });

    Router.add('/sitemap', SeoModule.sitemapPage);

    // 약관 페이지들
    Router.add('/terms',              async () => SeoModule.termsPage({ type: 'service' }));
    Router.add('/terms/:type',        async (params) => SeoModule.termsPage(params));
    Router.add('/terms/service',      async () => SeoModule.termsPage({ type: 'service' }));
    Router.add('/terms/privacy',      async () => SeoModule.termsPage({ type: 'privacy' }));
    Router.add('/terms/refund',       async () => SeoModule.termsPage({ type: 'refund' }));
    Router.add('/terms/safety',       async () => SeoModule.termsPage({ type: 'safety' }));

    // ── 통계 페이지 ───────────────────────────────────────
    Router.add('/stats', StatsModule.page);

    // ── 현장 매표소 ───────────────────────────────────────
    Router.add('/field',              FieldModule.dashboard);
    Router.add('/field/dashboard',    FieldModule.dashboard);

    // ── 관리자 페이지 ─────────────────────────────────────
    Router.add('/admin',              _adminGuard(AdminModule.hqDashboard));
    Router.add('/admin/login',        AdminModule.loginPage);
    Router.add('/admin/dashboard',    _adminGuard(AdminModule.hqDashboard));
    Router.add('/admin/hq-dashboard', _adminGuard(AdminModule.hqDashboard));
    Router.add('/admin/region-dashboard', _adminGuard(AdminModule.regionDashboard));
    Router.add('/admin/region-dashboard/:regionId', _adminGuard(async (params) => AdminModule.regionDashboard(params)));
    Router.add('/admin/vehicles',     _adminGuard(AdminModule.vehiclesPage));
    Router.add('/admin/schedules',    _adminGuard(AdminModule.schedulesPage));
    Router.add('/admin/fares',        _adminGuard(AdminModule.faresPage));
    Router.add('/admin/seats',        _adminGuard(AdminModule.seatsPage));
    Router.add('/admin/reservations', _adminGuard(AdminModule.reservationsPage));
    Router.add('/admin/wristbands',   _adminGuard(AdminModule.wristbandsPage));
    Router.add('/admin/popups',       _adminGuard(AdminModule.popupsPage));
    Router.add('/admin/terms',        _adminGuard(AdminModule.termsPage));
    Router.add('/admin/seo',          _adminGuard(AdminModule.seoManagePage));
    Router.add('/admin/regions',      _adminGuard(AdminModule.regionsPage));
    Router.add('/admin/settlement',   _adminGuard(AdminModule.settlementPage));
    Router.add('/admin/admins',       _adminGuard(AdminModule.adminsPage));
    Router.add('/admin/settings-admin', _adminGuard(AdminModule.settingsAdminPage));
    Router.add('/admin/backup',       _adminGuard(AdminModule.backupPage));
    Router.add('/admin/stats-admin',  _adminGuard(AdminModule.statsAdminPage));

    // ── 404 ───────────────────────────────────────────────
    Router.add('*', CustomerPages._404);
  };

  // ── 관리자 가드 래퍼 ───────────────────────────────────────
  const _adminGuard = (handler) => async (params) => {
    const user = Store.get('adminUser');
    if (!user) {
      // 미인증 시 로그인 페이지로 리다이렉트
      console.warn('[AdminGuard] 미인증 접근 차단 → /admin/login');
      Router.go('/admin/login');
      return AdminModule.loginPage();
    }
    // 세션 타임아웃 검사 (8시간)
    const loginTime = Store.get('adminLoginTime');
    if (loginTime && (Date.now() - loginTime) > 8 * 60 * 60 * 1000) {
      Store.set('adminUser', null);
      Store.set('adminLoginTime', null);
      Utils.toast('세션이 만료되었습니다. 다시 로그인해주세요.', 'warning');
      Router.go('/admin/login');
      return AdminModule.loginPage();
    }
    return handler(params);
  };

  // ── 서비스 워커 등록 (PWA 오프라인 지원) ──────────────────
  const registerSW = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // 개발 환경에서는 무시
      });
    }
  };

  // ── 페이지별 추가 초기화 ───────────────────────────────────
  const initPageSpecific = () => {
    const path = window.location.pathname;

    // 관리자 사이드바 키보드 단축키
    if (path.startsWith('/admin')) {
      document.addEventListener('keydown', (e) => {
        if (e.key === '[' && e.metaKey) AdminModule.toggleSidebar();
      });
    }

    // 현장 매표소 - 풀스크린 권장
    if (path.startsWith('/field')) {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        // 자동 풀스크린은 사용자 제스처 필요 → 안내만
      }
    }
  };

  // ── 전역 에러 핸들러 ───────────────────────────────────────
  const setupErrorHandlers = () => {
    window.addEventListener('error', (e) => {
      console.error('[App] Uncaught error:', e.error);
    });
    window.addEventListener('unhandledrejection', (e) => {
      console.error('[App] Unhandled promise rejection:', e.reason);
    });
  };

  // ── 네비게이션 이벤트 처리 ─────────────────────────────────
  const setupNavigation = () => {
    // 브라우저 뒤로가기/앞으로가기
    window.addEventListener('popstate', () => {
      Router.go(window.location.pathname + window.location.search, false);
    });

    // 앵커 링크 클릭 인터셉트
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
      e.preventDefault();
      Router.go(href);
    });
  };

  // ── 스크롤 복원 ────────────────────────────────────────────
  const setupScrollBehavior = () => {
    // 라우트 변경 시 스크롤 상단으로
    const origGo = Router.go;
    if (origGo) {
      // Router.go는 이미 window.scrollTo(0,0)을 처리함
    }
  };

  // ── 글로벌 유틸 함수 노출 ──────────────────────────────────
  // 인라인 onclick 핸들러에서 접근할 수 있도록 window에 노출
  const exposeGlobals = () => {
    // 이미 각 모듈이 window.ModuleName = Module 형식으로 자기 자신을 등록함
    // 추가적인 편의 함수만 여기서 등록
    window.goto = (path) => Router.go(path);
    window.goBack = () => history.back();
  };

  // ── 초기 페이지 결정 ───────────────────────────────────────
  const getInitialPage = () => {
    const path = window.location.pathname;

    // 서버에서 주입된 페이지 타입이 있으면 우선
    if (PAGE.page) {
      switch (PAGE.page) {
        case 'home':        return '/';
        case 'reservation': return `/reservation/${PAGE.regionId || ''}`;
        case 'admin':       return '/admin/dashboard';
        case 'field':       return '/field';
        case 'faq':         return '/faq';
        default:            return path;
      }
    }
    return path;
  };

  // ── 앱 메인 초기화 ─────────────────────────────────────────
  const init = async () => {
    if (_initialized) return;
    _initialized = true;

    console.log('[App] 아쿠아모빌리티코리아 플랫폼 초기화...');

    // 에러 핸들러 먼저
    setupErrorHandlers();

    // 필수 모듈 로드 대기
    await waitForModules([
      'Store', 'Router', 'API', 'Utils', 'Settings',
      'Navbar', 'Footer', 'PopupManager',
      'CustomerPages', 'PaymentModule', 'FieldModule',
      'AdminModule', 'StatsModule', 'SeoModule',
    ]);

    // 전역 데이터 로드 (서버 주입 또는 API)
    await loadGlobalData();

    // 라우트 등록
    registerRoutes();

    // 네비게이션 이벤트
    setupNavigation();
    setupScrollBehavior();

    // 전역 함수 노출
    exposeGlobals();

    // 현장 매표소 연결 확인
    if (window.location.pathname.startsWith('/field')) {
      FieldModule.initRealtime && FieldModule.initRealtime();
    }

    // PWA 서비스워커
    registerSW();

    // 페이지 첫 로드
    const initialPath = getInitialPage();
    Router.go(initialPath, false);

    // 페이지별 추가 초기화
    setTimeout(initPageSpecific, 200);

    console.log('[App] 초기화 완료 ✓', { path: initialPath });
  };

  // ── 전역 데이터 로드 ───────────────────────────────────────
  const loadGlobalData = async () => {
    // 서버 주입 데이터 우선 사용
    if (PAGE.regions) {
      Store.set('regions', PAGE.regions);
    } else if (window.REGIONS) {
      Store.set('regions', window.REGIONS);
    }

    // Settings에서 관리자가 저장한 지역/차량/일정 오버라이드 적용
    const savedRegions = Settings.get('regions');
    if (savedRegions) {
      Store.set('regions', savedRegions);
    }

    // SEO 설정 초기화
    const savedSeoSettings = Settings.get('seoSettings');
    if (savedSeoSettings && window.REGION_SEO) {
      // 관리자가 저장한 SEO 설정을 REGION_SEO에 병합
      Object.entries(savedSeoSettings).forEach(([regionId, seo]) => {
        if (window.REGION_SEO[regionId]) {
          Object.assign(window.REGION_SEO[regionId], seo);
        }
      });
    }
  };

  // ── DOM 준비 시 시작 ───────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
