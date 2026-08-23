import React, { useState, useMemo } from 'react';
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
  CheckCircle2, 
  AlertCircle, 
  X, 
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ShieldCheck,
  Building2,
  RefreshCw
} from 'lucide-react';
import { ExpenseRecord, ExpenseCategory, RegistrationRecord, SchoolUser } from '../../types';
import { saveExpenseToFirestore, deleteExpenseFromFirestore } from '../../lib/firebase';
import { ConfirmationModal } from '../ConfirmationModal';

interface LedgerExpenseManagerProps {
  expenses: ExpenseRecord[];
  onUpdateExpenses?: (records: ExpenseRecord[]) => void;
  registrationLogs: RegistrationRecord[];
  currentUser: SchoolUser | null;
  theme?: any;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Utilities',
  'Salaries/Wages',
  'Equipment',
  'Supplies',
  'Rent',
  'Internet',
  'Transportation',
  'Marketing',
  'Software/Subscriptions',
  'Maintenance',
  'Other',
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
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'expenses' | 'ledger_audit'>('analytics');

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

  // Expense Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');

  // Modal states for Create / Edit Expense
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    expenseId: string;
    description: string;
    amount: number;
  }>({ isOpen: false, expenseId: '', description: '', amount: 0 });

  // Form states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Utilities' as ExpenseCategory,
    amount: '',
    paymentMethod: 'Bank Transfer' as typeof PAYMENT_METHODS[number],
    vendorPayee: '',
    referenceNumber: '',
    notes: '',
  });

  // Apply Quick Date Range Preset
  const handleSelectPreset = (preset: 'all' | 'this_week' | 'this_month' | 'this_year' | 'custom') => {
    setDateRangePreset(preset);
    const now = new Date();

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'this_week') {
      const firstDayOfWeek = new Date(now);
      const day = now.getDay() || 7; // Sunday as 7 or Monday as 1
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
  const handleOpenModal = (expense?: ExpenseRecord) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        date: expense.date || new Date().toISOString().split('T')[0],
        description: expense.description || '',
        category: expense.category || 'Utilities',
        amount: String(expense.amount || ''),
        paymentMethod: expense.paymentMethod || 'Bank Transfer',
        vendorPayee: expense.vendorPayee || '',
        referenceNumber: expense.referenceNumber || '',
        notes: expense.notes || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Utilities',
        amount: '',
        paymentMethod: 'Bank Transfer',
        vendorPayee: '',
        referenceNumber: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  // Save Expense Handler
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('Please enter a description for this expense.');
      return;
    }
    const amtNum = parseFloat(formData.amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      alert('Please enter a valid positive dollar amount.');
      return;
    }
    if (!formData.vendorPayee.trim()) {
      alert('Please enter the Vendor or Payee name.');
      return;
    }

    const newExpense: ExpenseRecord = {
      id: editingExpense ? editingExpense.id : `EXP-${Date.now()}`,
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
      console.error('Error saving expense:', err);
      alert('Failed to save expense record.');
    }
  };

  // Delete Expense Handler
  const handleDeleteExpense = async () => {
    if (!deleteConfirm.expenseId) return;
    try {
      await deleteExpenseFromFirestore(deleteConfirm.expenseId);
      if (onUpdateExpenses) {
        onUpdateExpenses(expenses.filter((exp) => exp.id !== deleteConfirm.expenseId));
      }
      setDeleteConfirm({ isOpen: false, expenseId: '', description: '', amount: 0 });
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Failed to delete expense.');
    }
  };

  // Filtered Expenses by Date Range and search
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (startDate && exp.date < startDate) return false;
      if (endDate && exp.date > endDate) return false;

      if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
      if (paymentMethodFilter !== 'all' && exp.paymentMethod !== paymentMethodFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = (exp.description || '').toLowerCase().includes(q);
        const matchVendor = (exp.vendorPayee || '').toLowerCase().includes(q);
        const matchRef = (exp.referenceNumber || '').toLowerCase().includes(q);
        const matchNotes = (exp.notes || '').toLowerCase().includes(q);
        if (!matchDesc && !matchVendor && !matchRef && !matchNotes) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, startDate, endDate, categoryFilter, paymentMethodFilter, searchQuery]);

  // Filtered Revenue Registrations by Date Range
  const filteredRegistrations = useMemo(() => {
    return registrationLogs.filter((reg) => {
      const regDate = reg.timestamp ? reg.timestamp.split('T')[0] : '';
      if (startDate && regDate && regDate < startDate) return false;
      if (endDate && regDate && regDate > endDate) return false;
      return true;
    });
  }, [registrationLogs, startDate, endDate]);

  // Revenue, Expense, and Net Profit Calculations for Selected Period
  const financialSummary = useMemo(() => {
    // 1. Invoiced Revenue (Total price across filtered registrations)
    const totalInvoiced = filteredRegistrations.reduce((acc, r) => acc + (r.totalPrice || 0), 0);

    // 2. Collected Revenue (Sum of completed payments)
    let totalCollected = 0;
    filteredRegistrations.forEach((reg) => {
      if (reg.payments && Array.isArray(reg.payments)) {
        reg.payments.forEach((p) => {
          totalCollected += (p.amount || 0);
        });
      } else if (reg.isPaid) {
        totalCollected += (reg.totalPrice || 0);
      }
    });

    // 3. Outstanding Balances
    const outstanding = Math.max(0, totalInvoiced - totalCollected);

    // 4. Operating Expenses
    const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

    // 5. Net Financial Position (Surplus / Deficit)
    const netPosition = totalCollected - totalExpenses;

    // Expenses by Category breakdown
    const categoryTotals: Record<string, number> = {};
    EXPENSE_CATEGORIES.forEach((cat) => {
      categoryTotals[cat] = 0;
    });
    filteredExpenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    return {
      totalInvoiced,
      totalCollected,
      outstanding,
      totalExpenses,
      netPosition,
      categoryTotals,
      countInvoices: filteredRegistrations.length,
      countExpenses: filteredExpenses.length,
    };
  }, [filteredRegistrations, filteredExpenses]);

  // Export Combined Ledger CSV
  const handleExportLedgerCsv = () => {
    const headers = [
      'Transaction Date',
      'Type',
      'Category / Description',
      'Vendor / Payee / Student',
      'Reference / Invoice ID',
      'Income (Collected $)',
      'Expense ($)',
      'Recorded By',
      'Notes',
    ];

    const expenseRows = filteredExpenses.map((exp) => [
      `"${exp.date}"`,
      '"EXPENSE"',
      `"[${exp.category}] ${(exp.description || '').replace(/"/g, '""')}"`,
      `"${(exp.vendorPayee || '').replace(/"/g, '""')}"`,
      `"${(exp.referenceNumber || exp.id).replace(/"/g, '""')}"`,
      '0.00',
      exp.amount.toFixed(2),
      `"${(exp.createdByName || exp.createdBy || '').replace(/"/g, '""')}"`,
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
    ]);

    const revenueRows: string[][] = [];
    filteredRegistrations.forEach((reg) => {
      const regDate = reg.timestamp ? reg.timestamp.split('T')[0] : '';
      const sName = reg.studentInfo?.studentName || `${reg.studentInfo?.firstName || ''} ${reg.studentInfo?.lastName || ''}`.trim() || 'Student';
      const paidAmt = reg.payments?.reduce((s, p) => s + (p.amount || 0), 0) || (reg.isPaid ? reg.totalPrice : 0);

      revenueRows.push([
        `"${regDate}"`,
        '"TUITION INCOME"',
        `"Course Tuition Registration (${reg.selectedClasses?.length || 0} classes)"`,
        `"${sName.replace(/"/g, '""')}"`,
        `"${reg.id}"`,
        paidAmt.toFixed(2),
        '0.00',
        '"Admissions System"',
        `"${reg.isPaid ? 'Paid in Full' : 'Partial / Pending Payment'}"`,
      ]);
    });

    const allRows = [...expenseRows, ...revenueRows].sort((a, b) => b[0].localeCompare(a[0]));
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Ledger, Expense Management & Tuition Analytics
              </h1>
              <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold rounded-full border border-blue-300/60">
                Finance & Registrar
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track operating costs, log invoices, analyze student tuition payments, and calculate net revenue across custom timeframes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportLedgerCsv}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Financial Ledger</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Operating Expense</span>
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
        {/* Total Invoiced */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Invoiced</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            ${financialSummary.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {financialSummary.countInvoices} total registration invoices
          </p>
        </div>

        {/* Collected Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Collected Revenue</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${financialSummary.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            Received into school accounts
          </p>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Unpaid Balances</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            ${financialSummary.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pending student payments
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Operating Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            ${financialSummary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {financialSummary.countExpenses} recorded disbursements
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
          <span>Revenue & Expense Breakdown</span>
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
          <span>Expense Logs ({filteredExpenses.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: Revenue vs Expense Breakdown */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operating Expense Breakdown by Category */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" />
                <span>Expenses by Category</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Total: ${financialSummary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-3">
              {EXPENSE_CATEGORIES.map((cat) => {
                const amt = financialSummary.categoryTotals[cat] || 0;
                const percentage = financialSummary.totalExpenses > 0
                  ? ((amt / financialSummary.totalExpenses) * 100).toFixed(1)
                  : '0';

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {cat}
                      </span>
                      <span className="font-black text-slate-900 dark:text-slate-100">
                        ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-slate-400 font-normal ml-1">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, parseFloat(percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue vs. Expense Comparison Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                <span>Financial Performance Snapshot</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparison of collected income against operational expenses for the selected timeframe.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                    +
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Total Tuition Collections
                    </div>
                    <div className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                      ${financialSummary.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 rounded-lg text-xs font-bold">
                  Inflow
                </span>
              </div>

              <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/60 text-rose-600 rounded-xl flex items-center justify-center font-bold">
                    -
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-800 dark:text-rose-300">
                      Total Operating Expenses
                    </div>
                    <div className="text-sm font-black text-rose-900 dark:text-rose-100">
                      ${financialSummary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-200 rounded-lg text-xs font-bold">
                  Outflow
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Net Cash Position
                  </div>
                  <div className={`text-lg font-black ${
                    financialSummary.netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {financialSummary.netPosition >= 0 ? '+' : ''}
                    ${financialSummary.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <button
                  onClick={handleExportLedgerCsv}
                  className="px-3.5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Download Summary
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              * Audit trail synchronized with Firestore persistent database.
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Detailed Expense Logs Table */}
      {activeSubTab === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Operating Expense Logs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Showing {filteredExpenses.length} expense items for selected date filter.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[180px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search description, payee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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
            {filteredExpenses.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">No expenses recorded for this period.</p>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Record First Expense
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-3">Category</th>
                    <th className="py-3.5 px-3">Vendor / Payee</th>
                    <th className="py-3.5 px-3">Payment Method</th>
                    <th className="py-3.5 px-3 text-right">Amount</th>
                    <th className="py-3.5 px-4">Logged By</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        <div>{exp.description}</div>
                        {exp.referenceNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {exp.referenceNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-medium">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {exp.vendorPayee}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                        {exp.paymentMethod}
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                        ${exp.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {exp.createdByName || exp.createdBy || 'Staff'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenModal(exp)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              expenseId: exp.id,
                              description: exp.description,
                              amount: exp.amount,
                            })
                          }
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
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

      {/* CREATE / EDIT EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    {editingExpense ? 'Edit Expense Record' : 'Record Operating Expense'}
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

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 overflow-y-auto">
              {/* Date & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Date <span className="text-rose-500">*</span>
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Purpose <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity bill for Labs, Robotics starter kits"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
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
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-rose-600 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method <span className="text-rose-500">*</span>
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

              {/* Vendor / Payee & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor / Payee <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electric Power Co, Office Depot"
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
                    placeholder="e.g. INV-9042, TX-0012"
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
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Expense Record"
        message={`Are you sure you want to delete the expense "${deleteConfirm.description}" ($${deleteConfirm.amount.toFixed(2)})?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteExpense}
        onCancel={() => setDeleteConfirm({ isOpen: false, expenseId: '', description: '', amount: 0 })}
      />
    </div>
  );
};
