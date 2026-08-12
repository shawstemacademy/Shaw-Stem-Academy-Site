import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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
});
