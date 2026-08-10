// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase with the project credentials
// These match the Shaw STEM Academy credentials
firebase.initializeApp({
  apiKey: "AIzaSyAbovUPLk2wIMM4K44r0RuRPGOJhP1RU0M",
  authDomain: "shawstemacademy-c0039.firebaseapp.com",
  projectId: "shawstemacademy-c0039",
  storageBucket: "shawstemacademy-c0039.firebasestorage.app",
  messagingSenderId: "53639382274",
  appId: "1:53639382274:web:8f688e6d5182a3d6d82e1b",
});

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
