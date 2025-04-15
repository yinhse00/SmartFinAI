
import { FINANCIAL_EXPERTISES } from '../constants/financialConstants';
import { TRADING_ARRANGEMENTS } from '../constants/tradingConstants';
import { RIGHTS_ISSUE_TIMETABLE_FALLBACK } from '../constants/fallbackConstants';

/**
 * Get appropriate fallback trading arrangement based on type
 */
export function getFallbackTradingArrangement(type: string, prompt: string): string {
  switch (type) {
    case FINANCIAL_EXPERTISES.RIGHTS_ISSUE:
      return TRADING_ARRANGEMENTS.RIGHTS_ISSUE;
      
    case FINANCIAL_EXPERTISES.OPEN_OFFER:
      return TRADING_ARRANGEMENTS.OPEN_OFFER;
      
    case FINANCIAL_EXPERTISES.SHARE_CONSOLIDATION:
      return TRADING_ARRANGEMENTS.SHARE_CONSOLIDATION;
      
    case FINANCIAL_EXPERTISES.BOARD_LOT_CHANGE:
      return TRADING_ARRANGEMENTS.BOARD_LOT_CHANGE;
      
    case FINANCIAL_EXPERTISES.COMPANY_NAME_CHANGE:
      return TRADING_ARRANGEMENTS.COMPANY_NAME_CHANGE;
      
    default:
      // If nothing specific found, return a general message with all arrangements
      return `# Hong Kong Trading Arrangements Guide\n\nHere are trading arrangements for various corporate actions:\n\n## Rights Issue\n${TRADING_ARRANGEMENTS.RIGHTS_ISSUE}\n\n## Open Offer\n${TRADING_ARRANGEMENTS.OPEN_OFFER}`;
  }
}

/**
 * Check if the response contains a well-formatted timetable
 */
export function isWellFormattedTimetable(response: string): boolean {
  // Check for table formatting with dates and descriptions
  const hasTableStructure = response.includes('|') && response.includes('---');
  const hasDateEntries = /T[\+\-]\d+|Day \d+|Date/.test(response);
  const hasTimetableHeader = /timetable|timeline|schedule/i.test(response);
  
  return hasTableStructure && hasDateEntries && hasTimetableHeader;
}
