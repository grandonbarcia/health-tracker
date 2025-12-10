-- Create user_vitals table for storing daily vital signs readings
CREATE TABLE IF NOT EXISTS user_vitals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  heart_rate INTEGER,
  systolic INTEGER,
  diastolic INTEGER,
  sleep_hours DECIMAL(3,1),
  energy_level INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reading_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_vitals_user_date ON user_vitals(user_id, reading_date);
CREATE INDEX IF NOT EXISTS idx_user_vitals_user_id ON user_vitals(user_id);

-- Enable Row Level Security
ALTER TABLE user_vitals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own vitals"
  ON user_vitals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vitals"
  ON user_vitals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vitals"
  ON user_vitals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vitals"
  ON user_vitals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_vitals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_vitals_timestamp ON user_vitals;
CREATE TRIGGER update_user_vitals_timestamp
  BEFORE UPDATE ON user_vitals
  FOR EACH ROW
  EXECUTE FUNCTION update_user_vitals_updated_at();
