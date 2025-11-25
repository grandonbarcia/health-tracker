'use client';
import React, { useState, useEffect } from 'react';
import TrendsChart from './TrendsChart';
import { supabase } from '../lib/supabaseClient';

interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  itemCount: number;
}

interface TrendsSummary {
  totalDays: number;
  activeDays: number;
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  currentStreak: number;
  longestStreak: number;
  period: string;
  startDate: string;
  endDate: string;
}

interface Props {
  currentUser: any;
  userGoals?: Record<string, number>;
  className?: string;
  refreshTrigger?: number;
}

export default function NutritionAnalytics({
  currentUser,
  userGoals,
  className = '',
  refreshTrigger,
}: Props) {
  const [data, setData] = useState<DailyNutrition[]>([]);
  const [summary, setSummary] = useState<TrendsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedNutrient, setSelectedNutrient] = useState<
    'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sodium' | 'all'
  >('calories');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'radar'>('line');

  const periodOptions = [
    { value: 7, label: '7 Days' },
    { value: 14, label: '2 Weeks' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '3 Months' },
  ];

  const nutrientOptions = [
    { value: 'calories', label: 'Calories' },
    { value: 'protein', label: 'Protein' },
    { value: 'carbs', label: 'Carbs' },
    { value: 'fat', label: 'Fat' },
    { value: 'fiber', label: 'Fiber' },
    { value: 'sodium', label: 'Sodium' },
    { value: 'all', label: 'All Nutrients' },
  ];

  const chartTypeOptions = [
    { value: 'line', label: '📈 Line' },
    { value: 'bar', label: '📊 Bar' },
    { value: 'radar', label: '🕸️ Radar' },
  ];

  // Load nutrition trends data
  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    loadTrendsData();
  }, [currentUser?.id, selectedPeriod, refreshTrigger]);

  const loadTrendsData = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No session found for nutrition trends');
        return;
      }

      const response = await fetch(
        `/api/nutrition-trends?days=${selectedPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const trendsData = await response.json();
        setData(trendsData.dailyNutrition || []);
        setSummary(trendsData.summary || null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load nutrition trends:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
      }
    } catch (error) {
      console.error('Error loading trends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600 dark:text-purple-400';
    if (streak >= 14) return 'text-blue-600 dark:text-blue-400';
    if (streak >= 7) return 'text-green-600 dark:text-green-400';
    if (streak >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getCompletionRate = () => {
    if (!summary) return 0;
    return Math.round((summary.activeDays / summary.totalDays) * 100);
  };

  const getGoalProgress = (nutrient: string, average: number) => {
    if (!userGoals || !userGoals[nutrient]) return null;
    const progress = (average / userGoals[nutrient]) * 100;
    return Math.round(progress);
  };

  if (!currentUser) {
    return (
      <div
        className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 ${className}`}
      >
        <div className="text-center text-blue-700 dark:text-blue-300">
          <p className="text-sm">
            Sign in to view nutrition trends and analytics
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 min-h-[600px] ${className}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-blue-600 dark:text-blue-400">📊</span>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
            Nutrition Analytics
          </h3>
        </div>
        <div
          className="flex flex-col items-center justify-center"
          style={{ minHeight: '500px' }}
        >
          <svg
            className="animate-spin h-10 w-10 text-blue-600 dark:text-blue-400 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Loading analytics...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-blue-600 dark:text-blue-400">📊</span>
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
          Nutrition Analytics
        </h3>
        {summary && (
          <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded">
            {summary.activeDays}/{summary.totalDays} days logged
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
            Time Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
            Nutrient
          </label>
          <select
            value={selectedNutrient}
            onChange={(e) => setSelectedNutrient(e.target.value as any)}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {nutrientOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
            Chart Type
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {chartTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
            No nutrition data available
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Start logging your meals to see analytics and trends
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white dark:bg-gray-800 rounded p-3 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {getCompletionRate()}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Completion Rate
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-3 text-center border border-gray-200 dark:border-gray-700">
                <div
                  className={`text-lg font-bold ${getStreakColor(
                    summary.currentStreak
                  )}`}
                >
                  {summary.currentStreak}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Current Streak
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-3 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {summary.longestStreak}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Best Streak
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-3 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {summary.averages.calories}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Avg Calories
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
            <TrendsChart
              data={data}
              chartType={chartType}
              nutrient={selectedNutrient}
              userGoals={userGoals}
            />
          </div>

          {/* Detailed Stats */}
          {summary && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Average Daily Intake
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {Object.entries(summary.averages).map(([nutrient, average]) => {
                  const progress = getGoalProgress(nutrient, average);
                  const unit =
                    nutrient === 'calories'
                      ? 'cal'
                      : nutrient === 'sodium'
                      ? 'mg'
                      : 'g';

                  return (
                    <div
                      key={nutrient}
                      className="flex justify-between items-center"
                    >
                      <span className="capitalize text-gray-600 dark:text-gray-400">
                        {nutrient}:
                      </span>
                      <div className="text-right">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {average} {unit}
                        </span>
                        {progress && (
                          <div
                            className={`text-xs ${
                              progress >= 90 && progress <= 110
                                ? 'text-green-600 dark:text-green-400'
                                : progress > 110
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-yellow-600 dark:text-yellow-400'
                            }`}
                          >
                            {progress}% of goal
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
