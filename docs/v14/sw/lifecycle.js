/**
 * Chapter 5: Service Worker Daemon Lifecycle
 * Controls registration activation, immediate client claim, and message handling.
 */

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'CLAIM') {
        self.clients.claim();
    }
});

self.addEventListener('fetch', (event) => {
    handleVirtualServerFetch(event);
});

