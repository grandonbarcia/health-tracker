# Exercise Tracking Database Setup

## Overview

This creates the database schema for tracking workouts and exercises in the health tracker app.

## Tables Created

### 1. `user_workouts`

Stores individual workout sessions for each user.

**Columns:**

- `id` - UUID primary key
- `user_id` - References auth.users
- `workout_date` - Date of the workout
- `workout_type` - Type of workout (Cardio, Strength, Yoga, etc.)
- `duration_minutes` - How long the workout lasted
- `calories_burned` - Estimated calories burned
- `notes` - Optional notes about the workout
- `created_at`, `updated_at` - Timestamps

### 2. `user_exercises`

Stores individual exercises within each workout.

**Columns:**

- `id` - UUID primary key
- `workout_id` - References user_workouts
- `exercise_name` - Name of the exercise
- `sets` - Number of sets (for strength training)
- `reps` - Reps per set (for strength training)
- `weight` - Weight used in lbs/kg (for strength training)
- `duration_minutes` - Duration (for cardio exercises)
- `distance` - Distance covered (for running/cycling)
- `rest_seconds` - Rest time between sets
- `exercise_order` - Order in the workout
- `notes` - Optional notes
- `created_at` - Timestamp

### 3. `exercise_templates`

Library of pre-built exercises users can choose from.

**Columns:**

- `id` - UUID primary key
- `name` - Exercise name
- `category` - Type (Cardio, Strength, Flexibility, Balance)
- `muscle_group` - Primary muscle targeted
- `equipment` - Equipment needed
- `difficulty` - Beginner, Intermediate, Advanced
- `instructions` - How to perform the exercise
- `image_url` - Optional image reference
- `created_at` - Timestamp

## Setup Instructions

### Step 1: Create Tables

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **SQL Editor**
4. Copy the SQL from: `scripts/create-exercise-tables.sql`
5. Paste and click **Run**

### Step 2: Populate Exercise Library

1. In the same SQL Editor
2. Copy the SQL from: `scripts/populate-exercise-templates.sql`
3. Paste and click **Run**

This will add 50+ common exercises to your database.

## Features

### Row Level Security (RLS)

- Users can only view/edit their own workouts and exercises
- All users can view the exercise template library
- Automatic enforcement at the database level

### Automatic Timestamps

- `updated_at` automatically updates when workouts are modified
- `created_at` tracks when records are first created

### Data Integrity

- Cascading deletes: When a workout is deleted, all associated exercises are deleted
- Foreign key constraints ensure data consistency
- Indexes for fast queries

## Usage Examples

### Log a Workout

```sql
-- Insert a workout
INSERT INTO user_workouts (user_id, workout_date, workout_type, duration_minutes, calories_burned, notes)
VALUES ('user-uuid', '2025-12-12', 'Strength', 60, 280, 'Great chest day!');

-- Get the workout_id from the insert, then add exercises
INSERT INTO user_exercises (workout_id, exercise_name, sets, reps, weight, exercise_order)
VALUES
  ('workout-uuid', 'Bench Press', 4, 8, 185, 1),
  ('workout-uuid', 'Incline Press', 3, 10, 135, 2),
  ('workout-uuid', 'Push-ups', 3, 15, NULL, 3);
```

### Query Recent Workouts

```sql
SELECT * FROM user_workouts
WHERE user_id = 'user-uuid'
ORDER BY workout_date DESC
LIMIT 10;
```

### Get Exercises for a Workout

```sql
SELECT * FROM user_exercises
WHERE workout_id = 'workout-uuid'
ORDER BY exercise_order;
```

### Browse Exercise Library

```sql
SELECT * FROM exercise_templates
WHERE category = 'Strength' AND muscle_group = 'Chest'
ORDER BY name;
```

## Next Steps

After running these scripts, you can:

1. Build a workout logging form in the UI
2. Display workout history
3. Create workout statistics and charts
4. Build routine templates
5. Add exercise search/filter functionality

## Troubleshooting

### Permission Errors

If you get permission errors, ensure:

1. You're logged in to Supabase
2. RLS policies are created correctly
3. Your user is authenticated in the app

### Duplicate Key Errors

If re-running scripts:

- Tables use `CREATE TABLE IF NOT EXISTS`
- Policies use `CREATE POLICY` (drop manually if needed)
- Exercise templates will cause duplicates (clear table first if re-running)

### To Reset Tables

```sql
DROP TABLE IF EXISTS user_exercises CASCADE;
DROP TABLE IF EXISTS user_workouts CASCADE;
DROP TABLE IF EXISTS exercise_templates CASCADE;
```

Then re-run the create script.
