'use client';
import { useMemo, useState, useEffect } from 'react';
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
} from '../lib/nutrients';
import NutrientChart from '../components/NutrientChart';
import AuthForm from '../components/AuthForm';
import ImportModal from '../components/ImportModal';
import { supabase } from '../lib/supabaseClient';
import {
  getDayMeals,
  setDayItems as persistDayItems,
  getOrCreateDayForUser,
} from '../lib/user';

export default function Home() {
  const [items, setItems] = useState<ItemWithQty[]>([]);
  const [percentMode, setPercentMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Import modal state
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
  const displayedTotals = dayTotals ?? totals;

  // Track authentication state
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setCurrentUser((data as any).session?.user ?? null);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setCurrentUser(session?.user ?? null);
        // Clear dayItems when user changes to prevent data leakage
        if (event === 'SIGNED_OUT') {
          setDayItems({});
        }
      }
    );
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Load initial data based on auth state
  useEffect(() => {
    if (currentUser) {
      // For authenticated users, don't load from localStorage
      // Data will be loaded when dates are selected
      return;
    }

    // Only load from localStorage for unauthenticated users
    try {
      const raw = localStorage.getItem('foodLog');
      if (raw) setDayItems(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to load food log', e);
    }
  }, [currentUser]);

  // load per-day data from server when a date is selected
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;

    (async () => {
      try {
        if (currentUser) {
          // Authenticated user: load from Supabase
          console.log(
            '🔒 Loading data for authenticated user:',
            currentUser.email
          );
          console.log('📅 Date:', selectedDate);

          const { day, meals } = await getDayMeals(selectedDate);
          console.log('📊 Loaded user data:', { day, meals });

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
                return; // Don't set server data yet, wait for user choice
              }
            }
          } catch (e) {
            // ignore local storage parsing errors
          }

          setDayItems((s) => ({ ...s, [selectedDate]: meals }));
          return;
        }

        // Unauthenticated user: use legacy API or localStorage data already loaded
        console.log('🔓 Loading data for unauthenticated user');
        console.log('📅 Date:', selectedDate);

        const res = await fetch(`/api/load-day?date=${selectedDate}`);
        const json = await res.json();
        console.log('📊 Loaded legacy data:', json);

        if (cancelled) return;
        if (json && json.ok) {
          // normalize legacy array shape -> DayMeals
          const items = json.items;
          let meals: DayMeals;
          if (Array.isArray(items)) {
            meals = { breakfast: [], lunch: [], dinner: items };
          } else {
            meals = {
              breakfast: items?.breakfast ?? [],
              lunch: items?.lunch ?? [],
              dinner: items?.dinner ?? [],
            };
          }
          setDayItems((s) => ({ ...s, [selectedDate]: meals }));
        }
      } catch (e) {
        // ignore; localStorage already has data
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, currentUser]);

  // Only save to localStorage for unauthenticated users
  useEffect(() => {
    if (currentUser) {
      // Authenticated users: data is saved to Supabase, don't use localStorage
      return;
    }

    // Unauthenticated users: save to localStorage
    try {
      localStorage.setItem('foodLog', JSON.stringify(dayItems));
    } catch (e) {
      console.warn('Failed to save food log', e);
    }
  }, [dayItems, currentUser]);

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

  return (
    <div className="min-h-screen p-8 sm:p-12">
      <header className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold mb-2">
            Food Nutrient Combiner
          </h1>
          <AuthForm />
        </div>
        <p className="mb-4 text-sm text-muted-foreground flex items-center gap-4">
          <span>
            Add foods from the food pyramid to calculate combined nutrients and
            compare to RDI.
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
        />

        {/* debug removed */}

        {selectedDate && (
          <div className="mt-4">
            <DayEditor
              date={selectedDate}
              initialItems={dayItems[selectedDate] ?? []}
              onClose={() => setSelectedDate(null)}
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
                    alert(
                      'Failed to save data to your account. Please try again.'
                    );
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
        {/* Combined nutrients + Compare chart side-by-side */}
        <div className="grid md:grid-cols-2 gap-6">
          <section>
            <h3 className="font-medium">Combined nutrients</h3>
            {/* main Add Food input removed */}
            {/* favorites removed */}
            <div className="mt-3 overflow-auto max-h-[360px] border rounded p-3 bg-white/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
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
                <span className="text-sm">Show percent-of-RDI</span>
              </label>
            </div>
            <div className="h-[420px] border rounded p-2 bg-white/50">
              <NutrientChart
                nutrients={displayedTotals}
                rdi={RDI}
                percentMode={percentMode}
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
    </div>
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
}: {
  onSelectDate: (iso: string) => void;
  entries: Record<string, DayMeals>;
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

  return (
    <div className="border rounded p-4 bg-white/50">
      <div className="grid grid-cols-7 gap-2 text-xs text-center font-medium mb-2">
        {weekDays.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c, idx) => (
          <button
            key={idx}
            disabled={!c.iso}
            onClick={() => c.iso && onSelectDate(c.iso)}
            className={`h-20 p-2 text-left rounded border flex flex-col justify-between hover:shadow ${
              c.iso &&
              entries[c.iso] &&
              (entries[c.iso].breakfast?.length || 0) +
                (entries[c.iso].lunch?.length || 0) +
                (entries[c.iso].dinner?.length || 0) >
                0
                ? 'bg-green-50'
                : 'bg-white'
            } ${c.iso === todayIso ? 'ring-2 ring-yellow-300' : ''}`}
          >
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
          </button>
        ))}
      </div>
    </div>
  );
}

export function DayEditor({
  date,
  initialItems,
  onClose,
  onSave,
}: {
  date: string;
  initialItems: DayMeals;
  onClose: () => void;
  onSave: (items: DayMeals) => void;
}) {
  const [localItems, setLocalItems] = useState<DayMeals>(
    initialItems ?? { breakfast: [], lunch: [], dinner: [] }
  );
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);
  const [selIdx, setSelIdx] = useState(-1);
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

  function addFoodToDay(name: string) {
    const id = name; // canonical id (from remoteSuggestions) or local key
    // Fetch profile asynchronously and cache it; still optimistically add the item
    void fetchAndCacheProfile(id);

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
    <div className="mt-4 border rounded p-4 bg-white/60">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium">
            {parseIsoLocal(date).toLocaleDateString()}
          </h4>
          <div className="text-sm text-muted-foreground flex gap-3 items-center">
            <span>Add/view foods for this day</span>
            <span className="text-[12px] px-2 py-1 bg-slate-100 rounded">
              ISO: {date}
            </span>
            {saved && (
              <span className="text-[12px] px-2 py-1 bg-green-100 text-green-800 rounded">
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
                onClick={() => addFoodToDay(s.id)}
                className={`text-left text-sm px-2 py-1 rounded ${
                  i === selIdx ? 'bg-slate-200' : 'hover:underline'
                }`}
              >
                {s.name}
              </div>
            ))}
          </div>
        )}

        <div>
          <h5 className="font-medium mb-2">Foods</h5>
          <div className="grid gap-4">
            {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
              <div key={meal}>
                <h6 className="font-medium capitalize">{meal}</h6>
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
        </div>
      </div>
    </div>
  );
}
