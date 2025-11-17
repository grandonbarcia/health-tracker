// TypeScript types for vital signs feature

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface VitalSignsInput {
  date: string; // YYYY-MM-DD format
  time_of_day?: TimeOfDay;
  body_temperature?: number; // °C or °F
  pulse_rate?: number; // bpm
  systolic_bp?: number; // mmHg
  diastolic_bp?: number; // mmHg
  oxygen_saturation?: number; // %
  notes?: string;
  measurement_context?: Record<string, any>;
}

export interface VitalSigns extends VitalSignsInput {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface VitalSignsTrend {
  date: string;
  avg_temperature?: number;
  avg_pulse_rate?: number;
  avg_systolic_bp?: number;
  avg_diastolic_bp?: number;
  avg_oxygen?: number;
  min_temperature?: number;
  max_temperature?: number;
  min_pulse_rate?: number;
  max_pulse_rate?: number;
  reading_count: number;
}

export type VitalSignMetric =
  | 'body_temperature'
  | 'pulse_rate'
  | 'blood_pressure'
  | 'oxygen_saturation';

export interface VitalSignsPreferences {
  temperature_unit: 'celsius' | 'fahrenheit';
  default_time_of_day: TimeOfDay;
  reminders_enabled: boolean;
  reminder_times: string[];
  normal_ranges: {
    body_temperature_c: { min: number; max: number };
    body_temperature_f: { min: number; max: number };
    pulse_rate: { min: number; max: number };
    systolic_bp: { min: number; max: number };
    diastolic_bp: { min: number; max: number };
    oxygen_saturation: { min: number; max: number };
  };
}

export const DEFAULT_VITAL_SIGNS_PREFERENCES: VitalSignsPreferences = {
  temperature_unit: 'celsius',
  default_time_of_day: 'morning',
  reminders_enabled: false,
  reminder_times: ['08:00', '20:00'],
  normal_ranges: {
    body_temperature_c: { min: 36.1, max: 37.2 },
    body_temperature_f: { min: 97.0, max: 99.0 },
    pulse_rate: { min: 60, max: 100 },
    systolic_bp: { min: 90, max: 120 },
    diastolic_bp: { min: 60, max: 80 },
    oxygen_saturation: { min: 95, max: 100 },
  },
};
