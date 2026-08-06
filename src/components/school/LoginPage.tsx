import React, { useState } from 'react';
import { 
  LogIn, 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  Key, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  Mail, 
  Lock, 
  UserCheck,
  Shield,
  BookOpen,
  Zap,
  Info
} from 'lucide-react';
import { UserRole, StudentStatus, PortalTab, SchoolUser } from '../../types';
import { googleSignIn, saveDocToFirestore } from '../../lib/firebase';

interface LoginPageProps {
  onLoginProfile: (role: UserRole, studentStatus?: StudentStatus, userObj?: SchoolUser, targetTab?: PortalTab) => void;
  onNavigate: (tab: PortalTab) => void;
  schoolUsers: SchoolUser[];
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginProfile,
  onNavigate,
  schoolUsers = [],
}) => {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus>('enrolled_paid');
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [notFoundEmail, setNotFoundEmail] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoginMessage('Connecting to Google Authentication...');
      const result = await googleSignIn();
      if (result) {
        setLoginMessage('Google Authentication successful! Syncing profile to Firestore...');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setLoginMessage(`Domain Unauthorized: The domain "${domain}" is not authorized in your Firebase Console. Please add it to Authentication > Settings > Authorized Domains.`);
      } else if (err?.code === 'auth/popup-blocked') {
        setLoginMessage('Pop-up Blocked: Please enable pop-ups for this site, or open this app in a New Tab using the button in the top right of the editor to sign in with Google.');
      } else if (err?.code === 'auth/operation-not-supported-in-this-environment') {
        setLoginMessage('Environment Error: Pop-ups are not supported in this iframe. Please open this app in a New Tab using the button in the top right to sign in.');
      } else {
        setLoginMessage(`Google Sign-In Error: ${err?.message || 'Please try again.'}`);
      }
    }
  };

  const handleCreateNewUserInFirestore = async () => {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    setIsCreatingUser(true);
    setLoginMessage(`Creating profile for ${cleanEmail} in Firestore database ('schoolUsers' collection)...`);
    
    const sName = cleanEmail.split('@')[0].charAt(0).toUpperCase() + cleanEmail.split('@')[0].slice(1);
    const userId = `usr-${Date.now()}`;
    const newUser: SchoolUser = {
      id: userId,
      name: sName,
      email: cleanEmail,
      role: selectedRole,
      status: selectedRole === 'student' ? selectedStatus : 'active',
      department: selectedRole === 'student' ? 'Student Body' : 'General Faculty',
    };

    const savedId = await saveDocToFirestore('schoolUsers', newUser.id, newUser);
    setIsCreatingUser(false);
    
    if (savedId) {
      setNotFoundEmail(null);
      setLoginMessage(`✅ User Created Successfully! Saved profile for ${cleanEmail} (${selectedRole.toUpperCase()}) to Firestore with ID ${savedId}. Logging in...`);
      setTimeout(() => {
        const targetTab = 
          selectedRole === 'student'
            ? 'student-portal'
            : selectedRole === 'teacher' || selectedRole === 'hod'
            ? 'teacher-dashboard'
            : 'admin-dashboard';
        onLoginProfile(selectedRole, newUser.status || 'unverified', newUser, targetTab);
      }, 800);
    } else {
      setLoginMessage(`❌ Failed to save user ${cleanEmail} to Firestore. Please verify database rules or connection.`);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setNotFoundEmail(null);
    if (!email) {
      alert('Please enter a valid email address.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Attempt to match custom user from the database
    const matchedUser = schoolUsers.find(
      (u) => (u?.email || '').toLowerCase() === cleanEmail
    );

    if (matchedUser) {
      const resolvedRole = matchedUser.role;
      setLoginMessage(`Authenticated as ${matchedUser.name} (${resolvedRole.toUpperCase()})`);
      setTimeout(() => {
        const targetTab = 
          resolvedRole === 'student'
            ? 'student-portal'
            : resolvedRole === 'teacher' || resolvedRole === 'hod'
            ? 'teacher-dashboard'
            : 'admin-dashboard';
        onLoginProfile(resolvedRole, matchedUser.status || 'unverified', matchedUser, targetTab);
      }, 600);
      return;
    } else {
      setNotFoundEmail(cleanEmail);
      setLoginMessage(`No existing profile found in Firestore for "${cleanEmail}". Click below to create this user account now!`);
      return;
    }
  };

  const handleQuickLogin = (role: UserRole, status?: StudentStatus, userId?: string, targetTab?: PortalTab) => {
    const userObj = schoolUsers.find((u) => u.id === userId);
    const nameStr = userObj ? userObj.name : role === 'student' ? (status === 'enrolled_paid' ? 'Alex Morgan' : 'Jordan Lee') : 'Staff Member';
    
    setLoginMessage(`Logging in as ${nameStr} (${role.toUpperCase()})...`);

    setTimeout(() => {
      onLoginProfile(role, status, userObj, targetTab);
    }, 400);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Page Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Key className="w-3.5 h-3.5" />
            <span>Shaw STEM Academy • Portal Access & Test Profiles</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Single Sign-On & Interactive Role Testing
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Select a pre-configured <strong className="text-white">Test User Profile</strong> below to instantly inspect the platform through the lens of an Enrolled Student, Prospective Registrant, Department Chair, STEM Teacher, or Administrator.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 pt-2">
            <span className="flex items-center gap-1.5 text-blue-300">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              Instant Role Switching
            </span>
            <span className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Real Permission Enforcement
            </span>
            <span className="flex items-center gap-1.5 text-purple-300">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Full Dashboard Navigation
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Toast / Error Banner */}
      {loginMessage && (() => {
        const isError = notFoundEmail || 
          loginMessage.toLowerCase().includes('error') || 
          loginMessage.toLowerCase().includes('unauthorized') || 
          loginMessage.toLowerCase().includes('blocked') || 
          loginMessage.toLowerCase().includes('failed') || 
          loginMessage.toLowerCase().includes('not found') || 
          loginMessage.includes('❌');

        return (
          <div className={`p-5 font-medium text-sm rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border animate-fade-in ${
            notFoundEmail 
              ? 'bg-amber-900/95 border-amber-500 text-amber-100 shadow-amber-950/40' 
              : isError 
              ? 'bg-rose-900/95 border-rose-500 text-rose-100 shadow-rose-950/40' 
              : 'bg-emerald-900/95 border-emerald-500 text-emerald-100 shadow-emerald-950/40'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{isError ? '⚠️' : '⚡'}</span>
              <div className="space-y-1">
                <p className="font-bold text-base leading-tight">
                  {isError ? 'Authentication Warning' : 'Authentication Status'}
                </p>
                <p className="text-xs leading-relaxed opacity-90">{loginMessage}</p>
              </div>
            </div>
            {notFoundEmail ? (
              <button
                onClick={handleCreateNewUserInFirestore}
                disabled={isCreatingUser}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 self-end sm:self-center"
              >
                {isCreatingUser ? 'Creating in Firestore...' : `⚡ Create ${selectedRole.toUpperCase()} Profile in Firestore`}
              </button>
            ) : (
              <button
                onClick={() => setLoginMessage(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-xs font-bold transition-all cursor-pointer opacity-70 hover:opacity-100 self-end sm:self-center"
              >
                ✕
              </button>
            )}
          </div>
        );
      })()}

      {/* Quick Access Test Profiles Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span>Quick Access Test Profiles</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Click any profile button to bypass authentication and jump straight into that user's view.
            </p>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* PROFILE 1: Enrolled Student */}
          <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl -mr-6 -mt-6" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-extrabold border border-blue-200 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Student • Enrolled & Paid
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Grade 10</span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Alex Morgan"
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Alex Morgan</h3>
                  <p className="text-xs text-slate-500">alex.morgan@student.edu</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                <strong>View Capabilities:</strong> Enrolled in Robotics & Python AI. Can access Zoom links, download Arduino schematics, view teacher announcements, and check lab assignment schedules.
              </p>
            </div>

            <button
              onClick={() => handleQuickLogin('student', 'enrolled_paid', undefined, 'student-portal')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 group-hover:bg-blue-700"
            >
              <span>Test Enrolled Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* PROFILE 2: Prospective Student */}
          <div className="bg-white rounded-2xl border border-sky-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 text-[11px] font-extrabold border border-sky-200 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Student • Prospective
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Grade 8</span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"
                  alt="Jordan Lee"
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Jordan Lee</h3>
                  <p className="text-xs text-slate-500">jordan.lee@gmail.com</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                <strong>View Capabilities:</strong> Exploring Fall 2026 course catalog, testing multi-class bundle discounts (10%-15% off), and submitting class registration forms.
              </p>
            </div>

            <button
              onClick={() => handleQuickLogin('student', 'prospective', undefined, 'registration')}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Test Registration Form View</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* PROFILE 3: Teacher - STEM Chair */}
          <div className="bg-white rounded-2xl border border-purple-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-[11px] font-extrabold border border-purple-200 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Teacher • STEM Chair
                </span>
                <span className="text-[10px] font-bold text-purple-600 uppercase">Dept Chair</span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Dr. Marcus Vance"
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Dr. Marcus Vance</h3>
                  <p className="text-xs text-slate-500">Chair of Applied Robotics</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                <strong>View Capabilities:</strong> Teacher Dashboard access. Manage Robotics Lab worksheets, upload Arduino circuit schematics, edit course details, and broadcast urgent announcements.
              </p>
            </div>

            <button
              onClick={() => handleQuickLogin('hod', undefined, 't-marcus', 'teacher-dashboard')}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Test Teacher Dashboard (Dr. Vance)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* PROFILE 4: Teacher - AI Instructor */}
          <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-extrabold border border-indigo-200 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Teacher • AI Instructor
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Coding & AI</span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                  alt="Sarah Jenkins"
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Sarah Jenkins, M.Sc.</h3>
                  <p className="text-xs text-slate-500">Lead AI & Python Instructor</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                <strong>View Capabilities:</strong> Access Python & AI course materials, upload Jupyter Notebook zip files, and monitor student lab enrollment lists.
              </p>
            </div>

            <button
              onClick={() => handleQuickLogin('teacher', undefined, 't-sarah', 'teacher-dashboard')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Test Teacher View (Sarah Jenkins)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* PROFILE 5: Administrator - Dean */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin • School Dean
                </span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Governance</span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
                  alt="Director Arthur Shaw"
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Director Arthur Shaw</h3>
                  <p className="text-xs text-slate-500">Dean of Academy Operations</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                <strong>View Capabilities:</strong> Admin Dashboard. Manage teachers & admins, create departments, configure tuition discount rules, and execute Google Workspace Form OAuth exports.
              </p>
            </div>

            <button
              onClick={() => handleQuickLogin('admin', undefined, 'adm-1', 'admin-dashboard')}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Test Admin Dashboard (Director Shaw)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* PROFILE 6: Administrator - Registrar */}
          <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 text-[11px] font-extrabold border border-teal-200 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Admin • Registrar
                </span>
                <span className="text-[10px] font-bold text-teal-600 uppercase">Admissions</span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
                  alt="Clara Rodriguez"
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Clara Rodriguez</h3>
                  <p className="text-xs text-slate-500">Senior Academy Registrar</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                <strong>View Capabilities:</strong> Access student registration logs, audit revenue figures, manage parent communications, and assign faculty to departments.
              </p>
            </div>

            <button
              onClick={() => handleQuickLogin('registrar', undefined, 'adm-2', 'admin-dashboard')}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Test Registrar View (Clara)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Credentials Form Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-2xl mx-auto space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-blue-600" />
            <span>Sign In to Student & Staff Portal</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose Google Authentication or enter your email and password below.
          </p>
        </div>

        {/* Google Authentication Option */}
        <div className="space-y-3 pb-2 border-b border-slate-100">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-2xl border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-3 hover:border-slate-400 group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or sign in with email</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
        </div>

        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Role View *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedRole === 'student'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('teacher')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedRole === 'teacher'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('hod')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedRole === 'hod'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Head of Dept
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedRole === 'admin'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Administrator
              </button>
            </div>
          </div>

          {selectedRole === 'student' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Status *
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as StudentStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="prospective">Prospective (Application View)</option>
                <option value="awaiting_acceptance">Awaiting Acceptance</option>
                <option value="accepted">Accepted (Ready for Course Selection)</option>
                <option value="pending_verification">Awaiting Verification</option>
                <option value="enrolled_paid">Paid & Enrolled (Full Portal Access)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder={
                  selectedRole === 'student'
                    ? 'alex.morgan@student.edu'
                    : selectedRole === 'teacher'
                    ? 'm.vance@shawstemacademy.edu'
                    : 'a.shaw@shawstemacademy.edu'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Demo Mode: Password verification is bypassed for easy testing.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Dashboard</span>
          </button>
        </form>
      </div>
    </div>
  );
};
