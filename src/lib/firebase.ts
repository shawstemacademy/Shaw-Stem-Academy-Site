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
  writeBatch, where, WhereFilterOp
} from 'firebase/firestore';
import {
  DEMO_SCHOOL_USERS,
  DEMO_DEPARTMENTS,
  DEFAULT_ACADEMY_INFO,
  DEFAULT_FEATURE_CARDS,
} from '../data/schoolDemoData';
import { SchoolUser } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAbovUPLk2wIMM4K44r0RuRPGOJhP1RU0M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shawstemacademy-c0039.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shawstemacademy-c0039",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shawstemacademy-c0039.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "53639382274",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:53639382274:web:8f688e6d5182a3d6d82e1b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XEKYJ5G7W8"
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
  const errMessage = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;

  // Suppress or warn gracefully on transient network/offline/resource-exhausted errors to prevent fatal overlays
  if (
    errCode === 'unavailable' ||
    errCode === 'resource-exhausted' ||
    errMessage.includes('Could not reach Cloud Firestore') ||
    errMessage.includes('offline') ||
    errMessage.includes('resource-exhausted') ||
    errMessage.includes('Write stream exhausted') ||
    errMessage.includes('maximum allowed queued writes')
  ) {
    console.warn(`Firestore connectivity or write backoff (${operationType} at ${path}):`, errMessage);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
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

export const USER_COLLECTIONS = {
  ADMIN: 'users_admin',
  STUDENT: 'users_student',
  TEACHER: 'users_teacher',
} as const;

export const ALL_USER_COLLECTIONS = ['users_admin', 'users_student', 'users_teacher'] as const;

export function getUserCollectionName(role?: string): string {
  if (!role) return 'users_student';
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'registrar') return 'users_admin';
  if (r === 'teacher' || r === 'hod') return 'users_teacher';
  return 'users_student';
}

export const saveUserToFirestore = async (userData: SchoolUser | any) => {
  try {
    if (!userData || !userData.id) {
      console.warn('saveUserToFirestore called without valid userData or id:', userData);
      return null;
    }
    const cleanData = JSON.parse(JSON.stringify(userData));
    const targetCollection = getUserCollectionName(cleanData.role);
    const docRef = doc(db, targetCollection, cleanData.id);
    
    await setDoc(docRef, { ...cleanData, updatedAt: new Date().toISOString() }, { merge: true });

    // Only clean up from other role collections if role was explicitly changed
    if (cleanData.previousRole && cleanData.previousRole !== cleanData.role) {
      const prevCollection = getUserCollectionName(cleanData.previousRole);
      if (prevCollection !== targetCollection) {
        const otherRef = doc(db, prevCollection, cleanData.id);
        await deleteDoc(otherRef).catch(() => {});
      }
    }

    notifyWriteListeners(targetCollection, cleanData.id, cleanData, true);
    return cleanData.id;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const targetCollection = getUserCollectionName(userData?.role);
    handleFirestoreError(err, OperationType.WRITE, `${targetCollection}/${userData?.id}`);
    notifyWriteListeners(targetCollection, userData?.id || 'unknown', userData, false, errMsg);
    return null;
  }
};

export const deleteUserFromFirestore = async (userId: string) => {
  try {
    for (const colName of ALL_USER_COLLECTIONS) {
      const docRef = doc(db, colName, userId);
      await deleteDoc(docRef).catch(() => {});
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    return false;
  }
};

export const subscribeToAllSchoolUsers = (callback: (users: SchoolUser[]) => void) => {
  const collectionData = new Map<string, Map<string, SchoolUser>>();
  ALL_USER_COLLECTIONS.forEach((col) => collectionData.set(col, new Map<string, SchoolUser>()));

  const emitCombined = () => {
    const combinedMap = new Map<string, SchoolUser>();
    ALL_USER_COLLECTIONS.forEach((col) => {
      const map = collectionData.get(col);
      if (map) {
        map.forEach((user, id) => {
          combinedMap.set(id, user);
        });
      }
    });
    callback(Array.from(combinedMap.values()));
  };

  const unsubs = ALL_USER_COLLECTIONS.map((colName) => {
    const colRef = collection(db, colName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const colMap = new Map<string, SchoolUser>();
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data() as SchoolUser;
          colMap.set(docSnapshot.id, { id: docSnapshot.id, ...data });
        });
        collectionData.set(colName, colMap);
        emitCombined();
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, colName);
      }
    );
  });

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
};

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
      'faqs',
      'featureCards',
      'academyInfo',
      'users_student',
      'users_teacher',
      'users_admin'
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

    // Write primary admin users to users_admin
    for (const adminUser of DEMO_SCHOOL_USERS) {
      await saveUserToFirestore(adminUser);
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

export const subscribeToCollectionWhere = <T = any>(
  collectionName: string,
  field: string,
  opStr: WhereFilterOp,
  value: any,
  callback: (items: T[]) => void
) => {
  if (value === undefined || (Array.isArray(value) && value.length === 0)) {
    callback([]);
    return () => {};
  }
  const colRef = collection(db, collectionName);
  const q = query(colRef, where(field, opStr, value));
  return onSnapshot(
    q,
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
    
    // If saving a user, redirect directly to role-based user storage
    if (collectionName === 'schoolUsers' || collectionName === 'users_student' || collectionName === 'users_teacher' || collectionName === 'users_admin') {
      return await saveUserToFirestore({ id, ...cleanData });
    }

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

    // Save directly to role collection
    await saveUserToFirestore(updatedUser);

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
    handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    return null;
  }
};

export const deleteDocFromFirestore = async (collectionName: string, id: string) => {
  try {
    if (collectionName === 'schoolUsers' || collectionName === 'users_student' || collectionName === 'users_teacher' || collectionName === 'users_admin') {
      return await deleteUserFromFirestore(id);
    }

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
    const cleanData = JSON.parse(JSON.stringify(registrationData || {}));
    const docRef = doc(db, 'registrations', registrationId);
    await setDoc(docRef, {
      ...cleanData,
      id: registrationId,
      createdAt: cleanData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
    notifyWriteListeners('registrations', registrationId, cleanData, true);
    return registrationId;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    handleFirestoreError(err, OperationType.WRITE, `registrations/${registrationData?.id || 'new'}`);
    notifyWriteListeners('registrations', registrationData?.id || 'unknown', registrationData, false, errMsg);
    return null;
  }
};

export const subscribeToRegistrations = (callback: (registrations: any[]) => void) => {
  return subscribeToCollection('registrations', callback);
};

export interface SecurityLogEvent {
  eventType: 'google_auth_registration' | 'password_auth_registration' | 'failed_login' | 'successful_login' | 'recaptcha_verification' | 'suspicious_activity';
  status: 'success' | 'failure' | 'warning';
  email?: string;
  userId?: string;
  details?: string;
  userAgent?: string;
}

export const subscribeToDocument = <T = any>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
) => {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as unknown as T);
      } else {
        callback(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${collectionName}/${docId}`);
    }
  );
};

export const subscribeToSectionOrders = (
  callback: (data: { studentPortalSections?: any[]; teacherDashboardSections?: any[] } | null) => void
) => {
  return subscribeToDocument<{ studentPortalSections?: any[]; teacherDashboardSections?: any[] }>(
    'sectionOrders',
    'config',
    callback
  );
};

export const saveSectionOrdersToFirestore = async (
  sectionOrders: { studentPortalSections: any[]; teacherDashboardSections: any[]; updatedBy?: string }
) => {
  try {
    const docRef = doc(db, 'sectionOrders', 'config');
    const cleanData = JSON.parse(JSON.stringify(sectionOrders));
    await setDoc(docRef, {
      ...cleanData,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    }, { merge: true });
    notifyWriteListeners('sectionOrders', 'config', cleanData, true);
    return true;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    handleFirestoreError(err, OperationType.WRITE, 'sectionOrders/config');
    notifyWriteListeners('sectionOrders', 'config', sectionOrders, false, errMsg);
    return false;
  }
};

/**
 * Records authentication attempts, suspicious activity, and reCAPTCHA verifications to 'securityLogs' Firestore collection
 */
export const logSecurityEvent = async (event: SecurityLogEvent) => {
  try {
    const logsRef = collection(db, 'securityLogs');
    const logData = {
      eventType: event.eventType,
      status: event.status,
      email: event.email || auth.currentUser?.email || 'unauthenticated',
      userId: event.userId || auth.currentUser?.uid || 'anonymous',
      details: event.details || '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    };
    await addDoc(logsRef, logData);
    console.log('Security event logged successfully:', logData.eventType, logData.status);
    return true;
  } catch (err) {
    console.warn('logSecurityEvent warning:', err);
    return false;
  }
};
