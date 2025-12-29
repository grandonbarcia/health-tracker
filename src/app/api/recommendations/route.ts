import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getSmartFoodRecommendations,
  generateRecommendationMessages,
  analyzeNutrientGaps,
} from '../../../lib/recommendations';
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
  const rateLimit = checkRateLimit(`recommendations:${clientId}`, {
    maxRequests: 30,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  // Authentication required
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

    const { searchParams } = new URL(request.url);
    const dayId = searchParams.get('dayId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20);

    if (!dayId) {
      return NextResponse.json(
        { error: 'Day ID is required' },
        { status: 400 }
      );
    }

    // Validate dayId format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dayId)) {
      return NextResponse.json(
        { error: 'Invalid day ID format' },
        { status: 400 }
      );
    }

    // Use default goals for now
    const userGoals: Record<string, number> = {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
      fiber: 25,
      sodium: 2300,
    };

    // Get current nutrition for the day
    const { data: dayItems } = await supabase
      .from('user_day_items')
      .select('*')
      .eq('user_day_id', dayId);

    let currentNutrition: Record<string, number> = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sodium: 0,
    };

    if (dayItems && dayItems.length > 0) {
      // Aggregate nutrition from all items
      currentNutrition = dayItems.reduce(
        (total: Record<string, number>, item: any) => ({
          calories: total.calories + (item.calories || 0),
          protein: total.protein + (item.protein || 0),
          carbs: total.carbs + (item.carbs || 0),
          fat: total.fat + (item.fat || 0),
          fiber: total.fiber + (item.fiber || 0),
          sodium: total.sodium + (item.sodium || 0),
        }),
        currentNutrition
      );
    }

    // Generate recommendations
    const gaps = analyzeNutrientGaps(currentNutrition, userGoals);
    const recommendations = getSmartFoodRecommendations(
      currentNutrition,
      userGoals,
      limit
    );
    const messages = generateRecommendationMessages(gaps);

    // Check if there are meaningful gaps
    const hasSignificantGaps = Object.values(gaps).some(
      (gap) => gap.remaining > 0 && gap.percentage < 90
    );

    return NextResponse.json({
      recommendations,
      messages,
      gaps,
      hasSignificantGaps,
      currentNutrition,
      userGoals,
    });
  } catch (error) {
    console.error('Error getting smart recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
