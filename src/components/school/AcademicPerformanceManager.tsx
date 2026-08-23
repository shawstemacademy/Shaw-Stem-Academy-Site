import React, { useState, useMemo } from 'react';
import { 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Calendar, 
  BarChart3, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  BookOpen,
  Filter,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { AcademicPerformanceRecord, ClassItem, SchoolUser } from '../../types';
import { savePassRateToFirestore, deletePassRateFromFirestore } from '../../lib/firebase';
import { ConfirmationModal } from '../ConfirmationModal';

interface AcademicPerformanceManagerProps {
  passRates: AcademicPerformanceRecord[];
  onUpdatePassRates?: (records: AcademicPerformanceRecord[]) => void;
  classList?: ClassItem[];
  currentUser: SchoolUser | null;
  theme?: any;
}

const ACADEMIC_YEARS = ['2021', '2022', '2023', '2024', '2025', '2026', '2027'];
const SUBJECT_CATEGORIES = [
  'All Categories',
  'CSEC (Secondary)',
  'CAPE (Advanced)',
  'Lower Secondary',
  'STEM & Robotics',
  'Computer Science',
  'Sciences',
  'Mathematics',
  'Languages & Arts',
  'General Education'
];

export const AcademicPerformanceManager: React.FC<AcademicPerformanceManagerProps> = ({
  passRates = [],
  onUpdatePassRates,
  classList = [],
  currentUser,
  theme,
}) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'records' | 'trends'>('matrix');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AcademicPerformanceRecord | null>(null);

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    recordId: string;
    subjectName: string;
    year: string;
  }>({ isOpen: false, recordId: '', subjectName: '', year: '' });

  // Form States
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectId: '',
    courseCode: '',
    category: 'CSEC (Secondary)',
    academicYear: '2025',
    studentsExamined: '',
    studentsPassed: '',
    passRatePercentage: '',
    notes: '',
  });

  // Unique Subjects across records & classes
  const availableSubjectNames = useMemo(() => {
    const set = new Set<string>();
    classList.forEach((c) => {
      if (c.title) set.add(c.title);
    });
    passRates.forEach((pr) => {
      if (pr.subjectName) set.add(pr.subjectName);
    });
    return Array.from(set).sort();
  }, [classList, passRates]);

  // Open modal for Create or Edit
  const handleOpenModal = (record?: AcademicPerformanceRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        subjectName: record.subjectName || '',
        subjectId: record.subjectId || '',
        courseCode: record.courseCode || '',
        category: record.category || 'CSEC (Secondary)',
        academicYear: record.academicYear || '2025',
        studentsExamined: record.studentsExamined !== undefined ? String(record.studentsExamined) : '',
        studentsPassed: record.studentsPassed !== undefined ? String(record.studentsPassed) : '',
        passRatePercentage: record.passRatePercentage !== undefined ? String(record.passRatePercentage) : '',
        notes: record.notes || '',
      });
    } else {
      setEditingRecord(null);
      const defaultSub = availableSubjectNames[0] || 'Mathematics';
      setFormData({
        subjectName: defaultSub,
        subjectId: '',
        courseCode: '',
        category: 'CSEC (Secondary)',
        academicYear: '2025',
        studentsExamined: '',
        studentsPassed: '',
        passRatePercentage: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  // Auto-calculate pass rate % when examined and passed change
  const handleExaminedChange = (val: string) => {
    setFormData((prev) => {
      const examinedNum = parseFloat(val);
      const passedNum = parseFloat(prev.studentsPassed);
      let calculatedRate = prev.passRatePercentage;
      if (!isNaN(examinedNum) && !isNaN(passedNum) && examinedNum > 0) {
        calculatedRate = Math.min(100, Math.max(0, (passedNum / examinedNum) * 100)).toFixed(1);
      }
      return { ...prev, studentsExamined: val, passRatePercentage: calculatedRate };
    });
  };

  const handlePassedChange = (val: string) => {
    setFormData((prev) => {
      const examinedNum = parseFloat(prev.studentsExamined);
      const passedNum = parseFloat(val);
      let calculatedRate = prev.passRatePercentage;
      if (!isNaN(examinedNum) && !isNaN(passedNum) && examinedNum > 0) {
        calculatedRate = Math.min(100, Math.max(0, (passedNum / examinedNum) * 100)).toFixed(1);
      }
      return { ...prev, studentsPassed: val, passRatePercentage: calculatedRate };
    });
  };

  // Save Record Handler
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectName.trim()) {
      alert('Please enter or select a Subject Name.');
      return;
    }
    if (!formData.academicYear) {
      alert('Please select an Academic Year.');
      return;
    }

    const rateNum = parseFloat(formData.passRatePercentage);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      alert('Please enter a valid Pass Rate Percentage between 0% and 100%.');
      return;
    }

    const examinedNum = formData.studentsExamined ? parseInt(formData.studentsExamined, 10) : undefined;
    const passedNum = formData.studentsPassed ? parseInt(formData.studentsPassed, 10) : undefined;

    if (examinedNum !== undefined && passedNum !== undefined && passedNum > examinedNum) {
      alert('Students Passed cannot be greater than Students Examined.');
      return;
    }

    const newRecord: AcademicPerformanceRecord = {
      id: editingRecord ? editingRecord.id : `PR-${Date.now()}`,
      subjectId: formData.subjectId || `SUB-${formData.subjectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      subjectName: formData.subjectName.trim(),
      courseCode: formData.courseCode.trim() || undefined,
      category: formData.category || 'General',
      academicYear: formData.academicYear,
      passRatePercentage: parseFloat(rateNum.toFixed(1)),
      studentsExamined: examinedNum,
      studentsPassed: passedNum,
      notes: formData.notes.trim() || undefined,
      enteredBy: currentUser?.id || 'admin',
      enteredByName: currentUser?.name || 'Academic Officer',
      createdAt: editingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await savePassRateToFirestore(newRecord);
      if (onUpdatePassRates) {
        if (editingRecord) {
          onUpdatePassRates(passRates.map((r) => (r.id === editingRecord.id ? newRecord : r)));
        } else {
          onUpdatePassRates([newRecord, ...passRates]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving pass rate record:', err);
      alert('Failed to save pass rate record. Please check permissions.');
    }
  };

  // Delete Record Handler
  const handleDeleteRecord = async () => {
    if (!deleteConfirm.recordId) return;
    try {
      await deletePassRateFromFirestore(deleteConfirm.recordId);
      if (onUpdatePassRates) {
        onUpdatePassRates(passRates.filter((r) => r.id !== deleteConfirm.recordId));
      }
      setDeleteConfirm({ isOpen: false, recordId: '', subjectName: '', year: '' });
    } catch (err) {
      console.error('Error deleting pass rate record:', err);
      alert('Failed to delete pass rate record.');
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return passRates.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (r.subjectName || '').toLowerCase().includes(q) ||
        (r.courseCode || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.notes || '').toLowerCase().includes(q);

      const matchCategory =
        selectedCategory === 'All Categories' || r.category === selectedCategory;

      const matchYear =
        selectedYearFilter === 'all' || r.academicYear === selectedYearFilter;

      return matchSearch && matchCategory && matchYear;
    });
  }, [passRates, searchQuery, selectedCategory, selectedYearFilter]);

  // Multi-Year Comparison Matrix calculation
  // Distinct subjects in dataset
  const matrixData = useMemo(() => {
    const subjectsMap = new Map<string, {
      subjectName: string;
      category: string;
      courseCode?: string;
      years: Record<string, { passRate: number; examined?: number; passed?: number; recordId: string }>;
    }>();

    passRates.forEach((rec) => {
      const key = rec.subjectName;
      if (!subjectsMap.has(key)) {
        subjectsMap.set(key, {
          subjectName: rec.subjectName,
          category: rec.category || 'General',
          courseCode: rec.courseCode,
          years: {},
        });
      }
      const item = subjectsMap.get(key)!;
      item.years[rec.academicYear] = {
        passRate: rec.passRatePercentage,
        examined: rec.studentsExamined,
        passed: rec.studentsPassed,
        recordId: rec.id,
      };
    });

    let list = Array.from(subjectsMap.values());

    // Apply category & search filter to matrix
    if (selectedCategory !== 'All Categories') {
      list = list.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.subjectName.toLowerCase().includes(q) ||
          (item.courseCode || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }, [passRates, selectedCategory, searchQuery]);

  // Overall Statistics KPIs
  const stats = useMemo(() => {
    if (passRates.length === 0) {
      return {
        totalRecords: 0,
        averagePassRate: 0,
        totalExamined: 0,
        totalPassed: 0,
        topSubject: 'N/A',
        topRate: 0,
        needsImprovementCount: 0,
      };
    }

    const total = passRates.reduce((acc, curr) => acc + curr.passRatePercentage, 0);
    const avg = total / passRates.length;

    let examinedSum = 0;
    let passedSum = 0;
    passRates.forEach((r) => {
      if (r.studentsExamined) examinedSum += r.studentsExamined;
      if (r.studentsPassed) passedSum += r.studentsPassed;
    });

    // Find highest pass rate subject in most recent year
    const sortedByRate = [...passRates].sort((a, b) => b.passRatePercentage - a.passRatePercentage);
    const top = sortedByRate[0];

    // Subjects with pass rate < 75%
    const needsImp = passRates.filter((r) => r.passRatePercentage < 75).length;

    return {
      totalRecords: passRates.length,
      averagePassRate: avg,
      totalExamined: examinedSum,
      totalPassed: passedSum,
      topSubject: top ? `${top.subjectName} (${top.academicYear})` : 'N/A',
      topRate: top ? top.passRatePercentage : 0,
      needsImprovementCount: needsImp,
    };
  }, [passRates]);

  // Export CSV Handler
  const handleExportCsv = () => {
    if (passRates.length === 0) {
      alert('No pass rate records available to export.');
      return;
    }

    const headers = [
      'Subject Name',
      'Course Code',
      'Category',
      'Academic Year',
      'Pass Rate (%)',
      'Students Examined',
      'Students Passed',
      'Entered By',
      'Notes',
      'Last Updated',
    ];

    const rows = passRates.map((r) => [
      `"${(r.subjectName || '').replace(/"/g, '""')}"`,
      `"${(r.courseCode || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${r.academicYear}"`,
      r.passRatePercentage,
      r.studentsExamined || '',
      r.studentsPassed || '',
      `"${(r.enteredByName || r.enteredBy || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      `"${r.updatedAt || r.createdAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shaw_stem_pass_rates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Academic Performance & Pass Rate Management
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-300/60">
                Official Records
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter, compare, and analyze subject examination pass rates across multiple academic years.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enter Pass Rate Record</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Average Pass Rate</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
            {stats.averagePassRate.toFixed(1)}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across {stats.totalRecords} registered subject records
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Candidates Examined</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
            {stats.totalExamined > 0 ? stats.totalExamined.toLocaleString() : 'N/A'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {stats.totalPassed > 0 ? `${stats.totalPassed.toLocaleString()} passed successfully` : 'Standard examinations'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Top Performing Subject</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate" title={stats.topSubject}>
            {stats.topSubject}
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-1">
            {stats.topRate > 0 ? `${stats.topRate.toFixed(1)}% Pass Rate` : 'No data'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Intervention Areas (&lt;75%)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats.needsImprovementCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Targeted for curriculum support
          </p>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* View Mode Buttons */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Multi-Year Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('records')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'records'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Records ({filteredRecords.length})</span>
            </button>
            <button
              onClick={() => setViewMode('trends')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'trends'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Subject Trends</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {SUBJECT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {viewMode === 'records' && (
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Academic Years</option>
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: Multi-Year Comparison Matrix */}
      {viewMode === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Year-over-Year Pass Rate Comparison Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Horizontal comparison of subject pass rates across consecutive examination years.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> ≥85% High</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 75-84% Good</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> &lt;75% Review</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {matrixData.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Award className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">No pass rate records found matching your filters.</p>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Enter First Pass Rate Record
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Subject Name</th>
                    <th className="py-3.5 px-3">Category</th>
                    {ACADEMIC_YEARS.map((yr) => (
                      <th key={yr} className="py-3.5 px-3 text-center">
                        {yr}
                      </th>
                    ))}
                    <th className="py-3.5 px-4 text-center">Overall Trend</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {matrixData.map((row) => {
                    // Calculate trend between earliest and latest available year
                    const availableYears = ACADEMIC_YEARS.filter((yr) => row.years[yr] !== undefined);
                    const earliestYr = availableYears[0];
                    const latestYr = availableYears[availableYears.length - 1];
                    let diff = 0;
                    let hasDiff = false;
                    if (earliestYr && latestYr && earliestYr !== latestYr) {
                      diff = row.years[latestYr].passRate - row.years[earliestYr].passRate;
                      hasDiff = true;
                    }

                    return (
                      <tr
                        key={row.subjectName}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                          <div>{row.subjectName}</div>
                          {row.courseCode && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {row.courseCode}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px]">
                            {row.category}
                          </span>
                        </td>
                        {ACADEMIC_YEARS.map((yr) => {
                          const yrData = row.years[yr];
                          if (!yrData) {
                            return (
                              <td key={yr} className="py-3.5 px-3 text-center text-slate-300 dark:text-slate-700">
                                —
                              </td>
                            );
                          }

                          let badgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                          if (yrData.passRate < 75) {
                            badgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                          } else if (yrData.passRate < 85) {
                            badgeColor = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
                          }

                          return (
                            <td key={yr} className="py-3.5 px-3 text-center">
                              <div
                                className={`inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-lg border font-black text-xs ${badgeColor}`}
                                title={
                                  yrData.examined
                                    ? `${yrData.passed || 0}/${yrData.examined} students passed`
                                    : 'Pass rate'
                                }
                              >
                                <span>{yrData.passRate.toFixed(1)}%</span>
                                {yrData.examined !== undefined && (
                                  <span className="text-[9px] font-normal opacity-80">
                                    n={yrData.examined}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-3.5 px-4 text-center">
                          {hasDiff ? (
                            <div
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs ${
                                diff > 0
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : diff < 0
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {diff > 0 ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                              ) : diff < 0 ? (
                                <TrendingDown className="w-3.5 h-3.5" />
                              ) : (
                                <Minus className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setFormData({
                                subjectName: row.subjectName,
                                subjectId: '',
                                courseCode: row.courseCode || '',
                                category: row.category,
                                academicYear: '2026',
                                studentsExamined: '',
                                studentsPassed: '',
                                passRatePercentage: '',
                                notes: '',
                              });
                              setEditingRecord(null);
                              setIsModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 text-slate-600 dark:text-slate-300 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                            title="Add pass rate for new year"
                          >
                            + Year
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: All Records Table */}
      {viewMode === 'records' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Detailed Examination Pass Rate Records
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Showing {filteredRecords.length} individual pass-rate entries.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">No records match your criteria.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-3">Year</th>
                    <th className="py-3.5 px-3">Category</th>
                    <th className="py-3.5 px-3 text-center">Examined</th>
                    <th className="py-3.5 px-3 text-center">Passed</th>
                    <th className="py-3.5 px-3 text-center">Pass Rate</th>
                    <th className="py-3.5 px-4">Notes</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {rec.subjectName}
                        {rec.courseCode && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {rec.courseCode}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {rec.academicYear}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                        {rec.category || 'General'}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-700 dark:text-slate-300">
                        {rec.studentsExamined !== undefined ? rec.studentsExamined : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-700 dark:text-slate-300">
                        {rec.studentsPassed !== undefined ? rec.studentsPassed : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs ${
                            rec.passRatePercentage >= 85
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                              : rec.passRatePercentage >= 75
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
                          }`}
                        >
                          {rec.passRatePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                        {rec.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenModal(rec)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              recordId: rec.id,
                              subjectName: rec.subjectName,
                              year: rec.academicYear,
                            })
                          }
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: Visual Subject Trends & Highlights */}
      {viewMode === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best Performers List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Highest Achieving Subjects (≥90%)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Excellence benchmark subjects exceeding high-distinction standards.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {passRates
                .filter((r) => r.passRatePercentage >= 90)
                .sort((a, b) => b.passRatePercentage - a.passRatePercentage)
                .slice(0, 8)
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {r.subjectName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Year {r.academicYear} • {r.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-black">
                        {r.passRatePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              {passRates.filter((r) => r.passRatePercentage >= 90).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">
                  No subjects currently recorded at ≥90% pass rate.
                </p>
              )}
            </div>
          </div>

          {/* Areas for Academic Support List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Targeted Support Areas (&lt;75%)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Curriculum enhancement and remedial workshop priority subjects.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {passRates
                .filter((r) => r.passRatePercentage < 75)
                .sort((a, b) => a.passRatePercentage - b.passRatePercentage)
                .slice(0, 8)
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {r.subjectName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Year {r.academicYear} • {r.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-black">
                        {r.passRatePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              {passRates.filter((r) => r.passRatePercentage < 75).length === 0 && (
                <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/40">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    All recorded subjects are meeting or exceeding the 75% baseline!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    {editingRecord ? 'Edit Pass Rate Record' : 'Enter New Pass Rate Record'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Academic performance data entered by {currentUser?.name || 'Academic Officer'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4 overflow-y-auto">
              {/* Subject Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Course Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="subjects-list"
                  placeholder="e.g. Physics, Robotics Engineering, Mathematics"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
                <datalist id="subjects-list">
                  {availableSubjectNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              {/* Course Code & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Course Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STEM-101, CSEC-PHY"
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category / Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {SUBJECT_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Examination / Academic Year <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      Academic Year {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Students Examined & Passed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Students Examined (Count)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 45"
                    value={formData.studentsExamined}
                    onChange={(e) => handleExaminedChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Students Passed (Count)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 42"
                    value={formData.studentsPassed}
                    onChange={(e) => handlePassedChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Pass Rate % */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pass Rate Percentage (%) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    placeholder="e.g. 93.3"
                    value={formData.passRatePercentage}
                    onChange={(e) => setFormData({ ...formData, passRatePercentage: e.target.value })}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Calculated automatically from examined & passed counts, or enter directly.
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observations / Performance Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 100% distinction rate in practical SBA component..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingRecord ? 'Update Record' : 'Save Pass Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Pass Rate Record"
        message={`Are you sure you want to permanently delete the ${deleteConfirm.year} pass rate record for "${deleteConfirm.subjectName}"?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteRecord}
        onCancel={() => setDeleteConfirm({ isOpen: false, recordId: '', subjectName: '', year: '' })}
      />
    </div>
  );
};
