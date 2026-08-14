import React, { useEffect } from 'react';
import { RegistrationRecord, FormTheme } from '../types';
import { X, CheckCircle2, Printer, Download, Calendar, User, Mail, Phone, Tag, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { formatUSD } from '../lib/formatCurrency';
import { formatSafeDate } from '../lib/formatDate';

interface RegistrationReceiptModalProps {
  registration: RegistrationRecord | null;
  onClose: () => void;
  theme: FormTheme;
}

export const RegistrationReceiptModal: React.FC<RegistrationReceiptModalProps> = ({
  registration,
  onClose,
  theme,
}) => {
  useEffect(() => {
    document.body.classList.add('printing-receipt-active');
    return () => {
      document.body.classList.remove('printing-receipt-active');
    };
  }, []);

  if (!registration) return null;

  const appliedDiscounts = registration?.appliedDiscounts || [];
  const selectedClasses = registration?.selectedClasses || [];
  const studentInfo = registration?.studentInfo || {
    parentName: 'N/A',
    parentEmail: 'N/A',
    parentPhone: 'N/A',
    studentName: 'N/A',
    studentAge: 'N/A',
    gradeLevel: 'N/A',
    emergencyContact: 'N/A',
  };

  const totalSavings = appliedDiscounts.reduce((sum, d) => sum + (d?.amountOff ?? 0), 0);

  const calculateAgeFromDob = (dob?: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? String(age) : '';
  };

  const studentNameVal = studentInfo.studentName ||
    (`${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim()) ||
    'N/A';

  const studentAgeVal = studentInfo.studentAge ||
    studentInfo.age ||
    calculateAgeFromDob(studentInfo.dateOfBirth) ||
    'N/A';

  const gradeLevelVal = studentInfo.gradeLevel ||
    studentInfo.formGrade ||
    'N/A';

  const rawParentName = studentInfo.parentName;
  const motherFullName = `${studentInfo.motherFirstName || ''} ${studentInfo.motherLastName || ''}`.trim();
  const fatherFullName = `${studentInfo.fatherFirstName || ''} ${studentInfo.fatherLastName || ''}`.trim();
  const guardianFullName = `${studentInfo.guardianFirstName || ''} ${studentInfo.guardianLastName || ''}`.trim();

  const parentNameVal = (rawParentName && rawParentName !== 'Parent/Guardian' && rawParentName !== 'Parent')
    ? rawParentName
    : (motherFullName || fatherFullName || guardianFullName || 'Not Provided');

  const rawParentEmail = studentInfo.parentEmail || studentInfo.motherEmail || studentInfo.fatherEmail || studentInfo.guardianEmail;
  const isParentEmailSameAsStudent = rawParentEmail && studentInfo.email && rawParentEmail.toLowerCase().trim() === studentInfo.email.toLowerCase().trim();
  const parentEmailVal = (!isParentEmailSameAsStudent && rawParentEmail) ? rawParentEmail : 'Not Provided';

  const rawPhone = studentInfo.parentPhone || studentInfo.motherCellPhone || studentInfo.fatherCellPhone || studentInfo.guardianCellPhone;
  const isPhoneSameAsStudentCell = rawPhone && studentInfo.cellPhone && rawPhone.trim() === studentInfo.cellPhone.trim();
  const phoneVal = (!isPhoneSameAsStudentCell && rawPhone) ? rawPhone : 'Not Provided';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    const cleanStudentName = studentNameVal.replace(/[^a-zA-Z0-9]/g, '_');
    const receiptCode = registration.id.slice(-8).toUpperCase();
    document.title = `Shaw_STEM_Academy_Invoice_${receiptCode}_${cleanStudentName}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="printable-receipt-backdrop fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static print:block print:overflow-visible">
      <div className="printable-receipt-card bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden my-8 print:my-0 print:shadow-none print:border-none print:max-w-full print:rounded-none">
        {/* Print-only Academy Official Header */}
        <div className="hidden print:block p-4 border-b border-slate-300 pb-2 mb-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">SHAW STEM ACADEMY</h1>
              <p className="text-xs text-slate-600 font-medium">Official Student Registration Invoice</p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p className="font-bold text-slate-900">Invoice #{registration.id.slice(-8).toUpperCase()}</p>
              <p>Date: {formatSafeDate(registration.timestamp || (registration as any).createdAt || (registration as any).date)}</p>
            </div>
          </div>
        </div>

        {/* Top Confirmation Header (Screen View) */}
        <div className="p-6 bg-purple-900 text-white flex items-center justify-between print-exact print:bg-purple-900 print:text-white print:p-3 print:rounded-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-full shrink-0 print-exact">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white print:text-white">Registration Summary & Invoice</h2>
              <p className="text-xs text-purple-200 print:text-purple-100">
                Invoice #{registration.id.slice(-8).toUpperCase()} • {formatSafeDate(registration.timestamp || (registration as any).createdAt || (registration as any).date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={onClose}
              className="p-1.5 text-purple-200 hover:text-white hover:bg-purple-800 rounded-full transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] print:max-h-none overflow-y-auto print:overflow-visible print:p-2 print:space-y-2">
          {/* Registrant & Student Details */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 print:bg-slate-50 print-exact print:p-2.5 print:space-y-1 print:border-slate-300">
            <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Student & Contact Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs print:gap-x-4 print:gap-y-1">
              <div>
                <span className="text-gray-500">Student Name:</span>
                <span className="font-bold text-gray-900 ml-1">{studentNameVal}</span>
                <span className="text-gray-500 ml-1">
                  (Age {studentAgeVal}, Grade {gradeLevelVal})
                </span>
              </div>
              <div>
                <span className="text-gray-500">Parent/Guardian:</span>
                <span className="font-bold text-gray-900 ml-1">{parentNameVal}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="font-medium text-gray-900 ml-1">{parentEmailVal}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="font-medium text-gray-900 ml-1">{phoneVal}</span>
              </div>
            </div>
          </div>

          {/* Enrolled Classes List */}
          <div>
            <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 print:mb-1">
              Enrolled Classes ({selectedClasses.length})
            </div>

            <div className="space-y-2 print:space-y-1">
              {selectedClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3 bg-white border border-gray-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs print:border-slate-300 print:p-2 print:my-0.5"
                >
                  <div>
                    <div className="font-bold text-gray-900 text-sm print:text-xs">{cls?.title || 'Unknown Class'}</div>
                    <div className="text-gray-500 flex items-center gap-3 mt-1 text-[11px] print:text-[10px] print:mt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-purple-600 print:hidden" />
                        {cls?.schedule || 'N/A'}
                      </span>
                      <span>Instructor: {cls?.instructor || 'N/A'}</span>
                      <span>Location: {cls?.location || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="font-bold text-purple-900 text-sm print:text-black print:text-xs">{formatUSD(cls?.price ?? 0)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Breakdown & Discounts */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs print-exact print:p-2.5 print:space-y-1 print:border-slate-300">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatUSD(registration?.subtotal ?? 0)}</span>
            </div>

            {appliedDiscounts.map((d, i) => (
              <div key={i} className="flex justify-between text-emerald-700 font-medium print:text-emerald-800">
                <span>✓ {d?.name || 'Discount'} ({d?.description || ''}):</span>
                <span className="font-bold">-{formatUSD(d?.amountOff ?? 0)}</span>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-gray-900 print:text-sm print:pt-1">
              <span>Tuition Fee:</span>
              <span className="text-purple-900 print:text-slate-900">{formatUSD(registration?.totalPrice ?? 0)}</span>
            </div>
          </div>

          {/* Print-only Verification Footer */}
          <div className="hidden print:flex pt-3 border-t border-slate-300 text-[10px] text-slate-500 justify-between items-end">
            <div>
              <p className="font-bold text-slate-700">Shaw STEM Academy Registration Office</p>
              <p>Thank you for registering. Please retain this invoice / receipt for your records.</p>
            </div>
            <div className="text-right font-mono">
              VERIFIED RECORD • {registration.id}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Confirmation sent to {studentInfo.parentEmail}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Invoice (PDF)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-purple-700" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
