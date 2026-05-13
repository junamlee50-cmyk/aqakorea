// ============================================================
// CORE MODULE - 라우터 / 스토어 / API 클라이언트
// 아쿠아모빌리티코리아 통합 플랫폼
// ============================================================

// ── 전역 앱 상태 스토어 ──────────────────────────────────────
const Store = (() => {
  let _state = {
    user: null,           // 로그인된 관리자 정보
    cart: null,           // 예약 진행 중 데이터
    currentPage: 'home',  // 현재 페이지
    regions: [],          // 전체 지역 목록
    settings: {},         // 관리자 직접 편집 설정값
    toast: null,
    loading: false,
  };
  const _listeners = [];

  return {
    get: (key) => key ? _state[key] : { ..._state },
    set: (key, val) => {
      _state[key] = val;
      _listeners.forEach(fn => fn(_state));
    },
    merge: (key, val) => {
      _state[key] = { ..._state[key], ...val };
      _listeners.forEach(fn => fn(_state));
    },
    subscribe: (fn) => { _listeners.push(fn); return () => { const i = _listeners.indexOf(fn); if(i>-1) _listeners.splice(i,1); }; },
  };
})();

// ── API 클라이언트 ───────────────────────────────────────────
const API = {
  base: '',  // Caddy가 /api/* → 백엔드(3001)로 프록시
  async get(path) {
    try {
      const r = await fetch(this.base + path);
      return await r.json();
    } catch(e) { console.error('API GET error:', path, e); return { success: false, error: e.message }; }
  },
  async post(path, body) {
    try {
      const r = await fetch(this.base + path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      return await r.json();
    } catch(e) { console.error('API POST error:', path, e); return { success: false, error: e.message }; }
  },
  async put(path, body) {
    try {
      const r = await fetch(this.base + path, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      return await r.json();
    } catch(e) { return { success: false, error: e.message }; }
  },
  async delete(path) {
    try {
      const r = await fetch(this.base + path, { method:'DELETE', headers:{'Content-Type':'application/json'} });
      return await r.json();
    } catch(e) { return { success: false, error: e.message }; }
  },
  async patch(path, body) {
    try {
      const r = await fetch(this.base + path, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      return await r.json();
    } catch(e) { return { success: false, error: e.message }; }
  },
};

// ── 라우터 ──────────────────────────────────────────────────
const Router = (() => {
  // ── 배열로 관리하여 등록 순서 + 우선순위 정렬 보장 ──────────
  // 고정 세그먼트가 많을수록 먼저 매칭 (구체적 경로 우선)
  const _routes = []; // [{ pattern, handler, priority }]
  let _current = '';

  // 패턴의 고정 세그먼트 수로 우선순위 계산 (높을수록 먼저)
  const _calcPriority = (pattern) => {
    if (pattern === '*') return -1;
    return pattern.split('/').filter(p => p && !p.startsWith(':')).length;
  };

  const matchRoute = (pattern, path) => {
    if (pattern === '*') return {};
    const pParts = pattern.split('/').filter(Boolean);
    const rParts = path.split('/').filter(Boolean);
    if (pParts.length !== rParts.length) return null;
    const params = {};
    for (let i = 0; i < pParts.length; i++) {
      if (pParts[i].startsWith(':')) { params[pParts[i].slice(1)] = decodeURIComponent(rParts[i]); }
      else if (pParts[i] !== rParts[i]) return null;
    }
    return params;
  };

  const go = (path, pushState=true) => {
    // 쿼리스트링 분리 (매칭은 pathname만)
    const [pathname] = path.split('?');
    _current = path;
    if (pushState && window.location.pathname !== pathname) {
      history.pushState({}, '', path);
    }
    const app = document.getElementById('app');
    if (!app) return;

    // 우선순위 정렬된 배열에서 순서대로 매칭
    let matched = null, params = {};
    for (const { pattern, handler } of _routes) {
      const result = matchRoute(pattern, pathname);
      if (result !== null) { matched = handler; params = result; break; }
    }
    if (matched) {
      app.innerHTML = '<div class="flex items-center justify-center min-h-screen"><div class="loading-spinner"></div></div>';
      Promise.resolve(matched(params)).then(html => {
        if (html) app.innerHTML = html;
        window.scrollTo(0, 0);
        app.classList.add('fade-in');
        setTimeout(() => app.classList.remove('fade-in'), 600);
        initPageComponents();
      });
    }
  };

  window.addEventListener('popstate', () => go(location.pathname + location.search, false));

  return {
    add: (pattern, handler) => {
      const priority = _calcPriority(pattern);
      _routes.push({ pattern, handler, priority });
      // 우선순위 내림차순 정렬: 고정 세그먼트 많을수록 앞으로
      _routes.sort((a, b) => b.priority - a.priority);
    },
    go,
    current: () => _current,
  };
})();

// ── 유틸리티 ────────────────────────────────────────────────
const Utils = {
  // 숫자 포맷
  money: (n) => Number(n||0).toLocaleString('ko-KR') + '원',
  num:   (n) => Number(n||0).toLocaleString('ko-KR'),
  // 날짜 포맷
  dateKo: (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}년 ${dt.getMonth()+1}월 ${dt.getDate()}일`;
  },
  dateShort: (d) => {
    if (!d) return '';
    return d.slice(0,10).replace(/-/g, '.');
  },
  // 토스트 알림
  toast: (msg, type='info', duration=3000) => {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    t.className = 'toast';
    t.innerHTML = `${icons[type]||'ℹ️'} ${msg}`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transform='translateY(10px)'; setTimeout(()=>t.remove(),300); }, duration);
  },
  // 모달
  modal: (html, opts={}) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box ${opts.size||''}" onclick="event.stopPropagation()">${html}</div>`;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
    return overlay;
  },
  closeModal: () => { document.querySelector('.modal-overlay')?.remove(); },
  // 확인 다이얼로그
  confirm: (msg, onYes, opts={}) => {
    const title = opts.title || '확인';
    const confirmText = opts.confirmText || '확인';
    const cancelText = opts.cancelText !== undefined ? opts.cancelText : '취소';
    const cancelBtn = cancelText
      ? `<button onclick="Utils.closeModal()" class="btn-outline px-6 py-2 text-sm">${cancelText}</button>`
      : '';
    const uid = 'confirm-yes-' + Date.now();
    Utils.modal(`
      <div class="modal-header"><h3 class="font-bold text-lg">${title}</h3></div>
      <div class="modal-body"><div class="text-gray-700">${msg}</div></div>
      <div class="modal-footer">
        ${cancelBtn}
        <button id="${uid}" class="btn-primary px-6 py-2 text-sm">${confirmText}</button>
      </div>`);
    const btn = document.getElementById(uid);
    if (btn) btn.onclick = () => { Utils.closeModal(); if (onYes) onYes(); };
  },
  // 로딩
  loading: (show) => {
    let el = document.getElementById('global-loading');
    if (show) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'global-loading';
        el.className = 'loading-overlay';
        el.innerHTML = `<div class="loading-spinner"></div><p class="text-white text-sm mt-4">처리 중...</p>`;
        document.body.appendChild(el);
      }
    } else { el?.remove(); }
  },
  // QR 생성 (qrcode@1.5.3 브라우저 빌드 기반)
  generateQR: async (canvasId, text) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    // QRCode 라이브러리 로드 대기 (최대 3초)
    let waited = 0;
    while (typeof QRCode === 'undefined' && waited < 3000) {
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
    }
    if (typeof QRCode === 'undefined') {
      // CDN 폴백: QRCode.js (qrcodejs) 동적 로드
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      }).catch(() => {});
    }
    if (typeof QRCode === 'undefined') return;
    try {
      // qrcode@1.5.3: QRCode.toCanvas API
      if (typeof QRCode.toCanvas === 'function') {
        await QRCode.toCanvas(canvas, text, { width: 200, margin: 2, color: { dark: '#0a2d6b', light: '#ffffff' } });
      } else if (typeof QRCode === 'function') {
        // qrcodejs 라이브러리: new QRCode(element, opts)
        canvas.innerHTML = '';
        const div = document.createElement('div');
        canvas.parentNode.insertBefore(div, canvas);
        canvas.remove();
        div.id = canvasId;
        new QRCode(div, { text, width: 200, height: 200, colorDark: '#0a2d6b', colorLight: '#ffffff' });
      }
    } catch(e) { console.error('QR error:', e); }
  },
  // 날짜 유효성
  isFuture: (dateStr) => new Date(dateStr) > new Date(),
  today: () => new Date().toISOString().split('T')[0],
  addDays: (date, days) => { const d = new Date(date); d.setDate(d.getDate()+days); return d.toISOString().split('T')[0]; },
  // 랜덤 ID
  uid: () => Math.random().toString(36).slice(2,10).toUpperCase(),
  // 마스킹
  maskPhone: (p) => p ? p.replace(/(\d{3})-?(\d{4})-?(\d{4})/, '$1-****-$3') : '',
  maskName:  (n) => n ? n[0] + '*'.repeat(n.length-1) : '',
  // 클립보드
  copy: async (text) => {
    try { await navigator.clipboard.writeText(text); Utils.toast('복사되었습니다', 'success'); }
    catch(e) { Utils.toast('복사 실패', 'error'); }
  },
  // 인쇄
  print: () => window.print(),
  // CSV 다운로드 (배열 rows 기반 — 금액 지수표기법 방지)
  downloadCSV: (rows, filename) => {
    // rows: Array<Array<any>> — 2차원 배열
    const escape = (v) => {
      if (v === null || v === undefined) return '""';
      const s = String(v);
      // 쌍따옴표 이스케이프
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const csv = rows.map(row => (Array.isArray(row) ? row : [row]).map(escape).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  },

  // XLSX 다운로드 — SheetJS(XLSX) 라이브러리 사용
  // sheets: [{ name: '시트명', rows: Array<Array<any>> }, ...]
  downloadXLSX: (sheets, filename) => {
    // SheetJS CDN 로드 후 실행
    const _build = () => {
      if (typeof XLSX === 'undefined') {
        Utils.toast('XLSX 라이브러리 로딩 중... 잠시 후 다시 시도해주세요.', 'warning');
        // 동적 로드
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        s.onload = () => Utils.downloadXLSX(sheets, filename);
        document.head.appendChild(s);
        return;
      }
      const wb = XLSX.utils.book_new();
      sheets.forEach(({ name, rows }) => {
        // 금액 셀: 숫자형으로 유지 (지수표기법 방지는 셀 너비/형식으로 처리)
        const ws = XLSX.utils.aoa_to_sheet(rows);
        // 열 너비 자동 설정
        const colWidths = rows.reduce((acc, row) => {
          (Array.isArray(row) ? row : [row]).forEach((cell, ci) => {
            const len = String(cell ?? '').length;
            acc[ci] = Math.max(acc[ci] || 8, Math.min(len + 2, 40));
          });
          return acc;
        }, []);
        ws['!cols'] = colWidths.map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
      });
      XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : filename + '.xlsx');
    };
    _build();
  },

  // PDF 보고서: 새 창에 HTML 렌더링 후 window.print()
  // reportHtml: 완성된 HTML 문자열
  printPDF: (reportHtml, filename) => {
    const win = window.open('', '_blank');
    if (!win) { Utils.toast('팝업이 차단되었습니다. 팝업을 허용해주세요.', 'error'); return; }
    win.document.write(reportHtml);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 800);
  },
  // 상태 뱃지
  badge: (text, color) => `<span class="badge badge-${color}">${text}</span>`,
  // 빈 상태
  empty: (msg='데이터가 없습니다', icon='📭') => `
    <div class="flex flex-col items-center justify-center py-16 text-gray-400">
      <div class="text-5xl mb-4">${icon}</div>
      <p class="text-base">${msg}</p>
    </div>`,
};

// ── 관리자 설정 (localStorage 직접 편집) ─────────────────────
const Settings = {
  _key: 'amk_settings',
  defaults: {
    // 기본 좌석 배분
    defaultOnlineRatio: 70,
    defaultOfflineRatio: 30,
    // 결제 대기 잠금 시간(분)
    seatLockMinutes: 10,
    // 요금 변경 방식: 'auto' | 'approval'
    fareChangeMode: 'approval',
    // 자동 좌석 전환
    autoSeatTransfer: true,
    autoSeatTransferHours: 2,
    // 리마인드 알림
    reminderDayBefore: true,
    reminderHoursBefore: 3,
    // 팝업 설정
    popups: [],
    // 공지사항
    notices: [],
    // 지역별 관광지 정보
    touristSpots: {},
    // 약관·환불규정
    terms: {
      refundPolicy: `탑승 3일 전까지 취소: 전액 환불\n탑승 1일 전 취소: 50% 환불\n당일 취소: 환불 불가\n기상악화·운휴: 전액 환불 또는 일정 변경`,
      safetyRules: `1. 구명조끼 착용 필수\n2. 안전요원 안내 준수\n3. 탑승 중 이동 금지\n4. 음식물 반입 금지\n5. 사진 촬영 시 안전 주의`,
      privacyPolicy: `개인정보 수집·이용 목적: 예약 및 탑승 관리\n수집 항목: 이름, 연락처, 생년월일\n보유 기간: 서비스 종료 후 1년`,
      serviceTerms: `아쿠아모빌리티코리아 서비스 이용약관`,
      marketingConsent: `마케팅 정보 수신 동의 (선택사항)`,
    },
    // 손목밴드 출력 문구
    wristbandText: {
      brand: 'Aqua Mobility Korea',
      footer: '안전하고 즐거운 투어 되세요!',
      warning: '',
    },
    // 서치콘솔 소유확인
    googleVerification: '',
    naverVerification: '',
    gaId: '',
    // SEO (지역별)
    regionSEO: {},
    // 스마트플레이스 / 구글 비즈니스
    smartplace: {},
    // 요금 변경 대기 목록
    fareChangeRequests: [],
    // 지역 추가/수정
    regions: null,
    // 차량 추가/수정
    vehicles: null,
    // 회차 추가/수정
    schedules: null,
    // 팝업 템플릿
    popupTemplates: [
      { id:'tpl1', name:'기본 공지형', template:'modal' },
      { id:'tpl2', name:'긴급공지형', template:'urgent' },
      { id:'tpl3', name:'이벤트 홍보형', template:'event' },
      { id:'tpl4', name:'이미지 중심형', template:'image' },
      { id:'tpl5', name:'하단 배너형', template:'banner' },
    ],
    // 알림톡 템플릿
    smsTemplates: {
      bookingConfirm: '[아쿠아모빌리티코리아] {region} 수륙양용투어 예약이 완료되었습니다.\n예약번호: {reservationId}\n탑승일시: {date} {time}\n탑승장: {location}\n예약확인: {url}',
      reminder: '[아쿠아모빌리티코리아] 내일 {region} 수륙양용투어 탑승 안내\n탑승일시: {date} {time}\n탑승 20분 전 도착 바랍니다.\n문의: {phone}',
      suspension: '[아쿠아모빌리티코리아] {date} {time} {region} 회차 운휴 안내\n사유: {reason}\n환불 또는 일정변경 문의: {phone}',
    },
  },
  get: (key) => {
    try {
      const saved = JSON.parse(localStorage.getItem(Settings._key) || '{}');
      const merged = { ...Settings.defaults, ...saved };
      return key ? merged[key] : merged;
    } catch(e) { return key ? Settings.defaults[key] : Settings.defaults; }
  },
  set: (key, val) => {
    try {
      const saved = JSON.parse(localStorage.getItem(Settings._key) || '{}');
      saved[key] = val;
      localStorage.setItem(Settings._key, JSON.stringify(saved));
    } catch(e) { console.error('Settings.set error:', e); }
  },
  merge: (key, val) => {
    const current = Settings.get(key) || {};
    Settings.set(key, { ...current, ...val });
  },
  reset: () => localStorage.removeItem(Settings._key),
};

// ── 페이지 공통 컴포넌트 초기화 ─────────────────────────────
const initPageComponents = () => {
  // 링크 클릭 처리 (SPA 내비게이션)
  document.querySelectorAll('[data-link]').forEach(el => {
    el.removeEventListener('click', handleLink);
    el.addEventListener('click', handleLink);
  });
  // 탭 처리
  document.querySelectorAll('[data-tab]').forEach(el => {
    el.addEventListener('click', () => {
      const group = el.dataset.tabGroup;
      const target = el.dataset.tab;
      document.querySelectorAll(`[data-tab-group="${group}"]`).forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      document.querySelectorAll(`[data-tab-content-group="${group}"]`).forEach(c => {
        c.classList.toggle('hidden', c.dataset.tabContent !== target);
      });
    });
  });
  // 숫자 카운터 애니메이션
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    let current = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Utils.num(current);
      if (current >= target) clearInterval(timer);
    }, 30);
  });
};

const handleLink = (e) => {
  e.preventDefault();
  const href = e.currentTarget.getAttribute('href') || e.currentTarget.dataset.href;
  if (href && !href.startsWith('http')) Router.go(href);
  else if (href) window.open(href, '_blank');
};

// ── 내비게이션 바 ────────────────────────────────────────────
const Navbar = {
  render: (active='') => `
  <nav class="navbar" id="main-navbar">
    <div class="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
      <a href="/" data-link class="nav-logo flex items-center gap-2" style="text-decoration:none">
        <div style="background:rgba(255,255,255,0.18);border-radius:8px;padding:3px 4px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.3);flex-shrink:0">
          <img src="/static/logo_emblem.png" alt="CI" style="width:32px;height:32px;object-fit:contain;display:block">
        </div>
        <span style="font-size:14px;font-weight:800;color:#fff;letter-spacing:0.3px;white-space:nowrap;text-shadow:0 1px 6px rgba(0,0,0,0.5)">AQUA MOBILITY <span style='font-weight:600;opacity:0.85'>KOREA</span></span>
      </a>
      <div class="hidden md:flex items-center gap-6">
        <a href="/" data-link class="text-white/80 hover:text-white text-sm font-medium transition-colors ${active==='home'?'text-cyan-400':''}">홈</a>
        <a href="/reservation" data-link class="text-white/80 hover:text-white text-sm font-medium transition-colors ${active==='reservation'?'text-cyan-400':''}">수륙양용투어 예약</a>
        <a href="/faq" data-link class="text-white/80 hover:text-white text-sm font-medium transition-colors ${active==='faq'?'text-cyan-400':''}">자주 묻는 질문</a>
        <a href="/notice" data-link class="text-white/80 hover:text-white text-sm font-medium transition-colors">공지사항</a>
        <a href="/inquiry" data-link class="text-white/80 hover:text-white text-sm font-medium transition-colors">고객문의</a>
        <a href="/reservation/check" data-link class="text-white/80 hover:text-white text-sm font-medium transition-colors">예약확인</a>
        <a href="/admin" data-link class="text-xs bg-white/10 text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all">관리자</a>
      </div>
      <button class="md:hidden text-white text-xl" onclick="Navbar.toggleMobile()">
        <i class="fas fa-bars"></i>
      </button>
    </div>
    <div id="mobile-menu" class="hidden md:hidden bg-navy-900/95 backdrop-blur-lg border-t border-white/10">
      <div class="px-4 py-3 flex flex-col gap-1">
        <a href="/" data-link class="text-white/80 py-2 text-sm font-medium">🏠 홈</a>
        <a href="/reservation" data-link class="text-white/80 py-2 text-sm font-medium">🚌 수륙양용투어 예약</a>
        <a href="/reservation/tongyeong" data-link class="text-white/60 py-2 text-sm pl-4">└ 통영해양관광</a>
        <a href="/reservation/buyeo" data-link class="text-white/60 py-2 text-sm pl-4">└ 부여수륙양용투어</a>
        <a href="/reservation/hapcheon" data-link class="text-white/60 py-2 text-sm pl-4">└ 합천수륙양용투어</a>
        <a href="/faq" data-link class="text-white/80 py-2 text-sm font-medium">❓ 자주 묻는 질문</a>
        <a href="/notice" data-link class="text-white/80 py-2 text-sm font-medium">📢 공지사항</a>
        <a href="/inquiry" data-link class="text-white/80 py-2 text-sm font-medium">💬 고객문의</a>
        <a href="/reservation/check" data-link class="text-white/80 py-2 text-sm font-medium">🎫 예약확인/취소</a>
        <a href="/admin" data-link class="text-cyan-400 py-2 text-sm font-medium">🔧 관리자</a>
      </div>
    </div>
  </nav>`,
  toggleMobile: () => {
    const m = document.getElementById('mobile-menu');
    m?.classList.toggle('hidden');
  },
  init: () => {
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('main-navbar');
      nav?.classList.toggle('scrolled', window.scrollY > 50);
    });
  },
};

// ── 푸터 ─────────────────────────────────────────────────────
const Footer = {
  render: () => `
  <footer class="bg-navy-900 text-white mt-20">
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="md:col-span-2">
          <div class="flex items-center gap-3 mb-4">
            <img src="/static/logo_emblem.png" alt="Aqua Mobility Korea" style="width:44px;height:auto;object-fit:contain;">
            <span style="font-size:15px;font-weight:700;color:#fff;letter-spacing:0.5px">AQUA MOBILITY KOREA</span>
          </div>
          <p class="text-white/60 text-sm leading-relaxed mb-4">전국 수륙양용투어 통합 예약·결제·운영 플랫폼<br>통영 · 부여 · 합천 수륙양용버스 투어</p>
          <div class="flex gap-3">
            <a href="#" class="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all"><i class="fab fa-instagram text-sm"></i></a>
            <a href="#" class="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all"><i class="fab fa-youtube text-sm"></i></a>
            <a href="#" class="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all text-xs font-bold">N</a>
          </div>
        </div>
        <div>
          <h4 class="font-bold mb-3 text-sm text-cyan-400">수륙양용투어</h4>
          <ul class="space-y-2 text-sm text-white/60">
            <li><a href="/reservation/tongyeong" data-link class="hover:text-white transition-colors">통영해양관광</a></li>
            <li><a href="/reservation/buyeo" data-link class="hover:text-white transition-colors">부여수륙양용투어</a></li>
            <li><a href="/reservation/hapcheon" data-link class="hover:text-white transition-colors">합천수륙양용투어</a></li>
            <li><a href="/reservation" data-link class="hover:text-white transition-colors">전체 지역 보기</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold mb-3 text-sm text-cyan-400">고객지원</h4>
          <ul class="space-y-2 text-sm text-white/60">
            <li><a href="/faq" data-link class="hover:text-white transition-colors">자주 묻는 질문</a></li>
            <li><a href="/inquiry" data-link class="hover:text-white transition-colors">고객문의</a></li>
            <li><a href="/reservation/check" data-link class="hover:text-white transition-colors">예약확인/취소</a></li>
            <li><a href="/notice" data-link class="hover:text-white transition-colors">공지사항</a></li>
          </ul>
          <div class="mt-4 text-sm">
            <div class="text-white font-bold">본사 대표번호</div>
            <div class="text-cyan-400 font-bold text-lg">1588-0000</div>
            <div class="text-white/40 text-xs">평일 09:00~18:00</div>
          </div>
        </div>
      </div>
      <div class="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
        <div>© 2025 Aqua Mobility Korea. All rights reserved.</div>
        <div class="flex gap-4">
          <a href="#" class="hover:text-white/70">이용약관</a>
          <a href="#" class="hover:text-white/70">개인정보처리방침</a>
          <a href="#" class="hover:text-white/70">환불규정</a>
          <a href="/admin" data-link class="hover:text-white/70">관리자</a>
        </div>
      </div>
    </div>
  </footer>`,
};

// ── 팝업 표시기 ──────────────────────────────────────────────
const PopupManager = {
  shown: new Set(),

  // 날짜 범위 체크 헬퍼 (startDate/endDate 및 showFrom/showTo 모두 지원)
  _inDateRange(popup) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const from = popup.startDate || popup.showFrom || null;
    const to   = popup.endDate   || popup.showTo   || null;
    if (from && today < from) return false;
    if (to   && today > to)   return false;
    return true;
  },

  // PC/모바일 체크 헬퍼
  _matchesDevice(popup) {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && popup.showOnMobile === false) return false;
    if (!isMobile && popup.showOnPC === false)    return false;
    return true;
  },

  // 지역 범위 체크: 팝업 region 필드 vs 현재 페이지 regionId
  // region='' or 'all' → 전체 표시 / 특정값 → 해당 지역 페이지만
  _matchesRegion(popup, regionId) {
    const pr = popup.region || '';
    if (!pr || pr === 'all' || pr === '') return true;
    return pr === regionId;
  },

  // "다시 보지 않기" (localStorage 영구)
  _isForeverHidden(id) {
    const stored = JSON.parse(localStorage.getItem('amk_popups_forever')||'[]');
    return stored.includes(id);
  },

  // "오늘 하루 보지 않기" (날짜 기반 localStorage)
  _isTodayHidden(id) {
    const key = 'amk_popups_today';
    const today = new Date().toISOString().split('T')[0];
    const stored = JSON.parse(localStorage.getItem(key)||'{}');
    return stored[id] === today;
  },

  // 노출수 기록
  _recordImpression(id) {
    try {
      const key = 'amk_popup_stats';
      const stats = JSON.parse(localStorage.getItem(key)||'{}');
      if (!stats[id]) stats[id] = { impressions: 0, clicks: 0 };
      stats[id].impressions++;
      stats[id].lastSeen = new Date().toISOString().split('T')[0];
      localStorage.setItem(key, JSON.stringify(stats));
    } catch(e) {}
  },

  // 클릭수 기록
  recordClick(id) {
    try {
      const key = 'amk_popup_stats';
      const stats = JSON.parse(localStorage.getItem(key)||'{}');
      if (!stats[id]) stats[id] = { impressions: 0, clicks: 0 };
      stats[id].clicks++;
      localStorage.setItem(key, JSON.stringify(stats));
    } catch(e) {}
  },

  // localStorage에서 관리자 등록 팝업 로드
  _loadLocalPopups() {
    try {
      const settings = JSON.parse(localStorage.getItem('amk_settings')||'{}');
      return settings.popups || [];
    } catch(e) { return []; }
  },

  async show(regionId='all') {
    // ① localStorage에서 관리자 등록 팝업 우선 로드
    const localPopups = PopupManager._loadLocalPopups();
    const today = new Date().toISOString().split('T')[0];

    let toShow = [];

    if (localPopups.length > 0) {
      // 관리자 등록 팝업 필터링
      toShow = localPopups.filter(p => {
        const pid = p.id || (p.title + (p.startDate||''));
        return (p.isActive !== false) &&
          !PopupManager._isForeverHidden(pid) &&
          !PopupManager._isTodayHidden(pid) &&
          PopupManager._inDateRange(p) &&
          PopupManager._matchesDevice(p) &&
          PopupManager._matchesRegion(p, regionId);
      }).map(p => ({
        ...p,
        id: p.id || (p.title + (p.startDate||'')),
        active: p.isActive !== false,
        allowHideToday: true,
      }));
    }

    // ② localStorage 팝업이 없으면 서버 API 폴백
    if (toShow.length === 0) {
      try {
        const res = await API.get(`/api/popups?region=${regionId}`);
        if (res.success && res.data?.length) {
          const sessionHidden = JSON.parse(sessionStorage.getItem('amk_popups_hidden')||'[]');
          toShow = res.data.filter(p =>
            p.active !== false &&
            !sessionHidden.includes(p.id) &&
            !PopupManager._isForeverHidden(p.id) &&
            !PopupManager._isTodayHidden(p.id) &&
            PopupManager._inDateRange(p) &&
            PopupManager._matchesDevice(p)
          );
        }
      } catch(e) {}
    }

    if (!toShow.length) return;

    // 각 팝업을 순서대로 표시 (최대 3개, z-index 차등)
    toShow.slice(0, 3).forEach((popup, idx) => {
      if (PopupManager.shown.has(popup.id)) return;
      PopupManager.shown.add(popup.id);
      PopupManager._recordImpression(popup.id);
      PopupManager._renderPopup(popup, idx);
    });
  },

  _renderPopup(popup, idx=0) {
    // 기존 팝업 제거 (동일 id)
    document.getElementById(`popup-${popup.id}`)?.remove();

    const isUrgent = popup.type === 'urgent' || popup.type === 'suspension';
    const zBase = 9000 + (idx * 10);

    const el = document.createElement('div');
    el.className = 'popup-modal';
    el.id = `popup-${popup.id}`;
    el.style.cssText = `
      position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,0.5); z-index:${zBase};
    `;

    // 이미지 영역 (image 필드 있을 때)
    const imgHtml = popup.image
      ? `<img src="${popup.image}" alt="${popup.title}" class="w-full rounded-t-2xl object-cover max-h-48"
           onclick="PopupManager.recordClick('${popup.id}')" style="cursor:pointer">`
      : '';

    // 버튼 링크 (buttonLink 필드 있을 때)
    const linkHtml = popup.buttonLink
      ? `<a href="${popup.buttonLink}" target="_blank" rel="noopener"
           onclick="PopupManager.recordClick('${popup.id}')"
           class="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg text-sm hover:bg-blue-700 font-medium">
           ${popup.buttonText || '자세히 보기'}
         </a>`
      : `<button onclick="PopupManager.close('${popup.id}', false, false)"
           class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 font-medium">
           확인
         </button>`;

    const headerBg = isUrgent
      ? 'background:linear-gradient(135deg,#dc2626,#b91c1c);'
      : 'background:linear-gradient(135deg,#1e3a5f,#0e7490);';

    el.innerHTML = `
      <div style="background:#fff; border-radius:1rem; box-shadow:0 20px 60px rgba(0,0,0,.35);
                  width:100%; max-width:400px; margin:1rem; overflow:hidden; position:relative;">
        ${imgHtml}
        <div style="${headerBg} padding:0.875rem 1rem;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="color:#fff; font-weight:700; font-size:0.875rem;">
              ${isUrgent ? '⚠️ 긴급공지' : '📢 공지'}
            </span>
            <button onclick="PopupManager.close('${popup.id}', false, false)"
              style="color:rgba(255,255,255,.7); font-size:1.5rem; line-height:1; background:none; border:none; cursor:pointer;">&times;</button>
          </div>
        </div>
        <div style="padding:1.25rem 1.25rem 0.75rem;">
          <h3 style="font-weight:700; color:#111827; margin-bottom:0.5rem; font-size:1rem;">
            ${popup.title || ''}
          </h3>
          <p style="color:#4b5563; font-size:0.875rem; line-height:1.6; white-space:pre-line;">
            ${popup.content || ''}
          </p>
        </div>
        <div style="padding:0.75rem 1.25rem 1rem; display:flex; align-items:center; justify-content:space-between; gap:0.75rem;">
          <div style="display:flex; flex-direction:column; gap:0.25rem;">
            <button onclick="PopupManager.close('${popup.id}', true, false)"
              style="font-size:0.75rem; color:#9ca3af; text-decoration:underline; background:none; border:none; cursor:pointer; text-align:left;">
              오늘 하루 보지 않기
            </button>
            <button onclick="PopupManager.close('${popup.id}', false, true)"
              style="font-size:0.75rem; color:#d1d5db; text-decoration:underline; background:none; border:none; cursor:pointer; text-align:left;">
              다시 보지 않기
            </button>
          </div>
          ${linkHtml}
        </div>
      </div>`;

    // 배경 클릭 시 닫기
    el.addEventListener('click', (e) => {
      if (e.target === el) PopupManager.close(popup.id, false, false);
    });

    document.body.appendChild(el);
  },

  close(id, hideToday, hideForever) {
    document.getElementById(`popup-${id}`)?.remove();
    PopupManager.shown.delete(id);

    if (hideForever) {
      // localStorage 영구 숨김
      const stored = JSON.parse(localStorage.getItem('amk_popups_forever')||'[]');
      if (!stored.includes(id)) stored.push(id);
      localStorage.setItem('amk_popups_forever', JSON.stringify(stored));
    } else if (hideToday) {
      // 오늘 날짜 기반 localStorage (탭 닫아도 유지, 자정 초기화)
      const today = new Date().toISOString().split('T')[0];
      const key = 'amk_popups_today';
      const stored = JSON.parse(localStorage.getItem(key)||'{}');
      stored[id] = today;
      localStorage.setItem(key, JSON.stringify(stored));
    }
  },
};

// 전역 노출
window.Store    = Store;
window.API      = API;
window.Router   = Router;
window.Utils    = Utils;
window.Settings = Settings;
window.Navbar   = Navbar;
window.Footer   = Footer;
window.PopupManager = PopupManager;
window.initPageComponents = initPageComponents;
