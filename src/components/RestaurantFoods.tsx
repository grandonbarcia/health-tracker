'use client';
import { useState, useMemo } from 'react';
import {
  RESTAURANT_FOODS,
  RESTAURANTS,
  RESTAURANT_CATEGORIES,
  getRestaurantFoods,
  getFoodsByCategory,
} from '../lib/restaurantFoods';
import FavoriteButton from './FavoriteButton';

interface Props {
  onSelectFood: (foodId: string) => void;
  currentUser?: any;
  className?: string;
}

export default function RestaurantFoods({
  onSelectFood,
  currentUser,
  className = '',
}: Props) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFoods = useMemo(() => {
    let foods = Object.values(RESTAURANT_FOODS);

    if (selectedRestaurant !== 'all') {
      foods = foods.filter((food) => food.restaurant === selectedRestaurant);
    }

    if (selectedCategory !== 'all') {
      foods = foods.filter((food) => food.category === selectedCategory);
    }

    return foods;
  }, [selectedRestaurant, selectedCategory]);

  const availableCategories = useMemo(() => {
    if (selectedRestaurant === 'all') {
      // Get all unique categories across all restaurants
      const allCategories = new Set<string>();
      Object.values(RESTAURANT_CATEGORIES).forEach((categories) => {
        categories.forEach((cat) => allCategories.add(cat));
      });
      return Array.from(allCategories).sort();
    } else {
      return (RESTAURANT_CATEGORIES as any)[selectedRestaurant] || [];
    }
  }, [selectedRestaurant]);

  const totalItems = Object.keys(RESTAURANT_FOODS).length;

  return (
    <div
      className={`bg-orange-50 dark:bg-orange-950 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-orange-600 dark:text-orange-400">🍔</span>
        <h3 className="font-semibold text-orange-900 dark:text-orange-100 text-sm">
          Restaurant Foods
        </h3>
        <span className="text-xs text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
          {totalItems} items from top chains
        </span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-orange-800 dark:text-orange-300 mb-1">
            Restaurant
          </label>
          <select
            value={selectedRestaurant}
            onChange={(e) => {
              setSelectedRestaurant(e.target.value);
              setSelectedCategory('all'); // Reset category when restaurant changes
            }}
            className="w-full text-sm border border-orange-200 dark:border-orange-800 rounded px-2 py-1 bg-card"
          >
            <option value="all">All Restaurants ({RESTAURANTS.length})</option>
            {RESTAURANTS.map((restaurant) => (
              <option key={restaurant} value={restaurant}>
                {restaurant} ({getRestaurantFoods(restaurant).length})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-orange-800 dark:text-orange-300 mb-1">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-sm border border-orange-200 dark:border-orange-800 rounded px-2 py-1 bg-card"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((category: string) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Food Items Grid */}
      <div className="max-h-64 overflow-y-auto">
        {filteredFoods.length === 0 ? (
          <div className="text-center py-8 text-orange-700 dark:text-orange-300">
            <p className="text-sm">No items found for the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredFoods.map((food) => (
              <RestaurantFoodCard
                key={food.id}
                food={food}
                currentUser={currentUser}
                onSelect={() => onSelectFood(food.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
        <p className="text-xs text-orange-700 dark:text-orange-300">
          Showing {filteredFoods.length} of {totalItems} restaurant items
          {selectedRestaurant !== 'all' && ` from ${selectedRestaurant}`}
          {selectedCategory !== 'all' && ` in ${selectedCategory}`}
        </p>
      </div>
    </div>
  );
}

function RestaurantFoodCard({
  food,
  currentUser,
  onSelect,
}: {
  food: any;
  currentUser?: any;
  onSelect: () => void;
}) {
  return (
    <div className="relative p-3 bg-card rounded border border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-muted/50 transition-all">
      {/* Favorite Button */}
      {currentUser && (
        <div className="absolute top-2 right-2">
          <FavoriteButton
            foodId={food.id}
            foodType="restaurant"
            currentUser={currentUser}
            size="sm"
          />
        </div>
      )}

      {/* Main Content */}
      <button onClick={onSelect} className="text-left w-full">
        {/* Header */}
        <div
          className={`flex items-start justify-between mb-2 ${
            currentUser ? 'pr-8' : ''
          }`}
        >
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {food.name}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              {food.restaurant} • {food.category}
            </div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 text-right">
            <div className="font-medium">{food.calories} cal</div>
            <div>{food.serving}</div>
          </div>
        </div>

        {/* Nutrition Summary */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded">
            {food.protein}g protein
          </span>
          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-2 py-1 rounded">
            {food.carbs}g carbs
          </span>
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 px-2 py-1 rounded">
            {food.fat}g fat
          </span>
          {food.fiber > 0 && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 px-2 py-1 rounded">
              {food.fiber}g fiber
            </span>
          )}
        </div>

        {/* Description */}
        {food.description && (
          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {food.description}
          </div>
        )}
      </button>
    </div>
  );
}
