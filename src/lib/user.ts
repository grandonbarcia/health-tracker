import { supabase } from './supabaseClient';
import { DayMeals, ItemWithQty } from './nutrients';

export async function getOrCreateDayForUser(dateIso: string) {
  // Get current user first
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // try to find existing
  const { data: existing, error: selErr } = await supabase
    .from('user_days')
    .select('*')
    .eq('day_date', dateIso)
    .eq('user_id', user.id)
    .limit(1);
  if (selErr) throw selErr;
  if (existing && (existing as any).length) return (existing as any)[0];

  // Create new day with user_id
  const { data: inserted, error: insErr } = await supabase
    .from('user_days')
    .insert({ day_date: dateIso, user_id: user.id })
    .select()
    .limit(1);
  if (insErr) throw insErr;
  return (inserted as any)[0];
}

export async function addItemToDay(
  dayId: string,
  foodId: string,
  qty = 1,
  servingOverride?: string
) {
  const payload: any = { day_id: dayId, food_id: foodId, qty };
  if (servingOverride) payload.serving_override = servingOverride;
  const { data, error } = await supabase
    .from('user_day_items')
    .insert(payload)
    .select();
  if (error) throw error;
  return data;
}

export async function getDayItems(dayId: string) {
  // Return items for a day. We intentionally do a simple query; joining foods can be done by the caller.
  const { data, error } = await supabase
    .from('user_day_items')
    .select('*')
    .eq('day_id', dayId);
  if (error) throw error;
  return data;
}

export async function getDaysForUser(limit = 50) {
  // Get current user first
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_days')
    .select('*')
    .eq('user_id', user.id)
    .order('day_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
export async function setDayItems(dayId: string, meals: DayMeals) {
  // Delete existing items for the day and insert the provided meals
  const { error: delErr } = await supabase
    .from('user_day_items')
    .delete()
    .eq('day_id', dayId);
  if (delErr) throw delErr;

  const inserts: any[] = [];
  for (const meal of ['breakfast', 'lunch', 'dinner'] as const) {
    for (const it of (meals as any)[meal] ?? []) {
      inserts.push({
        day_id: dayId,
        food_id: it.name,
        qty: it.qty,
        metadata: { meal },
      });
    }
  }
  if (inserts.length === 0) return [];
  const { data, error } = await supabase
    .from('user_day_items')
    .insert(inserts)
    .select();
  if (error) throw error;
  return data;
}

export async function getDayMeals(dateIso: string) {
  console.log('🔍 getDayMeals called for date:', dateIso);

  try {
    const day = await getOrCreateDayForUser(dateIso);
    console.log('📋 Day created/found:', day);

    if (!day || !day.id) {
      console.warn('⚠️ No day found or created');
      return {
        day: null,
        meals: { breakfast: [], lunch: [], dinner: [] },
      };
    }

    const items = await getDayItems(day.id);
    console.log('🍽️ Day items loaded:', items);

    const meals: DayMeals = { breakfast: [], lunch: [], dinner: [] };
    if (items && Array.isArray(items)) {
      for (const it of items as any[]) {
        const meal = it.metadata?.meal ?? 'dinner';
        (meals as any)[meal] = (meals as any)[meal] ?? [];
        (meals as any)[meal].push({ name: it.food_id, qty: Number(it.qty) });
      }
    }

    console.log('🍴 Processed meals:', meals);
    return { day, meals } as { day: any; meals: DayMeals };
  } catch (error) {
    console.error('❌ Error in getDayMeals:', error);
    // Return empty meals instead of throwing to prevent app crash
    return {
      day: null,
      meals: { breakfast: [], lunch: [], dinner: [] },
    };
  }
}

export async function getAllDaysWithMeals() {
  console.log('📅 Loading all days for user...');

  try {
    // Get all days for the user
    const days = await getDaysForUser(100); // Load up to 100 days
    console.log('📊 Found days:', days?.length);

    if (!days || days.length === 0) {
      console.log('ℹ️ No days found for user');
      return {};
    }

    // Get all items for these days in one query
    const dayIds = days.map((d: any) => d.id);
    const { data: allItems, error } = await supabase
      .from('user_day_items')
      .select('*')
      .in('day_id', dayIds);

    if (error) {
      console.error('❌ Error fetching items:', error);
      return {}; // Return empty instead of throwing
    }

    // Group items by day_id
    const itemsByDayId: Record<string, any[]> = {};
    if (allItems && Array.isArray(allItems)) {
      for (const item of allItems as any[]) {
        if (!itemsByDayId[item.day_id]) {
          itemsByDayId[item.day_id] = [];
        }
        itemsByDayId[item.day_id].push(item);
      }
    }

    // Build the result: Record<dateIso, DayMeals>
    const result: Record<string, DayMeals> = {};
    for (const day of days as any[]) {
      const items = itemsByDayId[day.id] || [];
      const meals: DayMeals = { breakfast: [], lunch: [], dinner: [] };

      for (const it of items) {
        const meal = it.metadata?.meal ?? 'dinner';
        (meals as any)[meal] = (meals as any)[meal] ?? [];
        (meals as any)[meal].push({ name: it.food_id, qty: Number(it.qty) });
      }

      result[day.day_date] = meals;
    }

    console.log('✅ Loaded all days:', Object.keys(result).length);
    return result;
  } catch (error) {
    console.error('❌ Error loading all days:', error);
    // Return empty object instead of throwing to prevent app crash
    return {};
  }
}
