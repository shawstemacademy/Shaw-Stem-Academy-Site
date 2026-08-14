import { ClassItem } from '../types';
import { saveDocToFirestore } from './firebase';

export interface CourseRegistrationEmailPayload {
  studentName: string;
  studentEmail: string;
  parentEmail?: string;
  selectedClasses: ClassItem[];
  subtotal: number;
  appliedDiscounts?: { name: string; amount: number }[];
  totalPrice: number;
  totalPaid?: number;
  isUpdate?: boolean;
}

export interface AddDropEmailPayload {
  studentName: string;
  studentEmail: string;
  parentEmail?: string;
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
 * Sends a registration confirmation email with detailed course breakdown and add/drop policy
 */
export async function sendCourseRegistrationEmail(payload: CourseRegistrationEmailPayload): Promise<boolean> {
  const {
    studentName,
    studentEmail,
    parentEmail,
    selectedClasses = [],
    subtotal,
    appliedDiscounts = [],
    totalPrice,
    totalPaid = 0,
    isUpdate = false,
  } = payload;

  if (!studentEmail) return false;

  const recipients: string[] = [studentEmail.trim()];
  if (parentEmail && parentEmail.trim() && parentEmail.trim().toLowerCase() !== studentEmail.trim().toLowerCase()) {
    recipients.push(parentEmail.trim());
  }

  const outstandingBalance = Math.max(0, totalPrice - totalPaid);
  const totalDiscount = appliedDiscounts.reduce((sum, d) => sum + (d.amount || 0), 0);

  const subject = isUpdate
    ? `🎓 Course Schedule Updated - Shaw STEM Academy [${studentName}]`
    : `🎓 Course Registration Confirmation - Shaw STEM Academy [${studentName}]`;

  const classesHtmlRows = selectedClasses.map((cls, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px 16px; font-weight: bold; color: #1e293b; font-size: 14px;">
        ${idx + 1}. ${cls.title}
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

  const discountsHtml = appliedDiscounts.length > 0 ? `
    <div style="margin-top: 12px; padding: 12px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
      <div style="font-size: 12px; font-weight: bold; color: #166534; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
        Discounts & Bundles Applied:
      </div>
      ${appliedDiscounts.map(d => `
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #15803d; margin-top: 2px;">
          <span>• ${d.name}</span>
          <span style="font-weight: bold;">-$${d.amount.toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const html = `
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
            Shaw STEM Academy • Course Registration
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
            ${isUpdate ? 'Schedule Update Confirmation' : 'Official Course Registration'}
          </h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #c7d2fe;">
            Thank you for enrolling in Shaw STEM Academy's science and technology curriculum.
          </p>
        </div>

        <!-- Content Body -->
        <div style="padding: 28px 24px;">
          
          <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
            Dear <strong>${studentName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            ${isUpdate 
              ? 'Your course registration selections have been successfully updated in our academic database. Below is the full breakdown of your registered courses and current tuition ledger.'
              : 'Your course registration has been successfully received and recorded in our academic database. Below is the breakdown of your enrolled courses and tuition ledger.'}
          </p>

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

          <!-- Next Steps -->
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
              Next Steps:
            </h3>
            <ol style="font-size: 13px; color: #475569; line-height: 1.6; padding-left: 20px; margin: 0;">
              <li>Log in to your <strong>Student Portal</strong> to monitor your application acceptance status.</li>
              <li>Submit tuition payment for your outstanding balance ($${outstandingBalance.toFixed(2)}).</li>
              <li>Once payment is verified, your official classroom access and Google Meet links will be activated.</li>
            </ol>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
              Shaw STEM Academy • 123 Innovation Drive, Technology Park • admissions@shawstemacademy.edu
            </p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Shaw STEM Academy - Course Registration Confirmation
    ====================================================
    Dear ${studentName},

    ${isUpdate ? 'Your course registration selections have been updated.' : 'Your course registration has been received.'}

    Registered Courses:
    ${selectedClasses.map((c, i) => `${i + 1}. ${c.title} (${c.category || 'CSEC'}) - $${(c.price || 0).toFixed(2)} [Instructor: ${c.instructor || 'TBA'}, Schedule: ${c.schedule || 'Flexible'}]`).join('\n')}

    Financial Summary:
    • Subtotal: $${subtotal.toFixed(2)}
    • Discounts: -$${totalDiscount.toFixed(2)}
    • Total Tuition Due: $${totalPrice.toFixed(2)}
    • Total Paid: $${totalPaid.toFixed(2)}
    • Outstanding Balance: $${outstandingBalance.toFixed(2)}

    Policy Notice:
    Students may change courses freely before payment. After payment has been made, course adjustments must be submitted via the official Add/Drop Form and approved by the Registrar.

    Shaw STEM Academy Admissions Office
  `;

  const result = await sendEmailDirectly({
    to: recipients,
    subject,
    html,
    text,
    type: 'course_registration',
    metadata: {
      studentName,
      studentEmail,
      courseCount: selectedClasses.length,
      totalPrice,
      outstandingBalance,
      isUpdate,
    },
  });

  return result.success;
}

/**
 * Sends an email notifying the student about the Add/Drop review outcome and tuition adjustment
 */
export async function sendAddDropStatusEmail(payload: AddDropEmailPayload): Promise<boolean> {
  const {
    studentName,
    studentEmail,
    parentEmail,
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

  const recipients: string[] = [studentEmail.trim()];
  if (parentEmail && parentEmail.trim() && parentEmail.trim().toLowerCase() !== studentEmail.trim().toLowerCase()) {
    recipients.push(parentEmail.trim());
  }

  const isApproved = status === 'approved';
  const isDrop = type === 'drop';

  const subject = isApproved
    ? `✅ Add/Drop Request Approved: ${isDrop ? 'Course Dropped' : 'Course Added'} [${courseTitle}]`
    : `❌ Add/Drop Request Update: [${courseTitle}]`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <div style="background: ${isApproved ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)' : 'linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)'}; padding: 28px 24px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 800;">
            Add / Drop Request Decision
          </h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.85);">
            Reviewed by ${reviewedBy}
          </p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">
            Dear <strong>${studentName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Your request to <strong>${isDrop ? 'drop' : 'add'}</strong> the course <strong>${courseTitle}</strong> has been <strong>${status.toUpperCase()}</strong> by the administration.
          </p>

          <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">
              Request Summary & Financial Ledger Adjustment
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
              <span style="color: #64748b;">Course:</span>
              <span style="font-weight: 700; color: #0f172a;">${courseTitle}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
              <span style="color: #64748b;">Request Type:</span>
              <span style="font-weight: 700; text-transform: uppercase; color: ${isDrop ? '#dc2626' : '#16a34a'};">${type}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
              <span style="color: #64748b;">Tuition Adjustment:</span>
              <span style="font-weight: 800; color: ${isDrop ? '#dc2626' : '#16a34a'};">
                ${isDrop ? `-$${effectivePrice.toFixed(2)} deduction` : `+$${effectivePrice.toFixed(2)} addition`}
              </span>
            </div>
            ${newTotalTuition !== undefined ? `
              <div style="border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-size: 15px; font-weight: 800;">
                <span style="color: #0f172a;">Updated Total Tuition:</span>
                <span style="color: #4338ca;">$${newTotalTuition.toFixed(2)}</span>
              </div>
            ` : ''}
          </div>

          ${reviewNotes ? `
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
              <div style="font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; margin-bottom: 4px;">
                Reviewer Notes:
              </div>
              <p style="margin: 0; font-size: 13px; color: #78350f; font-style: italic;">
                "${reviewNotes}"
              </p>
            </div>
          ` : ''}

          <div style="font-size: 13px; line-height: 1.6; color: #475569; margin-top: 16px;">
            ${isApproved
              ? (isDrop 
                  ? 'The course has been removed from your active schedule and your tuition ledger has been reduced. If your previous payments exceed your new tuition balance, an overpayment refund or credit will be verified and issued by the Registrar.'
                  : 'The course has been added to your schedule and the tuition fee has been added to your ledger. Please ensure the payment difference is submitted through your student portal.')
              : 'Your request was not approved at this time. Your existing class schedule and tuition ledger remain unchanged.'}
          </div>

          <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
            Shaw STEM Academy Registrar Office • questions? Contact admissions@shawstemacademy.edu
          </div>
        </div>

      </div>
    </body>
    </html>
  `;

  const text = `
    Shaw STEM Academy - Add/Drop Request ${status.toUpperCase()}
    ==========================================================
    Dear ${studentName},

    Your request to ${type} "${courseTitle}" has been ${status.toUpperCase()}.
    Tuition Adjustment: ${isDrop ? `-$${effectivePrice.toFixed(2)} deduction` : `+$${effectivePrice.toFixed(2)} addition`}
    ${reviewNotes ? `Reviewer Notes: ${reviewNotes}\n` : ''}
    ${newTotalTuition !== undefined ? `Updated Total Tuition: $${newTotalTuition.toFixed(2)}\n` : ''}

    Shaw STEM Academy Registrar Office
  `;

  const result = await sendEmailDirectly({
    to: recipients,
    subject,
    html,
    text,
    type: 'add_drop_status',
    metadata: {
      studentName,
      studentEmail,
      type,
      courseTitle,
      status,
      effectivePrice,
      reviewedBy,
    },
  });

  return result.success;
}
