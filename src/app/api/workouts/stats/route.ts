import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  WorkoutStats,
  ExerciseFrequency,
  WorkoutTrend,
} from '@/types/workouts';
import { calculateWorkoutVolume } from '@/lib/workoutUtils';

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

// GET /api/workouts/stats - Get workout statistics
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseClient(authHeader);

  try {
    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query for workouts
    let query = supabase
      .from('user_workouts')
      .select(
        `
        id,
        date,
        workout_name,
        duration_minutes,
        workout_exercises (
          exercise_name,
          sets,
          reps_per_set,
          weight_lbs
        )
      `
      )
      .eq('user_id', user.id);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: workouts, error } = await query;

    if (error) {
      console.error('Error fetching workouts for stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalWorkouts = workouts?.length || 0;

    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalDuration = 0;
    const exerciseFrequencyMap = new Map<
      string,
      { count: number; volume: number }
    >();

    workouts?.forEach((workout) => {
      if (workout.duration_minutes) {
        totalDuration += workout.duration_minutes;
      }

      workout.workout_exercises?.forEach((exercise) => {
        totalSets += exercise.sets;

        const exerciseReps = exercise.reps_per_set.reduce(
          (sum: number, reps: number) => sum + reps,
          0
        );
        totalReps += exerciseReps;

        let exerciseVolume = 0;
        if (exercise.weight_lbs) {
          exerciseVolume = exerciseReps * exercise.weight_lbs;
          totalVolume += exerciseVolume;
        }

        // Track exercise frequency and volume
        const existing = exerciseFrequencyMap.get(exercise.exercise_name) || {
          count: 0,
          volume: 0,
        };
        exerciseFrequencyMap.set(exercise.exercise_name, {
          count: existing.count + 1,
          volume: existing.volume + exerciseVolume,
        });
      });
    });

    // Convert exercise frequency map to array
    const exerciseFrequency: ExerciseFrequency[] = Array.from(
      exerciseFrequencyMap.entries()
    )
      .map(([exercise_name, data]) => ({
        exercise_name,
        count: data.count,
        total_volume: data.volume,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most frequent

    // Calculate weekly trends
    const trendsMap = new Map<
      string,
      { workout_count: number; total_volume: number; total_sets: number }
    >();

    workouts?.forEach((workout) => {
      const date = new Date(workout.date + 'T00:00:00');
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = trendsMap.get(weekKey) || {
        workout_count: 0,
        total_volume: 0,
        total_sets: 0,
      };

      let workoutVolume = 0;
      let workoutSets = 0;
      workout.workout_exercises?.forEach((exercise) => {
        workoutSets += exercise.sets;
        const exerciseReps = exercise.reps_per_set.reduce(
          (sum: number, reps: number) => sum + reps,
          0
        );
        if (exercise.weight_lbs) {
          workoutVolume += exerciseReps * exercise.weight_lbs;
        }
      });

      trendsMap.set(weekKey, {
        workout_count: existing.workout_count + 1,
        total_volume: existing.total_volume + workoutVolume,
        total_sets: existing.total_sets + workoutSets,
      });
    });

    const weeklyTrends: WorkoutTrend[] = Array.from(trendsMap.entries())
      .map(([date, data]) => ({
        date,
        total_volume: data.total_volume,
        workout_count: data.workout_count,
        total_sets: data.total_sets,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const stats: WorkoutStats = {
      total_workouts: totalWorkouts,
      total_volume: totalVolume,
      total_exercises: exerciseFrequency.length,
      total_sets: totalSets,
      total_reps: totalReps,
      average_duration:
        totalWorkouts > 0
          ? Math.round(totalDuration / totalWorkouts)
          : undefined,
      most_frequent_exercises: exerciseFrequency,
    };

    return NextResponse.json({ stats, weekly_trends: weeklyTrends });
  } catch (error) {
    console.error('Error in GET /api/workouts/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
