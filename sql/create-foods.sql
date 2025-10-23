-- SQL for creating `foods` table in Supabase/Postgres
-- Run this in the Supabase SQL editor or psql connected to your project's DB

create extension if not exists pg_trgm;

create table if not exists foods (
  id text primary key,
  name text not null,
  aliases text[] default array[]::text[],
  serving text,
  calories integer,
  protein real,
  carbs real,
  fat real,
  fiber real,
  sugar real,
  sodium integer,
  calcium integer,
  iron real,
  potassium integer,
  vitaminC real,
  vitaminA integer,
  vitaminD real,
  cholesterol integer,
  metadata jsonb default '{}'::jsonb
);

create index if not exists idx_foods_name_trgm on foods using gin (name gin_trgm_ops);

-- For the aliases (text[]), use a standard GIN index for array containment queries
create index if not exists idx_foods_aliases_gin on foods using gin (aliases);

-- If you want trigram similarity searches over aliases as text, you can create an
-- expression index that converts the array to a single text value. Uncomment the
-- following line if you prefer that approach (requires pg_trgm):
-- create index if not exists idx_foods_aliases_trgm on foods using gin ((array_to_string(aliases, ' ')) gin_trgm_ops);
