import React, { useState, useEffect } from 'react';
import { ApplicationTransparencyNotice } from './ApplicationTransparencyNotice';
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
  FileText,
  Download,
  ExternalLink,
  Save
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
import { FormattedText } from '../common/FormattedText';
import { downloadImage } from '../../lib/downloadHelper';

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
  onUpdateFeatureCards?: (cards: FeatureCard[]) => Promise<void> | void;
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
  onUpdateFeatureCards,
}) => {
  const info = academyInfo || DEFAULT_ACADEMY_INFO;
  
  // Construct 4 merged feature cards cleanly from saved Firestore data or default fallbacks
  const cards = DEFAULT_FEATURE_CARDS.map((defCard, idx) => {
    const match = (featureCards || []).find(
      (c) => c.id === defCard.id || c.id === `card-${idx + 1}`
    );
    return match ? { ...defCard, ...match } : (featureCards || [])[idx] || defCard;
  });

  const isStudent = loggedInUser?.role === 'student';
  
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [tempLogoUrl, setTempLogoUrl] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<SchoolNewsItem | null>(null);

  // Front Page Metrics Editing Modal State
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [editableCards, setEditableCards] = useState<FeatureCard[]>(cards);
  const [savingMetrics, setSavingMetrics] = useState(false);

  useEffect(() => {
    setEditableCards(cards);
  }, [featureCards]);

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
    if (card.metricType === 'static' || !card.metricType) {
      return card.value ?? '0';
    }

    switch (card.metricType) {
      case 'live_classes':
        return classList.length > 0 ? `${classList.length}` : (card.value || '0');
      case 'live_students':
        return registrationLogs.length > 0 ? `${registrationLogs.length}` : (card.value || '0');
      case 'live_departments':
        return departments.length > 0 ? `${departments.length}` : (card.value || '0');
      case 'live_teachers':
        const teacherCount = schoolUsers.filter((u) => u.role === 'teacher' || u.role === 'hod').length;
        return teacherCount > 0 ? `${teacherCount}` : (card.value || '0');
      case 'live_revenue':
        const rev = registrationLogs.reduce((s, r) => s + (r.totalPrice || 0), 0);
        return `$${rev}`;
      default:
        return card.value || '0';
    }
  };

  const handleCardFieldChange = (index: number, field: keyof FeatureCard, val: any) => {
    setEditableCards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSaveFrontPageMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMetrics(true);
    if (onUpdateFeatureCards) {
      await onUpdateFeatureCards(editableCards);
    }
    setSavingMetrics(false);
    setIsEditingMetrics(false);
  };

  const logoSource = (settings.logoUrl && !settings.logoUrl.includes('favicon')) ? settings.logoUrl : '/logo.png';

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-950 -z-10" />

        <div className="p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 max-w-2xl space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Official STEM Learning &amp; Registration Portal</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                {info.schoolName || 'Shaw STEM Academy'}
              </h1>
              <p className="text-xl sm:text-2xl text-blue-100/90 font-semibold italic">
                {info.tagline || settings.subtitle}
              </p>
            </div>

            <div className="space-y-3 text-slate-300 text-base leading-relaxed">
              <p>
                <strong>Application Purpose:</strong> The <strong>Shaw STEM Academy Portal</strong> is a comprehensive academic management platform designed for students, parents, faculty, and administrative staff. It enables online registration for STEM courses, real-time timetable tracking, attendance management, and direct integration with Google Classroom and Google Meet for virtual learning.
              </p>
              <p className="text-xs text-slate-400">
                {info.aboutText}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
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
                  <LogIn className="w-4 h-4" />
                  <span>Log in to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onNavigate('academics')}
                className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Course Catalog</span>
              </button>

              <a
                href="#application-purpose"
                className="px-4 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 text-blue-300 font-semibold text-xs rounded-2xl border border-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>App Purpose &amp; Verification</span>
              </a>
            </div>
          </div>

          {/* Centered Logo with Admin Edit Overlay */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
            <div className="relative group flex flex-col items-center">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center rounded-full bg-slate-800/10 p-4 border border-slate-800/50 shadow-2xl backdrop-blur-xs overflow-hidden">
                <img
                  src={logoSource}
                  alt="Shaw STEM Academy Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain transition-all duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/logo.png';
                  }}
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

      {/* Admin Quick Control Banner for Front Page Metrics */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-blue-950 text-white p-4 px-6 rounded-2xl border border-blue-900/50 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>Front Page Highlight Metrics</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">Admin Authorized</span>
              </div>
              <p className="text-xs text-slate-300">
                Customize titles, metric values (custom text or auto live counts), and descriptions displayed to visitors.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditingMetrics(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Edit3 className="w-4 h-4" />
            <span>Customize Metrics & Values</span>
          </button>
        </div>
      )}

      {/* 4 Customizable Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const colorClasses = {
            blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
            purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
            emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
            amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
          }[card.color || 'blue'] || 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400';

          return (
            <div key={card.id || `fcard-${idx}`} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 relative group hover:border-blue-300 dark:hover:border-blue-700 transition-all">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses}`}>
                  {renderCardIcon(card.icon)}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingMetrics(true)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg text-xs transition-opacity cursor-pointer"
                    title="Edit metric card"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{renderCardMetricValue(card)}</div>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{card.title}</div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Front Page Metrics Customizer Modal */}
      {isEditingMetrics && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Customize Front Page Metric Cards</h3>
                  <p className="text-xs text-slate-300">Edit titles, custom metric values or live counters, and descriptions.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingMetrics(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveFrontPageMetrics} className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {editableCards.map((card, idx) => (
                  <div key={card.id || `card-${idx}`} className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Metric Card #{idx + 1}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {card.metricType === 'static' || !card.metricType ? 'Custom Text' : 'Auto Live Metric'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Card Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={card.title}
                          onChange={(e) => handleCardFieldChange(idx, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Metric Value Mode
                          </label>
                          <select
                            value={card.metricType || 'static'}
                            onChange={(e) => handleCardFieldChange(idx, 'metricType', e.target.value)}
                            className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          >
                            <option value="static">Custom Static Text / Value</option>
                            <option value="live_classes">Live Active Classes Count</option>
                            <option value="live_students">Live Enrolled Students Count</option>
                            <option value="live_departments">Live Departments Count</option>
                            <option value="live_teachers">Live Teachers Count</option>
                            <option value="live_revenue">Live Revenue Total ($)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Custom Value / Text *
                          </label>
                          <input
                            type="text"
                            value={card.value}
                            onChange={(e) => handleCardFieldChange(idx, 'value', e.target.value)}
                            placeholder="e.g. 18, 150+, or 24/7"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Short Description *
                        </label>
                        <input
                          type="text"
                          required
                          value={card.description}
                          onChange={(e) => handleCardFieldChange(idx, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Icon Symbol
                          </label>
                          <select
                            value={card.icon}
                            onChange={(e) => handleCardFieldChange(idx, 'icon', e.target.value)}
                            className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          >
                            <option value="Cpu">Cpu (Microchip / Robotics)</option>
                            <option value="Award">Award (Trophy / Ribbon)</option>
                            <option value="Users">Users (Faculty / Community)</option>
                            <option value="Compass">Compass (Navigation / STEM)</option>
                            <option value="GraduationCap">Graduation Cap</option>
                            <option value="BookOpen">Book Open</option>
                            <option value="Sparkles">Sparkles</option>
                            <option value="Building2">Building</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Theme Color
                          </label>
                          <select
                            value={card.color}
                            onChange={(e) => handleCardFieldChange(idx, 'color', e.target.value)}
                            className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          >
                            <option value="blue">Blue</option>
                            <option value="purple">Purple</option>
                            <option value="emerald">Emerald</option>
                            <option value="amber">Amber</option>
                          </select>
                        </div>
                      </div>

                      {/* Live Card Preview Box */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview Card Display</span>
                        <div className="flex items-center gap-2">
                          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                            {renderCardMetricValue(card)}
                          </div>
                          <div className="font-bold text-xs text-slate-700 dark:text-slate-300">— {card.title}</div>
                        </div>
                        <p className="text-[11px] text-slate-500">{card.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingMetrics(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMetrics}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingMetrics ? 'Saving Changes...' : 'Save Front Page Metrics'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                {(item.imageUrl || settings.logoUrl) && (
                  <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <img
                      src={item.imageUrl || settings.logoUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {!isStudent && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(item.imageUrl || settings.logoUrl, `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
                          }}
                          className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                          title="Download article image"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                      </div>
                    )}
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

                    <h3 
                      onClick={() => setSelectedArticle(item)}
                      className="font-bold text-slate-900 dark:text-slate-100 leading-snug hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {item.title}
                    </h3>

                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <FormattedText text={item.summary} lineClamp={3} />
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedArticle(item)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read full article</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
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

      {/* Official Google OAuth Verification & Application Purpose Section (Above Footer) */}
      <ApplicationTransparencyNotice onNavigate={onNavigate} />

      {/* Full Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Article Image Banner */}
            {(selectedArticle.imageUrl || settings.logoUrl) && (
              <div className="relative h-64 sm:h-72 w-full bg-slate-950 overflow-hidden">
                <img
                  src={selectedArticle.imageUrl || settings.logoUrl}
                  alt={selectedArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {!isStudent && (
                    <button
                      type="button"
                      onClick={() => downloadImage(selectedArticle.imageUrl || settings.logoUrl, `${selectedArticle.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`)}
                      className="px-3 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-white rounded-xl text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
                      title="Download high-resolution image"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Image</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(null)}
                    className="p-2 bg-slate-900/85 hover:bg-slate-900 text-white rounded-xl backdrop-blur-xs shadow-lg transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {!selectedArticle.imageUrl && !settings.logoUrl && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {selectedArticle.date}
                  </span>
                  {selectedArticle.departmentName && (
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-900/40">
                      {selectedArticle.departmentName}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
                  {selectedArticle.title}
                </h2>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Published by <strong className="text-slate-800 dark:text-slate-200">{selectedArticle.author}</strong>
                </div>
              </div>

              {/* Typed Formatted Content */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                <FormattedText text={selectedArticle.content || selectedArticle.summary} />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {!isStudent && (selectedArticle.imageUrl || settings.logoUrl) && (
                <button
                  type="button"
                  onClick={() => downloadImage(selectedArticle.imageUrl || settings.logoUrl, `${selectedArticle.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Download Attached Image</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="ml-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

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
                  src={tempLogoUrl || settings.logoUrl || '/logo.png'}
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

