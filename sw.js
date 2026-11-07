const CACHE="sherpa-caddie-v0.12.15";
const APP_FILES=[
  "./",
  "./index.html?v=0146",
  "./manifest.webmanifest?v=0146",
  "./sage-local/index.mjs?v=0146",
  "./sage-local/media-playback.mjs?v=0146",
  "./sage-local/session-controller.mjs?v=0146",
  "./sage-local/tool-registry.mjs?v=0146",
  "./sage-local/portrait.mjs?v=0146",
  "./sage-local/demo.mjs?v=0146",
  "./assets/sage-local/practice.mp3?v=0146",
  "./arteziq-ui.css?v=0141",
  "./arteziq-audio.js?v=0141",
  "./arteziq-ui.js?v=0141",
  "./garmin-round-import.js?v=0141",
  "./assets/sherpa-caddie-logo-fast.webp?v=0141",
  "./assets/sage-sherpa-live.webp?v=0141",
  "./assets/garmin/approach-s44.webp?v=0141",
  "./assets/garmin/approach-s50.webp?v=0141",
  "./assets/garmin/approach-s70-42.webp?v=0141",
  "./assets/garmin/approach-s70-47.webp?v=0141",
  "./assets/technology/bushnell-tour-v7-shift.webp?v=0141",
  "./assets/technology/bushnell-pro-x3-link.webp?v=0141",
  "./assets/technology/rapsodo-mlm2pro.webp?v=0141",
  "./assets/technology/arccos-smart-sensors.webp?v=0141",
  "./icons/icon-192.png?v=0141",
  "./icons/icon-512.png?v=0141",
  "./icons/favicon.png?v=0141",
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
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("sherpa-caddie-") && key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

// Safari's media player can probe a cached MP3 with Range: bytes=0-1.
async function servePracticeAudioRange(request, range) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request.url);
  if (!cached || cached.status !== 200) return fetch(request);
  const bytes = await cached.arrayBuffer();
  const match = /^bytes=(\d*)-(\d*)$/i.exec(range);
  const suffix = match && !match[1] && match[2];
  const start = suffix ? Math.max(0, bytes.byteLength - Number(suffix)) : Number(match?.[1]);
  const end = suffix || !match?.[2] ? bytes.byteLength - 1 : Math.min(Number(match[2]), bytes.byteLength - 1);
  if (!match || (!match[1] && !match[2]) || start >= bytes.byteLength || end < start) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.byteLength}` } });
  }
  return new Response(bytes.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": cached.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${bytes.byteLength}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if(request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept/cache external AI libraries, model files, map tiles, weather,
  // OpenStreetMap/Overpass, or other cross-origin resources.
  if(url.origin !== self.location.origin){
    return;
  }

  const range = request.headers.get("range");
  if(range && url.pathname.endsWith("/assets/sage-local/practice.mp3")){
    event.respondWith(servePracticeAudioRange(request, range));
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
      fetch(request).catch(() => caches.match("./index.html?v=0146"))
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
