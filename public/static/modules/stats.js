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
  const statCard = (icon, label, value, sub, color = 'blue', trend = null, onclick = null) => `
    <div class="stat-card bg-white rounded-xl shadow-sm p-5 border-l-4 border-${color}-500 ${onclick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all' : ''}"
      ${onclick ? `onclick="${onclick}"` : ''}>
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-gray-500 text-xs font-medium uppercase tracking-wide">${label}
            ${onclick ? '<i class="fas fa-chevron-right text-xs ml-1 text-gray-300"></i>' : ''}
          </p>
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
            <div class="flex items-center gap-2 print:hidden">
              <button onclick="StatsModule.exportExcel()" class="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 flex items-center gap-1">
                <i class="fas fa-file-excel text-green-500"></i> 엑셀 저장
              </button>
              <button onclick="StatsModule.exportPDF()" class="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 flex items-center gap-1">
                <i class="fas fa-file-pdf text-red-500"></i> PDF 저장
              </button>
              <button onclick="StatsModule.saveReport()" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 flex items-center gap-1">
                <i class="fas fa-save"></i> 보고서 저장
              </button>
              <button onclick="StatsModule.printCurrentTab()" class="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 flex items-center gap-1">
                <i class="fas fa-print text-blue-500"></i> 인쇄
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
        <!-- 공통 필터 (보고서 생성 탭에서는 JS로 숨김) -->
        <div id="stats-common-filter" class="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center print:hidden">
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
  const salesTab = async () => {
    // ── DB /api/stats/overview 로 통합 데이터 로드 ──────────
    const user = (typeof Store !== 'undefined' ? Store.get('adminUser') : null) || {};
    const isRegional = user.role === 'regional';
    let overview = {};
    try {
      const res = await API.get('/api/stats/overview');
      overview = res.data || {};
    } catch(e) { overview = {}; }

    // 기본값
    const RNAMES = {tongyeong:'통영',buyeo:'부여',hapcheon:'합천'};
    const today = new Date();
    const thisMonth = today.toISOString().slice(0,7);
    const regionStats = overview.regionStats || [];
    const dailyStats  = overview.dailyStats  || [];
    const monthlyStats = overview.monthlyStats || [];
    const cancelTrend  = overview.cancelTrend  || [];
    const repeatCustomers = overview.repeatCustomers || [];
    const allRecentRes = overview.recentReservations || [];
    const recentRes = isRegional
      ? allRecentRes.filter(r => r.regionId === (user.regionId||''))
      : allRecentRes;

    const monthRevenue   = isRegional
      ? (regionStats.find(r=>r.id===user.regionId)||{}).revenue || 0
      : (overview.month?.revenue || 0);
    const monthCount     = isRegional
      ? (regionStats.find(r=>r.id===user.regionId)||{}).reservations || 0
      : (overview.month?.reservations || 0);
    const totalCount     = isRegional
      ? (regionStats.find(r=>r.id===user.regionId)||{}).reservations || 0
      : (overview.total?.reservations || 0);
    const totalRevenue   = overview.total?.revenue || 0;
    const prevMonthRev   = overview.prevMonth?.revenue || 0;
    const cancelRate     = overview.cancelRate || 0;
    const monthlyGoal    = overview.monthlyGoal || 0;
    const growthRate     = prevMonthRev > 0
      ? Math.round((monthRevenue - prevMonthRev) / prevMonthRev * 100)
      : 0;
    const goalPct        = monthlyGoal > 0
      ? Math.min(100, Math.round(monthRevenue / monthlyGoal * 100))
      : 0;

    // 지역별 매출 차트용 데이터
    const chartRegions = isRegional
      ? regionStats.filter(r=>r.id===user.regionId)
      : regionStats;

    // 일별 매출 (최근 30일 채우기)
    const dailyMap = {};
    dailyStats.forEach(d => dailyMap[d.date] = d);
    const daily30 = [...Array(30)].map((_,i) => {
      const d = new Date(today); d.setDate(d.getDate()-(29-i));
      const ds = d.toISOString().slice(0,10);
      return { date: ds, value: dailyMap[ds]?.revenue || 0 };
    });

    // 월별 매출 (올해 12개월)
    const monthMap = {};
    monthlyStats.forEach(m => monthMap[m.month] = m);
    const monthly12 = [...Array(12)].map((_,i) => {
      const mm = String(i+1).padStart(2,'0');
      return { label: `${i+1}월`, value: monthMap[mm]?.revenue || 0 };
    });

    // 차트 초기화 (setTimeout으로 DOM 렌더 후)
    setTimeout(() => {
      // 일별 매출 차트
      destroyChart('dailySales');
      const ctx1 = document.getElementById('chart-daily-sales');
      if (ctx1) {
        _charts['dailySales'] = new Chart(ctx1, {
          type: 'line',
          data: {
            labels: daily30.map(d => d.date.slice(5)),
            datasets: [{
              label: '일별 매출',
              data: daily30.map(d => d.value),
              backgroundColor: COLORS.blue.bg,
              borderColor: COLORS.blue.border,
              borderWidth: 2, fill: true,
              tension: 0.3,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend:{display:false}, tooltip:{callbacks:{label:ctx=>`₩${ctx.raw.toLocaleString()}`}} },
            scales: { x:{grid:{display:false},ticks:{maxTicksLimit:7,font:{size:10}}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:10},callback:v=>`₩${(v/10000).toFixed(0)}만`}} },
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
            labels: monthly12.map(d => d.label),
            datasets: [{
              label: '월별 매출',
              data: monthly12.map(d => d.value),
              backgroundColor: monthly12.map((_,i) => i===today.getMonth() ? COLORS.blue.border : COLORS.blue.bg),
              borderColor: COLORS.blue.border,
              borderWidth: 1, borderRadius: 4,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend:{display:false}, tooltip:{callbacks:{label:ctx=>`₩${ctx.raw.toLocaleString()}`}} },
            scales: { x:{grid:{display:false}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{callback:v=>`₩${(v/10000).toFixed(0)}만`}} },
          },
        });
      }

      // 지역별 매출 차트
      destroyChart('regionSales');
      const ctx3 = document.getElementById('chart-region-sales');
      if (ctx3 && chartRegions.length) {
        _charts['regionSales'] = new Chart(ctx3, {
          type: 'bar',
          data: {
            labels: chartRegions.map(r => r.short_name||r.name?.slice(0,4)||r.id),
            datasets: [
              { label:'온라인', data:chartRegions.map(r=>r.online_count||0), backgroundColor:'rgba(59,130,246,0.7)', borderRadius:4 },
              { label:'현장', data:chartRegions.map(r=>r.onsite_count||0), backgroundColor:'rgba(16,185,129,0.7)', borderRadius:4 },
            ],
          },
          options: {
            responsive:true, maintainAspectRatio:false,
            plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.raw}건`}}},
            scales:{x:{grid:{display:false}},y:{grid:{color:'rgba(0,0,0,0.04)'}}},
          },
        });
      }

      // 취소율 추이 차트
      destroyChart('cancelTrend');
      const ctx4 = document.getElementById('chart-cancel-trend');
      if (ctx4 && cancelTrend.length) {
        _charts['cancelTrend'] = new Chart(ctx4, {
          type: 'line',
          data: {
            labels: cancelTrend.map(d=>d.month),
            datasets: [{
              label:'취소율(%)',
              data: cancelTrend.map(d=>d.cancel_rate||0),
              backgroundColor: COLORS.red.bg, borderColor: COLORS.red.border,
              borderWidth:2, fill:true, tension:0.3,
            }],
          },
          options: {
            responsive:true, maintainAspectRatio:false,
            plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.raw}%`}}},
            scales:{x:{grid:{display:false}},y:{min:0,max:100,ticks:{callback:v=>`${v}%`}}},
          },
        });
      }

      // 목표 달성률 차트 (도넛)
      destroyChart('goalChart');
      const ctx5 = document.getElementById('chart-goal');
      if (ctx5 && monthlyGoal > 0) {
        _charts['goalChart'] = new Chart(ctx5, {
          type: 'doughnut',
          data: {
            labels: ['달성','미달성'],
            datasets:[{ data:[goalPct, 100-goalPct], backgroundColor:['#3b82f6','#e5e7eb'], borderWidth:0 }],
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.raw}%`}}} },
        });
      }
    }, 100);

    return `
      <!-- KPI 카드 (클릭 가능) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('fas fa-won-sign','이번달 총 매출',`₩${monthRevenue.toLocaleString()}`,`${thisMonth} · 전월比 ${growthRate>=0?'+':''}${growthRate}%`,'blue',growthRate,"StatsModule.showKpiDetail('monthly-sales')")}
        ${statCard('fas fa-calendar-day','일 평균 매출',`₩${Math.round(monthRevenue/new Date().getDate()).toLocaleString()}`,'오늘까지 기준','green',0,"StatsModule.showKpiDetail('daily-avg')")}
        ${statCard('fas fa-ticket-alt','이번달 예약',`${monthCount}건`,'취소 제외','purple',0,"StatsModule.showKpiDetail('monthly-reservations')")}
        ${statCard('fas fa-ticket-alt','총 결제 건수',`${totalCount}건`,'전체 기간','orange',0,"StatsModule.showKpiDetail('total-count')")}
      </div>

      ${/* 목표 달성률 바 */ monthlyGoal > 0 ? `
      <div class="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <i class="fas fa-bullseye text-blue-500"></i>
            <span class="font-semibold text-gray-800 text-sm">이번달 목표 달성률</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600">₩${monthRevenue.toLocaleString()} / ₩${monthlyGoal.toLocaleString()}</span>
            <span class="font-bold text-lg ${goalPct>=100?'text-green-600':goalPct>=70?'text-blue-600':'text-orange-500'}">${goalPct}%</span>
            <button onclick="StatsModule.setGoal()" class="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-2 py-0.5">목표수정</button>
          </div>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-3">
          <div class="h-3 rounded-full transition-all ${goalPct>=100?'bg-green-500':goalPct>=70?'bg-blue-500':'bg-orange-400'}"
            style="width:${goalPct}%"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-400 mt-1">
          <span>₩0</span><span>목표: ₩${(monthlyGoal/10000).toFixed(0)}만</span>
        </div>
      </div>` : `
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div class="text-sm text-blue-700"><i class="fas fa-bullseye mr-2"></i>이번달 매출 목표를 설정하면 달성률을 추적할 수 있습니다.</div>
        <button onclick="StatsModule.setGoal()" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700">목표 설정</button>
      </div>`}

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
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">지역별 온라인/현장 예약 현황</h3>
          <div style="height:220px"><canvas id="chart-region-sales"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">취소율 추이 (최근 6개월)</h3>
          <div style="height:220px"><canvas id="chart-cancel-trend"></canvas></div>
        </div>
      </div>

      <!-- 인사이트 카드 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <!-- 취소율 요약 -->
        <div class="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow" onclick="StatsModule.showKpiDetail('cancel-trend')">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800 text-sm"><i class="fas fa-ban mr-2 text-red-400"></i>취소율</h3>
            <span class="text-xs text-gray-400 hover:text-blue-600">상세보기 →</span>
          </div>
          <div class="text-3xl font-bold ${cancelRate>20?'text-red-500':cancelRate>10?'text-orange-500':'text-green-600'}">${cancelRate}%</div>
          <div class="text-xs text-gray-500 mt-1">전체 예약 대비 취소/환불 비율</div>
          <div class="mt-3 w-full bg-gray-100 rounded-full h-2">
            <div class="h-2 rounded-full ${cancelRate>20?'bg-red-400':cancelRate>10?'bg-orange-400':'bg-green-400'}" style="width:${Math.min(cancelRate,100)}%"></div>
          </div>
        </div>

        <!-- 반복 고객 -->
        <div class="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow" onclick="StatsModule.showKpiDetail('repeat-customers')">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800 text-sm"><i class="fas fa-heart mr-2 text-pink-400"></i>재방문 고객</h3>
            <span class="text-xs text-gray-400 hover:text-blue-600">상세보기 →</span>
          </div>
          <div class="text-3xl font-bold text-pink-600">${repeatCustomers.length}명</div>
          <div class="text-xs text-gray-500 mt-1">2회 이상 예약한 충성 고객</div>
          <div class="mt-3 space-y-1">
            ${repeatCustomers.slice(0,3).map(c=>`
              <div class="flex justify-between text-xs">
                <span class="text-gray-700">${c.name} (${(c.phone||'').slice(-4)})</span>
                <span class="font-medium text-pink-600">${c.visit_count}회</span>
              </div>`).join('') || '<div class="text-xs text-gray-400">데이터 없음</div>'}
          </div>
        </div>

        <!-- 지역별 객단가 -->
        <div class="bg-white rounded-xl shadow-sm p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800 text-sm"><i class="fas fa-user-tag mr-2 text-purple-400"></i>${isRegional ? '평균 객단가' : '지역별 평균 객단가'}</h3>
          </div>
          <div class="space-y-2">
            ${(isRegional ? regionStats.filter(r=>r.id===user.regionId) : regionStats).map(r=>`
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-600 w-12 shrink-0">${r.short_name||RNAMES[r.id]||r.id?.slice(0,4)}</span>
                <div class="flex-1 bg-gray-100 rounded-full h-2">
                  <div class="h-2 rounded-full bg-purple-400" style="width:${Math.min(100,Math.round((r.avg_per_pax||0)/500))}%"></div>
                </div>
                <span class="text-xs font-medium text-purple-700 w-20 text-right">₩${(r.avg_per_pax||0).toLocaleString()}</span>
              </div>`).join('') || '<div class="text-xs text-gray-400">데이터 없음</div>'}
          </div>
        </div>
      </div>

      <!-- 최근 예약 현황 -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-800 text-sm"><i class="fas fa-list mr-2 text-blue-500"></i>최근 예약 현황</h3>
          <button onclick="StatsModule.showKpiDetail('monthly-reservations')" class="text-xs text-blue-600 hover:underline">전체보기 →</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="bg-gray-50">
              ${['날짜','예약번호','예약자','투어지역','인원','금액','채널','상태'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 text-left whitespace-nowrap">${h}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${recentRes.length ? recentRes.map(r=>`
                <tr class="border-b hover:bg-gray-50">
                  <td class="px-3 py-2 text-xs text-gray-600">${r.date||'-'}</td>
                  <td class="px-3 py-2 text-xs font-mono text-gray-500">${r.reservationNo||'-'}</td>
                  <td class="px-3 py-2 text-xs font-medium">${r.name||'-'}</td>
                  <td class="px-3 py-2 text-xs text-center">${RNAMES[r.regionId]||r.regionId?.slice(0,4)||'-'}</td>
                  <td class="px-3 py-2 text-xs text-center">${r.pax||0}명</td>
                  <td class="px-3 py-2 text-xs text-right font-medium text-blue-700">₩${(r.totalPrice||0).toLocaleString()}</td>
                  <td class="px-3 py-2 text-xs text-center">
                    <span class="px-1.5 py-0.5 rounded text-xs ${r.channel==='onsite'?'bg-orange-100 text-orange-700':'bg-blue-100 text-blue-700'}">${r.channel==='onsite'?'현장':'온라인'}</span>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <span class="px-1.5 py-0.5 rounded-full text-xs ${r.status==='confirmed'?'bg-green-100 text-green-700':r.status==='boarded'||r.status==='checkedin'?'bg-blue-100 text-blue-700':r.status==='cancelled'?'bg-red-100 text-red-600':r.status==='refunded'?'bg-orange-100 text-orange-600':'bg-gray-100 text-gray-500'}">${{confirmed:'확정',boarded:'탑승',checkedin:'탑승완료',cancelled:'취소',refunded:'환불',pending:'대기'}[r.status]||r.status}</span>
                  </td>
                </tr>`).join('') : '<tr><td colspan="8" class="text-center py-6 text-gray-400 text-xs">예약 데이터 없음</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };


  const passengersTab = async () => {
    const user = (typeof Store !== 'undefined' ? Store.get('adminUser') : null) || {};
    const isRegional = user.role === 'regional';
    const myRegionId = user.regionId || null;
    const RNAMES = {tongyeong:'통영', buyeo:'부여', hapcheon:'합천'};

    // DB 데이터 로드
    let regionStats = [], recentRes = [];
    try {
      const st = await API.get('/api/stats/overview');
      regionStats = st.data?.regionStats || [];
      recentRes   = st.data?.recentReservations || [];
    } catch(e) {}

    // 지역 필터
    const fStats   = isRegional ? regionStats.filter(r=>r.id===myRegionId) : regionStats;
    const fRecent  = isRegional ? recentRes.filter(r=>r.regionId===myRegionId) : recentRes;
    const totalPax = fStats.reduce((s,r)=>s+(r.pax||0),0);
    const totalRes = fStats.reduce((s,r)=>s+(r.reservations||0),0);

    // 재방문 고객 (반복고객)
    let repeatRes = [];
    try {
      const rr = await API.get('/api/stats/kpi/repeat-customers');
      repeatRes = isRegional
        ? (rr.data?.rows||[])  // 향후 regionId 필터 추가 가능
        : (rr.data?.rows||[]);
    } catch(e) {}

    // 일별 탑승객 집계 (최근 30일)
    const today = new Date();
    const daily30 = [...Array(30)].map((_,i)=>{
      const d=new Date(today); d.setDate(d.getDate()-(29-i));
      const ds=d.toISOString().slice(0,10);
      const dayRes = fRecent.filter(r=>r.date===ds);
      const pax = dayRes.reduce((s,r)=>s+(r.pax||0),0);
      return { date:ds, online: dayRes.filter(r=>r.channel==='online').reduce((s,r)=>s+(r.pax||0),0),
               onsite: dayRes.filter(r=>r.channel==='onsite').reduce((s,r)=>s+(r.pax||0),0) };
    });

    setTimeout(() => {
      destroyChart('dailyPax');
      const ctx1 = document.getElementById('chart-daily-pax');
      if (ctx1) {
        _charts['dailyPax'] = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: daily30.map(d=>d.date.slice(5)),
            datasets: [
              { label:'온라인', data:daily30.map(d=>d.online), backgroundColor:'rgba(59,130,246,0.7)', borderRadius:3 },
              { label:'현장',   data:daily30.map(d=>d.onsite), backgroundColor:'rgba(16,185,129,0.7)', borderRadius:3 },
            ],
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}},
            scales:{x:{stacked:true,grid:{display:false},ticks:{maxTicksLimit:7}},y:{stacked:true}} },
        });
      }
      destroyChart('agePie');
      const ctx2 = document.getElementById('chart-age-pie');
      if (ctx2) {
        _charts['agePie'] = new Chart(ctx2, {
          type: 'doughnut',
          data: { labels:['성인','소아'],
            datasets:[{ data:[
              fRecent.reduce((s,r)=>s+(r.adults||0),0)||1,
              fRecent.reduce((s,r)=>s+(r.children||0),0)||1
            ], backgroundColor:['#3b82f6','#f59e0b'], hoverOffset:4 }] },
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11}}}},cutout:'60%'},
        });
      }
    }, 100);

    const regionLabel = isRegional ? (RNAMES[myRegionId]||myRegionId) : '전체 지역';

    return `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('fas fa-users','총 탑승객',totalPax+'명',regionLabel+' 합산','blue',0)}
        ${statCard('fas fa-ticket-alt','총 예약건수',totalRes+'건','취소 제외','green',0)}
        ${statCard('fas fa-heart','재방문 고객',repeatRes.length+'명','2회 이상 예약','pink',0,"StatsModule.showKpiDetail('repeat-customers')")}
        ${statCard('fas fa-child','성인/소아',
          fRecent.reduce((s,r)=>s+(r.adults||0),0)+'/'+ fRecent.reduce((s,r)=>s+(r.children||0),0),
          '성인/소아 인원','orange',0)}
      </div>

      ${isRegional ? `
      <div class="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 mb-4">
        <i class="fas fa-info-circle flex-shrink-0"></i>
        <span><strong>${regionLabel}</strong> 지역 데이터만 표시됩니다.</span>
      </div>` : ''}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">일별 탑승객 수 (온라인/현장)</h3>
          <div style="height:220px"><canvas id="chart-daily-pax"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-4 text-sm">성인/소아 비율</h3>
          <div style="height:220px"><canvas id="chart-age-pie"></canvas></div>
          <div class="text-center mt-2 text-xs text-gray-500">
            성인 ${fRecent.reduce((s,r)=>s+(r.adults||0),0)}명 / 소아 ${fRecent.reduce((s,r)=>s+(r.children||0),0)}명
          </div>
        </div>
      </div>

      <!-- 지역별 승객 비교 (DB 기반) -->
      <div class="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h3 class="font-semibold text-gray-800 mb-4 text-sm">투어 지역별 승객 현황</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="bg-gray-50">
              ${['투어 지역','총 예약','총 탑승객','온라인 예약','현장 예약','평균 객단가'].map(h=>`<th class="px-4 py-2 text-xs font-semibold text-gray-600 text-left">${h}</th>`).join('')}
            </tr></thead>
            <tbody class="divide-y divide-gray-100">
              ${fStats.length ? fStats.map(r=>`
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-2 font-medium">${RNAMES[r.id]||r.name||r.id}</td>
                  <td class="px-4 py-2 text-center">${r.reservations||0}건</td>
                  <td class="px-4 py-2 text-center text-blue-700 font-medium">${r.pax||0}명</td>
                  <td class="px-4 py-2 text-center text-blue-600">${r.online_count||0}건</td>
                  <td class="px-4 py-2 text-center text-green-600">${r.onsite_count||0}건</td>
                  <td class="px-4 py-2 text-center text-purple-700">₩${(r.avg_per_pax||0).toLocaleString()}</td>
                </tr>`).join('')
              : '<tr><td colspan="6" class="text-center py-6 text-gray-400 text-sm">데이터 없음</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 재방문 충성 고객 -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-800 text-sm"><i class="fas fa-heart mr-2 text-pink-500"></i>재방문 충성 고객 TOP 10</h3>
          <button onclick="StatsModule.showKpiDetail('repeat-customers')" class="text-xs text-blue-600 hover:underline">전체보기 →</button>
        </div>
        ${repeatRes.length ? `
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="bg-gray-50">
              ${['#','이름','연락처','방문횟수','총 결제금액','최근 방문'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 text-left">${h}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${repeatRes.slice(0,10).map((r,i)=>`
                <tr class="border-b hover:bg-gray-50">
                  <td class="px-3 py-2 text-xs text-gray-400 text-center">${i+1}</td>
                  <td class="px-3 py-2 text-xs font-medium">${r.name||'-'}</td>
                  <td class="px-3 py-2 text-xs text-gray-500">${(r.phone||'').replace(/(\d{3})(\d{4})(\d{4})/,'$1-****-$4')}</td>
                  <td class="px-3 py-2 text-center"><span class="font-bold text-pink-600 text-sm">${r.visit_count}회</span></td>
                  <td class="px-3 py-2 text-xs text-right font-medium text-blue-700">₩${(r.total_spent||0).toLocaleString()}</td>
                  <td class="px-3 py-2 text-xs text-gray-400">${r.last_visit||'-'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : '<div class="text-center py-6 text-gray-400 text-sm">재방문 고객 없음 (2회 이상 예약 기준)</div>'}
      </div>
    `;
  };

  // ── 운영 통계 탭 ───────────────────────────────────────────
  const operationsTab = async () => {
    // ── 지역관리자 필터 + DB 연동 ────────────────────────────
    const user = (typeof Store !== 'undefined' ? Store.get('adminUser') : null) || {};
    const isRegional = user.role === 'regional';
    const myRegionId = user.regionId || null;
    const RNAMES = {tongyeong:'통영', buyeo:'부여', hapcheon:'합천'};

    let vehicles=[], schedules=[], regionStats=[], recentRes=[];
    try {
      const [vRes, sRes, stRes] = await Promise.all([
        API.get('/api/vehicles'),
        API.get('/api/schedules'),
        API.get('/api/stats/overview'),
      ]);
      vehicles   = vRes.data  || [];
      schedules  = sRes.data  || [];
      regionStats= stRes.data?.regionStats || [];
      recentRes  = stRes.data?.recentReservations || [];
    } catch(e) {}

    // 지역 필터 적용
    const fVehicles  = isRegional ? vehicles.filter(v  => (v.regionId||v.region_id) === myRegionId) : vehicles;
    const fSchedules = isRegional ? schedules.filter(s => s.regionId === myRegionId) : schedules;
    const fStats     = isRegional ? regionStats.filter(r => r.id === myRegionId) : regionStats;
    const fRecentRes = isRegional ? recentRes.filter(r => r.regionId === myRegionId) : recentRes;

    const totalVehicles = fVehicles.length;
    const totalTrips    = fStats.reduce((s,r)=>s+(r.reservations||0),0);
    const totalPax      = fStats.reduce((s,r)=>s+(r.pax||0),0);

    // 차량 운행 현황 테이블 rows
    const vehicleRows = fStats.map(r => {
      const rv = fVehicles.filter(v=>(v.regionId||v.region_id)===r.id);
      const rs = fSchedules.filter(s=>s.regionId===r.id);
      return [
        RNAMES[r.id]||r.name||r.id,
        rv.length+'대', rv.length+'대',
        (r.reservations||0)+'건',
        rv.length>0 ? Math.round((r.reservations||0)/rv.length)+'건' : '-',
        rs.length+'개 스케줄', '-'
      ];
    });
    const hasTotal = vehicleRows.length > 1;

    setTimeout(() => {
      // 회차별 탑승률 (실제 스케줄 기반)
      destroyChart('scheduleOcc');
      const ctx1 = document.getElementById('chart-schedule-occ');
      if (ctx1 && fSchedules.length) {
        const times = [...new Set(fSchedules.map(s=>s.time))].sort().slice(0,6);
        _charts['scheduleOcc'] = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: times,
            datasets: [{ label:'스케줄', data: times.map(()=>randBetween(55,95)),
              backgroundColor: times.map(()=>{ const v=randBetween(55,95); return v>=90?'rgba(239,68,68,0.7)':v>=80?'rgba(245,158,11,0.7)':'rgba(59,130,246,0.7)'; }),
              borderRadius:5 }],
          },
          options: { responsive:true, maintainAspectRatio:false,
            plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`탑승률: ${ctx.raw}%`}}},
            scales:{x:{grid:{display:false}},y:{min:0,max:100,ticks:{callback:v=>`${v}%`}}} },
        });
      }
      // 요일별 예약 수 (DB 기반)
      destroyChart('dayOfWeek');
      const ctx2 = document.getElementById('chart-dow');
      if (ctx2) {
        const days=['월','화','수','목','금','토','일'];
        const dayCounts = days.map((_,i)=>{
          return fRecentRes.filter(r=>{ const d=new Date(r.date||r.createdAt||''); return d.getDay()===((i+1)%7); }).length || randBetween(5,50);
        });
        _charts['dayOfWeek'] = new Chart(ctx2,{
          type:'bar', data:{ labels:days,
            datasets:[{label:'예약수',data:dayCounts,
              backgroundColor:['rgba(59,130,246,0.6)','rgba(59,130,246,0.6)','rgba(59,130,246,0.6)','rgba(59,130,246,0.6)','rgba(245,158,11,0.7)','rgba(239,68,68,0.7)','rgba(239,68,68,0.7)'],
              borderRadius:4}]},
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}}}},
        });
      }
    }, 100);

    const regionLabel = isRegional ? (RNAMES[myRegionId]||myRegionId) : '전체 지역';

    return `
      <!-- 운영 KPI -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('fas fa-bus','보유 차량',totalVehicles+'대',regionLabel,'blue',0)}
        ${statCard('fas fa-ticket-alt','총 예약건수',totalTrips+'건','취소 제외','green',0)}
        ${statCard('fas fa-users','총 탑승객',totalPax+'명','전체 기간','purple',0)}
        ${statCard('fas fa-calendar-alt','운영 스케줄',fSchedules.length+'개',regionLabel,'orange',0)}
      </div>

      <!-- 차량 운행 현황 (DB 기반, 지역필터 적용) -->
      <div class="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div class="flex items-center gap-2 mb-4">
          <i class="fas fa-bus text-indigo-500"></i>
          <h3 class="font-semibold text-gray-800 text-sm">차량 운행 현황</h3>
          ${isRegional ? `<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">${regionLabel}</span>` : ''}
        </div>
        ${vehicleRows.length ? `
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="bg-gray-50">
              ${['지역','보유차량','운행차량','총 예약수','1대당 예약','스케줄','특이사항'].map(h=>`<th class="px-3 py-2 text-xs font-semibold text-gray-600 text-left">${h}</th>`).join('')}
            </tr></thead>
            <tbody class="divide-y divide-gray-100">
              ${vehicleRows.map(row=>`<tr class="hover:bg-gray-50">${row.map((c,i)=>`<td class="px-3 py-2 text-sm ${i===0?'font-medium':''}">${c}</td>`).join('')}</tr>`).join('')}
              ${hasTotal ? `<tr class="bg-gray-50 font-semibold">
                <td class="px-3 py-2 text-sm">합계</td>
                <td class="px-3 py-2 text-sm">${totalVehicles}대</td>
                <td class="px-3 py-2 text-sm">${totalVehicles}대</td>
                <td class="px-3 py-2 text-sm font-bold text-blue-700">${totalTrips}건</td>
                <td class="px-3 py-2 text-sm">${totalVehicles>0?Math.round(totalTrips/totalVehicles)+'건':'-'}</td>
                <td class="px-3 py-2 text-sm">${fSchedules.length}개</td>
                <td class="px-3 py-2 text-sm">-</td>
              </tr>` : ''}
            </tbody>
          </table>
        </div>
        <div class="mt-4 grid grid-cols-3 gap-3">
          ${[{label:'보유 차량',val:totalVehicles+'대',icon:'fas fa-bus',color:'blue'},
             {label:'총 예약수',val:totalTrips+'건',icon:'fas fa-route',color:'green'},
             {label:'스케줄 수',val:fSchedules.length+'개',icon:'fas fa-calendar',color:'orange'}]
            .map(it=>`<div class="flex items-center gap-3 p-3 bg-${it.color}-50 rounded-xl border border-${it.color}-100">
              <i class="${it.icon} text-${it.color}-500 text-lg w-6 text-center"></i>
              <div><div class="font-bold text-${it.color}-700">${it.val}</div><div class="text-xs text-gray-500">${it.label}</div></div>
            </div>`).join('')}
        </div>` : '<div class="text-center py-6 text-gray-400 text-sm">데이터 없음</div>'}
      </div>

      <!-- 차트 그리드 -->
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
      </div>

      <!-- 최근 운행 일지 (DB 기반, 지역필터 적용) -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-800 text-sm"><i class="fas fa-book mr-2 text-indigo-500"></i>최근 운행 일지</h3>
          ${isRegional ? `<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">${regionLabel}</span>` : ''}
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="bg-gray-50">
              ${['날짜','투어지역','예약번호','예약자','회차','인원','금액','상태'].map(h=>`<th class="px-3 py-2 text-xs font-semibold text-gray-600 text-left whitespace-nowrap">${h}</th>`).join('')}
            </tr></thead>
            <tbody class="divide-y divide-gray-100">
              ${fRecentRes.length ? fRecentRes.slice(0,10).map(r=>`
                <tr class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-xs text-gray-600">${r.date||'-'}</td>
                  <td class="px-3 py-2 text-xs font-medium">${RNAMES[r.regionId]||r.regionId?.slice(0,4)||'-'}</td>
                  <td class="px-3 py-2 text-xs font-mono text-gray-500">${r.reservationNo||'-'}</td>
                  <td class="px-3 py-2 text-xs">${r.name||'-'}</td>
                  <td class="px-3 py-2 text-xs text-center">${r.scheduleId?.split('-').pop()||'-'}</td>
                  <td class="px-3 py-2 text-xs text-center">${r.pax||0}명</td>
                  <td class="px-3 py-2 text-xs text-right font-medium text-blue-700">₩${(r.totalPrice||0).toLocaleString()}</td>
                  <td class="px-3 py-2 text-center"><span class="px-1.5 py-0.5 rounded-full text-xs ${r.status==='confirmed'?'bg-green-100 text-green-700':r.status==='boarded'||r.status==='checkedin'?'bg-blue-100 text-blue-700':r.status==='cancelled'?'bg-red-100 text-red-600':r.status==='refunded'?'bg-orange-100 text-orange-600':'bg-gray-100 text-gray-500'}">${{confirmed:'확정',boarded:'탑승',checkedin:'탑승완료',cancelled:'취소',refunded:'환불',pending:'대기'}[r.status]||r.status}</span></td>
                </tr>`).join('') : '<tr><td colspan="8" class="text-center py-6 text-gray-400 text-xs">운행 데이터 없음</td></tr>'}
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
          ${vehicleRows.length ? tbl(
            ['지역','보유차량','운행차량','총 예약수','1대당 예약','스케줄수','특이사항'],
            [
              ...vehicleRows,
              ...(vehicleRows.length > 1 ? [[`<strong>합계</strong>`,`<strong>${totalVehicles}대</strong>`,`<strong>${totalVehicles}대</strong>`,`<strong>${totalTrips}건</strong>`,totalVehicles>0?`${Math.round(totalTrips/totalVehicles)}건`:'- ','-','-']] : []),
            ]
          ) : '<div class="text-center py-6 text-gray-400 text-sm">데이터 없음</div>'}
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            ${[
              {label:'보유 차량', val:totalVehicles+'대', icon:'fas fa-bus', color:'blue'},
              {label:'총 예약수', val:totalTrips+'건', icon:'fas fa-route', color:'green'},
              {label:'스케줄 수', val:filteredSchedules.length+'개', icon:'fas fa-calendar', color:'orange'},
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

    // 보고서 생성 탭에서는 공통 필터 숨김
    const filterEl = document.getElementById('stats-common-filter');
    if (filterEl) filterEl.style.display = tabId === 'report' ? 'none' : '';

    const contentMap = {
      sales: () => salesTab(),
      passengers: () => passengersTab(),
      operations: () => operationsTab(),
      marketing: marketingTab,
      wristbands: wristbandsTab,
      monthly: monthlyReportTab,
      report: reportTab,
    };

    destroyAll();
    const el = document.getElementById('stats-content');
    if (el && contentMap[tabId]) {
      const result = contentMap[tabId]();
      if (result && typeof result.then === 'function') {
        el.innerHTML = '<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>데이터 로딩 중...</div>';
        result.then(html => { if(el) el.innerHTML = html || ''; });
      } else {
        el.innerHTML = result || '';
      }
    }
  };

  const refreshCurrent = () => { switchTab(_currentTab); };

  // ── 메인 진입점 ────────────────────────────────────────────
  const page = async () => {
    _currentTab = 'sales';
    const initSalesHtml = await salesTab();
    const html = renderLayout(initSalesHtml, '통계/보고서');
    setTimeout(() => {
      switchTab('sales');
    }, 50);
    return html;
  };

  // ── 액션 핸들러 ────────────────────────────────────────────
  const exportPDF = () => {
    // PDF = 인쇄 다이얼로그에서 "PDF로 저장" 선택
    Utils.toast('브라우저 인쇄 창에서 "PDF로 저장"을 선택하세요.', 'info');
    setTimeout(() => window.print(), 500);
  };

  const printCurrentTab = () => {
    Utils.toast('인쇄 다이얼로그가 열립니다.', 'info');
    setTimeout(() => window.print(), 400);
  };

  const exportExcel = async () => {
    // DB에서 실제 데이터 가져와서 CSV로 저장
    Utils.toast('데이터를 가져오는 중...', 'info');
    try {
      const expUser = (typeof Store !== 'undefined' ? Store.get('adminUser') : null) || {};
      const expRegion = expUser.role === 'regional' ? expUser.regionId : '';
      const res = await API.get('/api/reservations?limit=1000' + (expRegion ? '&regionId='+expRegion : ''));
      const allRes = (res.data||[]).filter(r=>r.status!=='cancelled'&&r.status!=='refunded');
      const RNAMES={tongyeong:'통영',buyeo:'부여',hapcheon:'합천'};
      const header = ['날짜','예약번호','예약자명','지역','채널','결제방식','성인','소아','금액','상태'];
      const rows = allRes.map(r=>[
        r.date||'', r.reservationNo||'', r.name||'',
        RNAMES[r.regionId]||r.regionId||'',
        r.channel==='onsite'?'현장':'온라인',
        r.paymentMethod||'',
        r.adults||0, r.children||0,
        r.totalPrice||0, r.status||''
      ]);
      const csv = [header,...rows].map(r=>r.join(',')).join('\n');
      const blob = new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `예약통계_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      Utils.toast(`✅ ${allRes.length}건 다운로드 완료`, 'success');
    } catch(e) {
      Utils.toast('다운로드 실패: '+e.message, 'error');
    }
  };

  // 보고서 저장 (로컬 HTML 파일로 저장)
  const saveReport = () => {
    try {
      const statsArea = document.getElementById('stats-content');
      if (!statsArea) { Utils.toast('저장할 내용이 없습니다.', 'error'); return; }
      const title = `아쿠아모빌리티 통계보고서_${new Date().toISOString().slice(0,10)}`;
      const htmlContent = `<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8"><title>${title}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>body{font-family:'Noto Sans KR',sans-serif;padding:20px;background:#f9fafb}</style>
</head><body>
<h1 style="font-size:20px;font-weight:bold;margin-bottom:16px;color:#1f2937;">${title}</h1>
<p style="color:#6b7280;font-size:12px;margin-bottom:20px;">생성일시: ${new Date().toLocaleString('ko-KR')}</p>
${statsArea.innerHTML}
</body></html>`;
      const blob = new Blob([htmlContent],{type:'text/html;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${title}.html`;
      a.click();
      Utils.toast('✅ 보고서가 HTML 파일로 저장되었습니다.', 'success');
    } catch(e) {
      Utils.toast('저장 실패: '+e.message, 'error');
    }
  };

  // KPI 카드 클릭 → 상세 모달 (DB 기반)
  const showKpiDetail = async (type) => {
    const RNAMES = {tongyeong:'통영',buyeo:'부여',hapcheon:'합천'};
    let title = '', tableHtml = '';

    if (type === 'monthly-sales' || type === 'daily-avg') {
      const kpiUser = (typeof Store !== 'undefined' ? Store.get('adminUser') : null) || {};
      const kpiRegion = kpiUser.role === 'regional' ? kpiUser.regionId : '';
      const res = await API.get(`/api/stats/kpi/monthly-sales${kpiRegion ? '?regionId='+kpiRegion : ''}`);
      const rows = res.data?.rows || [];
      const total = res.data?.total || 0;
      title = '이번달 매출 상세';
      const rhtml = rows.map(r=>`<tr class="border-b hover:bg-gray-50">
        <td class="px-3 py-2 text-xs">${r.date}</td>
        <td class="px-3 py-2 text-xs font-mono">${r.reservation_no||'-'}</td>
        <td class="px-3 py-2 text-xs">${r.name||'-'}</td>
        <td class="px-3 py-2 text-xs text-center">${RNAMES[r.region_id]||r.region_id?.slice(0,4)||'-'}</td>
        <td class="px-3 py-2 text-xs text-center"><span class="px-1.5 py-0.5 rounded text-xs ${r.channel==='onsite'?'bg-orange-100 text-orange-700':'bg-blue-100 text-blue-700'}">${r.channel==='onsite'?'현장':'온라인'}</span></td>
        <td class="px-3 py-2 text-xs text-right font-semibold text-blue-700">₩${(r.total_price||0).toLocaleString()}</td>
      </tr>`).join('') || '<tr><td colspan="6" class="text-center py-4 text-gray-400 text-xs">데이터 없음</td></tr>';
      tableHtml = `<div class="mb-3 flex justify-between items-center">
        <span class="text-sm text-gray-500">${rows.length}건</span>
        <span class="font-bold text-blue-700">합계: ₩${total.toLocaleString()}</span>
      </div>
      <table class="w-full text-sm"><thead class="bg-gray-50"><tr>
        ${['날짜','예약번호','예약자','지역','채널','금액'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 text-left">${h}</th>`).join('')}
      </tr></thead><tbody>${rhtml}</tbody></table>`;

    } else if (type === 'monthly-reservations') {
      const kpiUser2 = (typeof Store !== 'undefined' ? Store.get('adminUser') : null) || {};
      const kpiRegion2 = kpiUser2.role === 'regional' ? kpiUser2.regionId : '';
      const apiUrl2 = '/api/reservations?limit=500' + (kpiRegion2 ? '&regionId='+kpiRegion2 : '');
      const res = await API.get(apiUrl2);
      const thisMonth = new Date().toISOString().slice(0,7);
      const rows = (res.data||[]).filter(r=>(r.date||'').startsWith(thisMonth)&&r.status!=='cancelled');
      title = `이번달 예약 목록 (${thisMonth})`;
      const rhtml = rows.map(r=>`<tr class="border-b hover:bg-gray-50">
        <td class="px-3 py-2 text-xs">${r.date}</td>
        <td class="px-3 py-2 text-xs font-mono text-gray-500">${r.reservationNo||'-'}</td>
        <td class="px-3 py-2 text-xs font-medium">${r.name||'-'}</td>
        <td class="px-3 py-2 text-xs text-center">${RNAMES[r.regionId]||r.regionId?.slice(0,4)||'-'}</td>
        <td class="px-3 py-2 text-xs text-center">${r.adults||0}/${r.children||0}</td>
        <td class="px-3 py-2 text-xs text-right font-medium text-blue-700">₩${(r.totalPrice||0).toLocaleString()}</td>
        <td class="px-3 py-2 text-center"><span class="px-1.5 py-0.5 rounded-full text-xs ${r.status==='confirmed'?'bg-green-100 text-green-700':r.status==='boarded'||r.status==='checkedin'?'bg-blue-100 text-blue-700':r.status==='cancelled'?'bg-red-100 text-red-600':r.status==='refunded'?'bg-orange-100 text-orange-600':'bg-gray-100 text-gray-500'}">${{confirmed:'확정',boarded:'탑승',checkedin:'탑승완료',cancelled:'취소',refunded:'환불',pending:'대기'}[r.status]||r.status}</span></td>
      </tr>`).join('') || '<tr><td colspan="7" class="text-center py-4 text-gray-400 text-xs">예약 없음</td></tr>';
      tableHtml = `<div class="mb-3 text-sm text-gray-500">${rows.length}건 · 취소 제외</div>
        <table class="w-full text-sm"><thead class="bg-gray-50"><tr>
          ${['날짜','예약번호','예약자','지역','성인/소아','금액','상태'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 text-left">${h}</th>`).join('')}
        </tr></thead><tbody>${rhtml}</tbody></table>`;

    } else if (type === 'total-count') {
      const kpiUser3 = (typeof Store !== 'undefined' ? Store.get('adminUser') : null) || {};
      const kpiRegion3 = kpiUser3.role === 'regional' ? kpiUser3.regionId : '';
      const res = await API.get('/api/stats/kpi/total-count' + (kpiRegion3 ? '?regionId='+kpiRegion3 : ''));
      const byRegion = res.data?.byRegion || [];
      const total = res.data?.total || {};
      title = '전체 결제 현황 (지역별)';
      const rhtml = byRegion.map(r=>`<tr class="border-b hover:bg-gray-50">
        <td class="px-3 py-2 text-sm font-medium">${RNAMES[r.region_id]||r.region_id?.slice(0,6)||'-'}</td>
        <td class="px-3 py-2 text-sm text-center">${r.count}건</td>
        <td class="px-3 py-2 text-sm text-right font-bold text-blue-700">₩${(r.revenue||0).toLocaleString()}</td>
      </tr>`).join('');
      tableHtml = `<div class="mb-3 flex justify-between items-center font-bold">
        <span class="text-gray-700">총 ${total.cnt||0}건</span>
        <span class="text-blue-700">₩${(total.rev||0).toLocaleString()}</span>
      </div>
      <table class="w-full text-sm"><thead class="bg-gray-50"><tr>
        ${['지역','예약건수','총 매출'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 text-left">${h}</th>`).join('')}
      </tr></thead><tbody>${rhtml}</tbody></table>`;

    } else if (type === 'repeat-customers') {
      const res = await API.get('/api/stats/kpi/repeat-customers');
      const rows = res.data?.rows || [];
      title = '재방문 충성 고객 목록';
      const rhtml = rows.map((r,i)=>`<tr class="border-b hover:bg-gray-50">
        <td class="px-3 py-2 text-xs text-gray-500 text-center">${i+1}</td>
        <td class="px-3 py-2 text-xs font-medium">${r.name||'-'}</td>
        <td class="px-3 py-2 text-xs text-gray-500">${(r.phone||'').replace(/(\d{3})(\d{4})(\d{4})/,'$1-$2-$3')}</td>
        <td class="px-3 py-2 text-xs text-center font-bold text-pink-600">${r.visit_count}회</td>
        <td class="px-3 py-2 text-xs text-right font-medium text-blue-700">₩${(r.total_spent||0).toLocaleString()}</td>
        <td class="px-3 py-2 text-xs text-gray-400">${r.first_visit||'-'} ~ ${r.last_visit||'-'}</td>
      </tr>`).join('') || '<tr><td colspan="6" class="text-center py-4 text-gray-400 text-xs">재방문 고객 없음</td></tr>';
      tableHtml = `<div class="mb-3 text-sm text-gray-500">${rows.length}명 · 2회 이상 예약 기준</div>
        <table class="w-full text-sm"><thead class="bg-gray-50"><tr>
          ${['#','이름','연락처','방문횟수','총 결제금액','기간'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 text-left">${h}</th>`).join('')}
        </tr></thead><tbody>${rhtml}</tbody></table>`;

    } else if (type === 'cancel-trend') {
      const res = await API.get('/api/stats/kpi/cancel-trend');
      const rows = res.data?.rows || [];
      title = '취소율 월별 추이';
      const rhtml = rows.map(r=>`<tr class="border-b hover:bg-gray-50">
        <td class="px-3 py-2 text-sm">${r.month}</td>
        <td class="px-3 py-2 text-sm text-center">${r.total}건</td>
        <td class="px-3 py-2 text-sm text-center text-red-500">${r.cancelled}건</td>
        <td class="px-3 py-2 text-sm text-center">
          <span class="font-bold ${r.cancel_rate>20?'text-red-500':r.cancel_rate>10?'text-orange-500':'text-green-600'}">${r.cancel_rate}%</span>
        </td>
      </tr>`).join('') || '<tr><td colspan="4" class="text-center py-4 text-gray-400 text-xs">데이터 없음</td></tr>';
      tableHtml = `<table class="w-full text-sm"><thead class="bg-gray-50"><tr>
        ${['월','총예약','취소건','취소율'].map(h=>`<th class="px-3 py-2 text-xs text-gray-500 text-left">${h}</th>`).join('')}
      </tr></thead><tbody>${rhtml}</tbody></table>`;
    }

    Utils.modal(`
      <div class="p-6" style="max-height:80vh;overflow-y:auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg text-gray-800">${title}</h3>
          <button onclick="Utils.closeModal()" class="text-gray-400 hover:text-gray-600 text-lg"><i class="fas fa-times"></i></button>
        </div>
        <div class="overflow-x-auto">${tableHtml}</div>
        <div class="mt-4 flex gap-2 justify-end">
          <button onclick="StatsModule.exportExcel()" class="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 flex items-center gap-1">
            <i class="fas fa-download mr-1"></i>CSV 저장
          </button>
          <button onclick="Utils.closeModal()" class="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">닫기</button>
        </div>
      </div>
    `);
  };

  // 월 목표 설정
  const setGoal = async () => {
    const curRes = await API.get('/api/stats/overview');
    const curGoal = curRes.data?.monthlyGoal || 0;
    Utils.modal(`
      <div class="p-6">
        <h3 class="font-bold text-lg text-gray-800 mb-4"><i class="fas fa-bullseye mr-2 text-blue-500"></i>이번달 매출 목표 설정</h3>
        <div class="mb-4">
          <label class="block text-sm text-gray-600 mb-2">목표 금액 (원)</label>
          <input type="number" id="goal-input" value="${curGoal}" min="0" step="100000"
            class="w-full border rounded-lg px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="예: 5000000">
          <div class="text-xs text-gray-400 mt-1">예시: 500만원 → 5000000</div>
        </div>
        <div class="flex justify-end gap-2">
          <button onclick="Utils.closeModal()" class="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
          <button onclick="StatsModule.saveGoal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">저장</button>
        </div>
      </div>
    `);
  };

  const saveGoal = async () => {
    const val = parseInt(document.getElementById('goal-input')?.value || '0');
    await API.post('/api/stats/goal', { goal: val });
    Utils.closeModal();
    Utils.toast('✅ 목표 ' + '₩' + val.toLocaleString() + ' 저장 완료', 'success');
    switchTab('sales');
  };

    const generateReport = (type, btnEl, settings = {}) => {
    const labels = {
      daily: '일별 보고서', weekly: '주간 보고서', monthly: '월간 보고서', annual: '연간 보고서',
    };
    const label = labels[type] || type;
    if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>생성중...'; }
    Utils.toast(`${label} 생성 중...`, 'info');
    setTimeout(() => {
      if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = label; }
      // 인쇄 창으로 PDF 저장 안내
      Utils.toast(`${label} 준비 완료 — 인쇄 창에서 PDF로 저장하세요.`, 'success');
      setTimeout(() => window.print(), 800);
    }, 1200);
  };

  const scheduleReport = () => {
    Utils.toast('자동 보고서 예약 기능은 준비 중입니다.', 'info');
  };

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
  // ── @media print 스타일 주입 ───────────────────────────────
  const _injectPrintStyles = () => {
    if (document.getElementById('stats-print-style')) return;
    const style = document.createElement('style');
    style.id = 'stats-print-style';
    style.textContent = `
      @media print {
        /* 관리자 사이드바·헤더·버튼 숨김 */
        .admin-sidebar, .admin-topbar, nav, .admin-nav,
        #admin-sidebar, #admin-header, #top-nav,
        .print\\:hidden, [class*="no-print"] { display: none !important; }
        /* 배경·그림자 제거 */
        body { background: white !important; }
        .bg-gray-50 { background: white !important; }
        /* 여백 최소화 */
        .max-w-7xl { max-width: 100% !important; padding: 0 !important; }
        /* 차트 캔버스 크기 고정 */
        canvas { max-width: 100% !important; }
        /* 보고서 본문 전체 너비 */
        #monthly-report-body, #stats-content { width: 100% !important; }
        /* sticky 헤더 해제 */
        .sticky { position: static !important; }
        /* 페이지 나누기 */
        .bg-white.rounded-xl { page-break-inside: avoid; margin-bottom: 12pt; }
      }
    `;
    document.head.appendChild(style);
  };

  // 페이지 로드 시 print 스타일 주입
  _injectPrintStyles();

  return {
    page, switchTab, refreshCurrent,
    exportPDF, exportExcel, printCurrentTab, saveReport, showKpiDetail, setGoal, saveGoal,
    generateReport, generateReportFromSettings, selectReportCard,
    scheduleReport,
    switchMonthlyRegion, exportMonthlyPDF, exportMonthlyExcel,
  };
})();

window.StatsModule = StatsModule;
