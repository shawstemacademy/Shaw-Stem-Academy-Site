import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MinusCircle, 
  PlusCircle, 
  Search, 
  Filter, 
  User, 
  BookOpen, 
  DollarSign, 
  FileText,
  AlertCircle,
  Tag
} from 'lucide-react';
import { AddDropRequest } from '../../types';

interface AdminAddDropManagerProps {
  requests: AddDropRequest[];
  onApprove: (req: AddDropRequest, notes?: string) => void;
  onReject: (req: AddDropRequest, notes?: string) => void;
  studentFilterId?: string;
  studentFilterEmail?: string;
}

export const AdminAddDropManager: React.FC<AdminAddDropManagerProps> = ({
  requests = [],
  onApprove,
  onReject,
  studentFilterId,
  studentFilterEmail,
}) => {
  const [statusTab, setStatusTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewNotes, setReviewNotes] = useState<{ [reqId: string]: string }>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (studentFilterId && r.studentId !== studentFilterId) {
      if (studentFilterEmail && r.studentEmail?.toLowerCase() !== studentFilterEmail.toLowerCase()) {
        return false;
      }
    }

    const matchesStatus = statusTab === 'all' || r.status === statusTab;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      r.studentName?.toLowerCase().includes(term) ||
      r.studentEmail?.toLowerCase().includes(term) ||
      r.classItem?.title?.toLowerCase().includes(term) ||
      r.classItem?.category?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const handleNoteChange = (id: string, note: string) => {
    setReviewNotes((prev) => ({ ...prev, [id]: note }));
  };

  const handleApproveAction = (req: AddDropRequest) => {
    setActionLoadingId(req.id);
    const notes = reviewNotes[req.id] || '';
    onApprove(req, notes);
    setTimeout(() => setActionLoadingId(null), 400);
  };

  const handleRejectAction = (req: AddDropRequest) => {
    setActionLoadingId(req.id);
    const notes = reviewNotes[req.id] || '';
    onReject(req, notes);
    setTimeout(() => setActionLoadingId(null), 400);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 border border-purple-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-500/30">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Registrar & Admissions Review</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Add / Drop Course Requests</h2>
          <p className="text-xs text-purple-200 max-w-xl leading-relaxed">
            Review student requests to drop or add classes. Approved drops deduct the effective discounted tuition price. Approved adds add full list price to tuition.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shrink-0">
          <div className="text-center px-3 border-r border-white/20">
            <div className="text-lg font-black text-amber-400">{pendingCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-300">Pending</div>
          </div>
          <div className="text-center px-3 border-r border-white/20">
            <div className="text-lg font-black text-emerald-400">{approvedCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-300">Approved</div>
          </div>
          <div className="text-center px-3">
            <div className="text-lg font-black text-rose-400">{rejectedCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-300">Rejected</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusTab('pending')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              statusTab === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setStatusTab('approved')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              statusTab === 'approved'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Approved ({approvedCount})</span>
          </button>
          <button
            onClick={() => setStatusTab('rejected')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              statusTab === 'rejected'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Rejected ({rejectedCount})</span>
          </button>
          <button
            onClick={() => setStatusTab('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusTab === 'all'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Requests ({requests.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Add / Drop Requests Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {statusTab === 'pending'
              ? 'There are currently no pending add/drop course requests awaiting administrative review.'
              : `No ${statusTab} add/drop requests match your search criteria.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isDrop = req.type === 'drop';
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border p-5 transition-all space-y-4 shadow-xs ${
                  isPending
                    ? 'border-amber-200 bg-gradient-to-r from-amber-50/30 to-white'
                    : isApproved
                    ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/30 to-white'
                    : 'border-rose-200 bg-gradient-to-r from-rose-50/30 to-white'
                }`}
              >
                {/* Request Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {/* Action Icon Badge */}
                    <div
                      className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${
                        isDrop ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isDrop ? <MinusCircle className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isDrop ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isDrop ? 'Request To Drop' : 'Request To Add'}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          {req.status.toUpperCase()}
                        </span>

                        <span className="text-[11px] text-slate-400 font-medium">
                          Submitted {new Date(req.requestDate).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 mt-1 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {req.studentName} <span className="text-xs text-slate-400 font-semibold">({req.studentEmail})</span>
                      </h3>
                    </div>
                  </div>

                  {/* Financial Delta Badge */}
                  <div
                    className={`px-4 py-2 rounded-2xl border text-right font-black text-xs shrink-0 ${
                      isDrop
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {isDrop ? 'Tuition Deduction' : 'Tuition Addition'}
                    </div>
                    <div className="text-sm">
                      {isDrop ? `-$${req.effectivePrice.toFixed(2)}` : `+$${req.effectivePrice.toFixed(2)}`}
                    </div>
                    {isDrop && req.originalPrice > req.effectivePrice && (
                      <div className="text-[10px] font-medium text-slate-500">
                        (Discounted from ${req.originalPrice.toFixed(2)})
                      </div>
                    )}
                    {!isDrop && (
                      <div className="text-[10px] font-medium text-slate-500">
                        (Full List Price)
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Details */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-slate-900">{req.classItem?.title}</span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">
                        {req.classItem?.category || 'CSEC'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Instructor: {req.classItem?.instructor || 'TBA'} • Schedule: {req.classItem?.schedule || 'Flexible'}
                    </p>
                  </div>

                  <div className="text-right text-[11px] text-slate-600 font-semibold shrink-0">
                    <div>Original Course Price: <strong>${req.originalPrice.toFixed(2)}</strong></div>
                    <div className={isDrop ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {isDrop ? `Effective Drop Price: $${req.effectivePrice.toFixed(2)}` : `Full Add Price: $${req.effectivePrice.toFixed(2)}`}
                    </div>
                  </div>
                </div>

                {/* Student's Reason */}
                {req.reason && (
                  <div className="text-xs text-slate-700 space-y-1 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <span className="font-extrabold text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <FileText className="w-3 h-3 text-amber-600" /> Student Explanation / Reason:
                    </span>
                    <p className="italic text-slate-700 leading-relaxed font-medium">"{req.reason}"</p>
                  </div>
                )}

                {/* Review Notes or Form */}
                {isPending ? (
                  <div className="pt-2 space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">
                        Reviewer Notes / Feedback (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Approved by Office of Registrar. Tuition ledger updated."
                        value={reviewNotes[req.id] || ''}
                        onChange={(e) => handleNoteChange(req.id, e.target.value)}
                        className="w-full px-3.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleRejectAction(req)}
                        disabled={actionLoadingId === req.id}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Decline Request</span>
                      </button>

                      <button
                        onClick={() => handleApproveAction(req)}
                        disabled={actionLoadingId === req.id}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Update Tuition</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 font-medium gap-2">
                    <div>
                      <strong>Reviewed By:</strong> {req.reviewedBy || 'Administrator'} •{' '}
                      {req.reviewedDate ? new Date(req.reviewedDate).toLocaleString() : 'N/A'}
                    </div>
                    {req.reviewNotes && (
                      <div className="italic text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                        Notes: "{req.reviewNotes}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
