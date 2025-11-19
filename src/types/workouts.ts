// Workout Exercise Types
export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: number;
  reps_per_set: number[];
  weight_lbs?: number;
  notes?: string;
  order_index: number;
  created_at: string;
}

export interface ExerciseInput {
  exercise_name: string;
  sets: number;
  reps_per_set: number[];
  weight_lbs?: number;
  notes?: string;
  order_index?: number;
}

// Workout Types
export interface Workout {
  id: string;
  user_id: string;
  date: string;
  workout_name: string;
  duration_minutes?: number;
  notes?: string;
  exercises: WorkoutExercise[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutInput {
  date: string;
  workout_name: string;
  duration_minutes?: number;
  notes?: string;
  exercises: ExerciseInput[];
}

// Statistics Types
export interface WorkoutStats {
  total_workouts: number;
  total_volume: number;
  total_exercises: number;
  total_sets: number;
  total_reps: number;
  average_duration?: number;
  most_frequent_exercises: ExerciseFrequency[];
}

export interface ExerciseFrequency {
  exercise_name: string;
  count: number;
  total_volume: number;
}

export interface WorkoutTrend {
  date: string;
  total_volume: number;
  workout_count: number;
  total_sets: number;
}

// Muscle Group Categories
export enum MuscleGroup {
  CHEST = 'Chest',
  BACK = 'Back',
  SHOULDERS = 'Shoulders',
  LEGS = 'Legs',
  ARMS = 'Arms',
  CORE = 'Core',
  CARDIO = 'Cardio',
  FULL_BODY = 'Full Body',
}

// Exercise Category Mapping
export interface ExerciseCategory {
  name: string;
  muscle_group: MuscleGroup;
  is_compound: boolean;
}

// Weight Unit
export type WeightUnit = 'lbs' | 'kg';
