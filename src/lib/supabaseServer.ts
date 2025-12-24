import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment');
}

/**
 * Create a Supabase client using the user's auth token.
 * This respects RLS policies - preferred for most operations.
 */
export function createSupabaseClient(authHeader: string | null) {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

/**
 * Service role client - bypasses RLS. Use sparingly and only when necessary.
 * WARNING: Only use for admin operations that cannot be done via user context.
 */
export const supabaseServer = supabaseServiceKey
  ? createClient(supabaseUrl!, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export default supabaseServer;
