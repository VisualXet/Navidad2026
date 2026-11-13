const CACHE_NAME = 'navidad2026-pwa-v8';
const STATIC_ASSETS = [
  './',
  './index.html',
  './movil.html',
  './css/styles.css',
  './js/docs-module.js',
  './js/app.js',
  './manifest.json',
  './img/icon.svg',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Nunca cachear llamadas a la API de GitHub ni lecturas directas de db.json o binarios de /docs/ con fallback HTML
  if (url.hostname === 'api.github.com' || url.pathname.endsWith('/data/db.json') || url.pathname.includes('/docs/')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Network-First con fallback inmediato a caché para tener siempre la última versión de la UI y soporte Offline
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && req.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
