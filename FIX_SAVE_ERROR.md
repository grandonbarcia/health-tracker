# 🔧 Fix the Save Error - Database Setup

The **"Failed to save data to your account"** error occurs because the required database tables haven't been created yet. Here's how to fix it:

## 🚀 Quick Fix (2 minutes)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Open your project: **jdhqxvntsuhdvcldrgtt**
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Copy & Paste This SQL

Copy the entire code block below and paste it into the SQL Editor:

```sql
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

-- Security policies (only access your own data)
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_days ud
      WHERE ud.id = user_day_items.day_id
        AND ud.user_id = auth.uid()
    )
  );
```

### Step 3: Run the SQL

1. Click the **"Run"** button (or press Ctrl+Enter)
2. You should see: **"Success. No rows returned"**

### Step 4: Verify Tables Created

1. Click **"Table Editor"** in the left sidebar
2. You should now see two new tables:
   - **`user_days`** - Stores one record per user per date
   - **`user_day_items`** - Stores individual food items

### Step 5: Test the Fix

1. Go back to your health tracker app
2. Refresh the browser page
3. Try adding foods to a day and clicking **"Save"**
4. The error should be gone! ✅

## ✨ What These Tables Do

- **`user_days`**: Creates a "day" record for each date you log food
- **`user_day_items`**: Stores each individual food item (eggs, bread, etc.)
- **Row Level Security**: Ensures you only see your own data, never other users'
- **Automatic IDs**: Each record gets a unique identifier
- **Meal Tracking**: Supports breakfast, lunch, dinner categorization

## 🛠️ Alternative: Optional Enhancement Tables

After the core tables work, you can also add these for enhanced features:

### User Settings (for personal nutrition goals)

```sql
create table if not exists user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null unique,
  daily_calories numeric default 2000,
  daily_protein numeric default 150,
  daily_carbs numeric default 250,
  daily_fat numeric default 65,
  daily_fiber numeric default 25,
  daily_sodium numeric default 2300,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;
CREATE POLICY user_settings_is_owner
  ON user_settings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Recent Foods Tracking

```sql
create table if not exists user_food_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  food_id text not null,
  last_used_at timestamptz default now(),
  usage_count integer default 1,
  created_at timestamptz default now()
);

create unique index if not exists idx_user_food_history_unique
  on user_food_history(user_id, food_id);

alter table user_food_history enable row level security;
CREATE POLICY user_food_history_is_owner
  ON user_food_history
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## 🎯 Troubleshooting

**Still getting errors?** Check:

1. **Are you logged in?** Make sure you're signed into the health tracker
2. **Check the browser console** - Press F12 and look for specific error messages
3. **Table permissions** - The RLS policies should allow your user to read/write
4. **Try refreshing** - Sometimes a browser refresh helps after DB changes

## ✅ Success Indicators

After setup, you should be able to:

- ✅ Add foods to any calendar day
- ✅ Click "Save" without errors
- ✅ See saved foods when reopening a day
- ✅ Have data persist between browser sessions
- ✅ See your nutrition goals (if you set them up)

The health tracker will now work as a fully functional personal nutrition tracking system! 🎉
