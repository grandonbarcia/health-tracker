-- Insert frozen cheese pizza into the foods table
-- Run this in the Supabase SQL editor

INSERT INTO foods (
  id, name, serving, calories, protein, carbs, fat, fiber, sugar, sodium, 
  calcium, iron, potassium, "vitaminC", "vitaminA", "vitaminD", cholesterol, metadata
) VALUES 
  (
    'frozen_cheese_pizza',
    'Frozen Cheese Pizza',
    '1/4 pizza (140g)',
    320,
    12,
    42,
    11,
    2,
    6,
    680,
    250,
    2.5,
    180,
    2,
    200,
    0.5,
    25,
    '{"category": "Frozen Foods"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  serving = EXCLUDED.serving,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  fiber = EXCLUDED.fiber,
  sugar = EXCLUDED.sugar,
  sodium = EXCLUDED.sodium,
  calcium = EXCLUDED.calcium,
  iron = EXCLUDED.iron,
  potassium = EXCLUDED.potassium,
  "vitaminC" = EXCLUDED."vitaminC",
  "vitaminA" = EXCLUDED."vitaminA",
  "vitaminD" = EXCLUDED."vitaminD",
  cholesterol = EXCLUDED.cholesterol,
  metadata = EXCLUDED.metadata;