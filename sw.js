// Service worker — Registro de Campo Tabaco
// Cachea los archivos de la app para que funcione sin internet
// (excepto la primera vez que se usa "Descargar en Excel", que necesita
// descargar la librería de Excel desde internet la primera vez).

const CACHE_NAME = 'registro-tabaco-v2';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Solo gestionamos peticiones GET de nuestro propio origen.
  // Las peticiones a cdnjs (la librería de Excel) van directo a la red:
  // si no hay internet esa función en particular no estará disponible,
  // pero el resto de la app (llenar datos, guardarlos) sigue funcionando.
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) {
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => cached);
    })
  );
});
