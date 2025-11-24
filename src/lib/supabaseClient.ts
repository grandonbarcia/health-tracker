import { createBrowserClient } from '@supabase/ssr';

// On the client, Next.js only exposes env vars that begin with NEXT_PUBLIC_
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Create a browser client for client-side use with proper auth handling
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
