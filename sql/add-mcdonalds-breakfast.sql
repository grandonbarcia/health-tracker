-- McDonald's Breakfast Sandwiches
-- Nutrition data from McDonald's official nutrition information

INSERT INTO foods (id, name, serving, calories, protein, carbs, fat, fiber, sodium, metadata)
VALUES
  (
    'mcdonalds-egg-mcmuffin',
    'Egg McMuffin',
    '1 sandwich',
    310,
    17,
    30,
    13,
    2,
    770,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-sausage-mcmuffin',
    'Sausage McMuffin',
    '1 sandwich',
    400,
    14,
    29,
    23,
    2,
    830,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-sausage-mcmuffin-egg',
    'Sausage McMuffin with Egg',
    '1 sandwich',
    480,
    21,
    30,
    30,
    2,
    880,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-sausage-biscuit',
    'Sausage Biscuit',
    '1 sandwich',
    460,
    11,
    34,
    30,
    2,
    1080,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-sausage-biscuit-egg',
    'Sausage Biscuit with Egg',
    '1 sandwich',
    530,
    18,
    35,
    35,
    2,
    1150,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-bacon-egg-cheese-biscuit',
    'Bacon, Egg & Cheese Biscuit',
    '1 sandwich',
    460,
    19,
    38,
    25,
    2,
    1300,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-bacon-egg-cheese-mcgriddles',
    'Bacon, Egg & Cheese McGriddles',
    '1 sandwich',
    430,
    15,
    45,
    18,
    2,
    1080,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-sausage-egg-cheese-mcgriddles',
    'Sausage, Egg & Cheese McGriddles',
    '1 sandwich',
    550,
    20,
    48,
    30,
    2,
    1260,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-sausage-mcgriddles',
    'Sausage McGriddles',
    '1 sandwich',
    430,
    11,
    44,
    23,
    2,
    1030,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-bacon-egg-cheese-bagel',
    'Bacon, Egg & Cheese Bagel',
    '1 sandwich',
    560,
    24,
    56,
    25,
    3,
    1360,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-steak-egg-cheese-bagel',
    'Steak, Egg & Cheese Bagel',
    '1 sandwich',
    670,
    32,
    56,
    33,
    3,
    1490,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-big-breakfast',
    'Big Breakfast',
    '1 meal',
    750,
    28,
    56,
    48,
    4,
    1560,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
  ),
  (
    'mcdonalds-big-breakfast-hotcakes',
    'Big Breakfast with Hotcakes',
    '1 meal',
    1090,
    36,
    111,
    56,
    6,
    2070,
    '{"restaurant": "McDonald''s", "category": "Breakfast Sandwich"}'
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
