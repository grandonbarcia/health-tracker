'use client';

import { Dumbbell, ArrowLeft, Flame, Trophy, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExercisePage() {
  const router = useRouter();

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
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              Exercise & Activity
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your workouts and daily activity
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Steps */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-lg">
            <div className="text-sm text-muted-foreground mb-2">
              Today's Steps
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              10,245
            </div>
            <div className="text-xs text-green-500 mt-2">102% of goal</div>
          </div>

          {/* Calories */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <div className="text-sm text-muted-foreground">
                Calories Burned
              </div>
            </div>
            <div className="text-4xl font-bold">450</div>
            <div className="text-xs text-green-500 mt-2">Active calories</div>
          </div>

          {/* Workout Time */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-purple-500" />
              <div className="text-sm text-muted-foreground">Workout Time</div>
            </div>
            <div className="text-4xl font-bold">60</div>
            <div className="text-xs text-muted-foreground mt-2">minutes</div>
          </div>

          {/* Weekly Goal */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-green-500" />
              <div className="text-sm text-muted-foreground">Weekly Goal</div>
            </div>
            <div className="text-4xl font-bold">5/7</div>
            <div className="text-xs text-green-500 mt-2">days completed</div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
          <h2 className="text-xl font-semibold mb-6">Weekly Activity</h2>
          <div className="h-64 flex items-end justify-between gap-3">
            {[
              { day: 'Mon', value: 85, color: 'from-green-500 to-emerald-600' },
              { day: 'Tue', value: 65, color: 'from-amber-500 to-orange-500' },
              { day: 'Wed', value: 95, color: 'from-green-500 to-emerald-600' },
              { day: 'Thu', value: 75, color: 'from-cyan-500 to-blue-500' },
              {
                day: 'Fri',
                value: 100,
                color: 'from-green-500 to-emerald-600',
              },
              { day: 'Sat', value: 55, color: 'from-orange-500 to-red-500' },
              { day: 'Sun', value: 45, color: 'from-gray-400 to-gray-500' },
            ].map((data) => (
              <div
                key={data.day}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className={`w-full bg-gradient-to-t ${data.color} rounded-t-lg transition-all hover:opacity-80`}
                  style={{ height: `${data.value}%` }}
                />
                <span className="text-xs text-muted-foreground">
                  {data.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Workout History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Workouts */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Recent Workouts</h2>
            <div className="space-y-3">
              {[
                {
                  name: 'Morning Run',
                  duration: '45 min',
                  calories: '320 cal',
                  time: 'Today, 7:00 AM',
                },
                {
                  name: 'Strength Training',
                  duration: '60 min',
                  calories: '280 cal',
                  time: 'Yesterday, 6:00 PM',
                },
                {
                  name: 'Cycling',
                  duration: '30 min',
                  calories: '190 cal',
                  time: '2 days ago',
                },
                {
                  name: 'Yoga',
                  duration: '45 min',
                  calories: '150 cal',
                  time: '3 days ago',
                },
              ].map((workout, i) => (
                <div
                  key={i}
                  className="p-4 bg-muted/20 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{workout.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {workout.duration} • {workout.calories}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {workout.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals & Achievements */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Goals & Achievements</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  goal: '10,000 steps daily',
                  progress: 102,
                  status: 'Completed',
                },
                {
                  goal: 'Exercise 5 days/week',
                  progress: 71,
                  status: 'In Progress',
                },
                {
                  goal: 'Burn 2,000 calories/week',
                  progress: 85,
                  status: 'In Progress',
                },
                {
                  goal: '30 min cardio daily',
                  progress: 100,
                  status: 'Completed',
                },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.goal}</span>
                    <span
                      className={
                        item.progress >= 100
                          ? 'text-green-500'
                          : 'text-muted-foreground'
                      }
                    >
                      {item.status}
                    </span>
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
