import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Settings2, 
  FileOutput, 
  DollarSign, 
  Users, 
  Tag, 
  CheckCircle2, 
  Palette,
  Building2,
  Key,
  Shield,
  GraduationCap,
  UserX,
  UserCheck,
  Ban,
  RotateCcw,
  FileText,
  ShieldAlert,
  BellRing,
  Volume2,
  Play,
  Sliders,
  Music,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  X,
  Activity,
  Sparkles
} from 'lucide-react';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { 
  RegistrationRecord, 
  DiscountRule, 
  FormTheme,
  SchoolUser,
  Department,
  RolePermission,
  SystemActionLog,
  LandingPageSettings,
  UserRole,
  FaqItem,
  SchoolNewsItem,
  AcademyInfo,
  FeatureCard
} from '../../types';
import { FORM_THEMES } from '../../data/initialClasses';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminDepartmentManagement } from './AdminDepartmentManagement';
import { AdminRoleManagement } from './AdminRoleManagement';
import { CourseBankManager } from '../CourseBankManager';
import { ScheduleClashMonitor } from '../ScheduleClashMonitor';
import { AdminFaqManagement } from './AdminFaqManagement';
import { AdminNewsManagement } from './AdminNewsManagement';
import { AdminAcademyInfoManagement } from './AdminAcademyInfoManagement';
import { StudentSearchDashboard } from './StudentSearchDashboard';
import { ClassClaimForm } from './ClassClaimForm';
import { HelpCircle, Newspaper } from 'lucide-react';
import { ClassItem, SbaHubOption, ScheduleClash, ClashAdmissibility, ClassType, LocationOption, ClassClaimItem, TeacherHourlyRate } from '../../types';

interface AdminDashboardPageProps {
  registrationLogs: RegistrationRecord[];
  discountRules: DiscountRule[];
  currentTheme: FormTheme;
  systemActionLogs?: SystemActionLog[];
  landingPageSettings: LandingPageSettings;
  onUpdateLandingPageSettings: (settings: LandingPageSettings) => void;
  onSelectTheme: (theme: FormTheme) => void;
  onOpenDiscountConfig: () => void;
  onOpenGoogleExport: () => void;
  users: SchoolUser[];
  departments: Department[];
  permissions: RolePermission[];
  onAddUser: (user: SchoolUser) => void;
  onUpdateUser: (user: SchoolUser) => void;
  onDeleteUser: (userId: string) => void;
  onRoleChange: (userId: string, newRole: 'teacher' | 'admin') => void;
  onDepartmentChange: (userId: string, newDepartmentId: string) => void;
  onAddDepartment: (dept: Department) => void;
  onUpdateDepartment: (dept: Department) => void;
  onDeleteDepartment: (deptId: string) => void;
  onAssignUserToDepartment: (userId: string, deptId: string) => void;
  onTogglePermission: (permissionId: string, role: 'teacher' | 'admin') => void;
  onToggleUserDisabled?: (user: SchoolUser) => void;
  currentRole?: UserRole;
  loggedInUser?: SchoolUser | null;
  onTogglePaymentStatus?: (logId: string, isPaid: boolean) => void;
  onUpdateRegistration?: (updatedLog: RegistrationRecord) => void;
  onDeleteRegistration?: (logId: string) => void;
  classList?: ClassItem[];
  sbaHubOptions?: SbaHubOption[];
  clashes?: ScheduleClash[];
  onUpdateClassList?: (updated: ClassItem[]) => void;
  onUpdateSbaHubOptions?: (updated: SbaHubOption[]) => void;
  onUpdateClashStatus?: (clashId: string, status: ClashAdmissibility, notes?: string) => void;
  onRefreshClashes?: () => void;
  onClearAndInitFirebase?: () => Promise<boolean>;
  faqs?: FaqItem[];
  schoolNews?: SchoolNewsItem[];
  academyInfo?: AcademyInfo | null;
  featureCards?: FeatureCard[];
  classTypes?: ClassType[];
  locations?: LocationOption[];
  onSaveClassType?: (ct: ClassType) => void;
  onDeleteClassType?: (id: string) => void;
  onSaveLocation?: (loc: LocationOption) => void;
  onDeleteLocation?: (id: string) => void;
  onDeleteAllData?: () => Promise<boolean>;
  claims?: ClassClaimItem[];
  onUpdateClaims?: (updated: ClassClaimItem[]) => void;
  hourlyRates?: TeacherHourlyRate[];
  onUpdateHourlyRates?: (updated: TeacherHourlyRate[]) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  registrationLogs,
  discountRules,
  currentTheme,
  systemActionLogs = [],
  landingPageSettings,
  onUpdateLandingPageSettings,
  onSelectTheme,
  onOpenDiscountConfig,
  onOpenGoogleExport,
  users,
  departments,
  permissions,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onRoleChange,
  onDepartmentChange,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onAssignUserToDepartment,
  onTogglePermission,
  onToggleUserDisabled,
  currentRole,
  loggedInUser,
  onTogglePaymentStatus,
  onUpdateRegistration,
  onDeleteRegistration,
  classList = [],
  sbaHubOptions = [],
  clashes = [],
  onUpdateClassList,
  onUpdateSbaHubOptions,
  onUpdateClashStatus,
  onRefreshClashes,
  onClearAndInitFirebase,
  faqs = [],
  schoolNews = [],
  academyInfo = null,
  featureCards = [],
  classTypes = [],
  locations = [],
  onSaveClassType,
  onDeleteClassType,
  onSaveLocation,
  onDeleteLocation,
  onDeleteAllData,
  claims = [],
  onUpdateClaims = () => {},
  hourlyRates = [],
  onUpdateHourlyRates = () => {},
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'users' | 'disabled' | 'departments' | 'roles' | 'course_bank' | 'clashes' | 'claims' | 'news' | 'faqs' | 'academy_info' | 'activity' | 'notifications' | 'landing_page' | 'student_search'>(
    currentRole === 'hod' ? 'users' : 'overview'
  );

  // Wiping States
  const [isWiping, setIsWiping] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState(false);
  const [wipeStatus, setWipeStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Edit Registration States
  const [editingLog, setEditingLog] = useState<RegistrationRecord | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editParentEmail, setEditParentEmail] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editGradeLevel, setEditGradeLevel] = useState('');
  const [editTotalPrice, setEditTotalPrice] = useState<number>(0);

  // Registrar Tuition & Registration Filtering & Export
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterClassType, setFilterClassType] = useState('all');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Notification Test Center States
  const [notifyTitle, setNotifyTitle] = useState('Shaw STEM Academy • Fall 2026');
  const [notifyBody, setNotifyBody] = useState('Important Alert: New lab modules and class schedules have been finalized. Check your Portal.');
  const [soundPreset, setSoundPreset] = useState<'chime' | 'alert' | 'scifi' | 'success' | 'bubble' | 'custom'>('success');
  const [soundFreq, setSoundFreq] = useState<number>(880);
  const [soundWave, setSoundWave] = useState<OscillatorType>('sine');
  const [soundDuration, setSoundDuration] = useState<number>(0.45);
  const [soundVolume, setSoundVolume] = useState<number>(0.3);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  React.useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermissionState(Notification.permission);
    }
  }, [activeAdminTab]);

  const handlePresetChange = (preset: 'chime' | 'alert' | 'scifi' | 'success' | 'bubble' | 'custom') => {
    setSoundPreset(preset);
    if (preset === 'chime') {
      setSoundFreq(587.33); // D5
      setSoundWave('sine');
      setSoundDuration(0.8);
    } else if (preset === 'alert') {
      setSoundFreq(1000);
      setSoundWave('square');
      setSoundDuration(0.5);
    } else if (preset === 'scifi') {
      setSoundFreq(900);
      setSoundWave('sawtooth');
      setSoundDuration(0.8);
    } else if (preset === 'success') {
      setSoundFreq(880); // A5
      setSoundWave('sine');
      setSoundDuration(0.45);
    } else if (preset === 'bubble') {
      setSoundFreq(350);
      setSoundWave('sine');
      setSoundDuration(0.18);
    }
  };

  const playSynthesizedSound = (options: {
    frequency: number;
    duration: number;
    waveType: OscillatorType;
    volume: number;
    preset: string;
  }) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const dest = ctx.destination;

    const playTone = (freq: number, start: number, dur: number, type: OscillatorType = options.waveType) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);

      // Smooth envelope to avoid pops/clicks
      gainNode.gain.setValueAtTime(options.volume, start);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gainNode);
      gainNode.connect(dest);

      osc.start(start);
      osc.stop(start + dur);
    };

    const now = ctx.currentTime;

    if (options.preset === 'chime') {
      // Harmonic chime blend
      playTone(options.frequency, now, options.duration);
      playTone(options.frequency * 1.5, now + 0.05, options.duration * 0.8);
      playTone(options.frequency * 2.0, now + 0.1, options.duration * 0.6);
    } else if (options.preset === 'alert') {
      // Rapid pulse alert bells
      playTone(options.frequency, now, 0.15, 'square');
      playTone(options.frequency * 1.05, now + 0.2, 0.15, 'square');
    } else if (options.preset === 'scifi') {
      // Laser sweep
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(options.frequency, now);
      osc.frequency.exponentialRampToValueAtTime(options.frequency * 0.2, now + options.duration);
      
      gainNode.gain.setValueAtTime(options.volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + options.duration);
      
      osc.connect(gainNode);
      gainNode.connect(dest);
      osc.start(now);
      osc.stop(now + options.duration);
    } else if (options.preset === 'success') {
      // Positive chord progression
      playTone(options.frequency, now, 0.1);
      playTone(options.frequency * 1.25, now + 0.08, 0.15);
      playTone(options.frequency * 1.5, now + 0.16, 0.25);
    } else if (options.preset === 'bubble') {
      // Cute bubble pop
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(options.frequency, now);
      osc.frequency.exponentialRampToValueAtTime(options.frequency * 2.5, now + 0.15);
      
      gainNode.gain.setValueAtTime(options.volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(dest);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      playTone(options.frequency, now, options.duration);
    }
  };

  const handleRequestPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert("System notifications are not supported by this browser.");
      return;
    }
    const permission = await Notification.requestPermission();
    setPermissionState(permission);
    return permission;
  };

  const handleSendNotification = async () => {
    // 1. Trigger sound immediately
    try {
      playSynthesizedSound({
        frequency: soundFreq,
        duration: soundDuration,
        waveType: soundWave,
        volume: soundVolume,
        preset: soundPreset
      });
    } catch (err) {
      console.error("Synthesizer error:", err);
    }

    // 2. Launch system notification
    if (typeof Notification === 'undefined') {
      alert("Note: Custom synthesizer sound triggered! However, native OS Notifications are not supported in this browser.");
      return;
    }

    let currentPerm = Notification.permission;
    if (currentPerm === 'default') {
      currentPerm = await Notification.requestPermission();
      setPermissionState(currentPerm);
    }

    if (currentPerm === 'granted') {
      try {
        const options: NotificationOptions = {
          body: notifyBody,
          icon: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&h=128&fit=crop',
          tag: 'shaw-stem-academy-alert',
          requireInteraction: false,
        };
        const n = new Notification(notifyTitle, options);
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch (err) {
        console.error("Native notification launch failed:", err);
        alert(`Could not trigger native OS notification: ${err instanceof Error ? err.message : String(err)}. Note: Sound played successfully!`);
      }
    } else if (currentPerm === 'denied') {
      alert("Note: Customizable sound played successfully! The OS Desktop Notification was blocked because notifications are currently Denied. Please click the site padlock/settings icon in your URL bar and change notifications to 'Allow' to view the popups on your system.");
    }
  };

  // Dynamic filter logic for Date range & Class Type
  const filteredLogs = (registrationLogs || []).filter((log) => {
    // 1. Class Type Filter
    if (filterClassType !== 'all') {
      if (filterClassType === 'sba_hub' || filterClassType.toLowerCase().includes('sba')) {
        const hasSba = (log.studentInfo?.selectedSbaHubIds && log.studentInfo.selectedSbaHubIds.length > 0) || 
                       log.studentInfo?.enrolledSbaHub || 
                       log.selectedClasses?.some(c => c.classType === 'sba_hub' || c.classType?.toLowerCase().includes('sba'));
        if (!hasSba) return false;
      } else {
        const hasMatchingClass = log.selectedClasses?.some(c => 
          c.classType === filterClassType || 
          c.classType?.toLowerCase() === filterClassType.toLowerCase()
        );
        if (!hasMatchingClass) return false;
      }
    }

    // 2. Date Range Filter
    if (log.timestamp) {
      const logDate = new Date(log.timestamp);
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        start.setHours(0, 0, 0, 0);
        if (logDate < start) return false;
      }
      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }
    } else if (filterStartDate || filterEndDate) {
      // If there's no timestamp but user is filtering by date, exclude it
      return false;
    }

    return true;
  });

  const filteredRevenue = filteredLogs.reduce((sum, r) => sum + (r?.totalPrice ?? 0), 0);

  const handleExportCSV = () => {
    const headers = [
      'Registration ID',
      'Date & Time',
      'Student Name',
      'Parent Email',
      'Parent Phone',
      'Grade Level',
      'Enrolled Classes',
      'Total Subtotal ($)',
      'Discounts Applied',
      'Final Tuition ($)',
      'Payment Status'
    ];

    const rows = filteredLogs.map((log) => [
      log.id,
      log.timestamp ? new Date(log.timestamp).toLocaleString('en-US') : 'N/A',
      log.studentInfo?.studentName || 'Unknown Student',
      log.studentInfo?.parentEmail || 'N/A',
      log.studentInfo?.parentPhone || 'N/A',
      log.studentInfo?.gradeLevel || 'N/A',
      (log.selectedClasses || []).map((c) => c?.title).join('; '),
      (log.subtotal ?? 0).toFixed(2),
      (log.appliedDiscounts || []).map((d) => `${d?.name} (-$${d?.amountOff})`).join('; '),
      (log.totalPrice ?? 0).toFixed(2),
      log.isPaid ? 'Verified Paid' : 'Pending'
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Registrar_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeRulesCount = (discountRules || []).filter((r) => r && r.enabled).length;
  const totalStudentsEnrolled = (registrationLogs || []).length;
  const totalRevenueLogged = (registrationLogs || []).reduce((sum, r) => sum + (r?.totalPrice ?? 0), 0);

  const activeUsers = (users || []).filter((u) => u && u.status !== 'disabled' && u.role !== 'student');
  const disabledUsers = (users || []).filter((u) => u && u.status === 'disabled' && u.role !== 'student');

  const teacherCount = activeUsers.filter((u) => u && u.role === 'teacher').length;
  const adminCount = activeUsers.filter((u) => u && u.role === 'admin').length;

  const adminTabs = [
    {
      id: 'overview' as const,
      label: 'Registrar & Tuition Overview',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: `${totalStudentsEnrolled} Enrolled`,
    },
    {
      id: 'student_search' as const,
      label: 'Student Directory & Review',
      icon: <Users className="w-4 h-4 text-blue-400" />,
      badge: `${(users || []).filter(u => u.role === 'student').length} Students`,
    },
    {
      id: 'users' as const,
      label: 'User & Staff Management',
      icon: <Users className="w-4 h-4" />,
      badge: `${activeUsers.length} Active`,
    },
    {
      id: 'disabled' as const,
      label: 'Disabled Users Log',
      icon: <UserX className="w-4 h-4 text-rose-400" />,
      badge: `${disabledUsers.length} Disabled`,
    },
    {
      id: 'departments' as const,
      label: 'Department Management',
      icon: <Building2 className="w-4 h-4" />,
      badge: `${(departments || []).length} Depts`,
    },
    {
      id: 'course_bank' as const,
      label: 'Course Bank Manager',
      icon: <GraduationCap className="w-4 h-4 text-purple-400" />,
      badge: `${(classList || []).length} Courses`,
    },
    {
      id: 'clashes' as const,
      label: 'Schedule Clash Monitor',
      icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
      badge: `${(clashes || []).filter((c) => c && c.status === 'inadmissible').length} Errors`,
    },
    {
      id: 'roles' as const,
      label: 'Role Management & Privileges',
      icon: <Key className="w-4 h-4" />,
      badge: `${teacherCount}T • ${adminCount}A`,
    },
    {
      id: 'claims' as const,
      label: 'Teaching Claims & Payroll',
      icon: <FileText className="w-4 h-4 text-emerald-400" />,
      badge: `${(claims || []).filter((c) => c.status === 'claimed').length} Pending`,
    },
    {
      id: 'news' as const,
      label: 'Academy News & Press',

      icon: <Newspaper className="w-4 h-4 text-purple-400" />,
      badge: `${(schoolNews || []).length} News`,
    },
    {
      id: 'faqs' as const,
      label: 'FAQ Management',
      icon: <HelpCircle className="w-4 h-4 text-blue-400" />,
      badge: `${(faqs || []).length} FAQs`,
    },
    {
      id: 'academy_info' as const,
      label: 'General Info & 4 Cards',
      icon: <Building2 className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'landing_page' as const,
      label: 'Landing Page Settings',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'activity' as const,
      label: 'Activity Log',
      icon: <Activity className="w-4 h-4" />,
      badge: `${systemActionLogs.length} Events`,
    },
    {
      id: 'notifications' as const,
      label: 'Notification Center',
      icon: <BellRing className="w-4 h-4 text-amber-500 animate-pulse" />,
      badge: 'OS Test',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Admin Dashboard Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Academy Registrar & Administration Suite</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              School Administrator Dashboard
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Create teachers and administrators, manage academic departments, and configure automatic tuition discount rules.
            </p>
          </div>

          {/* Quick Action Buttons */}
          {currentRole !== 'registrar' ? (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveAdminTab('users')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span>Manage Teachers & Admins</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('departments')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Departments</span>
              </button>

              <button
                onClick={onOpenDiscountConfig}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                <Settings2 className="w-4 h-4" />
                <span>Discount Rules</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveAdminTab('departments')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>View Departments</span>
              </button>
              <button
                onClick={() => setActiveAdminTab('student_search')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span>Student Directory</span>
              </button>
              <button
                onClick={() => setActiveAdminTab('claims')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-white" />
                <span>Teaching Claims</span>
              </button>
            </div>
          )}
        </div>

        {/* Sub-navigation Tab Bar */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
          {adminTabs
            .filter((tab) => {
              if (currentRole === 'registrar') {
                return tab.id !== 'users' && tab.id !== 'disabled' && tab.id !== 'roles';
              }
              return true;
            })
            .map((tab) => {
              const isActive = activeAdminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAdminTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* 1. REGISTRAR & TUITION OVERVIEW TAB */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-8">
          {/* Academy Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{totalStudentsEnrolled}</div>
              <div className="text-xs font-semibold text-slate-500">Total Student Registrations</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">${totalRevenueLogged.toFixed(0)}</div>
              <div className="text-xs font-semibold text-slate-500">Tuition Revenue Recorded</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{activeRulesCount}</div>
              <div className="text-xs font-semibold text-slate-500">Active Discount Rules</div>
            </div>
          </div>

          {/* Quick Cards to switch to Department & Directory management */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentRole !== 'registrar' ? (
              <>
                <div
                  onClick={() => setActiveAdminTab('users')}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">User & Staff Directory</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Create new teachers and administrators, edit faculty biographies, and assign staff members to academic departments.
                  </p>
                  <div className="text-xs font-bold text-blue-600 pt-1 flex items-center gap-1">
                    <span>Manage {(users || []).length} Staff Members</span>
                    <span>→</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveAdminTab('departments')}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Academic Departments</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Organize STEM, Robotics, AI, Arts, Music, and Admin departments. Set department heads and lab locations.
                  </p>
                  <div className="text-xs font-bold text-blue-600 pt-1 flex items-center gap-1">
                    <span>Manage {(departments || []).length} Departments</span>
                    <span>→</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveAdminTab('roles')}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Key className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Role Privileges & Permissions</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Inspect permission matrix comparing Teacher and Admin capabilities across course editing, billing, and forms.
                  </p>
                  <div className="text-xs font-bold text-blue-600 pt-1 flex items-center gap-1">
                    <span>Audit Role Matrix</span>
                    <span>→</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  onClick={() => setActiveAdminTab('student_search')}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Student Directory & Review</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Inspect enrolled student profiles, review active class selections, print official registration receipts, and track student contact info.
                  </p>
                  <div className="text-xs font-bold text-blue-600 pt-1 flex items-center gap-1">
                    <span>Review Student Records</span>
                    <span>→</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveAdminTab('departments')}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Academic Departments (View Only)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    View active STEM, Robotics, AI, Arts, Music, and Admin department structures, assigned department heads, and campus lab locations.
                  </p>
                  <div className="text-xs font-bold text-blue-600 pt-1 flex items-center gap-1">
                    <span>View {(departments || []).length} Departments</span>
                    <span>→</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveAdminTab('claims')}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Teaching Claims & Payroll</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Review faculty teaching claims, verify logged class sessions, and inspect claim verification histories for payroll processing.
                  </p>
                  <div className="text-xs font-bold text-emerald-600 pt-1 flex items-center gap-1">
                    <span>Verify Payroll Claims</span>
                    <span>→</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Primary Admin Controls: Discount Rules */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Settings2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Tuition Discount Rules Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Customize automatic discount thresholds, multi-class bundle percentages (10% off for 2 classes, 15% off for 3+), and spend rewards ($25 off $300+).
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {(discountRules || []).length} Total Rules Configured
              </span>
              <button
                onClick={onOpenDiscountConfig}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                Open Discount Editor
              </button>
            </div>
          </div>

          {/* Form Theme Customizer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-slate-900">Registration Form Color Theme</h3>
            </div>
            <p className="text-xs text-slate-500">
              Select the accent color theme applied across the school's Class Registration Form.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {FORM_THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => onSelectTheme(th)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentTheme.id === th.id
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-full h-4 rounded-md ${th.headerBg} mb-2`} />
                  <div className="text-xs font-bold text-slate-900 truncate">{th.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Firebase Database Maintenance Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-lg font-bold text-white">Real-time Firebase Synchronization Active</h3>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  Your academy database is actively connected to Firebase Firestore. All classes, registrations, discount rules, news, and users are synchronized instantly in real-time.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {wipeStatus === 'success' && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-3 py-1.5 rounded-xl">
                    ✓ Database Initialized Successfully
                  </span>
                )}
                {wipeStatus === 'error' && (
                  <span className="text-xs font-bold text-rose-400 bg-rose-950/50 border border-rose-900/50 px-3 py-1.5 rounded-xl">
                    ✗ Error Initializing Database
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">Reset & Clear Demo Data</h4>
                <p className="text-slate-400 text-xs max-w-xl">
                  This action clears all existing classes, discounts, announcements, registrations, and secondary users from Firebase Firestore. Only system administrator accounts will be retained, giving you a clean slate to build your own academy data.
                </p>
              </div>

              <div className="shrink-0">
                {!wipeConfirm ? (
                  <button
                    onClick={() => {
                      setWipeConfirm(true);
                      setWipeStatus('idle');
                    }}
                    className="px-4 py-2.5 bg-rose-950/30 hover:bg-rose-900/30 border border-rose-800/40 text-rose-300 hover:text-rose-200 font-bold text-xs rounded-xl transition-all"
                  >
                    Clear Demo Data & Start Fresh
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-800/40 p-1.5 rounded-xl border border-slate-700/50">
                    <span className="text-[11px] font-extrabold text-rose-300 px-2">Are you absolutely sure? This will delete all demo records.</span>
                    <button
                      onClick={async () => {
                        if (!onClearAndInitFirebase) return;
                        setIsWiping(true);
                        try {
                          const ok = await onClearAndInitFirebase();
                          setWipeStatus(ok ? 'success' : 'error');
                        } catch (err) {
                          setWipeStatus('error');
                        } finally {
                          setIsWiping(false);
                          setWipeConfirm(false);
                        }
                      }}
                      disabled={isWiping}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-all disabled:opacity-50"
                    >
                      {isWiping ? 'Wiping...' : 'Yes, Wipe Database'}
                    </button>
                    <button
                      onClick={() => setWipeConfirm(false)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student Registration Logs Table */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Student Registration Logs</h2>
                <p className="text-sm text-slate-500">
                  Submitted student enrollments with automatic pricing calculations.
                </p>
              </div>

              {/* Action Buttons for Export */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <FileOutput className="w-4 h-4" />
                  <span>Export Excel (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export / Print PDF Report</span>
                </button>
              </div>
            </div>

            {/* Registrar Tuition Filters Control Panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Class Type Filter
                </label>
                <select
                  value={filterClassType}
                  onChange={(e) => setFilterClassType(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Class Types</option>
                  <option value="sba_hub">SBA Hub Classes</option>
                  {(() => {
                    const seenCodes = new Set<string>(['sba_hub', 'sba']);
                    return (classTypes || []).filter((ct) => {
                      const codeKey = (ct.code || ct.id || '').toLowerCase().trim();
                      const nameKey = (ct.name || '').toLowerCase().trim();
                      if (codeKey === 'sba_hub' || codeKey === 'sba' || nameKey.includes('sba hub') || nameKey === 'sba' || seenCodes.has(codeKey)) {
                        return false;
                      }
                      seenCodes.add(codeKey);
                      return true;
                    }).map((ct) => (
                      <option key={ct.id} value={ct.code || ct.id}>
                        {ct.name} ({ct.code})
                      </option>
                    ));
                  })()}
                </select>
              </div>

              <div className="flex items-end justify-between">
                <div className="text-left">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtered Totals</span>
                  <span className="text-xs font-bold text-slate-700">{filteredLogs.length} Records / ${filteredRevenue.toFixed(2)}</span>
                </div>
                {(filterStartDate || filterEndDate || filterClassType !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setFilterClassType('all');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Student & Parent</th>
                      <th className="py-3.5 px-4">Grade</th>
                      <th className="py-3.5 px-4">Enrolled Classes</th>
                      <th className="py-3.5 px-4">Discounts Applied</th>
                      <th className="py-3.5 px-4">Final Tuition</th>
                      <th className="py-3.5 px-4">Verification</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredLogs.map((log) => {
                      const studentName = log?.studentInfo?.studentName || 'Unknown Student';
                      const parentEmail = log?.studentInfo?.parentEmail || '';
                      const parentPhone = log?.studentInfo?.parentPhone || '';
                      const gradeLevel = log?.studentInfo?.gradeLevel || 'N/A';
                      const selectedClasses = log?.selectedClasses || [];
                      const appliedDiscounts = log?.appliedDiscounts || [];
                      const totalPrice = log?.totalPrice ?? 0;
                      const isPaid = log?.isPaid ?? false;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-4 font-semibold text-slate-900">
                            <div>{studentName}</div>
                            {(parentEmail || parentPhone) && (
                              <div className="text-[11px] text-slate-500 font-normal">
                                {parentEmail}{parentEmail && parentPhone ? ' • ' : ''}{parentPhone}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-slate-600">{gradeLevel}</td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-slate-900">
                              {selectedClasses.length} {selectedClasses.length === 1 ? 'class' : 'classes'}
                            </div>
                            {selectedClasses.length > 0 && (
                              <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                {selectedClasses.map((c) => c?.title || 'Unknown').join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {appliedDiscounts.length === 0 ? (
                              <span className="text-slate-400">None</span>
                            ) : (
                              <div className="space-y-0.5">
                                {appliedDiscounts.map((d, i) => (
                                  <span
                                    key={i}
                                    className="inline-block mr-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200"
                                  >
                                    -{d?.name || 'Discount'} (${d?.amountOff ?? 0})
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                            ${totalPrice.toFixed(2)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {isPaid ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Verified Paid</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3 text-amber-600" />
                                    <span>Pending</span>
                                  </>
                                )}
                              </span>
                              {onTogglePaymentStatus && (
                                <button
                                  onClick={() => onTogglePaymentStatus(log.id, !isPaid)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                    isPaid
                                      ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                                  }`}
                                  title={isPaid ? "Mark as Pending / Unpaid" : "Approve & Mark as Paid"}
                                >
                                  {isPaid ? "Unverify" : "Verify"}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingLog(log);
                                  setEditStudentName(studentName);
                                  setEditParentEmail(parentEmail);
                                  setEditParentPhone(parentPhone);
                                  setEditGradeLevel(gradeLevel);
                                  setEditTotalPrice(totalPrice);
                                }}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Student Registration"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {onDeleteRegistration && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete the registration record for ${studentName}?`)) {
                                      onDeleteRegistration(log.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Delete Registration"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DIRECTORY & REVIEW TAB */}
      {activeAdminTab === 'student_search' && (
        <StudentSearchDashboard
          users={users}
          registrationLogs={registrationLogs}
          onUpdateRegistration={onUpdateRegistration || (() => {})}
          classList={classList}
          theme={currentTheme}
          onUpdateUser={onUpdateUser}
          onDeleteUser={onDeleteUser}
        />
      )}

      {/* 2. USER & STAFF MANAGEMENT TAB */}
      {activeAdminTab === 'users' && (
        <AdminUserManagement
          users={users}
          departments={departments}
          classList={classList}
          sbaHubOptions={sbaHubOptions}
          loggedInUser={loggedInUser}
          currentRole={currentRole}
          onAddUser={onAddUser}
          onUpdateUser={onUpdateUser}
          onDeleteUser={onDeleteUser}
          onRoleChange={onRoleChange}
          onDepartmentChange={onDepartmentChange}
          onToggleUserDisabled={onToggleUserDisabled}
          onUpdateClassList={onUpdateClassList}
          logoUrl={landingPageSettings.logoUrl}
        />
      )}

      {/* 3. DEDICATED DISABLED USERS LOG TAB */}
      {activeAdminTab === 'disabled' && (
        <div className="space-y-6">
          <div className="bg-rose-900 text-white rounded-2xl p-6 border border-rose-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 text-xs font-bold border border-rose-500/30">
                <UserX className="w-3.5 h-3.5" />
                <span>Security & Admin Log</span>
              </div>
              <h2 className="text-xl font-bold">Disabled Staff Directory & Audit Log</h2>
              <p className="text-xs text-rose-200">
                Staff accounts temporarily deactivated for record keeping. All user data is retained in Firebase Firestore and can be toggled back to active instantly.
              </p>
            </div>
            <div className="bg-rose-950/80 px-4 py-3 rounded-xl border border-rose-800 text-center shrink-0">
              <div className="text-2xl font-extrabold text-white">{disabledUsers.length}</div>
              <div className="text-[11px] font-semibold text-rose-300">Disabled Accounts Logged</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Disabled User Accounts ({disabledUsers.length})</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Real-time Firestore Sync</span>
            </div>

            {disabledUsers.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-900 text-sm">No Disabled Accounts</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All registered teachers and administrators are currently active. When you disable a staff member from the User Directory, they will be archived here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {disabledUsers.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-rose-50/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-11 h-11 rounded-xl object-cover grayscale border border-rose-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{user.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold border border-rose-300">
                            Disabled
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                            {user.role.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">{user.email} • {user.title}</div>
                        <div className="text-[11px] text-rose-700 font-medium mt-0.5">
                          Department: {user.departmentName} | Deactivated: {user.disabledAt || 'Recorded in Firestore'}
                        </div>
                        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 text-xs font-semibold">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Reason: <strong className="font-bold">{user.disabledReason || 'Administrative decision'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => (onToggleUserDisabled ? onToggleUserDisabled(user) : onUpdateUser({ ...user, status: 'active' }))}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Toggle Status: Re-enable</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEACHING CLAIMS & PAYROLL VERIFICATION TAB */}
      {activeAdminTab === 'claims' && (
        <ClassClaimForm
          currentUser={loggedInUser}
          currentRole={currentRole}
          classList={classList}
          sbaHubOptions={sbaHubOptions}
          claims={claims}
          onUpdateClaims={onUpdateClaims}
          hourlyRates={hourlyRates}
          onUpdateHourlyRates={onUpdateHourlyRates}
          users={users}
        />
      )}

      {/* 3. DEPARTMENT MANAGEMENT TAB */}
      {activeAdminTab === 'departments' && (
        <AdminDepartmentManagement
          departments={departments}
          users={users}
          onAddDepartment={onAddDepartment}
          onUpdateDepartment={onUpdateDepartment}
          onDeleteDepartment={onDeleteDepartment}
          onAssignUserToDepartment={onAssignUserToDepartment}
          logoUrl={landingPageSettings.logoUrl}
          locations={locations}
          onSaveLocation={onSaveLocation}
          onDeleteLocation={onDeleteLocation}
          currentRole={currentRole}
          readOnly={currentRole === 'registrar'}
        />
      )}

      {/* 4. ROLE MANAGEMENT & PRIVILEGES TAB */}
      {activeAdminTab === 'roles' && (
        <AdminRoleManagement
          permissions={permissions}
          users={users}
          onTogglePermission={onTogglePermission}
          onRoleChange={onRoleChange}
        />
      )}

      {/* 5. LANDING PAGE SETTINGS TAB */}
      {activeAdminTab === 'landing_page' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Landing Page Configuration</span>
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">School Title</label>
                <input
                  type="text"
                  value={landingPageSettings.title}
                  onChange={(e) => onUpdateLandingPageSettings({ ...landingPageSettings, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g. Shaw STEM Academy"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={landingPageSettings.subtitle}
                  onChange={(e) => onUpdateLandingPageSettings({ ...landingPageSettings, subtitle: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g. Innovate. Explore. Lead."
                />
              </div>

              <ImageUploadInput
                label="Academy Logo Picture"
                description="Upload a high-resolution logo image directly from your computer/device or paste a web URL. This logo will appear in the top header and hero banner."
                value={landingPageSettings.logoUrl}
                onChange={(newLogo) => onUpdateLandingPageSettings({ ...landingPageSettings, logoUrl: newLogo })}
                placeholder="Upload logo from device or enter URL..."
                aspectRatio="square"
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. ACTIVITY LOG TAB */}
      {activeAdminTab === 'activity' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">System Activity Log</h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {systemActionLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium">
                No activity logs recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto">
                {systemActionLogs.map((log) => {
                  let Icon = Activity;
                  let colorClass = 'text-slate-500 bg-slate-100';
                  
                  switch (log.actionType) {
                    case 'registration':
                      Icon = UserCheck;
                      colorClass = 'text-emerald-600 bg-emerald-50';
                      break;
                    case 'user_created':
                      Icon = Users;
                      colorClass = 'text-blue-600 bg-blue-50';
                      break;
                    case 'user_updated':
                      Icon = Settings2;
                      colorClass = 'text-amber-600 bg-amber-50';
                      break;
                    case 'user_disabled':
                      Icon = Ban;
                      colorClass = 'text-rose-600 bg-rose-50';
                      break;
                    case 'role_changed':
                      Icon = Key;
                      colorClass = 'text-purple-600 bg-purple-50';
                      break;
                    case 'discount_updated':
                      Icon = Tag;
                      colorClass = 'text-indigo-600 bg-indigo-50';
                      break;
                  }

                  return (
                    <div key={log.id} className="p-4 sm:p-5 flex gap-4 hover:bg-slate-50 transition-colors">
                      <div className={`p-2 rounded-xl shrink-0 h-min ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-bold text-slate-900 text-sm">{log.description}</span>
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            {log.actionType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          Actor: {log.actor} • {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. NOTIFICATION TEST CENTER TAB */}
      {activeAdminTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-500" />
                Windows & OS Desktop Notification Test Center
              </h2>
              <p className="text-xs text-slate-500">
                Trigger rich OS-level notifications to the Windows Action Center or macOS Notification Center with custom synthesized sounds.
              </p>
            </div>

            {/* Browser Permission State Indicator */}
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600">OS Notification Access:</span>
              {permissionState === 'granted' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Granted
                </span>
              ) : permissionState === 'denied' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                  Denied (Blocked)
                </span>
              ) : (
                <button
                  onClick={handleRequestPermission}
                  className="px-3 py-1 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
                >
                  Request Permission
                </button>
              )}
            </div>
          </div>

          {/* Iframe sandbox warning alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex gap-4 items-start">
            <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-blue-900">Sandbox Security Restriction Notice</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Browsers restrict high-privilege APIs like standard OS notifications within iframe embeds. If the alert does not fire directly in this AI Studio preview tab, <strong>please click the link below to open the application in a separate full browser tab</strong>, where native OS notifications can execute without restrictions!
              </p>
              <div className="pt-2">
                <a
                  href={window.location.origin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open App in New Tab to Test Native OS Popups</span>
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Customizer Panel */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center gap-2">
                <Settings2 className="w-4.5 h-4.5 text-slate-500" />
                <h3 className="font-bold text-slate-800 text-sm">Notification Details</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Notification Header (Title):
                  </label>
                  <input
                    type="text"
                    value={notifyTitle}
                    onChange={(e) => setNotifyTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="Enter notification title..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Notification Content (Body Message):
                  </label>
                  <textarea
                    rows={3}
                    value={notifyBody}
                    onChange={(e) => setNotifyBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="Enter message body..."
                  />
                </div>
              </div>

              {/* Synthesizer & customizable Sound Options */}
              <div className="border-t border-slate-100 pt-5 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-4.5 h-4.5 text-blue-500" />
                    <h3 className="font-bold text-slate-800 text-sm">Custom Audio Synthesizer</h3>
                  </div>
                  <button
                    onClick={() => {
                      playSynthesizedSound({
                        frequency: soundFreq,
                        duration: soundDuration,
                        waveType: soundWave,
                        volume: soundVolume,
                        preset: soundPreset
                      });
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <Volume2 className="w-3 h-3 text-blue-500" />
                    <span>Test Sound Only</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Preset Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Sound Preset Pattern:
                    </label>
                    <select
                      value={soundPreset}
                      onChange={(e) => handlePresetChange(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="success">Success Ascent Chord</option>
                      <option value="chime">Triple-Harmonic Chime</option>
                      <option value="alert">Double-Pulse Alert Bell</option>
                      <option value="scifi">Sawtooth Sweep (Sci-Fi Laser)</option>
                      <option value="bubble">Piping Bubble Pop</option>
                      <option value="custom">Fully Custom Pitch</option>
                    </select>
                  </div>

                  {/* Waveform Select */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Oscillator Waveform:
                    </label>
                    <select
                      value={soundWave}
                      onChange={(e) => {
                        setSoundWave(e.target.value as OscillatorType);
                        setSoundPreset('custom');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="sine">Sine Wave (Pure Tone)</option>
                      <option value="triangle">Triangle Wave (Mellow Buzz)</option>
                      <option value="square">Square Wave (Retro 8-Bit)</option>
                      <option value="sawtooth">Sawtooth Wave (Sharp Synth)</option>
                    </select>
                  </div>
                </div>

                {/* Synthesis Adjustments */}
                <div className="space-y-4 pt-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  {/* Pitch Frequency Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Frequency (Base Pitch):
                      </span>
                      <span className="text-xs font-extrabold text-blue-600">{soundFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min={200}
                      max={2000}
                      step={10}
                      value={soundFreq}
                      onChange={(e) => {
                        setSoundFreq(Number(e.target.value));
                        setSoundPreset('custom');
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Duration Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Sustain Duration:
                      </span>
                      <span className="text-xs font-extrabold text-blue-600">{soundDuration.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={2.0}
                      step={0.05}
                      value={soundDuration}
                      onChange={(e) => {
                        setSoundDuration(Number(e.target.value));
                        setSoundPreset('custom');
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Volume Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Synthesizer Volume:
                      </span>
                      <span className="text-xs font-extrabold text-blue-600">{(soundVolume * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.01}
                      max={1.0}
                      step={0.01}
                      value={soundVolume}
                      onChange={(e) => setSoundVolume(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Windows Notification Bar Preview Card */}
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 text-white space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Windows Action Center Preview</h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  This mock layout illustrates how your desktop OS environment (such as Windows 10/11 system notifications banner) will format and render this alert:
                </p>

                {/* Actual Windows Notification Mock Card */}
                <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 p-4 space-y-3 shadow-lg flex gap-3.5 items-start">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60">
                    <img
                      src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&h=128&fit=crop"
                      alt="School Hat"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Text Content */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 text-xs truncate block">{notifyTitle || 'Notification Header'}</span>
                      <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Just now</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-2">
                      {notifyBody || 'Notification message content...'}
                    </p>
                    <div className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">
                      SHAW STEM ACADEMY • WEB APP
                    </div>
                  </div>
                </div>

                {/* Big Action trigger button */}
                <div className="pt-4">
                  <button
                    onClick={handleSendNotification}
                    className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <BellRing className="w-5 h-5 text-amber-300 animate-pulse" />
                    <span>Send OS Desktop Notification (With Sound)</span>
                  </button>
                </div>
              </div>

              {/* Informational helpful hints */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Testing Steps:</h4>
                <ol className="text-xs text-slate-600 space-y-2.5 list-decimal list-inside font-medium leading-relaxed">
                  <li>Choose your preferred <strong>sound preset</strong> (e.g. Success, Chime, Sci-Fi) or adjust the <strong>frequency sliders</strong> manually.</li>
                  <li>Click <strong>Send OS Desktop Notification</strong> above.</li>
                  <li>If prompted by your browser, choose <strong>"Allow"</strong> when asked to show notifications.</li>
                  <li>Watch the notification pop up directly in your Windows/macOS notification deck alongside the playing audio tone!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. COURSE BANK MANAGER TAB */}
      {activeAdminTab === 'course_bank' && (
        <CourseBankManager
          classList={classList}
          onUpdateClassList={(updated) => onUpdateClassList && onUpdateClassList(updated)}
          sbaHubOptions={sbaHubOptions}
          onUpdateSbaHubOptions={(updated) => onUpdateSbaHubOptions && onUpdateSbaHubOptions(updated)}
          classTypes={classTypes}
          departments={departments}
          users={users}
          locations={locations}
          onSaveClassType={onSaveClassType}
          onDeleteClassType={onDeleteClassType}
          onSaveLocation={onSaveLocation}
          onDeleteLocation={onDeleteLocation}
        />
      )}

      {/* 10. SCHEDULE CLASH MONITOR TAB */}
      {activeAdminTab === 'clashes' && (
        <ScheduleClashMonitor
          classList={classList || []}
          sbaHubOptions={sbaHubOptions || []}
          clashes={clashes || []}
          onUpdateClashStatus={(clashId, status, notes) =>
            onUpdateClashStatus && onUpdateClashStatus(clashId, status, notes)
          }
          onRefreshClashes={() => onRefreshClashes && onRefreshClashes()}
        />
      )}

      {/* 11. ACADEMY NEWS & PRESS TAB */}
      {activeAdminTab === 'news' && (
        <AdminNewsManagement
          news={schoolNews}
          departments={departments}
          loggedInUser={loggedInUser}
          currentRole={currentRole}
          logoUrl={landingPageSettings.logoUrl}
        />
      )}

      {/* 12. FAQ MANAGEMENT TAB */}
      {activeAdminTab === 'faqs' && (
        <AdminFaqManagement
          faqs={faqs}
        />
      )}

      {/* 13. GENERAL ACADEMY INFO & FEATURE CARDS TAB */}
      {activeAdminTab === 'academy_info' && (
        <AdminAcademyInfoManagement
          academyInfo={academyInfo}
          featureCards={featureCards}
        />
      )}

      {/* Edit Registration Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="space-y-1">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-blue-400" />
                  <span>Edit Registration Details</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Modify enrollment information for {editingLog.studentInfo.studentName}
                </p>
              </div>
              <button
                onClick={() => setEditingLog(null)}
                className="p-1.5 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
              {/* Student Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Student Name
                </label>
                <input
                  type="text"
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Parent Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    value={editParentEmail}
                    onChange={(e) => setEditParentEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Parent Phone
                  </label>
                  <input
                    type="tel"
                    value={editParentPhone}
                    onChange={(e) => setEditParentPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Grade Level & Tuition Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Grade Level
                  </label>
                  <select
                    value={editGradeLevel}
                    onChange={(e) => setEditGradeLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">Select Grade</option>
                    <option value="6th Grade">6th Grade</option>
                    <option value="7th Grade">7th Grade</option>
                    <option value="8th Grade">8th Grade</option>
                    <option value="9th Grade">9th Grade</option>
                    <option value="10th Grade">10th Grade</option>
                    <option value="11th Grade">11th Grade</option>
                    <option value="12th Grade">12th Grade</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Tuition Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTotalPrice}
                    onChange={(e) => setEditTotalPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Enrolled Classes list (Non-editable helper) */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Enrolled Classes ({editingLog.selectedClasses.length})
                </span>
                <div className="space-y-1 max-h-[100px] overflow-y-auto">
                  {editingLog.selectedClasses.map((cls) => (
                    <div key={cls.id} className="text-xs font-bold text-slate-700 flex justify-between items-center bg-white border border-slate-100 rounded-lg p-2">
                      <span>{cls.title}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-extrabold">{cls.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingLog(null)}
                className="px-4.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!editStudentName.trim()) {
                    alert("Student name is required.");
                    return;
                  }
                  if (onUpdateRegistration) {
                    const updated: RegistrationRecord = {
                      ...editingLog,
                      studentInfo: {
                        ...editingLog.studentInfo,
                        studentName: editStudentName,
                        parentEmail: editParentEmail,
                        parentPhone: editParentPhone,
                        gradeLevel: editGradeLevel,
                      },
                      totalPrice: editTotalPrice,
                    };
                    onUpdateRegistration(updated);
                    setEditingLog(null);
                  }
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. PRINT / PDF EXPORT PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto">
          {/* Custom scoped style for printing */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #print-report-container, #print-report-container * {
                visibility: visible !important;
              }
              #print-report-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                color: #000 !important;
                background: #fff !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Print / PDF Export Registrar Report</h3>
                  <p className="text-[11px] text-slate-500">Review printable layout before generating PDF document.</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Content Area */}
            <div className="flex-1 overflow-y-auto p-8 sm:p-10" id="print-report-container">
              {/* Report Header */}
              <div className="border-b-2 border-slate-800 pb-5 mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">SHAW STEM ACADEMY</h1>
                  <h2 className="text-sm font-bold text-slate-700 tracking-wide uppercase mt-0.5">Official Registrar & Tuition Report</h2>
                  <p className="text-[11px] text-slate-400 mt-1">Generated: {new Date().toLocaleString('en-US')}</p>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] font-extrabold text-slate-500 uppercase">Department / Section</span>
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 inline-block mt-1">
                    Finance & Tuition Board
                  </span>
                </div>
              </div>

              {/* Filter Parameters Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 grid grid-cols-3 gap-4 text-xs no-print">
                <div>
                  <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider">Date Filters</span>
                  <span className="font-semibold text-slate-700">
                    {filterStartDate ? filterStartDate : 'All History'} to {filterEndDate ? filterEndDate : 'Current Date'}
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider">Class Type Filter</span>
                  <span className="font-semibold text-slate-700 uppercase">
                    {filterClassType === 'all' ? 'All Class Types' : filterClassType === 'sba_hub' ? 'SBA Hub Classes' : filterClassType}
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider">Status Overview</span>
                  <span className="font-semibold text-slate-700">
                    {filteredLogs.length} Records / {filteredLogs.filter(l => l.isPaid).length} Verified Paid
                  </span>
                </div>
              </div>

              {/* Printable Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-[11px] font-bold text-slate-800 uppercase">
                      <th className="py-2 pr-4">Student & Parent Details</th>
                      <th className="py-2 px-3 text-center">Grade</th>
                      <th className="py-2 px-3">Enrolled Classes</th>
                      <th className="py-2 px-3">Discounts</th>
                      <th className="py-2 px-3 text-right">Tuition</th>
                      <th className="py-2 pl-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-bold">
                          No registration records match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="align-top">
                          <td className="py-3.5 pr-4 font-bold text-slate-900">
                            <div>{log.studentInfo?.studentName}</div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {log.studentInfo?.parentEmail} {log.studentInfo?.parentPhone ? `• ${log.studentInfo?.parentPhone}` : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center text-slate-600 font-semibold">{log.studentInfo?.gradeLevel || 'N/A'}</td>
                          <td className="py-3.5 px-3 text-slate-600">
                            <ul className="list-disc list-inside space-y-0.5">
                              {(log.selectedClasses || []).map((cls, i) => (
                                <li key={i} className="text-[11px] font-medium leading-tight">{cls.title}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="py-3.5 px-3">
                            {(log.appliedDiscounts || []).length === 0 ? (
                              <span className="text-slate-400 font-medium">-</span>
                            ) : (
                              <div className="space-y-0.5">
                                {(log.appliedDiscounts || []).map((d, i) => (
                                  <div key={i} className="text-[10px] text-emerald-800 font-bold">
                                    {d?.name} (-${d?.amountOff})
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right font-black text-slate-900">${(log.totalPrice ?? 0).toFixed(2)}</td>
                          <td className="py-3.5 pl-4 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              log.isPaid 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {log.isPaid ? 'PAID' : 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary Section */}
              <div className="border-t-2 border-slate-800 pt-5 mt-8 flex flex-col sm:flex-row justify-between gap-6">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Financial Disclaimers</h4>
                  <p className="text-[10px] text-slate-400 max-w-md mt-1 leading-normal">
                    This document serves as an official summary of registrations recorded by the Shaw STEM Academy. 
                    Calculations include active rule exemptions and multi-class bundles.
                  </p>
                </div>
                <div className="sm:text-right space-y-1 text-xs">
                  <div className="flex justify-between sm:justify-end gap-10 text-slate-600 font-medium">
                    <span>Total Registrations Count:</span>
                    <span className="font-bold text-slate-900">{filteredLogs.length}</span>
                  </div>
                  <div className="flex justify-between sm:justify-end gap-10 text-slate-600 font-medium">
                    <span>Paid (Verified):</span>
                    <span className="font-bold text-emerald-700">{filteredLogs.filter(l => l.isPaid).length}</span>
                  </div>
                  <div className="flex justify-between sm:justify-end gap-10 text-slate-600 font-medium">
                    <span>Pending Verified:</span>
                    <span className="font-bold text-amber-700">{filteredLogs.filter(l => !l.isPaid).length}</span>
                  </div>
                  <div className="flex justify-between sm:justify-end gap-10 text-slate-900 font-bold border-t border-slate-200 pt-1.5 text-sm">
                    <span>Total Estimated Revenue:</span>
                    <span className="font-black text-slate-950">${filteredRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 no-print">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/20 flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Print or Save to PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
