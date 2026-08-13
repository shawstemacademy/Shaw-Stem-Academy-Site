import React from 'react';
import { User } from 'firebase/auth';
import { 
  GraduationCap, 
  Cpu, 
  BookOpen, 
  FileText, 
  Users, 
  ShieldCheck, 
  Calculator, 
  Settings2,
  User as UserIcon,
  LogOut,
  Bell,
  BellOff,
  Sun,
  Moon
} from 'lucide-react';
import { PortalTab, UserRole, StudentStatus, SchoolUser } from '../../types';

interface SchoolHeaderNavProps {
  activeTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  studentStatus: StudentStatus;
  onChangeStudentStatus: (status: StudentStatus) => void;
  runningTotal: number;
  classCount: number;
  user: User | null;
  loggedInUser?: SchoolUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenDiscountConfig: () => void;
  onOpenGoogleExport: () => void;
  themeMode: 'light' | 'dark';
  onToggleThemeMode: () => void;
  logoUrl?: string;
}

export const SchoolHeaderNav: React.FC<SchoolHeaderNavProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
  onChangeRole,
  studentStatus,
  onChangeStudentStatus,
  runningTotal,
  classCount,
  user,
  loggedInUser,
  onSignIn,
  onSignOut,
  onOpenDiscountConfig,
  onOpenGoogleExport,
  themeMode,
  onToggleThemeMode,
  logoUrl,
}) => {
  const [notifPerm, setNotifPerm] = React.useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleToggleNotifications = async () => {
    if (typeof Notification === 'undefined') {
      alert("System notifications are not supported by this browser.");
      return;
    }
    
    const { requestNotificationPermission, sendDesktopNotification } = await import('../../lib/notifications');
    const perm = await requestNotificationPermission();
    setNotifPerm(perm);

    if (perm === 'granted') {
      await sendDesktopNotification(
        "🔔 Notifications Activated!",
        "You have enabled high-priority desktop notifications for Shaw STEM Academy."
      );
    } else if (perm === 'denied') {
      alert("Notifications have been blocked. Please click the padlock or settings icon next to the URL bar in your browser to change permissions to 'Allow' and receive live portal updates.");
    }
  };

  // Resolve current user display name and role
  const resolvedUserName = loggedInUser 
    ? loggedInUser.name 
    : user 
    ? (user.displayName || user.email || 'Authenticated User') 
    : currentRole === 'teacher' 
    ? 'Dr. Marcus Vance' 
    : currentRole === 'hod'
    ? 'Dr. Marcus Vance'
    : currentRole === 'admin' 
    ? 'Director Arthur Shaw' 
    : currentRole === 'registrar'
    ? 'Clara Rodriguez'
    : studentStatus === 'enrolled_paid' 
    ? 'Student User' 
    : studentStatus === 'unverified'
    ? 'Leo Sterling'
    : 'Guest Student';

  const resolvedRole = loggedInUser?.role || currentRole;

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'registrar':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'teacher':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'hod':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'student':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const allTabs: { id: PortalTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'academics', label: 'Academics & Labs', icon: <Cpu className="w-4 h-4" /> },
    { id: 'admissions', label: 'School Registration', icon: <FileText className="w-4 h-4" /> },
    { 
      id: 'registration', 
      label: 'Class Registration', 
      icon: <FileText className="w-4 h-4" />,
      badge: ((!!user || !!loggedInUser) && (loggedInUser?.role || currentRole) === 'student') && classCount > 0 ? `$${runningTotal.toFixed(0)}` : undefined 
    },
    { id: 'student-portal', label: 'Student Portal', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'teacher-dashboard', label: 'Teacher Dashboard', icon: <Users className="w-4 h-4" /> },
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  // Filter visible tabs based on user role and enrollment payment status
  const visibleTabs = allTabs.filter((tab) => {
    const isLoggedIn = !!user || !!loggedInUser;
    
    // Class Registration and Admissions visible to students, admin, registrar (hidden for teachers)
    if (tab.id === 'registration') {
      const isStudent = (loggedInUser?.role || currentRole) === 'student';
      if (isStudent) {
        if (!isLoggedIn) {
          return false;
        }
        const status = loggedInUser?.status || studentStatus;
        if (status !== 'accepted' && status !== 'enrolled_paid') {
          return false;
        }
      }
      return currentRole !== 'teacher' && currentRole !== 'hod';
    }
    if (tab.id === 'admissions') {
      if (isLoggedIn) {
        return false;
      }
      return currentRole !== 'teacher' && currentRole !== 'hod';
    }
    // Everyone sees Home, Academics
    if (tab.id === 'home' || tab.id === 'academics') {
      return true;
    }
    // Student Portal is visible to all logged-in users
    if (tab.id === 'student-portal') {
      return isLoggedIn;
    }
    // Teacher Dashboard is visible to Teachers, HODs, and Admins
    if (tab.id === 'teacher-dashboard') {
      return currentRole === 'teacher' || currentRole === 'hod' || currentRole === 'admin';
    }
    // Admin Dashboard is visible to Admins and Registrars
    if (tab.id === 'admin-dashboard') {
      return currentRole === 'admin' || currentRole === 'registrar';
    }
    return true;
  });

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      {/* Top Banner: Branding & Current Logged-In User Header Info */}
      <div className="border-b border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* School Name & Motto */}
          <div className="flex items-center gap-3">
            <img 
              src={logoUrl || "/logo.png"} 
              alt="Shaw STEM Academy" 
              className="w-8 h-8 rounded-lg object-contain bg-slate-950 p-0.5 border border-slate-800"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-sm">
                Shaw STEM Academy
              </span>
              <div className="hidden sm:flex items-center gap-2 text-slate-400 font-medium">
                <span>• Innovate • Explore • Lead</span>
                <span>•</span>
                <a href="?tab=privacy" onClick={(e) => { e.preventDefault(); onSelectTab('privacy'); }} className="hover:text-blue-400 transition-colors">Privacy Policy</a>
                <span>•</span>
                <a href="?tab=terms" onClick={(e) => { e.preventDefault(); onSelectTab('terms'); }} className="hover:text-blue-400 transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>

          {/* Top Right User Profile & Logout Button */}
          <div className="flex items-center gap-2">
            {/* Desktop Notification Toggle Icon */}
            <button
              onClick={handleToggleNotifications}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center relative ${
                notifPerm === 'granted'
                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20'
                  : notifPerm === 'denied'
                  ? 'bg-slate-800/50 border-slate-700/40 text-slate-500 opacity-60'
                  : 'bg-amber-600/10 border-amber-500/30 text-amber-400 hover:bg-amber-600/20'
              }`}
              title={
                notifPerm === 'granted'
                  ? 'Desktop Notifications Enabled'
                  : notifPerm === 'denied'
                  ? 'Notifications Blocked by Browser'
                  : 'Click to Enable Desktop Notifications'
              }
            >
              {notifPerm === 'granted' ? (
                <Bell className="w-4 h-4 text-blue-400 animate-bounce" style={{ animationIterationCount: 1, animationDuration: '1s' }} />
              ) : (
                <BellOff className="w-4 h-4 text-slate-400" />
              )}
              {notifPerm === 'default' && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleThemeMode}
              className="p-2 rounded-xl border border-slate-700/40 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
              title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {themeMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-400" />
              )}
            </button>

            {!loggedInUser && !user ? (
              <button
                onClick={onSignIn}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 border border-blue-400/30"
              >
                <span>Log In</span>
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-full text-xs shadow-xs">
                  {loggedInUser?.avatar ? (
                    <img 
                      src={loggedInUser.avatar} 
                      alt={resolvedUserName} 
                      className="w-5 h-5 rounded-full object-cover border border-slate-700" 
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                  <span className="font-bold text-white text-xs truncate max-w-[130px] sm:max-w-none">
                    {resolvedUserName}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getRoleBadgeStyle(resolvedRole)} uppercase tracking-wider`}>
                    {resolvedRole}
                  </span>
                </div>

                <button
                  onClick={onSignOut}
                  className="px-2.5 py-1 bg-slate-800/90 hover:bg-rose-600/20 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
                  title="Sign out of current account"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-300" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4 overflow-x-auto">
        <nav className="flex items-center gap-1">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Running Total Indicator (visible for non-teachers) */}
          {((!!user || !!loggedInUser) && (loggedInUser?.role || currentRole) === 'student') && (
            <button
              onClick={() => onSelectTab('registration')}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-full text-xs transition-colors"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Total:</span>
              <span className="font-extrabold text-white">${runningTotal.toFixed(2)}</span>
              <span className="text-[11px] text-slate-500">({classCount})</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
