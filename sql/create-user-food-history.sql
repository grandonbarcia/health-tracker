-- Create user_food_history table for tracking recent foods
DO $$ BEGIN
  -- Create user_food_history table
  CREATE TABLE IF NOT EXISTS user_food_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id VARCHAR(255) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    use_count INTEGER DEFAULT 1,
    
    UNIQUE(user_id, food_id)
  );

  -- Enable RLS
  ALTER TABLE user_food_history ENABLE ROW LEVEL SECURITY;

  -- Create RLS policies
  DROP POLICY IF EXISTS "Users can view their own food history" ON user_food_history;
  CREATE POLICY "Users can view their own food history" ON user_food_history
    FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert their own food history" ON user_food_history;
  CREATE POLICY "Users can insert their own food history" ON user_food_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update their own food history" ON user_food_history;
  CREATE POLICY "Users can update their own food history" ON user_food_history
    FOR UPDATE USING (auth.uid() = user_id);

  -- Create index for performance
  CREATE INDEX IF NOT EXISTS idx_user_food_history_recent ON user_food_history(user_id, last_used_at DESC);

  -- Create function to increment use count
  CREATE OR REPLACE FUNCTION increment_food_use_count(p_user_id UUID, p_food_id VARCHAR)
  RETURNS VOID AS
  $$
  BEGIN
    UPDATE user_food_history 
    SET 
      use_count = use_count + 1,
      last_used_at = NOW()
    WHERE user_id = p_user_id AND food_id = p_food_id;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating user_food_history: %', SQLERRM;
END $$;