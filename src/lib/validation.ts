/**
 * Input validation utilities for API routes
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a date string in YYYY-MM-DD format
 */
export function validateDate(date: unknown): ValidationResult {
  if (typeof date !== 'string') {
    return { valid: false, error: 'Date must be a string' };
  }

  // Check format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }

  // Check if valid date
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }

  // Check reasonable range (not before 2020, not more than 1 year in future)
  const year = parsed.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 2020 || year > currentYear + 1) {
    return { valid: false, error: 'Date out of valid range' };
  }

  return { valid: true };
}

/**
 * Validate a UUID
 */
export function validateUUID(id: unknown): ValidationResult {
  if (typeof id !== 'string') {
    return { valid: false, error: 'ID must be a string' };
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return { valid: false, error: 'Invalid UUID format' };
  }

  return { valid: true };
}

/**
 * Validate a positive integer
 */
export function validatePositiveInt(
  value: unknown,
  fieldName: string = 'Value'
): ValidationResult {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return { valid: false, error: `${fieldName} must be a positive integer` };
  }
  return { valid: true };
}

/**
 * Validate a string with max length
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options: { maxLength?: number; minLength?: number; required?: boolean } = {}
): ValidationResult {
  const { maxLength = 1000, minLength = 0, required = false } = options;

  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  }

  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  if (value.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be at most ${maxLength} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validate an array
 */
export function validateArray(
  value: unknown,
  fieldName: string,
  options: { maxLength?: number; required?: boolean } = {}
): ValidationResult {
  const { maxLength = 1000, required = false } = options;

  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  }

  if (!Array.isArray(value)) {
    return { valid: false, error: `${fieldName} must be an array` };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} exceeds maximum length of ${maxLength}`,
    };
  }

  return { valid: true };
}

/**
 * Validate meal items structure
 */
export function validateMealItems(items: unknown): ValidationResult {
  if (items === undefined || items === null) {
    return { valid: true }; // Optional, will default to empty
  }

  // Allow array format (legacy)
  if (Array.isArray(items)) {
    if (items.length > 500) {
      return { valid: false, error: 'Too many meal items' };
    }
    return { valid: true };
  }

  // Object format with breakfast/lunch/dinner
  if (typeof items !== 'object') {
    return { valid: false, error: 'Items must be an object or array' };
  }

  const meals = items as Record<string, unknown>;
  const validMeals = ['breakfast', 'lunch', 'dinner', 'snacks'];

  for (const key of Object.keys(meals)) {
    if (!validMeals.includes(key)) {
      return { valid: false, error: `Invalid meal type: ${key}` };
    }
    const mealItems = meals[key];
    if (!Array.isArray(mealItems)) {
      return { valid: false, error: `${key} must be an array` };
    }
    if (mealItems.length > 100) {
      return { valid: false, error: `Too many items in ${key}` };
    }
  }

  return { valid: true };
}

/**
 * Sanitize a string to prevent XSS
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Validate vital signs data
 */
export function validateVitalSigns(data: unknown): ValidationResult {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Vital signs data must be an object' };
  }

  const vitals = data as Record<string, unknown>;

  // Validate blood pressure
  if (vitals.systolic !== undefined) {
    if (
      typeof vitals.systolic !== 'number' ||
      vitals.systolic < 50 ||
      vitals.systolic > 300
    ) {
      return { valid: false, error: 'Systolic must be between 50 and 300' };
    }
  }
  if (vitals.diastolic !== undefined) {
    if (
      typeof vitals.diastolic !== 'number' ||
      vitals.diastolic < 30 ||
      vitals.diastolic > 200
    ) {
      return { valid: false, error: 'Diastolic must be between 30 and 200' };
    }
  }

  // Validate heart rate
  if (vitals.heartRate !== undefined) {
    if (
      typeof vitals.heartRate !== 'number' ||
      vitals.heartRate < 20 ||
      vitals.heartRate > 300
    ) {
      return { valid: false, error: 'Heart rate must be between 20 and 300' };
    }
  }

  // Validate weight
  if (vitals.weight !== undefined) {
    if (
      typeof vitals.weight !== 'number' ||
      vitals.weight < 20 ||
      vitals.weight > 1000
    ) {
      return { valid: false, error: 'Weight must be between 20 and 1000' };
    }
  }

  // Validate blood glucose
  if (vitals.bloodGlucose !== undefined) {
    if (
      typeof vitals.bloodGlucose !== 'number' ||
      vitals.bloodGlucose < 20 ||
      vitals.bloodGlucose > 800
    ) {
      return {
        valid: false,
        error: 'Blood glucose must be between 20 and 800',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate workout data
 */
export function validateWorkout(data: unknown): ValidationResult {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Workout data must be an object' };
  }

  const workout = data as Record<string, unknown>;

  // Validate name
  const nameResult = validateString(workout.name, 'Workout name', {
    maxLength: 200,
  });
  if (!nameResult.valid) return nameResult;

  // Validate duration
  if (workout.duration !== undefined) {
    if (
      typeof workout.duration !== 'number' ||
      workout.duration < 0 ||
      workout.duration > 1440
    ) {
      return {
        valid: false,
        error: 'Duration must be between 0 and 1440 minutes',
      };
    }
  }

  // Validate exercises array
  if (workout.exercises !== undefined) {
    const exercisesResult = validateArray(workout.exercises, 'Exercises', {
      maxLength: 100,
    });
    if (!exercisesResult.valid) return exercisesResult;
  }

  return { valid: true };
}
