import React, { useState } from 'react';
import { ClassItem, SbaHubOption, ClassType, Department } from '../types';
import { X, Plus, Edit3, Trash2, CheckSquare, BookOpen, Save, MapPin, Filter } from 'lucide-react';

interface ManageListOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classList: ClassItem[];
  onUpdateClassList: (classes: ClassItem[]) => void;
  sbaHubOptions: SbaHubOption[];
  onUpdateSbaHubOptions: (options: SbaHubOption[]) => void;
  classTypes?: ClassType[];
  departments?: Department[];
  locations?: any[];
  onSaveLocation?: (loc: any) => void;
  onDeleteLocation?: (id: string) => void;
  onUpdateDepartment?: (dept: Department) => void;
  onSaveClassType?: (ct: ClassType) => void;
  onDeleteClassType?: (id: string) => void;
}

export const ManageListOptionsModal: React.FC<ManageListOptionsModalProps> = ({
  isOpen,
  onClose,
  classList,
  onUpdateClassList,
  sbaHubOptions,
  onUpdateSbaHubOptions,
  classTypes = [
    { id: 'ct-csec', name: 'CSEC', code: 'CSEC' },
    { id: 'ct-cape', name: 'CAPE', code: 'CAPE' },
    { id: 'ct-primary', name: 'Primary', code: 'Primary' },
    { id: 'ct-lower-sec', name: 'Lower Secondary', code: 'Lower Secondary' },
  ],
  departments = [],
  locations = [],
  onSaveLocation,
  onDeleteLocation,
  onUpdateDepartment,
  onSaveClassType,
  onDeleteClassType,
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'sbaHub' | 'filters'>('classes');

  // Editing Class Item state
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassCategory, setNewClassCategory] = useState<ClassItem['category']>(departments[0]?.name || 'STEM & Robotics');
  const [newClassType, setNewClassType] = useState<string>('CSEC');
  const [newClassPrice, setNewClassPrice] = useState<number>(120);
  const [newClassInstructor, setNewClassInstructor] = useState('Staff Instructor');
  const [newClassSchedule, setNewClassSchedule] = useState('Mondays & Wednesdays 4:00 PM - 5:30 PM');
  const [newClassLocation, setNewClassLocation] = useState('STEM Lab A');
  const [newClassIsOffered, setNewClassIsOffered] = useState(true);

  // New SBA Option state
  const [editingSbaId, setEditingSbaId] = useState<string | null>(null);
  const [newSbaName, setNewSbaName] = useState('');
  const [newSbaClassType, setNewSbaClassType] = useState<string>(classTypes[0]?.code || 'CSEC');
  const [newSbaPrice, setNewSbaPrice] = useState<number>(150);
  const [newSbaIsOffered, setNewSbaIsOffered] = useState(true);

  if (!isOpen) return null;

  const handleAddOrUpdateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassTitle.trim()) return;

    if (editingClassId) {
      const updated = classList.map((c) =>
        c.id === editingClassId
          ? {
              ...c,
              title: newClassTitle.trim(),
              category: newClassCategory,
              classType: newClassType,
              price: Number(newClassPrice) || 120,
              instructor: newClassInstructor.trim() || 'Staff Instructor',
              schedule: newClassSchedule.trim() || 'Flexible Schedule',
              location: newClassLocation.trim() || 'STEM Lab A',
              isOffered: newClassIsOffered,
            }
          : c
      );
      onUpdateClassList(updated);
      setEditingClassId(null);
    } else {
      const newCls: ClassItem = {
        id: `cls-custom-${Date.now()}`,
        title: newClassTitle.trim(),
        category: newClassCategory,
        classType: newClassType,
        instructor: newClassInstructor.trim() || 'Staff Instructor',
        schedule: newClassSchedule.trim() || 'Flexible Schedule',
        ageGroup: 'Secondary / High School',
        price: Number(newClassPrice) || 120,
        capacity: 10,
        enrolled: 0,
        location: newClassLocation.trim() || 'STEM Lab A',
        description: `Course module for ${newClassTitle.trim()}`,
        isOffered: newClassIsOffered,
      };
      onUpdateClassList([...classList, newCls]);
    }

    setNewClassTitle('');
    setNewClassInstructor('Staff Instructor');
    setNewClassSchedule('Mondays & Wednesdays 4:00 PM - 5:30 PM');
    setNewClassLocation('STEM Lab A');
    setNewClassIsOffered(true);
  };

  const handleEditClassItem = (cls: ClassItem) => {
    setEditingClassId(cls.id);
    setNewClassTitle(cls.title);
    setNewClassCategory(cls.category);
    setNewClassType(cls.classType || (cls.title.toUpperCase().includes('CAPE') ? 'CAPE' : 'CSEC'));
    setNewClassPrice(cls.price);
    setNewClassInstructor(cls.instructor || 'Staff Instructor');
    setNewClassSchedule(cls.schedule || 'Flexible Schedule');
    setNewClassLocation(cls.location || 'STEM Lab A');
    setNewClassIsOffered(cls.isOffered !== false);
  };

  const cancelEditClassItem = () => {
    setEditingClassId(null);
    setNewClassTitle('');
    setNewClassInstructor('Staff Instructor');
    setNewClassSchedule('Mondays & Wednesdays 4:00 PM - 5:30 PM');
    setNewClassLocation('STEM Lab A');
    setNewClassIsOffered(true);
  };

  const handleDeleteClass = (id: string) => {
    onUpdateClassList(classList.filter((c) => c.id !== id));
  };

  const handleAddSbaOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSbaName.trim()) return;

    if (editingSbaId) {
      const updated = sbaHubOptions.map((opt) =>
        opt.id === editingSbaId
          ? {
              ...opt,
              name: newSbaName.trim(),
              classType: newSbaClassType,
              discountType: newSbaClassType,
              yearlyPrice: Number(newSbaPrice) || 150,
            }
          : opt
      );
      onUpdateSbaHubOptions(updated);
      setEditingSbaId(null);
    } else {
      const newOpt: SbaHubOption = {
        id: `sba-custom-${Date.now()}`,
        name: newSbaName.trim(),
        classType: newSbaClassType,
        discountType: newSbaClassType,
        yearlyPrice: Number(newSbaPrice) || 150,
      };
      onUpdateSbaHubOptions([...sbaHubOptions, newOpt]);
    }
    setNewSbaName('');
    setNewSbaClassType(classTypes[0]?.code || 'CSEC');
    setNewSbaPrice(150);
  };

  const handleEditSbaOption = (opt: SbaHubOption) => {
    setEditingSbaId(opt.id);
    setNewSbaName(opt.name);
    setNewSbaClassType(opt.classType || opt.discountType || opt.level || (classTypes[0]?.code || 'CSEC'));
    setNewSbaPrice(opt.yearlyPrice);
  };

  const cancelEditSbaOption = () => {
    setEditingSbaId(null);
    setNewSbaName('');
    setNewSbaClassType(classTypes[0]?.code || 'CSEC');
    setNewSbaPrice(150);
  };

  const handleDeleteSbaOption = (id: string) => {
    onUpdateSbaHubOptions(sbaHubOptions.filter((s) => s.id !== id));
    if (editingSbaId === id) {
      cancelEditSbaOption();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-400" />
              <span>Edit Form List Options</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Dynamically customize the list of Available Classes and SBA Hub aid options.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('classes')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'classes'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Available Classes ({classList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sbaHub')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'sbaHub'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Available SBA Hub Aid ({sbaHubOptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('filters')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'filters'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Filters Control</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'classes' ? (
            <div className="space-y-6">
              {/* Add / Edit Class Form */}
              <form onSubmit={handleAddOrUpdateClass} className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  {editingClassId ? <Edit3 className="w-4 h-4 text-purple-600" /> : <Plus className="w-4 h-4 text-purple-600" />}
                  {editingClassId ? 'Edit Existing Class Option' : 'Add New Class Subject'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="e.g. CAPE Unit 2 Physics or CSEC Biology"
                      value={newClassTitle}
                      onChange={(e) => setNewClassTitle(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <select
                      value={newClassCategory}
                      onChange={(e) => setNewClassCategory(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-semibold"
                    >
                      {departments.length > 0 ? (
                        departments.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="STEM & Robotics">STEM & Robotics</option>
                          <option value="Coding & AI">Coding & AI</option>
                          <option value="Arts & Design">Arts & Design</option>
                          <option value="Languages & Music">Languages & Music</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <select
                      value={newClassType}
                      onChange={(e) => setNewClassType(e.target.value)}
                      className="w-full px-3 py-1.5 border border-purple-300 font-bold text-purple-900 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      {classTypes.map((ct) => (
                        <option key={ct.id} value={ct.code || ct.name}>
                          {ct.name} ({ct.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Fee ($ USD):</span>
                    <input
                      type="number"
                      value={newClassPrice}
                      onChange={(e) => setNewClassPrice(Number(e.target.value))}
                      className="w-24 px-3 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      {editingClassId ? 'Save Changes' : 'Add Class Option'}
                    </button>
                    {editingClassId && (
                      <button
                        type="button"
                        onClick={cancelEditClassItem}
                        className="px-4 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {/* Class List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Classes List</h4>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {classList.map((cls) => (
                    <div
                      key={cls.id}
                      className={`p-3 bg-white border rounded-xl flex items-center justify-between gap-3 transition-all ${
                        editingClassId === cls.id ? 'border-purple-600 bg-purple-50/30 ring-2 ring-purple-500/20' : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{cls.title}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{cls.category}</span>
                          <span>•</span>
                          <span className="font-semibold text-purple-700">${cls.price} USD</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditClassItem(cls)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Click to Edit Properties"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Class Option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'sbaHub' ? (
            <div className="space-y-6">
              {/* Add New SBA Hub Form */}
              <form onSubmit={handleAddSbaOption} className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  {editingSbaId ? <Edit3 className="w-4 h-4 text-purple-600" /> : <Plus className="w-4 h-4 text-purple-600" />}
                  {editingSbaId ? 'Edit SBA Hub Subject Option' : 'Add New SBA Hub Subject Option'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="e.g. CAPE Unit 1 Computer Science"
                      value={newSbaName}
                      onChange={(e) => setNewSbaName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <select
                      value={newSbaClassType}
                      onChange={(e) => setNewSbaClassType(e.target.value)}
                      className="w-full px-3 py-1.5 border border-purple-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500 font-bold text-purple-900 focus:outline-hidden"
                    >
                      {classTypes.map((ct) => (
                        <option key={ct.id} value={ct.code || ct.name}>
                          {ct.name} ({ct.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Yearly Fee ($ USD):</span>
                    <input
                      type="number"
                      value={newSbaPrice}
                      onChange={(e) => setNewSbaPrice(Number(e.target.value))}
                      className="w-28 px-3 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    {editingSbaId ? 'Save Changes' : 'Add SBA Aid Option'}
                  </button>
                  {editingSbaId && (
                    <button
                      type="button"
                      onClick={cancelEditSbaOption}
                      className="px-4 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* SBA Hub List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current SBA Hub Aid Options</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {sbaHubOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 hover:border-purple-300 transition-all"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{opt.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold text-purple-700">{opt.classType || opt.discountType || opt.level || 'CSEC'}</span>
                          <span>•</span>
                          <span>${opt.yearlyPrice} / yr</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditSbaOption(opt)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                          title="Edit SBA Option"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSbaOption(opt.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Delete SBA Option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'filters' ? (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-blue-600" />
                  Edit Filters Displayed to Students
                </h4>
                <p className="text-xs text-slate-600">
                  Select which departments and class types are shown as options in the dropdown filters on the student class registration form.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-800 mb-2">Departments / Categories</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {departments.map(dept => (
                        <label key={dept.id} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={dept.isVisibleToStudents !== false} 
                            onChange={(e) => {
                              if (onUpdateDepartment) {
                                onUpdateDepartment({...dept, isVisibleToStudents: e.target.checked});
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-slate-700 truncate">{dept.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-slate-800 mb-2">Class Types</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {classTypes.map(ct => (
                        <label key={ct.id} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={ct.isVisibleToStudents !== false} 
                            onChange={(e) => {
                              if (onSaveClassType) {
                                onSaveClassType({...ct, isVisibleToStudents: e.target.checked});
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-slate-700 truncate">{ct.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Done Editing
          </button>
        </div>
      </div>
    </div>
  );
};
