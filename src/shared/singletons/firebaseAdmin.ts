import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { Bucket } from "@google-cloud/storage";

function hasAdminCredentials(): boolean {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  return Boolean(privateKey && clientEmail && projectId);
}

function buildCredentials() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error("Missing Firebase Admin credentials.");
  }

  return {
    privateKey,
    clientEmail,
    projectId
  };
}

function ensureAdminApp(): App | null {
  if (!hasAdminCredentials()) {
    return null;
  }

  if (getApps().length > 0) {
    return getApps()[0];
  }

  const credentials = buildCredentials();

  return initializeApp({
    credential: cert(credentials)
  });
}

const adminApp: App | null = ensureAdminApp();
const db: Firestore | null = adminApp ? getFirestore(adminApp) : null;
const auth: Auth | null = adminApp ? getAuth(adminApp) : null;
const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const storageBucket: Bucket | null = adminApp && storageBucketName ? getStorage(adminApp).bucket(storageBucketName) : null;

export { adminApp, db, auth, storageBucket, hasAdminCredentials };
