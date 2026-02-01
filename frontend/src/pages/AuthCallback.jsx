import React, { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  useEffect(() => {
    const finalizeAuth = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (window.opener) {
        if (error) {
          window.opener.postMessage(
            { type: 'supabase-auth-error', message: error.message },
            window.location.origin
          );
        } else {
          window.opener.postMessage({ type: 'supabase-auth-success' }, window.location.origin);
        }
        window.close();
        return;
      }

      if (error) {
        window.location.assign('/login');
      } else {
        window.location.assign('/chat');
      }
    };

    finalizeAuth();
  }, []);

  return <div className="page-loading">Signing you in...</div>;
}
