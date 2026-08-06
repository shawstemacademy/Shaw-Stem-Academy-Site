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
  ArrowRightLeft
} from 'lucide-react';
import { RolePermission, SchoolUser } from '../../types';

interface AdminRoleManagementProps {
  permissions: RolePermission[];
  users: SchoolUser[];
  onTogglePermission: (permissionId: string, role: 'teacher' | 'admin') => void;
  onRoleChange: (userId: string, newRole: 'teacher' | 'admin') => void;
}

export const AdminRoleManagement: React.FC<AdminRoleManagementProps> = ({
  permissions = [],
  users = [],
  onTogglePermission,
  onRoleChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchStaff, setSearchStaff] = useState('');

  const teacherCount = (users || []).filter((u) => u.role === 'teacher').length;
  const adminCount = (users || []).filter((u) => u.role === 'admin').length;

  const categories = ['all', 'Academics', 'Registration', 'Administration', 'System'];

  const filteredPermissions = permissions.filter((p) =>
    selectedCategory === 'all' ? true : p.category === selectedCategory
  );

  const filteredStaff = users.filter((u) =>
    (u?.name || '').toLowerCase().includes((searchStaff || '').toLowerCase()) ||
    (u?.email || '').toLowerCase().includes((searchStaff || '').toLowerCase()) ||
    (u?.title || '').toLowerCase().includes((searchStaff || '').toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teacher Role Card */}
        <div className="bg-white rounded-2xl border border-purple-200 p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Teacher Role</h3>
                  <span className="text-[11px] text-purple-700 font-bold">Academic Faculty & Labs</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold border border-purple-200">
                {teacherCount} Assigned
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Teachers can manage their assigned STEM courses, upload lab worksheets and robotics schematics, and post classroom announcements.
            </p>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Create and modify assigned course syllabi</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Upload lecture notes and Arduino wiring diagrams</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Send urgent classroom broadcasts to students</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Privilege scope: Academic Level</span>
            <span className="text-purple-600 font-bold">Default Role</span>
          </div>
        </div>

        {/* Administrator Role Card */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Administrator Role</h3>
                  <span className="text-[11px] text-emerald-700 font-bold">Academy Registrar & Governance</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                {adminCount} Assigned
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Administrators hold full governance over tuition discount rules, staff role management, and financial records.
            </p>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Configure multi-class bundle discounts & promo codes</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Create/Edit staff accounts and academic departments</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Privilege scope: Full System Governance</span>
            <span className="text-emerald-700 font-bold">Elevated Role</span>
          </div>
        </div>
      </div>

      {/* Role Permission Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              <span>Academy Role Permission Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Toggle default capabilities granted to Teachers and Administrators across the academy portal.
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

      {/* Staff Role Transition Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              <span>Staff Role Assignment & Promotion</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Quickly promote faculty members between Teacher and Administrator roles.
            </p>
          </div>

          <input
            type="text"
            placeholder="Filter staff by name or title..."
            value={searchStaff}
            onChange={(e) => setSearchStaff(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs sm:w-64 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {filteredStaff.map((user) => (
            <div
              key={user.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-xl object-cover shrink-0"
                />
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-900 text-xs truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user.title}</div>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      user.role === 'teacher'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {user.role === 'teacher' ? 'Teacher' : 'Admin'}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  onRoleChange(user.id, user.role === 'teacher' ? 'admin' : 'teacher')
                }
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] shrink-0 transition-all ${
                  user.role === 'teacher'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs'
                }`}
              >
                Promote to {user.role === 'teacher' ? 'Admin' : 'Teacher'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
