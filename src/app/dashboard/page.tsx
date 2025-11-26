'use client';

import {
  Apple,
  Activity,
  Dumbbell,
  TrendingUp,
  Droplet,
  Flame,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

function Home() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>

        {/* Three Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* DIET Card */}
          <div
            onClick={() => router.push('/dashboard/diet')}
            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-border cursor-pointer relative group"
          >
            {/* Hover Action Button */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 shadow-lg">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              DIET
            </h2>

            {/* Circular Progress */}
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="transform -rotate-90 w-40 h-40">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#dietGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70 * 0.75} ${
                      2 * Math.PI * 70
                    }`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient
                      id="dietGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                      <stop offset="100%" stopColor="rgb(168, 85, 247)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold">75%</div>
                  <div className="text-xs text-muted-foreground">
                    of 1800 kcal
                  </div>
                </div>
              </div>
            </div>

            {/* Macros */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  Carbs: <span className="font-semibold">150g</span> / 200g
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  Protein: <span className="font-semibold">80g</span> / 100g
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                    style={{ width: '80%' }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Daily Intake Trend */}
            <div className="mt-6">
              <h3 className="text-sm text-muted-foreground mb-3">
                Daily Intake Trend
              </h3>
              <div className="h-20 flex items-end justify-between gap-2">
                {[65, 70, 55, 80, 75].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-green-500/20 to-green-500/5 rounded-t-lg transition-all hover:from-green-500/30"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>3</span>
                <span>3</span>
                <span>4</span>
                <span>16</span>
                <span>7</span>
              </div>
            </div>
          </div>

          {/* VITALS Card */}
          <div
            onClick={() => router.push('/dashboard/vitals')}
            className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-green-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-green-500/40 cursor-pointer relative group"
          >
            {/* Hover Action Button */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 shadow-lg">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              VITALS
            </h2>

            {/* Heart Rate */}
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">
                Heart Rate
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">72</span>
                <span className="text-muted-foreground">bpm</span>
              </div>
              <Activity className="w-6 h-6 text-green-500 mt-2" />
            </div>

            {/* Blood Pressure */}
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">
                Blood Pressure
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">120/80</span>
                <span className="text-muted-foreground">mmHg</span>
              </div>
              <div className="mt-2 flex justify-end">
                <button className="p-1 hover:bg-muted/20 rounded">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="6" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="18" r="2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sleep */}
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">Sleep</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">8.2</span>
                <span className="text-muted-foreground">hrs</span>
              </div>
            </div>

            {/* HRV Trend */}
            <div>
              <div className="text-sm text-muted-foreground mb-3">
                HRV Trend
              </div>
              <div className="h-20 relative">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 40"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 30 Q 10 25, 20 28 T 40 22 T 60 25 T 80 18 L 100 15"
                    stroke="url(#hrvGradient)"
                    strokeWidth="2"
                    fill="none"
                    className="drop-shadow-sm"
                  />
                  <path
                    d="M 0 30 Q 10 25, 20 28 T 40 22 T 60 25 T 80 18 L 100 15 L 100 40 L 0 40 Z"
                    fill="url(#hrvFillGradient)"
                    opacity="0.2"
                  />
                  <defs>
                    <linearGradient
                      id="hrvGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                      <stop offset="100%" stopColor="rgb(16, 185, 129)" />
                    </linearGradient>
                    <linearGradient
                      id="hrvFillGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                      <stop
                        offset="100%"
                        stopColor="rgb(34, 197, 94)"
                        opacity="0"
                      />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>20</span>
                <span>20</span>
                <span>26</span>
                <span className="text-green-500 font-semibold">80</span>
              </div>
            </div>
          </div>

          {/* EXERCISE Card */}
          <div
            onClick={() => router.push('/dashboard/exercise')}
            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-border cursor-pointer relative group"
          >
            {/* Hover Action Button */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 shadow-lg">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              EXERCISE
            </h2>

            {/* Steps */}
            <div className="mb-6">
              <div className="text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-1">
                10,245
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                STEPS
              </div>
              <Dumbbell className="w-6 h-6 text-green-500 mt-2" />
            </div>

            {/* Active Calories */}
            <div className="mb-4">
              <div className="text-sm text-muted-foreground mb-1">
                Active Calories
              </div>
              <div className="text-3xl font-bold">450</div>
            </div>

            {/* Workout Duration */}
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">
                Workout Duration
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">60</span>
                <span className="text-muted-foreground">min</span>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="h-24 flex items-end justify-between gap-2">
              {[
                { height: 40, color: 'from-green-500 to-green-600' },
                { height: 65, color: 'from-amber-500 to-orange-500' },
                { height: 55, color: 'from-cyan-400 to-cyan-500' },
                { height: 75, color: 'from-cyan-400 to-cyan-500' },
                { height: 85, color: 'from-green-500 to-emerald-600' },
              ].map((bar, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-full bg-gradient-to-t ${bar.color} rounded-t-lg transition-all hover:opacity-80`}
                    style={{ height: `${bar.height}%` }}
                  ></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Mon</span>
              <span>Tue</span>
              <span>Bu</span>
              <span>Sur</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Daily Summary Bar */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-border cursor-pointer">
          <div className="flex flex-wrap items-center gap-6">
            <h2 className="text-lg font-semibold">DAILY SUMMARY</h2>

            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm">
                Streak: <span className="font-semibold">15 Days</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                Goals Met: <span className="font-semibold">3/4</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-blue-500" />
              <span className="text-sm">
                Water: <span className="font-semibold">2.5L</span> / 3L
              </span>
            </div>

            <div className="ml-auto">
              <div className="h-2 w-32 bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-purple-500 to-blue-500 rounded-full"
                  style={{ width: '75%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
