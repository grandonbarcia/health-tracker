'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Dumbbell, Plus, X, GripVertical, Trash2 } from 'lucide-react';
import { WorkoutInput, ExerciseInput } from '../types/workouts';
import {
  validateWorkout,
  getTodayDate,
  SUGGESTED_WORKOUT_NAMES,
  getAllExerciseNames,
} from '../lib/workoutUtils';
import { supabase } from '../lib/supabaseClient';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
  selectedDate?: string;
  editingWorkout?: any;
  onSuccess: () => void;
}

export default function WorkoutEntry({
  open,
  onOpenChange,
  currentUser,
  selectedDate,
  editingWorkout,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [date, setDate] = useState(selectedDate || getTodayDate());
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseInput[]>([]);

  const [exerciseNames] = useState(getAllExerciseNames());

  // Initialize form when editing
  useEffect(() => {
    if (editingWorkout) {
      setDate(editingWorkout.date);
      setWorkoutName(editingWorkout.workout_name);
      setDuration(editingWorkout.duration_minutes);
      setNotes(editingWorkout.notes || '');
      setExercises(
        editingWorkout.exercises.map((ex: any) => ({
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps_per_set: ex.reps_per_set,
          weight_lbs: ex.weight_lbs,
          notes: ex.notes || '',
          order_index: ex.order_index,
        }))
      );
    } else {
      resetForm();
    }
  }, [editingWorkout, selectedDate]);

  const resetForm = () => {
    setDate(selectedDate || getTodayDate());
    setWorkoutName('');
    setDuration(undefined);
    setNotes('');
    setExercises([createNewExercise()]);
    setErrors({});
  };

  const createNewExercise = (): ExerciseInput => ({
    exercise_name: '',
    sets: 3,
    reps_per_set: [10, 10, 10],
    weight_lbs: undefined,
    notes: '',
  });

  const addExercise = () => {
    setExercises([...exercises, createNewExercise()]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const updateExercise = (
    index: number,
    field: keyof ExerciseInput,
    value: any
  ) => {
    const updated = [...exercises];

    if (field === 'sets') {
      const newSets = Math.max(1, Math.min(20, parseInt(value) || 1));
      updated[index].sets = newSets;

      // Adjust reps array to match sets count
      const currentReps = updated[index].reps_per_set;
      if (currentReps.length < newSets) {
        // Add more reps (default to 10)
        updated[index].reps_per_set = [
          ...currentReps,
          ...Array(newSets - currentReps.length).fill(10),
        ];
      } else if (currentReps.length > newSets) {
        // Remove extra reps
        updated[index].reps_per_set = currentReps.slice(0, newSets);
      }
    } else {
      (updated[index] as any)[field] = value;
    }

    setExercises(updated);
  };

  const updateReps = (
    exerciseIndex: number,
    setIndex: number,
    reps: number
  ) => {
    const updated = [...exercises];
    updated[exerciseIndex].reps_per_set[setIndex] = Math.max(
      1,
      Math.min(500, reps)
    );
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Build workout data
      const workoutData: WorkoutInput = {
        date,
        workout_name: workoutName,
        duration_minutes: duration,
        notes,
        exercises: exercises.map((ex, index) => ({
          ...ex,
          order_index: index,
        })),
      };

      // Validate
      const validation = validateWorkout(workoutData);
      if (!validation.valid) {
        setErrors({ general: validation.error || 'Validation failed' });
        setLoading(false);
        return;
      }

      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }
      const token = session.access_token;

      // Submit to API
      const url = editingWorkout
        ? `/api/workouts/${editingWorkout.id}`
        : '/api/workouts';
      const method = editingWorkout ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(workoutData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save workout');
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving workout:', error);
      setErrors({ general: error.message || 'Failed to save workout' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-purple-500" />
            {editingWorkout ? 'Edit Workout' : 'Log Workout'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-4 px-1">
            {/* Error Message */}
            {errors.general && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {errors.general}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration || ''}
                  onChange={(e) =>
                    setDuration(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="Optional"
                  min="1"
                  max="600"
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg placeholder-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Workout Name
              </label>
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g., Push Day, Leg Day"
                list="workout-names"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg placeholder-muted-foreground"
                required
              />
              <datalist id="workout-names">
                {SUGGESTED_WORKOUT_NAMES.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Exercises
                </label>
                <Button
                  type="button"
                  onClick={addExercise}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Exercise
                </Button>
              </div>

              <div className="space-y-3">
                {exercises.map((exercise, exerciseIndex) => (
                  <div
                    key={exerciseIndex}
                    className="p-4 bg-muted border border-border rounded-lg space-y-3"
                  >
                    {/* Exercise Header */}
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />

                      <div className="flex-1 space-y-3">
                        {/* Exercise Name */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Exercise
                          </label>
                          <input
                            type="text"
                            value={exercise.exercise_name}
                            onChange={(e) =>
                              updateExercise(
                                exerciseIndex,
                                'exercise_name',
                                e.target.value
                              )
                            }
                            placeholder="e.g., Bench Press"
                            list="exercise-names"
                            className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm placeholder-muted-foreground"
                            required
                          />
                        </div>

                        {/* Sets, Weight */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Sets
                            </label>
                            <input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) =>
                                updateExercise(
                                  exerciseIndex,
                                  'sets',
                                  e.target.value
                                )
                              }
                              min="1"
                              max="20"
                              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Weight (lbs)
                            </label>
                            <input
                              type="number"
                              value={exercise.weight_lbs || ''}
                              onChange={(e) =>
                                updateExercise(
                                  exerciseIndex,
                                  'weight_lbs',
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined
                                )
                              }
                              placeholder="Optional"
                              min="0"
                              max="2000"
                              step="0.5"
                              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm placeholder-muted-foreground"
                            />
                          </div>
                        </div>

                        {/* Reps per Set */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Reps per Set
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {exercise.reps_per_set.map((reps, setIndex) => (
                              <input
                                key={setIndex}
                                type="number"
                                value={reps}
                                onChange={(e) =>
                                  updateReps(
                                    exerciseIndex,
                                    setIndex,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                min="1"
                                max="500"
                                placeholder={`Set ${setIndex + 1}`}
                                className="w-full px-2 py-2 bg-background text-foreground border border-border rounded-lg text-sm text-center"
                                required
                              />
                            ))}
                          </div>
                        </div>

                        {/* Exercise Notes */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={exercise.notes || ''}
                            onChange={(e) =>
                              updateExercise(
                                exerciseIndex,
                                'notes',
                                e.target.value
                              )
                            }
                            placeholder="Optional notes"
                            className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm placeholder-muted-foreground"
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      {exercises.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeExercise(exerciseIndex)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workout Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Workout Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did you feel? Any observations?"
                rows={3}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg resize-none placeholder-muted-foreground"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
              >
                {loading
                  ? 'Saving...'
                  : editingWorkout
                  ? 'Update Workout'
                  : 'Save Workout'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>

        {/* Exercise Names Datalist */}
        <datalist id="exercise-names">
          {exerciseNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </DialogContent>
    </Dialog>
  );
}
