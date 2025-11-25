'use client';
import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  FOOD_DB,
  RDI,
  combineProfilesWithQty,
  combineDayMealsWithQty,
  NUTRIENT_KEYS,
  NUTRIENT_DISPLAY,
  NUTRIENT_UNITS,
  ItemWithQty,
  DayMeals,
} from '../../lib/nutrients';
import NutrientChart from '../../components/NutrientChart';
import ImportModal from '../../components/ImportModal';
import GoalsModal from '../../components/GoalsModal';
import SmartRecommendations from '../../components/SmartRecommendations';
import RestaurantFoods from '../../components/RestaurantFoods';
import FavoriteFoods from '../../components/FavoriteFoods';
import FavoriteButton from '../../components/FavoriteButton';
import RecipeModal from '../../components/RecipeModal';
import SavedRecipes from '../../components/SavedRecipes';
import NutritionAnalytics from '../../components/NutritionAnalytics';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  Activity,
  Apple,
  Dumbbell,
  Heart,
  Sparkles,
  TrendingUp,
  Calendar as CalendarIcon,
  LogIn,
  User,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
  getDayMeals,
  setDayItems as persistDayItems,
  getOrCreateDayForUser,
  getAllDaysWithMeals,
} from '../../lib/user';
import { FavoritesProvider } from '../../contexts/FavoritesContext';
import { Recipe, CreateRecipeData } from '../../types/recipe';
import VitalSignsEntry from '../../components/VitalSignsEntry';
import VitalSignsQuickView from '../../components/VitalSignsQuickView';
import VitalSignsHistory from '../../components/VitalSignsHistory';
import VitalSignsTrends from '../../components/VitalSignsTrends';
import { VitalSigns } from '../../types/vitalSigns';
import WorkoutEntry from '../../components/WorkoutEntry';
import WorkoutHistory from '../../components/WorkoutHistory';
import WorkoutStats from '../../components/WorkoutStats';

function Home() {
  // Use ref to track if component is mounted to prevent hydration issues
  const isMounted = useRef(false);

  const [items, setItems] = useState<ItemWithQty[]>([]);
  const [percentMode, setPercentMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Memoize user to prevent unnecessary re-renders from object reference changes
  const stableCurrentUser = useMemo(() => currentUser, [currentUser?.id]);

  // Use ref to persist initialization state across re-renders
  const hasInitializedAuth = useRef(false);
  const hasLoadedAllDays = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  // Track mounting state and detect page reloads
  useEffect(() => {
    isMounted.current = true;

    // Check if page was refreshed/reloaded
    if (performance.navigation.type === 1) {
      console.log('🔄 PAGE RELOAD detected via performance.navigation');
    }

    // Set up page visibility debugging
    const handleVisibilityChange = () => {
      console.log(
        `👁️ Page visibility changed: ${document.hidden ? 'HIDDEN' : 'VISIBLE'}`
      );
    };

    const handleFocus = () => {
      console.log('🎯 Window gained focus');
    };

    const handleBlur = () => {
      console.log('😶‍🌫️ Window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      isMounted.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [userGoals, setUserGoals] = useState<Record<string, number> | null>(
    null
  );

  // Recipe modal state
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Analytics section state
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(true);
  const [analyticsRefreshTrigger, setAnalyticsRefreshTrigger] = useState(0);

  // Vital Signs section state
  const [vitalSignsCollapsed, setVitalSignsCollapsed] = useState(true);
  const [showVitalSignsEntry, setShowVitalSignsEntry] = useState(false);
  const [editingVitalSign, setEditingVitalSign] = useState<VitalSigns | null>(
    null
  );
  const [vitalSignsRefreshTrigger, setVitalSignsRefreshTrigger] = useState(0);
  const [latestVitalSigns, setLatestVitalSigns] = useState<
    VitalSigns | undefined
  >();
  const [loadingLatestVitals, setLoadingLatestVitals] = useState(false);
  const [vitalSignsTab, setVitalSignsTab] = useState<'history' | 'trends'>(
    'history'
  );

  // Workout section state
  const [workoutCollapsed, setWorkoutCollapsed] = useState(true);
  const [showWorkoutEntry, setShowWorkoutEntry] = useState(false);

  const [importModal, setImportModal] = useState<{
    isOpen: boolean;
    date: string;
    localData: DayMeals;
    serverData: DayMeals;
  }>({
    isOpen: false,
    date: '',
    localData: { breakfast: [], lunch: [], dinner: [] },
    serverData: { breakfast: [], lunch: [], dinner: [] },
  });

  const available = useMemo(() => Object.keys(FOOD_DB), []);

  const totals = useMemo(() => combineProfilesWithQty(items), [items]);

  // Calendar / daily tracking state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loadingDate, setLoadingDate] = useState<string | null>(null);
  // dayItems now stores DayMeals per date. For backward compatibility the
  // server/localStorage may still contain an array of ItemWithQty; we
  // normalize when loading.
  const [dayItems, setDayItems] = useState<Record<string, DayMeals>>({});

  // totals for the currently-open day (if any)
  const dayTotals = useMemo(() => {
    if (!selectedDate) return null;
    const meals = dayItems[selectedDate];
    if (!meals) return null;
    return combineDayMealsWithQty(meals);
  }, [selectedDate, dayItems]);

  // displayedTotals: use dayTotals when a day is selected, otherwise the global totals
  const displayedTotals = dayTotals ?? totals; // Load user goals
  async function loadUserGoals() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/user-settings', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const settings = await response.json();
        setUserGoals({
          calories: settings.daily_calories,
          protein: settings.daily_protein,
          carbs: settings.daily_carbs,
          fat: settings.daily_fat,
          fiber: settings.daily_fiber,
          sodium: settings.daily_sodium,
        });
      }
    } catch (error) {
      console.error('Error loading user goals:', error);
    }
  }

  // Load latest vital signs for today
  async function loadLatestVitalSigns() {
    if (!currentUser) return;

    setLoadingLatestVitals(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/vital-signs?date=${today}&limit=1`);

      if (response.ok) {
        const data = await response.json();
        setLatestVitalSigns(data[0] || undefined);
      }
    } catch (error) {
      console.error('Error loading latest vital signs:', error);
    } finally {
      setLoadingLatestVitals(false);
    }
  }

  // Load latest vitals when user changes or section is opened
  useEffect(() => {
    if (currentUser && !vitalSignsCollapsed) {
      loadLatestVitalSigns();
    }
  }, [currentUser, vitalSignsCollapsed]);

  // Track authentication state - RE-ENABLED for testing
  useEffect(() => {
    let mounted = true;

    (async () => {
      // Only check session on initial load
      if (hasInitializedAuth.current) {
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted || !isMounted.current) return;
      const user = (data as any).session?.user ?? null;
      setCurrentUser(user);
      currentUserIdRef.current = user?.id || null; // Update ref
      if (user) {
        loadUserGoals();
      }
      hasInitializedAuth.current = true;
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted.current) {
          return;
        }

        const newUser = session?.user ?? null;
        const currentUserId = currentUserIdRef.current;
        const newUserId = newUser?.id || null;

        // Ignore SIGNED_IN events if user hasn't actually changed
        // This prevents unnecessary re-renders when tabbing back to the app
        if (event === 'SIGNED_IN' && currentUserId === newUserId) {
          return;
        }

        // Also ignore SIGNED_IN events if we're still in the initialization phase
        // and the auth state hasn't been properly set yet
        if (event === 'SIGNED_IN' && !hasInitializedAuth.current) {
          return;
        }

        // Only update state if the user actually changed
        if (currentUserId !== newUserId) {
          setCurrentUser(newUser);
          currentUserIdRef.current = newUserId; // Update ref
          // Clear dayItems when user changes to prevent data leakage
          if (event === 'SIGNED_OUT') {
            setDayItems({});
            setUserGoals(null);
            hasLoadedAllDays.current = false;
          } else if (newUser) {
            loadUserGoals();
            hasLoadedAllDays.current = false; // Reset flag for new user
          }
        }
      }
    );
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array - run only once

  // Load initial data based on auth state
  useEffect(() => {
    let mounted = true;

    if (stableCurrentUser) {
      // For authenticated users, load all days from Supabase
      (async () => {
        try {
          const allDays = await getAllDaysWithMeals();
          if (mounted && isMounted.current) {
            setDayItems(allDays);
            hasLoadedAllDays.current = true;
          }
        } catch (e) {
          console.warn('Failed to load food log', e);
        }
      })();
    } else {
      // Unauthenticated users: load from localStorage
      try {
        const raw = localStorage.getItem('foodLog');
        if (!raw) return;
        const local = JSON.parse(raw || '{}') as Record<string, DayMeals>;
        if (mounted && isMounted.current) {
          setDayItems(local);
        }
      } catch (e) {
        console.warn('Failed to load food log', e);
      }
    }

    return () => {
      mounted = false;
    };
  }, [stableCurrentUser?.id]); // Use just the ID to avoid reference changes

  // load per-day data from server when a date is selected (only if not already loaded)
  useEffect(() => {
    if (!selectedDate || hasLoadedAllDays.current) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingDate(selectedDate);

        if (stableCurrentUser) {
          // Authenticated user: load from Supabase only if we haven't loaded all days
          const { day, meals } = await getDayMeals(selectedDate);

          if (cancelled) return;

          // Check for localStorage import only on first load after authentication
          try {
            const raw = localStorage.getItem('foodLog');
            if (raw) {
              const local = JSON.parse(raw || '{}') as Record<string, DayMeals>;
              const localForDate = local[selectedDate];
              const serverJson = JSON.stringify(
                meals || { breakfast: [], lunch: [], dinner: [] }
              );
              const localJson = JSON.stringify(localForDate || {});
              if (localForDate && localJson !== serverJson) {
                // Show modal instead of window.confirm
                setImportModal({
                  isOpen: true,
                  date: selectedDate,
                  localData: localForDate,
                  serverData: meals || { breakfast: [], lunch: [], dinner: [] },
                });
                setLoadingDate(null);
                return; // Don't set server data yet, wait for user choice
              }
            }
          } catch (e) {
            // ignore local storage parsing errors
          }

          setDayItems((s) => ({ ...s, [selectedDate]: meals }));
          setLoadingDate(null);
          return;
        }

        // Unauthenticated user: rely only on localStorage data already loaded
        setLoadingDate(null);
      } catch (e) {
        // ignore; localStorage already has data
        setLoadingDate(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, stableCurrentUser?.id]); // Use ID instead of full object

  // Only save to localStorage for unauthenticated users
  useEffect(() => {
    if (stableCurrentUser) {
      // Authenticated users: data is saved to Supabase, don't use localStorage
      return;
    }

    // Unauthenticated users: save to localStorage
    try {
      localStorage.setItem('foodLog', JSON.stringify(dayItems));
    } catch (e) {
      console.warn('Failed to save food log', e);
    }
  }, [dayItems, stableCurrentUser?.id]); // Use ID to avoid object reference changes

  function addFood(name: string) {
    setItems((s) => [...s, { name, qty: 1 }]);
    // keep focus behavior at DayEditor level; nothing to do here
  }

  function removeAt(i: number) {
    setItems((s) => s.filter((_, idx) => idx !== i));
  }

  function updateQty(i: number, qty: number) {
    setItems((s) => s.map((it, idx) => (idx === i ? { ...it, qty } : it)));
  }

  // Import modal handlers
  const handleImportLocal = async () => {
    try {
      const created = await getOrCreateDayForUser(importModal.date);
      await persistDayItems(created.id, importModal.localData);
      setDayItems((s) => ({ ...s, [importModal.date]: importModal.localData }));
      // Refresh analytics after successful import
      setAnalyticsRefreshTrigger((prev) => prev + 1);

      // Clear localStorage after successful import for this date
      try {
        const raw = localStorage.getItem('foodLog');
        if (raw) {
          const local = JSON.parse(raw) as Record<string, DayMeals>;
          delete local[importModal.date];
          localStorage.setItem('foodLog', JSON.stringify(local));
        }
      } catch (e) {
        console.warn('Failed to clean up localStorage after import');
      }
    } catch (e) {
      console.error('Failed to import local data:', e);
      alert('Failed to import data. Please try again.');
    } finally {
      setImportModal((s) => ({ ...s, isOpen: false }));
    }
  };

  const handleKeepServerData = () => {
    setDayItems((s) => ({ ...s, [importModal.date]: importModal.serverData }));
    setImportModal((s) => ({ ...s, isOpen: false }));
  };

  const countItems = (meals: DayMeals) => {
    return (
      (meals.breakfast?.length || 0) +
      (meals.lunch?.length || 0) +
      (meals.dinner?.length || 0)
    );
  };

  // Recipe handlers
  const handleCreateRecipe = () => {
    setEditingRecipe(null);
    setShowRecipeModal(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowRecipeModal(true);
  };

  const handleSaveRecipe = async (recipeData: CreateRecipeData) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const url = editingRecipe
        ? `/api/recipes/${editingRecipe.id}`
        : '/api/recipes';
      const method = editingRecipe ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(recipeData),
      });

      if (response.ok) {
        console.log(
          `Recipe ${editingRecipe ? 'updated' : 'created'} successfully`
        );
        // The SavedRecipes component will reload automatically
      } else {
        const errorData = await response.json();
        alert(
          errorData.error ||
            `Failed to ${editingRecipe ? 'update' : 'create'} recipe`
        );
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    // When a recipe is selected, we want to add it to the current day
    // For now, let's just log it - this will be implemented when we integrate with DayEditor
    console.log('Selected recipe:', recipe);
    alert(
      `Recipe "${recipe.name}" selected. Integration with daily logging coming soon!`
    );
  };

  return (
    <FavoritesProvider currentUser={stableCurrentUser}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-visible pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-40 left-10 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-60 left-1/3 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Header */}
        <header className="relative z-10 border-b border-border bg-card/50 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              {/* Logo/Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-500 dark:via-purple-500 dark:to-blue-500 bg-clip-text text-transparent">
                    Health Tracker
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Your Complete Wellness Dashboard
                  </p>
                </div>
              </div>

              {/* User Actions */}
              <div className="flex items-center gap-3">
                {currentUser ? (
                  <>
                    <button
                      onClick={handleCreateRecipe}
                      className="px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/20 text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    >
                      <Apple className="w-4 h-4" />
                      New Recipe
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/20 text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Goals
                    </button>
                    <button
                      onClick={() => {
                        setEditingVitalSign(null);
                        setShowVitalSignsEntry(true);
                      }}
                      className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    >
                      <Heart className="w-4 h-4" />
                      Vitals
                    </button>
                    <button
                      onClick={() => setShowWorkoutEntry(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-green-500 text-white rounded-lg hover:from-purple-600 hover:to-green-600 text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <Dumbbell className="w-4 h-4" />
                      Log Workout
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      Guest Mode - Data saves locally
                    </div>
                    <button
                      onClick={() => (window.location.href = '/auth')}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Bar for Logged In Users */}
            {currentUser && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Account Synced
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="text-xs">{currentUser.email}</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10 p-6 sm:p-8">
          {/* Welcome Banner for Guest Users */}
          {!currentUser && (
            <div className="max-w-7xl mx-auto mb-8 animate-fade-in">
              <div className="relative bg-gradient-to-r from-green-500 via-purple-500 to-blue-500 rounded-2xl p-8 text-white overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome to Health Tracker! 👋
                  </h2>
                  <p className="text-lg opacity-90 mb-4">
                    You're currently in guest mode. Sign in to unlock cloud
                    sync, advanced analytics, and more!
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => (window.location.href = '/auth')}
                      className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <LogIn className="w-5 h-5" />
                      Create Free Account
                    </button>
                    <button className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 font-semibold border border-white/30 transition-all duration-300">
                      Continue as Guest
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Section */}
          <div className="max-w-7xl mx-auto mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  Daily Tracker
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select a date to log your meals and nutrition
                </p>
              </div>
            </div>
            <Calendar
              onSelectDate={(iso) => setSelectedDate(iso)}
              entries={dayItems}
              loadingDate={loadingDate}
            />

            {/* debug removed */}

            {selectedDate && (
              <div className="mt-4">
                <DayEditor
                  date={selectedDate}
                  initialItems={dayItems[selectedDate] ?? []}
                  isLoading={loadingDate === selectedDate}
                  currentUser={currentUser}
                  userGoals={userGoals}
                  onClose={() => setSelectedDate(null)}
                  onCreateRecipe={handleCreateRecipe}
                  onEditRecipe={handleEditRecipe}
                  onSelectRecipe={handleSelectRecipe}
                  onSave={async (itemsForDay) => {
                    // update local state
                    setDayItems((s) => ({ ...s, [selectedDate]: itemsForDay }));

                    if (currentUser) {
                      // Authenticated user: save to Supabase only
                      try {
                        const created = await getOrCreateDayForUser(
                          selectedDate
                        );
                        await persistDayItems(created.id, itemsForDay);
                        // Refresh analytics after successful save
                        setAnalyticsRefreshTrigger((prev) => prev + 1);
                      } catch (e) {
                        console.error('Failed to save day to user account:', e);

                        // More specific error messages
                        let errorMessage =
                          'Failed to save data to your account. Please try again.';
                        if (e instanceof Error) {
                          if (
                            e.message.includes(
                              'relation "user_days" does not exist'
                            )
                          ) {
                            errorMessage =
                              'Database tables not set up. Please run the SQL setup scripts first. Check SETUP_DATABASE.md for instructions.';
                          } else if (
                            e.message.includes('User not authenticated')
                          ) {
                            errorMessage =
                              'You are not logged in. Please sign in and try again.';
                          } else if (
                            e.message.includes('permission denied') ||
                            e.message.includes('RLS')
                          ) {
                            errorMessage =
                              'Permission denied. Make sure Row Level Security is properly configured.';
                          }
                        }

                        alert(errorMessage);
                      }
                      return;
                    }

                    // Unauthenticated user: save to legacy API (if available)
                    try {
                      await fetch('/api/save-day', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          date: selectedDate,
                          items: itemsForDay,
                        }),
                      });
                    } catch (e) {
                      console.warn('Failed to save day to legacy API', e);
                      // For unauthenticated users, localStorage is the primary storage
                    }
                  }}
                />
              </div>
            )}
          </div>

          <main className="max-w-7xl mx-auto mt-8">
            {/* Analytics Section */}
            {currentUser && (
              <div className="mb-6">
                <Collapsible
                  open={!analyticsCollapsed}
                  onOpenChange={(open) => setAnalyticsCollapsed(!open)}
                  className="border border-border rounded-lg"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <span>📊</span>
                      Nutrition Analytics & Trends
                    </h3>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform text-muted-foreground ${
                        analyticsCollapsed ? 'rotate-180' : ''
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 pt-0">
                      <NutritionAnalytics
                        currentUser={currentUser}
                        userGoals={userGoals || undefined}
                        refreshTrigger={analyticsRefreshTrigger}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Vital Signs Section */}
            {currentUser && (
              <div className="mb-6">
                <Collapsible
                  open={!vitalSignsCollapsed}
                  onOpenChange={(open) => setVitalSignsCollapsed(!open)}
                  className="border border-border rounded-lg"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Vital Signs Monitoring
                    </h3>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform text-muted-foreground ${
                        vitalSignsCollapsed ? 'rotate-180' : ''
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 pt-0 space-y-6">
                      {/* Quick View - Today's Latest Readings */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Today's Latest Readings
                          </h4>
                        </div>
                        <VitalSignsQuickView
                          latestReadings={latestVitalSigns}
                          loading={loadingLatestVitals}
                          tempUnit="celsius"
                        />
                      </div>

                      {/* Tabs for History and Trends */}
                      <div className="border-t border-border pt-4">
                        <div className="flex gap-4 border-b border-border mb-4">
                          <button
                            onClick={() => setVitalSignsTab('history')}
                            className={`pb-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                              vitalSignsTab === 'history'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            History
                          </button>
                          <button
                            onClick={() => setVitalSignsTab('trends')}
                            className={`pb-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                              vitalSignsTab === 'trends'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Trends
                          </button>
                        </div>

                        {/* History View */}
                        {vitalSignsTab === 'history' && (
                          <VitalSignsHistory
                            currentUser={currentUser}
                            onEdit={(record) => {
                              setEditingVitalSign(record);
                              setShowVitalSignsEntry(true);
                            }}
                            refreshTrigger={vitalSignsRefreshTrigger}
                            tempUnit="celsius"
                          />
                        )}

                        {/* Trends View */}
                        {vitalSignsTab === 'trends' && (
                          <VitalSignsTrends
                            currentUser={currentUser}
                            refreshTrigger={vitalSignsRefreshTrigger}
                            tempUnit="celsius"
                          />
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Workout Tracking Section */}
            {currentUser && (
              <div className="mb-6">
                <Collapsible
                  open={!workoutCollapsed}
                  onOpenChange={(open) => setWorkoutCollapsed(!open)}
                  className="border border-border rounded-lg"
                >
                  <div className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-purple-50 to-green-50 dark:from-purple-950/30 dark:to-green-950/30 hover:from-purple-100 hover:to-green-100 dark:hover:from-purple-950/50 dark:hover:to-green-950/50 rounded-lg transition-colors">
                    <CollapsibleTrigger className="flex items-center gap-2 flex-1">
                      <h3 className="font-medium text-foreground flex items-center gap-2">
                        <span className="text-purple-500">💪</span>
                        Workout Tracking
                      </h3>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform text-muted-foreground ${
                          workoutCollapsed ? 'rotate-180' : ''
                        }`}
                      />
                    </CollapsibleTrigger>
                    <button
                      onClick={() => setShowWorkoutEntry(true)}
                      className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors ml-2"
                    >
                      Log Workout
                    </button>
                  </div>
                  <CollapsibleContent>
                    <div className="p-4 pt-0 space-y-6">
                      {/* Workout Stats */}
                      <div>
                        <WorkoutStats currentUser={currentUser} />
                      </div>

                      {/* Workout History */}
                      <div>
                        <WorkoutHistory currentUser={currentUser} />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Combined nutrients + Compare chart side-by-side */}
            <div className="grid md:grid-cols-2 gap-6">
              <section>
                <h3 className="font-medium text-foreground">
                  Combined nutrients
                </h3>
                {/* main Add Food input removed */}
                {/* favorites removed */}
                <div className="mt-3 overflow-auto max-h-[360px] border border-border rounded p-3 bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="pb-2">Nutrient</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2">RDI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {NUTRIENT_KEYS.map((k) => (
                        <tr key={k} className="border-t">
                          <td className="py-2">{NUTRIENT_DISPLAY[k] ?? k}</td>
                          <td className="py-2">
                            {Number((displayedTotals[k] ?? 0).toFixed(2))}{' '}
                            {NUTRIENT_UNITS[k] ?? ''}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {(
                                ((displayedTotals[k] ?? 0) /
                                  ((RDI as any)[k] || 1)) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          </td>
                          <td className="py-2">
                            {(RDI as any)[k]} {NUTRIENT_UNITS[k] ?? ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="font-medium mb-2">Compare to RDI</h3>
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={percentMode}
                      onChange={(e) => setPercentMode(e.target.checked)}
                    />
                    <span className="text-sm text-foreground">
                      Show percent-of-RDI
                    </span>
                  </label>
                </div>
                <div className="border border-border rounded p-2 bg-card">
                  <NutrientChart
                    nutrients={displayedTotals}
                    rdi={userGoals || RDI}
                    percentMode={percentMode}
                    showGoalProgress={!!userGoals}
                  />
                </div>
              </section>
            </div>
          </main>

          {/* Import Modal */}
          <ImportModal
            isOpen={importModal.isOpen}
            onClose={handleKeepServerData}
            onImport={handleImportLocal}
            date={importModal.date}
            localItems={countItems(importModal.localData)}
            serverItems={countItems(importModal.serverData)}
          />

          {/* Settings Modal */}
          <GoalsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onSave={(settings) => {
              setUserGoals({
                calories: settings.daily_calories,
                protein: settings.daily_protein,
                carbs: settings.daily_carbs,
                fat: settings.daily_fat,
                fiber: settings.daily_fiber,
                sodium: settings.daily_sodium,
              });
            }}
          />

          {/* Recipe Modal */}
          <RecipeModal
            isOpen={showRecipeModal}
            onClose={() => {
              setShowRecipeModal(false);
              setEditingRecipe(null);
            }}
            onSave={handleSaveRecipe}
            editingRecipe={editingRecipe}
          />

          {/* Vital Signs Entry Modal */}
          <VitalSignsEntry
            open={showVitalSignsEntry}
            onOpenChange={setShowVitalSignsEntry}
            currentUser={currentUser}
            selectedDate={selectedDate || undefined}
            editingRecord={editingVitalSign}
            onSuccess={() => {
              setVitalSignsRefreshTrigger((prev) => prev + 1);
              loadLatestVitalSigns();
              setEditingVitalSign(null);
            }}
          />

          {/* Workout Entry Modal */}
          <WorkoutEntry
            open={showWorkoutEntry}
            onOpenChange={setShowWorkoutEntry}
            currentUser={currentUser}
            selectedDate={selectedDate || undefined}
            onSuccess={() => {
              // No specific refresh needed as components fetch independently
            }}
          />
        </div>
      </div>
    </FavoritesProvider>
  );
}

// Helpers: simple calendar and per-day editor
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isoDate(d: Date) {
  // produce a YYYY-MM-DD string using local date parts to avoid
  // timezone shifts when parsed in different zones
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoLocal(iso: string) {
  // parse a YYYY-MM-DD string into a Date using local timezone
  const [y, m, d] = iso.split('-').map((s) => Number(s));
  return new Date(y, m - 1, d);
}

export function Calendar({
  onSelectDate,
  entries,
  loadingDate,
}: {
  onSelectDate: (iso: string) => void;
  entries: Record<string, DayMeals>;
  loadingDate: string | null;
}) {
  const today = new Date();
  const start = startOfMonth(today);
  const todayIso = isoDate(today);
  const year = start.getFullYear();
  const month = start.getMonth();

  const firstDayWeekday = start.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ label: string; iso?: string }> = [];
  for (let i = 0; i < firstDayWeekday; i++) cells.push({ label: '' });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ label: String(d), iso: isoDate(date) });
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className="border border-border/50 rounded-2xl p-6 bg-gradient-to-br from-card via-card to-muted/20 shadow-lg backdrop-blur-sm">
      {/* Month and Year Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-500 dark:via-purple-500 dark:to-blue-500 bg-clip-text text-transparent">
          {monthNames[month]} {year}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Select a date to track your meals
        </p>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-3 mb-3">
        {weekDays.map((w) => (
          <div
            key={w}
            className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {cells.map((c, idx) => {
          const isLoading = c.iso === loadingDate;
          const hasEntries =
            c.iso &&
            entries[c.iso] &&
            (entries[c.iso].breakfast?.length || 0) +
              (entries[c.iso].lunch?.length || 0) +
              (entries[c.iso].dinner?.length || 0) >
              0;
          const itemCount =
            c.iso && entries[c.iso]
              ? (entries[c.iso].breakfast?.length || 0) +
                (entries[c.iso].lunch?.length || 0) +
                (entries[c.iso].dinner?.length || 0)
              : 0;
          const isToday = c.iso === todayIso;

          return (
            <button
              key={idx}
              disabled={!c.iso || isLoading}
              onClick={() => c.iso && onSelectDate(c.iso)}
              className={`relative h-24 rounded-xl transition-all duration-300 flex flex-col items-center justify-center group
                ${!c.iso ? 'invisible' : ''}
                ${
                  isToday
                    ? 'bg-gradient-to-br from-yellow-400/20 via-orange-400/20 to-yellow-500/20 dark:from-yellow-500/20 dark:via-orange-500/20 dark:to-yellow-600/20 ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/20'
                    : hasEntries
                    ? 'bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-600/10 dark:from-green-500/20 dark:via-emerald-500/20 dark:to-green-600/20 border border-green-500/30 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20'
                    : 'bg-card/50 border border-border/50 hover:border-purple-500/50 hover:bg-gradient-to-br hover:from-purple-500/5 hover:to-blue-500/5 hover:shadow-lg hover:shadow-purple-500/10'
                }
                ${
                  isLoading
                    ? 'opacity-60 cursor-wait'
                    : 'hover:scale-105 active:scale-95'
                }
              `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <svg
                    className="animate-spin h-6 w-6 text-purple-600 dark:text-purple-400"
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
                </div>
              ) : (
                <>
                  {/* Day Number */}
                  <div
                    className={`text-2xl font-bold mb-1 transition-colors
                    ${
                      isToday
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : hasEntries
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400'
                    }
                  `}
                  >
                    {c.label}
                  </div>

                  {/* Weekday */}
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {c.iso
                      ? parseIsoLocal(c.iso).toLocaleString(undefined, {
                          weekday: 'short',
                        })
                      : ''}
                  </div>

                  {/* Entry Indicator */}
                  {hasEntries && (
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                        {itemCount} {itemCount === 1 ? 'meal' : 'meals'}
                      </span>
                    </div>
                  )}

                  {/* Today Badge */}
                  {isToday && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DayEditor({
  date,
  initialItems,
  isLoading,
  currentUser,
  userGoals,
  onClose,
  onSave,
  onCreateRecipe,
  onEditRecipe,
  onSelectRecipe,
}: {
  date: string;
  initialItems: DayMeals;
  isLoading?: boolean;
  currentUser: any;
  userGoals: Record<string, number> | null;
  onClose: () => void;
  onSave: (items: DayMeals) => void;
  onCreateRecipe?: () => void;
  onEditRecipe?: (recipe: Recipe) => void;
  onSelectRecipe?: (recipe: Recipe) => void;
}) {
  const [localItems, setLocalItems] = useState<DayMeals>(
    initialItems ?? { breakfast: [], lunch: [], dinner: [] }
  );
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);
  const [selIdx, setSelIdx] = useState(-1);

  // Collapsible sections state - start closed by default
  const [isCollapsed, setIsCollapsed] = useState({
    favorites: true,
    recommendations: true,
    restaurants: true,
    recipes: true,
    analytics: true,
  });

  const available = useMemo(() => Object.keys(FOOD_DB), []);
  // cache for remote-loaded profiles (id -> { profile, ts })
  const [profileCache, setProfileCache] = useState<
    Record<string, { profile: any; ts: number }>
  >({});
  const PROFILE_TTL = 1000 * 60 * 5; // 5 minutes

  function getCachedProfile(id: string) {
    const entry = (profileCache as any)[id];
    if (entry && Date.now() - entry.ts < PROFILE_TTL) return entry.profile;
    // fallback to runtime FOOD_DB if available
    const runtime = (FOOD_DB as any)[id];
    if (runtime) return runtime;
    return null;
  }

  async function fetchAndCacheProfile(id: string) {
    const existing = getCachedProfile(id);
    if (existing) return existing;
    try {
      const res = await fetch(`/api/food/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const profile = await res.json();
      setProfileCache((c) => ({ ...c, [id]: { profile, ts: Date.now() } }));
      // also merge into runtime FOOD_DB for combine functions
      try {
        (FOOD_DB as any)[id] = profile;
      } catch (e) {
        // ignore if immutable
      }
      return profile;
    } catch (e) {
      return null;
    }
  }
  // remoteSuggestions now stores objects { id, name } for safer display/selection
  const [remoteSuggestions, setRemoteSuggestions] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(
    () =>
      setLocalItems(initialItems ?? { breakfast: [], lunch: [], dinner: [] }),
    [initialItems]
  );

  // When initial items are loaded, prefetch any server profiles so we can
  // display friendly names/serving info immediately.
  useEffect(() => {
    if (!initialItems) return;
    const ids = new Set<string>();
    for (const meal of ['breakfast', 'lunch', 'dinner'] as const) {
      for (const it of (initialItems as any)[meal] ?? []) {
        if (it && it.name) ids.add(it.name);
      }
    }
    ids.forEach((id) => {
      if (!getCachedProfile(id)) void fetchAndCacheProfile(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItems]);

  // default target meal selection
  const [targetMeal, setTargetMeal] = useState<
    'breakfast' | 'lunch' | 'dinner'
  >('breakfast');

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
    } catch (error) {
      console.error('Error tracking food usage:', error);
    }
  }

  function addFoodToDay(name: string) {
    const id = name; // canonical id (from remoteSuggestions) or local key
    // Fetch profile asynchronously and cache it; still optimistically add the item
    void fetchAndCacheProfile(id);

    // Track food usage for authenticated users
    if (currentUser) {
      trackFoodUsage(id);
    }

    // store the canonical id as the item name so the combine functions will
    // pick up the server-fetched profile (we show friendly names from cache
    // when available elsewhere)
    setLocalItems((s) => ({
      ...s,
      [targetMeal]: [...(s[targetMeal] ?? []), { name: id, qty: 1 }],
    }));
    setQuery('');
    setSelIdx(-1);
  }

  function removeAt(meal: keyof DayMeals, i: number) {
    setLocalItems((s) => ({
      ...s,
      [meal]: (s[meal] ?? []).filter((_, idx) => idx !== i),
    }));
  }

  function updateQty(meal: keyof DayMeals, i: number, qty: number) {
    setLocalItems((s) => ({
      ...s,
      [meal]: (s[meal] ?? []).map((it, idx) =>
        idx === i ? { ...it, qty } : it
      ),
    }));
  }

  const suggestions = useMemo(() => {
    // prefer remote suggestions (objects) when available; fallback to local filter
    const q = query.trim().toLowerCase();
    if (!q) return [];
    if (remoteSuggestions && remoteSuggestions.length > 0) {
      return remoteSuggestions.slice(0, 8).map((s) => s.name);
    }
    return available.filter((a) => a.includes(q)).slice(0, 4);
  }, [available, query, remoteSuggestions]);

  // async suggestions from server
  useEffect(() => {
    let mounted = true;
    const q = query.trim();
    if (!q) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/search-foods?q=${encodeURIComponent(q)}&limit=8`
        );
        if (!mounted) return;
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;
        // Normalize to { id, name }
        const suggestions = data.map((d: any) => {
          if (typeof d === 'string') return { id: d, name: d };
          return { id: d.id || d.name, name: d.name || d.id };
        });
        if (mounted) setRemoteSuggestions(suggestions);
      } catch (e) {
        // keep local suggestions
      }
    })();
    return () => {
      mounted = false;
    };
  }, [query]);

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return available.find((a) => a === q) ?? null;
  }, [available, query]);

  useEffect(() => {
    setSelIdx(-1);
  }, [query, remoteSuggestions.length]);

  // effective suggestions: prefer remote (server) suggestions when available
  // normalize to objects { id, name } for rendering/selection
  const effectiveSuggestions =
    (remoteSuggestions && remoteSuggestions.length > 0
      ? remoteSuggestions
      : suggestions.map((s) => ({ id: s, name: s }))) ?? [];

  return (
    <div className="mt-6 border border-border/50 rounded-2xl p-6 bg-gradient-to-br from-card via-card to-muted/20 shadow-xl backdrop-blur-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Apple className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-500 dark:via-purple-500 dark:to-blue-500 bg-clip-text text-transparent">
              {parseIsoLocal(date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h4>
            <div className="flex gap-2 items-center mt-1">
              <span className="text-sm text-muted-foreground">
                Track your nutrition
              </span>
              {saved && (
                <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full font-medium flex items-center gap-1 animate-fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
            onClick={() => {
              onSave(localItems);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Save
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-border/50 hover:bg-muted/50 font-medium transition-all duration-300 hover:scale-105 active:scale-95"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      <div>
        {/* Favorite Foods Section */}
        {currentUser && query === '' && (
          <Collapsible
            open={!isCollapsed.favorites}
            onOpenChange={(open) =>
              setIsCollapsed((prev) => ({ ...prev, favorites: !open }))
            }
            className="mb-4"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors">
              <h3 className="font-medium text-foreground">Favorite Foods</h3>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isCollapsed.favorites ? 'rotate-180' : ''
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <FavoriteFoods
                currentUser={currentUser}
                onSelectFood={(foodId) => addFoodToDay(foodId)}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Smart Recommendations Section */}
        {currentUser && query === '' && (
          <Collapsible
            open={!isCollapsed.recommendations}
            onOpenChange={(open) =>
              setIsCollapsed((prev) => ({ ...prev, recommendations: !open }))
            }
            className="mb-4"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors">
              <h3 className="font-medium text-foreground">
                Smart Recommendations
              </h3>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isCollapsed.recommendations ? 'rotate-180' : ''
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <SmartRecommendations
                currentNutrition={(() => {
                  // Calculate current day's nutrition for recommendations
                  const dayTotals = combineDayMealsWithQty(localItems);
                  return {
                    calories: dayTotals.calories || 0,
                    protein: dayTotals.protein || 0,
                    carbs: dayTotals.carbs || 0,
                    fat: dayTotals.fat || 0,
                    fiber: dayTotals.fiber || 0,
                    sodium: dayTotals.sodium || 0,
                  };
                })()}
                userGoals={userGoals}
                onSelectFood={(foodId) => addFoodToDay(foodId)}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Restaurant Foods Section */}
        {query === '' && (
          <Collapsible
            open={!isCollapsed.restaurants}
            onOpenChange={(open) =>
              setIsCollapsed((prev) => ({ ...prev, restaurants: !open }))
            }
            className="mb-4"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors">
              <h3 className="font-medium text-foreground">Restaurant Foods</h3>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isCollapsed.restaurants ? 'rotate-180' : ''
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <RestaurantFoods
                onSelectFood={(foodId) => addFoodToDay(foodId)}
                currentUser={currentUser}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Saved Recipes Section */}
        {currentUser && query === '' && (
          <Collapsible
            open={!isCollapsed.recipes}
            onOpenChange={(open) =>
              setIsCollapsed((prev) => ({ ...prev, recipes: !open }))
            }
            className="mb-4"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors">
              <h3 className="font-medium text-foreground">My Recipes</h3>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isCollapsed.recipes ? 'rotate-180' : ''
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <SavedRecipes
                currentUser={currentUser}
                onSelectRecipe={onSelectRecipe || (() => {})}
                onEditRecipe={onEditRecipe || (() => {})}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Search Bar */}
        <div className="flex gap-3 mb-4 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl border border-border/50">
          <div className="relative">
            <select
              value={targetMeal}
              onChange={(e) => setTargetMeal(e.target.value as any)}
              className="rounded-lg border border-border bg-card px-4 py-3 font-medium appearance-none pr-10 cursor-pointer hover:border-purple-500/50 transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              aria-label="Select meal to add to"
            >
              <option value="breakfast">🌅 Breakfast</option>
              <option value="lunch">☀️ Lunch</option>
              <option value="dinner">🌙 Dinner</option>
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 placeholder:text-muted-foreground hover:border-purple-500/50 transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for any food..."
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelIdx((s) =>
                    Math.min(s + 1, effectiveSuggestions.length - 1)
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelIdx((s) => Math.max(s - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (selIdx >= 0 && effectiveSuggestions[selIdx]) {
                    addFoodToDay(effectiveSuggestions[selIdx].id);
                  } else if (exactMatch) {
                    addFoodToDay(exactMatch);
                  }
                } else if (e.key === 'Escape') {
                  setSelIdx(-1);
                  setQuery('');
                }
              }}
            />
          </div>
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 ${
              exactMatch
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20'
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
            }`}
            onClick={() => {
              if (exactMatch) addFoodToDay(exactMatch);
            }}
            disabled={!exactMatch}
            title={exactMatch ? `Add ${exactMatch}` : 'Type to match a food'}
          >
            <svg
              className="w-4 h-4"
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
            {exactMatch ? 'Add' : 'Add'}
          </button>
        </div>
        {query.trim() !== '' && effectiveSuggestions.length > 0 && (
          <div
            className="mb-4 p-3 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg animate-fade-in"
            role="listbox"
            id="day-food-listbox"
            aria-label="Food suggestions"
            aria-activedescendant={
              selIdx >= 0 ? `day-food-option-${selIdx}` : undefined
            }
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Search Results
            </div>
            <div className="space-y-1">
              {effectiveSuggestions.map((s, i) => (
                <div
                  key={s.id}
                  id={`day-food-option-${i}`}
                  role="option"
                  aria-selected={i === selIdx}
                  onMouseEnter={() => setSelIdx(i)}
                  onClick={() => addFoodToDay(s.id)}
                  className={`flex items-center justify-between text-left px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer ${
                    i === selIdx
                      ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 shadow-sm'
                      : 'hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  <span className="flex-1 text-left font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {s.name}
                  </span>
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {currentUser && (
                      <FavoriteButton
                        foodId={s.id}
                        foodType={(s as any).type || 'regular'}
                        currentUser={currentUser}
                        size="sm"
                      />
                    )}
                    <svg
                      className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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
              ))}
            </div>
          </div>
        )}

        {/* Meal Lists */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h5 className="text-lg font-bold text-foreground">Your Meals</h5>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <svg
                  className="animate-spin h-8 w-8 text-green-600"
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
                <p className="text-sm text-muted-foreground">
                  Loading foods...
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
                <div
                  key={meal}
                  className="bg-gradient-to-br from-card to-muted/10 rounded-xl p-4 border border-border/50 hover:border-purple-500/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">
                      {meal === 'breakfast'
                        ? '🌅'
                        : meal === 'lunch'
                        ? '☀️'
                        : '🌙'}
                    </span>
                    <h6 className="font-bold capitalize text-lg bg-gradient-to-r from-green-600 to-purple-600 dark:from-green-500 dark:to-purple-500 bg-clip-text text-transparent">
                      {meal}
                    </h6>
                  </div>
                  <ul className="space-y-2">
                    {(localItems[meal] ?? []).map((it, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-4 p-3 bg-card/50 rounded-lg border border-border/50 hover:border-purple-500/30 hover:shadow-md transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-purple-500 group-hover:scale-125 transition-transform" />
                          <span className="font-medium flex-1">
                            {(() => {
                              const p = getCachedProfile(it.name);
                              const display = p?.name ?? it.name;
                              const serving =
                                p?.serving ||
                                p?.serving_text ||
                                p?.serving_size ||
                                p?.serving_label;
                              const qty = it.qty ?? 1;
                              if (serving) {
                                return qty && qty !== 1
                                  ? `${display} — ${qty} × ${serving}`
                                  : `${display} — ${serving}`;
                              }
                              return qty && qty !== 1
                                ? `${qty} × ${display}`
                                : display;
                            })()}
                          </span>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50">
                            <label className="text-xs font-semibold text-muted-foreground">
                              Qty
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={0.25}
                              value={it.qty}
                              onChange={(e) =>
                                updateQty(meal, i, Number(e.target.value))
                              }
                              className="w-16 bg-transparent text-center font-semibold focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1"
                            onClick={() => removeAt(meal, i)}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}

                    {(localItems[meal] ?? []).length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <svg
                          className="w-12 h-12 mx-auto mb-2 opacity-30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <div className="text-sm font-medium">
                          No items added yet
                        </div>
                        <div className="text-xs mt-1">
                          Search and add foods to track your {meal}
                        </div>
                      </div>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap in React.memo to prevent unnecessary re-renders
export default React.memo(Home);
