// ============================================================
// STATS MODULE - 통계/보고서 대시보드
// 아쿠아모빌리티코리아 통합 플랫폼
// ============================================================

const StatsModule = (() => {

  // ── 차트 인스턴스 관리 ─────────────────────────────────────
  const _charts = {};
  const destroyChart = (id) => { if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; } };
  const destroyAll = () => Object.keys(_charts).forEach(destroyChart);

  // ── 목업 데이터 생성 헬퍼 ──────────────────────────────────
  const randBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const genDailyData = (days = 30, baseVal = 200) => {
    return [...Array(days)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      return { date: d.toISOString().slice(0, 10), value: randBetween(baseVal * 0.6, baseVal * 1.4) };
    });
  };

  const genMonthlyData = (months = 12, baseVal = 5000) => {
    const labels = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    return labels.map((m, i) => ({
      label: m,
      value: i < new Date().getMonth() + 1 ? randBetween(baseVal * 0.5, baseVal * 1.5) : 0,
    }));
  };

  // ── 차트 색상 팔레트 ───────────────────────────────────────
  const COLORS = {
    blue:   { bg: 'rgba(59,130,246,0.15)',   border: 'rgba(59,130,246,1)' },
    green:  { bg: 'rgba(16,185,129,0.15)',   border: 'rgba(16,185,129,1)' },
    purple: { bg: 'rgba(139,92,246,0.15)',   border: 'rgba(139,92,246,1)' },
    orange: { bg: 'rgba(245,158,11,0.15)',   border: 'rgba(245,158,11,1)' },
    red:    { bg: 'rgba(239,68,68,0.15)',    border: 'rgba(239,68,68,1)' },
    cyan:   { bg: 'rgba(6,182,212,0.15)',    border: 'rgba(6,182,212,1)' },
    PIE:    ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'],
  };

  // ── 공통 차트 기본 옵션 ────────────────────────────────────
  const baseLineOpts = (label, color = 'blue') => ({
    type: 'line',
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 7, font: { size: 11 } } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
      },
      elements: { point: { radius: 2, hoverRadius: 5 }, line: { tension: 0.3 } },
    },
  });

  // ── 통계 레이아웃 렌더링 ───────────────────────────────────
  const statCard = (icon, label, value, sub, color = 'blue', trend = null) => `
    <div class="stat-card bg-white rounded-xl shadow-sm p-5 border-l-4 border-${color}-500">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-gray-500 text-xs font-medium uppercase tracking-wide">${label}</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">${value}</p>
          ${sub ? `<p class="text-xs text-gray-500 mt-1">${sub}</p>` : ''}
          ${trend !== null ? `<p class="text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'} font-medium">
            <i class="fas fa-arrow-${trend >= 0 ? 'up' : 'down'} mr-0.5"></i>${Math.abs(trend)}% 전월 대비
          </p>` : ''}
        </div>
        <div class="w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center ml-3">
          <i class="${icon} text-${color}-600 text-xl"></i>
        </div>
      </div>
    </div>
  `;

  const renderLayout = (content, title = '통계/보고서') => `
    <div class="min-h-screen bg-gray-50">
      <!-- 헤더 -->
      <div class="bg-white border-b sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-14">
            <div class="flex items-center gap-3">
              <button onclick="history.back()" class="text-gray-500 hover:text-gray-800 p-1">
                <i class="fas fa-arrow-left"></i>
              </button>
              <h1 class="text-gray-800 font-semibold">${title}</h1>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="StatsModule.exportPDF()" class="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 flex items-center gap-1">
                <i class="fas fa-file-pdf text-red-500"></i> PDF 출력
              </button>
              <button onclick="StatsModule.exportExcel()" class="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 flex items-center gap-1">
                <i class="fas fa-file-excel text-green-500"></i> 엑셀 다운로드
              </button>
            </div>
          </div>
          <!-- 탭 네비게이션 -->
          <div class="flex gap-1 pb-0 overflow-x-auto">
            ${[
              { id: 'sales',       label: '매출 통계',     icon: 'fas fa-won-sign' },
              { id: 'passengers',  label: '승객 통계',     icon: 'fas fa-users' },
              { id: 'operations',  label: '운영 통계',     icon: 'fas fa-bus' },
              { id: 'marketing',   label: '마케팅 분석',   icon: 'fas fa-bullhorn' },
              { id: 'wristbands',  label: '손목밴드',      icon: 'fas fa-qrcode' },
              { id: 'monthly',     label: '월간 운영보고서', icon: 'fas fa-calendar-alt' },
              { id: 'report',      label: '보고서 생성',   icon: 'fas fa-file-alt' },
            ].map(t => `
              <button onclick="StatsModule.switchTab('${t.id}')"
                class="stats-tab whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5"
                id="tab-${t.id}">
                <i class="${t.icon} text-xs"></i> ${t.label}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- 콘텐츠 영역 -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- 공통 필터 -->
        <div class="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div class="flex items-center gap-2">
            <i class="fas fa-filter text-gray-400 text-sm"></i>
            <span class="text-sm font-medium text-gray-700">필터:</span>
          </div>
          <select id="stats-region" onchange="StatsModule.refreshCurrent()" class="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">전체 지역</option>
            ${(window.REGIONS||[]).filter(r=>r.status==='active').map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}
          </select>
          <select id="stats-period" onchange="StatsModule.refreshCurrent()" class="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="7">최근 7일</option>
            <option value="30" selected>최근 30일</option>
            <option value="90">최근 3개월</option>
            <option value="365">올해</option>
          </select>
          <input type="date" id="stats-from" class="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <span class="text-gray-400 text-sm">~</span>
          <input type="date" id="stats-to" class="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <button onclick="StatsModule.refreshCurrent()" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
            <i class="fas fa-sync-alt mr-1"></i>조회
          </button>
          <span class="ml-auto text-xs text-gray-400">마지막 갱신: ${new Date().toLocaleTimeString('ko-KR')}</span>
        </div>

        <!-- 탭 콘텐츠 -->
        <div id="stats-content">${content}</div>
      </div>
    </div>
  `;

  // ── 매출 통계 탭 ───────────────────────────────────────────
  const salesTab = () => {
    const daily = genDailyData(30, 3500000);
    const monthly = genMonthlyData(12, 80000000);
    const regions = (window.REGIONS||[]).filter(r=>r.status==='active');

    const regionRevenue = regions.map(r => ({
      name: r.shortName || r.name,
      online: randBetween(15000000, 45000000),
      offline: randBetween(5000000, 15000000),
    }));

    setTimeout(() => {
      // 일별 매출 차트
      destroyChart('dailySales');
      const ctx1 = document.getElementById('chart-daily-sales');
      if (ctx1) {
        _charts['dailySales'] = new Chart(ctx1, {
          type: 'line',
          data: {
            labels: daily.map(d => d.date.slice(5)),
            datasets: [{
              label: '일별 매출',
              data: daily.map(d => d.value),
              backgroundColor: COLORS.blue.bg,
              borderColor: COLORS.blue.border,
              borderWidth: 2, fill: true,
            }],
          },
          options: {
            ...baseLineOpts('일별 매출').options,
            plugins: { ...baseLineOpts().options.plugins, tooltip: {
              callbacks: { label: ctx => `₩${ctx.raw.toLocaleString()}` },
            }},
          },
        });
      }

      // 월별 매출 차트
      destroyChart('monthlySales');
      const ctx2 = document.getElementById('chart-monthly-sales');
      if (ctx2) {
        _charts['monthlySales'] = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: monthly.map(d => d.label),
            datasets: [{
              label: '월별 매출',
              data: monthly.map(d => d.value),
              backgroundColor: monthly.map((d, i) => i === new Date().getMonth() ? COLORS.blue.border : COLORS.blue.bg),
              borderColor: COLORS.blue.border,
              borderWidth: 1, borderRadius: 4,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `₩${ctx.raw.toLocaleString()}` } } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.04)' } } },
          },
        });
      }

      // 지역별 매출 비교 차트
      destroyChart('regionSales');
      const ctx3 = document.getElementById('chart-region-sales');
      if (ctx3) {
        _charts['regionSales'] = new Chart(ctx3, {
          type: 'bar',
          data: {
            labels: regionRevenue.map(r => r.name),
            datasets: [
              { label: '온라인', data: regionRevenue.map(r => r.online), backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 4 },
              { label: '현장', data: regionRevenue.map(r => r.offline), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
            ],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => `₩${ctx.raw.toLocaleString()}` } } },
            scales: { x: { stacked: false }, y: { stacked: false } },
          },
        });
      }

      // 결제수단별 파이 차트
      destroyChart('paymentPie');
      const ctx4 = document.getElementById('chart-payment-pie');
      if (ctx4) {
        _charts['paymentPie'] = new Chart(ctx4, {
          type: 'doughnut',
          data: {
            labels: ['신용카드', '간편결제', '가상계좌', '계좌이체', '무료'],
            datasets: [{ data: [55, 28, 8, 6, 3], backgroundColor: COLORS.PIE, hoverOffset: 4 }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
            cutout: '65%',
          },
        });
      }
    }, 100);

    const totalSales = daily.reduce((s, d) => s + d.value, 0);
    const avgDaily = Math.round(totalSales / 30);

    return `
      <!-- KPI 카드 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('fas fa-won-sign', '이번달 총 매출', `₩${Math.round(totalSales/1000000*4).toLocaleString()}M`, '목표 ₩500M', 'blue', 12)}
        ${statCard('fas fa-calendar-day', '일 평균 매출', `₩${Math.round(avgDaily/10000).toLocaleString()}만`, '최근 30일 기준', 'green', 8)}
        ${statCard('fas fa-chart-line', '전월 대비 성장률', '+12.3%', '3개월 연속 상승', 'purple', 12)}
        ${statCard('fas fa-ticket-alt', '총 결제 건수', '4,821건', '취소 제외', 'orange', 5)}
      </div>

      <!-- 차트 그리드 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">일별 매출 추이 (최근 30일)</h3>
          <div style="height:220px"><canvas id="chart-daily-sales"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">월별 매출 (올해)</h3>
          <div style="height:220px"><canvas id="chart-monthly-sales"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">지역별 매출 비교 (온라인/현장)</h3>
          <div style="height:220px"><canvas id="chart-region-sales"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">결제수단별 비중</h3>
          <div style="height:220px"><canvas id="chart-payment-pie"></canvas></div>
        </div>
      </div>

      <!-- 요금별 매출 테이블 -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="font-semibold text-gray-800 mb-4 text-sm">요금 종류별 매출 (이번달)</h3>
        <div class="overflow-x-auto">
          <table class="admin-table w-full text-sm">
            <thead>
              <tr class="bg-gray-50">
                ${['요금 구분','판매량','단가','소계','비중'].map(h=>`<th class="px-4 py-2 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${[
                {label:'성인', qty: randBetween(1800,2400), price:35000},
                {label:'청소년', qty: randBetween(400,600), price:30000},
                {label:'어린이', qty: randBetween(300,500), price:25000},
                {label:'경로', qty: randBetween(150,250), price:30000},
                {label:'단체', qty: randBetween(200,400), price:30000},
                {label:'장애인', qty: randBetween(30,80), price:18000},
                {label:'국가유공자', qty: randBetween(20,50), price:18000},
                {label:'유아', qty: randBetween(50,100), price:0},
              ].map(r => {
                const sub = r.qty * r.price;
                const pct = r.price ? ((sub / 120000000)*100).toFixed(1) : '0';
                return `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-medium">${r.label}</td>
                    <td class="px-4 py-2 text-center">${r.qty.toLocaleString()}명</td>
                    <td class="px-4 py-2 text-center">₩${r.price.toLocaleString()}</td>
                    <td class="px-4 py-2 text-right font-medium">₩${sub.toLocaleString()}</td>
                    <td class="px-4 py-2 text-center">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div class="bg-blue-500 h-1.5 rounded-full" style="width:${Math.min(parseFloat(pct)*2,100)}%"></div>
                        </div>
                        <span class="text-xs text-gray-500 w-10">${pct}%</span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // ── 승객 통계 탭 ───────────────────────────────────────────
  const passengersTab = () => {
    const daily = genDailyData(30, 350);

    setTimeout(() => {
      // 일별 승객 수
      destroyChart('dailyPax');
      const ctx1 = document.getElementById('chart-daily-pax');
      if (ctx1) {
        _charts['dailyPax'] = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: daily.map(d => d.date.slice(5)),
            datasets: [
              { label: '온라인', data: daily.map(d => Math.round(d.value * 0.72)), backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 3 },
              { label: '현장', data: daily.map(d => Math.round(d.value * 0.28)), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 3 },
            ],
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true, grid:{display:false} }, y: { stacked: true } } },
        });
      }

      // 연령별 파이
      destroyChart('agePie');
      const ctx2 = document.getElementById('chart-age-pie');
      if (ctx2) {
        _charts['agePie'] = new Chart(ctx2, {
          type: 'doughnut',
          data: {
            labels: ['10대 이하','20대','30대','40대','50대','60대 이상'],
            datasets: [{ data: [8, 15, 22, 28, 18, 9], backgroundColor: COLORS.PIE, hoverOffset: 4 }],
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels:{font:{size:10}} } }, cutout:'60%' },
        });
      }

      // 지역별 방문 출처
      destroyChart('originBar');
      const ctx3 = document.getElementById('chart-origin-bar');
      if (ctx3) {
        _charts['originBar'] = new Chart(ctx3, {
          type: 'bar',
          data: {
            labels: ['서울/경기','부산','대구','광주','대전','인천','기타 지방','외국인'],
            datasets: [{ label: '방문객', data: [randBetween(800,1200),randBetween(400,700),randBetween(200,400),randBetween(100,250),randBetween(100,200),randBetween(80,180),randBetween(200,500),randBetween(50,150)], backgroundColor: COLORS.PIE, borderRadius: 4 }],
          },
          options: { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}},y:{grid:{display:false}}} },
        });
      }

      // 재방문율 트렌드
      destroyChart('revisitLine');
      const ctx4 = document.getElementById('chart-revisit-line');
      if (ctx4) {
        const months = ['1월','2월','3월','4월','5월'];
        _charts['revisitLine'] = new Chart(ctx4, {
          type: 'line',
          data: {
            labels: months,
            datasets: [
              { label: '신규방문', data: [72,69,67,65,63], backgroundColor: COLORS.blue.bg, borderColor: COLORS.blue.border, fill: true, tension: 0.4 },
              { label: '재방문', data: [28,31,33,35,37], backgroundColor: COLORS.green.bg, borderColor: COLORS.green.border, fill: true, tension: 0.4 },
            ],
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}}, scales:{x:{grid:{display:false}},y:{min:0,max:100,ticks:{callback:v=>`${v}%`}}} },
        });
      }
    }, 100);

    const totalPax = daily.reduce((s, d) => s + d.value, 0);

    return `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('fas fa-users', '이번달 총 승객', `${Math.round(totalPax/1000*4).toLocaleString()}천명`, '전체 지역 합산', 'blue', 9)}
        ${statCard('fas fa-redo', '재방문율', '37%', '전월 대비 +2%p', 'green', 6)}
        ${statCard('fas fa-calendar-day', '1회차 평균 탑승', '38.2명', '정원 대비 84.9%', 'purple', 3)}
        ${statCard('fas fa-globe', '외국인 비율', '4.2%', '주로 일본·중국 관광객', 'orange', 12)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">일별 승객 수 (온라인/현장)</h3>
          <div style="height:220px"><canvas id="chart-daily-pax"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">연령대별 비중</h3>
          <div style="height:220px"><canvas id="chart-age-pie"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">출발지별 방문객 분포</h3>
          <div style="height:220px"><canvas id="chart-origin-bar"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">신규/재방문 트렌드</h3>
          <div style="height:220px"><canvas id="chart-revisit-line"></canvas></div>
        </div>
      </div>

      <!-- 승객 상세 테이블 -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="font-semibold text-gray-800 mb-4 text-sm">지역별 승객 비교</h3>
        <div class="overflow-x-auto">
          <table class="admin-table w-full text-sm">
            <thead>
              <tr class="bg-gray-50">
                ${['지역','총 승객','온라인','현장','만석률','재방문율'].map(h=>`<th class="px-4 py-2 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${(window.REGIONS||[]).filter(r=>r.status==='active').map(r => {
                const total = randBetween(2000, 6000);
                const online = Math.round(total * (r.onlineRatio||70) / 100);
                const offline = total - online;
                const occ = randBetween(78, 95);
                const rev = randBetween(28, 45);
                return `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-medium">${r.name}</td>
                    <td class="px-4 py-2 text-center">${total.toLocaleString()}명</td>
                    <td class="px-4 py-2 text-center text-blue-600">${online.toLocaleString()}명</td>
                    <td class="px-4 py-2 text-center text-green-600">${offline.toLocaleString()}명</td>
                    <td class="px-4 py-2 text-center">
                      <span class="font-medium ${occ>=90?'text-red-600':occ>=80?'text-orange-500':'text-gray-700'}">${occ}%</span>
                    </td>
                    <td class="px-4 py-2 text-center">${rev}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // ── 운영 통계 탭 ───────────────────────────────────────────
  const operationsTab = () => {
    setTimeout(() => {
      // 회차별 탑승률
      destroyChart('scheduleOcc');
      const ctx1 = document.getElementById('chart-schedule-occ');
      if (ctx1) {
        _charts['scheduleOcc'] = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: ['10:00','12:00','14:00','15:30','17:00'],
            datasets: [{
              label: '평균 탑승률',
              data: [92, 78, 95, 88, 62],
              backgroundColor: ctx => {
                const v = ctx.dataset.data[ctx.dataIndex];
                return v >= 90 ? 'rgba(239,68,68,0.7)' : v >= 80 ? 'rgba(245,158,11,0.7)' : 'rgba(59,130,246,0.7)';
              },
              borderRadius: 5,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `탑승률: ${ctx.raw}%` } } },
            scales: { x: { grid: { display: false } }, y: { min: 0, max: 100, ticks: { callback: v => `${v}%` } } },
          },
        });
      }

      // 요일별 예약 히트맵 (Bar로 대체)
      destroyChart('dayOfWeek');
      const ctx2 = document.getElementById('chart-dow');
      if (ctx2) {
        _charts['dayOfWeek'] = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: ['월','화','수','목','금','토','일'],
            datasets: [{
              label: '평균 예약수',
              data: [randBetween(120,180),randBetween(100,150),randBetween(110,160),randBetween(115,165),randBetween(200,280),randBetween(320,420),randBetween(290,380)],
              backgroundColor: ['rgba(59,130,246,0.6)','rgba(59,130,246,0.6)','rgba(59,130,246,0.6)','rgba(59,130,246,0.6)','rgba(245,158,11,0.7)','rgba(239,68,68,0.7)','rgba(239,68,68,0.7)'],
              borderRadius: 4,
            }],
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}},y:{grid:{color:'rgba(0,0,0,0.04)'}}} },
        });
      }

      // 취소율 트렌드
      destroyChart('cancelTrend');
      const ctx3 = document.getElementById('chart-cancel');
      if (ctx3) {
        const months = ['1월','2월','3월','4월','5월'];
        _charts['cancelTrend'] = new Chart(ctx3, {
          type: 'line',
          data: {
            labels: months,
            datasets: [{ label: '취소율 (%)', data: [5.2,4.8,4.1,3.8,3.5], borderColor: COLORS.red.border, backgroundColor: COLORS.red.bg, fill: true, tension: 0.4, borderWidth: 2 }],
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>`취소율: ${parseFloat(c.raw).toFixed(1)}%`}}}, scales:{x:{grid:{display:false}},y:{ticks:{callback:v=>`${parseFloat(v).toFixed(1)}%`}}} },
        });
      }

      // 대기자 현황
      destroyChart('waitlistBar');
      const ctx4 = document.getElementById('chart-waitlist');
      if (ctx4) {
        _charts['waitlistBar'] = new Chart(ctx4, {
          type: 'bar',
          data: {
            labels: (window.REGIONS||[]).filter(r=>r.status==='active').map(r=>r.shortName||r.name),
            datasets: [
              { label: '대기 등록', data: [randBetween(30,80),randBetween(20,60),randBetween(10,40)], backgroundColor: 'rgba(245,158,11,0.7)', borderRadius: 4 },
              { label: '자동 전환', data: [randBetween(20,50),randBetween(15,45),randBetween(8,30)], backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
            ],
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}}, scales:{x:{grid:{display:false}},y:{grid:{color:'rgba(0,0,0,0.04)'}}} },
        });
      }
    }, 100);

    return `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('fas fa-bus', '총 운행 회차', '1,248회', '이번달', 'blue', 0)}
        ${statCard('fas fa-chair', '평균 좌석 점유율', '84.9%', '전체 지역 평균', 'green', 4)}
        ${statCard('fas fa-ban', '운행 중단', '3회', '기상악화 2, 차량 1', 'red', -40)}
        ${statCard('fas fa-clock', '대기 등록', '87명', '자동 전환 대기', 'orange', 22)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">회차별 평균 탑승률</h3>
          <div class="text-xs text-gray-500 mb-2 flex gap-3">
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-red-400 inline-block"></span>만석 위험 (≥90%)</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-yellow-400 inline-block"></span>보통 (80~89%)</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-blue-400 inline-block"></span>여유 (&lt;80%)</span>
          </div>
          <div style="height:200px"><canvas id="chart-schedule-occ"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">요일별 평균 예약 수</h3>
          <div style="height:220px"><canvas id="chart-dow"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">취소율 월별 추이</h3>
          <div style="height:220px"><canvas id="chart-cancel"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">대기자 등록/전환 현황</h3>
          <div style="height:220px"><canvas id="chart-waitlist"></canvas></div>
        </div>
      </div>

      <!-- 운행 일지 -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="font-semibold text-gray-800 mb-4 text-sm">최근 운행 일지</h3>
        <div class="overflow-x-auto">
          <table class="admin-table w-full text-sm">
            <thead>
              <tr class="bg-gray-50">
                ${['날짜','지역','회차','예약','탑승','점유율','취소','비고'].map(h=>`<th class="px-3 py-2 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${[...Array(7)].map((_, i) => {
                const d = new Date(); d.setDate(d.getDate() - i);
                const cap = 45, booked = randBetween(30, 45), boarded = randBetween(booked-3, booked), cancelled = booked - boarded;
                const occ = Math.round(boarded/cap*100);
                return `
                  <tr class="hover:bg-gray-50">
                    <td class="px-3 py-2 text-gray-600">${d.toISOString().slice(0,10)}</td>
                    <td class="px-3 py-2 text-center">통영</td>
                    <td class="px-3 py-2 text-center">${['10:00','14:00','16:30'][i%3]}</td>
                    <td class="px-3 py-2 text-center">${booked}석</td>
                    <td class="px-3 py-2 text-center font-medium">${boarded}명</td>
                    <td class="px-3 py-2 text-center"><span class="${occ>=90?'text-red-600':occ>=80?'text-orange-500':'text-gray-700'} font-medium">${occ}%</span></td>
                    <td class="px-3 py-2 text-center text-red-500">${cancelled}명</td>
                    <td class="px-3 py-2 text-center text-gray-400">-</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // ── 마케팅 분석 탭 ─────────────────────────────────────────
  const marketingTab = () => {
    setTimeout(() => {
      // 유입 경로 파이
      destroyChart('sourcePie');
      const ctx1 = document.getElementById('chart-source-pie');
      if (ctx1) {
        _charts['sourcePie'] = new Chart(ctx1, {
          type: 'doughnut',
          data: {
            labels: ['네이버 검색','구글 검색','카카오','인스타그램','직접 입력','블로그','기타'],
            datasets: [{ data: [35,22,15,12,8,5,3], backgroundColor: COLORS.PIE.concat(['#94a3b8']), hoverOffset:4 }],
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{font:{size:10}}}}, cutout:'60%' },
        });
      }

      // 유입 트렌드 라인
      destroyChart('sourceTrend');
      const ctx2 = document.getElementById('chart-source-trend');
      if (ctx2) {
        const months = ['1월','2월','3월','4월','5월'];
        _charts['sourceTrend'] = new Chart(ctx2, {
          type: 'line',
          data: {
            labels: months,
            datasets: [
              { label: '네이버', data: [820,870,910,940,980], borderColor: '#03c75a', backgroundColor: 'rgba(3,199,90,0.08)', fill:true, tension:0.4, borderWidth:2 },
              { label: '구글', data: [420,480,520,570,620], borderColor: '#4285F4', backgroundColor: 'rgba(66,133,244,0.08)', fill:true, tension:0.4, borderWidth:2 },
              { label: '카카오', data: [280,300,320,350,380], borderColor: '#FEE500', backgroundColor: 'rgba(254,229,0,0.08)', fill:true, tension:0.4, borderWidth:2 },
              { label: '인스타', data: [180,220,260,300,340], borderColor: '#E1306C', backgroundColor: 'rgba(225,48,108,0.08)', fill:true, tension:0.4, borderWidth:2 },
            ],
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{font:{size:10}}}}, scales:{x:{grid:{display:false}},y:{grid:{color:'rgba(0,0,0,0.04)'}}} },
        });
      }

      // 전환율 퍼널
      destroyChart('funnelBar');
      const ctx3 = document.getElementById('chart-funnel');
      if (ctx3) {
        _charts['funnelBar'] = new Chart(ctx3, {
          type: 'bar',
          data: {
            labels: ['방문','예약 시작','날짜 선택','결제 진행','결제 완료'],
            datasets: [{
              label: '사용자 수',
              data: [10000, 3200, 2100, 1400, 1050],
              backgroundColor: ['rgba(59,130,246,0.8)','rgba(16,185,129,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)','rgba(139,92,246,0.8)'],
              borderRadius: 5,
            }],
          },
          options: { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}},y:{grid:{display:false}}} },
        });
      }
    }, 100);

    return `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('fas fa-eye', '월 총 방문자', '48,320명', '순방문자 기준', 'blue', 18)}
        ${statCard('fas fa-mouse-pointer', '예약 전환율', '10.5%', '방문→결제완료', 'green', 2)}
        ${statCard('fas fa-ad', '광고 ROAS', '8.3x', '검색광고 기준', 'purple', 12)}
        ${statCard('fas fa-star', '평균 평점', '4.7 / 5.0', '리뷰 892건', 'orange', 1)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">유입 채널 비중</h3>
          <div style="height:220px"><canvas id="chart-source-pie"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">채널별 유입 추이 (월별)</h3>
          <div style="height:220px"><canvas id="chart-source-trend"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5 lg:col-span-2">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">예약 전환 퍼널</h3>
          <div class="grid grid-cols-5 gap-2 mb-4">
            ${[
              {label:'방문', val:'10,000', pct:'100%', color:'blue'},
              {label:'예약 시작', val:'3,200', pct:'32%', color:'green'},
              {label:'날짜 선택', val:'2,100', pct:'21%', color:'yellow'},
              {label:'결제 진행', val:'1,400', pct:'14%', color:'orange'},
              {label:'결제 완료', val:'1,050', pct:'10.5%', color:'purple'},
            ].map(f=>`
              <div class="text-center">
                <div class="text-lg font-bold text-${f.color}-600">${f.val}</div>
                <div class="text-xs text-gray-500">${f.label}</div>
                <div class="text-xs font-medium text-gray-700">${f.pct}</div>
              </div>
            `).join('')}
          </div>
          <div style="height:160px"><canvas id="chart-funnel"></canvas></div>
        </div>
      </div>

      <!-- 채널별 상세 테이블 -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="font-semibold text-gray-800 mb-4 text-sm">채널별 성과 상세</h3>
        <div class="overflow-x-auto">
          <table class="admin-table w-full text-sm">
            <thead>
              <tr class="bg-gray-50">
                ${['채널','방문수','예약 수','전환율','매출 기여','광고비','ROAS'].map(h=>`<th class="px-3 py-2 text-xs font-semibold text-gray-600 text-center">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${[
                {ch:'네이버 검색광고', visit:randBetween(12000,18000), conv:8.2, cost:randBetween(1500000,3000000)},
                {ch:'구글 검색광고', visit:randBetween(6000,10000), conv:9.1, cost:randBetween(800000,1500000)},
                {ch:'카카오 채널', visit:randBetween(4000,7000), conv:12.5, cost:randBetween(300000,600000)},
                {ch:'인스타그램', visit:randBetween(3000,6000), conv:6.8, cost:randBetween(500000,1000000)},
                {ch:'블로그/SNS 자연유입', visit:randBetween(2000,4000), conv:15.2, cost:0},
                {ch:'직접 입력', visit:randBetween(1500,3000), conv:18.4, cost:0},
              ].map(r => {
                const bookings = Math.round(r.visit * r.conv / 100);
                const revenue = bookings * 35000;
                const roas = r.cost > 0 ? (revenue/r.cost).toFixed(1) : '-';
                return `
                  <tr class="hover:bg-gray-50">
                    <td class="px-3 py-2 font-medium">${r.ch}</td>
                    <td class="px-3 py-2 text-center">${r.visit.toLocaleString()}</td>
                    <td class="px-3 py-2 text-center">${bookings.toLocaleString()}</td>
                    <td class="px-3 py-2 text-center ${r.conv>=12?'text-green-600':r.conv>=8?'text-blue-600':'text-gray-600'} font-medium">${r.conv}%</td>
                    <td class="px-3 py-2 text-right">₩${revenue.toLocaleString()}</td>
                    <td class="px-3 py-2 text-right text-gray-500">${r.cost?'₩'+r.cost.toLocaleString():'-'}</td>
                    <td class="px-3 py-2 text-center font-medium ${roas!=='-'&&parseFloat(roas)>=5?'text-green-600':'text-gray-600'}">${roas}${roas!=='-'?'x':''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // ── 손목밴드 통계 탭 ───────────────────────────────────────
  const wristbandsTab = () => {
    setTimeout(() => {
      destroyChart('wbDaily');
      const ctx1 = document.getElementById('chart-wb-daily');
      if (ctx1) {
        const daily = genDailyData(14, 280);
        _charts['wbDaily'] = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: daily.map(d=>d.date.slice(5)),
            datasets: [
              { label: '발급', data: daily.map(d=>Math.round(d.value*0.95)), backgroundColor:'rgba(59,130,246,0.7)', borderRadius:3 },
              { label: '재발급', data: daily.map(d=>Math.round(d.value*0.05)), backgroundColor:'rgba(239,68,68,0.7)', borderRadius:3 },
            ],
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}}, scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true}} },
        });
      }

      destroyChart('wbType');
      const ctx2 = document.getElementById('chart-wb-type');
      if (ctx2) {
        _charts['wbType'] = new Chart(ctx2, {
          type: 'doughnut',
          data: {
            labels: ['성인','청소년','어린이','경로','장애인','기타'],
            datasets: [{ data: [52,18,15,8,4,3], backgroundColor: COLORS.PIE, hoverOffset:4 }],
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{font:{size:10}}}}, cutout:'60%' },
        });
      }
    }, 100);

    return `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('fas fa-qrcode', '이번달 총 발급', '8,432개', '탑승 대비 97.2%', 'blue', 5)}
        ${statCard('fas fa-redo', '재발급 건수', '182개', '분실/훼손', 'orange', -10)}
        ${statCard('fas fa-ban', '무효화 처리', '182개', '재발급 시 자동', 'red', -10)}
        ${statCard('fas fa-check-double', '최종 탑승 확인', '97.2%', '미탑승 2.8%', 'green', 2)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">일별 손목밴드 발급/재발급</h3>
          <div style="height:220px"><canvas id="chart-wb-daily"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">티켓 유형별 발급 비중</h3>
          <div style="height:220px"><canvas id="chart-wb-type"></canvas></div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="font-semibold text-gray-800 mb-4 text-sm">재발급 사유 분석</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${[
            {label:'밴드 분실', cnt:89, color:'red'},
            {label:'밴드 훼손', cnt:54, color:'orange'},
            {label:'오발급', cnt:28, color:'yellow'},
            {label:'기타', cnt:11, color:'gray'},
          ].map(r=>`
            <div class="text-center p-4 bg-${r.color}-50 rounded-xl">
              <div class="text-2xl font-bold text-${r.color}-600">${r.cnt}건</div>
              <div class="text-sm text-gray-600 mt-1">${r.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  // ── 월간 운영보고서 탭 ────────────────────────────────────
  const MONTHLY_SAMPLE = {
    tongyeong: {
      name: '통영', month: '2025년 4월',
      totalPax: 12480, onlinePax: 8736, offlinePax: 3744,
      totalSales: 437280000, onlineSales: 306096000, offlineSales: 131184000,
      cancelCnt: 124, cancelAmt: 4340000, refundAmt: 3872000,
      trips: 248, vehicles: 4, avgOccupancy: 87.3,
      wristbandIssued: 12480, wristbandReissued: 89, wristbandInvalid: 89,
      weatherCancelDays: 3, weatherCancelTrips: 18,
      onlineRatio: 70, offlineRatio: 30,
      fareBreakdown: [
        {label:'성인', cnt:7488, price:35000},
        {label:'청소년', cnt:1872, price:30000},
        {label:'어린이', cnt:1248, price:25000},
        {label:'경로', cnt:936, price:30000},
        {label:'단체', cnt:936, price:30000},
      ],
      dailyPax: [320,298,412,388,445,502,489,356,321,298,
                 412,388,445,502,489,356,321,298,412,388,
                 445,502,489,356,321,298,412,388,445,502],
      channels: [{ch:'직접방문',pct:28},{ch:'네이버',pct:22},{ch:'카카오',pct:18},{ch:'인스타',pct:15},{ch:'여행사',pct:10},{ch:'기타',pct:7}],
      satisfaction: 4.6, reviewCnt: 842,
      incidents: '특이사항 없음',
      remarks: '4월 황금연휴 기간(26일~30일) 예약이 집중되어 전월 대비 15% 증가. 차량 1대 정기점검으로 3일간 3회차 운영.',
    },
    buyeo: {
      name: '부여', month: '2025년 4월',
      totalPax: 8320, onlinePax: 5824, offlinePax: 2496,
      totalSales: 291200000, onlineSales: 203840000, offlineSales: 87360000,
      cancelCnt: 83, cancelAmt: 2905000, refundAmt: 2614500,
      trips: 166, vehicles: 3, avgOccupancy: 82.1,
      wristbandIssued: 8320, wristbandReissued: 62, wristbandInvalid: 62,
      weatherCancelDays: 5, weatherCancelTrips: 25,
      onlineRatio: 70, offlineRatio: 30,
      fareBreakdown: [
        {label:'성인', cnt:4992, price:35000},
        {label:'청소년', cnt:1248, price:30000},
        {label:'어린이', cnt:832, price:25000},
        {label:'경로', cnt:624, price:30000},
        {label:'단체', cnt:624, price:30000},
      ],
      dailyPax: [215,198,278,258,298,335,326,238,215,198,
                 278,258,298,335,326,238,215,198,278,258,
                 298,335,326,238,215,198,278,258,298,335],
      channels: [{ch:'직접방문',pct:32},{ch:'네이버',pct:20},{ch:'카카오',pct:16},{ch:'인스타',pct:12},{ch:'여행사',pct:13},{ch:'기타',pct:7}],
      satisfaction: 4.4, reviewCnt: 563,
      incidents: '4월 15일 강우로 오전 2회차 결항',
      remarks: '백제문화제 연계 단체 예약 증가. 학교 단체 방문(초등학교 8개교, 중학교 3개교) 집중.',
    },
    hapcheon: {
      name: '합천', month: '2025년 4월',
      totalPax: 4680, onlinePax: 3276, offlinePax: 1404,
      totalSales: 163800000, onlineSales: 114660000, offlineSales: 49140000,
      cancelCnt: 47, cancelAmt: 1645000, refundAmt: 1480500,
      trips: 94, vehicles: 2, avgOccupancy: 78.5,
      wristbandIssued: 4680, wristbandReissued: 35, wristbandInvalid: 35,
      weatherCancelDays: 4, weatherCancelTrips: 16,
      onlineRatio: 70, offlineRatio: 30,
      fareBreakdown: [
        {label:'성인', cnt:2808, price:35000},
        {label:'청소년', cnt:702, price:30000},
        {label:'어린이', cnt:468, price:25000},
        {label:'경로', cnt:351, price:30000},
        {label:'단체', cnt:351, price:30000},
      ],
      dailyPax: [120,112,156,145,168,189,184,134,120,112,
                 156,145,168,189,184,134,120,112,156,145,
                 168,189,184,134,120,112,156,145,168,189],
      channels: [{ch:'직접방문',pct:35},{ch:'네이버',pct:18},{ch:'카카오',pct:14},{ch:'인스타',pct:11},{ch:'여행사',pct:15},{ch:'기타',pct:7}],
      satisfaction: 4.5, reviewCnt: 318,
      incidents: '4월 8일, 12일 강풍으로 운항 중지',
      remarks: '합천호 수위 상승으로 승선장 임시 이전(4.10~4.14). 대체 승선장 운영 원활.',
    },
  };

  // 월간 보고서 샘플 데이터 합산
  const _calcMonthlyTotal = (regions) => {
    const list = regions.map(k => MONTHLY_SAMPLE[k]).filter(Boolean);
    return {
      totalPax:     list.reduce((s,r)=>s+r.totalPax,0),
      totalSales:   list.reduce((s,r)=>s+r.totalSales,0),
      cancelCnt:    list.reduce((s,r)=>s+r.cancelCnt,0),
      cancelAmt:    list.reduce((s,r)=>s+r.cancelAmt,0),
      refundAmt:    list.reduce((s,r)=>s+r.refundAmt,0),
      trips:        list.reduce((s,r)=>s+r.trips,0),
      wristbandIssued:   list.reduce((s,r)=>s+r.wristbandIssued,0),
      wristbandReissued: list.reduce((s,r)=>s+r.wristbandReissued,0),
      weatherCancelTrips:list.reduce((s,r)=>s+r.weatherCancelTrips,0),
    };
  };

  const monthlyReportTab = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const reportMonth = `${year}년 ${month}월`;

    // ── 권한별 접근 가능 지역 결정 ──────────────────────────
    const user = (typeof Store !== 'undefined' && Store.get('adminUser')) || {};
    const userRole = user.role || 'super';
    const userRegionId = user.regionId || null;

    // 지역 관리자는 자기 지역만, super/accountant 등은 전체
    const ALL_KEYS = ['tongyeong','buyeo','hapcheon'];
    const allKeys = (userRole === 'regional' && userRegionId && MONTHLY_SAMPLE[userRegionId])
      ? [userRegionId]
      : ALL_KEYS;

    const total = _calcMonthlyTotal(allKeys);
    const fmt = (n) => n.toLocaleString('ko-KR');
    const fmtW = (n) => `₩${Math.round(n/10000).toLocaleString()}만`;

    // 차트: 지역별 일별 탑승 추이 (setTimeout으로 렌더)
    setTimeout(() => {
      const days = Array.from({length:30},(_,i)=>i+1);

      destroyChart('mr-daily-pax');
      const ctx1 = document.getElementById('mr-chart-daily-pax');
      if (ctx1) {
        _charts['mr-daily-pax'] = new Chart(ctx1, {
          type: 'line',
          data: {
            labels: days.map(d=>`${d}일`),
            datasets: allKeys.map((k,i) => ({
              label: MONTHLY_SAMPLE[k].name,
              data: MONTHLY_SAMPLE[k].dailyPax,
              borderColor: [COLORS.blue.border, COLORS.green.border, COLORS.purple.border][i],
              backgroundColor: 'transparent',
              borderWidth: 2,
              tension: 0.3,
              pointRadius: 1,
            })),
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position:'bottom', labels:{font:{size:11}} } },
            scales: {
              x: { grid:{display:false}, ticks:{maxTicksLimit:10, font:{size:10}} },
              y: { grid:{color:'rgba(0,0,0,0.04)'}, ticks:{font:{size:10}} },
            },
          },
        });
      }

      destroyChart('mr-region-sales');
      const ctx2 = document.getElementById('mr-chart-region-sales');
      if (ctx2) {
        _charts['mr-region-sales'] = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: allKeys.map(k=>MONTHLY_SAMPLE[k].name),
            datasets: [
              { label:'온라인', data: allKeys.map(k=>MONTHLY_SAMPLE[k].onlineSales), backgroundColor:'rgba(59,130,246,0.75)', borderRadius:4 },
              { label:'현장', data: allKeys.map(k=>MONTHLY_SAMPLE[k].offlineSales), backgroundColor:'rgba(16,185,129,0.75)', borderRadius:4 },
            ],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend:{position:'bottom'}, tooltip:{callbacks:{label:c=>`₩${c.raw.toLocaleString()}`}} },
            scales: { x:{grid:{display:false}}, y:{grid:{color:'rgba(0,0,0,0.04)'}} },
          },
        });
      }

      destroyChart('mr-channel-pie');
      const ctx3 = document.getElementById('mr-chart-channel-pie');
      if (ctx3) {
        const chs = MONTHLY_SAMPLE.tongyeong.channels;
        _charts['mr-channel-pie'] = new Chart(ctx3, {
          type: 'doughnut',
          data: {
            labels: chs.map(c=>c.ch),
            datasets: [{ data: chs.map(c=>c.pct), backgroundColor: COLORS.PIE, hoverOffset:4 }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend:{position:'bottom', labels:{font:{size:10}}}, tooltip:{callbacks:{label:c=>`${c.label}: ${c.raw}%`}} },
            cutout:'60%',
          },
        });
      }

      destroyChart('mr-fare-bar');
      const ctx4 = document.getElementById('mr-chart-fare-bar');
      if (ctx4) {
        const fareLabels = MONTHLY_SAMPLE.tongyeong.fareBreakdown.map(f=>f.label);
        _charts['mr-fare-bar'] = new Chart(ctx4, {
          type: 'bar',
          data: {
            labels: fareLabels,
            datasets: allKeys.map((k,i)=>({
              label: MONTHLY_SAMPLE[k].name,
              data: MONTHLY_SAMPLE[k].fareBreakdown.map(f=>f.cnt),
              backgroundColor: ['rgba(59,130,246,0.7)','rgba(16,185,129,0.7)','rgba(139,92,246,0.7)'][i],
              borderRadius: 4,
            })),
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend:{position:'bottom'} },
            scales: { x:{grid:{display:false}}, y:{grid:{color:'rgba(0,0,0,0.04)'}} },
          },
        });
      }
    }, 150);

    // 섹션 빌더 헬퍼
    const section = (num, title, icon, color, body) => `
      <div class="bg-white rounded-xl shadow-sm overflow-hidden print:break-inside-avoid" id="mr-sec-${num}">
        <div class="flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-${color}-50 to-white">
          <div class="w-8 h-8 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <i class="${icon} text-${color}-600 text-sm"></i>
          </div>
          <div>
            <span class="text-xs font-bold text-${color}-500 uppercase tracking-widest">SECTION ${num}</span>
            <h3 class="font-semibold text-gray-800 text-sm leading-tight">${title}</h3>
          </div>
        </div>
        <div class="p-6">${body}</div>
      </div>
    `;

    const kpiGrid = (items) => `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        ${items.map(it=>`
          <div class="text-center p-3 bg-${it.color||'gray'}-50 rounded-xl border border-${it.color||'gray'}-100">
            <div class="text-lg font-bold text-${it.color||'gray'}-700">${it.val}</div>
            <div class="text-xs text-gray-500 mt-0.5">${it.label}</div>
            ${it.sub ? `<div class="text-xs text-${it.color||'gray'}-500 mt-0.5">${it.sub}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    const tbl = (headers, rows, small=false) => `
      <div class="overflow-x-auto">
        <table class="w-full text-${small?'xs':'sm'} border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              ${headers.map(h=>`<th class="px-3 py-2 text-xs font-semibold text-gray-600 text-left whitespace-nowrap">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${rows.map(row=>`<tr class="hover:bg-gray-50">${row.map(cell=>`<td class="px-3 py-2 text-gray-700 whitespace-nowrap">${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;

    return `
      <!-- 보고서 상단 제목 및 다운로드 버튼 -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6 print:hidden">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-gray-800">월간 운영보고서</h2>
            <p class="text-sm text-gray-500 mt-1">아쿠아모빌리티코리아 · ${reportMonth} · 전체 3개 지역</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <select id="mr-region-sel" onchange="StatsModule.switchMonthlyRegion()"
              class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              ${userRole === 'regional' ? 'disabled title="지역 관리자는 담당 지역만 조회 가능합니다"' : ''}>
              ${userRole === 'regional'
                ? `<option value="${userRegionId}">${MONTHLY_SAMPLE[userRegionId]?.name||userRegionId}</option>`
                : `<option value="all">전체 지역 종합</option>
                   <option value="tongyeong">통영</option>
                   <option value="buyeo">부여</option>
                   <option value="hapcheon">합천</option>`
              }
            </select>
            <select id="mr-month-sel" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="${year}-${String(month).padStart(2,'0')}" selected>${year}년 ${month}월</option>
              ${month > 1 ? `<option value="${year}-${String(month-1).padStart(2,'0')}">${year}년 ${month-1}월</option>` : ''}
              <option value="${year-1}-12">${year-1}년 12월</option>
              <option value="${year-1}-11">${year-1}년 11월</option>
            </select>
            <button onclick="StatsModule.exportMonthlyPDF()" class="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 flex items-center gap-1.5">
              <i class="fas fa-file-pdf"></i> PDF 출력
            </button>
            <button onclick="StatsModule.exportMonthlyExcel()" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-1.5">
              <i class="fas fa-file-excel"></i> 엑셀 다운로드
            </button>
          </div>
        </div>
      </div>

      <!-- 보고서 본문 -->
      <div class="space-y-4" id="monthly-report-body">

        ${section(1, '총괄 요약 (Executive Summary)', 'fas fa-clipboard-list', 'blue', `
          ${userRole === 'regional' ? `
          <div class="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <i class="fas fa-lock flex-shrink-0"></i>
            <span><strong>${MONTHLY_SAMPLE[userRegionId]?.name||''}</strong> 지역 보고서 (담당 지역 한정 조회)</span>
          </div>` : ''}
          <div class="flex items-start gap-3 mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <i class="fas fa-info-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
            <p class="text-sm text-blue-800">
              <strong>${reportMonth}</strong> ${allKeys.length === 1 ? MONTHLY_SAMPLE[allKeys[0]]?.name+' 지역' : `전체 ${allKeys.length}개 지역(${allKeys.map(k=>MONTHLY_SAMPLE[k]?.name).join('·')})`} 합산 운영 실적입니다.
              총 탑승객 <strong>${fmt(total.totalPax)}명</strong>으로 전월 대비 <strong class="text-green-600">+11.2%</strong> 증가하였으며,
              총 매출은 <strong>${fmtW(total.totalSales)}</strong>을 기록했습니다.
            </p>
          </div>
          ${kpiGrid([
            {val: fmt(total.totalPax)+'명', label:'총 탑승객', color:'blue'},
            {val: '₩'+fmt(Math.round(total.totalSales/1000000))+'M', label:'총 매출', color:'green'},
            {val: total.trips+'회', label:'총 운항 회수', color:'purple'},
            {val: total.cancelCnt+'건', label:'취소 건수', color:'orange'},
          ])}
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            ${allKeys.map(k=>{
              const r = MONTHLY_SAMPLE[k];
              return `
                <div class="p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-semibold text-gray-800">${r.name}</span>
                    <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">운영중</span>
                  </div>
                  <div class="text-2xl font-bold text-blue-600">${fmt(r.totalPax)}<span class="text-sm font-normal text-gray-500">명</span></div>
                  <div class="text-xs text-gray-500 mt-1">${fmtW(r.totalSales)} · ${r.trips}회 운항</div>
                </div>
              `;
            }).join('')}
          </div>
        `)}

        ${section(2, '지역별 운영 현황', 'fas fa-map-marker-alt', 'green', `
          ${tbl(
            ['지역','운항회수','차량수','평균탑승률','탑승객','매출','기상취소'],
            allKeys.map(k=>{
              const r = MONTHLY_SAMPLE[k];
              return [
                `<span class="font-medium">${r.name}</span>`,
                r.trips+'회',
                r.vehicles+'대',
                `<span class="font-semibold ${r.avgOccupancy>=85?'text-green-600':r.avgOccupancy>=75?'text-blue-600':'text-orange-500'}">${r.avgOccupancy}%</span>`,
                fmt(r.totalPax)+'명',
                fmtW(r.totalSales),
                r.weatherCancelTrips+'회('+r.weatherCancelDays+'일)',
              ];
            })
          )}
          <div class="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-sm text-yellow-800">
            <i class="fas fa-exclamation-triangle mr-1.5"></i>
            <strong>기상 영향</strong>: 전체 ${total.weatherCancelTrips}회 운항 취소. 취소율 ${((total.weatherCancelTrips/total.trips)*100).toFixed(1)}% (전월 대비 소폭 증가)
          </div>
        `)}

        ${section(3, '탑승자 통계', 'fas fa-users', 'purple', `
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-semibold text-gray-700 mb-3">지역별 일별 탑승 추이</h4>
              <div style="height:200px"><canvas id="mr-chart-daily-pax"></canvas></div>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-700 mb-3">요금 구분별 탑승객 (지역 비교)</h4>
              <div style="height:200px"><canvas id="mr-chart-fare-bar"></canvas></div>
            </div>
          </div>
          <div class="mt-4">
            ${tbl(
              ['요금구분','통영','부여','합천','합계','비중'],
              MONTHLY_SAMPLE.tongyeong.fareBreakdown.map((f,i)=>{
                const tng = MONTHLY_SAMPLE.tongyeong.fareBreakdown[i].cnt;
                const bye = MONTHLY_SAMPLE.buyeo.fareBreakdown[i].cnt;
                const hap = MONTHLY_SAMPLE.hapcheon.fareBreakdown[i].cnt;
                const sum = tng+bye+hap;
                const totalPaxAll = total.totalPax;
                return [
                  `<span class="font-medium">${f.label}</span>`,
                  fmt(tng)+'명', fmt(bye)+'명', fmt(hap)+'명',
                  `<strong>${fmt(sum)}명</strong>`,
                  `<span class="text-blue-600 font-medium">${((sum/totalPaxAll)*100).toFixed(1)}%</span>`,
                ];
              })
            )}
          </div>
        `)}

        ${section(4, '매출 분석', 'fas fa-won-sign', 'orange', `
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <div>
              <h4 class="text-sm font-semibold text-gray-700 mb-3">지역별 온라인/현장 매출 비교</h4>
              <div style="height:200px"><canvas id="mr-chart-region-sales"></canvas></div>
            </div>
            <div class="space-y-3">
              <h4 class="text-sm font-semibold text-gray-700">매출 세부 내역</h4>
              ${tbl(
                ['지역','온라인','현장','합계','온라인비중'],
                allKeys.map(k=>{
                  const r = MONTHLY_SAMPLE[k];
                  return [
                    `<span class="font-medium">${r.name}</span>`,
                    fmtW(r.onlineSales), fmtW(r.offlineSales),
                    `<strong>${fmtW(r.totalSales)}</strong>`,
                    `<span class="text-blue-600 font-medium">${r.onlineRatio}%</span>`,
                  ];
                }).concat([[
                  '<strong>합계</strong>',
                  fmtW(allKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].onlineSales,0)),
                  fmtW(allKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].offlineSales,0)),
                  `<strong class="text-green-600">${fmtW(total.totalSales)}</strong>`,
                  '70%',
                ]])
              )}
            </div>
          </div>
          ${kpiGrid([
            {val: fmtW(total.totalSales), label:'총 매출', color:'green'},
            {val: fmtW(Math.round(total.totalSales/total.totalPax*1000)/1000), label:'1인당 매출', color:'blue'},
            {val: fmtW(Math.round(total.totalSales/30)), label:'일평균 매출', color:'purple'},
            {val: '70%', label:'온라인 비중', color:'orange'},
          ])}
        `)}

        ${section(5, '취소/환불 현황', 'fas fa-undo-alt', 'red', `
          ${kpiGrid([
            {val: total.cancelCnt+'건', label:'총 취소 건수', color:'red'},
            {val: fmtW(total.cancelAmt), label:'취소 금액', color:'orange'},
            {val: fmtW(total.refundAmt), label:'환불 금액', color:'purple'},
            {val: ((total.cancelAmt-total.refundAmt)/total.cancelAmt*100).toFixed(1)+'%', label:'수수료 수취율', color:'green'},
          ])}
          <div class="mt-4">
            ${tbl(
              ['지역','취소건수','취소금액','환불금액','수수료','취소율'],
              allKeys.map(k=>{
                const r = MONTHLY_SAMPLE[k];
                const fee = r.cancelAmt - r.refundAmt;
                const rate = ((r.cancelCnt / (r.totalPax+r.cancelCnt))*100).toFixed(2);
                return [
                  r.name, r.cancelCnt+'건',
                  `₩${fmt(r.cancelAmt)}`, `₩${fmt(r.refundAmt)}`,
                  `<span class="text-green-600">₩${fmt(fee)}</span>`,
                  `<span class="${parseFloat(rate)<2?'text-green-600':'text-orange-500'}">${rate}%</span>`,
                ];
              })
            )}
          </div>
          <div class="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <i class="fas fa-info-circle mr-1 text-blue-400"></i>
            취소 정책: 출발 7일 전 전액 환불 / 3~6일 전 80% / 1~2일 전 50% / 당일 환불 불가
          </div>
        `)}

        ${section(6, '손목밴드 QR 현황', 'fas fa-qrcode', 'cyan', `
          ${kpiGrid([
            {val: fmt(total.wristbandIssued)+'개', label:'총 발급', color:'blue'},
            {val: fmt(total.wristbandReissued)+'개', label:'재발급', color:'orange'},
            {val: ((total.wristbandReissued/total.wristbandIssued)*100).toFixed(2)+'%', label:'재발급률', color:'red'},
            {val: ((1-total.wristbandReissued/total.wristbandIssued)*100).toFixed(1)+'%', label:'정상사용률', color:'green'},
          ])}
          <div class="mt-4">
            ${tbl(
              ['지역','발급','재발급','무효화','재발급률','비고'],
              allKeys.map(k=>{
                const r = MONTHLY_SAMPLE[k];
                return [
                  r.name,
                  fmt(r.wristbandIssued)+'개',
                  fmt(r.wristbandReissued)+'개',
                  fmt(r.wristbandInvalid)+'개',
                  `<span class="${r.wristbandReissued/r.wristbandIssued<0.01?'text-green-600':'text-orange-500'}">${((r.wristbandReissued/r.wristbandIssued)*100).toFixed(2)}%</span>`,
                  '분실/훼손',
                ];
              })
            )}
          </div>
        `)}

        ${section(7, '차량 운행 현황', 'fas fa-bus', 'indigo', `
          ${tbl(
            ['지역','보유차량','운행차량','총 회차','1대당 회차','정비일수','특이사항'],
            [
              ['통영','4대','4대','248회','62회','3일','4월 14일 1호 차량 정기점검'],
              ['부여','3대','3대','166회','55회','2일','정기점검 이상 없음'],
              ['합천','2대','2대','94회','47회','4일','4월 8~12일 기상 결항'],
              [`<strong>합계</strong>`,'9대','9대',`<strong>${total.trips}회</strong>`,'56회(평균)','9일','-'],
            ]
          )}
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            ${[
              {label:'총 운항 회수', val:fmt(total.trips)+'회', icon:'fas fa-route', color:'blue'},
              {label:'차량 가동률', val:'96.7%', icon:'fas fa-tachometer-alt', color:'green'},
              {label:'정비 소요일', val:'9일', icon:'fas fa-tools', color:'orange'},
            ].map(it=>`
              <div class="flex items-center gap-3 p-3 bg-${it.color}-50 rounded-xl border border-${it.color}-100">
                <i class="${it.icon} text-${it.color}-500 text-lg w-6 text-center"></i>
                <div>
                  <div class="font-bold text-${it.color}-700">${it.val}</div>
                  <div class="text-xs text-gray-500">${it.label}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `)}

        ${section(8, '기상 영향 분석', 'fas fa-cloud-rain', 'blue', `
          ${tbl(
            ['지역','취소일수','취소회차','취소탑승객(추정)','매출손실(추정)','주요원인'],
            [
              ['통영','3일','18회','~1,800명',fmtW(18*50*35000),'강풍(2회), 안개(1회)'],
              ['부여','5일','25회','~2,500명',fmtW(25*50*35000),'강우(3회), 강풍(2회)'],
              ['합천','4일','16회','~1,280명',fmtW(16*50*35000),'강풍(3회), 수위(1회)'],
              [`<strong>합계</strong>`,`<strong>12일</strong>`,`<strong>${total.weatherCancelTrips}회</strong>`,'~5,580명',
               `<strong class="text-red-600">${fmtW(total.weatherCancelTrips*50*35000)}</strong>`,'강풍 최다'],
            ]
          )}
          <div class="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-gray-700">
            <i class="fas fa-lightbulb mr-1 text-yellow-500"></i>
            <strong>개선 방안:</strong> 기상 예보 모니터링 자동화 시스템 도입 검토 / 취소 고객 대체 일정 안내 프로세스 개선
          </div>
        `)}

        ${section(9, '마케팅 채널 분석', 'fas fa-bullhorn', 'purple', `
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-semibold text-gray-700 mb-3">예약 채널 비중 (통영 기준)</h4>
              <div style="height:200px"><canvas id="mr-chart-channel-pie"></canvas></div>
            </div>
            <div>
              ${tbl(
                ['채널','예약비중','전월대비','특이사항'],
                [
                  ['직접방문','28%','▼2%','현장 방문 소폭 감소'],
                  ['네이버','22%','▲3%','네이버 플레이스 노출 증가'],
                  ['카카오','18%','▲1%','카카오 채널 홍보 효과'],
                  ['인스타','15%','▲4%','릴스 콘텐츠 바이럴'],
                  ['여행사','10%','▼1%','단체 예약 소폭 감소'],
                  ['기타','7%','±0%','-'],
                ]
              )}
            </div>
          </div>
          <div class="mt-3 p-3 bg-purple-50 rounded-lg text-xs text-gray-700">
            <i class="fas fa-chart-line mr-1 text-purple-500"></i>
            온라인 채널(네이버+카카오+인스타) 합산 비중 <strong>55%</strong>로 전월 대비 +8%p 상승. SNS 마케팅 효과 지속 중.
          </div>
        `)}

        ${section(10, '고객 만족도', 'fas fa-star', 'yellow', `
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            ${allKeys.map(k=>{
              const r = MONTHLY_SAMPLE[k];
              const stars = Math.round(r.satisfaction);
              return `
                <div class="text-center p-5 bg-yellow-50 rounded-xl border border-yellow-100">
                  <div class="font-semibold text-gray-700 mb-2">${r.name}</div>
                  <div class="text-4xl font-bold text-yellow-500 mb-1">${r.satisfaction}</div>
                  <div class="flex justify-center gap-0.5 mb-2">
                    ${[1,2,3,4,5].map(s=>`<i class="fas fa-star text-sm ${s<=stars?'text-yellow-400':'text-gray-200'}"></i>`).join('')}
                  </div>
                  <div class="text-xs text-gray-500">${fmt(r.reviewCnt)}건 리뷰</div>
                </div>
              `;
            }).join('')}
          </div>
          ${tbl(
            ['평가 항목','통영','부여','합천','전체 평균'],
            [
              ['승선 편의성','4.7','4.5','4.6','4.60'],
              ['안내 서비스','4.6','4.3','4.5','4.47'],
              ['선내 청결','4.8','4.6','4.7','4.70'],
              ['예약 편리성','4.5','4.4','4.4','4.43'],
              ['가격 만족도','4.4','4.2','4.3','4.30'],
              [`<strong>종합</strong>`,`<strong>4.6</strong>`,`<strong>4.4</strong>`,`<strong>4.5</strong>`,`<strong class="text-yellow-600">4.50</strong>`],
            ]
          )}
        `)}

        ${section(11, '특이사항 및 안전 기록', 'fas fa-exclamation-triangle', 'red', `
          <div class="space-y-3">
            ${allKeys.map(k=>{
              const r = MONTHLY_SAMPLE[k];
              return `
                <div class="flex gap-3 p-4 rounded-xl border ${r.incidents==='특이사항 없음'?'bg-green-50 border-green-200':'bg-orange-50 border-orange-200'}">
                  <i class="fas ${r.incidents==='특이사항 없음'?'fa-check-circle text-green-500':'fa-exclamation-circle text-orange-500'} mt-0.5 flex-shrink-0"></i>
                  <div>
                    <div class="font-semibold text-sm text-gray-800 mb-0.5">${r.name}</div>
                    <div class="text-sm text-gray-700">${r.incidents}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div class="font-semibold text-sm text-gray-700 mb-2"><i class="fas fa-shield-alt mr-1.5 text-blue-500"></i>안전 점검 현황</div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div class="text-center"><div class="text-lg font-bold text-green-600">9회</div><div class="text-xs text-gray-500">정기 점검</div></div>
              <div class="text-center"><div class="text-lg font-bold text-blue-600">0건</div><div class="text-xs text-gray-500">안전사고</div></div>
              <div class="text-center"><div class="text-lg font-bold text-green-600">100%</div><div class="text-xs text-gray-500">구명장비 점검</div></div>
              <div class="text-center"><div class="text-lg font-bold text-green-600">정상</div><div class="text-xs text-gray-500">소방시설</div></div>
            </div>
          </div>
        `)}

        ${section(12, '종합 의견 및 다음 달 계획', 'fas fa-lightbulb', 'green', `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-check-circle text-green-500 mr-1.5"></i>이달 성과</h4>
              <ul class="space-y-2 text-sm text-gray-700">
                <li class="flex gap-2"><span class="text-green-500 font-bold flex-shrink-0">✓</span> 전월 대비 탑승객 11.2% 증가 달성</li>
                <li class="flex gap-2"><span class="text-green-500 font-bold flex-shrink-0">✓</span> 온라인 예약 비중 70% 목표 달성</li>
                <li class="flex gap-2"><span class="text-green-500 font-bold flex-shrink-0">✓</span> 손목밴드 재발급률 1% 미만 유지</li>
                <li class="flex gap-2"><span class="text-green-500 font-bold flex-shrink-0">✓</span> 고객 만족도 4.5/5.0 이상 유지</li>
                <li class="flex gap-2"><span class="text-green-500 font-bold flex-shrink-0">✓</span> 안전사고 0건 달성</li>
              </ul>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-arrow-right text-blue-500 mr-1.5"></i>다음 달 계획</h4>
              <ul class="space-y-2 text-sm text-gray-700">
                <li class="flex gap-2"><span class="text-blue-500 font-bold flex-shrink-0">→</span> 5월 연휴 특별 운행 편성 (황금연휴 대응)</li>
                <li class="flex gap-2"><span class="text-blue-500 font-bold flex-shrink-0">→</span> 합천 3호 차량 신규 투입 예정</li>
                <li class="flex gap-2"><span class="text-blue-500 font-bold flex-shrink-0">→</span> 기상 예보 자동 취소 시스템 파일럿 운영</li>
                <li class="flex gap-2"><span class="text-blue-500 font-bold flex-shrink-0">→</span> SNS 마케팅 예산 10% 증액 집행</li>
                <li class="flex gap-2"><span class="text-blue-500 font-bold flex-shrink-0">→</span> 탑승신고서 디지털화 전환 완료</li>
              </ul>
            </div>
          </div>
          <div class="mt-5 p-4 bg-green-50 rounded-xl border border-green-200 text-sm">
            <strong class="text-green-800">종합 평가:</strong>
            <span class="text-green-700 ml-1">
              ${reportMonth} 전체 운영은 목표 대비 양호한 성과를 달성했습니다.
              기상 영향에 따른 취소 증가가 아쉬우나, 온라인 채널 성장과 고객 만족도 유지로
              전반적인 서비스 품질은 향상되었습니다. 5월 성수기 대비 차량 추가 투입과
              마케팅 집중 운영을 통해 전월 대비 15% 이상 성장을 목표로 합니다.
            </span>
          </div>
          <div class="mt-4 flex items-center justify-between text-xs text-gray-400 border-t pt-4">
            <span>작성일: ${now.toLocaleDateString('ko-KR')} · 아쿠아모빌리티코리아 운영팀</span>
            <span>본 보고서는 시스템 자동 생성 문서입니다.</span>
          </div>
        `)}

      </div><!-- /#monthly-report-body -->
    `;
  };

  // 월간 보고서 지역 전환
  const switchMonthlyRegion = () => {
    const sel = document.getElementById('mr-region-sel');
    const val = sel ? sel.value : 'all';
    // 현재 탭 재렌더
    destroyAll();
    const el = document.getElementById('stats-content');
    if (el) el.innerHTML = monthlyReportTab();
    switchTab('monthly'); // 탭 활성 상태 유지
  };

  // 월간 보고서 PDF
  const exportMonthlyPDF = () => {
    Utils.toast('PDF 출력 준비 중... 인쇄 다이얼로그가 열립니다.', 'info');
    setTimeout(() => window.print(), 600);
  };

  // 월간 보고서 엑셀 (CSV) — 권한별 지역 + 선택 월 반영
  const exportMonthlyExcel = () => {
    const user = (typeof Store !== 'undefined' && Store.get('adminUser')) || {};
    const userRole    = user.role || 'super';
    const userRegionId= user.regionId || null;

    // 선택된 지역·월 읽기
    const selRegion = document.getElementById('mr-region-sel')?.value || 'all';
    const selMonth  = document.getElementById('mr-month-sel')?.value
      || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
    const [selYear, selMon] = selMonth.split('-');
    const periodLabel = `${selYear}년 ${parseInt(selMon)}월`;

    // 권한별 출력 지역 결정
    const ALL_KEYS = ['tongyeong','buyeo','hapcheon'];
    let keys;
    if (userRole === 'regional' && userRegionId && MONTHLY_SAMPLE[userRegionId]) {
      keys = [userRegionId]; // 지역 관리자는 자기 지역만
    } else if (selRegion !== 'all' && MONTHLY_SAMPLE[selRegion]) {
      keys = [selRegion];
    } else {
      keys = ALL_KEYS;
    }

    const ts = new Date().toLocaleString('ko-KR');
    const regionLabel = keys.length === 1
      ? (MONTHLY_SAMPLE[keys[0]]?.name || keys[0])
      : `전체 ${keys.length}개 지역`;

    // 지역별 열 헤더
    const regionNames = keys.map(k => MONTHLY_SAMPLE[k]?.name || k);
    const total = _calcMonthlyTotal(keys);

    // ── 시트1: 종합 요약 ──────────────────────────────────
    const sheetSummary = [
      ['아쿠아모빌리티코리아 월간 운영보고서'],
      [`보고기간: ${periodLabel}`, `대상지역: ${regionLabel}`, `생성일시: ${ts}`],
      [`생성자: ${user.name||'관리자'} (${user.role||'관리자'})`],
      [],
      // 헤더
      ['구분', ...regionNames, ...(keys.length > 1 ? ['합계'] : [])],
      // 탑승객
      ['탑승객(명)', ...keys.map(k=>MONTHLY_SAMPLE[k].totalPax), ...(keys.length>1?[total.totalPax]:[])],
      ['온라인 탑승(명)', ...keys.map(k=>MONTHLY_SAMPLE[k].onlinePax), ...(keys.length>1?[keys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].onlinePax,0)]:[])],
      ['현장 탑승(명)', ...keys.map(k=>MONTHLY_SAMPLE[k].offlinePax), ...(keys.length>1?[keys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].offlinePax,0)]:[])],
      [],
      // 매출
      ['총 매출(원)', ...keys.map(k=>MONTHLY_SAMPLE[k].totalSales), ...(keys.length>1?[total.totalSales]:[])],
      ['온라인 매출(원)', ...keys.map(k=>MONTHLY_SAMPLE[k].onlineSales), ...(keys.length>1?[keys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].onlineSales,0)]:[])],
      ['현장 매출(원)', ...keys.map(k=>MONTHLY_SAMPLE[k].offlineSales), ...(keys.length>1?[keys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].offlineSales,0)]:[])],
      [],
      // 운영
      ['운항 회수', ...keys.map(k=>MONTHLY_SAMPLE[k].trips), ...(keys.length>1?[total.trips]:[])],
      ['보유 차량', ...keys.map(k=>MONTHLY_SAMPLE[k].vehicles+'대'), ...(keys.length>1?[keys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].vehicles,0)+'대']:[])],
      ['평균 점유율(%)', ...keys.map(k=>MONTHLY_SAMPLE[k].avgOccupancy), ...(keys.length>1?[((keys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].avgOccupancy,0))/keys.length).toFixed(1)]:[])],
      [],
      // 취소
      ['취소 건수', ...keys.map(k=>MONTHLY_SAMPLE[k].cancelCnt), ...(keys.length>1?[total.cancelCnt]:[])],
      ['취소 금액(원)', ...keys.map(k=>MONTHLY_SAMPLE[k].cancelAmt), ...(keys.length>1?[total.cancelAmt]:[])],
      ['환불 금액(원)', ...keys.map(k=>MONTHLY_SAMPLE[k].refundAmt), ...(keys.length>1?[total.refundAmt]:[])],
      ['취소율(%)', ...keys.map(k=>((MONTHLY_SAMPLE[k].cancelCnt/(MONTHLY_SAMPLE[k].totalPax+MONTHLY_SAMPLE[k].cancelCnt))*100).toFixed(1)), ...(keys.length>1?[((total.cancelCnt/(total.totalPax+total.cancelCnt))*100).toFixed(1)]:[])],
      [],
      // 손목밴드
      ['손목밴드 발급', ...keys.map(k=>MONTHLY_SAMPLE[k].wristbandIssued), ...(keys.length>1?[total.wristbandIssued]:[])],
      ['손목밴드 재발급', ...keys.map(k=>MONTHLY_SAMPLE[k].wristbandReissued), ...(keys.length>1?[total.wristbandReissued]:[])],
      ['재발급률(%)', ...keys.map(k=>((MONTHLY_SAMPLE[k].wristbandReissued/MONTHLY_SAMPLE[k].wristbandIssued)*100).toFixed(2)), ...(keys.length>1?[((total.wristbandReissued/total.wristbandIssued)*100).toFixed(2)]:[])],
      [],
      // 고객 만족도
      ['고객 만족도', ...keys.map(k=>MONTHLY_SAMPLE[k].satisfaction), ...(keys.length>1?[(keys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].satisfaction,0)/keys.length).toFixed(1)]:[])],
      ['리뷰 건수', ...keys.map(k=>MONTHLY_SAMPLE[k].reviewCnt), ...(keys.length>1?[keys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].reviewCnt,0)]:[])],
      [],
    ];

    // ── 시트2: 일별 탑승객 추이 ──────────────────────────
    const sheetDaily = [
      [`${periodLabel} 일별 탑승객 현황`],
      [`대상지역: ${regionLabel}`],
      [],
      ['일자', ...regionNames, ...(keys.length > 1 ? ['합계'] : [])],
      ...Array.from({length:30},(_,i)=>[
        `${selYear}-${selMon}-${String(i+1).padStart(2,'0')}`,
        ...keys.map(k => MONTHLY_SAMPLE[k].dailyPax[i] || 0),
        ...(keys.length>1 ? [keys.reduce((s,k)=>s+(MONTHLY_SAMPLE[k].dailyPax[i]||0),0)] : []),
      ]),
      [],
      ['합계', ...keys.map(k=>MONTHLY_SAMPLE[k].totalPax), ...(keys.length>1?[total.totalPax]:[])],
    ];

    // ── 시트3: 요금 구분별 현황 ──────────────────────────
    const fareLabels = MONTHLY_SAMPLE[keys[0]].fareBreakdown.map(f=>f.label);
    const sheetFare = [
      [`${periodLabel} 요금 구분별 탑승 현황`],
      [],
      ['구분', ...fareLabels, '합계'],
      ...keys.map(k=>[
        MONTHLY_SAMPLE[k].name,
        ...MONTHLY_SAMPLE[k].fareBreakdown.map(f=>f.cnt),
        MONTHLY_SAMPLE[k].fareBreakdown.reduce((s,f)=>s+f.cnt,0),
      ]),
      ...(keys.length>1?[[
        '합계',
        ...fareLabels.map((_,fi)=>keys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].fareBreakdown[fi].cnt,0)),
        total.totalPax,
      ]]:[]),
    ];

    // ── CSV 직렬화 (시트 구분선 포함) ───────────────────
    const allRows = [
      ...sheetSummary,
      [],['=== 일별 탑승객 현황 ==='],
      ...sheetDaily,
      [],['=== 요금 구분별 현황 ==='],
      ...sheetFare,
      [],
      [`※ 보고기간: ${periodLabel} / 생성일시: ${ts}`],
    ];

    const filename = `aqua_monthly_${selMonth}_${regionLabel.replace(/\s/g,'')}.csv`;
    Utils.downloadCSV(allRows, filename);
    Utils.toast(`${periodLabel} 월간보고서 엑셀(CSV) 다운로드 완료!`, 'success');
  };

  // ── 보고서 선택 상태 (탭 내 유지) ────────────────────────────
  let _selectedReportType = 'monthly'; // 기본값: 월간 운영보고서

  const selectReportCard = (type) => {
    _selectedReportType = type;
    // 모든 카드 테두리 초기화
    document.querySelectorAll('.rpt-card').forEach(el => {
      el.classList.remove('border-blue-500','bg-blue-50','shadow-md');
      el.classList.add('border-gray-100');
    });
    // 선택된 카드 강조
    const sel = document.getElementById(`rpt-card-${type}`);
    if (sel) {
      sel.classList.add('border-blue-500','bg-blue-50','shadow-md');
      sel.classList.remove('border-gray-100');
    }
    // 하단 선택된 보고서 종류 표시 업데이트
    const labelMap = {
      monthly:'월간 운영보고서', quarterly:'분기별 실적보고서',
      settlement:'정산 확인서', passengers:'승객 현황보고서',
      seo:'SEO 성과보고서', safety:'안전 운행 보고서',
    };
    const badge = document.getElementById('rpt-selected-label');
    if (badge) badge.textContent = labelMap[type] || type;
  };

  // ── 보고서 생성 탭 ─────────────────────────────────────────
  const reportTab = () => {
    const u = Store.get('adminUser') || {};
    const isRegional = u.role === 'regional' && u.regionId;
    const REGION_KO = { tongyeong:'통영', buyeo:'부여', hapcheon:'합천' };
    const allR = (window.REGIONS||[]).filter(r => r.status !== 'hidden');
    const today = new Date().toISOString().slice(0,10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);

    // 포함 지역 UI: regional은 자기 지역 고정, super는 체크박스
    const regionSection = isRegional ? `
      <div class="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <i class="fas fa-lock text-blue-400 text-xs"></i>
        <span class="text-sm font-medium text-blue-700">${REGION_KO[u.regionId]||u.regionId}</span>
        <span class="text-xs text-blue-500">(고정 — 담당 지역만 조회 가능)</span>
        <input type="hidden" id="rpt-region-fixed" value="${u.regionId}">
      </div>
    ` : `
      <div class="flex flex-wrap gap-2" id="rpt-region-checks">
        <label class="flex items-center gap-1.5 cursor-pointer text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50">
          <input type="checkbox" id="rpt-chk-all" checked class="rounded text-blue-600"
            onchange="document.querySelectorAll('.rpt-region-chk').forEach(c=>c.checked=this.checked)">
          <span>전체</span>
        </label>
        ${allR.map(r=>`
          <label class="flex items-center gap-1.5 cursor-pointer text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50">
            <input type="checkbox" class="rpt-region-chk rounded text-blue-600" value="${r.id}" checked
              onchange="(() => {
                const all = document.querySelectorAll('.rpt-region-chk');
                const chkAll = document.getElementById('rpt-chk-all');
                if(chkAll) chkAll.checked = Array.from(all).every(c=>c.checked);
              })()">
            <span>${r.shortName||r.name}</span>
          </label>
        `).join('')}
      </div>
    `;

    const REPORT_CARDS = [
      { icon:'fas fa-calendar-alt', title:'월간 운영보고서',   desc:'매출·승객·운영현황 종합 (정부/투자자용)', color:'blue',   fn:'monthly'    },
      { icon:'fas fa-chart-pie',    title:'분기별 실적보고서', desc:'분기 누적 통계 및 전년 동기 비교',         color:'green',  fn:'quarterly'  },
      { icon:'fas fa-file-invoice-dollar', title:'정산 확인서', desc:'지역별 일일/월간 정산 내역 확인서',       color:'purple', fn:'settlement' },
      { icon:'fas fa-users',        title:'승객 현황보고서',   desc:'승객 통계, 인구통계, 재방문율 분석',       color:'orange', fn:'passengers' },
      { icon:'fas fa-search',       title:'SEO 성과보고서',    desc:'검색순위, 유입 트래픽, 키워드 분석',       color:'cyan',   fn:'seo'        },
      { icon:'fas fa-shield-alt',   title:'안전 운행 보고서',  desc:'운행 기록, 사고 현황, 안전 점검 내역',     color:'red',    fn:'safety'     },
    ];

    return `
    <div class="space-y-6">

      <!-- ① 보고서 종류 선택 카드 -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-xs font-bold text-blue-500 uppercase tracking-widest">STEP 1</span>
          <h2 class="font-semibold text-gray-800">보고서 종류 선택</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          ${REPORT_CARDS.map(r=>`
            <div id="rpt-card-${r.fn}"
              class="rpt-card border-2 ${r.fn === _selectedReportType ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-100 hover:border-'+r.color+'-300'}
                     rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
              onclick="StatsModule.selectReportCard('${r.fn}')">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-${r.color}-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="${r.icon} text-${r.color}-600"></i>
                </div>
                <div class="min-w-0">
                  <h3 class="font-semibold text-gray-800 text-sm leading-tight">${r.title}</h3>
                  <p class="text-xs text-gray-400 mt-0.5 leading-relaxed">${r.desc}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <i class="fas fa-info-circle text-blue-400"></i>
          <span>선택된 보고서: <strong id="rpt-selected-label" class="text-blue-600">
            ${{monthly:'월간 운영보고서',quarterly:'분기별 실적보고서',settlement:'정산 확인서',passengers:'승객 현황보고서',seo:'SEO 성과보고서',safety:'안전 운행 보고서'}[_selectedReportType]||'월간 운영보고서'}
          </strong></span>
        </div>
      </div>

      <!-- ② 보고서 설정 -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-xs font-bold text-blue-500 uppercase tracking-widest">STEP 2</span>
          <h2 class="font-semibold text-gray-800">보고서 설정</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <!-- 왼쪽: 기간·지역 -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                <i class="fas fa-calendar-range mr-1 text-gray-400"></i>보고 기간 <span class="text-red-400">*</span>
              </label>
              <div class="flex items-center gap-2">
                <input type="date" id="rpt-start-date" value="${monthStart}"
                  class="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <span class="text-gray-400 text-sm">~</span>
                <input type="date" id="rpt-end-date" value="${today}"
                  class="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <p class="text-xs text-gray-400 mt-1">탑승일 기준 · 파일명과 헤더에 정확히 반영됩니다.</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                <i class="fas fa-map-marker-alt mr-1 text-gray-400"></i>포함 지역
                ${isRegional ? '<span class="ml-1 text-xs text-blue-500">(권한 고정)</span>' : ''}
              </label>
              ${regionSection}
            </div>
          </div>

          <!-- 오른쪽: 출력형식·옵션 -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                <i class="fas fa-file-export mr-1 text-gray-400"></i>출력 형식 <span class="text-red-400">*</span>
              </label>
              <div class="grid grid-cols-3 gap-2">
                <label class="flex flex-col items-center gap-1.5 cursor-pointer p-3 border-2 border-red-200 rounded-xl hover:bg-red-50 transition-colors has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                  <input type="radio" name="report-format" value="pdf" checked class="sr-only">
                  <i class="fas fa-file-pdf text-red-500 text-xl"></i>
                  <span class="text-xs font-semibold text-gray-700">PDF</span>
                  <span class="text-xs text-gray-400 text-center">인쇄용 보고서</span>
                </label>
                <label class="flex flex-col items-center gap-1.5 cursor-pointer p-3 border-2 border-gray-200 rounded-xl hover:bg-green-50 transition-colors has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                  <input type="radio" name="report-format" value="excel" class="sr-only">
                  <i class="fas fa-file-excel text-green-500 text-xl"></i>
                  <span class="text-xs font-semibold text-gray-700">Excel</span>
                  <span class="text-xs text-gray-400 text-center">다중 시트 .xlsx</span>
                </label>
                <label class="flex flex-col items-center gap-1.5 cursor-pointer p-3 border-2 border-gray-200 rounded-xl hover:bg-blue-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input type="radio" name="report-format" value="csv" class="sr-only">
                  <i class="fas fa-file-csv text-blue-500 text-xl"></i>
                  <span class="text-xs font-semibold text-gray-700">CSV</span>
                  <span class="text-xs text-gray-400 text-center">데이터 분석용</span>
                </label>
              </div>
              <p class="text-xs text-gray-400 mt-1.5">
                PDF: 인쇄 다이얼로그 → 저장 · Excel: .xlsx 다운로드 · CSV: .csv 다운로드
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">기관명 (보고서 표지)</label>
              <input type="text" id="rpt-org-name" value="아쿠아모빌리티코리아"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="report-seal" class="rounded text-blue-600">
              <label for="report-seal" class="text-sm text-gray-600 cursor-pointer">직인 포함 (전자서명 문구 추가)</label>
            </div>
          </div>
        </div>

        <!-- 생성 버튼 -->
        <div class="mt-5 pt-4 border-t flex flex-wrap gap-3 items-center">
          <button id="rpt-generate-btn"
            onclick="StatsModule.generateReportFromSettings(this)"
            class="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors">
            <i class="fas fa-file-alt"></i>
            <span>보고서 생성</span>
          </button>
          <button onclick="StatsModule.scheduleReport()"
            class="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <i class="fas fa-clock"></i> 자동 발송 설정
          </button>
          <div class="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <i class="fas fa-shield-alt text-green-400"></i>
            ${isRegional ? `권한: 지역관리자 (${REGION_KO[u.regionId]||u.regionId} 전용)` : '권한: 슈퍼관리자 (전체 지역)'}
          </div>
        </div>
      </div>

      <!-- ③ 최근 생성 이력 -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="font-semibold text-gray-700 text-sm mb-3">
          <i class="fas fa-history mr-1.5 text-gray-400"></i>최근 다운로드 이력
        </h3>
        <div id="rpt-history-list">
          ${(() => {
            const logs = JSON.parse(sessionStorage.getItem('amk_dl_logs')||'[]');
            if (!logs.length) return '<p class="text-xs text-gray-400 text-center py-4">생성 이력이 없습니다.</p>';
            return logs.slice(0,5).map(l=>`
              <div class="flex items-center justify-between py-2 border-b last:border-0 text-xs">
                <div class="flex items-center gap-2">
                  <i class="fas fa-file-alt text-blue-400"></i>
                  <span class="font-medium text-gray-700">${l.reportLabel||l.reportType}</span>
                  <span class="text-gray-400">${l.regions}</span>
                  <span class="text-gray-400">${l.period}</span>
                </div>
                <div class="flex items-center gap-2 text-gray-400">
                  <span>${l.format||'CSV'}</span>
                  <span>${l.datetime?.slice(0,16)||''}</span>
                </div>
              </div>
            `).join('');
          })()}
        </div>
      </div>

    </div>
    `;
  };

  // ── 탭 전환 ────────────────────────────────────────────────
  let _currentTab = 'sales';
  const switchTab = (tabId) => {
    _currentTab = tabId;
    // 탭 활성화 스타일
    document.querySelectorAll('.stats-tab').forEach(t => {
      t.classList.remove('border-blue-600','text-blue-600');
      t.classList.add('border-transparent','text-gray-500','hover:text-gray-700','hover:border-gray-300');
    });
    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) {
      activeTab.classList.add('border-blue-600','text-blue-600');
      activeTab.classList.remove('border-transparent','text-gray-500');
    }

    const contentMap = {
      sales: salesTab,
      passengers: passengersTab,
      operations: operationsTab,
      marketing: marketingTab,
      wristbands: wristbandsTab,
      monthly: monthlyReportTab,
      report: reportTab,
    };

    destroyAll();
    const el = document.getElementById('stats-content');
    if (el && contentMap[tabId]) el.innerHTML = contentMap[tabId]();
  };

  const refreshCurrent = () => { switchTab(_currentTab); };

  // ── 메인 진입점 ────────────────────────────────────────────
  const page = async () => {
    _currentTab = 'sales';
    const html = renderLayout(salesTab(), '통계/보고서');
    setTimeout(() => {
      switchTab('sales');
    }, 50);
    return html;
  };

  // ── 액션 핸들러 ────────────────────────────────────────────
  const exportPDF = () => {
    Utils.toast('PDF 보고서를 생성 중입니다... (인쇄 다이얼로그가 열립니다)', 'info');
    setTimeout(() => window.print(), 500);
  };

  const exportExcel = () => {
    // CSV 형식으로 다운로드
    const data = [
      ['날짜', '지역', '온라인 매출', '현장 매출', '총 매출', '승객수'],
      ...genDailyData(30, 3500000).map((d, i) => [
        d.date, '전체',
        Math.round(d.value * 0.72), Math.round(d.value * 0.28),
        d.value, randBetween(200, 450),
      ]),
    ];
    Utils.downloadCSV(data, `aqua_stats_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const generateReport = (type, btnEl, settings = {}) => {
    const labels = {
      monthly: '월간 운영보고서', quarterly: '분기별 실적보고서',
      settlement: '정산 확인서', passengers: '승객 현황보고서',
      seo: 'SEO 성과보고서', safety: '안전 운행 보고서', custom: '맞춤 보고서',
    };
    const label = labels[type] || '보고서';

    // 권한 체크
    const user = Store.get('adminUser') || {};
    const role = user.role || '';
    const regionId = user.regionId || null;

    if (role === 'regional' && type === 'settlement' && !regionId) {
      Utils.toast('접근 권한이 없습니다.', 'error');
      return;
    }

    if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>생성 중...'; }
    Utils.toast(`${label} 생성 중...`, 'info');

    setTimeout(() => {
      try {
        const now = new Date();
        const ts = now.toISOString().replace('T', ' ').slice(0, 19);

        // ── 보고기간: settings 우선 → DOM fallback ──────────
        const rptStart = settings?.startDate
          || document.getElementById('rpt-start-date')?.value || '';
        const rptEnd   = settings?.endDate
          || document.getElementById('rpt-end-date')?.value   || '';
        const hasRange = rptStart && rptEnd;
        // 기간이 없으면 현재 월 기준
        const yyyy = hasRange ? rptStart.slice(0,4) : String(now.getFullYear());
        const mm   = hasRange ? rptStart.slice(5,7) : String(now.getMonth()+1).padStart(2,'0');
        const periodLabel = hasRange
          ? `${rptStart} ~ ${rptEnd}`
          : `${yyyy}-${mm}`;
        const filename = `aqua_${type}_report_${hasRange ? `${rptStart}_${rptEnd}` : `${yyyy}_${mm}`}.csv`;

        // ── 권한별 지역 결정 ─────────────────────────────────
        const allRegions = (window.REGIONS || []).filter(r => r.status !== 'hidden');
        const targetRegions = (role === 'regional' && regionId)
          ? allRegions.filter(r => r.id === regionId)
          : allRegions;
        const regionNames = targetRegions.map(r => r.shortName || r.name).join(', ') || '전체';

        // ── 공통 헤더 메타 ───────────────────────────────────
        const headerMeta = [
          ['아쿠아모빌리티코리아 통합 운영 플랫폼'],
          [`보고서 종류: ${label}`],
          [`보고기간: ${periodLabel}`],
          [`생성일시: ${ts}`],
          [`대상 지역: ${regionNames}`],
          [`생성자: ${user.name || '관리자'} (${role})`],
          [],
        ];

        // ── MONTHLY_SAMPLE 키 목록 (권한별) ─────────────────
        const ALL_SAMPLE_KEYS = ['tongyeong','buyeo','hapcheon'];
        const sampleKeys = (role === 'regional' && regionId && MONTHLY_SAMPLE[regionId])
          ? [regionId]
          : ALL_SAMPLE_KEYS;

        // ── 보고서 종류별 데이터 생성 ────────────────────────
        let rows = [];

        if (type === 'monthly' || type === 'custom') {
          const sTotal = _calcMonthlyTotal(sampleKeys);
          rows = [
            ...headerMeta,
            // 종합 요약
            ['=== 종합 요약 ==='],
            ['지역', '탑승객(명)', '총 매출(원)', '온라인 매출', '현장 매출', '운행횟수', '평균요금', '취소율(%)'],
            ...sampleKeys.map(k => {
              const r = MONTHLY_SAMPLE[k];
              const cancelRate = ((r.cancelCnt/(r.totalPax+r.cancelCnt))*100).toFixed(1);
              return [
                r.name, r.totalPax, r.totalSales, r.onlineSales, r.offlineSales,
                r.trips, Math.round(r.totalSales/r.totalPax), cancelRate+'%',
              ];
            }),
            ...(sampleKeys.length > 1 ? [[
              '합계', sTotal.totalPax, sTotal.totalSales,
              sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].onlineSales,0),
              sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].offlineSales,0),
              sTotal.trips, Math.round(sTotal.totalSales/sTotal.totalPax), '-',
            ]] : []),
            [],
            // 취소/환불 현황
            ['=== 취소/환불 현황 ==='],
            ['지역', '취소건수', '취소금액(원)', '환불금액(원)', '취소수수료(원)', '취소율(%)'],
            ...sampleKeys.map(k => {
              const r = MONTHLY_SAMPLE[k];
              return [
                r.name, r.cancelCnt, r.cancelAmt, r.refundAmt,
                r.cancelAmt - r.refundAmt,
                ((r.cancelCnt/(r.totalPax+r.cancelCnt))*100).toFixed(1)+'%',
              ];
            }),
            [],
            // 손목밴드
            ['=== 손목밴드 현황 ==='],
            ['지역', '발급(개)', '재발급(개)', '재발급률(%)'],
            ...sampleKeys.map(k => {
              const r = MONTHLY_SAMPLE[k];
              return [r.name, r.wristbandIssued, r.wristbandReissued,
                ((r.wristbandReissued/r.wristbandIssued)*100).toFixed(2)+'%'];
            }),
            [],
            [`※ 보고기간: ${periodLabel} 기준 데이터`],
          ];
        } else if (type === 'quarterly') {
          const qYear = parseInt(yyyy);
          const qMon  = parseInt(mm);
          const quarter = Math.ceil(qMon/3);
          const prevQ   = quarter > 1 ? quarter-1 : 4;
          const prevQYear = quarter > 1 ? qYear : qYear-1;
          rows = [
            ...headerMeta,
            [`=== ${qYear}년 Q${quarter} 분기 실적 ===`],
            ['분기', '지역', '탑승객(명)', '총 매출(원)', '전분기 대비', '점유율(%)'],
            ...sampleKeys.map(k => {
              const r = MONTHLY_SAMPLE[k];
              const growth = (Math.random()*20-5).toFixed(1);
              const sign = growth>=0?'+':'';
              return [`${qYear}-Q${quarter}`, r.name, r.totalPax*3, r.totalSales*3, `${sign}${growth}%`, r.avgOccupancy+'%'];
            }),
            [],
            [`=== ${prevQYear}년 Q${prevQ} 전분기 참조 ===`],
            ['분기', '지역', '탑승객(명)', '총 매출(원)'],
            ...sampleKeys.map(k => {
              const r = MONTHLY_SAMPLE[k];
              return [`${prevQYear}-Q${prevQ}`, r.name, Math.round(r.totalPax*2.7), Math.round(r.totalSales*2.7)];
            }),
            [],
            [`※ 보고기간: ${periodLabel}`],
          ];
        } else if (type === 'settlement') {
          rows = [
            ...headerMeta,
            ['지역', '일자', '온라인 결제(원)', '현장 결제(원)', 'PG 수수료(원)', '정산금액(원)', '정산상태'],
            ...targetRegions.flatMap(r => {
              const base = r.id==='tongyeong'?580000 : r.id==='buyeo'?480000 : 380000;
              return Array.from({length:7},(_,i) => {
                const d = new Date(rptStart||`${yyyy}-${mm}-01`);
                d.setDate(d.getDate()+i);
                const on = base + Math.floor(Math.random()*200000);
                const off= Math.floor(base*0.3) + Math.floor(Math.random()*80000);
                const fee= Math.round((on+off)*0.035);
                return [r.name, d.toISOString().slice(0,10), on, off, fee, on+off-fee, i<2?'처리중':'완료'];
              });
            }),
            [],
            [`※ PG 수수료 3.5% 기준 / 보고기간: ${periodLabel}`],
          ];
        } else if (type === 'passengers') {
          rows = [
            ...headerMeta,
            ['=== 요금 구분별 탑승 현황 ==='],
            ['지역', '성인', '청소년', '소아', '경로', '단체', '총계'],
            ...sampleKeys.map(k => {
              const r = MONTHLY_SAMPLE[k];
              const fb = r.fareBreakdown;
              return [r.name, ...fb.map(f=>f.cnt), r.totalPax];
            }),
            [],
            ['=== 예약 채널 분석 ==='],
            ['지역', ...MONTHLY_SAMPLE[sampleKeys[0]].channels.map(c=>c.ch)],
            ...sampleKeys.map(k => [MONTHLY_SAMPLE[k].name, ...MONTHLY_SAMPLE[k].channels.map(c=>c.pct+'%')]),
            [],
            ['=== 고객 만족도 ==='],
            ['지역', '만족도(5점)', '리뷰 건수'],
            ...sampleKeys.map(k => [MONTHLY_SAMPLE[k].name, MONTHLY_SAMPLE[k].satisfaction, MONTHLY_SAMPLE[k].reviewCnt]),
            [],
            [`※ 보고기간: ${periodLabel}`],
          ];
        } else if (type === 'seo') {
          rows = [
            ...headerMeta,
            ['키워드', '검색순위', '월간 노출', '클릭수', 'CTR', '전환수', '지역'],
            ...targetRegions.flatMap(r => [
              [`수륙양용버스 ${r.shortName||r.name}`, '3', '12,400', '1,116', '9.0%', '89', r.name],
              [`${r.shortName||r.name} 수상투어`, '5', '8,200', '574', '7.0%', '46', r.name],
            ]),
            ['아쿠아모빌리티', '1', '5,600', '616', '11.0%', '49', '전체'],
            [],
            [`※ 보고기간: ${periodLabel} 기준 샘플 데이터`],
          ];
        } else if (type === 'safety') {
          rows = [
            ...headerMeta,
            ['=== 운행 안전 기록 ==='],
            ['일자', '지역', '운행횟수', '탑승객', '사고건수', '안전점검', '특이사항'],
            ...sampleKeys.map(k => {
              const r = MONTHLY_SAMPLE[k];
              return [periodLabel, r.name, r.trips, r.totalPax, '0', '완료', r.incidents];
            }),
            [],
            ['=== 기상 영향 현황 ==='],
            ['지역', '취소일수', '취소회차', '주요원인'],
            ...sampleKeys.map(k => {
              const r = MONTHLY_SAMPLE[k];
              return [r.name, r.weatherCancelDays, r.weatherCancelTrips, '강풍/강우'];
            }),
            [],
            ['안전 체크리스트', '구명조끼 점검', '선체 이상 없음', '운전원 음주 없음', '기상 확인'],
            ['결과', '양호', '양호', '정상', '운항 가능'],
            [],
            [`※ 보고기간: ${periodLabel}`],
          ];
        } else {
          rows = [
            ...headerMeta,
            ['=== 맞춤 보고서 ==='],
            ['항목', '내용'],
            ['보고기간', periodLabel],
            ['대상 지역', regionNames],
            ['총 탑승객', _calcMonthlyTotal(sampleKeys).totalPax+'명'],
            ['총 매출', '₩'+_calcMonthlyTotal(sampleKeys).totalSales.toLocaleString()],
            ['총 운항', _calcMonthlyTotal(sampleKeys).trips+'회'],
            ['상태', '정상 운영'],
          ];
        }

        // ── 로그 엔트리 준비 ─────────────────────────────────
        const logEntry = {
          adminId: user.id || 'unknown',
          adminName: user.name || '관리자',
          role,
          reportType: type,
          reportLabel: label,
          regions: regionNames,
          period: periodLabel,
          format: 'CSV',
          datetime: ts,
          success: true,
        };

        // ── 금액 원화 형식 변환 헬퍼 ─────────────────────────
        const fmtWon = (v) => typeof v === 'number' ? v.toLocaleString('ko-KR') + '원' : v;
        const fmtCell = (cell) => (typeof cell === 'number' && cell > 9999) ? fmtWon(cell) : cell;
        const fmtRows = (arr) => arr.map(r => Array.isArray(r) ? r.map(fmtCell) : r);

        // ── 출력 형식 결정 ────────────────────────────────────
        const fmt = settings?.format || 'csv';

        if (fmt === 'pdf') {
          // ── PDF: A4 인쇄용 HTML ───────────────────────────
          const orgName = settings?.orgName || '아쿠아모빌리티코리아';
          const hasSeal = settings?.seal || false;
          let tableHtml = '';
          let inTable = false;
          const bodyRows = rows.slice(7);
          for (let i = 0; i < bodyRows.length; i++) {
            const row = bodyRows[i];
            if (!Array.isArray(row) || row.length === 0) {
              if (inTable) { tableHtml += '</tbody></table>'; inTable = false; }
              continue;
            }
            if (row.length === 1) {
              if (inTable) { tableHtml += '</tbody></table>'; inTable = false; }
              const txt = String(row[0]);
              if (txt.startsWith('===')) {
                tableHtml += `<h3 style="margin:20px 0 8px;font-size:13px;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:4px">${txt.replace(/===/g,'').trim()}</h3>`;
              } else {
                tableHtml += `<p style="font-size:11px;color:#666;margin:6px 0">${txt}</p>`;
              }
              continue;
            }
            if (!inTable) {
              tableHtml += '<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:4px"><thead><tr>';
              row.forEach(h => { tableHtml += `<th style="background:#1e3a5f;color:#fff;padding:5px 8px;text-align:left;white-space:nowrap">${fmtCell(h)}</th>`; });
              tableHtml += '</tr></thead><tbody>';
              inTable = true;
            } else {
              const bg = (i % 2 === 0) ? '#f8fafc' : '#fff';
              tableHtml += `<tr style="background:${bg}">`;
              row.forEach(cell => { tableHtml += `<td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">${fmtCell(cell)}</td>`; });
              tableHtml += '</tr>';
            }
          }
          if (inTable) tableHtml += '</tbody></table>';

          const reportHtml = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<title>${label} — ${periodLabel}</title>
<style>
  @page{size:A4;margin:15mm 12mm}
  body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;font-size:12px;color:#1a1a1a;margin:0;padding:0}
  .cover{text-align:center;padding:40px 0 30px;border-bottom:3px solid #1e3a5f;margin-bottom:24px}
  .cover h1{font-size:22px;font-weight:900;color:#1e3a5f;margin:0 0 6px}
  .cover .sub{font-size:13px;color:#555;margin:4px 0}
  .cover .period{font-size:15px;font-weight:700;color:#0369a1;margin:10px 0 0}
  table{page-break-inside:auto}tr{page-break-inside:avoid}
  .seal{border:2px solid #e00;padding:6px 18px;display:inline-block;color:#e00;font-weight:700;transform:rotate(-8deg);margin-top:16px;font-size:13px}
  .fnote{font-size:10px;color:#888;margin-top:30px;padding-top:8px;border-top:1px solid #ddd}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="cover">
  <div style="font-size:11px;color:#888;margin-bottom:8px">AQUA MOBILITY KOREA | 아쿠아모빌리티코리아</div>
  <h1>${label}</h1>
  <div class="sub">기관명: ${orgName}</div>
  <div class="period">보고기간: ${periodLabel}</div>
  <div class="sub" style="margin-top:8px">대상 지역: ${regionNames} &nbsp;|&nbsp; 생성자: ${user.name||'관리자'} (${role})</div>
  <div class="sub">생성일시: ${ts}</div>
  ${hasSeal ? '<div class="seal">전자서명 완료<br>' + orgName + '</div>' : ''}
</div>
${tableHtml}
<div class="fnote">※ 본 보고서는 아쿠아모빌리티코리아 통합 운영 플랫폼에서 자동 생성되었습니다. 생성일시: ${ts}</div>
</body></html>`;
          Utils.printPDF(reportHtml, filename.replace('.csv','.pdf'));
          logEntry.format = 'PDF';
          Utils.toast(`✅ ${label} PDF 인쇄 창이 열렸습니다.`, 'success');

        } else if (fmt === 'excel') {
          // ── Excel: XLSX 다중 시트 ─────────────────────────
          let sheets = [];
          if (type === 'monthly') {
            // 9개 시트 구조 (월간 운영보고서)
            sheets = [
              {
                name: '①표지',
                rows: [
                  ['아쿠아모빌리티코리아 통합 운영 플랫폼'],
                  [label],
                  [''],
                  ['보고기간', periodLabel],
                  ['대상 지역', regionNames],
                  ['기관명', settings?.orgName||'아쿠아모빌리티코리아'],
                  ['생성자', (user.name||'관리자')+' ('+role+')'],
                  ['생성일시', ts],
                ],
              },
              {
                name: '②종합요약',
                rows: [
                  [label+' — 종합 요약', '', '', '', '', '', '', ''],
                  ['보고기간: '+periodLabel, '', '', '', '', '', '', ''],
                  [''],
                  ['지역', '탑승객(명)', '총 매출', '온라인 매출', '현장 매출', '운행횟수', '평균요금', '취소율'],
                  ...sampleKeys.map(k => {
                    const r = MONTHLY_SAMPLE[k];
                    const cRate = ((r.cancelCnt/(r.totalPax+r.cancelCnt))*100).toFixed(1)+'%';
                    return [r.name, r.totalPax, fmtWon(r.totalSales), fmtWon(r.onlineSales),
                            fmtWon(r.offlineSales), r.trips, fmtWon(Math.round(r.totalSales/r.totalPax)), cRate];
                  }),
                  ...(sampleKeys.length > 1 ? [[
                    '합계', _calcMonthlyTotal(sampleKeys).totalPax,
                    fmtWon(_calcMonthlyTotal(sampleKeys).totalSales),
                    fmtWon(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].onlineSales,0)),
                    fmtWon(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].offlineSales,0)),
                    _calcMonthlyTotal(sampleKeys).trips, '-', '-',
                  ]] : []),
                ],
              },
              {
                name: '③일별탑승',
                rows: [
                  ['일별 탑승객 현황 — '+periodLabel],
                  [''],
                  ['날짜', ...sampleKeys.map(k=>MONTHLY_SAMPLE[k].name+'(명)'), '합계(명)'],
                  ...(MONTHLY_SAMPLE[sampleKeys[0]].daily||[]).map((d,i) => {
                    const vals = sampleKeys.map(k => (MONTHLY_SAMPLE[k].daily||[])[i]?.pax || 0);
                    return [d.date, ...vals, vals.reduce((a,b)=>a+b,0)];
                  }),
                ],
              },
              {
                name: '④요금구분',
                rows: [
                  ['요금 구분별 탑승 현황 — '+periodLabel],
                  [''],
                  ['지역', '성인', '청소년', '소아', '경로', '단체', '합계'],
                  ...sampleKeys.map(k => {
                    const r = MONTHLY_SAMPLE[k];
                    return [r.name, ...r.fareBreakdown.map(f=>f.cnt), r.totalPax];
                  }),
                ],
              },
              {
                name: '⑤매출분석',
                rows: [
                  ['매출 분석 — '+periodLabel],
                  [''],
                  ['지역', '온라인 매출', '현장 매출', '총 매출', '목표대비(%)'],
                  ...sampleKeys.map(k => {
                    const r = MONTHLY_SAMPLE[k];
                    return [r.name, fmtWon(r.onlineSales), fmtWon(r.offlineSales),
                            fmtWon(r.totalSales), ((r.totalSales/(r.totalSales*0.9))*100).toFixed(1)+'%'];
                  }),
                ],
              },
              {
                name: '⑥취소환불',
                rows: [
                  ['취소·환불 현황 — '+periodLabel],
                  [''],
                  ['지역', '취소건수', '취소금액', '환불금액', '취소수수료', '취소율'],
                  ...sampleKeys.map(k => {
                    const r = MONTHLY_SAMPLE[k];
                    return [r.name, r.cancelCnt, fmtWon(r.cancelAmt), fmtWon(r.refundAmt),
                            fmtWon(r.cancelAmt-r.refundAmt),
                            ((r.cancelCnt/(r.totalPax+r.cancelCnt))*100).toFixed(1)+'%'];
                  }),
                ],
              },
              {
                name: '⑦손목밴드',
                rows: [
                  ['손목밴드 현황 — '+periodLabel],
                  [''],
                  ['지역', '발급(개)', '재발급(개)', '재발급률'],
                  ...sampleKeys.map(k => {
                    const r = MONTHLY_SAMPLE[k];
                    return [r.name, r.wristbandIssued, r.wristbandReissued,
                            ((r.wristbandReissued/r.wristbandIssued)*100).toFixed(2)+'%'];
                  }),
                ],
              },
              {
                name: '⑧예약채널',
                rows: [
                  ['예약 채널 분석 — '+periodLabel],
                  [''],
                  ['지역', ...MONTHLY_SAMPLE[sampleKeys[0]].channels.map(c=>c.ch)],
                  ...sampleKeys.map(k => [MONTHLY_SAMPLE[k].name, ...MONTHLY_SAMPLE[k].channels.map(c=>c.pct+'%')]),
                ],
              },
              {
                name: '⑨고객만족도',
                rows: [
                  ['고객 만족도 — '+periodLabel],
                  [''],
                  ['지역', '만족도(5점)', '리뷰 건수'],
                  ...sampleKeys.map(k => [MONTHLY_SAMPLE[k].name, MONTHLY_SAMPLE[k].satisfaction, MONTHLY_SAMPLE[k].reviewCnt]),
                  [''],
                  ['※ 보고기간: '+periodLabel+' / 생성일시: '+ts],
                ],
              },
            ];
          } else {
            // 기타 보고서: 2시트 구조
            const fRows = fmtRows(rows);
            sheets = [
              { name: '표지', rows: fRows.slice(0, 7) },
              { name: '보고서 데이터', rows: fRows.slice(7) },
            ];
          }
          Utils.downloadXLSX(sheets, filename.replace('.csv','.xlsx'));
          logEntry.format = 'Excel';
          Utils.toast(`✅ ${label} Excel 다운로드 완료!`, 'success');

        } else {
          // ── CSV (기본) ────────────────────────────────────
          Utils.downloadCSV(fmtRows(rows), filename);
          logEntry.format = 'CSV';
          Utils.toast(`✅ ${label} CSV 다운로드 완료!`, 'success');
        }

        // 다운로드 로그 저장 (sessionStorage)
        const logs = JSON.parse(sessionStorage.getItem('amk_dl_logs') || '[]');
        logs.unshift(logEntry);
        sessionStorage.setItem('amk_dl_logs', JSON.stringify(logs.slice(0, 50)));

      } catch (err) {
        console.error('Report generation error:', err);
        Utils.toast('보고서 생성 중 오류가 발생했습니다.', 'error');
      } finally {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.innerHTML = '<i class="fas fa-file-alt"></i> 보고서 생성';
        }
      }
    }, 800);
  };

  const scheduleReport = () => {
    Utils.toast('자동 보고서 발송 설정 완료 (매월 1일 이메일 발송)', 'success');
  };

  // ── 보고서 설정 탭 하단 "보고서 생성" 버튼 핸들러 ─────────────
  // STEP1 카드 선택값 + STEP2 폼 설정값을 읽어 generateReport() 호출
  const generateReportFromSettings = (btnEl) => {
    const type = _selectedReportType || 'monthly';

    // 출력 형식 (PDF / Excel / CSV)
    const format = document.querySelector('input[name="report-format"]:checked')?.value || 'pdf';

    // 보고 기간
    const startDate = document.getElementById('rpt-start-date')?.value || '';
    const endDate   = document.getElementById('rpt-end-date')?.value   || '';

    // 기관명
    const orgName = document.getElementById('rpt-org-name')?.value || '아쿠아모빌리티코리아';

    // 포함 지역 결정
    const user = Store.get('adminUser') || {};
    const isRegional = user.role === 'regional' && user.regionId;
    let regions;
    if (isRegional) {
      regions = [user.regionId];
    } else {
      const checked = Array.from(document.querySelectorAll('.rpt-region-chk:checked'))
        .map(c => c.value);
      const ALL_SAMPLE_KEYS = ['tongyeong','buyeo','hapcheon'];
      regions = checked.length ? checked.filter(v => ALL_SAMPLE_KEYS.includes(v)) : ALL_SAMPLE_KEYS;
    }

    // 직인 여부
    const seal = document.getElementById('report-seal')?.checked || false;
    generateReport(type, btnEl, { format, startDate, endDate, regions, orgName, seal });
  };

  // ── PDF 보고서 HTML 생성 ────────────────────────────────────────
  // A4 세로, 지자체/투자자 제출용, window.print() 기반
  const _buildPDFReport = (params) => {
    const { type, user, sampleKeys, periodLabel, orgName, startDate, endDate } = params;
    const labelMap = {
      monthly:'월간 운영보고서', quarterly:'분기별 실적보고서',
      settlement:'정산 확인서', passengers:'승객 현황보고서',
      seo:'SEO 성과보고서', safety:'안전 운행 보고서',
    };
    const reportTitle = labelMap[type] || '운영보고서';
    const total = _calcMonthlyTotal(sampleKeys);
    const now   = new Date();
    const dateStr = now.toLocaleDateString('ko-KR');
    const regionLabel = sampleKeys.length === 1
      ? (MONTHLY_SAMPLE[sampleKeys[0]]?.name || sampleKeys[0])
      : `전체 ${sampleKeys.length}개 지역 (${sampleKeys.map(k=>MONTHLY_SAMPLE[k]?.name||k).join('·')})`;

    // 금액 포맷 (지수표기법 방지)
    const fw = (n) => '₩' + Number(n).toLocaleString('ko-KR');
    const fn = (n) => Number(n).toLocaleString('ko-KR');

    // 보고서 종류별 콘텐츠 블록 생성
    const buildBody = () => {
      if (type === 'monthly' || type === 'custom') {
        return `
          <section class="section">
            <h2 class="section-title">1. 총괄 요약</h2>
            <table class="data-table">
              <tr><th>구분</th><th>탑승객(명)</th><th>총 매출</th><th>운항횟수</th><th>취소건수</th></tr>
              ${sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];return`<tr><td>${r.name}</td><td class="num">${fn(r.totalPax)}</td><td class="num">${fw(r.totalSales)}</td><td class="num">${r.trips}회</td><td class="num">${r.cancelCnt}건</td></tr>`;}).join('')}
              ${sampleKeys.length>1?`<tr class="total-row"><td><strong>합계</strong></td><td class="num"><strong>${fn(total.totalPax)}</strong></td><td class="num"><strong>${fw(total.totalSales)}</strong></td><td class="num"><strong>${total.trips}회</strong></td><td class="num"><strong>${total.cancelCnt}건</strong></td></tr>`:''}
            </table>
          </section>
          <section class="section">
            <h2 class="section-title">2. 매출 분석</h2>
            <table class="data-table">
              <tr><th>지역</th><th>온라인 매출</th><th>현장 매출</th><th>합계</th><th>온라인 비중</th></tr>
              ${sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];return`<tr><td>${r.name}</td><td class="num">${fw(r.onlineSales)}</td><td class="num">${fw(r.offlineSales)}</td><td class="num"><strong>${fw(r.totalSales)}</strong></td><td class="num">${r.onlineRatio}%</td></tr>`;}).join('')}
              ${sampleKeys.length>1?`<tr class="total-row"><td><strong>합계</strong></td><td class="num"><strong>${fw(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].onlineSales,0))}</strong></td><td class="num"><strong>${fw(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].offlineSales,0))}</strong></td><td class="num"><strong>${fw(total.totalSales)}</strong></td><td class="num">70%</td></tr>`:''}
            </table>
          </section>
          <section class="section">
            <h2 class="section-title">3. 취소·환불 현황</h2>
            <table class="data-table">
              <tr><th>지역</th><th>취소건수</th><th>취소금액</th><th>환불금액</th><th>취소수수료</th><th>취소율</th></tr>
              ${sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];const fee=r.cancelAmt-r.refundAmt;const rate=((r.cancelCnt/(r.totalPax+r.cancelCnt))*100).toFixed(1);return`<tr><td>${r.name}</td><td class="num">${r.cancelCnt}건</td><td class="num">${fw(r.cancelAmt)}</td><td class="num">${fw(r.refundAmt)}</td><td class="num">${fw(fee)}</td><td class="num">${rate}%</td></tr>`;}).join('')}
            </table>
          </section>
          <section class="section">
            <h2 class="section-title">4. 손목밴드 QR 현황</h2>
            <table class="data-table">
              <tr><th>지역</th><th>발급(개)</th><th>재발급(개)</th><th>재발급률</th></tr>
              ${sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];return`<tr><td>${r.name}</td><td class="num">${fn(r.wristbandIssued)}</td><td class="num">${fn(r.wristbandReissued)}</td><td class="num">${((r.wristbandReissued/r.wristbandIssued)*100).toFixed(2)}%</td></tr>`;}).join('')}
            </table>
          </section>
          <section class="section">
            <h2 class="section-title">5. 특이사항 및 종합 의견</h2>
            ${sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];return`<p><strong>${r.name}:</strong> ${r.remarks}</p>`;}).join('')}
          </section>`;
      } else if (type === 'quarterly') {
        const qYear = parseInt((startDate||'').slice(0,4)||now.getFullYear());
        const qMon  = parseInt((startDate||'').slice(5,7)||now.getMonth()+1);
        const quarter = Math.ceil(qMon/3);
        return `
          <section class="section">
            <h2 class="section-title">1. ${qYear}년 Q${quarter} 분기 실적 요약</h2>
            <table class="data-table">
              <tr><th>지역</th><th>탑승객(명)</th><th>총 매출</th><th>평균 점유율</th></tr>
              ${sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];return`<tr><td>${r.name}</td><td class="num">${fn(r.totalPax*3)}</td><td class="num">${fw(r.totalSales*3)}</td><td class="num">${r.avgOccupancy}%</td></tr>`;}).join('')}
            </table>
          </section>`;
      } else if (type === 'settlement') {
        return `
          <section class="section">
            <h2 class="section-title">1. 정산 내역</h2>
            <table class="data-table">
              <tr><th>지역</th><th>온라인 결제</th><th>현장 결제</th><th>PG 수수료(3.5%)</th><th>정산금액</th></tr>
              ${sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];const pg=Math.round(r.totalSales*0.035);return`<tr><td>${r.name}</td><td class="num">${fw(r.onlineSales)}</td><td class="num">${fw(r.offlineSales)}</td><td class="num">${fw(pg)}</td><td class="num"><strong>${fw(r.totalSales-pg)}</strong></td></tr>`;}).join('')}
            </table>
            <p class="remark">※ PG 수수료 3.5% 기준 / 정산일 기준 영업일 +3일 이내 입금</p>
          </section>`;
      } else if (type === 'passengers') {
        return `
          <section class="section">
            <h2 class="section-title">1. 요금 구분별 탑승 현황</h2>
            <table class="data-table">
              <tr><th>지역</th><th>성인</th><th>청소년</th><th>어린이</th><th>경로</th><th>단체</th><th>합계</th></tr>
              ${sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];const fb=r.fareBreakdown;return`<tr><td>${r.name}</td>${fb.map(f=>`<td class="num">${fn(f.cnt)}</td>`).join('')}<td class="num"><strong>${fn(r.totalPax)}</strong></td></tr>`;}).join('')}
            </table>
          </section>
          <section class="section">
            <h2 class="section-title">2. 고객 만족도</h2>
            <table class="data-table">
              <tr><th>지역</th><th>만족도</th><th>리뷰 건수</th></tr>
              ${sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];return`<tr><td>${r.name}</td><td class="num">${r.satisfaction} / 5.0</td><td class="num">${fn(r.reviewCnt)}건</td></tr>`;}).join('')}
            </table>
          </section>`;
      } else if (type === 'safety') {
        return `
          <section class="section">
            <h2 class="section-title">1. 안전 운행 기록</h2>
            <table class="data-table">
              <tr><th>지역</th><th>운항횟수</th><th>탑승객</th><th>사고건수</th><th>기상취소</th><th>특이사항</th></tr>
              ${sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];return`<tr><td>${r.name}</td><td class="num">${r.trips}회</td><td class="num">${fn(r.totalPax)}명</td><td class="num">0건</td><td class="num">${r.weatherCancelTrips}회</td><td>${r.incidents}</td></tr>`;}).join('')}
            </table>
          </section>
          <section class="section">
            <h2 class="section-title">2. 안전 점검 결과</h2>
            <table class="data-table">
              <tr><th>점검 항목</th><th>결과</th><th>비고</th></tr>
              <tr><td>구명조끼 점검</td><td>✅ 양호</td><td>전 좌석 구비 확인</td></tr>
              <tr><td>선체 이상 유무</td><td>✅ 이상 없음</td><td>정기 점검 완료</td></tr>
              <tr><td>운전원 음주 측정</td><td>✅ 정상</td><td>매일 탑승 전 실시</td></tr>
              <tr><td>소방시설</td><td>✅ 정상</td><td></td></tr>
            </table>
          </section>`;
      } else {
        return `
          <section class="section">
            <h2 class="section-title">운영 요약</h2>
            <table class="data-table">
              <tr><th>항목</th><th>내용</th></tr>
              <tr><td>보고기간</td><td>${periodLabel}</td></tr>
              <tr><td>대상 지역</td><td>${regionLabel}</td></tr>
              <tr><td>총 탑승객</td><td class="num">${fn(total.totalPax)}명</td></tr>
              <tr><td>총 매출</td><td class="num">${fw(total.totalSales)}</td></tr>
              <tr><td>총 운항</td><td class="num">${total.trips}회</td></tr>
            </table>
          </section>`;
      }
    };

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${orgName} ${reportTitle} — ${periodLabel}</title>
<style>
  @page { size: A4 portrait; margin: 20mm 15mm 20mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Malgun Gothic', '맑은 고딕', AppleSDGothicNeo, sans-serif; font-size: 10pt; color: #1a1a2e; line-height: 1.6; background: #fff; }

  /* ── 표지 ── */
  .cover { page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px; }
  .cover-badge { display: inline-block; background: #1a56db; color: #fff; font-size: 9pt; font-weight: 700; letter-spacing: 0.15em; padding: 6px 18px; border-radius: 30px; margin-bottom: 24px; }
  .cover-title { font-size: 26pt; font-weight: 800; color: #1a1a2e; line-height: 1.25; margin-bottom: 16px; }
  .cover-subtitle { font-size: 13pt; color: #374151; margin-bottom: 32px; }
  .cover-divider { width: 60px; height: 4px; background: linear-gradient(90deg, #1a56db, #06b6d4); border-radius: 2px; margin: 0 auto 32px; }
  .cover-meta { font-size: 10pt; color: #6b7280; line-height: 2; }
  .cover-meta strong { color: #374151; }
  .cover-org { margin-top: 60px; font-size: 11pt; font-weight: 700; color: #1a1a2e; border-top: 2px solid #1a56db; padding-top: 16px; }
  .cover-seal { margin-top: 12px; font-size: 9pt; color: #9ca3af; font-style: italic; }

  /* ── 섹션 ── */
  .section { margin-bottom: 24px; page-break-inside: avoid; }
  .section-title { font-size: 12pt; font-weight: 700; color: #1a56db; border-left: 4px solid #1a56db; padding-left: 10px; margin-bottom: 10px; }

  /* ── 테이블 ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 8px; }
  .data-table th { background: #1e3a5f; color: #fff; padding: 7px 10px; text-align: center; font-weight: 600; border: 1px solid #1e3a5f; white-space: nowrap; }
  .data-table td { padding: 6px 10px; border: 1px solid #d1d5db; vertical-align: middle; }
  .data-table tr:nth-child(even) td { background: #f8fafc; }
  .data-table tr.total-row td { background: #eff6ff; font-weight: 700; border-top: 2px solid #1a56db; }
  .data-table td.num { text-align: right; font-variant-numeric: tabular-nums; }

  /* ── 기타 ── */
  .remark { font-size: 8.5pt; color: #6b7280; margin-top: 6px; }
  .page-content { padding: 10px 0; }
  .report-footer { position: fixed; bottom: 10mm; left: 15mm; right: 15mm; font-size: 8pt; color: #9ca3af; display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 4px; }

  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }
</style>
</head>
<body>

<!-- 표지 -->
<div class="cover">
  <div class="cover-badge">OFFICIAL REPORT</div>
  <h1 class="cover-title">${reportTitle}</h1>
  <p class="cover-subtitle">수륙양용투어 통합 운영 실적</p>
  <div class="cover-divider"></div>
  <div class="cover-meta">
    <div><strong>보고 기간</strong>&nbsp;&nbsp;${periodLabel}</div>
    <div><strong>대상 지역</strong>&nbsp;&nbsp;${regionLabel}</div>
    <div><strong>작성 일자</strong>&nbsp;&nbsp;${dateStr}</div>
    <div><strong>작성자</strong>&nbsp;&nbsp;${user.name||'관리자'} (${user.role||'관리자'})</div>
  </div>
  <div class="cover-org">${orgName}</div>
  <div class="cover-seal">본 보고서는 시스템 자동 생성 문서입니다 · Aqua Mobility Korea Integrated Platform</div>
</div>

<!-- 본문 -->
<div class="page-content">
${buildBody()}
</div>

<!-- 하단 -->
<div class="report-footer">
  <span>${orgName} &middot; ${reportTitle}</span>
  <span>보고기간: ${periodLabel} &middot; 생성: ${dateStr}</span>
</div>

<script>
// 인쇄 완료 후 창 닫기 (선택)
window.onafterprint = function() { /* window.close(); */ };
<\/script>
</body>
</html>`;
  };

  // ── XLSX 보고서 9개 시트 생성 ───────────────────────────────────
  // 금액: 숫자 앞에 '₩' 문자열로 변환해 지수표기법 완전 방지
  const _buildXLSXReport = (params) => {
    const { type, user, sampleKeys, periodLabel, startDate, endDate, orgName } = params;
    const labelMap = {
      monthly:'월간 운영보고서', quarterly:'분기별 실적보고서',
      settlement:'정산 확인서', passengers:'승객 현황보고서',
      seo:'SEO 성과보고서', safety:'안전 운행 보고서',
    };
    const reportTitle = labelMap[type] || '운영보고서';
    const now = new Date();
    const ts  = now.toLocaleString('ko-KR');
    const total = _calcMonthlyTotal(sampleKeys);
    const regionLabel = sampleKeys.length === 1
      ? (MONTHLY_SAMPLE[sampleKeys[0]]?.name || sampleKeys[0])
      : `전체 ${sampleKeys.length}개 지역`;
    const regionNames = sampleKeys.map(k => MONTHLY_SAMPLE[k]?.name || k);

    // 금액 포맷: 문자열 변환으로 지수표기법 완전 방지
    const fw = (n) => '₩' + Number(n).toLocaleString('ko-KR');
    const fn = (n) => Number(n).toLocaleString('ko-KR');
    const fp = (n) => parseFloat(n).toFixed(1) + '%';
    const fp2= (n) => parseFloat(n).toFixed(2) + '%';

    // ① 개요 시트
    const sheetOverview = [
      [`${orgName} — ${reportTitle}`],
      [`보고기간: ${periodLabel}`, `대상지역: ${regionLabel}`, `생성일시: ${ts}`],
      [`생성자: ${user.name||'관리자'} (${user.role||'관리자'})`],
      [],
      ['항목', ...regionNames, ...(sampleKeys.length>1?['합계']:[])],
      ['총 탑승객(명)', ...sampleKeys.map(k=>fn(MONTHLY_SAMPLE[k].totalPax)), ...(sampleKeys.length>1?[fn(total.totalPax)]:[])],
      ['총 매출(원)', ...sampleKeys.map(k=>fw(MONTHLY_SAMPLE[k].totalSales)), ...(sampleKeys.length>1?[fw(total.totalSales)]:[])],
      ['운항 회수', ...sampleKeys.map(k=>MONTHLY_SAMPLE[k].trips+'회'), ...(sampleKeys.length>1?[total.trips+'회']:[])],
      ['보유 차량', ...sampleKeys.map(k=>MONTHLY_SAMPLE[k].vehicles+'대'), ...(sampleKeys.length>1?[sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].vehicles,0)+'대']:[])],
      ['평균 점유율', ...sampleKeys.map(k=>fp(MONTHLY_SAMPLE[k].avgOccupancy)), ...(sampleKeys.length>1?[fp(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].avgOccupancy,0)/sampleKeys.length)]:[])],
      ['취소 건수', ...sampleKeys.map(k=>MONTHLY_SAMPLE[k].cancelCnt+'건'), ...(sampleKeys.length>1?[total.cancelCnt+'건']:[])],
      ['취소율', ...sampleKeys.map(k=>fp2((MONTHLY_SAMPLE[k].cancelCnt/(MONTHLY_SAMPLE[k].totalPax+MONTHLY_SAMPLE[k].cancelCnt))*100)), ...(sampleKeys.length>1?[fp2((total.cancelCnt/(total.totalPax+total.cancelCnt))*100)]:[])],
      ['고객 만족도', ...sampleKeys.map(k=>MONTHLY_SAMPLE[k].satisfaction+'/5.0'), ...(sampleKeys.length>1?[(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].satisfaction,0)/sampleKeys.length).toFixed(1)+'/5.0']:[])],
    ];

    // ② 운영요약 시트
    const sheetOpsSum = [
      [`${periodLabel} 운영 요약`],
      [],
      ['지역', '운항회수', '차량수', '평균점유율', '탑승객(명)', '온라인(명)', '현장(명)', '총매출(원)', '일평균매출(원)', '특이사항'],
      ...sampleKeys.map(k=>{
        const r = MONTHLY_SAMPLE[k];
        return [r.name, r.trips+'회', r.vehicles+'대', fp(r.avgOccupancy),
          fn(r.totalPax), fn(r.onlinePax), fn(r.offlinePax),
          fw(r.totalSales), fw(Math.round(r.totalSales/30)), r.incidents];
      }),
      ...(sampleKeys.length>1?[[
        '합계', total.trips+'회', sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].vehicles,0)+'대',
        fp(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].avgOccupancy,0)/sampleKeys.length),
        fn(total.totalPax), fn(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].onlinePax,0)),
        fn(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].offlinePax,0)),
        fw(total.totalSales), fw(Math.round(total.totalSales/30)), '-',
      ]]:[]),
    ];

    // ③ 회차별 운영 시트 — 지역별 회차/탑승률 샘플
    const scheduleRows = [['10:00','12:00','14:00','15:30','17:00']];
    const sheetSchedule = [
      [`${periodLabel} 회차별 운영 현황`],
      [],
      ['회차', ...sampleKeys.map(k=>MONTHLY_SAMPLE[k].name+' 평균탑승률')],
      ...['10:00','12:00','14:00','15:30','17:00'].map(t=>[
        t, ...sampleKeys.map(()=>Math.floor(Math.random()*20+75)+'%'),
      ]),
      [],
      ['* 탑승률 = 실탑승 / 정원(45석) × 100'],
    ];

    // ④ 예약목록 시트 — 일별 집계
    const selYear = (startDate||'').slice(0,4) || String(now.getFullYear());
    const selMon  = (startDate||'').slice(5,7) || String(now.getMonth()+1).padStart(2,'0');
    const sheetReservations = [
      [`${periodLabel} 예약 목록 (일별 집계)`],
      [`대상지역: ${regionLabel}`],
      [],
      ['일자', ...regionNames, ...(sampleKeys.length>1?['합계']:[])],
      ...Array.from({length:30},(_,i)=>[
        `${selYear}-${selMon}-${String(i+1).padStart(2,'0')}`,
        ...sampleKeys.map(k=>fn(MONTHLY_SAMPLE[k].dailyPax[i]||0)),
        ...(sampleKeys.length>1?[fn(sampleKeys.reduce((s,k)=>s+(MONTHLY_SAMPLE[k].dailyPax[i]||0),0))]:[]),
      ]),
      [],
      ['합계', ...sampleKeys.map(k=>fn(MONTHLY_SAMPLE[k].totalPax)), ...(sampleKeys.length>1?[fn(total.totalPax)]:[])],
    ];

    // ⑤ 매출정산 시트
    const sheetSales = [
      [`${periodLabel} 매출 정산 내역`],
      [],
      ['지역', '온라인 매출(원)', '현장 매출(원)', '합계 매출(원)', 'PG수수료(3.5%,원)', '순 정산금액(원)', '온라인 비중'],
      ...sampleKeys.map(k=>{
        const r = MONTHLY_SAMPLE[k];
        const pg = Math.round(r.totalSales*0.035);
        return [r.name, fw(r.onlineSales), fw(r.offlineSales), fw(r.totalSales), fw(pg), fw(r.totalSales-pg), r.onlineRatio+'%'];
      }),
      ...(sampleKeys.length>1?[[
        '합계',
        fw(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].onlineSales,0)),
        fw(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].offlineSales,0)),
        fw(total.totalSales),
        fw(Math.round(total.totalSales*0.035)),
        fw(Math.round(total.totalSales*0.965)),
        '70%',
      ]]:[]),
      [],
      ['※ PG 수수료 3.5% 적용 기준 / 보고기간: '+periodLabel],
    ];

    // ⑥ 취소환불 시트
    const sheetCancel = [
      [`${periodLabel} 취소·환불 현황`],
      [],
      ['지역', '취소건수', '취소금액(원)', '환불금액(원)', '취소수수료(원)', '취소율(%)', '환불율(%)'],
      ...sampleKeys.map(k=>{
        const r = MONTHLY_SAMPLE[k];
        const fee = r.cancelAmt - r.refundAmt;
        const cancelRate = ((r.cancelCnt/(r.totalPax+r.cancelCnt))*100).toFixed(2);
        const refundRate = ((r.refundAmt/r.cancelAmt)*100).toFixed(1);
        return [r.name, r.cancelCnt+'건', fw(r.cancelAmt), fw(r.refundAmt), fw(fee), cancelRate+'%', refundRate+'%'];
      }),
      ...(sampleKeys.length>1?[[
        '합계', total.cancelCnt+'건', fw(total.cancelAmt), fw(total.refundAmt),
        fw(total.cancelAmt-total.refundAmt),
        ((total.cancelCnt/(total.totalPax+total.cancelCnt))*100).toFixed(2)+'%',
        ((total.refundAmt/total.cancelAmt)*100).toFixed(1)+'%',
      ]]:[]),
      [],
      ['취소 정책: 7일 전 전액 / 3~6일 전 80% / 1~2일 전 50% / 당일 불가'],
    ];

    // ⑦ 손목밴드 시트
    const sheetWristband = [
      [`${periodLabel} 손목밴드 QR 현황`],
      [],
      ['지역', '발급(개)', '재발급(개)', '무효화(개)', '재발급률(%)', '정상사용률(%)'],
      ...sampleKeys.map(k=>{
        const r = MONTHLY_SAMPLE[k];
        const reissueRate = ((r.wristbandReissued/r.wristbandIssued)*100).toFixed(2);
        const normalRate  = (100 - parseFloat(reissueRate)).toFixed(1);
        return [r.name, fn(r.wristbandIssued), fn(r.wristbandReissued), fn(r.wristbandInvalid), reissueRate+'%', normalRate+'%'];
      }),
      ...(sampleKeys.length>1?[[
        '합계', fn(total.wristbandIssued), fn(total.wristbandReissued),
        fn(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].wristbandInvalid,0)),
        ((total.wristbandReissued/total.wristbandIssued)*100).toFixed(2)+'%',
        (100-((total.wristbandReissued/total.wristbandIssued)*100)).toFixed(1)+'%',
      ]]:[]),
    ];

    // ⑧ 고객분석 시트
    const fareLabels = MONTHLY_SAMPLE[sampleKeys[0]].fareBreakdown.map(f=>f.label);
    const sheetCustomer = [
      [`${periodLabel} 고객 분석`],
      [],
      ['=== 요금 구분별 탑승 ==='],
      ['구분', ...fareLabels, '합계'],
      ...sampleKeys.map(k=>[
        MONTHLY_SAMPLE[k].name,
        ...MONTHLY_SAMPLE[k].fareBreakdown.map(f=>fn(f.cnt)),
        fn(MONTHLY_SAMPLE[k].totalPax),
      ]),
      ...(sampleKeys.length>1?[[
        '합계',
        ...fareLabels.map((_,fi)=>fn(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].fareBreakdown[fi].cnt,0))),
        fn(total.totalPax),
      ]]:[]),
      [],
      ['=== 예약 채널 분석 ==='],
      ['지역', ...MONTHLY_SAMPLE[sampleKeys[0]].channels.map(c=>c.ch)],
      ...sampleKeys.map(k=>[MONTHLY_SAMPLE[k].name, ...MONTHLY_SAMPLE[k].channels.map(c=>c.pct+'%')]),
      [],
      ['=== 고객 만족도 ==='],
      ['지역', '만족도(5점)', '리뷰 건수'],
      ...sampleKeys.map(k=>[MONTHLY_SAMPLE[k].name, MONTHLY_SAMPLE[k].satisfaction, fn(MONTHLY_SAMPLE[k].reviewCnt)+'건']),
    ];

    // ⑨ 운휴안전 시트
    const sheetSafety = [
      [`${periodLabel} 기상운휴·안전 현황`],
      [],
      ['지역', '기상취소일수', '기상취소회차', '취소탑승객(추정)', '매출손실(추정,원)', '주요원인', '특이사항'],
      ['통영', '3일', '18회', '약 1,800명', fw(18*50*35000), '강풍(2회),안개(1회)', MONTHLY_SAMPLE.tongyeong.incidents],
      ['부여', '5일', '25회', '약 2,500명', fw(25*50*35000), '강우(3회),강풍(2회)', MONTHLY_SAMPLE.buyeo.incidents],
      ['합천', '4일', '16회', '약 1,280명', fw(16*50*35000), '강풍(3회),수위(1회)', MONTHLY_SAMPLE.hapcheon.incidents],
      ...(sampleKeys.length>1?[['합계', '12일', total.weatherCancelTrips+'회', '약 5,580명', fw(total.weatherCancelTrips*50*35000), '강풍 최다', '-']]:[]),
      [],
      ['=== 안전 점검 결과 ==='],
      ['점검 항목', '결과', '비고'],
      ['구명조끼 점검',    '양호', '전 좌석 구비 확인'],
      ['선체 이상 유무',   '이상 없음', '정기 점검 완료'],
      ['운전원 음주 측정', '정상', '매일 탑승 전 실시'],
      ['소방시설',         '정상', ''],
      ['안전사고',         '0건', '전 지역 무사고'],
      [],
      [`※ 보고기간: ${periodLabel} / 생성일시: ${ts}`],
    ];

    return [
      { name: '①개요',       rows: sheetOverview },
      { name: '②운영요약',   rows: sheetOpsSum },
      { name: '③회차별운영', rows: sheetSchedule },
      { name: '④예약목록',   rows: sheetReservations },
      { name: '⑤매출정산',   rows: sheetSales },
      { name: '⑥취소환불',   rows: sheetCancel },
      { name: '⑦손목밴드',   rows: sheetWristband },
      { name: '⑧고객분석',   rows: sheetCustomer },
      { name: '⑨운휴안전',   rows: sheetSafety },
    ];
  };

  // ── CSV 보고서 생성 ─────────────────────────────────────────────
  const _buildCSVReport = (params) => {
    const { type, user, sampleKeys, periodLabel, startDate, endDate, orgName } = params;
    const labelMap = {
      monthly:'월간 운영보고서', quarterly:'분기별 실적보고서',
      settlement:'정산 확인서', passengers:'승객 현황보고서',
      seo:'SEO 성과보고서', safety:'안전 운행 보고서',
    };
    const reportTitle = labelMap[type] || '운영보고서';
    const now = new Date();
    const ts  = now.toLocaleString('ko-KR');
    const total = _calcMonthlyTotal(sampleKeys);
    const regionLabel = sampleKeys.length === 1
      ? (MONTHLY_SAMPLE[sampleKeys[0]]?.name || sampleKeys[0])
      : `전체 ${sampleKeys.length}개 지역`;
    const regionNames = sampleKeys.map(k => MONTHLY_SAMPLE[k]?.name || k);

    // 금액: 문자열 변환 (지수표기법 방지)
    const fw = (n) => '₩' + Number(n).toLocaleString('ko-KR');
    const fn = (n) => Number(n).toLocaleString('ko-KR');
    const fp = (n, d=1) => parseFloat(n).toFixed(d) + '%';

    const selYear = (startDate||'').slice(0,4) || String(now.getFullYear());
    const selMon  = (startDate||'').slice(5,7) || String(now.getMonth()+1).padStart(2,'0');

    const headerMeta = [
      [`${orgName} — ${reportTitle}`],
      [`보고기간: ${periodLabel}`, `대상지역: ${regionLabel}`, `생성일시: ${ts}`],
      [`생성자: ${user.name||'관리자'} (${user.role||'관리자'})`],
      [],
    ];

    let rows = [...headerMeta];

    if (type === 'monthly' || type === 'custom') {
      const total = _calcMonthlyTotal(sampleKeys);
      rows = rows.concat([
        ['=== 종합 요약 ==='],
        ['지역', '탑승객(명)', '총 매출(원)', '온라인 매출', '현장 매출', '운항횟수', '평균요금', '취소율'],
        ...sampleKeys.map(k=>{
          const r=MONTHLY_SAMPLE[k];
          return [r.name, fn(r.totalPax), fw(r.totalSales), fw(r.onlineSales), fw(r.offlineSales),
            r.trips+'회', fw(Math.round(r.totalSales/r.totalPax)), fp((r.cancelCnt/(r.totalPax+r.cancelCnt))*100,1)];
        }),
        ...(sampleKeys.length>1?[['합계', fn(total.totalPax), fw(total.totalSales),
          fw(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].onlineSales,0)),
          fw(sampleKeys.reduce((s,k)=>s+MONTHLY_SAMPLE[k].offlineSales,0)),
          total.trips+'회', fw(Math.round(total.totalSales/total.totalPax)), '-']]:[]),
        [],
        ['=== 일별 탑승객 ==='],
        ['일자', ...regionNames, ...(sampleKeys.length>1?['합계']:[])],
        ...Array.from({length:30},(_,i)=>[
          `${selYear}-${selMon}-${String(i+1).padStart(2,'0')}`,
          ...sampleKeys.map(k=>fn(MONTHLY_SAMPLE[k].dailyPax[i]||0)),
          ...(sampleKeys.length>1?[fn(sampleKeys.reduce((s,k)=>s+(MONTHLY_SAMPLE[k].dailyPax[i]||0),0))]:[]),
        ]),
        [],
        ['=== 취소·환불 현황 ==='],
        ['지역', '취소건수', '취소금액(원)', '환불금액(원)', '취소수수료(원)', '취소율'],
        ...sampleKeys.map(k=>{
          const r=MONTHLY_SAMPLE[k]; const fee=r.cancelAmt-r.refundAmt;
          return [r.name, r.cancelCnt+'건', fw(r.cancelAmt), fw(r.refundAmt), fw(fee), fp((r.cancelCnt/(r.totalPax+r.cancelCnt))*100,2)];
        }),
        [],
        ['=== 손목밴드 현황 ==='],
        ['지역', '발급(개)', '재발급(개)', '재발급률'],
        ...sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];return [r.name, fn(r.wristbandIssued), fn(r.wristbandReissued), fp((r.wristbandReissued/r.wristbandIssued)*100,2)];}),
        [],
        [`※ 보고기간: ${periodLabel}`],
      ]);
    } else if (type === 'quarterly') {
      const qYear = parseInt(selYear); const qMon = parseInt(selMon);
      const quarter = Math.ceil(qMon/3);
      rows = rows.concat([
        [`=== ${qYear}년 Q${quarter} 분기 실적 ===`],
        ['지역', '탑승객(명)', '총 매출(원)', '점유율'],
        ...sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];return [r.name, fn(r.totalPax*3), fw(r.totalSales*3), fp(r.avgOccupancy)];}),
        [],
        [`※ 보고기간: ${periodLabel}`],
      ]);
    } else if (type === 'settlement') {
      rows = rows.concat([
        ['지역', '온라인 결제(원)', '현장 결제(원)', 'PG 수수료(원)', '정산금액(원)', '정산상태'],
        ...sampleKeys.map(k=>{
          const r=MONTHLY_SAMPLE[k]; const pg=Math.round(r.totalSales*0.035);
          return [r.name, fw(r.onlineSales), fw(r.offlineSales), fw(pg), fw(r.totalSales-pg), '완료'];
        }),
        [],
        [`※ PG 수수료 3.5% 기준 / 보고기간: ${periodLabel}`],
      ]);
    } else if (type === 'passengers') {
      const fareLabels = MONTHLY_SAMPLE[sampleKeys[0]].fareBreakdown.map(f=>f.label);
      rows = rows.concat([
        ['=== 요금 구분별 탑승 ==='],
        ['지역', ...fareLabels, '합계'],
        ...sampleKeys.map(k=>[MONTHLY_SAMPLE[k].name, ...MONTHLY_SAMPLE[k].fareBreakdown.map(f=>fn(f.cnt)), fn(MONTHLY_SAMPLE[k].totalPax)]),
        [],
        ['=== 고객 만족도 ==='],
        ['지역', '만족도(5점)', '리뷰 건수'],
        ...sampleKeys.map(k=>[MONTHLY_SAMPLE[k].name, MONTHLY_SAMPLE[k].satisfaction, fn(MONTHLY_SAMPLE[k].reviewCnt)+'건']),
        [],
        [`※ 보고기간: ${periodLabel}`],
      ]);
    } else if (type === 'seo') {
      rows = rows.concat([
        ['키워드', '검색순위', '월간 노출', '클릭수', 'CTR', '전환수', '지역'],
        ...sampleKeys.flatMap(k=>[
          [`수륙양용버스 ${MONTHLY_SAMPLE[k].name}`, '3', '12,400', '1,116', '9.0%', '89', MONTHLY_SAMPLE[k].name],
          [`${MONTHLY_SAMPLE[k].name} 수상투어`, '5', '8,200', '574', '7.0%', '46', MONTHLY_SAMPLE[k].name],
        ]),
        [`※ 보고기간: ${periodLabel}`],
      ]);
    } else if (type === 'safety') {
      rows = rows.concat([
        ['=== 운행 안전 기록 ==='],
        ['지역', '운항횟수', '탑승객(명)', '사고건수', '기상취소', '특이사항'],
        ...sampleKeys.map(k=>{const r=MONTHLY_SAMPLE[k];return [r.name, r.trips+'회', fn(r.totalPax)+'명', '0건', r.weatherCancelTrips+'회', r.incidents];}),
        [],
        ['안전점검항목', '구명조끼', '선체', '음주측정', '소방시설'],
        ['결과', '양호', '이상없음', '정상', '정상'],
        [],
        [`※ 보고기간: ${periodLabel}`],
      ]);
    } else {
      rows = rows.concat([
        ['항목', '내용'],
        ['보고기간', periodLabel],
        ['대상 지역', regionLabel],
        ['총 탑승객', fn(total.totalPax)+'명'],
        ['총 매출', fw(total.totalSales)],
        ['총 운항', total.trips+'회'],
      ]);
    }

    return rows;
  };
  return {
    page, switchTab, refreshCurrent,
    exportPDF, exportExcel,
    generateReport, generateReportFromSettings, selectReportCard,
    scheduleReport,
    switchMonthlyRegion, exportMonthlyPDF, exportMonthlyExcel,
  };
})();

window.StatsModule = StatsModule;
