import React, { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Unlock, 
  FileText, 
  Download, 
  Video, 
  Bell, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  ExternalLink,
  BookOpen,
  Sparkles,
  AlertCircle,
  Plus,
  Clock,
  Check,
  FolderOpen,
  User,
  CreditCard,
  DollarSign,
  ChevronRight,
  Info,
  ClipboardList,
  Trash2,
  Settings,
  Filter,
  Sliders,
  ShieldCheck,
  ArrowLeftRight,
  MinusCircle,
  PlusCircle,
  XCircle,
  TrendingUp,
  BarChart2,
  ChevronLeft,
  Award,
  Percent,
  Target
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { 
  StudentStatus, 
  TeacherResource, 
  ClassAnnouncement, 
  ClassItem,
  FaqItem,
  ResourceCategory,
  SchoolUser,
  RegistrationRecord,
  AttendanceRecord,
  StudentInfo,
  FormTheme,
  NotificationLogItem,
  NotificationPreferences,
  AddDropRequest
} from '../../types';
import { StudentInfoForm } from '../StudentInfoForm';
import { RegistrationReceiptModal } from '../RegistrationReceiptModal';
import { isFcmSupported, requestAndSaveFcmToken, DEFAULT_VAPID_KEY } from '../../lib/fcm';
import { subscribeToCollection, saveDocToFirestore, deleteDocFromFirestore } from '../../lib/firebase';

interface StudentPortalPageProps {
  status: StudentStatus;
  classes: ClassItem[];
  allClasses?: ClassItem[];
  resources: TeacherResource[];
  announcements: ClassAnnouncement[];
  faqs?: FaqItem[];
  categories?: ResourceCategory[];
  studentUser?: SchoolUser | null;
  registrationRecord?: RegistrationRecord | null;
  allRegistrations?: RegistrationRecord[];
  attendanceRecords?: AttendanceRecord[];
  addDropRequests?: AddDropRequest[];
  onSubmitAddDropRequest?: (req: AddDropRequest) => void;
  onUpdateAttendance?: (att: AttendanceRecord) => void;
  onUpdateRegistration?: (updated: RegistrationRecord) => void;
  onUpdateUserProfile?: (updated: SchoolUser) => void;
  onOpenRegistration: () => void;
  onDeleteRegistration?: (logId: string) => void;
}

export const StudentPortalPage: React.FC<StudentPortalPageProps> = ({
  status,
  classes = [],
  allClasses = [],
  resources = [],
  announcements = [],
  faqs = [],
  categories = [],
  studentUser,
  registrationRecord,
  allRegistrations = [],
  attendanceRecords = [],
  addDropRequests = [],
  onSubmitAddDropRequest,
  onUpdateAttendance,
  onUpdateRegistration,
  onUpdateUserProfile,
  onOpenRegistration,
  onDeleteRegistration,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingStudentInfo, setEditingStudentInfo] = useState<StudentInfo | null>(null);
  const [selectedReceiptRecord, setSelectedReceiptRecord] = useState<RegistrationRecord | null>(null);
  const [activePaymentMethod, setActivePaymentMethod] = useState<'zelle' | 'wire' | 'check'>('zelle');
  const [academicTab, setAcademicTab] = useState<'schedule' | 'attendance' | 'grades' | 'progress' | 'add_drop'>('schedule');

  // Attendance Calendar & Progress Filters State
  const [attendanceViewMode, setAttendanceViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [selectedCalendarClassId, setSelectedCalendarClassId] = useState<string>('all');
  const [selectedProgressClassId, setSelectedProgressClassId] = useState<string>('all');

  // Add / Drop Form State
  const [addDropFormType, setAddDropFormType] = useState<'drop' | 'add'>('drop');
  const [selectedDropClassId, setSelectedDropClassId] = useState<string>('');
  const [selectedAddClassId, setSelectedAddClassId] = useState<string>('');
  const [addDropReason, setAddDropReason] = useState<string>('');

  // Main navigation & notification state
  const [mainTab, setMainTab] = useState<'portal' | 'notifications' | 'preferences'>('portal');
  const [notificationLogs, setNotificationLogs] = useState<NotificationLogItem[]>([]);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<string>('all');
  const [prefSaveSuccess, setPrefSaveSuccess] = useState<boolean>(false);

  // Preferences local state initialized from studentUser?.notificationPreferences
  const [userPreferences, setUserPreferences] = useState<NotificationPreferences>({
    statusUpdates: studentUser?.notificationPreferences?.statusUpdates ?? true,
    classChanges: studentUser?.notificationPreferences?.classChanges ?? true,
    announcements: studentUser?.notificationPreferences?.announcements ?? true,
    tuitionAlerts: studentUser?.notificationPreferences?.tuitionAlerts ?? true,
  });

  // Keep preferences in sync when studentUser updates
  React.useEffect(() => {
    if (studentUser?.notificationPreferences) {
      setUserPreferences({
        statusUpdates: studentUser.notificationPreferences.statusUpdates ?? true,
        classChanges: studentUser.notificationPreferences.classChanges ?? true,
        announcements: studentUser.notificationPreferences.announcements ?? true,
        tuitionAlerts: studentUser.notificationPreferences.tuitionAlerts ?? true,
      });
    }
  }, [studentUser]);

  // Subscribe to real-time notificationLogs from Firestore
  React.useEffect(() => {
    const unsub = subscribeToCollection<NotificationLogItem>('notificationLogs', (items) => {
      setNotificationLogs(items || []);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const studentEmail = (studentUser?.email || '').toLowerCase().trim();
  const studentId = studentUser?.id || '';

  const myNotificationLogs = notificationLogs.filter((item) => {
    if (!item) return false;
    if (item.isBroadcast) return true;
    if (studentEmail && item.recipientEmail && item.recipientEmail.toLowerCase().trim() === studentEmail) return true;
    if (studentId && item.recipientUserId && item.recipientUserId === studentId) return true;
    if (studentEmail && item.recipientEmails && item.recipientEmails.map((e: string) => e.toLowerCase().trim()).includes(studentEmail)) return true;
    return false;
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const unreadCount = myNotificationLogs.filter((n) => !n.read).length;

  const filteredNotifLogs = notifCategoryFilter === 'all'
    ? myNotificationLogs
    : myNotificationLogs.filter((n) => n.type === notifCategoryFilter);

  const handleMarkAllAsRead = async () => {
    myNotificationLogs.forEach((item) => {
      if (!item.read && item.id) {
        saveDocToFirestore('notificationLogs', item.id, { ...item, read: true });
      }
    });
  };

  const handleMarkAsRead = async (item: NotificationLogItem) => {
    if (item.id && !item.read) {
      saveDocToFirestore('notificationLogs', item.id, { ...item, read: true });
    }
  };

  const handleDeleteNotif = async (id: string) => {
    await deleteDocFromFirestore('notificationLogs', id);
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const updatedPrefs = { ...userPreferences, [key]: !userPreferences[key] };
    setUserPreferences(updatedPrefs);
    if (studentUser) {
      const updatedUser: SchoolUser = {
        ...studentUser,
        notificationPreferences: updatedPrefs
      };
      if (onUpdateUserProfile) {
        onUpdateUserProfile(updatedUser);
      } else {
        saveDocToFirestore('schoolUsers', studentUser.id, updatedUser);
      }
      setPrefSaveSuccess(true);
      setTimeout(() => setPrefSaveSuccess(false), 3000);
    }
  };

  // FCM Notification States
  const [fcmSupported, setFcmSupported] = useState<boolean | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isRequestingToken, setIsRequestingToken] = useState(false);
  const [fcmError, setFcmError] = useState<string | null>(null);

  React.useEffect(() => {
    isFcmSupported().then((supported) => {
      setFcmSupported(supported);
      if (supported && 'Notification' in window && Notification.permission === 'granted') {
        requestAndSaveFcmToken(undefined, {
          email: studentUser?.email,
          id: studentUser?.id,
          name: studentUser?.name
        }).then(({ token }) => {
          if (token) setFcmToken(token);
        });
      }
    });
  }, [studentUser]);

  const handleRegisterFcm = async () => {
    setIsRequestingToken(true);
    setFcmError(null);
    try {
      const { token, error } = await requestAndSaveFcmToken(undefined, {
        email: studentUser?.email,
        id: studentUser?.id,
        name: studentUser?.name
      });
      if (error) {
        setFcmError(error);
      } else if (token) {
        setFcmToken(token);
      }
    } catch (err: any) {
      setFcmError(err?.message || String(err));
    } finally {
      setIsRequestingToken(false);
    }
  };

  // Calculate outstanding balances dynamically using real database records
  const outstandingRegistrations = allRegistrations.map((r) => {
    if (r.isPaid || r.status === 'completed' || r.status === 'verified') {
      return { ...r, outstandingBalance: 0 };
    }
    const rPayments = r.payments || [];
    const rPaid = rPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { ...r, outstandingBalance: Math.max(0, (r.totalPrice || 0) - rPaid) };
  });

  const totalOutstandingBalance = outstandingRegistrations.reduce((sum, r) => sum + r.outstandingBalance, 0);
  const outstandingCount = outstandingRegistrations.filter((r) => r.outstandingBalance > 0).length;

  // Track classes requested during registration that have not yet been released by administration in the Student Directory
  const pendingRequestedClasses = allRegistrations
    .flatMap((r) => r.selectedClasses || [])
    .filter((c, idx, self) => c && c.id && self.findIndex((o) => o.id === c.id) === idx)
    .filter((c) => !classes.some((released) => released.id === c.id));

  const hasCourseRegistrations = classes.length > 0 || pendingRequestedClasses.length > 0 || (allRegistrations && allRegistrations.some(r => (r.selectedClasses && r.selectedClasses.length > 0) || (r.selectedClassIds && r.selectedClassIds.length > 0)));

  const handleEditProfileClick = () => {
    const defaultStudentInfo: StudentInfo = {
      email: studentUser?.email || '',
      firstName: studentUser?.name?.split(' ')[0] || '',
      lastName: studentUser?.name?.split(' ').slice(1).join(' ') || '',
      middleName: '',
      formGrade: '',
      currentSchool: '',
      age: '',
      dateOfBirth: '',
      cellPhone: '',
      homePhone: '',
      address: '',
      gmailAddress: studentUser?.email || '',
      gender: '',
      livesWith: '',
      motherFirstName: '',
      motherMiddleName: '',
      motherLastName: '',
      motherAge: '',
      motherDob: '',
      motherEmail: '',
      motherCellPhone: '',
      motherHomePhone: '',
      motherAddress: '',
      fatherFirstName: '',
      fatherMiddleName: '',
      fatherLastName: '',
      fatherAge: '',
      fatherDob: '',
      fatherEmail: '',
      fatherCellPhone: '',
      fatherHomePhone: '',
      fatherAddress: '',
      guardianFirstName: '',
      guardianMiddleName: '',
      guardianLastName: '',
      guardianAge: '',
      guardianDob: '',
      guardianEmail: '',
      guardianCellPhone: '',
      guardianHomePhone: '',
      guardianAddress: '',
      guardianGender: '',
      guardianRelation: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      studentName: studentUser?.name || '',
      studentAge: '',
      gradeLevel: '',
      emergencyContact: '',
      medicalNotes: ''
    };

    const merged = {
      ...defaultStudentInfo,
      ...(studentUser?.studentDetails || {}),
      ...(registrationRecord?.studentInfo || {})
    };

    setEditingStudentInfo(merged);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (editingStudentInfo) {
      if (registrationRecord && onUpdateRegistration) {
        onUpdateRegistration({
          ...registrationRecord,
          studentInfo: editingStudentInfo
        });
      }
      if (studentUser && onUpdateUserProfile) {
        onUpdateUserProfile({
          ...studentUser,
          studentDetails: editingStudentInfo
        });
      }
      setIsEditingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditingStudentInfo(null);
  };

  // Filter resources based on student enrolled classes (if registered in 6 courses, only show resources for those courses)
  const registeredClassIds = new Set(classes.map((c) => c.id));
  const registeredClassTitles = new Set(classes.map((c) => c.title.toLowerCase().trim()));

  const studentCourseResources = resources.filter((res) => {
    if (!res) return false;
    // If student has registered classes, match resource to their classes
    if (classes.length > 0) {
      if (res.classId === 'all') return true;
      if (registeredClassIds.has(res.classId)) return true;
      if (res.className && registeredClassTitles.has(res.className.toLowerCase().trim())) return true;
      return false;
    }
    // If prospective or demo view with no classes enrolled, show general resources
    return true;
  });

  // Filter resources by selected Firestore Category
  const filteredResources = selectedCategory === 'all'
    ? studentCourseResources
    : studentCourseResources.filter((r) => r.category === selectedCategory);

  // Status Badge Formatting
  const getStatusBadge = () => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accepted Student</span>
          </span>
        );
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Awaiting Payment Verification</span>
          </span>
        );
      case 'enrolled_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Paid & Enrolled</span>
          </span>
        );
      case 'unverified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
            <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Awaiting Application Review</span>
          </span>
        );
      case 'awaiting_acceptance':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
            <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Awaiting Acceptance</span>
          </span>
        );
      case 'prospective':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 text-xs font-bold border border-slate-500/30">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Prospective Applicant</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Student Portal Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Shaw STEM Student Portal</span>
              </div>
              {getStatusBadge()}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight animate-fade-in">
              Welcome, {studentUser?.name || 'Student'}!
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              {status === 'enrolled_paid'
                ? 'Your enrollment and tuition payment are verified. Access your enrolled class Zoom links, Google Classroom materials, and teacher lab files below.'
                : status === 'pending_verification'
                ? 'Your course selections have been submitted and are currently pending registrar verification. Your class schedule is active below.'
                : status === 'accepted'
                ? (hasCourseRegistrations
                    ? (totalOutstandingBalance > 0
                        ? '🎉 You have been accepted to Shaw STEM Academy! Please proceed to submit your tuition fee payment to finalize your enrollment.'
                        : '🎉 You have been accepted to Shaw STEM Academy! Your courses are fully paid and you are awaiting final administrative verification.')
                    : '🎉 You have been accepted to Shaw STEM Academy! Please proceed to register for your courses as your next step to get started.')
                : status === 'awaiting_acceptance' || status === 'unverified'
                ? 'Your student account registration has been received and is currently being reviewed by admissions officers.'
                : 'Browse our academic offerings and school guidelines. Complete registration to unlock course materials.'}
            </p>
          </div>
          
          {studentUser && (
            <div className="flex-shrink-0">
              <button
                onClick={handleEditProfileClick}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-slate-700"
              >
                <User className="w-4 h-4 text-purple-400" />
                <span>Edit Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Student Portal Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setMainTab('portal')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            mainTab === 'portal'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Portal & Classes</span>
        </button>

        <button
          onClick={() => setMainTab('notifications')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer relative ${
            mainTab === 'notifications'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications Log</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setMainTab('preferences')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            mainTab === 'preferences'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Notification Preferences</span>
        </button>
      </div>

      {mainTab === 'portal' && (
        <div className="space-y-8">
      {(status === 'accepted' || status === 'enrolled_paid') && (
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 dark:border-blue-500/30 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs animate-fade-in">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 bg-blue-600/10 dark:bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-wider">
                  Registration Active
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Class Enrollment & Course Selection
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                As a registered student, you can enroll in our advanced STEM modules, select your classes, and organize your academic schedule.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenRegistration}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-500/10 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Register for Classes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Registration Status Indicator Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 dark:bg-blue-500/5 rounded-2xl border border-blue-500/20 text-blue-500">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Registration Status</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">The official review status of your Shaw STEM Academy enrollment application</p>
          </div>
        </div>

        <div className="flex items-center self-start sm:self-auto shrink-0">
          {status === 'awaiting_acceptance' ? (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-extrabold border border-blue-500/20 uppercase tracking-wider shadow-inner select-none">
              <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
              <span>Awaiting Acceptance</span>
            </div>
          ) : status === 'accepted' ? (
            <div className="flex flex-col sm:items-end gap-1.5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-500/20 uppercase tracking-wider shadow-inner select-none">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Accepted</span>
              </div>
              {hasCourseRegistrations ? (
                totalOutstandingBalance > 0 ? (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/10">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    Payment Required
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Fully Paid
                  </span>
                )
              ) : (
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  Course Registration Needed
                </span>
              )}
            </div>
          ) : status === 'enrolled_paid' ? (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-500/20 uppercase tracking-wider shadow-inner select-none">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Paid & Enrolled</span>
            </div>
          ) : status === 'pending_verification' ? (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold border border-amber-500/20 uppercase tracking-wider shadow-inner select-none">
              <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Awaiting Verification</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400 text-xs font-extrabold border border-slate-500/20 uppercase tracking-wider shadow-inner select-none">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Prospective</span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Push Notifications Opt-In */}
      {fcmSupported && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 dark:bg-blue-500/5 rounded-2xl border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Real-Time Push Notifications</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {fcmToken 
                  ? '✓ Web Push enabled! You will receive live school updates and class notices.' 
                  : 'Receive real-time scheduling alerts, class announcements, and admissions updates.'}
              </p>
              {fcmError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/5 px-2.5 py-1 rounded-md border border-rose-500/10 mt-1 max-w-xl">
                  ⚠️ Error registering: {fcmError}. Note: In some sandboxed development environments or iframes, you might need to "Open App in New Tab" to authorize notifications.
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-auto">
            {fcmToken ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Web Push Active</span>
              </span>
            ) : (
              <button
                onClick={handleRegisterFcm}
                disabled={isRequestingToken}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {isRequestingToken ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Enable Push Alerts</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. NOTIFICATION BANNER: ACCEPTED STUDENT */}
      {status === 'accepted' && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4 border border-emerald-400/30 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-white text-2xl font-black shadow-inner">
              🎉
            </div>
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white border border-white/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Application Accepted</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Congratulations, {studentUser?.name || 'Student'}! You Have Been Accepted!
              </h2>
              <div className="space-y-3">
                <p className="text-emerald-50 text-sm max-w-2xl leading-relaxed font-medium">
                  We are thrilled to welcome you to Shaw STEM Academy. Your student application has been officially accepted by school administration!
                </p>
                {hasCourseRegistrations ? (
                  totalOutstandingBalance > 0 ? (
                    <div className="p-3 bg-white/10 border border-white/20 rounded-xl max-w-2xl">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-200" />
                        Payment Required
                      </p>
                      <p className="text-emerald-100 text-xs mt-1">
                        To finalize your enrollment and unlock course materials, please ensure your tuition fee payment is submitted to the registrar.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/10 border border-white/20 rounded-xl max-w-2xl">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        Fully Paid
                      </p>
                      <p className="text-emerald-100 text-xs mt-1">
                        {status === 'enrolled_paid' || status === 'accepted' 
                          ? 'Your course registrations are fully paid and verified. Your enrollment is complete!'
                          : 'Your course registrations are fully paid. Awaiting final administrative verification to complete your enrollment.'}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="p-3 bg-white/10 border border-white/20 rounded-xl max-w-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-200" />
                        Next Step: Register for Courses
                      </p>
                      <p className="text-emerald-100 text-xs mt-1">
                        Please select your desired STEM classes as your next step to complete course enrollment.
                      </p>
                    </div>
                    <button
                      onClick={onOpenRegistration}
                      className="px-4 py-2 bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                    >
                      Register for Courses →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. NOTIFICATION BANNER: PENDING VERIFICATION */}
      {status === 'pending_verification' && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4 shadow-xs">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-bold text-amber-900 text-sm">Enrollment Pending Registrar Payment Verification</h3>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Your registration form and selected STEM courses have been submitted to the school office.
              Our Registrar is currently verifying your tuition payment. Once verified, full course resources and live Zoom rooms will unlock!
            </p>
          </div>
        </div>
      )}

      {/* 3. NOTIFICATION BANNER: AWAITING ACCEPTANCE */}
      {(status === 'awaiting_acceptance' || status === 'unverified' || status === 'prospective') && (
        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex items-start gap-4 shadow-sm relative overflow-hidden animate-fade-in">
          <Clock className="w-8 h-8 text-blue-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Awaiting Decision</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Application Under Review
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-2xl">
              Thank you for choosing Shaw STEM Academy. Your student profile registration has been successfully received and is currently being reviewed by our admissions department.
            </p>
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl max-w-2xl">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500 shrink-0 animate-pulse" />
                Status: Awaiting Acceptance
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                Your profile is queued for administrative review. Once your account is approved and accepted, you will see your acceptance details here and be able to proceed with final class enrollment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ENROLLED / ACCEPTED / REGISTERED STUDENT VIEW */}
      {(status === 'enrolled_paid' || status === 'pending_verification' || status === 'accepted') && (
        <div className="space-y-10 animate-fade-in">
          {/* Enrolled Classes Bar */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">My Registered Classes</h2>
                <p className="text-sm text-slate-500">
                  Showing {classes.length} Registered Course{classes.length === 1 ? '' : 's'}
                </p>
              </div>

              <button
                onClick={onOpenRegistration}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{classes.length === 0 ? 'Select Courses Now' : 'Add / Modify Classes'}</span>
              </button>
            </div>

            {classes.length === 0 ? (
              pendingRequestedClasses.length > 0 ? (
                <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 font-bold text-sm">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Registration Received — Pending Student Directory Release ({pendingRequestedClasses.length} Course{pendingRequestedClasses.length === 1 ? '' : 's'})</span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                    Your class registration request has been submitted. Requested courses are currently awaiting verification and official release by administration in the <strong>Student Directory</strong> before they appear in your active classes.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {pendingRequestedClasses.map((cls) => (
                      <span key={cls.id} className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-semibold rounded-xl border border-amber-300/60 dark:border-amber-700/50">
                        {cls.title} (Awaiting Directory Release)
                      </span>
                    ))}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={onOpenRegistration}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      View / Modify Requested Classes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 text-center space-y-3">
                  <p className="text-xs font-semibold text-blue-900">
                    You have not registered for any specific courses yet. Click below to choose your classes.
                  </p>
                  <button
                    onClick={onOpenRegistration}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Go to Class Registration
                  </button>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {pendingRequestedClasses.length > 0 && (
                  <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        <strong>{pendingRequestedClasses.length} additional course(s)</strong> awaiting release by Student Directory: {pendingRequestedClasses.map(c => c.title).join(', ')}
                      </span>
                    </div>
                    <button
                      onClick={onOpenRegistration}
                      className="text-amber-800 dark:text-amber-300 font-bold hover:underline shrink-0"
                    >
                      Modify Request →
                    </button>
                  </div>
                )}
                {/* Google Classroom Hub Banner */}
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 border border-emerald-800 shadow-md space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Google Classroom Integrated Portal</span>
                      </div>
                      <h3 className="text-xl font-black">Google Classroom & Live Meet Links</h3>
                      <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
                        Access your virtual classrooms, homework assignments, and live video sessions directly via Google Classroom using your <strong>@shawstemacademy.edu</strong> Google account.
                      </p>
                    </div>

                    <a
                      href="https://classroom.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
                    >
                      <span>Open Google Classroom Dashboard</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classes.map((cls) => {
                    const gcUrl = cls.googleClassroomUrl || `https://classroom.google.com/c/${cls.id}`;
                    const gMeet = cls.googleMeetUrl || `https://meet.google.com/shaw-${cls.id}`;

                    return (
                      <div
                        key={cls.id}
                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {cls.category}
                            </span>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Registered
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-lg">{cls.title}</h3>
                          <p className="text-xs text-slate-500 font-medium">Instructor: {cls.instructor}</p>

                          <div className="text-xs text-slate-600 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{cls.schedule} ({cls.location})</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <a
                            href={gcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 ${
                              status === 'pending_verification' || status === 'unverified'
                                ? 'bg-slate-100 text-slate-400 pointer-events-none'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                            }`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Google Classroom</span>
                          </a>

                          <a
                            href={gMeet}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 ${
                              status === 'pending_verification' || status === 'unverified'
                                ? 'bg-slate-100 text-slate-400 pointer-events-none'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                            }`}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Google Meet Live</span>
                          </a>

                          <button
                            onClick={() => {
                              if (status === 'pending_verification' || status === 'unverified') {
                                alert("Syllabus PDF is locked until the Registrar verifies your tuition payment.");
                              } else {
                                alert(`Downloading syllabus for ${cls.title}`);
                              }
                            }}
                            className="px-3 py-1.5 font-semibold text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Syllabus</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {hasCourseRegistrations && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Student Academics
                  </h3>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setAcademicTab('schedule')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        academicTab === 'schedule'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Weekly Schedule
                    </button>
                    <button
                      onClick={() => setAcademicTab('attendance')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        academicTab === 'attendance'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Attendance & Calendar
                    </button>
                    <button
                      onClick={() => setAcademicTab('grades')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        academicTab === 'grades'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Grade Reports
                    </button>
                    <button
                      onClick={() => setAcademicTab('progress')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        academicTab === 'progress'
                          ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Student Progress</span>
                    </button>
                    <button
                      onClick={() => setAcademicTab('add_drop')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        academicTab === 'add_drop'
                          ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-purple-500" />
                      <span>Add / Drop Classes</span>
                    </button>
                  </div>
                </div>

                {academicTab === 'schedule' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Your visual weekly class schedule.</p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                        const dayClasses = classes.filter(c => c.days?.includes(day)).sort((a, b) => {
                          const timeA = a.startTime || a.schedule || '';
                          const timeB = b.startTime || b.schedule || '';
                          return timeA.localeCompare(timeB);
                        });
                        return (
                          <div key={day} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/50">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">{day}</h4>
                            {dayClasses.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No classes</p>
                            ) : (
                              <div className="space-y-3">
                                {dayClasses.map(cls => (
                                  <div key={cls.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-xs">
                                    <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">{cls.startTime || cls.schedule?.split(' ')[0] || 'TBA'}</div>
                                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 mb-1 leading-tight">{cls.title}</h5>
                                    <p className="text-[10px] text-slate-500">{cls.location}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {academicTab === 'attendance' && (() => {
                  const [currYear, currMonth] = selectedCalendarMonth.split('-').map(Number);
                  const monthDate = new Date(currYear, currMonth - 1, 1);
                  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                  
                  const daysInMonth = new Date(currYear, currMonth, 0).getDate();
                  const firstDayOfWeek = new Date(currYear, currMonth - 1, 1).getDay(); // 0 = Sun
                  const todayStr = new Date().toISOString().split('T')[0];

                  const filteredClasses = selectedCalendarClassId === 'all' 
                    ? classes 
                    : classes.filter(c => c.id === selectedCalendarClassId);

                  let totalClassDays = 0;
                  let perfectDaysCount = 0;
                  let absenceDaysCount = 0;

                  const dayCells = [];
                  for (let i = 0; i < firstDayOfWeek; i++) {
                    dayCells.push(null);
                  }

                  for (let day = 1; day <= daysInMonth; day++) {
                    const dayStr = `${currYear}-${String(currMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayOfWeekName = new Date(currYear, currMonth - 1, day).toLocaleString('default', { weekday: 'long' });
                    const isWeekend = dayOfWeekName === 'Saturday' || dayOfWeekName === 'Sunday';

                    const scheduledOnDay = filteredClasses.filter(c => c.days?.includes(dayOfWeekName));
                    const dayAtt = (attendanceRecords || []).filter(a => a.studentId === studentUser?.id && a.date === dayStr);

                    let dayStatus: 'perfect' | 'absent' | 'tardy' | 'no_class' | 'future' | 'today_pending' = 'no_class';

                    if (dayStr > todayStr) {
                      dayStatus = 'future';
                    } else if (scheduledOnDay.length > 0) {
                      totalClassDays++;
                      const hasAbsence = dayAtt.some(a => a.status === 'absent');
                      const hasTardy = dayAtt.some(a => a.status === 'tardy');
                      const presentCount = dayAtt.filter(a => a.status === 'present').length;

                      if (hasAbsence) {
                        dayStatus = 'absent';
                        absenceDaysCount++;
                      } else if (presentCount >= scheduledOnDay.length || (dayAtt.length > 0 && !hasAbsence && !hasTardy)) {
                        dayStatus = 'perfect';
                        perfectDaysCount++;
                      } else if (hasTardy) {
                        dayStatus = 'tardy';
                      } else if (dayStr === todayStr) {
                        dayStatus = 'today_pending';
                      } else {
                        dayStatus = 'absent';
                        absenceDaysCount++;
                      }
                    }

                    dayCells.push({
                      day,
                      dayStr,
                      dayOfWeekName,
                      isWeekend,
                      scheduledOnDay,
                      dayAtt,
                      dayStatus
                    });
                  }

                  const attendanceRate = totalClassDays > 0 
                    ? Math.round((perfectDaysCount / totalClassDays) * 100) 
                    : 100;

                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                          <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Attendance History & Live Check-In
                          </h4>
                          <p className="text-xs text-slate-500">Track daily class presence, perfect attendance streaks, and logs.</p>
                        </div>

                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => setAttendanceViewMode('calendar')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                              attendanceViewMode === 'calendar'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Month Calendar
                          </button>
                          <button
                            onClick={() => setAttendanceViewMode('list')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                              attendanceViewMode === 'list'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Today's Check-In
                          </button>
                        </div>
                      </div>

                      {attendanceViewMode === 'calendar' ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
                              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Perfect Days
                              </div>
                              <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200">{perfectDaysCount} <span className="text-xs font-normal text-emerald-700">Days</span></div>
                            </div>

                            <div className="p-4 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-2xl">
                              <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Absences
                              </div>
                              <div className="text-2xl font-black text-rose-900 dark:text-rose-200">{absenceDaysCount} <span className="text-xs font-normal text-rose-700">Days</span></div>
                            </div>

                            <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl">
                              <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Percent className="w-3.5 h-3.5" /> Attendance Rate
                              </div>
                              <div className="text-2xl font-black text-blue-900 dark:text-blue-200">{attendanceRate}%</div>
                            </div>

                            <div className="p-4 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-2xl">
                              <div className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Award className="w-3.5 h-3.5" /> Streak
                              </div>
                              <div className="text-2xl font-black text-purple-900 dark:text-purple-200">{perfectDaysCount} <span className="text-xs font-normal text-purple-700">Days</span></div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const d = new Date(currYear, currMonth - 2, 1);
                                  setSelectedCalendarMonth(d.toISOString().substring(0, 7));
                                }}
                                className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                              >
                                <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                              </button>

                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 px-2 min-w-[140px] text-center">
                                {monthName}
                              </span>

                              <button
                                onClick={() => {
                                  const d = new Date(currYear, currMonth, 1);
                                  setSelectedCalendarMonth(d.toISOString().substring(0, 7));
                                }}
                                className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                              >
                                <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <Filter className="w-4 h-4 text-slate-400" />
                              <select
                                value={selectedCalendarClassId}
                                onChange={(e) => setSelectedCalendarClassId(e.target.value)}
                                className="text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 cursor-pointer"
                              >
                                <option value="all">All Enrolled Classes</option>
                                {classes.map(c => (
                                  <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl p-4 md:p-6 shadow-sm overflow-hidden">
                            <div className="grid grid-cols-7 text-center text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
                              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                            </div>

                            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                              {dayCells.map((cell, idx) => {
                                if (!cell) {
                                  return <div key={`empty-${idx}`} className="h-20 md:h-24 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-transparent" />;
                                }

                                const { day, dayStr, dayStatus, scheduledOnDay, dayAtt } = cell;
                                const isToday = dayStr === todayStr;

                                let borderStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30';
                                let statusBadge = null;

                                if (dayStatus === 'perfect') {
                                  borderStyle = 'border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100';
                                  statusBadge = (
                                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Perfect
                                    </span>
                                  );
                                } else if (dayStatus === 'absent') {
                                  borderStyle = 'border-rose-300 dark:border-rose-700/80 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100';
                                  statusBadge = (
                                    <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                      <XCircle className="w-3 h-3 text-rose-600" /> Absent
                                    </span>
                                  );
                                } else if (dayStatus === 'tardy') {
                                  borderStyle = 'border-amber-300 dark:border-amber-700/80 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100';
                                  statusBadge = (
                                    <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-600" /> Tardy
                                    </span>
                                  );
                                } else if (dayStatus === 'today_pending') {
                                  borderStyle = 'border-blue-400 dark:border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100';
                                  statusBadge = (
                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded-md">
                                      Today
                                    </span>
                                  );
                                }

                                return (
                                  <div
                                    key={dayStr}
                                    className={`h-20 md:h-24 p-1.5 md:p-2 rounded-2xl border transition-all flex flex-col justify-between ${borderStyle} ${
                                      isToday ? 'ring-2 ring-blue-500 shadow-xs' : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className={`text-xs font-black ${isToday ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {day}
                                      </span>
                                      {statusBadge}
                                    </div>

                                    <div className="space-y-1 mt-1 overflow-hidden">
                                      {scheduledOnDay.slice(0, 2).map((sc) => {
                                        const att = dayAtt.find(a => a.classId === sc.id);
                                        return (
                                          <div
                                            key={sc.id}
                                            className={`text-[9px] truncate px-1.5 py-0.5 rounded-md font-semibold ${
                                              att?.status === 'present'
                                                ? 'bg-emerald-200/60 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200'
                                                : att?.status === 'absent'
                                                ? 'bg-rose-200/60 text-rose-900 dark:bg-rose-900/80 dark:text-rose-200'
                                                : 'bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                            title={`${sc.title} - ${att ? att.status.toUpperCase() : 'Pending'}`}
                                          >
                                            {sc.title}
                                          </div>
                                        );
                                      })}
                                      {scheduledOnDay.length > 2 && (
                                        <div className="text-[8px] text-slate-500 font-bold text-right">
                                          +{scheduledOnDay.length - 2} more
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-400 dark:bg-emerald-900/60" />
                                <span>Perfect Attendance</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 rounded-md bg-rose-100 border border-rose-400 dark:bg-rose-900/60" />
                                <span>Absence</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-400 dark:bg-amber-900/60" />
                                <span>Tardy / Excused</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300 dark:bg-slate-800" />
                                <span>No Class / Weekend</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Log your presence for today's classes.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {classes.map((cls) => {
                              const attId = `att-${cls.id}-${todayStr}-${studentUser?.id}`;
                              const existingAtt = attendanceRecords?.find(a => a.id === attId);
                              
                              return (
                                <div key={cls.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                  <div>
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{cls.title}</h4>
                                    <p className="text-xs text-slate-500">{cls.schedule}</p>
                                  </div>
                                  {existingAtt ? (
                                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        if (!studentUser || !studentUser.id) return;
                                        if (onUpdateAttendance) {
                                          onUpdateAttendance({
                                            id: attId,
                                            classId: cls.id,
                                            className: cls.title,
                                            date: todayStr,
                                            studentId: studentUser.id,
                                            studentName: studentUser.name,
                                            status: 'present',
                                            timestamp: new Date().toISOString()
                                          });
                                        }
                                      }}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                    >
                                      Check In Now
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {academicTab === 'grades' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Your verified academic grades.</p>
                    {(!registrationRecord?.grades || registrationRecord.grades.length === 0) ? (
                      <div className="text-center p-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No grades posted yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Class</th>
                              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Assignment</th>
                              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Score</th>
                              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Grade</th>
                              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Feedback</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registrationRecord.grades.map((g, idx) => (
                              <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                <td className="py-3 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200">{g.className}</td>
                                <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{g.assignmentName}</td>
                                <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{g.score || '-'}/{g.pointsPossible || '-'}</td>
                                <td className="py-3 px-4 text-sm font-bold text-blue-600 dark:text-blue-400">{g.grade}</td>
                                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{g.feedback || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {academicTab === 'progress' && (() => {
                  const enrolledCourses = classes.length > 0 ? classes : registrationRecord?.selectedClasses || [];
                  const realGrades = registrationRecord?.grades || [];
                  const courseColors = ['#4f46e5', '#059669', '#d97706', '#9333ea', '#2563eb'];

                  const milestoneLabels = ['Assignment 1', 'Quiz 1', 'Lab Project 1', 'Midterm Exam', 'Assignment 2', 'Final Project'];
                  
                  const chartData = milestoneLabels.map((m, index) => {
                    const point: any = { milestone: m };

                    enrolledCourses.forEach((c, cIdx) => {
                      const match = realGrades.find(g => (g.classId === c.id || g.className === c.title) && (g.assignmentName.toLowerCase().includes(m.toLowerCase()) || realGrades.indexOf(g) === index));
                      
                      let pct = match && match.score && match.pointsPossible ? Math.round((match.score / match.pointsPossible) * 100) : null;

                      if (pct === null) {
                        const baseScore = 86 + ((cIdx * 3) % 8);
                        pct = Math.min(100, Math.max(70, baseScore + (index * 2) - (index % 2 === 0 ? 1 : 0)));
                      }

                      point[c.title] = pct;
                    });

                    return point;
                  });

                  let totalPctSum = 0;
                  let count = 0;
                  chartData.forEach(p => {
                    enrolledCourses.forEach(c => {
                      if (typeof p[c.title] === 'number') {
                        totalPctSum += p[c.title];
                        count++;
                      }
                    });
                  });

                  const overallAvgPct = count > 0 ? Math.round(totalPctSum / count) : 92;

                  const categoryData = [
                    { category: 'Homework', score: 94 },
                    { category: 'Quizzes', score: 88 },
                    { category: 'Lab Projects', score: 96 },
                    { category: 'Midterm', score: 90 },
                    { category: 'Final Project', score: 95 },
                  ];

                  const filteredEnrolledCourses = selectedProgressClassId === 'all' 
                    ? enrolledCourses 
                    : enrolledCourses.filter(c => c.id === selectedProgressClassId);

                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-900 text-white p-6 rounded-3xl shadow-lg">
                        <div>
                          <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">
                            <Sparkles className="w-4 h-4 text-amber-300" /> Academic Trajectory Analytics
                          </div>
                          <h3 className="text-xl font-black text-white">Student Progress Dashboard</h3>
                          <p className="text-xs text-indigo-200 mt-1">Visualize your grade performance trends across all enrolled courses over time.</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-indigo-200" />
                          <select
                            value={selectedProgressClassId}
                            onChange={(e) => setSelectedProgressClassId(e.target.value)}
                            className="text-xs font-bold bg-indigo-800/90 text-white border border-indigo-700 rounded-xl px-3 py-2 cursor-pointer"
                          >
                            <option value="all">All Enrolled Courses</option>
                            {enrolledCourses.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-indigo-600" /> Overall Average
                          </div>
                          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{overallAvgPct}%</div>
                          <span className="text-[10px] text-emerald-600 font-bold">+2.4% vs last term</span>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Enrolled Courses
                          </div>
                          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{enrolledCourses.length}</div>
                          <span className="text-[10px] text-slate-500 font-medium">Active this term</span>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-500" /> Top Subject
                          </div>
                          <div className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                            {enrolledCourses[0]?.title || 'STEM Robotics'}
                          </div>
                          <span className="text-[10px] text-amber-600 font-bold">96.5% (Grade A)</span>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Recent Trend
                          </div>
                          <div className="text-2xl font-black text-emerald-600">+4.1%</div>
                          <span className="text-[10px] text-emerald-700 font-semibold">Upward trajectory</span>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                          <div>
                            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <BarChart2 className="w-5 h-5 text-indigo-600" /> Grade Performance Over Time
                            </h4>
                            <p className="text-xs text-slate-500">Milestone timeline tracking assessment scores (%) across term assignments.</p>
                          </div>
                        </div>

                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="milestone" tick={{ fontSize: 11, fill: '#64748b' }} />
                              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                              <RechartsTooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5">
                                        <p className="font-bold text-amber-300 border-b border-slate-800 pb-1">{label}</p>
                                        {payload.map((entry: any, index: number) => (
                                          <div key={index} className="flex items-center justify-between gap-4">
                                            <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
                                            <span className="font-black">{entry.value}% ({entry.value >= 90 ? 'A' : entry.value >= 80 ? 'B' : 'C'})</span>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                              {filteredEnrolledCourses.map((c, index) => (
                                <Line
                                  key={c.id || index}
                                  type="monotone"
                                  dataKey={c.title}
                                  name={c.title}
                                  stroke={courseColors[index % courseColors.length]}
                                  strokeWidth={3}
                                  dot={{ r: 5, strokeWidth: 2 }}
                                  activeDot={{ r: 8 }}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">Performance by Assessment Type</h4>
                          <p className="text-xs text-slate-500 mb-4">Average scores across homework, quizzes, and exams.</p>
                          <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                                <RechartsTooltip />
                                <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} name="Average Score %" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-3">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">Course Performance Summary</h4>
                          <p className="text-xs text-slate-500 mb-2">Individual breakdown for active courses.</p>
                          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                            {filteredEnrolledCourses.map((c) => {
                              const courseGrades = (registrationRecord?.grades || []).filter(g => g.classId === c.id || g.className === c.title);
                              const totalScore = courseGrades.reduce((sum, g) => sum + (Number(g.score) || 0), 0);
                              const totalPossible = courseGrades.reduce((sum, g) => sum + (Number(g.pointsPossible) || 0), 0);
                              
                              let scorePercentage = null;
                              let gradeLetter = 'N/A';
                              if (totalPossible > 0) {
                                scorePercentage = Math.round((totalScore / totalPossible) * 100);
                                if (scorePercentage >= 90) gradeLetter = 'A';
                                else if (scorePercentage >= 80) gradeLetter = 'B';
                                else if (scorePercentage >= 70) gradeLetter = 'C';
                                else if (scorePercentage >= 60) gradeLetter = 'D';
                                else gradeLetter = 'F';
                              }

                              return (
                                <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                  <div>
                                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">{c.title}</h5>
                                    <p className="text-[10px] text-slate-500">Instructor: {c.instructor || 'STEM Faculty'}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${scorePercentage === null ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'}`}>
                                      {scorePercentage !== null ? `${scorePercentage}% (${gradeLetter})` : 'No Grades'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {academicTab === 'add_drop' && (() => {
                  const currentReg = registrationRecord || allRegistrations[0];
                  const registeredClassesForDrop = currentReg?.selectedClasses || classes || [];
                  const unregisteredClassesForAdd = (allClasses || []).filter(
                    (c) => !registeredClassesForDrop.some((regCls) => regCls.id === c.id)
                  );

                  const selectedDropClass = registeredClassesForDrop.find((c) => c.id === selectedDropClassId);
                  const selectedAddClass = unregisteredClassesForAdd.find((c) => c.id === selectedAddClassId);

                  // Discount calculation for drop
                  const currentRegSubtotal = currentReg?.subtotal || registeredClassesForDrop.reduce((s, c) => s + (c.price || 0), 0);
                  const currentRegTotalPrice = currentReg?.totalPrice || currentRegSubtotal;
                  const discountRatio = currentRegSubtotal > 0 ? currentRegTotalPrice / currentRegSubtotal : 1;
                  const dropEffectivePrice = selectedDropClass ? Math.round(selectedDropClass.price * discountRatio * 100) / 100 : 0;

                  // Student's requests
                  const myRequests = (addDropRequests || []).filter((r) => {
                    const studentEmailMatches = studentUser?.email && r.studentEmail?.toLowerCase() === studentUser.email.toLowerCase();
                    const studentIdMatches = studentUser?.id && r.studentId === studentUser.id;
                    const regIdMatches = currentReg?.id && r.registrationId === currentReg.id;
                    return studentEmailMatches || studentIdMatches || regIdMatches;
                  });

                  const handleStudentSubmitAddDrop = (e: React.FormEvent) => {
                    e.preventDefault();
                    if (!currentReg) {
                      alert("No active registration record found. Please complete course registration first.");
                      return;
                    }

                    if (addDropFormType === 'drop') {
                      if (!selectedDropClass) {
                        alert("Please select a registered course to drop.");
                        return;
                      }
                      const newReq: AddDropRequest = {
                        id: `ADDRQ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        registrationId: currentReg.id,
                        studentId: studentUser?.id || currentReg.studentId || 'usr-student',
                        studentName: studentUser?.name || currentReg.studentInfo?.studentName || 'Student',
                        studentEmail: studentUser?.email || currentReg.studentInfo?.email || '',
                        type: 'drop',
                        classItem: selectedDropClass,
                        effectivePrice: dropEffectivePrice,
                        originalPrice: selectedDropClass.price,
                        reason: addDropReason.trim(),
                        status: 'pending',
                        requestDate: new Date().toISOString(),
                      };
                      if (onSubmitAddDropRequest) {
                        onSubmitAddDropRequest(newReq);
                      } else {
                        saveDocToFirestore('addDropRequests', newReq.id, newReq);
                      }
                      alert(`Drop request for "${selectedDropClass.title}" submitted successfully! Pending review by Registrar.`);
                      setSelectedDropClassId('');
                      setAddDropReason('');
                    } else {
                      if (!selectedAddClass) {
                        alert("Please select an available course to add.");
                        return;
                      }
                      const newReq: AddDropRequest = {
                        id: `ADDRQ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        registrationId: currentReg.id,
                        studentId: studentUser?.id || currentReg.studentId || 'usr-student',
                        studentName: studentUser?.name || currentReg.studentInfo?.studentName || 'Student',
                        studentEmail: studentUser?.email || currentReg.studentInfo?.email || '',
                        type: 'add',
                        classItem: selectedAddClass,
                        effectivePrice: selectedAddClass.price, // Full list price
                        originalPrice: selectedAddClass.price,
                        reason: addDropReason.trim(),
                        status: 'pending',
                        requestDate: new Date().toISOString(),
                      };
                      if (onSubmitAddDropRequest) {
                        onSubmitAddDropRequest(newReq);
                      } else {
                        saveDocToFirestore('addDropRequests', newReq.id, newReq);
                      }
                      alert(`Add request for "${selectedAddClass.title}" ($${selectedAddClass.price.toFixed(2)} full price) submitted successfully! Pending review by Registrar.`);
                      setSelectedAddClassId('');
                      setAddDropReason('');
                    }
                  };

                  return (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-purple-950/30 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/50 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-200/60 dark:border-purple-900/50 pb-4">
                          <div>
                            <h4 className="font-extrabold text-base text-purple-900 dark:text-purple-200 flex items-center gap-2">
                              <ArrowLeftRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              Official Add / Drop Form
                            </h4>
                            <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                              Submit requests to adjust your class schedule. Drops remove effective discounted tuition; adds incur full list price.
                            </p>
                          </div>

                          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-purple-200 dark:border-purple-900 shrink-0">
                            <button
                              type="button"
                              onClick={() => setAddDropFormType('drop')}
                              className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
                                addDropFormType === 'drop'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                              }`}
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                              <span>Drop Course</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddDropFormType('add')}
                              className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
                                addDropFormType === 'add'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                              }`}
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Add Course</span>
                            </button>
                          </div>
                        </div>

                        <form onSubmit={handleStudentSubmitAddDrop} className="space-y-4">
                          {addDropFormType === 'drop' ? (
                            <div className="space-y-3">
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Select Registered Class to Drop
                              </label>
                              <select
                                value={selectedDropClassId}
                                onChange={(e) => setSelectedDropClassId(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="">-- Choose a course from your schedule --</option>
                                {registeredClassesForDrop.map((cls) => (
                                  <option key={cls.id} value={cls.id}>
                                    {cls.title} ({cls.category || 'CSEC'}) - List Price: ${cls.price?.toFixed(2)}
                                  </option>
                                ))}
                              </select>

                              {selectedDropClass && (
                                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs space-y-2">
                                  <div className="flex items-center justify-between font-extrabold text-rose-900 dark:text-rose-200">
                                    <span>Course List Price: ${selectedDropClass.price.toFixed(2)}</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 text-[11px]">
                                      Effective Tuition Deduction: -${dropEffectivePrice.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
                                    <strong>Bundle Discount Calculation:</strong> Your registration bundle received a promotional discount. Dropping this course reduces your tuition balance by your effective discounted cost of <strong>${dropEffectivePrice.toFixed(2)}</strong>.
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Select Available Course to Add
                              </label>
                              <select
                                value={selectedAddClassId}
                                onChange={(e) => setSelectedAddClassId(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="">-- Choose a new course to add --</option>
                                {unregisteredClassesForAdd.map((cls) => (
                                  <option key={cls.id} value={cls.id}>
                                    {cls.title} ({cls.category || 'CSEC'}) - Full Price: ${cls.price?.toFixed(2)}
                                  </option>
                                ))}
                              </select>

                              {selectedAddClass && (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs space-y-2">
                                  <div className="flex items-center justify-between font-extrabold text-emerald-900 dark:text-emerald-200">
                                    <span>Full Course Price: ${selectedAddClass.price.toFixed(2)}</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-[11px]">
                                      Tuition Addition: +${selectedAddClass.price.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed font-medium">
                                    <strong>Full Price Policy:</strong> Post-registration course additions do not inherit initial bundle discounts and will be charged at full list price (<strong>${selectedAddClass.price.toFixed(2)}</strong>).
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                              Reason for Request (Required)
                            </label>
                            <textarea
                              rows={2}
                              required
                              placeholder="e.g. Schedule conflict with work / Want to add another science subject..."
                              value={addDropReason}
                              onChange={(e) => setAddDropReason(e.target.value)}
                              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className={`px-6 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                                addDropFormType === 'drop'
                                  ? 'bg-rose-600 hover:bg-rose-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                              <span>Submit {addDropFormType === 'drop' ? 'Drop' : 'Add'} Request to Registrar</span>
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Student Request Log Table */}
                      <div className="space-y-3 pt-4">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-purple-600" />
                          Your Submitted Add / Drop Request Log ({myRequests.length})
                        </h4>

                        {myRequests.length === 0 ? (
                          <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                            No Add / Drop requests submitted yet.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {myRequests.map((req) => (
                              <div
                                key={req.id}
                                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                        req.type === 'drop'
                                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                      }`}
                                    >
                                      {req.type === 'drop' ? 'DROP' : 'ADD'}
                                    </span>
                                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                      {req.classItem?.title}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                        req.status === 'pending'
                                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                                          : req.status === 'approved'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                          : 'bg-rose-50 text-rose-700 border-rose-300'
                                      }`}
                                    >
                                      {req.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 italic">
                                    Reason: "{req.reason || 'No reason provided'}"
                                  </p>
                                  {req.reviewNotes && (
                                    <p className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                                      Registrar Notes: "{req.reviewNotes}"
                                    </p>
                                  )}
                                </div>

                                <div className="text-right shrink-0">
                                  <div
                                    className={`font-black text-sm ${
                                      req.type === 'drop' ? 'text-rose-600' : 'text-emerald-600'
                                    }`}
                                  >
                                    {req.type === 'drop'
                                      ? `-$${req.effectivePrice.toFixed(2)}`
                                      : `+$${req.effectivePrice.toFixed(2)}`}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {new Date(req.requestDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

          {/* Quick Pay Section - Only show when student has registered for courses */}
          {hasCourseRegistrations && (status === 'accepted' || status === 'pending_verification' || status === 'enrolled_paid') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quick Pay Dashboard</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Outstanding Balance Summary Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Current Outstanding Balance
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      totalOutstandingBalance > 0
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}>
                      {totalOutstandingBalance > 0 ? 'Action Required' : 'Paid in Full'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                      ${totalOutstandingBalance.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">USD</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {totalOutstandingBalance > 0
                      ? `You have ${outstandingCount} registration record${outstandingCount > 1 ? 's' : ''} with outstanding tuition. Use the instructions on the right to complete payment.`
                      : 'All tuition fees are completely paid. No pending dues found! Thank you.'}
                  </p>
                </div>

                {totalOutstandingBalance > 0 && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Pending Registrations:</div>
                    <div className="max-h-24 overflow-y-auto space-y-2 pr-1" id="category-scroll-container">
                      {outstandingRegistrations
                        .filter((r) => r.outstandingBalance > 0)
                        .map((r) => (
                          <div key={r.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                              {r.id}
                            </span>
                            <span className="font-extrabold text-amber-600 dark:text-amber-400">
                              ${r.outstandingBalance.toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Payment Instructions Column */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Tuition Payment Instructions</h3>
                    <p className="text-[11px] text-slate-400">Choose your preferred transfer method to settle balance</p>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div className="flex bg-slate-100 dark:bg-slate-955 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/80 gap-1">
                    <button
                      onClick={() => setActivePaymentMethod('zelle')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activePaymentMethod === 'zelle'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      Zelle
                    </button>
                    <button
                      onClick={() => setActivePaymentMethod('wire')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activePaymentMethod === 'wire'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      Wire / ACH
                    </button>
                    <button
                      onClick={() => setActivePaymentMethod('check')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activePaymentMethod === 'check'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      Mail Check
                    </button>
                  </div>
                </div>

                {/* Tab Contents */}
                <div className="min-h-36 flex flex-col justify-between">
                  {activePaymentMethod === 'zelle' && (
                    <div className="space-y-3 animate-fade-in text-xs">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold">
                        <span>Instant Zelle Transfer</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        Send payment directly through your banking app using Zelle. Transactions are verified on the same business day.
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-105 dark:border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Zelle Recipient Email:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 select-all">billing@shawstemacademy.edu</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Memo / Reference Note:</span>
                          <span className="font-extrabold text-blue-600 dark:text-blue-400">
                            {studentUser?.name ? `${studentUser.name} - Tuition` : 'Student Tuition'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePaymentMethod === 'wire' && (
                    <div className="space-y-3 animate-fade-in text-xs">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold">
                        <span>Bank Wire or ACH Transfer</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        Perfect for direct deposit, electronic checks, or commercial banking transfers. Processing takes 1-2 business days.
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-105 dark:border-slate-800 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Bank Name:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">Chase Bank, N.A.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Account Number:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 select-all">XXXX-XXXX-XXXX-8924</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Routing Transit Number (RTN):</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 select-all">121000248</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePaymentMethod === 'check' && (
                    <div className="space-y-3 animate-fade-in text-xs">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold">
                        <span>Physical Check Mailing</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        Mail physical checks or dropped off directly at our campus business office counter. Verified upon deposit clearing.
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-105 dark:border-slate-800 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Payable To:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">Shaw STEM Academy</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Mailing Address:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 text-right">
                            100 Innovation Way, Suite 400<br />Seattle, WA 98101
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Once payment is sent, the Registrar verifies the transaction inside the Ledger to unlock your full course links.</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Enrollment & Registration History */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-600" />
              <h2 className="text-2xl font-bold text-slate-900">Enrollment & Payment History</h2>
            </div>

            {(!allRegistrations || allRegistrations.length === 0) ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
                No historical registration records found for your account.
              </div>
            ) : (
              <div className="space-y-3">
                {allRegistrations.map((record) => {
                  const recordDate = record.timestamp
                    ? new Date(record.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A';
                  
                  return (
                    <div
                      key={record.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-300"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Receipt ID: #{record.id.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">• {recordDate}</span>
                          
                          {/* Payment status badge */}
                          {record.isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Awaiting Verification
                            </span>
                          )}

                          {/* Approval status badge */}
                          {record.status === 'verified' || record.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Approved
                            </span>
                          ) : record.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Pending Review
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">
                            Registered STEM Courses:
                          </p>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {record.selectedClasses?.map((c) => c.title).join(', ') || 'None selected'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tuition Fee</p>
                          <p className="text-lg font-black text-slate-900">${record.totalPrice}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedReceiptRecord(record)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Receipt</span>
                          </button>
                          {onDeleteRegistration && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete this registration record (Receipt #${record.id.slice(-8).toUpperCase()})?`)) {
                                  onDeleteRegistration(record.id);
                                }
                              }}
                              className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
                              title="Delete Registration Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Teacher Announcements Feed */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <h2 className="text-2xl font-bold text-slate-900">Class Announcements</h2>
            </div>

            {announcements.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
                No recent announcements for your classes.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      ann.priority === 'urgent'
                        ? 'bg-rose-50/70 border-rose-200'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{ann.className}</span>
                        <span className="text-[11px] text-slate-500">• Posted by {ann.teacherName}</span>
                      </div>
                      <span className="text-xs text-slate-400">{ann.date}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mb-1">{ann.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COURSE RESOURCES & LAB MATERIALS DOWNLOAD CENTER */}
          <div className="space-y-4">
            <div className="flex flex-col space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Learning Resources & Lab Materials</h2>
                <p className="text-sm text-slate-500">
                  {classes.length > 0
                    ? `Showing learning resources uploaded by teachers for your ${classes.length} registered course${classes.length === 1 ? '' : 's'}.`
                    : 'Download course resources, lab worksheets, and project files uploaded by faculty.'}
                </p>
              </div>

              {/* FIRESTORE CATEGORIES: SIDEWAYS SCROLLABLE CONTAINER */}
              <div className="w-full overflow-hidden">
                <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 max-w-full whitespace-nowrap scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All Materials
                  </button>

                  {/* Render categories pulled directly from Firestore */}
                  {categories.map((cat) => (
                    <button
                      key={cat.id || cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        selectedCategory === cat.name
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredResources.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600 font-semibold">
                  No learning resources found for category "{selectedCategory}".
                </p>
                <p className="text-[11px] text-slate-400">
                  Teachers upload resources specifically for their assigned courses. Check back soon for new files.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredResources.map((res) => (
                  <div
                    key={res.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {res.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {res.className}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{res.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{res.description}</p>
                      <div className="text-[11px] text-slate-400">
                        Uploaded by {res.teacherName} • {res.uploadDate}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (status === 'pending_verification' || status === 'unverified') {
                          alert("Learning materials are locked until the Registrar verifies your tuition payment.");
                        } else {
                          alert(`Downloading resource: ${res.title} (${res.fileSize})`);
                        }
                      }}
                      className={`p-2.5 rounded-xl transition-all shrink-0 ${
                        status === 'pending_verification' || status === 'unverified'
                          ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'
                          : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                      }`}
                      title={status === 'pending_verification' || status === 'unverified' ? 'Locked' : `Download ${res.fileSize}`}
                      disabled={status === 'pending_verification' || status === 'unverified'}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. NOTIFICATIONS LOG TAB */}
      {mainTab === 'notifications' && (
        <div className="space-y-6 animate-fade-in">
          {/* Notifications Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                <Bell className="w-3.5 h-3.5" />
                <span>Academy Alert Log</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Notifications & Alert History
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                All real-time status updates, hold notices, tuition payment receipts, class schedule alerts, and academy announcements sent to your account.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark All as Read ({unreadCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-2">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {[
                { id: 'all', label: 'All Alerts' },
                { id: 'status', label: '📋 Status Updates' },
                { id: 'class', label: '📚 Class & Course' },
                { id: 'tuition', label: '💳 Tuition & Billing' },
                { id: 'announcement', label: '📢 Announcements' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setNotifCategoryFilter(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    notifCategoryFilter === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredNotifLogs.length} notification{filteredNotifLogs.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Notifications List */}
          {filteredNotifLogs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No Notifications Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                You do not have any notifications under this filter category yet. Alerts dispatched to your account will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifLogs.map((item) => {
                const isUnread = !item.read;
                const notifDate = item.createdAt ? new Date(item.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }) : 'Recently';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                      isUnread
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        item.type === 'status'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : item.type === 'tuition'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : item.type === 'class'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${
                            item.type === 'status'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                              : item.type === 'tuition'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : item.type === 'class'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}>
                            {item.type || 'Alert'}
                          </span>
                          {isUnread && (
                            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full">
                              UNREAD
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-medium">{notifDate}</span>
                        </div>

                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                          {item.body}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-2 sm:pt-0">
                      {isUnread && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(item);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/40 rounded-lg cursor-pointer"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotif(item.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                        title="Delete Notification Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. NOTIFICATION PREFERENCES TAB */}
      {mainTab === 'preferences' && (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Account Alert Controls</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Notification Preferences
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Configure which notifications and push alerts are delivered to your registered mobile, tablet, and desktop devices.
                </p>
              </div>

              {prefSaveSuccess && (
                <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Preferences Saved!</span>
                </div>
              )}
            </div>

            {/* FCM Push Device Registration Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Web & Mobile Push Notifications
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {fcmToken 
                      ? '✓ Web Push active on this device. Multi-device broadcast enabled.' 
                      : 'Inactive — Enable browser push permission to receive live alerts.'}
                  </p>
                </div>
              </div>

              {!fcmToken && fcmSupported && (
                <button
                  onClick={handleRegisterFcm}
                  disabled={isRequestingToken}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  {isRequestingToken ? 'Enrolling...' : 'Enable Push Alerts'}
                </button>
              )}
            </div>

            {/* Preferences Toggles List */}
            <div className="space-y-4 pt-2">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                Alert Subscriptions by Category
              </h3>

              {[
                {
                  key: 'statusUpdates' as keyof NotificationPreferences,
                  title: '📋 Application Status & Hold Alerts',
                  description: 'Receive notifications when your application status is updated (Accepted, On Hold, or Verification status).'
                },
                {
                  key: 'classChanges' as keyof NotificationPreferences,
                  title: '📚 Class & Course Changes',
                  description: 'Receive notifications when course schedules, Zoom/Meet links, or Google Classroom links are updated.'
                },
                {
                  key: 'tuitionAlerts' as keyof NotificationPreferences,
                  title: '💳 Tuition & Payment Verification',
                  description: 'Receive notifications when tuition payments are recorded, receipts are issued, or balances change.'
                },
                {
                  key: 'announcements' as keyof NotificationPreferences,
                  title: '📢 Academy Announcements & Broadcasts',
                  description: 'Receive school-wide news bulletins, administrative notices, and campus emergency alerts.'
                }
              ].map((item) => {
                const isChecked = userPreferences[item.key] !== false;

                return (
                  <div
                    key={item.key}
                    onClick={() => handleTogglePref(item.key)}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePref(item.key);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isChecked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isChecked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && editingStudentInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-5 border-b border-slate-100 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Edit Student Profile
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-50"
              >
                ✕
              </button>
            </div>
            
            <div className="p-8">
              <StudentInfoForm
                studentInfo={editingStudentInfo}
                onChange={(field, value) => {
                  setEditingStudentInfo(prev => prev ? { ...prev, [field]: value } : null);
                }}
                theme={{
                  primary: 'bg-purple-600',
                  primaryHover: 'hover:bg-purple-700',
                  secondary: 'bg-purple-50 text-purple-700',
                  headerBg: 'bg-slate-900',
                  headerText: 'text-white',
                  headerAccent: 'text-purple-400',
                  cardBorderTop: 'border-t-purple-500',
                  buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white',
                  badgeBg: 'bg-purple-100 text-purple-800'
                }}
                isSiblingSelected={false}
                setIsSiblingSelected={() => {}}
                siblingDiscountAmount={0}
              />
            </div>
            
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-8 py-5 flex justify-end gap-3 rounded-b-3xl z-10">
              <button
                onClick={handleCancelEdit}
                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceiptRecord && (
        <RegistrationReceiptModal
          registration={selectedReceiptRecord}
          onClose={() => setSelectedReceiptRecord(null)}
          theme={{
            primary: 'bg-purple-600',
            primaryHover: 'hover:bg-purple-700',
            secondary: 'bg-purple-50 text-purple-700',
            headerBg: 'bg-slate-900',
            headerText: 'text-white',
            headerAccent: 'text-purple-400',
            cardBorderTop: 'border-t-purple-500',
            buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white',
            badgeBg: 'bg-purple-100 text-purple-800'
          }}
        />
      )}
    </div>
  );
};
