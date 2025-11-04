'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from '../lib/supabaseClient';

interface Favorite {
  id: string;
  user_id: string;
  food_id: string;
  food_type: string;
  created_at: string;
}

interface FavoritesContextType {
  favorites: Favorite[];
  loading: boolean;
  isFavorite: (foodId: string) => boolean;
  addFavorite: (foodId: string, foodType: string) => Promise<boolean>;
  removeFavorite: (foodId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: any;
}) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!currentUser) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
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
      } else {
        console.error('Failed to fetch favorites');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback(
    (foodId: string) => {
      return favorites.some((fav) => fav.food_id === foodId);
    },
    [favorites]
  );

  const addFavorite = useCallback(
    async (foodId: string, foodType: string) => {
      if (!currentUser) return false;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return false;

        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            food_id: foodId,
            food_type: foodType,
          }),
        });

        if (response.ok) {
          // Optimistically update the local state
          const newFavorite: Favorite = {
            id: Date.now().toString(), // Temporary ID
            user_id: currentUser.id,
            food_id: foodId,
            food_type: foodType,
            created_at: new Date().toISOString(),
          };
          setFavorites((prev) => [newFavorite, ...prev]);
          return true;
        } else {
          const data = await response.json();
          console.error('Failed to add favorite:', data.error);
          return false;
        }
      } catch (error) {
        console.error('Error adding favorite:', error);
        return false;
      }
    },
    [currentUser]
  );

  const removeFavorite = useCallback(
    async (foodId: string) => {
      if (!currentUser) return false;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return false;

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
          // Optimistically update the local state
          setFavorites((prev) => prev.filter((fav) => fav.food_id !== foodId));
          return true;
        } else {
          const data = await response.json();
          console.error('Failed to remove favorite:', data.error);
          return false;
        }
      } catch (error) {
        console.error('Error removing favorite:', error);
        return false;
      }
    },
    [currentUser]
  );

  const refreshFavorites = useCallback(async () => {
    await fetchFavorites();
  }, [fetchFavorites]);

  const value: FavoritesContextType = {
    favorites,
    loading,
    isFavorite,
    addFavorite,
    removeFavorite,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
