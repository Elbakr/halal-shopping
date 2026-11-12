const V="wird-46717453";const F=["./","index.html","adhan.min.js","methodes.js","badge-72.png","hisn.json","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener("push",e=>{let d={};try{d=e.data.json();}catch(x){d={title:"Wird",body:e.data?e.data.text():""};}
 e.waitUntil(self.registration.showNotification(d.title||"Wird",{body:d.body||"",icon:"icon-192.png",badge:"badge-72.png",tag:d.tag||"wird",renotify:true,vibrate:[120,60,120],lang:"fr",data:{url:d.url||"./"}}));});
self.addEventListener("notificationclick",e=>{e.notification.close();const u=new URL(e.notification.data&&e.notification.data.url||"./",self.registration.scope).href;
 e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>{for(const c of l){if("focus" in c){c.navigate(u).catch(()=>{});return c.focus();}}return clients.openWindow(u);}));});
self.addEventListener("fetch",e=>{const r=e.request;const U=new URL(r.url);if(r.method!=="GET"||U.origin!==location.origin||U.pathname.startsWith("/audio/")||U.pathname.startsWith("/api/"))return;
 if(r.mode==="navigate"&&U.pathname.endsWith(".html")&&!U.pathname.endsWith("/index.html"))return;
 if(r.mode==="navigate"){e.respondWith(fetch(r).then(n=>{const c=n.clone();caches.open(V).then(x=>x.put("index.html",c));return n;}).catch(()=>caches.match("index.html")));return;}
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(n=>{const c=n.clone();if(n.ok)caches.open(V).then(x=>x.put(r,c));return n;})));});
