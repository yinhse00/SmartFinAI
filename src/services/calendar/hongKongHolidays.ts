
import { HolidayInfo } from '@/types/calendar';

/**
 * Hong Kong public holidays and market closure days
 * Updated for 2024-2030 with major holidays
 */
export const HONG_KONG_HOLIDAYS_2024_2030: HolidayInfo[] = [
  // 2024
  { date: '2024-01-01', name: 'New Year\'s Day', type: 'public_holiday' },
  { date: '2024-02-10', name: 'Chinese New Year (Day 1)', type: 'public_holiday' },
  { date: '2024-02-12', name: 'Chinese New Year (Day 2)', type: 'public_holiday' },
  { date: '2024-02-13', name: 'Chinese New Year (Day 3)', type: 'public_holiday' },
  { date: '2024-03-29', name: 'Good Friday', type: 'public_holiday' },
  { date: '2024-04-01', name: 'Easter Monday', type: 'public_holiday' },
  { date: '2024-04-04', name: 'Ching Ming Festival', type: 'public_holiday' },
  { date: '2024-05-01', name: 'Labour Day', type: 'public_holiday' },
  { date: '2024-05-15', name: 'Buddha\'s Birthday', type: 'public_holiday' },
  { date: '2024-06-10', name: 'Dragon Boat Festival', type: 'public_holiday' },
  { date: '2024-07-01', name: 'Hong Kong SAR Establishment Day', type: 'public_holiday' },
  { date: '2024-09-17', name: 'Mid-Autumn Festival', type: 'public_holiday' },
  { date: '2024-10-01', name: 'National Day', type: 'public_holiday' },
  { date: '2024-10-11', name: 'Chung Yeung Festival', type: 'public_holiday' },
  { date: '2024-12-25', name: 'Christmas Day', type: 'public_holiday' },
  { date: '2024-12-26', name: 'Boxing Day', type: 'public_holiday' },

  // 2025
  { date: '2025-01-01', name: 'New Year\'s Day', type: 'public_holiday' },
  { date: '2025-01-29', name: 'Chinese New Year (Day 1)', type: 'public_holiday' },
  { date: '2025-01-30', name: 'Chinese New Year (Day 2)', type: 'public_holiday' },
  { date: '2025-01-31', name: 'Chinese New Year (Day 3)', type: 'public_holiday' },
  { date: '2025-04-04', name: 'Ching Ming Festival', type: 'public_holiday' },
  { date: '2025-04-18', name: 'Good Friday', type: 'public_holiday' },
  { date: '2025-04-21', name: 'Easter Monday', type: 'public_holiday' },
  { date: '2025-05-01', name: 'Labour Day', type: 'public_holiday' },
  { date: '2025-05-05', name: 'Buddha\'s Birthday', type: 'public_holiday' },
  { date: '2025-05-31', name: 'Dragon Boat Festival', type: 'public_holiday' },
  { date: '2025-07-01', name: 'Hong Kong SAR Establishment Day', type: 'public_holiday' },
  { date: '2025-10-01', name: 'National Day', type: 'public_holiday' },
  { date: '2025-10-06', name: 'Mid-Autumn Festival', type: 'public_holiday' },
  { date: '2025-10-29', name: 'Chung Yeung Festival', type: 'public_holiday' },
  { date: '2025-12-25', name: 'Christmas Day', type: 'public_holiday' },
  { date: '2025-12-26', name: 'Boxing Day', type: 'public_holiday' },

  // 2026
  { date: '2026-01-01', name: 'New Year\'s Day', type: 'public_holiday' },
  { date: '2026-02-17', name: 'Chinese New Year (Day 1)', type: 'public_holiday' },
  { date: '2026-02-18', name: 'Chinese New Year (Day 2)', type: 'public_holiday' },
  { date: '2026-02-19', name: 'Chinese New Year (Day 3)', type: 'public_holiday' },
  { date: '2026-04-03', name: 'Good Friday', type: 'public_holiday' },
  { date: '2026-04-05', name: 'Ching Ming Festival', type: 'public_holiday' },
  { date: '2026-04-06', name: 'Easter Monday', type: 'public_holiday' },
  { date: '2026-05-01', name: 'Labour Day', type: 'public_holiday' },
  { date: '2026-05-24', name: 'Buddha\'s Birthday', type: 'public_holiday' },
  { date: '2026-06-19', name: 'Dragon Boat Festival', type: 'public_holiday' },
  { date: '2026-07-01', name: 'Hong Kong SAR Establishment Day', type: 'public_holiday' },
  { date: '2026-09-25', name: 'Mid-Autumn Festival', type: 'public_holiday' },
  { date: '2026-10-01', name: 'National Day', type: 'public_holiday' },
  { date: '2026-10-17', name: 'Chung Yeung Festival', type: 'public_holiday' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'public_holiday' },
  { date: '2026-12-26', name: 'Boxing Day', type: 'public_holiday' }
];

/**
 * Check if a date is a Hong Kong public holiday
 */
export const isHongKongHoliday = (date: Date): boolean => {
  const dateString = date.toISOString().split('T')[0];
  return HONG_KONG_HOLIDAYS_2024_2030.some(holiday => holiday.date === dateString);
};

/**
 * Get holiday information for a specific date
 */
export const getHolidayInfo = (date: Date): HolidayInfo | null => {
  const dateString = date.toISOString().split('T')[0];
  return HONG_KONG_HOLIDAYS_2024_2030.find(holiday => holiday.date === dateString) || null;
};

/**
 * Get all holidays in a date range
 */
export const getHolidaysInRange = (startDate: Date, endDate: Date): HolidayInfo[] => {
  return HONG_KONG_HOLIDAYS_2024_2030.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate >= startDate && holidayDate <= endDate;
  });
};

/**
 * Check if the stock market is open on a specific date
 * (excludes weekends and public holidays)
 */
export const isMarketOpen = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  // Sunday = 0, Saturday = 6
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  return !isHongKongHoliday(date);
};
