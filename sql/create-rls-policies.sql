-- Create policies for Row Level Security
-- Run this in Supabase SQL Editor to complete the database setup

-- Policy for user_days table
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

-- Policy for user_day_items table
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

-- Policy for user_favorites table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites') THEN
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
  END IF;
END
$$;
