'use client';

import {
  Apple,
  ArrowLeft,
  Calendar,
  TrendingUp,
  X,
  Plus,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

interface Food {
  id: string;
  name: string;
  serving: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface MealItem {
  food: Food;
  quantity: number;
}

interface SavedMeals {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks: MealItem[];
}

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function DietPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [savedMeals, setSavedMeals] = useState<SavedMeals>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [weeklyData, setWeeklyData] = useState<{
    labels: string[];
    calories: number[];
    protein: number[];
    carbs: number[];
    fat: number[];
  }>({
    labels: [],
    calories: [],
    protein: [],
    carbs: [],
    fat: [],
  });

  // Load saved meals on mount
  useEffect(() => {
    loadTodaysMeals();
    loadWeeklyData();
  }, []);

  // Search foods from Supabase
  useEffect(() => {
    const searchFoods = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('foods')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,aliases.cs.{${searchQuery}}`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching foods:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchFoods, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const loadTodaysMeals = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in');
        setIsLoading(false);
        return;
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Get or create today's day record
      const { data: dayData, error: dayError } = await supabase
        .from('user_days')
        .select('*')
        .eq('user_id', user.id)
        .eq('day_date', today)
        .single();

      if (dayError && dayError.code !== 'PGRST116') {
        throw dayError;
      }

      if (!dayData) {
        console.log('No meals for today yet');
        setIsLoading(false);
        return;
      }

      // Get all items for today
      const { data: items, error: itemsError } = await supabase
        .from('user_day_items')
        .select('*')
        .eq('day_id', dayData.id);

      if (itemsError) throw itemsError;

      if (!items || items.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get food details for all items
      const foodIds = items.map((item: any) => item.food_id);
      const { data: foods, error: foodsError } = await supabase
        .from('foods')
        .select('*')
        .in('id', foodIds);

      if (foodsError) throw foodsError;

      // Organize items by meal
      const meals: SavedMeals = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
      };

      items.forEach((item: any) => {
        const food = foods?.find((f) => f.id === item.food_id);
        if (food) {
          const mealType = item.metadata?.meal || 'dinner';
          const mealKey = mealType.toLowerCase() as keyof SavedMeals;
          if (meals[mealKey]) {
            meals[mealKey].push({
              food,
              quantity: parseFloat(item.qty) || 1,
            });
          }
        }
      });

      setSavedMeals(meals);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeeklyData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 7 days
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
      }

      // Get data for all 7 days
      const { data: userDays, error: daysError } = await supabase
        .from('user_days')
        .select('*')
        .eq('user_id', user.id)
        .in('day_date', days);

      if (daysError) throw daysError;

      // Get items for all days
      const dayIds = userDays?.map((d: any) => d.id) || [];
      if (dayIds.length === 0) {
        // No data, set empty arrays
        setWeeklyData({
          labels: days.map((d) => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          }),
          calories: new Array(7).fill(0),
          protein: new Array(7).fill(0),
          carbs: new Array(7).fill(0),
          fat: new Array(7).fill(0),
        });
        return;
      }

      const { data: items, error: itemsError } = await supabase
        .from('user_day_items')
        .select('*')
        .in('day_id', dayIds);

      if (itemsError) throw itemsError;

      // Get food details
      const foodIds = [...new Set(items?.map((i: any) => i.food_id) || [])];
      const { data: foods, error: foodsError } = await supabase
        .from('foods')
        .select('*')
        .in('id', foodIds);

      if (foodsError) throw foodsError;

      // Calculate daily totals
      const dailyTotals = days.map((day) => {
        const dayRecord = userDays?.find((d: any) => d.day_date === day);
        if (!dayRecord) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

        const dayItems =
          items?.filter((i: any) => i.day_id === dayRecord.id) || [];

        const totals = dayItems.reduce(
          (acc, item: any) => {
            const food = foods?.find((f: any) => f.id === item.food_id);
            if (food) {
              const qty = parseFloat(item.qty) || 1;
              acc.calories += food.calories * qty;
              acc.protein += food.protein * qty;
              acc.carbs += food.carbs * qty;
              acc.fat += food.fat * qty;
            }
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        return totals;
      });

      setWeeklyData({
        labels: days.map((d) => {
          const date = new Date(d);
          return date.toLocaleDateString('en-US', { weekday: 'short' });
        }),
        calories: dailyTotals.map((t) => Math.round(t.calories)),
        protein: dailyTotals.map((t) => Math.round(t.protein)),
        carbs: dailyTotals.map((t) => Math.round(t.carbs)),
        fat: dailyTotals.map((t) => Math.round(t.fat)),
      });
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  };

  const handleMealClick = (meal: string) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
    // Load existing items for this meal
    const mealKey = meal.toLowerCase() as keyof SavedMeals;
    setMealItems(savedMeals[mealKey] || []);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
    setQuantity(1);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMeal('');
    setMealItems([]);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
    setQuantity(1);
  };

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddToMeal = () => {
    if (!selectedFood) return;

    setMealItems([...mealItems, { food: selectedFood, quantity }]);
    setSelectedFood(null);
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setMealItems(mealItems.filter((_, i) => i !== index));
  };

  const handleSaveMeal = async () => {
    if (mealItems.length === 0) return;

    setIsSaving(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in to save meals');
        setIsSaving(false);
        return;
      }

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Get or create today's day record
      let { data: dayData, error: dayError } = await supabase
        .from('user_days')
        .select('*')
        .eq('user_id', user.id)
        .eq('day_date', today)
        .single();

      if (dayError && dayError.code === 'PGRST116') {
        // Day doesn't exist, create it
        const { data: newDay, error: createError } = await supabase
          .from('user_days')
          .insert({
            user_id: user.id,
            day_date: today,
          })
          .select()
          .single();

        if (createError) throw createError;
        dayData = newDay;
      } else if (dayError) {
        throw dayError;
      }

      if (!dayData) throw new Error('Failed to get or create day');

      // Delete existing items for this meal
      const mealType = selectedMeal.toLowerCase();
      await supabase
        .from('user_day_items')
        .delete()
        .eq('day_id', dayData.id)
        .eq('metadata->>meal', mealType);

      // Insert new meal items
      const itemsToInsert = mealItems.map((item) => ({
        day_id: dayData.id,
        food_id: item.food.id,
        qty: item.quantity,
        metadata: { meal: mealType },
      }));

      const { error: insertError } = await supabase
        .from('user_day_items')
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      // Update saved meals state
      const mealKey = mealType as keyof SavedMeals;
      setSavedMeals((prev) => ({
        ...prev,
        [mealKey]: mealItems,
      }));

      handleCloseModal();
    } catch (error) {
      console.error('Error saving meal:', error);
      alert('Failed to save meal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-muted/50 rounded-lg transition-all duration-300 hover:scale-110 hover:-translate-x-1"
          >
            <ArrowLeft className="w-7 h-7" strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              Diet & Nutrition
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your meals and nutritional intake
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Meals */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Apple className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-semibold">Today's Meals</h2>
            </div>
            <div className="space-y-4">
              {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal) => {
                const mealKey = meal.toLowerCase() as keyof SavedMeals;
                const mealData = savedMeals[mealKey];
                const hasFoods = mealData && mealData.length > 0;
                const totalCalories = hasFoods
                  ? mealData.reduce(
                      (sum, item) => sum + item.food.calories * item.quantity,
                      0
                    )
                  : 0;

                return (
                  <div
                    key={meal}
                    onClick={() => handleMealClick(meal)}
                    className="p-4 bg-muted/20 rounded-lg border border-border/50 transition-all duration-300 hover:bg-muted/30 hover:border-border hover:shadow-md cursor-pointer relative group"
                  >
                    <h3 className="font-semibold mb-2">{meal}</h3>
                    {isLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Loading...
                      </p>
                    ) : hasFoods ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                          <span>{Math.round(totalCalories)} calories</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {mealData.length} item
                            {mealData.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {mealData.slice(0, 2).map((item, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-muted-foreground"
                            >
                              {item.food.name}
                              {item.quantity !== 1 && ` × ${item.quantity}`}
                            </div>
                          ))}
                          {mealData.length > 2 && (
                            <div className="text-xs text-muted-foreground italic">
                              +{mealData.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No meals logged yet. Click to add foods.
                      </p>
                    )}
                    {/* Hover Action Button */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 shadow-lg">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Nutrition Summary</h2>
            </div>
            {(() => {
              // Calculate totals from all meals
              const allMeals = [
                ...savedMeals.breakfast,
                ...savedMeals.lunch,
                ...savedMeals.dinner,
                ...savedMeals.snacks,
              ];

              const totals = {
                calories: allMeals.reduce(
                  (sum, item) => sum + item.food.calories * item.quantity,
                  0
                ),
                protein: allMeals.reduce(
                  (sum, item) => sum + item.food.protein * item.quantity,
                  0
                ),
                carbs: allMeals.reduce(
                  (sum, item) => sum + item.food.carbs * item.quantity,
                  0
                ),
                fat: allMeals.reduce(
                  (sum, item) => sum + item.food.fat * item.quantity,
                  0
                ),
              };

              // Default targets (can be made configurable later)
              const targets = {
                calories: 2000,
                protein: 150,
                carbs: 250,
                fat: 65,
              };

              const chartData = {
                labels: ['Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'],
                datasets: [
                  {
                    label: 'Current',
                    data: [
                      Math.round(totals.calories),
                      Math.round(totals.protein),
                      Math.round(totals.carbs),
                      Math.round(totals.fat),
                    ],
                    backgroundColor: [
                      'rgba(34, 197, 94, 0.8)', // green - calories
                      'rgba(59, 130, 246, 0.8)', // blue - protein
                      'rgba(168, 85, 247, 0.8)', // purple - carbs
                      'rgba(251, 191, 36, 0.8)', // amber - fat
                    ],
                    borderColor: [
                      'rgb(34, 197, 94)',
                      'rgb(59, 130, 246)',
                      'rgb(168, 85, 247)',
                      'rgb(251, 191, 36)',
                    ],
                    borderWidth: 2,
                  },
                  {
                    label: 'Target',
                    data: [
                      targets.calories,
                      targets.protein,
                      targets.carbs,
                      targets.fat,
                    ],
                    backgroundColor: 'rgba(156, 163, 175, 0.3)',
                    borderColor: 'rgb(156, 163, 175)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                  },
                ],
              };

              const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                    labels: {
                      color: 'rgb(156, 163, 175)',
                      font: {
                        size: 12,
                      },
                    },
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'rgb(255, 255, 255)',
                    bodyColor: 'rgb(255, 255, 255)',
                    borderColor: 'rgb(156, 163, 175)',
                    borderWidth: 1,
                    callbacks: {
                      label: function (context: any) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${value}`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      color: 'rgb(156, 163, 175)',
                      font: {
                        size: 11,
                      },
                    },
                    grid: {
                      display: false,
                    },
                  },
                  y: {
                    ticks: {
                      color: 'rgb(156, 163, 175)',
                      font: {
                        size: 11,
                      },
                    },
                    grid: {
                      color: 'rgba(156, 163, 175, 0.1)',
                    },
                  },
                },
              };

              return (
                <div className="h-64">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              );
            })()}
          </div>

          {/* Weekly Overview */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Weekly Overview</h2>
              <span className="text-xs text-muted-foreground ml-auto">
                Last 7 days
              </span>
            </div>
            <div className="h-64">
              <Line
                data={{
                  labels: weeklyData.labels,
                  datasets: [
                    {
                      label: 'Calories',
                      data: weeklyData.calories,
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      tension: 0.4,
                      fill: true,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    },
                    {
                      label: 'Protein (g)',
                      data: weeklyData.protein,
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    },
                    {
                      label: 'Carbs (g)',
                      data: weeklyData.carbs,
                      borderColor: 'rgb(168, 85, 247)',
                      backgroundColor: 'rgba(168, 85, 247, 0.1)',
                      tension: 0.4,
                      fill: true,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    },
                    {
                      label: 'Fat (g)',
                      data: weeklyData.fat,
                      borderColor: 'rgb(251, 191, 36)',
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      tension: 0.4,
                      fill: true,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        color: 'rgb(156, 163, 175)',
                        font: {
                          size: 12,
                        },
                        usePointStyle: true,
                        padding: 15,
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: 'rgb(255, 255, 255)',
                      bodyColor: 'rgb(255, 255, 255)',
                      borderColor: 'rgb(156, 163, 175)',
                      borderWidth: 1,
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: 'rgb(156, 163, 175)',
                        font: {
                          size: 11,
                        },
                      },
                      grid: {
                        display: false,
                      },
                    },
                    y: {
                      ticks: {
                        color: 'rgb(156, 163, 175)',
                        font: {
                          size: 11,
                        },
                      },
                      grid: {
                        color: 'rgba(156, 163, 175, 0.1)',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border/50 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                    Add {selectedMeal}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Search for foods and build your meal
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for food..."
                    className="w-full pl-10 pr-4 py-3 bg-muted/20 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-border/50 rounded-lg p-2">
                    {searchResults.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => handleSelectFood(food)}
                        className="w-full text-left p-3 bg-muted/20 hover:bg-muted/40 rounded-lg transition-all"
                      >
                        <div className="font-medium">{food.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {food.serving} • {food.calories} cal • P:{' '}
                          {food.protein}g C: {food.carbs}g F: {food.fat}g
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Food to Add */}
                {selectedFood && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-3">
                    <div>
                      <div className="font-semibold text-lg">
                        {selectedFood.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedFood.serving}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium">Quantity:</label>
                      <input
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(parseFloat(e.target.value) || 1)
                        }
                        className="w-24 px-3 py-1 bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      />
                      <button
                        onClick={handleAddToMeal}
                        className="ml-auto px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium text-sm shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add to {selectedMeal}
                      </button>
                    </div>
                  </div>
                )}

                {/* Meal Items List */}
                {mealItems.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      Items in {selectedMeal}:
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {mealItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {item.food.name} × {item.quantity}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round(item.food.calories * item.quantity)}{' '}
                              cal • P:{' '}
                              {Math.round(item.food.protein * item.quantity)}g
                              C: {Math.round(item.food.carbs * item.quantity)}g
                              F: {Math.round(item.food.fat * item.quantity)}g
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                      <div className="font-semibold">Total:</div>
                      <div className="text-sm">
                        {mealItems
                          .reduce(
                            (sum, item) =>
                              sum + item.food.calories * item.quantity,
                            0
                          )
                          .toFixed(0)}{' '}
                        cal • P:{' '}
                        {mealItems
                          .reduce(
                            (sum, item) =>
                              sum + item.food.protein * item.quantity,
                            0
                          )
                          .toFixed(1)}
                        g C:{' '}
                        {mealItems
                          .reduce(
                            (sum, item) =>
                              sum + item.food.carbs * item.quantity,
                            0
                          )
                          .toFixed(1)}
                        g F:{' '}
                        {mealItems
                          .reduce(
                            (sum, item) => sum + item.food.fat * item.quantity,
                            0
                          )
                          .toFixed(1)}
                        g
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-border/50 rounded-lg hover:bg-muted/50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMeal}
                    disabled={mealItems.length === 0 || isSaving}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSaving ? 'Saving...' : `Save ${selectedMeal}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
