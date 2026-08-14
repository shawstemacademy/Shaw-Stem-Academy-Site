import React from 'react';
import { FileText, Shield, UserCheck, Lock, Award, AlertCircle, Mail, BookOpen, CheckCircle } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  const sections = [
    {
      id: 'agreement',
      title: '1. Agreement to Terms',
      icon: <FileText className="w-5 h-5 text-indigo-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            By accessing or using the Shaw STEM Academy web portal (accessible at this application URL), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
          <p>
            These terms apply to all visitors, registered students, parents, guardians, faculty members, and administrative staff who access or use the Service.
          </p>
        </div>
      )
    },
    {
      id: 'services',
      title: '2. Description of Application & Services',
      icon: <BookOpen className="w-5 h-5 text-purple-500" />,
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            Shaw STEM Academy provides a digital educational management and academic learning platform for students, parents, faculty, and administrative staff. Key platform capabilities include:
          </p>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
              <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Course Catalog & Syllabi:</strong> Browsing STEM courses, laboratory schedules, and department curriculum outlines.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
              <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Admissions & Registration:</strong> Managing student profiles, submitting registration details, and processing course enrollments.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
              <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Student Portal:</strong> Accessing real-time class announcements, digital attendance QR passes, and downloadable learning resources.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
              <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Faculty & Registrar Systems:</strong> Managing class rosters, syllabus materials, and automated QR attendance verification.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'accounts',
      title: '3. User Accounts & Authentication',
      icon: <UserCheck className="w-5 h-5 text-emerald-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            To access certain features of the platform, you may be required to register for an account using Google Sign-In or verified email credentials.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Account Responsibilities:</p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <li>Maintain the confidentiality of your credentials and sign-in session.</li>
              <li>Promptly notify the administration of any unauthorized access to your account.</li>
              <li>Ensure all submitted enrollment and contact information is accurate, true, and up-to-date.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'oauth',
      title: '4. Use of Google OAuth Services',
      icon: <Lock className="w-5 h-5 text-amber-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            When you sign in using Google OAuth, we access your basic profile information (such as name, email address, and profile picture) strictly for user authentication, access control, and account identification within the portal.
          </p>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p>
              We do not sell, rent, or use your Google account information for third-party advertising or marketing purposes. Access tokens are used exclusively to secure your session.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'consent',
      title: '5. Student & Parental Consent',
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            Registration of minor students must be completed or authorized by a parent or legal guardian. Users agree to provide accurate and truthful information during enrollment.
          </p>
          <p>
            Parents and guardians retain the right to review, update, or request the deletion of their child's educational records and profile data at any time by contacting our admissions office.
          </p>
        </div>
      )
    },
    {
      id: 'ip',
      title: '6. Intellectual Property',
      icon: <Award className="w-5 h-5 text-rose-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            All educational materials, lab schematics, syllabus content, logos, examination documents, and software code published on this platform are the property of Shaw STEM Academy or its licensors.
          </p>
          <p>
            Students and authorized users are granted a non-exclusive, revocable license to view and download materials for personal educational use only. Unauthorized redistribution or commercial exploitation is strictly prohibited.
          </p>
        </div>
      )
    },
    {
      id: 'liability',
      title: '7. Limitation of Liability',
      icon: <AlertCircle className="w-5 h-5 text-slate-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            Shaw STEM Academy shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our platform or educational services.
          </p>
          <p>
            We strive to provide reliable and uninterrupted service, but do not warrant that the platform will always be error-free or free from temporary scheduled maintenance downtime.
          </p>
        </div>
      )
    },
    {
      id: 'contact',
      title: '8. Contact Us',
      icon: <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>If you have any questions or concerns regarding these Terms of Service, please contact our administrative team:</p>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Shaw STEM Academy Administration</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Official Inquiries & Support</p>
            </div>
            <a
              href="mailto:shawstemacademy@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>shawstemacademy@gmail.com</span>
            </a>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-center sm:text-left space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
            <p className="text-purple-200/80 font-medium text-sm">Last updated: August 13, 2026</p>
            <p className="text-xs text-slate-400 max-w-xl">
              Please read these terms carefully before using the Shaw STEM Academy academic portal.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Anchor Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Jump to:</span>
        {sections.map((sec) => (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
          >
            {sec.title.split('. ')[1] || sec.title}
          </a>
        ))}
      </div>

      {/* Structured Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-24 transition-all hover:border-purple-200 dark:hover:border-purple-900/50"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                {section.icon}
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {section.title}
              </h2>
            </div>
            {section.content}
          </div>
        ))}
      </div>
    </div>
  );
};
