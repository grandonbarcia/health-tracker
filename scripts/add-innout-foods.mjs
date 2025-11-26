#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

if (!url || !key) {
  console.error(
    '❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment'
  );
  process.exit(1);
}

const supabase = createClient(url, key);

// In-N-Out menu items from restaurantFoods.ts
const inNOutFoods = [
  {
    id: 'innout_double_double',
    name: 'Double-Double',
    serving: '1 burger',
    calories: 670,
    protein: 37,
    carbs: 39,
    fat: 41,
    fiber: 3,
    sodium: 1440,
    metadata: {
      restaurant: 'In-N-Out',
      category: 'Burgers',
      description:
        'Two beef patties, two slices of cheese, lettuce, tomato, onion, spread',
    },
  },
  {
    id: 'innout_hamburger',
    name: 'Hamburger',
    serving: '1 burger',
    calories: 390,
    protein: 16,
    carbs: 39,
    fat: 19,
    fiber: 3,
    sodium: 650,
    metadata: {
      restaurant: 'In-N-Out',
      category: 'Burgers',
      description:
        'Fresh beef patty, lettuce, tomato, onion, spread on toasted bun',
    },
  },
  {
    id: 'innout_cheeseburger',
    name: 'Cheeseburger',
    serving: '1 burger',
    calories: 480,
    protein: 22,
    carbs: 39,
    fat: 27,
    fiber: 3,
    sodium: 1000,
    metadata: {
      restaurant: 'In-N-Out',
      category: 'Burgers',
      description:
        'Fresh beef patty, American cheese, lettuce, tomato, onion, spread',
    },
  },
  {
    id: 'innout_protein_style_double_double',
    name: 'Protein Style Double-Double',
    serving: '1 lettuce wrapped burger',
    calories: 520,
    protein: 33,
    carbs: 11,
    fat: 39,
    fiber: 6,
    sodium: 1160,
    metadata: {
      restaurant: 'In-N-Out',
      category: 'Burgers',
      description:
        'Two beef patties, two cheese slices wrapped in lettuce instead of bun',
    },
  },
  {
    id: 'innout_animal_style_burger',
    name: 'Animal Style Burger',
    serving: '1 burger',
    calories: 520,
    protein: 22,
    carbs: 41,
    fat: 31,
    fiber: 3,
    sodium: 1190,
    metadata: {
      restaurant: 'In-N-Out',
      category: 'Burgers',
      description:
        'Cheeseburger with mustard-grilled patty, pickles, grilled onions, extra spread',
    },
  },
  {
    id: 'innout_french_fries',
    name: 'French Fries',
    serving: '1 regular order',
    calories: 395,
    protein: 7,
    carbs: 54,
    fat: 18,
    fiber: 2,
    sodium: 245,
    metadata: {
      restaurant: 'In-N-Out',
      category: 'Sides',
      description: 'Fresh-cut potatoes cooked in 100% sunflower oil',
    },
  },
  {
    id: 'innout_animal_style_fries',
    name: 'Animal Style Fries',
    serving: '1 order',
    calories: 750,
    protein: 18,
    carbs: 57,
    fat: 51,
    fiber: 7,
    sodium: 1690,
    metadata: {
      restaurant: 'In-N-Out',
      category: 'Sides',
      description:
        'French fries topped with cheese, grilled onions, and spread',
    },
  },
  {
    id: 'innout_chocolate_shake',
    name: 'Chocolate Shake',
    serving: '1 shake (15 oz)',
    calories: 590,
    protein: 9,
    carbs: 72,
    fat: 29,
    fiber: 0,
    sodium: 350,
    metadata: {
      restaurant: 'In-N-Out',
      category: 'Beverages',
      description: 'Real ice cream blended with chocolate syrup',
    },
  },
  {
    id: 'innout_vanilla_shake',
    name: 'Vanilla Shake',
    serving: '1 shake (15 oz)',
    calories: 580,
    protein: 9,
    carbs: 67,
    fat: 31,
    fiber: 0,
    sodium: 390,
    metadata: {
      restaurant: 'In-N-Out',
      category: 'Beverages',
      description: 'Real ice cream blended to perfection',
    },
  },
  {
    id: 'innout_neapolitan_shake',
    name: 'Neapolitan Shake',
    serving: '1 shake (15 oz)',
    calories: 590,
    protein: 9,
    carbs: 71,
    fat: 30,
    fiber: 0,
    sodium: 370,
    metadata: {
      restaurant: 'In-N-Out',
      category: 'Beverages',
      description:
        'Chocolate, vanilla, and strawberry ice cream blended together',
    },
  },
];

async function addInNOutFoods() {
  console.log('🍔 Adding In-N-Out menu items to Supabase...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const food of inNOutFoods) {
    try {
      const { data, error } = await supabase
        .from('foods')
        .upsert(food, { onConflict: 'id' })
        .select();

      if (error) {
        console.error(`❌ Error adding ${food.name}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Added: ${food.name} (${food.calories} cal)`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Unexpected error adding ${food.name}:`, err);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Successfully added: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📦 Total items: ${inNOutFoods.length}`);

  if (successCount === inNOutFoods.length) {
    console.log('\n🎉 All In-N-Out items successfully added to database!');
  }
}

addInNOutFoods().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
