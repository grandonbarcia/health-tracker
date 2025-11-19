-- Create user_workouts table
CREATE TABLE IF NOT EXISTS user_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_name TEXT NOT NULL,
  duration_minutes INTEGER CHECK (duration_minutes > 0 AND duration_minutes <= 600),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES user_workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL CHECK (sets >= 1 AND sets <= 20),
  reps_per_set INTEGER[] NOT NULL,
  weight_lbs REAL CHECK (weight_lbs IS NULL OR (weight_lbs >= 0 AND weight_lbs <= 2000)),
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT reps_match_sets CHECK (array_length(reps_per_set, 1) = sets)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON user_workouts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_user_created ON user_workouts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_workout ON workout_exercises(workout_id, order_index);

-- Enable Row Level Security
ALTER TABLE user_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_workouts
CREATE POLICY "Users can view their own workouts"
  ON user_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
  ON user_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON user_workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON user_workouts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for workout_exercises
CREATE POLICY "Users can view their own workout exercises"
  ON workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_workouts
      WHERE user_workouts.id = workout_exercises.workout_id
      AND user_workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own workout exercises"
  ON workout_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_workouts
      WHERE user_workouts.id = workout_exercises.workout_id
      AND user_workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own workout exercises"
  ON workout_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_workouts
      WHERE user_workouts.id = workout_exercises.workout_id
      AND user_workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own workout exercises"
  ON workout_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_workouts
      WHERE user_workouts.id = workout_exercises.workout_id
      AND user_workouts.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workout_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate reps_per_set values
CREATE OR REPLACE FUNCTION validate_reps_per_set()
RETURNS TRIGGER AS $$
DECLARE
  rep INTEGER;
BEGIN
  -- Check that all reps values are between 1 and 500
  FOREACH rep IN ARRAY NEW.reps_per_set
  LOOP
    IF rep < 1 OR rep > 500 THEN
      RAISE EXCEPTION 'Each rep value must be between 1 and 500. Invalid value: %', rep;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON user_workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_updated_at();

-- Trigger to validate reps_per_set on insert and update
CREATE TRIGGER validate_reps_trigger
  BEFORE INSERT OR UPDATE ON workout_exercises
  FOR EACH ROW
  EXECUTE FUNCTION validate_reps_per_set();
