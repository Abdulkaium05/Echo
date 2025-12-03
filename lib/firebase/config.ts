// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence, Timestamp } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

function initializeFirebaseServices() {
    if (typeof window !== 'undefined' && firebaseConfig.projectId) {
        if (!getApps().length) {
            try {
                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                firestore = getFirestore(app);
                storage = getStorage(app);
                enableIndexedDbPersistence(firestore, { forceOwnership: true })
                    .catch((err) => {
                        if (err.code === 'failed-precondition') {
                            console.warn('Firestore persistence failed: Multiple tabs open. Persistence will be enabled in one tab only.');
                        } else if (err.code === 'unimplemented') {
                            console.warn('Firestore persistence failed: The current browser does not support all of the features required.');
                        } else {
                            console.error("Firestore persistence error:", err);
                        }
                    });
            } catch (e) {
                console.error("Error initializing Firebase:", e);
                throw e;
            }
        } else {
            app = getApp();
            firestore = getFirestore(app);
            auth = getAuth(app);
            storage = getStorage(app);
        }
        return { app, auth, firestore, storage };
    }
    // Return nulls for server-side rendering
    return { app: null, auth: null, firestore: null, storage: null };
}

const services = initializeFirebaseServices();
app = services.app!;
auth = services.auth!;
firestore = services.firestore!;
storage = services.storage!;


export { app, auth, firestore, storage };

export const isFirebaseConfigured = (): boolean => {
  return !!firebaseConfig.projectId;
};
