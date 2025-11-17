'use client';
import { useState } from 'react';
import {
  Thermometer,
  Activity,
  Heart,
  Wind,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  VitalSigns,
  DEFAULT_VITAL_SIGNS_PREFERENCES,
} from '../types/vitalSigns';
import {
  getReadingStatus,
  formatBloodPressure,
  celsiusToFahrenheit,
  formatDate,
} from '../lib/vitalSignsUtils';
import { Button } from './ui/button';

interface Props {
  record: VitalSigns;
  onEdit: (record: VitalSigns) => void;
  onDelete: (id: string) => void;
  tempUnit?: 'celsius' | 'fahrenheit';
}

export default function VitalSignsCard({
  record,
  onEdit,
  onDelete,
  tempUnit = 'celsius',
}: Props) {
  const [showNotes, setShowNotes] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vital signs record?')) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(record.id);
    } catch (error) {
      console.error('Error deleting record:', error);
      setDeleting(false);
    }
  };

  const formatTimeOfDay = (timeOfDay?: string) => {
    if (!timeOfDay) return '';
    return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
  };

  const getTemperatureDisplay = () => {
    if (!record.body_temperature) return null;

    const value =
      tempUnit === 'fahrenheit'
        ? celsiusToFahrenheit(record.body_temperature)
        : record.body_temperature;

    const unit = tempUnit === 'celsius' ? '°C' : '°F';
    return `${value.toFixed(1)}${unit}`;
  };

  const renderVitalSign = (
    icon: React.ReactNode,
    label: string,
    value: string | null,
    vitalKey: keyof VitalSigns
  ) => {
    if (!value) return null;

    const status = getReadingStatus(
      vitalKey as string,
      record[vitalKey] as number,
      DEFAULT_VITAL_SIGNS_PREFERENCES.normal_ranges,
      tempUnit
    );

    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold text-foreground">{value}</p>
          </div>
        </div>
        <div
          className={`px-2 py-1 rounded text-xs font-medium ${status.bgColor} ${status.textColor}`}
        >
          {status.label}
        </div>
      </div>
    );
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {formatDate(record.date)}
          </h3>
          {record.time_of_day && (
            <p className="text-sm text-muted-foreground">
              {formatTimeOfDay(record.time_of_day)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(record)}
            disabled={deleting}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Vital Signs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Temperature */}
        {renderVitalSign(
          <Thermometer className="w-5 h-5 text-orange-600" />,
          'Temperature',
          getTemperatureDisplay(),
          'body_temperature'
        )}

        {/* Pulse Rate */}
        {renderVitalSign(
          <Activity className="w-5 h-5 text-red-600" />,
          'Pulse Rate',
          record.pulse_rate ? `${record.pulse_rate} bpm` : null,
          'pulse_rate'
        )}

        {/* Blood Pressure */}
        {(record.systolic_bp || record.diastolic_bp) && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Blood Pressure</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatBloodPressure(record.systolic_bp, record.diastolic_bp)}
                </p>
              </div>
            </div>
            {record.systolic_bp &&
              record.diastolic_bp &&
              (() => {
                const bpStatus = getReadingStatus(
                  'systolic_bp',
                  record.systolic_bp,
                  DEFAULT_VITAL_SIGNS_PREFERENCES.normal_ranges
                );
                return (
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${bpStatus.bgColor} ${bpStatus.textColor}`}
                  >
                    {bpStatus.label}
                  </div>
                );
              })()}
          </div>
        )}

        {/* Oxygen Saturation */}
        {renderVitalSign(
          <Wind className="w-5 h-5 text-green-600" />,
          'Oxygen Saturation',
          record.oxygen_saturation ? `${record.oxygen_saturation}%` : null,
          'oxygen_saturation'
        )}
      </div>

      {/* Notes Section */}
      {record.notes && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80"
          >
            {showNotes ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Notes
          </button>
          {showNotes && (
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {record.notes}
            </p>
          )}
        </div>
      )}

      {/* Timestamp */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Recorded on {new Date(record.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
