import { createClient } from '@supabase/supabase-js';

// On the client, Next.js only exposes env vars that begin with NEXT_PUBLIC_
// so prefer NEXT_PUBLIC_* for runtime in the browser. Fall back to server
// env vars when available (useful for server-side API routes).
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_API_KEY ||
  '';

// Prefer a service role key when available on the server (safe for server-side
// API routes). It must never be exposed to the browser.
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// For client-side usage, always use the anon key to enable proper auth sessions
// For server-side usage (like in API routes), prefer service role if available
const isClientSide = typeof window !== 'undefined';
const SUPABASE_KEY_TO_USE = isClientSide
  ? SUPABASE_ANON_KEY
  : SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  // Make the error actionable for developers running the app locally.
  throw new Error(
    'Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL (for client) or SUPABASE_URL (for server) in your .env and restart the dev server.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY_TO_USE, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
