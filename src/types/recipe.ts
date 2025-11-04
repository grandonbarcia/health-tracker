// Recipe-related TypeScript interfaces and types

export interface RecipeIngredient {
  id?: string;
  food_id: string;
  quantity: number;
  food_type: 'regular' | 'restaurant';
}

export interface Recipe {
  id?: string;
  name: string;
  description?: string;
  servings: number;
  created_at?: string;
  recipe_ingredients?: RecipeIngredient[];
}

export interface RecipeWithNutrition extends Recipe {
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
    [key: string]: number;
  };
  nutritionPerServing: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
    [key: string]: number;
  };
}

export interface CreateRecipeData {
  name: string;
  description?: string;
  servings: number;
  ingredients: RecipeIngredient[];
}

export interface UpdateRecipeData extends CreateRecipeData {
  id: string;
}
