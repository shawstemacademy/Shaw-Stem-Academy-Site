import React, { useState, useEffect } from 'react';
import { Newspaper, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Save, X, Building2, Calendar, Image as ImageIcon, Settings, Folder, Download } from 'lucide-react';
import { SchoolNewsItem, Department, SchoolUser, UserRole, NewsCategory } from '../../types';
import { saveDocToFirestore, deleteDocFromFirestore, subscribeToCollection } from '../../lib/firebase';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { FormattedText } from '../common/FormattedText';
import { downloadImage } from '../../lib/downloadHelper';

interface AdminNewsManagementProps {
  news: SchoolNewsItem[];
  departments: Department[];
  loggedInUser?: SchoolUser | null;
  currentRole?: UserRole;
  logoUrl?: string;
}

export const AdminNewsManagement: React.FC<AdminNewsManagementProps> = ({
  news = [],
  departments = [],
  loggedInUser,
  currentRole = 'admin',
  logoUrl,
}) => {
  const effectiveRole = loggedInUser?.role || currentRole;
  const isAuthorized = effectiveRole === 'admin' || effectiveRole === 'hod';
  const isHOD = effectiveRole === 'hod';
  const userDeptId = loggedInUser?.departmentId;
  const userDeptName = loggedInUser?.departmentName || loggedInUser?.department;

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Category Management State
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<string>('STEM Lab');
  const [author, setAuthor] = useState(loggedInUser?.name || 'Academy Editorial Staff');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(isHOD && userDeptId ? userDeptId : 'all');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscribe/sync News Categories
  useEffect(() => {
    const unsub = subscribeToCollection<NewsCategory>('newsCategories', (items) => {
      if (items.length === 0) {
        const defaults = [
          { id: 'ncat-1', name: 'STEM Lab' },
          { id: 'ncat-2', name: 'Robotics Competition' },
          { id: 'ncat-3', name: 'Academic Calendar' },
          { id: 'ncat-4', name: 'Admissions' },
          { id: 'ncat-5', name: 'Department Announcement' },
          { id: 'ncat-6', name: 'General' }
        ];
        setCategories(defaults);
      } else {
        setCategories([...items].sort((a, b) => a.name.localeCompare(b.name)));
      }
    });
    return unsub;
  }, []);

  // Update default category when categories list changes
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  // Sync logged in user name to author state
  useEffect(() => {
    if (loggedInUser?.name) {
      setAuthor(loggedInUser.name);
    }
  }, [loggedInUser]);

  // News category management actions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const exists = categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase());
    if (exists) {
      setMessage({ type: 'error', text: 'This category already exists.' });
      return;
    }
    const catId = `newscat-${Date.now()}`;
    const ok = await saveDocToFirestore('newsCategories', catId, { id: catId, name: newCatName.trim() });
    if (ok) {
      setMessage({ type: 'success', text: `News category "${newCatName.trim()}" added successfully!` });
      setNewCatName('');
    } else {
      setMessage({ type: 'error', text: 'Failed to add category.' });
    }
  };

  const handleStartEditCat = (cat: NewsCategory) => {
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

    const ok = await saveDocToFirestore('newsCategories', catId, { id: catId, name: editingCatName.trim() });
    if (ok) {
      // Update matching articles
      const matching = news.filter((item) => item.category === oldName);
      for (const item of matching) {
        await saveDocToFirestore('schoolNews', item.id, { ...item, category: editingCatName.trim() });
      }
      setMessage({ type: 'success', text: `Category updated to "${editingCatName.trim()}" and synced with associated articles!` });
      setEditingCatId(null);
    } else {
      setMessage({ type: 'error', text: 'Failed to update category.' });
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    if (!confirm(`Are you sure you want to delete the category "${cat.name}"?\nAssociated news articles will be updated to the first remaining category.`)) return;

    const ok = await deleteDocFromFirestore('newsCategories', catId);
    if (ok) {
      const remaining = categories.filter((c) => c.id !== catId);
      const fallback = remaining[0]?.name || 'General';
      const matching = news.filter((item) => item.category === cat.name);
      for (const item of matching) {
        await saveDocToFirestore('schoolNews', item.id, { ...item, category: fallback });
      }
      setMessage({ type: 'success', text: `Category "${cat.name}" deleted. Associated news articles updated.` });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete category.' });
    }
  };

  // Filtered news for display based on role
  const displayNews = isHOD && userDeptId
    ? news.filter((item) => !item.departmentId || item.departmentId === userDeptId || item.departmentId === 'all')
    : news;

  const handleStartAdd = () => {
    setTitle('');
    setSummary('');
    if (categories.length > 0) {
      setCategory(categories[0].name);
    } else {
      setCategory('General');
    }
    setAuthor(loggedInUser?.name || 'Academy Editorial Staff');
    setImageUrl('');
    setSelectedDeptId(isHOD && userDeptId ? userDeptId : 'all');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (item: SchoolNewsItem) => {
    setTitle(item.title);
    setSummary(item.summary);
    setCategory(item.category);
    setAuthor(item.author || loggedInUser?.name || 'Academy Staff');
    setImageUrl(item.imageUrl || '');
    setSelectedDeptId(item.departmentId || 'all');
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle('');
    setSummary('');
    setImageUrl('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      setMessage({ type: 'error', text: 'Title and summary/content are required.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const newsId = editingId || `news-${Date.now()}`;
    const deptObj = departments.find((d) => d.id === selectedDeptId);

    const newsData: SchoolNewsItem = {
      id: newsId,
      title: title.trim(),
      summary: summary.trim(),
      category,
      author: loggedInUser?.name || author || 'Academy Editorial Staff',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      imageUrl: imageUrl.trim() || logoUrl || undefined,
      departmentId: selectedDeptId === 'all' ? undefined : selectedDeptId,
      departmentName: deptObj ? deptObj.name : undefined,
    };

    const res = await saveDocToFirestore('schoolNews', newsId, newsData);
    setSaving(false);

    if (res) {
      // Send FCM push notification to all registered devices using the modern FCM framework
      if (!editingId) {
        try {
          const { sendPushNotificationToAll } = await import('../../lib/fcm');
          await sendPushNotificationToAll(
            `📰 News Update: ${newsData.title}`,
            newsData.summary || `A new update has been posted in ${newsData.category}.`
          );
        } catch (err) {
          console.warn('Failed to send FCM news notification:', err);
        }
      }

      setMessage({
        type: 'success',
        text: editingId ? 'News article updated successfully!' : 'New news article published successfully!',
      });
      setIsAdding(false);
      setEditingId(null);
      setTitle('');
      setSummary('');
      setImageUrl('');
    } else {
      setMessage({ type: 'error', text: 'Failed to publish news article to Firebase.' });
    }
  };

  const handleDelete = async (newsId: string) => {
    if (!confirm('Are you sure you want to delete this news article?')) return;
    const ok = await deleteDocFromFirestore('schoolNews', newsId);
    if (ok) {
      setMessage({ type: 'success', text: 'News article deleted successfully.' });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete news article.' });
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Academy News & Press Center</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isHOD ? `${userDeptName || 'Department'} News Editor` : 'Academy News & Press Center'} ({displayNews.length})
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isHOD
              ? 'As a Head of Department, you can create and publish news updates for your department and the general academy.'
              : 'School Administrators and Department Heads manage press releases, lab highlights, and competition news.'}
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
              <span>{isManagingCategories ? 'Close Category Editor' : 'Manage News Categories'}</span>
            </button>

            <button
              type="button"
              onClick={handleStartAdd}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish News Article</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Manager Card */}
      {isManagingCategories && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Folder className="w-4 h-4 text-purple-600" />
              <span>Manage News Categories</span>
            </h3>
            <span className="text-xs text-slate-500">{categories.length} categories configured</span>
          </div>

          {/* Add New Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-2 max-w-md">
            <input
              type="text"
              required
              placeholder="New category name (e.g., Alumni Spotlight)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
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
                        className="flex-1 px-2 py-1 text-xs border border-purple-500 rounded bg-white text-slate-900"
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
                          className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
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

      {/* News Form Modal/Card */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-purple-400 flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              <span>{editingId ? 'Edit News Article' : 'Publish New News Article'}</span>
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
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Article Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Robotics Team Wins Regional STEM Grand Prix"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                News Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Author Name (Logged-in User)
              </label>
              <input
                type="text"
                disabled
                value={loggedInUser?.name || 'Academy Editorial Staff'}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-400 cursor-not-allowed opacity-85"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Target Department Scope
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                disabled={isHOD && !!userDeptId}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
              >
                <option value="all">General Academy (All Departments)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <ImageUploadInput
                label="Article Header Picture / Photo"
                description="Upload a photo for this news article directly from your device or paste an image URL."
                value={imageUrl}
                onChange={(newImg) => setImageUrl(newImg)}
                placeholder="Upload news photo from device or enter URL..."
                aspectRatio="wide"
                darkBg={true}
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">
                  Article Summary & Details *
                </label>
                <span className="text-[11px] text-purple-400">
                  Preserves typed formatting, paragraphs, lists & links
                </span>
              </div>
              <textarea
                required
                rows={5}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write the article details, announcements, bullet points, or release notes. Typed line breaks and paragraph spacing are preserved..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 whitespace-pre-wrap font-sans"
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
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publishing to Firebase...' : editingId ? 'Update Article' : 'Publish Article'}</span>
            </button>
          </div>
        </form>
      )}

      {/* News List */}
      {displayNews.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <Newspaper className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No News Articles Published Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Publish News Article" above to create live news and press releases for the website home page.
          </p>
          <button
            onClick={handleStartAdd}
            className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish First News Article</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayNews.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between group"
            >
              {(item.imageUrl || logoUrl) && (
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img src={item.imageUrl || logoUrl} alt={item.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => downloadImage(item.imageUrl || logoUrl || '', `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`)}
                      className="px-2 py-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      title="Download image"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                  </div>

                  {item.departmentName && (
                    <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-purple-600" />
                      <span>{item.departmentName}</span>
                    </div>
                  )}

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.title}</h3>
                  <div className="text-xs text-slate-600">
                    <FormattedText text={item.summary} lineClamp={3} />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">By {item.author}</span>
                  <div className="flex items-center gap-1">
                    {(item.imageUrl || logoUrl) && (
                      <button
                        type="button"
                        onClick={() => downloadImage(item.imageUrl || logoUrl || '', `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                        title="Download Article Image"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 cursor-pointer"
                      title="Edit Article"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
