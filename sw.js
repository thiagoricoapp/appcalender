const CACHE="rotina-shell-v8";
const APP_URLS=["./","./index.html","./styles-v8.css","./app-v8.js","./supabase-client.js","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_URLS)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
 const url=new URL(event.request.url);
 if(url.origin!==location.origin)return;
 if(event.request.method!=="GET")return;
 if(event.request.mode==="navigate"){event.respondWith(fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put("./",copy));return r}).catch(()=>caches.match("./")));return}
 event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return r})));
});