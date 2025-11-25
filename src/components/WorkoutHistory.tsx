'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from './ui/button';
import WorkoutCard from './WorkoutCard';
import WorkoutEntry from './WorkoutEntry';
import { Workout } from '../types/workouts';
import { getTodayDate } from '../lib/workoutUtils';
import { supabase } from '@/lib/supabaseClient';

interface Props {
  currentUser: any;
}

export default function WorkoutHistory({ currentUser }: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (currentUser) {
      fetchWorkouts();
    }
  }, [currentUser, startDate, endDate, limit]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const token = session.access_token;

      // Build query params
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/workouts?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch workouts');

      const data = await response.json();
      setWorkouts(data.workouts || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const token = session.access_token;

      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete workout');

      fetchWorkouts();
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Failed to delete workout');
    }
  };

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setShowEntryModal(true);
  };

  const handleEntrySuccess = () => {
    fetchWorkouts();
    setEditingWorkout(null);
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Workout History</h3>
              <span className="text-sm text-muted-foreground">
                ({workouts.length}{' '}
                {workouts.length === 1 ? 'workout' : 'workouts'})
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>

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

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Limit
                  </label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm"
                  >
                    <option value={5}>5 workouts</option>
                    <option value={10}>10 workouts</option>
                    <option value={25}>25 workouts</option>
                    <option value={50}>50 workouts</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setLimit(10);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {expanded && (
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading workouts...
              </div>
            ) : workouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No workouts found. Start logging your workouts!
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onEdit={() => handleEdit(workout)}
                    onDelete={() => handleDelete(workout.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entry Modal */}
      <WorkoutEntry
        open={showEntryModal}
        onOpenChange={(open) => {
          setShowEntryModal(open);
          if (!open) setEditingWorkout(null);
        }}
        currentUser={currentUser}
        editingWorkout={editingWorkout}
        onSuccess={handleEntrySuccess}
      />
    </>
  );
}
