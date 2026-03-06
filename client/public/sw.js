// Adaptalyfe Service Worker for PWA functionality
const CACHE_NAME = 'adaptalyfe-v1.0.25';
const urlsToCache = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Force update check - called from app to skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install — cache only static shell assets (not index.html or JS bundles)
self.addEventListener('install', (event) => {
  console.log('SW: Installing version', CACHE_NAME);
  self.skipWaiting(); // Activate immediately without waiting for old tabs to close
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('SW: Failed to cache some assets during install', err);
      });
    })
  );
});

// Activate — delete ALL old caches, then reload all open clients
self.addEventListener('activate', (event) => {
  console.log('SW: Activating version', CACHE_NAME, '— clearing old caches');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('SW: Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Claim all clients immediately so they use the new SW
        return self.clients.claim();
      })
      .then(() => {
        // Tell every open tab to reload so they run the new code
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => {
            console.log('SW: Sending reload signal to client', client.url);
            client.postMessage({ type: 'SW_UPDATED' });
          });
        });
      })
  );
});

// Fetch — network-first strategy
// index.html and JS/CSS assets: always fetch from network (never serve stale)
// Other assets (icons, fonts): cache-first with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http requests (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Skip API requests entirely — let them go direct to server
  if (url.pathname.startsWith('/api/')) return;

  // index.html and JS/CSS assets — ALWAYS network, never cache
  if (
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        // Only fall back to cache for HTML when completely offline
        if (url.pathname.endsWith('.html') || url.pathname === '/') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // Icons, fonts, manifest — cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() => new Response('Offline', { status: 503 }))
  );
});
