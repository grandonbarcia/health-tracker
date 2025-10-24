import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  const dir = path.join(process.cwd(), 'data', 'days');
  try {
    const files = await fs.readdir(dir);
    for (const f of files.filter((f) => f.endsWith('.json'))) {
      const date = f.replace(/\.json$/, '');
      const raw = await fs.readFile(path.join(dir, f), 'utf8');
      let parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed))
        parsed = { breakfast: [], lunch: [], dinner: parsed };
      const { error } = await supabase
        .from('days')
        .upsert({ date, data: parsed }, { onConflict: 'date' });
      if (error) {
        console.error('Failed to migrate', date, error);
      } else {
        console.log('Migrated', date);
      }
    }
  } catch (err) {
    console.error('Migration failed', err);
  }
}

await migrate();
