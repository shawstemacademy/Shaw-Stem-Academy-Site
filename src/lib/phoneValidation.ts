/**
 * Phone Number Validation Module
 * Standardizes phone validation across all forms:
 * 1. Must contain ONLY numbers (0-9). No letters or symbols allowed.
 * 2. Must be at least 10 digits long.
 */

export function sanitizePhoneDigits(input: string): string {
  if (!input) return '';
  // Strip any non-digit characters immediately
  return input.replace(/\D/g, '');
}

export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  // Ensure string consists exclusively of numbers and is >= 10 digits long
  const isOnlyDigits = /^\d+$/.test(trimmed);
  return isOnlyDigits && trimmed.length >= 10;
}

export function getPhoneValidationError(phone: string, isRequired: boolean = false): string | null {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    return null;
  }
  if (/\D/.test(trimmed)) {
    return 'Phone number must contain ONLY numbers (0-9). No letters or symbols allowed.';
  }
  if (trimmed.length < 10) {
    return `Phone number must be at least 10 digits (currently ${trimmed.length} digits).`;
  }
  return null;
}
