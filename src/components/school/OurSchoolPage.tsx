import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Edit3, 
  Save, 
  Plus, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Trash2, 
  Globe, 
  Lock, 
  Mail, 
  GraduationCap,
  Award,
  RefreshCw,
  X
} from 'lucide-react';
import { OurSchoolPageData, OurSchoolStaffMember, SchoolUser } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { FormattedText } from '../common/FormattedText';

interface OurSchoolPageProps {
  data: OurSchoolPageData;
  schoolUsers?: SchoolUser[];
  isAdmin?: boolean;
  onUpdateData?: (newData: OurSchoolPageData) => Promise<void> | void;
}

export const OurSchoolPage: React.FC<OurSchoolPageProps> = ({
  data,
  schoolUsers = [],
  isAdmin = false,
  onUpdateData,
}) => {
  const [pageData, setPageData] = useState<OurSchoolPageData>(data);
  const [saving, setSaving] = useState(false);

  // Modals
  const [isEditingPrincipal, setIsEditingPrincipal] = useState(false);
  const [principalForm, setPrincipalForm] = useState({
    name: data.principalName || 'S. Shaw',
    title: data.principalTitle || 'CEO & Founder / Principal',
    photoUrl: data.principalPhotoUrl || '',
    message: data.principalMessage || '',
  });

  const [editingStaffMember, setEditingStaffMember] = useState<OurSchoolStaffMember | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState<Partial<OurSchoolStaffMember>>({
    name: '',
    title: '',
    position: '',
    pictureUrl: '',
    department: '',
    email: '',
    bio: '',
    isPublished: false, // Hidden by default for new staff entries
  });

  // Filter tab for admins (All, Published, Draft)
  const [staffFilter, setStaffFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Keep state synced with props
  React.useEffect(() => {
    setPageData(data);
    setPrincipalForm({
      name: data.principalName || 'S. Shaw',
      title: data.principalTitle || 'CEO & Founder / Principal',
      photoUrl: data.principalPhotoUrl || '',
      message: data.principalMessage || '',
    });
  }, [data]);

  // Helper to save whole page data
  const handleSavePageData = async (updatedData: OurSchoolPageData) => {
    setSaving(true);
    setPageData(updatedData);
    if (onUpdateData) {
      await onUpdateData(updatedData);
    }
    setSaving(false);
  };

  // Save Principal Message
  const handleSavePrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...pageData,
      principalName: principalForm.name,
      principalTitle: principalForm.title,
      principalPhotoUrl: principalForm.photoUrl,
      principalMessage: principalForm.message,
    };
    await handleSavePageData(updated);
    setIsEditingPrincipal(false);
  };

  // Toggle Staff Publish status
  const handleToggleStaffPublish = async (staffId: string) => {
    const updatedStaff = pageData.staffMembers.map((member) => {
      if (member.id === staffId) {
        return { ...member, isPublished: !member.isPublished, updatedAt: new Date().toISOString() };
      }
      return member;
    });
    await handleSavePageData({ ...pageData, staffMembers: updatedStaff });
  };

  // Publish all draft staff
  const handlePublishAllStaff = async () => {
    const updatedStaff = pageData.staffMembers.map((member) => ({
      ...member,
      isPublished: true,
      updatedAt: new Date().toISOString(),
    }));
    await handleSavePageData({ ...pageData, staffMembers: updatedStaff });
  };

  // Delete staff member
  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm('Are you sure you want to remove this staff profile from Our School directory?')) {
      return;
    }
    const updatedStaff = pageData.staffMembers.filter((m) => m.id !== staffId);
    await handleSavePageData({ ...pageData, staffMembers: updatedStaff });
  };

  // Save/Edit Staff Member modal
  const handleSaveStaffForm = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedStaff: OurSchoolStaffMember[];

    if (editingStaffMember) {
      // Edit existing
      updatedStaff = pageData.staffMembers.map((m) => {
        if (m.id === editingStaffMember.id) {
          return {
            ...m,
            name: staffForm.name || m.name,
            title: staffForm.title || m.title,
            position: staffForm.position || m.position,
            pictureUrl: staffForm.pictureUrl || m.pictureUrl,
            department: staffForm.department || m.department || '',
            email: staffForm.email || m.email || '',
            bio: staffForm.bio || m.bio || '',
            isPublished: staffForm.isPublished ?? m.isPublished,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      });
    } else {
      // Create new
      const newMember: OurSchoolStaffMember = {
        id: `staff-${Date.now()}`,
        name: staffForm.name || 'Faculty Member',
        title: staffForm.title || 'STEM Educator',
        position: staffForm.position || 'Teacher',
        pictureUrl: staffForm.pictureUrl || '/logo.png',
        department: staffForm.department || 'General Science',
        email: staffForm.email || '',
        bio: staffForm.bio || '',
        isPublished: staffForm.isPublished ?? false, // Hidden by default
        updatedAt: new Date().toISOString(),
      };
      updatedStaff = [newMember, ...pageData.staffMembers];
    }

    await handleSavePageData({ ...pageData, staffMembers: updatedStaff });
    setEditingStaffMember(null);
    setIsAddingStaff(false);
  };

  // Populate Teachers/HODs from system users into directory as draft items if not already added
  const handleSyncTeachersFromSystem = async () => {
    const teachersAndHods = schoolUsers.filter((u) => u.role === 'teacher' || u.role === 'hod');
    if (teachersAndHods.length === 0) {
      alert('No teacher or HOD user accounts found in system users.');
      return;
    }

    const existingNames = new Set(pageData.staffMembers.map((m) => m.name.toLowerCase()));
    const newItems: OurSchoolStaffMember[] = [];

    teachersAndHods.forEach((u) => {
      if (!existingNames.has(u.name.toLowerCase())) {
        newItems.push({
          id: `staff-user-${u.id}-${Date.now()}`,
          name: u.name,
          title: u.role === 'hod' ? 'Head of Department' : 'STEM Educator',
          position: u.department ? `${u.department} Faculty` : 'Instructional Faculty',
          pictureUrl: u.picture || u.avatar || '/logo.png',
          department: u.department || 'STEM Department',
          email: u.email,
          bio: `Dedicated faculty member in ${u.department || 'Shaw STEM Academy'}.`,
          isPublished: false, // Default hidden/draft until admin publishes
          updatedAt: new Date().toISOString(),
        });
      }
    });

    if (newItems.length === 0) {
      alert('All system teachers and HODs are already added to the staff list.');
      return;
    }

    const merged = [...pageData.staffMembers, ...newItems];
    await handleSavePageData({ ...pageData, staffMembers: merged });
    alert(`Added ${newItems.length} teacher(s)/HOD(s) to draft list. They are currently hidden until you review and publish them live.`);
  };

  // Filter staff visible to current viewer
  const displayedStaff = pageData.staffMembers.filter((m) => {
    if (!isAdmin) {
      return m.isPublished; // Visitors and students ONLY see live published staff
    }
    // Admins see according to filter tab
    if (staffFilter === 'published') return m.isPublished;
    if (staffFilter === 'draft') return !m.isPublished;
    return true; // 'all'
  });

  const draftCount = pageData.staffMembers.filter((m) => !m.isPublished).length;
  const publishedCount = pageData.staffMembers.filter((m) => m.isPublished).length;

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-blue-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Welcome to Our School</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Shaw S.T.E.M Academy
          </h1>
          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-normal">
            Discover our leadership vision, core educational values, and the dedicated educators guiding our students toward STEM excellence.
          </p>
        </div>
      </div>

      {/* Admin Management Bar */}
      {isAdmin && (
        <div className="p-5 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Our School Admin Management Mode</span>
                {draftCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-extrabold uppercase">
                    {draftCount} Pending Draft(s)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Teacher profiles added by default are kept in <strong className="text-amber-700 dark:text-amber-400 font-bold">Draft / Hidden</strong> mode so you can edit their picture, name, title, and position before publishing live.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditingPrincipal(true)}
              className="px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Principal Letter</span>
            </button>

            <button
              onClick={handleSyncTeachersFromSystem}
              className="px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Populate missing teachers & HODs from system accounts as drafts"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sync System Teachers</span>
            </button>

            <button
              onClick={() => {
                setEditingStaffMember(null);
                setStaffForm({
                  name: '',
                  title: 'STEM Educator',
                  position: 'Instructional Faculty',
                  pictureUrl: '/logo.png',
                  department: 'STEM Department',
                  email: '',
                  bio: '',
                  isPublished: false,
                });
                setIsAddingStaff(true);
              }}
              className="px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Add Staff Card</span>
            </button>

            {draftCount > 0 && (
              <button
                onClick={handlePublishAllStaff}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Publish All ({draftCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Principal / CEO Message Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-xs relative group overflow-hidden">
        {isAdmin && (
          <button
            onClick={() => setIsEditingPrincipal(true)}
            className="absolute top-6 right-6 px-3.5 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer z-10"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Welcome Message</span>
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Principal Image Box */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-lg group-hover:shadow-xl transition-all aspect-[3/4] bg-slate-100 dark:bg-slate-800">
              <img
                src={pageData.principalPhotoUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80'}
                alt={pageData.principalName}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white p-3 backdrop-blur-md bg-slate-900/60 rounded-xl border border-white/10">
                <div className="font-extrabold text-lg leading-tight">{pageData.principalName}</div>
                <div className="text-xs text-blue-300 font-semibold">{pageData.principalTitle}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 font-medium space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                <Sparkles className="w-4 h-4" />
                <span>Shaw S.T.E.M Academy Leadership</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Dedicated to pioneering technology-infused education from secondary grades through college prep.
              </p>
            </div>
          </div>

          {/* Principal Message Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                A Message from the Principal
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Welcome to Shaw S.T.E.M Academy
              </h2>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed font-normal space-y-4">
              <FormattedText text={pageData.principalMessage} />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-black text-slate-900 dark:text-slate-100 text-base">{pageData.principalName}</div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{pageData.principalTitle}</div>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-500" />
                <span>Shaw STEM Academy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List of Teachers & Faculty Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Our Educators & Academic Staff</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Faculty & Staff Directory
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Meet our team of STEM educators, department heads, and academic specialists.
            </p>
          </div>

          {/* Admin Filter Tabs */}
          {isAdmin && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setStaffFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  staffFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                All ({pageData.staffMembers.length})
              </button>
              <button
                onClick={() => setStaffFilter('published')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  staffFilter === 'published'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                Live ({publishedCount})
              </button>
              <button
                onClick={() => setStaffFilter('draft')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  staffFilter === 'draft'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-amber-600'
                }`}
              >
                Drafts ({draftCount})
              </button>
            </div>
          )}
        </div>

        {/* Staff Directory Grid */}
        {displayedStaff.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="text-base font-bold text-slate-700 dark:text-slate-300">
              {isAdmin
                ? 'No staff profiles match this filter.'
                : 'Faculty directory is currently being updated by academy administration.'}
            </div>
            {isAdmin && (
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click <strong className="text-blue-600 font-bold">"Sync System Teachers"</strong> or <strong className="text-blue-600 font-bold">"Add Staff Card"</strong> above to populate educators into the draft list.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedStaff.map((staff) => (
              <div
                key={staff.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between group shadow-xs hover:shadow-md ${
                  !staff.isPublished
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div>
                  {/* Image container & Badges */}
                  <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={staff.pictureUrl || '/logo.png'}
                      alt={staff.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      {staff.isPublished ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-white shadow-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Live</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-white shadow-xs flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Draft (Hidden)</span>
                        </span>
                      )}
                    </div>

                    {/* Department Badge */}
                    {staff.department && (
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white border border-white/20">
                          {staff.department}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 leading-snug">
                      {staff.name}
                    </h3>

                    {/* Title */}
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {staff.title}
                    </div>

                    {/* Position */}
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{staff.position}</span>
                    </div>

                    {staff.email && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-1 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{staff.email}</span>
                      </div>
                    )}

                    {staff.bio && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 pt-1 leading-relaxed">
                        {staff.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Admin Quick Actions Footer */}
                {isAdmin && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-2">
                    <button
                      onClick={() => {
                        setEditingStaffMember(staff);
                        setStaffForm(staff);
                      }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-blue-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleToggleStaffPublish(staff.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        staff.isPublished
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                      }`}
                      title={staff.isPublished ? 'Unpublish / Hide from public' : 'Publish / Make live'}
                    >
                      {staff.isPublished ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Go Live</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors cursor-pointer"
                      title="Delete profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Principal Modal */}
      {isEditingPrincipal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Principal Welcome Letter</h3>
                  <p className="text-xs text-slate-300">Update photo, name, title, and introduction letter for Our School page.</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingPrincipal(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrincipal} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Principal / CEO Photo *
                </label>
                <ImageUploadInput
                  value={principalForm.photoUrl}
                  onChange={(url) => setPrincipalForm((prev) => ({ ...prev, photoUrl: url }))}
                  placeholder="Upload principal photo or paste image URL..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Principal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={principalForm.name}
                    onChange={(e) => setPrincipalForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Title / Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={principalForm.title}
                    onChange={(e) => setPrincipalForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Welcome Message / Introduction Letter *
                </label>
                <textarea
                  required
                  rows={8}
                  value={principalForm.message}
                  onChange={(e) => setPrincipalForm((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingPrincipal(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Welcome Letter'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Member Modal */}
      {(isAddingStaff || editingStaffMember) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingStaffMember ? 'Edit Staff Profile' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Configure picture, name, title, and position. By default, keep as Draft to hide before publishing live.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingStaffMember(null);
                  setIsAddingStaff(false);
                }}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffForm} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Staff Picture *
                </label>
                <ImageUploadInput
                  value={staffForm.pictureUrl || ''}
                  onChange={(url) => setStaffForm((prev) => ({ ...prev, pictureUrl: url }))}
                  placeholder="Upload staff photo or paste image URL..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.name || ''}
                    onChange={(e) => setStaffForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Dr. Eleanor Vance"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={staffForm.department || ''}
                    onChange={(e) => setStaffForm((prev) => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Computer Science & AI"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.title || ''}
                    onChange={(e) => setStaffForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Head of Department - Robotics"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Position *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.position || ''}
                    onChange={(e) => setStaffForm((prev) => ({ ...prev, position: e.target.value }))}
                    placeholder="e.g. Senior Educator & Lab Director"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={staffForm.email || ''}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. teacher@shawstemacademy.edu"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Short Biography / Background
                </label>
                <textarea
                  rows={3}
                  value={staffForm.bio || ''}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Brief background summary..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Publish Switch */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {staffForm.isPublished ? (
                      <Globe className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{staffForm.isPublished ? 'Published Live on Page' : 'Draft / Hidden from Public'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {staffForm.isPublished
                      ? 'This profile is visible to all students, parents, and visitors on Our School tab.'
                      : 'This profile is hidden from visitors and only visible to administrators.'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!staffForm.isPublished}
                    onChange={(e) => setStaffForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStaffMember(null);
                    setIsAddingStaff(false);
                  }}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Staff Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
