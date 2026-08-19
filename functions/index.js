const { beforeUserCreated, beforeUserSignedIn, HttpsError } = require("firebase-functions/v2/identity");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK to communicate with Firestore
admin.initializeApp();
const db = admin.firestore();

/**
 * Blocking Function: beforeUserCreated
 * 
 * Runs synchronously before a new user is registered in Firebase Auth.
 * Used here for:
 * 1. Blocking registrations from untrusted domains (customizable template).
 * 2. Logging registration security events directly to Firestore for full audit transparency.
 */
exports.beforeUserCreated = beforeUserCreated(async (event) => {
  const user = event.data;
  const email = (user.email || "").toLowerCase().trim();

  console.log(`[Auth Event - beforeUserCreated] Initiating registration check for: ${email || "anonymous user"}`);

  // 1. Example domain restriction check (optional, commented out by default)
  // if (email && !email.endsWith("@shawstemacademy.edu") && !email.endsWith("@gmail.com")) {
  //   throw new HttpsError("invalid-argument", "Registration is restricted to authorized email domains.");
  // }

  // 2. Activity Logging: Write audit trail to Firestore
  try {
    await db.collection("security_logs").add({
      eventType: "auth_before_user_created",
      userId: user.uid,
      email: email || "anonymous_user",
      status: "success",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: event.ipAddress || "unknown",
      userAgent: event.userAgent || "unknown",
      details: `Auth account creation verified. User UID: ${user.uid}`,
    });
  } catch (error) {
    console.error("Error writing beforeUserCreated log to Firestore:", error);
    // Note: We don't throw an error here so a logging failure doesn't block legitimate users
  }
});

/**
 * Blocking Function: beforeUserSignedIn
 * 
 * Runs synchronously before a user is allowed to complete sign-in.
 * Used here for:
 * 1. Enforcing account status checks (blocking disabled or archived students/staff).
 * 2. Logging sign-in security events directly to Firestore.
 */
exports.beforeUserSignedIn = beforeUserSignedIn(async (event) => {
  const user = event.data;
  const email = (user.email || "").toLowerCase().trim();

  console.log(`[Auth Event - beforeUserSignedIn] Initiating login validation for: ${email}`);

  // 1. Status/Blocking Checks: Look up the user's status in Firestore
  if (email) {
    try {
      const usersRef = db.collection("schoolUsers");
      const snapshot = await usersRef.where("email", "==", email).get();

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        const userStatus = userData.status || "active";

        console.log(`[Auth Event - beforeUserSignedIn] Found user in Firestore. Status: ${userStatus}`);

        // Block deactivated or archived user accounts
        if (userStatus === "disabled" || userStatus === "suspended") {
          // Log deactivation attempt
          await db.collection("security_logs").add({
            eventType: "auth_block_deactivated_login",
            userId: user.uid,
            email: email,
            status: "blocked",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ipAddress: event.ipAddress || "unknown",
            userAgent: event.userAgent || "unknown",
            details: `Prevented login attempt: Account status is '${userStatus}' in school database.`,
          });

          throw new HttpsError(
            "permission-denied",
            "This account has been deactivated or suspended. Please contact the Shaw STEM Academy Registrar."
          );
        } else if (userStatus === "archived") {
          throw new HttpsError(
            "permission-denied",
            "This staff/student account has been archived. Login is disabled."
          );
        }
      }
    } catch (error) {
      console.error("Error validating user status in beforeUserSignedIn:", error);
      // Rethrow our security permission-denied errors
      if (error instanceof HttpsError) {
        throw error;
      }
    }
  }

  // 2. Activity Logging: Record successful check pass to Firestore
  try {
    await db.collection("security_logs").add({
      eventType: "auth_before_user_signed_in",
      userId: user.uid,
      email: email || "anonymous_user",
      status: "success",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: event.ipAddress || "unknown",
      userAgent: event.userAgent || "unknown",
      details: `Auth login checks passed. User allowed to sign in.`,
    });
  } catch (error) {
    console.error("Error writing beforeUserSignedIn log to Firestore:", error);
  }
});
