-- SQL for creating `user_vital_signs` table in Supabase
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  
  -- Four core vital signs
  body_temperature REAL CHECK (body_temperature >= 30 AND body_temperature <= 45),
  pulse_rate INTEGER CHECK (pulse_rate >= 30 AND pulse_rate <= 220),
  systolic_bp INTEGER CHECK (systolic_bp >= 40 AND systolic_bp <= 250),
  diastolic_bp INTEGER CHECK (diastolic_bp >= 40 AND diastolic_bp <= 250),
  oxygen_saturation INTEGER CHECK (oxygen_saturation >= 70 AND oxygen_saturation <= 100),
  
  -- Optional fields
  notes TEXT,
  measurement_context JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure systolic is greater than diastolic
  CONSTRAINT valid_blood_pressure CHECK (
    systolic_bp IS NULL OR 
    diastolic_bp IS NULL OR 
    systolic_bp > diastolic_bp
  )
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_vital_signs_user_date 
  ON user_vital_signs(user_id, date DESC);
  
CREATE INDEX IF NOT EXISTS idx_vital_signs_user_created 
  ON user_vital_signs(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_vital_signs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own vital signs
CREATE POLICY "Users can view their own vital signs"
  ON user_vital_signs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vital signs"
  ON user_vital_signs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vital signs"
  ON user_vital_signs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vital signs"
  ON user_vital_signs FOR DELETE
  USING (auth.uid() = user_id);
