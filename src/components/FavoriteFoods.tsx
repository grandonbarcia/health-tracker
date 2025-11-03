'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [foodDetails, setFoodDetails] = useState<Record<string, any>>({});

  // Load user's favorites
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    loadFavorites();
  }, [currentUser]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/favorites', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);

        // Load food details for each favorite
        await loadFoodDetails(data.favorites || []);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFoodDetails = async (favoritesData: FavoriteFood[]) => {
    const details: Record<string, any> = {};

    for (const fav of favoritesData) {
      try {
        const response = await fetch(
          `/api/food/${encodeURIComponent(fav.food_id)}`
        );
        if (response.ok) {
          const foodData = await response.json();
          details[fav.food_id] = foodData;
        }
      } catch (error) {
        console.error(`Error loading food details for ${fav.food_id}:`, error);
      }
    }

    setFoodDetails(details);
  };

  const removeFavorite = async (foodId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/favorites?food_id=${encodeURIComponent(foodId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        setFavorites((prev) => prev.filter((fav) => fav.food_id !== foodId));
        setFoodDetails((prev) => {
          const updated = { ...prev };
          delete updated[foodId];
          return updated;
        });
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className={`bg-pink-50 rounded-lg p-4 ${className}`}>
        <div className="text-center text-pink-700">
          <p className="text-sm">Sign in to save favorite foods</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-pink-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-pink-600">❤️</span>
          <h3 className="font-semibold text-pink-900 text-sm">
            Favorite Foods
          </h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="text-sm text-pink-700">Loading favorites...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-pink-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-pink-600">❤️</span>
        <h3 className="font-semibold text-pink-900 text-sm">Favorite Foods</h3>
        <span className="text-xs text-pink-700 bg-pink-100 px-2 py-1 rounded">
          {favorites.length} favorites
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-pink-700 mb-2">No favorite foods yet</p>
          <p className="text-xs text-pink-600">
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
                  onRemove={() => removeFavorite(favorite.food_id)}
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
      <div className="p-2 bg-white rounded border border-pink-200">
        <div className="text-xs text-gray-500">
          Loading {favorite.food_id}...
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded border border-pink-200 hover:border-pink-300 transition-all">
      <button onClick={onSelect} className="flex-1 text-left">
        <div className="font-medium text-gray-900 text-sm">
          {food.name || favorite.food_id}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>{food.calories || 0} cal</span>
          {food.serving && <span>• {food.serving}</span>}
          {favorite.food_type === 'restaurant' && (
            <span className="text-orange-600 font-medium">• Restaurant</span>
          )}
        </div>
      </button>

      <button
        onClick={onRemove}
        className="text-pink-500 hover:text-pink-700 p-1"
        title="Remove from favorites"
      >
        <span className="text-sm">💔</span>
      </button>
    </div>
  );
}
