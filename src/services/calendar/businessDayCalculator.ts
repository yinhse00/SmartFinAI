
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
    try {
      if (!date || isNaN(date.getTime())) {
        console.error('Invalid date provided to isBusinessDay:', date);
        return false;
      }
      
      const dayOfWeek = date.getDay();
      
      // Check if it's a weekend (Saturday = 6, Sunday = 0)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
      }
      
      // Check if it's a holiday
      try {
        if (this.holidayChecker.isHoliday(date)) {
          return false;
        }
      } catch (holidayError) {
        console.warn('Error checking holiday status, assuming not a holiday:', holidayError);
        // Continue without holiday check if there's an error
      }
      
      return true;
    } catch (error) {
      console.error('Error in isBusinessDay:', error);
      return false; // Conservative approach: assume not a business day on error
    }
  }

  /**
   * Add business days to a date
   */
  addBusinessDays(startDate: Date, businessDays: number): Date {
    try {
      if (!startDate || isNaN(startDate.getTime())) {
        console.error('Invalid start date provided to addBusinessDays:', startDate);
        return new Date(); // Fallback to current date
      }
      
      if (businessDays < 0) {
        console.warn('Negative business days provided, using subtractBusinessDays instead');
        return this.subtractBusinessDays(startDate, Math.abs(businessDays));
      }
      
      if (businessDays === 0) {
        return new Date(startDate.getTime()); // Return copy of original date
      }
      
      let currentDate = new Date(startDate.getTime()); // Create copy to avoid mutation
      let remainingDays = businessDays;
      let iterations = 0;
      const maxIterations = businessDays * 5; // Safety check to prevent infinite loops
      
      console.log(`Adding ${businessDays} business days from ${startDate.toDateString()}`);
      
      while (remainingDays > 0 && iterations < maxIterations) {
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Add one day without mutation
        
        if (this.isBusinessDay(currentDate)) {
          remainingDays--;
          console.log(`Business day found: ${currentDate.toDateString()}, remaining: ${remainingDays}`);
        }
        iterations++;
      }
      
      if (iterations >= maxIterations) {
        console.error('Maximum iterations reached in addBusinessDays, returning fallback date');
        // Fallback: simple calendar day addition
        return new Date(startDate.getTime() + businessDays * 24 * 60 * 60 * 1000);
      }
      
      console.log(`Final calculated date: ${currentDate.toDateString()}`);
      return currentDate;
    } catch (error) {
      console.error('Error in addBusinessDays:', error);
      // Fallback calculation
      return new Date(startDate.getTime() + businessDays * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Subtract business days from a date
   */
  subtractBusinessDays(startDate: Date, businessDays: number): Date {
    try {
      if (!startDate || isNaN(startDate.getTime())) {
        console.error('Invalid start date provided to subtractBusinessDays:', startDate);
        return new Date(); // Fallback to current date
      }
      
      if (businessDays < 0) {
        console.warn('Negative business days provided, using addBusinessDays instead');
        return this.addBusinessDays(startDate, Math.abs(businessDays));
      }
      
      if (businessDays === 0) {
        return new Date(startDate.getTime()); // Return copy of original date
      }
      
      let currentDate = new Date(startDate.getTime()); // Create copy to avoid mutation
      let remainingDays = businessDays;
      let iterations = 0;
      const maxIterations = businessDays * 5; // Safety check to prevent infinite loops
      
      console.log(`Subtracting ${businessDays} business days from ${startDate.toDateString()}`);
      
      while (remainingDays > 0 && iterations < maxIterations) {
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // Subtract one day without mutation
        
        if (this.isBusinessDay(currentDate)) {
          remainingDays--;
          console.log(`Business day found: ${currentDate.toDateString()}, remaining: ${remainingDays}`);
        }
        iterations++;
      }
      
      if (iterations >= maxIterations) {
        console.error('Maximum iterations reached in subtractBusinessDays, returning fallback date');
        // Fallback: simple calendar day subtraction
        return new Date(startDate.getTime() - businessDays * 24 * 60 * 60 * 1000);
      }
      
      console.log(`Final calculated date: ${currentDate.toDateString()}`);
      return currentDate;
    } catch (error) {
      console.error('Error in subtractBusinessDays:', error);
      // Fallback calculation
      return new Date(startDate.getTime() - businessDays * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Count business days between two dates
   */
  countBusinessDays(startDate: Date, endDate: Date): number {
    try {
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid dates provided to countBusinessDays:', { startDate, endDate });
        return 0;
      }
      
      if (startDate >= endDate) {
        console.warn('Start date is not before end date in countBusinessDays');
        return 0;
      }
      
      let count = 0;
      let currentDate = new Date(startDate.getTime()); // Create copy to avoid mutation
      let iterations = 0;
      const maxIterations = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 10;
      
      console.log(`Counting business days from ${startDate.toDateString()} to ${endDate.toDateString()}`);
      
      while (currentDate < endDate && iterations < maxIterations) {
        if (this.isBusinessDay(currentDate)) {
          count++;
        }
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Add one day without mutation
        iterations++;
      }
      
      if (iterations >= maxIterations) {
        console.error('Maximum iterations reached in countBusinessDays');
      }
      
      console.log(`Found ${count} business days between dates`);
      return count;
    } catch (error) {
      console.error('Error in countBusinessDays:', error);
      return 0;
    }
  }
}

// Helper function for backward compatibility
export function addBusinessDays(startDate: Date, days: number): Date {
  const calculator = new BusinessDayCalculator({
    isHoliday: () => false // Simple implementation
  });
  return calculator.addBusinessDays(startDate, days);
}
