import React, { useState, useEffect } from 'react';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Shield, 
  GraduationCap, 
  Edit3, 
  UserX, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Building2,
  Mail,
  ArrowUpDown,
  X,
  Plus,
  Ban,
  RotateCcw,
  FileText,
  Lock,
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';
import { SchoolUser, Department, TeacherProfile, UserRole, ClassItem, SbaHubOption, LocationOption, RolePermission } from '../../types';
import { sendUserPasswordResetEmail, cascadeArchiveAndDeleteUser } from '../../lib/firebase';
import { DeleteUserConfirmationModal } from './DeleteUserConfirmationModal';
import { WeeklyOfficeHoursSelector } from './WeeklyOfficeHoursSelector';

interface AdminUserManagementProps {
  users: SchoolUser[];
  permissions?: RolePermission[];
  departments: Department[];
  classList?: ClassItem[];
  sbaHubOptions?: SbaHubOption[];
  loggedInUser?: SchoolUser | null;
  currentRole?: UserRole;
  onAddUser: (user: SchoolUser) => void;
  onUpdateUser: (user: SchoolUser) => void;
  onDeleteUser: (userId: string) => void;
  onRoleChange: (userId: string, newRole: 'teacher' | 'admin' | 'student' | 'registrar' | 'hod') => void;
  onDepartmentChange: (userId: string, newDepartmentId: string) => void;
  onToggleUserDisabled?: (user: SchoolUser) => void;
  onUpdateClassList?: (updated: ClassItem[]) => void;
  logoUrl?: string;
  locations?: LocationOption[];
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  users = [],
  permissions = [],
  departments = [],
  classList = [],
  sbaHubOptions = [],
  loggedInUser,
  currentRole,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onRoleChange,
  onDepartmentChange,
  onToggleUserDisabled,
  onUpdateClassList,
  logoUrl,
  locations = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'admin' | 'registrar' | 'hod' | 'student' | 'disabled'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [cascadeDeleteUser, setCascadeDeleteUser] = useState<SchoolUser | null>(null);
  const [isCascadeDeleting, setIsCascadeDeleting] = useState(false);

  const handleCascadeDeleteConfirm = async (userId: string, reason: string) => {
    setIsCascadeDeleting(true);
    try {
      const res = await cascadeArchiveAndDeleteUser({
        userId,
        userObj: cascadeDeleteUser,
        actorId: loggedInUser?.id || 'admin',
        actorName: loggedInUser?.name || 'Administrator',
        reason
      });
      if (res.success) {
        onDeleteUser(userId);
        setCascadeDeleteUser(null);
      } else {
        alert(`Cascade deletion warning: ${res.error || 'Failed to archive user'}`);
      }
    } catch (err: any) {
      console.error('Error executing cascade user deletion:', err);
      alert(`Deletion error: ${err?.message || String(err)}`);
    } finally {
      setIsCascadeDeleting(false);
    }
  };

  // Reset selection when filters change to prevent off-screen mistakes
  useEffect(() => {
    setSelectedUserIds([]);
  }, [searchQuery, roleFilter, departmentFilter]);

  const handleBulkDelete = () => {
    if (selectedUserIds.length === 0) return;
    if (
      confirm(
        `Are you sure you want to PERMANENTLY DELETE ${selectedUserIds.length} selected staff member(s)?\n\nThis will remove their user profiles, assigned classes, department links, teaching claims, attendance, and uploaded resources across Firebase Auth and Firestore.`
      )
    ) {
      selectedUserIds.forEach((id) => onDeleteUser(id));
      setSelectedUserIds([]);
    }
  };

  const handleSelectUserToggle = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllToggle = () => {
    const visibleIds = filteredUsers.map((u) => u.id);
    const allVisibleSelected = visibleIds.every((id) => selectedUserIds.includes(id));

    if (allVisibleSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const getPermissionsForRole = (r: 'teacher' | 'admin' | 'registrar' | 'hod' | 'student') => {
    if (r === 'student') return [];
    
    if (permissions && permissions.length > 0) {
        return permissions.filter(p => {
          if (r === 'admin') return p.adminDefault;
          if (r === 'teacher') return p.teacherDefault;
          if (r === 'registrar') return p.registrarDefault;
          if (r === 'hod') return p.hodDefault;
          return false;
        }).map(p => p.id);
    }
    
    // Fallback if matrix is not yet loaded
    if (r === 'admin') {
      return ['manage_curriculum', 'upload_resources', 'post_announcements', 'manage_discounts', 'export_forms', 'view_logs', 'manage_users', 'manage_departments', 'assign_staff', 'manage_form_options'];
    } else if (r === 'hod') {
      return ['manage_curriculum', 'upload_resources', 'post_announcements', 'make_academy_news', 'edit_resource_material_type'];
    } else if (r === 'registrar') {
      return ['monitor_enrollment', 'edit_enrollment', 'verify_payment', 'manage_form_options'];
    } else {
      return ['manage_curriculum', 'upload_resources', 'post_announcements'];
    }
  };

  const handleBulkChangeRole = (targetRole: 'teacher' | 'admin' | 'registrar' | 'hod' | 'student') => {
    if (selectedUserIds.length === 0) return;
    const confirmMsg = `Are you sure you want to change the role of ${selectedUserIds.length} selected users to ${targetRole.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    selectedUserIds.forEach((id) => {
      const user = users.find((u) => u.id === id);
      if (user) {
        onRoleChange(id, targetRole);
      }
    });

    setSelectedUserIds([]);
  };

  const handleBulkDisable = () => {
    if (selectedUserIds.length === 0) return;
    const reason = window.prompt(
      'Enter an administrative reason for disabling these accounts (optional):',
      'Bulk administrative deactivation'
    );
    if (reason === null) return; // cancel

    selectedUserIds.forEach((id) => {
      const user = users.find((u) => u.id === id);
      if (user && user.status !== 'disabled') {
        if (onToggleUserDisabled) {
          onToggleUserDisabled(user, reason);
        } else {
          const disabledUser: SchoolUser = {
            ...user,
            status: 'disabled',
            disabledAt: new Date().toLocaleString('en-US'),
            disabledReason: reason,
          };
          onUpdateUser(disabledUser);
        }
      }
    });

    setSelectedUserIds([]);
  };

  const handleBulkEnable = () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to re-enable ${selectedUserIds.length} selected accounts?`)) return;

    selectedUserIds.forEach((id) => {
      const user = users.find((u) => u.id === id);
      if (user && user.status === 'disabled') {
        if (onToggleUserDisabled) {
          onToggleUserDisabled(user);
        } else {
          const restoredUser: SchoolUser = {
            ...user,
            status: 'active',
          };
          delete restoredUser.disabledAt;
          delete restoredUser.disabledReason;
          onUpdateUser(restoredUser);
        }
      }
    });

    setSelectedUserIds([]);
  };

  // HOD Access Determination
  const isHOD = currentRole === 'hod' || loggedInUser?.role === 'hod';
  const hodDepartmentId = loggedInUser?.departmentId || loggedInUser?.departmentIds?.[0] || '';
  const hodDepartment = departments.find(
    (d) => d.id === hodDepartmentId || d.name === loggedInUser?.departmentName || d.name === loggedInUser?.department
  );
  const hodDeptName = hodDepartment ? hodDepartment.name : loggedInUser?.departmentName || loggedInUser?.department || 'Your Department';

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SchoolUser | null>(null);

  // New/Edit form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'teacher' | 'admin' | 'registrar' | 'hod' | 'student'>('teacher');
  const [title, setTitle] = useState('');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([hodDepartmentId || departments[0]?.id || 'dept-1']);
  const [status, setStatus] = useState<'active' | 'on_leave' | 'invited' | 'disabled'>('active');
  const [bio, setBio] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [disabledReason, setDisabledReason] = useState('');
  const [avatar, setAvatar] = useState('');
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);

  // Disable reason prompt modal state
  const [disableModalUser, setDisableModalUser] = useState<SchoolUser | null>(null);
  const [selectedReasonPreset, setSelectedReasonPreset] = useState<string>('Leave of Absence / Temporary Suspension');
  const [customDisableReason, setCustomDisableReason] = useState<string>('');

  const REASON_PRESETS = [
    'Leave of Absence / Temporary Suspension',
    'End of Employment Contract',
    'Role Transition / Administrative Hold',
    'Security or Access Policy Review',
    'Custom Reason',
  ];

  const DEFAULT_AVATAR = logoUrl || '/logo.png';

  const getTitleForRole = (r: UserRole) => {
    const map: Record<string, string> = {
      teacher: 'Teacher',
      admin: 'Admin',
      registrar: 'Registrar',
      hod: 'HOD',
      student: 'Student',
    };
    return map[r] || 'Teacher';
  };

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('teacher');
    setTitle('Teacher');
    setSelectedDeptIds([hodDepartmentId || departments[0]?.id || 'dept-1']);
    setStatus('active');
    setAvatar('');
    setBio('');
    setOfficeHours('');
    setDisabledReason('');
    setAssignedClassIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (user: SchoolUser) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setTitle(getTitleForRole(user.role));
    setSelectedDeptIds(user.departmentIds && user.departmentIds.length > 0 ? user.departmentIds : [user.departmentId]);
    setStatus(user.status);
    setAvatar(user.avatar || '');
    setBio(user.bio || '');
    setOfficeHours(user.officeHours || '');
    setDisabledReason(user.disabledReason || '');
    setAssignedClassIds(user.assignedClassIds || []);
    setIsModalOpen(true);
  };

  const toggleDeptSelection = (deptId: string) => {
    if (isHOD) return; // HOD department is locked to their own
    if (selectedDeptIds.includes(deptId)) {
      if (selectedDeptIds.length === 1) return; // Keep at least 1 department selected
      setSelectedDeptIds(selectedDeptIds.filter((id) => id !== deptId));
    } else {
      setSelectedDeptIds([...selectedDeptIds, deptId]);
    }
  };

  const toggleClassAssignment = (classId: string) => {
    if (assignedClassIds.includes(classId)) {
      setAssignedClassIds(assignedClassIds.filter((id) => id !== classId));
    } else {
      setAssignedClassIds([...assignedClassIds, classId]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Please fill out Name and Email.');
      return;
    }

    // Restriction: HODs cannot promote anyone to Head of Department
    if (isHOD && role === 'hod') {
      alert('Heads of Department cannot assign the Head of Department role to other teachers. Only Administrators can assign HOD status.');
      return;
    }

    const primaryDeptId = selectedDeptIds[0] || hodDepartmentId || 'dept-1';
    const primaryDept = departments.find((d) => d.id === primaryDeptId);
    const primaryDeptName = primaryDept ? primaryDept.name : hodDeptName;

    const deptNames = selectedDeptIds.map((id) => {
      const d = departments.find((dep) => dep.id === id);
      return d ? d.name : id;
    });

    const finalRole = isHOD ? (editingUser?.role === 'hod' ? 'hod' : 'teacher') : role;
    const finalTitle = getTitleForRole(finalRole);

    if (editingUser) {
      const updated: SchoolUser = {
        ...editingUser,
        name: name.trim(),
        email: email.trim(),
        role: finalRole,
        title: finalTitle,
        departmentId: primaryDeptId,
        departmentName: primaryDeptName,
        departmentIds: selectedDeptIds,
        departmentNames: deptNames,
        status,
        avatar: avatar.trim() || editingUser.avatar || DEFAULT_AVATAR,
        bio: bio.trim(),
        officeHours: officeHours.trim(),
        assignedClassIds,
        disabledAt: status === 'disabled' ? (editingUser.disabledAt || new Date().toLocaleString('en-US')) : undefined,
        disabledReason: status === 'disabled' ? (disabledReason.trim() || 'Administrative decision') : undefined,
        permissions: getPermissionsForRole(finalRole),
      };
      onUpdateUser(updated);
    } else {
      const newUser: SchoolUser = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role: finalRole,
        title: finalTitle,
        departmentId: primaryDeptId,
        departmentName: primaryDeptName,
        departmentIds: selectedDeptIds,
        departmentNames: deptNames,
        status,
        avatar: avatar.trim() || DEFAULT_AVATAR,
        bio: bio.trim(),
        officeHours: officeHours.trim(),
        assignedClassIds,
        disabledAt: status === 'disabled' ? new Date().toLocaleString('en-US') : undefined,
        disabledReason: status === 'disabled' ? (disabledReason.trim() || 'Administrative decision') : undefined,
        permissions: getPermissionsForRole(finalRole),
      };
      onAddUser(newUser);
    }

    // Sync class instructor names if updated
    if (onUpdateClassList && classList.length > 0 && assignedClassIds.length > 0) {
      const updatedClasses = classList.map((c) => {
        if (assignedClassIds.includes(c.id)) {
          return { ...c, instructor: name.trim() };
        }
        return c;
      });
      onUpdateClassList(updatedClasses);
    }

    setIsModalOpen(false);
  };

  // Open disable prompt modal
  const handleDisableUser = (user: SchoolUser) => {
    setDisableModalUser(user);
    setSelectedReasonPreset('Leave of Absence / Temporary Suspension');
    setCustomDisableReason('');
  };

  // Confirm disable with reason
  const confirmDisableUserWithReason = () => {
    if (!disableModalUser) return;
    const finalReason =
      selectedReasonPreset === 'Custom Reason'
        ? customDisableReason.trim() || 'Administrative decision'
        : selectedReasonPreset;

    if (onToggleUserDisabled) {
      onToggleUserDisabled(disableModalUser, finalReason);
    } else {
      const disabledUser: SchoolUser = {
        ...disableModalUser,
        status: 'disabled',
        disabledAt: new Date().toLocaleString('en-US'),
        disabledReason: finalReason,
      };
      onUpdateUser(disabledUser);
    }
    setDisableModalUser(null);
  };

  // Quick re-enable handler
  const handleEnableUser = (user: SchoolUser) => {
    if (onToggleUserDisabled) {
      onToggleUserDisabled(user);
    } else {
      const restoredUser: SchoolUser = {
        ...user,
        status: 'active',
      };
      delete restoredUser.disabledAt;
      onUpdateUser(restoredUser);
    }
  };

  const [resettingPasswordUserId, setResettingPasswordUserId] = useState<string | null>(null);
  const [confirmingResetUserId, setConfirmingResetUserId] = useState<string | null>(null);
  const [resetStatusMap, setResetStatusMap] = useState<Record<string, { status: 'success' | 'error'; message: string }>>({});

  const handlePasswordReset = async (user: SchoolUser) => {
    try {
      setResettingPasswordUserId(user.id);
      await sendUserPasswordResetEmail(user.email);
      setResetStatusMap((prev) => ({
        ...prev,
        [user.id]: { status: 'success', message: 'Reset email sent!' },
      }));
      setTimeout(() => {
        setResetStatusMap((prev) => {
          const next = { ...prev };
          delete next[user.id];
          return next;
        });
      }, 5000);
    } catch (error: any) {
      setResetStatusMap((prev) => ({
        ...prev,
        [user.id]: { status: 'error', message: error.message || 'Failed to send' },
      }));
      setTimeout(() => {
        setResetStatusMap((prev) => {
          const next = { ...prev };
          delete next[user.id];
          return next;
        });
      }, 5000);
    } finally {
      setResettingPasswordUserId(null);
      setConfirmingResetUserId(null);
    }
  };

  // Filtered lists for HOD vs Admin
  const scopedUsers = users.filter((u) => {
    if (!isHOD) return true; // Admins see everyone else
    // HOD sees ONLY teachers in their department
    if (u.role === 'admin') return false;
    if (hodDepartmentId) {
      return u.departmentId === hodDepartmentId || (u.departmentIds || []).includes(hodDepartmentId);
    }
    if (hodDeptName) {
      return u.departmentName === hodDeptName || u.department === hodDeptName;
    }
    return true;
  });

  const activeUsers = scopedUsers.filter((u) => u.status !== 'disabled');
  const disabledUsers = scopedUsers.filter((u) => u.status === 'disabled');

  const filteredUsers = (roleFilter === 'disabled' ? disabledUsers : activeUsers).filter((u) => {
    const matchesSearch =
      (u?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (u?.email || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (u?.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (u?.departmentName || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    
    const matchesRole = roleFilter === 'all' || roleFilter === 'disabled' || u.role === roleFilter;
    const matchesDept = departmentFilter === 'all' || u.departmentId === departmentFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  const teacherCount = activeUsers.filter((u) => u.role === 'teacher').length;
  const adminCount = activeUsers.filter((u) => u.role === 'admin').length;
  const studentCount = activeUsers.filter((u) => u.role === 'student').length;
  const registrarCount = activeUsers.filter((u) => u.role === 'registrar').length;
  const hodCount = activeUsers.filter((u) => u.role === 'hod').length;

  return (
    <div className="space-y-8">
      {/* HOD Workspace Banner */}
      {isHOD && (
        <div className="bg-purple-900 text-white p-5 rounded-2xl border border-purple-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-xs font-bold uppercase tracking-wider border border-purple-500/30">
              <Building2 className="w-3.5 h-3.5 text-purple-300" />
              <span>Head of Department Portal</span>
            </div>
            <h3 className="text-lg font-bold">{hodDeptName} Staff Management</h3>
            <p className="text-xs text-purple-200">
              You are authorized to manage teachers and assign courses within <strong>{hodDeptName}</strong>.
              Teacher edits are restricted to your department. You cannot assign Head of Department status to other teachers.
            </p>
          </div>
          <div className="bg-purple-950/80 px-4 py-2.5 rounded-xl border border-purple-700 text-center shrink-0">
            <div className="text-xl font-extrabold text-white">{activeUsers.length}</div>
            <div className="text-[10px] font-semibold text-purple-300">Department Teachers</div>
          </div>
        </div>
      )}

      {/* Top action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>{isHOD ? `${hodDeptName} Teacher Directory` : 'Academy User Directory'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isHOD
              ? `Manage faculty profiles and course assignments for ${hodDeptName}.`
              : 'Create teachers and administrators, manage staff status, and disable users for log keeping in Firebase without deleting records.'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 self-start md:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isHOD ? 'Add Department Teacher' : 'Create Teacher or Admin'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              roleFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Roles ({activeUsers.length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              roleFilter === 'admin'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Admin ({adminCount})
          </button>
          <button
            onClick={() => setRoleFilter('student')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              roleFilter === 'student'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Student ({studentCount})
          </button>
          <button
            onClick={() => setRoleFilter('teacher')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              roleFilter === 'teacher'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Teacher ({teacherCount})
          </button>
          <button
            onClick={() => setRoleFilter('registrar')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              roleFilter === 'registrar'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Registrar ({registrarCount})
          </button>
          <button
            onClick={() => setRoleFilter('hod')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              roleFilter === 'hod'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            HOD ({hodCount})
          </button>
          <button
            onClick={() => setRoleFilter('disabled')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              roleFilter === 'disabled'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Disabled Log ({disabledUsers.length})</span>
          </button>
        </div>

        {/* Department Filter & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d, dIdx) => (
                <option key={d.id || `dept-filter-${dIdx}`} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="relative grow md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            {roleFilter === 'disabled' ? (
              <UserX className="w-4 h-4 text-rose-600" />
            ) : (
              <Users className="w-4 h-4 text-blue-600" />
            )}
            <span>
              {roleFilter === 'disabled' ? 'Disabled User Records & Deactivation Log' : 'Active User Directory'}
            </span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {filteredUsers.length} records shown
          </span>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedUserIds.length > 0 && (
          <div className="bg-slate-900 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 transition-all duration-200">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold text-blue-300 mr-1">{selectedUserIds.length}</span>
                <span className="font-semibold text-slate-300">staff members selected</span>
              </div>
              <button
                onClick={() => setSelectedUserIds([])}
                className="text-xs text-slate-400 hover:text-white underline font-semibold transition-colors ml-2"
              >
                Deselect all
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Batch Actions:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkChangeRole(e.target.value as any);
                      e.target.value = '';
                    }
                  }}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Change Role...</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                  <option value="registrar">Registrar</option>
                  <option value="hod">HOD</option>
                </select>
              </div>

              {roleFilter === 'disabled' ? (
                <button
                  onClick={handleBulkEnable}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Bulk Enable Accounts</span>
                </button>
              ) : (
                <button
                  onClick={handleBulkDisable}
                  className="bg-rose-600 hover:bg-rose-500 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Bulk Disable Accounts</span>
                </button>
              )}

              <button
                onClick={handleBulkDelete}
                className="bg-rose-800 hover:bg-rose-900 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer border border-rose-700"
                title="Permanently Delete Selected Staff Profiles & All Related Data"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedUserIds.length})</span>
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    checked={filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.includes(u.id))}
                    onChange={handleSelectAllToggle}
                  />
                </th>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Role & Privilege</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Status / Record</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {roleFilter === 'disabled'
                      ? 'No disabled users found. Disabled accounts will be logged here.'
                      : 'No staff members match the selected filters or search query.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, uIdx) => {
                  const dept = departments.find((d) => d.id === u.departmentId);
                  const isDisabled = u.status === 'disabled';

                  return (
                    <tr
                      key={u.id || u.email || `usr-${uIdx}`}
                      className={`transition-colors ${
                        isDisabled ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50/70'
                      } ${selectedUserIds.includes(u.id) ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="py-4 px-4 text-center w-12">
                        <input
                          type="checkbox"
                          className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={() => handleSelectUserToggle(u.id)}
                        />
                      </td>
                      {/* Name & Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className={`w-10 h-10 rounded-xl object-cover border shadow-2xs shrink-0 ${
                              isDisabled ? 'border-rose-300 grayscale' : 'border-slate-200'
                            }`}
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isDisabled && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-extrabold">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">{u.email}</div>
                            <div className="text-[11px] text-slate-600 font-semibold">{u.title}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge & Quick Switcher */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {u.role === 'teacher' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-extrabold text-[11px] border border-purple-200">
                              <GraduationCap className="w-3.5 h-3.5" />
                              Teacher
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[11px] border border-emerald-200">
                              <Shield className="w-3.5 h-3.5" />
                              Admin
                            </span>
                          )}

                          {!isDisabled && (
                            <button
                              onClick={() =>
                                onRoleChange(u.id, u.role === 'teacher' ? 'admin' : 'teacher')
                              }
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline transition-colors"
                              title="Promote or Demote Role"
                            >
                              Make {u.role === 'teacher' ? 'Admin' : 'Teacher'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Department Badges (Multiselect) */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(u.departmentIds && u.departmentIds.length > 0 ? u.departmentIds : [u.departmentId]).map((dId, dIdx) => {
                            const dObj = departments.find((d) => d.id === dId);
                            return (
                              <span
                                key={`${u.id || 'u'}-dept-${dId || dIdx}-${dIdx}`}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-white text-[10px] ${
                                  dObj?.color || 'bg-slate-600'
                                }`}
                              >
                                <Building2 className="w-2.5 h-2.5" />
                                <span>{dObj?.name || u.departmentName}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Status / Disabled Log */}
                      <td className="py-4 px-4">
                        {isDisabled ? (
                          <div className="space-y-0.5 max-w-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                              <Ban className="w-3 h-3" />
                              Disabled Account
                            </span>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Logged: {u.disabledAt || 'Recently'}
                            </div>
                            <div className="text-[10px] text-rose-700 font-bold truncate">
                              Reason: {u.disabledReason || 'Administrative decision'}
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              u.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : u.status === 'on_leave'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {u.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                            {u.status === 'active'
                              ? 'Active'
                              : u.status === 'on_leave'
                              ? 'On Leave'
                              : 'Invited'}
                          </span>
                        )}
                      </td>

                      {/* Edit, Disable, Re-enable Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {resetStatusMap[u.id] ? (
                            <div
                              className={`px-2 py-1 text-[10px] font-black rounded-lg border flex items-center gap-1 transition-all ${
                                resetStatusMap[u.id].status === 'success'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                              title={resetStatusMap[u.id].message}
                            >
                              <span>{resetStatusMap[u.id].status === 'success' ? '✓ Sent!' : '✗ Error'}</span>
                            </div>
                          ) : confirmingResetUserId === u.id ? (
                            <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg p-0.5 text-[10px] font-bold text-amber-800 transition-all">
                              <span className="px-1 text-[9px]">Send PWD reset?</span>
                              <button
                                onClick={() => handlePasswordReset(u)}
                                className="px-1.5 py-0.5 bg-amber-600 text-white rounded hover:bg-amber-700 cursor-pointer text-[9px] font-black"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmingResetUserId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 cursor-pointer text-[9px]"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingResetUserId(u.id)}
                              disabled={resettingPasswordUserId !== null}
                              className={`px-2.5 py-1 font-bold text-[11px] rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                                resettingPasswordUserId !== null
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                              title="Send Password Reset Email"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Reset PWD</span>
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Staff Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {isDisabled ? (
                            <button
                              onClick={() => handleEnableUser(u)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Re-enable User Account in Firebase"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Enable User</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDisableUser(u)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Disable user account for admin record keeping"
                            >
                              <UserX className="w-3.5 h-3.5 text-rose-600" />
                              <span>Disable</span>
                            </button>
                          )}

                          <button
                            onClick={() => setCascadeDeleteUser(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Cascade Archive & Scrub User Data"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEDICATED DISABLED USERS LOG KEEPING SECTION */}
      {disabledUsers.length > 0 && roleFilter !== 'disabled' && (
        <div className="bg-rose-50/60 rounded-2xl border border-rose-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-rose-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                <span>Admin Record Keeping: Disabled Staff Log ({disabledUsers.length})</span>
              </h3>
              <p className="text-xs text-rose-700">
                Disabled users are archived for record keeping. Their accounts remain saved in Firebase Firestore and can be re-enabled at any time.
              </p>
            </div>
            <button
              onClick={() => setRoleFilter('disabled')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-2xs"
            >
              View Full Disabled Log
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {disabledUsers.map((du, duIdx) => (
              <div
                key={du.id || du.email || `dis-${duIdx}`}
                className="bg-white rounded-xl border border-rose-200 p-4 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={du.avatar}
                    alt={du.name}
                    className="w-9 h-9 rounded-lg object-cover grayscale border border-rose-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate">{du.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{du.email}</div>
                    <div className="text-[10px] text-rose-600 font-semibold">
                      Disabled: {du.disabledAt || 'Recorded'}
                    </div>
                    <div className="text-[10px] text-rose-800 font-bold truncate">
                      Reason: {du.disabledReason || 'Administrative decision'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleEnableUser(du)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Enable</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingUser ? 'Edit Staff Member' : 'Create New Teacher or Admin'}
                </h3>
                <p className="text-xs text-slate-500">
                  Assign user roles, account status, and connect them to their academic department.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Robert Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="r.chen@shawstemacademy.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const selectedRole = e.target.value as 'teacher' | 'admin' | 'registrar' | 'hod';
                      setRole(selectedRole);
                      setTitle(getTitleForRole(selectedRole));
                    }}
                    disabled={isHOD}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    {!isHOD && <option value="admin">Admin</option>}
                    {!isHOD && <option value="registrar">Registrar</option>}
                    {!isHOD && <option value="hod">HOD</option>}
                  </select>
                  {isHOD && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg mt-1 flex items-center gap-1 font-medium">
                      <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Heads of Department manage teachers but cannot assign Head of Department status to others.</span>
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Departments (Multiselect) *
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">Click to select or deselect multiple departments for this staff member.</p>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {departments.map((d, dIdx) => {
                      const isSelected = selectedDeptIds.includes(d.id);
                      return (
                        <button
                          key={d.id || `modal-dept-${dIdx}`}
                          type="button"
                          onClick={() => toggleDeptSelection(d.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-400'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                          <span>{d.name} ({d.code})</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    disabled
                    placeholder="Automatically matched to Role"
                    value={title}
                    className="w-full px-3 py-2 border border-slate-300 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="active">Active</option>
                    <option value="prospective">Prospective Student</option>
                    <option value="awaiting_acceptance">Awaiting Acceptance</option>
                    <option value="accepted">Accepted</option>
                    <option value="pending_verification">Awaiting Verification</option>
                    <option value="enrolled_paid">Paid & Enrolled</option>
                    <option value="on_leave">On Leave</option>
                    <option value="invited">Invited</option>
                    <option value="denied">Denied</option>
                    <option value="disabled">Disabled (Archived Log Record)</option>
                  </select>
                </div>
              </div>

              {status === 'disabled' && (
                <div>
                  <label className="block text-xs font-bold text-rose-800 mb-1">
                    Reason for Disabling Account *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Leave of Absence, Contract Ended, Administrative Review"
                    value={disabledReason}
                    onChange={(e) => setDisabledReason(e.target.value)}
                    className="w-full px-3 py-2 border border-rose-300 bg-rose-50/50 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-rose-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Office Hours & Weekly Schedule
                </label>
                <WeeklyOfficeHoursSelector
                  value={officeHours}
                  onChange={(val) => setOfficeHours(val)}
                  locations={locations}
                />
              </div>

              <ImageUploadInput
                label="Profile Picture / Avatar"
                description="Upload a photo from your device or enter an image URL for this staff member's directory profile."
                value={avatar}
                onChange={(newAv) => setAvatar(newAv)}
                placeholder="Upload photo from device or enter URL..."
                aspectRatio="square"
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biographical Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="Short bio for the Academics directory..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Class Assignment Section */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Assigned Classes & Courses Taught ({assignedClassIds.length} Selected)
                  </label>
                  <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">
                    {isHOD ? 'Department & SBA Hub Assignment' : 'Course Bank & SBA Hub Assignment'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select all classes (Regular & SBA Hub) this staff member or HOD is assigned to teach or manage.
                </p>
                {classList.filter(c => c && c.isOffered !== false).length === 0 && sbaHubOptions.filter(s => s && s.isOffered !== false).length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                    No offered classes available in the course bank or SBA hub.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {/* Regular Classes */}
                    {classList.filter(c => c && c.isOffered !== false).length > 0 && (
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 px-1">
                          Regular Classes ({classList.filter(c => c && c.isOffered !== false).length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {classList.filter(c => c && c.isOffered !== false).map((c, cIdx) => {
                            const isAssigned = assignedClassIds.includes(c.id);
                            return (
                              <button
                                key={c.id || `cls-${cIdx}`}
                                type="button"
                                onClick={() => toggleClassAssignment(c.id)}
                                className={`p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border cursor-pointer ${
                                  isAssigned
                                    ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs font-bold'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-bold">{c.title}</div>
                                  <div className="text-[10px] text-slate-500">{c.code} • {c.category || 'Regular'}</div>
                                </div>
                                {isAssigned ? (
                                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 ml-1.5" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 ml-1.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SBA Hub Classes */}
                    {sbaHubOptions.filter(s => s && s.isOffered !== false).length > 0 && (
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 mb-1.5 px-1">
                          SBA Hub Classes ({sbaHubOptions.filter(s => s && s.isOffered !== false).length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {sbaHubOptions.filter(s => s && s.isOffered !== false).map((sba, sIdx) => {
                            const isAssigned = assignedClassIds.includes(sba.id);
                            return (
                              <button
                                key={sba.id || `sba-${sIdx}`}
                                type="button"
                                onClick={() => toggleClassAssignment(sba.id)}
                                className={`p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border cursor-pointer ${
                                  isAssigned
                                    ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs font-bold'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-bold">{sba.name || (sba as any).title || 'SBA Hub Course'}</div>
                                  <div className="text-[10px] text-purple-600">{(sba as any).code || sba.classType || 'SBA'} • SBA Hub Lab</div>
                                </div>
                                {isAssigned ? (
                                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 ml-1.5" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 ml-1.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {editingUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to PERMANENTLY DELETE staff account for ${editingUser.name}? This will remove all associated profile data, claims, department links, class assignments, and attendance records.`
                        )
                      ) {
                        onDeleteUser(editingUser.id);
                        setIsModalOpen(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete Staff Member</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    {editingUser ? 'Save Changes to Firebase' : 'Create User & Sync to Firebase'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disable User Reason Modal Prompt */}
      {disableModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-rose-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Disable User Account</h3>
                  <p className="text-xs text-slate-500">{disableModalUser.name} ({disableModalUser.email})</p>
                </div>
              </div>
              <button
                onClick={() => setDisableModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Deactivating this user will mark them as <span className="font-bold text-rose-700">Disabled</span> in Firestore and archive their profile. Please select or enter a reason for record-keeping:
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Preset Deactivation Reason
                </label>
                <div className="space-y-1.5">
                  {REASON_PRESETS.map((preset) => (
                    <label
                      key={preset}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        selectedReasonPreset === preset
                          ? 'border-rose-500 bg-rose-50/80 text-rose-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reasonPreset"
                        value={preset}
                        checked={selectedReasonPreset === preset}
                        onChange={() => setSelectedReasonPreset(preset)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>{preset}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedReasonPreset === 'Custom Reason' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custom Reason / Notes *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific details or rationale..."
                    value={customDisableReason}
                    onChange={(e) => setCustomDisableReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDisableModalUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDisableUserWithReason}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Disable & Record to Firestore</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASCADE USER DELETION MODAL */}
      <DeleteUserConfirmationModal
        isOpen={!!cascadeDeleteUser}
        user={cascadeDeleteUser}
        onClose={() => setCascadeDeleteUser(null)}
        onConfirmCascadeDelete={handleCascadeDeleteConfirm}
        isProcessing={isCascadeDeleting}
      />
    </div>
  );
};
