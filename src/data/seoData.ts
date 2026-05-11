// ============================================================
// 아쿠아모빌리티코리아 - SEO 데이터
// ============================================================

export const SEO_CONFIG = {
  siteName: '아쿠아모빌리티코리아',
  siteNameEn: 'Aqua Mobility Korea',
  siteUrl: 'https://aquamobility.kr',
  defaultTitle: '아쿠아모빌리티코리아 | 전국 수륙양용투어 통합예약 플랫폼',
  defaultDescription: '통영·부여·합천 수륙양용버스 온라인 예약. QR 탑승권, QR 손목밴드 발급, 현장판매까지 한 번에. 전국 수륙양용투어 통합 예약·결제·운영 플랫폼.',
  defaultOgImage: 'https://aquamobility.kr/static/og-default.jpg',
  defaultKeywords: '수륙양용버스,수륙양용투어,수륙양용버스예약,수륙양용시티투어,아쿠아모빌리티,아쿠아모빌리티코리아,amphibious bus,수륙양용관광',
  twitterHandle: '@aquamobilitykr',
  locale: 'ko_KR',
  organization: {
    name: '아쿠아모빌리티코리아',
    url: 'https://aquamobility.kr',
    logo: 'https://aquamobility.kr/static/logo.png',
    contactPoint: {
      telephone: '1588-0000',
      contactType: 'customer service',
      areaServed: 'KR',
      availableLanguage: 'Korean',
    },
    sameAs: [
      'https://www.instagram.com/aquamobilitykr',
      'https://www.youtube.com/@aquamobilitykr',
      'https://blog.naver.com/aquamobilitykr',
    ],
  },
  // 구글/네이버 서치콘솔 소유확인 코드 (관리자에서 수정 가능)
  searchConsole: {
    googleVerification: '', // 예: 'abc123def456'
    naverVerification: '', // 예: 'abc123def456'
    bingVerification: '',
  },
  // 분석 도구 코드 (관리자에서 수정 가능)
  analytics: {
    gaId: '', // Google Analytics 4 ID
    naverAnalyticsId: '', // 네이버 애널리틱스 ID
    kakaoPixelId: '',
    metaPixelId: '',
  },
};

export const REGION_SEO: Record<string, {
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
  h1: string;
  h2s: string[];
  localBusiness: Record<string, unknown>;
  faq: Array<{ q: string; a: string }>;
  tourContent: Array<{ title: string; description: string; keywords: string[] }>;
  breadcrumbs: Array<{ name: string; url: string }>;
  smartplace: {
    businessName: string;
    address: string;
    phone: string;
    openingHours: string;
    reservationUrl: string;
    representativeImage: string;
  };
}> = {
  buyeo: {
    title: '부여 수륙양용버스 예약 | 아쿠아모빌리티코리아',
    description: '부여 백마강에서 즐기는 수륙양용버스 시티투어. 온라인 예약, QR 탑승권, QR 손목밴드, 주변 관광지 안내까지 한 번에 확인하세요. 성인 30,000원, 어린이 20,000원.',
    keywords: [
      '부여 수륙양용버스', '부여 수륙양용투어', '부여 수륙양용 시티투어',
      '백마강 수륙양용버스', '부여 관광', '부여 여행', '부여 아이와 가볼만한 곳',
      '부여 가족여행', '부여 체험여행', '부여 당일치기', '충남 부여 관광',
      '수륙양용버스 예약', '수륙양용버스 부여', '아쿠아모빌리티 부여',
      '구드래 나루터', '백마강 관광', '부여 수상투어',
    ],
    ogTitle: '부여 백마강 수륙양용버스 투어 | 아쿠아모빌리티코리아',
    ogDescription: '백제의 고도 부여! 백마강을 수륙양용버스로 누비는 특별한 역사문화 투어. 지금 바로 예약하세요.',
    ogImage: 'https://aquamobility.kr/static/og-buyeo.jpg',
    canonicalUrl: 'https://aquamobility.kr/reservation/buyeo',
    h1: '부여 수륙양용버스 투어 예약',
    h2s: [
      '백마강 수륙양용버스 코스 안내',
      '부여 수륙양용투어 운행시간 및 요금',
      '부여 수륙양용버스 예약 방법',
      '탑승장 위치 및 주차 안내',
      '부여 주변 관광지 추천',
    ],
    localBusiness: {
      '@type': 'TouristAttraction',
      name: '부여 수륙양용투어',
      description: '부여 백마강에서 즐기는 수륙양용버스 역사문화 투어',
      url: 'https://aquamobility.kr/reservation/buyeo',
      telephone: '041-830-0000',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '구드래로 1',
        addressLocality: '부여군',
        addressRegion: '충청남도',
        postalCode: '33133',
        addressCountry: 'KR',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 36.2756, longitude: 126.9099 },
      priceRange: '₩₩',
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '09:30', closes: '17:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday','Sunday'], opens: '09:00', closes: '18:00' },
      ],
      image: 'https://aquamobility.kr/static/og-buyeo.jpg',
    },
    faq: [
      { q: '부여 수륙양용버스는 어디서 타나요?', a: '부여 구드래 나루터 수변공원에서 탑승하실 수 있습니다. 주소: 충남 부여군 부여읍 구드래로. 구드래 공영주차장을 이용하시면 편리합니다.' },
      { q: '부여 수륙양용투어 예약은 어떻게 하나요?', a: '아쿠아모빌리티코리아 홈페이지(aquamobility.kr)에서 원하는 날짜와 회차를 선택하고 온라인으로 예약하실 수 있습니다. 현장 매표소에서도 잔여석 범위 내 구매 가능합니다.' },
      { q: '부여 수륙양용버스 요금은 얼마인가요?', a: '성인 30,000원 / 청소년 25,000원 / 어린이(만4세~13세) 20,000원 / 경로(만65세이상) 25,000원 / 지역민 20,000원입니다. 단체(20인 이상)는 25,000원이 적용됩니다.' },
      { q: '현장판매도 가능한가요?', a: '네, 현장 매표소에서도 잔여석 범위 내에서 구매하실 수 있습니다. 단, 성수기·주말에는 온라인 예약 좌석 위주로 운영되어 현장 잔여석이 적을 수 있으니 온라인 예약을 권장합니다.' },
      { q: '비가 오면 운행하나요?', a: '경미한 비는 우산 착용 후 운행합니다. 강풍, 폭우, 기상특보 발령 시에는 안전을 위해 운휴할 수 있으며, 이 경우 사전에 문자/알림톡으로 안내드립니다.' },
      { q: '기상악화 시 환불되나요?', a: '운영 측 귀책(기상악화, 차량 점검 등)으로 인한 운휴 시 전액 환불 또는 일정 변경이 가능합니다. 고객 귀책 당일 취소는 환불이 불가합니다.' },
      { q: '어린이 요금 기준은 어떻게 되나요?', a: '만 4세~13세 어린이 요금(20,000원)이 적용됩니다. 만 36개월 미만 유아는 무료이나 좌석이 제공되지 않습니다. 탑승 시 증빙 확인이 있을 수 있습니다.' },
      { q: '단체예약은 가능한가요?', a: '20인 이상 단체예약은 홈페이지 단체예약 문의 메뉴를 통해 신청하시면 담당자가 안내드립니다. 단체 전용 요금 및 별도 서비스가 제공됩니다.' },
      { q: 'QR 손목밴드는 무엇인가요?', a: '현장 탑승 확인 수단입니다. 온라인 예약 고객은 현장 도착 후 모바일 QR을 제시하면 직원이 확인 후 QR 손목밴드를 발급해 드립니다. 탑승 직전 손목밴드 QR을 스캔하여 최종 탑승 처리됩니다.' },
      { q: '예약 취소 및 환불 규정은 어떻게 되나요?', a: '탑승 3일 전까지 취소 시 전액 환불, 탑승 1일 전 취소 시 50% 환불, 당일 취소는 환불 불가합니다. 환불 주체는 부여수륙양용투어 운영법인이며, 결제 수단에 따라 3~5 영업일 소요됩니다.' },
    ],
    tourContent: [
      {
        title: '부여 당일치기 여행코스: 수륙양용버스 + 백제역사유적지구',
        description: '오전 구드래 나루터 수륙양용버스 탑승 → 백마강 낙화암 전망 → 오후 국립부여박물관 → 부소산성 → 정림사지 → 저녁 굿드래 맛집. 하루에 부여 핵심 명소를 모두 즐기는 코스.',
        keywords: ['부여 당일치기', '부여 여행코스', '부여 수륙양용버스', '부여 볼거리'],
      },
      {
        title: '부여 아이와 가볼만한 곳 BEST 5 + 수륙양용버스',
        description: '아이들이 열광하는 부여 수륙양용버스 체험! 육상에서 수상으로 쾅! 진입하는 순간이 최고의 포인트. 부여 국립박물관, 백제문화단지, 수륙양용버스까지 가족여행 완성.',
        keywords: ['부여 아이와 가볼만한 곳', '부여 가족여행', '부여 체험', '부여 아이 여행'],
      },
      {
        title: '백마강 수륙양용버스 탑승 후기 & 예약 팁',
        description: '백마강 수상 구간에서 바라보는 낙화암의 풍경은 정말 특별합니다. 탑승 팁, 예약 방법, 주차 안내, 주변 맛집까지 실제 방문 후기를 바탕으로 정리했습니다.',
        keywords: ['부여 수륙양용버스 후기', '백마강 수상투어', '부여 투어 후기', '수륙양용버스 탑승기'],
      },
    ],
    breadcrumbs: [
      { name: '홈', url: 'https://aquamobility.kr' },
      { name: '수륙양용투어 예약', url: 'https://aquamobility.kr/reservation' },
      { name: '부여 수륙양용투어', url: 'https://aquamobility.kr/reservation/buyeo' },
    ],
    smartplace: {
      businessName: '부여수륙양용투어 (아쿠아모빌리티코리아)',
      address: '충남 부여군 부여읍 구드래로 1',
      phone: '041-830-0000',
      openingHours: '매일 09:30~17:00 (기상악화 시 운휴)',
      reservationUrl: 'https://aquamobility.kr/reservation/buyeo',
      representativeImage: 'https://aquamobility.kr/static/og-buyeo.jpg',
    },
  },
  tongyeong: {
    title: '통영 수륙양용투어 예약 | 아쿠아모빌리티코리아',
    description: '통영에서 즐기는 해양관광형 수륙양용버스 투어. 한려해상국립공원 수상 구간을 수륙양용버스로! 예약, 코스, 요금, 운행시간을 확인하세요. 성인 35,000원.',
    keywords: [
      '통영 수륙양용버스', '통영 수륙양용투어', '통영 해양관광',
      '통영 관광', '통영 가족여행', '통영 여행', '한려해상 수륙양용버스',
      '통영 도남항 투어', '통영 수상관광', '통영 아이와 가볼만한 곳',
      '수륙양용버스 통영', '아쿠아모빌리티 통영', '통영 당일치기',
    ],
    ogTitle: '통영 한려해상 수륙양용버스 투어 | 아쿠아모빌리티코리아',
    ogDescription: '아름다운 한려해상국립공원을 수륙양용버스로! 통영 도남항에서 출발하는 해양 어드벤처. 지금 예약하세요.',
    ogImage: 'https://aquamobility.kr/static/og-tongyeong.jpg',
    canonicalUrl: 'https://aquamobility.kr/reservation/tongyeong',
    h1: '통영 수륙양용버스 해양투어 예약',
    h2s: [
      '통영 한려해상 수륙양용버스 코스',
      '통영 수륙양용투어 운행시간 및 요금',
      '통영 해양관광 예약 방법',
      '도남항 탑승장 위치 안내',
      '통영 주변 관광지 추천',
    ],
    localBusiness: {
      '@type': 'TouristAttraction',
      name: '통영 수륙양용투어',
      description: '통영 한려해상국립공원에서 즐기는 수륙양용버스 해양관광 투어',
      url: 'https://aquamobility.kr/reservation/tongyeong',
      telephone: '055-640-0000',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '도남관광단지 수상레저 선착장',
        addressLocality: '통영시',
        addressRegion: '경상남도',
        postalCode: '53054',
        addressCountry: 'KR',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 34.8544, longitude: 128.4334 },
      priceRange: '₩₩',
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '09:30', closes: '17:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday','Sunday'], opens: '09:00', closes: '18:00' },
      ],
      image: 'https://aquamobility.kr/static/og-tongyeong.jpg',
    },
    faq: [
      { q: '통영 수륙양용버스는 어디서 타나요?', a: '통영 도남관광단지 수상레저 선착장에서 탑승하실 수 있습니다. 도남관광단지 공영주차장(무료)을 이용하시면 편리합니다.' },
      { q: '통영 수륙양용투어 예약 방법은?', a: '아쿠아모빌리티코리아 홈페이지에서 날짜와 회차를 선택하여 온라인 예약하실 수 있습니다. 현장 매표소에서도 잔여석 범위 내 구매 가능합니다.' },
      { q: '통영 수륙양용버스 요금은?', a: '성인 35,000원 / 청소년 30,000원 / 어린이 25,000원 / 경로 30,000원 / 지역민 28,000원입니다. 단체(20인↑) 30,000원.' },
      { q: '통영 수륙양용버스 코스는 어떻게 되나요?', a: '도남항 출발 → 한려수도 수상 구간 → 미륵산 전망 포인트 → 도남항 귀환으로 약 1시간 30분 소요됩니다.' },
      { q: '기상악화 시 운행은 어떻게 되나요?', a: '해상 구간이 포함되어 기상 상황에 따라 운휴될 수 있습니다. 강풍·풍랑주의보 등 기상특보 발령 시 안전을 위해 운휴하며, 예약자에게 사전 문자 안내를 드립니다.' },
      { q: '현장에서 QR 손목밴드를 받는 방법은?', a: '온라인 예약 고객은 모바일 QR 탑승권을 현장에서 제시하시면 직원이 확인 후 QR 손목밴드를 발급해 드립니다. 탑승 직전 손목밴드 QR 스캔으로 최종 탑승 처리됩니다.' },
      { q: '단체예약 할인이 있나요?', a: '20인 이상 단체 예약 시 성인 30,000원이 적용됩니다. 홈페이지 단체예약 문의 메뉴를 통해 신청해 주세요.' },
      { q: '어린이는 몇 살부터 요금이 발생하나요?', a: '만 36개월 미만 유아는 무료(좌석 미제공)이며, 만 4세~13세 어린이 요금(25,000원)이 적용됩니다.' },
    ],
    tourContent: [
      {
        title: '통영 해양관광 추천코스: 수륙양용버스 + 한려수도 절경',
        description: '통영 도남항 수륙양용버스 → 한려수도 수상 뷰 → 케이블카 → 통영 중앙시장 → 해산물 맛집. 통영의 바다를 제대로 느끼는 당일치기 완성 코스.',
        keywords: ['통영 관광코스', '통영 당일치기', '통영 여행코스', '통영 수륙양용버스'],
      },
      {
        title: '통영 가족여행 BEST: 수륙양용버스로 시작하는 해양 어드벤처',
        description: '아이들의 눈이 번쩍! 통영 수륙양용버스 탑승. 육지에서 바다로 쾅! 진입하는 순간은 잊지 못할 추억이 됩니다. 가족 여행 일정 추천.',
        keywords: ['통영 가족여행', '통영 아이와 가볼만한 곳', '통영 체험여행', '통영 여행'],
      },
    ],
    breadcrumbs: [
      { name: '홈', url: 'https://aquamobility.kr' },
      { name: '수륙양용투어 예약', url: 'https://aquamobility.kr/reservation' },
      { name: '통영 수륙양용투어', url: 'https://aquamobility.kr/reservation/tongyeong' },
    ],
    smartplace: {
      businessName: '통영해양관광 수륙양용투어 (아쿠아모빌리티코리아)',
      address: '경남 통영시 항남동 도남관광단지',
      phone: '055-640-0000',
      openingHours: '매일 09:30~17:00 (기상악화 시 운휴)',
      reservationUrl: 'https://aquamobility.kr/reservation/tongyeong',
      representativeImage: 'https://aquamobility.kr/static/og-tongyeong.jpg',
    },
  },
  hapcheon: {
    title: '합천 수륙양용버스 예약 | 아쿠아모빌리티코리아',
    description: '합천 수륙양용투어 예약. 합천호의 절경을 수륙양용버스로 즐기는 내륙 수상 어드벤처. 가족여행, 단체관광, 체험관광에 적합. 성인 28,000원.',
    keywords: [
      '합천 수륙양용버스', '합천 수륙양용투어', '합천 관광',
      '합천 가족여행', '합천 여행', '합천호 수상투어', '합천 체험여행',
      '합천 당일치기', '합천 아이와 가볼만한 곳',
      '수륙양용버스 합천', '아쿠아모빌리티 합천',
    ],
    ogTitle: '합천호 수륙양용버스 투어 | 아쿠아모빌리티코리아',
    ogDescription: '합천호의 비경을 수륙양용버스로! 내륙 수상 어드벤처의 새로운 경험. 지금 예약하세요.',
    ogImage: 'https://aquamobility.kr/static/og-hapcheon.jpg',
    canonicalUrl: 'https://aquamobility.kr/reservation/hapcheon',
    h1: '합천 수륙양용버스 투어 예약',
    h2s: [
      '합천호 수륙양용버스 코스 안내',
      '합천 수륙양용투어 운행시간 및 요금',
      '합천 예약 방법',
      '탑승장 위치 및 주차 안내',
      '합천 주변 관광지 추천',
    ],
    localBusiness: {
      '@type': 'TouristAttraction',
      name: '합천 수륙양용투어',
      description: '합천호에서 즐기는 수륙양용버스 내륙 수상 어드벤처',
      url: 'https://aquamobility.kr/reservation/hapcheon',
      telephone: '055-930-0000',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '합천호 수변공원 선착장',
        addressLocality: '합천군',
        addressRegion: '경상남도',
        postalCode: '50224',
        addressCountry: 'KR',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 35.5665, longitude: 128.1665 },
      priceRange: '₩₩',
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '10:00', closes: '16:30' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday','Sunday'], opens: '10:00', closes: '17:00' },
      ],
      image: 'https://aquamobility.kr/static/og-hapcheon.jpg',
    },
    faq: [
      { q: '합천 수륙양용버스는 어디서 타나요?', a: '합천호 수변공원 선착장에서 탑승하실 수 있습니다. 합천호 수변공원 주차장(무료)을 이용하시면 편리합니다.' },
      { q: '합천 수륙양용버스 요금은?', a: '성인 28,000원 / 청소년 23,000원 / 어린이 18,000원 / 경로 23,000원 / 지역민 20,000원입니다. 단체(20인↑) 23,000원.' },
      { q: '합천 수륙양용버스 코스는?', a: '합천호 선착장 출발 → 합천호 수상 구간 → 황매산 전망 포인트 → 선착장 귀환으로 약 1시간 30분 소요됩니다.' },
      { q: '기상악화 시 운행은 어떻게 되나요?', a: '수위 변화, 강풍, 폭우 등 기상 상황에 따라 운휴될 수 있으며, 이 경우 전액 환불 또는 일정 변경이 가능합니다.' },
      { q: '현장판매 가능한가요?', a: '네, 현장 잔여석 범위 내에서 구매 가능합니다. 성수기 주말에는 현장 판매 좌석이 적을 수 있으니 온라인 예약을 권장합니다.' },
      { q: '단체예약 문의는 어떻게 하나요?', a: '홈페이지 단체예약 문의 메뉴 또는 고객센터(055-930-0000)로 연락해 주시면 담당자가 안내드립니다.' },
      { q: '환불 정책은 어떻게 되나요?', a: '탑승 3일 전 전액 환불, 탑승 1일 전 50% 환불, 당일 취소 환불 불가입니다. 환불 주체는 합천수륙양용투어 운영법인입니다.' },
    ],
    tourContent: [
      {
        title: '합천 가족여행 추천코스: 수륙양용버스 + 해인사',
        description: '합천호 수륙양용버스 탑승 후 해인사 팔만대장경까지. 경남 합천의 자연과 문화를 함께 즐기는 가족여행 완성 코스를 소개합니다.',
        keywords: ['합천 가족여행', '합천 여행코스', '합천 당일치기', '합천 관광'],
      },
      {
        title: '합천호 수륙양용버스 체험 후기 & 예약 완벽 가이드',
        description: '내륙에서 즐기는 수상 어드벤처! 합천호 수륙양용버스 탑승 후기와 예약 팁, 주차 안내, 주변 관광지 정보를 모았습니다.',
        keywords: ['합천 수륙양용버스 후기', '합천호 수상투어', '합천 체험', '합천 투어'],
      },
    ],
    breadcrumbs: [
      { name: '홈', url: 'https://aquamobility.kr' },
      { name: '수륙양용투어 예약', url: 'https://aquamobility.kr/reservation' },
      { name: '합천 수륙양용투어', url: 'https://aquamobility.kr/reservation/hapcheon' },
    ],
    smartplace: {
      businessName: '합천수륙양용투어 (아쿠아모빌리티코리아)',
      address: '경남 합천군 대양면 합천호 수변공원',
      phone: '055-930-0000',
      openingHours: '매일 10:00~16:30 (기상악화 시 운휴)',
      reservationUrl: 'https://aquamobility.kr/reservation/hapcheon',
      representativeImage: 'https://aquamobility.kr/static/og-hapcheon.jpg',
    },
  },
};

export const COMMON_FAQ = [
  { q: '수륙양용버스가 무엇인가요?', a: '수륙양용버스(Amphibious Bus)는 육상과 수상을 모두 운행할 수 있는 특수 버스입니다. 일반 도로를 달리다 강이나 바다로 직접 진입하여 수상 구간도 운행하는 독특한 탈것입니다.' },
  { q: '수륙양용버스는 안전한가요?', a: '수륙양용버스는 국제 안전 기준에 따라 설계·제작되었으며, 구명조끼 착용 의무화, 안전요원 동승, 정기 안전점검 등 철저한 안전 관리를 시행하고 있습니다.' },
  { q: '아쿠아모빌리티코리아에서 운행하는 지역은 어디인가요?', a: '현재 통영(경남), 부여(충남), 합천(경남) 3개 지역에서 운행 중입니다. 추후 목포, 임진각, 춘천, 속초 등 전국 확대 예정입니다.' },
  { q: '예약 확인서는 어디서 볼 수 있나요?', a: '예약 완료 후 모바일 QR 탑승권이 발급됩니다. 예약 시 입력한 휴대폰번호로 문자/알림톡도 발송됩니다. 홈페이지 [예약확인] 메뉴에서도 확인 가능합니다.' },
  { q: 'QR 손목밴드는 왜 발급하나요?', a: '현장 탑승 관리를 위한 수단입니다. 온라인 예약 또는 현장 결제 완료 후, 현장에서 직원이 QR 손목밴드를 발급해 드립니다. 탑승 직전 손목밴드 QR을 스캔하여 최종 탑승 처리됩니다.' },
  { q: '환불은 어떻게 하나요?', a: '홈페이지 [예약확인/취소] 메뉴에서 예약번호로 조회 후 취소 신청하시면 됩니다. 환불 규정은 탑승 3일 전 전액, 1일 전 50%, 당일 불가입니다.' },
];

export const SITEMAP_PAGES = [
  { url: '/', changefreq: 'daily', priority: '1.0', lastmod: '' },
  { url: '/reservation', changefreq: 'daily', priority: '0.9', lastmod: '' },
  { url: '/reservation/tongyeong', changefreq: 'daily', priority: '0.9', lastmod: '' },
  { url: '/reservation/buyeo', changefreq: 'daily', priority: '0.9', lastmod: '' },
  { url: '/reservation/hapcheon', changefreq: 'daily', priority: '0.9', lastmod: '' },
  { url: '/faq', changefreq: 'weekly', priority: '0.7', lastmod: '' },
  { url: '/notice', changefreq: 'weekly', priority: '0.6', lastmod: '' },
  { url: '/about', changefreq: 'monthly', priority: '0.5', lastmod: '' },
  { url: '/inquiry', changefreq: 'monthly', priority: '0.5', lastmod: '' },
  { url: '/content/buyeo-daytrip', changefreq: 'monthly', priority: '0.6', lastmod: '' },
  { url: '/content/tongyeong-marine', changefreq: 'monthly', priority: '0.6', lastmod: '' },
  { url: '/content/hapcheon-family', changefreq: 'monthly', priority: '0.6', lastmod: '' },
];
