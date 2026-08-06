import React from 'react';
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
  Newspaper
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
}) => {
  const info = academyInfo || DEFAULT_ACADEMY_INFO;
  const cards = featureCards.length >= 4 ? featureCards.slice(0, 4) : DEFAULT_FEATURE_CARDS;

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
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-950 -z-10" />
        
        {/* Top Right Quick Bar inside Hero */}
        <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-800/80">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{info.schoolName || settings.title}</span>
          </div>

          <button
            onClick={() => onNavigate('login')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 border border-blue-400/30 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In</span>
          </button>
        </div>

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
                onClick={() => onNavigate('courses')}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Browse Course Catalog</span>
              </button>
            </div>
          </div>

          {/* Quick Stat Pill */}
          <div className="w-full md:w-80 p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Tuition Savings</div>
                <div className="text-sm font-bold text-white">Automatic Bundle Discounts</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Register for 2+ classes to automatically receive 15% off total tuition, plus instant promo code validation!
            </p>

            {isLoggedIn ? (
              <button
                onClick={onOpenRegistration}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Calculate Your Savings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Log In to View Savings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Customizable Feature Cards above General Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            purple: 'bg-purple-50 text-purple-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            amber: 'bg-amber-50 text-amber-600',
          }[card.color || 'blue'] || 'bg-blue-50 text-blue-600';

          return (
            <div key={card.id || `fcard-${idx}`} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses}`}>
                {renderCardIcon(card.icon)}
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{renderCardMetricValue(card)}</div>
              <div className="font-bold text-slate-900 text-xs">{card.title}</div>
              <p className="text-[11px] font-medium text-slate-500">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* General Information Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-8">
        <div className="border-b border-slate-100 pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>General Academy Information</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Welcome to {info.schoolName}</h2>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            {info.aboutText}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 font-medium">
            <span>📍 {info.address}</span>
            <span>📞 {info.contactPhone}</span>
            <span>✉️ {info.contactEmail}</span>
          </div>
        </div>

        {/* Application Purpose & OAuth Verification Panel */}
        <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4">
          <div className="flex items-center gap-2 text-blue-800">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Application Purpose & Authentication Notice</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The <strong>Shaw STEM Academy</strong> online portal is a dedicated platform designed to manage STEM course catalogs, student profile registries, and term class registration for parents, students, and academic staff. Our portal provides a seamless digital experience to:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 list-disc text-xs text-slate-600">
            <li><strong>Secure Student Portal:</strong> Allows enrolled and prospective students to view active course resources, class schedules, and academic announcements in real time.</li>
            <li><strong>Class Registration & Enrollments:</strong> Enables parents to register students for multiple hands-on laboratory classes, track total tuition fees, and apply eligible bundle discounts.</li>
            <li><strong>Faculty & Course Administration:</strong> Empower teachers to publish lectures, syllabi, class files, and manage student attendance registries.</li>
            <li><strong>Academic Performance Tracking:</strong> Aids school administrators in processing admissions and verifying course enrollment states securely.</li>
          </ul>
          <div className="border-t border-blue-100/60 pt-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Google OAuth Integration:</strong> We utilize Google Sign-In exclusively for secure user authentication. When you log in with your Google Account, we access only your basic profile information (such as your name, email address, and avatar). This is used to safely map your school portal identity to your student record, authenticate access permissions for classrooms and dashboards, prevent unauthorized account registrations, and securely persist your class enrollment logs in our database. Your data is strictly used for portal access and is never shared with third parties. For more information, please read our <a href="?tab=privacy" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }} className="text-blue-600 font-bold hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>

        {/* 3 Information Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">{info.pillar1Title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {info.pillar1Desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">{info.pillar2Title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {info.pillar2Desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">{info.pillar3Title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {info.pillar3Desc}
            </p>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span>Frequently Asked Questions</span>
          </h3>

          {faqs.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
              <p className="text-xs text-slate-500 font-medium">No FAQs currently published. Administrators can add questions in the Admin Suite.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">{faq.question}</div>
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
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
            <h2 className="text-2xl font-bold text-slate-900">Latest Academy News</h2>
            <p className="text-sm text-slate-500">Stay updated on STEM lab events, competitions, and admissions.</p>
          </div>
        </div>

        {news.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2 shadow-xs">
            <Newspaper className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-xs font-bold text-slate-800">No News Published Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              News posts created by Administrators, Department Heads, and Leaders will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {(item.imageUrl || settings.logoUrl) && (
                  <div className="h-44 overflow-hidden bg-slate-100">
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
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.date}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>By {item.author}</span>
                    {item.departmentName && <span className="font-semibold text-purple-600">{item.departmentName}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

