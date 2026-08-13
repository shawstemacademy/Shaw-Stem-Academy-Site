import React from 'react';
import { ShieldCheck, BookOpen, FileText, CheckCircle2, Lock, UserCheck, GraduationCap, Award } from 'lucide-react';

interface ApplicationTransparencyNoticeProps {
  onNavigate?: (tab: string) => void;
}

export const ApplicationTransparencyNotice: React.FC<ApplicationTransparencyNoticeProps> = ({ onNavigate }) => {
  const handlePrivacyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('privacy');
    } else {
      window.location.href = '?tab=privacy';
    }
  };

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('terms');
    } else {
      window.location.href = '?tab=terms';
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border-2 border-blue-500/80 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-4 flex-1">
          <div>
            <span className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest block mb-1">
              Google API Verification &amp; Application Transparency Notice
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              APPLICATION PURPOSE &amp; AUTHENTICATION NOTICE
            </h2>
          </div>

          {/* Platform Purpose Introduction */}
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
            <p>
              The <strong className="text-slate-900 dark:text-slate-100 font-bold">Shaw STEM Academy</strong> online portal is a dedicated platform designed to manage STEM course catalogs, student profile registries, and term class registration for parents, students, and academic staff. Our portal provides a seamless digital experience to:
            </p>

            {/* 4 Core Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>Secure Student Portal</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                  Allows enrolled and prospective students to view active course resources, class schedules, and academic announcements in real time.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <Award className="w-4 h-4 shrink-0" />
                  <span>Class Registration &amp; Enrollments</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                  Enables parents to register students for multiple hands-on laboratory classes, track total tuition fees, and apply eligible bundle discounts.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Faculty &amp; Course Administration</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                  Empower teachers to publish lectures, syllabi, class files, and manage student attendance registries securely.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Academic Performance Tracking</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                  Aids school administrators in processing admissions and verifying course enrollment states securely inside our cloud database.
                </p>
              </div>
            </div>
          </div>

          {/* Google OAuth Disclosure Section */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2">
            <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Google OAuth Integration &amp; Security Disclosure</span>
            </p>
            <p className="leading-relaxed">
              We utilize <strong>Google Sign-In</strong> exclusively for secure user authentication. When you log in with your Google Account, we access only your basic profile information (such as your name, email address, and avatar). This is used to:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
              <li className="flex items-start gap-1.5 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Safely map your logged-in identity to your school role (Student, Faculty, or Admin).</span>
              </li>
              <li className="flex items-start gap-1.5 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Authorize access permissions for classrooms, dashboards, and office hours.</span>
              </li>
              <li className="flex items-start gap-1.5 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Prevent unauthorized account registrations and protect student academic data.</span>
              </li>
            </ul>
          </div>

          {/* Legal Governance Links */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your data is strictly used for portal access and is <strong>never shared with third parties</strong>.
            </p>
            <div className="flex items-center gap-4 text-xs font-bold">
              <a 
                href="?tab=privacy" 
                onClick={handlePrivacyClick} 
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Privacy Policy</span>
              </a>
              <a 
                href="?tab=terms" 
                onClick={handleTermsClick} 
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Terms of Service</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
