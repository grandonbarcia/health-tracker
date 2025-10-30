# Database Setup Instructions

The save error you're experiencing is because the required database tables haven't been created yet. Here's how to fix it:

## Quick Fix - Run These SQL Scripts

You need to run the following SQL files in your Supabase SQL Editor:

### 1. **REQUIRED**: Create User Days Tables

```sql
-- File: sql/create-user-days.sql
-- This creates the core tables for saving daily food logs
```

Run the entire contents of `sql/create-user-days.sql` in Supabase SQL Editor.

### 2. **OPTIONAL**: Create Other Feature Tables

```sql
-- File: sql/create-user-settings.sql (for personal goals)
-- File: sql/create-user-food-history.sql (for recent foods)
-- File: sql/create-foods.sql (for food database)
```

## Step-by-Step Instructions

1. **Open Supabase Dashboard**

   - Go to https://supabase.com/dashboard
   - Open your project: `jdhqxvntsuhdvcldrgtt`

2. **Navigate to SQL Editor**

   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the User Days Script**

   - Copy the entire contents of `sql/create-user-days.sql`
   - Paste into the SQL Editor
   - Click "Run" button

4. **Verify Tables Created**
   - Go to "Table Editor" in sidebar
   - You should see `user_days` and `user_day_items` tables

## What These Tables Do

- **`user_days`**: Stores one record per user per date
- **`user_day_items`**: Stores individual food items for each day
- **Row Level Security**: Ensures users only see their own data

## Test the Fix

After creating the tables:

1. Refresh your browser tab with the health tracker
2. Try adding foods to a day and clicking "Save"
3. The error should be resolved!

## Alternative: Copy-Paste SQL

If you prefer, here's the essential SQL to copy-paste directly:

```sql
-- Essential tables for food logging
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

-- Enable Row Level Security
alter table user_days enable row level security;
alter table user_day_items enable row level security;

-- Security policies
CREATE POLICY user_days_is_owner
  ON user_days
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_day_items_via_day
  ON user_day_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_days ud
      WHERE ud.id = user_day_items.day_id
        AND ud.user_id = auth.uid()
    )
  );
```
