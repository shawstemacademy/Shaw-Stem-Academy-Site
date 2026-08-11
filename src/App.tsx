/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Lock } from 'lucide-react';
import { requestNotificationPermission, sendDesktopNotification, playNotificationSound } from './lib/notifications';
import { requestAndSaveFcmToken, DEFAULT_VAPID_KEY, sendPushNotificationToUser, sendPushNotificationToClass, sendPushNotificationToAll } from './lib/fcm';
import {
  auth,
  initAuth,
  googleSignIn,
  googleSignOut,
  handleRedirectResult,
  saveRegistrationToFirestore,
  subscribeToRegistrations,
  seedAllInitialDataToFirestore,
  clearAndInitFirebaseData,
  deleteAllSiteData,
  testFirestoreConnection,
  subscribeToCollection,
  saveDocToFirestore,
  deleteDocFromFirestore,
  toggleUserDisabledInFirestore,
  onFirestoreWrite,
} from './lib/firebase';
import {
  ClassItem,
  DiscountRule,
  StudentInfo,
  FormTheme,
  AppliedDiscount,
  RegistrationRecord,
  AttendanceRecord,
  PortalTab,
  UserRole,
  StudentStatus,
  TeacherResource,
  ClassAnnouncement,
  Department,
  SchoolUser,
  ResourceCategory,
  RolePermission,
  TeacherProfile,
  SystemActionLog,
  SbaHubOption,
  LandingPageSettings,
  ScheduleClash,
  ClashAdmissibility,
  FaqItem,
  AcademyInfo,
  FeatureCard,
  ClassType,
  LocationOption,
  ClassClaimItem,
  TeacherHourlyRate,
} from './types';
import { detectScheduleClashes } from './lib/scheduleClashUtils';
import {
  INITIAL_CLASSES,
  INITIAL_DISCOUNT_RULES,
  FORM_THEMES,
  INITIAL_SBA_HUB_OPTIONS,
  DEFAULT_CLASS_TYPES,
} from './data/initialClasses';
import {
  DEMO_TEACHERS,
  DEMO_RESOURCES,
  DEMO_ANNOUNCEMENTS,
  DEMO_SCHOOL_NEWS,
  DEMO_REGISTRATION_LOGS,
  DEMO_DEPARTMENTS,
  DEMO_SCHOOL_USERS,
  DEMO_ROLE_PERMISSIONS,
  DEMO_SYSTEM_LOGS,
  DEFAULT_ACADEMY_INFO,
  DEFAULT_FEATURE_CARDS
} from './data/schoolDemoData';

import { SchoolHeaderNav } from './components/school/SchoolHeaderNav';
import { SchoolHomePage } from './components/school/SchoolHomePage';
import { AcademicsPage } from './components/school/AcademicsPage';
import { StudentPortalPage } from './components/school/StudentPortalPage';
import { TeacherDashboardPage } from './components/school/TeacherDashboardPage';
import { AdminDashboardPage } from './components/school/AdminDashboardPage';
import { LoginPage } from './components/school/LoginPage';
import { PrivacyPolicyPage } from './components/school/PrivacyPolicyPage';

import { FormHeader } from './components/FormHeader';
import { StudentInfoForm } from './components/StudentInfoForm';
import { ClassSelectionCatalog } from './components/ClassSelectionCatalog';
import { SbaHubCatalog } from './components/SbaHubCatalog';
import { ManageListOptionsModal } from './components/ManageListOptionsModal';
import { RunningTotalCard } from './components/RunningTotalCard';
import { DiscountRulesModal } from './components/DiscountRulesModal';
import { RegistrationReceiptModal } from './components/RegistrationReceiptModal';

export default function App() {
  // Refs for tracking changes and triggering PWA/Desktop notifications
  const prevNewsRef = useRef<any[]>([]);
  const prevAnnouncementsRef = useRef<any[]>([]);
  const prevRegistrationsRef = useRef<any[]>([]);
  const prevUserStatusRef = useRef<{[userId: string]: string}>({});

  const isInitialNewsRef = useRef(true);
  const isInitialAnnouncementsRef = useRef(true);
  const isInitialRegistrationsRef = useRef(true);
  const isInitialUsersRef = useRef(true);

  // Google Auth User
  const [user, setUser] = useState<User | null>(null);

  // School Portal Navigation & Role State
  const [activeTab, setActiveTab] = useState<PortalTab>('home');
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [studentStatus, setStudentStatus] = useState<StudentStatus>('prospective');
  const [loggedInUser, setLoggedInUser] = useState<SchoolUser | null>(null);
  const [currentFcmToken, setCurrentFcmToken] = useState<string | null>(null);
  const [resourceCategories, setResourceCategories] = useState<ResourceCategory[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  // Persist manual logged-in user
  useEffect(() => {
    if (loggedInUser && loggedInUser.id && (loggedInUser.id.startsWith('usr-') || loggedInUser.id.startsWith('guser_'))) {
      localStorage.setItem('saved_user_id', loggedInUser.id);
    } else if (!loggedInUser) {
      localStorage.removeItem('saved_user_id');
    }
  }, [loggedInUser]);

  // Synchronize studentStatus with loggedInUser status
  useEffect(() => {
    if (loggedInUser && loggedInUser.role === 'student' && loggedInUser.status) {
      setStudentStatus(loggedInUser.status);
    }
  }, [loggedInUser]);

  // Auto request notification permission and save FCM token on login
  useEffect(() => {
    if (loggedInUser || user) {
      const timer = setTimeout(() => {
        requestNotificationPermission().then((perm) => {
          if (perm === 'granted') {
            requestAndSaveFcmToken(DEFAULT_VAPID_KEY, {
              email: loggedInUser?.email || user?.email || undefined,
              id: loggedInUser?.id || user?.uid || undefined,
              name: loggedInUser?.name || user?.displayName || undefined
            }).then((res) => {
              if (res?.token) {
                setCurrentFcmToken(res.token);
              }
            });
            const hasShown = localStorage.getItem('notifications_welcome_shown');
            if (!hasShown) {
              sendDesktopNotification(
                "🔔 Notifications Enabled", 
                `Welcome back, ${loggedInUser?.name || user?.displayName || 'User'}! You will receive live alerts on Shaw STEM Academy.`
              );
              localStorage.setItem('notifications_welcome_shown', 'true');
            }
          }
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loggedInUser, user]);

  // Real-time FCM push queue listener for live notifications across mobile and web devices
  useEffect(() => {
    const userEmail = (loggedInUser?.email || user?.email || '').toLowerCase().trim();
    const userId = loggedInUser?.id || user?.uid || '';
    const myDeviceToken = currentFcmToken;

    const unsub = subscribeToCollection('fcmNotificationQueue', (items: any[]) => {
      if (!items || items.length === 0) return;
      
      const now = Date.now();
      items.forEach((item) => {
        if (!item.createdAt) return;
        const createdAtTime = new Date(item.createdAt).getTime();
        // Trigger for notifications created in the last 20 seconds
        if (now - createdAtTime < 20000) {
          const itemTargetEmail = (item.targetEmail || '').toLowerCase().trim();
          const itemTargetUserId = item.targetUserId || '';
          const itemTargetEmails: string[] = item.targetEmails || [];
          const itemTokens: string[] = item.tokens || [];

          const isTargetEmailMatch = userEmail && itemTargetEmail && itemTargetEmail === userEmail;
          const isTargetUserIdMatch = userId && itemTargetUserId && itemTargetUserId === userId;
          const isEmailInClassList = userEmail && itemTargetEmails.map((e: string) => e.toLowerCase().trim()).includes(userEmail);
          const isTokenMatch = myDeviceToken && itemTokens.includes(myDeviceToken);
          const isBroadcast = item.isBroadcast || (!item.targetEmail && !item.targetUserId && itemTargetEmails.length === 0 && itemTokens.length === 0);

          if (isTargetEmailMatch || isTargetUserIdMatch || isEmailInClassList || isTokenMatch || isBroadcast) {
            sendDesktopNotification(
              item.title || "🔔 New Academy Notification",
              item.body || "You have a new message from Shaw STEM Academy."
            );
          }
        }
      });
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [loggedInUser, user, currentFcmToken]);

  useEffect(() => {
    const handleFirestoreErrorEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const errorMsg = customEvent.detail?.error || 'Database connection error';
      if (errorMsg.includes('Missing or insufficient permissions')) {
        setDbError('Database connection issue: The current Firebase project rules do not allow access. Please ensure your Firestore rules are configured correctly, or log in if required.');
      } else {
        setDbError(`Database issue: ${errorMsg}`);
      }
    };
    window.addEventListener('firestore-error', handleFirestoreErrorEvent);
    return () => window.removeEventListener('firestore-error', handleFirestoreErrorEvent);
  }, []);

  // Handle URL query parameter-based routing for Google Search Console crawlers and Verification bots
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const allowedTabs: PortalTab[] = ['home', 'privacy', 'login', 'academics', 'student-portal', 'teacher-dashboard', 'admin-dashboard', 'admissions', 'registration'];
      if (allowedTabs.includes(tabParam as PortalTab)) {
        setActiveTab(tabParam as PortalTab);
      }
    }
  }, []);

  const [landingPageSettings, setLandingPageSettings] = useState<LandingPageSettings>({
    title: 'Shaw STEM Academy',
    subtitle: 'Innovate. Explore. Lead.',
    logoUrl: '/favicon.png'
  });

  // School Demo State
  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfile[]>([]);
  const [resources, setResources] = useState<TeacherResource[]>([]);
  const [announcements, setAnnouncements] = useState<ClassAnnouncement[]>([]);
  const [schoolNews, setSchoolNews] = useState<any[]>([]);
  const [registrationLogs, setRegistrationLogs] = useState<RegistrationRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [schoolUsers, setSchoolUsers] = useState<SchoolUser[]>([]);
  const [schoolUsersLoaded, setSchoolUsersLoaded] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [systemActionLogs, setSystemActionLogs] = useState<SystemActionLog[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo | null>(DEFAULT_ACADEMY_INFO);
  const [featureCards, setFeatureCards] = useState<FeatureCard[]>(DEFAULT_FEATURE_CARDS);

  // Teaching Claims & Payroll System State
  const [claims, setClaims] = useState<ClassClaimItem[]>([
    {
      id: 'claim-101-20260805',
      classId: 'cls-101',
      className: 'Advanced Robotics & Automation',
      classCode: 'ROB-301',
      classType: 'regular',
      teacherId: 'usr-1',
      teacherName: 'Dr. Marcus Vance',
      teacherEmail: 'm.vance@shawstemacademy.edu',
      date: '2026-08-05',
      dayOfWeek: 'Wednesday',
      startTime: '16:00',
      endTime: '17:30',
      durationHours: 1.5,
      hourlyRate: 40,
      calculatedPayout: 60,
      status: 'verified',
      claimedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      verifiedAt: new Date(Date.now() - 86400000).toISOString(),
      verifiedBy: 'Clara Rodriguez',
    },
    {
      id: 'claim-sba1-20260806',
      classId: 'sba-1',
      className: 'CSEC Physics SBA Practical Lab',
      classCode: 'PHY-SBA',
      classType: 'sba_hub',
      teacherId: 'usr-1',
      teacherName: 'Dr. Marcus Vance',
      teacherEmail: 'm.vance@shawstemacademy.edu',
      date: '2026-08-06',
      dayOfWeek: 'Thursday',
      startTime: '15:30',
      endTime: '17:00',
      durationHours: 1.5,
      hourlyRate: 40,
      calculatedPayout: 60,
      status: 'claimed',
      claimedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    }
  ]);
  const [hourlyRates, setHourlyRates] = useState<TeacherHourlyRate[]>([
    { userId: 'usr-1', userName: 'Dr. Marcus Vance', hourlyRate: 40.00 },
    { userId: 'usr-2', userName: 'Sarah Jenkins', hourlyRate: 45.00 },
  ]);

  const handleUpdateClaims = (updatedClaims: ClassClaimItem[]) => {
    setClaims(updatedClaims);
  };

  const handleUpdateHourlyRates = (updatedRates: TeacherHourlyRate[]) => {
    setHourlyRates(updatedRates);
  };

  // Registration Auth States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState<'google' | 'password'>('password');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showTimeoutAlert, setShowTimeoutAlert] = useState(false);
  const [globalAuthAlert, setGlobalAuthAlert] = useState<{ title: string; message: string; details?: string } | null>(null);

  // Global Realtime Firestore Action Toast
  const [firestoreToast, setFirestoreToast] = useState<{ id: string; title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const unsub = onFirestoreWrite((collectionName, docId, data, success, errMsg) => {
      const displayName = data?.name || data?.email || data?.title || docId;
      if (success) {
        setFirestoreToast({
          id: `toast-${Date.now()}`,
          title: `Firestore Database Write (${collectionName})`,
          message: `Document '${displayName}' (ID: ${docId}) saved successfully to '${collectionName}' collection.`,
          type: 'success',
        });
      } else {
        setFirestoreToast({
          id: `toast-${Date.now()}`,
          title: `Firestore Write Failed (${collectionName})`,
          message: `Failed to save '${displayName}' to '${collectionName}': ${errMsg || 'Permission or network error.'}`,
          type: 'error',
        });
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (firestoreToast) {
      const timer = setTimeout(() => {
        setFirestoreToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [firestoreToast]);

  const logSystemAction = (
    actionType: SystemActionLog['actionType'],
    description: string,
    metadata?: any
  ) => {
    let actor = 'System';
    if (loggedInUser) {
      actor = `${loggedInUser.title || loggedInUser.role} • ${loggedInUser.name}`;
    } else if (user) {
      actor = user.email || 'Authenticated User';
    } else {
      actor = 'Anonymous / Guest';
    }

    const newLog: SystemActionLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actionType,
      actor,
      description,
      metadata
    };

    setSystemActionLogs(prev => [newLog, ...prev]);
  };

  // Form Metadata
  const [formTitle, setFormTitle] = useState('Fall 2026 Class & Workshop Registration');
  const [formDescription, setFormDescription] = useState(
    'Welcome to our Fall 2026 Registration Portal! Please select the classes you or your student wish to attend. Tuition fees and multi-class bundle discounts calculate in real-time as you select your options.'
  );
  const [theme, setTheme] = useState<FormTheme>(FORM_THEMES[0]);
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  // State for Entire Portal Light/Dark Theme Mode
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portalThemeMode');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    }
    return 'light';
  });

  // Apply dark mode class to document HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('portalThemeMode', themeMode);
  }, [themeMode]);

  // Sync themeMode with loggedInUser preference from Firestore
  useEffect(() => {
    if (loggedInUser && loggedInUser.themeMode && loggedInUser.themeMode !== themeMode) {
      setThemeMode(loggedInUser.themeMode);
    }
  }, [loggedInUser?.id]);

  const handleToggleThemeMode = async () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    localStorage.setItem('portalThemeMode', nextTheme);

    if (loggedInUser && loggedInUser.id) {
      const updatedUser: SchoolUser = {
        ...loggedInUser,
        themeMode: nextTheme,
      };
      await saveDocToFirestore('schoolUsers', loggedInUser.id, updatedUser);
    }
  };

  // Catalog & Selections
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const handleUpdateClassList = async (action: ClassItem[] | React.SetStateAction<ClassItem[]>) => {
    const updatedClasses = typeof action === 'function' ? (action as (prev: ClassItem[]) => ClassItem[])(classList) : action;
    if (!Array.isArray(updatedClasses)) return;

    setClassList(updatedClasses);
    for (const cls of updatedClasses) {
      const existing = classList.find((c) => c.id === cls.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(cls)) {
        await saveDocToFirestore('classes', cls.id, cls);

        // Check if location or schedule changed and notify students
        if (existing) {
          let pushTitle = '';
          let pushBody = '';
          if (existing.location !== cls.location) {
            pushTitle = `Location Update: ${cls.title}`;
            pushBody = `The location for ${cls.title} has changed to ${cls.location || 'TBA'}.`;
          } else if (existing.days !== cls.days || existing.time !== cls.time) {
            pushTitle = `Schedule Update: ${cls.title}`;
            pushBody = `The schedule for ${cls.title} has changed to ${cls.days} at ${cls.time}.`;
          }

          if (pushTitle) {
            sendPushNotificationToClass(cls.id, pushTitle, pushBody);
          }
        }
      }
    }
    for (const oldCls of classList) {
      if (!updatedClasses.some((c) => c.id === oldCls.id)) {
        await deleteDocFromFirestore('classes', oldCls.id);
      }
    }
  };

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [enrolledClassIds, setEnrolledClassIds] = useState<string[]>([]);
  const [enrolledSbaHubIds, setEnrolledSbaHubIds] = useState<string[]>([]);
  const [sbaHubOptions, setSbaHubOptions] = useState<SbaHubOption[]>([]);

  const handleUpdateSbaHubOptions = async (action: SbaHubOption[] | React.SetStateAction<SbaHubOption[]>) => {
    const updatedSba = typeof action === 'function' ? (action as (prev: SbaHubOption[]) => SbaHubOption[])(sbaHubOptions) : action;
    if (!Array.isArray(updatedSba)) return;

    setSbaHubOptions(updatedSba);
    for (const sba of updatedSba) {
      const existing = sbaHubOptions.find((s) => s.id === sba.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(sba)) {
        await saveDocToFirestore('sbaHubOptions', sba.id, sba);
      }
    }
    for (const oldSba of sbaHubOptions) {
      if (!updatedSba.some((s) => s.id === oldSba.id)) {
        await deleteDocFromFirestore('sbaHubOptions', oldSba.id);
      }
    }
  };

  const [selectedSbaHubIds, setSelectedSbaHubIds] = useState<string[]>([]);
  const [clashes, setClashes] = useState<ScheduleClash[]>([]);

  const enrolledClasses = classList.filter((c) => enrolledClassIds.includes(c.id));

  // Automatically recalculate schedule clashes when classList updates
  useEffect(() => {
    const detected = detectScheduleClashes(classList);
    setClashes(detected);
  }, [classList]);

  // Enforce capacity of 10 for all current classes in the database
  useEffect(() => {
    if (classList.length > 0) {
      const needsUpdate = classList.some((c) => c.capacity !== 10);
      if (needsUpdate) {
        const updated = classList.map((c) => ({ ...c, capacity: 10 }));
        handleUpdateClassList(updated);
      }
    }
  }, [classList]);

  const handleUpdateClashStatus = (clashId: string, status: ClashAdmissibility, notes?: string) => {
    setClashes((prev) =>
      prev.map((c) => (c.id === clashId ? { ...c, status, reasonNotes: notes ?? c.reasonNotes } : c))
    );
  };

  const handleRecalculateClashes = () => {
    const detected = detectScheduleClashes(classList);
    setClashes(detected);
  };

  // Registrant Info
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    studentName: '',
    studentAge: '',
    gradeLevel: '',
    emergencyContact: '',
    sbaHubSelection: [],
    livesWith: '',
  });

  // Keep studentInfo synced with logged-in user details
  useEffect(() => {
    const curEmail = loggedInUser?.email || user?.email;
    const curName = loggedInUser?.name || user?.displayName || (curEmail ? curEmail.split('@')[0] : '');
    const details = loggedInUser?.studentDetails || {};

    if (curEmail || curName) {
      setStudentInfo((prev) => {
        const nameParts = curName ? curName.split(' ') : [];
        const fName = prev.firstName || details.firstName || nameParts[0] || 'Student';
        const lName = prev.lastName || details.lastName || nameParts.slice(1).join(' ') || '';

        const ageVal = prev.studentAge || prev.age || details.studentAge || details.age || '';
        const gradeVal = prev.gradeLevel || prev.formGrade || details.gradeLevel || details.formGrade || '';
        const phoneVal = prev.parentPhone || prev.cellPhone || prev.homePhone ||
          prev.motherCellPhone || prev.fatherCellPhone || prev.guardianCellPhone ||
          details.parentPhone || details.cellPhone || details.homePhone || details.motherCellPhone ||
          details.fatherCellPhone || details.guardianCellPhone || details.emergencyContact || '';

        return {
          ...details,
          ...prev,
          email: curEmail || prev.email,
          studentName: curName || prev.studentName || `${fName} ${lName}`.trim(),
          firstName: fName,
          lastName: lName,
          parentEmail: prev.parentEmail || details.parentEmail || '',
          age: ageVal,
          studentAge: ageVal,
          formGrade: gradeVal,
          gradeLevel: gradeVal,
          cellPhone: prev.cellPhone || details.cellPhone || '',
          parentPhone: prev.parentPhone || details.parentPhone || '',
        };
      });
    }
  }, [loggedInUser, user]);

  // Class Types Management
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const handleSaveClassType = async (ct: ClassType) => {
    setClassTypes((prev) => {
      const exists = prev.some((item) => item.id === ct.id);
      if (exists) {
        return prev.map((item) => (item.id === ct.id ? ct : item));
      }
      return [...prev, ct];
    });
    await saveDocToFirestore('classTypes', ct.id, ct);
  };

  const handleDeleteClassType = async (id: string) => {
    setClassTypes((prev) => prev.filter((item) => item.id !== id));
    await deleteDocFromFirestore('classTypes', id);
  };

  // Locations Management
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const handleSaveLocation = async (loc: LocationOption) => {
    setLocations((prev) => {
      const exists = prev.some((item) => item.id === loc.id);
      if (exists) {
        return prev.map((item) => (item.id === loc.id ? loc : item));
      }
      return [...prev, loc];
    });
    await saveDocToFirestore('locations', loc.id, loc);
  };

  const handleDeleteLocation = async (id: string) => {
    setLocations((prev) => prev.filter((item) => item.id !== id));
    await deleteDocFromFirestore('locations', id);
  };

  // Discount Rules & Promo
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const handleUpdateDiscountRules = async (action: DiscountRule[] | React.SetStateAction<DiscountRule[]>) => {
    const updatedRules = typeof action === 'function' ? (action as (prev: DiscountRule[]) => DiscountRule[])(discountRules) : action;
    if (!Array.isArray(updatedRules)) return;

    setDiscountRules(updatedRules);
    for (const rule of updatedRules) {
      const existing = discountRules.find((r) => r.id === rule.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(rule)) {
        await saveDocToFirestore('discountRules', rule.id, rule);
      }
    }
    for (const oldRule of discountRules) {
      if (!updatedRules.some((r) => r.id === oldRule.id)) {
        await deleteDocFromFirestore('discountRules', oldRule.id);
      }
    }
  };

  const [isSiblingSelected, setIsSiblingSelected] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Modals
  const [isDiscountConfigOpen, setIsDiscountConfigOpen] = useState(false);
  const [isManageListOptionsOpen, setIsManageListOptionsOpen] = useState(false);
  const [completedRegistration, setCompletedRegistration] = useState<RegistrationRecord | null>(null);

  // Initialize Firebase Auth & Real-Time Firestore Synchronization
  useEffect(() => {
    const init = async () => {
      try {
        // Handle redirect result if coming back from Google Sign-In
        const result = await handleRedirectResult();
        if (result && result.user) {
          await handleNewUserCreation(result.user);
        }
      } catch (err: any) {
        console.error('Error during Google Sign-In redirect handling:', err);
        const domain = window.location.hostname;
        let msg = err?.message || 'Google authentication failed during redirect processing.';
        if (err?.code === 'auth/unauthorized-domain') {
          msg = `Domain Unauthorized (${domain}): This domain is not authorized in your Firebase Auth Console. Please go to Firebase Console > Authentication > Settings > Authorized Domains and add "${domain}".`;
        } else if (err?.code === 'auth/popup-blocked') {
          msg = 'Pop-up Blocked: Please enable pop-ups for this site, or open this app in a New Tab using the button in the top right to sign in.';
        }
        setGlobalAuthAlert({
          title: 'Authentication Error',
          message: msg,
          details: err?.code ? `Firebase Code: ${err.code}` : undefined
        });
      }
    };
    init();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Subscribe to PUBLIC Firestore collections for live data updates
    const unsubs = [
      subscribeToCollection<ClassItem>('classes', (data) => setClassList(data || [])),
      subscribeToCollection<SbaHubOption>('sbaHubOptions', (data) => setSbaHubOptions(data || [])),
      subscribeToCollection<DiscountRule>('discountRules', (data) => setDiscountRules(data || [])),
      subscribeToCollection<ClassType>('classTypes', (data) => setClassTypes(data || [])),
      subscribeToCollection<LocationOption>('locations', (data) => {
        if (data && data.length > 0) {
          setLocations(data);
        } else {
          // Default locations to seed if database locations collection is empty
          const DEFAULT_LOCS: LocationOption[] = [
            { id: 'loc-stem-lab-a', name: 'STEM Lab A' },
            { id: 'loc-innovation-lab-a', name: 'Innovation Lab A' },
            { id: 'loc-mechatronics-studio', name: 'Mechatronics Studio' },
            { id: 'loc-computer-studio-2', name: 'Computer Studio 2' },
            { id: 'loc-art-studio-b', name: 'Art Studio B' },
            { id: 'loc-music-hall-1', name: 'Music Hall 1' },
            { id: 'loc-science-lab-3', name: 'Science Lab 3' },
            { id: 'loc-online-sba-hub', name: 'Online SBA Hub' },
            { id: 'loc-main-auditorium', name: 'Main Auditorium' },
          ];
          setLocations(DEFAULT_LOCS);
          DEFAULT_LOCS.forEach((loc) => {
            saveDocToFirestore('locations', loc.id, loc);
          });
        }
      }),
      subscribeToCollection<TeacherProfile>('teachers', (data) => setTeacherProfiles(data || [])),
      subscribeToCollection<any>('schoolNews', (data) => {
        setSchoolNews(data || []);
        if (data && data.length > 0) {
          if (isInitialNewsRef.current) {
            prevNewsRef.current = data;
            isInitialNewsRef.current = false;
          } else {
            const newItems = data.filter(
              (item) => !prevNewsRef.current.some((prev) => prev.id === item.id)
            );
            newItems.forEach((item) => {
              sendDesktopNotification(
                `📰 New School Announcement`,
                item.title || 'A new announcement has been published.'
              );
            });
            prevNewsRef.current = data;
          }
        }
      }),
      subscribeToCollection<Department>('departments', (data) => {
        if (data && data.length > 0) {
          setDepartments(data);
        } else {
          const DEFAULT_DEPTS: Department[] = [
            {
              id: 'dept-stem',
              name: 'STEM & Robotics',
              code: 'STEM',
              description: 'Science, Technology, Engineering, Mathematics, and Robotics labs.',
              headOfDepartment: '',
              color: 'bg-purple-600',
              room: 'STEM Lab A',
            },
            {
              id: 'dept-coding',
              name: 'Coding & AI',
              code: 'CODE',
              description: 'Software development, artificial intelligence, and machine learning.',
              headOfDepartment: '',
              color: 'bg-blue-600',
              room: 'Computer Studio 2',
            },
            {
              id: 'dept-arts',
              name: 'Arts & Design',
              code: 'ARTS',
              description: 'Visual arts, graphic design, animation, and digital media.',
              headOfDepartment: '',
              color: 'bg-pink-600',
              room: 'Art Studio B',
            },
            {
              id: 'dept-languages',
              name: 'Languages & Music',
              code: 'LANG',
              description: 'Foreign languages, speech, vocal training, and music theory.',
              headOfDepartment: '',
              color: 'bg-amber-600',
              room: 'Music Hall 1',
            },
            {
              id: 'dept-admin',
              name: 'Administration & Registrar',
              code: 'ADMIN',
              description: 'Academy governance, admissions registration, and system operations.',
              headOfDepartment: 'adm-1',
              color: 'bg-emerald-600',
              room: 'Admin Suite 100',
            },
          ];
          setDepartments(DEFAULT_DEPTS);
          DEFAULT_DEPTS.forEach((d) => {
            saveDocToFirestore('departments', d.id, d);
          });
        }
      }),
      subscribeToCollection<FaqItem>('faqs', (data) => setFaqs(data || [])),
      subscribeToCollection<AcademyInfo>('academyInfo', (data) => setAcademyInfo((data && data[0]) || DEFAULT_ACADEMY_INFO)),
      subscribeToCollection<LandingPageSettings>('landingPageSettings', (data) => {
        if (data && data.length > 0) {
          const matched = (data as any[]).find(d => d.id === 'general') || data[0];
          setLandingPageSettings(matched);
        }
      }),
      subscribeToCollection<FeatureCard>('featureCards', (data) => setFeatureCards(data || [])),
      subscribeToCollection<SchoolUser>('schoolUsers', (data) => {
        setSchoolUsers(data || []);
        setSchoolUsersLoaded(true);
        if (data && data.length > 0) {
          const userStatusMap: {[userId: string]: string} = {};
          data.forEach((u) => {
            userStatusMap[u.id] = u.status || 'pending';
          });
          if (isInitialUsersRef.current) {
            prevUserStatusRef.current = userStatusMap;
            isInitialUsersRef.current = false;
          } else {
            if (loggedInUser) {
              const currentStatus = userStatusMap[loggedInUser.id];
              const prevStatus = prevUserStatusRef.current[loggedInUser.id];
              if (currentStatus && prevStatus && currentStatus !== prevStatus) {
                sendDesktopNotification(
                  `🎓 Account Status Changed`,
                  `Your account verification status has been updated to "${currentStatus.toUpperCase()}"!`
                );
              }
            }
            prevUserStatusRef.current = userStatusMap;
          }
        }
      }),
      subscribeToCollection<RegistrationRecord>('registrations', (data) => {
        setRegistrationLogs(data || []);
        if (data && data.length > 0) {
          if (isInitialRegistrationsRef.current) {
            prevRegistrationsRef.current = data;
            isInitialRegistrationsRef.current = false;
          } else {
            const newRegs = data.filter(
              (item) => !prevRegistrationsRef.current.some((prev) => prev.id === item.id)
            );
            newRegs.forEach((reg) => {
              const isMine = loggedInUser && reg.studentInfo?.email === loggedInUser.email;
              const isStaff = loggedInUser?.role === 'admin' || loggedInUser?.role === 'teacher';
              const classNamesStr = reg.selectedClasses?.map((c) => c.title).join(', ') || 'Selected Class';
              if (isMine) {
                sendDesktopNotification(
                  `📝 Class Registered`,
                  `You have requested registration for: ${classNamesStr}.`
                );
              } else if (isStaff) {
                sendDesktopNotification(
                  `📝 New Student Registration`,
                  `${reg.studentInfo?.firstName || 'Student'} registered for: ${classNamesStr}.`
                );
              }
            });

            data.forEach((reg) => {
              const prevReg = prevRegistrationsRef.current.find((prev) => prev.id === reg.id);
              if (prevReg && prevReg.status !== reg.status) {
                const isMine = loggedInUser && reg.studentInfo?.email === loggedInUser.email;
                const isStaff = loggedInUser?.role === 'admin' || loggedInUser?.role === 'teacher';
                const classNamesStr = reg.selectedClasses?.map((c) => c.title).join(', ') || 'Selected Class';
                const newStatus = reg.status || 'pending_review';
                if (isMine) {
                  sendDesktopNotification(
                    `🎉 Registration Updated`,
                    `Your status for ${classNamesStr} has been updated to "${newStatus.toUpperCase()}".`
                  );
                } else if (isStaff) {
                  sendDesktopNotification(
                    `🔄 Registration Status Changed`,
                    `${reg.studentInfo?.firstName || 'Student'}'s registration status for ${classNamesStr} is now "${newStatus.toUpperCase()}".`
                  );
                }
              }
            });
            prevRegistrationsRef.current = data;
          }
        }
      }),
      subscribeToCollection<ResourceCategory>('resourceCategories', (data) => {
        if (data && data.length > 0) {
          setResourceCategories(data);
        } else {
          const DEFAULT_RESOURCE_CATEGORIES: ResourceCategory[] = [
            { id: 'rc-lecture-notes', name: 'Lecture Notes', description: 'Course slide decks, notes, and study guides' },
            { id: 'rc-robotics', name: 'Robotics Schematics', description: 'Arduino pinouts, wiring diagrams, and CAD models' },
            { id: 'rc-lab-worksheet', name: 'Lab Worksheet', description: 'Practical lab instructions and experiment logs' },
            { id: 'rc-project-files', name: 'Project Files', description: 'Source code, datasets, and starter kits' },
            { id: 'rc-video-tutorial', name: 'Video Tutorials', description: 'Recorded demonstrations and walkthroughs' },
            { id: 'rc-sba-guidelines', name: 'SBA Guidelines', description: 'School Based Assessment criteria and samples' },
            { id: 'rc-syllabus', name: 'Syllabus', description: 'Course syllabus and academic calendar' },
          ];
          setResourceCategories(DEFAULT_RESOURCE_CATEGORIES);
          DEFAULT_RESOURCE_CATEGORIES.forEach((cat) => {
            saveDocToFirestore('resourceCategories', cat.id, cat);
          });
        }
      }),
    ];

    return () => {
      unsubscribeAuth();
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Subscribe to additional teacher/staff Firestore collections when user is logged in
  useEffect(() => {
    if (!user) {
      setResources([]);
      setAnnouncements([]);
      setRolePermissions([]);
      return;
    }

    console.log(`User logged in: ${user.email}, subscribing to authenticated collections...`);
    const authUnsubs = [
      subscribeToCollection<TeacherResource>('resources', (data) => setResources(data || [])),
      subscribeToCollection<AttendanceRecord>('attendance', (data) => setAttendanceRecords(data || [])),
      subscribeToCollection<ClassAnnouncement>('announcements', (data) => {
        setAnnouncements(data || []);
        if (data && data.length > 0) {
          if (isInitialAnnouncementsRef.current) {
            prevAnnouncementsRef.current = data;
            isInitialAnnouncementsRef.current = false;
          } else {
            const newAnnouncements = data.filter(
              (item) => !prevAnnouncementsRef.current.some((prev) => prev.id === item.id)
            );
            newAnnouncements.forEach((ann) => {
              sendDesktopNotification(
                `📣 Class Announcement: ${ann.title || 'New Post'}`,
                `${ann.className || 'Class'}: ${ann.content || 'A new update was posted.'}`
              );
            });
            prevAnnouncementsRef.current = data;
          }
        }
      }),
      subscribeToCollection<RolePermission>('rolePermissions', (data) => setRolePermissions(data || [])),
    ];

    return () => {
      console.log('Unsubscribing from authenticated collections...');
      authUnsubs.forEach((unsub) => unsub());
    };
  }, [user]);

  // Synchronize logged-in user details when auth user or school users list updates
  useEffect(() => {
    if (user && user.email) {
      if (!schoolUsersLoaded) {
        console.log('Waiting for schoolUsers to load before verifying profile...');
        return;
      }
      
      const matched = schoolUsers.find(
        (u) => (u?.email || '').toLowerCase() === user.email!.toLowerCase()
      );
      if (matched) {
        setLoggedInUser(matched);
        setCurrentRole(matched.role);
        sessionStorage.removeItem('just_registered_email');

        if (activeTab === 'login') {
          if (matched.role === 'admin' || matched.role === 'registrar') {
            setActiveTab('admin-dashboard');
          } else if (matched.role === 'teacher' || matched.role === 'hod') {
            setActiveTab('teacher-dashboard');
          } else if (matched.role === 'student') {
            const studentEmail = matched.email.toLowerCase();
            const hasRegistrationLog = registrationLogs.some(
              (log) =>
                (log.studentInfo?.email || '').toLowerCase() === studentEmail ||
                (log.studentInfo?.parentEmail || '').toLowerCase() === studentEmail ||
                (log.studentInfo?.gmailAddress || '').toLowerCase() === studentEmail
            );
            const hasRegisteredClasses =
              hasRegistrationLog ||
              (matched.registeredClassIds && matched.registeredClassIds.length > 0) ||
              (matched.studentDetails?.selectedClassIds && matched.studentDetails.selectedClassIds.length > 0) ||
              matched.status === 'enrolled_paid' ||
              matched.status === 'pending_verification' ||
              matched.status === 'accepted';

            const isAccepted = matched.status === 'accepted' || matched.status === 'enrolled_paid';
            if (hasRegisteredClasses || !isAccepted) {
              setActiveTab('student-portal');
            } else {
              setActiveTab('registration');
            }
          }
        }
      } else {
        const isAdminEmail = user.email.toLowerCase() === 'shawstemacademy@gmail.com';
        if (isAdminEmail) {
          const newGUser: SchoolUser = {
            id: user.uid,
            name: user.displayName || (user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)),
            email: user.email,
            role: 'admin',
            status: 'enrolled_paid',
            avatar: user.photoURL || undefined,
            department: 'Administration & Registrar',
          };
          saveDocToFirestore('schoolUsers', newGUser.id, newGUser);
          setLoggedInUser(newGUser);
          setCurrentRole(newGUser.role);
        } else {
          // Check if this user was just registered in this session. If so, wait for schoolUsers to sync.
          const justRegEmail = sessionStorage.getItem('just_registered_email');
          if (justRegEmail && justRegEmail.toLowerCase() === user.email.toLowerCase()) {
            console.log('User just registered, waiting for schoolUsers list to sync...');
            return;
          }

          // Check if we are currently in a registration flow
          const isPendingReg = !!localStorage.getItem('pending_registration_info');
          if (isPendingReg) {
            handleNewUserCreation(user).catch((err) => {
              console.error('Error auto-creating user profile during auth state change:', err);
            });
            return;
          }
          
          // Prevent auto-creation of prospective student accounts for Google sign-in.
          console.log(`No existing user profile for ${user.email}. Prompting registration.`);
          googleSignOut();
          setLoggedInUser(null);
          setCurrentRole(null);
          setStudentStatus(null);
          setActiveTab('admissions');
          alert(`No student profile found for ${user.email}. Please create an account by filling out the school registration form.`);
          return;
        }
      }
    } else {
      const savedUserId = localStorage.getItem('saved_user_id');
      const checkId = (loggedInUser && loggedInUser.id) ? loggedInUser.id : savedUserId;

      if (checkId && (checkId.startsWith('usr-') || checkId.startsWith('guser_'))) {
        const matched = schoolUsers.find((u) => u.id === checkId);
        if (matched) {
          setLoggedInUser(matched);
          setCurrentRole(matched.role);
        } else if (schoolUsersLoaded) {
          setLoggedInUser(null);
          setCurrentRole('student');
          localStorage.removeItem('saved_user_id');
        }
      } else {
        setLoggedInUser(null);
        setCurrentRole('student');
      }
    }
  }, [user, schoolUsers, schoolUsersLoaded]);

  // Session Inactivity Timeout Logic (30 minutes)
  useEffect(() => {
    if (!loggedInUser) return;

    const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    let lastActivity = Date.now();

    const resetTimer = () => {
      lastActivity = Date.now();
    };

    // Events to track activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    const interval = setInterval(() => {
      const inactiveDuration = Date.now() - lastActivity;
      if (inactiveDuration >= TIMEOUT_MS) {
        // Log out the user
        handleLogout();
        setShowTimeoutAlert(true);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(interval);
    };
  }, [loggedInUser]);

  // Toggle Class Selection
  const handleToggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  // Student Info Field Update
  const handleStudentInfoChange = (field: keyof StudentInfo, value: any) => {
    setStudentInfo((prev) => ({ ...prev, [field]: value }));
  };

  async function handleNewUserCreation(gUser: User) {
    const savedInfo = localStorage.getItem('pending_registration_info');
    if (savedInfo) {
      // Safety check: verify if a user with this email is already registered in schoolUsers to prevent accidental profile overwrites (like the admin/staff account)
      const existingUser = schoolUsers.find(
        (u) => (u?.email || '').toLowerCase() === gUser.email!.toLowerCase()
      );
      if (existingUser) {
        setLoggedInUser(existingUser);
        setCurrentRole(existingUser.role);
        if (existingUser.role === 'student') {
          setStudentStatus(existingUser.status || 'unverified');
          setActiveTab('student-portal');
        } else if (existingUser.role === 'teacher' || existingUser.role === 'hod') {
          setActiveTab('teacher-dashboard');
        } else if (existingUser.role === 'admin' || existingUser.role === 'registrar') {
          setActiveTab('admin-dashboard');
        }
        localStorage.removeItem('pending_registration_info');
        alert(`This Google account (${gUser.email}) is already registered as a ${existingUser.role}. You have been signed in to your existing profile instead.`);
        return true;
      }

      const info = JSON.parse(savedInfo);
      const sName = info.studentName || `${info.firstName || ''} ${info.lastName || ''}`.trim() || gUser.displayName || 'Student';
      const pName = info.motherFirstName || info.fatherFirstName || info.guardianFirstName || info.parentName || '';
      const pPhone = info.parentPhone || info.motherCellPhone || info.fatherCellPhone || info.guardianCellPhone || '';
      
      const completeStudentInfo: StudentInfo = {
        ...info,
        studentName: sName,
        parentEmail: info.parentEmail || info.motherEmail || info.fatherEmail || info.guardianEmail || '',
        parentName: pName,
        parentPhone: pPhone,
        emergencyContact: info.emergencyContact || pPhone || ''
      };
      
      const newUser: SchoolUser = {
        id: gUser.uid,
        name: sName,
        email: gUser.email!,
        role: 'student',
        status: 'prospective',
        avatar: gUser.photoURL || undefined,
        department: 'Student Body',
        studentDetails: completeStudentInfo,
      };
      
      await saveDocToFirestore('schoolUsers', newUser.id, newUser);
      
      // Store that we just registered this email in this session to bypass automatic signOut race conditions
      sessionStorage.setItem('just_registered_email', gUser.email!.toLowerCase());
      
      setStudentInfo(completeStudentInfo);
      setSchoolUsers(prev => [...prev.filter(u => u.id !== newUser.id), newUser]);
      setLoggedInUser(newUser);
      setCurrentRole('student');
      setStudentStatus('prospective');
      setActiveTab('student-portal');
      localStorage.removeItem('pending_registration_info');
      
      alert(`Account created successfully for ${gUser.email}! Welcome to Shaw STEM Academy. Your admissions application is being processed; you will receive a notification and be able to enroll in classes once your admission is accepted by the school.`);
      return true;
    }
    return false;
  };

  const handleGoogleAuthRegistration = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      // Save state before sign-in to preserve form data
      localStorage.setItem('pending_registration_info', JSON.stringify(studentInfo));
      const result = await googleSignIn();
      if (result && result.user) {
        await handleNewUserCreation(result.user);
        setIsAuthModalOpen(false);
      } else {
        setAuthError('Sign-in cancelled or returned no user.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err?.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setAuthError(`Domain Unauthorized: The domain "${domain}" is not authorized in your Firebase Console. Please add it to Authentication > Settings > Authorized Domains.`);
      } else if (err?.code === 'auth/popup-blocked') {
        setAuthError('Pop-up Blocked: Please enable pop-ups for this site, or open this app in a New Tab using the button in the top right to sign in with Google.');
      } else if (err?.code === 'auth/operation-not-supported-in-this-environment') {
        setAuthError('Environment Error: Pop-ups are not supported inside this iframe. Please open this app in a New Tab using the button in the top right of the editor.');
      } else {
        setAuthError(err?.message || 'An error occurred during Google sign-in. Please try again.');
      }
      setAuthLoading(false);
      // Open modal to show error if it wasn't already open
      setAuthModalType('google');
      setIsAuthModalOpen(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDirectGoogleEmailSignIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const email = studentInfo.email || 'shawstemacademy@gmail.com';
      const sName = studentInfo.studentName || `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim() || email.split('@')[0] || 'Student';
      const pName = studentInfo.motherFirstName || studentInfo.fatherFirstName || studentInfo.guardianFirstName || studentInfo.parentName || '';
      const pPhone = studentInfo.parentPhone || studentInfo.motherCellPhone || studentInfo.fatherCellPhone || studentInfo.guardianCellPhone || '';

      const completeInfo = {
        ...studentInfo,
        studentName: sName,
        parentEmail: studentInfo.parentEmail || studentInfo.motherEmail || studentInfo.fatherEmail || studentInfo.guardianEmail || '',
        parentName: pName,
        parentPhone: pPhone,
        emergencyContact: studentInfo.emergencyContact || pPhone || ''
      };

      setStudentInfo(completeInfo);

      const userId = 'guser_' + email.replace(/[^a-zA-Z0-9]/g, '_');
      const newUser: SchoolUser = {
        id: userId,
        name: sName,
        email: email,
        role: 'student',
        status: 'prospective',
        department: 'Student Body',
        studentDetails: completeInfo,
      };

      await saveDocToFirestore('schoolUsers', newUser.id, newUser);
      setSchoolUsers((prev) => [...prev.filter((u) => u.id !== newUser.id), newUser]);
      setIsAuthModalOpen(false);
      setLoggedInUser(newUser);
      setCurrentRole('student');
      setStudentStatus('prospective');
      setActiveTab('student-portal');
      alert(`School Account Created Successfully!\nWelcome to Shaw STEM Academy, ${newUser.name} (${newUser.email}). Your admissions application is being processed; you will receive a notification and be able to enroll in classes once your admission is accepted by the school.`);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to complete direct email sign-in.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordAuthRegistration = async () => {
    if (regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const sName = studentInfo.studentName || `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim() || 'Student';
      const pName = studentInfo.motherFirstName || studentInfo.fatherFirstName || studentInfo.guardianFirstName || studentInfo.parentName || '';
      const pPhone = studentInfo.parentPhone || studentInfo.motherCellPhone || studentInfo.fatherCellPhone || studentInfo.guardianCellPhone || '';
      
      const completeInfo = {
        ...studentInfo,
        studentName: sName,
        parentEmail: studentInfo.parentEmail || studentInfo.motherEmail || studentInfo.fatherEmail || studentInfo.guardianEmail || '',
        parentName: pName,
        parentPhone: pPhone,
        emergencyContact: studentInfo.emergencyContact || pPhone || ''
      };

      setStudentInfo(completeInfo);

      const newUser: SchoolUser = {
        id: `usr-${Date.now()}`,
        name: sName,
        email: studentInfo.email || '',
        password: regPassword,
        role: 'student',
        status: 'prospective',
        department: 'Student Body',
        studentDetails: completeInfo,
      };
      
      await saveDocToFirestore('schoolUsers', newUser.id, newUser);
      setSchoolUsers((prev) => [...prev.filter((u) => u.id !== newUser.id), newUser]);
      setIsAuthModalOpen(false);
      setLoggedInUser(newUser);
      setCurrentRole('student');
      setStudentStatus('prospective');
      setActiveTab('student-portal');
      alert(`School Account Created Successfully!\nWelcome to Shaw STEM Academy, ${newUser.name} (${newUser.email}). Your admissions application is being processed; you will receive a notification and be able to enroll in classes once your admission is accepted by the school.`);
    } catch (err: any) {
      console.error('Password registration error:', err);
      setAuthError(err?.message || 'Failed to create password account.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleToggleSbaHubOption = (optionId: string) => {
    setSelectedSbaHubIds((prev) => {
      const next = prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId];
      
      const sbaNames = next.map((id) => {
        const opt = sbaHubOptions.find((o) => o.id === id);
        return opt ? opt.name : id;
      });
      setStudentInfo((s) => ({ ...s, sbaHubSelection: sbaNames }));
      return next;
    });
  };

  // Selected Class Objects
  const selectedClasses = classList.filter((c) => selectedClassIds.includes(c.id));
  const selectedSbaHubItems = sbaHubOptions.filter((s) => selectedSbaHubIds.includes(s.id));

  // --- RUNNING TOTAL & DISCOUNT ENGINE ---
  const classSubtotal = selectedClasses.reduce((sum, c) => sum + c.price, 0);
  const sbaSubtotal = selectedSbaHubItems.reduce((sum, s) => sum + s.yearlyPrice, 0);
  const subtotal = classSubtotal + sbaSubtotal;

  // Helper to extract normalized class type code
  const getClassTypeCode = (c: ClassItem): string => {
    if (c.classType && c.classType.trim()) return c.classType.trim().toUpperCase();
    const titleUpper = c.title.toUpperCase();
    if (titleUpper.includes('CAPE')) return 'CAPE';
    if (titleUpper.includes('PRIMARY')) return 'PRIMARY';
    if (titleUpper.includes('LOWER SECONDARY')) return 'LOWER SECONDARY';
    return 'CSEC'; // default fallback category
  };

  // Group selected regular classes by Class Type (SBA Hub is NOT included in these groups)
  const classTypeStats: Record<string, { count: number; subtotal: number; items: ClassItem[] }> = {};
  selectedClasses.forEach((c) => {
    const code = getClassTypeCode(c);
    if (!classTypeStats[code]) {
      classTypeStats[code] = { count: 0, subtotal: 0, items: [] };
    }
    classTypeStats[code].count += 1;
    classTypeStats[code].subtotal += c.price;
    classTypeStats[code].items.push(c);
  });

  const appliedDiscounts: AppliedDiscount[] = [];

  // 1. Categorized & Multi-Class Percentage Discounts
  const activeMultiClassRules = discountRules.filter(
    (r) => r.enabled && (r.type === 'percentage_multi_class' || r.type === 'class_type_multi_class') && r.minClassesRequired
  );

  // Group candidate rules by target subject category (e.g. 'ALL', 'CSEC', 'CAPE', 'PRIMARY', etc.)
  const rulesByTarget: Record<string, DiscountRule[]> = {};
  for (const rule of activeMultiClassRules) {
    const target = (rule.targetClassType || 'ALL').toUpperCase();
    if (!rulesByTarget[target]) {
      rulesByTarget[target] = [];
    }
    rulesByTarget[target].push(rule);
  }

  // For each target category, select ONLY the single best qualifying discount rule
  for (const [target, rules] of Object.entries(rulesByTarget)) {
    const qualifyingRules: { rule: DiscountRule; discountAmount: number }[] = [];

    for (const rule of rules) {
      const minRequired = rule.minClassesRequired || 1;
      const pct = rule.percentageOff || 0;

      if (target === 'ALL') {
        if (selectedClasses.length >= minRequired && classSubtotal > 0) {
          const discountAmount = (classSubtotal * pct) / 100;
          qualifyingRules.push({ rule, discountAmount });
        }
      } else {
        const typeStat = classTypeStats[target];
        if (typeStat && typeStat.count >= minRequired && typeStat.subtotal > 0) {
          const discountAmount = (typeStat.subtotal * pct) / 100;
          qualifyingRules.push({ rule, discountAmount });
        }
      }
    }

    if (qualifyingRules.length > 0) {
      // Pick the single best rule for this target subject category (highest discount amount or highest percentage off)
      qualifyingRules.sort((a, b) => {
        if (b.discountAmount !== a.discountAmount) {
          return b.discountAmount - a.discountAmount;
        }
        return (b.rule.percentageOff || 0) - (a.rule.percentageOff || 0);
      });

      const best = qualifyingRules[0];
      const minRequired = best.rule.minClassesRequired || 1;
      const pct = best.rule.percentageOff || 0;

      if (target === 'ALL') {
        appliedDiscounts.push({
          ruleId: best.rule.id,
          name: best.rule.name,
          amountOff: best.discountAmount,
          description: `${pct}% off regular class tuition for enrolling in ${minRequired}+ classes (Excl. SBA Hub)`,
        });
      } else {
        appliedDiscounts.push({
          ruleId: best.rule.id,
          name: best.rule.name,
          amountOff: best.discountAmount,
          description: `${pct}% off ${target} tuition for enrolling in ${minRequired}+ ${target} classes (Excl. SBA Hub)`,
        });
      }
    }
  }

  // 2. Spend Threshold Flat Discount (Based strictly on class tuition, excluding SBA Hub)
  const matchingSpendRules = discountRules
    .filter(
      (r) =>
        r.enabled &&
        r.type === 'amount_threshold' &&
        r.minAmountRequired &&
        classSubtotal >= r.minAmountRequired
    )
    .sort((a, b) => (b.minAmountRequired || 0) - (a.minAmountRequired || 0));

  if (matchingSpendRules.length > 0) {
    const bestRule = matchingSpendRules[0];
    appliedDiscounts.push({
      ruleId: bestRule.id,
      name: bestRule.name,
      amountOff: bestRule.flatAmountOff || 0,
      description: `$${bestRule.flatAmountOff} off class tuition for spending over $${bestRule.minAmountRequired} (Excl. SBA Hub)`,
    });
  }

  // 3. Sibling Discount
  const siblingRule = discountRules.find((r) => r.enabled && r.type === 'sibling');
  if (isSiblingSelected && siblingRule) {
    appliedDiscounts.push({
      ruleId: siblingRule.id,
      name: siblingRule.name,
      amountOff: siblingRule.flatAmountOff || 20,
      description: 'Sibling enrollment discount applied (Excl. SBA Hub)',
    });
  }

  // 4. Promo Code Discount
  if (appliedPromoCode) {
    const promoRule = discountRules.find(
      (r) => r.enabled && r.type === 'promo_code' && r.code === appliedPromoCode
    );
    if (promoRule) {
      const target = (promoRule.targetClassType || 'ALL').toUpperCase();
      let baseAmount = classSubtotal;
      if (target !== 'ALL' && classTypeStats[target]) {
        baseAmount = classTypeStats[target].subtotal;
      }
      const discountAmount = promoRule.percentageOff
        ? (baseAmount * promoRule.percentageOff) / 100
        : promoRule.flatAmountOff || 0;

      appliedDiscounts.push({
        ruleId: promoRule.id,
        name: promoRule.name,
        amountOff: discountAmount,
        description: `Promo Code '${promoRule.code}' Applied (Excl. SBA Hub)`,
      });
    }
  }

  // Final Price Calculation
  const totalSavings = appliedDiscounts.reduce((sum, d) => sum + d.amountOff, 0);
  const totalPrice = Math.max(0, subtotal - totalSavings);

  // Apply Promo Code Handler
  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');

    if (!promoCodeInput.trim()) return;
    const cleanCode = promoCodeInput.trim().toUpperCase();
    const matchingRule = discountRules.find(
      (r) => r.enabled && r.type === 'promo_code' && r.code === cleanCode
    );

    if (!matchingRule) {
      setPromoError('Invalid or expired promo code.');
      return;
    }

    setAppliedPromoCode(cleanCode);
    setPromoSuccess(`Promo code '${cleanCode}' applied successfully!`);
    setPromoCodeInput('');
  };

  // Submit Registration & Auto-log
  const handleSubmitRegistration = () => {
    if (selectedClasses.length === 0 && selectedSbaHubIds.length === 0) return;

    const currentEmail = studentInfo.email || loggedInUser?.email || user?.email || '';
    const currentName = studentInfo.studentName || loggedInUser?.name || user?.displayName || (currentEmail ? currentEmail.split('@')[0] : '');

    if (!currentName || !currentEmail) {
      alert('Please complete the School Registration (Account Creation) step first.');
      setActiveTab('admissions');
      return;
    }

    const nameParts = currentName.split(' ');
    const firstName = studentInfo.firstName || nameParts[0] || 'Student';
    const lastName = studentInfo.lastName || nameParts.slice(1).join(' ') || '';
    const isUserLoggedIn = Boolean(loggedInUser || user);

    const motherFirstName = studentInfo.motherFirstName || (isUserLoggedIn ? (studentInfo.parentName || 'Parent') : '');
    const guardianFirstName = studentInfo.guardianFirstName || (isUserLoggedIn ? 'Guardian' : '');
    const parentName = studentInfo.parentName || (isUserLoggedIn ? 'Parent/Guardian' : '');

    if (!isUserLoggedIn) {
      if (studentInfo.livesWith === 'Parent' && !motherFirstName && !studentInfo.fatherFirstName && !parentName) {
        alert('Please complete the parent information in the registration step.');
        setActiveTab('admissions');
        return;
      }

      if (studentInfo.livesWith === 'Guardian' && !guardianFirstName) {
        alert('Please complete the guardian information in the registration step.');
        setActiveTab('admissions');
        return;
      }
    }

    const details = loggedInUser?.studentDetails || {};
    const ageVal = studentInfo.studentAge || studentInfo.age || details.studentAge || details.age || '';
    const gradeVal = studentInfo.gradeLevel || studentInfo.formGrade || details.gradeLevel || details.formGrade || '';
    const phoneVal = studentInfo.parentPhone || studentInfo.cellPhone || studentInfo.homePhone ||
      studentInfo.motherCellPhone || studentInfo.fatherCellPhone || studentInfo.guardianCellPhone ||
      details.parentPhone || details.cellPhone || details.homePhone || details.motherCellPhone ||
      details.fatherCellPhone || details.guardianCellPhone || details.emergencyContact || '';

    const motherFullName = `${studentInfo.motherFirstName || details.motherFirstName || ''} ${studentInfo.motherLastName || details.motherLastName || ''}`.trim();
    const fatherFullName = `${studentInfo.fatherFirstName || details.fatherFirstName || ''} ${studentInfo.fatherLastName || details.fatherLastName || ''}`.trim();
    const guardianFullName = `${studentInfo.guardianFirstName || details.guardianFirstName || ''} ${studentInfo.guardianLastName || details.guardianLastName || ''}`.trim();

    const rawParentName = studentInfo.parentName || details.parentName;
    const parentNameVal = (rawParentName && rawParentName !== 'Parent/Guardian' && rawParentName !== 'Parent')
      ? rawParentName
      : (motherFullName || fatherFullName || guardianFullName || '');

    const effectiveStudentInfo: StudentInfo = {
      ...details,
      ...studentInfo,
      email: currentEmail,
      studentName: currentName,
      firstName,
      lastName,
      parentEmail: studentInfo.parentEmail || details.parentEmail || '',
      age: ageVal,
      studentAge: ageVal,
      formGrade: gradeVal,
      gradeLevel: gradeVal,
      cellPhone: phoneVal,
      parentPhone: phoneVal,
      motherFirstName: studentInfo.motherFirstName || details.motherFirstName || motherFirstName,
      guardianFirstName: studentInfo.guardianFirstName || details.guardianFirstName || guardianFirstName,
      parentName: parentNameVal,
      selectedSbaHubIds,
      selectedClassIds
    };

    setStudentInfo(effectiveStudentInfo);

    const existingRecord = studentRegistrationRecord;

    const studentAccountId = loggedInUser?.id || user?.uid || (existingRecord as any)?.studentId;

    const record: RegistrationRecord = {
      id: existingRecord ? existingRecord.id : `REG-${Date.now()}`,
      timestamp: existingRecord ? existingRecord.timestamp : new Date().toISOString(),
      studentInfo: effectiveStudentInfo,
      selectedClasses,
      subtotal,
      appliedDiscounts,
      totalPrice,
      googleFormId: existingRecord ? existingRecord.googleFormId : '1FAIpQLSc_STEM_FORM_DEMO',
      isPaid: existingRecord ? existingRecord.isPaid : false,
      status: existingRecord ? existingRecord.status : 'pending_review',
      payments: existingRecord?.payments || [],
      verifiedClassIds: existingRecord?.verifiedClassIds || [],
      grades: existingRecord?.grades || [],
      ...(studentAccountId ? { studentId: studentAccountId } : {})
    };

    if (existingRecord) {
      // Update existing registration in state
      setRegistrationLogs((prev) => prev.map((log) => log.id === existingRecord.id ? record : log));
    } else {
      // Add new registration log
      setRegistrationLogs((prev) => [record, ...prev]);
    }
    
    // Save persistently to Firebase Firestore
    saveRegistrationToFirestore(record);

    logSystemAction(
      'registration',
      existingRecord 
        ? `Registration updated for ${effectiveStudentInfo.studentName}`
        : `Registration submitted for ${effectiveStudentInfo.studentName}`,
      { subtotal, totalPrice, studentEmail: effectiveStudentInfo.parentEmail }
    );

    // Clear selected options for editing form
    setSelectedClassIds([]);
    setSelectedSbaHubIds([]);

    // Switch status to awaiting_acceptance & navigate to Student Portal (if not already accepted or enrolled)
    const currentStatus = loggedInUser?.status || studentStatus;
    const isAlreadyAcceptedOrEnrolled = currentStatus === 'accepted' || currentStatus === 'enrolled_paid' || currentStatus === 'pending_verification';
    
    if (!isAlreadyAcceptedOrEnrolled) {
      setStudentStatus('awaiting_acceptance');
    }
    
    if (loggedInUser) {
      const updatedUser: SchoolUser = { 
        ...loggedInUser, 
        status: isAlreadyAcceptedOrEnrolled ? currentStatus : 'awaiting_acceptance',
        registeredClassIds: loggedInUser.registeredClassIds || [],
        studentDetails: effectiveStudentInfo
      };
      setLoggedInUser(updatedUser);
      saveDocToFirestore('schoolUsers', loggedInUser.id, updatedUser);
    }
    setCompletedRegistration(record);
    setActiveTab('student-portal');
    
    setTimeout(() => {
      if (existingRecord) {
        alert('Your class selections and totals have been updated successfully!');
      } else {
        alert(`Registration submitted! An email confirmation has been sent to ${studentInfo.email}. Your application is now Awaiting Acceptance by the administration.`);
      }
    }, 500);
  };

  const siblingAmount = siblingRule?.flatAmountOff || 20;

  // Teacher dashboard handlers
  const handleAddAnnouncement = (newAnn: ClassAnnouncement) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
    saveDocToFirestore('announcements', newAnn.id, newAnn);
    sendPushNotificationToClass(
      newAnn.classId,
      `New Announcement: ${newAnn.className}`,
      newAnn.title
    );
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    deleteDocFromFirestore('announcements', id);
  };

  const handleAddResource = (newRes: TeacherResource) => {
    setResources((prev) => [newRes, ...prev]);
    saveDocToFirestore('resources', newRes.id, newRes);
    sendPushNotificationToClass(
      newRes.classId,
      `New Resource Uploaded: ${newRes.className}`,
      `A new ${newRes.category} titled "${newRes.title}" has been uploaded by ${newRes.teacherName}.`
    );
  };

  const handleDeleteResource = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
    deleteDocFromFirestore('resources', id);
  };

  const handleAddNewsItem = (item: any) => {
    setSchoolNews((prev: any) => [item, ...prev]);
    saveDocToFirestore('schoolNews', item.id, item);
    sendPushNotificationToAll(
      `Shaw STEM News: ${item.title}`,
      item.summary || `A new update has been posted in ${item.category}.`
    );
  };

  const handleDeleteNewsItem = (id: string) => {
    setSchoolNews((prev: any) => prev.filter((item: any) => item.id !== id));
    deleteDocFromFirestore('schoolNews', id);
  };

  const handleUpdateResourceCategory = (id: string, newCategory: any) => {
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, category: newCategory };
          saveDocToFirestore('resources', id, updated);
          return updated;
        }
        return r;
      })
    );
  };

  const handleTogglePaymentStatus = (logId: string, isPaid: boolean) => {
    setRegistrationLogs((prev) =>
      prev.map((log) => {
        if (log.id === logId) {
          const updated = { ...log, isPaid };
          saveDocToFirestore('registrations', logId, updated);
          
          // Try to find matching user and update their status to enrolled_paid
          const matchingUser = schoolUsers.find(
            (u) => u.email === log.studentInfo.email || u.email === log.studentInfo.parentEmail || u.name === log.studentInfo.studentName
          );
          if (matchingUser && isPaid) {
            const updatedUser: SchoolUser = { ...matchingUser, status: 'enrolled_paid' };
            saveDocToFirestore('schoolUsers', matchingUser.id, updatedUser);
            
            sendPushNotificationToUser(
              matchingUser.email,
              matchingUser.id,
              '🎉 Tuition Payment Verified!',
              `Your tuition payment for Shaw STEM Academy has been verified and confirmed. Registration status: Enrolled & Paid.`
            );
          } else if (matchingUser && !isPaid) {
            // Only revert to 'accepted' if they were already accepted or enrolled_paid
            if (matchingUser.status === 'enrolled_paid' || matchingUser.status === 'accepted') {
              const updatedUser: SchoolUser = { ...matchingUser, status: 'accepted' };
              saveDocToFirestore('schoolUsers', matchingUser.id, updatedUser);
            }
          }
          
          return updated;
        }
        return log;
      })
    );
    logSystemAction('registration', `Registration log ${logId} payment status updated to ${isPaid ? 'Verified Paid' : 'Unverified'}`);
  };

  const handleUpdateRegistration = (updatedLog: RegistrationRecord) => {
    setRegistrationLogs((prev) =>
      prev.map((log) => {
        if (log.id === updatedLog.id) {
          saveDocToFirestore('registrations', updatedLog.id, updatedLog);
          return updatedLog;
        }
        return log;
      })
    );
    logSystemAction('registration', `Registration profile for ${updatedLog.studentInfo.studentName || updatedLog.studentInfo.firstName} updated`);
  };

  const handleUpdateAttendance = (record: AttendanceRecord) => {
    setAttendanceRecords((prev) => {
      const exists = prev.find(r => r.id === record.id);
      if (exists) return prev.map(r => r.id === record.id ? record : r);
      return [...prev, record];
    });
    saveDocToFirestore('attendance', record.id, record);
  };

  const handleUpdateUserProfile = (updatedUser: SchoolUser) => {
    setLoggedInUser(updatedUser);
    setSchoolUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    saveDocToFirestore('schoolUsers', updatedUser.id, updatedUser);
    logSystemAction('user_updated', `User profile for ${updatedUser.name} updated`);
  };

  const handleDeleteRegistration = (logId: string) => {
    const log = registrationLogs.find((l) => l.id === logId);
    if (log) {
      const emailToDelete = log.studentInfo.email || log.studentInfo.parentEmail;
      if (emailToDelete) {
        const matchedUser = schoolUsers.find(
          (u) => u.email && u.email.toLowerCase() === emailToDelete.toLowerCase()
        );
        if (matchedUser) {
          handleDeleteUser(matchedUser.id);
        }
      }
    }
    setRegistrationLogs((prev) => prev.filter((log) => log.id !== logId));
    deleteDocFromFirestore('registrations', logId);
    logSystemAction('registration', `Registration log ${logId} deleted by registrar/admin`);
  };

  // --- USER, ROLE, AND DEPARTMENT MANAGEMENT HANDLERS ---
  const handleAddUser = (newUser: SchoolUser) => {
    setSchoolUsers((prev) => [newUser, ...prev]);
    saveDocToFirestore('schoolUsers', newUser.id, newUser);
    if (newUser.role === 'teacher') {
      const newProfile: TeacherProfile = {
        id: newUser.id,
        name: newUser.name,
        title: newUser.title,
        department: newUser.departmentName,
        email: newUser.email,
        bio: newUser.bio || 'New faculty member at Shaw STEM Academy.',
        officeHours: newUser.officeHours || 'By Appointment',
        avatar: newUser.avatar,
        assignedClassIds: [],
      };
      setTeacherProfiles((prev) => [newProfile, ...prev]);
      saveDocToFirestore('teachers', newProfile.id, newProfile);
    }
    
    logSystemAction(
      'user_created',
      `Created new ${newUser.role} account: ${newUser.name}`,
      { targetUserId: newUser.id }
    );
  };

  const handleUpdateUser = (updatedUser: SchoolUser) => {
    setSchoolUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    saveDocToFirestore('schoolUsers', updatedUser.id, updatedUser);
    setTeacherProfiles((prev) =>
      prev.map((t) =>
        t.id === updatedUser.id
          ? {
              ...t,
              name: updatedUser.name,
              title: updatedUser.title,
              department: updatedUser.departmentName,
              email: updatedUser.email,
              bio: updatedUser.bio || t.bio,
              officeHours: updatedUser.officeHours || t.officeHours,
            }
          : t
      )
    );
    
    logSystemAction(
      'user_updated',
      `Updated profile for: ${updatedUser.name}`,
      { targetUserId: updatedUser.id }
    );
  };

  const handleDeleteUser = (userId: string) => {
    const userToDel = schoolUsers.find(u => u.id === userId);
    if (userToDel) {
      const studentEmail = (userToDel.email || '').toLowerCase();
      const studentName = (userToDel.name || '').toLowerCase();
      
      // Find all registration records in our state that match this student
      const matchedRegs = registrationLogs.filter(
        (log) =>
          (log.studentInfo?.email || '').toLowerCase() === studentEmail ||
          (log.studentInfo?.parentEmail || '').toLowerCase() === studentEmail ||
          (log.studentInfo?.gmailAddress || '').toLowerCase() === studentEmail ||
          (log.studentInfo?.studentName || '').toLowerCase() === studentName
      );
      
      // Delete matched registration records from Firestore
      matchedRegs.forEach(reg => {
        deleteDocFromFirestore('registrations', reg.id);
      });
      
      // Filter out deleted registration records from our state
      setRegistrationLogs(prev => prev.filter(log => !matchedRegs.some(r => r.id === log.id)));
    }

    setSchoolUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteDocFromFirestore('schoolUsers', userId);
    setTeacherProfiles((prev) => prev.filter((t) => t.id !== userId));
    deleteDocFromFirestore('teachers', userId);
  };

  const handleToggleUserDisabled = (user: SchoolUser, reason?: string) => {
    const isCurrentlyDisabled = user.status === 'disabled';
    const newStatus: 'active' | 'disabled' = isCurrentlyDisabled ? 'active' : 'disabled';
    const updatedUser: SchoolUser = {
      ...user,
      status: newStatus,
    };

    if (newStatus === 'disabled') {
      updatedUser.disabledAt = new Date().toLocaleString('en-US');
      updatedUser.disabledReason = reason || user.disabledReason || 'Administrative decision';
      
      sendPushNotificationToUser(
        user.email,
        user.id,
        '🔒 Account Placed on Administrative Hold',
        `Hello ${user.name}, your Shaw STEM Academy account has been placed on administrative hold. Reason: ${updatedUser.disabledReason}. Please contact support for assistance.`
      );
    } else {
      delete updatedUser.disabledAt;
      delete updatedUser.disabledReason;

      sendPushNotificationToUser(
        user.email,
        user.id,
        '✅ Account Hold Lifted & Reactivated',
        `Hello ${user.name}, your account hold at Shaw STEM Academy has been removed. Your account is now active!`
      );
    }

    setSchoolUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setTeacherProfiles((prev) =>
      prev.map((t) => (t.id === user.id ? { ...t, status: newStatus } : t))
    );

    toggleUserDisabledInFirestore(user, reason);
    
    logSystemAction(
      newStatus === 'disabled' ? 'user_disabled' : 'user_enabled',
      `${newStatus === 'disabled' ? 'Disabled' : 'Re-enabled'} user account: ${user.name}`,
      { targetUserId: user.id, reason }
    );
  };

  const handleRoleChange = (userId: string, newRole: 'teacher' | 'admin') => {
    setSchoolUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const updated: SchoolUser = {
          ...u,
          role: newRole,
          permissions:
            newRole === 'admin'
              ? [
                  'manage_curriculum',
                  'upload_resources',
                  'post_announcements',
                  'manage_discounts',
                  'export_forms',
                  'view_logs',
                  'manage_users',
                  'manage_departments',
                  'assign_staff',
                ]
              : ['manage_curriculum', 'upload_resources', 'post_announcements'],
        };
        saveDocToFirestore('schoolUsers', userId, updated);
        
        sendPushNotificationToUser(
          u.email,
          u.id,
          '🛡️ Account Role & Permissions Updated',
          `Hello ${u.name}, your role at Shaw STEM Academy has been updated to ${newRole.toUpperCase()}.`
        );

        logSystemAction(
          'role_changed',
          `Changed role to ${newRole} for user: ${u.name}`,
          { targetUserId: userId }
        );
        
        return updated;
      })
    );
  };

  const handleDepartmentChange = (userId: string, newDepartmentId: string) => {
    const targetDept = departments.find((d) => d.id === newDepartmentId);
    if (!targetDept) return;
    setSchoolUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { 
            ...u, 
            departmentId: targetDept.id, 
            departmentName: targetDept.name,
            departmentIds: [targetDept.id],
            departmentNames: [targetDept.name] 
          };
          saveDocToFirestore('schoolUsers', userId, updated);
          return updated;
        }
        return u;
      })
    );
    setTeacherProfiles((prev) =>
      prev.map((t) => (t.id === userId ? { ...t, department: targetDept.name } : t))
    );
  };

  const handleAddDepartment = (newDept: Department) => {
    setDepartments((prev) => [...prev, newDept]);
    saveDocToFirestore('departments', newDept.id, newDept);
  };

  const handleUpdateDepartment = (updatedDept: Department) => {
    setDepartments((prev) => prev.map((d) => (d.id === updatedDept.id ? updatedDept : d)));
    saveDocToFirestore('departments', updatedDept.id, updatedDept);
    setSchoolUsers((prev) =>
      prev.map((u) =>
        u.departmentId === updatedDept.id
          ? { ...u, departmentName: updatedDept.name }
          : u
      )
    );
    setTeacherProfiles((prev) =>
      prev.map((t) => {
        const u = schoolUsers.find((user) => user.id === t.id);
        if (u && u.departmentId === updatedDept.id) {
          return { ...t, department: updatedDept.name };
        }
        return t;
      })
    );
  };

  const handleDeleteDepartment = (deptId: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== deptId));
    deleteDocFromFirestore('departments', deptId);
  };

  const handleAssignUserToDepartment = (userId: string, deptId: string) => {
    handleDepartmentChange(userId, deptId);
  };

  const handleTogglePermission = (permissionId: string, role: 'teacher' | 'admin') => {
    setRolePermissions((prev) =>
      prev.map((p) => {
        if (p.id === permissionId) {
          const updated = role === 'teacher'
            ? { ...p, teacherDefault: !p.teacherDefault }
            : { ...p, adminDefault: !p.adminDefault };
          saveDocToFirestore('rolePermissions', permissionId, updated);
          return updated;
        }
        return p;
      })
    );
  };

  // Enforce tab access permissions based on role and payment status
  useEffect(() => {
    const isLoggedIn = !!user || !!loggedInUser;
    const isStudent = (loggedInUser?.role || currentRole) === 'student';

    if (isStudent) {
      if (!isLoggedIn) {
        if (activeTab === 'registration' || activeTab === 'student-portal' || activeTab === 'teacher-dashboard' || activeTab === 'admin-dashboard') {
          setActiveTab('home');
        }
      } else {
        if (activeTab === 'teacher-dashboard' || activeTab === 'admin-dashboard') {
          setActiveTab('student-portal');
        }
      }
    } else if (currentRole === 'teacher' || currentRole === 'hod') {
      if (activeTab === 'admin-dashboard') {
        setActiveTab('teacher-dashboard');
      }
    }
  }, [currentRole, studentStatus, activeTab, user, loggedInUser]);

  const handleLoginProfile = (
    role: UserRole,
    status?: StudentStatus,
    userObj?: SchoolUser,
    targetTab?: PortalTab
  ) => {
    setCurrentRole(role);
    if (userObj) {
      setLoggedInUser(userObj);
    } else {
      const fallbackUser: SchoolUser = {
        id: `usr-${Date.now()}`,
        name: role === 'student' ? 'Student User' : role === 'teacher' ? 'Staff Instructor' : role === 'registrar' ? 'Registrar' : 'Administrator',
        email: 'user@shawstemacademy.edu',
        role: role,
        status: status || 'enrolled_paid',
        department: 'Student Body',
      };
      setLoggedInUser(fallbackUser);
    }
    if (status) {
      setStudentStatus(status);
    }

    if (targetTab) {
      setActiveTab(targetTab);
    } else {
      if (role === 'admin' || role === 'registrar') {
        setActiveTab('admin-dashboard');
      } else if (role === 'teacher' || role === 'hod') {
        setActiveTab('teacher-dashboard');
      } else if (role === 'student') {
        const studentEmail = (userObj?.email || user?.email || '').toLowerCase();
        const hasRegistrationLog = studentEmail
          ? registrationLogs.some(
              (log) => 
                (log.studentInfo?.email || '').toLowerCase() === studentEmail ||
                (log.studentInfo?.parentEmail || '').toLowerCase() === studentEmail ||
                (log.studentInfo?.gmailAddress || '').toLowerCase() === studentEmail
            )
          : false;

        const hasRegisteredClasses =
          hasRegistrationLog ||
          (userObj?.registeredClassIds && userObj.registeredClassIds.length > 0) ||
          (userObj?.studentDetails?.selectedClassIds && userObj.studentDetails.selectedClassIds.length > 0) ||
          userObj?.status === 'enrolled_paid' ||
          userObj?.status === 'pending_verification' ||
          userObj?.status === 'accepted';

        const isAccepted = userObj?.status === 'accepted' || userObj?.status === 'enrolled_paid';
        if (hasRegisteredClasses || !isAccepted) {
          setActiveTab('student-portal');
        } else {
          setActiveTab('registration');
        }
      } else {
        setActiveTab('home');
      }
    }
  };

  function handleLogout() {
    googleSignOut();
    setLoggedInUser(null);
    setUser(null);
    setCurrentRole('student');
    setStudentStatus('prospective');
    setActiveTab('login');
    sessionStorage.clear();
    localStorage.removeItem('pending_registration_info');
    localStorage.removeItem('saved_user_id');
    setEnrolledClassIds([]);
    setStudentInfo({
      email: '',
      studentName: '',
      firstName: '',
      lastName: '',
      middleName: '',
      formGrade: '',
      currentSchool: '',
      age: '',
      dateOfBirth: '',
      cellPhone: '',
      homePhone: '',
      address: '',
      gmailAddress: '',
      gender: '',
      livesWith: 'Parent',
    });
    logSystemAction('login', 'User signed out of portal');
  }

  const handleTabSelect = (tab: PortalTab) => {
    const isLoggedIn = !!user || !!loggedInUser;
    if ((tab === 'student-portal' || tab === 'registration') && !isLoggedIn) {
      alert('Authentication required: Please log in to your student account to access the Student Portal or Class Registration.');
      setActiveTab('login');
      return;
    }
    if (tab === 'registration') {
      const isStudent = (loggedInUser?.role || currentRole) === 'student';
      if (isStudent) {
        const status = loggedInUser?.status || studentStatus;
        if (status !== 'accepted' && status !== 'enrolled_paid') {
          alert('Access denied: You must be accepted or enrolled to register for classes.');
          setActiveTab('student-portal');
          return;
        }

        // Pre-populate previously chosen classes and SBA Hub options for editing
        const email = user?.email || loggedInUser?.email;
        if (email) {
          const matchedRecord = registrationLogs.find(
            (log) => 
              (log.studentInfo?.parentEmail || '').toLowerCase() === email.toLowerCase() || 
              (log.studentInfo?.email || '').toLowerCase() === email.toLowerCase() || 
              (log.studentInfo?.gmailAddress || '').toLowerCase() === email.toLowerCase()
          );
          if (matchedRecord) {
            const classIds = matchedRecord.selectedClasses?.map(c => c.id) || [];
            setSelectedClassIds(classIds);
            
            const sbaIds = matchedRecord.studentInfo?.selectedSbaHubIds || [];
            setSelectedSbaHubIds(sbaIds);
          }
        }
      }
    }
    setActiveTab(tab);
  };

  const studentEmail = (user?.email || loggedInUser?.email || '').toLowerCase().trim();
  const studentId = loggedInUser?.id;
  const studentName = (loggedInUser?.name || user?.displayName || '').toLowerCase().trim();

  const isLogForStudent = (log: RegistrationRecord) => {
    const logEmail = (log.studentInfo?.email || '').toLowerCase().trim();
    const parentEmail = (log.studentInfo?.parentEmail || '').toLowerCase().trim();
    const gmailAddress = (log.studentInfo?.gmailAddress || '').toLowerCase().trim();

    if (studentEmail && (logEmail === studentEmail || parentEmail === studentEmail || gmailAddress === studentEmail)) {
      return true;
    }
    if (studentId && (log as any).studentId === studentId) {
      return true;
    }
    const logStudentName = (log.studentInfo?.studentName || '').toLowerCase().trim();
    if (studentName && logStudentName && studentName === logStudentName) {
      return true;
    }
    return false;
  };

  const studentRegistrationRecord = (studentEmail || studentId)
    ? registrationLogs.find(isLogForStudent) || null
    : null;

  const allStudentRegistrations = (studentEmail || studentId)
    ? registrationLogs.filter(isLogForStudent)
    : [];

  // Synchronize enrolledClassIds and enrolledSbaHubIds dynamically with the student's registrations from Firestore
  useEffect(() => {
    if (loggedInUser && loggedInUser.role === 'student') {
      const classIdsFromRegistrations = new Set<string>();
      const sbaHubIdsFromRegistrations = new Set<string>();
      
      const matchedLogs = (studentEmail || studentId) ? registrationLogs.filter(isLogForStudent) : [];

      matchedLogs.forEach(reg => {
        // ONLY add classes that have been released/verified by administration in the Student Directory!
        if (reg.verifiedClassIds && Array.isArray(reg.verifiedClassIds)) {
          reg.verifiedClassIds.forEach(id => classIdsFromRegistrations.add(id));
        }
        if (reg.studentInfo?.selectedSbaHubIds) {
          reg.studentInfo.selectedSbaHubIds.forEach(id => sbaHubIdsFromRegistrations.add(id));
        }
      });
      
      const newClassIds = Array.from(classIdsFromRegistrations);
      setEnrolledClassIds(prev => {
        const sortedPrev = [...prev].sort();
        const sortedNew = [...newClassIds].sort();
        if (sortedPrev.length === sortedNew.length && sortedPrev.every((val, idx) => val === sortedNew[idx])) {
          return prev;
        }
        return newClassIds;
      });

      const newSbaHubIds = Array.from(sbaHubIdsFromRegistrations);
      setEnrolledSbaHubIds(prev => {
        const sortedPrev = [...prev].sort();
        const sortedNew = [...newSbaHubIds].sort();
        if (sortedPrev.length === sortedNew.length && sortedPrev.every((val, idx) => val === sortedNew[idx])) {
          return prev;
        }
        return newSbaHubIds;
      });
    } else {
      setEnrolledClassIds(prev => prev.length === 0 ? prev : []);
      setEnrolledSbaHubIds(prev => prev.length === 0 ? prev : []);
    }
  }, [loggedInUser, registrationLogs, studentEmail, studentId, studentName]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-200 flex flex-col justify-between transition-colors duration-300">
      <div>
        {dbError && (
          <div className="bg-red-50 border-b border-red-200 p-4">
            <div className="max-w-7xl mx-auto flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-red-800">Connection Failed</h3>
                <p className="text-sm text-red-700 mt-1">{dbError}</p>
                <button onClick={() => setDbError(null)} className="text-xs font-semibold text-red-600 hover:text-red-800 mt-2">Dismiss</button>
              </div>
            </div>
          </div>
        )}
        {/* Top School Navbar with Role & Status Switcher */}
        <SchoolHeaderNav
          activeTab={activeTab}
          onSelectTab={handleTabSelect}
          currentRole={currentRole}
          onChangeRole={setCurrentRole}
          studentStatus={studentStatus}
          onChangeStudentStatus={setStudentStatus}
          runningTotal={totalPrice}
          classCount={selectedClassIds.length}
          user={user}
          loggedInUser={loggedInUser}
          onSignIn={() => setActiveTab('login')}
          onSignOut={handleLogout}
          onOpenDiscountConfig={() => setIsDiscountConfigOpen(true)}
          onOpenGoogleExport={() => {}}
          themeMode={themeMode}
          onToggleThemeMode={handleToggleThemeMode}
        />

        {/* Main Portal Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'home' && (
            <SchoolHomePage
              news={schoolNews}
              faqs={faqs}
              academyInfo={academyInfo}
              featureCards={featureCards}
              classList={classList}
              departments={departments}
              schoolUsers={schoolUsers}
              registrationLogs={registrationLogs}
              settings={landingPageSettings}
              isLoggedIn={!!user || !!loggedInUser}
              onNavigate={setActiveTab}
              onOpenRegistration={() => setActiveTab('admissions')}
              loggedInUser={loggedInUser}
              onUpdateLandingPageSettings={async (newSettings) => {
                setLandingPageSettings(newSettings);
                await saveDocToFirestore('landingPageSettings', 'general', newSettings);
              }}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyPolicyPage />
          )}

          {activeTab === 'login' && (
            <LoginPage
              onLoginProfile={handleLoginProfile}
              onNavigate={setActiveTab}
              schoolUsers={schoolUsers}
              schoolUsersLoaded={schoolUsersLoaded}
            />
          )}

          {activeTab === 'academics' && (
            <AcademicsPage
              teachers={teacherProfiles}
              classes={classList}
              departments={departments}
              isLoggedIn={!!user || !!loggedInUser}
              isAccepted={studentStatus === 'accepted' || studentStatus === 'enrolled_paid'}
              onNavigate={setActiveTab}
              onOpenRegistration={() => setActiveTab('admissions')}
            />
          )}

          {activeTab === 'student-portal' && (
            (!user && !loggedInUser) ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-xl mx-auto border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5 my-12">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8 text-amber-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Authentication Required</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    You must be logged in to access the Student Portal or Class Registration. Please sign in to view your enrolled courses, schedules, and lab materials.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Log In to Access Portal</span>
                </button>
              </div>
            ) : (
              <StudentPortalPage
                status={studentStatus}
                studentUser={loggedInUser}
                registrationRecord={studentRegistrationRecord}
                allRegistrations={allStudentRegistrations}
                attendanceRecords={attendanceRecords}
                onUpdateAttendance={handleUpdateAttendance}
                onUpdateRegistration={handleUpdateRegistration}
                onUpdateUserProfile={handleUpdateUserProfile}
                onDeleteRegistration={handleDeleteRegistration}
                classes={enrolledClasses}
                resources={resources}
                announcements={announcements}
                faqs={faqs}
                onOpenRegistration={() => handleTabSelect('registration')}
              />
            )
          )}

          {activeTab === 'teacher-dashboard' && (
            <TeacherDashboardPage
              teachers={teacherProfiles}
              classes={classList}
              resources={resources}
              announcements={announcements}
              attendanceRecords={attendanceRecords}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateRegistration={handleUpdateRegistration}
              registrationLogs={registrationLogs}
              onAddAnnouncement={handleAddAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onAddResource={handleAddResource}
              onDeleteResource={handleDeleteResource}
              loggedInUser={loggedInUser}
              currentRole={currentRole}
              onUpdateClassList={handleUpdateClassList}
              schoolNews={schoolNews}
              departments={departments}
              sbaHubOptions={sbaHubOptions}
              claims={claims}
              onUpdateClaims={handleUpdateClaims}
              hourlyRates={hourlyRates}
              onUpdateHourlyRates={handleUpdateHourlyRates}
              schoolUsers={schoolUsers}
              onUpdateUserProfile={handleUpdateUserProfile}
              onUpdateUser={handleUpdateUser}
            />
          )}

          {activeTab === 'admin-dashboard' && (
            <AdminDashboardPage
              registrationLogs={registrationLogs}
              discountRules={discountRules}
              currentTheme={theme}
              systemActionLogs={systemActionLogs}
              landingPageSettings={landingPageSettings}
              onUpdateLandingPageSettings={async (newSettings) => {
                setLandingPageSettings(newSettings);
                await saveDocToFirestore('landingPageSettings', 'general', newSettings);
              }}
              onSelectTheme={setTheme}
              onOpenDiscountConfig={() => setIsDiscountConfigOpen(true)}
              onOpenGoogleExport={() => {}}
              users={schoolUsers}
              departments={departments}
              permissions={rolePermissions}
              loggedInUser={loggedInUser}
              currentRole={currentRole}
              onUpdateUserProfile={handleUpdateUserProfile}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onRoleChange={handleRoleChange}
              onDepartmentChange={handleDepartmentChange}
              onAddDepartment={handleAddDepartment}
              onUpdateDepartment={handleUpdateDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              onAssignUserToDepartment={handleAssignUserToDepartment}
              onTogglePermission={handleTogglePermission}
              onToggleUserDisabled={handleToggleUserDisabled}
              onTogglePaymentStatus={handleTogglePaymentStatus}
              onUpdateRegistration={handleUpdateRegistration}
              onDeleteRegistration={handleDeleteRegistration}
              classList={classList}
              sbaHubOptions={sbaHubOptions}
              clashes={clashes}
              onUpdateClassList={handleUpdateClassList}
              onUpdateSbaHubOptions={handleUpdateSbaHubOptions}
              onUpdateClashStatus={handleUpdateClashStatus}
              onRefreshClashes={handleRecalculateClashes}
              onClearAndInitFirebase={clearAndInitFirebaseData}
              faqs={faqs}
              schoolNews={schoolNews}
              academyInfo={academyInfo}
              featureCards={featureCards}
              classTypes={classTypes}
              locations={locations}
              onSaveClassType={handleSaveClassType}
              onDeleteClassType={handleDeleteClassType}
              onSaveLocation={handleSaveLocation}
              onDeleteLocation={handleDeleteLocation}
              claims={claims}
              onUpdateClaims={handleUpdateClaims}
              hourlyRates={hourlyRates}
              onUpdateHourlyRates={handleUpdateHourlyRates}
              onDeleteAllData={async () => {
                const ok = await deleteAllSiteData();
                if (ok) {
                  setClassList([]);
                  setSbaHubOptions([]);
                  setDiscountRules([]);
                  setClassTypes([]);
                  setLocations([]);
                  setRegistrationLogs([]);
                }
                return ok;
              }}
            />
          )}

          {activeTab === 'admissions' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 lg:col-start-3 space-y-6">
                <FormHeader
                  title="Account Creation"
                  setTitle={() => {}}
                  description="Register your student profile to join Shaw STEM Academy."
                  setDescription={() => {}}
                  theme={theme}
                  setTheme={setTheme}
                  themes={FORM_THEMES}
                  onOpenDiscountConfig={() => setIsDiscountConfigOpen(true)}
                  isEditing={false}
                  setIsEditing={() => {}}
                  canEditHeader={false}
                />
                <StudentInfoForm
                  studentInfo={studentInfo}
                  onChange={handleStudentInfoChange}
                  theme={theme}
                  isSiblingSelected={isSiblingSelected}
                  setIsSiblingSelected={setIsSiblingSelected}
                  siblingDiscountAmount={siblingAmount}
                  formGrades={academyInfo?.formGrades}
                />
                <div className="flex justify-end pt-4">
                  {(loggedInUser || user) ? (
                    <button 
                      onClick={async () => {
                        const sName = studentInfo.studentName || `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim();
                        
                        // Enhanced validation with scrolling
                        const requiredFields = [
                          { field: 'firstName', id: 'student-firstname', label: 'First Name' },
                          { field: 'lastName', id: 'student-lastname', label: 'Last Name' },
                          { field: 'email', id: 'student-email', label: 'Email' },
                          { field: 'formGrade', id: 'student-grade', label: 'Form/Grade' },
                          { field: 'currentSchool', id: 'student-school', label: 'Current School' },
                          { field: 'dateOfBirth', id: 'student-dob', label: 'Date of Birth' },
                          { field: 'cellPhone', id: 'student-cellphone', label: 'Cell Phone' },
                          { field: 'homePhone', id: 'student-homephone', label: 'Home Phone' },
                          { field: 'photoUrl', id: 'student-photo-section', label: 'Student Identification Picture' },
                          { field: 'gender', id: 'student-gender-section', label: 'Gender' },
                          { field: 'livesWith', id: 'student-liveswith-section', label: 'Who you live with' },
                        ];

                        for (const item of requiredFields) {
                          if (!studentInfo[item.field as keyof StudentInfo]) {
                            const el = document.getElementById(item.id);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              el.focus?.();
                            }
                            alert(`Please complete the ${item.label} field.`);
                            return;
                          }
                        }

                        const pName = studentInfo.motherFirstName || studentInfo.fatherFirstName || studentInfo.guardianFirstName || studentInfo.parentName || '';
                        const pPhone = studentInfo.cellPhone || studentInfo.homePhone || studentInfo.motherCellPhone || studentInfo.fatherCellPhone || studentInfo.guardianCellPhone || studentInfo.parentPhone || '';
                        
                        setStudentInfo(prev => ({
                          ...prev,
                          studentName: sName,
                          parentEmail: prev.email || '',
                          parentName: pName,
                          parentPhone: pPhone,
                          emergencyContact: prev.emergencyContact || pPhone || ''
                        }));

                        const currentUserId = loggedInUser?.id || user?.uid;
                        if (currentUserId) {
                          const updatedUser: SchoolUser = {
                            ...loggedInUser,
                            id: currentUserId,
                            name: sName,
                            email: studentInfo.email,
                            role: loggedInUser?.role || 'student',
                            status: loggedInUser?.status || 'unverified',
                            department: loggedInUser?.department || 'Student Body',
                            studentDetails: studentInfo,
                          };
                          await saveDocToFirestore('schoolUsers', currentUserId, updatedUser);
                          setLoggedInUser(updatedUser);
                        }
                        
                        const currentStatus = loggedInUser?.status || 'unverified';
                        if (currentStatus === 'accepted' || currentStatus === 'enrolled_paid') {
                          setActiveTab('registration');
                        } else {
                          alert('Profile saved successfully! Your registration is now pending review. You will be redirected to the Student Portal to track your status.');
                          setActiveTab('student-portal');
                        }
                      }}
                      className={`px-8 py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all ${theme.buttonBg}`}
                    >
                      Save Profile & Continue to Class Registration →
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        const sName = studentInfo.studentName || `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim();
                        
                        // Enhanced validation with scrolling
                        const requiredFields = [
                          { field: 'firstName', id: 'student-firstname', label: 'First Name' },
                          { field: 'lastName', id: 'student-lastname', label: 'Last Name' },
                          { field: 'email', id: 'student-email', label: 'Email' },
                          { field: 'formGrade', id: 'student-grade', label: 'Form/Grade' },
                          { field: 'currentSchool', id: 'student-school', label: 'Current School' },
                          { field: 'dateOfBirth', id: 'student-dob', label: 'Date of Birth' },
                          { field: 'cellPhone', id: 'student-cellphone', label: 'Cell Phone' },
                          { field: 'homePhone', id: 'student-homephone', label: 'Home Phone' },
                          { field: 'photoUrl', id: 'student-photo-section', label: 'Student Identification Picture' },
                          { field: 'gender', id: 'student-gender-section', label: 'Gender' },
                          { field: 'livesWith', id: 'student-liveswith-section', label: 'Who you live with' },
                        ];

                        for (const item of requiredFields) {
                          if (!studentInfo[item.field as keyof StudentInfo]) {
                            const el = document.getElementById(item.id);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              el.focus?.();
                            }
                            alert(`Please complete the ${item.label} field.`);
                            return;
                          }
                        }

                        if (studentInfo.livesWith === 'Parent') {
                          if (!studentInfo.motherFirstName && !studentInfo.fatherFirstName) {
                            alert('Please enter at least one parent (mother or father) first name in the form.');
                            return;
                          }
                        } else if (studentInfo.livesWith === 'Guardian') {
                          if (!studentInfo.guardianFirstName) {
                            alert('Please enter the guardian\'s first name in the form.');
                            return;
                          }
                        }
                        
                        const isGoogle = (studentInfo.email || '').toLowerCase().endsWith('@gmail.com');
                        if (isGoogle) {
                          handleGoogleAuthRegistration();
                        } else {
                          setAuthModalType('password');
                          setIsAuthModalOpen(true);
                        }
                      }}
                      className={`px-8 py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all ${theme.buttonBg}`}
                    >
                      Create Account & Continue to Class Registration →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'registration' && (
            (!user && !loggedInUser) ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Please Log In to Register</h2>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                  You must be logged into your student account to register for classes and view your schedule.
                </p>
                <button
                  onClick={() => setActiveTab('login')}
                  className={`px-8 py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all ${theme.buttonBg}`}
                >
                  Go to Login Page
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Cards (Form Layout) */}
              <div className="lg:col-span-8 space-y-6">
                <FormHeader
                  title={formTitle}
                  setTitle={setFormTitle}
                  description={formDescription}
                  setDescription={setFormDescription}
                  theme={theme}
                  setTheme={setTheme}
                  themes={FORM_THEMES}
                  onOpenDiscountConfig={() => setIsDiscountConfigOpen(true)}
                  isEditing={isEditingHeader}
                  setIsEditing={setIsEditingHeader}
                  canEditHeader={
                    currentRole === 'admin' ||
                    currentRole === 'registrar' ||
                    (loggedInUser?.permissions || []).includes('manage_form_options')
                  }
                />

                <SbaHubCatalog
                  sbaHubOptions={sbaHubOptions}
                  selectedSbaHubIds={selectedSbaHubIds}
                  enrolledSbaHubIds={enrolledSbaHubIds}
                  onToggleSbaHubOption={handleToggleSbaHubOption}
                  theme={theme}
                  canEditList={
                    currentRole === 'admin' ||
                    currentRole === 'registrar' ||
                    (loggedInUser?.permissions || []).includes('manage_form_options')
                  }
                  onOpenManageOptions={() => setIsManageListOptionsOpen(true)}
                  departments={departments}
                  classTypes={classTypes}
                />

                <ClassSelectionCatalog
                  classList={classList}
                  selectedClassIds={selectedClassIds}
                  enrolledClassIds={enrolledClassIds}
                  onToggleClass={handleToggleClass}
                  theme={theme}
                  canEditList={
                    currentRole === 'admin' ||
                    currentRole === 'registrar' ||
                    (loggedInUser?.permissions || []).includes('manage_form_options')
                  }
                  onOpenManageOptions={() => setIsManageListOptionsOpen(true)}
                  departments={departments}
                  classTypes={classTypes}
                />
              </div>

              {/* Right Column: Live Running Total Card */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 self-start">
                <RunningTotalCard
                  currentRole={currentRole}
                  selectedClasses={selectedClasses}
                  sbaHubOptions={sbaHubOptions}
                  selectedSbaHubIds={selectedSbaHubIds}
                  subtotal={subtotal}
                  appliedDiscounts={appliedDiscounts}
                  totalPrice={totalPrice}
                  promoCodeInput={promoCodeInput}
                  setPromoCodeInput={setPromoCodeInput}
                  promoError={promoError}
                  promoSuccess={promoSuccess}
                  onApplyPromoCode={handleApplyPromoCode}
                  discountRules={discountRules}
                  theme={theme}
                  onSubmitRegistration={handleSubmitRegistration}
                  onOpenDiscountConfig={() => setIsDiscountConfigOpen(true)}
                />
              </div>
            </div>
            )
          )}
        </main>
      </div>

      {/* School Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-black">
                S
              </div>
              <span className="font-extrabold text-white text-sm">Shaw STEM Academy</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Innovate • Explore • Lead. Empowering youth through hands-on engineering, robotics, artificial intelligence, and applied sciences.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">Portal Dashboards</h4>
            <ul className="space-y-1">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-blue-400 transition-colors">
                  Academy Home
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('academics')} className="hover:text-blue-400 transition-colors">
                  Academics & Labs Directory
                </button>
              </li>
              {(() => {
                const isStudent = (loggedInUser?.role || currentRole) === 'student';
                const status = loggedInUser?.status || studentStatus;
                const isAccepted = status === 'accepted' || status === 'enrolled_paid';
                const isTeacherOrHod = currentRole === 'teacher' || currentRole === 'hod';
                if (isTeacherOrHod) return false;
                if (isStudent && !isAccepted) return false;
                return true;
              })() && (
                <li>
                  <button 
                    onClick={() => setActiveTab('registration')} 
                    className="hover:text-blue-400 transition-colors"
                  >
                    Class Registration & Tuition Form
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">Campus & Contact</h4>
            <p className="text-slate-400">
              1000 Innovation Pkwy, Tech Center<br />
              admissions@shawstemacademy.edu<br />
              (555) 742-9000
            </p>
            <p className="text-[11px] text-slate-500 pt-2 flex flex-col gap-1">
              <span>© {new Date().getFullYear()} Shaw STEM Academy. All rights reserved.</span>
              <a href="?tab=privacy" onClick={(e) => { e.preventDefault(); setActiveTab('privacy'); }} className="text-left hover:text-blue-400 transition-colors w-fit">Privacy Policy</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DiscountRulesModal
        isOpen={isDiscountConfigOpen}
        onClose={() => setIsDiscountConfigOpen(false)}
        discountRules={discountRules}
        setDiscountRules={handleUpdateDiscountRules}
        classTypes={classTypes}
        onSaveClassType={handleSaveClassType}
        onDeleteClassType={handleDeleteClassType}
      />

      <ManageListOptionsModal
        isOpen={isManageListOptionsOpen}
        onClose={() => setIsManageListOptionsOpen(false)}
        classList={classList}
        onUpdateClassList={handleUpdateClassList}
        sbaHubOptions={sbaHubOptions}
        onUpdateSbaHubOptions={handleUpdateSbaHubOptions}
        classTypes={classTypes}
        departments={departments}
        locations={locations}
        onSaveLocation={handleSaveLocation}
        onDeleteLocation={handleDeleteLocation}
        onUpdateDepartment={handleUpdateDepartment}
        onSaveClassType={handleSaveClassType}
      />

      <RegistrationReceiptModal
        registration={completedRegistration}
        onClose={() => setCompletedRegistration(null)}
        theme={theme}
      />

      {/* Interactive Student Registration Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-lg cursor-pointer"
            >
              ×
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/40 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {authModalType === 'google' ? 'Account Authentication' : 'Create Account Password'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {authModalType === 'google'
                  ? `Please verify your identity for ${studentInfo.email} to secure your student portal account.`
                  : `Please set a password to secure your account for email ${studentInfo.email}.`}
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {authError}
              </div>
            )}

            {authModalType === 'google' ? (
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handleGoogleAuthRegistration}
                  className="w-full py-3 px-4 bg-slate-950 dark:bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{authLoading ? 'Signing in...' : 'Sign In with Google'}</span>
                </button>

                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or direct sign-in</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handleDirectGoogleEmailSignIn}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>Instant Gmail Direct Sign-In ({studentInfo.email || 'shawstemacademy@gmail.com'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">Choose Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">Confirm Password</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={handlePasswordAuthRegistration}
                    className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {authLoading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Session Timeout Alert Modal */}
      {showTimeoutAlert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl text-center space-y-6 relative">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Session Expired</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                You have been automatically logged out due to 30 minutes of inactivity to protect your account security.
              </p>
            </div>
            <button
              onClick={() => setShowTimeoutAlert(false)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-md hover:shadow-lg"
            >
              OK, Sign In Again
            </button>
          </div>
        </div>
      )}

      {/* Global Realtime Firestore Action Toast */}
      {firestoreToast && (
        <div className="fixed top-20 right-5 z-[200] max-w-md w-full animate-bounce-in">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-start justify-between gap-3 backdrop-blur-md ${
            firestoreToast.type === 'success' 
              ? 'bg-emerald-950/95 border-emerald-500/80 text-emerald-100 shadow-emerald-950/50' 
              : 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/50'
          }`}>
            <div className="space-y-1 pr-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <span className="text-base">{firestoreToast.type === 'success' ? '⚡' : '⚠️'}</span>
                <span>{firestoreToast.title}</span>
              </div>
              <p className="text-xs font-mono leading-relaxed opacity-90">{firestoreToast.message}</p>
            </div>
            <button
              onClick={() => setFirestoreToast(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-xs font-bold transition-all cursor-pointer opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Global Loading Overlay */}
      {authLoading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center border border-slate-200">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Processing Authentication</p>
              <p className="text-slate-500 text-sm mt-1">Please wait while we securely connect to your account. This may take a moment...</p>
              <div className="mt-6 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                  Tip: If the sign-in screen is blocked or doesn't appear, try opening this app in a <strong>New Tab</strong> using the button in the top right of the editor.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Auth Alert Modal */}
      {globalAuthAlert && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[250] animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-200 shadow-2xl space-y-5 relative">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600 text-2xl">
              ⚠️
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900">{globalAuthAlert.title}</h3>
              <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-2xl border border-rose-200 leading-relaxed font-medium text-left">
                {globalAuthAlert.message}
              </p>
              {globalAuthAlert.details && (
                <p className="text-[11px] text-slate-500 font-mono bg-slate-100 p-2 rounded-xl text-left">
                  {globalAuthAlert.details}
                </p>
              )}
            </div>
            <button
              onClick={() => setGlobalAuthAlert(null)}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-md hover:shadow-lg"
            >
              Dismiss Alert
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
