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
import SettingsModal from '../../components/SettingsModal';
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
import { ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
  getDayMeals,
  setDayItems as persistDayItems,
  getOrCreateDayForUser,
  getAllDaysWithMeals,
} from '../../lib/user';
import { FavoritesProvider } from '../../contexts/FavoritesContext';
import { Recipe, CreateRecipeData } from '../../types/recipe';

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
      <div className="min-h-screen p-8 sm:p-12">
        <header className="max-w-4xl mx-auto mb-6">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-semibold">Food Nutrient Combiner</h1>
            <div className="flex gap-2">
              {currentUser && (
                <>
                  <button
                    onClick={handleCreateRecipe}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center gap-2"
                  >
                    🍳 New Recipe
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-2"
                  >
                    ⚙️ Goals
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-4">
            <span>
              Add foods from the food pyramid to calculate combined nutrients
              and compare to RDI.
            </span>
            {currentUser && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                ✓ Data saves to your account
              </span>
            )}
            {!currentUser && (
              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
                ⚠ Data saves locally only
              </span>
            )}
          </p>
        </header>

        {/* Calendar at top */}
        <div className="max-w-4xl mx-auto mb-6">
          <h3 className="font-medium mb-3">Calendar</h3>
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
                      const created = await getOrCreateDayForUser(selectedDate);
                      await persistDayItems(created.id, itemsForDay);
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

        <main className="max-w-4xl mx-auto">
          {/* Analytics Section */}
          {currentUser && (
            <div className="mb-6">
              <Collapsible
                open={!analyticsCollapsed}
                onOpenChange={(open) => setAnalyticsCollapsed(!open)}
                className="border rounded-lg"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <span>📊</span>
                    Nutrition Analytics & Trends
                  </h3>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      analyticsCollapsed ? 'rotate-180' : ''
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-0">
                    <NutritionAnalytics
                      currentUser={currentUser}
                      userGoals={userGoals || undefined}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Combined nutrients + Compare chart side-by-side */}
          <div className="grid md:grid-cols-2 gap-6">
            <section>
              <h3 className="font-medium text-foreground">Combined nutrients</h3>
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
                  <span className="text-sm text-foreground">Show percent-of-RDI</span>
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
        <SettingsModal
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
    <div className="border border-border rounded p-4 bg-card">
      {/* Month and Year Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {monthNames[month]} {year}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs text-center font-medium mb-2 text-muted-foreground">
        {weekDays.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c, idx) => {
          const isLoading = c.iso === loadingDate;
          return (
            <button
              key={idx}
              disabled={!c.iso || isLoading}
              onClick={() => c.iso && onSelectDate(c.iso)}
              className={`h-20 p-2 text-left rounded border border-border flex flex-col justify-between hover:shadow transition-colors ${
                c.iso &&
                entries[c.iso] &&
                (entries[c.iso].breakfast?.length || 0) +
                  (entries[c.iso].lunch?.length || 0) +
                  (entries[c.iso].dinner?.length || 0) >
                  0
                  ? 'bg-green-50 dark:bg-green-950'
                  : 'bg-card hover:bg-muted/50'
              } ${c.iso === todayIso ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''} ${
                isLoading ? 'opacity-60' : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <svg
                    className="animate-spin h-6 w-6 text-green-600"
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
                  <div className="text-xs opacity-70">
                    {c.iso
                      ? parseIsoLocal(c.iso).toLocaleString(undefined, {
                          weekday: 'short',
                        })
                      : ''}
                  </div>
                  <div className="text-lg font-semibold">{c.label}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {c.iso && entries[c.iso]
                      ? `${
                          (entries[c.iso].breakfast?.length || 0) +
                          (entries[c.iso].lunch?.length || 0) +
                          (entries[c.iso].dinner?.length || 0)
                        } item(s)`
                      : ''}
                  </div>
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
    <div className="mt-4 border border-border rounded p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium text-foreground">
            {parseIsoLocal(date).toLocaleDateString()}
          </h4>
          <div className="text-sm text-muted-foreground flex gap-3 items-center">
            <span>Add/view foods for this day</span>
            <span className="text-[12px] px-2 py-1 bg-muted rounded">
              ISO: {date}
            </span>
            {saved && (
              <span className="text-[12px] px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                Saved
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border"
            onClick={() => {
              onSave(localItems);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            Save
          </button>
          <button className="px-3 py-1 rounded" onClick={onClose}>
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
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors">
              <h3 className="font-medium text-gray-900">My Recipes</h3>
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

        <div className="flex gap-2 mb-2">
          <select
            value={targetMeal}
            onChange={(e) => setTargetMeal(e.target.value as any)}
            className="rounded border px-3 py-2"
            aria-label="Select meal to add to"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
          <input
            className="flex-1 rounded border px-3 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food to add"
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
          <button
            className={`px-3 py-2 rounded text-white ${
              exactMatch ? 'bg-green-600' : 'bg-slate-900/40 cursor-not-allowed'
            }`}
            onClick={() => {
              if (exactMatch) addFoodToDay(exactMatch);
            }}
            title={exactMatch ? `Add ${exactMatch}` : 'Type to match a food'}
          >
            {exactMatch ? 'Quick Add' : 'Add'}
          </button>
        </div>
        {query.trim() !== '' && effectiveSuggestions.length > 0 && (
          <div
            className="grid gap-1 mb-3"
            role="listbox"
            id="day-food-listbox"
            aria-label="Food suggestions"
            aria-activedescendant={
              selIdx >= 0 ? `day-food-option-${selIdx}` : undefined
            }
          >
            {effectiveSuggestions.map((s, i) => (
              <div
                key={s.id}
                id={`day-food-option-${i}`}
                role="option"
                aria-selected={i === selIdx}
                onMouseEnter={() => setSelIdx(i)}
                className={`flex items-center justify-between text-left text-sm px-2 py-1 rounded ${
                  i === selIdx ? 'bg-slate-200' : 'hover:bg-slate-100'
                }`}
              >
                <button
                  onClick={() => addFoodToDay(s.id)}
                  className="flex-1 text-left hover:underline"
                >
                  {s.name}
                </button>
                {currentUser && (
                  <FavoriteButton
                    foodId={s.id}
                    foodType={(s as any).type || 'regular'}
                    currentUser={currentUser}
                    size="sm"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <h5 className="font-medium mb-2">Foods</h5>
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
                <p className="text-sm text-muted-foreground">Loading foods...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
                <div key={meal}>
                  <h6 className="font-medium capitalize text-foreground">{meal}</h6>
                  <ul className="space-y-2 mt-2">
                    {(localItems[meal] ?? []).map((it, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="min-w-[160px]">
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
                          <label className="text-sm">Qty</label>
                          <input
                            type="number"
                            min={0}
                            step={0.25}
                            value={it.qty}
                            onChange={(e) =>
                              updateQty(meal, i, Number(e.target.value))
                            }
                            className="w-20 rounded border px-2 py-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="text-sm text-red-600"
                            onClick={() => removeAt(meal, i)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}

                    {(localItems[meal] ?? []).length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No items
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
