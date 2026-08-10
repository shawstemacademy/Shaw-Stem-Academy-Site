// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase dynamically from URL query parameters (or registration config)
const params = new URLSearchParams(self.location.search);
const apiKey = params.get('apiKey') || 'AIzaSyAbovUPLk2wIMM4K44r0RuRPGOJhP1RU0M';
const authDomain = params.get('authDomain') || 'shawstemacademy-c0039.firebaseapp.com';
const projectId = params.get('projectId') || 'shawstemacademy-c0039';
const storageBucket = params.get('storageBucket') || 'shawstemacademy-c0039.firebasestorage.app';
const messagingSenderId = params.get('messagingSenderId') || '53639382274';
const appId = params.get('appId') || '1:53639382274:web:8f688e6d5182a3d6d82e1b';

if (apiKey) {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  });
}

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Shaw STEM Academy';
  const notificationOptions = {
    body: payload.notification?.body || 'New announcement posted!',
    icon: payload.notification?.image || 'https://storage.googleapis.com/aistudio-v2-dev-usercontent/68a582f2-700c-4bde-bbe4-5b81aba52e10/images/p7w93d7c/shaw_stem_academy_logo.png',
    badge: 'https://storage.googleapis.com/aistudio-v2-dev-usercontent/68a582f2-700c-4bde-bbe4-5b81aba52e10/images/p7w93d7c/shaw_stem_academy_logo.png',
    tag: 'shaw-stem-notification',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
