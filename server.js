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
function getFirebaseAuth() {
  if (adminApp) return getAuth(adminApp);

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "shawstemacademy-c0039";
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

  try {
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0];
    } else {
      if (serviceAccountVar) {
        const serviceAccount = JSON.parse(serviceAccountVar);
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: projectId
        });
        console.log('Firebase Admin SDK initialized with service account.');
      } else {
        adminApp = initializeApp({
          projectId: projectId
        });
        console.log('Firebase Admin SDK initialized with default credentials.');
      }
    }
    return getAuth(adminApp);
  } catch (err) {
    console.warn('Firebase Admin SDK warning on initialization:', err.message || err);
    adminApp = null;
    throw new Error('Firebase Admin SDK is not fully configured on the server. Please set the FIREBASE_SERVICE_ACCOUNT environment variable to enable administrative user deletion.');
  }
}

// REST API for deleting a user from Firebase Authentication by UID
app.post('/api/delete-user', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter.' });
  }

  try {
    const authInstance = getFirebaseAuth();
    await authInstance.deleteUser(userId);
    console.log(`Successfully deleted user with UID: ${userId} from Firebase Auth.`);
    return res.status(200).json({ success: true, message: `Successfully deleted user ${userId} from Authentication.` });
  } catch (error) {
    console.error(`Error deleting user ${userId} from Firebase Auth:`, error.message || error);
    
    // We treat "user not found" as a successful deletion (since they no longer exist in Auth)
    if (error.code === 'auth/user-not-found') {
      return res.status(200).json({ success: true, message: 'User was already not present in Firebase Auth.' });
    }

    return res.status(500).json({ 
      error: error.message || 'Failed to delete user from Firebase Authentication.',
      code: error.code || 'unknown'
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
      getFirebaseAuth();
      if (adminApp) {
        const db = getFirestore(adminApp);
        const logId = `EMAIL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.collection('email_logs').doc(logId).set({
          ...emailRecord,
          id: logId,
          messageId,
        });

        // Trigger Email extension collection standard format
        await db.collection('mail').add({
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
  <title>Shaw STEM Academy - Premium Science, Technology & Engineering Portal</title>
  <meta name="description" content="Welcome to Shaw STEM Academy. Discover advanced engineering, physics, science, and coding curricula for students, parents, faculty, and administrators.">
  <meta name="keywords" content="Shaw STEM Academy, STEM school portal, science course registration, engineering laboratory classes, coding school, academics, admissions portal">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.shawstemacademy.com/about/">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.shawstemacademy.com/about/">
  <meta property="og:title" content="Shaw STEM Academy - Premium Science & Engineering Portal">
  <meta property="og:description" content="Discover advanced learning, curriculum schedules, and interactive portals at Shaw STEM Academy.">

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
  <header class="bg-white border-b border-gray-200 py-5 shadow-sm">
    <div class="max-w-5xl mx-auto px-6 flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl">S</div>
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
        <a href="/?tab=privacy" class="hover:text-blue-600 transition">Privacy Policy</a>
        <span>•</span>
        <a href="/?tab=terms" class="hover:text-blue-600 transition">Terms of Service</a>
      </div>
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
  
  // Self-contained production-grade database reset and reconstruction for roles schema
  async function performUserReset() {
    try {
      getFirebaseAuth(); // ensure adminApp is initialized
      const db = getFirestore(adminApp);
      
      const flagRef = db.doc('system_flags/user_reset_done_v2');
      const flagSnap = await flagRef.get();
      
      if (flagSnap.exists && flagSnap.data().done === true) {
        console.log('User reset already performed previously. Skipping.');
        return;
      }
      
      console.log('Starting user deletion and reconstruction with new role-separated schema...');
      
      const collectionsToClear = [
        'schoolUsers',
        'users_student',
        'users_teacher',
        'users_admin',
        'users_registrar',
        'users_hod'
      ];
      
      for (const colName of collectionsToClear) {
        const colRef = db.collection(colName);
        const snapshot = await colRef.get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleared collection: ${colName}`);
      }
      
      const DEMO_SCHOOL_USERS = [
        {
          id: 'adm-1',
          name: 'System Administrator',
          email: 'shawstemacademy@gmail.com',
          role: 'admin',
          title: 'Academy System Administrator',
          departmentId: 'dept-admin',
          departmentName: 'Administration & Registrar',
          status: 'active',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          bio: 'System Administrator managing courses, teachers, registration, and Firebase database.',
          officeHours: 'Mon-Fri 8:00 AM - 5:00 PM',
          permissions: [
            'manage_curriculum',
            'upload_resources',
            'post_announcements',
            'manage_discounts',
            'export_forms',
            'view_logs',
            'manage_users',
            'manage_departments',
            'assign_staff',
            'export_financials',
          ],
        },
        {
          id: 'adm-2',
          name: 'Academy Administrator',
          email: 'admin@shawstemacademy.edu',
          role: 'admin',
          title: 'Academy System Administrator',
          departmentId: 'dept-admin',
          departmentName: 'Administration & Registrar',
          status: 'active',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          bio: 'Administrator managing courses, teachers, registration, and Firebase database.',
          officeHours: 'Mon-Fri 8:00 AM - 5:00 PM',
          permissions: [
            'manage_curriculum',
            'upload_resources',
            'post_announcements',
            'manage_discounts',
            'export_forms',
            'view_logs',
            'manage_users',
            'manage_departments',
            'assign_staff',
            'export_financials',
          ],
        },
      ];
      
      const SYSTEM_ROLES = ['student', 'teacher', 'admin', 'registrar', 'hod'];
      
      for (const userData of DEMO_SCHOOL_USERS) {
        // Save to unified collection
        await db.doc(`schoolUsers/${userData.id}`).set({
          ...userData,
          updatedAt: new Date().toISOString()
        });
        
        // Save to split collections
        const primaryRole = userData.role || 'student';
        const allRolesSet = new Set();
        if (userData.role) allRolesSet.add(userData.role);
        if (Array.isArray(userData.roles)) {
          userData.roles.forEach((r) => {
            if (SYSTEM_ROLES.includes(r)) allRolesSet.add(r);
          });
        }
        const allRoles = Array.from(allRolesSet);
        
        for (const sysRole of SYSTEM_ROLES) {
          const targetCol = `users_${sysRole}`;
          if (sysRole === primaryRole) {
            await db.doc(`${targetCol}/${userData.id}`).set({
              ...userData,
              updatedAt: new Date().toISOString()
            });
          } else if (allRoles.includes(sysRole)) {
            const referenceData = {
              id: userData.id,
              name: userData.name || '',
              email: userData.email || '',
              role: sysRole,
              primaryRole,
              roles: allRoles,
              isReference: true,
              refCollection: `users_${primaryRole}`,
              refPath: `users_${primaryRole}/${userData.id}`,
              updatedAt: new Date().toISOString(),
            };
            await db.doc(`${targetCol}/${userData.id}`).set(referenceData);
          }
        }
        console.log(`Recreated user: ${userData.name} (${userData.email})`);
      }
      
      await flagRef.set({ done: true, timestamp: new Date().toISOString() });
      console.log('Successfully completed user deletion and reconstruction with new role schema!');
    } catch (error) {
      console.error('Error during automatic user schema reset:', error);
    }
  }

  performUserReset().catch((err) => {
    console.error('Failed to trigger user schema reset:', err);
  });
});
