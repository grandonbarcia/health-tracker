import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
if (!url || !key) {
  console.error(
    'Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment'
  );
  process.exit(1);
}

const supabase = createClient(url, key);

const item = {
  id: 'mcdonalds-10-piece-mcnuggets',
  name: "McDonald's 10-piece Chicken McNuggets",
  aliases: ['mcnuggets', 'mcdonalds mcnuggets', '10-piece mcnuggets'],
  serving: '10 pieces',
  calories: 440,
  protein: 24,
  carbs: 26,
  fat: 27,
  fiber: 1,
  sugar: 0,
  sodium: 820,
  calcium: 40,
  iron: 2.4,
  potassium: 450,
  vitaminC: 0,
  vitaminA: 0,
  vitaminD: 0,
  cholesterol: 75,
  metadata: {
    source: 'one-off upsert script',
    source_url: 'https://www.mcdonalds.com',
  },
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
