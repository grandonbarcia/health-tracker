import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';

function createSupabaseClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`user-settings-get:${clientId}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseClient(authHeader);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get or create user settings
    let { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST205') {
      // Table doesn't exist, return default settings
      return NextResponse.json({
        daily_calories: 2000,
        daily_protein: 150,
        daily_carbs: 250,
        daily_fat: 67,
        daily_fiber: 25,
        daily_sodium: 2300,
        weight_goal: 'maintain',
        activity_level: 'moderate',
      });
    } else if (error && error.code === 'PGRST116') {
      // No settings found, create default
      const { data: newSettings, error: createError } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createError) throw createError;
      settings = newSettings;
    } else if (error) {
      throw error;
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`user-settings-put:${clientId}`, {
    maxRequests: 30,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseClient(authHeader);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const updates = await request.json();

    // Whitelist + validate to prevent mass-assignment of unexpected columns
    const sanitized: Record<string, any> = {};

    const clampInt = (
      value: unknown,
      min: number,
      max: number
    ): number | undefined => {
      if (typeof value !== 'number' || !Number.isFinite(value))
        return undefined;
      const asInt = Math.round(value);
      if (asInt < min || asInt > max) return undefined;
      return asInt;
    };

    // Numeric goals
    const dailyCalories = clampInt(updates?.daily_calories, 800, 5000);
    if (dailyCalories !== undefined) sanitized.daily_calories = dailyCalories;

    const dailyProtein = clampInt(updates?.daily_protein, 0, 500);
    if (dailyProtein !== undefined) sanitized.daily_protein = dailyProtein;

    const dailyCarbs = clampInt(updates?.daily_carbs, 0, 1000);
    if (dailyCarbs !== undefined) sanitized.daily_carbs = dailyCarbs;

    const dailyFat = clampInt(updates?.daily_fat, 0, 300);
    if (dailyFat !== undefined) sanitized.daily_fat = dailyFat;

    const dailyFiber = clampInt(updates?.daily_fiber, 0, 100);
    if (dailyFiber !== undefined) sanitized.daily_fiber = dailyFiber;

    const dailySodium = clampInt(updates?.daily_sodium, 0, 10000);
    if (dailySodium !== undefined) sanitized.daily_sodium = dailySodium;

    // Enums
    const weightGoal = updates?.weight_goal;
    if (
      weightGoal === 'lose' ||
      weightGoal === 'maintain' ||
      weightGoal === 'gain'
    ) {
      sanitized.weight_goal = weightGoal;
    }

    const activityLevel = updates?.activity_level;
    if (
      activityLevel === 'sedentary' ||
      activityLevel === 'light' ||
      activityLevel === 'moderate' ||
      activityLevel === 'active' ||
      activityLevel === 'very_active'
    ) {
      sanitized.activity_level = activityLevel;
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...sanitized,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error && error.code === 'PGRST205') {
      // Table doesn't exist, return success with the updates (client-side only)
      return NextResponse.json({
        success: true,
        note: 'Settings saved locally until database table is created',
        ...sanitized,
      });
    } else if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
