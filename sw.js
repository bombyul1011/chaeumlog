// 채움로그 서비스워커
// 배포 시 CACHE_VERSION만 올리면 이전 캐시가 자동 무효화됨 (iikoto와 동일 패턴)
const CACHE_VERSION = 'chaeumlog-v20260818-16-logo-size-topbar-tight';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Supabase API 등 외부 요청은 캐시하지 않고 네트워크로 직행
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // 성공 응답은 캐시 갱신
        if (res && res.status === 200 && e.request.method === 'GET') {
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(e.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((cached) => cached || caches.match('./index.html')))
  );
});
