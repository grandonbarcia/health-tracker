import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWorkouts() {
  console.log('Checking workouts in database...\n');

  // Get all workouts
  const { data: workouts, error } = await supabase
    .from('user_workouts')
    .select('*')
    .order('workout_date', { ascending: false });

  if (error) {
    console.error('Error fetching workouts:', error);
    return;
  }

  console.log(`Total workouts found: ${workouts?.length || 0}\n`);

  if (workouts && workouts.length > 0) {
    console.log('Recent workouts:');
    workouts.slice(0, 10).forEach((w, i) => {
      console.log(
        `${i + 1}. Date: ${w.workout_date}, Type: ${
          w.workout_type
        }, Duration: ${w.duration_minutes}min, User: ${w.user_id.substring(
          0,
          8
        )}...`
      );
    });
  } else {
    console.log('No workouts found in database.');
    console.log('\nPossible reasons:');
    console.log('1. No workouts have been logged yet');
    console.log('2. User is not authenticated');
    console.log('3. RLS policies are blocking access');
    console.log('\nTry logging a workout through the UI first.');
  }

  // Check last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate = sevenDaysAgo.toISOString().split('T')[0];

  const { data: recentWorkouts } = await supabase
    .from('user_workouts')
    .select('workout_date, duration_minutes')
    .gte('workout_date', startDate);

  console.log(`\nWorkouts in last 7 days: ${recentWorkouts?.length || 0}`);

  if (recentWorkouts && recentWorkouts.length > 0) {
    console.log('Days with activity:');
    const daysMap = {};
    recentWorkouts.forEach((w) => {
      if (!daysMap[w.workout_date]) {
        daysMap[w.workout_date] = 0;
      }
      daysMap[w.workout_date] += w.duration_minutes || 0;
    });
    Object.entries(daysMap).forEach(([date, minutes]) => {
      console.log(`  ${date}: ${minutes} minutes`);
    });
  }
}

checkWorkouts();
