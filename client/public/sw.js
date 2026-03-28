// Adaptalyfe Service Worker — Cache-First for instant loads
//
// HOW CACHE CLEARING WORKS:
//   - Bump CACHE_VERSION below when you upload a new version to the Play Store
//   - On next open the old cache is deleted and everything is downloaded fresh
//   - For regular web deploys: stale-while-revalidate picks up changes automatically
//
const CACHE_VERSION = 'adaptalyfe-v4';
const STATIC_CACHE  = CACHE_VERSION + '-static'; // hashed JS/CSS — safe forever
const SHELL_CACHE   = CACHE_VERSION + '-shell';  // index.html, icons, manifest

// Hashed assets: /assets/index-Ab3Xy9.js  /assets/main-Cd1Kp.css
// The filename contains a content hash, so a new deploy = new filename = auto cache-bust
var HASHED_ASSET = /\/assets\/[^/]+\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|svg|gif|ico)(\?.*)?$/;

// ─── Install ─────────────────────────────────────────────────────────────────
// Pre-cache the full app shell immediately so the NEXT open is instant.
// This is the key fix for white screen after fresh install.
self.addEventListener('install', function(event) {
  self.skipWaiting(); // Don't wait — activate immediately, evict old SW
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function(cache) {
      // Pre-fetch and cache the root HTML right now during install
      // so the next open loads from cache instead of waiting for Railway
      var htmlFetch = fetch('/', { cache: 'no-store' }).then(function(res) {
        if (res.ok) return cache.put('/', res.clone());
      }).catch(function() {});

      // Also cache static assets
      var assetFetch = cache.addAll([
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png'
      ]).catch(function() {});

      return Promise.all([htmlFetch, assetFetch]);
    })
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
// Delete every cache that doesn't match CACHE_VERSION — this is the "clear cache
// on new Play Store upload" mechanism. Just bump CACHE_VERSION above.
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return !k.startsWith(CACHE_VERSION); })
          .map(function(k) {
            console.log('[SW] Removing old cache:', k);
            return caches.delete(k);
          })
      );
    })
    .then(function() { return self.clients.claim(); })
    .then(function() {
      return self.clients.matchAll({ type: 'window' }).then(function(clients) {
        clients.forEach(function(c) { c.postMessage({ type: 'SW_UPDATED' }); });
      });
    })
  );
});

// ─── Messages ────────────────────────────────────────────────────────────────
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var req = event.request;
  var url;
  try { url = new URL(req.url); } catch(e) { return; }

  // Skip non-GET, non-http
  if (req.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Skip API calls — always go to server, never cache
  if (url.pathname.startsWith('/api/')) return;

  // Skip cross-origin (Stripe, Firebase, Google, etc.)
  if (url.origin !== self.location.origin) return;

  // ── Hashed assets: Cache First ───────────────────────────────────────────
  // These URLs change when content changes, so it's 100% safe to cache forever.
  // Result: JS/CSS loads in <50ms from device, no network needed.
  if (HASHED_ASSET.test(url.pathname)) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // ── index.html + SPA routes: Stale-While-Revalidate ─────────────────────
  // Serve the CACHED version INSTANTLY (solves the 35-45s Railway cold start).
  // Fetch a fresh copy in the background — user gets new content on next open.
  if (
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    !url.pathname.includes('.')  // /dashboard, /tasks, /subscription etc.
  ) {
    event.respondWith(staleWhileRevalidate(req, SHELL_CACHE));
    return;
  }

  // ── Everything else (icons, manifest): Stale-While-Revalidate ───────────
  event.respondWith(staleWhileRevalidate(req, SHELL_CACHE));
});

// ─── Strategy: Cache First ───────────────────────────────────────────────────
// Return cached immediately; only hit network if not cached yet.
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      });
    });
  });
}

// ─── Strategy: Stale-While-Revalidate ────────────────────────────────────────
// Return cached version IMMEDIATELY (zero wait), then update the cache
// silently in the background. Next open gets the fresh version.
// This completely eliminates Railway cold-start wait time.
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      var networkFetch = fetch(request).then(function(response) {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      }).catch(function() { return null; });

      // If we have a cached copy, return it instantly.
      // The network fetch above runs in background to keep cache fresh.
      return cached || networkFetch;
    });
  });
}
