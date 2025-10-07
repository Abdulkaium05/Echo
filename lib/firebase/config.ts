
// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

const IS_BROWSER = typeof window !== 'undefined';

if (IS_BROWSER) {
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  ) {
    try {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      console.log("Firebase App initialized successfully.");

      if (app) {
        try {
          auth = getAuth(app);
          console.log("Firebase Auth initialized successfully.");
        } catch (e: any) {
          console.error("Error initializing Firebase Auth:", e.message);
          auth = null;
        }

        try {
          firestore = initializeFirestore(app, {}); // Basic initialization
          console.log("Firestore initialized (basic). Attempting to enable persistence...");
          enableIndexedDbPersistence(firestore)
            .then(() => {
              console.log("Firestore offline persistence enabled.");
            })
            .catch((err) => {
              if (err.code === 'failed-precondition') {
                console.warn("Firestore offline persistence failed: Multiple tabs open or already enabled.");
              } else if (err.code === 'unimplemented') {
                console.warn("Firestore offline persistence failed: Browser does not support required features.");
              } else {
                console.error("Error enabling Firestore offline persistence:", err);
              }
            });
        } catch (e: any) {
          console.error("Error initializing Firestore:", e.message);
          firestore = null;
        }
        
        try {
            storage = getStorage(app);
            console.log("Firebase Storage initialized successfully.");
        } catch (e: any) {
            console.error("Error initializing Firebase Storage:", e.message);
            storage = null;
        }

      }
    } catch (error: any) {
      console.error("Error initializing Firebase App:", error.message);
      app = null;
      auth = null;
      firestore = null;
      storage = null;
    }
  } else {
    console.warn(
      "Firebase configuration is missing (apiKey, authDomain, or projectId). Firebase services will not be initialized. App will run in a simulated mode."
    );
  }
} else {
  // Server-side or non-browser environment
  console.log("Not in a browser environment. Firebase client SDK initialization skipped.");
}


export { app, auth, firestore, storage };

export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    app // Check if app was successfully initialized
  );
};
