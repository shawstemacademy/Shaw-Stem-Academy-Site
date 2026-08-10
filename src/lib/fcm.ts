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

/**
 * Register a service worker explicitly for FCM.
 * Helps ensure the service worker registers properly even inside iframe-friendly dev settings.
 */
export async function registerFcmServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
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
export async function requestAndSaveFcmToken(customVapidKey?: string): Promise<{ token: string | null; error: string | null }> {
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
        const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        if (sw) swReg = sw;
      } catch (swErr) {
        console.warn('Failed to register sw during token request, attempting standard retrieval:', swErr);
      }
    }

    const vapidKey = customVapidKey || DEFAULT_VAPID_KEY;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg
    });

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

      await setDoc(tokenDocRef, {
        token,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous@shawstemacademy.edu',
        userName: user?.displayName || 'Academy Guest',
        platform,
        userAgent,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      console.log('FCM registration token retrieved and stored in Firestore:', token);
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
