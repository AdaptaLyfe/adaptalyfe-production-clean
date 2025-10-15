// Adaptalyfe Service Worker for PWA functionality
const CACHE_NAME = 'adaptalyfe-v1.0.23';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html'
];

// Force update check
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install service worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing new version v1.0.23 - MOBILE MOOD RESPONSIVE + NO-CACHE SW');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch events - ALWAYS NETWORK for JS/CSS to prevent stale code
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // ALWAYS fetch fresh for JavaScript and CSS - NO CACHING
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.startsWith('/assets/')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Cache-first for everything else
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request);
      })
      .catch(() => {
        return caches.match('/offline.html');
      })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating new version v1.0.23 - Clearing ALL caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('SW: Deleting cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Recreate cache with static assets only
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(urlsToCache);
      });
    })
  );
  return self.clients.claim();
});
