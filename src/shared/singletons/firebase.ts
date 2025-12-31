"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const isBrowser = typeof window !== "undefined";

function ensureClientApp(): FirebaseApp | null {
  if (!isBrowser) {
    return null;
  }
  if (!firebaseConfig.apiKey) {
    throw new Error("Missing Firebase client configuration.");
  }

  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

const firebaseApp = ensureClientApp();
const auth: Auth = firebaseApp ? getAuth(firebaseApp) : (null as unknown as Auth);
const db: Firestore = firebaseApp ? getFirestore(firebaseApp) : (null as unknown as Firestore);
const storage: FirebaseStorage = firebaseApp ? getStorage(firebaseApp) : (null as unknown as FirebaseStorage);

let analytics: Analytics | null = null;

if (isBrowser && firebaseApp) {
  void isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp);
    }
  });
}

export { firebaseApp, auth, db, storage, analytics };
