'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Props {
  foodId: string;
  foodType?: 'regular' | 'restaurant';
  currentUser: any;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FavoriteButton({
  foodId,
  foodType = 'regular',
  currentUser,
  size = 'md',
  className = '',
}: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if food is favorited when component mounts
  useEffect(() => {
    if (!currentUser || !foodId) return;
    checkFavoriteStatus();
  }, [currentUser, foodId]);

  const checkFavoriteStatus = async () => {
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
        const isInFavorites = data.favorites?.some(
          (fav: any) => fav.food_id === foodId
        );
        setIsFavorite(isInFavorites || false);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click events

    if (!currentUser || loading) return;

    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        return;
      }

      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(
          `/api/favorites?food_id=${encodeURIComponent(foodId)}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setIsFavorite(false);
          console.log('Removed from favorites:', data.message);
        } else {
          console.error('Failed to remove favorite:', data.error);
          // Show error feedback
          alert(data.error || 'Failed to remove from favorites');
        }
      } else {
        // Add to favorites
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

        const data = await response.json();

        if (response.ok) {
          setIsFavorite(true);
          console.log('Added to favorites:', data.message);
        } else {
          console.error('Failed to add favorite:', data.error);
          // Show error feedback
          alert(data.error || 'Failed to add to favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null; // Don't show favorite button for unauthenticated users
  }

  const sizeClasses = {
    sm: 'text-sm p-1',
    md: 'text-base p-1.5',
    lg: 'text-lg p-2',
  };

  const iconClasses = sizeClasses[size];

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`
        ${iconClasses}
        ${
          loading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:scale-110 active:scale-95'
        }
        transition-all duration-150 rounded
        ${className}
      `}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? (
        <span className="text-gray-400">⏳</span>
      ) : isFavorite ? (
        <span className="text-red-500">❤️</span>
      ) : (
        <span className="text-gray-400 hover:text-red-500">🤍</span>
      )}
    </button>
  );
}
