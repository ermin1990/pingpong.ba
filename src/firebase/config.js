import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  persistentSingleTabManager
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Stabilniji Firestore u dev-u (HMR + više reconnecta): single-tab manager.
// U produkciji zadržavamo multiple-tab manager.
const isDev = import.meta.env.DEV;
const tabManager = isDev ? persistentSingleTabManager() : persistentMultipleTabManager();

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager })
});

const googleProvider = new GoogleAuthProvider();
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Second, isolated Firebase app instance used only to provision a player's
// Auth account from an organizer's session (createUserWithEmailAndPassword
// signs in as that new user on whichever app instance it's called on - using
// a separate instance means the organizer's own session on `auth` above is
// never touched).
const secondaryApp = getApps().some(a => a.name === 'secondary')
  ? getApp('secondary')
  : initializeApp(firebaseConfig, 'secondary');
const secondaryAuth = getAuth(secondaryApp);

export { auth, db, googleProvider, analytics, secondaryAuth };
