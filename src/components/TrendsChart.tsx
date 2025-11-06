'use client';
import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  itemCount: number;
}

interface Props {
  data: DailyNutrition[];
  chartType: 'line' | 'bar' | 'radar';
  nutrient:
    | 'calories'
    | 'protein'
    | 'carbs'
    | 'fat'
    | 'fiber'
    | 'sodium'
    | 'all';
  userGoals?: Record<string, number>;
  className?: string;
}

export default function TrendsChart({
  data,
  chartType,
  nutrient,
  userGoals,
  className = '',
}: Props) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial dark mode state
    const checkDarkMode = () => {
      if (typeof window !== 'undefined') {
        const isDark =
          document.documentElement.classList.contains('dark') ||
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(isDark);
      }
    };

    checkDarkMode();

    // Listen for dark mode changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const observer = new MutationObserver(checkDarkMode);

    mediaQuery.addListener(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      mediaQuery.removeListener(checkDarkMode);
      observer.disconnect();
    };
  }, []);

  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate colors for different nutrients
  const colors = {
    calories: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgb(59, 130, 246)' },
    protein: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgb(239, 68, 68)' },
    carbs: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgb(34, 197, 94)' },
    fat: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgb(245, 158, 11)' },
    fiber: { bg: 'rgba(139, 69, 19, 0.1)', border: 'rgb(139, 69, 19)' },
    sodium: { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgb(168, 85, 247)' },
  };

  // Prepare chart data based on chart type and nutrient selection
  const getChartData = () => {
    const labels = data.map((d) => formatDate(d.date));

    if (chartType === 'radar' || nutrient === 'all') {
      // For radar chart or "all" nutrients, show multiple nutrients
      return {
        labels:
          chartType === 'radar'
            ? ['Calories', 'Protein', 'Carbs', 'Fat', 'Fiber', 'Sodium']
            : labels,
        datasets:
          chartType === 'radar'
            ? [
                {
                  label: 'Average Values',
                  data: [
                    data.reduce((sum, d) => sum + d.calories, 0) / data.length,
                    data.reduce((sum, d) => sum + d.protein, 0) / data.length,
                    data.reduce((sum, d) => sum + d.carbs, 0) / data.length,
                    data.reduce((sum, d) => sum + d.fat, 0) / data.length,
                    data.reduce((sum, d) => sum + d.fiber, 0) / data.length,
                    data.reduce((sum, d) => sum + d.sodium, 0) /
                      data.length /
                      10, // Scale sodium down for radar
                  ],
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderColor: 'rgb(59, 130, 246)',
                  pointBackgroundColor: 'rgb(59, 130, 246)',
                },
              ]
            : [
                {
                  label: 'Calories',
                  data: data.map((d) => d.calories),
                  backgroundColor: colors.calories.bg,
                  borderColor: colors.calories.border,
                },
                {
                  label: 'Protein (g)',
                  data: data.map((d) => d.protein),
                  backgroundColor: colors.protein.bg,
                  borderColor: colors.protein.border,
                },
                {
                  label: 'Carbs (g)',
                  data: data.map((d) => d.carbs),
                  backgroundColor: colors.carbs.bg,
                  borderColor: colors.carbs.border,
                },
                {
                  label: 'Fat (g)',
                  data: data.map((d) => d.fat),
                  backgroundColor: colors.fat.bg,
                  borderColor: colors.fat.border,
                },
              ],
      };
    } else {
      // Single nutrient chart
      const color = colors[nutrient];
      const goalValue = userGoals?.[nutrient];

      const datasets: any[] = [
        {
          label: nutrient.charAt(0).toUpperCase() + nutrient.slice(1),
          data: data.map((d) => d[nutrient]),
          backgroundColor: color.bg,
          borderColor: color.border,
          fill: chartType === 'line',
          tension: 0.4,
        },
      ];

      // Add goal line if available
      if (goalValue && chartType === 'line') {
        datasets.push({
          label: 'Goal',
          data: new Array(data.length).fill(goalValue),
          borderColor: 'rgba(156, 163, 175, 0.8)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0,
        });
      }

      return { labels, datasets };
    }
  };

  const chartData = getChartData();

  // Chart options
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          color: isDarkMode ? '#e5e7eb' : '#374151',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDarkMode ? '#374151' : '#ffffff',
        titleColor: isDarkMode ? '#e5e7eb' : '#374151',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? '#6b7280' : '#d1d5db',
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const unit =
              nutrient === 'calories'
                ? ' cal'
                : nutrient === 'sodium'
                ? ' mg'
                : ' g';
            return `${label}: ${value}${nutrient !== 'all' ? unit : ''}`;
          },
        },
      },
    },
    scales:
      chartType !== 'radar'
        ? {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Date',
                color: isDarkMode ? '#9ca3af' : '#6b7280',
              },
              grid: {
                display: false,
              },
              ticks: {
                color: isDarkMode ? '#9ca3af' : '#6b7280',
              },
            },
            y: {
              display: true,
              title: {
                display: true,
                text:
                  nutrient === 'calories'
                    ? 'Calories'
                    : nutrient === 'sodium'
                    ? 'Sodium (mg)'
                    : nutrient === 'all'
                    ? 'Amount'
                    : 'Grams (g)',
                color: isDarkMode ? '#9ca3af' : '#6b7280',
              },
              beginAtZero: true,
              grid: {
                color: isDarkMode
                  ? 'rgba(107, 114, 128, 0.2)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
              ticks: {
                color: isDarkMode ? '#9ca3af' : '#6b7280',
              },
            },
          }
        : {
            r: {
              beginAtZero: true,
              pointLabels: {
                font: {
                  size: 12,
                },
                color: isDarkMode ? '#9ca3af' : '#6b7280',
              },
              ticks: {
                display: false,
              },
              grid: {
                color: isDarkMode
                  ? 'rgba(107, 114, 128, 0.2)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
              angleLines: {
                color: isDarkMode
                  ? 'rgba(107, 114, 128, 0.2)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
            },
          },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  // Render appropriate chart type
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      options,
      height: 300,
    };

    switch (chartType) {
      case 'bar':
        return <Bar {...commonProps} />;
      case 'radar':
        return <Radar {...commonProps} />;
      case 'line':
      default:
        return <Line {...commonProps} />;
    }
  };

  return (
    <div className={`relative ${className}`} style={{ height: '300px' }}>
      {renderChart()}
    </div>
  );
}
