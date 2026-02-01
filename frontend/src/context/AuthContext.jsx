import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { attachSession } from '../services/api';
import { getSessionId } from '../utils/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const hasAttachedSession = useRef(false);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setAuthError('');
      setLoading(false);
    });

    return () => {
      active = false;
      data.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data;
      if (!payload || typeof payload !== 'object') return;
      if (payload.type === 'supabase-auth-success') {
        supabase.auth.getSession().then(({ data }) => {
          setSession(data.session ?? null);
          setUser(data.session?.user ?? null);
          setAuthError('');
          setLoading(false);
        });
        return;
      }
      if (payload.type === 'supabase-auth-error') {
        setLoading(false);
        setAuthError(payload.message || 'Supabase OAuth failed.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!user || hasAttachedSession.current) return;
    const sessionId = getSessionId();
    attachSession(sessionId).catch(() => {});
    hasAttachedSession.current = true;
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      authError,
      signUp: (email, password) => supabase.auth.signUp({ email, password }),
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signOut: () => supabase.auth.signOut(),
      signInWithGooglePopup: async () => {
        const width = 520;
        const height = 620;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          'about:blank',
          'supabase-oauth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        try {
          popup.document.title = 'Connecting to Google...';
          popup.document.body.innerHTML = '<p style="font-family: sans-serif;">Opening Google sign-in...</p>';
        } catch (err) {
          // Popup may block document access in some browsers; ignore.
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          popup.close();
          throw error;
        }

        if (!data?.url) {
          popup.close();
          throw new Error('Unable to start Google sign-in.');
        }

        popup.location.href = data.url;
        popup.focus();
      },
    }),
    [user, session, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
