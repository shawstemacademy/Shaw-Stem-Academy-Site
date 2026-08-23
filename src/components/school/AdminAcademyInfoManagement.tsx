import React, { useState, useEffect } from 'react';
import { Building2, Sparkles, Cpu, Award, Users, Compass, Save, CheckCircle2, AlertCircle, RefreshCw, LayoutGrid } from 'lucide-react';
import { AcademyInfo, FeatureCard } from '../../types';
import { saveDocToFirestore } from '../../lib/firebase';
import { DEFAULT_ACADEMY_INFO, DEFAULT_FEATURE_CARDS } from '../../data/schoolDemoData';

interface AdminAcademyInfoManagementProps {
  academyInfo: AcademyInfo | null;
  featureCards: FeatureCard[];
}

export const AdminAcademyInfoManagement: React.FC<AdminAcademyInfoManagementProps> = ({
  academyInfo,
  featureCards = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'cards'>('info');

  // Academy Info State
  const [infoForm, setInfoForm] = useState<AcademyInfo>(academyInfo || DEFAULT_ACADEMY_INFO);

  // 4 Feature Cards Merged State
  const getMergedCards = (saved: FeatureCard[]) => {
    return DEFAULT_FEATURE_CARDS.map((defCard, idx) => {
      const match = (saved || []).find(
        (c) => c.id === defCard.id || c.id === `card-${idx + 1}`
      );
      return match ? { ...defCard, ...match } : (saved || [])[idx] || defCard;
    });
  };

  const [cardsForm, setCardsForm] = useState<FeatureCard[]>(getMergedCards(featureCards));

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (academyInfo) {
      setInfoForm(academyInfo);
    }
  }, [academyInfo]);

  useEffect(() => {
    setCardsForm(getMergedCards(featureCards));
  }, [featureCards]);

  const handleInfoChange = (field: keyof AcademyInfo, value: any) => {
    setInfoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (index: number, field: keyof FeatureCard, value: any) => {
    setCardsForm((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const ok = await saveDocToFirestore('academyInfo', 'general', infoForm);
    setSaving(false);

    if (ok) {
      setMessage({ type: 'success', text: 'General Academy Information saved successfully to Firebase!' });
    } else {
      setMessage({ type: 'error', text: 'Failed to save Academy Information to Firebase.' });
    }
  };

  const handleSaveCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    let allOk = true;
    for (const card of cardsForm) {
      const ok = await saveDocToFirestore('featureCards', card.id, card);
      if (!ok) allOk = false;
    }
    setSaving(false);

    if (allOk) {
      setMessage({ type: 'success', text: 'The 4 Feature Cards updated successfully in Firebase!' });
    } else {
      setMessage({ type: 'error', text: 'Failed to update Feature Cards.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-tab Switcher */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Website Customization & Branding</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">General Academy Information & Feature Cards</h2>
          <p className="text-xs text-slate-500 mt-1">
            Customize official academy details, contact info, welcome texts, and the 4 highlight cards above General Info.
          </p>
        </div>

        {/* Subtab Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveSubTab('info')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'info' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>General Info</span>
          </button>
          <button
            onClick={() => setActiveSubTab('cards')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>4 Feature Cards</span>
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Subtab 1: General Info Form */}
      {activeSubTab === 'info' && (
        <form onSubmit={handleSaveInfo} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Official Academy Identity & Overview</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates school name, tagline, address, phone, and main welcome text on the public home page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academy School Name *
              </label>
              <input
                type="text"
                required
                value={infoForm.schoolName}
                onChange={(e) => handleInfoChange('schoolName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Established Year
              </label>
              <input
                type="text"
                value={infoForm.establishedYear}
                onChange={(e) => handleInfoChange('establishedYear', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hero Tagline / Subtitle
              </label>
              <input
                type="text"
                value={infoForm.tagline}
                onChange={(e) => handleInfoChange('tagline', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                About Academy Description (Main Overview)
              </label>
              <textarea
                rows={4}
                value={infoForm.aboutText}
                onChange={(e) => handleInfoChange('aboutText', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admissions Contact Email
              </label>
              <input
                type="email"
                value={infoForm.contactEmail}
                onChange={(e) => handleInfoChange('contactEmail', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone Number
              </label>
              <input
                type="text"
                value={infoForm.contactPhone}
                onChange={(e) => handleInfoChange('contactPhone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Campus Address
              </label>
              <input
                type="text"
                value={infoForm.address}
                onChange={(e) => handleInfoChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Portal Welcome Banner Subtitle
              </label>
              <input
                type="text"
                value={infoForm.portalWelcomeText}
                onChange={(e) => handleInfoChange('portalWelcomeText', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Student Registration Age
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={infoForm.minStudentAge ?? 14}
                onChange={(e) => handleInfoChange('minStudentAge', parseInt(e.target.value, 10) || 14)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Maximum Student Registration Age
              </label>
              <input
                type="number"
                min={1}
                max={150}
                value={infoForm.maxStudentAge ?? 100}
                onChange={(e) => handleInfoChange('maxStudentAge', parseInt(e.target.value, 10) || 100)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 3 Pillars Customization */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">3 Academy Information Pillars</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Pillar 1</span>
                <input
                  type="text"
                  value={infoForm.pillar1Title}
                  onChange={(e) => handleInfoChange('pillar1Title', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                  placeholder="Pillar 1 Title"
                />
                <textarea
                  rows={3}
                  value={infoForm.pillar1Desc}
                  onChange={(e) => handleInfoChange('pillar1Desc', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600"
                  placeholder="Pillar 1 Description"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Pillar 2</span>
                <input
                  type="text"
                  value={infoForm.pillar2Title}
                  onChange={(e) => handleInfoChange('pillar2Title', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                  placeholder="Pillar 2 Title"
                />
                <textarea
                  rows={3}
                  value={infoForm.pillar2Desc}
                  onChange={(e) => handleInfoChange('pillar2Desc', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600"
                  placeholder="Pillar 2 Description"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Pillar 3</span>
                <input
                  type="text"
                  value={infoForm.pillar3Title}
                  onChange={(e) => handleInfoChange('pillar3Title', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                  placeholder="Pillar 3 Title"
                />
                <textarea
                  rows={3}
                  value={infoForm.pillar3Desc}
                  onChange={(e) => handleInfoChange('pillar3Desc', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600"
                  placeholder="Pillar 3 Description"
                />
              </div>
            </div>
          </div>

          {/* Form/Grade Customization */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Form / Grade Dropdown Options</h4>
            <p className="text-xs text-slate-500">
              Manage the dropdown options for student grade levels. Prospective students will select from this list when registering.
            </p>
            
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              {((infoForm.formGrades && infoForm.formGrades.length > 0) ? infoForm.formGrades : ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'CAPE Unit 1', 'CAPE Unit 2']).map((grade, gIdx) => (
                <span
                  key={gIdx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold"
                >
                  <span>{grade}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentGrades = infoForm.formGrades && infoForm.formGrades.length > 0
                        ? infoForm.formGrades
                        : ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'CAPE Unit 1', 'CAPE Unit 2'];
                      const updated = currentGrades.filter((_, idx) => idx !== gIdx);
                      setInfoForm(prev => ({ ...prev, formGrades: updated }));
                    }}
                    className="w-3.5 h-3.5 rounded-full hover:bg-purple-200 flex items-center justify-center text-[10px] font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                id="new-grade-input"
                placeholder="e.g. Grade 6 or Form 6"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = (e.currentTarget as HTMLInputElement).value.trim();
                    if (val) {
                      const currentGrades = infoForm.formGrades && infoForm.formGrades.length > 0
                        ? infoForm.formGrades
                        : ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'CAPE Unit 1', 'CAPE Unit 2'];
                      if (!currentGrades.includes(val)) {
                        setInfoForm(prev => ({ ...prev, formGrades: [...currentGrades, val] }));
                      }
                      (e.currentTarget as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('new-grade-input') as HTMLInputElement;
                  const val = el?.value?.trim();
                  if (val) {
                    const currentGrades = infoForm.formGrades && infoForm.formGrades.length > 0
                      ? infoForm.formGrades
                      : ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'CAPE Unit 1', 'CAPE Unit 2'];
                    if (!currentGrades.includes(val)) {
                      setInfoForm(prev => ({ ...prev, formGrades: [...currentGrades, val] }));
                    }
                    el.value = '';
                  }
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
              >
                Add Option
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving to Firebase...' : 'Save General Academy Info'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Subtab 2: 4 Feature Cards Form */}
      {activeSubTab === 'cards' && (
        <form onSubmit={handleSaveCards} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-blue-600" />
              <span>Customizable 4 Highlight Cards Above General Information</span>
            </h3>
            <p className="text-xs text-slate-500">
              Set titles, descriptions, icons, and values for the 4 highlight cards. You can either set a static text value or link a card to a dynamic live metric (e.g. Live Active Classes Count).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cardsForm.map((card, idx) => (
              <div
                key={card.id || `card-${idx}`}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Feature Card #{idx + 1}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-600 border">
                    ID: {card.id}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Card Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={card.title}
                      onChange={(e) => handleCardChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Metric Value Type
                      </label>
                      <select
                        value={card.metricType || 'static'}
                        onChange={(e) => handleCardChange(idx, 'metricType', e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      >
                        <option value="static">Custom Static Text</option>
                        <option value="live_classes">Live Active Classes Count</option>
                        <option value="live_students">Live Enrolled Students Count</option>
                        <option value="live_departments">Live Departments Count</option>
                        <option value="live_teachers">Live Teachers Count</option>
                        <option value="live_revenue">Live Total Revenue ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Display Value / Prefix
                      </label>
                      <input
                        type="text"
                        value={card.value}
                        onChange={(e) => handleCardChange(idx, 'value', e.target.value)}
                        placeholder="e.g. 12+ or 100%"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Short Description *
                    </label>
                    <input
                      type="text"
                      required
                      value={card.description}
                      onChange={(e) => handleCardChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Icon Symbol
                      </label>
                      <select
                        value={card.icon}
                        onChange={(e) => handleCardChange(idx, 'icon', e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      >
                        <option value="Cpu">Cpu (Microchip / Robotics)</option>
                        <option value="Award">Award (Trophy / Competition)</option>
                        <option value="Users">Users (Mentorship / Ratio)</option>
                        <option value="Compass">Compass (Learning / Navigation)</option>
                        <option value="GraduationCap">Graduation Cap</option>
                        <option value="BookOpen">Book Open</option>
                        <option value="Sparkles">Sparkles</option>
                        <option value="Building2">Building</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Theme Color
                      </label>
                      <select
                        value={card.color}
                        onChange={(e) => handleCardChange(idx, 'color', e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      >
                        <option value="blue">Blue</option>
                        <option value="purple">Purple</option>
                        <option value="emerald">Emerald</option>
                        <option value="amber">Amber</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end bg-white p-4 rounded-2xl border border-slate-200">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Cards to Firebase...' : 'Save 4 Feature Cards'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
