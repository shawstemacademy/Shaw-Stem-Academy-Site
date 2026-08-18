import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { ClassItem, AttendanceRecord, RegistrationRecord, SchoolUser } from '../../types';
import { getDayNameFromDate, getFormattedFullDate, isClassScheduledOnDay } from './TeacherDashboardPage';

interface AttendanceCalendarPickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  classes: ClassItem[];
  selectedClassId: string;
  onSelectClassId: (classId: string) => void;
  attendanceRecords?: AttendanceRecord[];
  registrationLogs?: RegistrationRecord[];
  schoolUsers?: SchoolUser[];
  isExpandedDefault?: boolean;
  theme?: 'dark' | 'light';
  title?: string;
  subtitle?: string;
}

export const AttendanceCalendarPicker: React.FC<AttendanceCalendarPickerProps> = ({
  selectedDate,
  onSelectDate,
  classes,
  selectedClassId,
  onSelectClassId,
  attendanceRecords = [],
  registrationLogs = [],
  schoolUsers = [],
  isExpandedDefault = true,
  theme = 'dark',
  title = 'Pick Attendance Date & Class',
  subtitle = 'Select any day on the calendar to view and take attendance for classes scheduled on that day.'
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(isExpandedDefault);

  // Month navigation state
  const [viewYearMonth, setViewYearMonth] = useState<{ year: number; month: number }>(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-').map(Number);
      if (parts.length === 3 && parts[0] && parts[1]) {
        return { year: parts[0], month: parts[1] - 1 };
      }
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const selectedDayName = useMemo(() => getDayNameFromDate(selectedDate), [selectedDate]);

  // Scheduled classes for the selected date
  const scheduledClasses = useMemo(() => {
    return classes.filter((c) => isClassScheduledOnDay(c, selectedDayName));
  }, [classes, selectedDayName]);

  // Helper to get enrolled count for a class
  const getEnrolledCount = (classId: string) => {
    let count = 0;
    const seen = new Set<string>();

    registrationLogs.forEach((log) => {
      if (log.completedClassIds && log.completedClassIds.includes(classId)) return;
      const isVerified = Boolean(log.verifiedClassIds && log.verifiedClassIds.includes(classId));
      const isSelected = Boolean(
        log.selectedClasses?.some((c) => c.id === classId) ||
        log.selectedClassIds?.includes(classId) ||
        log.studentInfo?.selectedSbaHubIds?.includes(classId)
      );
      const isPaid = Boolean(
        log.isPaid || 
        log.status === 'enrolled_paid' || 
        log.status === 'completed' ||
        (log.payments && log.payments.length > 0)
      );
      if (isVerified || (isSelected && isPaid)) {
        const sid = log.studentInfo?.id || log.studentId || log.userId || log.id;
        if (sid && !seen.has(sid)) {
          seen.add(sid);
          count++;
        }
      }
    });

    schoolUsers.forEach((u) => {
      if (u.role === 'student' && u.status !== 'disabled') {
        if (u.completedClassIds && u.completedClassIds.includes(classId)) return;
        if (u.registeredClassIds && u.registeredClassIds.includes(classId)) {
          if (!seen.has(u.id)) {
            seen.add(u.id);
            count++;
          }
        }
      }
    });

    return count;
  };

  // Helper to count marked attendance records for a class on selectedDate
  const getMarkedCount = (classId: string, dateStr: string) => {
    return attendanceRecords.filter((a) => a.classId === classId && a.date === dateStr).length;
  };

  // Quick jump date handlers
  const handleJumpToToday = () => {
    onSelectDate(todayStr);
    const now = new Date();
    setViewYearMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  const handleShiftDay = (days: number) => {
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + days);
    const nextStr = d.toISOString().split('T')[0];
    onSelectDate(nextStr);
    setViewYearMonth({ year: d.getFullYear(), month: d.getMonth() });
  };

  // Calendar month days generation
  const calendarDays = useMemo(() => {
    const { year, month } = viewYearMonth;
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasScheduledClasses: boolean;
      attendanceRecordCount: number;
      dayName: string;
    }> = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevMonthDate = new Date(year, month - 1, dNum);
      const y = prevMonthDate.getFullYear();
      const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
      const d = String(prevMonthDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const dName = getDayNameFromDate(dateStr);
      const hasSched = classes.some((c) => isClassScheduledOnDay(c, dName));
      const attCount = attendanceRecords.filter((a) => a.date === dateStr).length;

      days.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasScheduledClasses: hasSched,
        attendanceRecordCount: attCount,
        dayName: dName
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const m = String(month + 1).padStart(2, '0');
      const d = String(i).padStart(2, '0');
      const dateStr = `${year}-${m}-${d}`;
      const dName = getDayNameFromDate(dateStr);
      const hasSched = classes.some((c) => isClassScheduledOnDay(c, dName));
      const attCount = attendanceRecords.filter((a) => a.date === dateStr).length;

      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasScheduledClasses: hasSched,
        attendanceRecordCount: attCount,
        dayName: dName
      });
    }

    // Next month filler days to complete 42 days grid (6 weeks)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthDate = new Date(year, month + 1, i);
      const y = nextMonthDate.getFullYear();
      const m = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
      const d = String(nextMonthDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const dName = getDayNameFromDate(dateStr);
      const hasSched = classes.some((c) => isClassScheduledOnDay(c, dName));
      const attCount = attendanceRecords.filter((a) => a.date === dateStr).length;

      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasScheduledClasses: hasSched,
        attendanceRecordCount: attCount,
        dayName: dName
      });
    }

    return days;
  }, [viewYearMonth, todayStr, selectedDate, classes, attendanceRecords]);

  const monthYearLabel = useMemo(() => {
    const d = new Date(viewYearMonth.year, viewYearMonth.month, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewYearMonth]);

  const handlePrevMonth = () => {
    setViewYearMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewYearMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isDark
          ? 'bg-slate-950/80 border-slate-800 text-slate-100 shadow-inner'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      } p-4 space-y-4`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
              <span>{title}</span>
              {selectedDate === todayStr && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  TODAY
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400 line-clamp-1">{subtitle}</p>
          </div>
        </div>

        {/* Quick Date Shift Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleShiftDay(-1)}
            title="Previous Day"
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleJumpToToday}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              selectedDate === todayStr
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                : isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-800'
                : 'bg-slate-50 hover:bg-slate-100 text-emerald-700 border-slate-200'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => handleShiftDay(1)}
            title="Next Day"
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isCalendarOpen
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                : isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{isCalendarOpen ? 'Hide Month' : 'Browse Calendar'}</span>
          </button>
        </div>
      </div>

      {/* Prominent Active Date Banner */}
      <div
        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-black text-emerald-400 uppercase tracking-wider">
              Marking Attendance For:
            </div>
            <div className="text-sm font-extrabold text-white">
              {getFormattedFullDate(selectedDate)}
            </div>
          </div>
        </div>

        {/* Direct Native Date Input fallback */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label className="text-[11px] text-slate-400 font-bold hidden sm:inline">Jump to Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                onSelectDate(e.target.value);
                const parts = e.target.value.split('-').map(Number);
                if (parts[0] && parts[1]) {
                  setViewYearMonth({ year: parts[0], month: parts[1] - 1 });
                }
              }
            }}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${
              isDark
                ? 'bg-slate-950 text-slate-100 border-slate-700'
                : 'bg-white text-slate-800 border-slate-300'
            }`}
          />
        </div>
      </div>

      {/* Interactive Month Calendar Grid */}
      {isCalendarOpen && (
        <div
          className={`p-3.5 rounded-xl border animate-fade-in ${
            isDark ? 'bg-slate-900/60 border-slate-800/90' : 'bg-slate-50/80 border-slate-200'
          } space-y-3`}
        >
          {/* Month & Year Navigation */}
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">
              {monthYearLabel}
            </h5>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
              <div key={w} className="text-[10px] font-black text-slate-500 uppercase tracking-widest py-1">
                {w}
              </div>
            ))}
          </div>

          {/* 42-day calendar cells grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((cell, idx) => {
              return (
                <button
                  key={cell.dateStr + idx}
                  type="button"
                  onClick={() => {
                    onSelectDate(cell.dateStr);
                    if (!cell.isCurrentMonth) {
                      const parts = cell.dateStr.split('-').map(Number);
                      setViewYearMonth({ year: parts[0], month: parts[1] - 1 });
                    }
                  }}
                  className={`min-h-[38px] p-1 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                    cell.isSelected
                      ? 'bg-emerald-600 text-white font-black shadow-md ring-2 ring-emerald-400/50 z-10 scale-105'
                      : cell.isToday
                      ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-bold hover:bg-emerald-900/60'
                      : cell.isCurrentMonth
                      ? 'hover:bg-slate-800/80 text-slate-200'
                      : 'opacity-30 text-slate-500 hover:opacity-70 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-xs">{cell.dayNumber}</span>

                  {/* Indicator Dots */}
                  <div className="flex items-center gap-0.5 mt-0.5 h-1.5">
                    {cell.hasScheduledClasses && (
                      <span
                        className={`w-1 h-1 rounded-full ${
                          cell.isSelected ? 'bg-white' : 'bg-emerald-400'
                        }`}
                        title="Classes scheduled on this day"
                      />
                    )}
                    {cell.attendanceRecordCount > 0 && (
                      <span
                        className={`w-1 h-1 rounded-full ${
                          cell.isSelected ? 'bg-amber-300' : 'bg-amber-400'
                        }`}
                        title={`${cell.attendanceRecordCount} attendance records logged on this day`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Scheduled Class</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Attendance Logged</span>
              </span>
            </div>
            <span>Click any day to pick</span>
          </div>
        </div>
      )}

      {/* Classes on Selected Day Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Classes Scheduled on {selectedDayName} ({scheduledClasses.length})
            </h5>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {classes.length} Total Course(s) Assigned
          </span>
        </div>

        {/* Scheduled Class Cards on Selected Date */}
        {scheduledClasses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scheduledClasses.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const enrolled = getEnrolledCount(cls.id);
              const marked = getMarkedCount(cls.id, selectedDate);

              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => onSelectClassId(cls.id)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/40'
                      : isDark
                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h6 className="text-xs font-black truncate flex items-center gap-1.5">
                        <span>{cls.title}</span>
                      </h6>
                      <p className="text-[11px] text-slate-400 truncate">
                        {cls.subject || cls.category || 'Academic Course'}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-700 text-slate-500 text-[10px] flex items-center justify-center">
                          ○
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>{cls.schedule || `${cls.startTime || 'TBA'} - ${cls.endTime || ''}`}</span>
                    </span>

                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                      <Users className="w-3 h-3" />
                      <span>{enrolled} Enrolled</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-300">{marked} Marked</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-1">
            <p className="text-xs font-bold text-slate-300">
              No standard classes scheduled on {selectedDayName} in timetable.
            </p>
            <p className="text-[11px] text-slate-500">
              You can still mark attendance for any class below or choose a different date from the calendar.
            </p>
          </div>
        )}

        {/* Dropdown for All Classes (fallback & off-schedule classes) */}
        <div className="pt-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Or Choose Any Assigned Course:
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => onSelectClassId(e.target.value)}
            className={`w-full text-xs font-bold px-3 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${
              isDark
                ? 'bg-slate-900 text-slate-100 border-slate-800'
                : 'bg-white text-slate-800 border-slate-300'
            }`}
          >
            {classes.length === 0 ? (
              <option value="">No courses assigned</option>
            ) : (
              classes.map((c) => {
                const matchesDay = isClassScheduledOnDay(c, selectedDayName);
                return (
                  <option key={c.id} value={c.id}>
                    {matchesDay ? '✓ [Matches Day] ' : '• [Off-Schedule] '}
                    {c.title} ({c.schedule || 'Flexible'})
                  </option>
                );
              })
            )}
          </select>
        </div>
      </div>
    </div>
  );
};
