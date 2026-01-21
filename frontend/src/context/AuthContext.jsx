import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';
import { attachSession } from '../services/api';
import { getSessionId } from '../utils/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasAttachedSession = useRef(false);
  const authBypass = import.meta.env.VITE_AUTH_BYPASS === 'true';

  useEffect(() => {
    if (!auth || authBypass) {
      setUser({
        uid: 'dev-user',
        email: 'dev@local',
        displayName: 'Developer',
      });
      setLoading(false);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [authBypass]);

  useEffect(() => {
    if (!user || hasAttachedSession.current) return;
    const sessionId = getSessionId();
    attachSession(sessionId).catch(() => {});
    hasAttachedSession.current = true;
  }, [user]);

  const value = useMemo(() => {
    if (!auth || authBypass) {
      return {
        user,
        loading,
        signIn: () => Promise.reject(new Error('Auth bypass enabled.')),
        signInWithGoogle: () => Promise.reject(new Error('Auth bypass enabled.')),
        signInWithPhone: () => Promise.reject(new Error('Auth bypass enabled.')),
        signUp: () => Promise.reject(new Error('Auth bypass enabled.')),
        signOutUser: () => Promise.resolve(),
      };
    }
    return {
      user,
      loading,
      signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
      signInWithGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()),
      signInWithPhone: (phoneNumber, appVerifier) =>
        signInWithPhoneNumber(auth, phoneNumber, appVerifier),
      signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
      signOutUser: () => signOut(auth),
    };
  }, [user, loading, authBypass]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
