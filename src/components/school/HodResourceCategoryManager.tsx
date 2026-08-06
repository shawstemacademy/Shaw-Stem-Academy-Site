import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X, FolderKanban, Info } from 'lucide-react';
import { ResourceCategory, SchoolUser, UserRole } from '../../types';
import { saveDocToFirestore, deleteDocFromFirestore } from '../../lib/firebase';

interface HodResourceCategoryManagerProps {
  categories: ResourceCategory[];
  loggedInUser?: SchoolUser | null;
  currentRole?: UserRole;
}

export const HodResourceCategoryManager: React.FC<HodResourceCategoryManagerProps> = ({
  categories = [],
  loggedInUser,
  currentRole = 'hod',
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isHODOrAdmin = currentRole === 'hod' || currentRole === 'admin' || loggedInUser?.role === 'hod' || loggedInUser?.role === 'admin';

  if (!isHODOrAdmin) {
    return null;
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const id = `rc-${Date.now()}`;
    const newCat: ResourceCategory = {
      id,
      name: newCatName.trim(),
      description: newCatDesc.trim() || 'Managed by Head of Department',
      createdBy: loggedInUser?.name || 'HOD / Admin',
      departmentId: loggedInUser?.departmentId || 'dept-general',
    };

    await saveDocToFirestore('resourceCategories', id, newCat);
    setNewCatName('');
    setNewCatDesc('');
    setIsAdding(false);
    setStatusMsg(`Category "${newCat.name}" added and synced with Firestore!`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleStartEdit = (cat: ResourceCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const updated: ResourceCategory = {
      id,
      name: editName.trim(),
      description: editDesc.trim(),
      createdBy: loggedInUser?.name || 'HOD / Admin',
    };
    await saveDocToFirestore('resourceCategories', id, updated);
    setEditingId(null);
    setStatusMsg(`Category updated!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the category "${name}"?`)) {
      await deleteDocFromFirestore('resourceCategories', id);
      setStatusMsg(`Category "${name}" removed from Firestore.`);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>HOD & Admin Portal Controls</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Learning Resource Categories Manager</h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Heads of Department (HODs) and Administrators can maintain resource category tags stored in Firestore. Students will see these categories as horizontal filter choices in their Learning Portal.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Resource Category</span>
          </button>
        )}
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fade-in">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Add New Category Form */}
      {isAdding && (
        <form onSubmit={handleAddCategory} className="p-5 bg-slate-50 rounded-2xl border border-indigo-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Create New Resource Category</h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category Title *</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. SBA Guidelines, Circuit Diagrams"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Brief description of materials in this category"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Save Category to Firestore
            </button>
          </div>
        </form>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const isEditing = editingId === cat.id;

          if (isEditing) {
            return (
              <div key={cat.id} className="p-4 bg-indigo-50/50 border border-indigo-300 rounded-2xl space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-indigo-300 bg-white"
                />
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-200 bg-white"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSaveEdit(cat.id)}
                    className="p-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={cat.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-3 hover:border-indigo-300 transition-colors"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-900 text-xs">{cat.name}</span>
                </div>
                {cat.description && (
                  <p className="text-[11px] text-slate-500 leading-snug">{cat.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleStartEdit(cat)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit Category Name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
