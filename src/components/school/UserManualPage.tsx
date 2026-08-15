import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  QrCode, 
  DollarSign, 
  Settings, 
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Key
} from 'lucide-react';
import { PortalTab, UserRole, SchoolUser } from '../../types';

// Generated image assets
import userManualHero from '../../assets/images/user_manual_hero_1786765463134.jpg';
import portalWorkflowDiagram from '../../assets/images/portal_workflow_diagram_1786765480756.jpg';

interface UserManualPageProps {
  userRole?: UserRole;
  loggedInUser?: SchoolUser | null;
  onNavigate: (tab: PortalTab) => void;
  embedInAdminDashboard?: boolean;
}

export const UserManualPage: React.FC<UserManualPageProps> = ({ 
  userRole, 
  loggedInUser, 
  onNavigate,
  embedInAdminDashboard = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Compute allowed role sections based on current user role & explicit custom permissions
  const permittedRoles = useMemo<('student' | 'teacher' | 'registrar' | 'admin')[]>(() => {
    const effectiveRole = loggedInUser?.role || userRole || 'student';
    const rolesSet = new Set<'student' | 'teacher' | 'registrar' | 'admin'>();

    if (effectiveRole === 'admin') {
      // Admin gets FULL access to the ENTIRE manual across all 4 role sections!
      return ['student', 'teacher', 'registrar', 'admin'];
    }

    if (effectiveRole === 'registrar') {
      rolesSet.add('registrar');
    } else if (effectiveRole === 'teacher') {
      rolesSet.add('teacher');
    } else if (effectiveRole === 'hod') {
      rolesSet.add('teacher');
      rolesSet.add('admin'); // HOD has department supervision privileges
    } else {
      rolesSet.add('student'); // Default student access
    }

    // Check custom expanded permissions
    const perms = loggedInUser?.permissions || [];
    if (perms.includes('manage_users') || perms.includes('manage_departments') || perms.includes('manage_curriculum') || perms.includes('manage_form_options')) {
      rolesSet.add('admin');
    }
    if (perms.includes('export_forms') || perms.includes('manage_discounts')) {
      rolesSet.add('registrar');
    }
    if (perms.includes('upload_resources') || perms.includes('post_announcements') || perms.includes('assign_staff')) {
      rolesSet.add('teacher');
    }

    return Array.from(rolesSet);
  }, [loggedInUser, userRole]);

  const isAdmin = permittedRoles.includes('admin') && permittedRoles.length === 4;

  const [activeRoleFilter, setActiveRoleFilter] = useState<'all' | 'student' | 'teacher' | 'registrar' | 'admin'>('all');

  const guideSections = [
    {
      id: 'student-guide',
      role: 'student' as const,
      title: 'Student & Applicant Manual',
      icon: GraduationCap,
      color: 'bg-blue-600 text-blue-600 border-blue-200',
      description: 'Complete guide for prospective applicants and enrolled students navigating course registration, schedules, and gradebooks.',
      steps: [
        {
          stepNumber: '01',
          title: 'Submitting a Course Registration Application',
          details: 'Navigate to the Registration tab. Complete the 5-part student profile form (Personal Info, Parent/Guardian Contact, School Grade Level, Class Selection, and SBA Hub Options). The tuition total calculates instantly with multi-course discount rules automatically applied. Submit to receive your registration reference ID and pending review status.'
        },
        {
          stepNumber: '02',
          title: 'Accessing the Student Portal & Digital QR Pass',
          details: 'Log in using your registered email. In the Student Portal, view your active course schedule, venue room numbers, teacher assignments, and your dynamic digital QR Student Pass used for live campus attendance scanning.'
        },
        {
          stepNumber: '03',
          title: 'Reviewing Grades & Academic Progress',
          details: 'Click on the "Grades" or "Academic Progress" tab inside the Student Portal to view verified grades posted by your instructors or imported from Google Classroom. View real-time assignment scores, percentage trends, and letter grade breakdowns.'
        },
        {
          stepNumber: '04',
          title: 'Course Add / Drop Requests',
          details: 'If you need to change your enrolled classes during the add/drop window, open the "Add / Drop Courses" tab in the Student Portal, select the course to drop or add, state your reason, and submit for Administrator review.'
        }
      ]
    },
    {
      id: 'teacher-guide',
      role: 'teacher' as const,
      title: 'Faculty & Instructor Manual',
      icon: Briefcase,
      color: 'bg-emerald-600 text-emerald-600 border-emerald-200',
      description: 'Step-by-step instructions for teachers managing QR attendance scanning, posting assignment grades, and submitting hourly teaching claims.',
      steps: [
        {
          stepNumber: '01',
          title: 'Camera QR Attendance Scanner',
          details: 'Open the Teacher Dashboard and select the "Camera Scanner" tab. Point your camera at a student\'s digital QR pass. The system instantly verifies student enrollment, records timestamped attendance in Firestore, and triggers audio and visual confirmations.'
        },
        {
          stepNumber: '02',
          title: 'Managing Gradebooks & Classroom CSV Imports',
          details: 'In the Teacher Dashboard "Gradebook" tab, select a course to record individual assignment scores manually or upload Google Classroom CSV grade sheet exports to sync grades across multiple students simultaneously.'
        },
        {
          stepNumber: '03',
          title: 'Resource Library & Syllabus Sharing',
          details: 'Upload course syllabi, lab project worksheets, and PDF learning materials in the "Course Resources" section. Files are automatically categorized by department and made accessible to enrolled students.'
        },
        {
          stepNumber: '04',
          title: 'Submitting Hourly Teaching Claims',
          details: 'Navigate to the "Teaching Claims" tab to log taught class hours. Select the course, date, start/end times, and duration. The system computes your payout based on your assigned hourly rate and submits the claim to the Registrar or Admin for approval.'
        }
      ]
    },
    {
      id: 'registrar-guide',
      role: 'registrar' as const,
      title: 'Registrar & Admissions Manual',
      icon: ShieldCheck,
      color: 'bg-amber-600 text-amber-600 border-amber-200',
      description: 'Guide for admissions personnel verifying student applications, recording tuition payments, and issuing official receipts.',
      steps: [
        {
          stepNumber: '01',
          title: 'Reviewing Student Registration Directory',
          details: 'Access the Student Directory (Student Search Dashboard) under the Registrar or Admin view. Filter applicants by grade level, registration status, or tuition payment state.'
        },
        {
          stepNumber: '02',
          title: 'Recording Tuition Payments & Verification',
          details: 'Select a student record and navigate to the "Tuition & Financials" tab. Log full or partial cash/bank payments. Logging tuition automatically updates the student status to "Verified Paid" and triggers an instant enrollment confirmation notification.'
        },
        {
          stepNumber: '03',
          title: 'Generating & Printing Registration Receipts',
          details: 'Click "View Official Receipt" on any verified student record to open the formatted, printable Shaw STEM Academy tuition receipt containing line-item course breakdown, applied discounts, payment transaction log, and official stamp.'
        }
      ]
    },
    {
      id: 'admin-guide',
      role: 'admin' as const,
      title: 'System Administrator Governance Manual',
      icon: Settings,
      color: 'bg-purple-600 text-purple-600 border-purple-200',
      description: 'Comprehensive administrative oversight controls for course banking, role permissions, custom form fields, and audit logs.',
      steps: [
        {
          stepNumber: '01',
          title: 'Course Bank & Schedule Clash Detection',
          details: 'Manage courses, tuition pricing, max capacities, and room assignments in the Course Bank Manager. Use the automatic Schedule Clash Matrix tool to detect time overlap conflicts across teachers or venues before finalizing the master schedule.'
        },
        {
          stepNumber: '02',
          title: 'User Management & Role Permissions Matrix',
          details: 'Create, edit, or disable user accounts (Students, Teachers, Department Heads, Registrars, Admins). Customize granular permissions per role using the Role Permissions Matrix to grant or restrict access to claims, gradebooks, or system settings.'
        },
        {
          stepNumber: '03',
          title: 'Form Fields & Registration Customization',
          details: 'Use the Form Fields Editor to toggle optional/required registration inputs, customize field labels, or configure grade level dropdown options (e.g., Grade 7–13, Form 1–5, CAPE Units).'
        },
        {
          stepNumber: '04',
          title: 'Push Notifications & System Action Audit Logs',
          details: 'Broadcast real-time push announcements to all users, specific classes, or individual staff members. Inspect the System Action Audit Logs to track real-time security, grade changes, and registration modifications.'
        }
      ]
    }
  ];

  const faqList = [
    {
      q: 'How do I know if a student enrollment is officially confirmed?',
      a: 'A student enrollment is officially confirmed when their status changes to "Verified Paid" in the Student Directory upon tuition payment recording or course release by the Registrar or Administrator. The student will also receive a push confirmation notification.'
    },
    {
      q: 'Can a teacher grade a student who is not enrolled in their course?',
      a: 'No. Gradebook entries and Google Classroom CSV imports match students strictly by their registered email addresses and verified course enrollments.'
    },
    {
      q: 'How does the automated Schedule Clash Detection work?',
      a: 'The Clash Matrix compares course schedules by day, start/end times, assigned instructor, and venue location. Any overlapping timeslots for the same instructor or room will flag a high-priority schedule clash with exact details.'
    },
    {
      q: 'How are push notifications configured for mobile and desktop devices?',
      a: 'Push notifications utilize Firebase Cloud Messaging (FCM). When users log in, they are prompted to allow browser notification permissions. Admins can test and broadcast messages from the Admin Dashboard.'
    }
  ];

  // Filter sections strictly to permitted roles for this user
  const visibleSections = guideSections.filter(sec => permittedRoles.includes(sec.role));

  const filteredSections = visibleSections.filter(section => {
    const matchesFilter = activeRoleFilter === 'all' || section.role === activeRoleFilter;
    const matchesSearch = !searchQuery || 
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.steps.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 pb-16 ${embedInAdminDashboard ? 'py-2' : ''}`}>
      {/* Hero Banner with Generated Illustration */}
      {!embedInAdminDashboard && (
        <div className="relative bg-slate-900 text-white overflow-hidden border-b border-slate-800 rounded-3xl mb-8">
          <div className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: `url(${userManualHero})` }} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Official System Usage Manual</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Shaw STEM Academy <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Operations Manual</span>
                </h1>
                <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                  {isAdmin ? (
                    'Full System Administrator Access — Complete documentation covering Students, Faculty, Admissions Registrars, and Administrative Governance.'
                  ) : (
                    `Tailored manual view for your assigned role (${(loggedInUser?.role || userRole || 'Student').toUpperCase()}). Content is dynamically adjusted based on your active system permissions.`
                  )}
                </p>

                {/* Search Control */}
                <div className="relative max-w-xl">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search manual (e.g. gradebook, QR pass, tuition receipt, clash detection)..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xl"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 hidden lg:block">
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl group">
                  <img 
                    src={userManualHero} 
                    alt="Shaw STEM Academy Portal User Manual Hero" 
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-3 left-3 right-3 text-xs font-semibold text-white/90 bg-slate-900/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
                    <span>⚡ Live Operational Manual</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase">
                      {permittedRoles.length} / 4 Roles Unlocked
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Role Access Security Status Banner */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isAdmin ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAdmin ? 'System Administrator Full Manual View' : `Role-Tailored Manual (${(loggedInUser?.role || userRole || 'student').toUpperCase()})`}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                  {permittedRoles.length} Module{permittedRoles.length > 1 ? 's' : ''} Accessible
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAdmin 
                  ? 'You are logged in as a System Administrator. The entire manual across all 4 role domains is unlocked.'
                  : 'Your view is strictly tailored to your assigned role and granted permissions. Additional sections unlock automatically if role privileges expand.'
                }
              </p>
            </div>
          </div>

          {/* Role Filter Tabs (If user has access to > 1 section) */}
          {permittedRoles.length > 1 && (
            <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-700/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-600 shrink-0">
              <button
                onClick={() => setActiveRoleFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeRoleFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                All Allowed
              </button>
              {permittedRoles.includes('student') && (
                <button
                  onClick={() => setActiveRoleFilter('student')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    activeRoleFilter === 'student'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student</span>
                </button>
              )}
              {permittedRoles.includes('teacher') && (
                <button
                  onClick={() => setActiveRoleFilter('teacher')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    activeRoleFilter === 'teacher'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Teacher</span>
                </button>
              )}
              {permittedRoles.includes('registrar') && (
                <button
                  onClick={() => setActiveRoleFilter('registrar')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    activeRoleFilter === 'registrar'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Registrar</span>
                </button>
              )}
              {permittedRoles.includes('admin') && (
                <button
                  onClick={() => setActiveRoleFilter('admin')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    activeRoleFilter === 'admin'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* System Architecture & Workflow Diagram (Only visible to Admin or users with multi-role access) */}
        {permittedRoles.length >= 2 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="max-w-3xl mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>System Architecture Overview</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Integrated Operational Lifecycle Diagram
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 leading-relaxed">
                Shaw STEM Academy connects all school operations into a single authoritative Firestore database environment. Below is the full lifecycle from prospective student application to verification, course grading, and governance.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                  <img 
                    src={portalWorkflowDiagram} 
                    alt="Shaw STEM Academy Portal Workflow Architecture" 
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 space-y-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs mb-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>1. Registration & Discount Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Applicants submit multi-course registrations. Dynamic discount rules calculate automatic tuition reductions in real time.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span>2. Registrar Payment Verification</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Registrars inspect applications in the Student Search Directory, log cash or online payments, and automatically transition students to "Verified Paid".
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs mb-1">
                    <QrCode className="w-4 h-4" />
                    <span>3. Camera QR Attendance & Gradebooks</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Instructors scan digital QR passes via live camera for instant attendance logging and post assignment grades or import CSV grade sheets.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-purple-600 font-bold text-xs mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>4. Governance & Audit Logging</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Admins enforce role permission matrices, monitor schedule clashes, configure custom registration fields, and review real-time audit logs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Permitted Role Walkthrough Sections */}
        <div className="space-y-8">
          {filteredSections.map((sec) => {
            const IconComp = sec.icon;
            return (
              <div 
                key={sec.id} 
                id={sec.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xs transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border ${sec.color} bg-opacity-10`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {sec.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {sec.description}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                    {sec.role} Guide
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {sec.steps.map((step, idx) => (
                    <div 
                      key={idx}
                      className="p-5 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-slate-300 dark:text-slate-600">
                          {step.stepNumber}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-slate-400" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {step.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Troubleshooting & System FAQ */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span>System FAQ & Operational Guidelines</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Common operational questions and security rules for Shaw STEM Academy.
            </p>
          </div>

          <div className="space-y-3">
            {faqList.map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="w-full p-4 text-left font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="p-4 pt-0 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-700/60 mt-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
