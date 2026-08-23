export const calculateAge = (dobString: string): number | null => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

export const isValidAge = (age: number | null, minAge: number = 14, maxAge: number = 100): boolean => {
  if (age === null) return false;
  return age >= minAge && age <= maxAge;
};

export const getMaxDobDateString = (minAge: number = 14): string => {
  const today = new Date();
  const maxYear = today.getFullYear() - minAge;
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${maxYear}-${month}-${day}`;
};

export const getMinDobDateString = (maxAge: number = 100): string => {
  const today = new Date();
  const minYear = today.getFullYear() - maxAge;
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${minYear}-${month}-${day}`;
};
