import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment'
  );
  process.exit(1);
}

const supabase = createClient(url, key);

async function createUserSettingsTable() {
  console.log('Creating user_settings table...');

  try {
    // First, let's try to create the table using raw SQL
    const { data, error } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS user_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          
          -- Daily targets
          daily_calories INTEGER DEFAULT 2000,
          daily_protein INTEGER DEFAULT 150,
          daily_carbs INTEGER DEFAULT 250,
          daily_fat INTEGER DEFAULT 67,
          daily_fiber INTEGER DEFAULT 25,
          daily_sodium INTEGER DEFAULT 2300,
          
          -- User preferences
          weight_goal VARCHAR(20) DEFAULT 'maintain',
          activity_level VARCHAR(20) DEFAULT 'moderate',
          
          -- Metadata
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          UNIQUE(user_id)
        );
        
        ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
        CREATE POLICY "Users can view their own settings" ON user_settings
          FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
        CREATE POLICY "Users can insert their own settings" ON user_settings
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
        CREATE POLICY "Users can update their own settings" ON user_settings
          FOR UPDATE USING (auth.uid() = user_id);
      `,
    });

    if (error) {
      console.error('RPC Error:', error);

      // Try alternative approach - direct table creation without RPC
      console.log('Trying alternative approach...');

      // Test if table exists by trying to select from it
      const { data: testData, error: testError } = await supabase
        .from('user_settings')
        .select('count')
        .limit(1);

      if (testError && testError.code === 'PGRST116') {
        console.log(
          '❌ Table does not exist. Please run the SQL migration manually:'
        );
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the contents of sql/create-user-settings.sql');
        return;
      } else if (testError) {
        console.error('Unexpected error:', testError);
        return;
      } else {
        console.log('✅ Table already exists!');
        return;
      }
    } else {
      console.log('✅ User settings table created successfully!');
    }
  } catch (error) {
    console.error('Error creating table:', error);
    console.log('Please run the SQL migration manually in Supabase dashboard');
  }
}

createUserSettingsTable();
