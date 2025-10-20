'use client';
import { useMemo, useState, useEffect } from 'react';
import {
  FOOD_DB,
  RDI,
  combineProfilesWithQty,
  NUTRIENT_KEYS,
  NUTRIENT_DISPLAY,
  NUTRIENT_UNITS,
  ItemWithQty,
} from '../lib/nutrients';
import NutrientChart from '../components/NutrientChart';

export default function Home() {
  const [items, setItems] = useState<ItemWithQty[]>([]);
  const [percentMode, setPercentMode] = useState(false);

  const available = useMemo(() => Object.keys(FOOD_DB), []);

  const totals = useMemo(() => combineProfilesWithQty(items), [items]);

  // Calendar / daily tracking state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayItems, setDayItems] = useState<Record<string, ItemWithQty[]>>({});

  // totals for the currently-open day (if any)
  const dayTotals = useMemo(() => {
    if (!selectedDate) return null;
    return combineProfilesWithQty(dayItems[selectedDate] ?? []);
  }, [selectedDate, dayItems]);

  // displayedTotals: use dayTotals when a day is selected, otherwise the global totals
  const displayedTotals = dayTotals ?? totals;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('foodLog');
      if (raw) setDayItems(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to load food log', e);
    }
  }, []);

  // load per-day data from server when a date is selected
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/load-day?date=${selectedDate}`);
        const json = await res.json();
        if (cancelled) return;
        if (json && json.ok) {
          setDayItems((s) => ({ ...s, [selectedDate]: json.items ?? [] }));
        }
      } catch (e) {
        // ignore; localStorage already has data
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  useEffect(() => {
    try {
      localStorage.setItem('foodLog', JSON.stringify(dayItems));
    } catch (e) {
      console.warn('Failed to save food log', e);
    }
  }, [dayItems]);

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

  return (
    <div className="min-h-screen p-8 sm:p-12">
      <header className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Food Nutrient Combiner</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Add foods from the food pyramid to calculate combined nutrients and
          compare to RDI.
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
                // try to persist to server
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
                  console.warn('Failed to save day to server', e);
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
  entries: Record<string, ItemWithQty[]>;
}) {
  const today = new Date();
  const start = startOfMonth(today);
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
              c.iso && entries[c.iso] && entries[c.iso].length > 0
                ? 'bg-green-50'
                : 'bg-white'
            }`}
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
                ? `${entries[c.iso].length} item(s)`
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
  initialItems: ItemWithQty[];
  onClose: () => void;
  onSave: (items: ItemWithQty[]) => void;
}) {
  const [localItems, setLocalItems] = useState<ItemWithQty[]>(initialItems);
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);
  const [selIdx, setSelIdx] = useState(-1);
  const available = useMemo(() => Object.keys(FOOD_DB), []);

  useEffect(() => setLocalItems(initialItems), [initialItems]);

  function addFoodToDay(name: string) {
    setLocalItems((s) => [...s, { name, qty: 1 }]);
    setQuery('');
    setSelIdx(-1);
  }

  function removeAt(i: number) {
    setLocalItems((s) => s.filter((_, idx) => idx !== i));
  }

  function updateQty(i: number, qty: number) {
    setLocalItems((s) => s.map((it, idx) => (idx === i ? { ...it, qty } : it)));
  }

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return available.filter((a) => a.includes(q)).slice(0, 8);
  }, [available, query]);

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return available.find((a) => a === q) ?? null;
  }, [available, query]);

  useEffect(() => {
    setSelIdx(-1);
  }, [query, suggestions.length]);

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
          <input
            className="flex-1 rounded border px-3 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food to add"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelIdx((s) => Math.min(s + 1, suggestions.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelIdx((s) => Math.max(s - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selIdx >= 0 && suggestions[selIdx]) {
                  addFoodToDay(suggestions[selIdx]);
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
        {query.trim() !== '' && suggestions.length > 0 && (
          <div
            className="grid gap-1 mb-3"
            role="listbox"
            id="day-food-listbox"
            aria-label="Food suggestions"
            aria-activedescendant={
              selIdx >= 0 ? `day-food-option-${selIdx}` : undefined
            }
          >
            {suggestions.map((s, i) => (
              <div
                key={s}
                id={`day-food-option-${i}`}
                role="option"
                aria-selected={i === selIdx}
                onMouseEnter={() => setSelIdx(i)}
                onClick={() => addFoodToDay(s)}
                className={`text-left text-sm px-2 py-1 rounded ${
                  i === selIdx ? 'bg-slate-200' : 'hover:underline'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        )}

        <div>
          <h5 className="font-medium mb-2">Foods</h5>
          <ul className="space-y-2">
            {localItems.map((it, i) => (
              <li key={i} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="min-w-[160px]">{it.name}</span>
                  <label className="text-sm">Qty</label>
                  <input
                    type="number"
                    min={0}
                    step={0.25}
                    value={it.qty}
                    onChange={(e) => updateQty(i, Number(e.target.value))}
                    className="w-20 rounded border px-2 py-1"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-sm text-red-600"
                    onClick={() => removeAt(i)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
            {localItems.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No foods logged for this day.
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
