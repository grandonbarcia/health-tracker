#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_API_KEY in .env'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function run() {
  try {
    // Use select with count to get total rows (exact count)
    const {
      data: rows,
      count,
      error: countErr,
    } = await supabase.from('foods').select('id', { count: 'exact' }).limit(1);
    if (countErr) throw countErr;
    const total = count ?? (rows ? rows.length : null);

    const { data: avocado, error: aErr } = await supabase
      .from('foods')
      .select('*')
      .eq('id', 'avocado')
      .limit(1)
      .maybeSingle();
    if (aErr && aErr.code !== 'PGRST116') throw aErr;

    console.log('Sample check results:');
    console.log('Avocado row:', avocado || 'not found');
    console.log('Total rows (approx):', total ?? 'unknown');
  } catch (err) {
    console.error('Check failed:', err.message || err);
    process.exit(1);
  }
}

run();
