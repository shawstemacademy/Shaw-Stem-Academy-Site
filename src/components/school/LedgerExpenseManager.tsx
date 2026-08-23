import React, { useState, useMemo, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Download, 
  CreditCard, 
  PieChart, 
  FileText, 
  AlertCircle, 
  X, 
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Tag,
  Check
} from 'lucide-react';
import { ExpenseRecord, RegistrationRecord, SchoolUser, LedgerCategoryItem } from '../../types';
import { saveExpenseToFirestore, deleteExpenseFromFirestore } from '../../lib/firebase';
import { ConfirmationModal } from '../ConfirmationModal';

interface LedgerExpenseManagerProps {
  expenses: ExpenseRecord[];
  onUpdateExpenses?: (records: ExpenseRecord[]) => void;
  registrationLogs: RegistrationRecord[];
  currentUser: SchoolUser | null;
  theme?: any;
}

const DEFAULT_CATEGORIES: LedgerCategoryItem[] = [
  // Expenses
  { id: 'cat-exp-1', name: 'Utilities', type: 'expense', isDefault: true },
  { id: 'cat-exp-2', name: 'Salaries/Wages', type: 'expense', isDefault: true },
  { id: 'cat-exp-3', name: 'Equipment', type: 'expense', isDefault: true },
  { id: 'cat-exp-4', name: 'Supplies', type: 'expense', isDefault: true },
  { id: 'cat-exp-5', name: 'Rent', type: 'expense', isDefault: true },
  { id: 'cat-exp-6', name: 'Internet', type: 'expense', isDefault: true },
  { id: 'cat-exp-7', name: 'Transportation', type: 'expense', isDefault: true },
  { id: 'cat-exp-8', name: 'Marketing', type: 'expense', isDefault: true },
  { id: 'cat-exp-9', name: 'Software/Subscriptions', type: 'expense', isDefault: true },
  { id: 'cat-exp-10', name: 'Maintenance', type: 'expense', isDefault: true },
  { id: 'cat-exp-11', name: 'Other Expense', type: 'expense', isDefault: true },

  // Income
  { id: 'cat-inc-1', name: 'Tuition & Fees', type: 'income', isDefault: true },
  { id: 'cat-inc-2', name: 'Grants & Subsidies', type: 'income', isDefault: true },
  { id: 'cat-inc-3', name: 'Donations & Sponsorships', type: 'income', isDefault: true },
  { id: 'cat-inc-4', name: 'Lab & Materials Fees', type: 'income', isDefault: true },
  { id: 'cat-inc-5', name: 'Fundraising', type: 'income', isDefault: true },
  { id: 'cat-inc-6', name: 'Facility Rental', type: 'income', isDefault: true },
  { id: 'cat-inc-7', name: 'Merchandise & Books', type: 'income', isDefault: true },
  { id: 'cat-inc-8', name: 'Exam / Certification Fees', type: 'income', isDefault: true },
  { id: 'cat-inc-9', name: 'Other Income', type: 'income', isDefault: true },
];

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Cash',
  'Credit Card',
  'Debit Card',
  'Check',
  'Online/Zelle',
  'Other',
] as const;

export const LedgerExpenseManager: React.FC<LedgerExpenseManagerProps> = ({
  expenses = [],
  onUpdateExpenses,
  registrationLogs = [],
  currentUser,
  theme,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'expenses'>('analytics');

  // Categories State
  const [categories, setCategories] = useState<LedgerCategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('shaw_stem_ledger_categories');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse ledger categories from localStorage', e);
    }
    return DEFAULT_CATEGORIES;
  });

  // Save categories to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('shaw_stem_ledger_categories', JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage', e);
    }
  }, [categories]);

  // Custom Date Range Filters (default: This Month)
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'this_week' | 'this_month' | 'this_year' | 'custom'>('this_month');
  
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filter states
  const [entryTypeFilter, setEntryTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');

  // Modal states for Record Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  // Category Manager Modal state
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [categoryManagerTab, setCategoryManagerTab] = useState<'expense' | 'income'>('expense');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'expense' | 'income'>('expense');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryNameValue, setEditCategoryNameValue] = useState('');

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    expenseId: string;
    description: string;
    amount: number;
    type: 'expense' | 'income';
  }>({ isOpen: false, expenseId: '', description: '', amount: 0, type: 'expense' });

  // Record Form state
  const [formData, setFormData] = useState({
    entryType: 'expense' as 'expense' | 'income',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Utilities',
    amount: '',
    paymentMethod: 'Bank Transfer' as typeof PAYMENT_METHODS[number],
    vendorPayee: '',
    referenceNumber: '',
    notes: '',
  });

  // Available categories for selected entry type in record form
  const availableCategoriesForForm = useMemo(() => {
    return categories
      .filter((c) => c.type === formData.entryType)
      .map((c) => c.name);
  }, [categories, formData.entryType]);

  // Apply Quick Date Range Preset
  const handleSelectPreset = (preset: 'all' | 'this_week' | 'this_month' | 'this_year' | 'custom') => {
    setDateRangePreset(preset);
    const now = new Date();

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'this_week') {
      const firstDayOfWeek = new Date(now);
      const day = now.getDay() || 7;
      firstDayOfWeek.setDate(now.getDate() - day + 1);
      setStartDate(firstDayOfWeek.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'this_year') {
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(firstDayOfYear.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Open Modal for Create or Edit
  const handleOpenModal = (expense?: ExpenseRecord, defaultType: 'expense' | 'income' = 'expense') => {
    if (expense) {
      setEditingExpense(expense);
      const eType = expense.entryType || 'expense';
      setFormData({
        entryType: eType,
        date: expense.date || new Date().toISOString().split('T')[0],
        description: expense.description || '',
        category: expense.category || (eType === 'income' ? 'Grants & Subsidies' : 'Utilities'),
        amount: String(expense.amount || ''),
        paymentMethod: expense.paymentMethod || 'Bank Transfer',
        vendorPayee: expense.vendorPayee || '',
        referenceNumber: expense.referenceNumber || '',
        notes: expense.notes || '',
      });
    } else {
      setEditingExpense(null);
      const defaultCatList = categories.filter((c) => c.type === defaultType);
      const firstCatName = defaultCatList.length > 0 ? defaultCatList[0].name : (defaultType === 'income' ? 'Other Income' : 'Utilities');
      setFormData({
        entryType: defaultType,
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: firstCatName,
        amount: '',
        paymentMethod: 'Bank Transfer',
        vendorPayee: '',
        referenceNumber: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  // Handle entryType toggle inside record form
  const handleFormEntryTypeChange = (newType: 'expense' | 'income') => {
    const defaultCatList = categories.filter((c) => c.type === newType);
    const firstCatName = defaultCatList.length > 0 ? defaultCatList[0].name : (newType === 'income' ? 'Other Income' : 'Utilities');
    setFormData((prev) => ({
      ...prev,
      entryType: newType,
      category: firstCatName,
    }));
  };

  // Save Record Handler (Expense or Income)
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert(`Please enter a description for this ${formData.entryType}.`);
      return;
    }
    const amtNum = parseFloat(formData.amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      alert('Please enter a valid positive dollar amount.');
      return;
    }
    if (!formData.vendorPayee.trim()) {
      alert(formData.entryType === 'income' ? 'Please enter the Payer or Income Source Name.' : 'Please enter the Vendor or Payee name.');
      return;
    }

    const newExpense: ExpenseRecord = {
      id: editingExpense ? editingExpense.id : `REC-${Date.now()}`,
      entryType: formData.entryType,
      date: formData.date,
      description: formData.description.trim(),
      category: formData.category,
      amount: parseFloat(amtNum.toFixed(2)),
      paymentMethod: formData.paymentMethod,
      vendorPayee: formData.vendorPayee.trim(),
      referenceNumber: formData.referenceNumber.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      createdBy: editingExpense ? editingExpense.createdBy : (currentUser?.id || 'admin'),
      createdByName: editingExpense ? editingExpense.createdByName : (currentUser?.name || 'Staff Member'),
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
      updatedBy: currentUser?.id || 'admin',
      updatedByName: currentUser?.name || 'Staff Member',
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveExpenseToFirestore(newExpense);
      if (onUpdateExpenses) {
        if (editingExpense) {
          onUpdateExpenses(expenses.map((exp) => (exp.id === editingExpense.id ? newExpense : exp)));
        } else {
          onUpdateExpenses([newExpense, ...expenses]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving ledger record:', err);
      alert('Failed to save ledger record.');
    }
  };

  // Delete Record Handler
  const handleDeleteRecord = async () => {
    if (!deleteConfirm.expenseId) return;
    try {
      await deleteExpenseFromFirestore(deleteConfirm.expenseId);
      if (onUpdateExpenses) {
        onUpdateExpenses(expenses.filter((exp) => exp.id !== deleteConfirm.expenseId));
      }
      setDeleteConfirm({ isOpen: false, expenseId: '', description: '', amount: 0, type: 'expense' });
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete record.');
    }
  };

  // Category Management Handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert('Please enter a category name.');
      return;
    }

    // Check duplicate
    const exists = categories.some(
      (c) => c.type === newCategoryType && c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (exists) {
      alert(`A category with the name "${newCategoryName.trim()}" already exists for ${newCategoryType}s.`);
      return;
    }

    const newCatItem: LedgerCategoryItem = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      type: newCategoryType,
      isDefault: false,
    };

    setCategories((prev) => [...prev, newCatItem]);
    setNewCategoryName('');
  };

  const handleUpdateCategoryName = (id: string) => {
    if (!editCategoryNameValue.trim()) return;
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: editCategoryNameValue.trim() } : c))
    );
    setEditingCategoryId(null);
    setEditCategoryNameValue('');
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Filtered Ledger Records
  const filteredRecords = useMemo(() => {
    return expenses.filter((exp) => {
      const eType = exp.entryType || 'expense';

      if (startDate && exp.date < startDate) return false;
      if (endDate && exp.date > endDate) return false;

      if (entryTypeFilter !== 'all' && eType !== entryTypeFilter) return false;
      if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
      if (paymentMethodFilter !== 'all' && exp.paymentMethod !== paymentMethodFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = (exp.description || '').toLowerCase().includes(q);
        const matchVendor = (exp.vendorPayee || '').toLowerCase().includes(q);
        const matchCat = (exp.category || '').toLowerCase().includes(q);
        const matchRef = (exp.referenceNumber || '').toLowerCase().includes(q);
        const matchNotes = (exp.notes || '').toLowerCase().includes(q);
        if (!matchDesc && !matchVendor && !matchCat && !matchRef && !matchNotes) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, startDate, endDate, entryTypeFilter, categoryFilter, paymentMethodFilter, searchQuery]);

  // Filtered Revenue Registrations by Date Range
  const filteredRegistrations = useMemo(() => {
    return registrationLogs.filter((reg) => {
      const regDate = reg.timestamp ? reg.timestamp.split('T')[0] : '';
      if (startDate && regDate && regDate < startDate) return false;
      if (endDate && regDate && regDate > endDate) return false;
      return true;
    });
  }, [registrationLogs, startDate, endDate]);

  // Comprehensive Financial Summary
  const financialSummary = useMemo(() => {
    // 1. Invoiced Tuition Revenue
    const totalInvoicedTuition = filteredRegistrations.reduce((acc, r) => acc + (r.totalPrice || 0), 0);

    // 2. Collected Student Tuition Revenue
    let totalTuitionCollected = 0;
    filteredRegistrations.forEach((reg) => {
      if (reg.payments && Array.isArray(reg.payments)) {
        reg.payments.forEach((p) => {
          totalTuitionCollected += (p.amount || 0);
        });
      } else if (reg.isPaid) {
        totalTuitionCollected += (reg.totalPrice || 0);
      }
    });

    // 3. Directly Recorded Ledger Income
    const activeDirectIncomeRecords = filteredRecords.filter((r) => r.entryType === 'income');
    const totalDirectIncome = activeDirectIncomeRecords.reduce((acc, r) => acc + (r.amount || 0), 0);

    // Total Combined Revenue
    const totalCollectedIncome = totalTuitionCollected + totalDirectIncome;

    // 4. Unpaid Tuition Balances
    const outstandingTuition = Math.max(0, totalInvoicedTuition - totalTuitionCollected);

    // 5. Operating Expenses
    const activeExpenseRecords = filteredRecords.filter((r) => (r.entryType || 'expense') === 'expense');
    const totalOperatingExpenses = activeExpenseRecords.reduce((acc, r) => acc + (r.amount || 0), 0);

    // 6. Net Financial Position (Surplus / Deficit)
    const netPosition = totalCollectedIncome - totalOperatingExpenses;

    // Category breakdown maps
    const expenseCategoryTotals: Record<string, number> = {};
    const incomeCategoryTotals: Record<string, number> = {};

    categories.forEach((cat) => {
      if (cat.type === 'expense') expenseCategoryTotals[cat.name] = 0;
      if (cat.type === 'income') incomeCategoryTotals[cat.name] = 0;
    });

    // Populate Expense category totals
    activeExpenseRecords.forEach((exp) => {
      expenseCategoryTotals[exp.category] = (expenseCategoryTotals[exp.category] || 0) + exp.amount;
    });

    // Populate Income category totals
    activeDirectIncomeRecords.forEach((inc) => {
      incomeCategoryTotals[inc.category] = (incomeCategoryTotals[inc.category] || 0) + inc.amount;
    });

    return {
      totalInvoicedTuition,
      totalTuitionCollected,
      totalDirectIncome,
      totalCollectedIncome,
      outstandingTuition,
      totalOperatingExpenses,
      netPosition,
      expenseCategoryTotals,
      incomeCategoryTotals,
      countInvoices: filteredRegistrations.length,
      countExpenseRecords: activeExpenseRecords.length,
      countIncomeRecords: activeDirectIncomeRecords.length,
    };
  }, [filteredRegistrations, filteredRecords, categories]);

  // Export Combined Financial Ledger CSV
  const handleExportLedgerCsv = () => {
    const headers = [
      'Transaction Date',
      'Entry Type',
      'Category Name',
      'Description / Purpose',
      'Vendor / Payee / Payer Source',
      'Reference #',
      'Income ($)',
      'Expense ($)',
      'Recorded By',
      'Notes',
    ];

    const directLedgerRows = filteredRecords.map((rec) => {
      const isInc = rec.entryType === 'income';
      return [
        `"${rec.date}"`,
        `"${isInc ? 'INCOME' : 'EXPENSE'}"`,
        `"${(rec.category || '').replace(/"/g, '""')}"`,
        `"${(rec.description || '').replace(/"/g, '""')}"`,
        `"${(rec.vendorPayee || '').replace(/"/g, '""')}"`,
        `"${(rec.referenceNumber || rec.id).replace(/"/g, '""')}"`,
        isInc ? rec.amount.toFixed(2) : '0.00',
        !isInc ? rec.amount.toFixed(2) : '0.00',
        `"${(rec.createdByName || rec.createdBy || '').replace(/"/g, '""')}"`,
        `"${(rec.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const tuitionRows: string[][] = [];
    filteredRegistrations.forEach((reg) => {
      const regDate = reg.timestamp ? reg.timestamp.split('T')[0] : '';
      const sName = reg.studentInfo?.studentName || `${reg.studentInfo?.firstName || ''} ${reg.studentInfo?.lastName || ''}`.trim() || 'Student';
      const paidAmt = reg.payments?.reduce((s, p) => s + (p.amount || 0), 0) || (reg.isPaid ? reg.totalPrice : 0);

      tuitionRows.push([
        `"${regDate}"`,
        '"TUITION INCOME"',
        '"Tuition & Fees"',
        `"Student Course Registration (${reg.selectedClasses?.length || 0} classes)"`,
        `"${sName.replace(/"/g, '""')}"`,
        `"${reg.id}"`,
        paidAmt.toFixed(2),
        '0.00',
        '"Admissions System"',
        `"${reg.isPaid ? 'Paid in Full' : 'Partial / Pending Payment'}"`,
      ]);
    });

    const allRows = [...directLedgerRows, ...tuitionRows].sort((a, b) => b[0].localeCompare(a[0]));
    const csvContent = [headers.join(','), ...allRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shaw_stem_financial_ledger_${startDate || 'all'}_to_${endDate || 'today'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Financial Ledger & Expense/Income Management
              </h1>
              <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold rounded-full border border-blue-300/60">
                Finance & Ledger
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Record operating costs, direct income, manage customizable ledger categories, track student tuition, and calculate net positions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCategoryManagerOpen(true)}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-300/50"
            title="Manage Ledger Categories for Expenses and Income"
          >
            <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={handleExportLedgerCsv}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Ledger</span>
          </button>

          <button
            onClick={() => handleOpenModal(undefined, 'income')}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Income (+)</span>
          </button>

          <button
            onClick={() => handleOpenModal(undefined, 'expense')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense (-)</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => handleSelectPreset('this_week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dateRangePreset === 'this_week'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handleSelectPreset('this_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dateRangePreset === 'this_month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleSelectPreset('this_year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dateRangePreset === 'this_year'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => handleSelectPreset('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dateRangePreset === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRangePreset('custom');
                }}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden font-bold"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRangePreset('custom');
                }}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Invoiced Tuition */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Invoiced Tuition</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            ${financialSummary.totalInvoicedTuition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {financialSummary.countInvoices} student registration invoices
          </p>
        </div>

        {/* Total Collected Revenue (Tuition + Direct Income) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Income Received</span>
            <ArrowUpRight className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
            ${financialSummary.totalCollectedIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-teal-700 dark:text-teal-300 font-bold mt-1">
            ${financialSummary.totalTuitionCollected.toFixed(0)} Tuition + ${financialSummary.totalDirectIncome.toFixed(0)} Grants/Direct
          </p>
        </div>

        {/* Unpaid Tuition */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Unpaid Balances</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            ${financialSummary.outstandingTuition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pending student payments
          </p>
        </div>

        {/* Total Operating Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Operating Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            ${financialSummary.totalOperatingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {financialSummary.countExpenseRecords} recorded disbursements
          </p>
        </div>

        {/* Net Financial Position */}
        <div className={`border rounded-2xl p-5 shadow-xs ${
          financialSummary.netPosition >= 0
            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
            <span className={financialSummary.netPosition >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}>
              Net Position
            </span>
            {financialSummary.netPosition >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className={`text-2xl font-black ${
            financialSummary.netPosition >= 0
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-rose-700 dark:text-rose-300'
          }`}>
            {financialSummary.netPosition >= 0 ? '+' : ''}
            ${financialSummary.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className={`text-[11px] font-bold mt-1 ${
            financialSummary.netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {financialSummary.netPosition >= 0 ? 'Net Operational Surplus' : 'Net Operational Deficit'}
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`pb-3 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'text-emerald-600 border-b-2 border-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Revenue & Expense Analytics</span>
        </button>
        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`pb-3 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'expenses'
              ? 'text-emerald-600 border-b-2 border-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Ledger Logs ({filteredRecords.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: Revenue vs Expense Breakdown */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses Breakdown by Category */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-rose-500" />
                <span>Expenses by Category</span>
              </h3>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Total: ${financialSummary.totalOperatingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {categories
                .filter((c) => c.type === 'expense')
                .map((cat) => {
                  const amt = financialSummary.expenseCategoryTotals[cat.name] || 0;
                  const percentage = financialSummary.totalOperatingExpenses > 0
                    ? ((amt / financialSummary.totalOperatingExpenses) * 100).toFixed(1)
                    : '0';

                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {cat.name}
                        </span>
                        <span className="font-black text-slate-900 dark:text-slate-100">
                          ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          <span className="text-slate-400 font-normal ml-1">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, parseFloat(percentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Income Breakdown by Category */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-teal-500" />
                <span>Direct Income by Category</span>
              </h3>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                Total Direct: ${financialSummary.totalDirectIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {categories
                .filter((c) => c.type === 'income')
                .map((cat) => {
                  const amt = financialSummary.incomeCategoryTotals[cat.name] || 0;
                  const percentage = financialSummary.totalDirectIncome > 0
                    ? ((amt / financialSummary.totalDirectIncome) * 100).toFixed(1)
                    : '0';

                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {cat.name}
                        </span>
                        <span className="font-black text-slate-900 dark:text-slate-100">
                          ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          <span className="text-slate-400 font-normal ml-1">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, parseFloat(percentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Detailed Ledger Logs Table */}
      {activeSubTab === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Ledger Logs (Expense & Income)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Showing {filteredRecords.length} ledger items for selected filters.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[180px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search description, payee, payer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Entry Type Filter */}
              <select
                value={entryTypeFilter}
                onChange={(e) => setEntryTypeFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 cursor-pointer font-bold"
              >
                <option value="all">All Entry Types</option>
                <option value="expense">Expenses Only (-)</option>
                <option value="income">Income Only (+)</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    [{cat.type.toUpperCase()}] {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">No ledger items recorded for this period.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => handleOpenModal(undefined, 'income')}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Record Income (+)
                  </button>
                  <button
                    onClick={() => handleOpenModal(undefined, 'expense')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Record Expense (-)
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-3">Type</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-3">Category</th>
                    <th className="py-3.5 px-3">Vendor / Payee / Source</th>
                    <th className="py-3.5 px-3">Payment Method</th>
                    <th className="py-3.5 px-3 text-right">Amount</th>
                    <th className="py-3.5 px-4">Logged By</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRecords.map((rec) => {
                    const isIncome = rec.entryType === 'income';
                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {rec.date}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isIncome
                              ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300/60'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300/60'
                          }`}>
                            {isIncome ? '+ Income' : '- Expense'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                          <div>{rec.description}</div>
                          {rec.referenceNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Ref: {rec.referenceNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-medium">
                            {rec.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                          {rec.vendorPayee}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                          {rec.paymentMethod}
                        </td>
                        <td className={`py-3.5 px-3 text-right font-black ${
                          isIncome ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isIncome ? '+' : '-'}${rec.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                          {rec.createdByName || rec.createdBy || 'Staff'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
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
                                expenseId: rec.id,
                                description: rec.description,
                                amount: rec.amount,
                                type: rec.entryType || 'expense',
                              })
                            }
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* CATEGORY MANAGER MODAL */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    Manage Ledger Categories
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add or edit custom Expense and Income category names
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Add New Category
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Type
                    </label>
                    <select
                      value={newCategoryType}
                      onChange={(e) => setNewCategoryType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="expense">Expense (-)</option>
                      <option value="income">Income (+)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Category Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lab Consumables, STEM Grants"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              </form>

              {/* Category List & Filter Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCategoryManagerTab('expense')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        categoryManagerTab === 'expense'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Expense Categories ({categories.filter((c) => c.type === 'expense').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryManagerTab('income')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        categoryManagerTab === 'income'
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Income Categories ({categories.filter((c) => c.type === 'income').length})
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {categories
                    .filter((c) => c.type === categoryManagerTab)
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        {editingCategoryId === cat.id ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editCategoryNameValue}
                              onChange={(e) => setEditCategoryNameValue(e.target.value)}
                              className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateCategoryName(cat.id)}
                              className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategoryId(null)}
                              className="p-1 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                              {cat.isDefault && (
                                <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.2 bg-slate-200/60 dark:bg-slate-700/50 rounded">
                                  Default
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategoryId(cat.id);
                                  setEditCategoryNameValue(cat.name);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                                title="Edit Name"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!cat.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                  title="Delete Custom Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT LEDGER RECORD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formData.entryType === 'income'
                    ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    {editingExpense ? `Edit ${formData.entryType === 'income' ? 'Income' : 'Expense'} Record` : `Record ${formData.entryType === 'income' ? 'New Income' : 'Operating Expense'}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Logged by {currentUser?.name || 'Staff Member'}
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
              {/* Entry Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ledger Transaction Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => handleFormEntryTypeChange('expense')}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.entryType === 'expense'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>🔴 Expense (-)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormEntryTypeChange('income')}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.entryType === 'income'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>🟢 Income (+)</span>
                  </button>
                </div>
              </div>

              {/* Date & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryManagerOpen(true)}
                      className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                    >
                      + Edit Categories
                    </button>
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
                  >
                    {availableCategoriesForForm.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description / Name of Expense/Income */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {formData.entryType === 'income' ? 'Name of Income / Purpose' : 'Name of Expense / Purpose'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={formData.entryType === 'income' ? 'e.g. STEM Grant 2026, Alumni Robotics Donation' : 'e.g. Electricity bill for Labs, Science kits'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Amount & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount ($) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold ${
                        formData.entryType === 'income' ? 'text-teal-600' : 'text-rose-600'
                      } focus:ring-2 focus:ring-emerald-500`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {formData.entryType === 'income' ? 'Deposit Method' : 'Payment Method'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as typeof PAYMENT_METHODS[number] })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vendor / Payee / Payer Source & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {formData.entryType === 'income' ? 'Payer / Source Name' : 'Vendor / Payee Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={formData.entryType === 'income' ? 'e.g. Ministry of Education, National Tech Foundation' : 'e.g. Electric Power Co, Office Depot'}
                    value={formData.vendorPayee}
                    onChange={(e) => setFormData({ ...formData, vendorPayee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice / Reference # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9042, TX-0012, Grant-2026"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context or authorization details..."
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
                  className={`px-6 py-2.5 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer ${
                    formData.entryType === 'income'
                      ? 'bg-teal-600 hover:bg-teal-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {editingExpense ? 'Update Record' : `Save ${formData.entryType === 'income' ? 'Income' : 'Expense'} Record`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title={`Delete ${deleteConfirm.type === 'income' ? 'Income' : 'Expense'} Record`}
        message={`Are you sure you want to delete the ${deleteConfirm.type} record "${deleteConfirm.description}" ($${deleteConfirm.amount.toFixed(2)})?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteRecord}
        onCancel={() => setDeleteConfirm({ isOpen: false, expenseId: '', description: '', amount: 0, type: 'expense' })}
      />
    </div>
  );
};
