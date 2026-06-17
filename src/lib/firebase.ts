// Firebase bootstrap — Auth (login/logout) + Firestore (cloud database).
// Config is read from Vite env vars (see .env / .env.example). If the keys
// aren't present yet, `isFirebaseConfigured` is false and the app falls back
// to local-only mode so it keeps running until you paste your project keys.
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  type Firestore,
} from "firebase/firestore";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** True once the core Firebase keys are present in the environment. */
export const isFirebaseConfigured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(cfg as Record<string, string>);
  authInstance = getAuth(app);
  // Offline-first: cache the database locally so the app works without a
  // network and syncs when it returns.
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager(undefined),
    }),
  });
}

// Consumers must guard with `isFirebaseConfigured` before using these.
export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;
