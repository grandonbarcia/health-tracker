'use client';

import {
  Dumbbell,
  ArrowLeft,
  Flame,
  Trophy,
  Target,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Line } from 'react-chartjs-2';
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

interface Workout {
  id: string;
  workout_date: string;
  workout_type: string;
  duration_minutes: number;
  calories_burned: number | null;
  notes: string | null;
  created_at: string;
}

interface Exercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  duration_minutes: number | null;
  distance: number | null;
  exercise_order: number;
}

interface ExerciseGoal {
  id: string;
  user_id: string;
  goal_type: 'steps' | 'workout_days' | 'calories' | 'workout_duration';
  goal_name: string;
  target_value: number;
  time_period: 'daily' | 'weekly';
  is_active: boolean;
  created_at: string;
}

interface GoalProgress {
  goal: ExerciseGoal;
  currentValue: number;
  progress: number;
  status: 'Completed' | 'In Progress';
}

export default function ExercisePage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [todayStats, setTodayStats] = useState({
    duration: 0,
    calories: 0,
  });
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);

  // Initialize with 7 days of empty data to ensure chart always renders
  const getInitialWeeklyActivity = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activities = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayName = dayNames[date.getDay()];
      activities.push({
        day: dayName,
        minutes: 0,
        value: 5, // Minimum height for visibility
      });
    }
    return activities;
  };

  const [weeklyActivity, setWeeklyActivity] = useState<
    Array<{ day: string; value: number; minutes: number }>
  >(getInitialWeeklyActivity());
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [stepsFormData, setStepsFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    steps: '',
  });
  const [weeklySteps, setWeeklySteps] = useState<
    Array<{ day: string; steps: number }>
  >([]);
  const [todaySteps, setTodaySteps] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<
    Record<string, Exercise[]>
  >({});
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [goals, setGoals] = useState<ExerciseGoal[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [completedGoalsCount, setCompletedGoalsCount] = useState(0);
  const [goalFormData, setGoalFormData] = useState({
    goalType: 'steps' as
      | 'steps'
      | 'workout_days'
      | 'calories'
      | 'workout_duration',
    goalName: '',
    targetValue: '',
    timePeriod: 'daily' as 'daily' | 'weekly',
  });
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const [formData, setFormData] = useState({
    workoutDate: new Date().toISOString().split('T')[0],
    workoutType: 'Strength',
    duration: '',
    calories: '',
    notes: '',
  });

  const [exercises, setExercises] = useState<
    Array<{
      name: string;
      sets: string;
      reps: string;
      weight: string;
    }>
  >([]);

  useEffect(() => {
    loadWorkouts();
    loadTodayStats();
    loadWeeklyStats();
    loadWeeklySteps();
    loadGoals();
  }, []);

  const loadWorkouts = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodayStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_workouts')
        .select('duration_minutes, calories_burned')
        .eq('user_id', user.id)
        .eq('workout_date', today);

      if (error) throw error;

      const totalDuration =
        data?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0;
      const totalCalories =
        data?.reduce((sum, w) => sum + (w.calories_burned || 0), 0) || 0;

      setTodayStats({ duration: totalDuration, calories: totalCalories });
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  const loadWorkoutExercises = async (workoutId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_exercises')
        .select('*')
        .eq('workout_id', workoutId)
        .order('exercise_order', { ascending: true });

      if (error) throw error;

      setWorkoutExercises((prev) => ({
        ...prev,
        [workoutId]: data || [],
      }));
    } catch (error) {
      console.error('Error loading workout exercises:', error);
    }
  };

  const loadWeeklyStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, cannot load weekly stats');
        // Set empty activity data when no user
        setWeeklyActivity(getInitialWeeklyActivity());
        setWeeklyWorkouts(0);
        return;
      }

      // Get date 7 days ago (last 7 days including today)
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      // Use local date to avoid timezone issues
      const year = sevenDaysAgo.getFullYear();
      const month = String(sevenDaysAgo.getMonth() + 1).padStart(2, '0');
      const day = String(sevenDaysAgo.getDate()).padStart(2, '0');
      const startDate = `${year}-${month}-${day}`;

      console.log(
        `Fetching workouts from ${startDate} to today from Supabase...`
      );

      // Fetch workout data from Supabase database
      const { data: workoutData, error } = await supabase
        .from('user_workouts')
        .select('workout_date, duration_minutes')
        .eq('user_id', user.id)
        .gte('workout_date', startDate)
        .order('workout_date', { ascending: true });

      if (error) {
        console.error('Supabase error loading workouts:', error);
        throw error;
      }

      console.log(
        '✅ Loaded workout data from Supabase database:',
        workoutData
      );
      console.log(
        `Found ${workoutData?.length || 0} workout records in last 7 days`
      );

      // Count unique workout days from database
      const uniqueDays = new Set(workoutData?.map((w) => w.workout_date) || [])
        .size;
      setWeeklyWorkouts(uniqueDays);

      // Build activity chart data for last 7 days based on database records
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const activityData = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        // Use local date to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const dayName = dayNames[date.getDay()];

        // Filter workouts from database for this specific day
        const dayWorkouts =
          workoutData?.filter((w) => w.workout_date === dateStr) || [];

        // Sum total minutes from database records for this day
        const totalMinutes = dayWorkouts.reduce(
          (sum, w) => sum + (Number(w.duration_minutes) || 0),
          0
        );

        activityData.push({
          day: dayName,
          minutes: totalMinutes,
          value:
            totalMinutes > 0
              ? Math.max(Math.min((totalMinutes / 60) * 100, 100), 10)
              : 5, // Min 5% for empty, 10% for data
        });

        if (totalMinutes > 0) {
          console.log(`  ${dayName} (${dateStr}): ${totalMinutes} minutes`);
        }
      }

      console.log('📊 Weekly activity chart data:', activityData);
      setWeeklyActivity(activityData);
    } catch (error) {
      console.error('❌ Error loading weekly stats from database:', error);
      // Keep initial structure on error
      setWeeklyActivity(getInitialWeeklyActivity());
      setWeeklyWorkouts(0);
    }
  };

  const loadWeeklySteps = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setWeeklySteps([]);
        setTodaySteps(0);
        return;
      }

      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];

      // Fetch steps data from Supabase
      const { data: stepsData, error } = await supabase
        .from('user_steps')
        .select('step_date, step_count')
        .eq('user_id', user.id)
        .gte('step_date', startDate)
        .order('step_date', { ascending: true });

      if (error) {
        console.error('Error loading steps from database:', error);
        console.log(
          'Note: If the table does not exist, run the SQL script: scripts/create-steps-table.sql'
        );
        // Set empty data instead of returning early
        setWeeklySteps([]);
        setTodaySteps(0);
        return;
      }

      console.log('✅ Loaded steps data from database:', stepsData);

      // Build weekly steps data
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const stepsArray = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = dayNames[date.getDay()];

        const daySteps = stepsData?.find((s) => s.step_date === dateStr);
        const stepCount = daySteps?.step_count || 0;

        stepsArray.push({
          day: dayName,
          steps: stepCount,
        });
      }

      setWeeklySteps(stepsArray);

      // Get today's steps
      const todayStr = today.toISOString().split('T')[0];
      const todayData = stepsData?.find((s) => s.step_date === todayStr);
      setTodaySteps(todayData?.step_count || 0);
    } catch (error) {
      console.error('Error loading weekly steps:', error);
    }
  };

  const loadGoals = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: goalsData, error } = await supabase
        .from('user_exercise_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading goals:', error);
        console.log(
          'Note: Run scripts/create-exercise-goals-table.sql to create the goals table'
        );
        return;
      }

      setGoals(goalsData || []);

      // Calculate progress for each goal
      if (goalsData && goalsData.length > 0) {
        await calculateGoalProgress(goalsData, user.id);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const calculateGoalProgress = async (
    goalsData: ExerciseGoal[],
    userId: string
  ) => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Get start of week (Sunday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const weekStartStr = startOfWeek.toISOString().split('T')[0];

      // Fetch all necessary data for progress calculation
      const [stepsResult, workoutsResult] = await Promise.all([
        supabase
          .from('user_steps')
          .select('step_date, step_count')
          .eq('user_id', userId)
          .gte('step_date', weekStartStr),
        supabase
          .from('user_workouts')
          .select('workout_date, duration_minutes, calories_burned')
          .eq('user_id', userId)
          .gte('workout_date', weekStartStr),
      ]);

      const stepsData = stepsResult.data || [];
      const workoutsData = workoutsResult.data || [];

      // Calculate progress for each goal
      const progressData: GoalProgress[] = goalsData.map((goal) => {
        let currentValue = 0;

        if (goal.time_period === 'daily') {
          // Daily goals - only count today's data
          switch (goal.goal_type) {
            case 'steps':
              const todaySteps = stepsData.find(
                (s) => s.step_date === todayStr
              );
              currentValue = todaySteps?.step_count || 0;
              break;
            case 'workout_days':
              const todayWorkouts = workoutsData.filter(
                (w) => w.workout_date === todayStr
              );
              currentValue = todayWorkouts.length > 0 ? 1 : 0;
              break;
            case 'calories':
              const todayCals = workoutsData
                .filter((w) => w.workout_date === todayStr)
                .reduce((sum, w) => sum + (w.calories_burned || 0), 0);
              currentValue = todayCals;
              break;
            case 'workout_duration':
              const todayDuration = workoutsData
                .filter((w) => w.workout_date === todayStr)
                .reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
              currentValue = todayDuration;
              break;
          }
        } else {
          // Weekly goals - count this week's data
          switch (goal.goal_type) {
            case 'steps':
              currentValue = stepsData.reduce(
                (sum, s) => sum + (s.step_count || 0),
                0
              );
              break;
            case 'workout_days':
              const uniqueDays = new Set(
                workoutsData.map((w) => w.workout_date)
              );
              currentValue = uniqueDays.size;
              break;
            case 'calories':
              currentValue = workoutsData.reduce(
                (sum, w) => sum + (w.calories_burned || 0),
                0
              );
              break;
            case 'workout_duration':
              currentValue = workoutsData.reduce(
                (sum, w) => sum + (w.duration_minutes || 0),
                0
              );
              break;
          }
        }

        const progress = Math.min(
          (currentValue / goal.target_value) * 100,
          100
        );
        const status = progress >= 100 ? 'Completed' : 'In Progress';

        return { goal, currentValue, progress, status };
      });

      setGoalProgress(progressData);

      // Count completed goals
      const completed = progressData.filter(
        (p) => p.status === 'Completed'
      ).length;
      setCompletedGoalsCount(completed);
    } catch (error) {
      console.error('Error calculating goal progress:', error);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGoal(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to save goals');
        return;
      }

      const { error } = await supabase.from('user_exercise_goals').insert({
        user_id: user.id,
        goal_type: goalFormData.goalType,
        goal_name: goalFormData.goalName,
        target_value: parseInt(goalFormData.targetValue),
        time_period: goalFormData.timePeriod,
        is_active: true,
      });

      if (error) throw error;

      // Reset form and close modal
      setGoalFormData({
        goalType: 'steps',
        goalName: '',
        targetValue: '',
        timePeriod: 'daily',
      });
      setShowGoalsModal(false);

      // Reload goals
      await loadGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal. Please try again.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await supabase
        .from('user_exercise_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      // Reload goals
      await loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'steps':
        return 'steps';
      case 'workout_days':
        return 'days';
      case 'calories':
        return 'calories';
      case 'workout_duration':
        return 'minutes';
      default:
        return '';
    }
  };

  const handleSaveSteps = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to save steps');
        return;
      }

      const stepCount = parseInt(stepsFormData.steps);

      // Check if entry exists for this date
      const { data: existing } = await supabase
        .from('user_steps')
        .select('id')
        .eq('user_id', user.id)
        .eq('step_date', stepsFormData.date)
        .single();

      if (existing) {
        // Update existing entry
        const { error } = await supabase
          .from('user_steps')
          .update({ step_count: stepCount })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new entry
        const { error } = await supabase.from('user_steps').insert({
          user_id: user.id,
          step_date: stepsFormData.date,
          step_count: stepCount,
        });

        if (error) throw error;
      }

      // Reset form and close modal
      setStepsFormData({
        date: new Date().toISOString().split('T')[0],
        steps: '',
      });
      setShowStepsModal(false);

      // Reload steps data
      await loadWeeklySteps();
    } catch (error) {
      console.error('Error saving steps:', error);
      alert('Failed to save steps. Please try again.');
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;

    try {
      const { error } = await supabase
        .from('user_workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;

      // Reload all data
      await loadWorkouts();
      await loadTodayStats();
      await loadWeeklyStats();
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Failed to delete workout. Please try again.');
    }
  };

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight: '' }]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to save workouts');
        return;
      }

      // Insert workout
      const { data: workout, error: workoutError } = await supabase
        .from('user_workouts')
        .insert({
          user_id: user.id,
          workout_date: formData.workoutDate,
          workout_type: formData.workoutType,
          duration_minutes: parseInt(formData.duration),
          calories_burned: formData.calories
            ? parseInt(formData.calories)
            : null,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Insert exercises if any
      if (exercises.length > 0 && workout) {
        const exerciseRecords = exercises
          .filter((ex) => ex.name.trim())
          .map((ex, index) => ({
            workout_id: workout.id,
            exercise_name: ex.name,
            sets: ex.sets ? parseInt(ex.sets) : null,
            reps: ex.reps ? parseInt(ex.reps) : null,
            weight: ex.weight ? parseFloat(ex.weight) : null,
            exercise_order: index + 1,
          }));

        if (exerciseRecords.length > 0) {
          const { error: exerciseError } = await supabase
            .from('user_exercises')
            .insert(exerciseRecords);

          if (exerciseError) throw exerciseError;
        }
      }

      // Reset form
      setFormData({
        workoutDate: new Date().toISOString().split('T')[0],
        workoutType: 'Strength',
        duration: '',
        calories: '',
        notes: '',
      });
      setExercises([]);
      setShowModal(false);

      // Reload workouts and stats
      await loadWorkouts();
      await loadTodayStats();
      await loadWeeklyStats();
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-muted/50 rounded-lg transition-all duration-300 hover:scale-110 hover:-translate-x-1"
          >
            <ArrowLeft className="w-7 h-7" strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              Exercise & Activity
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your workouts and daily activity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStepsModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Log Steps
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Log Workout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Steps */}
          <div
            onClick={() => setShowStepsModal(true)}
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-lg cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="text-sm text-muted-foreground mb-2">
              Today's Steps
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              {todaySteps.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {todaySteps >= 10000
                ? '✅ Goal reached!'
                : `${10000 - todaySteps} to goal`}
            </div>
          </div>

          {/* Calories */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <div className="text-sm text-muted-foreground">
                Calories Burned
              </div>
            </div>
            <div className="text-4xl font-bold">{todayStats.calories}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Today's total
            </div>
          </div>

          {/* Workout Time */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-purple-500" />
              <div className="text-sm text-muted-foreground">Workout Time</div>
            </div>
            <div className="text-4xl font-bold">{todayStats.duration}</div>
            <div className="text-xs text-muted-foreground mt-2">
              minutes today
            </div>
          </div>

          {/* Weekly Goal */}
          <div
            onClick={() => setShowGoalsModal(true)}
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20 shadow-lg cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-green-500" />
              <div className="text-sm text-muted-foreground">
                Goals Completed
              </div>
            </div>
            <div className="text-4xl font-bold">
              {completedGoalsCount}/{goals.length || 0}
            </div>
            <div
              className={`text-xs mt-2 ${
                goals.length > 0 && completedGoalsCount === goals.length
                  ? 'text-green-500'
                  : 'text-muted-foreground'
              }`}
            >
              {goals.length === 0
                ? 'Set your goals'
                : completedGoalsCount === goals.length
                ? 'All goals reached!'
                : 'goals this period'}
            </div>
          </div>
        </div>

        {/* Activity Chart - Chart.js Line Graph */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
          <h2 className="text-xl font-semibold mb-6">Weekly Activity</h2>
          <div className="h-64">
            <Line
              data={{
                labels: weeklyActivity.map((d) => d.day),
                datasets: [
                  {
                    label: 'Workout Minutes',
                    data: weeklyActivity.map((d) => d.minutes),
                    borderColor: 'rgb(139, 92, 246)',
                    backgroundColor: (context) => {
                      const ctx = context.chart.ctx;
                      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
                      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
                      return gradient;
                    },
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: weeklyActivity.map((d) =>
                      d.minutes === 0
                        ? 'rgb(156, 163, 175)'
                        : d.minutes >= 60
                        ? 'rgb(16, 185, 129)'
                        : d.minutes >= 30
                        ? 'rgb(6, 182, 212)'
                        : 'rgb(245, 158, 11)'
                    ),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
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
                    callbacks: {
                      label: (context) => `${context.parsed.y} minutes`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 120,
                    ticks: {
                      callback: (value) => `${value}m`,
                    },
                    grid: {
                      color: 'rgba(156, 163, 175, 0.2)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Weekly Steps Chart */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
          <h2 className="text-xl font-semibold mb-6">Weekly Steps</h2>
          <div className="h-64">
            {weeklySteps.length > 0 ? (
              <Line
                data={{
                  labels: weeklySteps.map((d) => d.day),
                  datasets: [
                    {
                      label: 'Steps',
                      data: weeklySteps.map((d) => d.steps),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
                        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
                        return gradient;
                      },
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: weeklySteps.map((d) =>
                        d.steps === 0
                          ? 'rgb(156, 163, 175)'
                          : d.steps >= 10000
                          ? 'rgb(34, 197, 94)'
                          : d.steps >= 5000
                          ? 'rgb(59, 130, 246)'
                          : 'rgb(245, 158, 11)'
                      ),
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointRadius: 6,
                      pointHoverRadius: 8,
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
                      callbacks: {
                        label: (context) =>
                          `${(context.parsed.y ?? 0).toLocaleString()} steps`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: Math.max(...weeklySteps.map((d) => d.steps), 15000),
                      ticks: {
                        callback: (value) =>
                          `${(value as number).toLocaleString()}`,
                      },
                      grid: {
                        color: 'rgba(156, 163, 175, 0.2)',
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="mb-2">No steps data yet</p>
                  <p className="text-sm">Click "Log Steps" to start tracking</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Workout History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Workouts */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Recent Workouts</h2>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : workouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg mb-2">No workouts logged yet</p>
                <p className="text-sm">
                  Click "Log Workout" to add your first workout
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {workouts.map((workout) => {
                  const workoutDate = new Date(workout.workout_date);
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);

                  let timeDisplay = '';
                  if (workoutDate.toDateString() === today.toDateString()) {
                    timeDisplay = 'Today';
                  } else if (
                    workoutDate.toDateString() === yesterday.toDateString()
                  ) {
                    timeDisplay = 'Yesterday';
                  } else {
                    timeDisplay = workoutDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }

                  const isExpanded = expandedWorkout === workout.id;
                  const exercises = workoutExercises[workout.id];

                  return (
                    <div
                      key={workout.id}
                      className="p-4 bg-muted/20 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-semibold">
                            {workout.workout_type}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {workout.duration_minutes} min
                            {workout.calories_burned &&
                              ` • ${workout.calories_burned} cal`}
                          </div>
                          {workout.notes && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                              {workout.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            {timeDisplay}
                          </div>
                          <button
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete workout"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedWorkout(null);
                          } else {
                            setExpandedWorkout(workout.id);
                            if (!exercises) {
                              loadWorkoutExercises(workout.id);
                            }
                          }
                        }}
                        className="mt-2 text-xs text-blue-500 hover:text-blue-400 transition-colors"
                      >
                        {isExpanded ? 'Hide exercises' : 'View exercises'}
                      </button>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                          {!exercises ? (
                            <div className="text-xs text-muted-foreground">
                              Loading...
                            </div>
                          ) : exercises.length === 0 ? (
                            <div className="text-xs text-muted-foreground">
                              No exercises logged
                            </div>
                          ) : (
                            exercises.map((exercise, idx) => (
                              <div
                                key={exercise.id}
                                className="text-sm p-2 bg-muted/10 rounded-lg"
                              >
                                <div className="font-medium">
                                  {exercise.exercise_name}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {exercise.sets && exercise.reps && (
                                    <span>
                                      {exercise.sets} sets × {exercise.reps}{' '}
                                      reps
                                    </span>
                                  )}
                                  {exercise.weight && (
                                    <span> • {exercise.weight} lbs</span>
                                  )}
                                  {exercise.duration_minutes && (
                                    <span>{exercise.duration_minutes} min</span>
                                  )}
                                  {exercise.distance && (
                                    <span> • {exercise.distance} mi</span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Goals & Achievements */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Goals & Achievements</h2>
              </div>
              <button
                onClick={() => setShowGoalsModal(true)}
                className="px-3 py-1.5 bg-purple-500/10 text-purple-500 rounded-lg text-sm font-medium hover:bg-purple-500/20 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </button>
            </div>
            <div className="space-y-4">
              {goalProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-lg mb-2">No goals set yet</p>
                  <p className="text-sm">
                    Click "Add Goal" to create your first goal
                  </p>
                </div>
              ) : (
                goalProgress.map((item) => (
                  <div key={item.goal.id} className="space-y-2">
                    <div className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <span className="font-medium">
                          {item.goal.goal_name}
                        </span>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {item.currentValue.toLocaleString()} /{' '}
                          {item.goal.target_value.toLocaleString()}{' '}
                          {getGoalTypeLabel(item.goal.goal_type)} (
                          {item.goal.time_period})
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            item.progress >= 100
                              ? 'text-green-500'
                              : 'text-muted-foreground'
                          }
                        >
                          {item.status}
                        </span>
                        <button
                          onClick={() => handleDeleteGoal(item.goal.id)}
                          className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.progress >= 100
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                            : 'bg-gradient-to-r from-purple-500 to-blue-500'
                        } transition-all`}
                        style={{ width: `${Math.min(item.progress, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workout Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Log Workout</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Workout Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Workout Date
                </label>
                <input
                  type="date"
                  value={formData.workoutDate}
                  onChange={(e) =>
                    setFormData({ ...formData, workoutDate: e.target.value })
                  }
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  required
                />
              </div>

              {/* Workout Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Workout Type
                </label>
                <select
                  value={formData.workoutType}
                  onChange={(e) =>
                    setFormData({ ...formData, workoutType: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background dark:bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all text-foreground"
                  required
                >
                  <option
                    value="Strength"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Strength Training
                  </option>
                  <option
                    value="Cardio"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Cardio
                  </option>
                  <option
                    value="Yoga"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Yoga
                  </option>
                  <option
                    value="HIIT"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    HIIT
                  </option>
                  <option
                    value="Sports"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Sports
                  </option>
                  <option
                    value="Flexibility"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Flexibility
                  </option>
                  <option
                    value="Other"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Other
                  </option>
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="45"
                  min="1"
                  className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  required
                />
              </div>

              {/* Calories Burned */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Calories Burned (optional)
                </label>
                <input
                  type="number"
                  value={formData.calories}
                  onChange={(e) =>
                    setFormData({ ...formData, calories: e.target.value })
                  }
                  placeholder="300"
                  min="0"
                  className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Great workout! Felt strong today..."
                  rows={3}
                  className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none"
                />
              </div>

              {/* Exercises Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-muted-foreground uppercase">
                    Exercises (optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddExercise}
                    className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-sm font-medium hover:bg-green-500/20 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Exercise
                  </button>
                </div>

                {exercises.length > 0 && (
                  <div className="space-y-3">
                    {exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="p-4 bg-muted/10 rounded-lg border border-border/50 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={exercise.name}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                'name',
                                e.target.value
                              )
                            }
                            placeholder="Exercise name (e.g., Bench Press)"
                            className="flex-1 px-3 py-2 bg-muted/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(index)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                'sets',
                                e.target.value
                              )
                            }
                            placeholder="Sets"
                            min="0"
                            className="px-3 py-2 bg-muted/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 text-sm"
                          />
                          <input
                            type="number"
                            value={exercise.reps}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                'reps',
                                e.target.value
                              )
                            }
                            placeholder="Reps"
                            min="0"
                            className="px-3 py-2 bg-muted/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 text-sm"
                          />
                          <input
                            type="number"
                            value={exercise.weight}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                'weight',
                                e.target.value
                              )
                            }
                            placeholder="Weight (lbs)"
                            min="0"
                            step="0.5"
                            className="px-3 py-2 bg-muted/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-muted/20 text-muted-foreground rounded-xl font-semibold hover:bg-muted/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Workout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Steps Modal */}
      {showStepsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full border border-border">
            {/* Modal Header */}
            <div className="bg-card border-b border-border p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Log Steps</h2>
              <button
                onClick={() => setShowStepsModal(false)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSteps} className="p-6 space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Date
                </label>
                <input
                  type="date"
                  value={stepsFormData.date}
                  onChange={(e) =>
                    setStepsFormData({ ...stepsFormData, date: e.target.value })
                  }
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  required
                />
              </div>

              {/* Steps Count */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Steps Count
                </label>
                <input
                  type="number"
                  value={stepsFormData.steps}
                  onChange={(e) =>
                    setStepsFormData({
                      ...stepsFormData,
                      steps: e.target.value,
                    })
                  }
                  placeholder="10000"
                  min="0"
                  className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  required
                />
              </div>

              {/* Goal Reference */}
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-sm text-muted-foreground">Daily Goal</div>
                <div className="text-2xl font-bold text-blue-500">
                  10,000 steps
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStepsModal(false)}
                  className="flex-1 px-6 py-3 bg-muted/20 text-muted-foreground rounded-xl font-semibold hover:bg-muted/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Save Steps
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goals Modal */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full border border-border">
            {/* Modal Header */}
            <div className="bg-card border-b border-border p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Set Exercise Goal</h2>
              <button
                onClick={() => setShowGoalsModal(false)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveGoal} className="p-6 space-y-6">
              {/* Goal Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={goalFormData.goalName}
                  onChange={(e) =>
                    setGoalFormData({
                      ...goalFormData,
                      goalName: e.target.value,
                    })
                  }
                  placeholder="e.g., Daily 10K steps"
                  className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  required
                />
              </div>

              {/* Goal Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Goal Type
                </label>
                <select
                  value={goalFormData.goalType}
                  onChange={(e) =>
                    setGoalFormData({
                      ...goalFormData,
                      goalType: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-3 bg-background dark:bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-foreground"
                  required
                >
                  <option
                    value="steps"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Steps
                  </option>
                  <option
                    value="workout_days"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Workout Days
                  </option>
                  <option
                    value="calories"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Calories Burned
                  </option>
                  <option
                    value="workout_duration"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Workout Duration (minutes)
                  </option>
                </select>
              </div>

              {/* Target Value */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Target Value
                </label>
                <input
                  type="number"
                  value={goalFormData.targetValue}
                  onChange={(e) =>
                    setGoalFormData({
                      ...goalFormData,
                      targetValue: e.target.value,
                    })
                  }
                  placeholder={
                    goalFormData.goalType === 'steps'
                      ? '10000'
                      : goalFormData.goalType === 'workout_days'
                      ? '5'
                      : goalFormData.goalType === 'calories'
                      ? '2000'
                      : '30'
                  }
                  min="1"
                  className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  required
                />
              </div>

              {/* Time Period */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Time Period
                </label>
                <select
                  value={goalFormData.timePeriod}
                  onChange={(e) =>
                    setGoalFormData({
                      ...goalFormData,
                      timePeriod: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-3 bg-background dark:bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-foreground"
                  required
                >
                  <option
                    value="daily"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Daily
                  </option>
                  <option
                    value="weekly"
                    className="bg-background dark:bg-zinc-800 text-foreground"
                  >
                    Weekly
                  </option>
                </select>
              </div>

              {/* Goal Preview */}
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="text-sm text-muted-foreground">
                  Goal Preview
                </div>
                <div className="text-lg font-bold text-purple-500 mt-1">
                  {goalFormData.goalName || 'Your Goal'}:{' '}
                  {goalFormData.targetValue || '0'}{' '}
                  {getGoalTypeLabel(goalFormData.goalType)}{' '}
                  {goalFormData.timePeriod}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGoalsModal(false)}
                  className="flex-1 px-6 py-3 bg-muted/20 text-muted-foreground rounded-xl font-semibold hover:bg-muted/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGoal}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingGoal ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
