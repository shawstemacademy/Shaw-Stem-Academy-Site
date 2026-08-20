import React from 'react';
import { 
  ShieldCheck, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Lock, 
  UserCheck, 
  GraduationCap, 
  Award,
  Video,
  Calendar,
  Layers,
  Mail,
  ExternalLink
} from 'lucide-react';

interface ApplicationTransparencyNoticeProps {
  onNavigate?: (tab: string) => void;
}

export const ApplicationTransparencyNotice: React.FC<ApplicationTransparencyNoticeProps> = ({ onNavigate }) => {
  const handlePrivacyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('privacy');
    } else {
      window.location.hash = 'privacy';
    }
  };

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('terms');
    } else {
      window.location.hash = 'terms';
    }
  };

  return (
    <section 
      id="application-purpose"
      aria-label="Application Purpose and Google OAuth Transparency Notice"
      className="bg-white dark:bg-slate-900 border-2 border-blue-600/80 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start gap-5 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 dark:bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-2xs font-extrabold tracking-widest uppercase border border-blue-200 dark:border-blue-800">
            <span>Official Google OAuth Verification &amp; Compliance Disclosure</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            About Shaw STEM Academy &amp; Application Purpose
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Clear disclosure of application functionality, user roles, data handling, and Google account integrations.
          </p>
        </div>
      </div>

      {/* 1. Core Purpose of the Application */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">1</span>
          <span>Core Purpose of this Application</span>
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong>Shaw STEM Academy</strong> is an educational management portal and learning platform designed to streamline course registration, academic scheduling, classroom coordination, and student records for an accredited STEM institution. The application serves as the central digital hub connecting students, parents, instructors, and school administrators.
        </p>
      </div>

      {/* 2. Key Platform Features & Workflows */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">2</span>
          <span>Key Platform Modules &amp; Functionality</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Student &amp; Parent Portal</h4>
            <p className="text-2xs text-slate-600 dark:text-slate-400 leading-normal">
              Students and parents browse science, robotics, and engineering course offerings, complete enrollments, verify registration progress, and access student QR passes for campus check-in.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Timetable &amp; Schedule</h4>
            <p className="text-2xs text-slate-600 dark:text-slate-400 leading-normal">
              Interactive school timetables display weekly class schedules, lecture times, laboratory rooms, and instructor assignments across all STEM academic departments.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Video className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Google Classroom &amp; Meet</h4>
            <p className="text-2xs text-slate-600 dark:text-slate-400 leading-normal">
              Enrolled students can seamlessly access their assigned Google Classroom spaces, syllabus materials, and Google Meet virtual lectures directly from their student dashboard.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Faculty Administration</h4>
            <p className="text-2xs text-slate-600 dark:text-slate-400 leading-normal">
              Teachers and school administrators manage course rosters, update news announcements, process registration approvals, and maintain accurate attendance logs.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Google OAuth & Account Usage Disclosure */}
      <div className="space-y-3 p-5 sm:p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">3</span>
          <span>Google Sign-In &amp; User Data Usage Disclosure</span>
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Shaw STEM Academy uses <strong>Google Sign-In (OAuth 2.0)</strong> solely for secure user authentication and identity verification. When signing in with Google:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Identity Verification</span>
            </div>
            <p className="text-2xs text-slate-600 dark:text-slate-400">
              We verify your email address to link your profile to the correct student, parent, teacher, or administrative permissions.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Academic Data Security</span>
            </div>
            <p className="text-2xs text-slate-600 dark:text-slate-400">
              Ensures that sensitive educational records, student grades, and registration forms are only accessible to authorized accounts.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>No Third-Party Sharing</span>
            </div>
            <p className="text-2xs text-slate-600 dark:text-slate-400">
              User data is never sold, shared with advertising networks, or transferred to third-party data brokers under any circumstance.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Compliance, Privacy Policy, Terms & Contact */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Official Inquiries &amp; Developer Contact
          </p>
          <p className="text-2xs text-slate-500 dark:text-slate-400">
            For privacy inquiries or verification questions, contact the administrative office at{' '}
            <a href="mailto:shawstemacademy@gmail.com" className="font-semibold text-blue-600 dark:text-blue-400 underline">
              shawstemacademy@gmail.com
            </a>
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold shrink-0 flex-wrap">
          <a
            href="#privacy"
            onClick={handlePrivacyClick}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </a>
          <a
            href="#terms"
            onClick={handleTermsClick}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </a>
        </div>
      </div>
    </section>
  );
};
