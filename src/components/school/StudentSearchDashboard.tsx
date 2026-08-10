import React, { useState, useRef } from 'react';
import { 
  Search, 
  User, 
  DollarSign, 
  BookOpen, 
  Upload, 
  Plus, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Award, 
  UserCheck, 
  RefreshCw, 
  ChevronRight, 
  Info, 
  UserPlus, 
  Users,
  Percent,
  TrendingUp,
  CreditCard,
  FileCheck2,
  AlertTriangle,
  Clock,
  Trash2
} from 'lucide-react';
import { SchoolUser, RegistrationRecord, ClassItem, AppliedDiscount } from '../../types';
import { saveDocToFirestore } from '../../lib/firebase';

interface StudentSearchDashboardProps {
  users: SchoolUser[];
  registrationLogs: RegistrationRecord[];
  onUpdateRegistration: (updated: RegistrationRecord) => void;
  classList: ClassItem[];
  theme: any;
  onUpdateUser?: (user: SchoolUser) => void;
  onDeleteUser?: (userId: string) => void;
}

export const StudentSearchDashboard: React.FC<StudentSearchDashboardProps> = ({
  users = [],
  registrationLogs = [],
  onUpdateRegistration,
  classList = [],
  theme,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'classes' | 'grades'>('info');
  
  // Payment Form States
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');
  
  // Grade Form States (Manual Backup)
  const [manualAssignment, setManualAssignment] = useState('');
  const [manualGrade, setManualGrade] = useState('');
  const [manualScore, setManualScore] = useState('');
  
  // Grade Upload Feedback
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get only students
  const students = users.filter((u) => u.role === 'student');

  // Filter students based on search
  const filteredStudents = students.filter((s) => {
    const nameMatch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || emailMatch;
  });

  // Find active student details
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Get matching registrations for selected student
  const studentRegistrations = registrationLogs.filter(
    (r) => r.studentInfo?.email?.toLowerCase() === selectedStudent?.email?.toLowerCase() || 
           (r.studentInfo?.firstName && selectedStudent?.name && 
            selectedStudent.name.toLowerCase().includes(r.studentInfo.firstName.toLowerCase()))
  );

  // Use the most recent registration for pricing and course details
  const currentRegistration = studentRegistrations[0];

  // Derive courses and payment stats
  const totalTuition = currentRegistration ? currentRegistration.totalPrice : 0;
  const appliedClasses = currentRegistration ? currentRegistration.selectedClasses || [] : [];
  const payments = currentRegistration?.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const verifiedClassIds = currentRegistration?.verifiedClassIds || [];

  // Determine pricing status based on user rules
  // "the paid tag shouldnt move until all courses have been paid for, if partial payment is made then set them as partial payment."
  let paymentStatus: 'Unpaid' | 'Partial Payment' | 'Fully Paid' = 'Unpaid';
  if (totalPaid > 0) {
    if (totalPaid >= totalTuition && totalTuition > 0) {
      paymentStatus = 'Fully Paid';
    } else {
      paymentStatus = 'Partial Payment';
    }
  }

  // Cost per class inclusive of discount (proportional)
  // totalPrice / totalClasses = discounted average price per class
  const classCount = appliedClasses.length;
  const averageClassCost = classCount > 0 ? totalTuition / classCount : 0;

  // Maximum courses they paid enough to cover:
  const coursesCoveredByPayment = averageClassCost > 0 ? Math.floor(totalPaid / averageClassCost) : 0;

  // Handle Recording a New Payment
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRegistration) {
      alert('This student has not submitted any class registrations yet. Please register for classes first.');
      return;
    }
    
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount greater than 0.');
      return;
    }

    const newPayment = {
      id: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      amount: amt,
      timestamp: new Date().toISOString(),
      notes: paymentNote.trim() || 'General Tuition Payment',
    };

    const updatedPayments = [...payments, newPayment];
    const newTotalPaid = totalPaid + amt;
    
    // Auto-resolve paid flags and status
    const allPaid = newTotalPaid >= totalTuition;
    const isPartial = newTotalPaid > 0 && !allPaid;

    const updatedReg: RegistrationRecord = {
      ...currentRegistration,
      payments: updatedPayments,
      isPaid: allPaid,
      status: allPaid ? 'completed' : isPartial ? 'partial_payment' : 'pending_review',
    };

    if (allPaid && selectedStudent) {
      saveDocToFirestore('schoolUsers', selectedStudent.id, {
        ...selectedStudent,
        status: 'enrolled_paid'
      });
    }

    onUpdateRegistration(updatedReg);
    setPaymentAmount('');
    setPaymentNote('');
  };

  // Toggle Verification of a Particular Course
  const handleToggleCourseVerification = (classId: string) => {
    if (!currentRegistration) return;

    let nextVerified: string[];
    if (verifiedClassIds.includes(classId)) {
      // Unverifying is always allowed
      nextVerified = verifiedClassIds.filter((id) => id !== classId);
    } else {
      // Verifying a new class is allowed ONLY if the student has paid for enough classes to cover it
      if (verifiedClassIds.length >= coursesCoveredByPayment) {
        alert(`Cannot verify more than ${coursesCoveredByPayment} courses. The student's current total payment ($${totalPaid}) only covers up to ${coursesCoveredByPayment} classes (at an average discounted cost of $${averageClassCost.toFixed(2)} each). Please log another payment first.`);
        return;
      }
      nextVerified = [...verifiedClassIds, classId];
    }

    const updatedReg: RegistrationRecord = {
      ...currentRegistration,
      verifiedClassIds: nextVerified,
    };

    onUpdateRegistration(updatedReg);
  };

  // Verify all possible courses that are paid for
  const handleAutoVerifyAllPaidCourses = () => {
    if (!currentRegistration) return;
    const allowedCount = Math.min(coursesCoveredByPayment, appliedClasses.length);
    const nextVerified = appliedClasses.slice(0, allowedCount).map(c => c.id);

    const updatedReg: RegistrationRecord = {
      ...currentRegistration,
      verifiedClassIds: nextVerified,
    };

    onUpdateRegistration(updatedReg);
  };

  // Handle Manual Grade Submission
  const handleAddManualGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRegistration) {
      alert('Student has no registration records to attach grades to.');
      return;
    }
    if (!manualAssignment.trim()) {
      alert('Please enter an assignment or test name.');
      return;
    }

    const newGradeItem = {
      assignmentName: manualAssignment.trim(),
      grade: manualGrade.trim() || 'A',
      score: manualScore.trim() || '100/100',
      updatedAt: new Date().toISOString(),
    };

    const currentGrades = currentRegistration.grades || [];
    const updatedReg: RegistrationRecord = {
      ...currentRegistration,
      grades: [...currentGrades, newGradeItem],
    };

    onUpdateRegistration(updatedReg);
    setManualAssignment('');
    setManualGrade('');
    setManualScore('');
  };

  // Delete a grade record
  const handleDeleteGrade = (index: number) => {
    if (!currentRegistration) return;
    const currentGrades = [...(currentRegistration.grades || [])];
    currentGrades.splice(index, 1);

    const updatedReg: RegistrationRecord = {
      ...currentRegistration,
      grades: currentGrades,
    };
    onUpdateRegistration(updatedReg);
  };

  // Parse Google Classroom Grade CSV Export
  const handleGradeCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error('Empty CSV file.');
        }

        // Parse CSV lines
        const lines = text.split(/\r?\n/).map(line => {
          // simple CSV splitter taking quotes into account
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          return matches.map(cell => cell.replace(/^"|"$/g, '').trim());
        }).filter(line => line.length > 0 && line.some(cell => cell !== ''));

        if (lines.length < 2) {
          throw new Error('CSV must have a header row and at least one student row.');
        }

        const headers = lines[0];
        
        // Find indices
        const emailIdx = headers.findIndex(h => h.toLowerCase().includes('email'));
        const firstNameIdx = headers.findIndex(h => h.toLowerCase().includes('first name') || h.toLowerCase() === 'first');
        const lastNameIdx = headers.findIndex(h => h.toLowerCase().includes('last name') || h.toLowerCase() === 'last');
        
        // Find indices of columns that represent assignments (usually everything except names/emails)
        const nonAssignmentIndices = [emailIdx, firstNameIdx, lastNameIdx].filter(i => i !== -1);
        const assignmentCols = headers.map((name, idx) => ({ name, idx }))
          .filter(item => !nonAssignmentIndices.includes(item.idx) && item.name.length > 0);

        if (assignmentCols.length === 0) {
          throw new Error('No assignments or grading columns detected in the CSV headers.');
        }

        let matchCount = 0;
        let gradeCount = 0;

        // Clone current registration logs to find matches
        const updatedLogs = [...registrationLogs];

        // Process student rows
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          const rowEmail = emailIdx !== -1 ? row[emailIdx] : '';
          const rowFirstName = firstNameIdx !== -1 ? row[firstNameIdx] : '';
          const rowLastName = lastNameIdx !== -1 ? row[lastNameIdx] : '';
          const fullName = `${rowFirstName} ${rowLastName}`.trim();

          // Search registration logs for a student matches
          const matchedRegIdx = updatedLogs.findIndex(reg => {
            const regEmail = (reg.studentInfo?.email || '').toLowerCase();
            const regName = (reg.studentInfo?.studentName || '').toLowerCase();
            const regFirst = (reg.studentInfo?.firstName || '').toLowerCase();
            const regLast = (reg.studentInfo?.lastName || '').toLowerCase();

            if (rowEmail && regEmail === rowEmail.toLowerCase()) return true;
            if (fullName && regName.includes(fullName.toLowerCase())) return true;
            if (rowFirstName && regFirst === rowFirstName.toLowerCase() && rowLastName && regLast === rowLastName.toLowerCase()) return true;
            return false;
          });

          if (matchedRegIdx !== -1) {
            matchCount++;
            const reg = updatedLogs[matchedRegIdx];
            const currentGrades = reg.grades || [];

            // Add assignments from this row
            const newGrades = [...currentGrades];
            assignmentCols.forEach(col => {
              const gradeVal = row[col.idx];
              if (gradeVal && gradeVal !== '' && gradeVal !== '-') {
                gradeCount++;
                // If assignment already exists, update it, otherwise push
                const existingIdx = newGrades.findIndex(g => g.assignmentName === col.name);
                const gradeItem = {
                  assignmentName: col.name,
                  grade: parseFloat(gradeVal) >= 90 ? 'A' : parseFloat(gradeVal) >= 80 ? 'B' : parseFloat(gradeVal) >= 70 ? 'C' : 'Pass',
                  score: gradeVal.includes('/') ? gradeVal : `${gradeVal}/100`,
                  updatedAt: new Date().toISOString(),
                };

                if (existingIdx !== -1) {
                  newGrades[existingIdx] = gradeItem;
                } else {
                  newGrades.push(gradeItem);
                }
              }
            });

            // Update registration with grades
            const updatedReg = { ...reg, grades: newGrades };
            updatedLogs[matchedRegIdx] = updatedReg;
            onUpdateRegistration(updatedReg);
          }
        }

        setUploadStatus({
          type: 'success',
          message: `Successfully parsed Google Classroom export! Matched ${matchCount} students and imported ${gradeCount} grades.`,
        });

      } catch (err: any) {
        setUploadStatus({
          type: 'error',
          message: `Failed to parse CSV: ${err.message || 'Check CSV structure and matching columns.'}`,
        });
      }
    };

    reader.readAsText(file);
    // Reset file input value
    if (e.target) e.target.value = '';
  };

  // Mock template generator for simple simulation
  const handleCopySampleCSV = () => {
    const csvContent = `First Name,Last Name,Email Address,STEM Capstone Project,Robotics Lab 1,Midterm Test
Alex,Morgan,alex.morgan@student.edu,95,88,92
Jordan,Lee,jordan.lee@gmail.com,84,90,85
Leo,Sterling,leo.sterling@gmail.com,90,92,89`;

    navigator.clipboard.writeText(csvContent);
    alert('Google Classroom style CSV template copied to clipboard! Paste it into a text file, save it as "grades.csv", and upload it.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 p-1 rounded-3xl" id="student-search-root">
      {/* Left Sidebar: Student Directory Search */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col h-[700px]">
        <div className="space-y-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Student Directory</h2>
          </div>
          <p className="text-xs text-slate-500">
            Search for registered students, verify course tuitions, and upload Classroom grades.
          </p>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Directory List */}
        <div className="flex-grow overflow-y-auto pt-4 space-y-2 pr-1">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400">No students matched "{searchTerm}"</p>
            </div>
          ) : (
            filteredStudents.map((s) => {
              const reg = registrationLogs.filter(
                (r) => r.studentInfo?.email?.toLowerCase() === s.email?.toLowerCase() || 
                       (r.studentInfo?.firstName && s.name && 
                        s.name.toLowerCase().includes(r.studentInfo.firstName.toLowerCase()))
              )[0];

              const isPendingReview = reg && (!reg.payments || reg.payments.length === 0);
              const isVerified = reg && reg.verifiedClassIds && reg.verifiedClassIds.length > 0;
              const hasPartial = reg && reg.payments && reg.payments.reduce((sum, p) => sum + p.amount, 0) > 0 && reg.payments.reduce((sum, p) => sum + p.amount, 0) < reg.totalPrice;
              const hasFullyPaid = reg && reg.payments && reg.payments.reduce((sum, p) => sum + p.amount, 0) >= reg.totalPrice;

              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    setActiveTab('info');
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                    selectedStudentId === s.id
                      ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img
                        src={s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={s.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      {isPendingReview && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white animate-pulse" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                        {s.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{s.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {/* Verification Status */}
                    {isPendingReview ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-extrabold">
                        PENDING REVIEW
                      </span>
                    ) : isVerified ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold">
                        VERIFIED ({reg?.verifiedClassIds?.length})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold">
                        NO CLASSES
                      </span>
                    )}

                    {/* Paid status tag */}
                    {hasFullyPaid ? (
                      <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 text-[9px] font-extrabold">
                        FULLY PAID
                      </span>
                    ) : hasPartial ? (
                      <span className="px-1.5 py-0.2 rounded-md bg-orange-100 text-orange-700 text-[9px] font-extrabold">
                        PARTIAL PAID
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-400 text-[9px] font-bold">
                        UNPAID
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Detailed Student Data Workspace */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col h-[700px] overflow-y-auto">
        {!selectedStudent ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No Student Selected</h3>
              <p className="text-sm text-slate-400 max-w-md">
                Select a student from the left directory to inspect their application review, record manual tuition payments, or import grades.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <img
                  src={selectedStudent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={selectedStudent.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">{selectedStudent.name}</h2>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                      Student Account
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedStudent.status === 'accepted' || selectedStudent.status === 'enrolled_paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedStudent.status === 'pending_verification'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : selectedStudent.status === 'awaiting_acceptance'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedStudent.status ? selectedStudent.status.replace('_', ' ') : 'PROSPECTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                </div>
              </div>

              {/* Action Tabs and Account Actions */}
              <div className="flex flex-col items-end gap-2 self-start md:self-auto">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to ${selectedStudent.status === 'disabled' ? 'enable' : 'disable'} this student account?`)) {
                        if (onUpdateUser) {
                          onUpdateUser({
                            ...selectedStudent,
                            status: selectedStudent.status === 'disabled' ? 'active' : 'disabled'
                          });
                        }
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                      selectedStudent.status === 'disabled'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {selectedStudent.status === 'disabled' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {selectedStudent.status === 'disabled' ? 'Enable Account' : 'Disable Account'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to permanently delete this student account? This cannot be undone.')) {
                        if (onDeleteUser) {
                          onDeleteUser(selectedStudent.id);
                          setSelectedStudentId(null);
                        }
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Account
                  </button>
                </div>
                <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'info'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Review Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('financial')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'financial'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Financial & Tuition
                  </button>
                  <button
                    onClick={() => setActiveTab('classes')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'classes'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Course Status
                  </button>
                  <button
                    onClick={() => setActiveTab('grades')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'grades'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    Grades & Classrooms
                  </button>
                </div>
              </div>
            </div>

            {/* TAB CONTENT 1: Info & Profile Review */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-blue-950">Pre-Enrollment Identity Review</h4>
                    <p className="text-[11px] text-blue-800/90 leading-relaxed">
                      Please review the student's background details and parent credentials below. Once verified, move to the <span className="font-bold">Financial & Tuition</span> tab to record the enrollment fee and release classes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Details */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <User className="w-4 h-4 text-slate-500" />
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Student Details</h3>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Full Name</span>
                        <span className="font-bold text-slate-800">{currentRegistration?.studentInfo?.studentName || selectedStudent.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Form Grade</span>
                        <span className="font-bold text-slate-800">{currentRegistration?.studentInfo?.formGrade || 'Grade 9'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Primary School</span>
                        <span className="font-bold text-slate-800 truncate max-w-[180px]">{currentRegistration?.studentInfo?.currentSchool || 'Shaw STEM Prep'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Date of Birth</span>
                        <span className="font-bold text-slate-800">{currentRegistration?.studentInfo?.dateOfBirth || '2011-04-12'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Contact Number</span>
                        <span className="font-bold text-slate-800">{currentRegistration?.studentInfo?.cellPhone || '876-555-0199'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Parent / Guardian Information */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <Users className="w-4 h-4 text-slate-500" />
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Parent & Guardian Contacts</h3>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Parent Name</span>
                        <span className="font-bold text-slate-800">
                          {currentRegistration?.studentInfo?.parentName || 
                           `${currentRegistration?.studentInfo?.motherFirstName || ''} ${currentRegistration?.studentInfo?.motherLastName || ''}`.trim() || 
                           'A. Morgan'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Parent Email</span>
                        <span className="font-bold text-slate-800 truncate max-w-[180px]">{currentRegistration?.studentInfo?.parentEmail || 'morgan.parent@gmail.com'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Parent Phone</span>
                        <span className="font-bold text-slate-800">{currentRegistration?.studentInfo?.parentPhone || '876-555-4422'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Home Address</span>
                        <span className="font-bold text-slate-800 truncate max-w-[160px]">{currentRegistration?.studentInfo?.address || '10 Hope Road, Kingston'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Lives With</span>
                        <span className="font-bold text-slate-800">{currentRegistration?.studentInfo?.livesWith || 'Parent'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Checkmark Controls */}
                <div className="border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">Account Application Actions</h4>
                    <p className="text-xs text-slate-400">
                      Toggle student profile assessment. Approving here confirms records are true.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (selectedStudent) {
                          const updatedUser = {
                            ...selectedStudent,
                            status: 'accepted' as const
                          };
                          saveDocToFirestore('schoolUsers', selectedStudent.id, updatedUser);
                          if (onUpdateUser) {
                            onUpdateUser(updatedUser);
                          }
                        }
                        if (currentRegistration) {
                          const updatedReg = { ...currentRegistration, status: 'completed' as const };
                          onUpdateRegistration(updatedReg);
                        }
                        alert(`Student application for ${selectedStudent?.name || 'student'} approved! Status set to ACCEPTED.`);
                      }}
                      className={`px-4 py-2 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 ${
                        (selectedStudent?.status === 'accepted' || selectedStudent?.status === 'enrolled_paid')
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600'
                          : 'bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 hover:border-emerald-300'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {(selectedStudent?.status === 'accepted' || selectedStudent?.status === 'enrolled_paid')
                          ? 'Approved & Accepted'
                          : 'Approve & Accept Student'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (selectedStudent) {
                          const updatedUser = {
                            ...selectedStudent,
                            status: 'awaiting_acceptance' as const
                          };
                          saveDocToFirestore('schoolUsers', selectedStudent.id, updatedUser);
                          if (onUpdateUser) {
                            onUpdateUser(updatedUser);
                          }
                        }
                        if (currentRegistration) {
                          const updatedReg = { ...currentRegistration, status: 'rejected' as const };
                          onUpdateRegistration(updatedReg);
                        }
                        alert('Student application is set to Awaiting Acceptance / Hold.');
                      }}
                      className={`px-4 py-2 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border ${
                        selectedStudent?.status === 'awaiting_acceptance'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                          : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>
                        {selectedStudent?.status === 'awaiting_acceptance'
                          ? 'Application on Hold'
                          : 'Put on Hold'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Financial Ledger & Tuition Coverage Verification */}
            {activeTab === 'financial' && (
              <div className="space-y-6">
                {!currentRegistration ? (
                  <div className="text-center py-16 space-y-4 border border-dashed border-slate-200 rounded-2xl">
                    <DollarSign className="w-12 h-12 text-slate-300 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">No Tuitions Owed</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        This student account is active but has no completed class registration logs. Tuitions and course receipts can be managed once they apply for classes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-1 text-center sm:text-left">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Price Due</span>
                        <div className="text-xl font-black text-slate-900">${totalTuition.toFixed(2)}</div>
                        <span className="text-[9px] text-slate-500 block">Inclusive of bundle discount</span>
                      </div>

                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-1 text-center sm:text-left">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Paid</span>
                        <div className="text-xl font-black text-blue-600">${totalPaid.toFixed(2)}</div>
                        <span className="text-[9px] text-slate-500 block">Sum of recorded receipts</span>
                      </div>

                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-1 text-center sm:text-left">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Remaining Due</span>
                        <div className="text-xl font-black text-rose-600">
                          ${Math.max(0, totalTuition - totalPaid).toFixed(2)}
                        </div>
                        <span className="text-[9px] text-slate-500 block">Remaining tuition debt</span>
                      </div>

                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col items-center justify-center space-y-1.5 text-center">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Payment Status</span>
                        {paymentStatus === 'Fully Paid' ? (
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-black tracking-wide uppercase">
                            FULLY PAID
                          </span>
                        ) : paymentStatus === 'Partial Payment' ? (
                          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-black tracking-wide uppercase">
                            PARTIAL PAID
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-black tracking-wide uppercase">
                            UNPAID
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Proportional Billing Metrics Info */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-slate-800">Proportional Class Coverage Metrics</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Applying discounts, the individual cost is <strong className="text-slate-800">${averageClassCost.toFixed(2)}</strong> per course. Currently, payments cover <strong className="text-blue-600">{coursesCoveredByPayment}</strong> of {classCount} class(es).
                        </p>
                      </div>

                      {coursesCoveredByPayment > verifiedClassIds.length && (
                        <button
                          onClick={handleAutoVerifyAllPaidCourses}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold rounded-lg text-xs shrink-0 cursor-pointer"
                        >
                          Auto-Verify Covered Courses ({coursesCoveredByPayment})
                        </button>
                      )}
                    </div>

                    {/* Two Column Section: Recording Payments & Coverage Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Form: Record New Payment */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Record Tuition Payment</h3>
                        </div>

                        <form onSubmit={handleAddPayment} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-600 uppercase">Amount Paid ($)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-600 uppercase">Reference Notes / Comments</label>
                            <textarea
                              placeholder="e.g. Bank Transfer Ref: 48820, Cash deposit"
                              rows={2}
                              value={paymentNote}
                              onChange={(e) => setPaymentNote(e.target.value)}
                              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Payment Receipt</span>
                          </button>
                        </form>
                      </div>

                      {/* Course Verification Checkboxes */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <FileCheck2 className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Course Release Panel</h3>
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-400">
                            {verifiedClassIds.length} / {coursesCoveredByPayment} Released
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Toggle which applied courses are unlocked for the student. Paid funds act as collateral credits.
                        </p>

                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                          {appliedClasses.map((cls) => {
                            const isReleased = verifiedClassIds.includes(cls.id);
                            return (
                              <div
                                key={cls.id}
                                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                  isReleased 
                                    ? 'bg-emerald-50/50 border-emerald-200' 
                                    : 'bg-slate-50 border-slate-100'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <h4 className="text-xs font-bold text-slate-800 truncate">{cls.title}</h4>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {cls.classType || 'CSEC'} • ${cls.price} (Subtotal)
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleToggleCourseVerification(cls.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all shrink-0 cursor-pointer ${
                                    isReleased
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {isReleased ? 'Released' : 'Release'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Payment Transaction Ledger */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4.5 h-4.5 text-slate-500" />
                          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Transaction Ledger</h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{payments.length} Transaction(s)</span>
                      </div>

                      {payments.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400">
                          No transactions recorded yet. Enter a payment above to seed ledger.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto">
                          {payments.map((p, idx) => (
                            <div key={p.id} className="flex items-start justify-between text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-800">Payment #{idx + 1} • ${p.amount.toFixed(2)}</span>
                                <p className="text-[10px] text-slate-500 font-medium">Notes: {p.notes}</p>
                              </div>
                              <span className="text-[10px] text-slate-400">{new Date(p.timestamp).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: Course Status */}
            {activeTab === 'classes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Applied Course Schedule & Approvals</h3>
                  <span className="text-xs font-bold text-slate-400">{appliedClasses.length} Applied Course(s)</span>
                </div>

                {appliedClasses.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-400">
                    No active registrations. Submit a class selection form first.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appliedClasses.map((cls) => {
                      const isReleased = verifiedClassIds.includes(cls.id);
                      return (
                        <div
                          key={cls.id}
                          className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                            isReleased
                              ? 'bg-emerald-50/20 border-emerald-200'
                              : 'bg-slate-50 border-slate-200/60'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                                {cls.classType || 'CSEC'}
                              </span>
                              {isReleased ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black tracking-wide uppercase flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Active & Released
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold uppercase flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-500" />
                                  Pending Payment
                                </span>
                              )}
                            </div>

                            <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{cls.title}</h4>
                            <p className="text-[11px] text-slate-500 font-medium">Instructor: {cls.instructor || 'Staff Instructor'}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 flex justify-between">
                            <span>{cls.location || 'STEM Lab A'}</span>
                            <span>{cls.schedule || 'Flexible'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 4: Classroom Grades & Exports */}
            {activeTab === 'grades' && (
              <div className="space-y-6">
                <div className="bg-purple-50/50 rounded-2xl border border-purple-100 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-purple-600" />
                      Google Classroom Grade Sync Center
                    </h4>
                    <p className="text-[11px] text-purple-800/90 leading-relaxed max-w-xl">
                      Accepts Google Classroom grade sheet exports directly in CSV format. Upload exports containing student email matches to instantly synchronize assignments.
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={handleCopySampleCSV}
                      className="px-3 py-1.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1"
                      title="Copy standard Classroom format template"
                    >
                      <span>Copy CSV Template</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload CSV</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleGradeCsvUpload}
                      accept=".csv"
                      className="hidden"
                    />
                  </div>
                </div>

                {uploadStatus.type && (
                  <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {uploadStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{uploadStatus.message}</span>
                  </div>
                )}

                {/* Two Column Layout: Manual Entry & Grade Sheet */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Manual Entry Column */}
                  <div className="md:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <Award className="w-4 h-4 text-slate-500" />
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Manual Grade Entry</h3>
                    </div>

                    <form onSubmit={handleAddManualGrade} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase">Assignment / Exam Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Unit 1 Robotics Test"
                          value={manualAssignment}
                          onChange={(e) => setManualAssignment(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase">Score / Total</label>
                          <input
                            type="text"
                            placeholder="e.g. 90/100"
                            value={manualScore}
                            onChange={(e) => setManualScore(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase">Letter Grade</label>
                          <input
                            type="text"
                            placeholder="e.g. A"
                            value={manualGrade}
                            onChange={(e) => setManualGrade(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Grade Record</span>
                      </button>
                    </form>
                  </div>

                  {/* Imported Grades Table Sheet */}
                  <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Academics Grade History</h3>
                      <span className="text-[10px] font-extrabold text-slate-400">
                        {(currentRegistration?.grades || []).length} Records
                      </span>
                    </div>

                    {!(currentRegistration?.grades) || currentRegistration.grades.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400 space-y-2">
                        <Award className="w-8 h-8 text-slate-300 mx-auto" />
                        <p>No academic grade records exist yet. Upload Google Classroom grades export above.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                              <th className="px-3 py-2 font-extrabold">Assignment Name</th>
                              <th className="px-3 py-2 font-extrabold text-center">Score</th>
                              <th className="px-3 py-2 font-extrabold text-center">Grade</th>
                              <th className="px-3 py-2 font-extrabold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentRegistration.grades.map((g, idx) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="px-3 py-2.5 font-bold text-slate-800">{g.assignmentName}</td>
                                <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{g.score}</td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                                    {g.grade}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <button
                                    onClick={() => handleDeleteGrade(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
