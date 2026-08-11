import React, { useState } from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Key,
  Users,
  Settings,
  ArrowRightLeft,
  X,
  Plus,
  Shield,
  Edit3,
  UserCheck
} from 'lucide-react';
import { RolePermission, SchoolUser, UserRole } from '../../types';

interface AdminRoleManagementProps {
  permissions: RolePermission[];
  users: SchoolUser[];
  onTogglePermission: (permissionId: string, role: 'teacher' | 'admin') => void;
  onRoleChange: (userId: string, newRole: 'teacher' | 'admin') => void;
  onUpdateUser?: (updated: SchoolUser) => void;
}

const ALL_SYSTEM_PERMISSIONS = [
  { id: 'manage_curriculum', name: 'Manage Curriculum & Course Bank', category: 'Academics', description: 'Create, edit, and archive classes and SBA Hub options.' },
  { id: 'upload_resources', name: 'Upload Lab & Course Resources', category: 'Academics', description: 'Upload worksheets, schematics, and study materials.' },
  { id: 'post_announcements', name: 'Post Classroom Announcements', category: 'Academics', description: 'Broadcast updates to students in assigned courses.' },
  { id: 'manage_discounts', name: 'Configure Tuition Discounts', category: 'Administration', description: 'Modify bundle discounts, promo codes, and pricing rules.' },
  { id: 'export_forms', name: 'Export Roster & Google Forms', category: 'Registration', description: 'Generate Google Forms import scripts and student CSVs.' },
  { id: 'view_logs', name: 'View System Audit Logs', category: 'System', description: 'Access activity logs and system events.' },
  { id: 'manage_users', name: 'Manage Users & Accounts', category: 'Administration', description: 'Create, edit, disable, or re-enable user profiles.' },
  { id: 'manage_departments', name: 'Manage Departments & HODs', category: 'Administration', description: 'Create academic departments and assign HOD leads.' },
  { id: 'assign_staff', name: 'Assign Instructors to Classes', category: 'Administration', description: 'Pair teachers with specific STEM classes.' },
  { id: 'manage_claims', name: 'Review & Verify Teacher Claims', category: 'Administration', description: 'Approve or reject teacher hourly payout claims.' },
  { id: 'view_financials', name: 'View Financial & Tuition Reports', category: 'Administration', description: 'Access revenue metrics, payment logs, and tuition totals.' },
  { id: 'manage_roles', name: 'Manage Roles & Privileges', category: 'System', description: 'Grant or revoke roles and custom permissions for staff.' },
  { id: 'system_settings', name: 'Configure System & Landing Page', category: 'System', description: 'Modify academy settings, themes, and branding.' },
];

export const AdminRoleManagement: React.FC<AdminRoleManagementProps> = ({
  permissions = [],
  users = [],
  onTogglePermission,
  onRoleChange,
  onUpdateUser,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [searchStaff, setSearchStaff] = useState('');

  // Editing User Modal State
  const [editingUserModal, setEditingUserModal] = useState<SchoolUser | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);

  const teacherCount = (users || []).filter((u) => u.role === 'teacher' || u.roles?.includes('teacher')).length;
  const adminCount = (users || []).filter((u) => u.role === 'admin' || u.roles?.includes('admin')).length;
  const registrarCount = (users || []).filter((u) => u.role === 'registrar' || u.roles?.includes('registrar')).length;
  const studentCount = (users || []).filter((u) => u.role === 'student' || u.roles?.includes('student')).length;

  const categories = ['all', 'Academics', 'Registration', 'Administration', 'System'];

  const filteredPermissions = permissions.filter((p) =>
    selectedCategory === 'all' ? true : p.category === selectedCategory
  );

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      (u?.name || '').toLowerCase().includes((searchStaff || '').toLowerCase()) ||
      (u?.email || '').toLowerCase().includes((searchStaff || '').toLowerCase()) ||
      (u?.title || '').toLowerCase().includes((searchStaff || '').toLowerCase());
    
    const userRolesList = u.roles && u.roles.length > 0 ? u.roles : [u.role];
    const matchesRole = 
      userRoleFilter === 'all' ? true : userRolesList.includes(userRoleFilter as UserRole);

    return matchesSearch && matchesRole;
  });

  const handleOpenUserRoleModal = (user: SchoolUser) => {
    setEditingUserModal(user);
    const existingRoles: UserRole[] = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    setSelectedRoles(existingRoles);
    setCustomPermissions(user.permissions || []);
  };

  const handleToggleRoleSelection = (roleToToggle: UserRole) => {
    if (selectedRoles.includes(roleToToggle)) {
      if (selectedRoles.length === 1) return; // Keep at least one role
      setSelectedRoles(selectedRoles.filter((r) => r !== roleToToggle));
    } else {
      setSelectedRoles([...selectedRoles, roleToToggle]);
    }
  };

  const handleToggleCustomPermission = (permId: string) => {
    if (customPermissions.includes(permId)) {
      setCustomPermissions(customPermissions.filter((p) => p !== permId));
    } else {
      setCustomPermissions([...customPermissions, permId]);
    }
  };

  const handleSaveUserRolesAndPermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserModal || !onUpdateUser) return;

    // Primary role is first role in selectedRoles
    const primaryRole = selectedRoles[0] || 'teacher';

    const updatedUser: SchoolUser = {
      ...editingUserModal,
      role: primaryRole,
      roles: selectedRoles,
      permissions: customPermissions,
    };

    onUpdateUser(updatedUser);
    setEditingUserModal(null);
  };

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case 'admin':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'teacher':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'registrar':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'hod':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'student':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Role Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Administrators</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{adminCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Teachers & Faculty</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{teacherCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-teal-200 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Registrars</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{registrarCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Students</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{studentCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* User Role & Granular Permission Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              <span>User Role & Granular Permission Directory</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Assign single or multiple roles (e.g. Admin + Teacher) and customize specific permission overrides per user.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Role Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['all', 'admin', 'teacher', 'registrar', 'student'].map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                    userRoleFilter === r
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'all' ? 'All Roles' : r}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Filter users by name or email..."
              value={searchStaff}
              onChange={(e) => setSearchStaff(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:w-60 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs font-medium">
            No user accounts found matching your search or role filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const rolesList = user.roles && user.roles.length > 0 ? user.roles : [user.role];
              const hasCustomPerms = user.permissions && user.permissions.length > 0;

              return (
                <div
                  key={user.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={user.name}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="overflow-hidden space-y-1">
                      <div className="font-bold text-slate-900 text-sm truncate">{user.name}</div>
                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      
                      {/* Role Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {rolesList.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getRoleBadgeStyle(r)}`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {hasCustomPerms ? `${user.permissions?.length} custom permission(s)` : 'Default role permissions'}
                    </span>

                    <button
                      onClick={() => handleOpenUserRoleModal(user)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Roles & Access</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Permission Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Academy Default Role Permission Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Toggle global default permissions granted to Teachers and Administrators across the academy. Custom per-user overrides take precedence.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Permission Privilege</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-center">Teacher Role</th>
                <th className="py-3.5 px-4 text-center">Admin Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPermissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 text-sm">{perm.name}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{perm.description}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                      {perm.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onTogglePermission(perm.id, 'teacher')}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                        perm.teacherDefault
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={perm.teacherDefault ? 'Revoke from Teachers' : 'Grant to Teachers'}
                    >
                      {perm.teacherDefault ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onTogglePermission(perm.id, 'admin')}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                        perm.adminDefault
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={perm.adminDefault ? 'Revoke from Admins' : 'Grant to Admins'}
                    >
                      {perm.adminDefault ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDIT USER ROLES AND CUSTOM PERMISSIONS */}
      {editingUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={editingUserModal.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={editingUserModal.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Edit Roles & Privileges: {editingUserModal.name}
                  </h3>
                  <p className="text-xs text-slate-500">{editingUserModal.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUserModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserRolesAndPermissions} className="space-y-6">
              {/* Multi-Role Assignment */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Assigned User Roles (Select all that apply)
                </label>
                <p className="text-xs text-slate-500">
                  Users can hold multiple roles simultaneously. For example, an Administrator can also be a Teacher.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'admin', label: 'Administrator', color: 'emerald' },
                    { id: 'teacher', label: 'Teacher / Faculty', color: 'purple' },
                    { id: 'registrar', label: 'Registrar', color: 'teal' },
                    { id: 'hod', label: 'Head of Department (HOD)', color: 'indigo' },
                    { id: 'student', label: 'Student', color: 'blue' },
                  ].map((roleObj) => {
                    const isSelected = selectedRoles.includes(roleObj.id as UserRole);
                    return (
                      <button
                        type="button"
                        key={roleObj.id}
                        onClick={() => handleToggleRoleSelection(roleObj.id as UserRole)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs">{roleObj.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Granular Permission Overrides */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Granular Custom Permission Overrides
                  </label>
                  <span className="text-[11px] font-bold text-blue-600">
                    {customPermissions.length} Enabled
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Select specific permission privileges for this user. Enabled permissions grant explicit access regardless of default role rules.
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                    const isChecked = customPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`p-3 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer ${
                          isChecked ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCustomPermission(perm.id)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold">{perm.name}</div>
                          <div className={`text-[11px] ${isChecked ? 'text-slate-300' : 'text-slate-500'}`}>
                            {perm.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUserModal(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Roles & Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
