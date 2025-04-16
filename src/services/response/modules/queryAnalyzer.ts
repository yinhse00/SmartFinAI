
import { isTradingArrangementQuery } from '../../regulatory/utils/queryDetector';

/**
 * Service for analyzing financial queries
 */
export const queryAnalyzer = {
  /**
   * Check if the query is a whitewash waiver query
   */
  isWhitewashQuery: (prompt: string): boolean => {
    return prompt.toLowerCase().includes('whitewash') ||
      (prompt.toLowerCase().includes('waiver') && prompt.toLowerCase().includes('general offer'));
  },
  
  /**
   * Check if the context contains takeovers code
   */
  hasTakeoversCode: (context?: string): boolean => {
    return !!context && 
      (context.toLowerCase().includes('codes on takeovers and mergers') ||
       context.toLowerCase().includes('takeovers code'));
  },
  
  /**
   * Check if context has trading arrangement info
   */
  hasTradeArrangementInfo: (context?: string): boolean => {
    return !!context && 
      (context.toLowerCase().includes('trading arrangement') || 
       context.toLowerCase().includes('Trading Arrangements.pdf'));
  },
  
  /**
   * Check if query is related to trading arrangements
   */
  isTradingArrangement: (prompt: string): boolean => {
    return isTradingArrangementQuery(prompt);
  }
};
