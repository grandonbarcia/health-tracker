'use client';
import React, { useState, useEffect } from 'react';
import { Recipe } from '../types/recipe';
import {
  calculateRecipeNutrition,
  getFoodDisplayName,
} from '../lib/recipeUtils';
import { supabase } from '../lib/supabaseClient';

interface Props {
  currentUser: any;
  onSelectRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  className?: string;
}

export default function SavedRecipes({
  currentUser,
  onSelectRecipe,
  onEditRecipe,
  className = '',
}: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load user's recipes
  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    loadRecipes();
  }, [currentUser?.id]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/recipes', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setRecipes(recipes.filter((recipe) => recipe.id !== recipeId));
      } else {
        alert('Failed to delete recipe');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Error deleting recipe');
    }
  };

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className={`bg-purple-50 rounded-lg p-4 ${className}`}>
        <div className="text-center text-purple-700">
          <p className="text-sm">Sign in to save and manage recipes</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-purple-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-purple-600">🍳</span>
          <h3 className="font-semibold text-purple-900 text-sm">My Recipes</h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="text-sm text-purple-700">Loading recipes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-purple-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-purple-600">🍳</span>
        <h3 className="font-semibold text-purple-900 text-sm">My Recipes</h3>
        <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded">
          {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search */}
      {recipes.length > 0 && (
        <div className="mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes..."
            className="w-full text-sm border rounded px-2 py-1 bg-white"
          />
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-purple-700 mb-2">No recipes saved yet</p>
          <p className="text-xs text-purple-600">
            Create your first recipe to get started
          </p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-purple-700">
            No recipes match your search
          </p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={() => onSelectRecipe(recipe)}
                onEdit={() => onEditRecipe(recipe)}
                onDelete={() => deleteRecipe(recipe.id!)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  onSelect,
  onEdit,
  onDelete,
}: {
  recipe: Recipe;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const recipeWithNutrition = calculateRecipeNutrition(recipe);
  const ingredientCount = recipe.recipe_ingredients?.length || 0;

  return (
    <div className="bg-white rounded border border-purple-200 hover:border-purple-300 transition-all">
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <button onClick={onSelect} className="flex-1 text-left">
            <div className="font-medium text-gray-900 text-sm">
              {recipe.name}
            </div>
            {recipe.description && (
              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                {recipe.description}
              </div>
            )}
          </button>
          <div className="flex gap-1 ml-2">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
              title="Edit recipe"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
              title="Delete recipe"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <span>
              {Math.round(recipeWithNutrition.nutritionPerServing.calories)}{' '}
              cal/serving
            </span>
            <span>
              {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}
            </span>
            <span>
              {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Ingredient preview */}
        {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <div className="flex flex-wrap gap-1">
              {recipe.recipe_ingredients
                .slice(0, 3)
                .map((ingredient, index) => (
                  <span key={index} className="bg-gray-100 px-2 py-1 rounded">
                    {getFoodDisplayName(
                      ingredient.food_id,
                      ingredient.food_type
                    )}
                  </span>
                ))}
              {recipe.recipe_ingredients.length > 3 && (
                <span className="text-gray-400">
                  +{recipe.recipe_ingredients.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
