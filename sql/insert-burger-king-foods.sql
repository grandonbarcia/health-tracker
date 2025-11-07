-- Insert top 10 Burger King foods into the foods table
-- Run this in the Supabase SQL editor

INSERT INTO foods (
  id, name, serving, calories, protein, carbs, fat, fiber, sodium, metadata
) VALUES 
  (
    'burgerking_whopper',
    'Whopper',
    '1 sandwich',
    677,
    28,
    49,
    40,
    2,
    980,
    '{"restaurant": "Burger King", "category": "Burgers"}'::jsonb
  ),
  (
    'burgerking_whopper_jr',
    'Whopper Jr.',
    '1 sandwich',
    310,
    13,
    27,
    18,
    1,
    390,
    '{"restaurant": "Burger King", "category": "Burgers"}'::jsonb
  ),
  (
    'burgerking_bacon_king',
    'Bacon King',
    '1 sandwich',
    1150,
    61,
    49,
    79,
    2,
    2150,
    '{"restaurant": "Burger King", "category": "Burgers"}'::jsonb
  ),
  (
    'burgerking_chicken_fries_9pc',
    'Chicken Fries (9 piece)',
    '9 pieces',
    280,
    13,
    20,
    17,
    2,
    940,
    '{"restaurant": "Burger King", "category": "Chicken"}'::jsonb
  ),
  (
    'burgerking_original_chicken_sandwich',
    'Original Chicken Sandwich',
    '1 sandwich',
    660,
    28,
    54,
    37,
    3,
    1410,
    '{"restaurant": "Burger King", "category": "Chicken"}'::jsonb
  ),
  (
    'burgerking_impossible_whopper',
    'Impossible Whopper',
    '1 sandwich',
    630,
    25,
    58,
    34,
    4,
    1080,
    '{"restaurant": "Burger King", "category": "Burgers"}'::jsonb
  ),
  (
    'burgerking_chicken_nuggets_10pc',
    'Chicken Nuggets (10 piece)',
    '10 pieces',
    470,
    21,
    30,
    29,
    2,
    900,
    '{"restaurant": "Burger King", "category": "Chicken"}'::jsonb
  ),
  (
    'burgerking_french_fries_medium',
    'French Fries',
    'medium',
    380,
    4,
    49,
    18,
    4,
    640,
    '{"restaurant": "Burger King", "category": "Sides"}'::jsonb
  ),
  (
    'burgerking_onion_rings_medium',
    'Onion Rings',
    'medium',
    410,
    6,
    53,
    19,
    3,
    570,
    '{"restaurant": "Burger King", "category": "Sides"}'::jsonb
  ),
  (
    'burgerking_oreo_shake_medium',
    'Oreo Shake',
    'medium (16 oz)',
    610,
    11,
    85,
    24,
    1,
    380,
    '{"restaurant": "Burger King", "category": "Beverages"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  serving = EXCLUDED.serving,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  fiber = EXCLUDED.fiber,
  sodium = EXCLUDED.sodium,
  metadata = EXCLUDED.metadata;
