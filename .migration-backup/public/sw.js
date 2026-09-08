// Simple service worker for desktop compatibility
const CACHE_NAME = 'adaptalyfe-v1';

self.addEventListener('install', function(event) {
  console.log('SW: Install event');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('SW: Activate event');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  // For demo purposes, always fetch from network to avoid caching issues
  event.respondWith(
    fetch(event.request).catch(function() {
      console.log('SW: Network failed, this is expected in demo mode');
      return new Response('Demo mode - network fetch failed', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});