import { ClassItem, SbaHubOption, ScheduleClash, ClashType, ClashAdmissibility } from '../types';

// Convert time strings like "16:00", "4:00 PM", "04:00 PM", "9:30 AM" into minutes from midnight (0..1439)
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toUpperCase();
  const isPM = cleaned.includes('PM');
  const isAM = cleaned.includes('AM');
  const rawTime = cleaned.replace(/(AM|PM)/g, '').trim();
  const parts = rawTime.split(':');
  let hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Convert minutes from midnight back to 12-hour formatted time (e.g., "4:00 PM")
export function minutesToFormattedTime(totalMinutes: number): string {
  const mins = totalMinutes % 60;
  let hours = Math.floor(totalMinutes / 60) % 24;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours}:${minsStr} ${ampm}`;
}

// Parse days from array or string like "Mondays & Wednesdays 4:00 PM - 5:30 PM"
export function extractDaysAndTimes(item: {
  days?: string[];
  startTime?: string;
  endTime?: string;
  schedule?: string;
}): { days: string[]; startMins: number; endMins: number } {
  let days: string[] = item.days || [];

  if (!days || days.length === 0) {
    const text = (item.schedule || '').toLowerCase();
    days = [];
    if (text.includes('mon')) days.push('Monday');
    if (text.includes('tue')) days.push('Tuesday');
    if (text.includes('wed')) days.push('Wednesday');
    if (text.includes('thu')) days.push('Thursday');
    if (text.includes('fri')) days.push('Friday');
    if (text.includes('sat')) days.push('Saturday');
    if (text.includes('sun')) days.push('Sunday');
  }

  let startMins = 0;
  let endMins = 0;

  if (item.startTime && item.endTime) {
    startMins = timeToMinutes(item.startTime);
    endMins = timeToMinutes(item.endTime);
  } else if (item.schedule) {
    // Try regex extraction from text schedule "4:00 PM - 5:30 PM"
    const match = item.schedule.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    if (match) {
      startMins = timeToMinutes(match[1]);
      endMins = timeToMinutes(match[2]);
    } else {
      startMins = 16 * 60; // default 4:00 PM
      endMins = 17 * 60 + 30; // default 5:30 PM
    }
  }

  return { days, startMins, endMins };
}

// Check if two schedule intervals overlap on any common day
export function checkScheduleOverlap(
  itemA: { id: string; title: string; days?: string[]; startTime?: string; endTime?: string; schedule?: string; location?: string; instructor?: string },
  itemB: { id: string; title: string; days?: string[]; startTime?: string; endTime?: string; schedule?: string; location?: string; instructor?: string }
): { overlaps: boolean; commonDays: string[]; detail: string; clashType: ClashType } | null {
  if (itemA.id === itemB.id) return null;

  const schedA = extractDaysAndTimes(itemA);
  const schedB = extractDaysAndTimes(itemB);

  // Find common days
  const commonDays = schedA.days.filter((d) => schedB.days.includes(d));
  if (commonDays.length === 0) return null;

  // Check time interval overlap: [A_start, A_end] & [B_start, B_end]
  // Overlap condition: max(A_start, B_start) < min(A_end, B_end)
  const maxStart = Math.max(schedA.startMins, schedB.startMins);
  const minEnd = Math.min(schedA.endMins, schedB.endMins);

  if (maxStart < minEnd) {
    let clashType: ClashType = 'time_overlap';
    let detailPrefix = `Time Overlap on ${commonDays.join(', ')}`;

    if (itemA.location && itemB.location && itemA.location.toLowerCase() === itemB.location.toLowerCase()) {
      clashType = 'room_conflict';
      detailPrefix = `Room Conflict in ${itemA.location} on ${commonDays.join(', ')}`;
    } else if (itemA.instructor && itemB.instructor && itemA.instructor.toLowerCase() === itemB.instructor.toLowerCase()) {
      clashType = 'instructor_conflict';
      detailPrefix = `Instructor Conflict (${itemA.instructor}) on ${commonDays.join(', ')}`;
    }

    const timeRangeStr = `${minutesToFormattedTime(schedA.startMins)}-${minutesToFormattedTime(schedA.endMins)} vs ${minutesToFormattedTime(schedB.startMins)}-${minutesToFormattedTime(schedB.endMins)}`;
    const detail = `${detailPrefix} (${timeRangeStr})`;

    return {
      overlaps: true,
      commonDays,
      detail,
      clashType,
    };
  }

  return null;
}

// Detect all clashes among a list of offered classes
export function detectAllScheduleClashes(classes: ClassItem[] = [], sbaOptions: SbaHubOption[] = []): ScheduleClash[] {
  const clashes: ScheduleClash[] = [];
  
  // Filter to offered classes only
  const offeredClasses = (classes || []).filter((c) => c && c.isOffered !== false);

  for (let i = 0; i < offeredClasses.length; i++) {
    for (let j = i + 1; j < offeredClasses.length; j++) {
      const clsA = offeredClasses[i];
      const clsB = offeredClasses[j];
      const result = checkScheduleOverlap(clsA, clsB);

      if (result) {
        const clashId = `clash-${clsA.id}-${clsB.id}`;
        clashes.push({
          id: clashId,
          classAId: clsA.id,
          classATitle: clsA.title,
          classBId: clsB.id,
          classBTitle: clsB.title,
          clashType: result.clashType,
          conflictDetail: result.detail,
          status: 'inadmissible', // default inadmissible until staff marks admissible
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  return clashes;
}

export const detectScheduleClashes = detectAllScheduleClashes;

// Check selected classes for a student against known clashes
export function checkStudentSelectedClashes(
  selectedClassIds: string[] = [],
  allClasses: ClassItem[] = [],
  existingClashes: ScheduleClash[] = []
): {
  hasClash: boolean;
  hasInadmissibleClash: boolean;
  clashes: Array<{
    classA: ClassItem;
    classB: ClassItem;
    clashRecord?: ScheduleClash;
    detail: string;
    isAdmissible: boolean;
  }>;
} {
  const safeSelectedIds = selectedClassIds || [];
  const safeAllClasses = allClasses || [];
  const safeClashes = existingClashes || [];

  const selectedClasses = safeAllClasses.filter((c) => c && safeSelectedIds.includes(c.id));
  const clashesFound: Array<{
    classA: ClassItem;
    classB: ClassItem;
    clashRecord?: ScheduleClash;
    detail: string;
    isAdmissible: boolean;
  }> = [];

  let hasInadmissibleClash = false;

  for (let i = 0; i < selectedClasses.length; i++) {
    for (let j = i + 1; j < selectedClasses.length; j++) {
      const clsA = selectedClasses[i];
      const clsB = selectedClasses[j];
      const overlap = checkScheduleOverlap(clsA, clsB);

      if (overlap) {
        // Look up if staff marked this clash admissible in existingClashes
        const existing = safeClashes.find(
          (c) =>
            c &&
            ((c.classAId === clsA.id && c.classBId === clsB.id) ||
              (c.classAId === clsB.id && c.classBId === clsA.id))
        );

        const isAdmissible = existing ? existing.status === 'admissible' : false;
        if (!isAdmissible) {
          hasInadmissibleClash = true;
        }

        clashesFound.push({
          classA: clsA,
          classB: clsB,
          clashRecord: existing,
          detail: overlap.detail,
          isAdmissible,
        });
      }
    }
  }

  return {
    hasClash: clashesFound.length > 0,
    hasInadmissibleClash,
    clashes: clashesFound,
  };
}
