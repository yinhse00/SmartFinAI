
import { BusinessDayCalculator } from './businessDayCalculator';
import { HongKongHolidays } from './hongKongHolidays';

const holidayChecker = new HongKongHolidays();
const businessDayCalculator = new BusinessDayCalculator(holidayChecker);

/**
 * Check if a date is a business day
 */
export const isBusinessDay = (date: Date): boolean => {
  return businessDayCalculator.isBusinessDay(date);
};

/**
 * Add business days to a date
 */
export const addBusinessDays = (startDate: Date, days: number): Date => {
  return businessDayCalculator.addBusinessDays(startDate, days);
};

/**
 * Subtract business days from a date
 */
export const subtractBusinessDays = (startDate: Date, days: number): Date => {
  return businessDayCalculator.subtractBusinessDays(startDate, days);
};

/**
 * Count business days between two dates
 */
export const countBusinessDays = (startDate: Date, endDate: Date): number => {
  return businessDayCalculator.countBusinessDays(startDate, endDate);
};
