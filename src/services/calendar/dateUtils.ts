
import { addBusinessDays, isBusinessDay } from './businessDayCalculator';
import { TimetableEntry } from '@/types/calendar';

/**
 * Format date for Hong Kong timezone display
 */
export const formatHongKongDate = (date: Date, includeDay: boolean = true): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  if (includeDay) {
    options.weekday = 'short';
  }

  return date.toLocaleDateString('en-HK', options);
};

/**
 * Create a timetable entry with business day calculations
 */
export const createTimetableEntry = (
  baseDate: Date,
  businessDayOffset: number,
  event: string,
  description: string
): TimetableEntry => {
  const targetDate = addBusinessDays(baseDate, businessDayOffset);
  const calendarDayOffset = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    date: targetDate,
    event,
    description,
    isBusinessDay: isBusinessDay(targetDate),
    dayOffset: calendarDayOffset,
    businessDayOffset
  };
};

/**
 * Generate a series of timetable entries based on business day offsets
 */
export const generateBusinessDayTimetable = (
  recordDate: Date,
  entries: Array<{ businessDays: number; event: string; description: string }>
): TimetableEntry[] => {
  return entries.map(entry => 
    createTimetableEntry(recordDate, entry.businessDays, entry.event, entry.description)
  );
};

/**
 * Validate that a deadline meets minimum business day requirements
 */
export const validateBusinessDayRequirement = (
  startDate: Date,
  endDate: Date,
  minimumBusinessDays: number
): { isValid: boolean; actualDays: number; suggestion?: Date } => {
  const actualDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (actualDays >= minimumBusinessDays) {
    return { isValid: true, actualDays };
  }

  const suggestedDate = addBusinessDays(startDate, minimumBusinessDays);
  return {
    isValid: false,
    actualDays,
    suggestion: suggestedDate
  };
};

/**
 * Format business day offset for display (e.g., "T+5 (7 calendar days)")
 */
export const formatBusinessDayOffset = (businessDays: number, calendarDays: number): string => {
  const sign = businessDays >= 0 ? '+' : '';
  const businessDayStr = `T${sign}${businessDays}`;
  
  if (Math.abs(calendarDays - businessDays) > 0) {
    return `${businessDayStr} (${calendarDays} calendar days)`;
  }
  
  return businessDayStr;
};
