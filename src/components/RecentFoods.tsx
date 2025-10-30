'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface RecentFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  last_used_at: string;
  use_count: number;
}

interface Props {
  onSelectFood: (foodId: string) => void;
  currentUser: any;
}

export default function RecentFoods({ onSelectFood, currentUser }: Props) {
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadRecentFoods();
    } else {
      setRecentFoods([]);
    }
  }, [currentUser]);

  async function loadRecentFoods() {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/recent-foods', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const foods = await response.json();
        setRecentFoods(foods);
      }
    } catch (error) {
      console.error('Error loading recent foods:', error);
    } finally {
      setLoading(false);
    }
  }

  async function trackFoodUsage(foodId: string) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/recent-foods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ food_id: foodId }),
      });

      // Refresh recent foods list
      loadRecentFoods();
    } catch (error) {
      console.error('Error tracking food usage:', error);
    }
  }

  function handleSelectFood(foodId: string) {
    trackFoodUsage(foodId);
    onSelectFood(foodId);
  }

  if (!currentUser) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p className="text-sm">Sign in to see your recent foods</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading recent foods...</p>
      </div>
    );
  }

  if (recentFoods.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p className="text-sm">No recent foods yet</p>
        <p className="text-xs">
          Start adding foods to see your recent items here
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-3 text-sm">Recent Foods</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentFoods.map((food) => (
          <button
            key={food.id}
            onClick={() => handleSelectFood(food.id)}
            className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{food.name}</div>
                <div className="text-xs text-gray-500">
                  {food.calories} cal • {food.protein}g protein
                </div>
              </div>
              <div className="text-right ml-2">
                <div className="text-xs text-gray-400">
                  Used {food.use_count} time{food.use_count !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(food.last_used_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
