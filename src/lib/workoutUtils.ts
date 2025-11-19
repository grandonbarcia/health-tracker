import {
  WorkoutInput,
  ExerciseInput,
  MuscleGroup,
  ExerciseCategory,
} from '../types/workouts';

// Popular exercises organized by muscle group
export const POPULAR_EXERCISES: ExerciseCategory[] = [
  // Chest
  { name: 'Bench Press', muscle_group: MuscleGroup.CHEST, is_compound: true },
  {
    name: 'Incline Bench Press',
    muscle_group: MuscleGroup.CHEST,
    is_compound: true,
  },
  {
    name: 'Dumbbell Press',
    muscle_group: MuscleGroup.CHEST,
    is_compound: true,
  },
  { name: 'Push-ups', muscle_group: MuscleGroup.CHEST, is_compound: true },
  { name: 'Chest Fly', muscle_group: MuscleGroup.CHEST, is_compound: false },
  {
    name: 'Cable Crossover',
    muscle_group: MuscleGroup.CHEST,
    is_compound: false,
  },

  // Back
  { name: 'Deadlift', muscle_group: MuscleGroup.BACK, is_compound: true },
  { name: 'Pull-ups', muscle_group: MuscleGroup.BACK, is_compound: true },
  { name: 'Barbell Row', muscle_group: MuscleGroup.BACK, is_compound: true },
  { name: 'Lat Pulldown', muscle_group: MuscleGroup.BACK, is_compound: true },
  { name: 'Dumbbell Row', muscle_group: MuscleGroup.BACK, is_compound: true },
  { name: 'Cable Row', muscle_group: MuscleGroup.BACK, is_compound: true },

  // Shoulders
  {
    name: 'Overhead Press',
    muscle_group: MuscleGroup.SHOULDERS,
    is_compound: true,
  },
  {
    name: 'Lateral Raise',
    muscle_group: MuscleGroup.SHOULDERS,
    is_compound: false,
  },
  {
    name: 'Front Raise',
    muscle_group: MuscleGroup.SHOULDERS,
    is_compound: false,
  },
  {
    name: 'Rear Delt Fly',
    muscle_group: MuscleGroup.SHOULDERS,
    is_compound: false,
  },
  {
    name: 'Arnold Press',
    muscle_group: MuscleGroup.SHOULDERS,
    is_compound: true,
  },

  // Legs
  { name: 'Squat', muscle_group: MuscleGroup.LEGS, is_compound: true },
  { name: 'Leg Press', muscle_group: MuscleGroup.LEGS, is_compound: true },
  { name: 'Lunges', muscle_group: MuscleGroup.LEGS, is_compound: true },
  { name: 'Leg Extension', muscle_group: MuscleGroup.LEGS, is_compound: false },
  { name: 'Leg Curl', muscle_group: MuscleGroup.LEGS, is_compound: false },
  { name: 'Calf Raise', muscle_group: MuscleGroup.LEGS, is_compound: false },
  {
    name: 'Romanian Deadlift',
    muscle_group: MuscleGroup.LEGS,
    is_compound: true,
  },

  // Arms
  { name: 'Bicep Curl', muscle_group: MuscleGroup.ARMS, is_compound: false },
  { name: 'Hammer Curl', muscle_group: MuscleGroup.ARMS, is_compound: false },
  { name: 'Tricep Dips', muscle_group: MuscleGroup.ARMS, is_compound: true },
  {
    name: 'Tricep Extension',
    muscle_group: MuscleGroup.ARMS,
    is_compound: false,
  },
  {
    name: 'Skull Crushers',
    muscle_group: MuscleGroup.ARMS,
    is_compound: false,
  },
  { name: 'Cable Curl', muscle_group: MuscleGroup.ARMS, is_compound: false },

  // Core
  { name: 'Plank', muscle_group: MuscleGroup.CORE, is_compound: true },
  { name: 'Crunches', muscle_group: MuscleGroup.CORE, is_compound: false },
  {
    name: 'Russian Twists',
    muscle_group: MuscleGroup.CORE,
    is_compound: false,
  },
  { name: 'Leg Raises', muscle_group: MuscleGroup.CORE, is_compound: false },
  { name: 'Ab Wheel', muscle_group: MuscleGroup.CORE, is_compound: true },

  // Cardio
  { name: 'Running', muscle_group: MuscleGroup.CARDIO, is_compound: true },
  { name: 'Cycling', muscle_group: MuscleGroup.CARDIO, is_compound: true },
  {
    name: 'Rowing Machine',
    muscle_group: MuscleGroup.CARDIO,
    is_compound: true,
  },
  { name: 'Jump Rope', muscle_group: MuscleGroup.CARDIO, is_compound: true },
];

// Get exercises by muscle group
export function getExercisesByMuscleGroup(muscleGroup: MuscleGroup): string[] {
  return POPULAR_EXERCISES.filter((ex) => ex.muscle_group === muscleGroup).map(
    (ex) => ex.name
  );
}

// Get all exercise names
export function getAllExerciseNames(): string[] {
  return POPULAR_EXERCISES.map((ex) => ex.name).sort();
}

// Weight conversion
export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

export function kgToLbs(kg: number): number {
  return kg / 0.453592;
}

// Calculate total volume for a single exercise
export function calculateExerciseVolume(
  sets: number,
  reps_per_set: number[],
  weight_lbs?: number
): number {
  if (!weight_lbs) return 0;
  const totalReps = reps_per_set.reduce((sum, reps) => sum + reps, 0);
  return totalReps * weight_lbs;
}

// Calculate total workout volume
export function calculateWorkoutVolume(exercises: ExerciseInput[]): number {
  return exercises.reduce((total, exercise) => {
    return (
      total +
      calculateExerciseVolume(
        exercise.sets,
        exercise.reps_per_set,
        exercise.weight_lbs
      )
    );
  }, 0);
}

// Calculate total reps
export function calculateTotalReps(exercises: ExerciseInput[]): number {
  return exercises.reduce((total, exercise) => {
    const exerciseReps = exercise.reps_per_set.reduce(
      (sum, reps) => sum + reps,
      0
    );
    return total + exerciseReps;
  }, 0);
}

// Calculate total sets
export function calculateTotalSets(exercises: ExerciseInput[]): number {
  return exercises.reduce((total, exercise) => total + exercise.sets, 0);
}

// Format workout duration
export function formatDuration(minutes?: number): string {
  if (!minutes) return 'Not tracked';

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

// Format reps display
export function formatReps(reps_per_set: number[]): string {
  return reps_per_set.join(' × ');
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Validation functions
export function validateWorkout(workout: WorkoutInput): {
  valid: boolean;
  error?: string;
} {
  if (!workout.date) {
    return { valid: false, error: 'Date is required' };
  }

  if (!workout.workout_name || workout.workout_name.trim().length === 0) {
    return { valid: false, error: 'Workout name is required' };
  }

  if (workout.workout_name.length > 100) {
    return {
      valid: false,
      error: 'Workout name must be less than 100 characters',
    };
  }

  if (workout.duration_minutes !== undefined) {
    if (workout.duration_minutes <= 0 || workout.duration_minutes > 600) {
      return {
        valid: false,
        error: 'Duration must be between 1 and 600 minutes',
      };
    }
  }

  if (!workout.exercises || workout.exercises.length === 0) {
    return { valid: false, error: 'At least one exercise is required' };
  }

  if (workout.exercises.length > 50) {
    return { valid: false, error: 'Maximum 50 exercises per workout' };
  }

  // Validate each exercise
  for (let i = 0; i < workout.exercises.length; i++) {
    const exercise = workout.exercises[i];
    const exerciseValidation = validateExercise(exercise, i + 1);

    if (!exerciseValidation.valid) {
      return exerciseValidation;
    }
  }

  return { valid: true };
}

export function validateExercise(
  exercise: ExerciseInput,
  index: number
): { valid: boolean; error?: string } {
  if (!exercise.exercise_name || exercise.exercise_name.trim().length === 0) {
    return { valid: false, error: `Exercise ${index}: Name is required` };
  }

  if (exercise.exercise_name.length > 100) {
    return {
      valid: false,
      error: `Exercise ${index}: Name must be less than 100 characters`,
    };
  }

  if (exercise.sets < 1 || exercise.sets > 20) {
    return {
      valid: false,
      error: `Exercise ${index}: Sets must be between 1 and 20`,
    };
  }

  if (!exercise.reps_per_set || exercise.reps_per_set.length === 0) {
    return { valid: false, error: `Exercise ${index}: Reps are required` };
  }

  if (exercise.reps_per_set.length !== exercise.sets) {
    return {
      valid: false,
      error: `Exercise ${index}: Number of rep values must match number of sets`,
    };
  }

  for (let i = 0; i < exercise.reps_per_set.length; i++) {
    const reps = exercise.reps_per_set[i];
    if (reps < 1 || reps > 500) {
      return {
        valid: false,
        error: `Exercise ${index}, Set ${
          i + 1
        }: Reps must be between 1 and 500`,
      };
    }
  }

  if (exercise.weight_lbs !== undefined) {
    if (exercise.weight_lbs < 0 || exercise.weight_lbs > 2000) {
      return {
        valid: false,
        error: `Exercise ${index}: Weight must be between 0 and 2000 lbs`,
      };
    }
  }

  return { valid: true };
}

// Suggested workout names
export const SUGGESTED_WORKOUT_NAMES = [
  'Push Day',
  'Pull Day',
  'Leg Day',
  'Upper Body',
  'Lower Body',
  'Full Body',
  'Chest & Triceps',
  'Back & Biceps',
  'Shoulders & Arms',
  'Cardio',
  'HIIT',
  'Core Workout',
  'Morning Workout',
  'Evening Workout',
];
