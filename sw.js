const CACHE="sherpa-caddie-v0.6.2";
const APP_FILES=[
  "./",
  "./index.html?v=062",
  "./manifest.webmanifest?v=062",
  "./assets/sherpa-caddie-logo.png?v=062",
  "./assets/sherpa-caddie-logo-clean.png?v=062",
  "./icons/icon-192.png?v=062",
  "./icons/icon-512.png?v=062",
  "./icons/favicon.png?v=062"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if(request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept/cache external AI libraries, model files, map tiles, weather,
  // OpenStreetMap/Overpass, or other cross-origin resources.
  if(url.origin !== self.location.origin){
    return;
  }

  // Page navigation: network first, app shell only as true offline fallback.
  if(request.mode === "navigate"){
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html?v=062"))
    );
    return;
  }

  // Same-origin static app assets: cache first, then network.
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy)).catch(()=>{});
      return response;
    }))
  );
});
