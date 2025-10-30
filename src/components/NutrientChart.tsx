'use client';
import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { NUTRIENT_DISPLAY, NUTRIENT_UNITS } from '../lib/nutrients';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  nutrients: Record<string, number>;
  rdi: Record<string, number>;
  percentMode?: boolean;
  showGoalProgress?: boolean;
}

export default function NutrientChart({
  nutrients,
  rdi,
  percentMode = false,
  showGoalProgress = true,
}: Props) {
  const keys = Object.keys(rdi);

  const data = useMemo(() => {
    const labels = keys.map(
      (k) =>
        `${NUTRIENT_DISPLAY[k] ?? k} ${
          NUTRIENT_UNITS[k] ? `(${NUTRIENT_UNITS[k]})` : ''
        }`
    );

    const userData = keys.map((k) => Number((nutrients[k] ?? 0).toFixed(2)));
    const rdiData = keys.map((k) => Number((rdi[k] ?? 0).toFixed(2)));

    const userPercentActual = userData.map((v, idx) => {
      const r = rdiData[idx] || 1;
      return Number(((v / r) * 100).toFixed(1));
    });

    if (percentMode) {
      const userPercentPlot = userPercentActual.map((v) => Math.min(v, 150)); // Cap at 150% for visual
      const rdiPercent = rdiData.map(() => 100);

      return {
        labels,
        datasets: [
          {
            label: 'Your Intake (%)',
            data: userPercentPlot,
            backgroundColor: userPercentActual.map(
              (v) =>
                v >= 100
                  ? 'rgba(34, 197, 94, 0.8)' // Green if goal met
                  : v >= 80
                  ? 'rgba(251, 191, 36, 0.8)' // Yellow if close
                  : 'rgba(239, 68, 68, 0.8)' // Red if far from goal
            ),
            borderColor: userPercentActual.map((v) =>
              v >= 100
                ? 'rgb(34, 197, 94)'
                : v >= 80
                ? 'rgb(251, 191, 36)'
                : 'rgb(239, 68, 68)'
            ),
            borderWidth: 1,
          },
          {
            label: 'Goal (100%)',
            data: rdiPercent,
            backgroundColor: 'rgba(156, 163, 175, 0.3)',
            borderColor: 'rgb(156, 163, 175)',
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: 'Your Intake',
          data: userData,
          backgroundColor: userData.map((v, idx) => {
            const goal = rdiData[idx];
            const percentage = (v / goal) * 100;
            return percentage >= 100
              ? 'rgba(34, 197, 94, 0.8)'
              : percentage >= 80
              ? 'rgba(251, 191, 36, 0.8)'
              : 'rgba(239, 68, 68, 0.8)';
          }),
          borderColor: userData.map((v, idx) => {
            const goal = rdiData[idx];
            const percentage = (v / goal) * 100;
            return percentage >= 100
              ? 'rgb(34, 197, 94)'
              : percentage >= 80
              ? 'rgb(251, 191, 36)'
              : 'rgb(239, 68, 68)';
          }),
          borderWidth: 1,
        },
        {
          label: 'Your Goals',
          data: rdiData,
          backgroundColor: 'rgba(156, 163, 175, 0.3)',
          borderColor: 'rgb(156, 163, 175)',
          borderWidth: 1,
        },
      ],
    };
  }, [nutrients, rdi, keys, percentMode]);

  const progressSummary = useMemo(() => {
    if (!showGoalProgress) return null;

    return keys.map((key) => {
      const current = nutrients[key] || 0;
      const goal = rdi[key] || 0;
      const percentage = Math.round((current / goal) * 100);
      const remaining = Math.max(0, goal - current);

      return {
        key,
        current,
        goal,
        percentage,
        remaining,
        status:
          percentage >= 100 ? 'complete' : percentage >= 80 ? 'close' : 'low',
      };
    });
  }, [nutrients, rdi, keys, showGoalProgress]);

  const options = useMemo(() => {
    const userPercentActual = keys.map((k) => {
      const v = nutrients[k] ?? 0;
      const r = (rdi[k] as number) || 1;
      return Number(((v / r) * 100).toFixed(1));
    });

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (ctx: any) {
              const label = ctx.dataset.label || '';
              const datasetIndex = ctx.datasetIndex;
              const dataIndex = ctx.dataIndex;
              if (percentMode) {
                const actual = userPercentActual[dataIndex];
                if (datasetIndex === 0) return `${label}: ${actual}%`;
                return `${label}: 100%`;
              }
              const val = ctx.parsed.y;
              return `${label}: ${val}`;
            },
          },
        },
      },
      scales: {
        x: { stacked: false },
        y: percentMode
          ? {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (v: any) => `${v}%` },
            }
          : { beginAtZero: true },
      },
    };
  }, [percentMode, nutrients, rdi, keys]);

  return (
    <div className="space-y-6">
      <div className="w-full h-[420px]">
        <Bar options={options} data={data} />
      </div>

      {progressSummary && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Today's Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {progressSummary.map(
              ({ key, current, goal, percentage, remaining, status }) => (
                <div key={key} className="bg-white rounded-lg p-3 border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">
                      {NUTRIENT_DISPLAY[key]}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        status === 'complete'
                          ? 'bg-green-100 text-green-800'
                          : status === 'close'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          status === 'complete'
                            ? 'bg-green-500'
                            : status === 'close'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {current.toFixed(1)} / {goal.toFixed(1)}{' '}
                    {NUTRIENT_UNITS[key]}
                    {remaining > 0 && (
                      <div className="text-gray-500">
                        {remaining.toFixed(1)} {NUTRIENT_UNITS[key]} remaining
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
