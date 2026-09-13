// Bump this version string any time you change the file list below,
// so browsers know to fetch a fresh copy of everything.
const CACHE_NAME = 'p5-sketch-cache-v3.1';

// Add/remove paths here to match your actual project structure.
// Paths are relative to the location of this sw.js file.
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './sketch.js',
  './manifest.json',
  './p5.js',
  './bibleArray.js',
  './button.js',
  './Radial.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
  // If you're using the p5.js library from a local file (not a CDN),
  // add it here too, e.g. './libraries/p5.min.js'
];

// Install: pre-cache the core files so the app can load offline.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean up any old cache versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: try the cache first, fall back to the network,
// and cache anything new we fetch along the way.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            // Only cache successful, same-origin responses.
            if (
              event.request.method === 'GET' &&
              networkResponse &&
              networkResponse.status === 200
            ) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
        .catch(() => {
          // Optional: return a fallback page here if you add one,
          // e.g. return caches.match('./offline.html');
        });
    })
  );
});