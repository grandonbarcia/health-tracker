'use client';
import { useState, useEffect } from 'react';
import { useFavorites } from '../contexts/FavoritesContext';
import { FOOD_DB } from '../lib/nutrients';
import { RESTAURANT_FOODS } from '../lib/restaurantFoods';

interface FavoriteFood {
  id: string;
  food_id: string;
  food_type: string;
  created_at: string;
}

interface Props {
  currentUser: any;
  onSelectFood: (foodId: string) => void;
  className?: string;
}

export default function FavoriteFoods({
  currentUser,
  onSelectFood,
  className = '',
}: Props) {
  const { favorites, loading, removeFavorite } = useFavorites();
  const [foodDetails, setFoodDetails] = useState<Record<string, any>>({});

  // Load food details when favorites change
  useEffect(() => {
    if (favorites.length > 0) {
      loadFoodDetails(favorites);
    } else {
      setFoodDetails({});
    }
  }, [favorites]);

  const loadFoodDetails = async (favoritesData: FavoriteFood[]) => {
    const details: Record<string, any> = {};

    for (const fav of favoritesData) {
      const foodDetail = getFoodDetail(fav.food_id, fav.food_type);
      if (foodDetail) {
        details[fav.food_id] = foodDetail;
      }
    }

    setFoodDetails(details);
  };

  const getFoodDetail = (foodId: string, foodType: string) => {
    if (foodType === 'restaurant') {
      // RESTAURANT_FOODS is an object, so we need to convert to array and find
      const restaurantFoodsArray = Object.values(RESTAURANT_FOODS);
      return restaurantFoodsArray.find((food: any) => food.id === foodId);
    } else {
      // FOOD_DB is also an object
      return FOOD_DB[foodId];
    }
  };

  const handleRemoveFavorite = async (foodId: string) => {
    try {
      await removeFavorite(foodId);
      // The favorites will be automatically updated through the context
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (!currentUser) {
    return (
      <div
        className={`bg-pink-50 dark:bg-pink-950 rounded-lg p-4 ${className}`}
      >
        <div className="text-center text-pink-700 dark:text-pink-300">
          <p className="text-sm">Sign in to save favorite foods</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`bg-pink-50 dark:bg-pink-950 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-pink-600 dark:text-pink-400">❤️</span>
          <h3 className="font-semibold text-pink-900 dark:text-pink-100 text-sm">
            Favorite Foods
          </h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="text-sm text-pink-700 dark:text-pink-300">
            Loading favorites...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-pink-50 dark:bg-pink-950 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-pink-600 dark:text-pink-400">❤️</span>
        <h3 className="font-semibold text-pink-900 dark:text-pink-100 text-sm">
          Favorite Foods
        </h3>
        <span className="text-xs text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-900 px-2 py-1 rounded">
          {favorites.length} favorites
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-pink-700 dark:text-pink-300 mb-2">
            No favorite foods yet
          </p>
          <p className="text-xs text-pink-600 dark:text-pink-400">
            Click the ❤️ icon on any food to add it to favorites
          </p>
        </div>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          <div className="grid grid-cols-1 gap-2">
            {favorites.map((favorite) => {
              const food = foodDetails[favorite.food_id];
              return (
                <FavoriteFoodCard
                  key={favorite.id}
                  favorite={favorite}
                  food={food}
                  onSelect={() => onSelectFood(favorite.food_id)}
                  onRemove={() => handleRemoveFavorite(favorite.food_id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FavoriteFoodCard({
  favorite,
  food,
  onSelect,
  onRemove,
}: {
  favorite: FavoriteFood;
  food: any;
  onSelect: () => void;
  onRemove: () => void;
}) {
  if (!food) {
    return (
      <div className="p-2 bg-card rounded border border-pink-200 dark:border-pink-800">
        <div className="text-xs text-muted-foreground">
          Loading {favorite.food_id}...
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-card rounded border border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 transition-all">
      <button onClick={onSelect} className="flex-1 text-left">
        <div className="font-medium text-foreground text-sm">
          {food.name || favorite.food_id}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{food.calories || 0} cal</span>
          {food.serving && <span>• {food.serving}</span>}
          {favorite.food_type === 'restaurant' && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              • Restaurant
            </span>
          )}
        </div>
      </button>

      <button
        onClick={onRemove}
        className="text-pink-500 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 p-1"
        title="Remove from favorites"
      >
        <span className="text-sm">💔</span>
      </button>
    </div>
  );
}
