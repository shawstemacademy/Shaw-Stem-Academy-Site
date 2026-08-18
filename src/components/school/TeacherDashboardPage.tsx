import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  Users, 
  PlusCircle, 
  Bell, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Send, 
  Upload, 
  Clock, 
  Mail, 
  BookOpen,
  AlertCircle,
  Edit3,
  X,
  UserCheck,
  Building2,
  Lock,
  BarChart3,
  TrendingUp,
  Award,
  Percent,
  Filter,
  Camera,
  VideoOff,
  QrCode,
  Volume2,
  RotateCw,
  HelpCircle,
  ListChecks,
  Sparkles,
  Download,
  Search,
  UserX,
  Shield,
  Calendar,
  CalendarDays,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  XCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { WeeklyOfficeHoursSelector } from './WeeklyOfficeHoursSelector';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { FormattedText } from '../common/FormattedText';
import { downloadImage } from '../../lib/downloadHelper';
import { 
  TeacherProfile, 
  TeacherResource, 
  ClassAnnouncement, 
  ClassItem,
  SchoolUser,
  UserRole,
  SchoolNewsItem,
  Department,
  ResourceCategory,
  SbaHubOption,
  ClassClaimItem,
  TeacherHourlyRate,
  AttendanceRecord,
  RegistrationRecord,
  LocationOption,
  SectionOrderItem,
  DEFAULT_TEACHER_SECTION_ORDER,
  PortalTab
} from '../../types';
import { AdminNewsManagement } from './AdminNewsManagement';
import { HodResourceCategoryManager } from './HodResourceCategoryManager';
import { ClassClaimForm } from './ClassClaimForm';
import { MediaAttachmentViewer } from './MediaAttachmentViewer';
import { AttendanceCalendarPicker } from './AttendanceCalendarPicker';

function playAudioBeep() {
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;
    const audioCtx = new AudioCtxClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    // Ignore audio restrictions
  }
}

export function getDayNameFromDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return '';
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function getFormattedFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return '';
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

export function isClassScheduledOnDay(cls: ClassItem, dayName: string): boolean {
  if (!cls || !dayName) return false;
  const targetDay = dayName.trim().toLowerCase();
  const shortTarget = targetDay.substring(0, 3); // 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'

  if (cls.days && Array.isArray(cls.days) && cls.days.length > 0) {
    const matched = cls.days.some((d) => {
      const dLower = d.trim().toLowerCase();
      return dLower.includes(shortTarget) || dLower === targetDay;
    });
    if (matched) return true;
  }

  if (cls.schedule) {
    const sched = cls.schedule.toLowerCase();
    if (sched.includes('everyday') || sched.includes('daily')) return true;
    if (sched.includes('mon-fri') || sched.includes('mon - fri') || sched.includes('weekday') || sched.includes('weekdays')) {
      if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(targetDay)) return true;
    }
    if (sched.includes('weekend') || sched.includes('weekends') || sched.includes('sat-sun') || sched.includes('sat - sun')) {
      if (['saturday', 'sunday'].includes(targetDay)) return true;
    }

    if (targetDay === 'monday' && (sched.includes('monday') || /\bmon\b/.test(sched))) return true;
    if (targetDay === 'tuesday' && (sched.includes('tuesday') || /\btue\b|\btues\b/.test(sched))) return true;
    if (targetDay === 'wednesday' && (sched.includes('wednesday') || /\bwed\b|\bweds\b/.test(sched))) return true;
    if (targetDay === 'thursday' && (sched.includes('thursday') || /\bthu\b|\bthur\b|\bthurs\b/.test(sched))) return true;
    if (targetDay === 'friday' && (sched.includes('friday') || /\bfri\b/.test(sched))) return true;
    if (targetDay === 'saturday' && (sched.includes('saturday') || /\bsat\b/.test(sched))) return true;
    if (targetDay === 'sunday' && (sched.includes('sunday') || /\bsun\b/.test(sched))) return true;
  }

  return false;
}

interface TeacherDashboardPageProps {
  teachers: TeacherProfile[];
  classes: ClassItem[];
  resources: TeacherResource[];
  announcements: ClassAnnouncement[];
  logoUrl?: string;
  onAddAnnouncement: (announcement: ClassAnnouncement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onAddResource: (resource: TeacherResource) => void;
  onDeleteResource: (id: string) => void;
  loggedInUser?: SchoolUser | TeacherProfile | null;
  currentRole?: UserRole;
  onUpdateClassList?: (updated: ClassItem[]) => void;
  schoolNews?: SchoolNewsItem[];
  departments?: Department[];
  resourceCategories?: ResourceCategory[];
  sbaHubOptions?: SbaHubOption[];
  claims?: ClassClaimItem[];
  onUpdateClaims?: (updated: ClassClaimItem[]) => void;
  hourlyRates?: TeacherHourlyRate[];
  onUpdateHourlyRates?: (updated: TeacherHourlyRate[]) => void;
  schoolUsers?: SchoolUser[];
  onUpdateUserProfile?: (updated: SchoolUser) => void;
  onUpdateUser?: (updated: SchoolUser) => void;
  attendanceRecords?: AttendanceRecord[];
  onUpdateAttendance?: (record: AttendanceRecord) => void;
  registrationLogs?: RegistrationRecord[];
  onUpdateRegistration?: (updated: RegistrationRecord) => void;
  locations?: LocationOption[];
  teacherDashboardSections?: SectionOrderItem[];
  onNavigate?: (tab: PortalTab) => void;
}

export const TeacherDashboardPage: React.FC<TeacherDashboardPageProps> = ({
  teachers = [],
  classes = [],
  resources = [],
  announcements = [],
  logoUrl = '/logo.png',
  onAddAnnouncement,
  onDeleteAnnouncement,
  onAddResource,
  onDeleteResource,
  loggedInUser,
  currentRole = 'teacher',
  onUpdateClassList,
  schoolNews = [],
  departments = [],
  resourceCategories = [],
  sbaHubOptions = [],
  claims = [],
  onUpdateClaims = () => {},
  hourlyRates = [],
  onUpdateHourlyRates = () => {},
  schoolUsers = [],
  onUpdateUserProfile,
  onUpdateUser,
  attendanceRecords = [],
  onUpdateAttendance = (record: AttendanceRecord) => {},
  registrationLogs = [],
  onUpdateRegistration = (updated: RegistrationRecord) => {},
  locations = [],
  teacherDashboardSections = DEFAULT_TEACHER_SECTION_ORDER,
  onNavigate = (_tab: PortalTab) => {},
}) => {
  const [activeSection, setActiveSection] = useState<string>('classes');
  const [performanceClassFilter, setPerformanceClassFilter] = useState<string>('all');

  // Fallback teacher profile if the teachers collection is empty (e.g., when an admin first logs in and views the overseer dashboard)
  const fallbackTeacher: TeacherProfile = {
    id: loggedInUser?.id || 'admin-overseer',
    name: loggedInUser?.name || 'Administrator Overseer',
    title: (loggedInUser as SchoolUser)?.title || 'Academy Administrator',
    department: (loggedInUser as SchoolUser)?.departmentName || (loggedInUser as SchoolUser)?.department || 'Administration',
    email: loggedInUser?.email || 'admin@shawstemacademy.edu',
    bio: (loggedInUser as SchoolUser)?.bio || 'Academic administrator and overseer of Shaw STEM Academy faculty operations.',
    officeHours: (loggedInUser as SchoolUser)?.officeHours || 'Monday - Friday, 8:00 AM - 4:00 PM',
    avatar: loggedInUser?.avatar || logoUrl || '/logo.png',
    assignedClassIds: classes.map((c) => c.id),
  };

  // If logged in as a specific teacher user, default to their profile
  const matchedTeacher = teachers.find(
    (t) => loggedInUser && (t.id === loggedInUser.id || (t?.email || '').toLowerCase() === (loggedInUser?.email || '').toLowerCase())
  ) || (loggedInUser && (loggedInUser.role === 'teacher' || loggedInUser.role === 'hod') ? {
    id: loggedInUser.id,
    name: loggedInUser.name,
    title: loggedInUser.title || 'Instructor',
    department: loggedInUser.departmentName || loggedInUser.department || 'General',
    email: loggedInUser.email,
    bio: loggedInUser.bio || 'Faculty member.',
    officeHours: loggedInUser.officeHours || 'By Appointment',
    avatar: loggedInUser.avatar,
    assignedClassIds: loggedInUser.assignedClassIds || [],
  } : teachers[0]);

  const [activeTeacherId, setActiveTeacherId] = useState<string>(matchedTeacher?.id || teachers[0]?.id || '');

  // Keep activeTeacherId updated if teachers list loads/changes
  React.useEffect(() => {
    if (teachers.length > 0 && !activeTeacherId) {
      const matched = teachers.find(
        (t) => loggedInUser && (t.id === loggedInUser.id || (t?.email || '').toLowerCase() === (loggedInUser?.email || '').toLowerCase())
      ) || teachers[0];
      if (matched) {
        setActiveTeacherId(matched.id);
      }
    }
  }, [teachers, loggedInUser, activeTeacherId]);

  // Auto-select first enabled section if activeSection is not enabled
  React.useEffect(() => {
    const enabledSections = teacherDashboardSections.filter((s) => s.enabled !== false);
    if (enabledSections.length > 0 && !enabledSections.some((s) => s.id === activeSection)) {
      setActiveSection(enabledSections[0].id);
    }
  }, [teacherDashboardSections, activeSection]);

  const getSectionOrder = (sectionId: string): number => {
    const section = teacherDashboardSections.find((s) => s.id === sectionId);
    return section ? teacherDashboardSections.indexOf(section) : 99;
  };

  const isSectionEnabled = (sectionId: string): boolean => {
    const section = teacherDashboardSections.find((s) => s.id === sectionId);
    return section ? section.enabled !== false : true;
  };

  const getSectionTitle = (sectionId: string, defaultTitle: string): string => {
    const section = teacherDashboardSections.find((s) => s.id === sectionId);
    return section?.title || defaultTitle;
  };

  // Effective user role determination (loggedInUser role is ground truth if present)
  const effectiveRole = loggedInUser?.role || currentRole;
  const isActualAdmin = effectiveRole === 'admin';
  const isActualHod = effectiveRole === 'hod';
  const isActualTeacher = effectiveRole === 'teacher';

  // For teacher role, strictly enforce showing ONLY their own dashboard and information
  const currentTeacherRaw = isActualTeacher
    ? (teachers.find((t) => t.id === loggedInUser?.id || (t?.email || '').toLowerCase() === (loggedInUser?.email || '').toLowerCase()) || matchedTeacher)
    : (teachers.find((t) => t.id === activeTeacherId) || matchedTeacher);

  const currentTeacher = currentTeacherRaw || fallbackTeacher;

  // Assigned classes for this teacher
  const teacherClasses = classes.filter((c) => 
    (currentTeacher?.assignedClassIds || []).includes(c.id) || c.instructor === currentTeacher?.name
  );

  // Classes available for dropdowns (Admin sees all, HOD sees their dept + assigned, Teacher sees assigned)
  const formClasses = isActualAdmin 
    ? classes 
    : isActualHod
      ? classes.filter(c => {
          const deptNames = [loggedInUser?.departmentName, ...(loggedInUser?.departmentNames || [])].filter(Boolean);
          const deptIds = [loggedInUser?.departmentId, ...(loggedInUser?.departmentIds || [])].filter(Boolean);
          
          // Try to match by category name or if we have department mapping
          const isDeptMatch = deptNames.includes(c.category);
          
          return isDeptMatch || (currentTeacher?.assignedClassIds || []).includes(c.id) || c.instructor === currentTeacher?.name;
        })
      : teacherClasses;

  // Teacher Profile Editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editOfficeHours, setEditOfficeHours] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const handleOpenEditProfileModal = () => {
    setEditName(currentTeacher?.name || '');
    setEditEmail(currentTeacher?.email || '');
    setEditPhone((loggedInUser as SchoolUser)?.phone || '');
    setEditTitle(currentTeacher?.title || '');
    setEditDepartment(currentTeacher?.department || '');
    setEditBio(currentTeacher?.bio || '');
    setEditOfficeHours(currentTeacher?.officeHours || '');
    setEditAvatar(currentTeacher?.avatar || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher) return;

    const matchedUser = schoolUsers.find(
      (u) => u.id === currentTeacher.id || (u.email && u.email.toLowerCase() === (currentTeacher.email || '').toLowerCase())
    ) || (loggedInUser as SchoolUser);

    const existingDeptName = currentTeacher?.departmentName || currentTeacher?.department || matchedUser?.departmentName || matchedUser?.department || 'General Faculty';

    const updatedUser: SchoolUser = {
      ...(matchedUser || {
        id: currentTeacher.id || `teacher-${Date.now()}`,
        role: 'teacher',
        status: 'active',
      }),
      id: currentTeacher.id || matchedUser?.id || `teacher-${Date.now()}`,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      title: editTitle.trim(),
      departmentName: existingDeptName,
      department: existingDeptName,
      departmentNames: matchedUser?.departmentNames || currentTeacher?.departmentNames || [existingDeptName],
      departmentIds: matchedUser?.departmentIds || currentTeacher?.departmentIds || [],
      bio: editBio.trim(),
      officeHours: editOfficeHours.trim(),
      avatar: editAvatar.trim() || currentTeacher.avatar,
    };

    if (onUpdateUserProfile) {
      onUpdateUserProfile(updatedUser);
    } else if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    setIsEditingProfile(false);
  };

  // New announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annClassId, setAnnClassId] = useState(teacherClasses[0]?.id || 'cls-101');
  const [annPriority, setAnnPriority] = useState<'normal' | 'urgent'>('normal');
  const [annImageUrl, setAnnImageUrl] = useState('');
  const [annSuccess, setAnnSuccess] = useState(false);

  // New resource form state
  const [resTitle, setResTitle] = useState('');
  const [resCategory, setResCategory] = useState<'Lecture Notes' | 'Robotics Schematics' | 'Lab Worksheet' | 'Project Files' | 'Syllabus'>('Lecture Notes');
  const [resDesc, setResDesc] = useState('');
  const [resClassId, setResClassId] = useState(teacherClasses[0]?.id || 'cls-101');
  const [resImageUrl, setResImageUrl] = useState('');
  const [resSuccess, setResSuccess] = useState(false);

  // Automatically select the first available course in the dropdowns when formClasses change
  React.useEffect(() => {
    if (formClasses.length > 0) {
      const ids = formClasses.map(c => c.id);
      if (!annClassId || !ids.includes(annClassId) || annClassId === 'cls-101') {
        setAnnClassId(formClasses[0].id);
      }
      if (!resClassId || !ids.includes(resClassId) || resClassId === 'cls-101') {
        setResClassId(formClasses[0].id);
      }
    }
  }, [formClasses, annClassId, resClassId]);

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    const targetClass = classes.find((c) => c.id === annClassId);
    const newAnn: ClassAnnouncement = {
      id: `ann-${Date.now()}`,
      classId: annClassId,
      className: targetClass?.title || 'STEM Lab',
      teacherName: currentTeacher.name,
      title: annTitle.trim(),
      content: annContent.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      priority: annPriority,
      imageUrl: annImageUrl.trim() || undefined,
    };

    onAddAnnouncement(newAnn);
    setAnnTitle('');
    setAnnContent('');
    setAnnImageUrl('');
    setAnnSuccess(true);
    setTimeout(() => setAnnSuccess(false), 4000);
  };

  const handlePublishResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resDesc.trim()) return;

    const targetClass = classes.find((c) => c.id === resClassId);
    const newRes: TeacherResource = {
      id: `res-${Date.now()}`,
      title: resTitle.trim(),
      classId: resClassId,
      className: targetClass?.title || 'STEM Lab',
      category: resCategory,
      fileUrl: resImageUrl.trim() || 'https://shawstemacademy.edu/materials/demo',
      uploadDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      description: resDesc.trim(),
      fileSize: resImageUrl ? 'Image / Schematic' : '1.5 MB Resource',
      teacherName: currentTeacher.name,
      imageUrl: resImageUrl.trim() || undefined,
    };

    onAddResource(newRes);
    setResTitle('');
    setResDesc('');
    setResImageUrl('');
    setResSuccess(true);
    setTimeout(() => setResSuccess(false), 4000);
  };

  // State for editing class Google Classroom links
  const [editingGcClassId, setEditingGcClassId] = useState<string | null>(null);
  const [managingAcademicsClassId, setManagingAcademicsClassId] = useState<string | null>(null);
  const [academicManageTab, setAcademicManageTab] = useState<'attendance' | 'grades'>('attendance');
  
  // Attendance QR Code Scanner States & Refs
  const [isScanningQr, setIsScanningQr] = useState<boolean>(false);
  const [showScannerTooltip, setShowScannerTooltip] = useState<boolean>(true);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [scanFeedbackType, setScanFeedbackType] = useState<'success' | 'error' | null>(null);
  const scanVideoRef = useRef<HTMLVideoElement | null>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let animationFrameId: number | null = null;
    let isLocked = false;

    // Strict access control: Only users authorized to access Teacher Dashboard can be prompted for or granted camera access
    const hasTeacherAccess = currentRole === 'teacher' || currentRole === 'hod' || currentRole === 'admin';

    if (!isScanningQr || !hasTeacherAccess) {
      return;
    }

    const startCamera = async () => {
      try {
        setScanFeedback("Accessing camera...");
        setScanFeedbackType(null);
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is not supported in this browser environment.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        
        activeStream = stream;
        
        if (scanVideoRef.current) {
          scanVideoRef.current.srcObject = stream;
          scanVideoRef.current.setAttribute("playsinline", "true");
          scanVideoRef.current.play();
        }
        
        animationFrameId = requestAnimationFrame(tick);
        setScanFeedback("Camera active. Align Student QR Code inside the scan box.");
        setScanFeedbackType('success');
      } catch (err: any) {
        console.error("Camera access failed", err);
        setScanFeedback(`Camera access failed: ${err.message || 'Check browser permissions.'}`);
        setScanFeedbackType('error');
        setIsScanningQr(false);
      }
    };

    const playBeep = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        console.warn("Audio Context beep failed", e);
      }
    };

    const tick = () => {
      if (!scanVideoRef.current || !scanCanvasRef.current || isLocked) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      const video = scanVideoRef.current;
      const canvas = scanCanvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 4;
        ctx.strokeRect(canvas.width * 0.15, canvas.height * 0.15, canvas.width * 0.7, canvas.height * 0.7);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          const scannedStudentId = code.data.trim();
          const activeClass = classes.find(c => c.id === managingAcademicsClassId);
          
          if (activeClass) {
            const classEnrolled = registrationLogs.filter(log => log.verifiedClassIds?.includes(activeClass.id) && log.status === 'enrolled_paid');
            const studentMatch = classEnrolled.find(s => s.studentInfo?.id === scannedStudentId || s.id === scannedStudentId);
            
            if (studentMatch) {
              const studentName = studentMatch.studentInfo?.studentName || studentMatch.studentInfo?.firstName || 'Student';
              const attId = `att-${activeClass.id}-${new Date().toISOString().split('T')[0]}-${studentMatch.studentInfo?.id || studentMatch.id}`;
              const alreadyMarked = attendanceRecords?.some(a => a.id === attId);
              
              if (alreadyMarked) {
                setScanFeedback(`${studentName} is ALREADY marked present!`);
                setScanFeedbackType('success');
                playBeep();
                
                isLocked = true;
                setTimeout(() => {
                  isLocked = false;
                  setScanFeedback("Camera active. Align Student QR Code inside the scan box.");
                }, 2000);
              } else {
                playBeep();
                
                onUpdateAttendance({
                  id: attId,
                  classId: activeClass.id,
                  className: activeClass.title,
                  date: new Date().toISOString().split('T')[0],
                  studentId: studentMatch.studentInfo?.id || studentMatch.id,
                  studentName: studentName,
                  status: 'present',
                  timestamp: new Date().toISOString()
                });

                setScanFeedback(`SUCCESS! Marked ${studentName} as PRESENT!`);
                setScanFeedbackType('success');

                isLocked = true;
                setTimeout(() => {
                  isLocked = false;
                  setScanFeedback("Camera active. Align Student QR Code inside the scan box.");
                }, 2500);
              }
            } else {
              setScanFeedback("Error: Student is not registered/enrolled in this specific class!");
              setScanFeedbackType('error');
              
              isLocked = true;
              setTimeout(() => {
                isLocked = false;
                setScanFeedback("Camera active. Align Student QR Code inside the scan box.");
              }, 2000);
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (isScanningQr && managingAcademicsClassId) {
      startCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      }
      if (scanVideoRef.current) {
        scanVideoRef.current.srcObject = null;
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isScanningQr, managingAcademicsClassId, classes, registrationLogs, attendanceRecords]);

  // Dedicated Global QR Scanner States & Refs for the Modal
  const [isGlobalScannerOpen, setIsGlobalScannerOpen] = useState<boolean>(false);
  const [globalScannerViewMode, setGlobalScannerViewMode] = useState<'camera' | 'name_register'>('camera');
  const [nameSearchQuery, setNameSearchQuery] = useState<string>('');
  const [nameStatusFilter, setNameStatusFilter] = useState<'all' | 'unmarked' | 'present' | 'late' | 'absent' | 'excused'>('all');
  const [globalScanFeedback, setGlobalScanFeedback] = useState<string | null>(null);
  const [globalScanFeedbackType, setGlobalScanFeedbackType] = useState<'success' | 'error' | null>(null);
  const [globalScanClassId, setGlobalScanClassId] = useState<string>('');
  const [recentScans, setRecentScans] = useState<Array<{ id: string; studentName: string; className: string; timestamp: string }>>([]);
  const [showQuickStart, setShowQuickStart] = useState<boolean>(false);
  const [scannerRestartKey, setScannerRestartKey] = useState<number>(0);
  const globalScanVideoRef = useRef<HTMLVideoElement | null>(null);
  const globalScanCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calendar & Day Selection States for Attendance Marking
  const [attendanceDate, setAttendanceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState<boolean>(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(() => new Date());

  // Academics Panel Attendance Date & Calendar State
  const [academicsAttendanceDate, setAcademicsAttendanceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isAcademicsCalendarOpen, setIsAcademicsCalendarOpen] = useState<boolean>(false);

  // Day of week for selected attendance date
  const selectedDayName = React.useMemo(() => getDayNameFromDate(attendanceDate), [attendanceDate]);

  // Filter classes scheduled for the selected calendar day
  const scheduledClassesOnSelectedDate = React.useMemo(() => {
    return formClasses.filter((c) => isClassScheduledOnDay(c, selectedDayName));
  }, [formClasses, selectedDayName]);

  // When attendanceDate changes, auto-select first scheduled class if current selected class doesn't match this day
  useEffect(() => {
    if (scheduledClassesOnSelectedDate.length > 0) {
      const isCurrentInScheduled = scheduledClassesOnSelectedDate.some((c) => c.id === globalScanClassId);
      if (!isCurrentInScheduled) {
        setGlobalScanClassId(scheduledClassesOnSelectedDate[0].id);
      }
    }
  }, [attendanceDate, scheduledClassesOnSelectedDate]);

  // Compute active current students enrolled in the class being marked (excluding archived/completed)
  const activeCurrentStudentsInScanClass = React.useMemo(() => {
    if (!globalScanClassId) return [];
    const targetClass = classes.find((c) => c.id === globalScanClassId);
    if (!targetClass) return [];

    const studentsMap = new Map<string, {
      id: string;
      studentId: string;
      studentName: string;
      studentEmail: string;
      status: 'present' | 'late' | 'absent' | 'excused' | 'unmarked';
      timestamp?: string;
    }>();

    registrationLogs.forEach((log) => {
      // Exclude students who completed / archived this class
      if (log.completedClassIds && log.completedClassIds.includes(globalScanClassId)) {
        return;
      }

      const isVerified = Boolean(log.verifiedClassIds && log.verifiedClassIds.includes(globalScanClassId));
      const isSelected = Boolean(
        log.selectedClasses?.some((c) => c.id === globalScanClassId) ||
        log.selectedClassIds?.includes(globalScanClassId) ||
        log.studentInfo?.selectedSbaHubIds?.includes(globalScanClassId)
      );
      const isPaidOrVerified = Boolean(
        log.isPaid || 
        log.status === 'enrolled_paid' || 
        log.status === 'completed' ||
        (log.payments && log.payments.length > 0)
      );

      if (isVerified || (isSelected && isPaidOrVerified)) {
        const studentId = log.studentInfo?.id || log.studentId || log.userId || log.id;
        const studentName = log.studentInfo?.studentName || `${log.studentInfo?.firstName || ''} ${log.studentInfo?.lastName || ''}`.trim() || 'Student';
        const studentEmail = log.studentInfo?.email || log.studentInfo?.parentEmail || '';
        const attId = `att-${globalScanClassId}-${attendanceDate}-${studentId}`;
        const attRec = attendanceRecords?.find(
          (a) => a.id === attId || (a.classId === globalScanClassId && a.date === attendanceDate && (a.studentId === studentId || a.studentName.toLowerCase() === studentName.toLowerCase()))
        );

        const key = studentId.toLowerCase();
        if (!studentsMap.has(key)) {
          studentsMap.set(key, {
            id: log.id,
            studentId,
            studentName,
            studentEmail,
            status: attRec ? attRec.status : 'unmarked',
            timestamp: attRec?.timestamp,
          });
        }
      }
    });

    // Also check schoolUsers
    schoolUsers.forEach((u) => {
      if (u.role === 'student' && u.status !== 'disabled') {
        if (u.completedClassIds && u.completedClassIds.includes(globalScanClassId)) {
          return;
        }
        if (u.registeredClassIds && u.registeredClassIds.includes(globalScanClassId)) {
          const studentId = u.id;
          const studentName = u.name || 'Student';
          const studentEmail = u.email;
          const attId = `att-${globalScanClassId}-${attendanceDate}-${studentId}`;
          const attRec = attendanceRecords?.find(
            (a) => a.id === attId || (a.classId === globalScanClassId && a.date === attendanceDate && (a.studentId === studentId || a.studentName.toLowerCase() === studentName.toLowerCase()))
          );

          const key = studentId.toLowerCase();
          if (!studentsMap.has(key)) {
            studentsMap.set(key, {
              id: u.id,
              studentId,
              studentName,
              studentEmail,
              status: attRec ? attRec.status : 'unmarked',
              timestamp: attRec?.timestamp,
            });
          }
        }
      }
    });

    return Array.from(studentsMap.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [globalScanClassId, attendanceDate, classes, registrationLogs, schoolUsers, attendanceRecords]);

  // Handler to mark attendance by clicking a student's status
  const handleMarkStudentByName = (
    studentId: string,
    studentName: string,
    status: 'present' | 'late' | 'absent' | 'excused'
  ) => {
    const targetClass = classes.find((c) => c.id === globalScanClassId);
    if (!targetClass) return;

    const attId = `att-${targetClass.id}-${attendanceDate}-${studentId}`;
    const timestamp = new Date().toISOString();

    playAudioBeep();

    onUpdateAttendance({
      id: attId,
      classId: targetClass.id,
      className: targetClass.title,
      date: attendanceDate,
      studentId: studentId,
      studentName: studentName,
      status: status,
      timestamp: timestamp,
    });

    // Track in Recent Scans session list
    setRecentScans((prev) => [
      {
        id: attId,
        studentName,
        className: targetClass.title,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      },
      ...prev.filter((s) => s.id !== attId)
    ].slice(0, 5));

    setGlobalScanFeedback(`Marked ${studentName} as ${status.toUpperCase()} in ${targetClass.title} (${getFormattedFullDate(attendanceDate)})!`);
    setGlobalScanFeedbackType('success');
  };

  // Handler to mark all unmarked students as Present
  const handleMarkAllUnmarkedPresent = () => {
    const targetClass = classes.find((c) => c.id === globalScanClassId);
    if (!targetClass) return;

    const unmarked = activeCurrentStudentsInScanClass.filter((s) => s.status === 'unmarked');
    if (unmarked.length === 0) {
      alert(`All current students in this class already have attendance marked for ${getFormattedFullDate(attendanceDate)}!`);
      return;
    }

    const timestamp = new Date().toISOString();

    playAudioBeep();

    unmarked.forEach((st) => {
      const attId = `att-${targetClass.id}-${attendanceDate}-${st.studentId}`;
      onUpdateAttendance({
        id: attId,
        classId: targetClass.id,
        className: targetClass.title,
        date: attendanceDate,
        studentId: st.studentId,
        studentName: st.studentName,
        status: 'present',
        timestamp: timestamp,
      });
    });

    setGlobalScanFeedback(`Successfully marked ${unmarked.length} student(s) as PRESENT for ${getFormattedFullDate(attendanceDate)}!`);
    setGlobalScanFeedbackType('success');
  };

  const handleRetryScan = () => {
    setGlobalScanFeedback("Retrying scan... Align student QR code in the frame.");
    setGlobalScanFeedbackType(null);
    setScannerRestartKey((prev) => prev + 1);
  };

  // Set default class ID when formClasses are loaded or active
  useEffect(() => {
    if (formClasses.length > 0) {
      const ids = formClasses.map((c) => c.id);
      if (!globalScanClassId || !ids.includes(globalScanClassId)) {
        if (scheduledClassesOnSelectedDate.length > 0) {
          setGlobalScanClassId(scheduledClassesOnSelectedDate[0].id);
        } else {
          setGlobalScanClassId(formClasses[0].id);
        }
      }
    } else {
      setGlobalScanClassId('');
    }
  }, [formClasses, globalScanClassId, scheduledClassesOnSelectedDate]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let animationFrameId: number | null = null;
    let isLocked = false;

    // Strict access control: Only users authorized to access Teacher Dashboard can be prompted for or granted camera access
    const hasTeacherAccess = currentRole === 'teacher' || currentRole === 'hod' || currentRole === 'admin';

    if (!isGlobalScannerOpen || !hasTeacherAccess) {
      return;
    }

    const startCamera = async () => {
      try {
        setGlobalScanFeedback("Accessing camera...");
        setGlobalScanFeedbackType(null);
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is not supported in this browser environment.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        
        activeStream = stream;
        
        if (globalScanVideoRef.current) {
          globalScanVideoRef.current.srcObject = stream;
          globalScanVideoRef.current.setAttribute("playsinline", "true");
          globalScanVideoRef.current.play();
        }
        
        animationFrameId = requestAnimationFrame(tick);
        setGlobalScanFeedback("Camera active. Align Student QR Pass inside the box.");
        setGlobalScanFeedbackType('success');
      } catch (err: any) {
        console.error("Global camera access failed", err);
        setGlobalScanFeedback(`Camera access failed: ${err.message || 'Check browser permissions.'}`);
        setGlobalScanFeedbackType('error');
      }
    };

    const playBeep = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        console.warn("Audio Context beep failed", e);
      }
    };

    const tick = () => {
      if (!globalScanVideoRef.current || !globalScanCanvasRef.current || isLocked) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      const video = globalScanVideoRef.current;
      const canvas = globalScanCanvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#10b981'; // Emerald frame for global scanner
        ctx.lineWidth = 4;
        ctx.strokeRect(canvas.width * 0.15, canvas.height * 0.15, canvas.width * 0.7, canvas.height * 0.7);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          const scannedStudentId = code.data.trim();
          const targetClass = classes.find(c => c.id === globalScanClassId);
          
          if (targetClass) {
            const classEnrolled = registrationLogs.filter(log => log.verifiedClassIds?.includes(targetClass.id) && log.status === 'enrolled_paid');
            const studentMatch = classEnrolled.find(s => s.studentInfo?.id === scannedStudentId || s.id === scannedStudentId);
            
            if (studentMatch) {
              const studentName = studentMatch.studentInfo?.studentName || studentMatch.studentInfo?.firstName || 'Student';
              const attId = `att-${targetClass.id}-${attendanceDate}-${studentMatch.studentInfo?.id || studentMatch.id}`;
              const alreadyMarked = attendanceRecords?.some(a => a.id === attId || (a.classId === targetClass.id && a.date === attendanceDate && a.studentId === (studentMatch.studentInfo?.id || studentMatch.id)));
              
              if (alreadyMarked) {
                setGlobalScanFeedback(`${studentName} is ALREADY marked present for ${getFormattedFullDate(attendanceDate)}!`);
                setGlobalScanFeedbackType('success');
                playBeep();
                
                isLocked = true;
                setTimeout(() => {
                  isLocked = false;
                  setGlobalScanFeedback("Camera active. Align Student QR Pass inside the box.");
                }, 2000);
              } else {
                playBeep();
                
                onUpdateAttendance({
                  id: attId,
                  classId: targetClass.id,
                  className: targetClass.title,
                  date: attendanceDate,
                  studentId: studentMatch.studentInfo?.id || studentMatch.id,
                  studentName: studentName,
                  status: 'present',
                  timestamp: new Date().toISOString()
                });

                // Track in Recent Scans session list
                setRecentScans(prev => [
                  {
                    id: attId,
                    studentName,
                    className: targetClass.title,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  },
                  ...prev.filter(s => s.id !== attId)
                ].slice(0, 5));

                setGlobalScanFeedback(`SUCCESS! Marked ${studentName} as PRESENT in ${targetClass.title} (${getFormattedFullDate(attendanceDate)})!`);
                setGlobalScanFeedbackType('success');

                isLocked = true;
                setTimeout(() => {
                  isLocked = false;
                  setGlobalScanFeedback("Camera active. Align Student QR Pass inside the box.");
                }, 2500);
              }
            } else {
              setGlobalScanFeedback("Error: Student is not registered/enrolled in this specific class!");
              setGlobalScanFeedbackType('error');
              
              isLocked = true;
              setTimeout(() => {
                isLocked = false;
                setGlobalScanFeedback("Camera active. Align Student QR Pass inside the box.");
              }, 2000);
            }
          } else {
            setGlobalScanFeedback("Error: Please select a valid course first!");
            setGlobalScanFeedbackType('error');
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (isGlobalScannerOpen && globalScanClassId) {
      startCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      }
      if (globalScanVideoRef.current) {
        globalScanVideoRef.current.srcObject = null;
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isGlobalScannerOpen, globalScanClassId, attendanceDate, classes, registrationLogs, attendanceRecords, scannerRestartKey]);

  // Safety cleanup: Automatically close camera scanners if section tab changes or window loses focus
  useEffect(() => {
    if (activeSection !== 'classes') {
      if (isScanningQr) setIsScanningQr(false);
    }
  }, [activeSection, isScanningQr]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isScanningQr) setIsScanningQr(false);
        if (isGlobalScannerOpen) setIsGlobalScannerOpen(false);
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isScanningQr, isGlobalScannerOpen]);
  
  const [editGcUrl, setEditGcUrl] = useState<string>('');
  const [editMeetUrl, setEditMeetUrl] = useState<string>('');

  const handleStartEditGc = (cls: ClassItem) => {
    setEditingGcClassId(cls.id);
    setEditGcUrl(cls.googleClassroomUrl || `https://classroom.google.com/c/${cls.id}`);
    setEditMeetUrl(cls.googleMeetUrl || `https://meet.google.com/shaw-${cls.id}`);
  };

  const handleSaveGcLink = (classId: string) => {
    if (!onUpdateClassList) return;
    const updated = classes.map((c) =>
      c.id === classId
        ? {
            ...c,
            googleClassroomUrl: editGcUrl.trim(),
            googleMeetUrl: editMeetUrl.trim(),
          }
        : c
    );
    onUpdateClassList(updated);
    setEditingGcClassId(null);
  };

  // Filter resources & announcements by current teacher
  const teacherAnnouncements = announcements.filter((a) => a.teacherName === currentTeacher?.name);
  const teacherResources = resources.filter((r) => r.teacherName === currentTeacher?.name);

  // Match currentTeacher to their schoolUser to get multiple department names
  const matchedUserObj = schoolUsers.find(
    (u) => currentTeacher && (u.id === currentTeacher.id || (u.email && u.email.toLowerCase() === (currentTeacher.email || '').toLowerCase()))
  );
  
  // Resolve multiple department names
  const teacherDepartmentNames = matchedUserObj?.departmentNames && matchedUserObj.departmentNames.length > 0
    ? matchedUserObj.departmentNames
    : matchedUserObj?.departmentName
      ? [matchedUserObj.departmentName]
      : currentTeacher?.department
        ? [currentTeacher.department]
        : [];

  return (
    <div className="space-y-10 pb-16">
      {/* Teacher Profile & Selector Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={currentTeacher?.avatar || logoUrl || "/logo.png"}
              alt={currentTeacher?.name || "Instructor Profile"}
              onError={(e) => {
                (e.target as HTMLImageElement).src = logoUrl || "/logo.png";
              }}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-700 shrink-0 bg-slate-800"
            />
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                <span>Faculty & Instructor Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{currentTeacher?.name}</h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {currentTeacher?.title} • {teacherDepartmentNames.length > 0 ? teacherDepartmentNames.join(', ') : 'General Faculty'}
              </p>
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenEditProfileModal}
                  className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit My Faculty Profile</span>
                </button>

                <button
                  onClick={() => {
                    setIsGlobalScannerOpen(true);
                    setGlobalScanFeedback(null);
                    setGlobalScanFeedbackType(null);
                  }}
                  className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 animate-pulse" />
                  <span>Scan QR Attendance</span>
                </button>

                <button
                  onClick={() => setShowQuickStart(true)}
                  className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  title="View scanner quick start instructions"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Quick Start Guide</span>
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('user-manual')}
                  className="mt-2 px-3 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 hover:text-white font-bold text-xs rounded-xl border border-blue-700/60 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  title="View Faculty User Manual"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Faculty Usage Manual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Switch Faculty Member Selector (Only visible to Admin) */}
          {isActualAdmin ? (
            <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 space-y-2 shrink-0">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Admin Overseer • Switch Faculty View:
              </label>
              <select
                value={activeTeacherId || 'admin-overseer'}
                onChange={(e) => setActiveTeacherId(e.target.value)}
                className="bg-slate-900 text-white border border-slate-700 text-xs font-semibold px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden min-w-[180px]"
              >
                {teachers.length === 0 ? (
                  <option value="admin-overseer">
                    {loggedInUser?.name || 'Administrator Overseer'} (Admin)
                  </option>
                ) : (
                  teachers.map((t) => {
                    const matchedUser = schoolUsers.find(
                      (u) => u.id === t.id || (u.email && u.email.toLowerCase() === (t.email || '').toLowerCase())
                    );
                    const deptText = matchedUser?.departmentNames && matchedUser.departmentNames.length > 0
                      ? matchedUser.departmentNames.join(', ')
                      : t.department || 'General Faculty';
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} ({deptText})
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          ) : (
            <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/80 text-right space-y-1 shrink-0">
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Authenticated Instructor Session
              </div>
              <p className="text-xs text-slate-400 font-medium">Isolated Faculty Dashboard • Private Access</p>
            </div>
          )}
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        {[...teacherDashboardSections]
          .filter((section) => {
            if (section.enabled === false) return false;
            if (section.id === 'hod_news_management') {
              return isActualHod || isActualAdmin;
            }
            return true;
          })
          .sort((a, b) => getSectionOrder(a.id) - getSectionOrder(b.id))
          .map((section) => {
            let icon = <BookOpen className="w-4 h-4 text-blue-600" />;
            let activeClass = 'bg-white text-slate-900 shadow-xs border border-slate-200';
            const inactiveClass = 'text-slate-600 hover:text-slate-900';

            switch (section.id) {
              case 'classes':
                icon = <BookOpen className="w-4 h-4 text-blue-600" />;
                activeClass = 'bg-white text-slate-900 shadow-xs border border-slate-200';
                break;
              case 'performance':
                icon = <BarChart3 className="w-4 h-4 text-indigo-500" />;
                activeClass = 'bg-indigo-600 text-white shadow-md';
                break;
              case 'claims':
                icon = <Clock className="w-4 h-4 text-emerald-500" />;
                activeClass = 'bg-blue-600 text-white shadow-md';
                break;
              case 'resources':
                icon = <FileText className="w-4 h-4 text-purple-600" />;
                activeClass = 'bg-white text-slate-900 shadow-xs border border-slate-200';
                break;
              case 'published_announcements':
                icon = <Bell className="w-4 h-4 text-amber-500" />;
                activeClass = 'bg-amber-600 text-white shadow-md';
                break;
              case 'published_resources':
                icon = <FileText className="w-4 h-4 text-teal-500" />;
                activeClass = 'bg-teal-600 text-white shadow-md';
                break;
              case 'hod_news_management':
                icon = <Building2 className="w-4 h-4 text-indigo-600" />;
                activeClass = 'bg-indigo-600 text-white shadow-md';
                break;
              default:
                break;
            }

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                  activeSection === section.id ? activeClass : inactiveClass
                }`}
              >
                {icon}
                <span>{section.title}</span>
              </button>
            );
          })}
      </div>

      {activeSection === 'performance' && (() => {
        const performanceClasses = teacherClasses;

        if (performanceClasses.length === 0) {
          return (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xs text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <BarChart3 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Assigned Classes</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                You are not currently assigned to teach any active classes. Once classes are assigned, you will be able to monitor student performance metrics here.
              </p>
            </div>
          );
        }

        const filteredPerformanceClasses = performanceClassFilter === 'all'
          ? performanceClasses
          : performanceClasses.filter(c => c.id === performanceClassFilter);

        const classPerformanceStats = filteredPerformanceClasses.map((cls, idx) => {
          const classGrades: number[] = [];
          (registrationLogs || []).forEach(reg => {
            (reg.grades || []).forEach(g => {
              if ((g.classId === cls.id || g.className === cls.title) && g.score !== undefined && g.pointsPossible) {
                classGrades.push(Math.round((g.score / g.pointsPossible) * 100));
              }
            });
          });

          let gradeA = classGrades.filter(s => s >= 90).length;
          let gradeB = classGrades.filter(s => s >= 80 && s < 90).length;
          let gradeC = classGrades.filter(s => s >= 70 && s < 80).length;
          let gradeD = classGrades.filter(s => s >= 60 && s < 70).length;
          let gradeF = classGrades.filter(s => s < 60).length;

          const totalStudents = classGrades.length;
          let avgScore = 0;
          let passRate = 0;

          if (totalStudents > 0) {
            avgScore = Math.round(classGrades.reduce((sum, s) => sum + s, 0) / totalStudents);
            passRate = Math.round(((gradeA + gradeB + gradeC) / totalStudents) * 100);
          }

          return {
            id: cls.id,
            title: cls.title,
            shortTitle: cls.title.length > 18 ? cls.title.substring(0, 16) + '...' : cls.title,
            gradeA,
            gradeB,
            gradeC,
            gradeD,
            gradeF,
            totalStudents,
            avgScore,
            passRate,
            targetBenchmark: 85
          };
        });

        const totalAssessedStudents = classPerformanceStats.reduce((sum, c) => sum + c.totalStudents, 0);
        
        let overallTeacherAvg = 0;
        let overallPassRate = 0;
        const classesWithData = classPerformanceStats.filter(c => c.totalStudents > 0);
        
        if (classesWithData.length > 0) {
          overallTeacherAvg = Math.round(classesWithData.reduce((sum, c) => sum + c.avgScore, 0) / classesWithData.length);
          overallPassRate = Math.round(classesWithData.reduce((sum, c) => sum + c.passRate, 0) / classesWithData.length);
        }

        const topClassStat = classesWithData.length > 0 
          ? [...classesWithData].sort((a, b) => b.avgScore - a.avgScore)[0] 
          : null;

        return (
          <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold mb-2">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Faculty Analytics & Student Mastery</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{getSectionTitle('performance', 'Student Performance Distribution')}</h2>
                <p className="text-xs text-slate-500">
                  Comprehensive breakdown of student letter grades and averages across all classes taught by {currentTeacher.name}.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filter Course:</span>
                </div>
                <select
                  value={performanceClassFilter}
                  onChange={(e) => setPerformanceClassFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">All Assigned Classes ({performanceClasses.length})</option>
                  {performanceClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Performance Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Assessed</p>
                  <h3 className="text-2xl font-black text-slate-900">{totalAssessedStudents} <span className="text-xs font-normal text-slate-500">students</span></h3>
                  <p className="text-[10px] text-slate-500 font-medium">Across {filteredPerformanceClasses.length} courses</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Average</p>
                  <h3 className="text-2xl font-black text-slate-900">{overallTeacherAvg}%</h3>
                  <p className={`text-[10px] font-bold flex items-center gap-1 ${overallTeacherAvg >= 85 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <span>
                      {overallTeacherAvg > 0 
                        ? (overallTeacherAvg >= 85 ? `+${(overallTeacherAvg - 85).toFixed(1)}% vs target benchmark` : `${(overallTeacherAvg - 85).toFixed(1)}% vs target benchmark`) 
                        : 'No Data'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Performing Class</p>
                  <h3 className="text-sm font-black text-slate-900 truncate max-w-[140px]">{topClassStat?.title || 'N/A'}</h3>
                  <p className="text-[10px] text-amber-600 font-bold">{topClassStat?.avgScore || 0}% Class Average</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Course Pass Rate</p>
                  <h3 className="text-2xl font-black text-slate-900">{overallPassRate}%</h3>
                  <p className="text-[10px] text-emerald-600 font-bold">Grade C or higher</p>
                </div>
              </div>
            </div>

            {/* Performance Visualizations & Detail Table */}
            {totalAssessedStudents === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xs text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <BarChart3 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Student Enrollments or Grades Recorded</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  There are currently no students registered or graded in your assigned courses. Once student applications are verified and grade records are logged, these analytics and distribution charts will automatically update here.
                </p>
              </div>
            ) : (
              <>
                {/* Performance Visualizations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Grouped Bar Chart - Grade Distribution across Taught Classes */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Grade Distribution Tiers per Course</h3>
                        <p className="text-xs text-slate-500">Student count broken down by letter grade (A, B, C, D, F) for each class.</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> Grade A (90-100%)</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"/> Grade B (80-89%)</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"/> Grade C (70-79%)</span>
                      </div>
                    </div>

                    <div className="h-80 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={classPerformanceStats} margin={{ top: 20, right: 20, left: -10, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="shortTitle" 
                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                          />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#94a3b8' } }} />
                          <RechartsTooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-2">
                                    <p className="font-bold text-amber-300 border-b border-slate-800 pb-1.5">{label}</p>
                                    {payload.map((entry: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between gap-6">
                                        <span style={{ color: entry.color }} className="font-bold">{entry.name}:</span>
                                        <span className="font-black text-white">{entry.value} students</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                          <Bar dataKey="gradeA" name="Grade A (90-100%)" fill="#10b981" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="gradeB" name="Grade B (80-89%)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="gradeC" name="Grade C (70-79%)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="gradeD" name="Grade D (60-69%)" fill="#f97316" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="gradeF" name="Grade F (<60%)" fill="#ef4444" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Course Average vs Target Benchmark */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="font-bold text-slate-900 text-base">Class Average vs Target</h3>
                      <p className="text-xs text-slate-500">Course average score compared against the 85% target benchmark.</p>
                    </div>

                    <div className="h-80 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={classPerformanceStats} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                          <YAxis type="category" dataKey="shortTitle" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} width={100} />
                          <RechartsTooltip
                            formatter={(value: any) => [`${value}%`, 'Class Average']}
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                          />
                          <Bar dataKey="avgScore" name="Class Average" radius={[0, 8, 8, 0]}>
                            {classPerformanceStats.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.avgScore >= 88 ? '#10b981' : entry.avgScore >= 80 ? '#6366f1' : '#f59e0b'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Detailed Course Performance Breakdown Table */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Detailed Class Mastery Roster</h3>
                      <p className="text-xs text-slate-500">Complete performance metrics and pass rates for each course.</p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-extrabold">
                      {classPerformanceStats.length} Classes Evaluated
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3 rounded-l-xl">Course Title</th>
                          <th className="p-3 text-center">Enrolled</th>
                          <th className="p-3 text-center">Class Average</th>
                          <th className="p-3 text-center">Pass Rate</th>
                          <th className="p-3 text-center">Grade Breakdown (A / B / C / D / F)</th>
                          <th className="p-3 text-right rounded-r-xl">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {classPerformanceStats.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-bold text-slate-900">{c.title}</td>
                            <td className="p-3 text-center font-bold text-slate-700">{c.totalStudents}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                                c.avgScore >= 90 ? 'bg-emerald-100 text-emerald-800' :
                                c.avgScore >= 80 ? 'bg-indigo-100 text-indigo-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {c.avgScore}%
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="bg-emerald-500 h-2 rounded-full" 
                                    style={{ width: `${c.passRate}%` }}
                                  />
                                </div>
                                <span className="font-bold text-slate-800">{c.passRate}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center gap-1 font-bold text-[11px]">
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md" title="Grade A">{c.gradeA} A</span>
                                <span className="text-slate-300">•</span>
                                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md" title="Grade B">{c.gradeB} B</span>
                                <span className="text-slate-300">•</span>
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md" title="Grade C">{c.gradeC} C</span>
                                <span className="text-slate-300">•</span>
                                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded-md" title="Grade D">{c.gradeD} D</span>
                                <span className="text-slate-300">•</span>
                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded-md" title="Grade F">{c.gradeF} F</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Optimal Mastery</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {activeSection === 'claims' && (
        <ClassClaimForm
          currentUser={loggedInUser || currentTeacher}
          currentRole={currentRole}
          classList={classes}
          sbaHubOptions={sbaHubOptions}
          claims={claims}
          onUpdateClaims={onUpdateClaims}
          hourlyRates={hourlyRates}
          onUpdateHourlyRates={onUpdateHourlyRates}
          users={schoolUsers}
          sectionTitle={getSectionTitle('claims', 'Faculty Teaching Claim Portal')}
        />
      )}

      {activeSection === 'classes' && (
        <div className="space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{getSectionTitle('classes', 'My Assigned Courses & Google Classroom Links')}</h2>
            <p className="text-xs text-slate-500">
              Classes are <strong>Invite-Only</strong> on Google Classroom to prevent unauthorized access. Manage direct class links for enrolled students below.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Invite-Only Access Mode</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teacherClasses.map((cls) => {
            const pct = Math.round((cls.enrolled / cls.capacity) * 100);
            const isEditingThisClass = editingGcClassId === cls.id;
            const gcUrl = cls.googleClassroomUrl || `https://classroom.google.com/c/${cls.id}`;
            const meetUrl = cls.googleMeetUrl || `https://meet.google.com/shaw-${cls.id}`;

            return (
              <div key={cls.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      {cls.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{cls.location}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{cls.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{cls.schedule}</p>

                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Enrolled Students</span>
                      <span className="text-slate-900 font-bold">{cls.enrolled} / {cls.capacity}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pct > 80 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Google Classroom Direct Section */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        Google Classroom Link
                      </span>
                      <button
                        onClick={() => isEditingThisClass ? setEditingGcClassId(null) : handleStartEditGc(cls)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        {isEditingThisClass ? 'Cancel' : 'Edit Links'}
                      </button>
                    </div>

                    {isEditingThisClass ? (
                      <div className="space-y-2 pt-1 border-t border-slate-200">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                            Google Classroom URL
                          </label>
                          <input
                            type="url"
                            value={editGcUrl}
                            onChange={(e) => setEditGcUrl(e.target.value)}
                            placeholder="https://classroom.google.com/c/..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                            Google Meet Live Link (Optional)
                          </label>
                          <input
                            type="url"
                            value={editMeetUrl}
                            onChange={(e) => setEditMeetUrl(e.target.value)}
                            placeholder="https://meet.google.com/..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <button
                          onClick={() => handleSaveGcLink(cls.id)}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                        >
                          Save Class Links
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-slate-600">
                        <div className="flex items-center gap-1 text-[11px] truncate">
                          <span className="font-semibold text-slate-700 shrink-0">Classroom:</span>
                          <a
                            href={gcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {gcUrl}
                          </a>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] truncate">
                          <span className="font-semibold text-slate-700 shrink-0">Meet:</span>
                          <a
                            href={meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {meetUrl}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <a
                    href={gcUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Classroom</span>
                  </a>
                  <button
                    onClick={() => setManagingAcademicsClassId(managingAcademicsClassId === cls.id ? null : cls.id)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-xl shadow-2xs flex items-center justify-center transition-all text-center"
                  >
                    <span>{managingAcademicsClassId === cls.id ? 'Close' : 'Academics'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Academics Management Panel */}
        {managingAcademicsClassId && (() => {
          const cls = teacherClasses.find(c => c.id === managingAcademicsClassId);
          if (!cls) return null;
          
          // Get enrolled students for this class from live Firebase registrations
          const enrolledStudents = registrationLogs.filter(log => {
            const isVerifiedForClass = Boolean(log.verifiedClassIds && log.verifiedClassIds.includes(cls.id));
            const isSelectedForClass = Boolean(
              log.selectedClasses?.some((c) => c.id === cls.id) || 
              log.selectedClassIds?.includes(cls.id)
            );
            const isPaidOrVerified = Boolean(
              log.isPaid || 
              log.status === 'enrolled_paid' || 
              log.status === 'completed' || 
              (log.payments && log.payments.length > 0)
            );
            return isVerifiedForClass || (isSelectedForClass && isPaidOrVerified);
          });
          const todayStr = new Date().toISOString().split('T')[0];
          
          return (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mt-8 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Manage {cls.title}
                  </h3>
                  <p className="text-xs text-slate-500">{enrolledStudents.length} students enrolled</p>
                </div>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setAcademicManageTab('attendance')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      academicManageTab === 'attendance'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Attendance
                  </button>
                  <button
                    onClick={() => setAcademicManageTab('grades')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      academicManageTab === 'grades'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Grades
                  </button>
                </div>
              </div>

              {academicManageTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <span>Attendance: {getFormattedFullDate(academicsAttendanceDate)}</span>
                        {academicsAttendanceDate === todayStr && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Today
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {getDayNameFromDate(academicsAttendanceDate)} — Log attendance manually or use the QR scanner.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Date selection shortcuts */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            const parts = academicsAttendanceDate.split('-').map(Number);
                            const d = new Date(parts[0], parts[1] - 1, parts[2]);
                            d.setDate(d.getDate() - 1);
                            setAcademicsAttendanceDate(d.toISOString().split('T')[0]);
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                          title="Previous Day"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAcademicsAttendanceDate(todayStr)}
                          className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer ${
                            academicsAttendanceDate === todayStr ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const parts = academicsAttendanceDate.split('-').map(Number);
                            const d = new Date(parts[0], parts[1] - 1, parts[2]);
                            d.setDate(d.getDate() + 1);
                            setAcademicsAttendanceDate(d.toISOString().split('T')[0]);
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                          title="Next Day"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="date"
                          value={academicsAttendanceDate}
                          onChange={(e) => e.target.value && setAcademicsAttendanceDate(e.target.value)}
                          className="text-xs font-bold px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-800 cursor-pointer"
                        />
                      </div>

                      <button
                        onClick={() => {
                          setIsScanningQr(!isScanningQr);
                          setScanFeedback(null);
                          setScanFeedbackType(null);
                        }}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                          isScanningQr 
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isScanningQr ? (
                          <>
                            <VideoOff className="w-3.5 h-3.5" />
                            <span>Stop QR Scanner</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3.5 h-3.5 animate-bounce" />
                            <span>Mark via QR Scan</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          const classAttendance = attendanceRecords?.filter(a => a.classId === cls.id) || [];
                          if (classAttendance.length === 0) return alert('No attendance records found for this class.');
                          
                          const headers = ['Date', 'Student Name', 'Status', 'Timestamp'];
                          const rows = classAttendance.map(a => [a.date, a.studentName, a.status, a.timestamp]);
                          const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                          
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `attendance-${cls.id}-${academicsAttendanceDate}.csv`;
                          a.click();
                          window.URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        Export All Attendance
                      </button>
                    </div>
                  </div>

                  {/* Automated Lateness Notification Toggle */}
                  <div className="bg-blue-50/50 dark:bg-slate-800/30 border border-blue-100 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                        <h5 className="text-xs font-extrabold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                          Automated 15-Min Lateness Alerts
                        </h5>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                        When enabled, a smart alert automatically triggers 15 minutes after the scheduled class start time ({cls.startTime || 'TBA'}). This pings all enrolled students who haven't scanned in, across all of their registered devices.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2.5 cursor-pointer shrink-0 select-none">
                      <input
                        id={`toggle-lateness-${cls.id}`}
                        type="checkbox"
                        checked={!!cls.autoLatenessAlertEnabled}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          if (onUpdateClassList) {
                            const updatedClasses = classes.map((c) =>
                              c.id === cls.id ? { ...c, autoLatenessAlertEnabled: isChecked } : c
                            );
                            onUpdateClassList(updatedClasses);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-hidden dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {cls.autoLatenessAlertEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  {/* live camera scan box */}
                  {isScanningQr && (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-md mx-auto animate-fade-in relative overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between relative z-10">
                        <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-extrabold uppercase tracking-widest">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          LIVE ATTENDANCE SCANNER
                        </span>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => {
                              setIsScanningQr(false);
                              setTimeout(() => setIsScanningQr(true), 100);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs font-bold cursor-pointer bg-indigo-500/10 px-2 py-1 rounded"
                          >
                            ↻ Retry Scan
                          </button>
                          <button 
                            onClick={() => setIsScanningQr(false)}
                            className="text-slate-500 hover:text-slate-300 transition-colors text-xs font-bold cursor-pointer"
                          >
                            ✕ Close
                          </button>
                        </div>
                      </div>

                      {showScannerTooltip && (
                        <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-3 relative z-10 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-blue-300">Quick Start Guide</h4>
                            <button onClick={() => setShowScannerTooltip(false)} className="text-blue-400 hover:text-white">✕</button>
                          </div>
                          <ul className="text-[11px] text-blue-200/80 list-disc list-inside space-y-1">
                            <li>Ensure the student's QR code is brightly lit and flat.</li>
                            <li>Hold the code 6-8 inches from the camera lens.</li>
                            <li>The scanner automatically confirms and records attendance instantly.</li>
                          </ul>
                        </div>
                      )}

                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                        <video 
                          ref={scanVideoRef} 
                          className="absolute inset-0 w-full h-full object-cover"
                          muted 
                          playsInline
                        />
                        <canvas ref={scanCanvasRef} className="hidden" />

                        {/* Scanner Laser and corner brackets overlay */}
                        <div className="absolute inset-x-8 inset-y-6 border-2 border-indigo-500/30 rounded-lg pointer-events-none flex flex-col justify-between">
                          <div className="flex justify-between">
                            <div className="w-4 h-4 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1"></div>
                            <div className="w-4 h-4 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1"></div>
                          </div>
                          <div className="w-full h-0.5 bg-indigo-500 shadow-[0_0_12px_#6366f1] animate-[pulse_1s_infinite]"></div>
                          <div className="flex justify-between">
                            <div className="w-4 h-4 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1"></div>
                            <div className="w-4 h-4 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1"></div>
                          </div>
                        </div>
                      </div>

                      {scanFeedback && (
                        <div className={`p-3 rounded-xl border text-xs font-bold transition-all relative z-10 flex items-center gap-2 ${
                          scanFeedbackType === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : scanFeedbackType === 'error'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}>
                          <Volume2 className={`w-4 h-4 shrink-0 ${scanFeedbackType === 'success' ? 'animate-bounce' : ''}`} />
                          <span className="flex-1 leading-relaxed">{scanFeedback}</span>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                        Tip: Have the student expand their QR code fullscreen on their portal for best alignment under varying classroom lighting.
                      </div>

                      {(() => {
                        const classAttendanceSelectedDate = attendanceRecords?.filter(a => a.classId === cls.id && a.date === academicsAttendanceDate) || [];
                        const recentScans = [...classAttendanceSelectedDate].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
                        
                        if (recentScans.length === 0) return null;
                        
                        return (
                          <div className="mt-4 border-t border-slate-800 pt-4 relative z-10">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Scans ({recentScans.length})</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                              {recentScans.map(scan => {
                                const isJustScanned = scan.timestamp && (Date.now() - new Date(scan.timestamp).getTime() < 30000);
                                return (
                                  <div 
                                    key={scan.id} 
                                    className={`flex justify-between items-center p-2.5 rounded-lg transition-all duration-500 ${
                                      isJustScanned 
                                        ? 'bg-emerald-950/60 border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30 animate-pulse' 
                                        : 'bg-slate-900/60 border border-slate-800'
                                    }`}
                                  >
                                     <div className="flex items-center gap-2">
                                       {isJustScanned && (
                                         <span className="relative flex h-2 w-2 shrink-0">
                                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                           <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                         </span>
                                       )}
                                       <span className="text-xs text-slate-300 font-semibold">{scan.studentName}</span>
                                     </div>
                                     <span className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-bold">
                                       <CheckCircle2 className={`w-3.5 h-3.5 ${isJustScanned ? 'animate-bounce text-emerald-300' : ''}`} />
                                       {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {enrolledStudents.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No students enrolled yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="py-2 px-3 text-xs font-bold text-slate-500 uppercase">Student</th>
                            <th className="py-2 px-3 text-xs font-bold text-slate-500 uppercase">Email</th>
                            <th className="py-2 px-3 text-xs font-bold text-slate-500 uppercase text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrolledStudents.map(student => {
                            const attId = `att-${cls.id}-${academicsAttendanceDate}-${student.studentInfo.id || student.id}`;
                            const record = attendanceRecords?.find(a => a.id === attId || (a.classId === cls.id && a.date === academicsAttendanceDate && (a.studentId === (student.studentInfo.id || student.id) || a.studentName.toLowerCase() === (student.studentInfo.studentName || '').toLowerCase())));
                            const isRecentlyScanned = Boolean(record && record.timestamp && (Date.now() - new Date(record.timestamp).getTime() < 30000));
                            const isAbsent = record?.status === 'absent';
                            const isLate = record?.status === 'late';
                            const isExcused = record?.status === 'excused';

                            return (
                              <tr 
                                key={student.id} 
                                className={`border-b transition-colors duration-300 ${
                                  isAbsent 
                                    ? 'bg-rose-50/90 hover:bg-rose-100/80 border-l-4 border-l-rose-500 border-rose-200 text-rose-950 font-medium'
                                    : isRecentlyScanned 
                                    ? 'bg-emerald-50/70 font-medium border-slate-100' 
                                    : 'hover:bg-slate-50 border-slate-100'
                                }`}
                              >
                                <td className="py-3 px-3 text-sm font-semibold flex items-center gap-2">
                                  {isRecentlyScanned && (
                                    <span className="relative flex h-2 w-2 shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                  )}
                                  {isAbsent && (
                                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Absent for this session"></span>
                                  )}
                                  <span className={isAbsent ? 'text-rose-950 font-bold' : 'text-slate-800'}>
                                    {student.studentInfo.studentName || student.studentInfo.firstName}
                                  </span>
                                </td>
                                <td className={`py-3 px-3 text-sm ${isAbsent ? 'text-rose-700/80' : 'text-slate-500'}`}>
                                  {student.studentInfo.email || student.studentInfo.parentEmail}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  {record ? (
                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                      {record.status === 'present' && (
                                        <span
                                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all duration-700 ease-in-out ${
                                            isRecentlyScanned
                                              ? 'text-emerald-800 bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs animate-pulse scale-105'
                                              : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                          }`}
                                        >
                                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isRecentlyScanned ? 'text-emerald-600 animate-bounce' : ''}`} />
                                          <span>Present</span>
                                          {isRecentlyScanned && (
                                            <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wide ml-0.5">
                                              (Just Scanned)
                                            </span>
                                          )}
                                        </span>
                                      )}
                                      {isAbsent && (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border text-rose-700 bg-rose-100 border-rose-300 ring-1 ring-rose-400/30">
                                          <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                          <span>Absent</span>
                                        </span>
                                      )}
                                      {isLate && (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border text-amber-700 bg-amber-50 border-amber-300">
                                          <span>Late</span>
                                        </span>
                                      )}
                                      {isExcused && (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border text-blue-700 bg-blue-50 border-blue-300">
                                          <span>Excused</span>
                                        </span>
                                      )}

                                      {/* Quick toggle button */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextStatus = isAbsent ? 'present' : 'absent';
                                          onUpdateAttendance({
                                            id: attId,
                                            classId: cls.id,
                                            className: cls.title,
                                            date: academicsAttendanceDate,
                                            studentId: student.studentInfo.id || student.id,
                                            studentName: student.studentInfo.studentName || student.studentInfo.firstName,
                                            status: nextStatus,
                                            timestamp: new Date().toISOString()
                                          });
                                        }}
                                        className="ml-1.5 px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                        title={isAbsent ? 'Switch to Present' : 'Switch to Absent'}
                                      >
                                        {isAbsent ? 'Set Present' : 'Set Absent'}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                      <button
                                        onClick={() => {
                                          onUpdateAttendance({
                                            id: attId,
                                            classId: cls.id,
                                            className: cls.title,
                                            date: academicsAttendanceDate,
                                            studentId: student.studentInfo.id || student.id,
                                            studentName: student.studentInfo.studentName || student.studentInfo.firstName,
                                            status: 'present',
                                            timestamp: new Date().toISOString()
                                          });
                                        }}
                                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        Mark Present
                                      </button>
                                      <button
                                        onClick={() => {
                                          onUpdateAttendance({
                                            id: attId,
                                            classId: cls.id,
                                            className: cls.title,
                                            date: academicsAttendanceDate,
                                            studentId: student.studentInfo.id || student.id,
                                            studentName: student.studentInfo.studentName || student.studentInfo.firstName,
                                            status: 'absent',
                                            timestamp: new Date().toISOString()
                                          });
                                        }}
                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        Mark Absent
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {academicManageTab === 'grades' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900">Student Grade Reports</h4>
                  {enrolledStudents.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No students enrolled yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {enrolledStudents.map(student => {
                        const studentGrades = (student.grades || []).filter(g => g.classId === cls.id);
                        return (
                          <div key={student.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="font-bold text-slate-800">{student.studentInfo.studentName || student.studentInfo.firstName}</h5>
                              <button
                                onClick={() => {
                                  const assignment = prompt('Enter assignment name:');
                                  if (!assignment) return;
                                  const score = prompt('Enter score:');
                                  const possible = prompt('Enter points possible:');
                                  const grade = prompt('Enter letter grade:');
                                  if (assignment && grade) {
                                    const newGrade = {
                                      id: `grade-\${Date.now()}`,
                                      classId: cls.id,
                                      className: cls.title,
                                      assignmentName: assignment,
                                      score: score || '',
                                      pointsPossible: possible || '',
                                      grade,
                                      feedback: prompt('Enter optional feedback:') || '',
                                      updatedAt: new Date().toISOString()
                                    };
                                    onUpdateRegistration({
                                      ...student,
                                      grades: [...(student.grades || []), newGrade]
                                    });
                                  }
                                }}
                                className="text-[10px] font-bold px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-2xs"
                              >
                                + Add Grade
                              </button>
                            </div>
                            
                            {studentGrades.length === 0 ? (
                              <p className="text-xs text-slate-400">No grades recorded.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-500">
                                      <th className="py-1.5 font-semibold">Assignment</th>
                                      <th className="py-1.5 font-semibold">Score</th>
                                      <th className="py-1.5 font-semibold">Grade</th>
                                      <th className="py-1.5 font-semibold">Feedback</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {studentGrades.map(g => (
                                      <tr key={g.id} className="border-b border-slate-100">
                                        <td className="py-2 text-slate-800 font-medium">{g.assignmentName}</td>
                                        <td className="py-2 text-slate-600">{g.score || '-'}/{g.pointsPossible || '-'}</td>
                                        <td className="py-2 text-blue-700 font-bold">{g.grade}</td>
                                        <td className="py-2 text-slate-500">{g.feedback}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
      )}

      {/* PUBLISH SECTION: Announcement Form & Resource Form */}
      {(activeSection === 'resources') && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Form 1: Publish Class Announcement */}
        <form
          onSubmit={handlePublishAnnouncement}
          className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5"
        >
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Publish Class Announcement</h3>
          </div>
          <p className="text-xs text-slate-500">
            Post lab updates, schedule changes, or competition notices directly to your students' portal.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Class</label>
              <select
                value={annClassId}
                onChange={(e) => setAnnClassId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
              >
                {formClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Title</label>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="e.g. Robotics Lab Kits Available for Pickup"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Message Content *</label>
                <span className="text-[11px] text-blue-600 font-medium">Preserves linebreaks & paragraphs</span>
              </div>
              <textarea
                required
                rows={4}
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                placeholder="Write your announcement message for enrolled students. Multi-line instructions, paragraphs, and lists are formatted exactly as typed..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden whitespace-pre-wrap font-sans"
              />
            </div>

            <div>
              <ImageUploadInput
                label="Optional Announcement Image / Flyer / Schematic"
                value={annImageUrl}
                onChange={setAnnImageUrl}
                placeholder="Upload announcement graphic or enter image URL..."
                aspectRatio="wide"
                darkBg={false}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    checked={annPriority === 'normal'}
                    onChange={() => setAnnPriority('normal')}
                  />
                  <span>Normal</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    checked={annPriority === 'urgent'}
                    onChange={() => setAnnPriority('urgent')}
                  />
                  <span>Urgent Notice</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Publish Announcement to Student Portal</span>
          </button>

          {annSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Announcement published successfully! Students can view it in their portal.</span>
            </div>
          )}
        </form>

        {/* Form 2: Upload Learning Resource */}
        <form
          onSubmit={handlePublishResource}
          className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5"
        >
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-900">Upload Learning Resource</h3>
          </div>
          <p className="text-xs text-slate-500">
            Add Arduino schematics, Python templates, lab worksheets, diagrams, or PDF syllabus links for your enrolled students.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Class</label>
              <select
                value={resClassId}
                onChange={(e) => setResClassId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
              >
                {formClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resource Title</label>
                <input
                  type="text"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  placeholder="e.g. Lab 3 Motor Schematic"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Material Category</label>
                <select
                  value={resCategory}
                  onChange={(e) => setResCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                >
                  {resourceCategories.length > 0 ? (
                    resourceCategories.map((cat) => (
                      <option key={cat.id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Lecture Notes">Lecture Notes</option>
                      <option value="Robotics Schematics">Robotics Schematics</option>
                      <option value="Lab Worksheet">Lab Worksheet</option>
                      <option value="Project Files">Project Files</option>
                      <option value="Syllabus">Syllabus</option>
                      <option value="Practice Tests">Practice Tests</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Resource Description & Instructions</label>
                <span className="text-[11px] text-purple-600 font-medium">Preserves linebreaks & paragraphs</span>
              </div>
              <textarea
                rows={4}
                value={resDesc}
                onChange={(e) => setResDesc(e.target.value)}
                placeholder="Describe what this schematic, worksheet, lab assignment, or template contains. Typed paragraphs and bullet points will be preserved..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs whitespace-pre-wrap font-sans"
              />
            </div>

            <div>
              <ImageUploadInput
                label="Resource Schematic / Diagram / Worksheet Image (Downloadable by students)"
                value={resImageUrl}
                onChange={setResImageUrl}
                placeholder="Upload schematic image or enter diagram URL..."
                aspectRatio="auto"
                darkBg={false}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Publish Resource to Enrolled Students</span>
          </button>

          {resSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Resource added! Enrolled students can download it and its images from their portal.</span>
            </div>
          )}
        </form>
      </div>

      {/* Published Announcements List for this Teacher */}
      {(activeSection === 'published_announcements' || activeSection === 'resources') && (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">{getSectionTitle('published_announcements', 'My Published Announcements')}</h2>
        {teacherAnnouncements.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No announcements published yet for your classes.</p>
        ) : (
          <div className="space-y-3">
            {teacherAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{ann.className}</span>
                    <span className="text-[11px] text-slate-400">{ann.date}</span>
                    {ann.priority === 'urgent' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        Urgent
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
                  <div className="text-xs text-slate-600">
                    <FormattedText text={ann.content} />
                  </div>
                  <MediaAttachmentViewer
                    url={ann.imageUrl || (ann as any).fileUrl}
                    title={ann.title}
                    logoUrl={logoUrl}
                    type="announcement"
                  />
                </div>

                <button
                  onClick={() => onDeleteAnnouncement(ann.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Published Resources List for this Teacher */}
      {(activeSection === 'published_resources' || activeSection === 'resources') && (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">{getSectionTitle('published_resources', 'My Published Course Resources')}</h2>
        {teacherResources.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No resources published yet for your classes.</p>
        ) : (
          <div className="space-y-3">
            {teacherResources.map((res) => (
              <div
                key={res.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {res.category}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{res.className}</span>
                    <span className="text-[11px] text-slate-400">{res.uploadDate}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{res.title}</h4>
                  <div className="text-xs text-slate-600">
                    <FormattedText text={res.description} />
                  </div>

                  <MediaAttachmentViewer
                    url={res.imageUrl || res.fileUrl}
                    title={res.title}
                    logoUrl={logoUrl}
                    type="resource"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {res.imageUrl && (
                    <button
                      type="button"
                      onClick={() => downloadImage(res.imageUrl!, `${res.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Download Resource Attachment"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteResource(res.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* HOD Resource Category Manager & Department News Management */}
      {activeSection === 'hod_news_management' && (isActualHod || isActualAdmin) && (
        <div className="pt-8 border-t border-slate-200 space-y-8">
          <HodResourceCategoryManager
            categories={resourceCategories}
            loggedInUser={loggedInUser as SchoolUser}
            currentRole={currentRole}
          />

          <AdminNewsManagement
            news={schoolNews}
            departments={departments}
            loggedInUser={loggedInUser as SchoolUser}
            currentRole={currentRole}
          />
        </div>
      )}
      </div>
      )}
      {/* MODAL: EDIT TEACHER FACULTY PROFILE */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl sm:max-w-2xl w-full max-h-[88vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 my-auto overflow-hidden text-slate-900">
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 p-5 sm:px-8 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Edit Faculty Profile</h3>
                  <p className="text-xs text-slate-500">Update your teacher credentials and contact details</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-4">
              <ImageUploadInput
                label="Faculty Profile Avatar"
                value={editAvatar}
                onChange={setEditAvatar}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (868) 555-0199"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Robotics Lead"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Uneditable Assigned Department(s) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Assigned Department(s)</span>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> Managed by Administration (Read-Only)
                  </span>
                </label>
                <div className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl flex flex-wrap gap-2 items-center">
                  {(Array.from(new Set([
                    ...(currentTeacher?.departmentNames || []),
                    currentTeacher?.departmentName,
                    currentTeacher?.department,
                    ...((loggedInUser as SchoolUser)?.departmentNames || []),
                    (loggedInUser as SchoolUser)?.departmentName,
                    (loggedInUser as SchoolUser)?.department
                  ].filter(Boolean) as string[])).length > 0
                    ? Array.from(new Set([
                        ...(currentTeacher?.departmentNames || []),
                        currentTeacher?.departmentName,
                        currentTeacher?.department,
                        ...((loggedInUser as SchoolUser)?.departmentNames || []),
                        (loggedInUser as SchoolUser)?.departmentName,
                        (loggedInUser as SchoolUser)?.department
                      ].filter(Boolean) as string[]))
                    : ['General Faculty']
                  ).map((deptName, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white border border-slate-200 shadow-2xs text-slate-800 text-xs font-extrabold rounded-lg flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      {deptName}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Teachers cannot alter assigned departments. Contact Academy Administration for department transfers.
                </p>
              </div>

              {/* Weekly Office Hours Schedule Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Office Hours & Availability Schedule
                </label>
                <WeeklyOfficeHoursSelector
                  value={editOfficeHours}
                  onChange={(newSchedule) => setEditOfficeHours(newSchedule)}
                  locations={locations}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Faculty Biography & Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Share a short bio regarding your teaching experience and research interests..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              </div>

              <div className="shrink-0 bg-slate-50 border-t border-slate-200 p-4 sm:px-8 flex items-center justify-end gap-3 rounded-b-3xl z-10">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED GLOBAL QR ATTENDANCE SCANNER MODAL */}
      {isGlobalScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 relative shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsGlobalScannerOpen(false)}
              className="absolute right-4 top-4 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center justify-center text-lg font-bold cursor-pointer z-20"
            >
              ✕
            </button>

            <div className="space-y-4">
              <div className="flex items-center justify-between pr-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <QrCode className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Dedicated ID Scanner & Attendance</h3>
                    <p className="text-xs text-slate-400">Pick a calendar date, choose the class for that day, and record attendance.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickStart(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Scanner Help & Quick Start"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Quick Start</span>
                </button>
              </div>

              {/* Mode Switcher: Camera QR Scanner vs. Mark Register by Student Name */}
              <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1">
                <button
                  type="button"
                  onClick={() => setGlobalScannerViewMode('camera')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    globalScannerViewMode === 'camera'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Camera QR Scanner</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGlobalScannerViewMode('name_register')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    globalScannerViewMode === 'name_register'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Mark by Student Name ({activeCurrentStudentsInScanClass.length} Current)</span>
                </button>
              </div>

              {/* CALENDAR & CLASS PICKER SECTION */}
              <AttendanceCalendarPicker
                selectedDate={attendanceDate}
                onSelectDate={(newDate) => {
                  setAttendanceDate(newDate);
                  setGlobalScanFeedback(`Selected attendance date: ${getFormattedFullDate(newDate)}`);
                  setGlobalScanFeedbackType('success');
                }}
                classes={formClasses}
                selectedClassId={globalScanClassId}
                onSelectClassId={(newClassId) => {
                  setGlobalScanClassId(newClassId);
                  const selectedClass = formClasses.find(c => c.id === newClassId);
                  setGlobalScanFeedback(`Active class set to ${selectedClass ? selectedClass.title : 'selected course'}. Ready to mark attendance.`);
                  setGlobalScanFeedbackType('success');
                }}
                attendanceRecords={attendanceRecords}
                registrationLogs={registrationLogs}
                schoolUsers={schoolUsers}
                theme="dark"
                title="Class Schedule Calendar"
                subtitle={`Select a date to filter classes scheduled for that day, or pick any course below.`}
              />

              {globalScannerViewMode === 'camera' ? (
                /* Live Video Frame Container */
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner group">
                  <video
                    ref={globalScanVideoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <canvas ref={globalScanCanvasRef} className="hidden" />

                  {/* Aesthetic green targeting reticle for entrance/security scans */}
                  <div className="absolute inset-x-12 inset-y-8 border-2 border-emerald-500/30 rounded-2xl pointer-events-none flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1"></div>
                      <div className="w-5 h-5 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1"></div>
                    </div>
                    <div className="w-full h-0.5 bg-emerald-500 shadow-[0_0_12px_#10b981] animate-[pulse_1s_infinite]"></div>
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1"></div>
                      <div className="w-5 h-5 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1"></div>
                    </div>
                  </div>

                  {/* Live Retry Scan Button Overlay on Camera */}
                  <button
                    type="button"
                    onClick={handleRetryScan}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 backdrop-blur-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer z-10"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Retry Scan</span>
                  </button>
                </div>
              ) : (
                /* MARK REGISTER BY STUDENT NAME VIEW */
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-inner">
                  {/* Search and Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search current enrolled students by name or email..."
                        value={nameSearchQuery}
                        onChange={(e) => setNameSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleMarkAllUnmarkedPresent}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark All Unmarked as Present</span>
                    </button>
                  </div>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {(
                      [
                        { id: 'all', label: `All (${activeCurrentStudentsInScanClass.length})` },
                        {
                          id: 'unmarked',
                          label: `Unmarked (${activeCurrentStudentsInScanClass.filter((s) => s.status === 'unmarked').length})`,
                        },
                        {
                          id: 'present',
                          label: `Present (${activeCurrentStudentsInScanClass.filter((s) => s.status === 'present').length})`,
                        },
                        {
                          id: 'late',
                          label: `Late (${activeCurrentStudentsInScanClass.filter((s) => s.status === 'late').length})`,
                        },
                        {
                          id: 'absent',
                          label: `Absent (${activeCurrentStudentsInScanClass.filter((s) => s.status === 'absent').length})`,
                        },
                        {
                          id: 'excused',
                          label: `Excused (${activeCurrentStudentsInScanClass.filter((s) => s.status === 'excused').length})`,
                        },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setNameStatusFilter(f.id)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                          nameStatusFilter === f.id
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Student List for Selected Class */}
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {activeCurrentStudentsInScanClass
                      .filter((st) => {
                        if (nameStatusFilter !== 'all' && st.status !== nameStatusFilter) return false;
                        if (nameSearchQuery.trim()) {
                          const q = nameSearchQuery.toLowerCase();
                          return (
                            st.studentName.toLowerCase().includes(q) ||
                            st.studentEmail.toLowerCase().includes(q) ||
                            st.studentId.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((st) => {
                        return (
                          <div
                            key={st.studentId}
                            className={`p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 ${
                              st.status === 'absent'
                                ? 'bg-rose-950/40 border-2 border-rose-500/70 shadow-[0_0_16px_rgba(244,63,94,0.18)] ring-1 ring-rose-500/30'
                                : st.status === 'present'
                                ? 'bg-slate-900 border border-emerald-900/40 hover:border-slate-700'
                                : 'bg-slate-900 border border-slate-800/90 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                                  st.status === 'absent'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-inner'
                                    : st.status === 'present'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {st.studentName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-xs text-slate-100 flex items-center gap-2">
                                  <span className={st.status === 'absent' ? 'text-rose-200 font-black' : ''}>{st.studentName}</span>
                                  {st.status === 'present' && (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                                      Present
                                    </span>
                                  )}
                                  {st.status === 'late' && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30">
                                      Late
                                    </span>
                                  )}
                                  {st.status === 'absent' && (
                                    <span className="px-2 py-0.5 rounded-md bg-rose-500/25 text-rose-300 text-[10px] font-black border border-rose-500/50 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                                      Absent
                                    </span>
                                  )}
                                  {st.status === 'excused' && (
                                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-black border border-blue-500/30">
                                      Excused
                                    </span>
                                  )}
                                  {st.status === 'unmarked' && (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold">
                                      Unmarked
                                    </span>
                                  )}
                                </h4>
                                <p className={`text-[11px] ${st.status === 'absent' ? 'text-rose-300/80' : 'text-slate-400'}`}>{st.studentEmail || 'No email recorded'}</p>
                              </div>
                            </div>

                            {/* Quick Attendance Buttons */}
                            <div className="flex items-center gap-1 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleMarkStudentByName(st.studentId, st.studentName, 'present')}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                  st.status === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-800 text-emerald-400 hover:bg-emerald-950/80 hover:border-emerald-500/40 border border-slate-700'
                                }`}
                                title="Mark Present"
                              >
                                Present
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMarkStudentByName(st.studentId, st.studentName, 'late')}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                  st.status === 'late'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-slate-800 text-amber-400 hover:bg-amber-950/80 hover:border-amber-500/40 border border-slate-700'
                                }`}
                                title="Mark Late"
                              >
                                Late
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMarkStudentByName(st.studentId, st.studentName, 'absent')}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                  st.status === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-slate-800 text-rose-400 hover:bg-rose-950/80 hover:border-rose-500/40 border border-slate-700'
                                }`}
                                title="Mark Absent"
                              >
                                Absent
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMarkStudentByName(st.studentId, st.studentName, 'excused')}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                  st.status === 'excused'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-800 text-blue-400 hover:bg-blue-950/80 hover:border-blue-500/40 border border-slate-700'
                                }`}
                                title="Mark Excused"
                              >
                                Excused
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {activeCurrentStudentsInScanClass.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                        No active enrolled students found in this course.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status & Scan Feedback readouts */}
              {globalScanFeedback && (
                <div className={`p-4 rounded-xl border text-xs font-bold transition-all flex items-start justify-between gap-2.5 ${
                  globalScanFeedbackType === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                    : globalScanFeedbackType === 'error'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)]'
                    : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0">
                      {globalScanFeedbackType === 'success' ? '✓' : globalScanFeedbackType === 'error' ? '⚠' : 'ℹ'}
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Scanner Diagnostics</p>
                      <p className="leading-relaxed">{globalScanFeedback}</p>
                    </div>
                  </div>
                  {globalScanFeedbackType === 'error' && (
                    <button
                      type="button"
                      onClick={handleRetryScan}
                      className="shrink-0 px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-bold border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              )}

              {/* Recent Scans List (Last 5 successful scans this session) */}
              <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <ListChecks className="w-4 h-4 text-emerald-400" />
                    <span>Recent Scans (Current Session)</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded-full">
                    {recentScans.length} / 5 Logged
                  </span>
                </div>

                {recentScans.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2 text-center bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                    No students scanned yet this session. Align a QR code above to check in.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {recentScans.map((scan, idx) => (
                      <div
                        key={scan.id + idx}
                        className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-xs animate-fade-in"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center">
                            ✓
                          </span>
                          <div>
                            <p className="font-bold text-slate-100">{scan.studentName}</p>
                            <p className="text-[10px] text-slate-400">{scan.className}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400/90 font-medium bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/30">
                          {scan.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* General Operating instructions */}
              <div className="bg-slate-950/40 p-4 border border-slate-800/60 rounded-2xl space-y-2">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">
                  How to Log Student Entrance
                </span>
                <ol className="text-xs text-slate-400 list-decimal list-inside space-y-1 font-medium">
                  <li>Ask the student to open their portal and tap their pass to view fullscreen.</li>
                  <li>Position their QR Code 4-8 inches away from the active camera lens.</li>
                  <li>On recognition, a chime plays, attendance is recorded, and the student appears in Recent Scans.</li>
                </ol>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetryScan}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
                <button
                  onClick={() => setIsGlobalScannerOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex-1 text-center"
                >
                  Close Scanner Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK START GUIDE MODAL */}
      {showQuickStart && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl text-white space-y-6">
            <button
              onClick={() => setShowQuickStart(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold cursor-pointer transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight">QR Scanner Quick Start</h3>
                <p className="text-xs text-slate-400">Best practices for fast classroom attendance</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <strong className="text-slate-100 block mb-0.5">Select Your Course</strong>
                  <p className="text-slate-400">Choose the active lecture or lab period from the dropdown list before scanning.</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <strong className="text-slate-100 block mb-0.5">Fullscreen Student Pass</strong>
                  <p className="text-slate-400">Instruct students to tap the QR pass on their phone screen to enlarge it fullscreen with maximum brightness.</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <strong className="text-slate-100 block mb-0.5">Distance & Angle</strong>
                  <p className="text-slate-400">Hold the QR code 4 to 8 inches from your camera. Avoid severe screen glare or reflections.</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">4</span>
                <div>
                  <strong className="text-slate-100 block mb-0.5">Instant Verification</strong>
                  <p className="text-slate-400">You will hear an audio confirmation chime, and the check-in will immediately display under Recent Scans.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQuickStart(false);
                setIsGlobalScannerOpen(true);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer text-center"
            >
              Open QR Scanner Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
