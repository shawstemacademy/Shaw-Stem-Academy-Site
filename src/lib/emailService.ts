import { ClassItem } from '../types';
import { saveDocToFirestore } from './firebase';

export interface CourseRegistrationEmailPayload {
  studentName: string;
  studentEmail: string;
  parentEmail?: string;
  parentName?: string;
  selectedClasses: ClassItem[];
  subtotal: number;
  appliedDiscounts?: { name: string; amountOff: number }[];
  totalPrice: number;
  totalPaid?: number;
  isUpdate?: boolean;
}

export interface AddDropEmailPayload {
  studentName: string;
  studentEmail: string;
  parentEmail?: string;
  parentName?: string;
  type: 'add' | 'drop';
  courseTitle: string;
  status: 'approved' | 'rejected';
  effectivePrice: number;
  originalPrice?: number;
  reviewNotes?: string;
  reviewedBy?: string;
  newTotalTuition?: number;
  totalPaid?: number;
}

export interface AdmissionDecisionEmailPayload {
  studentName: string;
  studentEmail: string;
  parentEmail?: string;
  parentName?: string;
  decision: 'ACCEPTED' | 'DENIED';
  notes?: string;
  denialReasons?: { fieldLabel: string; reason: string }[];
}

export interface PaymentEmailPayload {
  studentName: string;
  studentEmail: string;
  parentEmail?: string;
  parentName?: string;
  amount: number;
  isRefund: boolean;
  totalTuition: number;
  remainingBalance: number;
  notes?: string;
}

/**
 * Sends an email via backend /api/send-email and saves backup log to Firestore
 */
export async function sendEmailDirectly(payload: {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  text: string;
  type?: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; messageId?: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, messageId: data.messageId };
    } else {
      console.warn('API send-email returned non-200 status:', response.status);
    }
  } catch (err) {
    console.warn('Direct /api/send-email fetch failed (offline or container mode), writing directly to Firestore:', err);
  }

  // Backup log in Firestore
  try {
    const logId = `EMAIL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await saveDocToFirestore('email_logs', logId, {
      ...payload,
      id: logId,
      status: 'dispatched',
      createdAt: new Date().toISOString(),
    });
    return { success: true, messageId: logId };
  } catch (fsErr) {
    console.error('Failed to log email to Firestore:', fsErr);
    return { success: false };
  }
}

/**
 * Common HTML wrap for academy branding
 */
function getEmailHtmlTemplate(subject: string, bannerSubtitle: string, recipientContentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b;">
      <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; background-color: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
            Shaw STEM Academy
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
            ${subject}
          </h1>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #c7d2fe;">
            ${bannerSubtitle}
          </p>
        </div>

        <!-- Content Body -->
        <div style="padding: 28px 24px;">
          ${recipientContentHtml}
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; margin-top: 24px;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.5;">
              Shaw STEM Academy • 123 Innovation Drive, Technology Park • admissions@shawstemacademy.edu<br/>
              This is an official transactional message regarding your academic profile and billing.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Helper to build course selection table
 */
function getClassesHtmlRows(selectedClasses: ClassItem[]): string {
  return selectedClasses.map((cls, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px 16px; font-weight: bold; color: #1e293b; font-size: 14px;">
        ${idx + 1}. ${cls.title || (cls as any).name}
        <div style="font-size: 12px; color: #64748b; font-weight: normal; margin-top: 2px;">
          Instructor: ${cls.instructor || 'Staff'} • Schedule: ${cls.schedule || 'Flexible'}
        </div>
      </td>
      <td style="padding: 12px 16px; color: #475569; font-size: 13px; text-align: center;">
        <span style="background-color: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; color: #0f172a;">
          ${cls.category || 'CSEC'}
        </span>
      </td>
      <td style="padding: 12px 16px; font-weight: bold; color: #0f172a; font-size: 14px; text-align: right;">
        $${(cls.price || 0).toFixed(2)}
      </td>
    </tr>
  `).join('');
}

/**
 * 1. Sends tailored registration / modification confirmation emails to student and parent/guardian
 */
export async function sendCourseRegistrationEmail(payload: CourseRegistrationEmailPayload): Promise<boolean> {
  const {
    studentName,
    studentEmail,
    parentEmail,
    parentName,
    selectedClasses = [],
    subtotal,
    appliedDiscounts = [],
    totalPrice,
    totalPaid = 0,
    isUpdate = false,
  } = payload;

  if (!studentEmail) return false;

  const outstandingBalance = Math.max(0, totalPrice - totalPaid);
  const totalDiscount = appliedDiscounts.reduce((sum, d) => sum + (d.amountOff || 0), 0);

  const classesHtmlRows = getClassesHtmlRows(selectedClasses);

  const discountsHtml = appliedDiscounts.length > 0 ? `
    <div style="margin-top: 12px; padding: 12px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
      <div style="font-size: 12px; font-weight: bold; color: #166534; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
        Discounts & Bundles Applied:
      </div>
      ${appliedDiscounts.map(d => `
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #15803d; margin-top: 2px;">
          <span>• ${d.name}</span>
          <span style="font-weight: bold;">-$${d.amountOff.toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const financialSummaryHtml = `
    <!-- Financial Breakdown -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; font-size: 14px; color: #475569; margin-bottom: 8px;">
        <span>Course Subtotal (${selectedClasses.length} class${selectedClasses.length === 1 ? '' : 'es'}):</span>
        <span style="font-weight: 600;">$${subtotal.toFixed(2)}</span>
      </div>

      ${totalDiscount > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #16a34a; margin-bottom: 8px;">
          <span>Total Discounts Applied:</span>
          <span style="font-weight: 600;">-$${totalDiscount.toFixed(2)}</span>
        </div>
      ` : ''}

      ${discountsHtml}

      <div style="border-top: 2px solid #e2e8f0; margin-top: 14px; padding-top: 14px; display: flex; justify-content: space-between; font-size: 16px; color: #0f172a; font-weight: 800;">
        <span>Total Tuition Due:</span>
        <span style="color: #4338ca; font-size: 18px;">$${totalPrice.toFixed(2)}</span>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 14px; color: #475569; margin-top: 8px;">
        <span>Total Paid to Date:</span>
        <span style="font-weight: 600; color: ${totalPaid > 0 ? '#16a34a' : '#64748b'};">$${totalPaid.toFixed(2)}</span>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 15px; color: #0f172a; font-weight: 700; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
        <span>Outstanding Balance Remaining:</span>
        <span style="color: ${outstandingBalance > 0 ? '#dc2626' : '#16a34a'}; font-weight: 800;">$${outstandingBalance.toFixed(2)}</span>
      </div>
    </div>

    <!-- IMPORTANT POLICY NOTICE -->
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 10px 10px 0; margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
        📋 Important Course Modification & Add/Drop Policy
      </div>
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #1e3a8a;">
        <strong>Before Payment:</strong> You may adjust or change your selected courses freely using the Course Registration form in your student portal.<br/>
        <strong>After Payment:</strong> Once tuition payment has been submitted, direct course modifications are locked. Any subsequent course additions or drops must be requested through the official <strong>Add / Drop Form</strong> in your student portal and approved by the Office of the Registrar.
      </p>
    </div>
  `;

  const classesTableHtml = `
    <!-- Course Table -->
    <div style="margin: 24px 0; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 12px 16px; font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase;">Course Title</th>
            <th style="padding: 12px 16px; font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase; text-align: center;">Category</th>
            <th style="padding: 12px 16px; font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase; text-align: right;">List Price</th>
          </tr>
        </thead>
        <tbody>
          ${classesHtmlRows}
        </tbody>
      </table>
    </div>
  `;

  let studentSuccess = false;
  let parentSuccess = false;

  // -- DISPATCH 1: TAILORED EMAIL TO STUDENT --
  const studentSubject = isUpdate
    ? `🎓 Course Schedule Updated - Shaw STEM Academy`
    : `🎓 Course Registration Confirmation - Shaw STEM Academy`;

  const studentContentHtml = `
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
      Dear <strong>${studentName}</strong>,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      ${isUpdate 
        ? 'Your course registration selections have been successfully updated in our academic database. Below is the full breakdown of your updated courses and tuition balance.'
        : 'Your course registration has been successfully received and recorded. Below is the full breakdown of your enrolled courses and tuition ledger.'}
    </p>
    
    ${classesTableHtml}
    ${financialSummaryHtml}

    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Next Steps:
      </h3>
      <ol style="font-size: 13px; color: #475569; line-height: 1.6; padding-left: 20px; margin: 0;">
        <li>Log in to your <strong>Student Portal</strong> to monitor your application acceptance status.</li>
        <li>Review your outstanding tuition balance of $${outstandingBalance.toFixed(2)}.</li>
        <li>Once payment is verified, your official classroom access and Google Meet links will unlock.</li>
      </ol>
    </div>
  `;

  const studentHtml = getEmailHtmlTemplate(studentSubject, 'Academic Enrollment confirmation', studentContentHtml);
  const studentText = `
    Shaw STEM Academy - Course Registration Confirmation
    ====================================================
    Dear ${studentName},

    ${isUpdate ? 'Your course registration selections have been updated.' : 'Your course registration has been received.'}

    Registered Courses:
    ${selectedClasses.map((c, i) => `${i + 1}. ${c.title} (${c.category || 'CSEC'}) - $${(c.price || 0).toFixed(2)}`).join('\n')}

    Financial Summary:
    • Total Tuition Due: $${totalPrice.toFixed(2)}
    • Outstanding Balance: $${outstandingBalance.toFixed(2)}
  `;

  const studentResult = await sendEmailDirectly({
    to: studentEmail.trim(),
    subject: studentSubject,
    html: studentHtml,
    text: studentText,
    type: 'course_registration_student',
    metadata: { studentName, studentEmail, totalPrice, isUpdate },
  });
  studentSuccess = studentResult.success;

  // -- DISPATCH 2: TAILORED EMAIL TO PARENT/GUARDIAN --
  const actualParentEmail = parentEmail?.trim();
  const hasParent = actualParentEmail && actualParentEmail.toLowerCase() !== studentEmail.trim().toLowerCase();

  if (hasParent) {
    const parentSubject = isUpdate
      ? `🎓 Course Schedule Updated for ${studentName} - Shaw STEM Academy`
      : `🎓 Course Registration Confirmation for your child, ${studentName} - Shaw STEM Academy`;

    const parentDisplayName = parentName?.trim() || 'Parent / Guardian';

    const parentContentHtml = `
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
        Dear <strong>${parentDisplayName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        We are writing to confirm that your child, <strong>${studentName}</strong>, has successfully ${isUpdate ? 'updated' : 'registered'} their class selections for the upcoming academic period at Shaw STEM Academy. Below are the registered courses and associated tuition summary for your child.
      </p>
      
      ${classesTableHtml}
      ${financialSummaryHtml}

      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
          Next Steps for Parents:
        </h3>
        <ol style="font-size: 13px; color: #475569; line-height: 1.6; padding-left: 20px; margin: 0;">
          <li>Review the outstanding tuition ledger of $${outstandingBalance.toFixed(2)} for ${studentName}.</li>
          <li>Submit payment via Zelle or other supported payment portals.</li>
          <li>Our admissions department will finalize classroom credentials once tuition is recorded.</li>
        </ol>
      </div>
    `;

    const parentHtml = getEmailHtmlTemplate(parentSubject, 'Parent / Guardian Tuition & Registration Ledger', parentContentHtml);
    const parentText = `
      Shaw STEM Academy - Parent Registration Confirmation
      ====================================================
      Dear ${parentDisplayName},

      This email confirms that your child, ${studentName}, has successfully ${isUpdate ? 'updated' : 'registered'} classes at Shaw STEM Academy.

      Registered Courses for ${studentName}:
      ${selectedClasses.map((c, i) => `${i + 1}. ${c.title} - $${(c.price || 0).toFixed(2)}`).join('\n')}

      Financial Summary:
      • Total Tuition Due: $${totalPrice.toFixed(2)}
      • Outstanding Balance: $${outstandingBalance.toFixed(2)}
    `;

    const parentResult = await sendEmailDirectly({
      to: actualParentEmail,
      subject: parentSubject,
      html: parentHtml,
      text: parentText,
      type: 'course_registration_parent',
      metadata: { studentName, parentEmail: actualParentEmail, totalPrice, isUpdate },
    });
    parentSuccess = parentResult.success;
  } else {
    parentSuccess = true; // No parent email to send, count as complete
  }

  return studentSuccess && parentSuccess;
}

/**
 * 2. Sends tailored Add/Drop decision decision emails to student and parent/guardian
 */
export async function sendAddDropStatusEmail(payload: AddDropEmailPayload): Promise<boolean> {
  const {
    studentName,
    studentEmail,
    parentEmail,
    parentName,
    type,
    courseTitle,
    status,
    effectivePrice,
    reviewNotes,
    reviewedBy = 'Office of the Registrar',
    newTotalTuition,
    totalPaid = 0,
  } = payload;

  if (!studentEmail) return false;

  const isApproved = status === 'approved';
  const isDrop = type === 'drop';

  const outstandingBalance = newTotalTuition !== undefined ? Math.max(0, newTotalTuition - totalPaid) : 0;

  const ledgerSummaryHtml = `
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0; margin: 20px 0;">
      <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">
        Request Summary & Financial Ledger Adjustment
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
        <span style="color: #64748b;">Course Name:</span>
        <span style="font-weight: 700; color: #0f172a;">${courseTitle}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
        <span style="color: #64748b;">Request Type:</span>
        <span style="font-weight: 700; text-transform: uppercase; color: ${isDrop ? '#dc2626' : '#16a34a'};">${type} Request</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
        <span style="color: #64748b;">Tuition Balance Change:</span>
        <span style="font-weight: 800; color: ${isDrop ? '#dc2626' : '#16a34a'};">
          ${isDrop ? `-$${effectivePrice.toFixed(2)} deduction` : `+$${effectivePrice.toFixed(2)} addition`}
        </span>
      </div>
      ${newTotalTuition !== undefined ? `
        <div style="border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-size: 15px; font-weight: 800;">
          <span style="color: #0f172a;">Revised Total Tuition:</span>
          <span style="color: #4338ca;">$${newTotalTuition.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #475569; margin-top: 6px;">
          <span>Remaining Balance:</span>
          <span style="font-weight: 700; color: ${outstandingBalance > 0 ? '#dc2626' : '#16a34a'};">$${outstandingBalance.toFixed(2)}</span>
        </div>
      ` : ''}
    </div>
  `;

  const notesHtml = reviewNotes ? `
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; margin-bottom: 4px;">
        Reviewer Memo:
      </div>
      <p style="margin: 0; font-size: 13px; color: #78350f; font-style: italic;">
        "${reviewNotes}"
      </p>
    </div>
  ` : '';

  let studentSuccess = false;
  let parentSuccess = false;

  // -- DISPATCH 1: TAILORED EMAIL TO STUDENT --
  const studentSubject = isApproved
    ? `✅ Add/Drop Approved: ${isDrop ? 'Course Dropped' : 'Course Added'} [${courseTitle}]`
    : `❌ Add/Drop Request Update: [${courseTitle}]`;

  const studentContentHtml = `
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
      Dear <strong>${studentName}</strong>,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Your request to <strong>${isDrop ? 'drop' : 'add'}</strong> the course <strong>${courseTitle}</strong> has been officially <strong>${status.toUpperCase()}</strong> by the Registrar's Office.
    </p>

    ${ledgerSummaryHtml}
    ${notesHtml}

    <p style="font-size: 13px; line-height: 1.6; color: #475569;">
      ${isApproved
        ? (isDrop 
            ? 'The class has been removed from your active curriculum. Your tuition balance has been successfully adjusted. If you have an overpayment credit, it will be automatically calculated on your invoice.'
            : 'The class is now successfully added to your curriculum roster. Please ensure any tuition payment differences are cleared through your Student Portal to activate full classroom links.')
        : 'Your request was not approved at this time. Your existing class schedule and tuition ledger remain unchanged.'}
    </p>
  `;

  const studentHtml = getEmailHtmlTemplate(studentSubject, 'Academic Schedule & Ledger Modification', studentContentHtml);
  const studentText = `
    Shaw STEM Academy - Add/Drop Request ${status.toUpperCase()}
    ==========================================================
    Dear ${studentName},

    Your request to ${type} "${courseTitle}" has been ${status.toUpperCase()}.
    Tuition Adjustment: ${isDrop ? `-$${effectivePrice.toFixed(2)} deduction` : `+$${effectivePrice.toFixed(2)} addition`}
    ${reviewNotes ? `Notes: ${reviewNotes}\n` : ''}
  `;

  const studentResult = await sendEmailDirectly({
    to: studentEmail.trim(),
    subject: studentSubject,
    html: studentHtml,
    text: studentText,
    type: 'add_drop_student',
    metadata: { studentName, courseTitle, type, status },
  });
  studentSuccess = studentResult.success;

  // -- DISPATCH 2: TAILORED EMAIL TO PARENT --
  const actualParentEmail = parentEmail?.trim();
  const hasParent = actualParentEmail && actualParentEmail.toLowerCase() !== studentEmail.trim().toLowerCase();

  if (hasParent) {
    const parentSubject = isApproved
      ? `✅ Add/Drop Approved for ${studentName}: ${isDrop ? 'Course Dropped' : 'Course Added'}`
      : `❌ Add/Drop Request Update for ${studentName}`;

    const parentDisplayName = parentName?.trim() || 'Parent / Guardian';

    const parentContentHtml = `
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
        Dear <strong>${parentDisplayName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        We are writing to notify you that we have processed an official academic Add/Drop request submitted by your child, <strong>${studentName}</strong>. The request to <strong>${isDrop ? 'drop' : 'add'}</strong> <strong>${courseTitle}</strong> has been officially <strong>${status.toUpperCase()}</strong>.
      </p>

      ${ledgerSummaryHtml}
      ${notesHtml}

      <p style="font-size: 13px; line-height: 1.6; color: #475569;">
        ${isApproved
          ? (isDrop 
              ? `The course has been removed from ${studentName}'s schedule and tuition dues have been reduced accordingly.`
              : `The course has been added to ${studentName}'s active schedule. Please check your billing dashboard to settle the remaining outstanding fee of $${outstandingBalance.toFixed(2)}.`)
          : `The request was reviewed but declined by administration. ${studentName}'s active courses and billing records remain unchanged.`}
      </p>
    `;

    const parentHtml = getEmailHtmlTemplate(parentSubject, 'Parent / Guardian Billing Notice', parentContentHtml);
    const parentText = `
      Shaw STEM Academy - Parent Add/Drop Notification
      ==========================================================
      Dear ${parentDisplayName},

      An Add/Drop request has been ${status.toUpperCase()} for your child, ${studentName}.
      Request: ${type} "${courseTitle}".
      Tuition Adjustment: ${isDrop ? `-$${effectivePrice.toFixed(2)}` : `+$${effectivePrice.toFixed(2)}`}.
    `;

    const parentResult = await sendEmailDirectly({
      to: actualParentEmail,
      subject: parentSubject,
      html: parentHtml,
      text: parentText,
      type: 'add_drop_parent',
      metadata: { studentName, parentEmail: actualParentEmail, courseTitle, status },
    });
    parentSuccess = parentResult.success;
  } else {
    parentSuccess = true;
  }

  return studentSuccess && parentSuccess;
}

/**
 * 3. Sends tailored Admission Acceptance / Denial status change emails to student and parent/guardian
 */
export async function sendAdmissionDecisionEmail(payload: AdmissionDecisionEmailPayload): Promise<boolean> {
  const {
    studentName,
    studentEmail,
    parentEmail,
    parentName,
    decision,
    notes,
    denialReasons = [],
  } = payload;

  if (!studentEmail) return false;

  const isAccepted = decision === 'ACCEPTED';

  let studentSuccess = false;
  let parentSuccess = false;

  const memoHtml = notes ? `
    <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; border: 1px solid #cbd5e1; margin: 20px 0; font-size: 13px; color: #334155; font-style: italic;">
      " ${notes} "
    </div>
  ` : '';

  // -- DISPATCH 1: TAILORED EMAIL TO STUDENT --
  const studentSubject = isAccepted
    ? `🎉 Admission Acceptance Confirmation - Shaw STEM Academy`
    : `⚠️ Application Status Update: Action Required - Shaw STEM Academy`;

  const studentContentHtml = isAccepted 
    ? `
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
        Dear <strong>${studentName}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #15803d; font-weight: 800;">
        Congratulations! We are absolutely delighted to inform you that your application for admission to Shaw STEM Academy has been officially ACCEPTED.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Our admissions committee reviewed your profile, prerequisites, and registration details. You have shown the excellence and curiosity we seek for our advanced STEM classes.
      </p>
      
      ${memoHtml}

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #cbd5e1; margin: 24px 0;">
        <h3 style="margin-top: 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase;">
          Your Next Steps:
        </h3>
        <ol style="font-size: 13px; color: #475569; line-height: 1.6; padding-left: 20px; margin: 0;">
          <li>Log into your <strong>Student Portal</strong> using your Google or standard account credentials.</li>
          <li>Navigate to the <strong>Tuition / Ledger</strong> panel to review your final billing balance.</li>
          <li>Submit outstanding tuition. Once logged, your live Zoom links and Google Classroom codes will activate.</li>
        </ol>
      </div>
    `
    : `
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
        Dear <strong>${studentName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Thank you for submitting your admissions application to Shaw STEM Academy. Upon review, we found certain details in your profile require revision or correction before we can officially finalize your registration.
      </p>
      
      <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #be123c; font-size: 13px; font-weight: 800; text-transform: uppercase;">
          Items Requiring Your Revision:
        </h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #9f1239; line-height: 1.5;">
          ${denialReasons.map(r => `
            <li style="margin-bottom: 8px;">
              <strong>${r.fieldLabel}:</strong> ${r.reason}
            </li>
          `).join('')}
        </ul>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #475569;">
        Please log back into your student account, edit the highlighted fields in your profile, and resubmit for immediate administrative review.
      </p>
    `;

  const studentHtml = getEmailHtmlTemplate(studentSubject, isAccepted ? 'Official Admissions Status: Accepted' : 'Action Required on Admissions Profile', studentContentHtml);
  const studentText = isAccepted
    ? `Congratulations ${studentName}! Your application to Shaw STEM Academy has been ACCEPTED.`
    : `Dear ${studentName}, your application requires revision: \n` + denialReasons.map(r => `• ${r.fieldLabel}: ${r.reason}`).join('\n');

  const studentResult = await sendEmailDirectly({
    to: studentEmail.trim(),
    subject: studentSubject,
    html: studentHtml,
    text: studentText,
    type: 'admission_decision_student',
    metadata: { studentName, decision },
  });
  studentSuccess = studentResult.success;

  // -- DISPATCH 2: TAILORED EMAIL TO PARENT --
  const actualParentEmail = parentEmail?.trim();
  const hasParent = actualParentEmail && actualParentEmail.toLowerCase() !== studentEmail.trim().toLowerCase();

  if (hasParent) {
    const parentSubject = isAccepted
      ? `🎉 Admission Acceptance for your child, ${studentName}! - Shaw STEM Academy`
      : `⚠️ Application Update for ${studentName}: Action Required - Shaw STEM Academy`;

    const parentDisplayName = parentName?.trim() || 'Parent / Guardian';

    const parentContentHtml = isAccepted
      ? `
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
          Dear <strong>${parentDisplayName}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #15803d; font-weight: 800;">
          We are absolutely delighted to inform you that your child, <strong>${studentName}</strong>, has been officially accepted into Shaw STEM Academy!
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Our academic committee was thoroughly impressed with ${studentName}'s registration profile and readiness for our science and technology curriculum. We are excited to welcome them to our community.
        </p>

        ${memoHtml}

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #cbd5e1; margin: 24px 0;">
          <h3 style="margin-top: 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase;">
            Parent Action Checklist:
          </h3>
          <ol style="font-size: 13px; color: #475569; line-height: 1.6; padding-left: 20px; margin: 0;">
            <li>Access the <strong>Student Portal</strong> with your child.</li>
            <li>Review final billing ledgers and discounts applied.</li>
            <li>Submit tuition. Class access, lab resources, and Google Classroom codes will be generated instantly upon payment confirmation.</li>
          </ol>
        </div>
      `
      : `
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
          Dear <strong>${parentDisplayName}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          We are writing to notify you that we have reviewed the admissions application for your child, <strong>${studentName}</strong>. There are a few specific profile items requiring revision before we can complete their acceptance and schedule active seats.
        </p>

        <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #be123c; font-size: 13px; font-weight: 800; text-transform: uppercase;">
            Items Requiring Attention for ${studentName}:
          </h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #9f1239; line-height: 1.5;">
            ${denialReasons.map(r => `
              <li style="margin-bottom: 8px;">
                <strong>${r.fieldLabel}:</strong> ${r.reason}
              </li>
            `).join('')}
          </ul>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #475569;">
          Please assist ${studentName} in logging back into their account to modify these details so we can fast-track their final acceptance review.
        </p>
      `;

    const parentHtml = getEmailHtmlTemplate(parentSubject, isAccepted ? 'Admissions Committee Decision Announcement' : 'Parent Revision Request Notice', parentContentHtml);
    const parentText = isAccepted
      ? `Dear ${parentDisplayName}, we are pleased to inform you that your child, ${studentName}, has been ACCEPTED to Shaw STEM Academy.`
      : `Dear ${parentDisplayName}, your child's application requires revision. Please log in with them.`;

    const parentResult = await sendEmailDirectly({
      to: actualParentEmail,
      subject: parentSubject,
      html: parentHtml,
      text: parentText,
      type: 'admission_decision_parent',
      metadata: { studentName, parentEmail: actualParentEmail, decision },
    });
    parentSuccess = parentResult.success;
  } else {
    parentSuccess = true;
  }

  return studentSuccess && parentSuccess;
}

/**
 * 4. Sends tailored Tuition Payment / Refund confirmation emails to student and parent/guardian
 */
export async function sendPaymentEmail(payload: PaymentEmailPayload): Promise<boolean> {
  const {
    studentName,
    studentEmail,
    parentEmail,
    parentName,
    amount,
    isRefund,
    totalTuition,
    remainingBalance,
    notes,
  } = payload;

  if (!studentEmail) return false;

  let studentSuccess = false;
  let parentSuccess = false;

  const paymentDetailHtml = `
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; border: 1px solid #cbd5e1; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">
        Official Transaction Receipt Details
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
        <span style="color: #64748b;">Transaction Type:</span>
        <span style="font-weight: 700; text-transform: uppercase; color: ${isRefund ? '#be123c' : '#15803d'};">
          ${isRefund ? 'Admissions Refund issued' : 'Tuition Payment verified'}
        </span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
        <span style="color: #64748b;">Transaction Amount:</span>
        <span style="font-weight: 800; color: ${isRefund ? '#be123c' : '#15803d'};">
          ${isRefund ? `-$${Math.abs(amount).toFixed(2)}` : `+$${Math.abs(amount).toFixed(2)}`}
        </span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1;">
        <span style="color: #64748b;">Total Course Tuition:</span>
        <span style="font-weight: 700; color: #0f172a;">$${totalTuition.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">
        <span>Outstanding Balance:</span>
        <span style="color: ${remainingBalance > 0 ? '#be123c' : '#15803d'};">$${remainingBalance.toFixed(2)}</span>
      </div>
      ${notes ? `
        <div style="font-size: 12px; color: #64748b; font-style: italic; margin-top: 10px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
          Memo: "${notes}"
        </div>
      ` : ''}
    </div>
  `;

  // -- DISPATCH 1: TAILORED EMAIL TO STUDENT --
  const studentSubject = isRefund
    ? `💸 Tuition Refund Processed - Shaw STEM Academy`
    : `🎉 Tuition Payment Received & Verified - Shaw STEM Academy`;

  const studentContentHtml = isRefund
    ? `
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
        Dear <strong>${studentName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        We have successfully processed a tuition refund on your account. The transaction has been balanced and adjusted in our active registrar database.
      </p>
      
      ${paymentDetailHtml}

      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        If you have any questions regarding your course load or refund calculations, please contact our registrar desk.
      </p>
    `
    : `
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
        Dear <strong>${studentName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Thank you! We have successfully received and verified your tuition payment of <strong>$${amount.toFixed(2)}</strong>. Your student account balance has been updated.
      </p>

      ${paymentDetailHtml}

      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
        <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 800; color: #166534; text-transform: uppercase;">
          🎓 Classroom Links Unlocked!
        </h4>
        <p style="margin: 0; font-size: 12px; color: #14532d; line-height: 1.4;">
          Your seats are officially finalized and locked. You can now log into your Student Portal to view your class timetable, access active Google Meet classrooms, and download files.
        </p>
      </div>
    `;

  const studentHtml = getEmailHtmlTemplate(studentSubject, isRefund ? 'Financial Transaction: Refund issued' : 'Financial Transaction: Payment cleared', studentContentHtml);
  const studentText = isRefund
    ? `Dear ${studentName}, a refund of $${Math.abs(amount).toFixed(2)} has been recorded.`
    : `Dear ${studentName}, your payment of $${amount.toFixed(2)} has been successfully recorded.`;

  const studentResult = await sendEmailDirectly({
    to: studentEmail.trim(),
    subject: studentSubject,
    html: studentHtml,
    text: studentText,
    type: 'payment_student',
    metadata: { studentName, amount, isRefund },
  });
  studentSuccess = studentResult.success;

  // -- DISPATCH 2: TAILORED EMAIL TO PARENT --
  const actualParentEmail = parentEmail?.trim();
  const hasParent = actualParentEmail && actualParentEmail.toLowerCase() !== studentEmail.trim().toLowerCase();

  if (hasParent) {
    const parentSubject = isRefund
      ? `💸 Tuition Refund Processed for ${studentName} - Shaw STEM Academy`
      : `🎉 Tuition Payment Received for your child, ${studentName} - Shaw STEM Academy`;

    const parentDisplayName = parentName?.trim() || 'Parent / Guardian';

    const parentContentHtml = isRefund
      ? `
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
          Dear <strong>${parentDisplayName}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          We are writing to notify you that we have officially processed and logged a tuition refund of <strong>$${Math.abs(amount).toFixed(2)}</strong> for your child, <strong>${studentName}</strong>. 
        </p>

        ${paymentDetailHtml}

        <p style="font-size: 13px; color: #475569;">
          The adjusted balance has been successfully recorded in our central financial records.
        </p>
      `
      : `
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
          Dear <strong>${parentDisplayName}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          We have successfully received and verified a tuition payment of <strong>$${amount.toFixed(2)}</strong> submitted for your child, <strong>${studentName}</strong>. Thank you for your payment.
        </p>

        ${paymentDetailHtml}

        <p style="font-size: 13px; line-height: 1.5; color: #475569;">
          Your payment secures ${studentName}'s active courses and materials. All live online classes, labs, and classroom credentials are now fully unreleased and visible in their Student Portal.
        </p>
      `;

    const parentHtml = getEmailHtmlTemplate(parentSubject, isRefund ? 'Parent / Guardian Refund Notification' : 'Parent / Guardian Transaction Receipt', parentContentHtml);
    const parentText = isRefund
      ? `Dear ${parentDisplayName}, a refund of $${Math.abs(amount).toFixed(2)} has been recorded for ${studentName}.`
      : `Dear ${parentDisplayName}, a payment of $${amount.toFixed(2)} has been recorded for ${studentName}.`;

    const parentResult = await sendEmailDirectly({
      to: actualParentEmail,
      subject: parentSubject,
      html: parentHtml,
      text: parentText,
      type: 'payment_parent',
      metadata: { studentName, parentEmail: actualParentEmail, amount, isRefund },
    });
    parentSuccess = parentResult.success;
  } else {
    parentSuccess = true;
  }

  return studentSuccess && parentSuccess;
}
