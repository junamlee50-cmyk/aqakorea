import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { REGIONS, SCHEDULES, SAMPLE_RESERVATIONS, SAMPLE_STATS, POPUPS, NOTICES, VEHICLES, WRISTBANDS, INQUIRIES, ADMIN_USERS } from './data/mockData'
import { SEO_CONFIG, REGION_SEO, COMMON_FAQ, SITEMAP_PAGES } from './data/seoData'

const app = new Hono()

// Static files
app.use('/static/*', serveStatic({ root: './public' }))

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
    contactPoint: SEO_CONFIG.organization.contactPoint,
    sameAs: SEO_CONFIG.organization.sameAs,
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
    ${SEO_CONFIG.searchConsole.googleVerification ? `<meta name="google-site-verification" content="${SEO_CONFIG.searchConsole.googleVerification}">` : ''}
    <!-- 구조화 데이터 -->
    <script type="application/ld+json">${JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)}</script>
    <meta property="article:modified_time" content="${today}">
  `.trim()
}

// ============================================================
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

Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /mypage
Disallow: /ticket/
Disallow: /payment/
Disallow: /boarding/

# 검색봇별 크롤링 속도 조절
User-agent: Googlebot
Crawl-delay: 1

User-agent: Yeti
Crawl-delay: 1

Sitemap: ${SEO_CONFIG.siteUrl}/sitemap.xml
`
  return c.text(txt, 200, { 'Content-Type': 'text/plain; charset=utf-8' })
})

// ============================================================
// sitemap.xml (동적 생성)
// ============================================================
app.get('/sitemap.xml', (c) => {
  const today = new Date().toISOString().split('T')[0]
  const activeRegions = REGIONS.filter(r => r.status === 'active' || r.status === 'preparing')
  const regionUrls = activeRegions.map(r => `
  <url>
    <loc>${SEO_CONFIG.siteUrl}/reservation/${r.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${r.status === 'active' ? '0.9' : '0.5'}</priority>
  </url>`).join('')

  const staticUrls = SITEMAP_PAGES.map(p => `
  <url>
    <loc>${SEO_CONFIG.siteUrl}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${staticUrls}
  ${regionUrls}
</urlset>`
  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

// ============================================================
// API Routes
// ============================================================
app.get('/api/regions', (c) => c.json({ success: true, data: REGIONS }))
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
app.get('/api/admin/users', (c) => c.json({ success: true, data: ADMIN_USERS }))
app.post('/api/admin/login', async (c) => {
  const body = await c.req.json()
  const user = ADMIN_USERS.find(u => u.email === body.email)
  if (user && body.password === 'admin1234') {
    return c.json({ success: true, data: { token: 'mock-token-' + user.id, user } })
  }
  return c.json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다' }, 401)
})
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
const buildPage = (metaTags: string, pageData?: object) => `<!DOCTYPE html>
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
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
<link rel="stylesheet" href="/static/style.css">
<script>
tailwind.config={theme:{extend:{colors:{navy:{'50':'#f0f4ff','100':'#e0e9ff','600':'#1e3a8a','700':'#1e40af','800':'#0a2d6b','900':'#071f4e'},ocean:{'400':'#22d3ee','500':'#06b6d4','600':'#0891b2','700':'#0e7490'},mint:{'400':'#4ade80','500':'#22c55e','600':'#16a34a'}},fontFamily:{sans:['Noto Sans KR','Apple SD Gothic Neo','sans-serif']}}}}
window.__PAGE_DATA__ = ${JSON.stringify(pageData || {})}
</script>
</head>
<body class="bg-gray-50 font-sans">
<div id="app"></div>
<div id="toast-container"></div>
<script src="/static/modules/core.js"></script>
<script src="/static/modules/customer.js"></script>
<script src="/static/modules/payment.js"></script>
<script src="/static/modules/field.js"></script>
<script src="/static/modules/admin.js"></script>
<script src="/static/modules/stats.js"></script>
<script src="/static/modules/seo.js"></script>
<script src="/static/app.js"></script>
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
  return c.html(buildPage(meta, { page: 'home' }))
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
      structuredData: [
        { '@context': 'https://schema.org', ...seo.localBusiness },
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: region.name,
          provider: { '@type': 'Organization', name: region.company?.name || SEO_CONFIG.siteName },
          areaServed: { '@type': 'Place', name: region.name },
          description: region.description,
          url: seo.canonicalUrl,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: seo.faq.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a }
          }))
        }
      ]
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
