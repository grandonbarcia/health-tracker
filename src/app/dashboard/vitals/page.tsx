'use client';

import { Activity, ArrowLeft, Heart, Moon, Zap, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VitalReading {
  id: string;
  user_id: string;
  reading_date: string;
  heart_rate: number | null;
  systolic: number | null;
  diastolic: number | null;
  sleep_hours: number | null;
  energy_level: number | null;
  reading_time: string | null;
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
  const [todaysReadings, setTodaysReadings] = useState<VitalReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyVitals, setWeeklyVitals] = useState<{
    heartRates: number[];
    systolic: number[];
    diastolic: number[];
    sleepHours: number[];
  }>({
    heartRates: [],
    systolic: [],
    diastolic: [],
    sleepHours: [],
  });
  const [weeklyLabels, setWeeklyLabels] = useState<string[]>([]);

  useEffect(() => {
    loadTodaysVitals();
    loadTodaysReadings();
    loadWeeklyVitals();
  }, []);

  const loadTodaysVitals = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Get today's most recent vitals reading
      const { data, error } = await supabase
        .from('user_vitals')
        .select('*')
        .eq('user_id', user.id)
        .eq('reading_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
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

  const loadTodaysReadings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Get all readings for today, ordered by time (with fallback to created_at)
      const { data, error } = await supabase
        .from('user_vitals')
        .select('*')
        .eq('user_id', user.id)
        .eq('reading_date', today)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error loading today's readings:", error);
        return;
      }

      // Sort by reading_time if available, otherwise by created_at
      const sortedData = (data || []).sort((a, b) => {
        const timeA = a.reading_time || a.created_at;
        const timeB = b.reading_time || b.created_at;
        return timeA.localeCompare(timeB);
      });

      setTodaysReadings(sortedData);
    } catch (error) {
      console.error("Error loading today's readings:", error);
    }
  };

  const loadWeeklyVitals = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 7 days with their actual day names
      const last7DaysData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          dateString: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        };
      });

      const last7Days = last7DaysData.map((d) => d.dateString);
      const labels = last7DaysData.map((d) => `${d.dayName}\n${d.fullDate}`);

      // Query user_vitals for the last 7 days
      const { data: vitalsData, error } = await supabase
        .from('user_vitals')
        .select('*')
        .eq('user_id', user.id)
        .in('reading_date', last7Days)
        .order('reading_date', { ascending: true });

      if (error) throw error;

      // Map to daily values
      const heartRates = last7Days.map((date) => {
        const vitals = vitalsData?.find((v) => v.reading_date === date);
        return vitals?.heart_rate || 0;
      });

      const systolic = last7Days.map((date) => {
        const vitals = vitalsData?.find((v) => v.reading_date === date);
        return vitals?.systolic || 0;
      });

      const diastolic = last7Days.map((date) => {
        const vitals = vitalsData?.find((v) => v.reading_date === date);
        return vitals?.diastolic || 0;
      });

      const sleepHours = last7Days.map((date) => {
        const vitals = vitalsData?.find((v) => v.reading_date === date);
        return vitals?.sleep_hours || 0;
      });

      setWeeklyVitals({ heartRates, systolic, diastolic, sleepHours });
      setWeeklyLabels(labels);
    } catch (error) {
      console.error('Error loading weekly vitals:', error);
      setWeeklyVitals({
        heartRates: new Array(7).fill(0),
        systolic: new Array(7).fill(0),
        diastolic: new Array(7).fill(0),
        sleepHours: new Array(7).fill(0),
      });
      setWeeklyLabels([]);
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

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format

      const vitalRecord = {
        user_id: user.id,
        reading_date: today,
        reading_time: currentTime,
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

      // Insert new reading (allows multiple readings per day)
      const { error } = await supabase.from('user_vitals').insert(vitalRecord);

      if (error) {
        console.error('Error saving vitals:', error);
        alert('Failed to save vitals. Please try again.');
        return;
      }

      // Reload data
      await loadTodaysVitals();
      await loadTodaysReadings();
      await loadWeeklyVitals();

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
          <div className="space-y-8">
            {/* Heart Rate Chart */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Heart Rate (bpm)
              </h3>
              <div className="h-64">
                <Line
                  data={{
                    labels:
                      weeklyLabels.length > 0
                        ? weeklyLabels
                        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                      {
                        label: 'Heart Rate',
                        data: weeklyVitals.heartRates,
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'rgb(239, 68, 68)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        callbacks: {
                          label: (context) => {
                            const value = context.parsed.y;
                            return value && value > 0
                              ? `${value} bpm`
                              : 'No data';
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                          font: { size: 12 },
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          font: { size: 12 },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Blood Pressure Chart */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Blood Pressure (mmHg)
              </h3>
              <div className="h-64">
                <Line
                  data={{
                    labels:
                      weeklyLabels.length > 0
                        ? weeklyLabels
                        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                      {
                        label: 'Systolic',
                        data: weeklyVitals.systolic,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                      },
                      {
                        label: 'Diastolic',
                        data: weeklyVitals.diastolic,
                        borderColor: 'rgb(147, 197, 253)',
                        backgroundColor: 'rgba(147, 197, 253, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: 'rgb(147, 197, 253)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: { size: 12 },
                        },
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        callbacks: {
                          label: (context) => {
                            const value = context.parsed.y;
                            return value && value > 0
                              ? `${context.dataset.label}: ${value} mmHg`
                              : 'No data';
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                          font: { size: 12 },
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          font: { size: 12 },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Sleep Hours Chart */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Sleep Hours
              </h3>
              <div className="h-64">
                <Line
                  data={{
                    labels:
                      weeklyLabels.length > 0
                        ? weeklyLabels
                        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                      {
                        label: 'Sleep Hours',
                        data: weeklyVitals.sleepHours,
                        borderColor: 'rgb(168, 85, 247)',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'rgb(168, 85, 247)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        callbacks: {
                          label: (context) => {
                            const value = context.parsed.y;
                            return value && value > 0
                              ? `${value.toFixed(1)} hours`
                              : 'No data';
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 12,
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                          font: { size: 12 },
                          stepSize: 2,
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          font: { size: 12 },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
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
