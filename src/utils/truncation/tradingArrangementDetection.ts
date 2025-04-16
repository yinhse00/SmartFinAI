
import { logTruncation, LogLevel } from './logLevel';
import { 
  checkRightsIssueCompleteness,
  checkOpenOfferCompleteness,
  checkShareReorganizationCompleteness,
  checkBoardLotCompleteness,
  checkCompanyNameChangeCompleteness
} from './tradingArrangementChecks';

/**
 * Checks if a trading arrangement response is complete based on the query type
 * @param content Response content
 * @param queryType Type of financial query related to trading arrangements
 * @returns Boolean indicating if the response contains complete information
 */
export const isTradingArrangementComplete = (content: string, queryType?: string): boolean => {
  if (!content || !queryType) return true; // If no content or query type, assume it's complete
  
  const normalizedContent = content.toLowerCase();
  
  // Check if the content mentions trading arrangements
  const hasTradingMention = normalizedContent.includes('trading arrangement') || 
                           normalizedContent.includes('timetable') || 
                           normalizedContent.includes('trading schedule');
  
  if (!hasTradingMention) return true; // Not a trading arrangement response
  
  // For specific corporate actions, check for expected elements
  switch(queryType) {
    case 'rights_issue':
      return checkRightsIssueCompleteness(normalizedContent);
    case 'open_offer':
      return checkOpenOfferCompleteness(normalizedContent);
    case 'share_consolidation':
    case 'share_subdivision':
      return checkShareReorganizationCompleteness(normalizedContent);
    case 'board_lot_change':
      return checkBoardLotCompleteness(normalizedContent);
    case 'company_name_change':
      return checkCompanyNameChangeCompleteness(normalizedContent);
    default:
      return true; // For unknown types, assume complete
  }
};
