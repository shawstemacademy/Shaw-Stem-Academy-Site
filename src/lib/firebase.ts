import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { 
  initializeFirestore,
  collection, 
  addDoc, 
  getDocs, 
  getDocFromServer,
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import {
  DEMO_SCHOOL_USERS,
  DEMO_DEPARTMENTS,
  DEFAULT_ACADEMY_INFO,
  DEFAULT_FEATURE_CARDS,
} from '../data/schoolDemoData';
import { SchoolUser } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAbovUPLk2wIMM4K44r0RuRPGOJhP1RU0M",
  authDomain: "shawstemacademy-c0039.firebaseapp.com",
  projectId: "shawstemacademy-c0039",
  storageBucket: "shawstemacademy-c0039.firebasestorage.app",
  messagingSenderId: "53639382274",
  appId: "1:53639382274:web:8f688e6d5182a3d6d82e1b",
  measurementId: "G-XEKYJ5G7W8"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use session persistence so user session expires when browser tab/window is closed or left open too long
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.warn('Firebase setPersistence warning:', err);
});

// Initialize analytics safely (especially for development in iframes where it may not be supported)
export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch((err) => {
  console.warn('Analytics is not fully supported or blocked in this environment:', err);
});

// Initialize Firestore with custom settings to use long-polling and resolve any transient proxy/network blockages
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });

let googleAccessToken: string | null = null;

export const getAccessToken = () => googleAccessToken;

// Firestore Error Handler per Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  window.dispatchEvent(new CustomEvent('firestore-error', { detail: errInfo }));
}

export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export const googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  // Force Google to show the account chooser dialog
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  try {
    // In standard environments and especially AI Studio preview iframes when opened in a new tab, signInWithPopup works beautifully
    const result = await signInWithPopup(auth, provider);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        googleAccessToken = credential.accessToken;
      }
    }
    return result;
  } catch (err: any) {
    console.warn('signInWithPopup failed, attempting signInWithRedirect fallback...', err);
    // If popup is blocked, or unsupported (e.g. within cross-origin iframes), fall back to redirect
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/operation-not-supported-in-this-environment' ||
      err?.code === 'auth/web-storage-unsupported' ||
      err?.message?.includes('popup') ||
      err?.message?.includes('iframe')
    ) {
      try {
        await signInWithRedirect(auth, provider);
        return null; // Execution redirects, so returning null is appropriate
      } catch (redirectErr: any) {
        console.error('googleSignIn redirect fallback failed:', redirectErr);
        throw redirectErr;
      }
    }
    throw err;
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        googleAccessToken = credential.accessToken;
      }
      return result;
    }
  } catch (err) {
    console.error('Error getting redirect result:', err);
  }
  return null;
};

export const googleSignOut = async () => {
  googleAccessToken = null;
  try {
    await signOut(auth);
  } catch (err: any) {
    console.warn('Firebase Auth signOut ignored expected IndexedDB/environment error:', err);
  }
};

export const sendUserPasswordResetEmail = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const initAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Seed all current initial data into Firebase Firestore if empty
export const seedAllInitialDataToFirestore = async (force: boolean = false) => {
  // Seeding disabled as requested by the user to avoid pre-seeding any data automatically
  return true;
};

// Wipe out old demo collections from Firestore and keep only Admin user
export const clearAndInitFirebaseData = async () => {
  try {
    const collectionsToClear = [
      'classes',
      'discountRules',
      'classTypes',
      'locations',
      'sbaHubOptions',
      'teachers',
      'resources',
      'announcements',
      'schoolNews',
      'registrations',
      'departments',
      'schoolUsers',
      'faqs',
      'featureCards',
      'academyInfo',
    ];

    for (const colName of collectionsToClear) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    }

    // Write primary admin users and admin department
    for (const adminUser of DEMO_SCHOOL_USERS) {
      await setDoc(doc(db, 'schoolUsers', adminUser.id), adminUser);
    }
    if (DEMO_DEPARTMENTS.length > 0) {
      const adminDept = DEMO_DEPARTMENTS[0];
      await setDoc(doc(db, 'departments', adminDept.id), adminDept);
    }

    // Write default academy info & 4 feature cards
    await setDoc(doc(db, 'academyInfo', 'general'), DEFAULT_ACADEMY_INFO);
    for (const card of DEFAULT_FEATURE_CARDS) {
      await setDoc(doc(db, 'featureCards', card.id), card);
    }

    console.log('Firebase cleared of all demo data and reinitialized with Admin user and site config.');
    return true;
  } catch (err) {
    console.error('Error clearing Firebase data:', err);
    return false;
  }
};

// Wipe out ALL site data (classes, discount rules, class types, sba hub options, registrations, etc.)
export const deleteAllSiteData = async () => {
  try {
    const collectionsToWipe = [
      'classes',
      'discountRules',
      'classTypes',
      'locations',
      'sbaHubOptions',
      'registrations',
      'teachers',
      'resources',
      'announcements',
      'schoolNews',
      'faqs',
    ];

    for (const colName of collectionsToWipe) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    }
    console.log('Successfully wiped all platform data from Firestore.');
    return true;
  } catch (err) {
    console.error('Error deleting site data from Firebase:', err);
    return false;
  }
};

// Firestore helper functions for real-time generic collections
export const subscribeToCollection = <T = any>(
  collectionName: string,
  callback: (items: T[]) => void
) => {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: T[] = [];
      snapshot.forEach((docSnapshot) => {
        list.push({ id: docSnapshot.id, ...docSnapshot.data() } as unknown as T);
      });
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, collectionName);
    }
  );
};

// Write listeners for real-time UI notification
type FirestoreWriteListener = (collectionName: string, id: string, data: any, success: boolean, errorMessage?: string) => void;
const writeListeners: FirestoreWriteListener[] = [];

export const onFirestoreWrite = (listener: FirestoreWriteListener) => {
  writeListeners.push(listener);
  return () => {
    const idx = writeListeners.indexOf(listener);
    if (idx !== -1) writeListeners.splice(idx, 1);
  };
};

function notifyWriteListeners(collectionName: string, id: string, data: any, success: boolean, errorMessage?: string) {
  writeListeners.forEach((fn) => {
    try {
      fn(collectionName, id, data, success, errorMessage);
    } catch (e) {
      console.error('Error in writeListener callback:', e);
    }
  });
}

export const saveDocToFirestore = async (collectionName: string, id: string, data: any) => {
  try {
    const cleanData = JSON.parse(JSON.stringify(data));
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, { ...cleanData, updatedAt: new Date().toISOString() }, { merge: true });
    notifyWriteListeners(collectionName, id, cleanData, true);
    return id;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${id}`);
    notifyWriteListeners(collectionName, id, data, false, errMsg);
    return null;
  }
};

export const toggleUserDisabledInFirestore = async (user: SchoolUser, reason?: string) => {
  try {
    const isCurrentlyDisabled = user.status === 'disabled';
    const newStatus = isCurrentlyDisabled ? 'active' : 'disabled';
    const updatedUser: SchoolUser = {
      ...user,
      status: newStatus,
    };

    if (newStatus === 'disabled') {
      updatedUser.disabledAt = new Date().toLocaleString('en-US');
      updatedUser.disabledReason = reason || user.disabledReason || 'Administrative decision';
    } else {
      delete updatedUser.disabledAt;
      delete updatedUser.disabledReason;
    }

    const cleanData = JSON.parse(JSON.stringify(updatedUser));
    const userDocRef = doc(db, 'schoolUsers', user.id);
    await setDoc(userDocRef, { ...cleanData, updatedAt: new Date().toISOString() }, { merge: true });

    if (user.role === 'teacher') {
      const teacherDocRef = doc(db, 'teachers', user.id);
      await setDoc(
        teacherDocRef,
        {
          status: newStatus,
          ...(newStatus === 'disabled'
            ? { disabledAt: updatedUser.disabledAt, disabledReason: updatedUser.disabledReason }
            : { disabledAt: null, disabledReason: null }),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    return updatedUser;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `schoolUsers/${user.id}`);
    return null;
  }
};

export const deleteDocFromFirestore = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
    return false;
  }
};

// Firestore helper functions for registrations
export const saveRegistrationToFirestore = async (registrationData: any) => {
  try {
    const registrationId = registrationData.id || `REG-${Date.now()}`;
    const docRef = doc(db, 'registrations', registrationId);
    await setDoc(docRef, {
      ...registrationData,
      id: registrationId,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
    return registrationId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `registrations`);
    return null;
  }
};

export const subscribeToRegistrations = (callback: (registrations: any[]) => void) => {
  return subscribeToCollection('registrations', callback);
};
