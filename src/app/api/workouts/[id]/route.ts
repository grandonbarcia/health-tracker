import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WorkoutInput } from '@/types/workouts';
import { validateWorkout } from '@/lib/workoutUtils';

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

type Params = Promise<{ id: string }>;

// GET /api/workouts/[id] - Fetch single workout
export async function GET(
  request: NextRequest,
  segmentData: { params: Params }
) {
  const params = await segmentData.params;
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

    // Fetch workout with exercises
    const { data: workout, error } = await supabase
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
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workout not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching workout:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workout' },
        { status: 500 }
      );
    }

    // Sort exercises by order_index
    const sortedWorkout = {
      ...workout,
      exercises:
        workout.workout_exercises?.sort(
          (a, b) => a.order_index - b.order_index
        ) || [],
    };

    return NextResponse.json({ workout: sortedWorkout });
  } catch (error) {
    console.error('Error in GET /api/workouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/workouts/[id] - Update workout
export async function PUT(
  request: NextRequest,
  segmentData: { params: Params }
) {
  const params = await segmentData.params;
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

    // Parse request body
    const body: WorkoutInput = await request.json();

    // Validate workout
    const validation = validateWorkout(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Verify workout exists and belongs to user
    const { data: existingWorkout, error: checkError } = await supabase
      .from('user_workouts')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingWorkout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    // Update workout
    const { data: workout, error: workoutError } = await supabase
      .from('user_workouts')
      .update({
        date: body.date,
        workout_name: body.workout_name,
        duration_minutes: body.duration_minutes,
        notes: body.notes,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (workoutError) {
      console.error('Error updating workout:', workoutError);
      return NextResponse.json(
        { error: 'Failed to update workout' },
        { status: 500 }
      );
    }

    // Delete existing exercises
    const { error: deleteError } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('workout_id', params.id);

    if (deleteError) {
      console.error('Error deleting exercises:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update exercises' },
        { status: 500 }
      );
    }

    // Insert new exercises
    const exercisesWithWorkoutId = body.exercises.map((exercise, index) => ({
      workout_id: params.id,
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
      console.error('Error creating exercises:', exercisesError);
      return NextResponse.json(
        { error: 'Failed to update exercises' },
        { status: 500 }
      );
    }

    // Return complete workout with exercises
    const completeWorkout = {
      ...workout,
      exercises: exercises || [],
    };

    return NextResponse.json({ workout: completeWorkout });
  } catch (error) {
    console.error('Error in PUT /api/workouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/workouts/[id] - Delete workout
export async function DELETE(
  request: NextRequest,
  segmentData: { params: Params }
) {
  const params = await segmentData.params;
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

    // Delete workout (exercises will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('user_workouts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting workout:', error);
      return NextResponse.json(
        { error: 'Failed to delete workout' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/workouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
