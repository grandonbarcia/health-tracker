'use client';
import { Dumbbell, Calendar, Clock, Trash2, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Workout } from '../types/workouts';
import { formatDate, formatDuration, formatReps } from '../lib/workoutUtils';

interface Props {
  workout: Workout;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function WorkoutCard({ workout, onEdit, onDelete }: Props) {
  // Calculate totals
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const totalVolume = workout.exercises.reduce((sum, ex) => {
    const reps = ex.reps_per_set.reduce((r, num) => r + num, 0);
    return sum + (ex.weight_lbs ? reps * ex.weight_lbs : 0);
  }, 0);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-foreground">
              {workout.workout_name}
            </h3>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(workout.date)}</span>
            </div>
            {workout.duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(workout.duration_minutes)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          {onEdit && (
            <Button
              onClick={onEdit}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={onDelete}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-border">
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">
            {workout.exercises.length}
          </div>
          <div className="text-xs text-muted-foreground">Exercises</div>
        </div>
        <div className="text-center border-x border-border">
          <div className="text-lg font-semibold text-foreground">
            {totalSets}
          </div>
          <div className="text-xs text-muted-foreground">Total Sets</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">
            {totalVolume > 0 ? totalVolume.toLocaleString() : '-'}
          </div>
          <div className="text-xs text-muted-foreground">Volume (lbs)</div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-2">
        {workout.exercises.map((exercise, index) => (
          <div key={exercise.id || index} className="p-3 bg-muted rounded-lg">
            <div className="flex items-start justify-between mb-1">
              <span className="font-medium text-foreground text-sm">
                {exercise.exercise_name}
              </span>
              {exercise.weight_lbs && (
                <span className="text-sm text-muted-foreground">
                  {exercise.weight_lbs} lbs
                </span>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {exercise.sets} sets × {formatReps(exercise.reps_per_set)} reps
            </div>

            {exercise.notes && (
              <div className="text-xs text-muted-foreground mt-1 italic">
                {exercise.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Workout Notes */}
      {workout.notes && (
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground italic">
            {workout.notes}
          </p>
        </div>
      )}
    </div>
  );
}
