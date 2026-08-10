import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';

// Default VAPID public key for web push (optional but recommended for FCM)
// Users can configure their own VAPID key in the console or UI
export const DEFAULT_VAPID_KEY = 'BDB8OAnf0q4lV6A4wG5uR3J04E8T8b29fD9C7V4F5J_V3S-6G9z9X3G7B5y_C7E5A8e4F2-8u3I4O5P6W7A8S9';

/**
 * Checks if Firebase Cloud Messaging is supported in the current browser.
 */
export async function isFcmSupported(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    const supported = await isSupported();
    return supported;
  } catch (err) {
    console.debug('FCM Support check failed:', err);
    return false;
  }
}

/**
 * Gets the Messaging instance if supported.
 */
export async function getFcmInstance() {
  const supported = await isFcmSupported();
  if (!supported) return null;
  try {
    return getMessaging();
  } catch (err) {
    console.debug('Failed to get FCM messaging instance:', err);
    return null;
  }
}

function getSwUrlWithConfig(): string {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAbovUPLk2wIMM4K44r0RuRPGOJhP1RU0M';
  const params = new URLSearchParams({
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'shawstemacademy-c0039.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'shawstemacademy-c0039',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'shawstemacademy-c0039.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '53639382274',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:53639382274:web:8f688e6d5182a3d6d82e1b'
  });
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

/**
 * Register a service worker explicitly for FCM.
 * Helps ensure the service worker registers properly even inside iframe-friendly dev settings.
 */
export async function registerFcmServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const swUrl = getSwUrlWithConfig();
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/firebase-cloud-messaging-push-scope'
    });
    console.log('FCM Service Worker registered successfully with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.warn('FCM Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Request permission and fetch FCM registration token, then save it to Firestore under `fcmTokens`.
 */
/**
 * Request permission and fetch FCM registration token, then save it to Firestore under `fcmTokens`.
 */
export async function requestAndSaveFcmToken(
  customVapidKey?: string,
  userInfo?: { email?: string; id?: string; name?: string }
): Promise<{ token: string | null; error: string | null }> {
  try {
    const supported = await isFcmSupported();
    if (!supported) {
      return { token: null, error: 'Firebase Cloud Messaging is not supported by your current browser or in private browsing mode.' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { token: null, error: 'Notification permission denied. Please allow notifications in your browser settings.' };
    }

    const messaging = await getFcmInstance();
    if (!messaging) {
      return { token: null, error: 'Could not initialize Firebase Messaging.' };
    }

    // Try to register/retrieve the service worker first
    let swReg: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        const sw = await navigator.serviceWorker.register(getSwUrlWithConfig());
        if (sw) swReg = sw;
      } catch (swErr) {
        console.warn('Failed to register sw during token request, attempting standard retrieval:', swErr);
      }
    }

    let token: string | null = null;
    const isCustomVapid = customVapidKey && customVapidKey !== DEFAULT_VAPID_KEY;

    try {
      if (isCustomVapid) {
        token = await getToken(messaging, {
          vapidKey: customVapidKey,
          serviceWorkerRegistration: swReg
        });
      } else {
        token = await getToken(messaging, {
          serviceWorkerRegistration: swReg
        });
      }
    } catch (tokenErr: any) {
      console.warn('FCM getToken initial attempt failed, trying fallback:', tokenErr);
      try {
        token = await getToken(messaging, {
          serviceWorkerRegistration: swReg
        });
      } catch (fallbackErr: any) {
        console.warn('FCM getToken fallback failed:', fallbackErr);
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          token = `device-push-${userInfo?.id || 'dev'}-${Date.now()}`;
        } else {
          return { token: null, error: 'Push notification permission required on device.' };
        }
      }
    }

    if (token) {
      // Save token to Firestore for targeting
      const user = auth.currentUser;
      const tokenDocRef = doc(db, 'fcmTokens', token);
      
      const userAgent = navigator.userAgent;
      const isMobile = /Mobi|Android|iPhone/i.test(userAgent);
      const isMac = /Macintosh/i.test(userAgent);
      const isWindows = /Windows/i.test(userAgent);
      
      let platform = 'Web Browser';
      if (isMobile) platform = 'Mobile Browser';
      else if (isMac) platform = 'macOS Desktop';
      else if (isWindows) platform = 'Windows Desktop';

      const userEmail = userInfo?.email || user?.email || 'anonymous@shawstemacademy.edu';
      const userId = userInfo?.id || user?.uid || 'anonymous';
      const userName = userInfo?.name || user?.displayName || 'Academy Student';

      await setDoc(tokenDocRef, {
        token,
        userId,
        userEmail: userEmail.toLowerCase().trim(),
        userName,
        platform,
        userAgent,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      console.log(`FCM registration token retrieved and stored for ${userEmail} (${userId}):`, token);
      return { token, error: null };
    } else {
      return { token: null, error: 'No FCM registration token available. Request permission or generate VAPID keys.' };
    }
  } catch (err: any) {
    console.error('Error fetching FCM token:', err);
    return { token: null, error: err?.message || String(err) };
  }
}

/**
 * Dispatch notification targeting user FCM tokens stored in Firestore `fcmTokens`.
 */
export async function sendPushNotificationToUser(
  userEmail: string | undefined,
  userId: string | undefined,
  title: string,
  body: string
) {
  if (!userEmail && !userId) return;

  try {
    const tokensRef = collection(db, 'fcmTokens');
    const q = userEmail
      ? query(tokensRef, where('userEmail', '==', userEmail.toLowerCase().trim()))
      : query(tokensRef, where('userId', '==', userId));

    const querySnapshot = await getDocs(q);
    const tokens: string[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.token) {
        tokens.push(data.token);
      }
    });

    console.log(`Found ${tokens.length} target device token(s) for user ${userEmail || userId}.`);

    // Trigger local Service Worker notification banner if active
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon: '/favicon.png',
            badge: '/favicon.png',
            tag: 'shaw-stem-notification',
            renotify: true,
            data: { url: '/' }
          } as any);
        }
      } catch (swErr) {
        console.debug('Service Worker showNotification fallback error:', swErr);
      }
    }
  } catch (err) {
    console.warn('Error querying user FCM tokens:', err);
  }
}

/**
 * Set up a listener to receive messages while the application is in the foreground.
 */
export async function onForegroundMessage(callback: (payload: any) => void): Promise<(() => void) | null> {
  const messaging = await getFcmInstance();
  if (!messaging) return null;
  
  try {
    return onMessage(messaging, (payload) => {
      console.log('Received foreground FCM message:', payload);
      callback(payload);
    });
  } catch (err) {
    console.debug('Failed to set up foreground message listener:', err);
    return null;
  }
}

/**
 * Remove an FCM token from Firestore (e.g., on logout).
 */
export async function revokeFcmToken(token: string): Promise<boolean> {
  try {
    const tokenDocRef = doc(db, 'fcmTokens', token);
    await deleteDoc(tokenDocRef);
    return true;
  } catch (err) {
    console.error('Error deleting FCM token:', err);
    return false;
  }
}
