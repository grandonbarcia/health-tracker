import { FOOD_DB } from './nutrients';
import { RESTAURANT_FOODS } from './restaurantFoods';
import { RecipeIngredient, RecipeWithNutrition, Recipe } from '../types/recipe';

/**
 * Calculate total nutrition for a recipe based on its ingredients
 */
export function calculateRecipeNutrition(recipe: Recipe): RecipeWithNutrition {
  const totalNutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
    vitamin_c: 0,
    calcium: 0,
    iron: 0,
    potassium: 0,
    magnesium: 0,
    zinc: 0,
    vitamin_a: 0,
    vitamin_e: 0,
    vitamin_k: 0,
    folate: 0,
    vitamin_b12: 0,
    vitamin_d: 0,
  };

  // Calculate nutrition for each ingredient
  recipe.recipe_ingredients?.forEach((ingredient) => {
    const foodData = getFoodData(ingredient.food_id, ingredient.food_type);
    if (foodData) {
      // Add nutritional values multiplied by quantity
      Object.keys(totalNutrition).forEach((nutrient) => {
        const value = (foodData as any)[nutrient] || 0;
        totalNutrition[nutrient as keyof typeof totalNutrition] +=
          value * ingredient.quantity;
      });
    }
  });

  // Calculate per-serving nutrition
  const servings = recipe.servings || 1;
  const nutritionPerServing = {} as typeof totalNutrition;
  Object.keys(totalNutrition).forEach((nutrient) => {
    nutritionPerServing[nutrient as keyof typeof totalNutrition] =
      totalNutrition[nutrient as keyof typeof totalNutrition] / servings;
  });

  return {
    ...recipe,
    nutrition: totalNutrition,
    nutritionPerServing,
  };
}

/**
 * Get food data from either regular FOOD_DB or restaurant foods
 */
function getFoodData(foodId: string, foodType: 'regular' | 'restaurant') {
  if (foodType === 'restaurant') {
    // RESTAURANT_FOODS is an object, need to find by ID
    const restaurantFoodsArray = Object.values(RESTAURANT_FOODS);
    return restaurantFoodsArray.find((food: any) => food.id === foodId);
  } else {
    return FOOD_DB[foodId];
  }
}

/**
 * Get display name for a food item
 */
export function getFoodDisplayName(
  foodId: string,
  foodType: 'regular' | 'restaurant'
): string {
  const foodData = getFoodData(foodId, foodType);
  return (foodData as any)?.name || foodId;
}

/**
 * Get serving information for a food item
 */
export function getFoodServing(
  foodId: string,
  foodType: 'regular' | 'restaurant'
): string {
  const foodData = getFoodData(foodId, foodType);
  return (
    (foodData as any)?.serving ||
    (foodData as any)?.serving_text ||
    (foodData as any)?.serving_size ||
    ''
  );
}
