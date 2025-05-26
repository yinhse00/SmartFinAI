
export interface HolidayInfo {
  date: string; // YYYY-MM-DD format
  name: string;
  type: 'public_holiday' | 'market_closure' | 'special_arrangement';
  description?: string;
}

export interface BusinessDayOptions {
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
  customHolidays?: Date[];
}

export interface TimetableEntry {
  date: Date;
  event: string;
  description: string;
  isBusinessDay: boolean;
  dayOffset: number;
  businessDayOffset?: number;
}
