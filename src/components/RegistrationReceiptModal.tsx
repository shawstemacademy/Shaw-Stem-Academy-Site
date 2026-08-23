import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RegistrationRecord, FormTheme } from '../types';
import { X, CheckCircle2, Printer, Download, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { formatUSD } from '../lib/formatCurrency';
import { formatSafeDate } from '../lib/formatDate';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface RegistrationReceiptModalProps {
  registration: RegistrationRecord | null;
  onClose: () => void;
  theme: FormTheme;
  logoUrl?: string;
}

export const RegistrationReceiptModal: React.FC<RegistrationReceiptModalProps> = ({
  registration,
  onClose,
  theme,
  logoUrl,
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

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

  const handleDownloadPdf = async () => {
    const cardElement = document.getElementById('printable-invoice-card');
    if (!cardElement) return;

    setIsDownloadingPdf(true);
    try {
      // Find the scroll container and temporarily override max-height and overflow
      // so html2canvas captures the full document without clipping or scrollbars
      const contentScrollContainer = cardElement.querySelector('.invoice-content-scroll');
      const originalMaxHeight = contentScrollContainer ? (contentScrollContainer as HTMLElement).style.maxHeight : '';
      const originalOverflow = contentScrollContainer ? (contentScrollContainer as HTMLElement).style.overflowY : '';
      
      if (contentScrollContainer) {
        (contentScrollContainer as HTMLElement).style.maxHeight = 'none';
        (contentScrollContainer as HTMLElement).style.overflowY = 'visible';
      }

      // Briefly wait to ensure repaint occurs
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: cardElement.scrollWidth,
        windowHeight: cardElement.scrollHeight,
        ignoreElements: (element) => {
          return element.classList.contains('no-pdf-export');
        }
      });

      // Restore constraints
      if (contentScrollContainer) {
        (contentScrollContainer as HTMLElement).style.maxHeight = originalMaxHeight;
        (contentScrollContainer as HTMLElement).style.overflowY = originalOverflow;
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const margin = 10; // 10mm margins
      const imgWidth = pdfWidth - (margin * 2); 
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - (margin * 2));

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - (margin * 2));
      }

      const receiptCode = registration.id.slice(-8).toUpperCase();
      const cleanStudentName = studentNameVal.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Shaw_STEM_Academy_Invoice_${receiptCode}_${cleanStudentName}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const modalContent = (
    <div className="printable-receipt-backdrop fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static print:block print:overflow-visible">
      <div 
        id="printable-invoice-card"
        className="printable-receipt-card bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden my-8 print:my-0 print:shadow-none print:border-none print:max-w-full print:rounded-none"
      >
        {/* Academy Official Invoice Header - Always Visible */}
        <div className="p-6 border-b border-gray-150 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Shaw STEM Academy Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-12 h-12 bg-purple-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md border border-purple-800 shrink-0">
                S
              </div>
            )}
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">SHAW STEM ACADEMY</h1>
              <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider mt-1.5">Official Student Registration Invoice</p>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-600">
            <p className="font-extrabold text-slate-950">Invoice ID: #{registration.id.slice(-8).toUpperCase()}</p>
            <p className="mt-0.5">Date: {formatSafeDate(registration.timestamp || (registration as any).createdAt || (registration as any).date)}</p>
          </div>
        </div>

        {/* Top Confirmation Header (Screen View) */}
        <div className="p-4 bg-purple-900 text-white flex items-center justify-between print-exact print:bg-purple-900 print:text-white print:rounded-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-full shrink-0 print-exact">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Registration Confirmation</h2>
              <p className="text-[11px] text-purple-200">
                Thank you for your registration submission.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden no-pdf-export">
            <button
              onClick={onClose}
              className="p-1.5 text-purple-200 hover:text-white hover:bg-purple-800 rounded-full transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content container */}
        <div className="p-6 space-y-6 max-h-[60vh] print:max-h-none overflow-y-auto print:overflow-visible print:p-2 print:space-y-4 invoice-content-scroll">
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
                    <div className="font-bold text-gray-900 text-sm print:text-xs">
                      {cls?.title || 'Unknown Class'}
                      {cls?.isSbaHub && (
                        <span className="ml-1.5 text-[8px] px-1 py-0.2 bg-purple-100 text-purple-800 border border-purple-200 rounded uppercase font-bold tracking-wider">SBA Hub</span>
                      )}
                    </div>
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

          {/* Official Signature and Stamp Section */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 mt-6 print:mt-4 print:pt-4">
            <div className="flex flex-col justify-end space-y-4">
              <div className="h-10 border-b border-slate-400 border-dashed w-4/5 relative">
                <span className="absolute bottom-1 left-2 font-serif italic text-sm text-purple-800 opacity-60">
                  Shaw STEM Registrar
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-850">Authorized Signature</p>
                <p className="text-[10px] text-slate-500">Shaw STEM Academy Administration</p>
              </div>
            </div>

            <div className="flex flex-col items-end justify-center">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-purple-300 flex flex-col items-center justify-center text-center p-1.5 bg-purple-50/10">
                <span className="text-[8px] font-bold text-purple-500 uppercase tracking-widest leading-tight">SHAW STEM</span>
                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">ACADEMY</span>
                <div className="w-8 h-[1px] bg-purple-200 my-1"></div>
                <span className="text-[8px] font-bold text-emerald-600 uppercase">OFFICIAL</span>
                <span className="text-[7px] font-semibold text-slate-400">STAMP</span>
              </div>
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
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex items-center justify-between print:hidden no-pdf-export">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="truncate max-w-[200px]">Confirmation sent to {studentInfo.parentEmail}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloadingPdf ? 'Downloading...' : 'Download PDF'}</span>
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

  return createPortal(modalContent, document.body);
};
