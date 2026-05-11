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
              { id: 'sales',       label: '매출 통계',   icon: 'fas fa-won-sign' },
              { id: 'passengers',  label: '승객 통계',   icon: 'fas fa-users' },
              { id: 'operations',  label: '운영 통계',   icon: 'fas fa-bus' },
              { id: 'marketing',   label: '마케팅 분석', icon: 'fas fa-bullhorn' },
              { id: 'wristbands',  label: '손목밴드',    icon: 'fas fa-qrcode' },
              { id: 'report',      label: '보고서 생성', icon: 'fas fa-file-alt' },
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
              onclick="StatsModule.generateReport('${r.fn}')">
              <div class="w-12 h-12 bg-${r.color}-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-${r.color}-200 transition-colors">
                <i class="${r.icon} text-${r.color}-600 text-lg"></i>
              </div>
              <h3 class="font-semibold text-gray-800 mb-1">${r.title}</h3>
              <p class="text-xs text-gray-500">${r.desc}</p>
              <div class="mt-3 flex items-center gap-2 text-xs text-${r.color}-600 font-medium">
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
                ${(window.REGIONS||[]).filter(r=>r.status==='active').map(r=>`
                  <label class="flex items-center gap-1 cursor-pointer text-sm">
                    <input type="checkbox" checked class="rounded text-blue-600"> ${r.shortName||r.name}
                  </label>
                `).join('')}
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
          <button onclick="StatsModule.generateReport('custom')" class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
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

  const generateReport = (type) => {
    const labels = {
      monthly: '월간 운영보고서', quarterly: '분기별 실적보고서',
      settlement: '정산 확인서', passengers: '승객 현황보고서',
      seo: 'SEO 성과보고서', safety: '안전 운행 보고서', custom: '맞춤 보고서',
    };
    Utils.toast(`${labels[type] || '보고서'} 생성 중...`, 'info');
    setTimeout(() => Utils.toast('보고서가 준비되었습니다. 다운로드를 시작합니다.', 'success'), 1500);
  };

  const scheduleReport = () => {
    Utils.toast('자동 보고서 발송 설정 완료 (매월 1일 이메일 발송)', 'success');
  };

  return {
    page, switchTab, refreshCurrent,
    exportPDF, exportExcel, generateReport, scheduleReport,
  };
})();

window.StatsModule = StatsModule;
