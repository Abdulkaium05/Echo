// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence, initializeFirestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function initializeFirebase() {
    if (typeof window === 'undefined') {
        return { app: null, auth: null, firestore: null, storage: null };
    }
    
    if (
        !firebaseConfig.apiKey ||
        firebaseConfig.apiKey === 'TODO_ADD_YOUR_FIREBASE_CONFIG_HERE' ||
        !firebaseConfig.authDomain ||
        !firebaseConfig.projectId
    ) {
        console.warn(
          "Firebase configuration is missing or incomplete. The app will run in a simulated mode with mock data."
        );
        return { app: null, auth: null, firestore: null, storage: null };
    }

    try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        const storage = getStorage(app);

        enableIndexedDbPersistence(firestore).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("Firestore offline persistence failed: Multiple tabs open or other issue.");
            } else if (err.code === 'unimplemented') {
                console.warn("Firestore offline persistence not available in this browser.");
            }
        });
        
        console.log("Firebase initialized successfully.");
        return { app, auth, firestore, storage };

    } catch (error: any) {
        console.error("Error initializing Firebase:", error.message);
        return { app: null, auth: null, firestore: null, storage: null };
    }
}

export const { app, auth, firestore, storage } = initializeFirebase();

export const isFirebaseConfigured = (): boolean => {
  return !!app;
};
