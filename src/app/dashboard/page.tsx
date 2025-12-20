'use client';

import {
  Apple,
  Activity,
  Dumbbell,
  TrendingUp,
  Droplet,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface MealItem {
  food: {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  quantity: number;
}

interface SavedMeals {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks: MealItem[];
}

function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [savedMeals, setSavedMeals] = useState<SavedMeals>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyCalories, setWeeklyCalories] = useState<number[]>([]);
  const [weeklyHeartRates, setWeeklyHeartRates] = useState<number[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    loadTodaysMeals();
    loadWeeklyCalories();
    loadWeeklyVitals();
    
    // Check if user just confirmed their email
    if (searchParams.get('confirmed') === 'true') {
      setShowConfirmation(true);
      // Remove the query parameter from URL
      router.replace('/dashboard', { scroll: false });
      // Hide confirmation after 5 seconds
      setTimeout(() => setShowConfirmation(false), 5000);
    }
  }, [searchParams, router]);

  const loadTodaysMeals = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      console.log('Loading meals for:', today);

      // Get today's user_day record
      const { data: userDay, error: dayError } = await supabase
        .from('user_days')
        .select('id')
        .eq('user_id', user.id)
        .eq('day_date', today)
        .single();

      console.log('User day:', userDay, dayError);

      if (!userDay) {
        console.log('No user day found for today');
        setSavedMeals({
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: [],
        });
        return;
      }

      // Get all items for today
      const { data: items, error: itemsError } = await supabase
        .from('user_day_items')
        .select('*')
        .eq('day_id', userDay.id);

      console.log('Items loaded:', items, itemsError);

      if (!items || items.length === 0) {
        console.log('No items found');
        setSavedMeals({
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: [],
        });
        return;
      }

      // Get all unique food IDs
      const foodIds = items.map((item: any) => item.food_id);

      // Fetch food details
      const { data: foods, error: foodsError } = await supabase
        .from('foods')
        .select('*')
        .in('id', foodIds);

      console.log('Foods loaded:', foods, foodsError);

      if (!foods) {
        console.log('No foods found');
        return;
      }

      // Organize items by meal type
      const meals: SavedMeals = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
      };

      items.forEach((item: any) => {
        const food = foods.find((f: any) => f.id === item.food_id);
        if (!food) return;

        const mealType = item.metadata?.meal || 'snacks';
        const mealKey = mealType.toLowerCase() as keyof SavedMeals;

        console.log('Processing item:', food.name, mealKey, item.qty);

        meals[mealKey].push({
          food: food,
          quantity: parseFloat(item.qty) || 1,
        });
      });

      console.log('Final meals state:', meals);
      setSavedMeals(meals);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeeklyCalories = async () => {
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
      const { data: userDays } = await supabase
        .from('user_days')
        .select('*')
        .eq('user_id', user.id)
        .in('day_date', days);

      const dayIds = userDays?.map((d: any) => d.id) || [];
      if (dayIds.length === 0) {
        setWeeklyCalories(new Array(7).fill(0));
        return;
      }

      const { data: items } = await supabase
        .from('user_day_items')
        .select('*')
        .in('day_id', dayIds);

      const foodIds = [...new Set(items?.map((i: any) => i.food_id) || [])];
      const { data: foods } = await supabase
        .from('foods')
        .select('*')
        .in('id', foodIds);

      // Calculate daily totals
      const dailyCalories = days.map((day) => {
        const dayRecord = userDays?.find((d: any) => d.day_date === day);
        if (!dayRecord) return 0;

        const dayItems =
          items?.filter((i: any) => i.day_id === dayRecord.id) || [];

        const total = dayItems.reduce((acc, item: any) => {
          const food = foods?.find((f: any) => f.id === item.food_id);
          if (food) {
            const qty = parseFloat(item.qty) || 1;
            acc += food.calories * qty;
          }
          return acc;
        }, 0);

        return Math.round(total);
      });

      setWeeklyCalories(dailyCalories);
    } catch (error) {
      console.error('Error loading weekly calories:', error);
      setWeeklyCalories(new Array(7).fill(0));
    }
  };

  const loadWeeklyVitals = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      // Query user_vitals for the last 7 days
      const { data: vitalsData, error } = await supabase
        .from('user_vitals')
        .select('reading_date, heart_rate')
        .eq('user_id', user.id)
        .in('reading_date', last7Days)
        .order('reading_date', { ascending: true });

      if (error) throw error;

      // Map to daily heart rates
      const dailyHeartRates = last7Days.map((date) => {
        const vitals = vitalsData?.find((v) => v.reading_date === date);
        return vitals?.heart_rate || 0;
      });

      setWeeklyHeartRates(dailyHeartRates);
    } catch (error) {
      console.error('Error loading weekly vitals:', error);
      setWeeklyHeartRates(new Array(7).fill(0));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Email Confirmation Message */}
        {showConfirmation && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3 shadow-md animate-in slide-in-from-top duration-300">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-800 dark:text-green-200 font-medium">
                Welcome! Your account has been successfully confirmed.
              </p>
              <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                You're all set to start tracking your health and fitness journey!
              </p>
            </div>
            <button
              onClick={() => setShowConfirmation(false)}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>

        {/* Three Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* DIET Card */}
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

            // Default targets
            const targets = {
              calories: 2000,
              protein: 150,
              carbs: 250,
              fat: 65,
            };

            const caloriePercentage = Math.min(
              (totals.calories / targets.calories) * 100,
              100
            );
            const proteinPercentage = Math.min(
              (totals.protein / targets.protein) * 100,
              100
            );
            const carbsPercentage = Math.min(
              (totals.carbs / targets.carbs) * 100,
              100
            );

            return (
              <div
                onClick={() => router.push('/dashboard/diet')}
                className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-border cursor-pointer relative group"
              >
                {/* Hover Action Button */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 shadow-lg">
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
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
                  DIET
                </h2>

                {/* Circular Progress */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-40 h-40">
                    <svg className="transform -rotate-90 w-40 h-40">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-muted/20"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="url(#dietGradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${
                          2 * Math.PI * 70 * (caloriePercentage / 100)
                        } ${2 * Math.PI * 70}`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient
                          id="dietGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                          <stop offset="100%" stopColor="rgb(168, 85, 247)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {isLoading ? (
                        <div className="text-2xl text-muted-foreground">
                          ...
                        </div>
                      ) : (
                        <>
                          <div className="text-4xl font-bold">
                            {Math.round(caloriePercentage)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            of {targets.calories} kcal
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Macros */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      Carbs:{' '}
                      <span className="font-semibold">
                        {Math.round(totals.carbs)}g
                      </span>{' '}
                      / {targets.carbs}g
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-muted/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                        style={{ width: `${carbsPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      Protein:{' '}
                      <span className="font-semibold">
                        {Math.round(totals.protein)}g
                      </span>{' '}
                      / {targets.protein}g
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-muted/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${proteinPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Meal Summary */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  <h3 className="text-sm text-muted-foreground mb-3">
                    Today's Meals
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Breakfast:</span>
                      <span className="font-semibold">
                        {savedMeals.breakfast.length} items
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lunch:</span>
                      <span className="font-semibold">
                        {savedMeals.lunch.length} items
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dinner:</span>
                      <span className="font-semibold">
                        {savedMeals.dinner.length} items
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Snacks:</span>
                      <span className="font-semibold">
                        {savedMeals.snacks.length} items
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7-Day Calorie Trend */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  <h3 className="text-sm text-muted-foreground mb-3">
                    7-Day Calorie Trend
                  </h3>
                  <div className="h-24 flex items-end justify-between gap-2">
                    {weeklyCalories.map((calories, i) => {
                      const maxCalories = Math.max(...weeklyCalories, 2000);
                      const height =
                        calories > 0 ? (calories / maxCalories) * 100 : 5;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <div
                            className="w-full bg-gradient-to-t from-green-500 to-emerald-600 rounded-t-lg transition-all hover:opacity-80"
                            style={{ height: `${height}%` }}
                            title={
                              calories > 0 ? `${calories} kcal` : 'No data'
                            }
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    {weeklyCalories.map((cal, i) => (
                      <span key={i} className={cal > 0 ? 'font-semibold' : ''}>
                        {cal > 0 ? Math.round(cal) : '-'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VITALS Card */}
          <div
            onClick={() => router.push('/dashboard/vitals')}
            className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-green-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-green-500/40 cursor-pointer relative group"
          >
            {/* Hover Action Button */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 shadow-lg">
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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              VITALS
            </h2>

            {/* Heart Rate */}
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">
                Heart Rate
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">72</span>
                <span className="text-muted-foreground">bpm</span>
              </div>
              <Activity className="w-6 h-6 text-green-500 mt-2" />
            </div>

            {/* Blood Pressure */}
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">
                Blood Pressure
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">120/80</span>
                <span className="text-muted-foreground">mmHg</span>
              </div>
              <div className="mt-2 flex justify-end">
                <button className="p-1 hover:bg-muted/20 rounded">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="6" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="18" r="2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sleep */}
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">Sleep</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">8.2</span>
                <span className="text-muted-foreground">hrs</span>
              </div>
            </div>

            {/* Heart Rate Trend */}
            <div>
              <div className="text-sm text-muted-foreground mb-3">
                Heart Rate Trend (7 Days)
              </div>
              <div className="h-24 flex items-end justify-between gap-2">
                {weeklyHeartRates.map((hr, i) => {
                  const maxHR = Math.max(...weeklyHeartRates, 100);
                  const height = hr > 0 ? (hr / maxHR) * 100 : 5;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-emerald-600 rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${height}%` }}
                        title={hr > 0 ? `${hr} bpm` : 'No data'}
                      ></div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                {weeklyHeartRates.map((hr, i) => (
                  <span key={i} className={hr > 0 ? 'font-semibold' : ''}>
                    {hr > 0 ? hr : '-'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* EXERCISE Card */}
          <div
            onClick={() => router.push('/dashboard/exercise')}
            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-border cursor-pointer relative group"
          >
            {/* Hover Action Button */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 shadow-lg">
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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              EXERCISE
            </h2>

            {/* Steps */}
            <div className="mb-6">
              <div className="text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-1">
                10,245
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                STEPS
              </div>
              <Dumbbell className="w-6 h-6 text-green-500 mt-2" />
            </div>

            {/* Active Calories */}
            <div className="mb-4">
              <div className="text-sm text-muted-foreground mb-1">
                Active Calories
              </div>
              <div className="text-3xl font-bold">450</div>
            </div>

            {/* Workout Duration */}
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">
                Workout Duration
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">60</span>
                <span className="text-muted-foreground">min</span>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="h-24 flex items-end justify-between gap-2">
              {[
                { height: 40, color: 'from-green-500 to-green-600' },
                { height: 65, color: 'from-amber-500 to-orange-500' },
                { height: 55, color: 'from-cyan-400 to-cyan-500' },
                { height: 75, color: 'from-cyan-400 to-cyan-500' },
                { height: 85, color: 'from-green-500 to-emerald-600' },
              ].map((bar, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-full bg-gradient-to-t ${bar.color} rounded-t-lg transition-all hover:opacity-80`}
                    style={{ height: `${bar.height}%` }}
                  ></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Mon</span>
              <span>Tue</span>
              <span>Bu</span>
              <span>Sur</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Daily Summary Bar */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-border cursor-pointer">
          <div className="flex flex-wrap items-center gap-6">
            <h2 className="text-lg font-semibold">DAILY SUMMARY</h2>

            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm">
                Streak: <span className="font-semibold">15 Days</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                Goals Met: <span className="font-semibold">3/4</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-blue-500" />
              <span className="text-sm">
                Water: <span className="font-semibold">2.5L</span> / 3L
              </span>
            </div>

            <div className="ml-auto">
              <div className="h-2 w-32 bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-purple-500 to-blue-500 rounded-full"
                  style={{ width: '75%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
