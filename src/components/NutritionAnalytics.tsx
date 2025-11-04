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
}

export default function NutritionAnalytics({
  currentUser,
  userGoals,
  className = '',
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
  }, [currentUser?.id, selectedPeriod]);

  const loadTrendsData = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

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
      }
    } catch (error) {
      console.error('Error loading trends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600';
    if (streak >= 14) return 'text-blue-600';
    if (streak >= 7) return 'text-green-600';
    if (streak >= 3) return 'text-yellow-600';
    return 'text-gray-600';
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
      <div className={`bg-blue-50 rounded-lg p-4 ${className}`}>
        <div className="text-center text-blue-700">
          <p className="text-sm">
            Sign in to view nutrition trends and analytics
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-blue-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-blue-600">📊</span>
          <h3 className="font-semibold text-blue-900 text-sm">
            Nutrition Analytics
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-blue-700">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-blue-600">📊</span>
        <h3 className="font-semibold text-blue-900 text-sm">
          Nutrition Analytics
        </h3>
        {summary && (
          <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
            {summary.activeDays}/{summary.totalDays} days logged
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-blue-900 mb-1">
            Time Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="w-full text-sm border rounded px-2 py-1 bg-white"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-900 mb-1">
            Nutrient
          </label>
          <select
            value={selectedNutrient}
            onChange={(e) => setSelectedNutrient(e.target.value as any)}
            className="w-full text-sm border rounded px-2 py-1 bg-white"
          >
            {nutrientOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-900 mb-1">
            Chart Type
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="w-full text-sm border rounded px-2 py-1 bg-white"
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
          <p className="text-sm text-blue-700 mb-2">
            No nutrition data available
          </p>
          <p className="text-xs text-blue-600">
            Start logging your meals to see analytics and trends
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded p-3 text-center">
                <div className="text-lg font-bold text-blue-600">
                  {getCompletionRate()}%
                </div>
                <div className="text-xs text-gray-600">Completion Rate</div>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <div
                  className={`text-lg font-bold ${getStreakColor(
                    summary.currentStreak
                  )}`}
                >
                  {summary.currentStreak}
                </div>
                <div className="text-xs text-gray-600">Current Streak</div>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <div className="text-lg font-bold text-green-600">
                  {summary.longestStreak}
                </div>
                <div className="text-xs text-gray-600">Best Streak</div>
              </div>
              <div className="bg-white rounded p-3 text-center">
                <div className="text-lg font-bold text-purple-600">
                  {summary.averages.calories}
                </div>
                <div className="text-xs text-gray-600">Avg Calories</div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <TrendsChart
              data={data}
              chartType={chartType}
              nutrient={selectedNutrient}
              userGoals={userGoals}
            />
          </div>

          {/* Detailed Stats */}
          {summary && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
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
                      <span className="capitalize text-gray-600">
                        {nutrient}:
                      </span>
                      <div className="text-right">
                        <span className="font-medium">
                          {average} {unit}
                        </span>
                        {progress && (
                          <div
                            className={`text-xs ${
                              progress >= 90 && progress <= 110
                                ? 'text-green-600'
                                : progress > 110
                                ? 'text-red-600'
                                : 'text-yellow-600'
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
