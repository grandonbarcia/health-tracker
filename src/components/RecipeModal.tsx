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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipe Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Recipe Name *
              </label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter recipe name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Servings</label>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={recipeDescription}
              onChange={(e) => setRecipeDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
              placeholder="Optional recipe description"
            />
          </div>

          {/* Ingredients Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Ingredients *
            </label>

            {/* Add Ingredient Search */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Search for ingredients to add..."
              />

              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b-lg shadow-lg max-h-60 overflow-y-auto z-10">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => addIngredient(result.id, result.type)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 flex justify-between items-center ${
                        index === selectedSearchIndex ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span>{result.name}</span>
                      <span className="text-xs text-gray-500">
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
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {getFoodDisplayName(
                        ingredient.food_id,
                        ingredient.food_type
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getFoodServing(ingredient.food_id, ingredient.food_type)}
                      {ingredient.food_type === 'restaurant' && (
                        <span className="ml-2 text-orange-600 font-medium">
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
                      className="w-20 border rounded px-2 py-1 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {ingredients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No ingredients added yet. Search above to add ingredients.
                </div>
              )}
            </div>
          </div>

          {/* Nutrition Preview */}
          {ingredients.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium mb-3">Nutrition Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
