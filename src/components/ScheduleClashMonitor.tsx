import React, { useState } from 'react';
import { ClassItem, SbaHubOption, ScheduleClash, ClashAdmissibility } from '../types';
import { detectAllScheduleClashes } from '../lib/scheduleClashUtils';
import { AlertTriangle, CheckCircle2, ShieldAlert, Clock, MapPin, User, Calendar, Plus, RefreshCw, Info } from 'lucide-react';

interface ScheduleClashMonitorProps {
  classList: ClassItem[];
  sbaHubOptions: SbaHubOption[];
  clashes: ScheduleClash[];
  onUpdateClashStatus: (clashId: string, newStatus: ClashAdmissibility, reasonNotes?: string) => void;
  onRefreshClashes: () => void;
}

export const ScheduleClashMonitor: React.FC<ScheduleClashMonitorProps> = ({
  classList = [],
  sbaHubOptions = [],
  clashes = [],
  onUpdateClashStatus,
  onRefreshClashes,
}) => {
  const [filter, setFilter] = useState<'all' | 'inadmissible' | 'admissible'>('all');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');

  // Auto-detect fresh clashes from offered classes
  const liveDetectedClashes = detectAllScheduleClashes(classList || [], sbaHubOptions || []);

  // Combine stored clashes with live detected
  const allClashesMap = new Map<string, ScheduleClash>();
  
  (liveDetectedClashes || []).forEach((c) => {
    if (c) allClashesMap.set(c.id, c);
  });

  (clashes || []).forEach((c) => {
    if (c) {
      if (allClashesMap.has(c.id)) {
        // preserve staff status and notes
        const existing = allClashesMap.get(c.id)!;
        allClashesMap.set(c.id, {
          ...existing,
          status: c.status,
          reasonNotes: c.reasonNotes || existing.reasonNotes,
        });
      } else {
        allClashesMap.set(c.id, c);
      }
    }
  });

  const mergedClashes = Array.from(allClashesMap.values());

  const filteredClashes = mergedClashes.filter((c) => {
    if (filter === 'inadmissible') return c.status === 'inadmissible';
    if (filter === 'admissible') return c.status === 'admissible';
    return true;
  });

  const inadmissibleCount = mergedClashes.filter((c) => c.status === 'inadmissible').length;
  const admissibleCount = mergedClashes.filter((c) => c.status === 'admissible').length;

  const handleSaveNotes = (clashId: string) => {
    const existing = mergedClashes.find((c) => c.id === clashId);
    if (existing) {
      onUpdateClashStatus(clashId, existing.status, notesInput);
    }
    setEditingNotesId(null);
    setNotesInput('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold">Schedule & Clash Monitor</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Detect time overlaps, room double-bookings, and instructor conflicts across all offered courses. Mark clashes as <strong>Admissible</strong> or <strong>Inadmissible</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefreshClashes}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Scan Schedule</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Clashes</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{mergedClashes.length}</p>
            </div>
            <div className="p-3 bg-slate-200 text-slate-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Inadmissible (Errors)</p>
              <p className="text-2xl font-black text-red-700 mt-1">{inadmissibleCount}</p>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Admissible (Approved)</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{admissibleCount}</p>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5">
            {(['all', 'inadmissible', 'admissible'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors capitalize ${
                  filter === mode
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode === 'all' ? 'All Clashes' : mode === 'inadmissible' ? `Inadmissible (${inadmissibleCount})` : `Admissible (${admissibleCount})`}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 italic">
            Inadmissible clashes trigger red warnings during student registration.
          </p>
        </div>

        {/* Clash List */}
        {filteredClashes.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Schedule Clashes Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              All offered courses are running on non-overlapping schedules or all detected overlaps have been cleared.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClashes.map((clash) => {
              const isAdmissible = clash.status === 'admissible';

              return (
                <div
                  key={clash.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isAdmissible
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-red-50/40 border-red-200 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isAdmissible
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {isAdmissible ? 'Admissible Exception' : 'Inadmissible Error'}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 capitalize">
                          • {clash.clashType.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
                        <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                          {clash.classATitle}
                        </span>
                        <span className="text-xs font-black text-slate-400">VS</span>
                        <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                          {clash.classBTitle}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${isAdmissible ? 'text-emerald-600' : 'text-red-600'}`} />
                        <span>{clash.conflictDetail}</span>
                      </p>

                      {clash.reasonNotes && (
                        <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200 text-xs text-slate-600">
                          <strong>Staff Note:</strong> {clash.reasonNotes}
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                      {isAdmissible ? (
                        <button
                          onClick={() => onUpdateClashStatus(clash.id, 'inadmissible', clash.reasonNotes)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Mark Inadmissible</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateClashStatus(clash.id, 'admissible', clash.reasonNotes || 'Approved schedule exception')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Admissible</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingNotesId(editingNotesId === clash.id ? null : clash.id);
                          setNotesInput(clash.reasonNotes || '');
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors"
                      >
                        {editingNotesId === clash.id ? 'Cancel' : 'Add Note'}
                      </button>
                    </div>
                  </div>

                  {/* Note Editing Form */}
                  {editingNotesId === clash.id && (
                    <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700">Resolution / Approval Notes:</label>
                      <input
                        type="text"
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        placeholder="e.g. Approved self-paced module or dual instructor supervision"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSaveNotes(clash.id)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
