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

-- Note: Run this SQL in Supabase SQL editor to create the favorites table