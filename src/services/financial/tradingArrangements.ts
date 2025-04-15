
import { TRADING_ARRANGEMENTS } from '../constants/tradingConstants';

/**
 * Get fallback trading arrangement template based on type
 */
export function getFallbackTradingArrangement(type: string, query: string): string {
  switch (type) {
    case 'rights_issue':
      return TRADING_ARRANGEMENTS.RIGHTS_ISSUE;
      
    case 'open_offer':
      return TRADING_ARRANGEMENTS.OPEN_OFFER;
      
    case 'share_consolidation': 
      return TRADING_ARRANGEMENTS.SHARE_CONSOLIDATION;
      
    case 'board_lot_change':
      return TRADING_ARRANGEMENTS.BOARD_LOT_CHANGE;
      
    case 'company_name_change':
      return TRADING_ARRANGEMENTS.COMPANY_NAME_CHANGE;
      
    case 'takeovers_code':
      return TRADING_ARRANGEMENTS.GENERAL_OFFER;
      
    default:
      // If type not specifically matched but contains general offer in query
      if (query.toLowerCase().includes('general offer') || 
          query.toLowerCase().includes('mandatory offer') || 
          query.toLowerCase().includes('takeover')) {
        return TRADING_ARRANGEMENTS.GENERAL_OFFER;
      }
      
      // Default to rights issue if no specific match
      return TRADING_ARRANGEMENTS.RIGHTS_ISSUE;
  }
}

/**
 * Check if timetable format is well-formed
 */
export function isWellFormattedTimetable(text: string): boolean {
  // Check for structured table format
  const hasTableFormat = text.includes('|') && 
                        (text.includes('Date') || text.includes('Day') || text.includes('Event'));
                        
  // Check for minimum required dates/events
  const hasMinimalStructure = 
    (text.includes('Announcement') || text.includes('Ex-date')) && 
    (text.includes('Trading') || text.includes('Closing') || text.includes('Settlement'));
    
  return hasTableFormat && hasMinimalStructure;
}
