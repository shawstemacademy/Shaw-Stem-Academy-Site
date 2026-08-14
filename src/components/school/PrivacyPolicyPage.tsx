import React from 'react';
import { Shield, Lock, Eye, Database, Smartphone, UserX, Globe, HelpCircle, Mail, CheckCircle2, Clock, FileCheck } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const sections = [
    {
      id: 'overview',
      title: '1. Overview & Scope',
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            This Privacy Policy describes Our policies and procedures on the collection, use, and disclosure of Your information when You use the Shaw STEM Academy Service and informs You about Your privacy rights and legal protections.
          </p>
          <p>
            We use Your Personal Data to provide and improve the Service. We collect, use, and disclose Your information as described in this Privacy Policy and, where required by applicable law, only where We have a valid legal basis to do so, including Your consent.
          </p>
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-blue-900 dark:text-blue-300 text-xs">
            <strong>Website:</strong> Shaw STEM Academy, accessible from{' '}
            <a
              href="https://shaw-stem-academy-website.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold hover:text-blue-600"
            >
              https://shaw-stem-academy-website.vercel.app
            </a>
          </div>
        </div>
      )
    },
    {
      id: 'definitions',
      title: '2. Interpretation & Key Definitions',
      icon: <FileCheck className="w-5 h-5 text-indigo-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>For the purposes of this Privacy Policy:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 block">Account</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">A unique portal account created for You to access academic features.</p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 block">Company ("We", "Us")</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">Refers to Shaw STEM Academy (Jamaica).</p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 block">Personal Data</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">Any information that relates to an identified or identifiable individual.</p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 block">Usage Data</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">Data collected automatically from portal interaction (e.g. session times, device type).</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'data-collection',
      title: '3. Data We Collect & How We Use It',
      icon: <Database className="w-5 h-5 text-emerald-500" />,
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            While using our platform (such as during registration or student profile onboarding), we collect the following categories of information:
          </p>
          <div className="space-y-2">
            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-1.5">
              <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">Student & Parent Information:</span>
              <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <li>Student first and last name, date of birth, grade level, and school background</li>
                <li>Parent/guardian contact information (name, relationship, email, phone numbers, home address)</li>
                <li>Emergency contact details and medical/dietary safety notices</li>
              </ul>
            </div>
            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-1.5">
              <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">Primary Uses:</span>
              <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <li>Processing academic admissions and course enrollments</li>
                <li>Maintaining class rosters, grading records, and laboratory safety compliance</li>
                <li>Delivering announcements, class updates, and emergency notifications</li>
                <li>Issuing digital attendance QR passes and logging campus attendance</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'cookies',
      title: '4. Cookies & Tracking Technologies',
      icon: <Eye className="w-5 h-5 text-amber-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            We use essential session tokens and local storage to secure user logins, remember authentication states, and maintain user preferences (such as dark/light mode).
          </p>
          <ul className="space-y-2 text-xs">
            <li className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <strong className="text-slate-900 dark:text-slate-100 block">Essential Security & Auth Cookies:</strong>
              Required for signing in, maintaining active student sessions, and preventing unauthorized account access.
            </li>
            <li className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <strong className="text-slate-900 dark:text-slate-100 block">Functional Preference Storage:</strong>
              Stores UI preferences (e.g. theme preference, dismissed notices) to improve your experience.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'sms',
      title: '5. Text Messages (SMS) & Push Notifications Notice',
      icon: <Smartphone className="w-5 h-5 text-purple-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            You have the option to receive SMS alerts or push notifications regarding enrollment status, classroom alerts, and urgent notices.
          </p>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-2xl space-y-2">
            <p className="font-bold text-xs text-purple-900 dark:text-purple-200">Our SMS & Mobile Commitment:</p>
            <ul className="list-disc list-inside text-xs text-purple-800/90 dark:text-purple-300 space-y-1">
              <li><strong>No Third-Party Sharing:</strong> Mobile phone numbers and consent records are NEVER sold, rented, or shared with third parties or affiliates for marketing purposes.</li>
              <li><strong>Message Frequency:</strong> Messages are sent only for relevant academic reminders, emergency alerts, or account updates.</li>
              <li><strong>Opt-Out:</strong> Reply STOP to opt-out of SMS at any time, or disable browser push notifications in your portal settings.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'retention',
      title: '6. Data Retention & Deletion',
      icon: <Clock className="w-5 h-5 text-teal-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            We retain personal data only for as long as necessary to fulfill educational, legal, and operational requirements:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">Student Academic Records</span>
              <p className="text-slate-600 dark:text-slate-300">Retained for the duration of the student's enrollment plus statutory academic record retention periods.</p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">Right to Deletion</span>
              <p className="text-slate-600 dark:text-slate-300">You may request the full deletion of your account and personal profile at any time by contacting administration.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'children',
      title: '7. Children\'s and Minors\' Privacy',
      icon: <UserX className="w-5 h-5 text-rose-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>
            Shaw STEM Academy serves minor students in STEM education. Registration and personal data submission for students under age 18 must be authorized by a parent or legal guardian.
          </p>
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-xl text-rose-900 dark:text-rose-300 text-xs">
            Parents or guardians can review, update, or request removal of their child's information by emailing our registrar office.
          </div>
        </div>
      )
    },
    {
      id: 'contact',
      title: '8. Contact Information',
      icon: <Mail className="w-5 h-5 text-blue-500" />,
      content: (
        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p>If you have any questions or data requests concerning this Privacy Policy, please reach out to us:</p>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Shaw STEM Academy Privacy Officer</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Data Protection & Inquiries</p>
            </div>
            <a
              href="mailto:shawstemacademy@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-center sm:text-left space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
            <p className="text-blue-200/80 font-medium text-sm">Last updated: August 13, 2026</p>
            <p className="text-xs text-slate-400 max-w-xl">
              Learn how Shaw STEM Academy collects, protects, and handles your educational and personal data.
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
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            {sec.title.split('. ')[1] || sec.title}
          </a>
        ))}
      </div>

      {/* Structured Policy Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 scroll-mt-24 transition-all hover:border-blue-200 dark:hover:border-blue-900/50"
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
