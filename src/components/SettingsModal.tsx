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
      } else {
        console.log('Settings API not available, using defaults');
        // Keep default settings if API fails
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Keep default settings on error
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
      } else {
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateCaloriesFromMacros() {
    // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
    return (
      settings.daily_protein * 4 +
      settings.daily_carbs * 4 +
      settings.daily_fat * 9
    );
  }

  function updateCaloriesFromMacros() {
    const calculatedCalories = calculateCaloriesFromMacros();
    setSettings((s) => ({
      ...s,
      daily_calories: Math.round(calculatedCalories),
    }));
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
            <p className="text-xs text-gray-500 mt-1">
              Based on macros: {calculateCaloriesFromMacros().toFixed(0)}{' '}
              calories
              <button
                type="button"
                onClick={updateCaloriesFromMacros}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                Auto-calculate
              </button>
            </p>
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
                min="0"
                max="500"
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
                min="0"
                max="1000"
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
                min="0"
                max="300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Fiber (g)
              </label>
              <input
                type="number"
                value={settings.daily_fiber}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    daily_fiber: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full border rounded px-3 py-2"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Sodium (mg)
              </label>
              <input
                type="number"
                value={settings.daily_sodium}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    daily_sodium: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full border rounded px-3 py-2"
                min="0"
                max="10000"
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
              <option value="sedentary">Sedentary (Little/no exercise)</option>
              <option value="light">Light Activity (1-3 days/week)</option>
              <option value="moderate">
                Moderate Activity (3-5 days/week)
              </option>
              <option value="active">Active (6-7 days/week)</option>
              <option value="very_active">Very Active (2x/day, intense)</option>
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
