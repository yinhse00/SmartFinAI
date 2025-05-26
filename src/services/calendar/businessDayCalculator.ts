
import { isHongKongHoliday, isMarketOpen } from './hongKongHolidays';
import { BusinessDayOptions } from '@/types/calendar';

/**
 * Check if a date is a business day (excludes weekends and holidays)
 */
export const isBusinessDay = (date: Date, options: BusinessDayOptions = {}): boolean => {
  const {
    excludeWeekends = true,
    excludeHolidays = true,
    customHolidays = []
  } = options;

  // Check weekends
  if (excludeWeekends) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      return false;
    }
  }

  // Check Hong Kong public holidays
  if (excludeHolidays && isHongKongHoliday(date)) {
    return false;
  }

  // Check custom holidays
  if (customHolidays.length > 0) {
    const dateString = date.toISOString().split('T')[0];
    if (customHolidays.some(holiday => holiday.toISOString().split('T')[0] === dateString)) {
      return false;
    }
  }

  return true;
};

/**
 * Add business days to a date
 */
export const addBusinessDays = (startDate: Date, businessDays: number, options: BusinessDayOptions = {}): Date => {
  if (businessDays === 0) return new Date(startDate);
  
  const result = new Date(startDate);
  let daysAdded = 0;
  const increment = businessDays > 0 ? 1 : -1;
  const targetDays = Math.abs(businessDays);

  while (daysAdded < targetDays) {
    result.setDate(result.getDate() + increment);
    if (isBusinessDay(result, options)) {
      daysAdded++;
    }
  }

  return result;
};

/**
 * Subtract business days from a date
 */
export const subtractBusinessDays = (startDate: Date, businessDays: number, options: BusinessDayOptions = {}): Date => {
  return addBusinessDays(startDate, -businessDays, options);
};

/**
 * Count business days between two dates (inclusive)
 */
export const getBusinessDaysBetween = (startDate: Date, endDate: Date, options: BusinessDayOptions = {}): number => {
  if (startDate > endDate) {
    return -getBusinessDaysBetween(endDate, startDate, options);
  }

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isBusinessDay(current, options)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * Get the next business day after a given date
 */
export const getNextBusinessDay = (date: Date, options: BusinessDayOptions = {}): Date => {
  return addBusinessDays(date, 1, options);
};

/**
 * Get the previous business day before a given date
 */
export const getPreviousBusinessDay = (date: Date, options: BusinessDayOptions = {}): Date => {
  return subtractBusinessDays(date, 1, options);
};

/**
 * Adjust a date to the next business day if it falls on a non-business day
 */
export const adjustToNextBusinessDay = (date: Date, options: BusinessDayOptions = {}): Date => {
  if (isBusinessDay(date, options)) {
    return new Date(date);
  }
  return getNextBusinessDay(date, options);
};

/**
 * Adjust a date to the previous business day if it falls on a non-business day
 */
export const adjustToPreviousBusinessDay = (date: Date, options: BusinessDayOptions = {}): Date => {
  if (isBusinessDay(date, options)) {
    return new Date(date);
  }
  return getPreviousBusinessDay(date, options);
};
