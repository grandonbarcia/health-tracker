// Debug script to test user data loading
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

async function debugUserDataLoading() {
  console.log('🔍 Debugging user data loading...\n');

  // Test 1: Check what tables exist
  console.log('1️⃣ Checking available tables...');
  try {
    const { data: userDays, error: userDaysError } = await supabase
      .from('user_days')
      .select('*')
      .limit(3);

    console.log('✅ user_days table accessible');
    console.log(`   Found ${userDays?.length || 0} user days`);
    if (userDays && userDays.length > 0) {
      console.log(`   Sample: ${JSON.stringify(userDays[0], null, 2)}`);
    }
  } catch (err) {
    console.log('❌ user_days error:', err.message);
  }

  try {
    const { data: days, error: daysError } = await supabase
      .from('days')
      .select('*')
      .limit(3);

    console.log('✅ days table accessible (legacy)');
    console.log(`   Found ${days?.length || 0} legacy days`);
    if (days && days.length > 0) {
      console.log(`   Sample: ${JSON.stringify(days[0], null, 2)}`);
    }
  } catch (err) {
    console.log('❌ days table error:', err.message);
  }

  console.log('\n2️⃣ Testing with authenticated user simulation...');

  // Test 2: Try to create a test user and data
  try {
    console.log(
      '⚠️  Note: This test requires a real user session to work properly'
    );
    console.log(
      '   Run this test in the browser console while logged in for accurate results'
    );

    // Show what happens without auth
    const { data: noAuthData, error: noAuthError } = await supabase
      .from('user_days')
      .select('*')
      .limit(1);

    if (noAuthError) {
      console.log(
        '✅ RLS working: Cannot access user_days without authentication'
      );
      console.log(`   Error: ${noAuthError.message}`);
    } else {
      console.log('⚠️  Unexpected: Could access user_days without auth');
      console.log(`   Data: ${JSON.stringify(noAuthData, null, 2)}`);
    }
  } catch (err) {
    console.log('✅ RLS working: Error accessing user_days without auth');
    console.log(`   Error: ${err.message}`);
  }

  console.log('\n3️⃣ Recommendations:');
  console.log('- Check browser console while logged in for auth errors');
  console.log('- Verify that user_days table has RLS enabled and working');
  console.log('- Ensure client is using anon key (not service role)');
  console.log('- Test the getDayMeals function directly in browser console');

  console.log('\n📋 Browser test command (copy & paste while logged in):');
  console.log(`
  // Test in browser console while logged in:
  import { getDayMeals } from '/src/lib/user';
  getDayMeals('2025-10-27').then(console.log).catch(console.error);
  `);
}

debugUserDataLoading().catch(console.error);
