const CACHE_NAME = 'travelrate-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // We try to cache core assets. 
        // Note: External CDNs (esm.sh, tailwind) might need specific handling, 
        // but for a simple "offline shell" this is a start.
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Stale-while-revalidate strategy for most things
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(
          networkResponse => {
            // Don't cache API calls or non-valid responses
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // Clone and cache
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          }
        ).catch(() => {
             // Network failed, nothing to do here as we handle fallback in UI logic
        });
        return cachedResponse || fetchPromise;
      })
  );
});