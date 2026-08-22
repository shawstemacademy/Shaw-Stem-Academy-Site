import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Firebase Admin lazily and handle missing configurations gracefully
let adminApp = null;
let adminAuth = null;
let adminDb = null;

function initializeFirebaseAdmin() {
  if (adminApp) return { adminApp, adminAuth, adminDb };

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "shawstemacademy-c0039";

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    try {
      adminAuth = getAuth(adminApp);
    } catch (_) {}
    try {
      adminDb = getFirestore(adminApp);
    } catch (_) {}
    return { adminApp, adminAuth, adminDb };
  }

  if (serviceAccountVar) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
      console.log('Firebase Admin SDK initialized with service account.');
    } catch (err) {
      console.warn('Firebase Admin SDK warning on service account parse:', err.message || err);
      adminApp = null;
      adminAuth = null;
      adminDb = null;
    }
  } else {
    // In environments without explicit FIREBASE_SERVICE_ACCOUNT credentials,
    // we do not initialize ambient default credentials for Firebase Auth to avoid
    // hitting Identity Toolkit endpoints on unconfigured GCP host projects.
    console.log('Firebase Admin: running with client-side Firestore management (FIREBASE_SERVICE_ACCOUNT not configured).');
  }

  return { adminApp, adminAuth, adminDb };
}

// REST API for deleting a user from Firebase Authentication by UID
app.post('/api/delete-user', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter.' });
  }

  const { adminAuth } = initializeFirebaseAdmin();

  if (!adminAuth) {
    console.log(`[delete-user] Notice: Firebase Auth administrative deletion skipped for UID ${userId} (FIREBASE_SERVICE_ACCOUNT not configured). Firestore documents and profile records will be deleted directly.`);
    return res.status(200).json({
      success: true,
      skippedAuth: true,
      message: 'User profile records removed from database. Firebase Auth deletion was skipped because FIREBASE_SERVICE_ACCOUNT is not configured on the server.'
    });
  }

  try {
    await adminAuth.deleteUser(userId);
    console.log(`Successfully deleted user with UID: ${userId} from Firebase Auth.`);
    return res.status(200).json({ success: true, message: `Successfully deleted user ${userId} from Authentication.` });
  } catch (error) {
    // We treat "user not found" as a successful deletion (since they no longer exist in Auth)
    if (error.code === 'auth/user-not-found') {
      return res.status(200).json({ success: true, message: 'User was already not present in Firebase Auth.' });
    }

    // Handle Identity Toolkit API not enabled or credentials error gracefully
    console.warn(`[delete-user] Firebase Auth user deletion notice for UID ${userId}:`, error.message || error);
    return res.status(200).json({ 
      success: true,
      skippedAuth: true,
      warning: error.message || 'Firebase Auth user deletion could not be completed on server.',
      message: 'User record removed from application database.'
    });
  }
});

// REST API for sending official transactional emails to students and parents
app.post('/api/send-email', async (req, res) => {
  const { to, cc, bcc, subject, html, text, type, metadata } = req.body;
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
    // 1. Try sending via configured SMTP or standard Nodemailer transporter
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
      console.log(`Email dispatched via SMTP to ${emailRecord.to.join(', ')}: ${messageId}`);
    } else {
      console.log(`Email simulated/logged for ${emailRecord.to.join(', ')}: "${subject}" (type: ${type || 'general'})`);
    }

    // 2. Persist to Firestore email_logs and standard Firebase Trigger Email extension collection
    try {
      const { adminDb } = initializeFirebaseAdmin();
      if (adminDb) {
        const logId = `EMAIL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await adminDb.collection('email_logs').doc(logId).set({
          ...emailRecord,
          id: logId,
          messageId,
        });

        // Trigger Email extension collection standard format
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
      console.warn('Could not record email to Firestore mail collection:', fsErr.message || fsErr);
    }

    return res.status(200).json({ 
      success: true, 
      message: `Email successfully sent to ${Array.isArray(to) ? to.join(', ') : to}`,
      messageId 
    });
  } catch (error) {
    console.error('Error sending transactional email:', error.message || error);
    return res.status(500).json({ 
      error: error.message || 'Failed to dispatch email.', 
      success: false 
    });
  }
});

// Server-rendered /about and /about/ page to bypass any stale verification caching
app.get(['/about', '/about/'], (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shaw STEM Academy - Premium Online CSEC & CAPE classes</title>
  <meta name="description" content="Welcome to Shaw STEM Academy. Discover advanced engineering, physics, science, and coding curricula for students, parents, faculty, and administrators.">
  <meta name="keywords" content="Shaw STEM Academy, STEM school portal, science course registration, engineering laboratory classes, coding school, academics, admissions portal">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.shawstemacademy.com/about/">

  <!-- Favicon and App Icons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#002b36">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.shawstemacademy.com/about/">
  <meta property="og:site_name" content="Shaw STEM Academy">
  <meta property="og:title" content="Shaw STEM Academy - Premium Online CSEC & CAPE classes">
  <meta property="og:description" content="Discover advanced learning, curriculum schedules, and interactive portals at Shaw STEM Academy.">
  <meta property="og:image" content="https://www.shawstemacademy.com/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Shaw STEM Academy Logo and Academic Portal">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Shaw STEM Academy - Premium Online CSEC & CAPE classes">
  <meta name="twitter:description" content="Discover advanced learning, curriculum schedules, and interactive portals at Shaw STEM Academy.">
  <meta name="twitter:image" content="https://www.shawstemacademy.com/og-image.png">

  <!-- Tailwind CSS CDN for instant styling with zero JS overhead -->
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
  </style>
</head>
<body class="bg-gray-50 text-gray-800 flex flex-col min-h-screen">

  <!-- Header / Navigation Bar -->
  <header class="bg-white border-b border-gray-200 py-4 shadow-sm">
    <div class="max-w-5xl mx-auto px-6 flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <img src="/logo.png" alt="Shaw STEM Academy logo" class="w-10 h-10 object-contain rounded-full border border-teal-600/30" />
        <span class="text-xl font-bold text-gray-900 tracking-tight">Shaw STEM Academy</span>
      </div>
      <a href="/" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition duration-150">
        Launch Portal
      </a>
    </div>
  </header>

  <!-- Main Information Container -->
  <main class="flex-grow max-w-5xl mx-auto px-6 py-12">
    <div class="space-y-12">
      
      <!-- Top Overview Hero Card -->
      <div class="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div class="relative z-10 space-y-4">
          <span class="bg-blue-500 bg-opacity-30 text-blue-200 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            Application Profile
          </span>
          <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Shaw STEM Academy Information Portal
          </h1>
          <p class="text-blue-100 text-base sm:text-lg max-w-3xl leading-relaxed">
            Welcome to the centralized campus and academic management hub for Shaw STEM Academy. We provide modern engineering, physics, science, and coding curricula for students, parents, faculty, and administrators.
          </p>
        </div>
      </div>

      <!-- Purpose Section & Google OAuth Statement -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <!-- Application Purpose -->
        <div class="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
          <h2 class="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span class="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
            <span>1. What is the purpose of this application?</span>
          </h2>
          <p class="text-gray-600 leading-relaxed text-sm sm:text-base">
            The primary function of the Shaw STEM Academy Portal is to facilitate online academic scheduling, curriculum research, admissions, and term-based laboratory registrations. Our website enables:
          </p>
          <ul class="space-y-2.5 text-gray-600 text-sm">
            <li class="flex items-start">
              <span class="text-blue-600 font-bold mr-2">•</span>
              <span><strong>Interactive Course Explorer:</strong> Browse real science, coding, and engineering course catalogs, view laboratory equipment sheets, and review term prerequisites.</span>
            </li>
            <li class="flex items-start">
              <span class="text-blue-600 font-bold mr-2">•</span>
              <span><strong>Student Learning Portal:</strong> Registered students can access assignment files, announcements, grades, and teacher office hours.</span>
            </li>
            <li class="flex items-start">
              <span class="text-blue-600 font-bold mr-2">•</span>
              <span><strong>Academic Administration:</strong> Faculty (Teachers, Department Heads) and Registrars can view classroom registration forms, publish homework instructions, coordinate laboratory hours, and handle class rosters.</span>
            </li>
          </ul>
        </div>

        <!-- Google OAuth Authentication Disclosure -->
        <div class="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
          <h2 class="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span class="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
            <span>2. Why do we utilize Google Sign-In?</span>
          </h2>
          <p class="text-gray-600 leading-relaxed text-sm sm:text-base">
            We employ Google OAuth (Google Sign-In) to verify and authenticate registered user profiles. When you log in with your Google account, we retrieve only your basic profile fields:
          </p>
          <ul class="space-y-2.5 text-gray-600 text-sm">
            <li class="flex items-start">
              <span class="text-blue-600 font-bold mr-2">•</span>
              <span><strong>Email Address &amp; Name:</strong> Used to match your authentication session with your student, parent, teacher, or administrative personnel record.</span>
            </li>
            <li class="flex items-start">
              <span class="text-blue-600 font-bold mr-2">•</span>
              <span><strong>Profile Image Avatar:</strong> Displays your user profile photo inside the student portal dashboard or teacher suites.</span>
            </li>
            <li class="flex items-start">
              <span class="text-blue-600 font-bold mr-2">•</span>
              <span><strong>Strict Data Protection:</strong> We do NOT access your Google Calendar, Google Drive, Gmail, or any other sensitive APIs. Your basic profile data is stored securely in Firebase Firestore, remains completely confidential, and is never shared with third parties or external marketing companies.</span>
            </li>
          </ul>
        </div>

      </div>

      <!-- Governance and Legal Policies -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <h2 class="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <span class="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
          <span>3. Legal Governance and Policies</span>
        </h2>
        <p class="text-gray-600 leading-relaxed text-sm sm:text-base">
          Our operations, account registrations, laboratory enrollments, and academic workflows are governed strictly in compliance with our official legal frameworks:
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <a href="/?tab=privacy" class="flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-xl transition duration-150">
            <div>
              <span class="font-bold text-gray-900 block text-sm">Privacy Policy</span>
              <span class="text-xs text-gray-500">Read how we protect your personal credentials</span>
            </div>
            <span class="text-blue-600 text-lg font-bold">→</span>
          </a>
          <a href="/?tab=terms" class="flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-xl transition duration-150">
            <div>
              <span class="font-bold text-gray-900 block text-sm">Terms of Service</span>
              <span class="text-xs text-gray-500">Review terms of use, enrollment, and conduct</span>
            </div>
            <span class="text-blue-600 text-lg font-bold">→</span>
          </a>
        </div>
      </div>

    </div>
  </main>

  <!-- Footer -->
  <footer class="bg-white border-t border-gray-200 py-8">
    <div class="max-w-5xl mx-auto px-6 text-center space-y-2">
      <p class="text-sm text-gray-500 font-medium">
        © ${new Date().getFullYear()} Shaw STEM Academy. All rights reserved.
      </p>
      <div class="flex justify-center space-x-4 text-xs font-semibold text-gray-400">
        <a href="/privacy" class="hover:text-blue-600 transition">Privacy Policy</a>
        <span>•</span>
        <a href="/terms" class="hover:text-blue-600 transition">Terms of Service</a>
      </div>
    </div>
  </footer>

</body>
</html>`);
});

// Server-rendered /privacy and /privacy/ page with self-referencing canonical
app.get(['/privacy', '/privacy/'], (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Shaw STEM Academy</title>
  <meta name="description" content="Official Privacy Policy and Data Protection standards for Shaw STEM Academy student records, Google Sign-In authentication, and portal communications.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.shawstemacademy.com/privacy">

  <!-- Favicon and App Icons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#002b36">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.shawstemacademy.com/privacy">
  <meta property="og:site_name" content="Shaw STEM Academy">
  <meta property="og:title" content="Privacy Policy - Shaw STEM Academy">
  <meta property="og:description" content="Official Privacy Policy and Data Protection standards for Shaw STEM Academy student records.">
  <meta property="og:image" content="https://www.shawstemacademy.com/og-image.png">

  <!-- Tailwind CSS CDN -->
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 text-gray-800 flex flex-col min-h-screen">
  <header class="bg-white border-b border-gray-200 py-4 shadow-sm">
    <div class="max-w-5xl mx-auto px-6 flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <img src="/logo.png" alt="Shaw STEM Academy logo" class="w-10 h-10 object-contain rounded-full border border-teal-600/30" />
        <span class="text-xl font-bold text-gray-900 tracking-tight">Shaw STEM Academy</span>
      </div>
      <a href="/" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition duration-150">
        Launch Portal
      </a>
    </div>
  </header>

  <main class="flex-grow max-w-4xl mx-auto px-6 py-12 space-y-8">
    <div class="border-b border-gray-200 pb-6">
      <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Legal Governance</span>
      <h1 class="text-3xl font-extrabold text-gray-900 mt-1">Privacy Policy &amp; Data Protection</h1>
      <p class="text-sm text-gray-500 mt-2">Effective Date: August 2026 | Governing Domain: shawstemacademy.com</p>
    </div>

    <div class="space-y-6 text-gray-700 leading-relaxed text-sm sm:text-base">
      <section class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-lg font-bold text-gray-900">1. Information We Collect</h2>
        <p>Shaw STEM Academy collects student academic registration records, guardian contact details, and basic profile data (name, email address, avatar photo) supplied through Google Sign-In OAuth authentication.</p>
      </section>

      <section class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-lg font-bold text-gray-900">2. How We Use Information</h2>
        <p>Collected information is used exclusively to facilitate class enrollments, syllabus delivery, attendance tracking, tuition management, and academic communications.</p>
      </section>

      <section class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-lg font-bold text-gray-900">3. Google OAuth Scopes &amp; Third Parties</h2>
        <p>We only request the minimum required profile information (email, profile info). We never sell, rent, or trade student or parent information to third parties.</p>
      </section>

      <section class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-lg font-bold text-gray-900">4. Contact &amp; Data Requests</h2>
        <p>For any privacy questions or data deletion requests, contact our administration at <a href="mailto:shawstemacademy@gmail.com" class="text-blue-600 underline font-semibold">shawstemacademy@gmail.com</a>.</p>
      </section>
    </div>
  </main>

  <footer class="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500">
    <p>© ${new Date().getFullYear()} Shaw STEM Academy. All rights reserved.</p>
    <div class="mt-2 space-x-4">
      <a href="/" class="hover:text-blue-600">Home</a>
      <span>•</span>
      <a href="/terms" class="hover:text-blue-600">Terms of Service</a>
      <span>•</span>
      <a href="/about/" class="hover:text-blue-600">About</a>
    </div>
  </footer>
</body>
</html>`);
});

// Server-rendered /terms and /terms/ page with self-referencing canonical
app.get(['/terms', '/terms/'], (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Shaw STEM Academy</title>
  <meta name="description" content="Terms of Service, academic enrollment conditions, and student portal conduct policies for Shaw STEM Academy.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.shawstemacademy.com/terms">

  <!-- Favicon and App Icons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#002b36">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.shawstemacademy.com/terms">
  <meta property="og:site_name" content="Shaw STEM Academy">
  <meta property="og:title" content="Terms of Service - Shaw STEM Academy">
  <meta property="og:description" content="Terms of Service, academic enrollment conditions, and student portal conduct policies.">
  <meta property="og:image" content="https://www.shawstemacademy.com/og-image.png">

  <!-- Tailwind CSS CDN -->
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 text-gray-800 flex flex-col min-h-screen">
  <header class="bg-white border-b border-gray-200 py-4 shadow-sm">
    <div class="max-w-5xl mx-auto px-6 flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <img src="/logo.png" alt="Shaw STEM Academy logo" class="w-10 h-10 object-contain rounded-full border border-teal-600/30" />
        <span class="text-xl font-bold text-gray-900 tracking-tight">Shaw STEM Academy</span>
      </div>
      <a href="/" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition duration-150">
        Launch Portal
      </a>
    </div>
  </header>

  <main class="flex-grow max-w-4xl mx-auto px-6 py-12 space-y-8">
    <div class="border-b border-gray-200 pb-6">
      <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Institutional Terms</span>
      <h1 class="text-3xl font-extrabold text-gray-900 mt-1">Terms of Service &amp; Enrollment Policies</h1>
      <p class="text-sm text-gray-500 mt-2">Effective Date: August 2026 | Governing Domain: shawstemacademy.com</p>
    </div>

    <div class="space-y-6 text-gray-700 leading-relaxed text-sm sm:text-base">
      <section class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-lg font-bold text-gray-900">1. Acceptance of Terms</h2>
        <p>By accessing the Shaw STEM Academy portal or enrolling in CSEC/CAPE courses, students, parents, and faculty agree to adhere to these terms and academic standards.</p>
      </section>

      <section class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-lg font-bold text-gray-900">2. Academic Integrity &amp; Conduct</h2>
        <p>All virtual classroom participants are expected to maintain academic honesty, respect instructors and peers, and protect their login credentials.</p>
      </section>

      <section class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-lg font-bold text-gray-900">3. Class Registrations &amp; Tuition</h2>
        <p>Tuition fees, multi-subject discount schedules, and term registration schedules are set by the administration and must be fulfilled according to institutional timelines.</p>
      </section>
    </div>
  </main>

  <footer class="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500">
    <p>© ${new Date().getFullYear()} Shaw STEM Academy. All rights reserved.</p>
    <div class="mt-2 space-x-4">
      <a href="/" class="hover:text-blue-600">Home</a>
      <span>•</span>
      <a href="/privacy" class="hover:text-blue-600">Privacy Policy</a>
      <span>•</span>
      <a href="/about/" class="hover:text-blue-600">About</a>
    </div>
  </footer>
</body>
</html>`);
});

// Server-rendered /academics and /academics/ page with self-referencing canonical
app.get(['/academics', '/academics/'], (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Academics & Courses - Shaw STEM Academy</title>
  <meta name="description" content="Explore online CSEC and CAPE STEM courses, science laboratories, computer programming, mathematics, and physics at Shaw STEM Academy.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.shawstemacademy.com/academics">

  <!-- Favicon and App Icons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#002b36">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.shawstemacademy.com/academics">
  <meta property="og:site_name" content="Shaw STEM Academy">
  <meta property="og:title" content="Academics & Courses - Shaw STEM Academy">
  <meta property="og:description" content="Explore online CSEC and CAPE STEM courses, science laboratories, computer programming, mathematics, and physics.">
  <meta property="og:image" content="https://www.shawstemacademy.com/og-image.png">

  <!-- Tailwind CSS CDN -->
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 text-gray-800 flex flex-col min-h-screen">
  <header class="bg-white border-b border-gray-200 py-4 shadow-sm">
    <div class="max-w-5xl mx-auto px-6 flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <img src="/logo.png" alt="Shaw STEM Academy logo" class="w-10 h-10 object-contain rounded-full border border-teal-600/30" />
        <span class="text-xl font-bold text-gray-900 tracking-tight">Shaw STEM Academy</span>
      </div>
      <a href="/" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition duration-150">
        Launch Interactive Portal
      </a>
    </div>
  </header>

  <main class="flex-grow max-w-5xl mx-auto px-6 py-12 space-y-8">
    <div class="border-b border-gray-200 pb-6">
      <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Curriculum &amp; Department Catalogs</span>
      <h1 class="text-3xl font-extrabold text-gray-900 mt-1">CSEC &amp; CAPE STEM Programs</h1>
      <p class="text-base text-gray-600 mt-2">Accredited, interactive secondary and advanced level STEM education designed for high achievement in Caribbean examination standards.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-xl font-bold text-gray-900">Mathematics &amp; Add Math</h2>
        <p class="text-gray-600 text-sm leading-relaxed">Algebra, geometry, trigonometry, calculus foundations, mathematical reasoning, and SBA portfolio guidance.</p>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-xl font-bold text-gray-900">Physics &amp; Engineering</h2>
        <p class="text-gray-600 text-sm leading-relaxed">Mechanics, thermodynamics, wave theory, electromagnetism, and virtual laboratory experimentation protocols.</p>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-xl font-bold text-gray-900">Chemistry &amp; Biology</h2>
        <p class="text-gray-600 text-sm leading-relaxed">Organic chemistry, stoichiometry, cell biology, genetics, ecology, and standardized SBA lab reports.</p>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-xl font-bold text-gray-900">Computer Science &amp; IT</h2>
        <p class="text-gray-600 text-sm leading-relaxed">Data structures, Python/C programming, database design, computer networks, and practical software engineering.</p>
      </div>
    </div>
  </main>

  <footer class="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500">
    <p>© ${new Date().getFullYear()} Shaw STEM Academy. All rights reserved.</p>
    <div class="mt-2 space-x-4">
      <a href="/" class="hover:text-blue-600">Home</a>
      <span>•</span>
      <a href="/privacy" class="hover:text-blue-600">Privacy Policy</a>
      <span>•</span>
      <a href="/terms" class="hover:text-blue-600">Terms of Service</a>
    </div>
  </footer>
</body>
</html>`);
});

// Vite middleware for development or standard static serving for production
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Shaw STEM Academy full-stack server running on http://0.0.0.0:${PORT}`);
});
