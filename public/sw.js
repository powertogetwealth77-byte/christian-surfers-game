/* Christian Surfers service worker: network-first with cache fallback. */
// Bump the cache version so clients that cached HTML under asset URLs (the
// pre-fix fallback bug) drop that poisoned cache on next activation.
const CACHE = "christian-surfers-v2";
const PRECACHE = [
  ".",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // Only page navigations may fall back to the cached app shell.
          // Serving index.html for a failed JS/CSS/image request turns a
          // missing-asset error into an HTML body — the stylesheet then
          // fails to apply and the whole game renders as a giant unstyled
          // text dump covering the canvas on mobile.
          if (request.mode === "navigate") return caches.match(".");
          return Response.error();
        }),
      ),
  );
});
