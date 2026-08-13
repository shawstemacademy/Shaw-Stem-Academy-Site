import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Save, 
  ShieldCheck, 
  Search, 
  Sliders, 
  FileText, 
  Users, 
  Clock, 
  Key, 
  GraduationCap, 
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { FormFieldSetting, INITIAL_FORM_FIELD_SETTINGS } from '../../lib/formFieldsConfig';

interface AdminFormFieldsEditorProps {
  fieldSettings: FormFieldSetting[];
  onSaveSettings: (updated: FormFieldSetting[]) => void;
  onResetToDefaults: () => void;
}

const FORM_OPTIONS = [
  { id: 'student_registration', name: 'Student Registration & Application Form', icon: FileText, count: 28 },
  { id: 'user_management', name: 'User Account Management Form', icon: Users, count: 7 },
  { id: 'class_claim', name: 'Teacher Class Claim Form', icon: Clock, count: 4 },
  { id: 'login', name: 'Login & Portal Auth Form', icon: Key, count: 2 },
  { id: 'class_management', name: 'Course & Class Item Form', icon: GraduationCap, count: 8 },
];

export const AdminFormFieldsEditor: React.FC<AdminFormFieldsEditorProps> = ({
  fieldSettings = INITIAL_FORM_FIELD_SETTINGS,
  onSaveSettings,
  onResetToDefaults,
}) => {
  const [selectedFormId, setSelectedFormId] = useState<string>('student_registration');
  const [localSettings, setLocalSettings] = useState<FormFieldSetting[]>(fieldSettings);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize local state if parent prop updates
  React.useEffect(() => {
    setLocalSettings(fieldSettings);
  }, [fieldSettings]);

  const currentFormFields = localSettings.filter((f) => f.formId === selectedFormId);

  const filteredFields = currentFormFields.filter((f) => {
    const query = searchTerm.toLowerCase();
    return (
      f.label.toLowerCase().includes(query) ||
      (f.customLabel || '').toLowerCase().includes(query) ||
      f.section.toLowerCase().includes(query) ||
      f.fieldId.toLowerCase().includes(query)
    );
  });

  // Group filtered fields by Section
  const sectionsMap: { [section: string]: FormFieldSetting[] } = {};
  filteredFields.forEach((field) => {
    if (!sectionsMap[field.section]) {
      sectionsMap[field.section] = [];
    }
    sectionsMap[field.section].push(field);
  });

  const handleToggleEnabled = (formId: string, fieldId: string) => {
    setLocalSettings((prev) =>
      prev.map((f) => {
        if (f.formId === formId && f.fieldId === fieldId) {
          if (f.isSystemProtected && f.enabled) {
            alert(`The field "${f.label}" is required for system security and core application flow.`);
            return f;
          }
          return { ...f, enabled: !f.enabled };
        }
        return f;
      })
    );
  };

  const handleToggleRequired = (formId: string, fieldId: string) => {
    setLocalSettings((prev) =>
      prev.map((f) => {
        if (f.formId === formId && f.fieldId === fieldId) {
          if (f.isSystemProtected && f.required) {
            alert(`The field "${f.label}" is a system-critical required key.`);
            return f;
          }
          return { ...f, required: !f.required };
        }
        return f;
      })
    );
  };

  const handleCustomLabelChange = (formId: string, fieldId: string, value: string) => {
    setLocalSettings((prev) =>
      prev.map((f) => {
        if (f.formId === formId && f.fieldId === fieldId) {
          return { ...f, customLabel: value };
        }
        return f;
      })
    );
  };

  const handleEnableAllForForm = () => {
    setLocalSettings((prev) =>
      prev.map((f) => (f.formId === selectedFormId ? { ...f, enabled: true } : f))
    );
  };

  const handleDisableOptionalForForm = () => {
    setLocalSettings((prev) =>
      prev.map((f) =>
        f.formId === selectedFormId && !f.required && !f.isSystemProtected
          ? { ...f, enabled: false }
          : f
      )
    );
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const activeFormInfo = FORM_OPTIONS.find((f) => f.id === selectedFormId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg border border-purple-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 p-8 transform translate-x-4 -translate-y-4">
          <Sliders className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            Admin Master Control Mode
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Form Fields Editor & Visibility Manager</h2>
          <p className="text-sm text-purple-200/90 max-w-2xl">
            Configure input fields across all application forms. Enable or disable individual fields, toggle mandatory required constraints, and customize display labels in real-time.
          </p>
        </div>
      </div>

      {/* Form Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {FORM_OPTIONS.map((form) => {
          const Icon = form.icon;
          const isSelected = form.id === selectedFormId;
          const totalFieldsInForm = localSettings.filter((f) => f.formId === form.id).length;
          const enabledCount = localSettings.filter((f) => f.formId === form.id && f.enabled).length;

          return (
            <button
              key={form.id}
              onClick={() => setSelectedFormId(form.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 ring-2 ring-purple-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-purple-200 text-purple-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {enabledCount}/{totalFieldsInForm} Active
                </span>
              </div>
              <div>
                <h3 className={`text-xs font-bold leading-snug line-clamp-2 ${isSelected ? 'text-purple-950 dark:text-purple-200' : 'text-slate-800 dark:text-slate-200'}`}>
                  {form.name}
                </h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions & Search Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={`Search fields in ${activeFormInfo?.name || 'Form'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleEnableAllForForm}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            Enable All Fields
          </button>
          <button
            type="button"
            onClick={handleDisableOptionalForForm}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
            Disable Optional
          </button>
          <button
            type="button"
            onClick={onResetToDefaults}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Form Configuration
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Form field settings successfully saved! All user forms now reflect these field rules.
        </div>
      )}

      {/* Field Settings Sections */}
      <div className="space-y-6">
        {Object.keys(sectionsMap).length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No fields match your search</h4>
            <p className="text-xs text-slate-500">Try adjusting your search criteria or select a different form above.</p>
          </div>
        ) : (
          Object.entries(sectionsMap).map(([sectionName, fields]) => (
            <div key={sectionName} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  {sectionName}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {fields.length} {fields.length === 1 ? 'input field' : 'input fields'}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {fields.map((field) => (
                  <div
                    key={`${field.formId}-${field.fieldId}`}
                    className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      !field.enabled ? 'bg-slate-50/70 dark:bg-slate-900/40 opacity-75' : ''
                    }`}
                  >
                    {/* Left: Label and Details */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {field.customLabel || field.label}
                        </span>
                        {field.customLabel && (
                          <span className="text-2xs text-slate-400 font-mono">
                            (Original: {field.label})
                          </span>
                        )}
                        <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                          {field.fieldId}
                        </span>
                        {field.isSystemProtected && (
                          <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                            Protected Core Field
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Section: <strong className="text-slate-700 dark:text-slate-300">{field.section}</strong>
                      </p>
                    </div>

                    {/* Right: Toggles for Enabled and Required */}
                    <div className="flex items-center gap-4 flex-wrap shrink-0">
                      {/* Enable/Disable Toggle */}
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-2xs font-semibold text-slate-600 dark:text-slate-400 pl-1">
                          Visibility:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(field.formId, field.fieldId)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                            field.enabled
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {field.enabled ? (
                            <>
                              <Eye className="w-3 h-3" /> Enabled
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" /> Disabled
                            </>
                          )}
                        </button>
                      </div>

                      {/* Required/Optional Toggle */}
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-2xs font-semibold text-slate-600 dark:text-slate-400 pl-1">
                          Constraint:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleRequired(field.formId, field.fieldId)}
                          disabled={!field.enabled}
                          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                            !field.enabled
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              : field.required
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {field.required ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Required (*)
                            </>
                          ) : (
                            <>Optional</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
