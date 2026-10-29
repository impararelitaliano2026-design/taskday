/* عامل الخدمة: يفتح البرنامج فورًا من النسخة المحفوظة ويعمل بلا إنترنت.
   بياناتك تُحفظ في الجهاز وتُزامَن عند عودة الاتصال. */
const V='wp-v71';            /* ملفات البرنامج: تتجدد مع كل إصدار */
const RT='wp-rt-1';          /* مكتبات وخطوط من الإنترنت بروابط ثابتة: لا تُحذف مع كل إصدار */
const SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png'];
const FB='https://www.gstatic.com/firebasejs/10.12.2/firebase-';
const LIBS=[FB+'app-compat.js',FB+'auth-compat.js',FB+'firestore-compat.js'];

self.addEventListener('install',e=>{
  e.waitUntil(Promise.all([
    caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))),
    caches.open(RT).then(c=>Promise.all(LIBS.map(u=>c.match(u).then(m=>m||fetch(u,{mode:'no-cors'}).then(r=>c.put(u,r))).catch(()=>{}))))
  ]).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==RT).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

const API=/firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|firebaseinstallations|google-analytics|googleapis\.com\/identitytoolkit/;
const CDN=/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|www\.gstatic\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/;

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(API.test(u.href))return;                       /* المزامنة تمرّ مباشرة للشبكة */

  if(r.mode==='navigate'){                          /* الصفحة: من المحفوظ فورًا، ونحدّثها في الخلفية للمرة القادمة */
    const net=fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put('index.html',cp))}return res});
    e.respondWith(caches.open(V).then(c=>c.match('index.html')).then(m=>{
      if(m){e.waitUntil(net.catch(()=>{}));return m}
      return net.catch(()=>caches.match('./'));
    }));
    return;
  }

  if(u.origin===location.origin){                   /* ملفات البرنامج: المحفوظ أولًا */
    e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}))));
    return;
  }

  if(CDN.test(u.host)){                             /* المكتبات والخطوط: تبقى محفوظة بين الإصدارات */
    e.respondWith(caches.open(RT).then(c=>c.match(r).then(m=>{
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res});
      if(m){if(u.host==='fonts.googleapis.com')e.waitUntil(net.catch(()=>{}));return m}
      return net;
    })));
  }
});
