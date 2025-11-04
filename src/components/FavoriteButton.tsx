'use client';
import { useState, memo } from 'react';
import { useFavorites } from '../contexts/FavoritesContext';

interface Props {
  foodId: string;
  foodType?: 'regular' | 'restaurant';
  currentUser: any;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FavoriteButton = memo(function FavoriteButton({
  foodId,
  foodType = 'regular',
  currentUser,
  size = 'md',
  className = '',
}: Props) {
  const [loading, setLoading] = useState(false);
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentUser || loading) return;

    setLoading(true);
    try {
      const isCurrentlyFavorite = isFavorite(foodId);

      if (isCurrentlyFavorite) {
        await removeFavorite(foodId);
      } else {
        await addFavorite(foodId, foodType);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-sm p-1',
    md: 'text-base p-1.5',
    lg: 'text-lg p-2',
  };

  const iconClasses = sizeClasses[size];
  const isCurrentlyFavorite = isFavorite(foodId);

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
      title={isCurrentlyFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? (
        <span className="text-gray-400">⏳</span>
      ) : isCurrentlyFavorite ? (
        <span className="text-red-500">❤️</span>
      ) : (
        <span className="text-gray-400 hover:text-red-500">🤍</span>
      )}
    </button>
  );
});

export default FavoriteButton;
