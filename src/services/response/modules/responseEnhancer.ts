
import { FINANCIAL_EXPERTISES } from '../../constants/financialConstants';
import { getFallbackTradingArrangement, isWellFormattedTimetable } from '../../financial/tradingArrangements';
import { isTradingArrangementQuery, determineTradingArrangementType } from '../../financial/expertiseDetection';
import { isTradingArrangementComplete } from '@/utils/truncationUtils';

/**
 * Service for enhancing and fixing responses
 */
export const responseEnhancer = {
  /**
   * Enhance response quality with specialized handling for financial topics
   */
  enhanceResponseQuality: (responseText: string, queryType: string, prompt: string): string => {
    let finalResponse = responseText;
    
    // Check for trading arrangement queries that need specialized handling
    if (isTradingArrangementQuery(prompt)) {
      const tradingArrangementType = determineTradingArrangementType(prompt);
      
      if (tradingArrangementType && 
          !isTradingArrangementComplete(responseText, tradingArrangementType)) {
        console.log(`Using fallback trading arrangement for ${tradingArrangementType}`);
        finalResponse = getFallbackTradingArrangement(tradingArrangementType, prompt);
      }
    }
    // Rights issue timetable special case
    else if (queryType === FINANCIAL_EXPERTISES.RIGHTS_ISSUE && 
        prompt.toLowerCase().includes('timetable') &&
        !isWellFormattedTimetable(responseText)) {
      console.log('Using fallback professional timetable format for rights issue');
      finalResponse = require('../../constants/fallbackConstants').RIGHTS_ISSUE_TIMETABLE_FALLBACK;
    }
    
    return finalResponse;
  }
};
