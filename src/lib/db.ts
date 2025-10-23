import { supabase } from './supabaseClient';
import { FOOD_DB } from './nutrients';

export async function searchFoods(query: string, limit = 10) {
  const q = query.trim();
  if (!q) return [];

  // If Supabase not configured, fall back to in-memory search
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    const lc = q.toLowerCase();
    return Object.keys(FOOD_DB)
      .filter((k) => k.includes(lc))
      .slice(0, limit)
      .map((k) => ({ id: k, name: k }));
  }

  // Use ilike for simple partial matching; consider pg_trgm for better suggestions
  const { data, error } = await supabase
    .from('foods')
    .select('id,name,serving')
    .ilike('name', `%${q}%`)
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getFoodById(id: string) {
  const key = id.toLowerCase();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return FOOD_DB[key] ? { id: key, name: key, ...FOOD_DB[key] } : null;
  }

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('id', key)
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return data;
}
