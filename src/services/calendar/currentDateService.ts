/**
 * Centralized current date service for the application
 * Provides a single source of truth for "today" across all components
 */

let currentDate: Date | null = null;

/**
 * Get the current date for the application
 * Returns the override date if set, otherwise returns today
 */
export const getCurrentDate = (): Date => {
  if (currentDate) {
    return new Date(currentDate);
  }
  return new Date();
};

/**
 * Set a specific date as the current date (for testing/planning)
 */
export const setCurrentDate = (date: Date): void => {
  currentDate = new Date(date);
};

/**
 * Reset to using the actual current date
 */
export const resetToToday = (): void => {
  currentDate = null;
};

/**
 * Check if a custom current date is set
 */
export const hasCustomCurrentDate = (): boolean => {
  return currentDate !== null;
};

// Initialize with the system's reference date for consistency
setCurrentDate(new Date('2025-08-19'));