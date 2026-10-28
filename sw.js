/* عامل الخدمة: يتيح فتح البرنامج بلا إنترنت. بياناتك تُحفظ في الجهاز وتُزامَن عند عودة الاتصال. */
const V='wp-v67';
const SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
const API=/firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|firebaseinstallations|google-analytics/;
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(API.test(u.href))return;                       /* المزامنة تمرّ مباشرة للشبكة */
  if(r.mode==='navigate'){                          /* الصفحة: الشبكة أولًا ثم النسخة المخزّنة */
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put('index.html',cp));return res}).catch(()=>caches.match('index.html').then(m=>m||caches.match('./'))));
    return;
  }
  if(u.origin===location.origin||/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|www\.gstatic\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u.host)){
    e.respondWith(caches.match(r).then(m=>{
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>m);
      return m||net;
    }));
  }
});
