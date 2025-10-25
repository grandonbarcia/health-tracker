import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SERVICE key');
  process.exit(1);
}
const supabase = createClient(url, key);
(async () => {
  const q = 'green smoothie';
  const { data, error } = await supabase
    .from('foods')
    .select('id,name')
    .ilike('name', `%${q}%`)
    .limit(20);
  console.log('error:', error);
  console.log('data:', data);
})();
