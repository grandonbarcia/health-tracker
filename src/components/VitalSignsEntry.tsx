'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Thermometer, Activity, Heart, Wind, X } from 'lucide-react';
import { VitalSignsInput, TimeOfDay } from '../types/vitalSigns';
import { supabase } from '../lib/supabaseClient';
import {
  validateVitalSign,
  validateBloodPressure,
  getTodayDate,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
} from '../lib/vitalSignsUtils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
  selectedDate?: string;
  editingRecord?: any;
  onSuccess: () => void;
}

export default function VitalSignsEntry({
  open,
  onOpenChange,
  currentUser,
  selectedDate,
  editingRecord,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempUnit, setTempUnit] = useState<'celsius' | 'fahrenheit'>('celsius');

  // Form state
  const [formData, setFormData] = useState<VitalSignsInput>({
    date: selectedDate || getTodayDate(),
    time_of_day: undefined,
    body_temperature: undefined,
    pulse_rate: undefined,
    systolic_bp: undefined,
    diastolic_bp: undefined,
    oxygen_saturation: undefined,
    notes: '',
  });

  // Initialize form when editing
  useEffect(() => {
    if (editingRecord) {
      setFormData({
        date: editingRecord.date,
        time_of_day: editingRecord.time_of_day,
        body_temperature: editingRecord.body_temperature,
        pulse_rate: editingRecord.pulse_rate,
        systolic_bp: editingRecord.systolic_bp,
        diastolic_bp: editingRecord.diastolic_bp,
        oxygen_saturation: editingRecord.oxygen_saturation,
        notes: editingRecord.notes || '',
      });
    } else {
      setFormData({
        date: selectedDate || getTodayDate(),
        time_of_day: undefined,
        body_temperature: undefined,
        pulse_rate: undefined,
        systolic_bp: undefined,
        diastolic_bp: undefined,
        oxygen_saturation: undefined,
        notes: '',
      });
    }
    setErrors({});
  }, [editingRecord, selectedDate, open]);

  const handleInputChange = (field: keyof VitalSignsInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNumberInput = (field: keyof VitalSignsInput, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    handleInputChange(field, numValue);
  };

  const handleTemperatureChange = (value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);

    if (numValue !== undefined) {
      // Convert to Celsius for storage if in Fahrenheit
      const celsiusValue =
        tempUnit === 'fahrenheit' ? fahrenheitToCelsius(numValue) : numValue;
      handleInputChange('body_temperature', celsiusValue);
    } else {
      handleInputChange('body_temperature', undefined);
    }
  };

  const getDisplayTemperature = () => {
    if (formData.body_temperature === undefined) return '';

    return tempUnit === 'fahrenheit'
      ? celsiusToFahrenheit(formData.body_temperature).toFixed(1)
      : formData.body_temperature.toFixed(1);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate each vital sign if provided
    if (formData.body_temperature !== undefined) {
      const result = validateVitalSign(
        'body_temperature',
        formData.body_temperature
      );
      if (!result.valid) newErrors.body_temperature = result.error!;
    }

    if (formData.pulse_rate !== undefined) {
      const result = validateVitalSign('pulse_rate', formData.pulse_rate);
      if (!result.valid) newErrors.pulse_rate = result.error!;
    }

    if (formData.systolic_bp !== undefined) {
      const result = validateVitalSign('systolic_bp', formData.systolic_bp);
      if (!result.valid) newErrors.systolic_bp = result.error!;
    }

    if (formData.diastolic_bp !== undefined) {
      const result = validateVitalSign('diastolic_bp', formData.diastolic_bp);
      if (!result.valid) newErrors.diastolic_bp = result.error!;
    }

    if (formData.oxygen_saturation !== undefined) {
      const result = validateVitalSign(
        'oxygen_saturation',
        formData.oxygen_saturation
      );
      if (!result.valid) newErrors.oxygen_saturation = result.error!;
    }

    // Validate blood pressure combination
    const bpResult = validateBloodPressure(
      formData.systolic_bp,
      formData.diastolic_bp
    );
    if (!bpResult.valid) {
      newErrors.systolic_bp = bpResult.error!;
    }

    // Check if at least one vital sign is provided
    const hasAnyVital =
      formData.body_temperature !== undefined ||
      formData.pulse_rate !== undefined ||
      formData.systolic_bp !== undefined ||
      formData.diastolic_bp !== undefined ||
      formData.oxygen_saturation !== undefined;

    if (!hasAnyVital) {
      newErrors.general = 'Please enter at least one vital sign';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('You must be logged in to save vital signs');
      }

      const url = editingRecord
        ? `/api/vital-signs/${editingRecord.id}`
        : '/api/vital-signs';

      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save vital signs');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving vital signs:', error);
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-card border border-border">
        <DialogHeader>
          <DialogTitle>
            {editingRecord ? 'Edit Vital Signs' : 'Record Vital Signs'}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] pr-2">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Date and Time of Day */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Time of Day
                </label>
                <select
                  value={formData.time_of_day || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'time_of_day',
                      e.target.value || undefined
                    )
                  }
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                >
                  <option value="">Select...</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </div>
            </div>

            {/* Vital Signs Grid */}
            <div className="space-y-3">
              {/* Body Temperature */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1 text-foreground">
                  <Thermometer className="w-4 h-4 text-orange-600" />
                  Body Temperature
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={getDisplayTemperature()}
                    onChange={(e) => handleTemperatureChange(e.target.value)}
                    placeholder={tempUnit === 'celsius' ? '36.5' : '97.7'}
                    className="flex-1 border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setTempUnit(
                        tempUnit === 'celsius' ? 'fahrenheit' : 'celsius'
                      )
                    }
                    className="px-3 py-2 border border-border rounded-lg text-xs font-medium bg-background text-foreground hover:bg-muted min-w-[2.5rem]"
                  >
                    °{tempUnit === 'celsius' ? 'C' : 'F'}
                  </button>
                </div>
                {errors.body_temperature && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                    {errors.body_temperature}
                  </p>
                )}
              </div>

              {/* Pulse Rate */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1 text-foreground">
                  <Activity className="w-4 h-4 text-red-600" />
                  Pulse Rate
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.pulse_rate ?? ''}
                    onChange={(e) =>
                      handleNumberInput('pulse_rate', e.target.value)
                    }
                    placeholder="72"
                    className="flex-1 border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  />
                  <span className="text-xs text-muted-foreground min-w-[2.5rem]">
                    bpm
                  </span>
                </div>
                {errors.pulse_rate && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                    {errors.pulse_rate}
                  </p>
                )}
              </div>

              {/* Blood Pressure */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1 text-foreground">
                  <Heart className="w-4 h-4 text-blue-600" />
                  Blood Pressure
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.systolic_bp ?? ''}
                    onChange={(e) =>
                      handleNumberInput('systolic_bp', e.target.value)
                    }
                    placeholder="120"
                    className="w-20 border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  />
                  <span className="text-muted-foreground text-sm">/</span>
                  <input
                    type="number"
                    value={formData.diastolic_bp ?? ''}
                    onChange={(e) =>
                      handleNumberInput('diastolic_bp', e.target.value)
                    }
                    placeholder="80"
                    className="w-20 border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  />
                  <span className="text-xs text-muted-foreground min-w-[3rem]">
                    mmHg
                  </span>
                </div>
                {(errors.systolic_bp || errors.diastolic_bp) && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                    {errors.systolic_bp || errors.diastolic_bp}
                  </p>
                )}
              </div>

              {/* Oxygen Saturation */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1 text-foreground">
                  <Wind className="w-4 h-4 text-green-600" />
                  Oxygen Saturation
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.oxygen_saturation ?? ''}
                    onChange={(e) =>
                      handleNumberInput('oxygen_saturation', e.target.value)
                    }
                    placeholder="98"
                    className="flex-1 border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  />
                  <span className="text-xs text-muted-foreground min-w-[1.5rem]">
                    %
                  </span>
                </div>
                {errors.oxygen_saturation && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                    {errors.oxygen_saturation}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any relevant context (e.g., after exercise, feeling stressed, etc.)"
                rows={2}
                maxLength={1000}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
              />
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded p-3">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {errors.general}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-2 border-t border-border mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingRecord ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
