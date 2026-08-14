/**
 * Safely parses and formats any date representation (ISO string, timestamp number,
 * Firestore Timestamp object with .toDate() or .seconds, or Date instance).
 */
export function parseSafeDate(val: any): Date | null {
  if (!val) return null;

  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // Firestore Timestamp instance with .toDate()
  if (typeof val === 'object' && typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch {
      // ignore error
    }
  }

  // Firestore Timestamp object { seconds, nanoseconds } or { _seconds, _nanoseconds }
  if (typeof val === 'object') {
    const secs = val.seconds ?? val._seconds;
    if (typeof secs === 'number') {
      const d = new Date(secs * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // String or Number
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function formatSafeDate(
  val: any,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
  fallback: string = 'N/A'
): string {
  const d = parseSafeDate(val);
  if (!d) return fallback;
  try {
    return d.toLocaleDateString('en-US', options);
  } catch {
    return fallback;
  }
}

export function formatShortDate(val: any, fallback: string = 'N/A'): string {
  return formatSafeDate(
    val,
    { year: 'numeric', month: 'short', day: 'numeric' },
    fallback
  );
}

export function formatSafeDateTime(
  val: any,
  fallback: string = 'N/A'
): string {
  const d = parseSafeDate(val);
  if (!d) return fallback;
  try {
    return d.toLocaleString('en-US');
  } catch {
    return fallback;
  }
}
