/**
 * Form Field Configuration Management
 * Enables Admins to dynamically enable/disable fields and toggle required/optional constraints across all app forms.
 */

export interface FormFieldSetting {
  fieldId: string;
  formId: string; // e.g., 'student_registration', 'user_management', 'class_claim', 'login', 'class_management'
  formName: string;
  section: string;
  label: string;
  customLabel?: string;
  enabled: boolean; // if false, field is hidden/disabled
  required: boolean; // if true, input is required on form
  isSystemProtected?: boolean; // if true, can't be completely disabled (e.g. Email for Login)
}

export const INITIAL_FORM_FIELD_SETTINGS: FormFieldSetting[] = [
  // --- Student Registration Form ---
  { fieldId: 'email', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Email Address', enabled: true, required: true, isSystemProtected: true },
  { fieldId: 'firstName', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'First Name', enabled: true, required: true },
  { fieldId: 'middleName', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Middle Name', enabled: true, required: false },
  { fieldId: 'lastName', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Last Name', enabled: true, required: true },
  { fieldId: 'dob', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Date of Birth', enabled: true, required: true },
  { fieldId: 'age', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Age', enabled: true, required: true },
  { fieldId: 'gender', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Gender', enabled: true, required: true },
  { fieldId: 'address', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Address', enabled: true, required: true },
  { fieldId: 'gmailAddress', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Google / Gmail Address', enabled: true, required: false },
  { fieldId: 'livesWith', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Who Student Lives With', enabled: true, required: true },
  { fieldId: 'cellPhone', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Cell Phone Number', enabled: true, required: true },
  { fieldId: 'homePhone', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Home Phone Number', enabled: true, required: true },
  { fieldId: 'gradeLevel', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Grade / Form Level', enabled: true, required: true },
  { fieldId: 'presentSchool', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Present/Former School', enabled: true, required: true },
  { fieldId: 'medicalNotes', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Medical Notes & Special Needs', enabled: true, required: false },
  { fieldId: 'photoUrl', formId: 'student_registration', formName: 'Student Registration & Application Form', section: '1. Student Details', label: 'Student Photo Upload', enabled: true, required: false },

  // Mother's Info
  { fieldId: 'motherFirstName', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "2. Mother's Info", label: "Mother's First Name", enabled: true, required: false },
  { fieldId: 'motherLastName', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "2. Mother's Info", label: "Mother's Last Name", enabled: true, required: false },
  { fieldId: 'motherEmail', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "2. Mother's Info", label: "Mother's Email", enabled: true, required: false },
  { fieldId: 'motherCellPhone', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "2. Mother's Info", label: "Mother's Cell Phone", enabled: true, required: false },
  { fieldId: 'motherHomePhone', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "2. Mother's Info", label: "Mother's Home Phone", enabled: true, required: false },
  { fieldId: 'motherAddress', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "2. Mother's Info", label: "Mother's Address", enabled: true, required: false },

  // Father's Info
  { fieldId: 'fatherFirstName', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "3. Father's Info", label: "Father's First Name", enabled: true, required: false },
  { fieldId: 'fatherLastName', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "3. Father's Info", label: "Father's Last Name", enabled: true, required: false },
  { fieldId: 'fatherEmail', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "3. Father's Info", label: "Father's Email", enabled: true, required: false },
  { fieldId: 'fatherCellPhone', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "3. Father's Info", label: "Father's Cell Phone", enabled: true, required: false },
  { fieldId: 'fatherHomePhone', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "3. Father's Info", label: "Father's Home Phone", enabled: true, required: false },
  { fieldId: 'fatherAddress', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "3. Father's Info", label: "Father's Address", enabled: true, required: false },

  // Guardian's Info
  { fieldId: 'guardianFirstName', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "4. Guardian's Info", label: "Guardian's First Name", enabled: true, required: false },
  { fieldId: 'guardianLastName', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "4. Guardian's Info", label: "Guardian's Last Name", enabled: true, required: false },
  { fieldId: 'guardianEmail', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "4. Guardian's Info", label: "Guardian's Email", enabled: true, required: false },
  { fieldId: 'guardianCellPhone', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "4. Guardian's Info", label: "Guardian's Cell Phone", enabled: true, required: false },
  { fieldId: 'guardianHomePhone', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "4. Guardian's Info", label: "Guardian's Home Phone", enabled: true, required: false },
  { fieldId: 'guardianAddress', formId: 'student_registration', formName: 'Student Registration & Application Form', section: "4. Guardian's Info", label: "Guardian's Address", enabled: true, required: false },

  // --- User Account Management Form ---
  { fieldId: 'userName', formId: 'user_management', formName: 'User Account Management Form', section: 'User Details', label: 'Full Name', enabled: true, required: true },
  { fieldId: 'userEmail', formId: 'user_management', formName: 'User Account Management Form', section: 'User Details', label: 'Email Address', enabled: true, required: true, isSystemProtected: true },
  { fieldId: 'userRole', formId: 'user_management', formName: 'User Account Management Form', section: 'User Details', label: 'User Role', enabled: true, required: true },
  { fieldId: 'userPhone', formId: 'user_management', formName: 'User Account Management Form', section: 'User Details', label: 'Phone Number', enabled: true, required: false },
  { fieldId: 'userTitle', formId: 'user_management', formName: 'User Account Management Form', section: 'User Details', label: 'Title / Designation', enabled: true, required: false },
  { fieldId: 'userDepartment', formId: 'user_management', formName: 'User Account Management Form', section: 'User Details', label: 'Department', enabled: true, required: false },
  { fieldId: 'userBio', formId: 'user_management', formName: 'User Account Management Form', section: 'User Details', label: 'Profile Bio', enabled: true, required: false },

  // --- Teacher Class Claim Form ---
  { fieldId: 'claimClass', formId: 'class_claim', formName: 'Teacher Class Claim Form', section: 'Claim Details', label: 'Class Selection', enabled: true, required: true },
  { fieldId: 'claimDate', formId: 'class_claim', formName: 'Teacher Class Claim Form', section: 'Claim Details', label: 'Teaching Date', enabled: true, required: true },
  { fieldId: 'claimDuration', formId: 'class_claim', formName: 'Teacher Class Claim Form', section: 'Claim Details', label: 'Duration (Hours)', enabled: true, required: true },
  { fieldId: 'claimRate', formId: 'class_claim', formName: 'Teacher Class Claim Form', section: 'Claim Details', label: 'Hourly Rate ($ USD)', enabled: true, required: true },

  // --- Login Form ---
  { fieldId: 'loginEmail', formId: 'login', formName: 'Login & Portal Auth Form', section: 'Login Credentials', label: 'Email Address', enabled: true, required: true, isSystemProtected: true },
  { fieldId: 'loginPassword', formId: 'login', formName: 'Login & Portal Auth Form', section: 'Login Credentials', label: 'Password', enabled: true, required: true, isSystemProtected: true },

  // --- Course / Class Management Form ---
  { fieldId: 'courseTitle', formId: 'class_management', formName: 'Course & Class Item Form', section: 'Course Information', label: 'Course Title', enabled: true, required: true },
  { fieldId: 'courseCategory', formId: 'class_management', formName: 'Course & Class Item Form', section: 'Course Information', label: 'Category', enabled: true, required: true },
  { fieldId: 'courseType', formId: 'class_management', formName: 'Course & Class Item Form', section: 'Course Information', label: 'Class Type', enabled: true, required: true },
  { fieldId: 'courseInstructor', formId: 'class_management', formName: 'Course & Class Item Form', section: 'Course Information', label: 'Instructor', enabled: true, required: true },
  { fieldId: 'coursePrice', formId: 'class_management', formName: 'Course & Class Item Form', section: 'Course Information', label: 'Tuition Price ($ USD)', enabled: true, required: true },
  { fieldId: 'courseCapacity', formId: 'class_management', formName: 'Course & Class Item Form', section: 'Course Information', label: 'Class Capacity', enabled: true, required: true },
  { fieldId: 'courseSchedule', formId: 'class_management', formName: 'Course & Class Item Form', section: 'Course Information', label: 'Schedule / Time Slot', enabled: true, required: true },
  { fieldId: 'courseDescription', formId: 'class_management', formName: 'Course & Class Item Form', section: 'Course Information', label: 'Course Description', enabled: true, required: false },
];

/**
 * Gets the current field setting for a specific fieldId in a formId.
 * Falls back to default values if not configured yet.
 */
export function getFieldSetting(
  settings: FormFieldSetting[],
  formId: string,
  fieldId: string
): FormFieldSetting {
  const found = settings.find((s) => s.formId === formId && s.fieldId === fieldId);
  if (found) return found;

  const defaultSetting = INITIAL_FORM_FIELD_SETTINGS.find(
    (s) => s.formId === formId && s.fieldId === fieldId
  );

  return (
    defaultSetting || {
      fieldId,
      formId,
      formName: formId,
      section: 'General',
      label: fieldId,
      enabled: true,
      required: false,
    }
  );
}
