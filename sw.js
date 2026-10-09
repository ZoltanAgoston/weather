const CACHE='omtg-weather-v1.6';
const SHELL=['/','/index.html','/logo.svg','/icon.svg','/icon-192.png','/icon-512.png','/apple-touch-icon.png','/manifest.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    fetch(e.request).then(r=>{
      if(r.ok&&e.request.url.startsWith(self.location.origin)){
        const cl=r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,cl)).catch(()=>{});
      }
      return r;
    }).catch(()=>caches.match(e.request).then(c=>c||caches.match('/index.html')))
  });
