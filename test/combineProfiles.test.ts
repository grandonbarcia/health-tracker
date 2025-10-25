import { describe, it, expect, afterEach } from 'vitest';
import { FOOD_DB, combineProfilesWithQty } from '../src/lib/nutrients';

describe('combineProfilesWithQty', () => {
  const TEST_KEY = 'test-server-food';

  afterEach(() => {
    // cleanup any runtime injection
    if ((FOOD_DB as any)[TEST_KEY]) delete (FOOD_DB as any)[TEST_KEY];
  });

  it('uses runtime FOOD_DB entries (server profiles) when present', () => {
    // inject a server-fetched profile into runtime FOOD_DB
    (FOOD_DB as any)[TEST_KEY] = {
      calories: 100,
      protein: 2,
      carbs: 10,
      fat: 1,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      calcium: 0,
      iron: 0,
      potassium: 0,
      vitaminC: 0,
      vitaminA: 0,
      vitaminD: 0,
      cholesterol: 0,
    };

    const totals = combineProfilesWithQty([{ name: TEST_KEY, qty: 2 }]);
    expect(totals.calories).toBe(200);
    expect(totals.protein).toBe(4);
    expect(totals.carbs).toBe(20);
  });
});
