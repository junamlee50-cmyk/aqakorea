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
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}},y:{ticks:{callback:v=>`${v}%`}}} },
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
    const month = now.getMonth() + 1; // 현재월 (표시용)
    const reportMonth = `${year}년 ${month}월`;
    const allKeys = ['tongyeong','buyeo','hapcheon'];
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
            <select id="mr-region-sel" onchange="StatsModule.switchMonthlyRegion()" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="all">전체 지역 종합</option>
              <option value="tongyeong">통영</option>
              <option value="buyeo">부여</option>
              <option value="hapcheon">합천</option>
            </select>
            <select id="mr-month-sel" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="2025-04" selected>2025년 4월</option>
              <option value="2025-03">2025년 3월</option>
              <option value="2025-02">2025년 2월</option>
              <option value="2025-01">2025년 1월</option>
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

      <!-- 12개 섹션 -->
      <div class="space-y-4" id="monthly-report-body">

        ${section(1, '총괄 요약 (Executive Summary)', 'fas fa-clipboard-list', 'blue', `
          <div class="flex items-start gap-3 mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <i class="fas fa-info-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
            <p class="text-sm text-blue-800">
              <strong>${reportMonth}</strong> 전체 3개 지역(통영·부여·합천) 합산 운영 실적입니다.
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

  // 월간 보고서 엑셀 (CSV)
  const exportMonthlyExcel = () => {
    const rows = [
      ['구분','통영','부여','합천','합계'],
      ['탑승객(명)',
        MONTHLY_SAMPLE.tongyeong.totalPax,
        MONTHLY_SAMPLE.buyeo.totalPax,
        MONTHLY_SAMPLE.hapcheon.totalPax,
        MONTHLY_SAMPLE.tongyeong.totalPax+MONTHLY_SAMPLE.buyeo.totalPax+MONTHLY_SAMPLE.hapcheon.totalPax],
      ['총 매출(원)',
        MONTHLY_SAMPLE.tongyeong.totalSales,
        MONTHLY_SAMPLE.buyeo.totalSales,
        MONTHLY_SAMPLE.hapcheon.totalSales,
        MONTHLY_SAMPLE.tongyeong.totalSales+MONTHLY_SAMPLE.buyeo.totalSales+MONTHLY_SAMPLE.hapcheon.totalSales],
      ['운항회수',
        MONTHLY_SAMPLE.tongyeong.trips,
        MONTHLY_SAMPLE.buyeo.trips,
        MONTHLY_SAMPLE.hapcheon.trips,
        MONTHLY_SAMPLE.tongyeong.trips+MONTHLY_SAMPLE.buyeo.trips+MONTHLY_SAMPLE.hapcheon.trips],
      ['취소건수',
        MONTHLY_SAMPLE.tongyeong.cancelCnt,
        MONTHLY_SAMPLE.buyeo.cancelCnt,
        MONTHLY_SAMPLE.hapcheon.cancelCnt,
        MONTHLY_SAMPLE.tongyeong.cancelCnt+MONTHLY_SAMPLE.buyeo.cancelCnt+MONTHLY_SAMPLE.hapcheon.cancelCnt],
      ['손목밴드 발급',
        MONTHLY_SAMPLE.tongyeong.wristbandIssued,
        MONTHLY_SAMPLE.buyeo.wristbandIssued,
        MONTHLY_SAMPLE.hapcheon.wristbandIssued,
        MONTHLY_SAMPLE.tongyeong.wristbandIssued+MONTHLY_SAMPLE.buyeo.wristbandIssued+MONTHLY_SAMPLE.hapcheon.wristbandIssued],
      ['고객 만족도',
        MONTHLY_SAMPLE.tongyeong.satisfaction,
        MONTHLY_SAMPLE.buyeo.satisfaction,
        MONTHLY_SAMPLE.hapcheon.satisfaction,
        ((MONTHLY_SAMPLE.tongyeong.satisfaction+MONTHLY_SAMPLE.buyeo.satisfaction+MONTHLY_SAMPLE.hapcheon.satisfaction)/3).toFixed(1)],
      [],
      ['※ 본 데이터는 2025년 4월 운영 기준 샘플 데이터입니다.'],
    ];
    Utils.downloadCSV(rows, `aqua_monthly_report_2025-04.csv`);
    Utils.toast('엑셀(CSV) 다운로드 완료!', 'success');
  };

  // ── 보고서 생성 탭 ─────────────────────────────────────────
  const reportTab = () => `
    <div class="space-y-6">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="font-semibold text-gray-800 mb-4">보고서 생성</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${[
            { icon:'fas fa-calendar-alt', title:'월간 운영보고서', desc:'매출, 승객, 운영현황 종합 (정부/투자자용)', color:'blue', fn:'monthly' },
            { icon:'fas fa-chart-pie', title:'분기별 실적보고서', desc:'분기 누적 통계 및 전년 동기 비교', color:'green', fn:'quarterly' },
            { icon:'fas fa-file-invoice-dollar', title:'정산 확인서', desc:'지역별 일일/월간 정산 내역 확인서', color:'purple', fn:'settlement' },
            { icon:'fas fa-users', title:'승객 현황보고서', desc:'승객 통계, 인구통계, 재방문율 분석', color:'orange', fn:'passengers' },
            { icon:'fas fa-search', title:'SEO 성과보고서', desc:'검색순위, 유입 트래픽, 키워드 분석', color:'cyan', fn:'seo' },
            { icon:'fas fa-hand-paper', title:'안전 운행 보고서', desc:'운행 기록, 사고 현황, 안전 점검 내역', color:'red', fn:'safety' },
          ].map(r=>`
            <div class="border-2 border-gray-100 hover:border-${r.color}-300 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md group"
              onclick="StatsModule.generateReport('${r.fn}', this.querySelector('[data-gen-btn]'))" >
              <div class="w-12 h-12 bg-${r.color}-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-${r.color}-200 transition-colors">
                <i class="${r.icon} text-${r.color}-600 text-lg"></i>
              </div>
              <h3 class="font-semibold text-gray-800 mb-1">${r.title}</h3>
              <p class="text-xs text-gray-500">${r.desc}</p>
              <div class="mt-3 flex items-center gap-2 text-xs text-${r.color}-600 font-medium" data-gen-btn>
                <i class="fas fa-download"></i> 보고서 생성
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 보고서 설정 -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="font-semibold text-gray-800 mb-4">보고서 설정</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">보고 기간</label>
              <div class="grid grid-cols-2 gap-2">
                <input type="date" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <input type="date" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">포함 지역</label>
              <div class="flex flex-wrap gap-2">
                <label class="flex items-center gap-1 cursor-pointer text-sm">
                  <input type="checkbox" checked class="rounded text-blue-600"> 전체
                </label>
                ${(() => {
                  const u = Store.get('adminUser') || {};
                  const allR = (window.REGIONS||[]).filter(r => r.status !== 'hidden');
                  const visibleR = (u.role === 'regional' && u.regionId)
                    ? allR.filter(r => r.id === u.regionId)
                    : allR;
                  return visibleR.map(r => `
                    <label class="flex items-center gap-1 cursor-pointer text-sm">
                      <input type="checkbox" checked class="rounded text-blue-600"> ${r.shortName||r.name}
                    </label>
                  `).join('');
                })()}
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">출력 형식</label>
              <div class="flex gap-3">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="report-format" value="pdf" checked class="text-blue-600"> <span class="text-sm">PDF</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="report-format" value="excel" class="text-blue-600"> <span class="text-sm">Excel</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="report-format" value="csv" class="text-blue-600"> <span class="text-sm">CSV</span>
                </label>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">로고 및 기관명</label>
              <input type="text" placeholder="아쿠아모빌리티코리아" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="report-seal" class="rounded text-blue-600">
              <label for="report-seal" class="text-sm text-gray-700 cursor-pointer">직인 포함 (전자서명)</label>
            </div>
          </div>
        </div>
        <div class="mt-4 flex gap-3">
          <button onclick="StatsModule.generateReport('custom', this)" class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <i class="fas fa-file-alt"></i> 보고서 생성
          </button>
          <button onclick="StatsModule.scheduleReport()" class="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <i class="fas fa-clock"></i> 자동 발송 설정
          </button>
        </div>
      </div>
    </div>
  `;

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

  const generateReport = (type, btnEl) => {
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

    // 지역별 관리자는 자기 지역 보고서만 생성 가능
    if (role === 'regional' && type === 'settlement' && !regionId) {
      Utils.toast('접근 권한이 없습니다.', 'error');
      return;
    }

    // 버튼 비활성화 (중복 클릭 방지)
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = '생성 중...'; }
    Utils.toast(`${label} 생성 중...`, 'info');

    setTimeout(() => {
      try {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const ts = now.toISOString().replace('T', ' ').slice(0, 19);
        const filename = `aqua_${type}_report_${yyyy}_${mm}.csv`;

        // 지역 데이터 결정 (지역 관리자는 자기 지역만)
        const allRegions = (window.REGIONS || []).filter(r => r.status !== 'hidden');
        const targetRegions = (role === 'regional' && regionId)
          ? allRegions.filter(r => r.id === regionId)
          : allRegions;
        const regionNames = targetRegions.map(r => r.shortName || r.name).join(', ') || '전체';

        // 보고서 종류별 CSV 데이터 생성
        let rows = [];
        const headerMeta = [
          ['아쿠아모빌리티코리아 통합 운영 플랫폼'],
          [`보고서 종류: ${label}`],
          [`생성일시: ${ts}`],
          [`대상 지역: ${regionNames}`],
          [`생성자: ${user.name || '관리자'} (${role})`],
          [],
        ];

        if (type === 'monthly' || type === 'custom') {
          rows = [
            ...headerMeta,
            ['지역', '기간', '총 매출', '온라인 매출', '현장 매출', '탑승객(명)', '운행횟수', '평균요금'],
            ...targetRegions.map(r => [
              r.name, `${yyyy}-${mm}`,
              r.id === 'buyeo' ? '24,750,000' : r.id === 'tongyeong' ? '31,200,000' : '18,900,000',
              r.id === 'buyeo' ? '17,820,000' : r.id === 'tongyeong' ? '22,464,000' : '13,608,000',
              r.id === 'buyeo' ? '6,930,000'  : r.id === 'tongyeong' ? '8,736,000'  : '5,292,000',
              r.id === 'buyeo' ? '990'         : r.id === 'tongyeong' ? '1,248'       : '756',
              r.id === 'buyeo' ? '124'         : r.id === 'tongyeong' ? '156'         : '94',
              '25,000',
            ]),
            [],
            ['※ 본 데이터는 샘플입니다. 실 운영 데이터는 정산 시스템을 통해 확인하세요.'],
          ];
        } else if (type === 'quarterly') {
          rows = [
            ...headerMeta,
            ['분기', '지역', '매출', '탑승객', '전분기 대비'],
            ['2026-Q1', '부여',   '72,400,000', '2,896', '+12.3%'],
            ['2026-Q1', '통영',   '91,200,000', '3,648', '+8.7%'],
            ['2026-Q1', '합천',   '55,800,000', '2,232', '+15.2%'],
            [],
            ['※ 샘플 데이터'],
          ];
        } else if (type === 'settlement') {
          rows = [
            ...headerMeta,
            ['지역', '일자', '온라인 결제', '현장 결제', 'PG 수수료', '정산금액', '정산상태'],
            ...targetRegions.flatMap(r => [
              [r.name, `${yyyy}-${mm}-01`, '580,000', '120,000', '20,300', '679,700', '완료'],
              [r.name, `${yyyy}-${mm}-02`, '620,000', '95,000',  '21,525', '693,475', '완료'],
              [r.name, `${yyyy}-${mm}-03`, '750,000', '200,000', '28,750', '921,250', '처리중'],
            ]),
            [],
            ['※ PG 수수료 3.5% 기준 샘플 데이터'],
          ];
        } else if (type === 'passengers') {
          rows = [
            ...headerMeta,
            ['구분', '성인', '청소년', '소아', '경로', '장애인', '총계'],
            ...targetRegions.map(r => [
              r.name,
              r.id === 'buyeo' ? '720' : '940',
              r.id === 'buyeo' ? '115' : '150',
              r.id === 'buyeo' ? '88'  : '110',
              r.id === 'buyeo' ? '45'  : '30',
              r.id === 'buyeo' ? '22'  : '18',
              r.id === 'buyeo' ? '990' : '1,248',
            ]),
            [],
            ['주요 방문 경로', '네이버', '카카오', '인스타', '블로그', '여행사'],
            ['비율(%)',       '32',     '21',     '18',    '15',    '14'],
          ];
        } else if (type === 'seo') {
          rows = [
            ...headerMeta,
            ['키워드', '검색순위', '월간 노출', '클릭수', 'CTR', '전환수'],
            ['수륙양용버스 부여',   '3',  '12,400', '1,116', '9.0%', '89'],
            ['부여 수륙양용투어',   '5',  '8,200',  '574',   '7.0%', '46'],
            ['아쿠아모빌리티',      '1',  '5,600',  '616',   '11.0%','49'],
            ['부여관광',           '12', '34,000', '1,020', '3.0%', '31'],
            [],
            ['※ 샘플 SEO 데이터'],
          ];
        } else if (type === 'safety') {
          rows = [
            ...headerMeta,
            ['일자', '지역', '운행횟수', '탑승객', '사고건수', '안전점검', '비고'],
            ...targetRegions.map(r => [
              `${yyyy}-${mm}`, r.name,
              r.id === 'buyeo' ? '124' : '94',
              r.id === 'buyeo' ? '990' : '756',
              '0', '완료', '정상 운행',
            ]),
            [],
            ['안전 체크리스트', '구명조끼 점검', '선체 이상 없음', '운전원 음주 없음', '기상 확인'],
            ['결과',           '양호',          '양호',           '정상',             '운항 가능'],
          ];
        } else {
          rows = [
            ...headerMeta,
            ['항목', '내용'],
            ['기간', `${yyyy}-${mm}`],
            ['지역', regionNames],
            ['상태', '정상'],
          ];
        }

        // CSV 다운로드
        Utils.downloadCSV(rows, filename);

        // 다운로드 로그 저장 (sessionStorage)
        const logs = JSON.parse(sessionStorage.getItem('amk_dl_logs') || '[]');
        logs.unshift({
          adminId: user.id || 'unknown',
          adminName: user.name || '관리자',
          role,
          reportType: type,
          reportLabel: label,
          regions: regionNames,
          period: `${yyyy}-${mm}`,
          format: 'CSV',
          datetime: ts,
          success: true,
        });
        sessionStorage.setItem('amk_dl_logs', JSON.stringify(logs.slice(0, 50))); // 최대 50건

        Utils.toast(`✅ ${label} 다운로드 완료!`, 'success');
      } catch (err) {
        console.error('Report generation error:', err);
        Utils.toast('보고서 생성 중 오류가 발생했습니다.', 'error');
      } finally {
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = '보고서 생성'; }
      }
    }, 800);
  };

  const scheduleReport = () => {
    Utils.toast('자동 보고서 발송 설정 완료 (매월 1일 이메일 발송)', 'success');
  };

  return {
    page, switchTab, refreshCurrent,
    exportPDF, exportExcel, generateReport, scheduleReport,
    switchMonthlyRegion, exportMonthlyPDF, exportMonthlyExcel,
  };
})();

window.StatsModule = StatsModule;
