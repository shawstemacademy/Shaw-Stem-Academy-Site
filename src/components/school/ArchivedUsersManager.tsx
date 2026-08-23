import React, { useState, useMemo } from 'react';
import {
  Archive,
  Search,
  RotateCcw,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  User,
  Shield,
  GraduationCap,
  Layers,
  Clock,
  ChevronRight,
  X,
  ExternalLink,
  BookOpen,
  Filter,
  ArrowUpDown,
  Loader2,
  Check
} from 'lucide-react';
import { ArchivedUserRecord, SchoolUser, UserRole } from '../../types';

interface ArchivedUsersManagerProps {
  archivedUsers: ArchivedUserRecord[];
  onRestoreUser: (deletionId: string, notes?: string) => Promise<boolean>;
  onPurgeArchiveRecord?: (deletionId: string) => Promise<boolean>;
  isLoading?: boolean;
}

export const ArchivedUsersManager: React.FC<ArchivedUsersManagerProps> = ({
  archivedUsers = [],
  onRestoreUser,
  onPurgeArchiveRecord,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<ArchivedUserRecord | null>(null);
  const [inspectTab, setInspectTab] = useState<'overview' | 'registrations' | 'enrollments' | 'add_drop' | 'decisions' | 'attendance' | 'teacher_data'>('overview');
  
  // Restoration state
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreNotes, setRestoreNotes] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  // Purge state
  const [isPurging, setIsPurging] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // Filtered archived users
  const filteredUsers = useMemo(() => {
    return archivedUsers.filter((record) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (record.userName || '').toLowerCase().includes(q) ||
        (record.userEmail || '').toLowerCase().includes(q) ||
        (record.deletionId || '').toLowerCase().includes(q) ||
        (record.originalUserId || '').toLowerCase().includes(q) ||
        (record.originalStudentId || '').toLowerCase().includes(q) ||
        (record.deletionReason || '').toLowerCase().includes(q);

      const matchRole =
        roleFilter === 'all' ||
        record.userRole === roleFilter ||
        (roleFilter === 'student' && (record.userRole === 'student' || record.userRole === 'student_applicant')) ||
        (roleFilter === 'staff' && record.userRole !== 'student' && record.userRole !== 'student_applicant');

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'deleted' && record.activeDataStatus !== 'RESTORED') ||
        (statusFilter === 'restored' && record.activeDataStatus === 'RESTORED');

      return matchQuery && matchRole && matchStatus;
    });
  }, [archivedUsers, searchQuery, roleFilter, statusFilter]);

  // Statistics overview
  const stats = useMemo(() => {
    const total = archivedUsers.length;
    const students = archivedUsers.filter((u) => u.userRole === 'student' || u.userRole === 'student_applicant').length;
    const staff = total - students;
    const restored = archivedUsers.filter((u) => u.activeDataStatus === 'RESTORED').length;
    const totalPreservedTuition = archivedUsers.reduce(
      (sum, u) => sum + (u.financialSummary?.totalTuition || 0),
      0
    );
    const totalPreservedPaid = archivedUsers.reduce(
      (sum, u) => sum + (u.financialSummary?.totalPaid || 0),
      0
    );

    return { total, students, staff, restored, totalPreservedTuition, totalPreservedPaid };
  }, [archivedUsers]);

  const handleExportJSON = (record: ArchivedUserRecord) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `archive_${record.deletionId}_${record.userName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExecuteRestore = async () => {
    if (!selectedRecord) return;
    setIsRestoring(true);
    try {
      const success = await onRestoreUser(selectedRecord.deletionId, restoreNotes);
      if (success) {
        setRestoreSuccessMsg(`User ${selectedRecord.userName} has been successfully restored to active status.`);
        setShowRestoreConfirm(false);
        setRestoreNotes('');
        // Update local selected record view
        setSelectedRecord((prev) =>
          prev ? { ...prev, activeDataStatus: 'RESTORED', restoredAt: new Date().toISOString() } : null
        );
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExecutePurge = async () => {
    if (!selectedRecord || !onPurgeArchiveRecord) return;
    setIsPurging(true);
    try {
      const success = await onPurgeArchiveRecord(selectedRecord.deletionId);
      if (success) {
        setShowPurgeConfirm(false);
        setSelectedRecord(null);
      }
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-extrabold uppercase tracking-wider border border-rose-500/30">
            <Archive className="w-3.5 h-3.5" />
            <span>Data Archival & Compliance Repository</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Archived Users & Cascade Scrubbed Records
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            When users or students are deleted, all related registrations, course enrollments, attendance, and decisions are safely archived here before live records are scrubbed. Preserved financial metrics remain intact for accounting integrity.
          </p>
        </div>

        {/* Global Stats Counter */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-800/90 border border-slate-700 px-4 py-3 rounded-2xl text-center">
            <div className="text-2xl font-black text-white">{stats.total}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Archives</div>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 px-4 py-3 rounded-2xl text-center">
            <div className="text-2xl font-black text-emerald-400">
              ${stats.totalPreservedTuition.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preserved Ledger</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Archived Students</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">{stats.students}</div>
          <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Learner profiles scrubbed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Archived Staff</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">{stats.staff}</div>
          <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Teachers & administrators</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Restored Accounts</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 mt-2">{stats.restored}</div>
          <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Safely recovered to active</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Financial Collected</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            ${stats.totalPreservedPaid.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Historical payments intact</div>
        </div>
      </div>

      {/* Search & Filtering Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student/user name, email, student ID, deletion ID, or reason..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Roles ({archivedUsers.length})</option>
              <option value="student">Students ({stats.students})</option>
              <option value="staff">Staff & Faculty ({stats.staff})</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Archive Status</option>
              <option value="deleted">Active Archive ({archivedUsers.length - stats.restored})</option>
              <option value="restored">Restored ({stats.restored})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Archive Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Archive className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Archived User Records Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'No archived user records matched your search or filter criteria.'
                : 'Deleted users and their scrubbed records will automatically appear here for administrative audit and restoration.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Archived User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Deletion Audit</th>
                  <th className="py-3.5 px-4">Scrubbed Records</th>
                  <th className="py-3.5 px-4">Preserved Tuition</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((record) => {
                  const isRestored = record.activeDataStatus === 'RESTORED';
                  const totalScrubbed = record.recordsArchivedSummary?.totalRecords || 0;
                  const tuition = record.financialSummary?.totalTuition || 0;

                  return (
                    <tr key={record.deletionId || record.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Archived User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {record.userName ? record.userName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{record.userName}</span>
                              {record.originalStudentId && (
                                <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  {record.originalStudentId}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{record.userEmail}</div>
                            <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                              ID: {record.deletionId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                            record.userRole === 'student' || record.userRole === 'student_applicant'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : record.userRole === 'teacher'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {record.userRole === 'student' ? (
                            <GraduationCap className="w-3 h-3" />
                          ) : (
                            <Shield className="w-3 h-3" />
                          )}
                          <span className="capitalize">{record.userRole}</span>
                        </span>
                      </td>

                      {/* Deletion Audit */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="text-slate-800 font-semibold flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {record.deletedAt
                                ? new Date(record.deletedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium truncate max-w-xs">
                            By: <strong>{record.deletedByName || record.deletedBy || 'Admin'}</strong>
                          </div>
                          <div className="text-[10px] text-slate-600 italic truncate max-w-xs" title={record.deletionReason}>
                            "{record.deletionReason || 'Administrative Deletion'}"
                          </div>
                        </div>
                      </td>

                      {/* Scrubbed Records */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1 font-extrabold text-slate-800 text-[11px]">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span>{totalScrubbed} items archived</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex flex-wrap gap-1">
                            {record.recordsArchivedSummary?.registrations > 0 && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                                {record.recordsArchivedSummary.registrations} Regs
                              </span>
                            )}
                            {record.recordsArchivedSummary?.enrollments > 0 && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                                {record.recordsArchivedSummary.enrollments} Enr
                              </span>
                            )}
                            {record.recordsArchivedSummary?.attendanceRecords > 0 && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                                {record.recordsArchivedSummary.attendanceRecords} Att
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Preserved Tuition */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-slate-900 text-xs">
                            ${tuition.toFixed(2)}
                          </div>
                          {record.financialSummary?.totalPaid > 0 && (
                            <div className="text-[10px] font-semibold text-emerald-600">
                              Paid: ${record.financialSummary.totalPaid.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isRestored ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Restored
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[10px]">
                            <Archive className="w-3 h-3" />
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setInspectTab('overview');
                              setRestoreSuccessMsg(null);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            title="Inspect complete snapshot and relationships"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          <button
                            onClick={() => handleExportJSON(record)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Download full JSON archive payload"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECTION & RESTORATION MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setSelectedRecord(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white font-black text-lg flex items-center justify-center border border-slate-700 shrink-0">
                    {selectedRecord.userName ? selectedRecord.userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{selectedRecord.userName}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {selectedRecord.userRole}
                      </span>
                      {selectedRecord.activeDataStatus === 'RESTORED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active Restored
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedRecord.userEmail}</p>
                  </div>
                </div>

                {/* Top Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportJSON(selectedRecord)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </button>

                  {selectedRecord.activeDataStatus !== 'RESTORED' && (
                    <button
                      onClick={() => setShowRestoreConfirm(true)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore User Account</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Success Banner */}
            {restoreSuccessMsg && (
              <div className="bg-emerald-50 border-b border-emerald-200 p-3 px-6 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{restoreSuccessMsg}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-slate-50 overflow-x-auto">
              <button
                onClick={() => setInspectTab('overview')}
                className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  inspectTab === 'overview'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Archival Overview & Audit
              </button>

              <button
                onClick={() => setInspectTab('registrations')}
                className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  inspectTab === 'registrations'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Registrations & Financials ({(selectedRecord.registrations || []).length})
              </button>

              <button
                onClick={() => setInspectTab('enrollments')}
                className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  inspectTab === 'enrollments'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Class Enrollments ({(selectedRecord.enrollments || []).length})
              </button>

              <button
                onClick={() => setInspectTab('add_drop')}
                className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  inspectTab === 'add_drop'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Add / Drop Requests ({(selectedRecord.addDropRequests || []).length})
              </button>

              <button
                onClick={() => setInspectTab('decisions')}
                className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  inspectTab === 'decisions'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Decisions & Denials ({(selectedRecord.admissionDecisions || []).length + (selectedRecord.denialReasons || []).length})
              </button>

              <button
                onClick={() => setInspectTab('attendance')}
                className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  inspectTab === 'attendance'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Attendance Records ({(selectedRecord.attendanceRecords || []).length})
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: OVERVIEW */}
              {inspectTab === 'overview' && (
                <div className="space-y-6">
                  {/* Audit Trail Card */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Cascade Deletion Audit Log</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Deletion ID</span>
                        <span className="font-mono font-bold text-slate-800">{selectedRecord.deletionId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Deleted At</span>
                        <span className="font-bold text-slate-800">
                          {selectedRecord.deletedAt ? new Date(selectedRecord.deletedAt).toLocaleString('en-US') : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Deleted By</span>
                        <span className="font-bold text-slate-800">
                          {selectedRecord.deletedByName || selectedRecord.deletedBy || 'System Administrator'}
                        </span>
                      </div>
                      <div className="sm:col-span-2 md:col-span-3">
                        <span className="text-slate-400 font-semibold block text-[11px]">Administrative Reason</span>
                        <span className="font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 block mt-1">
                          {selectedRecord.deletionReason || 'Administrative Deletion'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary Preservation */}
                  <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200/80 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Preserved Financial Ledger Summary</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Total Tuition</span>
                        <span className="text-base font-black text-slate-900">
                          ${(selectedRecord.financialSummary?.totalTuition || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Total Paid</span>
                        <span className="text-base font-black text-emerald-600">
                          ${(selectedRecord.financialSummary?.totalPaid || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Remaining Balance</span>
                        <span className="text-base font-black text-slate-700">
                          ${(selectedRecord.financialSummary?.remainingBalance || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Logged Payments</span>
                        <span className="text-base font-black text-blue-600">
                          {selectedRecord.financialSummary?.paymentCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scrubbed Data Manifest */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Scrubbed Collections Breakdown
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {Object.entries(selectedRecord.recordsArchivedSummary || {}).map(([key, count]) => {
                        if (key === 'totalRecords') return null;
                        return (
                          <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="text-slate-600 font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {Number(count)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REGISTRATIONS & FINANCIALS */}
              {inspectTab === 'registrations' && (
                <div className="space-y-4">
                  {(selectedRecord.registrations || []).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                      No registration records associated with this archived user.
                    </div>
                  ) : (
                    (selectedRecord.registrations || []).map((reg, idx) => (
                      <div key={reg.id || idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="font-extrabold text-slate-900 flex items-center gap-2">
                            <span>Registration #{reg.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              reg.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {reg.isPaid ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                          <span className="font-extrabold text-sm text-slate-900">
                            ${Number(reg.totalPrice || reg.subtotal || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Selected Classes */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Enrolled Classes:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(reg.selectedClasses || []).map((c: any, cIdx: number) => (
                              <span key={cIdx} className="bg-white px-2 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-700">
                                {c.title} (${Number(c.price || 0)})
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Student Details */}
                        {reg.studentInfo && (
                          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                            <div>Parent: <strong>{reg.studentInfo.parentName || 'N/A'}</strong></div>
                            <div>Email: <strong>{reg.studentInfo.parentEmail || reg.studentInfo.email || 'N/A'}</strong></div>
                            <div>Grade: <strong>{reg.studentInfo.gradeLevel || 'N/A'}</strong></div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: ENROLLMENTS */}
              {inspectTab === 'enrollments' && (
                <div className="space-y-3">
                  {(selectedRecord.enrollments || []).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                      No standalone enrollment records associated with this archived user.
                    </div>
                  ) : (
                    (selectedRecord.enrollments || []).map((enr, idx) => (
                      <div key={enr.id || idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{enr.classTitle || enr.className || `Class ID: ${enr.classId}`}</div>
                          <div className="text-[11px] text-slate-500">Student: {enr.studentName} ({enr.studentEmail})</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                          {enr.status || 'Enrolled'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: ADD / DROP REQUESTS */}
              {inspectTab === 'add_drop' && (
                <div className="space-y-3">
                  {(selectedRecord.addDropRequests || []).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                      No add/drop requests associated with this archived user.
                    </div>
                  ) : (
                    (selectedRecord.addDropRequests || []).map((req, idx) => (
                      <div key={req.id || idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-900">{req.classTitle} ({req.requestType?.toUpperCase()})</div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">Reason: "{req.reason || 'No reason specified'}"</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: ADMISSION DECISIONS & DENIAL REASONS */}
              {inspectTab === 'decisions' && (
                <div className="space-y-3">
                  {(selectedRecord.admissionDecisions || []).length === 0 && (selectedRecord.denialReasons || []).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                      No admission decisions or denial reasons associated with this archived user.
                    </div>
                  ) : (
                    <>
                      {(selectedRecord.admissionDecisions || []).map((dec, idx) => (
                        <div key={dec.id || idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">Decision for {dec.studentName || dec.studentEmail}</span>
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase">
                              {dec.decision}
                            </span>
                          </div>
                          {dec.feedback && <div className="text-[11px] text-slate-600">Feedback: {dec.feedback}</div>}
                        </div>
                      ))}

                      {(selectedRecord.denialReasons || []).map((den, idx) => (
                        <div key={den.id || idx} className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 space-y-1 text-xs">
                          <div className="font-bold text-rose-900">Denial Log #{den.id}</div>
                          <div className="text-[11px] text-rose-800">Reason: {den.reason || 'Administrative denial'}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* TAB 6: ATTENDANCE RECORDS */}
              {inspectTab === 'attendance' && (
                <div className="space-y-2">
                  {(selectedRecord.attendanceRecords || []).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                      No attendance records associated with this archived user.
                    </div>
                  ) : (
                    (selectedRecord.attendanceRecords || []).map((att, idx) => (
                      <div key={att.id || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{att.className || `Class: ${att.classId}`}</div>
                          <div className="text-[11px] text-slate-500">Date: {att.date || att.timestamp}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          att.status === 'present' ? 'bg-emerald-100 text-emerald-800' : att.status === 'absent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {att.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Archived via Firebase Cascade Engine (v1.0)
              </span>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      {showRestoreConfirm && selectedRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Restore User Account?</h3>
                <p className="text-xs text-slate-500">
                  This will re-insert <strong>{selectedRecord.userName}</strong> and all associated registrations, enrollments, decisions, and attendance records back into active Firestore collections.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Restoration Note (Optional)
              </label>
              <textarea
                value={restoreNotes}
                onChange={(e) => setRestoreNotes(e.target.value)}
                placeholder="e.g. Account reinstated by administrative request..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Restoring Records...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Restore</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
