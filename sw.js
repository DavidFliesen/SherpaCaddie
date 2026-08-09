const CACHE="sherpa-caddie-v0.4.0";
const FILES=["./","./index.html?v=040","./manifest.webmanifest?v=040","./assets/sherpa-caddie-logo.png?v=040","./icons/icon-192.png?v=040","./icons/icon-512.png?v=040","./icons/favicon.png?v=040"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html?v=040"))))});
