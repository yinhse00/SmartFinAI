
/**
 * Business day calculator for Hong Kong market
 */

export interface HolidayChecker {
  isHoliday(date: Date): boolean;
}

export class BusinessDayCalculator {
  private holidayChecker: HolidayChecker;

  constructor(holidayChecker: HolidayChecker) {
    this.holidayChecker = holidayChecker;
  }

  /**
   * Check if a date is a business day (not weekend or holiday)
   */
  isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    
    // Check if it's a weekend (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Check if it's a holiday
    if (this.holidayChecker.isHoliday(date)) {
      return false;
    }
    
    return true;
  }

  /**
   * Add business days to a date
   */
  addBusinessDays(startDate: Date, businessDays: number): Date {
    let currentDate = new Date(startDate);
    let remainingDays = businessDays;
    
    while (remainingDays > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      
      if (this.isBusinessDay(currentDate)) {
        remainingDays--;
      }
    }
    
    return currentDate;
  }

  /**
   * Subtract business days from a date
   */
  subtractBusinessDays(startDate: Date, businessDays: number): Date {
    let currentDate = new Date(startDate);
    let remainingDays = businessDays;
    
    while (remainingDays > 0) {
      currentDate.setDate(currentDate.getDate() - 1);
      
      if (this.isBusinessDay(currentDate)) {
        remainingDays--;
      }
    }
    
    return currentDate;
  }

  /**
   * Count business days between two dates
   */
  countBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      if (this.isBusinessDay(currentDate)) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  }
}

// Helper function for backward compatibility
export function addBusinessDays(startDate: Date, days: number): Date {
  const calculator = new BusinessDayCalculator({
    isHoliday: () => false // Simple implementation
  });
  return calculator.addBusinessDays(startDate, days);
}
