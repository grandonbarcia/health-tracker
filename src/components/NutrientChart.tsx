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

type Props = {
  nutrients: Record<string, number>;
  rdi: Record<string, number>;
  percentMode?: boolean;
};

export default function NutrientChart({
  nutrients,
  rdi,
  percentMode = false,
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

    const rdiPercent = rdiData.map(() => 100);

    const userPercentPlot = userPercentActual.map((v) => Math.min(v, 100));
    const rdiPercentPlot = rdiPercent.map((v) => Math.min(v, 100));

    return {
      labels,
      datasets: [
        {
          label: percentMode ? 'Your total (% of RDI)' : 'Your total',
          data: percentMode ? userPercentPlot : userData,
          backgroundColor: '#2563eb',
          borderColor: '#1e40af',
          borderWidth: 1,
        },
        {
          label: percentMode ? 'RDI (100%)' : 'RDI',
          data: percentMode ? rdiPercentPlot : rdiData,
          backgroundColor: '#fb923c',
          borderColor: '#c2410c',
          borderWidth: 1,
        },
      ],
    };
  }, [nutrients, rdi, keys, percentMode]);

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
    <div className="w-full h-[420px]">
      <Bar options={options} data={data} />
    </div>
  );
}
