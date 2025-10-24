import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment'
  );
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  // server-side client should not persist sessions
  auth: { persistSession: false, autoRefreshToken: false },
});

export default supabaseServer;
