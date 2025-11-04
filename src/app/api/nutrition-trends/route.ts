import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { combineDayMealsWithQty } from '../../../lib/nutrients';

// GET /api/nutrition-trends - Get aggregated nutrition data for trends
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const endDate =
      searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    // Calculate start date
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);

    // Get user's food log data for the date range
    const { data: userDays, error } = await supabase
      .from('user_days')
      .select(
        `
        date,
        day_items
      `
      )
      .eq('user_id', user.id)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching nutrition trends:', error);
      return NextResponse.json(
        { error: 'Failed to fetch nutrition trends' },
        { status: 500 }
      );
    }

    // Process the data to calculate daily nutrition totals
    const dailyNutrition: Array<{
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sodium: number;
      itemCount: number;
    }> = [];

    // Fill in all dates in the range (including days with no data)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = userDays?.find((day) => day.date === dateStr);

      if (dayData && dayData.day_items) {
        // Calculate nutrition for this day
        const dayTotals = combineDayMealsWithQty(dayData.day_items);
        const itemCount =
          (dayData.day_items.breakfast?.length || 0) +
          (dayData.day_items.lunch?.length || 0) +
          (dayData.day_items.dinner?.length || 0);

        dailyNutrition.push({
          date: dateStr,
          calories: Math.round(dayTotals.calories || 0),
          protein: Math.round(dayTotals.protein || 0),
          carbs: Math.round(dayTotals.carbs || 0),
          fat: Math.round(dayTotals.fat || 0),
          fiber: Math.round(dayTotals.fiber || 0),
          sodium: Math.round(dayTotals.sodium || 0),
          itemCount,
        });
      } else {
        // No data for this day
        dailyNutrition.push({
          date: dateStr,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sodium: 0,
          itemCount: 0,
        });
      }
    }

    // Calculate summary statistics
    const daysWithData = dailyNutrition.filter((day) => day.itemCount > 0);
    const totalDays = dailyNutrition.length;
    const activeDays = daysWithData.length;

    const averages = {
      calories:
        activeDays > 0
          ? Math.round(
              daysWithData.reduce((sum, day) => sum + day.calories, 0) /
                activeDays
            )
          : 0,
      protein:
        activeDays > 0
          ? Math.round(
              daysWithData.reduce((sum, day) => sum + day.protein, 0) /
                activeDays
            )
          : 0,
      carbs:
        activeDays > 0
          ? Math.round(
              daysWithData.reduce((sum, day) => sum + day.carbs, 0) / activeDays
            )
          : 0,
      fat:
        activeDays > 0
          ? Math.round(
              daysWithData.reduce((sum, day) => sum + day.fat, 0) / activeDays
            )
          : 0,
      fiber:
        activeDays > 0
          ? Math.round(
              daysWithData.reduce((sum, day) => sum + day.fiber, 0) / activeDays
            )
          : 0,
      sodium:
        activeDays > 0
          ? Math.round(
              daysWithData.reduce((sum, day) => sum + day.sodium, 0) /
                activeDays
            )
          : 0,
    };

    const totals = {
      calories: daysWithData.reduce((sum, day) => sum + day.calories, 0),
      protein: daysWithData.reduce((sum, day) => sum + day.protein, 0),
      carbs: daysWithData.reduce((sum, day) => sum + day.carbs, 0),
      fat: daysWithData.reduce((sum, day) => sum + day.fat, 0),
      fiber: daysWithData.reduce((sum, day) => sum + day.fiber, 0),
      sodium: daysWithData.reduce((sum, day) => sum + day.sodium, 0),
    };

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate from the end to get current streak
    for (let i = dailyNutrition.length - 1; i >= 0; i--) {
      if (dailyNutrition[i].itemCount > 0) {
        if (i === dailyNutrition.length - 1 || currentStreak > 0) {
          currentStreak++;
        }
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (i === dailyNutrition.length - 1) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }
    }

    return NextResponse.json({
      dailyNutrition,
      summary: {
        totalDays,
        activeDays,
        averages,
        totals,
        currentStreak,
        longestStreak,
        period: `${days} days`,
        startDate: start.toISOString().split('T')[0],
        endDate,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
