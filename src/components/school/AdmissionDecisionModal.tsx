import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Check, 
  X, 
  FileText, 
  Clock, 
  Send,
  Info,
  Layers,
  Sparkles,
  DollarSign,
  Award
} from 'lucide-react';
import { SchoolUser, RegistrationRecord, DenialReasonItem, AdmissionDecision, ClassItem } from '../../types';
import { saveUserToFirestore, saveAdmissionDecisionToFirestore, saveEnrollmentToFirestore, saveRegistrationToFirestore } from '../../lib/firebase';
import { sendPushNotificationToUser } from '../../lib/fcm';

interface AdmissionDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: SchoolUser;
  registrationRecord?: RegistrationRecord;
  currentUser: SchoolUser | null;
  onDecisionComplete: (updatedStudent: SchoolUser) => void;
  classList?: ClassItem[];
}

const REGISTRATION_FIELD_CATEGORIES = [
  { key: 'personal_info', label: 'Personal Information (Name, Gender, Nationality)' },
  { key: 'date_of_birth', label: 'Date of Birth & Age Verification' },
  { key: 'address', label: 'Residential Address' },
  { key: 'contact_info', label: 'Contact Information (Cell / Home Phone / Email)' },
  { key: 'parent_guardian', label: 'Parent / Guardian Information' },
  { key: 'id_document', label: 'Identification Documents / Student Photo' },
  { key: 'previous_school', label: 'Previous School Information' },
  { key: 'grade_level', label: 'Academic Information & Grade Level' },
  { key: 'uploaded_docs', label: 'Uploaded Certificates & Transcripts' },
  { key: 'course_selection', label: 'Class & SBA Hub Course Selection Prerequisites' },
  { key: 'other', label: 'Other Operational or Administrative Grounds' },
];

export const AdmissionDecisionModal: React.FC<AdmissionDecisionModalProps> = ({
  isOpen,
  onClose,
  student,
  registrationRecord,
  currentUser,
  onDecisionComplete,
  classList = [],
}) => {
  const [decisionMode, setDecisionMode] = useState<'review' | 'accept' | 'deny'>('review');

  // Accept Form States
  const [acceptNotes, setAcceptNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deny Form States: selected fields mapping to their individual reasons
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<string[]>([]);
  const [fieldReasons, setFieldReasons] = useState<Record<string, string>>({});
  const [generalDenialNotes, setGeneralDenialNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!isOpen || !student) return null;

  const sDetails = student.studentDetails || registrationRecord?.studentInfo || {} as any;
  const sName = student.name || sDetails.studentName || `${sDetails.firstName || ''} ${sDetails.lastName || ''}`.trim() || 'Applicant';
  const sEmail = student.email || sDetails.email || '';

  // Toggle field selection
  const handleToggleField = (key: string) => {
    setSelectedFieldKeys((prev) => {
      if (prev.includes(key)) {
        const next = prev.filter((k) => k !== key);
        const nextReasons = { ...fieldReasons };
        delete nextReasons[key];
        setFieldReasons(nextReasons);
        return next;
      } else {
        return [...prev, key];
      }
    });
    setValidationError('');
  };

  const handleReasonChange = (key: string, value: string) => {
    setFieldReasons((prev) => ({
      ...prev,
      [key]: value,
    }));
    setValidationError('');
  };

  // Submit Acceptance Handler
  const handleConfirmAccept = async () => {
    setIsSubmitting(true);
    try {
      const decisionId = `DEC-${Date.now()}`;
      const decision: AdmissionDecision = {
        id: decisionId,
        studentId: student.id,
        studentName: sName,
        studentEmail: sEmail,
        registrationId: registrationRecord?.id,
        decision: 'ACCEPTED',
        decidedBy: currentUser?.id || 'admin',
        decidedByName: currentUser?.name || 'Admissions Officer',
        decisionDate: new Date().toISOString(),
        generalNotes: acceptNotes.trim() || 'Application reviewed and officially accepted.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveAdmissionDecisionToFirestore(decision);

      // Create enrollment records for student's selected classes
      const selectedClasses = registrationRecord?.selectedClasses || [];
      const nowIso = new Date().toISOString();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      const endDateIso = oneMonthLater.toISOString().split('T')[0];

      for (const cls of selectedClasses) {
        const isSba = Boolean(cls.isSbaHub || cls.id?.toLowerCase().includes('sba'));
        await saveEnrollmentToFirestore({
          id: `ENR-${student.id}-${cls.id}`,
          studentId: student.id,
          studentName: sName,
          studentEmail: sEmail,
          classId: cls.id,
          className: cls.title || cls.name || 'Course',
          classType: isSba ? 'sba_hub' : 'regular',
          billingType: isSba ? 'one_time' : 'monthly',
          status: 'active',
          enrollmentStartDate: nowIso.split('T')[0],
          enrollmentEndDate: isSba ? undefined : endDateIso,
          googleMeetUrl: cls.googleMeetUrl || cls.meetingLink,
          googleClassroomUrl: cls.googleClassroomUrl || cls.classroomLink,
          googleClassroomCode: cls.googleClassroomCode,
          instructor: cls.instructor || cls.teacherName,
          schedule: cls.schedule || `${cls.day || ''} ${cls.time || ''}`.trim(),
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      // Update student user
      const updatedUser: SchoolUser = {
        ...student,
        status: 'accepted',
        admissionDecision: decision,
        deniedFields: [],
        deniedReason: undefined,
        deniedReasonItems: [],
      };

      await saveUserToFirestore(updatedUser);

      // Update registration record if present
      if (registrationRecord) {
        await saveRegistrationToFirestore({
          ...registrationRecord,
          status: 'accepted',
        });
      }

      // Send push notification
      try {
        await sendPushNotificationToUser(
          sEmail,
          student.id,
          '🎉 Application Accepted!',
          `Congratulations ${sName}! Your admissions application to Shaw STEM Academy has been officially accepted. You may now complete class tuition payment to finalize your active seat.`,
          'status'
        );
      } catch (err) {
        console.warn('FCM notify error:', err);
      }

      onDecisionComplete(updatedUser);
      onClose();
    } catch (err) {
      console.error('Error accepting application:', err);
      alert('Failed to record acceptance decision. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Denial Handler with field-specific validations
  const handleConfirmDeny = async () => {
    if (selectedFieldKeys.length === 0) {
      setValidationError('Please select at least one field or category as the reason for denial.');
      return;
    }

    // Check that every selected field has a non-empty explanation
    const missingFields: string[] = [];
    const denialReasonItems: DenialReasonItem[] = [];

    for (const key of selectedFieldKeys) {
      const fieldMeta = REGISTRATION_FIELD_CATEGORIES.find((c) => c.key === key);
      const label = fieldMeta?.label || key;
      const reasonText = (fieldReasons[key] || '').trim();

      if (!reasonText) {
        missingFields.push(label);
      } else {
        denialReasonItems.push({
          id: `DR-${Date.now()}-${key}`,
          fieldKey: key,
          fieldLabel: label,
          reason: reasonText,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (missingFields.length > 0) {
      setValidationError(
        `Every selected denial item must have an individual explanation. Please provide an explanation for: ${missingFields.join(', ')}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const decisionId = `DEC-${Date.now()}`;
      const decision: AdmissionDecision = {
        id: decisionId,
        studentId: student.id,
        studentName: sName,
        studentEmail: sEmail,
        registrationId: registrationRecord?.id,
        decision: 'DENIED',
        decidedBy: currentUser?.id || 'admin',
        decidedByName: currentUser?.name || 'Admissions Officer',
        decisionDate: new Date().toISOString(),
        generalNotes: generalDenialNotes.trim() || undefined,
        denialReasons: denialReasonItems,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveAdmissionDecisionToFirestore(decision);

      // Update student user
      const fieldLabels = denialReasonItems.map((item) => item.fieldLabel);
      const combinedReasonSummary = denialReasonItems
        .map((item) => `• ${item.fieldLabel}: ${item.reason}`)
        .join('\n');

      const updatedUser: SchoolUser = {
        ...student,
        status: 'denied',
        admissionDecision: decision,
        deniedFields: fieldLabels,
        deniedReason: combinedReasonSummary,
        deniedReasonItems: denialReasonItems,
      };

      await saveUserToFirestore(updatedUser);

      // Update registration record if present
      if (registrationRecord) {
        await saveRegistrationToFirestore({
          ...registrationRecord,
          status: 'denied',
        });
      }

      // Send push notification
      try {
        await sendPushNotificationToUser(
          sEmail,
          student.id,
          '⚠️ Application Status Update: Denied',
          `Your application for Shaw STEM Academy was reviewed. Specific areas requiring revision or clarification have been posted in your Student Portal.`,
          'status'
        );
      } catch (err) {
        console.warn('FCM notify error:', err);
      }

      onDecisionComplete(updatedUser);
      onClose();
    } catch (err) {
      console.error('Error denying application:', err);
      alert('Failed to record denial decision. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-black">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg">
                  Registration Review & Admission Decision
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  student.status === 'accepted'
                    ? 'bg-emerald-100 text-emerald-800'
                    : student.status === 'denied'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {student.status || 'Pending Review'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Applicant: <strong className="text-slate-800 dark:text-slate-200">{sName}</strong> ({sEmail})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Buttons */}
        <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setDecisionMode('review')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              decisionMode === 'review'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1. View Application Details
          </button>
          <button
            onClick={() => setDecisionMode('accept')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              decisionMode === 'accept'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>2. Accept Application</span>
          </button>
          <button
            onClick={() => setDecisionMode('deny')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              decisionMode === 'deny'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>3. Deny Application (With Reasons)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* MODE 1: Review Application Data */}
          {decisionMode === 'review' && (
            <div className="space-y-6 animate-fade-in text-xs">
              {/* Personal & Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Applicant Identification</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">First Name</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sDetails.firstName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Last Name</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sDetails.lastName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Date of Birth</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sDetails.dateOfBirth || sDetails.dob || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Age</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sDetails.studentAge || sDetails.age || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Gender</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sDetails.gender || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Grade / Form</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sDetails.formGrade || sDetails.gradeLevel || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Contact & Location</span>
                  </div>
                  <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Student Cell Phone</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sDetails.cellPhone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Home Phone</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sDetails.homePhone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Address</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sDetails.address || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Current / Previous School</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{sDetails.currentSchool || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent / Guardian Information */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <User className="w-3.5 h-3.5 text-purple-500" />
                  <span>Parent / Guardian & Emergency Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Lives With</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{sDetails.livesWith || 'Parent'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Parent / Guardian Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {sDetails.parentName || `${sDetails.motherFirstName || ''} ${sDetails.motherLastName || ''}`.trim() || `${sDetails.fatherFirstName || ''} ${sDetails.fatherLastName || ''}`.trim() || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Parent Phone / Emergency</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {sDetails.parentPhone || sDetails.motherCellPhone || sDetails.fatherCellPhone || sDetails.emergencyContact || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Classes & SBA Hub */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span>Selected Courses & SBA Hub ({registrationRecord?.selectedClasses?.length || 0})</span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-slate-100">
                    Total: ${registrationRecord?.totalPrice?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {(registrationRecord?.selectedClasses || []).map((cls) => (
                    <div
                      key={cls.id}
                      className="p-2.5 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-700/60"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{cls.title || cls.name}</span>
                        <div className="text-[10px] text-slate-400">
                          {cls.isSbaHub ? 'SBA Hub Practical Option (One-Time)' : 'Regular Monthly Course'} • Instructor: {cls.instructor || cls.teacherName || 'Assigned Staff'}
                        </div>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        ${cls.price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                  {(!registrationRecord?.selectedClasses || registrationRecord.selectedClasses.length === 0) && (
                    <p className="text-slate-400 text-center py-2">
                      No classes selected yet (Applicant is at school registration phase).
                    </p>
                  )}
                </div>
              </div>

              {/* Decision quick actions footer */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDecisionMode('deny')}
                  className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Deny Application</span>
                </button>
                {(!registrationRecord?.selectedClasses || registrationRecord.selectedClasses.length === 0) ? (
                  <button
                    type="button"
                    disabled
                    className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-not-allowed"
                    title="Student has not registered for any courses yet."
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Accept (Requires Course Registration)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDecisionMode('accept')}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Accept Application</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MODE 2: Accept Application Confirmation */}
          {decisionMode === 'accept' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                    Officially Accept {sName}'s Application
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                    Accepting this applicant will change their status to <strong>Accepted</strong>, unlock student class payment in their portal, generate active course enrollments, and send a notification to <strong>{sEmail}</strong>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admissions Notes / Acceptance Memo (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. All prerequisites verified. Welcome to the Robotics & Computer Science department."
                  value={acceptNotes}
                  onChange={(e) => setAcceptNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDecisionMode('review')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Back to Review
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmAccept}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording Acceptance...' : 'Confirm Official Acceptance'}</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: Deny Application with Field-Specific Mandatory Reasons */}
          {decisionMode === 'deny' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-rose-950 dark:text-rose-200">
                    Deny Admissions Application for {sName}
                  </h4>
                  <p className="text-xs text-rose-800 dark:text-rose-300 mt-1">
                    Select the specific registration fields or categories that caused this denial. <strong>Every selected category must have an individual explanation</strong> so the student knows exactly what needs to be rectified.
                  </p>
                </div>
              </div>

              {validationError && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Field-Specific Checkboxes & Dynamic Individual Textareas */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Select Specific Denial Areas <span className="text-rose-500">*</span>
                </label>

                <div className="space-y-3">
                  {REGISTRATION_FIELD_CATEGORIES.map((cat) => {
                    const isSelected = selectedFieldKeys.includes(cat.key);
                    return (
                      <div
                        key={cat.key}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleField(cat.key)}
                            className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                          />
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {cat.label}
                          </span>
                        </label>

                        {/* Individual Explanation Input (Rendered when selected) */}
                        {isSelected && (
                          <div className="mt-3 pl-7 space-y-1">
                            <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-300">
                              Specific Reason / Required Correction for this area <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                              rows={2}
                              required
                              placeholder={`Explain specifically what is incorrect with ${cat.label.toLowerCase()}...`}
                              value={fieldReasons[cat.key] || ''}
                              onChange={(e) => handleReasonChange(cat.key, e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* General Denial Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  General Summary / Next Steps Note for Student (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please log in to update your identification picture and correct your emergency contact phone."
                  value={generalDenialNotes}
                  onChange={(e) => setGeneralDenialNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDecisionMode('review')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Back to Review
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmDeny}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording Denial...' : 'Confirm Application Denial'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
