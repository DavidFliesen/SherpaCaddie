const CACHE="sherpa-caddie-v0.11.2";
const APP_FILES=[
  "./",
  "./index.html?v=0112",
  "./manifest.webmanifest?v=0112",
  "./assets/sherpa-caddie-logo-fast.webp?v=0112",
  "./assets/sage-sherpa-live.webp?v=0112",
  "./icons/icon-192.png?v=0112",
  "./icons/icon-512.png?v=0112",
  "./icons/favicon.png?v=0112"
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

  // D-ID runtime configuration can be updated independently by the provisioning
  // workflow. Always request it from the network so a newly provisioned key is
  // not trapped behind an older service-worker cache.
  if(url.pathname.endsWith("/did-config.json")){
    event.respondWith(fetch(request, {cache:"no-store"}));
    return;
  }

  // Page navigation: network first, app shell only as true offline fallback.
  if(request.mode === "navigate"){
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html?v=0112"))
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
