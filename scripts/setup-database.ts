/**
 * Database Setup Script
 *
 * This script will create the required database tables for the health tracker.
 * Run this once to set up your Supabase database.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Make sure you have:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('🚀 Setting up database tables...');

  // Create user_days and user_day_items tables
  const userDaysSQL = `
    -- Create user_days and user_day_items tables with RLS for per-user data
    create extension if not exists pgcrypto;

    create table if not exists user_days (
      id uuid default gen_random_uuid() primary key,
      user_id uuid not null,
      day_date date not null,
      metadata jsonb default '{}'::jsonb,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );

    create unique index if not exists idx_user_days_user_date on user_days(user_id, day_date);

    create table if not exists user_day_items (
      id uuid default gen_random_uuid() primary key,
      day_id uuid not null references user_days(id) on delete cascade,
      food_id text not null,
      qty numeric not null default 1,
      serving_override text,
      metadata jsonb default '{}'::jsonb,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );

    create index if not exists idx_user_day_items_day on user_day_items(day_id);
    create index if not exists idx_user_day_items_metadata on user_day_items using gin (metadata);

    -- Enable Row Level Security
    alter table user_days enable row level security;
    alter table user_day_items enable row level security;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: userDaysSQL });
    if (error) throw error;
    console.log('✅ Created user_days and user_day_items tables');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    // Try alternative approach - execute SQL directly
    try {
      const { error } = await supabase.from('user_days').select('id').limit(1);
      if (error && error.message.includes('does not exist')) {
        console.log(
          "⚠️  Tables don't exist. Please run the SQL manually in Supabase."
        );
        console.log('📋 Copy this SQL to Supabase SQL Editor:');
        console.log(userDaysSQL);
        return false;
      }
    } catch (e) {
      console.error('❌ Cannot check table existence:', e);
      return false;
    }
  }

  // Create RLS policies
  const policiesSQL = `
    -- Create policies for Row Level Security
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_days'
          AND policyname = 'user_days_is_owner'
      ) THEN
        CREATE POLICY user_days_is_owner
          ON user_days
          FOR ALL
          USING (user_id = auth.uid())
          WITH CHECK (user_id = auth.uid());
      END IF;
    END
    $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_day_items'
          AND policyname = 'user_day_items_via_day'
      ) THEN
        CREATE POLICY user_day_items_via_day
          ON user_day_items
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM user_days ud
              WHERE ud.id = user_day_items.day_id
                AND ud.user_id = auth.uid()
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM user_days ud
              WHERE ud.id = user_day_items.day_id
                AND ud.user_id = auth.uid()
            )
          );
      END IF;
    END
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    if (error) throw error;
    console.log('✅ Created RLS policies');
  } catch (error) {
    console.log(
      '⚠️  Could not create policies automatically. Please run in Supabase:'
    );
    console.log(policiesSQL);
  }

  return true;
}

async function verifySetup() {
  console.log('🔍 Verifying database setup...');

  try {
    // Test user_days table
    const { error: daysError } = await supabase
      .from('user_days')
      .select('id')
      .limit(1);

    if (daysError) {
      console.error('❌ user_days table not accessible:', daysError.message);
      return false;
    }

    // Test user_day_items table
    const { error: itemsError } = await supabase
      .from('user_day_items')
      .select('id')
      .limit(1);

    if (itemsError) {
      console.error(
        '❌ user_day_items table not accessible:',
        itemsError.message
      );
      return false;
    }

    console.log('✅ Database setup verified!');
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

async function main() {
  console.log('🏥 Health Tracker Database Setup');
  console.log('==================================');

  const tablesCreated = await createTables();
  if (!tablesCreated) {
    console.log('\n❌ Setup failed. Please run the SQL manually in Supabase.');
    console.log('📖 See SETUP_DATABASE.md for detailed instructions.');
    process.exit(1);
  }

  const verified = await verifySetup();
  if (!verified) {
    console.log('\n❌ Setup verification failed.');
    process.exit(1);
  }

  console.log('\n🎉 Database setup complete!');
  console.log('You can now save food logs in your health tracker.');
}

// Run the setup
if (require.main === module) {
  main().catch(console.error);
}

export { createTables, verifySetup };
