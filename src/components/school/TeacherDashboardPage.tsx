import React, { useState } from 'react';
import { 
  Users, 
  PlusCircle, 
  Bell, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Send, 
  Upload, 
  Clock, 
  Mail, 
  BookOpen,
  AlertCircle,
  Edit3,
  X,
  UserCheck
} from 'lucide-react';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { 
  TeacherProfile, 
  TeacherResource, 
  ClassAnnouncement, 
  ClassItem,
  SchoolUser,
  UserRole,
  SchoolNewsItem,
  Department,
  ResourceCategory,
  SbaHubOption,
  ClassClaimItem,
  TeacherHourlyRate
} from '../../types';
import { AdminNewsManagement } from './AdminNewsManagement';
import { HodResourceCategoryManager } from './HodResourceCategoryManager';
import { ClassClaimForm } from './ClassClaimForm';

interface TeacherDashboardPageProps {
  teachers: TeacherProfile[];
  classes: ClassItem[];
  resources: TeacherResource[];
  announcements: ClassAnnouncement[];
  onAddAnnouncement: (announcement: ClassAnnouncement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onAddResource: (resource: TeacherResource) => void;
  onDeleteResource: (id: string) => void;
  loggedInUser?: SchoolUser | TeacherProfile | null;
  currentRole?: UserRole;
  onUpdateClassList?: (updated: ClassItem[]) => void;
  schoolNews?: SchoolNewsItem[];
  departments?: Department[];
  resourceCategories?: ResourceCategory[];
  sbaHubOptions?: SbaHubOption[];
  claims?: ClassClaimItem[];
  onUpdateClaims?: (updated: ClassClaimItem[]) => void;
  hourlyRates?: TeacherHourlyRate[];
  onUpdateHourlyRates?: (updated: TeacherHourlyRate[]) => void;
  schoolUsers?: SchoolUser[];
  onUpdateUserProfile?: (updated: SchoolUser) => void;
  onUpdateUser?: (updated: SchoolUser) => void;
}

export const TeacherDashboardPage: React.FC<TeacherDashboardPageProps> = ({
  teachers = [],
  classes = [],
  resources = [],
  announcements = [],
  onAddAnnouncement,
  onDeleteAnnouncement,
  onAddResource,
  onDeleteResource,
  loggedInUser,
  currentRole = 'teacher',
  onUpdateClassList,
  schoolNews = [],
  departments = [],
  resourceCategories = [],
  sbaHubOptions = [],
  claims = [],
  onUpdateClaims = () => {},
  hourlyRates = [],
  onUpdateHourlyRates = () => {},
  schoolUsers = [],
  onUpdateUserProfile,
  onUpdateUser,
}) => {
  const [activeSection, setActiveSection] = useState<'classes' | 'claims' | 'resources'>('classes');

  // If logged in as a specific teacher user, default to their profile
  const matchedTeacher = teachers.find(
    (t) => loggedInUser && (t.id === loggedInUser.id || (t?.email || '').toLowerCase() === (loggedInUser?.email || '').toLowerCase())
  ) || teachers[0];

  const [activeTeacherId, setActiveTeacherId] = useState<string>(matchedTeacher?.id || teachers[0]?.id || '');

  // For teacher role, strictly enforce showing ONLY their own dashboard and information
  const currentTeacher = (currentRole === 'teacher' && loggedInUser)
    ? (teachers.find((t) => t.id === loggedInUser.id || (t?.email || '').toLowerCase() === (loggedInUser?.email || '').toLowerCase()) || matchedTeacher)
    : (teachers.find((t) => t.id === activeTeacherId) || matchedTeacher);

  // Assigned classes for this teacher
  const teacherClasses = classes.filter((c) => 
    (currentTeacher?.assignedClassIds || []).includes(c.id) || c.instructor === currentTeacher?.name
  );

  // Teacher Profile Editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editOfficeHours, setEditOfficeHours] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const handleOpenEditProfileModal = () => {
    setEditName(currentTeacher?.name || '');
    setEditEmail(currentTeacher?.email || '');
    setEditPhone((loggedInUser as SchoolUser)?.phone || '');
    setEditTitle(currentTeacher?.title || '');
    setEditDepartment(currentTeacher?.department || '');
    setEditBio(currentTeacher?.bio || '');
    setEditOfficeHours(currentTeacher?.officeHours || '');
    setEditAvatar(currentTeacher?.avatar || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher) return;

    const matchedUser = schoolUsers.find(
      (u) => u.id === currentTeacher.id || (u.email && u.email.toLowerCase() === (currentTeacher.email || '').toLowerCase())
    ) || (loggedInUser as SchoolUser);

    const updatedUser: SchoolUser = {
      ...(matchedUser || {
        id: currentTeacher.id || `teacher-${Date.now()}`,
        role: 'teacher',
        status: 'active',
      }),
      id: currentTeacher.id || matchedUser?.id || `teacher-${Date.now()}`,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      title: editTitle.trim(),
      departmentName: editDepartment.trim(),
      department: editDepartment.trim(),
      bio: editBio.trim(),
      officeHours: editOfficeHours.trim(),
      avatar: editAvatar.trim() || currentTeacher.avatar,
    };

    if (onUpdateUserProfile) {
      onUpdateUserProfile(updatedUser);
    } else if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    setIsEditingProfile(false);
  };

  // New announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annClassId, setAnnClassId] = useState(teacherClasses[0]?.id || 'cls-101');
  const [annPriority, setAnnPriority] = useState<'normal' | 'urgent'>('normal');
  const [annSuccess, setAnnSuccess] = useState(false);

  // New resource form state
  const [resTitle, setResTitle] = useState('');
  const [resCategory, setResCategory] = useState<'Lecture Notes' | 'Robotics Schematics' | 'Lab Worksheet' | 'Project Files' | 'Syllabus'>('Lecture Notes');
  const [resDesc, setResDesc] = useState('');
  const [resClassId, setResClassId] = useState(teacherClasses[0]?.id || 'cls-101');
  const [resSuccess, setResSuccess] = useState(false);

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    const targetClass = classes.find((c) => c.id === annClassId);
    const newAnn: ClassAnnouncement = {
      id: `ann-${Date.now()}`,
      classId: annClassId,
      className: targetClass?.title || 'STEM Lab',
      teacherName: currentTeacher.name,
      title: annTitle.trim(),
      content: annContent.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      priority: annPriority,
    };

    onAddAnnouncement(newAnn);
    setAnnTitle('');
    setAnnContent('');
    setAnnSuccess(true);
    setTimeout(() => setAnnSuccess(false), 4000);
  };

  const handlePublishResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resDesc.trim()) return;

    const targetClass = classes.find((c) => c.id === resClassId);
    const newRes: TeacherResource = {
      id: `res-${Date.now()}`,
      title: resTitle.trim(),
      classId: resClassId,
      className: targetClass?.title || 'STEM Lab',
      category: resCategory,
      fileUrl: 'https://shawstemacademy.edu/materials/demo',
      uploadDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      description: resDesc.trim(),
      fileSize: '1.5 MB PDF',
      teacherName: currentTeacher.name,
    };

    onAddResource(newRes);
    setResTitle('');
    setResDesc('');
    setResSuccess(true);
    setTimeout(() => setResSuccess(false), 4000);
  };

  // State for editing class Google Classroom links
  const [editingGcClassId, setEditingGcClassId] = useState<string | null>(null);
  const [editGcUrl, setEditGcUrl] = useState<string>('');
  const [editMeetUrl, setEditMeetUrl] = useState<string>('');

  const handleStartEditGc = (cls: ClassItem) => {
    setEditingGcClassId(cls.id);
    setEditGcUrl(cls.googleClassroomUrl || `https://classroom.google.com/c/${cls.id}`);
    setEditMeetUrl(cls.googleMeetUrl || `https://meet.google.com/shaw-${cls.id}`);
  };

  const handleSaveGcLink = (classId: string) => {
    if (!onUpdateClassList) return;
    const updated = classes.map((c) =>
      c.id === classId
        ? {
            ...c,
            googleClassroomUrl: editGcUrl.trim(),
            googleMeetUrl: editMeetUrl.trim(),
          }
        : c
    );
    onUpdateClassList(updated);
    setEditingGcClassId(null);
  };

  // Filter resources & announcements by current teacher
  const teacherAnnouncements = announcements.filter((a) => a.teacherName === currentTeacher?.name);
  const teacherResources = resources.filter((r) => r.teacherName === currentTeacher?.name);

  return (
    <div className="space-y-10 pb-16">
      {/* Teacher Profile & Selector Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={currentTeacher?.avatar}
              alt={currentTeacher?.name}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-700 shrink-0"
            />
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                <span>Faculty & Instructor Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{currentTeacher?.name}</h1>
              <p className="text-xs sm:text-sm text-slate-400">{currentTeacher?.title} • {currentTeacher?.department}</p>
              
              <button
                onClick={handleOpenEditProfileModal}
                className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit My Faculty Profile</span>
              </button>
            </div>
          </div>

          {/* Switch Faculty Member Selector (Only visible to Admin) */}
          {currentRole === 'admin' ? (
            <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 space-y-2 shrink-0">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Admin Overseer • Switch Faculty View:
              </label>
              <select
                value={activeTeacherId}
                onChange={(e) => setActiveTeacherId(e.target.value)}
                className="bg-slate-900 text-white border border-slate-700 text-xs font-semibold px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.department})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/80 text-right space-y-1 shrink-0">
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Authenticated Instructor Session
              </div>
              <p className="text-xs text-slate-400 font-medium">Isolated Faculty Dashboard • Private Access</p>
            </div>
          )}
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveSection('classes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeSection === 'classes'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>Assigned Courses & Links</span>
        </button>

        <button
          onClick={() => setActiveSection('claims')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeSection === 'claims'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Teaching Claim Form & Calendar</span>
        </button>

        <button
          onClick={() => setActiveSection('resources')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeSection === 'resources'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-600" />
          <span>Announcements & Materials</span>
        </button>
      </div>

      {activeSection === 'claims' && (
        <ClassClaimForm
          currentUser={loggedInUser || currentTeacher}
          currentRole={currentRole}
          classList={classes}
          sbaHubOptions={sbaHubOptions}
          claims={claims}
          onUpdateClaims={onUpdateClaims}
          hourlyRates={hourlyRates}
          onUpdateHourlyRates={onUpdateHourlyRates}
          users={schoolUsers}
        />
      )}

      {activeSection === 'classes' && (
        <div className="space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Assigned Courses & Google Classroom Links</h2>
            <p className="text-xs text-slate-500">
              Classes are <strong>Invite-Only</strong> on Google Classroom to prevent unauthorized access. Manage direct class links for enrolled students below.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Invite-Only Access Mode</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teacherClasses.map((cls) => {
            const pct = Math.round((cls.enrolled / cls.capacity) * 100);
            const isEditingThisClass = editingGcClassId === cls.id;
            const gcUrl = cls.googleClassroomUrl || `https://classroom.google.com/c/${cls.id}`;
            const meetUrl = cls.googleMeetUrl || `https://meet.google.com/shaw-${cls.id}`;

            return (
              <div key={cls.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      {cls.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{cls.location}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{cls.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{cls.schedule}</p>

                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Enrolled Students</span>
                      <span className="text-slate-900 font-bold">{cls.enrolled} / {cls.capacity}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pct > 80 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Google Classroom Direct Section */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        Google Classroom Link
                      </span>
                      <button
                        onClick={() => isEditingThisClass ? setEditingGcClassId(null) : handleStartEditGc(cls)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        {isEditingThisClass ? 'Cancel' : 'Edit Links'}
                      </button>
                    </div>

                    {isEditingThisClass ? (
                      <div className="space-y-2 pt-1 border-t border-slate-200">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                            Google Classroom URL
                          </label>
                          <input
                            type="url"
                            value={editGcUrl}
                            onChange={(e) => setEditGcUrl(e.target.value)}
                            placeholder="https://classroom.google.com/c/..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                            Google Meet Live Link (Optional)
                          </label>
                          <input
                            type="url"
                            value={editMeetUrl}
                            onChange={(e) => setEditMeetUrl(e.target.value)}
                            placeholder="https://meet.google.com/..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <button
                          onClick={() => handleSaveGcLink(cls.id)}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                        >
                          Save Class Links
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-slate-600">
                        <div className="flex items-center gap-1 text-[11px] truncate">
                          <span className="font-semibold text-slate-700 shrink-0">Classroom:</span>
                          <a
                            href={gcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {gcUrl}
                          </a>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] truncate">
                          <span className="font-semibold text-slate-700 shrink-0">Meet:</span>
                          <a
                            href={meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {meetUrl}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <a
                    href={gcUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Classroom</span>
                  </a>
                  <a
                    href={meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    <span>Meet</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* PUBLISH SECTION: Announcement Form & Resource Form */}
      {(activeSection === 'resources' || activeSection === 'classes') && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Form 1: Publish Class Announcement */}
        <form
          onSubmit={handlePublishAnnouncement}
          className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5"
        >
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Publish Class Announcement</h3>
          </div>
          <p className="text-xs text-slate-500">
            Post lab updates, schedule changes, or competition notices directly to your students' portal.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Class</label>
              <select
                value={annClassId}
                onChange={(e) => setAnnClassId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
              >
                {teacherClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Title</label>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="e.g. Robotics Lab Kits Available for Pickup"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
              <textarea
                rows={3}
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                placeholder="Write your announcement message for enrolled students..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    checked={annPriority === 'normal'}
                    onChange={() => setAnnPriority('normal')}
                  />
                  <span>Normal</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    checked={annPriority === 'urgent'}
                    onChange={() => setAnnPriority('urgent')}
                  />
                  <span>Urgent Notice</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Publish Announcement to Student Portal</span>
          </button>

          {annSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Announcement published successfully! Students can view it in their portal.</span>
            </div>
          )}
        </form>

        {/* Form 2: Upload Learning Resource */}
        <form
          onSubmit={handlePublishResource}
          className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5"
        >
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-900">Upload Learning Resource</h3>
          </div>
          <p className="text-xs text-slate-500">
            Add Arduino schematics, Python templates, lab worksheets, or PDF syllabus links for your enrolled students.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Class</label>
              <select
                value={resClassId}
                onChange={(e) => setResClassId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
              >
                {teacherClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resource Title</label>
                <input
                  type="text"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  placeholder="e.g. Lab 3 Motor Schematic"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Material Category</label>
                <select
                  value={resCategory}
                  onChange={(e) => setResCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                >
                  {resourceCategories.length > 0 ? (
                    resourceCategories.map((cat) => (
                      <option key={cat.id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Lecture Notes">Lecture Notes</option>
                      <option value="Robotics Schematics">Robotics Schematics</option>
                      <option value="Lab Worksheet">Lab Worksheet</option>
                      <option value="Project Files">Project Files</option>
                      <option value="Syllabus">Syllabus</option>
                      <option value="Practice Tests">Practice Tests</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Resource Description</label>
              <textarea
                rows={3}
                value={resDesc}
                onChange={(e) => setResDesc(e.target.value)}
                placeholder="Briefly describe what this schematic, worksheet, or template contains..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Publish Resource to Enrolled Students</span>
          </button>

          {resSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Resource added! Enrolled students can download it from their portal.</span>
            </div>
          )}
        </form>
      </div>

      {/* Published Announcements List for this Teacher */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">My Published Announcements</h2>
        {teacherAnnouncements.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No announcements published yet for your classes.</p>
        ) : (
          <div className="space-y-3">
            {teacherAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{ann.className}</span>
                    <span className="text-[11px] text-slate-400">{ann.date}</span>
                    {ann.priority === 'urgent' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        Urgent
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
                  <p className="text-xs text-slate-600">{ann.content}</p>
                </div>

                <button
                  onClick={() => onDeleteAnnouncement(ann.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Published Resources List for this Teacher */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">My Published Course Resources</h2>
        {teacherResources.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No resources published yet for your classes.</p>
        ) : (
          <div className="space-y-3">
            {teacherResources.map((res) => (
              <div
                key={res.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {res.category}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{res.className}</span>
                    <span className="text-[11px] text-slate-400">{res.uploadDate}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{res.title}</h4>
                  <p className="text-xs text-slate-600">{res.description}</p>
                </div>

                <button
                  onClick={() => onDeleteResource(res.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Resource"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HOD Resource Category Manager & Department News Management */}
      {(currentRole === 'hod' || currentRole === 'admin' || (loggedInUser && 'role' in loggedInUser && (loggedInUser.role === 'hod' || loggedInUser.role === 'admin'))) && (
        <div className="pt-8 border-t border-slate-200 space-y-8">
          <HodResourceCategoryManager
            categories={resourceCategories}
            loggedInUser={loggedInUser as SchoolUser}
            currentRole={currentRole}
          />

          <AdminNewsManagement
            news={schoolNews}
            departments={departments}
            loggedInUser={loggedInUser as SchoolUser}
            currentRole={currentRole}
          />
        </div>
      )}
      </div>
      )}
      {/* MODAL: EDIT TEACHER FACULTY PROFILE */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Edit Faculty Profile</h3>
                  <p className="text-xs text-slate-500">Update your teacher credentials and contact details</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <ImageUploadInput
                label="Faculty Profile Avatar"
                value={editAvatar}
                onChange={setEditAvatar}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (868) 555-0199"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Robotics Lead"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & AI"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Office Hours
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mon & Wed 2:00 PM - 4:00 PM"
                    value={editOfficeHours}
                    onChange={(e) => setEditOfficeHours(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Faculty Biography & Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Share a short bio regarding your teaching experience and research interests..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
