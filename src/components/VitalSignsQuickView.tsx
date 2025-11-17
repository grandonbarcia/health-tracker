'use client';
import { Thermometer, Activity, Heart, Wind } from 'lucide-react';
import {
  VitalSigns,
  DEFAULT_VITAL_SIGNS_PREFERENCES,
} from '../types/vitalSigns';
import {
  getReadingStatus,
  formatBloodPressure,
  celsiusToFahrenheit,
} from '../lib/vitalSignsUtils';

interface Props {
  latestReadings?: VitalSigns;
  loading?: boolean;
  tempUnit?: 'celsius' | 'fahrenheit';
}

export default function VitalSignsQuickView({
  latestReadings,
  loading = false,
  tempUnit = 'celsius',
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 animate-pulse"
          >
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!latestReadings) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No vital signs recorded today</p>
        <p className="text-xs mt-1">
          Record your first measurement to get started
        </p>
      </div>
    );
  }

  const getTemperatureDisplay = () => {
    if (!latestReadings.body_temperature) return null;

    const value =
      tempUnit === 'fahrenheit'
        ? celsiusToFahrenheit(latestReadings.body_temperature)
        : latestReadings.body_temperature;

    const unit = tempUnit === 'celsius' ? '°C' : '°F';
    return `${value.toFixed(1)}${unit}`;
  };

  const vitalCards = [
    {
      icon: <Thermometer className="w-6 h-6 text-orange-600" />,
      label: 'Temperature',
      value: getTemperatureDisplay(),
      key: 'body_temperature' as const,
      actualValue: latestReadings.body_temperature,
    },
    {
      icon: <Activity className="w-6 h-6 text-red-600" />,
      label: 'Pulse',
      value: latestReadings.pulse_rate
        ? `${latestReadings.pulse_rate} bpm`
        : null,
      key: 'pulse_rate' as const,
      actualValue: latestReadings.pulse_rate,
    },
    {
      icon: <Heart className="w-6 h-6 text-blue-600" />,
      label: 'Blood Pressure',
      value: formatBloodPressure(
        latestReadings.systolic_bp,
        latestReadings.diastolic_bp
      ),
      key: 'systolic_bp' as const,
      actualValue: latestReadings.systolic_bp,
    },
    {
      icon: <Wind className="w-6 h-6 text-green-600" />,
      label: 'Oxygen',
      value: latestReadings.oxygen_saturation
        ? `${latestReadings.oxygen_saturation}%`
        : null,
      key: 'oxygen_saturation' as const,
      actualValue: latestReadings.oxygen_saturation,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {vitalCards.map((card) => {
        const status = card.actualValue
          ? getReadingStatus(
              card.key,
              card.actualValue,
              DEFAULT_VITAL_SIGNS_PREFERENCES.normal_ranges,
              tempUnit
            )
          : null;

        return (
          <div
            key={card.label}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              {card.icon}
              {status && (
                <div
                  className={`w-3 h-3 rounded-full ${
                    status.status === 'low'
                      ? 'bg-blue-500'
                      : status.status === 'high'
                      ? 'bg-red-500'
                      : 'bg-green-500'
                  }`}
                  title={status.label}
                />
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {card.label}
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {card.value || '--'}
            </p>
            {status && (
              <p className={`text-xs mt-1 font-medium ${status.textColor}`}>
                {status.label}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
