import { createClient } from '@supabase/supabase-js';

// Supabase dashboard setup:
// - Enable Email and Google providers (Google needs Client ID/Secret).
// - Auth URL config:
//   - Site URL: http://localhost:5173
//   - Additional Redirect URL: http://localhost:5173/auth/callback
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
