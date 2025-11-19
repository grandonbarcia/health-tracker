import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WorkoutInput } from '@/types/workouts';
import { validateWorkout } from '@/lib/workoutUtils';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/workouts - Fetch workouts with optional filters
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('user_workouts')
      .select(
        `
        id,
        user_id,
        date,
        workout_name,
        duration_minutes,
        notes,
        created_at,
        updated_at,
        workout_exercises (
          id,
          workout_id,
          exercise_name,
          sets,
          reps_per_set,
          weight_lbs,
          notes,
          order_index
        )
      `
      )
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply date filters
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: workouts, error } = await query;

    if (error) {
      console.error('Error fetching workouts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workouts' },
        { status: 500 }
      );
    }

    // Sort exercises by order_index
    const sortedWorkouts = workouts?.map((workout) => ({
      ...workout,
      exercises:
        workout.workout_exercises?.sort(
          (a, b) => a.order_index - b.order_index
        ) || [],
    }));

    return NextResponse.json({ workouts: sortedWorkouts });
  } catch (error) {
    console.error('Error in GET /api/workouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workouts - Create new workout
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: WorkoutInput = await request.json();

    // Validate workout
    const validation = validateWorkout(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Insert workout
    const { data: workout, error: workoutError } = await supabase
      .from('user_workouts')
      .insert({
        user_id: user.id,
        date: body.date,
        workout_name: body.workout_name,
        duration_minutes: body.duration_minutes,
        notes: body.notes,
      })
      .select()
      .single();

    if (workoutError) {
      console.error('Error creating workout:', workoutError);
      return NextResponse.json(
        { error: 'Failed to create workout' },
        { status: 500 }
      );
    }

    // Insert exercises
    const exercisesWithWorkoutId = body.exercises.map((exercise, index) => ({
      workout_id: workout.id,
      exercise_name: exercise.exercise_name,
      sets: exercise.sets,
      reps_per_set: exercise.reps_per_set,
      weight_lbs: exercise.weight_lbs,
      notes: exercise.notes,
      order_index: exercise.order_index ?? index,
    }));

    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_exercises')
      .insert(exercisesWithWorkoutId)
      .select();

    if (exercisesError) {
      // Rollback: delete the workout
      await supabase.from('user_workouts').delete().eq('id', workout.id);
      console.error('Error creating exercises:', exercisesError);
      return NextResponse.json(
        { error: 'Failed to create exercises' },
        { status: 500 }
      );
    }

    // Return complete workout with exercises
    const completeWorkout = {
      ...workout,
      exercises: exercises || [],
    };

    return NextResponse.json({ workout: completeWorkout }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/workouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
