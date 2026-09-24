const CACHE_NAME = 'cerood-pwa-v1';

const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
    );

    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );

    self.clients.claim();
});

self.addEventListener('fetch', event => {

    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                return response;
            })
            .catch(() => caches.match(event.request))
    );

});

// ==========================================
// CEROOD WEB PUSH NOTIFICATIONS
// Existing PWA caching code above is preserved.
// ==========================================
self.addEventListener('push', event => {
    event.waitUntil((async () => {
        let payload = {};
        if (event.data) {
            const raw = event.data.text();
            try {
                payload = JSON.parse(raw);
            } catch (_) {
                payload = { body: raw };
            }
        }

        const title = String(payload.title || 'Cerood');
        const requestedUrl = payload.url || (payload.data && payload.data.url) || '/';
        let destination = '/';
        try {
            const parsed = new URL(requestedUrl, self.location.origin);
            if (parsed.origin === self.location.origin) destination = parsed.href;
        } catch (_) {
            // Fall back to Cerood homepage for an invalid URL.
        }

        await self.registration.showNotification(title, {
            body: String(payload.body || payload.message || 'Explore the latest updates from Cerood.'),
            icon: '/fevicon.png', // Replace if your actual logo filename differs.
            badge: '/fevicon.png',
            tag: 'cerood-' + Date.now(),
            data: { url: destination }
        });
    })());
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil((async () => {
        const requestedUrl = event.notification.data && event.notification.data.url;
        let destination = new URL('/', self.location.origin).href;
        try {
            const parsed = new URL(requestedUrl || '/', self.location.origin);
            if (parsed.origin === self.location.origin) destination = parsed.href;
        } catch (_) {
            // Keep the homepage fallback.
        }

        const openClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of openClients) {
            if (client.url === destination && 'focus' in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(destination);
    })());
});
