'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, RecipeIngredient, CreateRecipeData } from '../types/recipe';
import {
  calculateRecipeNutrition,
  getFoodDisplayName,
  getFoodServing,
} from '../lib/recipeUtils';
import { FOOD_DB } from '../lib/nutrients';
import { RESTAURANT_FOODS } from '../lib/restaurantFoods';
import { supabase } from '../lib/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: CreateRecipeData) => void;
  editingRecipe?: Recipe | null;
}

export default function RecipeModal({
  isOpen,
  onClose,
  onSave,
  editingRecipe,
}: Props) {
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [servings, setServings] = useState(1);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  // Ingredient search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; type: 'regular' | 'restaurant' }[]
  >([]);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);

  // Reset form when modal opens/closes or editing recipe changes
  useEffect(() => {
    if (isOpen) {
      if (editingRecipe) {
        setRecipeName(editingRecipe.name);
        setRecipeDescription(editingRecipe.description || '');
        setServings(editingRecipe.servings);
        setIngredients(editingRecipe.recipe_ingredients || []);
      } else {
        setRecipeName('');
        setRecipeDescription('');
        setServings(1);
        setIngredients([]);
      }
      setSearchQuery('');
      setSearchResults([]);
      setSelectedSearchIndex(-1);
    }
  }, [isOpen, editingRecipe]);

  // Search for foods
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: {
      id: string;
      name: string;
      type: 'regular' | 'restaurant';
    }[] = [];

    // Search regular foods
    Object.entries(FOOD_DB).forEach(([id, food]) => {
      const foodName = (food as any).name;
      if (foodName && foodName.toLowerCase().includes(query)) {
        results.push({ id, name: foodName, type: 'regular' });
      }
    });

    // Search restaurant foods
    Object.values(RESTAURANT_FOODS).forEach((food: any) => {
      if (food.name && food.name.toLowerCase().includes(query)) {
        results.push({ id: food.id, name: food.name, type: 'restaurant' });
      }
    });

    setSearchResults(results.slice(0, 10));
    setSelectedSearchIndex(-1);
  }, [searchQuery]);

  // Calculate nutrition for preview
  const recipeWithNutrition = useMemo(() => {
    const recipe: Recipe = {
      name: recipeName,
      description: recipeDescription,
      servings,
      recipe_ingredients: ingredients,
    };
    return calculateRecipeNutrition(recipe);
  }, [recipeName, recipeDescription, servings, ingredients]);

  const addIngredient = (
    foodId: string,
    foodType: 'regular' | 'restaurant'
  ) => {
    const newIngredient: RecipeIngredient = {
      food_id: foodId,
      quantity: 1,
      food_type: foodType,
    };
    setIngredients([...ingredients, newIngredient]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const updated = [...ingredients];
    updated[index].quantity = Math.max(0, quantity);
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipeName.trim() || ingredients.length === 0) {
      alert('Please provide a recipe name and at least one ingredient.');
      return;
    }

    const recipeData: CreateRecipeData = {
      name: recipeName.trim(),
      description: recipeDescription.trim(),
      servings,
      ingredients,
    };

    onSave(recipeData);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSearchIndex((prev) =>
        Math.min(prev + 1, searchResults.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedSearchIndex >= 0) {
      e.preventDefault();
      const selected = searchResults[selectedSearchIndex];
      addIngredient(selected.id, selected.type);
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedSearchIndex(-1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipe Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Recipe Name *
              </label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                placeholder="Enter recipe name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Servings
              </label>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Description
            </label>
            <textarea
              value={recipeDescription}
              onChange={(e) => setRecipeDescription(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 h-24 resize-none bg-background text-foreground"
              placeholder="Optional recipe description"
            />
          </div>

          {/* Ingredients Section */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Ingredients *
            </label>

            {/* Add Ingredient Search */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                placeholder="Search for ingredients to add..."
              />

              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border border-t-0 rounded-b-lg shadow-lg max-h-60 overflow-y-auto z-10">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => addIngredient(result.id, result.type)}
                      className={`w-full text-left px-3 py-2 hover:bg-muted text-foreground flex justify-between items-center ${
                        index === selectedSearchIndex ? 'bg-muted' : ''
                      }`}
                    >
                      <span>{result.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {result.type === 'restaurant'
                          ? 'Restaurant'
                          : 'Regular'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current Ingredients */}
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {getFoodDisplayName(
                        ingredient.food_id,
                        ingredient.food_type
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getFoodServing(ingredient.food_id, ingredient.food_type)}
                      {ingredient.food_type === 'restaurant' && (
                        <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                          • Restaurant
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={ingredient.quantity}
                      onChange={(e) =>
                        updateIngredientQuantity(
                          index,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-20 border border-border rounded px-2 py-1 text-center bg-background text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {ingredients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No ingredients added yet. Search above to add ingredients.
                </div>
              )}
            </div>
          </div>

          {/* Nutrition Preview */}
          {ingredients.length > 0 && (
            <div className="bg-muted rounded-lg p-4 border border-border">
              <h3 className="font-medium mb-3 text-foreground">
                Nutrition Preview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-foreground">
                <div>
                  <div className="font-medium">Total Recipe</div>
                  <div>
                    {Math.round(recipeWithNutrition.nutrition.calories)} cal
                  </div>
                  <div>
                    {Math.round(recipeWithNutrition.nutrition.protein)}g protein
                  </div>
                  <div>
                    {Math.round(recipeWithNutrition.nutrition.carbs)}g carbs
                  </div>
                  <div>
                    {Math.round(recipeWithNutrition.nutrition.fat)}g fat
                  </div>
                </div>
                <div>
                  <div className="font-medium">Per Serving</div>
                  <div>
                    {Math.round(
                      recipeWithNutrition.nutritionPerServing.calories
                    )}{' '}
                    cal
                  </div>
                  <div>
                    {Math.round(
                      recipeWithNutrition.nutritionPerServing.protein
                    )}
                    g protein
                  </div>
                  <div>
                    {Math.round(recipeWithNutrition.nutritionPerServing.carbs)}g
                    carbs
                  </div>
                  <div>
                    {Math.round(recipeWithNutrition.nutritionPerServing.fat)}g
                    fat
                  </div>
                </div>
                <div>
                  <div className="font-medium">Fiber & Sodium</div>
                  <div>
                    {Math.round(recipeWithNutrition.nutritionPerServing.fiber)}g
                    fiber
                  </div>
                  <div>
                    {Math.round(recipeWithNutrition.nutritionPerServing.sodium)}
                    mg sodium
                  </div>
                </div>
                <div>
                  <div className="font-medium">Servings</div>
                  <div>
                    {servings} serving{servings !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!recipeName.trim() || ingredients.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingRecipe ? 'Update Recipe' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
