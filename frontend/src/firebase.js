import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseConfig = Boolean(firebaseConfig.apiKey) && !AUTH_BYPASS;

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export default app;
