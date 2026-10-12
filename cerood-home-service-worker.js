/* Cerood Home Services only: never caches API, auth or payment requests. */
const CACHE = 'cerood-home-shell-festival10';
const PAGE = '/home-services.html';
const LOGO = '/cerood-logo.webp';
async function currentPage(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(request, {cache:'no-store', signal:controller.signal});
    if (!response.ok || !(await response.clone().text()).includes('cerood-uploaded-banner-v10')) throw new Error('Current home design unavailable');
    const cache = await caches.open(CACHE);
    await cache.put(PAGE, response.clone());
    return response;
  } finally { clearTimeout(timer); }
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await currentPage(new Request(new URL(PAGE, self.location.origin)));
    try { const logo = await fetch(LOGO, {cache:'reload'}); if(logo.ok) await (await caches.open(CACHE)).put(LOGO,logo); } catch (_) {}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if(key.startsWith('cerood-home-shell-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request=event.request,url=new URL(request.url);
  if(request.method !== 'GET' || url.origin !== self.location.origin) return;
  if(request.mode === 'navigate' && url.pathname === PAGE) {
    event.respondWith((async () => {
      try { return await currentPage(request); }
      catch (_) {
        const saved=await (await caches.open(CACHE)).match(PAGE);
        return saved || new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cerood</title><style>body{font:16px Arial;margin:24px;color:#222;background:white}</style><h1>Cerood Home Services</h1><p>Reconnect to open the latest page.</p>',{status:503,headers:{'Content-Type':'text/html;charset=utf-8'}});
      }
    })());
  } else if(url.pathname === LOGO) {
    event.respondWith((async () => {
      const cache=await caches.open(CACHE),saved=await cache.match(LOGO);
      if(saved)return saved;
      const response=await fetch(request);if(response.ok)await cache.put(LOGO,response.clone());return response;
    })());
  }
});
