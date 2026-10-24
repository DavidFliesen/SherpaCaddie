const CACHE="sherpa-caddie-v0.12.9";
const APP_FILES=[
  "./",
  "./index.html?v=0140",
  "./manifest.webmanifest?v=0140",
  "./arteziq-ui.css?v=0140",
  "./arteziq-audio.js?v=0140",
  "./arteziq-ui.js?v=0140",
  "./garmin-round-import.js?v=0140",
  "./assets/sherpa-caddie-logo-fast.webp?v=0140",
  "./assets/sage-sherpa-live.webp?v=0140",
  "./assets/garmin/approach-s44.webp?v=0140",
  "./assets/garmin/approach-s50.webp?v=0140",
  "./assets/garmin/approach-s70-42.webp?v=0140",
  "./assets/garmin/approach-s70-47.webp?v=0140",
  "./assets/technology/bushnell-tour-v7-shift.webp?v=0140",
  "./assets/technology/bushnell-pro-x3-link.webp?v=0140",
  "./assets/technology/rapsodo-mlm2pro.webp?v=0140",
  "./assets/technology/arccos-smart-sensors.webp?v=0140",
  "./icons/icon-192.png?v=0140",
  "./icons/icon-512.png?v=0140",
  "./icons/favicon.png?v=0140",
  "./ladybug/ladybug-config.js",
  "./ladybug/ladybug-auth.js",
  "./ladybug/ladybug-feedback.js",
  "./ladybug/assets/ladybug-feedback-icon-256.png",
  "./ladybug/vendor/html2canvas.min.js"
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

  // Ladybug's public per-app configuration may be activated independently of
  // a Sherpa release. Prefer the network but retain the last cached copy.
  if(url.pathname.endsWith("/ladybug/ladybug-config.js")){
    event.respondWith(fetch(request, {cache:"no-store"}).catch(() => caches.match(request)));
    return;
  }

  // Page navigation: network first, app shell only as true offline fallback.
  if(request.mode === "navigate"){
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html?v=0140"))
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
