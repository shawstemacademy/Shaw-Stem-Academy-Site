import React, { useState, useMemo } from 'react';
import { 
  Archive, 
  CheckCircle2, 
  Users, 
  BookOpen, 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  FileText, 
  Sparkles, 
  GraduationCap, 
  Award, 
  Check, 
  ChevronRight, 
  Layers, 
  ShieldCheck,
  UserCheck,
  UserX,
  History,
  Tag,
  Lock
} from 'lucide-react';
import { ClassItem, SbaHubOption, RegistrationRecord, SchoolUser, UserRole, ArchivedClassRecord } from '../../types';
import { saveDocToFirestore, saveUserToFirestore } from '../../lib/firebase';
import { formatSafeDate } from '../../lib/formatDate';

interface ClassBatchArchivingManagerProps {
  classList: ClassItem[];
  sbaHubOptions?: SbaHubOption[];
  registrationLogs: RegistrationRecord[];
  onUpdateRegistration: (updated: RegistrationRecord) => void;
  schoolUsers: SchoolUser[];
  onUpdateUser?: (updated: SchoolUser) => void;
  loggedInUser?: SchoolUser | null;
  currentRole?: UserRole;
  logoUrl?: string;
}

export const ClassBatchArchivingManager: React.FC<ClassBatchArchivingManagerProps> = ({
  classList = [],
  sbaHubOptions = [],
  registrationLogs = [],
  onUpdateRegistration,
  schoolUsers = [],
  onUpdateUser,
  loggedInUser,
  currentRole = 'admin',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'archived'>('active');

  // Modal State for Batch Archiving
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [targetClass, setTargetClass] = useState<ClassItem | null>(null);
  const [selectedStudentIdsToArchive, setSelectedStudentIdsToArchive] = useState<string[]>([]);
  const [completionTerm, setCompletionTerm] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    if (month < 4) return `Term 2 - ${year}`;
    if (month < 8) return `Term 3 (Summer) - ${year}`;
    return `Term 1 - ${year}-${year + 1}`;
  });
  const [completionNotes, setCompletionNotes] = useState<string>('Class finished. Syllabus completed and final coursework graded.');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // Combine regular classes and SBA Hub options into a unified list
  const unifiedClasses = useMemo(() => {
    const list: Array<ClassItem & { isSbaHub?: boolean }> = [];
    
    // Regular classes
    classList.forEach((cls) => {
      list.push({
        ...cls,
        isSbaHub: false,
      });
    });

    // SBA Hub items
    sbaHubOptions.forEach((sba) => {
      if (!list.some((c) => c.id === sba.id)) {
        list.push({
          id: sba.id,
          title: sba.name,
          category: 'SBA Hub',
          classType: sba.classType || 'SBA Hub',
          schedule: 'SBA Hub Sessions',
          days: sba.days,
          startTime: sba.startTime,
          endTime: sba.endTime,
          location: sba.location,
          instructor: sba.instructor,
          price: sba.yearlyPrice,
          pricePeriod: sba.pricePeriod || 'one-time',
          capacity: sba.capacity || 15,
          enrolled: 0,
          isOffered: sba.isOffered !== false,
          ageGroup: 'All',
          description: sba.description || 'SBA Hub Course',
          isSbaHub: true,
        });
      }
    });

    return list;
  }, [classList, sbaHubOptions]);

  // Helper to get active students currently enrolled in a class (excluding archived/completed)
  const getActiveStudentsForClass = (classId: string) => {
    const studentsMap = new Map<string, {
      studentKey: string;
      studentName: string;
      studentEmail: string;
      registrationRecord?: RegistrationRecord;
      schoolUser?: SchoolUser;
      enrolledAt: string;
    }>();

    registrationLogs.forEach((log) => {
      // If student already completed / archived this class, skip
      if (log.completedClassIds && log.completedClassIds.includes(classId)) {
        return;
      }

      const isVerified = Boolean(log.verifiedClassIds && log.verifiedClassIds.includes(classId));
      const isSelected = Boolean(
        log.selectedClasses?.some((c) => c.id === classId) ||
        log.studentInfo?.selectedSbaHubIds?.includes(classId)
      );
      const isPaidOrVerified = Boolean(
        log.isPaid || 
        log.status === 'enrolled_paid' || 
        log.status === 'completed' ||
        (log.payments && log.payments.length > 0)
      );

      if (isVerified || (isSelected && isPaidOrVerified)) {
        const key = (log.studentId || log.userId || log.studentInfo?.email || log.studentInfo?.parentEmail || log.id).toLowerCase();
        if (!studentsMap.has(key)) {
          studentsMap.set(key, {
            studentKey: key,
            studentName: log.studentInfo?.studentName || `${log.studentInfo?.firstName || ''} ${log.studentInfo?.lastName || ''}`.trim() || 'Student',
            studentEmail: log.studentInfo?.email || log.studentInfo?.parentEmail || '',
            registrationRecord: log,
            enrolledAt: log.timestamp || '',
          });
        }
      }
    });

    // Also check schoolUsers
    schoolUsers.forEach((u) => {
      if (u.role === 'student' && u.status !== 'disabled') {
        if (u.completedClassIds && u.completedClassIds.includes(classId)) {
          return;
        }
        if (u.registeredClassIds && u.registeredClassIds.includes(classId)) {
          const key = (u.id || u.email).toLowerCase();
          if (!studentsMap.has(key)) {
            studentsMap.set(key, {
              studentKey: key,
              studentName: u.name || 'Student',
              studentEmail: u.email,
              schoolUser: u,
              enrolledAt: '',
            });
          }
        }
      }
    });

    return Array.from(studentsMap.values());
  };

  // Helper to get archived / completed students for a class
  const getArchivedStudentsForClass = (classId: string) => {
    const archivedMap = new Map<string, {
      studentKey: string;
      studentName: string;
      studentEmail: string;
      archivedRecord?: ArchivedClassRecord;
      registrationRecord?: RegistrationRecord;
      schoolUser?: SchoolUser;
    }>();

    registrationLogs.forEach((log) => {
      const isCompleted = Boolean(log.completedClassIds && log.completedClassIds.includes(classId));
      const archivedEntry = log.archivedClasses?.find((a) => a.classId === classId);

      if (isCompleted || archivedEntry) {
        const key = (log.studentId || log.userId || log.studentInfo?.email || log.id).toLowerCase();
        if (!archivedMap.has(key)) {
          archivedMap.set(key, {
            studentKey: key,
            studentName: log.studentInfo?.studentName || `${log.studentInfo?.firstName || ''} ${log.studentInfo?.lastName || ''}`.trim() || 'Student',
            studentEmail: log.studentInfo?.email || log.studentInfo?.parentEmail || '',
            archivedRecord: archivedEntry || {
              classId,
              className: '',
              archivedAt: log.timestamp || new Date().toISOString(),
              status: 'completed',
              term: 'Completed Term',
            },
            registrationRecord: log,
          });
        }
      }
    });

    schoolUsers.forEach((u) => {
      if (u.role === 'student') {
        const isCompleted = Boolean(u.completedClassIds && u.completedClassIds.includes(classId));
        const archivedEntry = u.archivedClasses?.find((a) => a.classId === classId);
        if (isCompleted || archivedEntry) {
          const key = (u.id || u.email).toLowerCase();
          if (!archivedMap.has(key)) {
            archivedMap.set(key, {
              studentKey: key,
              studentName: u.name || 'Student',
              studentEmail: u.email,
              archivedRecord: archivedEntry || {
                classId,
                className: '',
                archivedAt: new Date().toISOString(),
                status: 'completed',
                term: 'Completed Term',
              },
              schoolUser: u,
            });
          }
        }
      }
    });

    return Array.from(archivedMap.values());
  };

  // Filter classes based on query and category
  const filteredClasses = useMemo(() => {
    return unifiedClasses.filter((cls) => {
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'sba_hub' && !cls.isSbaHub) return false;
        if (categoryFilter === 'csec' && !cls.category?.toLowerCase().includes('csec') && !cls.classType?.toLowerCase().includes('csec')) return false;
        if (categoryFilter === 'cape' && !cls.category?.toLowerCase().includes('cape') && !cls.classType?.toLowerCase().includes('cape')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = cls.title?.toLowerCase().includes(q);
        const matchesInstructor = cls.instructor?.toLowerCase().includes(q);
        const matchesCategory = cls.category?.toLowerCase().includes(q);
        const matchesLocation = cls.location?.toLowerCase().includes(q);
        return matchesTitle || matchesInstructor || matchesCategory || matchesLocation;
      }
      return true;
    });
  }, [unifiedClasses, categoryFilter, searchQuery]);

  // Total metrics with strict UNIQUE student deduplication
  const uniqueActiveStudentsMap = useMemo(() => {
    const map = new Map<string, {
      studentKey: string;
      studentName: string;
      studentEmail: string;
      enrolledClassesCount: number;
      classTitles: string[];
    }>();

    unifiedClasses.forEach((cls) => {
      const classStudents = getActiveStudentsForClass(cls.id);
      classStudents.forEach((st) => {
        const existing = map.get(st.studentKey);
        if (existing) {
          existing.enrolledClassesCount += 1;
          if (!existing.classTitles.includes(cls.title)) {
            existing.classTitles.push(cls.title);
          }
        } else {
          map.set(st.studentKey, {
            studentKey: st.studentKey,
            studentName: st.studentName,
            studentEmail: st.studentEmail,
            enrolledClassesCount: 1,
            classTitles: [cls.title],
          });
        }
      });
    });

    return map;
  }, [unifiedClasses, registrationLogs, schoolUsers]);

  const uniqueActiveStudentsCount = uniqueActiveStudentsMap.size;

  const totalCourseEnrollments = useMemo(() => {
    let count = 0;
    uniqueActiveStudentsMap.forEach((s) => {
      count += s.enrolledClassesCount;
    });
    return count;
  }, [uniqueActiveStudentsMap]);

  const uniqueArchivedStudentsMap = useMemo(() => {
    const map = new Map<string, {
      studentKey: string;
      studentName: string;
      studentEmail: string;
      completedClassesCount: number;
      classTitles: string[];
    }>();

    unifiedClasses.forEach((cls) => {
      const classArchived = getArchivedStudentsForClass(cls.id);
      classArchived.forEach((st) => {
        const existing = map.get(st.studentKey);
        if (existing) {
          existing.completedClassesCount += 1;
          if (!existing.classTitles.includes(cls.title)) {
            existing.classTitles.push(cls.title);
          }
        } else {
          map.set(st.studentKey, {
            studentKey: st.studentKey,
            studentName: st.studentName,
            studentEmail: st.studentEmail,
            completedClassesCount: 1,
            classTitles: [cls.title],
          });
        }
      });
    });

    return map;
  }, [unifiedClasses, registrationLogs, schoolUsers]);

  const uniqueArchivedStudentsCount = uniqueArchivedStudentsMap.size;

  const totalArchivedStudentCourseRecords = useMemo(() => {
    let count = 0;
    uniqueArchivedStudentsMap.forEach((s) => {
      count += s.completedClassesCount;
    });
    return count;
  }, [uniqueArchivedStudentsMap]);

  // Open the batch archive modal for a specific class
  const handleOpenBatchArchiveModal = (cls: ClassItem) => {
    const activeStudents = getActiveStudentsForClass(cls.id);
    if (activeStudents.length === 0) {
      alert(`There are no active enrolled students in "${cls.title}" to archive. All students have already completed or none are enrolled.`);
      return;
    }
    setTargetClass(cls);
    setSelectedStudentIdsToArchive(activeStudents.map((s) => s.studentKey));
    setIsArchiveModalOpen(true);
  };

  // Execute Batch Archiving for selected students
  const handleExecuteBatchArchive = async () => {
    if (!targetClass || selectedStudentIdsToArchive.length === 0) {
      alert('Please select at least one student to archive as finished.');
      return;
    }

    setIsProcessing(true);
    try {
      const classId = targetClass.id;
      const className = targetClass.title;
      const archivedAt = new Date().toISOString();
      const archivedBy = loggedInUser?.name || loggedInUser?.email || (currentRole === 'registrar' ? 'Registrar' : 'Admin');

      const archiveRecord: ArchivedClassRecord = {
        classId,
        className,
        archivedAt,
        archivedBy,
        term: completionTerm.trim() || 'Completed',
        notes: completionNotes.trim() || 'Class concluded.',
        status: 'completed',
      };

      let archivedCount = 0;

      // Update Registrations in Firestore
      for (const log of registrationLogs) {
        const key = (log.studentId || log.userId || log.studentInfo?.email || log.studentInfo?.parentEmail || log.id).toLowerCase();
        if (selectedStudentIdsToArchive.includes(key)) {
          const currentCompleted = log.completedClassIds || [];
          const currentArchived = log.archivedClasses || [];

          if (!currentCompleted.includes(classId)) {
            const nextCompleted = [...currentCompleted, classId];
            const nextArchived = [
              ...currentArchived.filter((a) => a.classId !== classId),
              archiveRecord,
            ];
            // Remove from verifiedClassIds so the active seat is freed for new cohorts
            const nextVerified = (log.verifiedClassIds || []).filter((id) => id !== classId);

            const updatedLog: RegistrationRecord = {
              ...log,
              completedClassIds: nextCompleted,
              archivedClasses: nextArchived,
              verifiedClassIds: nextVerified,
            };

            await saveDocToFirestore('registrations', log.id, updatedLog);
            onUpdateRegistration(updatedLog);
            archivedCount++;
          }
        }
      }

      // Update SchoolUsers in Firestore
      for (const u of schoolUsers) {
        if (u.role === 'student') {
          const key = (u.id || u.email).toLowerCase();
          if (selectedStudentIdsToArchive.includes(key)) {
            const currentCompleted = u.completedClassIds || [];
            const currentArchived = u.archivedClasses || [];

            if (!currentCompleted.includes(classId)) {
              const nextCompleted = [...currentCompleted, classId];
              const nextArchived = [
                ...currentArchived.filter((a) => a.classId !== classId),
                archiveRecord,
              ];
              const nextRegistered = (u.registeredClassIds || []).filter((id) => id !== classId);

              const updatedUser: SchoolUser = {
                ...u,
                completedClassIds: nextCompleted,
                archivedClasses: nextArchived,
                registeredClassIds: nextRegistered,
              };

              await saveUserToFirestore(updatedUser);
              if (onUpdateUser) {
                onUpdateUser(updatedUser);
              }
            }
          }
        }
      }

      setIsArchiveModalOpen(false);
      setSuccessAlert(
        `Batch Archiving Complete! Successfully archived ${archivedCount} student(s) from "${className}". Their academic grades, attendance history, and payment ledgers are permanently saved for record keeping.`
      );
      setTimeout(() => setSuccessAlert(null), 8000);
    } catch (err: any) {
      console.error('Error executing batch archive:', err);
      alert(`Error archiving students: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Restore / Unarchive a student back to active class roster
  const handleRestoreStudent = async (classId: string, className: string, studentKey: string, studentName: string) => {
    if (!window.confirm(`Restore ${studentName} back to active enrollment in "${className}"?`)) {
      return;
    }

    try {
      // Restore in RegistrationRecord
      for (const log of registrationLogs) {
        const key = (log.studentId || log.userId || log.studentInfo?.email || log.studentInfo?.parentEmail || log.id).toLowerCase();
        if (key === studentKey.toLowerCase()) {
          const nextCompleted = (log.completedClassIds || []).filter((id) => id !== classId);
          const nextArchived = (log.archivedClasses || []).filter((a) => a.classId !== classId);
          const nextVerified = Array.from(new Set([...(log.verifiedClassIds || []), classId]));

          const updatedLog: RegistrationRecord = {
            ...log,
            completedClassIds: nextCompleted,
            archivedClasses: nextArchived,
            verifiedClassIds: nextVerified,
          };

          await saveDocToFirestore('registrations', log.id, updatedLog);
          onUpdateRegistration(updatedLog);
        }
      }

      // Restore in SchoolUser
      for (const u of schoolUsers) {
        if (u.role === 'student') {
          const key = (u.id || u.email).toLowerCase();
          if (key === studentKey.toLowerCase()) {
            const nextCompleted = (u.completedClassIds || []).filter((id) => id !== classId);
            const nextArchived = (u.archivedClasses || []).filter((a) => a.classId !== classId);
            const nextRegistered = Array.from(new Set([...(u.registeredClassIds || []), classId]));

            const updatedUser: SchoolUser = {
              ...u,
              completedClassIds: nextCompleted,
              archivedClasses: nextArchived,
              registeredClassIds: nextRegistered,
            };

            await saveUserToFirestore(updatedUser);
            if (onUpdateUser) {
              onUpdateUser(updatedUser);
            }
          }
        }
      }

      setSuccessAlert(`Restored ${studentName} to active enrollment in ${className}.`);
      setTimeout(() => setSuccessAlert(null), 5000);
    } catch (err: any) {
      console.error('Error restoring student:', err);
      alert(`Error restoring student: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase tracking-wider">
              <Archive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Registrar & Administration Record Keeping</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Batch Class Completion & Archiving
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              When a cohort finishes a syllabus or term, archive the class in batches. Archived students are safely preserved with their financial ledgers, grades, and attendance records intact, freeing up seats so new students can begin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-4 bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl flex items-center gap-3 shadow-inner">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-white">{uniqueActiveStudentsCount}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Students</div>
                <div className="text-[9px] font-medium text-indigo-300">
                  {uniqueActiveStudentsCount === 1 ? '1 unique student' : `${uniqueActiveStudentsCount} unique students`} ({totalCourseEnrollments} course seat{totalCourseEnrollments === 1 ? '' : 's'})
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl flex items-center gap-3 shadow-inner">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-emerald-400">{totalArchivedStudentCourseRecords}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Records</div>
                <div className="text-[9px] font-medium text-emerald-300">
                  {uniqueArchivedStudentsCount === 1 ? '1 student' : `${uniqueArchivedStudentsCount} students`} finished
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successAlert && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-start gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{successAlert}</div>
          <button onClick={() => setSuccessAlert(null)} className="text-emerald-700 dark:text-emerald-400 hover:opacity-75">✕</button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search class by name, instructor, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter:</span>
          {[
            { id: 'all', label: 'All Classes' },
            { id: 'csec', label: 'CSEC' },
            { id: 'cape', label: 'CAPE' },
            { id: 'sba_hub', label: 'SBA Hub' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Class List & Batch Archiving Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredClasses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-black text-slate-800 dark:text-slate-200">No classes found</h4>
            <p className="text-xs text-slate-500">Try adjusting your search query or filter settings.</p>
          </div>
        ) : (
          filteredClasses.map((cls) => {
            const activeStudents = getActiveStudentsForClass(cls.id);
            const archivedStudents = getArchivedStudentsForClass(cls.id);
            const isExpanded = expandedClassId === cls.id;

            return (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs transition-all hover:shadow-md"
              >
                <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        cls.isSbaHub 
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' 
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}>
                        {cls.category || (cls.isSbaHub ? 'SBA Hub' : 'Academic')}
                      </span>
                      {cls.location && (
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <span>📍</span> {cls.location}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {cls.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <span>Schedule: <strong className="text-slate-700 dark:text-slate-300">{cls.schedule || 'TBA'}</strong></span>
                      <span>Instructor: <strong className="text-slate-700 dark:text-slate-300">{cls.instructor || 'Unassigned'}</strong></span>
                      <span>Capacity: <strong className="text-slate-700 dark:text-slate-300">15 max</strong></span>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-xs font-extrabold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>{activeStudents.length} Active</span>
                      </span>

                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{archivedStudents.length} Finished</span>
                      </span>
                    </div>

                    {/* Batch Archive Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenBatchArchiveModal(cls)}
                      disabled={activeStudents.length === 0}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                        activeStudents.length > 0
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                      }`}
                      title="Archive all current active students as finished"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive Batch ({activeStudents.length})</span>
                    </button>

                    {/* Toggle Roster / History Panel */}
                    <button
                      type="button"
                      onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Roster & History'}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Roster & History View */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveSubTab('active')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            activeSubTab === 'active'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          Active Enrolled Students ({activeStudents.length})
                        </button>
                        <button
                          onClick={() => setActiveSubTab('archived')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            activeSubTab === 'archived'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          Completed / Archived Students ({archivedStudents.length})
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Class Capacity: <strong className="text-slate-800 dark:text-slate-200">{activeStudents.length} / 15</strong>
                      </div>
                    </div>

                    {activeSubTab === 'active' ? (
                      <div>
                        {activeStudents.length === 0 ? (
                          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
                            <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
                            <p>No active students enrolled in this class. Ready for new student intake!</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {activeStudents.map((st) => (
                              <div
                                key={st.studentKey}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-4 shadow-xs"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center">
                                    {st.studentName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{st.studentName}</h4>
                                    <p className="text-[11px] text-slate-500">{st.studentEmail}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                                    Active Current
                                  </span>
                                  <button
                                    onClick={() => {
                                      setTargetClass(cls);
                                      setSelectedStudentIdsToArchive([st.studentKey]);
                                      setIsArchiveModalOpen(true);
                                    }}
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Archive as Finished
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                          <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-medium">
                            <strong>Static Permanent Records:</strong> Course data, final coursework grades, attendance logs, and financial ledgers are frozen and preserved for official student transcripts.
                          </span>
                        </div>

                        {archivedStudents.map((st) => (
                          <div
                            key={st.studentKey}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/20">
                                <Lock className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">{st.studentName}</h4>
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" /> Static Record
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500">{st.studentEmail}</p>
                                {st.archivedRecord?.notes && (
                                  <p className="text-[10px] text-slate-400 italic mt-0.5 max-w-md line-clamp-1">
                                    "{st.archivedRecord.notes}"
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <div className="text-right text-[11px]">
                                <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-[10px] font-black border border-emerald-300 dark:border-emerald-800 inline-block">
                                  {st.archivedRecord?.term || 'Completed Cohort'}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-1">
                                  Archived {st.archivedRecord?.archivedAt ? formatSafeDate(st.archivedRecord.archivedAt) : 'Permanent'}
                                </span>
                                {st.archivedRecord?.archivedBy && (
                                  <span className="text-[9px] text-slate-400 block">
                                    By {st.archivedRecord.archivedBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Batch Archive Confirmation Modal */}
      {isArchiveModalOpen && targetClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsArchiveModalOpen(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Archive Class Batch as Finished
                </h3>
                <p className="text-xs text-slate-500">
                  Target Course: <strong className="text-slate-900 dark:text-slate-200">{targetClass.title}</strong>
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-2 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              <div className="flex items-center gap-2 font-black text-blue-950 dark:text-blue-100">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Safe Record Keeping Guaranteed</span>
              </div>
              <p>
                Archiving marks the selected cohort as <strong>Finished</strong>. Their full payment history, receipts, grades, assignments, and attendance logs remain permanently saved in their student directory and transcripts. The active seats for this course will be cleared so a new cohort can enroll.
              </p>
            </div>

            {/* Completion Term / Session Label */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Academic Term / Completion Batch Label:
              </label>
              <input
                type="text"
                value={completionTerm}
                onChange={(e) => setCompletionTerm(e.target.value)}
                placeholder="e.g. Term 2 - 2026, May/June 2026 Exam Prep"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Course Completion Notes / Remarks:
              </label>
              <textarea
                rows={2}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="e.g. Syllabus completed. Final SBA projects submitted."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Select Students Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select Students to Archive ({selectedStudentIdsToArchive.length} of {getActiveStudentsForClass(targetClass.id).length}):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allKeys = getActiveStudentsForClass(targetClass.id).map((s) => s.studentKey);
                    if (selectedStudentIdsToArchive.length === allKeys.length) {
                      setSelectedStudentIdsToArchive([]);
                    } else {
                      setSelectedStudentIdsToArchive(allKeys);
                    }
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {selectedStudentIdsToArchive.length === getActiveStudentsForClass(targetClass.id).length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                {getActiveStudentsForClass(targetClass.id).map((st) => {
                  const isChecked = selectedStudentIdsToArchive.includes(st.studentKey);
                  return (
                    <label
                      key={st.studentKey}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIdsToArchive((prev) => [...prev, st.studentKey]);
                            } else {
                              setSelectedStudentIdsToArchive((prev) => prev.filter((id) => id !== st.studentKey));
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{st.studentName}</span>
                          <span className="text-[10px] text-slate-500 block">{st.studentEmail}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Current Cohort</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchArchive}
                disabled={isProcessing || selectedStudentIdsToArchive.length === 0}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing Archive...</span>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Confirm & Archive {selectedStudentIdsToArchive.length} Student(s)</span>
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
