export interface LocationOption {
  id: string;
  name: string;
  roomNumber?: string;
  building?: string;
}

export interface ClassType {
  id: string;
  name: string; // e.g. 'CSEC', 'CAPE', 'Primary', 'Lower Secondary'
  code: string; // e.g. 'CSEC', 'CAPE', 'PRIMARY'
  description?: string;
  isSbaHub?: boolean; // if true, SBA Hub class type (excluded from discounts)
  isVisibleToStudents?: boolean;
}

export interface DayScheduleItem {
  day: string; // e.g. 'Monday', 'Tuesday', etc.
  startTime: string; // e.g. '17:00' or '05:00 PM'
  endTime: string; // e.g. '18:00' or '06:00 PM'
}

export interface ClassItem {
  id: string;
  title: string;
  category: string; // e.g., 'STEM & Robotics' | 'Arts & Design' | 'Coding & AI' or custom
  classType?: string; // ID or Code of ClassType (e.g. 'CSEC', 'CAPE', 'Primary', etc.)
  instructor: string;
  schedule: string;
  ageGroup: string;
  price: number;
  pricePeriod?: 'yr' | 'week' | 'month' | 'one-time';
  capacity: number;
  enrolled: number;
  location: string;
  description: string;
  prerequisites?: string;
  syllabusUrl?: string;
  zoomLink?: string;
  
  // Course Bank offering tag
  isOffered?: boolean; // true = Offered / Active; false = In Bank / Not Offered

  // Structured Schedule for Clash Detection
  days?: string[]; // e.g., ['Monday', 'Wednesday']
  startTime?: string; // e.g., '16:00' or '04:00 PM'
  endTime?: string; // e.g., '17:30' or '05:30 PM'
  daySchedules?: DayScheduleItem[]; // Optional per-day distinct start and end times

  // Google Classroom Integration
  googleClassroomUrl?: string;
  googleClassroomCode?: string;
  googleMeetUrl?: string;
  instructorId?: string;
  teacherId?: string;

  // Lateness Push Notification Trigger
  autoLatenessAlertEnabled?: boolean;
}

export type DiscountType = 'percentage_multi_class' | 'amount_threshold' | 'sibling' | 'promo_code' | 'class_type_multi_class';

export interface DiscountRule {
  id: string;
  name: string;
  type: DiscountType;
  enabled: boolean;
  
  // Categorization by Class Type
  targetClassType?: string; // specific ClassType code/name e.g. 'CSEC', 'CAPE', 'Primary'
  appliesToSbaHub?: boolean; // if true, this discount applies to SBA Hub classes; if false/undefined, to regular classes
  
  minClassesRequired?: number;
  minAmountRequired?: number;
  percentageOff?: number;
  flatAmountOff?: number;
  code?: string;
  description: string;
}

export interface AppliedDiscount {
  ruleId: string;
  name: string;
  amountOff: number;
  description: string;
}

export interface SbaHubOption {
  id: string;
  name: string;
  classType?: string; // Class Type (Discount Group) e.g., 'CSEC', 'CAPE', 'Primary', etc.
  level?: string; // Legacy level field
  discountType?: string; // Discount type e.g. 'Exempt from Discounts', 'Eligible for Multi-Class Discounts', etc.
  yearlyPrice: number;
  pricePeriod?: 'yr' | 'week' | 'month' | 'one-time';
  capacity?: number;

  // Course Bank offering tag
  isOffered?: boolean; // true = Offered / Active; false = In Bank / Not Offered

  // Structured Schedule for Clash Detection
  days?: string[];
  startTime?: string;
  endTime?: string;
  daySchedules?: DayScheduleItem[]; // Optional per-day distinct start and end times
  location?: string;
  instructor?: string;
  instructorId?: string;
  teacherId?: string;

  // Google Classroom Integration
  googleClassroomUrl?: string;
  googleClassroomCode?: string;
  googleMeetUrl?: string;
}

export type ClashType = 'time_overlap' | 'room_conflict' | 'instructor_conflict';
export type ClashAdmissibility = 'admissible' | 'inadmissible';

export interface ScheduleClash {
  id: string;
  classAId: string;
  classATitle: string;
  classBId: string;
  classBTitle: string;
  clashType: ClashType;
  conflictDetail: string;
  status: ClashAdmissibility; // 'admissible' | 'inadmissible'
  reasonNotes?: string;
  detectedAt?: string;
}

export interface StudentInfo {
  // Primary email & basic info
  email?: string;
  
  // Student Details
  firstName?: string;
  middleName?: string;
  lastName?: string;
  formGrade?: string;
  currentSchool?: string;
  age?: string;
  dateOfBirth?: string;
  cellPhone?: string;
  homePhone?: string;
  photoUrl?: string;
  address?: string;
  gmailAddress?: string;
  gender?: 'Female' | 'Male' | '';
  livesWith?: 'Parent' | 'Guardian' | '';

  // Mother's Information
  motherFirstName?: string;
  motherMiddleName?: string;
  motherLastName?: string;
  motherAge?: string;
  motherDob?: string;
  motherEmail?: string;
  motherCellPhone?: string;
  motherHomePhone?: string;
  motherAddress?: string;

  // Father's Information
  fatherFirstName?: string;
  fatherMiddleName?: string;
  fatherLastName?: string;
  fatherAge?: string;
  fatherDob?: string;
  fatherEmail?: string;
  fatherCellPhone?: string;
  fatherHomePhone?: string;
  fatherAddress?: string;

  // Guardian's Information
  guardianFirstName?: string;
  guardianMiddleName?: string;
  guardianLastName?: string;
  guardianAge?: string;
  guardianDob?: string;
  guardianEmail?: string;
  guardianCellPhone?: string;
  guardianHomePhone?: string;
  guardianAddress?: string;
  guardianGender?: string;
  guardianRelation?: string;

  // SBA Hub Selection
  selectedSbaHubIds?: string[];
  sbaHubSelection?: string[];
  enrolledSbaHub?: boolean;
  selectedClassIds?: string[];

  // Backward compatibility fields
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  studentName: string;
  studentId?: string;
  studentAge: string;
  gradeLevel: string;
  emergencyContact: string;
  medicalNotes?: string;
}

export interface FormTheme {
  id: string;
  name: string;
  headerBg: string;
  headerAccent: string;
  cardBorderTop: string;
  buttonBg: string;
  badgeBg: string;
}

export interface ArchivedClassRecord {
  classId: string;
  className: string;
  archivedAt: string;
  archivedBy?: string;
  term?: string;
  notes?: string;
  status: 'completed' | 'finished';
}

export interface RegistrationRecord {
  id: string;
  timestamp: string;
  studentInfo: StudentInfo;
  selectedClasses: ClassItem[];
  selectedClassIds?: string[];
  subtotal: number;
  appliedDiscounts: AppliedDiscount[];
  totalPrice: number;
  googleFormId?: string;
  isPaid?: boolean;
  status?: 'pending_review' | 'verified' | 'partial_payment' | 'rejected' | 'completed';
  studentId?: string;
  userId?: string;
  payments?: {
    id: string;
    amount: number;
    timestamp: string;
    notes?: string;
    type?: 'payment' | 'refund';
  }[];
  verifiedClassIds?: string[];
  completedClassIds?: string[];
  archivedClasses?: ArchivedClassRecord[];
  addDropRequests?: AddDropRequest[];
  grades?: {
    id: string;
    classId: string;
    className: string;
    assignmentName: string;
    grade: string;
    pointsPossible?: string;
    score?: string;
    feedback?: string;
    updatedAt: string;
  }[];
}

export interface AddDropRequest {
  id: string;
  registrationId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  type: 'add' | 'drop';
  classItem: ClassItem;
  effectivePrice: number; // Discounted price for drop, full price for add
  originalPrice: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  reviewNotes?: string;
}

export interface AttendanceRecord {
  id: string; // e.g. "attendance-classId-date"
  classId: string;
  className: string;
  date: string; // "YYYY-MM-DD"
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  timestamp: string; // Check-in time
}

export interface LandingPageSettings {
  title: string;
  subtitle: string;
  logoUrl: string;
  isRegistrationClosed?: boolean; // Toggle A: Close Class Registration (Global)
  isPaidRegistrationReopened?: boolean; // Toggle B: Reopen Registration for Paid Students (Override)
}

// School Website & Dashboard Types
export type UserRole = 'student' | 'teacher' | 'admin' | 'registrar' | 'hod' | 'academic_officer';
export type StudentStatus = 'prospective' | 'pending_class_registration' | 'pending_review' | 'awaiting_acceptance' | 'accepted' | 'pending_verification' | 'enrolled_paid' | 'unverified' | 'denied';
export type PortalTab = 'home' | 'our-school' | 'timetable' | 'academics' | 'admissions' | 'registration' | 'student-portal' | 'teacher-dashboard' | 'admin-dashboard' | 'login' | 'registrar-dashboard' | 'privacy' | 'terms' | 'user-manual';

// Academic Performance & Pass Rate Record
export interface AcademicPerformanceRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  courseCode?: string;
  category?: string; // e.g. 'CSEC', 'CAPE', 'Lower Secondary', 'STEM & Robotics'
  academicYear: string; // e.g. '2023', '2024', '2025', '2026'
  passRatePercentage: number;
  studentsExamined?: number;
  studentsPassed?: number;
  notes?: string;
  enteredBy: string;
  enteredByName?: string;
  createdAt: string;
  updatedAt: string;
}

// Admission Decision & Field-Specific Denial Reasons
export interface DenialReasonItem {
  id: string;
  admissionDecisionId?: string;
  fieldKey: string;
  fieldLabel: string;
  reason: string;
  createdAt?: string;
}

export interface AdmissionDecision {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  registrationId?: string;
  decision: 'ACCEPTED' | 'DENIED';
  decidedBy: string;
  decidedByName?: string;
  decisionDate: string;
  generalNotes?: string;
  denialReasons?: DenialReasonItem[];
  createdAt: string;
  updatedAt: string;
}

// Ledger & Expense Management
export type ExpenseCategory = string;

export interface LedgerCategoryItem {
  id: string;
  name: string;
  type: 'expense' | 'income';
  isDefault?: boolean;
}

export interface ExpenseRecord {
  id: string;
  entryType?: 'expense' | 'income'; // Defaults to 'expense'
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Credit Card' | 'Debit Card' | 'Check' | 'Online/Zelle' | 'Other';
  vendorPayee: string; // Vendor/Payee for Expense, or Payer/Source for Income
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;
}

// Single Source of Truth Class Enrollment Model
export interface EnrollmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  classId: string;
  className: string;
  classType: 'regular' | 'sba_hub';
  billingType: 'monthly' | 'one_time';
  status: 'active' | 'scheduled_drop' | 'dropped' | 'completed';
  enrollmentStartDate: string;
  enrollmentEndDate?: string; // For monthly regular classes (e.g. 1 month from payment date)
  paymentDate?: string;
  paymentId?: string;
  scheduledDropDate?: string;
  effectiveDropDate?: string;
  dropReason?: string;
  googleMeetUrl?: string;
  googleClassroomUrl?: string;
  googleClassroomCode?: string;
  instructor?: string;
  schedule?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OurSchoolStaffMember {
  id: string;
  name: string;
  title: string;
  position: string;
  pictureUrl: string;
  department?: string;
  bio?: string;
  email?: string;
  isPublished: boolean; // false = hidden draft, true = live on page
  updatedAt?: string;
}

export interface OurSchoolPageData {
  principalName: string;
  principalTitle: string;
  principalPhotoUrl: string;
  principalMessage: string;
  isPrincipalPublished?: boolean;
  staffMembers: OurSchoolStaffMember[];
  updatedAt?: string;
}

export interface ResourceCategory {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  createdBy?: string;
}

export interface TeacherResource {
  id: string;
  title: string;
  classId: string;
  className: string;
  category: string; // e.g. 'Lecture Notes', 'Robotics Schematics', 'Lab Worksheet', 'Project Files', 'Video Tutorial', 'Syllabus'
  fileUrl: string;
  uploadDate: string;
  description: string;
  fileSize: string;
  teacherName: string;
  imageUrl?: string;
}

export interface ClassAnnouncement {
  id: string;
  classId: string;
  className: string;
  teacherName: string;
  title: string;
  content: string;
  date: string;
  priority: 'normal' | 'urgent';
  imageUrl?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

export interface AcademyInfo {
  schoolName: string;
  tagline: string;
  aboutText: string;
  establishedYear: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  portalWelcomeText: string;
  pillar1Title: string;
  pillar1Desc: string;
  pillar2Title: string;
  pillar2Desc: string;
  pillar3Title: string;
  pillar3Desc: string;
  formGrades?: string[];
  minStudentAge?: number;
  maxStudentAge?: number;
}

export interface FeatureCard {
  id: string;
  title: string;
  value: string;
  metricType?: 'static' | 'live_classes' | 'live_students' | 'live_departments' | 'live_teachers' | 'live_revenue';
  description: string;
  icon: string;
  color: string;
}

export interface FaqCategory {
  id: string;
  name: string;
}

export interface NewsCategory {
  id: string;
  name: string;
}

export interface SchoolNewsItem {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  author: string;
  imageUrl?: string;
  departmentId?: string;
  departmentName?: string;
  content?: string;
  isFeatured?: boolean;
}

export interface TeacherProfile {
  id: string;
  name: string;
  title: string;
  department: string;
  departmentIds?: string[];
  departmentNames?: string[];
  email: string;
  bio: string;
  officeHours: string;
  avatar: string;
  assignedClassIds: string[];
  status?: 'active' | 'disabled';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  headOfDepartment: string;
  color: string;
  room?: string;
  defaultPicture?: string;
  showToStudents?: boolean;
}

export function isDepartmentVisibleToStudents(dept: Department | string | null | undefined): boolean {
  if (!dept) return false;
  const deptName = typeof dept === 'string' ? dept : dept?.name || '';
  const nameLower = deptName.toLowerCase();

  // If the Department object explicitly sets showToStudents, respect the boolean flag
  if (typeof dept !== 'string' && typeof dept?.showToStudents === 'boolean') {
    return dept.showToStudents;
  }

  // Fallback default: exclude Administration, Registrar, Administrative, Management, System, Governance
  if (
    nameLower.includes('admin') ||
    nameLower.includes('registrar') ||
    nameLower.includes('management') ||
    nameLower.includes('governance')
  ) {
    return false;
  }

  return true;
}

export interface SchoolUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'registrar' | 'hod' | 'academic_officer';
  roles?: ('student' | 'teacher' | 'admin' | 'registrar' | 'hod' | 'academic_officer')[];
  phone?: string;
  title?: string;
  departmentId?: string;
  departmentName?: string;
  department?: string;
  departmentIds?: string[];
  departmentNames?: string[];
  status: 'active' | 'on_leave' | 'invited' | 'disabled' | 'enrolled_paid' | 'prospective' | 'pending_class_registration' | 'pending_review' | 'awaiting_acceptance' | 'accepted' | 'pending_verification' | 'unverified' | 'denied';
  disabledAt?: string;
  disabledReason?: string;
  deniedReason?: string;
  deniedFields?: string[];
  deniedReasonItems?: DenialReasonItem[];
  admissionDecision?: AdmissionDecision;
  avatar?: string;
  bio?: string;
  officeHours?: string;
  assignedClassIds?: string[];
  registeredClassIds?: string[];
  completedClassIds?: string[];
  archivedClasses?: ArchivedClassRecord[];
  permissions?: string[];
  password?: string;
  studentId?: string;
  studentDetails?: StudentInfo;
  themeMode?: 'light' | 'dark';
  notificationPreferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  statusUpdates: boolean;
  classChanges: boolean;
  announcements: boolean;
  tuitionAlerts: boolean;
}

export interface NotificationLogItem {
  id: string;
  recipientEmail?: string;
  recipientUserId?: string;
  recipientEmails?: string[];
  isBroadcast?: boolean;
  title: string;
  body: string;
  type?: 'status' | 'class' | 'announcement' | 'tuition' | 'general';
  createdAt: string;
  read?: boolean;
}

export interface RolePermission {
  id: string;
  name: string;
  category: 'Academics' | 'Administration' | 'Registration' | 'System' | 'Financials' | 'Faculty & Claims';
  description: string;
  teacherDefault: boolean;
  adminDefault: boolean;
  registrarDefault?: boolean;
  hodDefault?: boolean;
  studentDefault?: boolean;
  academicOfficerDefault?: boolean;
}

export interface SystemActionLog {
  id: string;
  timestamp: string;
  actionType: 'registration' | 'user_created' | 'user_updated' | 'user_disabled' | 'user_enabled' | 'user_deleted' | 'role_changed' | 'discount_updated' | 'login' | 'system_alert' | 'app_error' | 'other';
  actor: string;
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  deviceType?: 'Desktop' | 'Mobile' | 'Tablet';
  screenResolution?: string;
  viewportSize?: string;
  timeZone?: string;
  language?: string;
  path?: string;
  errorName?: string;
  errorMessage?: string;
  errorStack?: string;
  componentStack?: string;
  metadata?: any;
}

export interface ClassClaimItem {
  id: string; // unique claim ID e.g. claim-cls101-20260807
  classId: string;
  className: string;
  classCode?: string;
  classType: 'regular' | 'sba_hub';
  teacherId: string;
  teacherName: string;
  teacherEmail?: string;
  date: string; // 'YYYY-MM-DD'
  dayOfWeek: string; // 'Monday', 'Tuesday', etc.
  startTime?: string;
  endTime?: string;
  durationHours: number;
  hourlyRate: number;
  calculatedPayout: number;
  status: 'claimed' | 'verified' | 'rejected';
  claimedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionNotes?: string;
}

export interface TeacherHourlyRate {
  userId: string;
  userName: string;
  hourlyRate: number; // e.g. 35.00
}

export interface SectionOrderItem {
  id: string;
  title: string;
  description: string;
  enabled?: boolean;
}

export interface PortalSectionOrders {
  id?: string;
  studentPortalSections: SectionOrderItem[];
  teacherDashboardSections: SectionOrderItem[];
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_STUDENT_SECTION_ORDER: SectionOrderItem[] = [
  {
    id: 'student_id',
    title: 'Digital Student ID & Attendance Pass',
    description: 'Digital ID badge with real-time QR attendance pass',
    enabled: true,
  },
  {
    id: 'registered_classes',
    title: 'My Registered Classes & Direct Links',
    description: 'Cards for enrolled courses with Google Classroom & Meet links',
    enabled: true,
  },
  {
    id: 'academics',
    title: 'Student Academics Hub',
    description: 'Class schedule, attendance log, grades, progress tracking, and Add/Drop course requests',
    enabled: true,
  },
  {
    id: 'tuition_payment',
    title: 'Quick Pay & Tuition Payment',
    description: 'Outstanding tuition balance summary and payment submission form',
    enabled: true,
  },
  {
    id: 'registration_history',
    title: 'Enrollment & Payment Receipts',
    description: 'Historical registration receipts, invoices, and payment verifications',
    enabled: true,
  },
  {
    id: 'announcements',
    title: 'Class Announcements Feed',
    description: 'Broadcast notices and alerts from assigned teachers',
    enabled: true,
  },
  {
    id: 'resources',
    title: 'Learning Resources & Lab Materials',
    description: 'Class worksheets, Arduino schematics, and downloadable materials',
    enabled: true,
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions (FAQ)',
    description: 'Helpful answers regarding registration, classes, and portal features',
    enabled: true,
  },
];

export const DEFAULT_TEACHER_SECTION_ORDER: SectionOrderItem[] = [
  {
    id: 'classes',
    title: 'Assigned Courses & Google Classroom Links',
    description: 'Faculty course roster, Google Classroom link management, and student management',
    enabled: true,
  },
  {
    id: 'performance',
    title: 'Student Performance Distribution',
    description: 'Grade breakdown tiers and faculty academic performance distribution',
    enabled: true,
  },
  {
    id: 'claims',
    title: 'Teaching Claim Form & Calendar',
    description: 'Monthly teaching log submitter and payroll claim records',
    enabled: true,
  },
  {
    id: 'resources',
    title: 'Publish Announcements & Learning Resources',
    description: 'Forms to post class notices and upload course lab files',
    enabled: true,
  },
  {
    id: 'published_announcements',
    title: 'My Published Announcements',
    description: 'Management log of announcements published to student portals',
    enabled: true,
  },
  {
    id: 'published_resources',
    title: 'My Published Course Resources',
    description: 'Management log of course materials and worksheets uploaded',
    enabled: true,
  },
  {
    id: 'hod_news_management',
    title: 'HOD Categories & Department News Controls',
    description: 'Resource category management and department news manager (HOD & Admin)',
    enabled: true,
  },
];

// Archived User Record for Cascade Deletion, Audit, and Recovery
export interface ArchivedUserRecord {
  id: string; // deletionId e.g. "DEL_1740000000000_usr123"
  deletionId: string;
  originalUserId: string;
  originalStudentId?: string;
  userName: string;
  userEmail: string;
  userRole: UserRole | string;
  deletedAt: string; // ISO timestamp
  deletedBy: string; // Actor UID or email
  deletedByName?: string;
  deletionReason?: string;
  archiveVersion: '1.0';
  archiveStatus: 'ARCHIVED';
  activeDataStatus: 'DELETED' | 'PARTIALLY_DELETED' | 'RESTORED' | 'FAILED';
  recordsArchivedSummary: {
    userProfile: number;
    teacherProfile: number;
    registrations: number;
    enrollments: number;
    addDropRequests: number;
    admissionDecisions: number;
    denialReasons: number;
    attendanceRecords: number;
    teacherClaims: number;
    teacherResources: number;
    teacherAnnouncements: number;
    notifications: number;
    totalRecords: number;
  };
  recordsDeletedSummary?: {
    totalDeleted: number;
    collectionsAffected: string[];
  };
  financialSummary: {
    totalTuition: number;
    totalPaid: number;
    remainingBalance: number;
    paymentCount: number;
    payments: { id: string; amount: number; timestamp: string; type?: string; notes?: string }[];
  };
  // Snapshot Payloads
  user: SchoolUser;
  teacherProfile?: TeacherProfile | null;
  registrations: RegistrationRecord[];
  enrollments: EnrollmentRecord[];
  addDropRequests: AddDropRequest[];
  admissionDecisions: AdmissionDecision[];
  denialReasons: DenialReasonItem[];
  attendanceRecords: AttendanceRecord[];
  teacherClaims?: ClassClaimItem[];
  teacherResources?: TeacherResource[];
  teacherAnnouncements?: ClassAnnouncement[];
  notifications?: NotificationLogItem[];
  // Restoration Metadata
  restoredAt?: string;
  restoredBy?: string;
  restoredByName?: string;
  restorationNotes?: string;
}




