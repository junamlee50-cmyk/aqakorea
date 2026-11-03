import { Hono } from 'hono'
import { SEARCH_PAGES, SEARCH_INTRO, searchPageUrl } from './data/searchPages'
import { serveStatic } from 'hono/cloudflare-workers'
import { REGIONS, SCHEDULES, SAMPLE_RESERVATIONS, SAMPLE_STATS, POPUPS, NOTICES, VEHICLES, WRISTBANDS, INQUIRIES, ADMIN_USERS } from './data/mockData'
import { SEO_CONFIG, REGION_SEO, COMMON_FAQ, SITEMAP_PAGES } from './data/seoData'

const app = new Hono()

// Static files
app.use('/static/*', serveStatic({ root: './public' }))

// Service Worker (PWA) - 웹 변경 시 앱 즉시 반영 + 오프라인 지원
app.get('/sw.js', (c) => {
  const version = 'AMK-v' + new Date().toISOString().slice(0,10).replace(/-/g,'')
  const sw = `
// AMK Service Worker - ${version}
// 웹 변경 시 앱 자동 업데이트 (Network First 전략)
const CACHE = '${version}';
const OFFLINE_PAGE = '/';
const STATIC_ASSETS = [
  '/', '/static/vendor/tailwind.min.css', '/static/vendor/fontawesome/css/all.min.css',
  '/static/vendor/axios.min.js', '/static/style.css',
  '/static/modules/core.js', '/static/modules/customer.js',
  '/static/modules/payment.js', '/static/modules/field.js',
  '/static/modules/admin.js', '/static/modules/stats.js',
  '/static/modules/seo.js', '/static/modules/ticket.js',
  '/static/app.js', '/static/qrcode.min.js',
  '/static/manifest.json', '/static/favicon.svg'
];

// 설치: 정적 에셋 캐시
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 삭제 (버전 업 시 자동 정리 → 앱에 즉시 반영)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network First (웹 최신 버전 우선, 오프라인 시 캐시)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // API 요청은 캐시 안 함
  if (url.pathname.startsWith('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 성공 시 캐시 갱신 (다음번 오프라인에서도 최신 버전)
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match(OFFLINE_PAGE)))
  );
});

// 새 SW 감지 시 클라이언트에 업데이트 알림
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
`.trim()
  return c.text(sw, 200, { 'Content-Type': 'application/javascript; charset=utf-8' })
})

// ============================================================
// SEO 유틸리티
// ============================================================
const buildMeta = (opts: {
  title?: string; description?: string; keywords?: string[];
  ogTitle?: string; ogDescription?: string; ogImage?: string;
  canonicalUrl?: string; noindex?: boolean;
  structuredData?: object | object[];
  googleVerification?: string; naverVerification?: string;
  breadcrumbs?: Array<{name:string;url:string}>;
}) => {
  const title = opts.title || SEO_CONFIG.defaultTitle
  const description = opts.description || SEO_CONFIG.defaultDescription
  const keywords = opts.keywords ? opts.keywords.join(',') : SEO_CONFIG.defaultKeywords
  const ogImage = opts.ogImage || SEO_CONFIG.defaultOgImage
  const canonical = opts.canonicalUrl || SEO_CONFIG.siteUrl
  const ogTitle = opts.ogTitle || title
  const ogDesc = opts.ogDescription || description
  const today = new Date().toISOString()

  const breadcrumbSchema = opts.breadcrumbs ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: opts.breadcrumbs.map((b, i) => ({
      '@type': 'ListItem', position: i + 1, name: b.name, item: b.url
    }))
  } : null

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    logo: SEO_CONFIG.organization.logo,
  }

  const schemas = [orgSchema]
  if (breadcrumbSchema) schemas.push(breadcrumbSchema)
  if (opts.structuredData) {
    if (Array.isArray(opts.structuredData)) schemas.push(...opts.structuredData)
    else schemas.push(opts.structuredData)
  }

  return `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords}">
    <meta name="robots" content="${opts.noindex ? 'noindex,nofollow' : 'index,follow'}">
    <meta name="author" content="${SEO_CONFIG.siteName}">
    <link rel="canonical" href="${canonical}">
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${SEO_CONFIG.siteName}">
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDesc}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${canonical}">
    <meta property="og:locale" content="${SEO_CONFIG.locale}">
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="${SEO_CONFIG.twitterHandle}">
    <meta name="twitter:title" content="${ogTitle}">
    <meta name="twitter:description" content="${ogDesc}">
    <meta name="twitter:image" content="${ogImage}">
    <!-- 카카오 -->
    <meta property="kakao:title" content="${ogTitle}">
    <meta property="kakao:description" content="${ogDesc}">
    <meta property="kakao:image" content="${ogImage}">
    <!-- 네이버 블로그 -->
    <meta name="naver-site-verification" content="${SEO_CONFIG.searchConsole.naverVerification}">
    <meta name="naver-site-verification" content="f5f90f2781e988017912f00d108f8f2ab81ab84b">
    ${SEO_CONFIG.searchConsole.googleVerification ? `<meta name="google-site-verification" content="${SEO_CONFIG.searchConsole.googleVerification}">` : ''}
    ${SEO_CONFIG.analytics.gaId ? `
    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${SEO_CONFIG.analytics.gaId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${SEO_CONFIG.analytics.gaId}', {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true
      });
    </script>` : ''}
    <!-- 구조화 데이터 -->
    <script type="application/ld+json">${JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)}</script>

  `.trim()
}

// ============================================================
// Google Search Console 인증 파일
// 네이버 www 버전 인증 파일
app.get('/naverc38252f7348d19a29771d1159ff3a6a8.html', (c) => {
  return c.text('naverc38252f7348d19a29771d1159ff3a6a8', 200, {
    'Content-Type': 'text/html; charset=utf-8',
  });
});

app.get('/googlee9064f654e79faa3.html', (c) => {
  return c.text('google-site-verification: googlee9064f654e79faa3.html', 200, {
    'Content-Type': 'text/html; charset=utf-8',
  });
});

// IndexNow 키 파일 (Bing / 네이버 색인 요청 프로토콜)
app.get('/e90d7f011f9a093356e5bf50b5961d8a.txt', (c) => {
  return c.text('e90d7f011f9a093356e5bf50b5961d8a', 200, { 'Content-Type': 'text/plain; charset=utf-8' });
});

// robots.txt
// ============================================================
app.get('/robots.txt', (c) => {
  const txt = `User-agent: *
Allow: /
Allow: /reservation/
Allow: /faq
Allow: /notice
Allow: /about
Allow: /inquiry
Allow: /content/
Allow: /amphibious-bus
Allow: /buyeo-amphibious-bus
Allow: /tongyeong-amphibious-bus
Allow: /busan-amphibious-bus

Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /mypage
Disallow: /ticket/
Disallow: /payment/
Disallow: /boarding/
Disallow: /reservation/check
Disallow: /reservation/detail/
Disallow: /booking-check
Disallow: /field
Disallow: /stats
Disallow: /qr/

Sitemap: ${SEO_CONFIG.siteUrl}/sitemap.xml
Sitemap: ${SEO_CONFIG.siteUrl}/sitemap-index.xml
`
  return c.text(txt, 200, { 'Content-Type': 'text/plain; charset=utf-8' })
})

// ============================================================
// sitemap.xml (동적 생성)
// ============================================================
app.get('/sitemap.xml', (c) => {
  const today = new Date().toISOString().split('T')[0]
  // hidden 지역 제외: open + preparing만 sitemap 포함 (부산 제외)
  const activeRegions = REGIONS.filter(r => (r.status === 'open' || r.status === 'preparing') && r.id !== 'busan')
  const regionUrls = activeRegions.map(r => `
  <url>
    <loc>${SEO_CONFIG.siteUrl}/reservation/${r.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${r.status === 'open' ? '0.9' : '0.5'}</priority>
  </url>`).join('')

  // SEO 랜딩 페이지 (수륙양용버스 검색어 타겟)
  const searchPageUrls = SEARCH_PAGES.map(p => `
  <url>
    <loc>${SEO_CONFIG.siteUrl}/${p.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')

  const staticPages = SITEMAP_PAGES.filter(p => !p.url.startsWith('/reservation/'))
  const staticUrls = staticPages.map(p => `
  <url>
    <loc>${SEO_CONFIG.siteUrl}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${searchPageUrls}
${regionUrls}
</urlset>`
  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

// sitemap-index.xml
app.get('/sitemap-index.xml', (c) => {
  const today = new Date().toISOString().split('T')[0]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SEO_CONFIG.siteUrl}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`
  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

// ============================================================
// API Proxy → 백엔드(Express 3001) 로 전달
// Cloudflare Pages 배포 시에는 Caddy /api/* → 3001 프록시가 담당
// 로컬 wrangler dev 시에도 /api/* 요청이 이 Worker를 거치므로 여기서 프록시
// ============================================================
const BACKEND_URL = 'http://127.0.0.1:3001'

app.all('/api/*', async (c) => {
  const url = new URL(c.req.url)
  const target = BACKEND_URL + url.pathname + url.search
  try {
    // Authorization Bearer JWT만 전달 (X-User-* 헤더 조작 차단)
    const forwardHeaders: Record<string, string> = {
      'content-type': c.req.header('content-type') || 'application/json',
    }
    const authHeader = c.req.header('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      forwardHeaders['authorization'] = authHeader
    }
    const init: RequestInit = {
      method: c.req.method,
      headers: forwardHeaders,
    }
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      init.body = await c.req.text()
    }
    const resp = await fetch(target, init)
    const text = await resp.text()
    return new Response(text, {
      status: resp.status,
      headers: { 'content-type': resp.headers.get('content-type') || 'application/json' },
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message, target }, 502)
  }
})

// ============================================================
// Legacy mock routes (fallback - kept for reference only)
// ============================================================
// 고객 API: hidden 지역 제외
app.get('/api/regions', (c) => {
  const isAdmin = c.req.header('x-admin-token') === 'true'
  const data = isAdmin ? REGIONS : REGIONS.filter(r => r.status !== 'hidden')
  return c.json({ success: true, data })
})
app.get('/api/regions/:id', (c) => {
  const region = REGIONS.find(r => r.id === c.req.param('id'))
  if (!region) return c.json({ success: false, message: '지역을 찾을 수 없습니다' }, 404)
  return c.json({ success: true, data: region })
})
app.get('/api/schedules/:regionId', (c) => {
  const regionId = c.req.param('regionId') as keyof typeof SCHEDULES
  return c.json({ success: true, data: SCHEDULES[regionId] || [] })
})
app.get('/api/reservations', (c) => c.json({ success: true, data: SAMPLE_RESERVATIONS }))
app.post('/api/reservations', async (c) => {
  const body = await c.req.json()
  const reservationId = `RES-2025-${String(Math.floor(Math.random() * 90000) + 10000).padStart(6,'0')}`
  const qrCode = `AMK-${reservationId}-${Date.now()}`
  return c.json({ success: true, data: { reservationId, qrCode, ...body, status: 'confirmed', payStatus: 'paid', createdAt: new Date().toISOString() } })
})
app.post('/api/payment/request', async (c) => {
  const body = await c.req.json()
  const region = REGIONS.find(r => r.id === body.regionId)
  return c.json({ success: true, data: { merchantId: region?.pgMerchant?.merchantId || 'unknown_mid', pgName: region?.pgMerchant?.pgName || 'PG사', orderId: `ORD-${Date.now()}`, amount: body.amount, seller: region?.company?.name, testMode: true } })
})
app.get('/api/stats', (c) => c.json({ success: true, data: SAMPLE_STATS }))
app.get('/api/popups', (c) => {
  const regionId = c.req.query('region') || 'all'
  const active = POPUPS.filter(p => p.active && (p.regions.includes('all') || p.regions.includes(regionId)))
  return c.json({ success: true, data: active })
})
app.get('/api/notices', (c) => c.json({ success: true, data: NOTICES }))
app.get('/api/vehicles/:regionId', (c) => {
  const regionId = c.req.param('regionId') as keyof typeof VEHICLES
  return c.json({ success: true, data: VEHICLES[regionId] || [] })
})
app.get('/api/wristbands', (c) => c.json({ success: true, data: WRISTBANDS }))
app.post('/api/wristbands/issue', async (c) => {
  const body = await c.req.json()
  const wristbandId = `WB-${String(Math.floor(Math.random() * 9000) + 1000)}`
  return c.json({ success: true, data: { id: wristbandId, ...body, status: 'issued', issuedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) } })
})
app.get('/api/inquiries', (c) => c.json({ success: true, data: INQUIRIES }))
app.post('/api/inquiries', async (c) => {
  const body = await c.req.json()
  return c.json({ success: true, data: { id: `INQ-${Date.now()}`, ...body, status: 'pending', date: new Date().toISOString().split('T')[0] } })
})
// /api/admin/* 는 모두 실제 백엔드로 통과 (mock 제거)
app.get('/api/seo/:regionId', (c) => {
  const regionId = c.req.param('regionId')
  const seo = REGION_SEO[regionId]
  if (!seo) return c.json({ success: false, message: 'SEO 데이터 없음' }, 404)
  return c.json({ success: true, data: seo })
})
app.get('/api/faq', (c) => {
  const regionId = c.req.query('region')
  if (regionId && REGION_SEO[regionId]) {
    return c.json({ success: true, data: { common: COMMON_FAQ, regional: REGION_SEO[regionId].faq } })
  }
  return c.json({ success: true, data: { common: COMMON_FAQ, regional: [] } })
})

// ============================================================
// HTML 빌더 (SEO 완전 지원)
// ============================================================
const buildPage = (metaTags: string, pageData?: { [key: string]: any }) => `<!DOCTYPE html>
<html lang="ko" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
${metaTags}
<meta name="theme-color" content="#0a2d6b">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="/static/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/static/apple-touch-icon.png">
<link rel="manifest" href="/static/manifest.json">
<link rel="stylesheet" href="/static/vendor/tailwind.min.css">
<link rel="stylesheet" href="/static/vendor/fontawesome/css/all.min.css">
<script src="/static/vendor/axios.min.js"></script>
<script src="/static/vendor/chart.umd.min.js"></script>
<script src="/static/qrcode.min.js"></script>
<link rel="stylesheet" href="/static/style.css">
<script>
window.tailwind=window.tailwind||{};window.tailwind.config={theme:{extend:{colors:{navy:{'50':'#f0f4ff','100':'#e0e9ff','600':'#1e3a8a','700':'#1e40af','800':'#0a2d6b','900':'#071f4e'},ocean:{'400':'#22d3ee','500':'#06b6d4','600':'#0891b2','700':'#0e7490'},mint:{'400':'#4ade80','500':'#22c55e','600':'#16a34a'}},fontFamily:{sans:['Noto Sans KR','Apple SD Gothic Neo','sans-serif']}}}}
window.__PAGE_DATA__ = ${JSON.stringify(pageData || {})}
</script>
</head>
<body class="bg-gray-50 font-sans">
<div id="app">${pageData?.searchIntro || ''}</div>
<div id="toast-container"></div>
<script src="/static/modules/core.js?v=6ccb093f49a9"></script>
<script src="/static/modules/customer.js?v=6ccb093f49a9"></script>
<script src="/static/modules/payment.js?v=6ccb093f49a9"></script>
<script src="/static/modules/field.js?v=6ccb093f49a9"></script>
<script src="/static/modules/admin.js?v=6ccb093f49a9"></script>
<script src="/static/modules/stats.js?v=6ccb093f49a9"></script>
<script src="/static/modules/seo.js?v=6ccb093f49a9"></script>
<script src="/static/modules/ticket.js?v=6ccb093f49a9"></script>
<script src="/static/app.js?v=6ccb093f49a9"></script>
<script>
// PWA Service Worker 등록 - 웹 변경 시 앱 자동 업데이트
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            // 새 버전 감지 → 자동 새로고침 (앱에서 즉시 반영)
            newSW.postMessage('skipWaiting');
            window.location.reload();
          }
        });
      });
    } catch(e) {}
  });
  // 컨트롤러 변경 시 자동 새로고침
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
}
</script>
</body>
</html>`

// ============================================================
// 공개 페이지 라우팅 (SEO 최적화)
// ============================================================

// 메인 홈
app.get('/', (c) => {
  const meta = buildMeta({
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    ogImage: SEO_CONFIG.defaultOgImage,
    canonicalUrl: SEO_CONFIG.siteUrl,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
      potentialAction: { '@type': 'SearchAction', target: `${SEO_CONFIG.siteUrl}/reservation?q={search_term_string}`, 'query-input': 'required name=search_term_string' }
    }
  })
  // searchIntro 제거: 홈페이지에서 검색어 링크 나열 영역 삭제 (지역 카드에 통합)
  return c.html(buildPage(meta, { page: 'home' }))
})

// 검색 유입용 공개 안내: 검색로봇과 방문자에게 동일한 실제 본문을 제공합니다.
// SEO 랜딩 페이지 렌더링 헬퍼
const renderFareTable = (fares: any[], fareNote: string) => `
  <section class="mb-10">
    <h2 class="text-xl font-bold mb-4">이용 요금</h2>
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead><tr class="bg-blue-50"><th class="border px-4 py-2 text-left">권종</th><th class="border px-4 py-2 text-right">요금</th></tr></thead>
        <tbody>${fares.map((f:any) => `<tr><td class="border px-4 py-2">${f.label}</td><td class="border px-4 py-2 text-right">${f.price === 0 ? '무료' : f.price.toLocaleString() + '원'}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <p class="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded">⚠️ ${fareNote}</p>
  </section>`

const renderScheduleBox = (schedules: string[], duration: number, note: string) => `
  <section class="mb-10">
    <h2 class="text-xl font-bold mb-4">운행 시간표</h2>
    <div class="flex flex-wrap gap-2 mb-3">${schedules.map((t:string) => `<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">${t}</span>`).join('')}</div>
    <p class="text-sm text-gray-600">▶ 1회 소요시간: 약 ${duration}분</p>
    <p class="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded">⚠️ ${note}</p>
  </section>`

const renderInfoBox = (info: any) => `
  <section class="mb-10 bg-gray-50 rounded-xl p-5">
    <h2 class="text-xl font-bold mb-4">이용 안내 / 타는 곣</h2>
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div><dt class="font-semibold text-gray-500">운영사</dt><dd>${info.operator || '미정'}</dd></div>
      <div><dt class="font-semibold text-gray-500">탑승장</dt><dd>${info.boarding || '미정'}</dd></div>
      <div class="sm:col-span-2"><dt class="font-semibold text-gray-500">주소</dt><dd>${info.address || '미정'}</dd></div>
      <div><dt class="font-semibold text-gray-500">주차</dt><dd>${info.parking || '미정'}</dd></div>
      <div><dt class="font-semibold text-gray-500">연락처</dt><dd>${info.phone || (info.phoneNote || '정식 운행 전 미확정')}</dd></div>
    </dl>
  </section>`

const renderFaq = (faq: any[]) => `
  <section class="mb-10">
    <h2 class="text-xl font-bold mb-4">자주 묻는 질문</h2>
    <dl class="space-y-4">${faq.map((f:any) => `
      <div class="bg-white border rounded-xl p-4">
        <dt class="font-semibold text-gray-800 mb-1">Q. ${f.q}</dt>
        <dd class="text-sm text-gray-600 leading-relaxed">A. ${f.a}</dd>
      </div>`).join('')}
    </dl>
  </section>`

for (const page of SEARCH_PAGES) {
  app.get('/' + page.slug, (c) => {
    const canonical = searchPageUrl(page.slug)
    const p = page as any
    const structuredData: any[] = [
      { '@context': 'https://schema.org', '@type': 'Organization', name: '아쿠아모빌리티코리아', url: 'https://aquamobility.co.kr', logo: 'https://aquamobility.co.kr/static/logo.png' },
      { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: page.description, url: canonical },
    ]
    if (p.faq) {
      structuredData.push({ '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: p.faq.map((f:any) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) })
    }
    const meta = buildMeta({ title: page.title, description: page.description, canonicalUrl: canonical, structuredData })

    // 로컬비즈니스 스키마 (info가 있는 지역 페이지)
    const infoSection = p.info ? renderInfoBox(p.info) : ''
    const fareSection = p.info?.fares ? renderFareTable(p.info.fares, p.info.fareNote) : ''
    const schedSection = p.info?.schedules ? renderScheduleBox(p.info.schedules, p.info.duration, p.info.scheduleNote) : ''
    const faqSection = p.faq ? renderFaq(p.faq) : ''

    const navLinks = [
      p.reservation ? `<a class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm" href="${p.reservation}">예약 시스템 테스트</a>` : '',
      `<a class="inline-block border border-blue-600 text-blue-700 px-4 py-2 rounded-lg text-sm" href="/reservation">통합 예약</a>`,
      `<a class="inline-block border border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm" href="/inquiry">문의</a>`,
      `<a class="inline-block border border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm" href="/notice">운영 공지</a>`,
    ].filter(Boolean).join('')

    return c.html(`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${meta}<link rel="icon" href="/static/favicon.svg"><link rel="stylesheet" href="/static/vendor/tailwind.min.css"></head><body class="bg-gray-50 text-gray-800">
<header class="bg-white border-b sticky top-0 z-10">
  <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
    <a href="/" class="font-bold text-blue-700 text-lg">아쿠아모빌리티코리아</a>
    <nav class="hidden sm:flex gap-4 text-sm">
      <a href="/reservation" class="text-gray-600 hover:text-blue-700">예약</a>
      <a href="/notice" class="text-gray-600 hover:text-blue-700">공지</a>
      <a href="/inquiry" class="text-gray-600 hover:text-blue-700">문의</a>
    </nav>
  </div>
</header>
<main class="max-w-4xl mx-auto px-4 py-10">
  <nav class="text-xs text-gray-400 mb-6" aria-label="breadcrumb">
    <a href="/">홈</a> &rsaquo; <a href="/amphibious-bus">수륙양용버스 안내</a> &rsaquo; <span>${page.heading}</span>
  </nav>
  <h1 class="text-2xl sm:text-3xl font-bold mb-6">${page.heading}</h1>
  <div class="prose max-w-none mb-8">${page.paragraphs.map((text:string) => `<p class="mb-4 leading-relaxed text-gray-700">${text}</p>`).join('')}</div>
  <nav class="flex flex-wrap gap-3 mb-10" aria-label="서비스 바로가기">${navLinks}</nav>
  ${infoSection}${fareSection}${schedSection}${faqSection}
  ${SEARCH_INTRO}
</main>
<footer class="bg-gray-800 text-gray-300 text-xs py-8 mt-16">
  <div class="max-w-4xl mx-auto px-4">
    <p class="mb-1 font-semibold text-white">아쿠아모빌리티코리아 (Aqua Mobility Korea)</p>
    <p>수륙양용버스 · 수륙양용시티투어버스 통합 예약·운영솔루션</p>
    <div class="mt-4 flex flex-wrap gap-4">
      <a href="/" class="hover:text-white">홈</a>
      <a href="/amphibious-bus" class="hover:text-white">수륙양용버스 안내</a>
      <a href="/buyeo-amphibious-bus" class="hover:text-white">부여 안내</a>
      <a href="/tongyeong-amphibious-bus" class="hover:text-white">통영 안내</a>
      <a href="/busan-amphibious-bus" class="hover:text-white">부산 안내</a>
      <a href="/inquiry" class="hover:text-white">문의</a>
    </div>
  </div>
</footer>
</body></html>`)
  })
}

// 예약 상세 페이지 (SPA 라우팅용 서버 라우트)
app.get('/reservation/detail/:reservationNo', (c) => {
  const reservationNo = c.req.param('reservationNo')
  const meta = buildMeta({
    title: `예약 상세 ${reservationNo} | 아쿠아모빌리티코리아`,
    description: '예약 상세 내역을 확인하세요.',
    noindex: true,
    canonicalUrl: `${SEO_CONFIG.siteUrl}/reservation/detail/${reservationNo}`,
  })
  return c.html(buildPage(meta, { page: 'booking-check' }))
})

// 예약 확인/취소 페이지
app.get('/reservation/check', (c) => {
  const meta = buildMeta({
    title: '예약 확인/취소 | 아쿠아모빌리티코리아',
    noindex: true,
    description: '예약번호와 휴대폰번호로 예약 내역을 확인하고 취소하세요.',
    keywords: ['예약확인','예약취소','탑승권 확인'],
    canonicalUrl: `${SEO_CONFIG.siteUrl}/reservation/check`,
    breadcrumbs: [
      { name: '홈', url: SEO_CONFIG.siteUrl },
      { name: '예약 확인', url: `${SEO_CONFIG.siteUrl}/reservation/check` },
    ]
  })
  return c.html(buildPage(meta, { page: 'booking-check' }))
})

// 예약 허브
app.get('/reservation', (c) => {
  const meta = buildMeta({
    title: '수륙양용투어 예약 | 통영·부여·합천 | 아쿠아모빌리티코리아',
    description: '통영·부여·합천 수륙양용버스 투어 예약. 각 지역별 운행시간, 요금, 잔여석을 확인하고 바로 예약하세요.',
    keywords: ['수륙양용버스 예약','수륙양용투어 예약','통영 수륙양용버스','부여 수륙양용버스','합천 수륙양용버스'],
    canonicalUrl: `${SEO_CONFIG.siteUrl}/reservation`,
    breadcrumbs: [
      { name: '홈', url: SEO_CONFIG.siteUrl },
      { name: '수륙양용투어 예약', url: `${SEO_CONFIG.siteUrl}/reservation` },
    ]
  })
  return c.html(buildPage(meta, { page: 'reservation-hub' }))
})

// 지역별 예약 페이지 (SEO 핵심)
app.get('/reservation/:regionId', (c) => {
  const regionId = c.req.param('regionId')
  const region = REGIONS.find(r => r.id === regionId)
  const seo = REGION_SEO[regionId]
  if (!region) {
    const meta = buildMeta({ title: '페이지를 찾을 수 없습니다 | 아쿠아모빌리티코리아', noindex: true })
    return c.html(buildPage(meta, { page: '404' }), 404)
  }
  if (seo) {
    const meta = buildMeta({
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      ogTitle: seo.ogTitle,
      ogDescription: seo.ogDescription,
      ogImage: seo.ogImage,
      canonicalUrl: seo.canonicalUrl,
      breadcrumbs: seo.breadcrumbs,
      structuredData: { '@context': 'https://schema.org', '@type': 'WebPage', name: seo.title, description: seo.description, url: seo.canonicalUrl }
    })
    return c.html(buildPage(meta, { page: 'reservation', regionId, seo }))
  }
  const meta = buildMeta({
    title: `${region.name} 예약 | 아쿠아모빌리티코리아`,
    description: region.description,
    canonicalUrl: `${SEO_CONFIG.siteUrl}/reservation/${regionId}`,
  })
  return c.html(buildPage(meta, { page: 'reservation', regionId }))
})

// FAQ 페이지
app.get('/faq', (c) => {
  const meta = buildMeta({
    title: '자주 묻는 질문 (FAQ) | 아쿠아모빌리티코리아',
    description: '수륙양용버스 예약, 요금, 탑승 방법, QR 손목밴드, 환불 규정 등 자주 묻는 질문을 확인하세요.',
    keywords: ['수륙양용버스 FAQ','수륙양용버스 예약 방법','수륙양용버스 요금','환불 정책','QR 손목밴드'],
    canonicalUrl: `${SEO_CONFIG.siteUrl}/faq`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [...COMMON_FAQ, ...Object.values(REGION_SEO).flatMap(s => s.faq)].map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    },
    breadcrumbs: [
      { name: '홈', url: SEO_CONFIG.siteUrl },
      { name: '자주 묻는 질문', url: `${SEO_CONFIG.siteUrl}/faq` },
    ]
  })
  return c.html(buildPage(meta, { page: 'faq' }))
})

// 관광 콘텐츠 페이지
app.get('/content/:slug', (c) => {
  const slug = c.req.param('slug')
  const contentMap: Record<string, { title: string; desc: string; region: string }> = {
    'buyeo-daytrip': { title: '부여 당일치기 여행코스: 수륙양용버스+백제역사유적지구', desc: '부여 수륙양용버스를 타고 백제 역사를 만나는 완벽한 당일치기 코스를 소개합니다.', region: 'buyeo' },
    'buyeo-family': { title: '부여 아이와 가볼만한 곳 BEST 5 + 수륙양용버스', desc: '아이들이 열광하는 부여 수륙양용버스와 가족여행 명소를 소개합니다.', region: 'buyeo' },
    'tongyeong-marine': { title: '통영 해양관광 추천코스: 수륙양용버스+한려수도', desc: '통영 수륙양용버스로 시작하는 최고의 해양관광 코스를 안내합니다.', region: 'tongyeong' },
    'hapcheon-family': { title: '합천 가족여행 추천코스: 수륙양용버스+해인사', desc: '합천 수륙양용버스 탑승 후 해인사까지, 경남 합천 가족여행 완성 코스.', region: 'hapcheon' },
  }
  const content = contentMap[slug]
  const meta = buildMeta({
    title: content ? `${content.title} | 아쿠아모빌리티코리아` : '관광 콘텐츠 | 아쿠아모빌리티코리아',
    description: content?.desc || '수륙양용버스와 함께하는 특별한 여행 콘텐츠',
    canonicalUrl: `${SEO_CONFIG.siteUrl}/content/${slug}`,
  })
  return c.html(buildPage(meta, { page: 'content', slug, content }))
})

// 공지사항
app.get('/notice', (c) => {
  const meta = buildMeta({
    title: '공지사항 | 아쿠아모빌리티코리아',
    description: '아쿠아모빌리티코리아 운행 공지, 이벤트, 요금 변경, 운휴 안내 등 최신 공지사항을 확인하세요.',
    canonicalUrl: `${SEO_CONFIG.siteUrl}/notice`,
    breadcrumbs: [
      { name: '홈', url: SEO_CONFIG.siteUrl },
      { name: '공지사항', url: `${SEO_CONFIG.siteUrl}/notice` },
    ]
  })
  return c.html(buildPage(meta, { page: 'notice' }))
})

// 회사 소개
app.get('/about', (c) => {
  const meta = buildMeta({
    title: '아쿠아모빌리티코리아 소개 | 전국 수륙양용투어 플랫폼',
    description: '아쿠아모빌리티코리아는 전국 수륙양용버스 투어를 운영·연결하는 통합 플랫폼입니다. 통영, 부여, 합천에서 수륙양용 관광을 경험하세요.',
    canonicalUrl: `${SEO_CONFIG.siteUrl}/about`,
  })
  return c.html(buildPage(meta, { page: 'about' }))
})

// 문의하기
app.get('/inquiry', (c) => {
  const meta = buildMeta({
    title: '고객문의 | 아쿠아모빌리티코리아',
    description: '예약문의, 환불문의, 단체예약 문의 등 고객 문의를 남겨주세요. 빠르게 답변 드리겠습니다.',
    canonicalUrl: `${SEO_CONFIG.siteUrl}/inquiry`,
  })
  return c.html(buildPage(meta, { page: 'inquiry' }))
})

// 예약 확인/취소 (두 경로 모두 지원)
app.get('/booking-check', (c) => {
  const meta = buildMeta({
    title: '예약 확인/취소 | 아쿠아모빌리티코리아',
    description: '예약번호로 탑승권을 확인하거나 예약을 취소·변경하세요.',
    noindex: true,
  })
  return c.html(buildPage(meta, { page: 'booking-check' }))
})
app.get('/booking/check', (c) => {
  const meta = buildMeta({
    title: '예약 확인/취소 | 아쿠아모빌리티코리아',
    description: '예약번호로 탑승권을 확인하거나 예약을 취소·변경하세요.',
    noindex: true,
  })
  return c.html(buildPage(meta, { page: 'booking-check' }))
})

// 관광 콘텐츠 목록
app.get('/content', (c) => {
  const meta = buildMeta({
    title: '수륙양용버스 여행 가이드 | 부여·통영·합천 관광코스',
    description: '부여, 통영, 합천 수륙양용버스와 함께하는 추천 여행코스, 당일치기, 가족여행 콘텐츠를 확인하세요.',
    keywords: ['수륙양용버스 여행코스','부여 당일치기','통영 해양관광','합천 가족여행','수륙양용버스 추천'],
    canonicalUrl: `${SEO_CONFIG.siteUrl}/content`,
    breadcrumbs: [
      { name: '홈', url: SEO_CONFIG.siteUrl },
      { name: '여행 가이드', url: `${SEO_CONFIG.siteUrl}/content` },
    ]
  })
  return c.html(buildPage(meta, { page: 'content-list' }))
})

// 현장매표소 (noindex)
app.get('/field', (c) => {
  const meta = buildMeta({
    title: '현장매표소 | 아쿠아모빌리티코리아',
    description: '현장 QR 체크인, 손목밴드 발급, 현장 판매 대시보드',
    noindex: true,
  })
  return c.html(buildPage(meta, { page: 'field' }))
})

// 통계/보고서 (noindex)
app.get('/stats', (c) => {
  const meta = buildMeta({
    title: '통계/보고서 | 아쿠아모빌리티코리아',
    description: '매출, 승객, 운영, 마케팅 통계 및 보고서',
    noindex: true,
  })
  return c.html(buildPage(meta, { page: 'stats' }))
})

// 탑승권 QR 페이지 (noindex)
app.get('/ticket/:reservationId', (c) => {
  const meta = buildMeta({
    title: 'QR 탑승권 | 아쿠아모빌리티코리아',
    noindex: true,
  })
  return c.html(buildPage(meta, { page: 'ticket', reservationId: c.req.param('reservationId') }))
})

// ============================================================
// 관리자 페이지 (noindex)
// ============================================================
const adminMeta = buildMeta({
  title: '관리자 | 아쿠아모빌리티코리아',
  noindex: true,
})

app.get('/admin', (c) => c.html(buildPage(adminMeta, { page: 'admin-login' })))
app.get('/admin/*', (c) => {
  const path = c.req.path.replace('/admin/', '')
  return c.html(buildPage(adminMeta, { page: 'admin', subPage: path }))
})

// 404
app.get('*', (c) => {
  const meta = buildMeta({ title: '페이지를 찾을 수 없습니다 | 아쿠아모빌리티코리아', noindex: true })
  return c.html(buildPage(meta, { page: '404' }), 404)
})

export default app
