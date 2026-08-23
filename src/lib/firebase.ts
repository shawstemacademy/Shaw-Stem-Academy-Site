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
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
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
import { SchoolUser, ArchivedUserRecord } from '../types';

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
  if (r === 'admin' || r === 'registrar' || r === 'academic_officer') return 'users_admin';
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

// Firestore helper functions for Pass Rates
export const subscribeToPassRates = (callback: (records: any[]) => void) => {
  return subscribeToCollection('passRates', callback);
};

export const savePassRateToFirestore = async (record: any) => {
  const id = record.id || `PR-${Date.now()}`;
  return saveDocToFirestore('passRates', id, { ...record, id });
};

export const deletePassRateFromFirestore = async (id: string) => {
  return deleteDocFromFirestore('passRates', id);
};

// Firestore helper functions for Expenses & Ledger
export const subscribeToExpenses = (callback: (records: any[]) => void) => {
  return subscribeToCollection('expenses', callback);
};

export const saveExpenseToFirestore = async (record: any) => {
  const id = record.id || `EXP-${Date.now()}`;
  return saveDocToFirestore('expenses', id, { ...record, id });
};

export const deleteExpenseFromFirestore = async (id: string) => {
  return deleteDocFromFirestore('expenses', id);
};

// Firestore helper functions for Enrollments (Single Source of Truth)
export const subscribeToEnrollments = (callback: (records: any[]) => void) => {
  return subscribeToCollection('enrollments', callback);
};

export const saveEnrollmentToFirestore = async (record: any) => {
  const id = record.id || `ENR-${Date.now()}`;
  return saveDocToFirestore('enrollments', id, { ...record, id });
};

export const deleteEnrollmentFromFirestore = async (id: string) => {
  return deleteDocFromFirestore('enrollments', id);
};

// Firestore helper functions for Admission Decisions
export const subscribeToAdmissionDecisions = (callback: (records: any[]) => void) => {
  return subscribeToCollection('admissionDecisions', callback);
};

export const saveAdmissionDecisionToFirestore = async (decision: any) => {
  const id = decision.id || `DEC-${Date.now()}`;
  return saveDocToFirestore('admissionDecisions', id, { ...decision, id });
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

export const registerWithEmailPassword = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithEmailPassword = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// ==========================================
// ARCHIVED USERS & CASCADE DELETION ENGINE
// ==========================================

export const subscribeToArchivedUsers = (callback: (records: ArchivedUserRecord[]) => void) => {
  return subscribeToCollection<ArchivedUserRecord>('deleted_users', (data) => {
    // Sort descending by deletedAt
    const sorted = [...(data || [])].sort((a, b) => {
      const tA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const tB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return tB - tA;
    });
    callback(sorted);
  });
};

export const saveArchivedUserToFirestore = async (record: ArchivedUserRecord) => {
  const deletionId = record.deletionId || record.id || `DEL_${Date.now()}_${String(record.originalUserId || 'user').replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const cleanData = JSON.parse(JSON.stringify({ ...record, id: deletionId, deletionId }));
  const docRef = doc(db, 'deleted_users', deletionId);
  await setDoc(docRef, cleanData, { merge: true });
  notifyWriteListeners('deleted_users', deletionId, cleanData, true);
  return deletionId;
};

export const deleteArchivedUserFromFirestore = async (deletionId: string) => {
  const docRef = doc(db, 'deleted_users', deletionId);
  await deleteDoc(docRef);
  return true;
};

export interface CascadeDeleteOptions {
  userId: string;
  userObj?: SchoolUser | null;
  actorId?: string;
  actorName?: string;
  reason?: string;
}

export interface CascadeDeleteResult {
  success: boolean;
  deletionId?: string;
  archivedRecord?: ArchivedUserRecord;
  error?: string;
  archivedSummary?: {
    totalRecords: number;
    registrations: number;
    enrollments: number;
    attendanceRecords: number;
  };
}

/**
 * Executes a full cascade discovery, archival snapshot to deleted_users,
 * financial totals preservation, and atomic multi-batch scrubbing of active records.
 */
export const cascadeArchiveAndDeleteUser = async (
  options: CascadeDeleteOptions
): Promise<CascadeDeleteResult> => {
  const { userId, userObj, actorId, actorName, reason } = options;
  if (!userId) {
    return { success: false, error: 'User ID is required for cascade deletion.' };
  }

  const deletionId = `DEL_${Date.now()}_${String(userId).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  try {
    // -------------------------------------------------------------
    // PHASE 1: DISCOVER ALL RELATED DATA & CONSTRUCT DEPENDENCY GRAPH
    // -------------------------------------------------------------
    let user: SchoolUser | null = userObj || null;

    // 1. Locate User Profile from role collections or schoolUsers if not supplied
    if (!user) {
      const roleCols = ['users_student', 'users_teacher', 'users_admin', 'users_registrar', 'users_hod', 'schoolUsers'];
      for (const colName of roleCols) {
        try {
          const uDocRef = doc(db, colName, userId);
          const snap = await getDocs(query(collection(db, colName), where('id', '==', userId)));
          if (!snap.empty) {
            user = { id: snap.docs[0].id, ...(snap.docs[0].data() as any) } as SchoolUser;
            break;
          }
        } catch {
          // continue checking
        }
      }
    }

    const fallbackUser: SchoolUser = user || {
      id: userId,
      name: 'Deleted User',
      email: `${userId}@academy.internal`,
      role: 'student',
      status: 'disabled',
    };

    const targetEmails = new Set<string>();
    if (fallbackUser.email) targetEmails.add(fallbackUser.email.toLowerCase().trim());
    if (fallbackUser.studentDetails?.email) targetEmails.add(fallbackUser.studentDetails.email.toLowerCase().trim());
    if (fallbackUser.studentDetails?.parentEmail) targetEmails.add(fallbackUser.studentDetails.parentEmail.toLowerCase().trim());
    if (fallbackUser.studentDetails?.gmailAddress) targetEmails.add(fallbackUser.studentDetails.gmailAddress.toLowerCase().trim());

    const targetStudentIds = new Set<string>([userId]);
    if (fallbackUser.studentDetails?.studentId) targetStudentIds.add(fallbackUser.studentDetails.studentId);
    if (fallbackUser.studentId) targetStudentIds.add(fallbackUser.studentId);

    const targetNames = new Set<string>();
    if (fallbackUser.name) targetNames.add(fallbackUser.name.toLowerCase().trim());
    if (fallbackUser.studentDetails?.studentName) targetNames.add(fallbackUser.studentDetails.studentName.toLowerCase().trim());

    // Discovery Collections
    const docsToDelete: { collection: string; id: string }[] = [];

    // A. Teacher Profile
    let teacherProfile: any = null;
    try {
      const tSnap = await getDocs(query(collection(db, 'teachers'), where('id', '==', userId)));
      if (!tSnap.empty) {
        teacherProfile = tSnap.docs[0].data();
        docsToDelete.push({ collection: 'teachers', id: tSnap.docs[0].id });
      }
    } catch (e) {
      console.warn('Teacher discovery notice:', e);
    }

    // B. Registrations
    const registrations: any[] = [];
    try {
      const regSnap = await getDocs(collection(db, 'registrations'));
      regSnap.forEach((d) => {
        const data = { id: d.id, ...d.data() } as any;
        const regEmail = (data.studentInfo?.email || data.studentInfo?.parentEmail || data.studentInfo?.gmailAddress || data.email || '').toLowerCase().trim();
        const regName = (data.studentInfo?.studentName || data.studentName || '').toLowerCase().trim();
        const regStudentId = data.studentId || data.userId || data.studentInfo?.studentId || '';

        const isMatch =
          targetStudentIds.has(regStudentId) ||
          targetStudentIds.has(data.id) ||
          (regEmail && targetEmails.has(regEmail)) ||
          (regName && targetNames.has(regName));

        if (isMatch) {
          registrations.push(data);
          docsToDelete.push({ collection: 'registrations', id: d.id });
        }
      });
    } catch (e) {
      console.warn('Registrations discovery notice:', e);
    }

    // C. Enrollments
    const enrollments: any[] = [];
    try {
      const enrSnap = await getDocs(collection(db, 'enrollments'));
      enrSnap.forEach((d) => {
        const data = { id: d.id, ...d.data() } as any;
        const enrEmail = (data.studentEmail || '').toLowerCase().trim();
        const enrStudentId = data.studentId || data.userId || '';

        if (targetStudentIds.has(enrStudentId) || (enrEmail && targetEmails.has(enrEmail))) {
          enrollments.push(data);
          docsToDelete.push({ collection: 'enrollments', id: d.id });
        }
      });
    } catch (e) {
      console.warn('Enrollments discovery notice:', e);
    }

    // D. Add / Drop Requests
    const addDropRequests: any[] = [];
    try {
      const adSnap = await getDocs(collection(db, 'addDropRequests'));
      adSnap.forEach((d) => {
        const data = { id: d.id, ...d.data() } as any;
        const adEmail = (data.studentEmail || '').toLowerCase().trim();
        const adStudentId = data.studentId || data.userId || '';

        if (targetStudentIds.has(adStudentId) || (adEmail && targetEmails.has(adEmail))) {
          addDropRequests.push(data);
          docsToDelete.push({ collection: 'addDropRequests', id: d.id });
        }
      });
    } catch (e) {
      console.warn('Add/Drop discovery notice:', e);
    }

    // E. Admission Decisions
    const admissionDecisions: any[] = [];
    try {
      const decSnap = await getDocs(collection(db, 'admissionDecisions'));
      decSnap.forEach((d) => {
        const data = { id: d.id, ...d.data() } as any;
        const decEmail = (data.studentEmail || '').toLowerCase().trim();
        const decStudentId = data.studentId || data.userId || '';

        if (targetStudentIds.has(decStudentId) || (decEmail && targetEmails.has(decEmail))) {
          admissionDecisions.push(data);
          docsToDelete.push({ collection: 'admissionDecisions', id: d.id });
        }
      });
    } catch (e) {
      console.warn('Admission decisions discovery notice:', e);
    }

    // F. Denial Reasons
    const denialReasons: any[] = [];
    try {
      const denSnap = await getDocs(collection(db, 'denialReasons'));
      denSnap.forEach((d) => {
        const data = { id: d.id, ...d.data() } as any;
        const denStudentId = data.studentId || data.userId || '';

        if (targetStudentIds.has(denStudentId)) {
          denialReasons.push(data);
          docsToDelete.push({ collection: 'denialReasons', id: d.id });
        }
      });
    } catch (e) {
      console.warn('Denial reasons discovery notice:', e);
    }

    // G. Attendance Records
    const attendanceRecords: any[] = [];
    try {
      const attSnap = await getDocs(collection(db, 'attendance'));
      attSnap.forEach((d) => {
        const data = { id: d.id, ...d.data() } as any;
        const attStudentId = data.studentId || '';
        const attTeacherId = data.teacherId || data.recordedBy || '';

        if (targetStudentIds.has(attStudentId) || targetStudentIds.has(attTeacherId)) {
          attendanceRecords.push(data);
          docsToDelete.push({ collection: 'attendance', id: d.id });
        }
      });
    } catch (e) {
      console.warn('Attendance discovery notice:', e);
    }

    // H. Teaching Claims & Payroll (for teachers)
    const teacherClaims: any[] = [];
    try {
      const claimSnap = await getDocs(collection(db, 'classClaims'));
      claimSnap.forEach((d) => {
        const data = { id: d.id, ...d.data() } as any;
        const clmTeacherId = data.teacherId || '';
        const clmEmail = (data.teacherEmail || '').toLowerCase().trim();

        if (targetStudentIds.has(clmTeacherId) || (clmEmail && targetEmails.has(clmEmail))) {
          teacherClaims.push(data);
          docsToDelete.push({ collection: 'classClaims', id: d.id });
        }
      });
    } catch (e) {
      console.warn('Teacher claims discovery notice:', e);
    }

    // I. Teaching Resources & Announcements
    const teacherResources: any[] = [];
    try {
      const resSnap = await getDocs(collection(db, 'resources'));
      resSnap.forEach((d) => {
        const data = { id: d.id, ...d.data() } as any;
        if (targetStudentIds.has(data.uploaderId) || targetStudentIds.has(data.authorId)) {
          teacherResources.push(data);
          docsToDelete.push({ collection: 'resources', id: d.id });
        }
      });
    } catch (e) {
      console.warn('Resources discovery notice:', e);
    }

    const teacherAnnouncements: any[] = [];
    try {
      const annSnap = await getDocs(collection(db, 'announcements'));
      annSnap.forEach((d) => {
        const data = { id: d.id, ...d.data() } as any;
        if (targetStudentIds.has(data.authorId) || (data.authorEmail && targetEmails.has(data.authorEmail.toLowerCase().trim()))) {
          teacherAnnouncements.push(data);
          docsToDelete.push({ collection: 'announcements', id: d.id });
        }
      });
    } catch (e) {
      console.warn('Announcements discovery notice:', e);
    }

    // Add user document(s) from user collections
    ['users_student', 'users_teacher', 'users_admin', 'users_registrar', 'users_hod', 'schoolUsers'].forEach((col) => {
      docsToDelete.push({ collection: col, id: userId });
    });

    // -------------------------------------------------------------
    // PHASE 2: FINANCIAL AUDIT SUMMARY PRESERVATION
    // -------------------------------------------------------------
    let totalTuition = 0;
    let totalPaid = 0;
    const paymentsList: { id: string; amount: number; timestamp: string; type?: string; notes?: string }[] = [];

    registrations.forEach((reg) => {
      totalTuition += Number(reg.totalPrice || reg.subtotal || 0);
      if (reg.isPaid) {
        totalPaid += Number(reg.totalPrice || reg.subtotal || 0);
      }
      if (Array.isArray(reg.payments)) {
        reg.payments.forEach((p: any) => {
          paymentsList.push({
            id: p.id || `PAY-${Date.now()}`,
            amount: Number(p.amount || 0),
            timestamp: p.timestamp || p.date || new Date().toISOString(),
            type: p.type || p.method || 'Online Card / Cash',
            notes: p.notes || reg.studentInfo?.studentName || '',
          });
        });
      }
    });

    const remainingBalance = Math.max(0, totalTuition - totalPaid);

    // -------------------------------------------------------------
    // PHASE 3: WRITE ARCHIVE RECORD TO `deleted_users/{deletionId}`
    // -------------------------------------------------------------
    const archivedRecord: ArchivedUserRecord = {
      id: deletionId,
      deletionId,
      originalUserId: userId,
      originalStudentId: fallbackUser.studentDetails?.studentId || fallbackUser.studentId,
      userName: fallbackUser.name || 'Unknown User',
      userEmail: fallbackUser.email || 'unknown@academy.internal',
      userRole: fallbackUser.role || 'student',
      deletedAt: new Date().toISOString(),
      deletedBy: actorId || 'admin',
      deletedByName: actorName || 'System Administrator',
      deletionReason: reason || 'Administrative Deletion & Data Scrub',
      archiveVersion: '1.0',
      archiveStatus: 'ARCHIVED',
      activeDataStatus: 'DELETED',
      recordsArchivedSummary: {
        userProfile: 1,
        teacherProfile: teacherProfile ? 1 : 0,
        registrations: registrations.length,
        enrollments: enrollments.length,
        addDropRequests: addDropRequests.length,
        admissionDecisions: admissionDecisions.length,
        denialReasons: denialReasons.length,
        attendanceRecords: attendanceRecords.length,
        teacherClaims: teacherClaims.length,
        teacherResources: teacherResources.length,
        teacherAnnouncements: teacherAnnouncements.length,
        notifications: 0,
        totalRecords:
          1 +
          (teacherProfile ? 1 : 0) +
          registrations.length +
          enrollments.length +
          addDropRequests.length +
          admissionDecisions.length +
          denialReasons.length +
          attendanceRecords.length +
          teacherClaims.length +
          teacherResources.length +
          teacherAnnouncements.length,
      },
      financialSummary: {
        totalTuition,
        totalPaid,
        remainingBalance,
        paymentCount: paymentsList.length,
        payments: paymentsList,
      },
      user: fallbackUser,
      teacherProfile,
      registrations,
      enrollments,
      addDropRequests,
      admissionDecisions,
      denialReasons,
      attendanceRecords,
      teacherClaims,
      teacherResources,
      teacherAnnouncements,
    };

    // Save archive first and verify
    await saveArchivedUserToFirestore(archivedRecord);

    // -------------------------------------------------------------
    // PHASE 4: ATOMIC MULTI-BATCH ACTIVE RECORD SCRUBBING
    // -------------------------------------------------------------
    // Execute deletion batches in chunks of <= 400 operations
    const BATCH_SIZE = 400;
    const uniqueDocs = Array.from(
      new Map(docsToDelete.map((item) => [`${item.collection}/${item.id}`, item])).values()
    );

    for (let i = 0; i < uniqueDocs.length; i += BATCH_SIZE) {
      const chunk = uniqueDocs.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((item) => {
        const itemRef = doc(db, item.collection, item.id);
        batch.delete(itemRef);
      });
      try {
        await batch.commit();
      } catch (batchErr) {
        console.warn('Batch deletion non-fatal warning for chunk:', batchErr);
      }
    }

    // -------------------------------------------------------------
    // PHASE 5: DELETE FROM FIREBASE AUTH VIA SERVER API
    // -------------------------------------------------------------
    try {
      await fetch('/api/cascade-delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          deletionId,
          reason,
          actorId,
          actorName,
        }),
      });
    } catch (authErr) {
      console.warn('Server auth deletion notification notice:', authErr);
    }

    // -------------------------------------------------------------
    // PHASE 6: LOG SYSTEM ACTION AUDIT TRAIL
    // -------------------------------------------------------------
    try {
      const logsRef = collection(db, 'systemActionLogs');
      await addDoc(logsRef, {
        actionType: 'user_deleted',
        actionName: `Cascade Deletion & Archival: ${fallbackUser.name}`,
        actorId: actorId || 'admin',
        actorName: actorName || 'System Administrator',
        actorRole: 'admin',
        targetUserId: userId,
        targetUserName: fallbackUser.name,
        targetUserEmail: fallbackUser.email,
        deletionId,
        reason: reason || 'Administrative Deletion',
        recordsScrubbedCount: uniqueDocs.length,
        financialPreservedTuition: totalTuition,
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
    } catch (logErr) {
      console.warn('System audit log write notice:', logErr);
    }

    return {
      success: true,
      deletionId,
      archivedRecord,
      archivedSummary: {
        totalRecords: archivedRecord.recordsArchivedSummary.totalRecords,
        registrations: registrations.length,
        enrollments: enrollments.length,
        attendanceRecords: attendanceRecords.length,
      },
    };
  } catch (error: any) {
    console.error('cascadeArchiveAndDeleteUser caught error:', error);
    return {
      success: false,
      error: error?.message || String(error),
    };
  }
};

/**
 * Restores an archived user account and its historical records back to active collections.
 */
export const restoreArchivedUserFromFirestore = async (
  deletionId: string,
  actorId?: string,
  actorName?: string,
  notes?: string
): Promise<{ success: boolean; error?: string; restoredUser?: SchoolUser }> => {
  try {
    const archiveRef = doc(db, 'deleted_users', deletionId);
    const snap = await getDocs(query(collection(db, 'deleted_users'), where('id', '==', deletionId)));
    
    if (snap.empty) {
      return { success: false, error: 'Archive record not found.' };
    }

    const archiveData = snap.docs[0].data() as ArchivedUserRecord;
    const user = archiveData.user;
    if (!user || !user.id) {
      return { success: false, error: 'Archive document does not contain valid user profile snapshot.' };
    }

    // 1. Re-insert user into role collection
    await saveUserToFirestore(user);

    // 2. Re-insert teacher profile if available
    if (archiveData.teacherProfile) {
      const tRef = doc(db, 'teachers', user.id);
      await setDoc(tRef, archiveData.teacherProfile, { merge: true });
    }

    // 3. Re-insert registrations
    if (Array.isArray(archiveData.registrations)) {
      for (const reg of archiveData.registrations) {
        if (reg && reg.id) {
          const regRef = doc(db, 'registrations', reg.id);
          await setDoc(regRef, reg, { merge: true });
        }
      }
    }

    // 4. Re-insert enrollments
    if (Array.isArray(archiveData.enrollments)) {
      for (const enr of archiveData.enrollments) {
        if (enr && enr.id) {
          const enrRef = doc(db, 'enrollments', enr.id);
          await setDoc(enrRef, enr, { merge: true });
        }
      }
    }

    // 5. Re-insert add/drop requests
    if (Array.isArray(archiveData.addDropRequests)) {
      for (const req of archiveData.addDropRequests) {
        if (req && req.id) {
          const reqRef = doc(db, 'addDropRequests', req.id);
          await setDoc(reqRef, req, { merge: true });
        }
      }
    }

    // 6. Re-insert admission decisions & denial reasons
    if (Array.isArray(archiveData.admissionDecisions)) {
      for (const dec of archiveData.admissionDecisions) {
        if (dec && dec.id) {
          const decRef = doc(db, 'admissionDecisions', dec.id);
          await setDoc(decRef, dec, { merge: true });
        }
      }
    }

    if (Array.isArray(archiveData.denialReasons)) {
      for (const den of archiveData.denialReasons) {
        if (den && den.id) {
          const denRef = doc(db, 'denialReasons', den.id);
          await setDoc(denRef, den, { merge: true });
        }
      }
    }

    // 7. Re-insert attendance records
    if (Array.isArray(archiveData.attendanceRecords)) {
      for (const att of archiveData.attendanceRecords) {
        if (att && att.id) {
          const attRef = doc(db, 'attendance', att.id);
          await setDoc(attRef, att, { merge: true });
        }
      }
    }

    // 8. Update Archive status
    await setDoc(
      archiveRef,
      {
        activeDataStatus: 'RESTORED',
        restoredAt: new Date().toISOString(),
        restoredBy: actorId || 'admin',
        restoredByName: actorName || 'System Administrator',
        restorationNotes: notes || 'Account restored to active status by administrator.',
      },
      { merge: true }
    );

    // 9. Log system action
    try {
      const logsRef = collection(db, 'systemActionLogs');
      await addDoc(logsRef, {
        actionType: 'user_created',
        actionName: `Restored User Account: ${user.name}`,
        actorId: actorId || 'admin',
        actorName: actorName || 'System Administrator',
        actorRole: 'admin',
        targetUserId: user.id,
        targetUserName: user.name,
        targetUserEmail: user.email,
        deletionId,
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
    } catch {
      // ignore log failure
    }

    return { success: true, restoredUser: user };
  } catch (err: any) {
    console.error('restoreArchivedUserFromFirestore error:', err);
    return { success: false, error: err?.message || String(err) };
  }
};


