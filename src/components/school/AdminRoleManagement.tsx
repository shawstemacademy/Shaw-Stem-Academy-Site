import React, { useState } from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  Lock, 
  CheckCircle2, 
  Key, 
  Users, 
  X, 
  Shield, 
  Edit3, 
  UserCheck,
  Search,
  SlidersHorizontal,
  BookOpen,
  DollarSign,
  Camera,
  ClipboardList,
  FileCheck2,
  Building2,
  Sparkles,
  Info
} from 'lucide-react';
import { RolePermission, SchoolUser, UserRole } from '../../types';

interface AdminRoleManagementProps {
  permissions: RolePermission[];
  users: SchoolUser[];
  onTogglePermission: (permissionId: string, role: 'teacher' | 'admin' | 'registrar' | 'hod' | 'student') => void;
  onRoleChange: (userId: string, newRole: 'teacher' | 'admin' | 'registrar' | 'hod' | 'student') => void;
  onUpdateUser?: (updated: SchoolUser) => void;
}

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
  const [permissionFilter, setPermissionFilter] = useState<string>('all');

  // Editing User Modal State
  const [editingUserModal, setEditingUserModal] = useState<SchoolUser | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);

  const adminCount = (users || []).filter((u) => u && u.role === 'admin').length;
  const registrarCount = (users || []).filter((u) => u && u.role === 'registrar').length;
  const teacherCount = (users || []).filter((u) => u && u.role === 'teacher').length;
  const hodCount = (users || []).filter((u) => u && u.role === 'hod').length;
  const studentCount = (users || []).filter((u) => u && u.role === 'student').length;

  const categories = ['all', 'Registration', 'Academics', 'Faculty & Claims', 'Financials', 'Administration', 'System'];

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
      userRoleFilter === 'all' ? true : u.role === userRoleFilter;

    let matchesPerm = true;
    if (permissionFilter !== 'all') {
      const hasCustom = u.permissions?.includes(permissionFilter);
      const permConfig = permissions.find((p) => p.id === permissionFilter);
      const hasRolePerm = permConfig && userRolesList.some((r) => {
        if (r === 'admin') return permConfig.adminDefault;
        if (r === 'teacher') return permConfig.teacherDefault;
        if (r === 'registrar') return permConfig.registrarDefault;
        if (r === 'hod') return permConfig.hodDefault;
        if (r === 'student') return permConfig.studentDefault;
        return false;
      });
      matchesPerm = Boolean(hasCustom || hasRolePerm || userRolesList.includes('admin'));
    }

    return matchesSearch && matchesRole && matchesPerm;
  });

  const getDefaultPermissionsForRoles = (rolesList: UserRole[]) => {
    return permissions
      .filter((p) => {
        return rolesList.some((r) => {
          if (r === 'admin') return p.adminDefault;
          if (r === 'teacher') return p.teacherDefault;
          if (r === 'registrar') return p.registrarDefault;
          if (r === 'hod') return p.hodDefault;
          if (r === 'student') return p.studentDefault;
          return false;
        });
      })
      .map((p) => p.id);
  };

  const handleOpenUserRoleModal = (user: SchoolUser) => {
    setEditingUserModal(user);
    const existingRoles: UserRole[] = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    setSelectedRoles(existingRoles);
    setCustomPermissions(user.permissions && user.permissions.length > 0 ? user.permissions : getDefaultPermissionsForRoles(existingRoles));
  };

  const handleToggleRoleSelection = (roleToToggle: UserRole) => {
    let nextRoles: UserRole[];
    if (selectedRoles.includes(roleToToggle)) {
      if (selectedRoles.length === 1) return; // Keep at least one role
      nextRoles = selectedRoles.filter((r) => r !== roleToToggle);
    } else {
      nextRoles = [...selectedRoles, roleToToggle];
    }
    setSelectedRoles(nextRoles);
    setCustomPermissions(getDefaultPermissionsForRoles(nextRoles));
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

  const handleQuickGrantRevokeRole = (user: SchoolUser, roleToToggle: UserRole) => {
    if (!onUpdateUser) {
      onRoleChange(user.id, roleToToggle);
      return;
    }

    const existingRoles: UserRole[] = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    let nextRoles: UserRole[];
    
    if (existingRoles.includes(roleToToggle)) {
      if (existingRoles.length === 1) {
        alert(`Cannot remove the only role for ${user.name}. Assign another role first.`);
        return;
      }
      nextRoles = existingRoles.filter((r) => r !== roleToToggle);
    } else {
      nextRoles = [...existingRoles, roleToToggle];
    }

    const defaultPerms = getDefaultPermissionsForRoles(nextRoles);
    const updated: SchoolUser = {
      ...user,
      role: nextRoles[0] || 'student',
      roles: nextRoles,
      permissions: defaultPerms,
    };

    onUpdateUser(updated);
  };

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case 'admin':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'registrar':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'teacher':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'hod':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'student':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Registration':
        return <ClipboardList className="w-3.5 h-3.5 text-teal-600" />;
      case 'Academics':
        return <BookOpen className="w-3.5 h-3.5 text-blue-600" />;
      case 'Faculty & Claims':
        return <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />;
      case 'Financials':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Administration':
        return <Building2 className="w-3.5 h-3.5 text-amber-600" />;
      case 'System':
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Role Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Administrators</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{adminCount}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">Full system authority & role control</div>
        </div>

        <div className="bg-white rounded-2xl border border-teal-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider">Registrars</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{registrarCount}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">Registration controls & Add/Drop</div>
        </div>

        <div className="bg-white rounded-2xl border border-purple-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Teachers</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{teacherCount}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">Camera scanner, grades & claims</div>
        </div>

        <div className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">HODs</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{hodCount}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">Department lead & claim approvals</div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">Students</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{studentCount}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">Learner portal & course registration</div>
        </div>
      </div>

      {/* Role Authority & Process Reference Guide */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl border border-slate-700 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-400/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">System Roles & Process Authority Guide</h3>
            <p className="text-xs text-slate-300">
              Assign or revoke roles dynamically. Roles give or restrict access to distinct operations on the site.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-teal-300 text-sm">
              <ClipboardList className="w-4 h-4" />
              <span>Registrar & Admissions Role</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Assigned to staff who manage registration windows (Toggle A & B), approve/deny prospective student applications, manage course Add/Drop requests, and record tuition receipts.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-300 text-sm">
              <Camera className="w-4 h-4" />
              <span>Teacher & Faculty Role</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Assigned to instructional staff. Grants access to the QR Camera Scanner for student attendance, gradebooks, resource uploads, and teaching hourly claim submissions.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Administrator & HOD Roles</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Full governance authority: grant/revoke roles, modify permissions, department supervision, claim approvals, system action audit logs, and branding controls.
            </p>
          </div>
        </div>
      </div>

      {/* User Role & Granular Permission Management Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              <span>User Role & Process Privileges Directory</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Give or take roles for all users, or assign custom granular process overrides directly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Role Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['all', 'admin', 'registrar', 'teacher', 'hod', 'student'].map((r) => {
                let label = r;
                if (r === 'all') label = 'All Roles';
                if (r === 'admin') label = 'Admin';
                if (r === 'registrar') label = 'Registrar';
                if (r === 'teacher') label = 'Teacher';
                if (r === 'hod') label = 'HOD';
                if (r === 'student') label = 'Student';
                return (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      userRoleFilter === r
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Permission Process Filter */}
            <div className="relative">
              <select
                value={permissionFilter}
                onChange={(e) => setPermissionFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Process Privileges</option>
                {permissions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs sm:w-52 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs font-medium">
            No user accounts found matching your search or role filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const rolesList = user.roles && user.roles.length > 0 ? user.roles : [user.role];
              const hasCustomPerms = user.permissions && user.permissions.length > 0;

              return (
                <div
                  key={user.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                    />
                    <div className="overflow-hidden space-y-1 grow">
                      <div className="font-bold text-slate-900 text-sm truncate">{user.name}</div>
                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      
                      {/* Role Badges */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
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

                  {/* Quick Give/Take Role Chips */}
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200/80 text-[11px]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Quick Role Toggle (Click to Give / Take):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'admin' as UserRole, label: 'Admin' },
                        { id: 'registrar' as UserRole, label: 'Registrar' },
                        { id: 'teacher' as UserRole, label: 'Teacher' },
                        { id: 'hod' as UserRole, label: 'HOD' },
                        { id: 'student' as UserRole, label: 'Student' },
                      ].map((rObj) => {
                        const hasRole = rolesList.includes(rObj.id);
                        return (
                          <button
                            key={rObj.id}
                            type="button"
                            onClick={() => handleQuickGrantRevokeRole(user, rObj.id)}
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer ${
                              hasRole
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title={hasRole ? `Click to take ${rObj.label} role` : `Click to give ${rObj.label} role`}
                          >
                            {hasRole && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                            <span>{rObj.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium truncate">
                      {hasCustomPerms ? `${user.permissions?.length} custom privilege(s)` : 'Default role matrix'}
                    </span>

                    <button
                      onClick={() => handleOpenUserRoleModal(user)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Manage Privileges</span>
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
              <span>Academy Default Role Permission Matrix (All Processes)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure baseline permissions for every process across Admin, Registrar, Teacher, HOD, and Student roles.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
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
                <th className="py-3.5 px-6">Process & Privilege</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-center">Admin</th>
                <th className="py-3.5 px-4 text-center">Registrar</th>
                <th className="py-3.5 px-4 text-center">Teacher</th>
                <th className="py-3.5 px-4 text-center">HOD</th>
                <th className="py-3.5 px-4 text-center">Student</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPermissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>{perm.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">{perm.description}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                      {getCategoryIcon(perm.category)}
                      <span>{perm.category}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onTogglePermission(perm.id, 'admin')}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
                        perm.adminDefault
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={perm.adminDefault ? 'Revoke from Admins' : 'Grant to Admins'}
                    >
                      {perm.adminDefault ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onTogglePermission(perm.id, 'registrar')}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
                        perm.registrarDefault
                          ? 'bg-teal-100 text-teal-700 hover:bg-teal-200 border border-teal-300'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={perm.registrarDefault ? 'Revoke from Registrars' : 'Grant to Registrars'}
                    >
                      {perm.registrarDefault ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onTogglePermission(perm.id, 'teacher')}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
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
                      onClick={() => onTogglePermission(perm.id, 'hod')}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
                        perm.hodDefault
                          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={perm.hodDefault ? 'Revoke from HODs' : 'Grant to HODs'}
                    >
                      {perm.hodDefault ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onTogglePermission(perm.id, 'student')}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
                        perm.studentDefault
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={perm.studentDefault ? 'Revoke from Students' : 'Grant to Students'}
                    >
                      {perm.studentDefault ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
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
                  Users can hold multiple roles simultaneously. For example, an Administrator or Teacher can also hold the Registrar role.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'admin', label: 'Admin', color: 'emerald' },
                    { id: 'registrar', label: 'Registrar', color: 'teal' },
                    { id: 'teacher', label: 'Teacher', color: 'purple' },
                    { id: 'hod', label: 'HOD', color: 'indigo' },
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
                            ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-2xs ring-2 ring-blue-400'
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
                    Granular Process Permission Overrides
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCustomPermissions(getDefaultPermissionsForRoles(selectedRoles))}
                      className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 underline transition-colors cursor-pointer"
                    >
                      Reset to Matrix Defaults
                    </button>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {customPermissions.length} Enabled
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Select specific process privileges for this user. Enabled privileges grant explicit access regardless of default role rules.
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {permissions.map((perm) => {
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
                          <div className="text-xs font-bold flex items-center gap-2">
                            <span>{perm.name}</span>
                            <span className={`text-[10px] px-2 py-0.2 rounded font-medium ${isChecked ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                              {perm.category}
                            </span>
                          </div>
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
                  Save Roles & Privileges
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
