import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
if (!url || !key) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment'
  );
  process.exit(1);
}

const supabase = createClient(url, key);

const item = {
  id: 'green-smoothie',
  name: 'Green Smoothie',
  calories: 220,
  protein: 6,
  carbs: 28,
  fat: 8,
  fiber: 6,
  sugar: 10,
  sodium: 50,
  calcium: 150,
  iron: 2,
  potassium: 600,
  vitaminC: 45,
  vitaminA: 80,
  vitaminD: 0,
  cholesterol: 0,
  serving: '1 cup',
  metadata: { source: 'one-off upsert script' },
};

(async () => {
  try {
    const { data, error } = await supabase
      .from('foods')
      .upsert(item, { onConflict: 'id' })
      .select();
    if (error) {
      console.error('Upsert error:', error);
      process.exit(1);
    }
    console.log('Upsert result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
