import React, { useState } from 'react';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  MapPin, 
  Award, 
  X, 
  UserPlus, 
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { Department, SchoolUser } from '../../types';

interface AdminDepartmentManagementProps {
  departments: Department[];
  users: SchoolUser[];
  onAddDepartment: (dept: Department) => void;
  onUpdateDepartment: (dept: Department) => void;
  onDeleteDepartment: (deptId: string) => void;
  onAssignUserToDepartment: (userId: string, deptId: string) => void;
  logoUrl?: string;
}

const COLOR_OPTIONS = [
  { label: 'Blue', value: 'bg-blue-600', border: 'border-blue-500', text: 'text-blue-600' },
  { label: 'Purple', value: 'bg-purple-600', border: 'border-purple-500', text: 'text-purple-600' },
  { label: 'Pink', value: 'bg-pink-600', border: 'border-pink-500', text: 'text-pink-600' },
  { label: 'Amber', value: 'bg-amber-600', border: 'border-amber-500', text: 'text-amber-600' },
  { label: 'Emerald', value: 'bg-emerald-600', border: 'border-emerald-500', text: 'text-emerald-600' },
  { label: 'Indigo', value: 'bg-indigo-600', border: 'border-indigo-500', text: 'text-indigo-600' },
  { label: 'Cyan', value: 'bg-cyan-600', border: 'border-cyan-500', text: 'text-cyan-600' },
  { label: 'Rose', value: 'bg-rose-600', border: 'border-rose-500', text: 'text-rose-600' },
];

export const AdminDepartmentManagement: React.FC<AdminDepartmentManagementProps> = ({
  departments,
  users,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onAssignUserToDepartment,
  logoUrl,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [headOfDepartment, setHeadOfDepartment] = useState('');
  const [color, setColor] = useState('bg-blue-600');
  const [room, setRoom] = useState('');
  const [defaultPicture, setDefaultPicture] = useState('');

  // Quick Assign Staff modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDeptForAssign, setSelectedDeptForAssign] = useState<Department | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const openAddModal = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setHeadOfDepartment(users[0]?.name || '');
    setColor('bg-blue-600');
    setRoom('');
    setDefaultPicture(logoUrl || 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80');
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description);
    setHeadOfDepartment(dept.headOfDepartment);
    setColor(dept.color);
    setRoom(dept.room || '');
    setDefaultPicture(dept.defaultPicture || '');
    setIsModalOpen(true);
  };

  const openAssignModal = (dept: Department) => {
    setSelectedDeptForAssign(dept);
    const staffMembers = users.filter((u) => u.role !== 'student');
    setSelectedUserId(staffMembers[0]?.id || '');
    setIsAssignModalOpen(true);
  };

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Please fill out Department Name and Code.');
      return;
    }

    if (editingDept) {
      onUpdateDepartment({
        ...editingDept,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        headOfDepartment: headOfDepartment.trim(),
        color,
        room: room.trim(),
        defaultPicture: defaultPicture.trim() || logoUrl || '',
      });
    } else {
      const newDept: Department = {
        id: `dept-${Date.now()}`,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        headOfDepartment: headOfDepartment.trim() || 'Vacant',
        color,
        room: room.trim(),
        defaultPicture: defaultPicture.trim() || logoUrl || '',
      };
      onAddDepartment(newDept);
    }

    setIsModalOpen(false);
  };

  const handleQuickAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptForAssign || !selectedUserId) return;
    onAssignUserToDepartment(selectedUserId, selectedDeptForAssign.id);
    setIsAssignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            <span>Academic Department Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Organize STEM, Coding, Arts, Music, and Administration departments. Assign department heads and add teachers.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Create Department</span>
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const deptMembers = users.filter((u) => u.departmentId === dept.id);
          const teachers = deptMembers.filter((u) => u.role === 'teacher');
          const admins = deptMembers.filter((u) => u.role === 'admin');

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Department Header Banner */}
                <div className={`p-5 ${dept.color} text-white flex items-center justify-between`}>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
                      {dept.code}
                    </span>
                    <h3 className="text-lg font-bold mt-1">{dept.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(dept)}
                      className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit Department"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          deptMembers.length > 0 &&
                          !confirm(
                            `There are ${deptMembers.length} staff members assigned to ${dept.name}. Are you sure you want to delete this department?`
                          )
                        ) {
                          return;
                        }
                        onDeleteDepartment(dept.id);
                      }}
                      className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">
                    {dept.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-purple-600" />
                        Dept. Head:
                      </span>
                      <span className="font-bold text-slate-900">
                        {users.find((u) => u.id === dept.headOfDepartment)?.name || dept.headOfDepartment || 'Vacant'}
                      </span>
                    </div>

                    {dept.room && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          Location:
                        </span>
                        <span className="font-semibold text-slate-800">{dept.room}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        Total Staff:
                      </span>
                      <span className="font-bold text-slate-900">
                        {deptMembers.length} ({teachers.length} Teachers, {admins.length} Admins)
                      </span>
                    </div>
                  </div>

                  {/* Staff Member Avatars & Names */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Assigned Members
                    </div>
                    {deptMembers.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No staff members currently assigned</div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {deptMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-6 h-6 rounded-lg object-cover"
                              />
                              <span className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                                {member.name}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                member.role === 'teacher'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {member.role === 'teacher' ? 'Teacher' : 'Admin'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Quick Assign */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => openAssignModal(dept)}
                  className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-purple-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign Staff to {dept.code}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingDept ? 'Edit Academic Department' : 'Create New Department'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure department code, room location, color badge, and department chair.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. STEM & Robotics"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. STEM"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Summary of academic scope and lab courses..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Head of Department / Chair
                    </label>
                    <select
                      value={headOfDepartment}
                      onChange={(e) => setHeadOfDepartment(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    >
                      <option value="">-- Select HOD / Chair --</option>
                      {users.filter((u) => u.role === 'teacher' || u.role === 'hod').map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.title || u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Room / Lab Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lab A & Innovation Center"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <ImageUploadInput
                  label="Department Cover Picture / Photo"
                  description="Upload a photo from your device or paste a URL for this department's lab header image."
                  value={defaultPicture}
                  onChange={(newPic) => setDefaultPicture(newPic)}
                  placeholder="Upload department photo from device or enter URL..."
                  aspectRatio="wide"
                />

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Theme Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                          color === c.value
                            ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-50/50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${c.value}`} />
                        <span className="text-slate-800">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  {editingDept ? 'Save Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Assign Staff Modal */}
      {isAssignModalOpen && selectedDeptForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Assign Staff to {selectedDeptForAssign.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Select a teacher or administrator to assign to this department.
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Staff Member *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                >
                  {users
                    .filter((u) => u.role !== 'student')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()}) {u.departmentName ? `- currently in ${u.departmentName}` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
