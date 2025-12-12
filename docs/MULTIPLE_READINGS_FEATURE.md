# Multiple Daily Vitals Readings Feature

## Overview

This feature allows users to track multiple vital sign readings throughout the day, with each reading timestamped to show when it was taken.

## What's New

### 1. **Multiple Readings Per Day**

- Previously: Only one vital reading could be stored per day (it would overwrite the previous reading)
- Now: You can add unlimited readings throughout the day

### 2. **Time Tracking**

- Each reading is automatically timestamped with the exact time it was taken
- View your vitals progression throughout the day

### 3. **Intraday Trends Chart**

- New "Today's Readings" section displays all readings taken today
- Separate charts for:
  - Heart Rate (bpm)
  - Blood Pressure (systolic/diastolic)
  - Energy Level (1-10 scale)
- Hover over bars to see exact values
- Times are displayed below each reading

### 4. **Weekly Trends** (Existing)

- Still shows 7-day trends for overall patterns
- Now uses the most recent reading from each day

## Setup Instructions

### Step 1: Run Database Migration

You need to update your database schema to support multiple readings per day.

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **SQL Editor** (in the left sidebar)
4. Copy the SQL from: `scripts/modify-user-vitals-for-multiple-readings.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)

The migration will:

- Remove the unique constraint that limited one reading per day
- Add a `reading_time` column to track when each reading was taken
- Update existing records with timestamps
- Create optimized database indexes

### Step 2: Test the Feature

1. Navigate to the Vitals page in your app
2. Click the **+** button to add a new reading
3. Enter your vital signs and submit
4. Add another reading after some time
5. See both readings displayed in the "Today's Readings" chart

## Database Schema Changes

### Before:

```sql
UNIQUE(user_id, reading_date)  -- Only one reading per day allowed
```

### After:

```sql
-- Removed unique constraint
reading_time TIME  -- New column to track time of day
```

## How It Works

### Adding a Reading

When you submit vital signs:

1. Current date is recorded in `reading_date`
2. Current time is recorded in `reading_time` (e.g., "14:30:00")
3. A new row is inserted (doesn't overwrite existing readings)
4. UI refreshes to show all today's readings

### Displaying Readings

- **Today's Readings**: Shows all readings from today, ordered by time
- **7-Day Trends**: Shows one aggregated value per day (typically the most recent reading)
- **Current Stats Cards**: Shows the most recent reading for each metric

## UI Features

### Today's Readings Chart

- **Dynamic Scaling**: Bars scale based on the highest value in the dataset
- **Hover Tooltips**: Show exact values when you hover over a bar
- **Time Labels**: Display when each reading was taken (HH:MM format)
- **Color Coded**:
  - Red: Heart Rate
  - Blue: Blood Pressure
  - Amber: Energy Level

### Responsive Design

- Bars have a minimum width to prevent overcrowding
- Chart scrolls horizontally if you have many readings
- Works on mobile and desktop

## Example Use Cases

1. **Track Blood Pressure Throughout Day**

   - Morning reading: 120/80 at 8:00 AM
   - Afternoon reading: 125/82 at 2:00 PM
   - Evening reading: 118/79 at 8:00 PM
   - See how your BP changes with activity and stress

2. **Monitor Heart Rate Patterns**

   - Resting heart rate in morning
   - Post-workout heart rate
   - Before bed heart rate
   - Identify patterns and trends

3. **Energy Level Tracking**
   - Track energy dips during the day
   - See if interventions (coffee, exercise, meals) affect energy
   - Optimize your daily routine

## Technical Details

### File Changes

1. `src/app/dashboard/vitals/page.tsx`:

   - Added `todaysReadings` state
   - Added `loadTodaysReadings()` function
   - Changed from `upsert` to `insert` for saving
   - Added intraday trends chart component

2. `scripts/modify-user-vitals-for-multiple-readings.sql`:

   - Database migration script

3. `scripts/run-migration.js`:
   - Helper script to display migration instructions

### API Changes

- **Insert instead of Upsert**: New readings are always inserted as new rows
- **Time Tracking**: `reading_time` is set to current time on submit
- **Query Changes**: Fetch all readings for today instead of just one

## Troubleshooting

### "Duplicate key value violates unique constraint"

If you see this error, the database migration hasn't been run yet. Follow Step 1 above.

### Readings not showing up

1. Check browser console for errors
2. Verify the reading was saved (check Supabase database)
3. Try refreshing the page
4. Check that `loadTodaysReadings()` is being called

### Times showing incorrectly

- Times are stored in UTC but displayed in your local timezone
- The `reading_time` column stores time of day without timezone
- Check your system timezone settings if times seem off

## Future Enhancements

- Export daily readings to CSV
- Set reminders to take readings at specific times
- Compare today's pattern to previous days
- Add annotations/notes to specific readings
- Track medication timing alongside vitals
