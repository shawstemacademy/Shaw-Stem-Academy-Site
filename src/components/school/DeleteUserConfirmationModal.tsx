import React, { useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Trash2,
  X,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  FileText,
  Users,
  GraduationCap,
  Calendar,
  Layers,
  Loader2
} from 'lucide-react';
import { SchoolUser } from '../../types';

interface DeleteUserConfirmationModalProps {
  isOpen: boolean;
  user: SchoolUser | null;
  onClose: () => void;
  onConfirmCascadeDelete: (userId: string, reason: string) => Promise<void>;
  isProcessing?: boolean;
}

const PRESET_REASONS = [
  'Graduation / Alumni Completion',
  'Formal Student Withdrawal Request',
  'Duplicate or Test Account Cleanup',
  'Transferred to Another Institution',
  'End of Employment / Faculty Separation',
  'Administrative Policy / Compliance Action',
];

export const DeleteUserConfirmationModal: React.FC<DeleteUserConfirmationModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirmCascadeDelete,
  isProcessing = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [hasConfirmedCheckbox, setHasConfirmedCheckbox] = useState<boolean>(false);

  if (!isOpen || !user) return null;

  const finalReason = useCustom ? (customReason.trim() || 'Administrative deletion') : selectedPreset;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConfirmedCheckbox) return;
    await onConfirmCascadeDelete(user.id, finalReason);
  };

  const isStudent = user.role === 'student' || user.role === 'student_applicant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-rose-900 text-white p-6 relative">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 border border-rose-400/30 rounded-2xl text-rose-300">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-300">
                Cascade Deletion & Archival System
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                Confirm User Deletion: {user.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Profile Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-700 font-black text-lg flex items-center justify-center shrink-0 border border-slate-300">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-slate-900 truncate">{user.name}</h4>
                <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 uppercase">
                    Role: {user.role}
                  </span>
                  {user.studentDetails?.studentId && (
                    <span className="text-[11px] font-mono font-bold text-blue-700">
                      ID: {user.studentDetails.studentId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cascade & Archival Principles Callout */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 space-y-2.5 text-xs text-amber-900">
            <div className="font-bold flex items-center gap-2 text-amber-950">
              <Archive className="w-4 h-4 text-amber-600" />
              <span>Two-Stage Safe Archival & Scrubbing Policy</span>
            </div>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-amber-800 list-disc list-inside">
              <li>
                <strong>Stage 1 (Complete Archival):</strong> All user profile data, {isStudent ? 'class registrations, course enrollments, attendance, and admission decisions' : 'assigned classes, claims, resources, and attendance logs'} are gathered and snapshotted into <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">deleted_users</code>.
              </li>
              <li>
                <strong>Stage 2 (Active Data Scrub):</strong> All active records are atomically deleted from live collections, preventing orphaned records while preserving overall financial ledger totals.
              </li>
              <li>
                <strong>Audit & Retrieval:</strong> Administrators can inspect or restore archived records at any time in the <em>Archived Records</em> tab.
              </li>
            </ul>
          </div>

          {/* Deletion Reason Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Administrative Reason for Deletion <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_REASONS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    setSelectedPreset(preset);
                    setUseCustom(false);
                  }}
                  className={`text-left text-xs p-2.5 rounded-xl border transition-all cursor-pointer font-medium ${
                    !useCustom && selectedPreset === preset
                      ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={`text-left text-xs p-2.5 rounded-xl border transition-all cursor-pointer font-medium ${
                  useCustom
                    ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Other (Enter custom reason...)
              </button>
            </div>

            {useCustom && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain the administrative reason for deleting and archiving this user account..."
                rows={3}
                className="w-full mt-2 text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white text-slate-900"
                required
              />
            )}
          </div>

          {/* Confirmation Checkbox */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasConfirmedCheckbox}
                onChange={(e) => setHasConfirmedCheckbox(e.target.checked)}
                className="mt-0.5 rounded-md border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700 leading-snug">
                I acknowledge that this user's live records will be scrubbed from active collections and archived into Firestore for audit compliance.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasConfirmedCheckbox || isProcessing}
              className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                !hasConfirmedCheckbox || isProcessing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-700 hover:bg-rose-800 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Archiving & Scrubbing Data...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Archive & Delete User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
