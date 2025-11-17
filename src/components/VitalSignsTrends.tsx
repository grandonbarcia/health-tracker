'use client';
import { useState, useEffect } from 'react';
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
import {
  VitalSignsTrend,
  DEFAULT_VITAL_SIGNS_PREFERENCES,
} from '../types/vitalSigns';
import { celsiusToFahrenheit } from '../lib/vitalSignsUtils';
import { Button } from './ui/button';

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

interface Props {
  currentUser: any;
  refreshTrigger?: number;
  tempUnit?: 'celsius' | 'fahrenheit';
}

type Period = 7 | 14 | 30 | 90;

export default function VitalSignsTrends({
  currentUser,
  refreshTrigger,
  tempUnit = 'celsius',
}: Props) {
  const [trends, setTrends] = useState<VitalSignsTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(30);
  const [selectedMetric, setSelectedMetric] = useState<
    'temperature' | 'pulse' | 'blood_pressure' | 'oxygen'
  >('temperature');

  useEffect(() => {
    fetchTrends();
  }, [period, refreshTrigger]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vital-signs/trends?days=${period}`);
      if (!response.ok) throw new Error('Failed to fetch trends');

      const data = await response.json();
      setTrends(data);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const labels = trends.map((t) =>
      new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    );

    const isDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const textColor = isDark ? '#d1d5db' : '#374151';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    switch (selectedMetric) {
      case 'temperature': {
        const temps = trends.map((t) => {
          if (!t.avg_temperature) return null;
          return tempUnit === 'fahrenheit'
            ? celsiusToFahrenheit(t.avg_temperature)
            : t.avg_temperature;
        });

        const ranges = DEFAULT_VITAL_SIGNS_PREFERENCES.normal_ranges;
        const normalMin =
          tempUnit === 'fahrenheit'
            ? ranges.body_temperature_f.min
            : ranges.body_temperature_c.min;
        const normalMax =
          tempUnit === 'fahrenheit'
            ? ranges.body_temperature_f.max
            : ranges.body_temperature_c.max;

        return {
          labels,
          datasets: [
            {
              label: `Temperature (${tempUnit === 'celsius' ? '°C' : '°F'})`,
              data: temps,
              borderColor: 'rgb(251, 146, 60)',
              backgroundColor: 'rgba(251, 146, 60, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Normal Range (Min)',
              data: Array(labels.length).fill(normalMin),
              borderColor: 'rgba(34, 197, 94, 0.3)',
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false,
            },
            {
              label: 'Normal Range (Max)',
              data: Array(labels.length).fill(normalMax),
              borderColor: 'rgba(34, 197, 94, 0.3)',
              borderDash: [5, 5],
              pointRadius: 0,
              fill: '-1',
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
            },
          ],
        };
      }

      case 'pulse': {
        const pulseData = trends.map((t) => t.avg_pulse_rate || null);
        const ranges = DEFAULT_VITAL_SIGNS_PREFERENCES.normal_ranges.pulse_rate;

        return {
          labels,
          datasets: [
            {
              label: 'Pulse Rate (bpm)',
              data: pulseData,
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Normal Range (Min)',
              data: Array(labels.length).fill(ranges.min),
              borderColor: 'rgba(34, 197, 94, 0.3)',
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false,
            },
            {
              label: 'Normal Range (Max)',
              data: Array(labels.length).fill(ranges.max),
              borderColor: 'rgba(34, 197, 94, 0.3)',
              borderDash: [5, 5],
              pointRadius: 0,
              fill: '-1',
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
            },
          ],
        };
      }

      case 'blood_pressure': {
        const systolicData = trends.map((t) => t.avg_systolic_bp || null);
        const diastolicData = trends.map((t) => t.avg_diastolic_bp || null);
        const ranges = DEFAULT_VITAL_SIGNS_PREFERENCES.normal_ranges;

        return {
          labels,
          datasets: [
            {
              label: 'Systolic (mmHg)',
              data: systolicData,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Diastolic (mmHg)',
              data: diastolicData,
              borderColor: 'rgb(139, 92, 246)',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Systolic Normal Max',
              data: Array(labels.length).fill(ranges.systolic_bp.max),
              borderColor: 'rgba(34, 197, 94, 0.3)',
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false,
            },
          ],
        };
      }

      case 'oxygen': {
        const oxygenData = trends.map((t) => t.avg_oxygen || null);
        const ranges =
          DEFAULT_VITAL_SIGNS_PREFERENCES.normal_ranges.oxygen_saturation;

        return {
          labels,
          datasets: [
            {
              label: 'Oxygen Saturation (%)',
              data: oxygenData,
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Normal Range (Min)',
              data: Array(labels.length).fill(ranges.min),
              borderColor: 'rgba(34, 197, 94, 0.3)',
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false,
            },
          ],
        };
      }
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color:
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
              ? '#d1d5db'
              : '#374151',
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          color:
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
              ? '#374151'
              : '#e5e7eb',
        },
        ticks: {
          color:
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
              ? '#d1d5db'
              : '#374151',
        },
      },
      y: {
        grid: {
          color:
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
              ? '#374151'
              : '#e5e7eb',
        },
        ticks: {
          color:
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
              ? '#d1d5db'
              : '#374151',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"
            />
          ))}
        </div>
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No trend data available</p>
        <p className="text-xs mt-1">
          Record vital signs regularly to see trends
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Selection */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={period === 7 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod(7)}
        >
          7 Days
        </Button>
        <Button
          variant={period === 14 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod(14)}
        >
          14 Days
        </Button>
        <Button
          variant={period === 30 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod(30)}
        >
          30 Days
        </Button>
        <Button
          variant={period === 90 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod(90)}
        >
          90 Days
        </Button>
      </div>

      {/* Metric Selection */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedMetric === 'temperature' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedMetric('temperature')}
        >
          Temperature
        </Button>
        <Button
          variant={selectedMetric === 'pulse' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedMetric('pulse')}
        >
          Pulse Rate
        </Button>
        <Button
          variant={selectedMetric === 'blood_pressure' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedMetric('blood_pressure')}
        >
          Blood Pressure
        </Button>
        <Button
          variant={selectedMetric === 'oxygen' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedMetric('oxygen')}
        >
          Oxygen
        </Button>
      </div>

      {/* Chart */}
      <div className="h-80 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <Line data={getChartData()} options={options} />
      </div>
    </div>
  );
}
