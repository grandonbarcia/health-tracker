import { supabase } from './supabaseClient';
import { FOOD_DB } from './nutrients';
import {
  RESTAURANT_FOODS,
  searchRestaurantFoods,
  getRestaurantFood,
} from './restaurantFoods';

export async function searchFoods(query: string, limit = 10) {
  const q = query.trim();
  if (!q) return [];

  // If Supabase not configured (no URL or no key), fall back to in-memory search.
  // Accept either an anon key or a service role key for server-side helpers.
  if (
    !process.env.SUPABASE_URL ||
    (!process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    const lc = q.toLowerCase();

    // Search regular foods
    const regularFoods = Object.keys(FOOD_DB)
      .filter((k) => k.includes(lc))
      .slice(0, Math.floor(limit * 0.6)) // Give 60% to regular foods
      .map((k) => ({ id: k, name: k, type: 'regular' }));

    // Search restaurant foods
    const restaurantFoods = searchRestaurantFoods(q)
      .slice(0, Math.ceil(limit * 0.4)) // Give 40% to restaurant foods
      .map((food) => ({
        id: food.id,
        name: `${food.restaurant} - ${food.name}`,
        type: 'restaurant',
        restaurant: food.restaurant,
        category: food.category,
      }));

    // Combine and limit results
    return [...restaurantFoods, ...regularFoods].slice(0, limit);
  }

  // Sanitize query to prevent injection
  const sanitizedQ = q.replace(/[%_\\]/g, '\\$&').substring(0, 100);

  // Use ilike for simple partial matching; consider pg_trgm for better suggestions
  const { data, error } = await supabase
    .from('foods')
    .select('id,name,serving')
    .ilike('name', `%${sanitizedQ}%`)
    .limit(Math.floor(limit * 0.7)); // Leave room for restaurant foods

  if (error) throw error;

  // Add restaurant food results
  const restaurantResults = searchRestaurantFoods(q)
    .slice(0, Math.ceil(limit * 0.3))
    .map((food) => ({
      id: food.id,
      name: `${food.restaurant} - ${food.name}`,
      serving: food.serving,
      type: 'restaurant',
      restaurant: food.restaurant,
      category: food.category,
    }));

  // Combine database and restaurant results
  const regularResults = (data || []).map((item) => ({
    ...item,
    type: 'regular',
  }));
  return [...restaurantResults, ...regularResults].slice(0, limit);
}

export async function getFoodById(id: string) {
  const key = id.toLowerCase();

  // Check if it's a restaurant food first
  const restaurantFood = getRestaurantFood(id);
  if (restaurantFood) {
    return {
      id: restaurantFood.id,
      name: `${restaurantFood.restaurant} - ${restaurantFood.name}`,
      calories: restaurantFood.calories,
      protein: restaurantFood.protein,
      carbs: restaurantFood.carbs,
      fat: restaurantFood.fat,
      fiber: restaurantFood.fiber,
      sodium: restaurantFood.sodium,
      serving: restaurantFood.serving,
      // Fill in missing nutrients with defaults
      sugar: 0,
      calcium: 0,
      iron: 0,
      potassium: 0,
      vitaminC: 0,
      vitaminA: 0,
      vitaminD: 0,
      cholesterol: 0,
      type: 'restaurant',
      restaurant: restaurantFood.restaurant,
      category: restaurantFood.category,
      description: restaurantFood.description,
    };
  }

  // Check regular foods database
  if (
    !process.env.SUPABASE_URL ||
    (!process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    return FOOD_DB[key]
      ? { id: key, name: key, type: 'regular', ...FOOD_DB[key] }
      : null;
  }

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('id', key)
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return { ...data, type: 'regular' };
}
