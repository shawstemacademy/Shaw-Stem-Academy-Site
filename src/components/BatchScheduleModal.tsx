import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ClassItem,
  SbaHubOption,
  LocationOption,
  SchoolUser,
  DayScheduleItem,
} from '../types';
import {
  timeToMinutes,
  minutesToFormattedTime,
  extractDaysAndTimes,
  checkScheduleOverlap,
} from '../lib/scheduleClashUtils';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_PRESETS = [
  { label: '8:00 AM - 9:30 AM', start: '08:00', end: '09:30' },
  { label: '9:00 AM - 10:30 AM', start: '09:00', end: '10:30' },
  { label: '10:30 AM - 12:00 PM', start: '10:30', end: '12:00' },
  { label: '1:00 PM - 2:30 PM', start: '13:00', end: '14:30' },
  { label: '3:30 PM - 5:00 PM', start: '15:30', end: '17:00' },
  { label: '4:00 PM - 5:30 PM', start: '16:00', end: '17:30' },
  { label: '5:00 PM - 6:00 PM', start: '17:00', end: '18:00' },
  { label: '5:00 PM - 6:30 PM', start: '17:00', end: '18:30' },
  { label: '6:00 PM - 7:00 PM', start: '18:00', end: '19:00' },
  { label: '6:30 PM - 8:00 PM', start: '18:30', end: '20:00' },
  { label: '7:00 PM - 8:00 PM', start: '19:00', end: '20:00' },
];

const DAY_PRESETS = [
  { label: 'Mon & Wed', days: ['Monday', 'Wednesday'] },
  { label: 'Tue & Thu', days: ['Tuesday', 'Thursday'] },
  { label: 'Mon, Wed, Fri', days: ['Monday', 'Wednesday', 'Friday'] },
  { label: 'Saturday Only', days: ['Saturday'] },
  { label: 'Sunday Only', days: ['Sunday'] },
  { label: 'Daily (Mon-Fri)', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
  { label: 'Weekend (Sat-Sun)', days: ['Saturday', 'Sunday'] },
];

interface BatchScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType?: 'classes' | 'sba';
  selectedClasses: ClassItem[];
  selectedSbaOptions: SbaHubOption[];
  allClasses: ClassItem[];
  allSbaOptions: SbaHubOption[];
  locations: LocationOption[];
  schoolUsers?: SchoolUser[];
  onApplyClasses: (updated: ClassItem[]) => void;
  onApplySbaOptions: (updated: SbaHubOption[]) => void;
}

type ScheduleMode = 'custom_days' | 'time_shift' | 'clear_schedule';

export const BatchScheduleModal: React.FC<BatchScheduleModalProps> = ({
  isOpen,
  onClose,
  targetType = 'classes',
  selectedClasses,
  selectedSbaOptions,
  allClasses,
  allSbaOptions,
  locations,
  schoolUsers = [],
  onApplyClasses,
  onApplySbaOptions,
}) => {
  // Active target items - Deselect all classes by default when opening batch schedule
  const isClassMode = targetType === 'classes';
  const [activeSelectedIds, setActiveSelectedIds] = useState<string[]>([]);
  const [justAppliedMessage, setJustAppliedMessage] = useState<string | null>(null);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('custom_days');
  const [isPerDayTimeMode, setIsPerDayTimeMode] = useState<boolean>(true);
  const [isChipsExpanded, setIsChipsExpanded] = useState<boolean>(false);
  const [isOverlapDetailsOpen, setIsOverlapDetailsOpen] = useState<boolean>(false);

  // Selected Days
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday']);

  // Uniform times (used when isPerDayTimeMode is false)
  const [uniformStartTime, setUniformStartTime] = useState('17:00');
  const [uniformEndTime, setUniformEndTime] = useState('18:30');

  // Per-day times map: { [day: string]: { startTime: string; endTime: string } }
  const [dayTimesMap, setDayTimesMap] = useState<Record<string, { startTime: string; endTime: string }>>({
    Monday: { startTime: '17:00', endTime: '18:00' },
    Tuesday: { startTime: '17:00', endTime: '18:00' },
    Wednesday: { startTime: '18:00', endTime: '19:00' },
    Thursday: { startTime: '18:00', endTime: '19:00' },
    Friday: { startTime: '17:00', endTime: '18:30' },
    Saturday: { startTime: '09:00', endTime: '12:00' },
    Sunday: { startTime: '09:00', endTime: '12:00' },
  });

  // Optional Location & Instructor overrides
  const [targetLocation, setTargetLocation] = useState<string>('__keep__');
  const [customLocationInput, setCustomLocationInput] = useState<string>('');
  const [targetInstructor, setTargetInstructor] = useState<string>('__keep__');

  // Time Shifting Settings
  const [shiftHours, setShiftHours] = useState<number>(3);
  const [shiftDirection, setShiftDirection] = useState<'forward' | 'backward'>('forward');
  const [shiftEarliestStart, setShiftEarliestStart] = useState<string>('17:00');
  const [enforceEarliestStart, setEnforceEarliestStart] = useState<boolean>(true);

  // Filter staff users
  const staffTeachers = useMemo(() => {
    return schoolUsers.filter((u) => u.role === 'teacher' || u.role === 'admin' || u.role === 'staff' || u.role === 'superadmin');
  }, [schoolUsers]);

  // Reset selected classes to empty (deselected by default) whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveSelectedIds([]);
      setJustAppliedMessage(null);
    }
  }, [isOpen]);

  // Toggle single item selection
  const handleToggleItemSelection = (id: string) => {
    setActiveSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Toggle Day Selection
  const handleToggleDay = (day: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((d) => d !== day);
      } else {
        // preserve natural weekday order
        const next = [...prev, day];
        return DAYS_OF_WEEK.filter((d) => next.includes(d));
      }
    });
  };

  // Set Day Times for a specific day
  const handleSetDayTime = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setDayTimesMap((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { startTime: '17:00', endTime: '18:30' }),
        [field]: value,
      },
    }));
  };

  // Format a schedule string from day schedules
  const buildScheduleString = (
    days: string[],
    perDay: boolean,
    dayTimes: Record<string, { startTime: string; endTime: string }>,
    uniformStart: string,
    uniformEnd: string
  ): string => {
    if (days.length === 0) return 'Flexible Schedule';

    if (!perDay) {
      const daysFormatted = days.length === 1 ? `${days[0]}s` : days.join(' & ');
      const startFormatted = minutesToFormattedTime(timeToMinutes(uniformStart));
      const endFormatted = minutesToFormattedTime(timeToMinutes(uniformEnd));
      return `${daysFormatted} (${startFormatted} - ${endFormatted})`;
    }

    // Check if all selected days have identical start and end times
    const firstDay = days[0];
    const firstTime = dayTimes[firstDay] || { startTime: '17:00', endTime: '18:30' };
    const allIdentical = days.every((d) => {
      const t = dayTimes[d] || { startTime: '17:00', endTime: '18:30' };
      return t.startTime === firstTime.startTime && t.endTime === firstTime.endTime;
    });

    if (allIdentical) {
      const daysFormatted = days.length === 1 ? `${days[0]}s` : days.join(' & ');
      const startFormatted = minutesToFormattedTime(timeToMinutes(firstTime.startTime));
      const endFormatted = minutesToFormattedTime(timeToMinutes(firstTime.endTime));
      return `${daysFormatted} (${startFormatted} - ${endFormatted})`;
    }

    // Different times per day: format each day nicely
    const parts = days.map((day) => {
      const t = dayTimes[day] || { startTime: '17:00', endTime: '18:30' };
      const sFormatted = minutesToFormattedTime(timeToMinutes(t.startTime));
      const eFormatted = minutesToFormattedTime(timeToMinutes(t.endTime));
      return `${day}s (${sFormatted} - ${eFormatted})`;
    });

    return parts.join(' & ');
  };

  // Calculate Proposed Schedules for the active selected items
  const proposedItems = useMemo(() => {
    const activeTargets = isClassMode
      ? allClasses.filter((c) => activeSelectedIds.includes(c.id))
      : allSbaOptions.filter((s) => activeSelectedIds.includes(s.id));

    return activeTargets.map((item) => {
      const originalDays = item.days || [];
      const originalStart = item.startTime || '17:00';
      const originalEnd = item.endTime || '18:30';
      const originalLocation = item.location || 'Online';
      const originalInstructor = item.instructor || 'Vacant';
      const originalSchedule = item.schedule || 'Flexible Schedule';

      let newDays: string[] = [];
      let newDaySchedules: DayScheduleItem[] | undefined = undefined;
      let newStartTime = originalStart;
      let newEndTime = originalEnd;
      let newSchedule = originalSchedule;
      let newLocation = originalLocation;
      let newInstructor = originalInstructor;

      // Handle Location override
      if (targetLocation === '__custom__') {
        newLocation = customLocationInput.trim() || originalLocation;
      } else if (targetLocation !== '__keep__') {
        newLocation = targetLocation;
      }

      // Handle Instructor override
      if (targetInstructor !== '__keep__') {
        newInstructor = targetInstructor;
      }

      if (scheduleMode === 'custom_days') {
        newDays = selectedDays;
        if (isPerDayTimeMode) {
          newDaySchedules = selectedDays.map((day) => {
            const dt = dayTimesMap[day] || { startTime: '17:00', endTime: '18:30' };
            return {
              day,
              startTime: dt.startTime,
              endTime: dt.endTime,
            };
          });
          const firstDay = selectedDays[0];
          const firstDt = dayTimesMap[firstDay] || { startTime: '17:00', endTime: '18:30' };
          newStartTime = firstDt.startTime;
          newEndTime = firstDt.endTime;
        } else {
          newStartTime = uniformStartTime;
          newEndTime = uniformEndTime;
          newDaySchedules = selectedDays.map((day) => ({
            day,
            startTime: uniformStartTime,
            endTime: uniformEndTime,
          }));
        }

        newSchedule = buildScheduleString(
          selectedDays,
          isPerDayTimeMode,
          dayTimesMap,
          uniformStartTime,
          uniformEndTime
        );
      } else if (scheduleMode === 'time_shift') {
        newDays = originalDays.length > 0 ? originalDays : ['Monday', 'Wednesday'];
        const extracted = extractDaysAndTimes(item);
        const shiftMinutes = shiftHours * 60 * (shiftDirection === 'forward' ? 1 : -1);

        let newStartMins = extracted.startMins + shiftMinutes;
        let newEndMins = extracted.endMins + shiftMinutes;

        if (enforceEarliestStart) {
          const earliestMins = timeToMinutes(shiftEarliestStart);
          if (newStartMins < earliestMins) {
            const diff = earliestMins - newStartMins;
            newStartMins = earliestMins;
            newEndMins += diff;
          }
        }

        // Clamp to 24-hour limits
        newStartMins = Math.max(0, Math.min(1439, newStartMins));
        newEndMins = Math.max(newStartMins + 30, Math.min(1439, newEndMins));

        newStartTime = minutesToFormattedTime(newStartMins);
        newEndTime = minutesToFormattedTime(newEndMins);

        const daysFormatted = newDays.length === 1 ? `${newDays[0]}s` : newDays.join(' & ');
        newSchedule = `${daysFormatted} (${newStartTime} - ${newEndTime})`;

        newDaySchedules = newDays.map((d) => ({
          day: d,
          startTime: newStartTime,
          endTime: newEndTime,
        }));
      } else if (scheduleMode === 'clear_schedule') {
        newDays = [];
        newDaySchedules = [];
        newStartTime = '';
        newEndTime = '';
        newSchedule = 'Flexible Schedule / TBA';
      }

      return {
        id: item.id,
        title: isClassMode ? (item as ClassItem).title : (item as SbaHubOption).name,
        original: {
          days: originalDays,
          schedule: originalSchedule,
          startTime: originalStart,
          endTime: originalEnd,
          location: originalLocation,
          instructor: originalInstructor,
        },
        proposed: {
          days: newDays,
          daySchedules: newDaySchedules,
          schedule: newSchedule,
          startTime: newStartTime,
          endTime: newEndTime,
          location: newLocation,
          instructor: newInstructor,
        },
        rawItem: item,
      };
    });
  }, [
    isClassMode,
    allClasses,
    allSbaOptions,
    activeSelectedIds,
    scheduleMode,
    selectedDays,
    isPerDayTimeMode,
    dayTimesMap,
    uniformStartTime,
    uniformEndTime,
    targetLocation,
    customLocationInput,
    targetInstructor,
    shiftHours,
    shiftDirection,
    shiftEarliestStart,
    enforceEarliestStart,
  ]);

  // Clash detection among proposed items
  const detectedClashes = useMemo(() => {
    const clashes: Array<{ titleA: string; titleB: string; detail: string; type: string }> = [];

    for (let i = 0; i < proposedItems.length; i++) {
      for (let j = i + 1; j < proposedItems.length; j++) {
        const a = proposedItems[i];
        const b = proposedItems[j];

        const itemA = {
          id: a.id,
          title: a.title,
          days: a.proposed.days,
          daySchedules: a.proposed.daySchedules,
          startTime: a.proposed.startTime,
          endTime: a.proposed.endTime,
          schedule: a.proposed.schedule,
          location: a.proposed.location,
          instructor: a.proposed.instructor,
        };

        const itemB = {
          id: b.id,
          title: b.title,
          days: b.proposed.days,
          daySchedules: b.proposed.daySchedules,
          startTime: b.proposed.startTime,
          endTime: b.proposed.endTime,
          schedule: b.proposed.schedule,
          location: b.proposed.location,
          instructor: b.proposed.instructor,
        };

        const overlap = checkScheduleOverlap(itemA, itemB);
        if (overlap) {
          clashes.push({
            titleA: a.title,
            titleB: b.title,
            detail: overlap.detail,
            type: overlap.clashType,
          });
        }
      }
    }

    return clashes;
  }, [proposedItems]);

  // Apply Changes Handler - Do NOT close modal, keep window open and show success notification
  const handleApply = () => {
    if (activeSelectedIds.length === 0) return;

    if (isClassMode) {
      const updated = allClasses.map((cls) => {
        const match = proposedItems.find((p) => p.id === cls.id);
        if (!match) return cls;
        return {
          ...cls,
          days: match.proposed.days,
          daySchedules: match.proposed.daySchedules,
          startTime: match.proposed.startTime,
          endTime: match.proposed.endTime,
          schedule: match.proposed.schedule,
          location: match.proposed.location,
          instructor: match.proposed.instructor,
        };
      });
      onApplyClasses(updated);
    } else {
      const updated = allSbaOptions.map((sba) => {
        const match = proposedItems.find((p) => p.id === sba.id);
        if (!match) return sba;
        return {
          ...sba,
          days: match.proposed.days,
          daySchedules: match.proposed.daySchedules,
          startTime: match.proposed.startTime,
          endTime: match.proposed.endTime,
          schedule: match.proposed.schedule,
          location: match.proposed.location,
          instructor: match.proposed.instructor,
        };
      });
      onApplySbaOptions(updated);
    }

    setJustAppliedMessage(`Successfully saved and updated schedule for ${activeSelectedIds.length} course${activeSelectedIds.length > 1 ? 's' : ''}!`);
    setTimeout(() => {
      setJustAppliedMessage(null);
    }, 6000);
  };

  const targetList = isClassMode
    ? (allClasses.length > 0 ? allClasses : selectedClasses)
    : (allSbaOptions.length > 0 ? allSbaOptions : selectedSbaOptions);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight text-white">Batch Schedule Classes</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                  {activeSelectedIds.length} {isClassMode ? 'Classes' : 'SBA Courses'} Selected
                </span>
              </div>
              <p className="text-xs text-purple-100 mt-1 font-medium">
                Set schedules, apply custom times per day, shift timetables, and assign rooms & instructors in bulk.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-xs">
          {/* Applied Success Notification Banner */}
          {justAppliedMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-100 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-emerald-950 dark:text-emerald-50">Changes Applied Successfully</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">{justAppliedMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJustAppliedMessage(null)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Target Items Selection Chips */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  Targeted Courses ({activeSelectedIds.length} of {targetList.length})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = targetList.map((c) => c.id);
                    setActiveSelectedIds(allIds);
                  }}
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer"
                >
                  Select All ({targetList.length})
                </button>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setActiveSelectedIds([])}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                >
                  Deselect All
                </button>
                {targetList.length > 8 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setIsChipsExpanded(!isChipsExpanded)}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isChipsExpanded ? 'Collapse' : `Show all (${targetList.length})`}</span>
                      {isChipsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div
              className={`flex flex-wrap gap-2 p-1 transition-all ${
                isChipsExpanded ? 'max-h-64' : 'max-h-32'
              } overflow-y-auto`}
            >
              {targetList.map((item) => {
                const isSelected = activeSelectedIds.includes(item.id);
                const title = isClassMode ? (item as ClassItem).title : (item as SbaHubOption).name;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleItemSelection(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
                      isSelected
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
                        isSelected ? 'bg-purple-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate max-w-[220px]">{title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex flex-col sm:flex-row rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1.5 border border-slate-200 dark:border-slate-700/80 gap-1">
            <button
              type="button"
              onClick={() => setScheduleMode('custom_days')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                scheduleMode === 'custom_days'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Set Days & Times (Per-Day Support)</span>
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode('time_shift')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                scheduleMode === 'time_shift'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Shift Time (Offset Schedule)</span>
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode('clear_schedule')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                scheduleMode === 'clear_schedule'
                  ? 'bg-white dark:bg-slate-900 text-red-700 dark:text-red-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-red-500" />
              <span>Reset to TBA</span>
            </button>
          </div>

          {/* MODE 1: CUSTOM DAYS & PER-DAY TIMES */}
          {scheduleMode === 'custom_days' && (
            <div className="space-y-6">
              {/* Day Selection & Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>Select Meeting Days</span>
                  </label>
                  {/* Quick Day Presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSelectedDays(preset.days)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-800 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/20'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-extrabold">{day.slice(0, 3)}</span>
                        <span className="text-[10px] opacity-80">{day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Configuration Mode Toggle */}
              <div className="p-4 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-purple-950 dark:text-purple-200 text-xs">Time Scheduling Mode</p>
                  <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
                    Choose whether all selected days meet at the same hour or at different times per day.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-purple-200 dark:border-purple-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPerDayTimeMode(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isPerDayTimeMode
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Different Time Per Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPerDayTimeMode(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isPerDayTimeMode
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Same Time All Days
                  </button>
                </div>
              </div>

              {/* TIME INPUTS */}
              {isPerDayTimeMode ? (
                /* PER-DAY TIME SELECTORS */
                <div className="space-y-3">
                  <label className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>Configure Start & End Times for Each Selected Day</span>
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {selectedDays.map((day) => {
                      const dt = dayTimesMap[day] || { startTime: '17:00', endTime: '18:30' };
                      const sMins = timeToMinutes(dt.startTime);
                      const eMins = timeToMinutes(dt.endTime);
                      const durationMins = Math.max(0, eMins - sMins);
                      const durHours = Math.floor(durationMins / 60);
                      const durRemMins = durationMins % 60;

                      return (
                        <div
                          key={day}
                          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                              {day}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              {durHours > 0 ? `${durHours} hr ` : ''}
                              {durRemMins > 0 ? `${durRemMins} min` : durHours === 0 ? '0 min' : ''} session
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Start Time</label>
                              <input
                                type="time"
                                value={dt.startTime}
                                onChange={(e) => handleSetDayTime(day, 'startTime', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs focus:ring-2 focus:ring-purple-500 outline-hidden cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 mb-1 block">End Time</label>
                              <input
                                type="time"
                                value={dt.endTime}
                                onChange={(e) => handleSetDayTime(day, 'endTime', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs focus:ring-2 focus:ring-purple-500 outline-hidden cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Quick Preset Selector for this day */}
                          <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {TIME_PRESETS.slice(6, 11).map((p) => (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() => {
                                  handleSetDayTime(day, 'startTime', p.start);
                                  handleSetDayTime(day, 'endTime', p.end);
                                }}
                                className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 hover:text-purple-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                              >
                                {p.label.replace(':00', '')}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* UNIFORM TIME SELECTOR */
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>Start & End Time (Applied to all {selectedDays.length} selected days)</span>
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {TIME_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setUniformStartTime(p.start);
                            setUniformEndTime(p.end);
                          }}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-800 transition-colors cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">Start Time</label>
                      <input
                        type="time"
                        value={uniformStartTime}
                        onChange={(e) => setUniformStartTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs focus:ring-2 focus:ring-purple-500 outline-hidden cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">End Time</label>
                      <input
                        type="time"
                        value={uniformEndTime}
                        onChange={(e) => setUniformEndTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs focus:ring-2 focus:ring-purple-500 outline-hidden cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LOCATION & INSTRUCTOR BATCH ASSIGNMENT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Location Override */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5">
                  <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span>Classroom / Location</span>
                  </label>
                  <select
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-hidden cursor-pointer"
                  >
                    <option value="__keep__">Keep Current Locations (Do not change)</option>
                    <option value="Online (Zoom / Meet)">Online (Zoom / Meet)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name} {loc.building ? `(${loc.building})` : ''}
                      </option>
                    ))}
                    <option value="__custom__">+ Enter Custom Location Name...</option>
                  </select>
                  {targetLocation === '__custom__' && (
                    <input
                      type="text"
                      placeholder="e.g. Science Lab 3, Innovation Studio..."
                      value={customLocationInput}
                      onChange={(e) => setCustomLocationInput(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-hidden mt-1.5"
                    />
                  )}
                </div>

                {/* Instructor Override */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5">
                  <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>Assigned Instructor</span>
                  </label>
                  <select
                    value={targetInstructor}
                    onChange={(e) => setTargetInstructor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-hidden cursor-pointer"
                  >
                    <option value="__keep__">Keep Current Instructors (Do not change)</option>
                    <option value="Vacant / TBD">Vacant / TBD</option>
                    {staffTeachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: TIME SHIFT */}
          {scheduleMode === 'time_shift' && (
            <div className="space-y-5">
              <div className="p-5 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-extrabold text-sm">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span>Shift Existing Time Slots</span>
                </div>
                <p className="text-xs text-purple-800 dark:text-purple-300">
                  Adjusts the current start and end times for each targeted class by an offset (e.g. shift Summer school classes 3 hours ahead).
                </p>
              </div>

              {/* Offset Settings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Shift Direction
                  </label>
                  <select
                    value={shiftDirection}
                    onChange={(e) => setShiftDirection(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-hidden cursor-pointer"
                  >
                    <option value="forward">+ Forward (Push Later into Afternoon/Evening)</option>
                    <option value="backward">- Backward (Move Earlier into Morning)</option>
                  </select>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Shift Amount (Hours)
                  </label>
                  <select
                    value={shiftHours}
                    onChange={(e) => setShiftHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-hidden cursor-pointer"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                    <option value={3}>3 Hours (Summer School Shift)</option>
                    <option value={4}>4 Hours</option>
                    <option value={5}>5 Hours</option>
                  </select>
                </div>
              </div>

              {/* EARLIEST START BOUNDARY CARD */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label htmlFor="enforceEarliest" className="flex items-start sm:items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="enforceEarliest"
                      checked={enforceEarliestStart}
                      onChange={(e) => setEnforceEarliestStart(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer mt-0.5 sm:mt-0"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">
                        Enforce Earliest Start Time Boundary
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Ensure shifted classes do not start before this specified hour
                      </span>
                    </div>
                  </label>

                  <div className="flex items-center gap-2 pl-7 sm:pl-0 shrink-0">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      Earliest:
                    </span>
                    <input
                      type="time"
                      value={shiftEarliestStart}
                      disabled={!enforceEarliestStart}
                      onChange={(e) => setShiftEarliestStart(e.target.value)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs focus:ring-2 focus:ring-purple-500 outline-hidden disabled:opacity-40 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Presets for Earliest Start Boundary */}
                {enforceEarliestStart && (
                  <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
                    {['16:00', '16:30', '17:00', '17:30', '18:00'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setShiftEarliestStart(time)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          shiftEarliestStart === time
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-800'
                        }`}
                      >
                        {minutesToFormattedTime(timeToMinutes(time))}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE 3: CLEAR SCHEDULE */}
          {scheduleMode === 'clear_schedule' && (
            <div className="p-5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-3.5">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900 dark:text-red-200 text-sm">Reset Selected Classes to Flexible / TBA</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1 leading-relaxed">
                  This will clear meeting days, start times, and end times for all {activeSelectedIds.length} targeted courses and mark their schedule as "Flexible Schedule / TBA".
                </p>
              </div>
            </div>
          )}

          {/* CLASH WARNING BANNER */}
          {detectedClashes.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Notice: Potential Schedule Overlaps Detected ({detectedClashes.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOverlapDetailsOpen(!isOverlapDetailsOpen)}
                  className="text-[11px] font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 cursor-pointer flex items-center gap-1"
                >
                  <span>{isOverlapDetailsOpen ? 'Hide Details' : 'View Overlap Details'}</span>
                  {isOverlapDetailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Multiple targeted courses will be scheduled during the same time slots.
              </p>
              {isOverlapDetailsOpen && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                  {detectedClashes.map((c, i) => (
                    <div
                      key={i}
                      className="text-[10px] font-medium bg-white/90 dark:bg-slate-900/90 p-2 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 leading-relaxed shadow-2xs"
                    >
                      <span className="font-extrabold">{c.titleA}</span> & <span className="font-extrabold">{c.titleB}</span>: {c.detail}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LIVE IMPACT PREVIEW TABLE */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Schedule Preview ({proposedItems.length} courses)</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                {scheduleMode === 'custom_days' && isPerDayTimeMode
                  ? 'Customized Per-Day Schedule'
                  : scheduleMode === 'time_shift'
                  ? `Shifted by ${shiftHours} hr (${shiftDirection})`
                  : 'Batch Schedule Preview'}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Course Title</th>
                      <th className="p-3">Current Schedule</th>
                      <th className="p-3">Proposed New Schedule</th>
                      <th className="p-3">Room & Instructor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {proposedItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-5 text-center text-slate-400 font-medium">
                          No courses selected. Select at least one course above to preview schedule.
                        </td>
                      </tr>
                    ) : (
                      proposedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100 max-w-[180px] truncate">
                            {item.title}
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate font-mono text-[11px]">
                            {item.original.schedule}
                          </td>
                          <td className="p-3 font-bold text-purple-700 dark:text-purple-300">
                            {item.proposed.schedule}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px]">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{item.proposed.location}</div>
                            <div className="text-[10px] text-slate-400">{item.proposed.instructor}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {activeSelectedIds.length === 0 ? (
              <span className="text-amber-600 font-bold">Select at least 1 course to schedule</span>
            ) : (
              <span>Ready to update {activeSelectedIds.length} course{activeSelectedIds.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={activeSelectedIds.length === 0}
              onClick={handleApply}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Batch Schedule ({activeSelectedIds.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
