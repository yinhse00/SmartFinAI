
import { FINANCIAL_EXPERTISES } from '../constants/financialConstants';

/**
 * Detect financial expertise area needed for the query
 */
export function detectFinancialExpertiseArea(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  // First check for trading arrangement related queries
  if (isTradingArrangementQuery(prompt)) {
    const tradingType = determineTradingArrangementType(prompt);
    if (tradingType) return tradingType;
  }
  
  // Enhanced detection for general offers and takeovers code related queries
  if ((lowerPrompt.includes('general offer') || lowerPrompt.includes('mandatory offer') || 
       lowerPrompt.includes('takeover offer')) && 
      !lowerPrompt.includes('rights issue')) {
    return FINANCIAL_EXPERTISES.TAKEOVERS;
  }
  
  // Prioritize specific Hong Kong financial expertise areas
  if (lowerPrompt.includes('rights issue'))
    return FINANCIAL_EXPERTISES.RIGHTS_ISSUE;
    
  if (lowerPrompt.includes('open offer'))
    return FINANCIAL_EXPERTISES.OPEN_OFFER;
    
  if (lowerPrompt.includes('share consolidation') || 
      lowerPrompt.includes('sub-division') ||
      lowerPrompt.includes('subdivision'))
    return FINANCIAL_EXPERTISES.SHARE_CONSOLIDATION;
    
  if ((lowerPrompt.includes('board lot') || lowerPrompt.includes('lot size')) &&
      lowerPrompt.includes('change'))
    return FINANCIAL_EXPERTISES.BOARD_LOT_CHANGE;
    
  if (lowerPrompt.includes('company name') &&
      (lowerPrompt.includes('change') || lowerPrompt.includes('chinese name')))
    return FINANCIAL_EXPERTISES.COMPANY_NAME_CHANGE;
    
  if (lowerPrompt.includes('connected transaction') || 
      lowerPrompt.includes('chapter 14a'))
    return FINANCIAL_EXPERTISES.CONNECTED_TRANSACTIONS;
    
  if ((lowerPrompt.includes('takeover') || lowerPrompt.includes('takeovers code')))
    return FINANCIAL_EXPERTISES.TAKEOVERS;
    
  if (lowerPrompt.includes('prospectus') || 
      lowerPrompt.includes('offering document'))
    return FINANCIAL_EXPERTISES.PROSPECTUS;
    
  if (lowerPrompt.includes('disclosure') || 
      lowerPrompt.includes('announcement'))
    return FINANCIAL_EXPERTISES.DISCLOSURE;
    
  if (lowerPrompt.includes('circular') || 
      lowerPrompt.includes('shareholder approval'))
    return FINANCIAL_EXPERTISES.CIRCULAR;
    
  if (lowerPrompt.includes('waiver') || 
      lowerPrompt.includes('exemption'))
    return FINANCIAL_EXPERTISES.WAIVER;
    
  if (lowerPrompt.includes('listing rules') || 
      lowerPrompt.includes('hkex'))
    return FINANCIAL_EXPERTISES.LISTING_RULES;
    
  return FINANCIAL_EXPERTISES.GENERAL;
}

/**
 * Determine if a query is related to trading arrangements
 */
export function isTradingArrangementQuery(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  
  return lowerPrompt.includes('trading arrangement') || 
         (lowerPrompt.includes('trading') && lowerPrompt.includes('schedule')) ||
         ((lowerPrompt.includes('rights issue') || 
           lowerPrompt.includes('open offer') ||
           lowerPrompt.includes('share consolidation') ||
           lowerPrompt.includes('sub-division') ||
           lowerPrompt.includes('board lot') || 
           lowerPrompt.includes('company name')) && 
           (lowerPrompt.includes('timetable') || 
            lowerPrompt.includes('schedule')));
}

/**
 * Determine the specific type of trading arrangement query
 */
export function determineTradingArrangementType(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('rights issue'))
    return FINANCIAL_EXPERTISES.RIGHTS_ISSUE;
    
  if (lowerPrompt.includes('open offer'))
    return FINANCIAL_EXPERTISES.OPEN_OFFER;
    
  if (lowerPrompt.includes('share consolidation') || lowerPrompt.includes('sub-division'))
    return FINANCIAL_EXPERTISES.SHARE_CONSOLIDATION;
    
  if ((lowerPrompt.includes('board lot') || lowerPrompt.includes('lot size')))
    return FINANCIAL_EXPERTISES.BOARD_LOT_CHANGE;
    
  if (lowerPrompt.includes('company name') && 
      (lowerPrompt.includes('change') || lowerPrompt.includes('chinese name')))
    return FINANCIAL_EXPERTISES.COMPANY_NAME_CHANGE;
    
  return '';
}
