import { supabase } from './supabaseClient';
import { DayMeals, ItemWithQty } from './nutrients';

export async function getOrCreateDayForUser(dateIso: string) {
  // assumes user is authenticated (supabase-js will include the session)
  // try to find existing
  const { data: existing, error: selErr } = await supabase
    .from('user_days')
    .select('*')
    .eq('day_date', dateIso)
    .limit(1);
  if (selErr) throw selErr;
  if (existing && (existing as any).length) return (existing as any)[0];

  const { data: inserted, error: insErr } = await supabase
    .from('user_days')
    .insert({ day_date: dateIso })
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
  const { data, error } = await supabase
    .from('user_days')
    .select('*')
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
  const day = await getOrCreateDayForUser(dateIso);
  const items = await getDayItems(day.id);
  const meals: DayMeals = { breakfast: [], lunch: [], dinner: [] };
  for (const it of items as any[]) {
    const meal = it.metadata?.meal ?? 'dinner';
    (meals as any)[meal] = (meals as any)[meal] ?? [];
    (meals as any)[meal].push({ name: it.food_id, qty: Number(it.qty) });
  }
  return { day, meals } as { day: any; meals: DayMeals };
}
