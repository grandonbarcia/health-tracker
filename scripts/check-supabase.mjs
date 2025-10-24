import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

async function loadEnv() {
  try {
    const raw = await fs.readFile('.env', 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      process.env[k] = v;
    }
  } catch (e) {
    // ignore
  }
}

await loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

try {
  const { data, error } = await supabase
    .from('days')
    .select('date, data')
    .limit(20);
  if (error) {
    console.error('Supabase error:', error);
    process.exit(3);
  }
  console.log('Found rows:', (data || []).length);
  console.log(JSON.stringify(data, null, 2));
} catch (e) {
  console.error('Unexpected error', e);
  process.exit(4);
}
