// Service Worker - 아쿠아모빌리티코리아
// 개발/스테이징 환경에서는 캐시 없이 pass-through
const CACHE_NAME = 'amk-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => e.respondWith(fetch(e.request).catch(() => new Response(''))));
