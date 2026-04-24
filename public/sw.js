// public/sw.js
const CACHE_NAME = 'ethan01-vanguard-v3';

// The critical assets needed to boot the app and show the offline page
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/js/core/app.js',
    '/js/core/router.js',
    '/js/core/auth.js',
    '/js/core/theme.js',
    '/js/components/sidebar.js',
    '/js/components/Toast.js',
    '/js/components/modal.js',
    '/js/components/notifications.js',
    '/js/components/Loader.js',
    '/templates/shared/offline.html',
    '/assets/icons/ethan01logo.svg',
    '/assets/css/main.css'
];

// 1. Install Event: Cache the core shell
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing Cache...');
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('[Service Worker] Caching core assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
        .then(() => self.skipWaiting())
    );
});

// 2. Activate Event: Clean up old cache versions
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// 3. Fetch Event: Serve from network, fallback to cache
self.addEventListener('fetch', event => {
    // We only want to handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
        .catch(() => {
            // If the network fails, look in the cache
            return caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If it's an HTML page request and it's not in the cache, serve the offline page
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/templates/shared/offline.html');
                    }
                    
                    // CRITICAL FIX: Return an empty 404 response instead of undefined to prevent TypeError crashes
                    return new Response('', { status: 404, statusText: 'Not Found' });
                });
        })
    );
});