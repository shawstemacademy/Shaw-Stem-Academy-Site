import React, { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Unlock, 
  FileText, 
  Download, 
  Video, 
  Bell, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  ExternalLink,
  BookOpen,
  Sparkles,
  AlertCircle,
  Plus,
  Clock,
  Check,
  FolderOpen,
  User
} from 'lucide-react';
import { 
  StudentStatus, 
  TeacherResource, 
  ClassAnnouncement, 
  ClassItem,
  FaqItem,
  ResourceCategory,
  SchoolUser,
  RegistrationRecord,
  StudentInfo,
  FormTheme
} from '../../types';
import { StudentInfoForm } from '../StudentInfoForm';

interface StudentPortalPageProps {
  status: StudentStatus;
  classes: ClassItem[];
  resources: TeacherResource[];
  announcements: ClassAnnouncement[];
  faqs?: FaqItem[];
  categories?: ResourceCategory[];
  studentUser?: SchoolUser | null;
  registrationRecord?: RegistrationRecord | null;
  onUpdateRegistration?: (updated: RegistrationRecord) => void;
  onUpdateUserProfile?: (updated: SchoolUser) => void;
  onOpenRegistration: () => void;
}

export const StudentPortalPage: React.FC<StudentPortalPageProps> = ({
  status,
  classes = [],
  resources = [],
  announcements = [],
  faqs = [],
  categories = [],
  studentUser,
  registrationRecord,
  onUpdateRegistration,
  onUpdateUserProfile,
  onOpenRegistration,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingStudentInfo, setEditingStudentInfo] = useState<StudentInfo | null>(null);

  const handleEditProfileClick = () => {
    if (registrationRecord) {
      setEditingStudentInfo(registrationRecord.studentInfo);
      setIsEditingProfile(true);
    } else if (studentUser?.studentDetails) {
      setEditingStudentInfo(studentUser.studentDetails);
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = () => {
    if (editingStudentInfo) {
      if (registrationRecord && onUpdateRegistration) {
        onUpdateRegistration({
          ...registrationRecord,
          studentInfo: editingStudentInfo
        });
      }
      if (studentUser && onUpdateUserProfile) {
        onUpdateUserProfile({
          ...studentUser,
          studentDetails: editingStudentInfo
        });
      }
      setIsEditingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditingStudentInfo(null);
  };

  // Filter resources based on student enrolled classes (if registered in 6 courses, only show resources for those courses)
  const registeredClassIds = new Set(classes.map((c) => c.id));
  const registeredClassTitles = new Set(classes.map((c) => c.title.toLowerCase().trim()));

  const studentCourseResources = resources.filter((res) => {
    if (!res) return false;
    // If student has registered classes, match resource to their classes
    if (classes.length > 0) {
      if (res.classId === 'all') return true;
      if (registeredClassIds.has(res.classId)) return true;
      if (res.className && registeredClassTitles.has(res.className.toLowerCase().trim())) return true;
      return false;
    }
    // If prospective or demo view with no classes enrolled, show general resources
    return true;
  });

  // Filter resources by selected Firestore Category
  const filteredResources = selectedCategory === 'all'
    ? studentCourseResources
    : studentCourseResources.filter((r) => r.category === selectedCategory);

  // Status Badge Formatting
  const getStatusBadge = () => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accepted Student</span>
          </span>
        );
      case 'pending_verification':
      case 'unverified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Awaiting Payment Verification</span>
          </span>
        );
      case 'enrolled_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Paid & Enrolled</span>
          </span>
        );
      case 'awaiting_acceptance':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
            <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Awaiting Application Review</span>
          </span>
        );
      case 'prospective':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 text-xs font-bold border border-slate-500/30">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Prospective Applicant</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Student Portal Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Shaw STEM Student Portal</span>
              </div>
              {getStatusBadge()}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight animate-fade-in">
              Welcome, {studentUser?.name || 'Student'}!
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              {status === 'enrolled_paid'
                ? 'Your enrollment and tuition payment are verified. Access your enrolled class Zoom links, Google Classroom materials, and teacher lab files below.'
                : status === 'pending_verification' || status === 'unverified'
                ? 'Your course selections have been submitted and are currently pending registrar verification. Your class schedule is active below.'
                : status === 'accepted'
                ? '🎉 You have been accepted to Shaw STEM Academy! Please select your courses in the Class Registration portal to complete your enrollment.'
                : status === 'awaiting_acceptance'
                ? 'Your student account registration has been received and is currently being reviewed by admissions officers.'
                : 'Browse our academic offerings and school guidelines. Complete registration to unlock course materials.'}
            </p>
          </div>
          
          {(registrationRecord || studentUser?.studentDetails) && (
            <div className="flex-shrink-0">
              <button
                onClick={handleEditProfileClick}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-slate-700"
              >
                <User className="w-4 h-4 text-purple-400" />
                <span>Edit Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1. NOTIFICATION BANNER: ACCEPTED STUDENT */}
      {status === 'accepted' && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4 border border-emerald-400/30 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-white text-2xl font-black shadow-inner">
              🎉
            </div>
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white border border-white/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Application Accepted</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Congratulations, {studentUser?.name || 'Student'}! You Have Been Accepted!
              </h2>
              <p className="text-emerald-50 text-sm max-w-2xl leading-relaxed font-medium">
                We are thrilled to welcome you to Shaw STEM Academy. Your student application has been officially accepted by school administration! To finalize your schedule, please proceed to Class Registration to choose your STEM courses.
              </p>
              <div className="pt-3">
                <button
                  onClick={onOpenRegistration}
                  className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2.5"
                >
                  <span>Select Courses & Complete Enrollment</span>
                  <ArrowRight className="w-4 h-4 text-emerald-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. NOTIFICATION BANNER: AWAITING ACCEPTANCE */}
      {status === 'awaiting_acceptance' && (
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-blue-900">
                Application Under Admissions Review
              </h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                Your student profile registration has been received. Our Admissions Board is reviewing your profile.
                You will receive a notification right here once your account is accepted.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. NOTIFICATION BANNER: PENDING VERIFICATION */}
      {(status === 'pending_verification' || status === 'unverified') && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4 shadow-xs">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-bold text-amber-900 text-sm">Enrollment Pending Registrar Payment Verification</h3>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Your registration form and selected STEM courses have been submitted to the school office.
              Our Registrar is currently verifying your tuition payment. Once verified, full course resources and live Zoom rooms will unlock!
            </p>
          </div>
        </div>
      )}

      {/* PROSPECTIVE / UNACCEPTED VIEW */}
      {(status === 'prospective' || status === 'awaiting_acceptance') && (
        <div className="space-y-8">
          {/* Admissions Step Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-bold text-slate-900">Admissions & Account Review</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create your student profile and submit basic information for admissions acceptance.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-bold text-slate-900">Select Enrolled Courses</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Once accepted, select up to 6 STEM, CSEC, CAPE, or Robotics courses with automatic bundle discounts.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-bold text-slate-900">Unlock Course Resources</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Access course-specific lecture notes, lab schematics, and live Google Meet links for your courses!
              </p>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Admissions & Student FAQ</h2>
            </div>
            {faqs.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-1 shadow-xs">
                <p className="text-xs text-slate-500 font-medium">No FAQs currently available. Contact school administration for details.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faqs.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">{item.question}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ENROLLED / ACCEPTED / REGISTERED STUDENT VIEW */}
      {(status === 'enrolled_paid' || status === 'pending_verification' || status === 'accepted' || status === 'unverified') && (
        <div className="space-y-10 animate-fade-in">
          {/* Enrolled Classes Bar */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">My Registered Classes</h2>
                <p className="text-sm text-slate-500">
                  Showing {classes.length} Registered Course{classes.length === 1 ? '' : 's'}
                </p>
              </div>

              <button
                onClick={onOpenRegistration}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{classes.length === 0 ? 'Select Courses Now' : 'Add / Modify Classes'}</span>
              </button>
            </div>

            {classes.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 text-center space-y-3">
                <p className="text-xs font-semibold text-blue-900">
                  You have not registered for any specific courses yet. Click below to choose your classes.
                </p>
                <button
                  onClick={onOpenRegistration}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Go to Class Registration
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Google Classroom Hub Banner */}
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 border border-emerald-800 shadow-md space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Google Classroom Integrated Portal</span>
                      </div>
                      <h3 className="text-xl font-black">Google Classroom & Live Meet Links</h3>
                      <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
                        Access your virtual classrooms, homework assignments, and live video sessions directly via Google Classroom using your <strong>@shawstemacademy.edu</strong> Google account.
                      </p>
                    </div>

                    <a
                      href="https://classroom.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
                    >
                      <span>Open Google Classroom Dashboard</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classes.map((cls) => {
                    const gcUrl = cls.googleClassroomUrl || `https://classroom.google.com/c/${cls.id}`;
                    const gMeet = cls.googleMeetUrl || `https://meet.google.com/shaw-${cls.id}`;

                    return (
                      <div
                        key={cls.id}
                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {cls.category}
                            </span>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Registered
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-lg">{cls.title}</h3>
                          <p className="text-xs text-slate-500 font-medium">Instructor: {cls.instructor}</p>

                          <div className="text-xs text-slate-600 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{cls.schedule} ({cls.location})</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <a
                            href={gcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 ${
                              status === 'pending_verification' || status === 'unverified'
                                ? 'bg-slate-100 text-slate-400 pointer-events-none'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                            }`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Google Classroom</span>
                          </a>

                          <a
                            href={gMeet}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 ${
                              status === 'pending_verification' || status === 'unverified'
                                ? 'bg-slate-100 text-slate-400 pointer-events-none'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                            }`}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Google Meet Live</span>
                          </a>

                          <button
                            onClick={() => {
                              if (status === 'pending_verification' || status === 'unverified') {
                                alert("Syllabus PDF is locked until the Registrar verifies your tuition payment.");
                              } else {
                                alert(`Downloading syllabus for ${cls.title}`);
                              }
                            }}
                            className="px-3 py-1.5 font-semibold text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Syllabus</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Teacher Announcements Feed */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <h2 className="text-2xl font-bold text-slate-900">Class Announcements</h2>
            </div>

            {announcements.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
                No recent announcements for your classes.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      ann.priority === 'urgent'
                        ? 'bg-rose-50/70 border-rose-200'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{ann.className}</span>
                        <span className="text-[11px] text-slate-500">• Posted by {ann.teacherName}</span>
                      </div>
                      <span className="text-xs text-slate-400">{ann.date}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mb-1">{ann.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COURSE RESOURCES & LAB MATERIALS DOWNLOAD CENTER */}
          <div className="space-y-4">
            <div className="flex flex-col space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Learning Resources & Lab Materials</h2>
                <p className="text-sm text-slate-500">
                  {classes.length > 0
                    ? `Showing learning resources uploaded by teachers for your ${classes.length} registered course${classes.length === 1 ? '' : 's'}.`
                    : 'Download course resources, lab worksheets, and project files uploaded by faculty.'}
                </p>
              </div>

              {/* FIRESTORE CATEGORIES: SIDEWAYS SCROLLABLE CONTAINER */}
              <div className="w-full overflow-hidden">
                <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 max-w-full whitespace-nowrap scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All Materials
                  </button>

                  {/* Render categories pulled directly from Firestore */}
                  {categories.map((cat) => (
                    <button
                      key={cat.id || cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        selectedCategory === cat.name
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredResources.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600 font-semibold">
                  No learning resources found for category "{selectedCategory}".
                </p>
                <p className="text-[11px] text-slate-400">
                  Teachers upload resources specifically for their assigned courses. Check back soon for new files.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredResources.map((res) => (
                  <div
                    key={res.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {res.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {res.className}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{res.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{res.description}</p>
                      <div className="text-[11px] text-slate-400">
                        Uploaded by {res.teacherName} • {res.uploadDate}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (status === 'pending_verification' || status === 'unverified') {
                          alert("Learning materials are locked until the Registrar verifies your tuition payment.");
                        } else {
                          alert(`Downloading resource: ${res.title} (${res.fileSize})`);
                        }
                      }}
                      className={`p-2.5 rounded-xl transition-all shrink-0 ${
                        status === 'pending_verification' || status === 'unverified'
                          ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'
                          : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                      }`}
                      title={status === 'pending_verification' || status === 'unverified' ? 'Locked' : `Download ${res.fileSize}`}
                      disabled={status === 'pending_verification' || status === 'unverified'}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && editingStudentInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-5 border-b border-slate-100 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Edit Student Profile
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-50"
              >
                ✕
              </button>
            </div>
            
            <div className="p-8">
              <StudentInfoForm
                studentInfo={editingStudentInfo}
                onChange={(field, value) => {
                  setEditingStudentInfo(prev => prev ? { ...prev, [field]: value } : null);
                }}
                theme={{
                  primary: 'bg-purple-600',
                  primaryHover: 'hover:bg-purple-700',
                  secondary: 'bg-purple-50 text-purple-700',
                  headerBg: 'bg-slate-900',
                  headerText: 'text-white',
                  headerAccent: 'text-purple-400',
                  cardBorderTop: 'border-t-purple-500',
                  buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white',
                  badgeBg: 'bg-purple-100 text-purple-800'
                }}
                isSiblingSelected={false}
                setIsSiblingSelected={() => {}}
                siblingDiscountAmount={0}
              />
            </div>
            
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-8 py-5 flex justify-end gap-3 rounded-b-3xl z-10">
              <button
                onClick={handleCancelEdit}
                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
