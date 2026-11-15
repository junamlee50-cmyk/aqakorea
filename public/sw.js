// Service Worker - 아쿠아모빌리티코리아
// 개발/스테이징 환경에서는 캐시 없이 pass-through
const CACHE_NAME = 'amk-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  // 같은 사이트 요청만 처리한다. PC 프린터 연결 프로그램(127.0.0.1)·외부 주소는 개입하지 않아
  // 브라우저의 로컬 네트워크 접근 허용/CORS 가 정상 동작하고, 실패가 빈 성공 응답으로 둔갑하지 않게 한다.
  let u; try { u = new URL(e.request.url); } catch (_) { return; }
  if (u.origin !== self.location.origin) return;
  e.respondWith(fetch(e.request).catch(() => new Response('')));
});
