-- McDonald's Chicken Biscuit
-- Nutrition data from McDonald's official nutrition information

INSERT INTO foods (id, name, serving, calories, protein, carbs, fat, fiber, sodium, metadata)
VALUES
  (
    'mcdonalds-chicken-biscuit',
    'Chicken Biscuit',
    '1 sandwich',
    420,
    14,
    42,
    20,
    2,
    1110,
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
