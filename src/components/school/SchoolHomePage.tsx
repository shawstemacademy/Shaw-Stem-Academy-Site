import React, { useState } from 'react';
import { 
  Award, 
  Cpu, 
  Users, 
  Compass, 
  ArrowRight, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  LogIn,
  GraduationCap,
  Building2,
  HelpCircle,
  Newspaper,
  Edit3,
  X,
  FileText
} from 'lucide-react';
import { 
  SchoolNewsItem, 
  PortalTab, 
  LandingPageSettings, 
  FaqItem, 
  AcademyInfo, 
  FeatureCard, 
  ClassItem, 
  Department, 
  SchoolUser, 
  RegistrationRecord 
} from '../../types';
import { DEFAULT_ACADEMY_INFO, DEFAULT_FEATURE_CARDS } from '../../data/schoolDemoData';
import { ImageUploadInput } from '../common/ImageUploadInput';

interface SchoolHomePageProps {
  news: SchoolNewsItem[];
  faqs?: FaqItem[];
  academyInfo?: AcademyInfo | null;
  featureCards?: FeatureCard[];
  classList?: ClassItem[];
  departments?: Department[];
  schoolUsers?: SchoolUser[];
  registrationLogs?: RegistrationRecord[];
  settings: LandingPageSettings;
  isLoggedIn?: boolean;
  onNavigate: (tab: PortalTab) => void;
  onOpenRegistration: () => void;
  loggedInUser?: SchoolUser | null;
  onUpdateLandingPageSettings?: (newSettings: LandingPageSettings) => Promise<void> | void;
}

export const SchoolHomePage: React.FC<SchoolHomePageProps> = ({
  news = [],
  faqs = [],
  academyInfo = null,
  featureCards = [],
  classList = [],
  departments = [],
  schoolUsers = [],
  registrationLogs = [],
  settings,
  isLoggedIn = false,
  onNavigate,
  onOpenRegistration,
  loggedInUser = null,
  onUpdateLandingPageSettings,
}) => {
  const info = academyInfo || DEFAULT_ACADEMY_INFO;
  const cards = featureCards.length >= 4 ? featureCards.slice(0, 4) : DEFAULT_FEATURE_CARDS;
  
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [tempLogoUrl, setTempLogoUrl] = useState('');

  const isAdmin = loggedInUser?.role === 'admin';

  const renderCardIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      case 'Users': return <Users className="w-5 h-5" />;
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      default: return <Building2 className="w-5 h-5" />;
    }
  };

  const renderCardMetricValue = (card: FeatureCard) => {
    switch (card.metricType) {
      case 'live_classes':
        return classList.length > 0 ? `${classList.length}` : card.value;
      case 'live_students':
        return registrationLogs.length > 0 ? `${registrationLogs.length}` : card.value;
      case 'live_departments':
        return departments.length > 0 ? `${departments.length}` : card.value;
      case 'live_teachers':
        const teacherCount = schoolUsers.filter((u) => u.role === 'teacher' || u.role === 'hod').length;
        return teacherCount > 0 ? `${teacherCount}` : card.value;
      case 'live_revenue':
        const rev = registrationLogs.reduce((s, r) => s + (r.totalPrice || 0), 0);
        return `$${rev}`;
      default:
        return card.value;
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Google Verification & Prominent Application Purpose Banner */}
      <div className="bg-slate-50 dark:bg-slate-900 border-2 border-blue-500 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-blue-600 dark:text-blue-400 text-xs font-extrabold uppercase tracking-widest block mb-1">
                Google API Verification & Application Transparency Notice
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                Official Application Purpose &amp; Google Sign-In Disclosure
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  1. What is the purpose of this application?
                </p>
                <p>
                  The <strong>Shaw STEM Academy Portal</strong> is a comprehensive academic information system and student registration hub. Its primary purpose is to empower prospective students, parents, active faculty, and administrators to view state-of-the-art science and engineering course catalogs, submit applications, manage classroom assignments, view lab schedules, and securely register for hands-on STEM laboratory term classes.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  2. Why do we require Google Authentication?
                </p>
                <p>
                  We utilize Google OAuth (Sign-In) strictly to verify user identities and establish a secure session. When you authenticate with your Google Account, we securely retrieve your basic profile information (such as your name, email, and avatar) to:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1 text-xs">
                  <li>Safely map your logged-in Google Identity to your designated school role (Student, Faculty, or Administrator).</li>
                  <li>Authorize unique access privileges for personal learning portals and administrative suites.</li>
                  <li>Prevent unauthorized registrations and secure academic class rosters inside our database.</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Your data is never shared with third parties. For more information, read our legal governance pages:
              </p>
              <div className="flex items-center gap-4 text-xs font-bold">
                <a 
                  href="?tab=privacy" 
                  onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }} 
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Privacy Policy</span>
                </a>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <a 
                  href="?tab=terms" 
                  onClick={(e) => { e.preventDefault(); onNavigate('terms'); }} 
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Terms of Service</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-950 -z-10" />
        


        <div className="p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 max-w-2xl space-y-6">
            <div className="space-y-2">
              <span className="text-blue-400 font-extrabold tracking-wider text-sm uppercase">Welcome to Shaw STEM Academy</span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                {info.schoolName || 'Shaw STEM Academy'}
              </h1>
              <p className="text-xl sm:text-2xl text-blue-100/90 font-semibold italic">
                {info.tagline || settings.subtitle}
              </p>
            </div>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              <strong>Shaw STEM Academy</strong> provides a state-of-the-art educational facility combining rigorous science and engineering theory with real-world lab experimentation. {info.aboutText}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              {isLoggedIn ? (
                <button
                  onClick={onOpenRegistration}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer border border-blue-400/30"
                >
                  <span>Enroll in Fall 2026 Classes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('login')}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer border border-blue-400/30"
                >
                  <span>Log in to Enroll in Classes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onNavigate('academics')}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Browse Course Catalog</span>
              </button>
            </div>
          </div>

          {/* Centered Logo with Admin Edit Overlay */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
            <div className="relative group flex flex-col items-center">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center rounded-full bg-slate-800/10 p-4 border border-slate-800/50 shadow-2xl backdrop-blur-xs overflow-hidden">
                <img
                  src={settings.logoUrl || '/favicon.png'}
                  alt="Shaw STEM Academy Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain transition-all duration-300 group-hover:scale-105"
                />
                
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingLogo(true)}
                    className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-white"
                  >
                    <Edit3 className="w-6 h-6 text-blue-400" />
                    <span className="text-xs font-bold">Edit Academy Logo</span>
                  </button>
                )}
              </div>
              
              {isAdmin && (
                <button
                  onClick={() => setIsEditingLogo(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-blue-500/20 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Logo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Customizable Feature Cards above General Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const colorClasses = {
            blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
            purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
            emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
            amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
          }[card.color || 'blue'] || 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400';

          return (
            <div key={card.id || `fcard-${idx}`} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses}`}>
                {renderCardIcon(card.icon)}
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{renderCardMetricValue(card)}</div>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{card.title}</div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* General Information Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 shadow-xs space-y-8">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>General Academy Information</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Welcome to {info.schoolName}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            {info.aboutText}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 font-medium">
            <span>📍 {info.address}</span>
            <span>📞 {info.contactPhone}</span>
            <span>✉️ {info.contactEmail}</span>
          </div>
        </div>

        {/* Application Purpose & OAuth Verification Panel */}
        <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 space-y-4">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">Application Purpose & Authentication Notice</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The <strong>Shaw STEM Academy</strong> online portal is a dedicated platform designed to manage STEM course catalogs, student profile registries, and term class registration for parents, students, and academic staff. Our portal provides a seamless digital experience to:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 list-disc text-xs text-slate-600 dark:text-slate-300">
            <li><strong>Secure Student Portal:</strong> Allows enrolled and prospective students to view active course resources, class schedules, and academic announcements in real time.</li>
            <li><strong>Class Registration & Enrollments:</strong> Enables parents to register students for multiple hands-on laboratory classes, track total tuition fees, and apply eligible bundle discounts.</li>
            <li><strong>Faculty & Course Administration:</strong> Empower teachers to publish lectures, syllabi, class files, and manage student attendance registries.</li>
            <li><strong>Academic Performance Tracking:</strong> Aids school administrators in processing admissions and verifying course enrollment states securely.</li>
          </ul>
          <div className="border-t border-blue-100/60 dark:border-blue-900/40 pt-3">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Google OAuth Integration:</strong> We utilize Google Sign-In exclusively for secure user authentication. When you log in with your Google Account, we access only your basic profile information (such as your name, email address, and avatar). This is used to safely map your school portal identity to your student record, authenticate access permissions for classrooms and dashboards, prevent unauthorized account registrations, and securely persist your class enrollment logs in our database. Your data is strictly used for portal access and is never shared with third parties. For more information, please read our <a href="?tab=privacy" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Privacy Policy</a> and <a href="?tab=terms" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Terms of Service</a>.
            </p>
          </div>
        </div>

        {/* 3 Information Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{info.pillar1Title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {info.pillar1Desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{info.pillar2Title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {info.pillar2Desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{info.pillar3Title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {info.pillar3Desc}
            </p>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Frequently Asked Questions</span>
          </h3>

          {faqs.length === 0 ? (
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No FAQs currently published. Administrators can add questions in the Admin Suite.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{faq.question}</div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Academy News & Announcements */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Latest Academy News</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Stay updated on STEM lab events, competitions, and admissions.</p>
          </div>
        </div>

        {news.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-xs">
            <Newspaper className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">No News Published Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              News posts created by Administrators, Department Heads, and Leaders will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {(item.imageUrl || settings.logoUrl) && (
                  <div className="h-44 overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <img
                      src={item.imageUrl || settings.logoUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                )}

                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/30">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.date}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>By {item.author}</span>
                    {item.departmentName && <span className="font-semibold text-purple-600 dark:text-purple-400">{item.departmentName}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Logo Modal */}
      {isEditingLogo && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-950 dark:text-slate-50 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Update Academy Logo</span>
              </h3>
              <button
                onClick={() => {
                  setIsEditingLogo(false);
                  setTempLogoUrl('');
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <img
                  src={tempLogoUrl || settings.logoUrl || '/favicon.png'}
                  alt="Logo Preview"
                  referrerPolicy="no-referrer"
                  className="h-32 object-contain"
                />
              </div>

              <ImageUploadInput
                value={tempLogoUrl || settings.logoUrl}
                onChange={(val) => setTempLogoUrl(val)}
                label="Academy Logo Picture"
                description="Upload a high-resolution image from your device or paste a web URL."
                placeholder="Upload logo file or paste direct image URL..."
                aspectRatio="square"
                darkBg={false}
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsEditingLogo(false);
                  setTempLogoUrl('');
                }}
                className="flex-1 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onUpdateLandingPageSettings) {
                    const finalLogo = tempLogoUrl || settings.logoUrl;
                    await onUpdateLandingPageSettings({
                      ...settings,
                      logoUrl: finalLogo
                    });
                  }
                  setIsEditingLogo(false);
                  setTempLogoUrl('');
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

