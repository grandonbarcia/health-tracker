# Feature Enhancement Implementation Plans

## 🎯 Priority 1: Personal Goal Setting

### Overview

Create a user settings system that allows users to set personalized daily nutrition targets (calories, protein, carbs, fat, etc.). This will serve as the foundation for goal tracking and smart recommendations.

### Database Schema Changes

```sql
-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Daily targets
  daily_calories INTEGER DEFAULT 2000,
  daily_protein INTEGER DEFAULT 150,  -- grams
  daily_carbs INTEGER DEFAULT 250,    -- grams
  daily_fat INTEGER DEFAULT 67,       -- grams
  daily_fiber INTEGER DEFAULT 25,     -- grams
  daily_sodium INTEGER DEFAULT 2300,  -- mg

  -- User preferences
  weight_goal VARCHAR(20) DEFAULT 'maintain', -- 'lose', 'gain', 'maintain'
  activity_level VARCHAR(20) DEFAULT 'moderate', -- 'sedentary', 'light', 'moderate', 'active', 'very_active'

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
```

### API Implementation

**New API Route: `/api/user-settings`**

```typescript
// src/app/api/user-settings/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get or create user settings
    let { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No settings found, create default
      const { data: newSettings, error: createError } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createError) throw createError;
      settings = newSettings;
    } else if (error) {
      throw error;
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const updates = await request.json();

    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Frontend Implementation

**Settings Component: `src/components/SettingsModal.tsx`**

```typescript
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UserSettings {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  daily_fiber: number;
  daily_sodium: number;
  weight_goal: string;
  activity_level: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: UserSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, onSave }: Props) {
  const [settings, setSettings] = useState<UserSettings>({
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 250,
    daily_fat: 67,
    daily_fiber: 25,
    daily_sodium: 2300,
    weight_goal: 'maintain',
    activity_level: 'moderate',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  async function loadSettings() {
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
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        onSave(settings);
        onClose();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Nutrition Goals</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Daily Calories
            </label>
            <input
              type="number"
              value={settings.daily_calories}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  daily_calories: parseInt(e.target.value) || 0,
                }))
              }
              className="w-full border rounded px-3 py-2"
              min="800"
              max="5000"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                value={settings.daily_protein}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    daily_protein: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                value={settings.daily_carbs}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    daily_carbs: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fat (g)</label>
              <input
                type="number"
                value={settings.daily_fat}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    daily_fat: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Weight Goal
            </label>
            <select
              value={settings.weight_goal}
              onChange={(e) =>
                setSettings((s) => ({ ...s, weight_goal: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="lose">Lose Weight</option>
              <option value="maintain">Maintain Weight</option>
              <option value="gain">Gain Weight</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Activity Level
            </label>
            <select
              value={settings.activity_level}
              onChange={(e) =>
                setSettings((s) => ({ ...s, activity_level: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Light Activity</option>
              <option value="moderate">Moderate Activity</option>
              <option value="active">Active</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 border rounded hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Goals'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Integration Steps

1. **Create SQL migration file**: `sql/create-user-settings.sql`
2. **Add API route**: Implement `/api/user-settings` endpoint
3. **Create SettingsModal component**
4. **Add settings button** to dashboard header
5. **Update user.ts** to include settings helper functions
6. **Test the complete flow**

### Testing Plan

- [ ] Verify settings are created with defaults for new users
- [ ] Test settings persistence across sessions
- [ ] Validate input ranges and data types
- [ ] Ensure RLS policies work correctly
- [ ] Test error handling for invalid data

---

## 🎯 Priority 2: Goal Tracking Indicators

### Overview

Enhance the existing NutrientChart component to display progress toward personal goals with visual indicators, progress bars, and remaining target information.

### Enhanced NutrientChart Component

**Updated: `src/components/NutrientChart.tsx`**

```typescript
'use client';
import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { NUTRIENT_DISPLAY, NUTRIENT_UNITS } from '../lib/nutrients';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  nutrients: Record<string, number>;
  userGoals?: Record<string, number>; // Personal goals instead of static RDI
  percentMode?: boolean;
  showGoalProgress?: boolean;
}

export default function NutrientChart({
  nutrients,
  userGoals,
  percentMode = false,
  showGoalProgress = true,
}: Props) {
  const keys = Object.keys(userGoals || {});

  const data = useMemo(() => {
    if (!userGoals) return null;

    const labels = keys.map(
      (k) =>
        `${NUTRIENT_DISPLAY[k] ?? k} ${
          NUTRIENT_UNITS[k] ? `(${NUTRIENT_UNITS[k]})` : ''
        }`
    );

    const userData = keys.map((k) => Number((nutrients[k] ?? 0).toFixed(2)));
    const goalData = keys.map((k) => Number((userGoals[k] ?? 0).toFixed(2)));

    if (percentMode) {
      const userPercentActual = userData.map((v, idx) => {
        const goal = goalData[idx] || 1;
        return Number(((v / goal) * 100).toFixed(1));
      });

      const goalPercent = goalData.map(() => 100);
      const userPercentPlot = userPercentActual.map((v) => Math.min(v, 150)); // Cap at 150% for visual

      return {
        labels,
        datasets: [
          {
            label: 'Your Intake (%)',
            data: userPercentPlot,
            backgroundColor: userPercentActual.map(
              (v) =>
                v >= 100
                  ? 'rgba(34, 197, 94, 0.8)' // Green if goal met
                  : v >= 80
                  ? 'rgba(251, 191, 36, 0.8)' // Yellow if close
                  : 'rgba(239, 68, 68, 0.8)' // Red if far from goal
            ),
            borderColor: userPercentActual.map((v) =>
              v >= 100
                ? 'rgb(34, 197, 94)'
                : v >= 80
                ? 'rgb(251, 191, 36)'
                : 'rgb(239, 68, 68)'
            ),
            borderWidth: 1,
          },
          {
            label: 'Goal (100%)',
            data: goalPercent,
            backgroundColor: 'rgba(156, 163, 175, 0.3)',
            borderColor: 'rgb(156, 163, 175)',
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: 'Your Intake',
          data: userData,
          backgroundColor: userData.map((v, idx) => {
            const goal = goalData[idx];
            const percentage = (v / goal) * 100;
            return percentage >= 100
              ? 'rgba(34, 197, 94, 0.8)'
              : percentage >= 80
              ? 'rgba(251, 191, 36, 0.8)'
              : 'rgba(239, 68, 68, 0.8)';
          }),
          borderColor: userData.map((v, idx) => {
            const goal = goalData[idx];
            const percentage = (v / goal) * 100;
            return percentage >= 100
              ? 'rgb(34, 197, 94)'
              : percentage >= 80
              ? 'rgb(251, 191, 36)'
              : 'rgb(239, 68, 68)';
          }),
          borderWidth: 1,
        },
        {
          label: 'Your Goals',
          data: goalData,
          backgroundColor: 'rgba(156, 163, 175, 0.3)',
          borderColor: 'rgb(156, 163, 175)',
          borderWidth: 1,
        },
      ],
    };
  }, [nutrients, userGoals, keys, percentMode]);

  const progressSummary = useMemo(() => {
    if (!userGoals || !showGoalProgress) return null;

    return keys.map((key) => {
      const current = nutrients[key] || 0;
      const goal = userGoals[key] || 0;
      const percentage = Math.round((current / goal) * 100);
      const remaining = Math.max(0, goal - current);

      return {
        key,
        current,
        goal,
        percentage,
        remaining,
        status:
          percentage >= 100 ? 'complete' : percentage >= 80 ? 'close' : 'low',
      };
    });
  }, [nutrients, userGoals, keys, showGoalProgress]);

  if (!data) return <div>No goal data available</div>;

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: percentMode
          ? 'Nutrition Progress (% of Goals)'
          : 'Nutrition vs Goals',
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            const key = keys[context.dataIndex];
            const unit = NUTRIENT_UNITS[key] || '';

            if (percentMode && datasetLabel.includes('Intake')) {
              return `${datasetLabel}: ${value}% of goal`;
            }
            return `${datasetLabel}: ${value}${unit}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: percentMode ? 'Percentage of Goal' : 'Amount',
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div style={{ height: '400px' }}>
        <Bar data={data} options={options} />
      </div>

      {progressSummary && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Today's Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {progressSummary.map(
              ({ key, current, goal, percentage, remaining, status }) => (
                <div key={key} className="bg-white rounded-lg p-3 border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">
                      {NUTRIENT_DISPLAY[key]}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        status === 'complete'
                          ? 'bg-green-100 text-green-800'
                          : status === 'close'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          status === 'complete'
                            ? 'bg-green-500'
                            : status === 'close'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {current.toFixed(1)} / {goal.toFixed(1)}{' '}
                    {NUTRIENT_UNITS[key]}
                    {remaining > 0 && (
                      <div className="text-gray-500">
                        {remaining.toFixed(1)} {NUTRIENT_UNITS[key]} remaining
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Integration with Dashboard

**Update: `src/app/dashboard/page.tsx`**

Add state management for user goals and integrate settings modal:

```typescript
// Add to imports
import SettingsModal from '../../components/SettingsModal';

// Add state for user goals
const [userGoals, setUserGoals] = useState<Record<string, number> | null>(null);
const [showSettings, setShowSettings] = useState(false);

// Load user goals on mount and auth change
useEffect(() => {
  if (currentUser) {
    loadUserGoals();
  } else {
    setUserGoals(null);
  }
}, [currentUser]);

async function loadUserGoals() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch('/api/user-settings', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
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

// Update NutrientChart usage
<NutrientChart
  nutrients={totals}
  userGoals={userGoals || RDI}
  percentMode={percentMode}
  showGoalProgress={!!userGoals}
/>

// Add settings button to header
<button
  onClick={() => setShowSettings(true)}
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
>
  ⚙️ Goals
</button>

// Add settings modal
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
```

### Testing Plan

- [ ] Verify goal tracking displays correctly
- [ ] Test color coding for different completion levels
- [ ] Validate progress bars and percentages
- [ ] Ensure settings modal integration works
- [ ] Test goal updates reflect immediately in charts

---

## 🎯 Priority 3: Recent Foods Feature

### Overview

Add quick access to recently logged foods by storing user's food history and providing a "Recent Foods" section in the food search interface.

### Database Schema

```sql
-- Track user food history
CREATE TABLE IF NOT EXISTS user_food_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id VARCHAR(255) NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  use_count INTEGER DEFAULT 1,

  UNIQUE(user_id, food_id)
);

-- Enable RLS
ALTER TABLE user_food_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own food history" ON user_food_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food history" ON user_food_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food history" ON user_food_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_food_history_recent ON user_food_history(user_id, last_used_at DESC);
```

### Backend Implementation

**New API Route: `/api/recent-foods`**

```typescript
// src/app/api/recent-foods/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get recent foods for user
    const { data: recentFoods, error } = await supabase
      .from('user_food_history')
      .select('food_id, last_used_at, use_count')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Get food details from foods table
    const foodIds = recentFoods?.map((f) => f.food_id) || [];
    if (foodIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: foods, error: foodsError } = await supabase
      .from('foods')
      .select('*')
      .in('id', foodIds);

    if (foodsError) throw foodsError;

    // Combine recent history with food details
    const result = recentFoods
      .map((recent) => {
        const food = foods?.find((f) => f.id === recent.food_id);
        return {
          ...food,
          last_used_at: recent.last_used_at,
          use_count: recent.use_count,
        };
      })
      .filter(Boolean);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching recent foods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { food_id } = await request.json();
    if (!food_id) {
      return NextResponse.json(
        { error: 'food_id is required' },
        { status: 400 }
      );
    }

    // Upsert food history
    const { data, error } = await supabase
      .from('user_food_history')
      .upsert(
        {
          user_id: user.id,
          food_id,
          last_used_at: new Date().toISOString(),
          use_count: 1,
        },
        {
          onConflict: 'user_id,food_id',
          ignoreDuplicates: false,
        }
      )
      .select();

    if (error) {
      // If upsert failed due to conflict, update the existing record
      const { error: updateError } = await supabase
        .from('user_food_history')
        .update({
          last_used_at: new Date().toISOString(),
          use_count: supabase.sql`use_count + 1`,
        })
        .eq('user_id', user.id)
        .eq('food_id', food_id);

      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking food usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Frontend Component

**New Component: `src/components/RecentFoods.tsx`**

```typescript
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
        <p>Sign in to see your recent foods</p>
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
        <p>No recent foods yet</p>
        <p className="text-xs">
          Start adding foods to see your recent items here
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-3">Recent Foods</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentFoods.map((food) => (
          <button
            key={food.id}
            onClick={() => handleSelectFood(food.id)}
            className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900">{food.name}</div>
                <div className="text-sm text-gray-500">
                  {food.calories} cal • {food.protein}g protein
                </div>
              </div>
              <div className="text-right">
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
```

### Integration Steps

1. **Create SQL migration**: Add `user_food_history` table
2. **Implement API routes**: `/api/recent-foods` GET and POST
3. **Create RecentFoods component**
4. **Update DayEditor**: Add RecentFoods section above search
5. **Track food usage**: Call API when foods are added
6. **Update user.ts**: Helper functions for food tracking

This implementation provides a foundation for the top 3 priority features. Each includes complete database schema, API implementation, frontend components, and integration steps.

**Would you like me to continue with the remaining features or help implement any of these specific plans?**
