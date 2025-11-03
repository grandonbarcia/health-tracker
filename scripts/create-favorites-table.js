/**
 * Create user_favorites table directly in Supabase
 * This script manually executes the SQL to create the favorites table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error(
    'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createFavoritesTable() {
  console.log('🚀 Creating user_favorites table...');

  try {
    // Create the table using raw SQL
    const { data, error } = await supabase.rpc('sql', {
      query: `
        -- Create user_favorites table for favorite foods with RLS
        create table if not exists user_favorites (
          id uuid default gen_random_uuid() primary key,
          user_id uuid not null,
          food_id text not null,
          food_type text default 'regular' check (food_type in ('regular', 'restaurant')),
          created_at timestamptz default now(),
          updated_at timestamptz default now()
        );

        -- Create unique index to prevent duplicate favorites
        create unique index if not exists idx_user_favorites_unique 
          on user_favorites(user_id, food_id);

        -- Create index for faster lookups
        create index if not exists idx_user_favorites_user on user_favorites(user_id);

        -- Enable Row Level Security
        alter table user_favorites enable row level security;
      `,
    });

    if (error) {
      console.error('❌ Error creating table:', error);
      return false;
    }

    console.log('✅ Table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function createPolicies() {
  console.log('🔒 Creating RLS policies...');

  try {
    const { data, error } = await supabase.rpc('sql', {
      query: `
        -- Create policy for user access only
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'user_favorites'
              AND policyname = 'user_favorites_is_owner'
          ) THEN
            CREATE POLICY user_favorites_is_owner
              ON user_favorites
              FOR ALL
              USING (user_id = auth.uid())
              WITH CHECK (user_id = auth.uid());
          END IF;
        END
        $$;
      `,
    });

    if (error) {
      console.error('❌ Error creating policies:', error);
      return false;
    }

    console.log('✅ Policies created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testTable() {
  console.log('🧪 Testing table access...');

  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.error('❌ Table test failed:', error);
      return false;
    }

    console.log('✅ Table is accessible');
    return true;
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🏥 Creating Favorites Table');
  console.log('============================');

  const tableCreated = await createFavoritesTable();
  if (!tableCreated) {
    console.log('\n❌ Failed to create table');
    process.exit(1);
  }

  const policiesCreated = await createPolicies();
  if (!policiesCreated) {
    console.log('\n❌ Failed to create policies');
    process.exit(1);
  }

  const testPassed = await testTable();
  if (!testPassed) {
    console.log('\n❌ Table test failed');
    process.exit(1);
  }

  console.log('\n🎉 Favorites table setup complete!');
  console.log('The heart buttons should now work in your app.');
}

main().catch(console.error);
