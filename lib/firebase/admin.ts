import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import {
  getMessaging,
  type Messaging,
} from "firebase-admin/messaging";

function getFirebaseAdminApp(): App {
  const existingApps = getApps();

  if (existingApps.length > 0) {
    return getApp();
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID;

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

  if (
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      "Firebase Admin environment variables are missing."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const firebaseAdmin =
  getFirebaseAdminApp();

export const firebaseMessaging: Messaging =
  getMessaging(firebaseAdmin);