-- Create user_settings table for personal nutrition goals
DO $$ BEGIN
  -- Create user_settings table
  CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Daily targets
    daily_calories INTEGER DEFAULT 2000,
    daily_protein INTEGER DEFAULT 150,  -- grams
    daily_carbs INTEGER DEFAULT 250,    -- grams
    daily_fat INTEGER DEFAULT 67,       -- grams
    daily_fiber INTEGER DEFAULT 25,     -- grams
    daily_sodium INTEGER DEFAULT 2300,  -- mg
    
    -- User preferences
    weight_goal VARCHAR(20) DEFAULT 'maintain', -- 'lose', 'gain', 'maintain'
    activity_level VARCHAR(20) DEFAULT 'moderate', -- 'sedentary', 'light', 'moderate', 'active', 'very_active'
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
  );

  -- Enable RLS
  ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

  -- Create RLS policies
  DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
  CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
  CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
  CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

  -- Create index for performance
  CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating user_settings: %', SQLERRM;
END $$;