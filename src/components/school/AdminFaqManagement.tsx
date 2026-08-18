import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Save, X, Settings, Folder } from 'lucide-react';
import { FaqItem, FaqCategory } from '../../types';
import { saveDocToFirestore, deleteDocFromFirestore, subscribeToCollection } from '../../lib/firebase';

interface AdminFaqManagementProps {
  faqs: FaqItem[];
}

export const AdminFaqManagement: React.FC<AdminFaqManagementProps> = ({ faqs = [] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Category Management State
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Form State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General Admissions');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load and sync FAQ categories from Firestore
  useEffect(() => {
    const unsub = subscribeToCollection<FaqCategory>('faqCategories', (items) => {
      if (items.length === 0) {
        const defaults = [
          { id: 'cat-1', name: 'General Admissions' },
          { id: 'cat-2', name: 'Tuition & Payments' },
          { id: 'cat-3', name: 'STEM Labs & Software' },
          { id: 'cat-4', name: 'Google Classroom' },
          { id: 'cat-5', name: 'Schedules & Transportation' }
        ];
        setCategories(defaults);
      } else {
        // Sort alphabetically
        setCategories([...items].sort((a, b) => a.name.localeCompare(b.name)));
      }
    });
    return unsub;
  }, []);

  // Update form's default category when categories list changes or initializes
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  const handleStartAdd = () => {
    setQuestion('');
    setAnswer('');
    setCategory('General Admissions');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (faq: FaqItem) => {
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category || 'General Admissions');
    setEditingId(faq.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setQuestion('');
    setAnswer('');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const exists = categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase());
    if (exists) {
      setMessage({ type: 'error', text: 'This category already exists.' });
      return;
    }
    const catId = `faqcat-${Date.now()}`;
    const ok = await saveDocToFirestore('faqCategories', catId, { id: catId, name: newCatName.trim() });
    if (ok) {
      setMessage({ type: 'success', text: `Category "${newCatName.trim()}" created successfully!` });
      setNewCatName('');
    } else {
      setMessage({ type: 'error', text: 'Failed to create category.' });
    }
  };

  const handleStartEditCat = (cat: FaqCategory) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleSaveCatEdit = async (catId: string) => {
    if (!editingCatName.trim()) return;
    const oldName = categories.find((c) => c.id === catId)?.name || '';
    if (oldName === editingCatName.trim()) {
      setEditingCatId(null);
      return;
    }

    const ok = await saveDocToFirestore('faqCategories', catId, { id: catId, name: editingCatName.trim() });
    if (ok) {
      // Find all FAQs with the old category name and update them
      const matching = faqs.filter((f) => f.category === oldName);
      for (const faq of matching) {
        await saveDocToFirestore('faqs', faq.id, { ...faq, category: editingCatName.trim() });
      }
      setMessage({ type: 'success', text: `Category updated to "${editingCatName.trim()}" and synced with associated FAQs!` });
      setEditingCatId(null);
    } else {
      setMessage({ type: 'error', text: 'Failed to update category.' });
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    if (!confirm(`Are you sure you want to delete the category "${cat.name}"?\nAssociated FAQs will be moved to the first remaining category.`)) return;

    const ok = await deleteDocFromFirestore('faqCategories', catId);
    if (ok) {
      const remaining = categories.filter((c) => c.id !== catId);
      const fallback = remaining[0]?.name || 'General Admissions';
      const matching = faqs.filter((f) => f.category === cat.name);
      for (const faq of matching) {
        await saveDocToFirestore('faqs', faq.id, { ...faq, category: fallback });
      }
      setMessage({ type: 'success', text: `Category "${cat.name}" deleted. Associated FAQs updated.` });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete category.' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setMessage({ type: 'error', text: 'Question and answer are required.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const faqId = editingId || `faq-${Date.now()}`;
    const faqData: FaqItem = {
      id: faqId,
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      order: editingId ? (faqs.find((f) => f.id === editingId)?.order || 1) : faqs.length + 1,
    };

    const res = await saveDocToFirestore('faqs', faqId, faqData);
    setSaving(false);

    if (res) {
      setMessage({ type: 'success', text: editingId ? 'FAQ updated successfully!' : 'New FAQ added successfully!' });
      setIsAdding(false);
      setEditingId(null);
      setQuestion('');
      setAnswer('');
    } else {
      setMessage({ type: 'error', text: 'Failed to save FAQ to Firebase. Please try again.' });
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    const ok = await deleteDocFromFirestore('faqs', faqId);
    if (ok) {
      setMessage({ type: 'success', text: 'FAQ deleted successfully.' });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete FAQ.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Public Website FAQ Management</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions ({faqs.length})</h2>
          <p className="text-xs text-slate-500 mt-1">
            Edit FAQs displayed on the Academy Home Page and Prospective Student Portal. All changes sync live to Firebase.
          </p>
        </div>

        {!isAdding && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManagingCategories(!isManagingCategories)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>{isManagingCategories ? 'Close Category Editor' : 'Manage FAQ Categories'}</span>
            </button>

            <button
              type="button"
              onClick={handleStartAdd}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New FAQ</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Manager Card */}
      {isManagingCategories && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-600" />
              <span>Manage FAQ Categories</span>
            </h3>
            <span className="text-xs text-slate-500">{categories.length} categories configured</span>
          </div>

          {/* Add New Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-2 max-w-md">
            <input
              type="text"
              required
              placeholder="New category name (e.g., Tech Support)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </form>

          {/* List of categories with edit/delete buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {categories.map((cat) => {
              const isEditingThis = editingCatId === cat.id;
              return (
                <div
                  key={cat.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                >
                  {isEditingThis ? (
                    <div className="flex items-center gap-1 w-full">
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-blue-500 rounded bg-white text-slate-900"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCatEdit(cat.id)}
                        className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        title="Save name"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-slate-700 truncate">{cat.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditCat(cat)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Rename Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FAQ Form Modal/Card */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-blue-400 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span>{editingId ? 'Edit FAQ Item' : 'Create New FAQ Item'}</span>
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Question *
              </label>
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. How do students access live Google Meet lab sessions?"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Answer *
              </label>
              <textarea
                required
                rows={3}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Provide a clear, detailed explanation for prospective parents and students..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving to Firebase...' : editingId ? 'Update FAQ' : 'Save FAQ'}</span>
            </button>
          </div>
        </form>
      )}

      {/* FAQs List */}
      {faqs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No FAQs Currently Published</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Add New FAQ" above to create live questions and answers for prospective students and parents.
          </p>
          <button
            onClick={handleStartAdd}
            className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First FAQ</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {faq.category || 'General'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(faq)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit FAQ"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{faq.question}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
