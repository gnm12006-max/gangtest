// 한반도 영토 개척 전략 - 서비스 워커 (v29)
const CACHE = 'hanbando-v29';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const CDN = ['unpkg.com', 'cdn.jsdelivr.net', 'raw.githubusercontent.com'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => { })).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // 1) 내 사이트 파일: 인터넷이 되면 항상 최신(업데이트 즉시 반영), 안 되면 캐시
    if (url.origin === location.origin) {
        e.respondWith(
            fetch(req).then(res => {
                if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
                return res;
            }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
        );
        return;
    }

    // 2) Leaflet / 경계 데이터(CDN): 한 번 받으면 캐시에서 바로 (오프라인 지원)
    if (CDN.includes(url.hostname)) {
        e.respondWith(
            caches.match(req.url).then(hit => hit || fetch(req.url, { mode: 'cors' }).then(res => {
                if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req.url, copy)); }
                return res;
            }))
        );
        return;
    }
    // 3) 지도 타일 등 나머지는 그대로 통과 (캐시 안 함)
});
