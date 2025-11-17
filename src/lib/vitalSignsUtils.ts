// Utility functions for vital signs feature

import { VitalSignsPreferences } from '../types/vitalSigns';

export const VITAL_SIGNS_CONFIG = {
  body_temperature: {
    label: 'Body Temperature',
    icon: 'Thermometer',
    unit: (isCelsius: boolean) => (isCelsius ? '°C' : '°F'),
    color: 'orange',
    chartColor: 'rgb(251, 146, 60)',
    darkChartColor: 'rgb(251, 146, 60)',
  },
  pulse_rate: {
    label: 'Pulse Rate',
    icon: 'Activity',
    unit: 'bpm',
    color: 'red',
    chartColor: 'rgb(239, 68, 68)',
    darkChartColor: 'rgb(248, 113, 113)',
  },
  blood_pressure: {
    label: 'Blood Pressure',
    icon: 'Heart',
    unit: 'mmHg',
    color: 'blue',
    chartColor: 'rgb(59, 130, 246)',
    darkChartColor: 'rgb(96, 165, 250)',
  },
  oxygen_saturation: {
    label: 'Oxygen Saturation',
    icon: 'Wind',
    unit: '%',
    color: 'green',
    chartColor: 'rgb(34, 197, 94)',
    darkChartColor: 'rgb(74, 222, 128)',
  },
};

// Temperature conversion functions
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

// Format blood pressure as "120/80"
export function formatBloodPressure(
  systolic?: number,
  diastolic?: number
): string {
  if (!systolic || !diastolic) return '--/--';
  return `${systolic}/${diastolic}`;
}

// Check if reading is within normal range
export function getReadingStatus(
  metric: string,
  value: number,
  ranges: VitalSignsPreferences['normal_ranges'],
  tempUnit: 'celsius' | 'fahrenheit' = 'celsius'
): {
  status: 'low' | 'normal' | 'high';
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  label: string;
} {
  let range;

  if (metric === 'body_temperature') {
    range =
      tempUnit === 'celsius'
        ? ranges.body_temperature_c
        : ranges.body_temperature_f;
  } else {
    range = ranges[metric as keyof typeof ranges];
  }

  if (!range) {
    return {
      status: 'normal',
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-200',
      icon: '✓',
      label: 'Normal',
    };
  }

  let status: 'low' | 'normal' | 'high' = 'normal';
  if (value < range.min) status = 'low';
  else if (value > range.max) status = 'high';

  const statusMap = {
    low: {
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-800 dark:text-blue-200',
      icon: '↓',
      label: 'Low',
    },
    normal: {
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-200',
      icon: '✓',
      label: 'Normal',
    },
    high: {
      color: 'red',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-800 dark:text-red-200',
      icon: '↑',
      label: 'High',
    },
  };

  return { status, ...statusMap[status] };
}

// Validate vital sign input
export function validateVitalSign(
  metric: string,
  value: number
): { valid: boolean; error?: string } {
  if (value < 0) {
    return { valid: false, error: 'Value must be positive' };
  }

  switch (metric) {
    case 'body_temperature':
      if (value < 30 || value > 45) {
        return {
          valid: false,
          error: 'Temperature seems unrealistic (30-45°C)',
        };
      }
      break;
    case 'pulse_rate':
      if (value < 30 || value > 220) {
        return {
          valid: false,
          error: 'Pulse rate seems unrealistic (30-220 bpm)',
        };
      }
      break;
    case 'systolic_bp':
    case 'diastolic_bp':
      if (value < 40 || value > 250) {
        return {
          valid: false,
          error: 'Blood pressure seems unrealistic (40-250 mmHg)',
        };
      }
      break;
    case 'oxygen_saturation':
      if (value < 70 || value > 100) {
        return { valid: false, error: 'Oxygen saturation must be 70-100%' };
      }
      break;
  }

  return { valid: true };
}

// Validate blood pressure combination
export function validateBloodPressure(
  systolic?: number,
  diastolic?: number
): { valid: boolean; error?: string } {
  if (!systolic || !diastolic) return { valid: true };

  if (systolic <= diastolic) {
    return {
      valid: false,
      error: 'Systolic must be greater than diastolic',
    };
  }

  return { valid: true };
}

// Format date as "Nov 17, 2025"
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format time as "8:30 AM"
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Get date range for trends
export function getDateRangeForPeriod(days: number): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Format time of day label
export function formatTimeOfDay(timeOfDay?: string): string {
  if (!timeOfDay) return '';
  return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
}
