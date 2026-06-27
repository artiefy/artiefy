// Artiefy service worker (conservative).
// Goal: make the app installable (PWA) and provide an offline fallback page,
// WITHOUT caching auth (Clerk), API responses, payments (PayU) or dynamic data.
const CACHE = 'artiefy-shell-v1';
const PRECACHE = ['/offline.html', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin top-level navigations. Everything else
  // (static assets, _next, API, Clerk, PayU, cross-origin) passes straight
  // through to the network so nothing dynamic or sensitive is ever cached.
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
});
