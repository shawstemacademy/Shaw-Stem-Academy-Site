import {
  TeacherProfile,
  TeacherResource,
  ClassAnnouncement,
  SchoolNewsItem,
  RegistrationRecord,
  Department,
  SchoolUser,
  RolePermission,
  SystemActionLog,
  FaqItem,
  AcademyInfo,
  FeatureCard
} from '../types';

export const DEMO_TEACHERS: TeacherProfile[] = [];

export const DEMO_RESOURCES: TeacherResource[] = [];

export const DEMO_ANNOUNCEMENTS: ClassAnnouncement[] = [];

export const DEMO_SCHOOL_NEWS: SchoolNewsItem[] = [];

export const DEMO_FAQ_ITEMS: FaqItem[] = [];

export const DEMO_REGISTRATION_LOGS: RegistrationRecord[] = [];

export const DEFAULT_ACADEMY_INFO: AcademyInfo = {
  schoolName: 'Shaw STEM Academy',
  tagline: 'Empowering Next-Generation Engineers, Computer Scientists, and Digital Creators.',
  aboutText: 'Founded in 2018, Shaw STEM Academy provides a state-of-the-art educational facility combining rigorous science and engineering theory with real-world lab experimentation. Our students build autonomous rovers, design artificial neural networks, program microcontrollers, and compose electronic soundscapes.',
  establishedYear: '2018',
  contactEmail: 'admissions@shawstemacademy.edu',
  contactPhone: '(555) 839-2041',
  address: '100 STEM Academy Boulevard, Tech Campus Suite 400',
  portalWelcomeText: 'Welcome to the official Academy Portal. Choose your profile view or register for Fall term classes.',
  pillar1Title: 'Hands-On STEM Labs',
  pillar1Desc: 'Equipped with Arduino microcontrollers, Raspberry Pi clusters, 3D printers, laser cutters, and robotics testing grounds.',
  pillar2Title: 'World-Class Faculty',
  pillar2Desc: 'Our instructors hold advanced degrees from MIT, Stanford, and CMU, bringing NASA research and industry engineering to the classroom.',
  pillar3Title: 'Flexible Tuition Discounts',
  pillar3Desc: 'We offer automatic multi-class bundle savings, sibling reward pricing, and promo code discounts calculated in real time.',
  formGrades: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'CAPE Unit 1', 'CAPE Unit 2'],
};

export const DEFAULT_FEATURE_CARDS: FeatureCard[] = [
  {
    id: 'card-1',
    title: 'STEM & Robotics Labs',
    value: '12+',
    metricType: 'live_classes',
    description: 'Active laboratories and engineering workshops',
    icon: 'Cpu',
    color: 'blue',
  },
  {
    id: 'card-2',
    title: 'Regional Engineering Awards',
    value: '42',
    metricType: 'static',
    description: 'Regional and national robotics competition titles',
    icon: 'Award',
    color: 'purple',
  },
  {
    id: 'card-3',
    title: 'Student-to-Faculty Ratio',
    value: '15 : 1',
    metricType: 'static',
    description: 'Small class sizes for direct faculty mentorship',
    icon: 'Users',
    color: 'emerald',
  },
  {
    id: 'card-4',
    title: 'Project-Based Learning',
    value: '100%',
    metricType: 'static',
    description: 'Hands-on project-based engineering learning',
    icon: 'Compass',
    color: 'amber',
  },
];

export const DEMO_DEPARTMENTS: Department[] = [
  {
    id: 'dept-admin',
    name: 'Administration & Registrar',
    code: 'ADMIN',
    description: 'Academy governance, admissions registration, and system operations.',
    headOfDepartment: 'adm-1',
    color: 'bg-emerald-600',
    room: 'Admin Suite 100',
    defaultPicture: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
  },
];

// Single Admin User as requested ("get rid off all users except the admin")
export const DEMO_SCHOOL_USERS: SchoolUser[] = [
  {
    id: 'adm-1',
    name: 'System Administrator',
    email: 'shawstemacademy@gmail.com',
    role: 'admin',
    title: 'Academy System Administrator',
    departmentId: 'dept-admin',
    departmentName: 'Administration & Registrar',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    bio: 'System Administrator managing courses, teachers, registration, and Firebase database.',
    officeHours: 'Mon-Fri 8:00 AM - 5:00 PM',
    permissions: [
      'manage_curriculum',
      'upload_resources',
      'post_announcements',
      'manage_discounts',
      'export_forms',
      'view_logs',
      'manage_users',
      'manage_departments',
      'assign_staff',
      'export_financials',
    ],
  },
  {
    id: 'adm-2',
    name: 'Academy Administrator',
    email: 'admin@shawstemacademy.edu',
    role: 'admin',
    title: 'Academy System Administrator',
    departmentId: 'dept-admin',
    departmentName: 'Administration & Registrar',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    bio: 'Administrator managing courses, teachers, registration, and Firebase database.',
    officeHours: 'Mon-Fri 8:00 AM - 5:00 PM',
    permissions: [
      'manage_curriculum',
      'upload_resources',
      'post_announcements',
      'manage_discounts',
      'export_forms',
      'view_logs',
      'manage_users',
      'manage_departments',
      'assign_staff',
      'export_financials',
    ],
  },
];

export const DEMO_ROLE_PERMISSIONS: RolePermission[] = [
  {
    id: 'perm-1',
    name: 'Manage Course Offerings & Curriculum',
    category: 'Academics',
    description: 'Create, update, or modify class titles, descriptions, schedules, and capacity limits.',
    teacherDefault: true,
    adminDefault: true,
  },
  {
    id: 'perm-2',
    name: 'Upload Lab Resources & Schematics',
    category: 'Academics',
    description: 'Publish lecture notes, robotics wiring diagrams, and project PDFs to the student portal.',
    teacherDefault: true,
    adminDefault: true,
  },
  {
    id: 'perm-3',
    name: 'Post Classroom Announcements',
    category: 'Academics',
    description: 'Send normal or urgent announcements to enrolled students and parents.',
    teacherDefault: true,
    adminDefault: true,
  },
  {
    id: 'perm-4',
    name: 'Configure Tuition Discount Rules',
    category: 'Registration',
    description: 'Create multi-class bundle percentage discounts, promo codes, and sibling tuition rewards.',
    teacherDefault: false,
    adminDefault: true,
  },
  {
    id: 'perm-5',
    name: 'Sync with Cloud Storage',
    category: 'Registration',
    description: 'Export class catalog and tuition schemas securely.',
    teacherDefault: false,
    adminDefault: true,
  },
  {
    id: 'perm-6',
    name: 'View Student Registration Logs & Billing',
    category: 'Administration',
    description: 'Inspect submitted student enrollments, parent emails, and final pricing breakdowns.',
    teacherDefault: false,
    adminDefault: true,
  },
  {
    id: 'perm-7',
    name: 'Create/Edit Teachers & Administrators',
    category: 'System',
    description: 'Add new teachers or administrators, modify titles, and update staff account status.',
    teacherDefault: false,
    adminDefault: true,
  },
  {
    id: 'perm-8',
    name: 'Create/Edit Academic Departments',
    category: 'System',
    description: 'Manage department codes, descriptions, color themes, and assign department heads.',
    teacherDefault: false,
    adminDefault: true,
  },
  {
    id: 'perm-9',
    name: 'Assign Staff to Relevant Departments',
    category: 'System',
    description: 'Move teachers and administrators between departments.',
    teacherDefault: false,
    adminDefault: true,
  },
  {
    id: 'perm-10',
    name: 'Export Academy Financial Logs',
    category: 'Administration',
    description: 'Download CSV summaries of tuition revenue and discount records.',
    teacherDefault: false,
    adminDefault: true,
  },
];

export const DEMO_SYSTEM_LOGS: SystemActionLog[] = [];
