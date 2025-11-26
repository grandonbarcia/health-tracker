'use client';

import { Activity, ArrowLeft, Heart, Moon, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VitalsPage() {
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
              Vital Signs
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor your health metrics and trends
            </p>
          </div>
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
            <div className="text-4xl font-bold mb-2">72</div>
            <div className="text-sm text-muted-foreground">bpm</div>
            <div className="mt-4 text-xs text-green-500">Normal range</div>
          </div>

          {/* Blood Pressure */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                Blood Pressure
              </h2>
            </div>
            <div className="text-4xl font-bold mb-2">120/80</div>
            <div className="text-sm text-muted-foreground">mmHg</div>
            <div className="mt-4 text-xs text-green-500">Optimal</div>
          </div>

          {/* Sleep */}
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-5 h-5 text-purple-500" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                Sleep
              </h2>
            </div>
            <div className="text-4xl font-bold mb-2">8.2</div>
            <div className="text-sm text-muted-foreground">hours</div>
            <div className="mt-4 text-xs text-green-500">Good quality</div>
          </div>

          {/* Energy Level */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                Energy
              </h2>
            </div>
            <div className="text-4xl font-bold mb-2">85%</div>
            <div className="text-sm text-muted-foreground">level</div>
            <div className="mt-4 text-xs text-green-500">High energy</div>
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
    </div>
  );
}
