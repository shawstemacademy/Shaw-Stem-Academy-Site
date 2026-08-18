import { ClassItem } from '../types';

export interface SummerScheduleDefinition {
  subjectKey: string;
  displayTitle: string;
  days: string[];
  schedule: string;
  startTime: string;
  endTime: string;
  matchedKeywords: string[];
}

/**
 * Summer School Timetable Definitions
 * Derived from the official Summer School Schedule:
 * Original time slots pushed ahead by 3 hours (earliest start: 5:00 PM):
 * - Mon: 5:00 PM Chemistry, 6:00 PM Math, 7:00 PM Integrated Science
 * - Tue: 5:00 PM Physics, 6:00 PM Integrated Science
 * - Wed: 5:00 PM Math, 6:00 PM Chemistry
 * - Thu: 5:00 PM Physics, 6:00 PM Biology
 */
export const SUMMER_SCHEDULE_DEFINITIONS: SummerScheduleDefinition[] = [
  {
    subjectKey: 'chemistry',
    displayTitle: 'CXC Chemistry Form 5',
    days: ['Monday', 'Wednesday'],
    schedule: 'Mondays (5:00 PM - 6:00 PM) & Wednesdays (6:00 PM - 7:00 PM)',
    startTime: '17:00',
    endTime: '19:00',
    matchedKeywords: ['chem', 'chemistry'],
  },
  {
    subjectKey: 'physics',
    displayTitle: 'CXC Physics Form 5',
    days: ['Tuesday', 'Thursday'],
    schedule: 'Tuesdays & Thursdays (5:00 PM - 6:00 PM)',
    startTime: '17:00',
    endTime: '18:00',
    matchedKeywords: ['physic', 'physics', 'physica'],
  },
  {
    subjectKey: 'math',
    displayTitle: 'CXC Mathematics Form 5',
    days: ['Monday', 'Wednesday'],
    schedule: 'Wednesdays (5:00 PM - 6:00 PM) & Mondays (6:00 PM - 7:00 PM)',
    startTime: '17:00',
    endTime: '19:00',
    matchedKeywords: ['math', 'mathematics', 'add math', 'pure math'],
  },
  {
    subjectKey: 'integrated_science',
    displayTitle: 'CXC Integrated Science Form 5',
    days: ['Monday', 'Tuesday'],
    schedule: 'Tuesdays (6:00 PM - 7:00 PM) & Mondays (7:00 PM - 8:00 PM)',
    startTime: '18:00',
    endTime: '20:00',
    matchedKeywords: ['integrated science', 'int science', 'integrated sci', 'int sci'],
  },
  {
    subjectKey: 'biology',
    displayTitle: 'CXC Biology Form 5',
    days: ['Thursday'],
    schedule: 'Thursdays (6:00 PM - 7:00 PM)',
    startTime: '18:00',
    endTime: '19:00',
    matchedKeywords: ['bio', 'biology', 'human and social biology', 'hsb'],
  },
];

/**
 * Matches an existing class item to a summer schedule entry based on its title or category.
 */
export function getMatchingSummerSchedule(cls: Partial<ClassItem>): SummerScheduleDefinition | null {
  if (!cls || !cls.title) return null;
  const titleLower = cls.title.toLowerCase().trim();
  const categoryLower = (cls.category || '').toLowerCase().trim();

  // Integrated Science check first so generic 'science' doesn't conflict
  if (
    titleLower.includes('integrated') ||
    titleLower.includes('int sci') ||
    (titleLower.includes('science') && !titleLower.includes('computer') && !titleLower.includes('data'))
  ) {
    return SUMMER_SCHEDULE_DEFINITIONS.find((d) => d.subjectKey === 'integrated_science') || null;
  }

  for (const def of SUMMER_SCHEDULE_DEFINITIONS) {
    if (def.subjectKey === 'integrated_science') continue;
    const isMatch = def.matchedKeywords.some(
      (kw) => titleLower.includes(kw) || categoryLower.includes(kw)
    );
    if (isMatch) {
      return def;
    }
  }

  return null;
}

/**
 * Applies the timetable schedule to existing database classes that match the timetable subjects.
 * Strictly does NOT create any new classes.
 */
export function alignClassesWithSummerSchedule(existingClasses: ClassItem[]): {
  updatedClasses: ClassItem[];
  changedCount: number;
} {
  let changedCount = 0;

  const updatedClasses = existingClasses.map((cls) => {
    const match = getMatchingSummerSchedule(cls);
    if (!match) return cls;

    // Check if schedule is already aligned
    const isScheduleSame =
      cls.schedule === match.schedule &&
      cls.startTime === match.startTime &&
      cls.endTime === match.endTime &&
      Array.isArray(cls.days) &&
      cls.days.length === match.days.length &&
      cls.days.every((d) => match.days.includes(d));

    if (isScheduleSame) return cls;

    changedCount++;
    return {
      ...cls,
      schedule: match.schedule,
      days: match.days,
      startTime: match.startTime,
      endTime: match.endTime,
    };
  });

  return { updatedClasses, changedCount };
}
