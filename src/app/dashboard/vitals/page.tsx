'use client';

import { Activity, ArrowLeft, Heart, Moon, Zap, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface VitalReading {
  id: string;
  user_id: string;
  reading_date: string;
  heart_rate: number | null;
  systolic: number | null;
  diastolic: number | null;
  sleep_hours: number | null;
  energy_level: number | null;
  created_at: string;
}

export default function VitalsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    heartRate: '',
    systolic: '',
    diastolic: '',
    sleepHours: '',
    energyLevel: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [vitalsData, setVitalsData] = useState<VitalReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTodaysVitals();
  }, []);

  const loadTodaysVitals = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Get today's vitals reading
      const { data, error } = await supabase
        .from('user_vitals')
        .select('*')
        .eq('user_id', user.id)
        .eq('reading_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error loading vitals:', error);
        return;
      }

      if (data) {
        setVitalsData(data);
      }
    } catch (error) {
      console.error('Error loading vitals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to save vitals');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const vitalRecord = {
        user_id: user.id,
        reading_date: today,
        heart_rate: formData.heartRate ? parseFloat(formData.heartRate) : null,
        systolic: formData.systolic ? parseFloat(formData.systolic) : null,
        diastolic: formData.diastolic ? parseFloat(formData.diastolic) : null,
        sleep_hours: formData.sleepHours
          ? parseFloat(formData.sleepHours)
          : null,
        energy_level: formData.energyLevel
          ? parseFloat(formData.energyLevel)
          : null,
      };

      const { error } = await supabase.from('user_vitals').upsert(vitalRecord, {
        onConflict: 'user_id,reading_date',
      });

      if (error) {
        console.error('Error saving vitals:', error);
        alert('Failed to save vitals. Please try again.');
        return;
      }

      // Reload data
      await loadTodaysVitals();

      setShowModal(false);
      setFormData({
        heartRate: '',
        systolic: '',
        diastolic: '',
        sleepHours: '',
        energyLevel: '',
      });
    } catch (error) {
      console.error('Error saving vitals:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-muted/50 rounded-lg transition-all duration-300 hover:scale-110 hover:-translate-x-1"
            >
              <ArrowLeft className="w-7 h-7" strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                Vital Signs
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor your health metrics and trends
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Reading
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Heart Rate */}
          <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                Heart Rate
              </h2>
            </div>
            {isLoading ? (
              <div className="text-2xl text-muted-foreground">...</div>
            ) : (
              <>
                <div className="text-4xl font-bold mb-2">
                  {vitalsData?.heart_rate ?? '--'}
                </div>
                <div className="text-sm text-muted-foreground">bpm</div>
                <div className="mt-4 text-xs text-green-500">
                  {vitalsData?.heart_rate
                    ? vitalsData.heart_rate >= 60 &&
                      vitalsData.heart_rate <= 100
                      ? 'Normal range'
                      : 'Out of normal range'
                    : 'No data'}
                </div>
              </>
            )}
          </div>

          {/* Blood Pressure */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                Blood Pressure
              </h2>
            </div>
            {isLoading ? (
              <div className="text-2xl text-muted-foreground">...</div>
            ) : (
              <>
                <div className="text-4xl font-bold mb-2">
                  {vitalsData?.systolic && vitalsData?.diastolic
                    ? `${vitalsData.systolic}/${vitalsData.diastolic}`
                    : '--/--'}
                </div>
                <div className="text-sm text-muted-foreground">mmHg</div>
                <div className="mt-4 text-xs text-green-500">
                  {vitalsData?.systolic && vitalsData?.diastolic
                    ? vitalsData.systolic < 120 && vitalsData.diastolic < 80
                      ? 'Optimal'
                      : 'Elevated'
                    : 'No data'}
                </div>
              </>
            )}
          </div>

          {/* Sleep */}
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-5 h-5 text-purple-500" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                Sleep
              </h2>
            </div>
            {isLoading ? (
              <div className="text-2xl text-muted-foreground">...</div>
            ) : (
              <>
                <div className="text-4xl font-bold mb-2">
                  {vitalsData?.sleep_hours
                    ? vitalsData.sleep_hours.toFixed(1)
                    : '--'}
                </div>
                <div className="text-sm text-muted-foreground">hours</div>
                <div className="mt-4 text-xs text-green-500">
                  {vitalsData?.sleep_hours
                    ? vitalsData.sleep_hours >= 7 && vitalsData.sleep_hours <= 9
                      ? 'Good quality'
                      : vitalsData.sleep_hours < 7
                      ? 'Below recommended'
                      : 'Above recommended'
                    : 'No data'}
                </div>
              </>
            )}
          </div>

          {/* Energy Level */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                Energy
              </h2>
            </div>
            {isLoading ? (
              <div className="text-2xl text-muted-foreground">...</div>
            ) : (
              <>
                <div className="text-4xl font-bold mb-2">
                  {vitalsData?.energy_level
                    ? `${vitalsData.energy_level}%`
                    : '--%'}
                </div>
                <div className="text-sm text-muted-foreground">level</div>
                <div className="mt-4 text-xs text-green-500">
                  {vitalsData?.energy_level
                    ? vitalsData.energy_level >= 67
                      ? 'High energy'
                      : vitalsData.energy_level >= 34
                      ? 'Moderate energy'
                      : 'Low energy'
                    : 'No data'}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Trends Chart */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
          <h2 className="text-xl font-semibold mb-6">7-Day Trends</h2>
          <div className="space-y-6">
            {['Heart Rate', 'Blood Pressure', 'Sleep Hours'].map((metric) => (
              <div key={metric} className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {metric}
                </div>
                <div className="h-16 flex items-end gap-2">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-green-500/60 to-green-500/20 rounded-t-lg transition-all hover:from-green-500/80"
                      style={{
                        height: `${Math.random() * 60 + 40}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>

        {/* Recent Readings */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Recent Readings</h2>
          <div className="space-y-3">
            {[
              {
                time: '2 hours ago',
                reading: 'Heart Rate: 68 bpm',
                status: 'Normal',
              },
              {
                time: '6 hours ago',
                reading: 'Blood Pressure: 118/78 mmHg',
                status: 'Normal',
              },
              {
                time: 'Yesterday',
                reading: 'Sleep: 7.8 hours',
                status: 'Good',
              },
              {
                time: '2 days ago',
                reading: 'Heart Rate: 75 bpm',
                status: 'Normal',
              },
            ].map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50"
              >
                <div>
                  <div className="font-medium">{entry.reading}</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.time}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Add Vital Signs Reading</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Heart Rate */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                  <Heart className="w-4 h-4 text-red-500" />
                  Heart Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.heartRate}
                    onChange={(e) =>
                      handleInputChange('heartRate', e.target.value)
                    }
                    placeholder="72"
                    className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                    min="30"
                    max="220"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    bpm
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Normal resting heart rate: 60-100 bpm
                </p>
              </div>

              {/* Blood Pressure */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Blood Pressure
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.systolic}
                      onChange={(e) =>
                        handleInputChange('systolic', e.target.value)
                      }
                      placeholder="120"
                      className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      min="70"
                      max="200"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      systolic
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.diastolic}
                      onChange={(e) =>
                        handleInputChange('diastolic', e.target.value)
                      }
                      placeholder="80"
                      className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      min="40"
                      max="130"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      diastolic
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Normal blood pressure: Below 120/80 mmHg
                </p>
              </div>

              {/* Sleep Hours */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                  <Moon className="w-4 h-4 text-purple-500" />
                  Sleep Duration
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.sleepHours}
                    onChange={(e) =>
                      handleInputChange('sleepHours', e.target.value)
                    }
                    placeholder="8.0"
                    className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    min="0"
                    max="24"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    hours
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 7-9 hours per night for adults
                </p>
              </div>

              {/* Energy Level */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Energy Level
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.energyLevel}
                    onChange={(e) =>
                      handleInputChange('energyLevel', e.target.value)
                    }
                    placeholder="85"
                    className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    min="0"
                    max="100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Low (0-33)</span>
                  <span>Moderate (34-66)</span>
                  <span>High (67-100)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-muted/50 hover:bg-muted rounded-xl font-semibold transition-all duration-300"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
