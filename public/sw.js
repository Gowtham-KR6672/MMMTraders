// Service Worker with improved offline support, caching, and error handling

const CACHE_NAME = 'mmm-traders-v3';
const API_CACHE_NAME = 'mmm-traders-api-v1';
const STATIC_ASSETS = ['/', '/dashboard', '/portal', '/login', '/logo.png', '/manifest.json'];
const API_ENDPOINTS = ['/api/sales', '/api/orders', '/api/customers', '/api/products', '/api/income'];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.all(
          STATIC_ASSETS.map((asset) =>
            cache.add(asset).catch(() => console.log(`Failed to cache ${asset}`))
          )
        );
      }),
      // Pre-cache API endpoints if network allows
      caches.open(API_CACHE_NAME).catch(() => {}),
    ])
  );
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME)
          .map((k) => {
            console.log('Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch Strategy: Network-first for API, Cache-first for static ──────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, non-http(s), external requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // API endpoints: Network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) {
              // Add a header to indicate this is from cache
              const headers = new Headers(cached.headers);
              headers.append('X-From-Cache', 'true');
              return new Response(cached.body, { ...cached, headers });
            }
            // Return offline page if nothing is cached
            return caches.match('/').catch(() => {
              return new Response('Offline - No cached data available', { status: 503 });
            });
          });
        })
    );
  } else {
    // Static assets: Cache-first, network fallback
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        });
      })
    );
  }
});

// ─── Push Notification Handler ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'MMM Traders', body: event.data.text() };
  }

  const {
    title = 'MMM Traders',
    body = '',
    icon = '/logo.png',
    badge = '/logo.png',
    url = '/',
  } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
      tag: title,
    })
  );
});

// ─── Notification Click Handler ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// ─── Background Sync (Optional - for offline actions) ──────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Clear old API caches to force fresh fetch
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          return Promise.all(keys.map((request) => cache.delete(request)));
        });
      })
    );
  }
});
