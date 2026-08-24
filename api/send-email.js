import nodemailer from 'nodemailer';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp = null;
let adminDb = null;

function initializeFirebaseAdmin() {
  if (adminDb) return { adminDb };
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "shawstemacademy-c0039";
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    try {
      adminDb = getFirestore(adminApp);
    } catch (_) {}
    return { adminDb };
  }
  if (serviceAccountVar) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      adminDb = getFirestore(adminApp);
    } catch (err) {
      console.warn('Firebase Admin SDK warning:', err.message || err);
    }
  }
  return { adminDb };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, cc, bcc, subject, html, text, type, metadata } = req.body || {};
  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'Missing required parameters (to, subject, and html/text).' });
  }

  const emailRecord = {
    to: Array.isArray(to) ? to : [to],
    cc: cc ? (Array.isArray(cc) ? cc : [cc]) : [],
    bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [],
    subject,
    html: html || '',
    text: text || '',
    type: type || 'general',
    metadata: metadata || {},
    status: 'sent',
    sentAt: new Date().toISOString(),
  };

  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || 'shawstemacademy@gmail.com';
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    let messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (smtpHost && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Shaw STEM Academy" <${smtpUser}>`,
        to: emailRecord.to.join(', '),
        cc: emailRecord.cc.length > 0 ? emailRecord.cc.join(', ') : undefined,
        bcc: emailRecord.bcc.length > 0 ? emailRecord.bcc.join(', ') : undefined,
        subject: emailRecord.subject,
        text: emailRecord.text,
        html: emailRecord.html,
      });
      messageId = info.messageId || messageId;
    }

    try {
      const { adminDb } = initializeFirebaseAdmin();
      if (adminDb) {
        const logId = `EMAIL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await adminDb.collection('email_logs').doc(logId).set({
          ...emailRecord,
          id: logId,
          messageId,
        });

        await adminDb.collection('mail').add({
          to: emailRecord.to,
          message: {
            subject: emailRecord.subject,
            text: emailRecord.text,
            html: emailRecord.html,
          },
          sentAt: new Date().toISOString(),
        });
      }
    } catch (fsErr) {
      console.warn('Could not record email to Firestore:', fsErr.message || fsErr);
    }

    return res.status(200).json({
      success: true,
      message: `Email successfully sent to ${Array.isArray(to) ? to.join(', ') : to}`,
      messageId
    });
  } catch (error) {
    console.error('Error sending email:', error.message || error);
    return res.status(500).json({
      error: error.message || 'Failed to dispatch email.',
      success: false
    });
  }
}
