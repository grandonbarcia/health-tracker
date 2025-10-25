import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_API_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPBASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or key in environment');
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  const tables = ['user_days', 'user_day_items'];
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('id').limit(1);
      if (error) {
        console.log(`${t}: ERROR`, error);
      } else {
        console.log(
          `${t}: OK — rows returned: ${Array.isArray(data) ? data.length : 0}`
        );
      }
    } catch (err) {
      console.log(`${t}: Exception`, String(err));
    }
  }

  // Try to create a dummy day row with service role (should succeed)
  try {
    const date = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('user_days')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        day_date: date,
      })
      .select();
    if (error) {
      console.log('Insert dummy day: ERROR', error);
    } else {
      console.log('Insert dummy day: OK', JSON.stringify(data));
      // cleanup
      const id = data[0]?.id;
      if (id) await supabase.from('user_days').delete().eq('id', id);
    }
  } catch (err) {
    console.log('Insert dummy day: Exception', String(err));
  }
})();
