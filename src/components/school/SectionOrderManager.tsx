import React, { useState, useEffect } from 'react';
import { GripVertical, ArrowUp, ArrowDown, Save, RotateCcw, CheckCircle2, ShieldCheck, LayoutGrid, Eye, EyeOff, Sparkles } from 'lucide-react';
import { SectionOrderItem, DEFAULT_STUDENT_SECTION_ORDER, DEFAULT_TEACHER_SECTION_ORDER } from '../../types';

interface SectionOrderManagerProps {
  studentSections: SectionOrderItem[];
  teacherSections: SectionOrderItem[];
  onSave: (newStudentSections: SectionOrderItem[], newTeacherSections: SectionOrderItem[]) => Promise<boolean | void>;
  onResetToDefaults?: () => void;
  isLoading?: boolean;
}

export const SectionOrderManager: React.FC<SectionOrderManagerProps> = ({
  studentSections,
  teacherSections,
  onSave,
  onResetToDefaults,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [studentList, setStudentList] = useState<SectionOrderItem[]>(studentSections);
  const [teacherList, setTeacherList] = useState<SectionOrderItem[]>(teacherSections);
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize internal state when props change
  useEffect(() => {
    if (studentSections && studentSections.length > 0) {
      setStudentList(studentSections);
    }
  }, [studentSections]);

  useEffect(() => {
    if (teacherSections && teacherSections.length > 0) {
      setTeacherList(teacherSections);
    }
  }, [teacherSections]);

  const currentList = activeTab === 'student' ? studentList : teacherList;
  const setCurrentList = (newList: SectionOrderItem[]) => {
    if (activeTab === 'student') {
      setStudentList(newList);
    } else {
      setTeacherList(newList);
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

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...currentList];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, removed);

    setCurrentList(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...currentList];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setCurrentList(updated);
  };

  const moveDown = (index: number) => {
    if (index >= currentList.length - 1) return;
    const updated = [...currentList];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setCurrentList(updated);
  };

  const toggleVisibility = (index: number) => {
    const updated = [...currentList];
    updated[index] = {
      ...updated[index],
      enabled: updated[index].enabled === false ? true : false,
    };
    setCurrentList(updated);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSave(studentList, teacherList);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving section layout:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset section orders back to standard academy defaults?')) {
      setStudentList([...DEFAULT_STUDENT_SECTION_ORDER]);
      setTeacherList([...DEFAULT_TEACHER_SECTION_ORDER]);
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
              Portal Section Drag & Drop Customizer
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Drag and reorder sections for Student Portal & Teacher Dashboard. Changes saved here immediately synchronize to all users across Firebase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving || isLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Firebase...' : 'Save Layout Changes'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Success!</strong> Section ordering updated and saved to Firebase. All active student portals and teacher dashboards reflect these changes immediately.
          </span>
        </div>
      )}

      {/* Target Selector Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('student')}
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
          onClick={() => setActiveTab('teacher')}
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
      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-900 flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Drag handle</strong> or use the <strong>Move Up / Down arrows</strong> to reorder sections. The top-most section will appear first on user screens after saving.
        </span>
      </div>

      {/* Drag & Drop Reorderable List */}
      <div className="space-y-3">
        {currentList.map((item, idx) => {
          const isDragging = draggedIndex === idx;
          const isDragOver = dragOverIndex === idx;
          const isDisabled = item.enabled === false;

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 select-none ${
                isDragging
                  ? 'bg-blue-100 border-blue-400 opacity-50 scale-[0.98]'
                  : isDragOver
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300'
                  : isDisabled
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs'
              }`}
            >
              {/* Drag Handle & Info */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-grab active:cursor-grabbing shrink-0"
                  title="Click and drag to reorder section"
                >
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                  {idx + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">
                      {item.title}
                    </h4>
                    {isDisabled && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{item.description}</p>
                </div>
              </div>

              {/* Order Adjustment Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleVisibility(idx)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all ${
                    isDisabled
                      ? 'text-slate-400 hover:bg-slate-200'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={isDisabled ? 'Show Section' : 'Hide Section'}
                >
                  {isDisabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-all cursor-pointer"
                  title="Move Section Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === currentList.length - 1}
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
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
        <span className="text-xs text-slate-500 font-medium">
          Note: Changes take effect on user portals after clicking <strong>Save Layout Changes</strong>.
        </span>

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
  );
};
