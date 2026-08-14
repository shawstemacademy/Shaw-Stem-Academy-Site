import React, { useState, useEffect, useRef } from 'react';
import { 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  LayoutGrid, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Pencil, 
  Check, 
  X, 
  RefreshCw,
  Info
} from 'lucide-react';
import { SectionOrderItem, DEFAULT_STUDENT_SECTION_ORDER, DEFAULT_TEACHER_SECTION_ORDER } from '../../types';

interface SectionOrderManagerProps {
  studentSections: SectionOrderItem[];
  teacherSections: SectionOrderItem[];
  onSave: (newStudentSections: SectionOrderItem[], newTeacherSections: SectionOrderItem[]) => Promise<boolean | void>;
  onResetToDefaults?: () => void;
  isLoading?: boolean;
}

const ensureCompleteStudentSections = (items: SectionOrderItem[]): SectionOrderItem[] => {
  const list = items && Array.isArray(items) && items.length > 0 ? [...items] : [...DEFAULT_STUDENT_SECTION_ORDER];
  DEFAULT_STUDENT_SECTION_ORDER.forEach((def) => {
    if (!list.some((item) => item.id === def.id)) {
      list.push({ ...def });
    }
  });
  return list;
};

const ensureCompleteTeacherSections = (items: SectionOrderItem[]): SectionOrderItem[] => {
  const list = items && Array.isArray(items) && items.length > 0 ? [...items] : [...DEFAULT_TEACHER_SECTION_ORDER];
  DEFAULT_TEACHER_SECTION_ORDER.forEach((def) => {
    if (!list.some((item) => item.id === def.id)) {
      list.push({ ...def });
    }
  });
  return list;
};

export const SectionOrderManager: React.FC<SectionOrderManagerProps> = ({
  studentSections,
  teacherSections,
  onSave,
  onResetToDefaults,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [studentList, setStudentList] = useState<SectionOrderItem[]>(() => ensureCompleteStudentSections(studentSections));
  const [teacherList, setTeacherList] = useState<SectionOrderItem[]>(() => ensureCompleteTeacherSections(teacherSections));
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Renaming state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Synchronize internal state when props change
  useEffect(() => {
    if (studentSections && studentSections.length > 0) {
      setStudentList(ensureCompleteStudentSections(studentSections));
    }
  }, [studentSections]);

  useEffect(() => {
    if (teacherSections && teacherSections.length > 0) {
      setTeacherList(ensureCompleteTeacherSections(teacherSections));
    }
  }, [teacherSections]);

  useEffect(() => {
    if (editingSectionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSectionId]);

  const currentList = activeTab === 'student' ? studentList : teacherList;

  // Immediate save helper to sync directly to Firebase on any change
  const persistChanges = async (
    updatedStudent: SectionOrderItem[],
    updatedTeacher: SectionOrderItem[]
  ) => {
    setIsSaving(true);
    try {
      await onSave(updatedStudent, updatedTeacher);
      setSaveSuccess(true);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Error auto-saving section layout:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...currentList];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, removed);

    setDraggedIndex(null);
    setDragOverIndex(null);

    if (activeTab === 'student') {
      setStudentList(updated);
      await persistChanges(updated, teacherList);
    } else {
      setTeacherList(updated);
      await persistChanges(studentList, updated);
    }
  };

  const moveUp = async (index: number) => {
    if (index <= 0) return;
    const updated = [...currentList];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;

    if (activeTab === 'student') {
      setStudentList(updated);
      await persistChanges(updated, teacherList);
    } else {
      setTeacherList(updated);
      await persistChanges(studentList, updated);
    }
  };

  const moveDown = async (index: number) => {
    if (index >= currentList.length - 1) return;
    const updated = [...currentList];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;

    if (activeTab === 'student') {
      setStudentList(updated);
      await persistChanges(updated, teacherList);
    } else {
      setTeacherList(updated);
      await persistChanges(studentList, updated);
    }
  };

  const toggleVisibility = async (index: number) => {
    const updated = [...currentList];
    updated[index] = {
      ...updated[index],
      enabled: updated[index].enabled === false ? true : false,
    };

    if (activeTab === 'student') {
      setStudentList(updated);
      await persistChanges(updated, teacherList);
    } else {
      setTeacherList(updated);
      await persistChanges(studentList, updated);
    }
  };

  // Section Renaming Handlers
  const startRenaming = (item: SectionOrderItem) => {
    setEditingSectionId(item.id);
    setEditingTitleText(item.title);
  };

  const cancelRenaming = () => {
    setEditingSectionId(null);
    setEditingTitleText('');
  };

  const saveRenaming = async (index: number) => {
    const trimmed = editingTitleText.trim();
    if (!trimmed) {
      cancelRenaming();
      return;
    }

    const updated = [...currentList];
    updated[index] = {
      ...updated[index],
      title: trimmed,
    };

    setEditingSectionId(null);
    setEditingTitleText('');

    if (activeTab === 'student') {
      setStudentList(updated);
      await persistChanges(updated, teacherList);
    } else {
      setTeacherList(updated);
      await persistChanges(studentList, updated);
    }
  };

  const handleSaveAll = async () => {
    await persistChanges(studentList, teacherList);
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset section orders and titles back to standard academy defaults? This will update Firebase immediately.')) {
      const resetStudents = [...DEFAULT_STUDENT_SECTION_ORDER];
      const resetTeachers = [...DEFAULT_TEACHER_SECTION_ORDER];
      setStudentList(resetStudents);
      setTeacherList(resetTeachers);
      await persistChanges(resetStudents, resetTeachers);
      if (onResetToDefaults) onResetToDefaults();
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Portal Section Order & Name Manager
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Drag and reorder or rename sections for the <strong>Student Portal</strong> and <strong>Teacher Dashboard</strong>. Changes are saved immediately to Firebase and reflect across user dashboards in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Real-time Status Badge */}
          {isSaving ? (
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Saving to Firebase...</span>
            </div>
          ) : saveSuccess ? (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Synced with Firebase</span>
            </div>
          ) : lastSyncTime ? (
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-500 text-[11px] font-medium rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Last synced: {lastSyncTime}</span>
            </div>
          ) : null}

          <button
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset section order and names to original defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Layout'}</span>
          </button>
        </div>
      </div>

      {/* Target Portal Switcher Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
        <button
          onClick={() => {
            setActiveTab('student');
            setEditingSectionId(null);
          }}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'student'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Student Portal Sections ({studentList.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('teacher');
            setEditingSectionId(null);
          }}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'teacher'
              ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>Teacher Dashboard Sections ({teacherList.length})</span>
        </button>
      </div>

      {/* Instruction Note */}
      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-900 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Drag and drop</strong> or use the <strong>Move Up / Down arrows</strong> to reorder. Click the <strong>Pencil icon</strong> to rename any section. Changes save immediately to Firebase!
          </span>
        </div>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
          Real-Time Sync Active
        </span>
      </div>

      {/* Drag & Drop Reorderable List */}
      <div className="space-y-3">
        {currentList.map((item, idx) => {
          const isDragging = draggedIndex === idx;
          const isDragOver = dragOverIndex === idx;
          const isDisabled = item.enabled === false;
          const isEditing = editingSectionId === item.id;

          return (
            <div
              key={item.id}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDragging
                  ? 'bg-blue-100 border-blue-400 opacity-50 scale-[0.98]'
                  : isDragOver
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300'
                  : isDisabled
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs'
              }`}
            >
              {/* Drag Handle, Index & Info */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div
                  className={`p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl shrink-0 ${
                    isEditing ? 'cursor-not-allowed opacity-30' : 'cursor-grab active:cursor-grabbing'
                  }`}
                  title={isEditing ? 'Finish renaming to drag' : 'Click and drag to reorder section'}
                >
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                  {idx + 1}
                </div>

                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2 max-w-lg">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingTitleText}
                        onChange={(e) => setEditingTitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveRenaming(idx);
                          } else if (e.key === 'Escape') {
                            cancelRenaming();
                          }
                        }}
                        placeholder="Enter section name..."
                        className="flex-1 px-3 py-1.5 text-xs font-bold text-slate-900 border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-blue-50/30"
                      />
                      <button
                        type="button"
                        onClick={() => saveRenaming(idx)}
                        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        title="Save new section title (Enter)"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelRenaming}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Cancel (Esc)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {item.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => startRenaming(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Rename section"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {isDisabled && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Adjustment & Visibility Controls */}
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => startRenaming(item)}
                    className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-1 border border-slate-200 hover:border-blue-200 cursor-pointer"
                    title="Rename section"
                  >
                    <Pencil className="w-3 h-3 text-blue-500" />
                    <span>Rename</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleVisibility(idx)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDisabled
                      ? 'text-slate-400 hover:bg-slate-200'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={isDisabled ? 'Show Section on Portal' : 'Hide Section from Portal'}
                >
                  {isDisabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0 || isEditing}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-all cursor-pointer"
                  title="Move Section Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === currentList.length - 1 || isEditing}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-all cursor-pointer"
                  title="Move Section Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Save Action Bar */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-slate-500 font-medium">
          💡 Any reordering, visibility toggle, or title renaming automatically syncs to Firebase immediately.
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAll}
            disabled={isSaving || isLoading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Layout Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
