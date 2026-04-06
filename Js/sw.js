const C = 'aiface-v6';
const PRECACHE = [
  '/', '/index.html', '/manifest.json',
  '/icon-192.png', '/icon-512.png',
  '/style.css', '/script.js', '/collect.js',
  '/consent-popup.js', '/profile-onboarding.js', '/geo-popup.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(C).then(cache => cache.addAll(PRECACHE.map(u => new Request(u, {cache:'reload'}))))
      .catch(() => {})
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== C).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(r => {
        if (r && r.status === 200) {
          caches.open(C).then(c => c.put(e.request, r.clone()));
        }
        return r;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
