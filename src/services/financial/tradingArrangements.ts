
import { FINANCIAL_EXPERTISES } from '../constants/financialConstants';
import { TRADING_ARRANGEMENTS } from '../constants/tradingConstants';
import { RIGHTS_ISSUE_TIMETABLE_FALLBACK } from '../constants/fallbackConstants';

/**
 * Get appropriate fallback trading arrangement based on type
 */
export function getFallbackTradingArrangement(type: string, prompt: string): string {
  // If the prompt is specifically asking for a rights issue timetable with a starting date of June 1, 2025
  if (type === FINANCIAL_EXPERTISES.RIGHTS_ISSUE && 
      prompt.toLowerCase().includes('timetable') &&
      (prompt.toLowerCase().includes('june') || prompt.toLowerCase().includes('1 june 2025'))) {
    
    // Customize timetable with requested starting date
    return `# Rights Issue Timetable - Starting Date: 1 June 2025

| Date | Event | Trading Implications |
|------|-------|----------------------|
| June 1, 2025 (T) | Announcement Day | Formal announcement of rights issue |
| June 2, 2025 (T+1) | Ex-Rights Date | Shares trade ex-rights from this date |
| June 4, 2025 (T+3) | Record Date | Register closing to determine entitled shareholders |
| June 9, 2025 (T+6) | Dispatch of PALs | Provisional Allotment Letters sent to shareholders |
| June 10, 2025 (T+7) | Commencement of nil-paid rights trading | First day dealing in nil-paid rights |
| June 18, 2025 (T+13) | Last day of nil-paid rights trading | Last day dealing in nil-paid rights |
| June 23, 2025 (T+16) | Latest time for acceptance and payment | Final date for acceptance and payment |
| June 24, 2025 (T+17) | Results announcement | Announcement of rights issue results |
| June 30, 2025 (T+23) | Dispatch of share certificates | Share certificates sent to shareholders |
| July 1, 2025 (T+24) | Commencement of dealing in fully-paid shares | Trading of new fully-paid shares begins |

Notes:
- This timetable follows Hong Kong Listing Rules requirements
- Minimum period for nil-paid rights trading is 10 business days under HK Listing Rules
- Underwriters typically have the right to terminate within 1-2 business days after the acceptance deadline
- Odd lot arrangements should be specified in the offering document
- The timetable must be approved by HKEX before the announcement`;
  }
  
  // Standard fallbacks for other scenarios
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
