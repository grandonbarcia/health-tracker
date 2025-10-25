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

-- Policies: only allow users to access/modify their own rows
-- Create policies if they do not already exist (Postgres doesn't support
-- CREATE POLICY IF NOT EXISTS, so use a DO block to check pg_policies).
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

-- Keep updated_at fresh via a trigger if you want (optional)

-- Note: Run this SQL in Supabase SQL editor or via psql as the project owner.
