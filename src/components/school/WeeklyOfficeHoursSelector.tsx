import React, { useState, useEffect } from 'react';
import { Clock, Copy, Check, Info, Calendar, MapPin, RotateCcw } from 'lucide-react';

export interface DaySchedule {
  day: string;
  shortDay: string;
  enabled: boolean;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "16:00"
}

const DEFAULT_DAYS: { day: string; shortDay: string }[] = [
  { day: 'Monday', shortDay: 'Mon' },
  { day: 'Tuesday', shortDay: 'Tue' },
  { day: 'Wednesday', shortDay: 'Wed' },
  { day: 'Thursday', shortDay: 'Thu' },
  { day: 'Friday', shortDay: 'Fri' },
  { day: 'Saturday', shortDay: 'Sat' },
  { day: 'Sunday', shortDay: 'Sun' },
];

export function parseTimeTo24(timeStr: string, defaultTime: string): string {
  if (!timeStr) return defaultTime;
  const clean = timeStr.trim().toUpperCase();
  const isPm = clean.includes('PM');
  const isAm = clean.includes('AM');
  const numPart = clean.replace(/[^\d:]/g, '');
  if (!numPart) return defaultTime;
  const parts = numPart.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] ? parseInt(parts[1], 10) : 0;
  if (isNaN(h)) return defaultTime;
  if (isPm && h < 12) h += 12;
  if (isAm && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTime24To12(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const m = mStr ? mStr.padStart(2, '0') : '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function parseScheduleFromText(text: string): { schedules: DaySchedule[]; locationNote: string } {
  let locationNote = '';
  let cleanText = text || '';

  const parenMatch = cleanText.match(/\(([^)]+)\)/);
  if (parenMatch) {
    locationNote = parenMatch[1];
    cleanText = cleanText.replace(/\([^)]+\)/, '').trim();
  }

  const initialSchedules: DaySchedule[] = DEFAULT_DAYS.map((d, idx) => ({
    ...d,
    enabled: idx < 5, // Mon-Fri default
    startTime: '08:00',
    endTime: '16:00',
  }));

  if (!cleanText) {
    return { schedules: initialSchedules, locationNote };
  }

  // Match pipe separated formats e.g. "Mon: 8:00 AM - 12:00 PM | Tue: 1:00 PM - 4:00 PM"
  if (cleanText.includes('|')) {
    const parts = cleanText.split('|');
    const updated = initialSchedules.map((s) => ({ ...s, enabled: false }));

    parts.forEach((part) => {
      const sub = part.trim();
      const match = sub.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*:\s*(.+?)\s*-\s*(.+)$/i);
      if (match) {
        const dayStr = match[1].substring(0, 3).toLowerCase();
        const startStr = match[2];
        const endStr = match[3];
        const idx = updated.findIndex((s) => s.shortDay.toLowerCase() === dayStr);
        if (idx !== -1) {
          updated[idx].enabled = true;
          updated[idx].startTime = parseTimeTo24(startStr, '08:00');
          updated[idx].endTime = parseTimeTo24(endStr, '16:00');
        }
      }
    });

    const anyEnabled = updated.some((s) => s.enabled);
    if (anyEnabled) {
      return { schedules: updated, locationNote };
    }
  }

  // Match range formats e.g. "Mon - Fri: 8:00 AM - 4:00 PM"
  const rangeMatch = cleanText.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*-\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*:?\s*(.+?)\s*-\s*(.+)$/i);
  if (rangeMatch) {
    const startDay = rangeMatch[1].substring(0, 3).toLowerCase();
    const endDay = rangeMatch[2].substring(0, 3).toLowerCase();
    const startT = parseTimeTo24(rangeMatch[3], '08:00');
    const endT = parseTimeTo24(rangeMatch[4], '16:00');

    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const sIdx = dayOrder.indexOf(startDay);
    const eIdx = dayOrder.indexOf(endDay);

    if (sIdx !== -1 && eIdx !== -1) {
      const updated = initialSchedules.map((s, idx) => {
        const isRange = idx >= Math.min(sIdx, eIdx) && idx <= Math.max(sIdx, eIdx);
        return {
          ...s,
          enabled: isRange,
          startTime: isRange ? startT : s.startTime,
          endTime: isRange ? endT : s.endTime,
        };
      });
      return { schedules: updated, locationNote };
    }
  }

  return { schedules: initialSchedules, locationNote: locationNote || cleanText };
}

export function buildScheduleString(schedules: DaySchedule[], locationNote: string): string {
  const active = schedules.filter((s) => s.enabled);
  if (active.length === 0) {
    return locationNote ? `By Appointment (${locationNote.trim()})` : 'By Appointment Only';
  }

  const firstTimeKey = `${active[0].startTime}-${active[0].endTime}`;
  const allSameTime = active.every((s) => `${s.startTime}-${s.endTime}` === firstTimeKey);

  let mainPart = '';
  if (allSameTime) {
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const indices = active.map((s) => dayOrder.indexOf(s.shortDay)).sort((a, b) => a - b);

    let isConsecutive = indices.length > 1;
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) {
        isConsecutive = false;
        break;
      }
    }

    const formattedTime = `${formatTime24To12(active[0].startTime)} - ${formatTime24To12(active[0].endTime)}`;

    if (isConsecutive) {
      const firstDay = dayOrder[indices[0]];
      const lastDay = dayOrder[indices[indices.length - 1]];
      mainPart = `${firstDay} - ${lastDay}: ${formattedTime}`;
    } else {
      const daysStr = active.map((s) => s.shortDay).join(', ');
      mainPart = `${daysStr}: ${formattedTime}`;
    }
  } else {
    mainPart = active
      .map((s) => `${s.shortDay}: ${formatTime24To12(s.startTime)} - ${formatTime24To12(s.endTime)}`)
      .join(' | ');
  }

  if (locationNote && locationNote.trim()) {
    mainPart += ` (${locationNote.trim()})`;
  }

  return mainPart;
}

interface WeeklyOfficeHoursSelectorProps {
  value: string;
  onChange: (newValue: string) => void;
}

export const WeeklyOfficeHoursSelector: React.FC<WeeklyOfficeHoursSelectorProps> = ({
  value,
  onChange,
}) => {
  const [schedules, setSchedules] = useState<DaySchedule[]>(() => {
    const { schedules } = parseScheduleFromText(value);
    return schedules;
  });
  const [locationNote, setLocationNote] = useState<string>(() => {
    const { locationNote } = parseScheduleFromText(value);
    return locationNote;
  });
  const [copiedDay, setCopiedDay] = useState<string | null>(null);

  // Synchronize generated string upward when internal state changes
  useEffect(() => {
    const formattedStr = buildScheduleString(schedules, locationNote);
    if (formattedStr !== value) {
      onChange(formattedStr);
    }
  }, [schedules, locationNote]);

  const handleToggleDay = (shortDay: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.shortDay === shortDay ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleTimeChange = (shortDay: string, field: 'startTime' | 'endTime', val: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.shortDay === shortDay ? { ...s, [field]: val } : s))
    );
  };

  const handleCopyTimeToAllActive = (sourceDay: DaySchedule) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.enabled
          ? { ...s, startTime: sourceDay.startTime, endTime: sourceDay.endTime }
          : s
      )
    );
    setCopiedDay(sourceDay.shortDay);
    setTimeout(() => setCopiedDay(null), 2000);
  };

  const handleApplyPreset = (preset: 'mon_fri' | 'mon_wed_fri' | 'tue_thu' | 'clear') => {
    if (preset === 'mon_fri') {
      setSchedules((prev) =>
        prev.map((s, idx) => ({
          ...s,
          enabled: idx < 5,
          startTime: '08:00',
          endTime: '16:00',
        }))
      );
    } else if (preset === 'mon_wed_fri') {
      setSchedules((prev) =>
        prev.map((s) => ({
          ...s,
          enabled: ['Mon', 'Wed', 'Fri'].includes(s.shortDay),
          startTime: '09:00',
          endTime: '12:00',
        }))
      );
    } else if (preset === 'tue_thu') {
      setSchedules((prev) =>
        prev.map((s) => ({
          ...s,
          enabled: ['Tue', 'Thu'].includes(s.shortDay),
          startTime: '13:00',
          endTime: '16:00',
        }))
      );
    } else if (preset === 'clear') {
      setSchedules((prev) => prev.map((s) => ({ ...s, enabled: false })));
    }
  };

  const resultString = buildScheduleString(schedules, locationNote);

  return (
    <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Weekly Office Hours Schedule
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyPreset('mon_fri')}
            className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            Mon-Fri (8-4)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('mon_wed_fri')}
            className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            Mon/Wed/Fri (Mornings)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('tue_thu')}
            className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            Tue/Thu (Afternoons)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('clear')}
            className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-[11px] font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Enable active availability days and set specific office hours for each day.
      </p>

      {/* Days Rows */}
      <div className="space-y-2">
        {schedules.map((s) => (
          <div
            key={s.shortDay}
            className={`p-2.5 rounded-xl border transition-all ${
              s.enabled
                ? 'bg-white border-blue-200 shadow-2xs'
                : 'bg-slate-100/60 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Day Checkbox & Name */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none min-w-[110px]">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={() => handleToggleDay(s.shortDay)}
                  className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span className={`text-xs font-extrabold ${s.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                  {s.day}
                </span>
              </label>

              {/* Time Pickers if enabled */}
              {s.enabled ? (
                <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="time"
                      value={s.startTime}
                      onChange={(e) => handleTimeChange(s.shortDay, 'startTime', e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                    />
                    <span className="text-slate-400 text-xs font-bold">to</span>
                    <input
                      type="time"
                      value={s.endTime}
                      onChange={(e) => handleTimeChange(s.shortDay, 'endTime', e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                    />
                  </div>

                  {/* Formatted Badge */}
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                    {formatTime24To12(s.startTime)} – {formatTime24To12(s.endTime)}
                  </span>

                  {/* Copy time button */}
                  <button
                    type="button"
                    onClick={() => handleCopyTimeToAllActive(s)}
                    title="Apply this day's start and end time to all active days"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                  >
                    {copiedDay === s.shortDay ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 text-[10px]">Applied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px] hidden sm:inline">Apply to All</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 italic">
                  Not Available / Off
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Location / Note */}
      <div className="pt-2 border-t border-slate-200">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
          Location / Consultation Notes (Optional)
        </label>
        <div className="relative">
          <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="e.g. STEM Building Room 302 or Virtual via Google Meet"
            value={locationNote}
            onChange={(e) => setLocationNote(e.target.value)}
            className="w-full pl-8 pr-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Live Formatted Output Preview */}
      <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase text-blue-700 tracking-wider block">
            Public Display Preview:
          </span>
          <p className="text-xs font-bold text-blue-950">
            {resultString}
          </p>
        </div>
      </div>
    </div>
  );
};
