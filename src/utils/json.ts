/**
 * JSON utility functions for form field handling
 */

/**
 * Safely stringify a value to JSON string
 */
export const toJsonString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    // Check if it's already a valid JSON string
    try {
      JSON.parse(value);
      return value;
    } catch {
      // Not valid JSON, try to stringify as-is
      return value;
    }
  }
  // Value is an object, stringify it
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

/**
 * Safely parse JSON string or object to object
 */
export const parseJson = (value: any): any => {
  // Handle null/undefined
  if (value === null || value === undefined) return null;

  // If it's already an object, return as-is
  if (typeof value === 'object') return value;

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return value; // Return as-is if not valid JSON
    }
  }

  // For other types, return as-is
  return value;
};

/**
 * Validate JSON value (string or object)
 */
export const validateJson = (
  value: any,
): { valid: boolean; error?: string } => {
  // Empty values are valid
  if (value === null || value === undefined) {
    return { valid: true };
  }

  // Objects are always valid JSON
  if (typeof value === 'object') {
    return { valid: true };
  }

  // For strings, check if it's valid JSON
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return { valid: true };
    }
    try {
      JSON.parse(trimmed);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  }

  // Other types - try to validate
  return { valid: true };
};
