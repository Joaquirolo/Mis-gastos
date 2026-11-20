const CACHE = 'mis-gastos-v2';
const ARCHIVOS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/sync.js',
  './js/xlsx.full.min.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Librerías de Firebase: se guardan para poder usarlas sin internet
  if (url.hostname === 'www.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(async c => {
      try {
        const r = await fetch(e.request);
        if (r.ok) c.put(e.request, r.clone());
        return r;
      } catch {
        return (await c.match(e.request)) || Response.error();
      }
    }));
    return;
  }

  // Otros sitios (Google, Firebase API): los maneja el navegador
  if (url.origin !== location.origin) return;

  // Tus archivos: primero internet (siempre la versión nueva), si no hay, la guardada
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
