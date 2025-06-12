
import { HolidayChecker } from './businessDayCalculator';

/**
 * Hong Kong holidays checker
 */
export class HongKongHolidays implements HolidayChecker {
  private holidays: Set<string> = new Set();

  constructor() {
    this.initializeHolidays();
  }

  private initializeHolidays() {
    // 2025 Hong Kong public holidays
    const holidays2025 = [
      '2025-01-01', // New Year's Day
      '2025-01-29', // Chinese New Year
      '2025-01-30', // Chinese New Year
      '2025-01-31', // Chinese New Year
      '2025-04-04', // Ching Ming Festival
      '2025-04-18', // Good Friday
      '2025-04-19', // Day after Good Friday
      '2025-04-21', // Easter Monday
      '2025-05-01', // Labour Day
      '2025-05-05', // Buddha's Birthday
      '2025-06-02', // Dragon Boat Festival
      '2025-07-01', // HKSAR Establishment Day
      '2025-09-15', // Mid-Autumn Festival
      '2025-10-01', // National Day
      '2025-10-02', // Day after National Day
      '2025-10-11', // Chung Yeung Festival
      '2025-12-25', // Christmas Day
      '2025-12-26'  // Boxing Day
    ];

    // Add 2026 holidays for future planning
    const holidays2026 = [
      '2026-01-01', // New Year's Day
      '2026-02-17', // Chinese New Year
      '2026-02-18', // Chinese New Year
      '2026-02-19', // Chinese New Year
      '2026-04-05', // Ching Ming Festival
      '2026-04-03', // Good Friday
      '2026-04-04', // Day after Good Friday
      '2026-04-06', // Easter Monday
      '2026-05-01', // Labour Day
      '2026-05-24', // Buddha's Birthday
      '2026-06-19', // Dragon Boat Festival
      '2026-07-01', // HKSAR Establishment Day
      '2026-09-25', // Mid-Autumn Festival
      '2026-10-01', // National Day
      '2026-10-02', // Day after National Day
      '2026-10-31', // Chung Yeung Festival
      '2026-12-25', // Christmas Day
      '2026-12-26'  // Boxing Day
    ];

    [...holidays2025, ...holidays2026].forEach(holiday => {
      this.holidays.add(holiday);
    });
  }

  /**
   * Check if a date is a Hong Kong public holiday
   */
  isHoliday(date: Date): boolean {
    const dateString = date.toISOString().split('T')[0];
    return this.holidays.has(dateString);
  }

  /**
   * Get all holidays for a given year
   */
  getHolidaysForYear(year: number): Date[] {
    const holidays: Date[] = [];
    
    this.holidays.forEach(holidayString => {
      const holidayDate = new Date(holidayString);
      if (holidayDate.getFullYear() === year) {
        holidays.push(holidayDate);
      }
    });
    
    return holidays.sort((a, b) => a.getTime() - b.getTime());
  }
}

// Backward compatibility function
export function isHongKongHoliday(date: Date): boolean {
  const checker = new HongKongHolidays();
  return checker.isHoliday(date);
}
