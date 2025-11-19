'use client';
import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Dumbbell,
  Activity,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  WorkoutStats as WorkoutStatsType,
  WorkoutTrend,
} from '../types/workouts';

interface Props {
  currentUser: any;
}

export default function WorkoutStats({ currentUser }: Props) {
  const [stats, setStats] = useState<WorkoutStatsType | null>(null);
  const [trends, setTrends] = useState<WorkoutTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('30');

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser, timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = currentUser?.session?.access_token;
      if (!token) return;

      // Calculate date range
      const params = new URLSearchParams();
      if (timeRange !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(timeRange));

        params.append('startDate', startDate.toISOString().split('T')[0]);
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/workouts/stats?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
      setTrends(data.weekly_trends || []);
    } catch (error) {
      console.error('Error fetching workout stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data for weekly trends
  const chartData = {
    labels: trends.map((t) => {
      const date = new Date(t.date);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }),
    datasets: [
      {
        label: 'Volume (lbs)',
        data: trends.map((t) => t.total_volume),
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'Workouts',
        data: trends.map((t) => t.workout_count),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Volume (lbs)',
          color: 'rgb(168, 85, 247)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Workouts',
          color: 'rgb(34, 197, 94)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: 'white',
        bodyColor: 'white',
      },
    },
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-foreground">
              Workout Statistics
            </h3>
          </div>

          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-1 bg-background text-foreground border border-border rounded-lg text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>

            <Button
              onClick={() => setExpanded(!expanded)}
              variant="ghost"
              size="sm"
            >
              {expanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading statistics...
            </div>
          ) : !stats || stats.total_workouts === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No workout data available for the selected period.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">
                      Total Workouts
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.total_workouts}
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">
                      Total Volume
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.total_volume.toLocaleString()}
                    <span className="text-sm text-muted-foreground ml-1">
                      lbs
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">
                      Total Sets
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.total_sets}
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-muted-foreground">
                      Total Reps
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.total_reps.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Chart */}
              {trends.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Weekly Trends
                  </h4>
                  <div className="h-64 bg-muted rounded-lg p-4">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </div>
              )}

              {/* Most Frequent Exercises */}
              {stats.most_frequent_exercises.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Most Frequent Exercises
                  </h4>
                  <div className="space-y-2">
                    {stats.most_frequent_exercises
                      .slice(0, 5)
                      .map((exercise, index) => (
                        <div
                          key={exercise.exercise_name}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {exercise.exercise_name}
                            </span>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>{exercise.count} times</span>
                            {exercise.total_volume > 0 && (
                              <span>
                                {exercise.total_volume.toLocaleString()} lbs
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Average Duration */}
              {stats.average_duration && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Average Workout Duration
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {stats.average_duration} minutes
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
