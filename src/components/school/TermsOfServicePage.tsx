import React from 'react';
import { FileText } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
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
            <p className="text-purple-200/80 font-medium text-sm">Last updated: August 12, 2026</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-purple-600 hover:prose-a:text-purple-500 prose-strong:text-slate-900">
        <h2>1. Agreement to Terms</h2>
        <p>
          By accessing or using the Shaw STEM Academy web portal (accessible at this application URL), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
        </p>

        <h2>2. Description of Application &amp; Services</h2>
        <p>
          Shaw STEM Academy provides an educational management platform for students, parents, faculty, and administrative staff. Our platform provides features including:
        </p>
        <ul>
          <li>Accessing STEM course catalogs, syllabi, and schedules</li>
          <li>Student profile management and laboratory class enrollment</li>
          <li>Student portal access for announcements, assignments, and learning resources</li>
          <li>Faculty tools for class materials management and student registries</li>
        </ul>

        <h2>3. User Accounts &amp; Authentication</h2>
        <p>
          To access certain features of the platform, you may be required to register for an account using Google Sign-In or email credentials. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </p>

        <h2>4. Use of Google OAuth Services</h2>
        <p>
          When you sign in using Google OAuth, we access your basic profile information (such as name, email address, and profile picture) strictly for user authentication, access control, and account identification within the portal. We do not use your Google account information for any unauthorized or marketing purposes.
        </p>

        <h2>5. Student &amp; Parental Consent</h2>
        <p>
          Registration of minor students must be completed or authorized by a parent or legal guardian. Users agree to provide accurate and truthful information during enrollment.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          All educational materials, lab schematics, syllabus content, logos, and curriculum documents published on this platform are the property of Shaw STEM Academy or its licensors.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          Shaw STEM Academy shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our platform or educational services.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have any questions regarding these Terms of Service, please contact us at:
        </p>
        <ul>
          <li>By email: <strong>shawstemacademy@gmail.com</strong></li>
        </ul>
      </div>
    </div>
  );
};
