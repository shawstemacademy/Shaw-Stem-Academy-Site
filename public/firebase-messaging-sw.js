// Firebase Cloud Messaging Background Service Worker for Shaw STEM Academy
// Configured to persist background push delivery even when PWA or recent apps are closed on Android/OneUI
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Failed to importScripts:', e);
}

// Initialize Firebase dynamically from URL query parameters (or default project credentials)
const params = new URLSearchParams(self.location.search);
const apiKey = params.get('apiKey') || 'AIzaSyAbovUPLk2wIMM4K44r0RuRPGOJhP1RU0M';
const authDomain = params.get('authDomain') || 'shawstemacademy-c0039.firebaseapp.com';
const projectId = params.get('projectId') || 'shawstemacademy-c0039';
const storageBucket = params.get('storageBucket') || 'shawstemacademy-c0039.firebasestorage.app';
const messagingSenderId = params.get('messagingSenderId') || '53639382274';
const appId = params.get('appId') || '1:53639382274:web:8f688e6d5182a3d6d82e1b';

if (typeof firebase !== 'undefined' && apiKey) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId
      });
    }
  } catch (initErr) {
    console.warn('[firebase-messaging-sw.js] Firebase initialization warning:', initErr);
  }
}

let messaging = null;
try {
  if (typeof firebase !== 'undefined' && firebase.messaging) {
    messaging = firebase.messaging();
  }
} catch (mErr) {
  console.warn('[firebase-messaging-sw.js] Could not get messaging instance:', mErr);
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Firebase FCM Background Message API
if (messaging) {
  try {
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] onBackgroundMessage received:', payload);
      
      const notificationTitle = payload.notification?.title || payload.data?.title || 'Shaw STEM Academy';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'New announcement or update from Shaw STEM Academy!',
        icon: payload.notification?.image || payload.data?.icon || '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        tag: payload.data?.tag || `shaw-stem-${Date.now()}`,
        renotify: true,
        requireInteraction: true,
        data: payload.data || { url: '/' }
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (bgErr) {
    console.warn('[firebase-messaging-sw.js] onBackgroundMessage registration error:', bgErr);
  }
}

// Fallback direct Push Event Listener (Guarantees receipt on Samsung Galaxy/Android when browser process was cleared)
self.addEventListener('push', (event) => {
  let title = 'Shaw STEM Academy Alert';
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
    } catch (parseErr) {
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

// Deep link opening on notification click
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
