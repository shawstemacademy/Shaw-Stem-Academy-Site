const CACHE_NAME = 'shaw-stem-academy-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Navigation request offline strategy
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => {
        return caches.match('/offline.html') || caches.match('/index.html');
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  let title = 'Shaw STEM Academy';
  let body = 'You have a new update from Shaw STEM Academy.';
  let icon = '/logo.png';
  let badge = '/logo.png';
  let data = { url: '/' };

  if (event.data) {
    try {
      const parsed = event.data.json();
      if (parsed.notification) {
        title = parsed.notification.title || title;
        body = parsed.notification.body || body;
        icon = parsed.notification.image || parsed.notification.icon || icon;
      } else if (parsed.title || parsed.body) {
        title = parsed.title || title;
        body = parsed.body || body;
      }
      data = parsed.data || parsed;
    } catch (e) {
      const text = event.data.text();
      if (text) body = text;
    }
  }

  const options = {
    body,
    icon,
    badge,
    vibrate: [200, 100, 200],
    tag: `shaw-push-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(urlToOpen)) {
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
