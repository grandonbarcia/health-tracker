#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SUPABASE_API_KEY in env'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const filePath = path.resolve('data/food_db_export.json');
if (!fs.existsSync(filePath)) {
  console.error('Export file not found. Run scripts/export-food-db.mjs first.');
  process.exit(1);
}

const foods = JSON.parse(fs.readFileSync(filePath, 'utf8'));
console.log('Seeding', foods.length, 'foods...');

for (const f of foods) {
  const row = {
    id: f.id,
    name: f.name,
    serving: f.serving ?? null,
    calories: f.calories ?? null,
    protein: f.protein ?? null,
    carbs: f.carbs ?? null,
    fat: f.fat ?? null,
    fiber: f.fiber ?? null,
    sugar: f.sugar ?? null,
    sodium: f.sodium ?? null,
    calcium: f.calcium ?? null,
    iron: f.iron ?? null,
    potassium: f.potassium ?? null,
    vitaminC: f.vitaminC ?? null,
    vitaminA: f.vitaminA ?? null,
    vitaminD: f.vitaminD ?? null,
    cholesterol: f.cholesterol ?? null,
    metadata: {},
  };

  const { error } = await supabase
    .from('foods')
    .upsert(row, { onConflict: ['id'] });
  if (error) console.error('Upsert error for', f.id, error.message || error);
}

console.log('Seeding complete');
