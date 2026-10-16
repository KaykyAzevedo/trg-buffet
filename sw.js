/* TRG Buffet - service worker simples: cache estático + fallback offline.
   Para forçar atualização dos arquivos em cache, mude VERSION. */
const VERSION = 'trg-buffet-v5';
const CORE = [
  './',
  'index.html',
  'offline.html',
  'css/style.css',
  'js/main.js',
  'manifest.webmanifest',
  'assets/img/logo-trg-buffet.svg',
  'assets/img/favicon.svg',
  'assets/icons/icon-192.png',
  'assets/fonts/oswald-latin.woff2',
  'assets/fonts/inter-latin.woff2',
  'assets/fonts/fraunces-latin.woff2',
  'assets/fonts/fraunces-italic-latin.woff2',
  'assets/fotos/hero-bg-800.webp',
  'assets/fotos/hero-card-800.webp'
];

const abs = (p) => new URL(p, self.registration.scope).toString();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => Promise.all(CORE.map((p) => cache.add(abs(p)).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // não intercepta terceiros (analytics etc.)

  // Páginas: rede primeiro, cache e depois página offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(abs('index.html')) || caches.match(abs('offline.html'))))
        .then((res) => res || caches.match(abs('offline.html')))
    );
    return;
  }

  // Estáticos: cache primeiro, atualiza em segundo plano
  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
