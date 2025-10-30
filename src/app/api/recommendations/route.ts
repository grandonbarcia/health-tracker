import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getSmartFoodRecommendations,
  generateRecommendationMessages,
  analyzeNutrientGaps,
} from '../../../lib/recommendations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // For now, we'll work without authentication
    // TODO: Add proper authentication when user system is ready

    const { searchParams } = new URL(request.url);
    const dayId = searchParams.get('dayId');
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!dayId) {
      return NextResponse.json(
        { error: 'Day ID is required' },
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
