import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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
