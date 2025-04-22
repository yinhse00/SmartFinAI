/**
 * Utilities for identifying financial query types with enhanced regulatory nuance
 */

import { FINANCIAL_EXPERTISES } from '@/services/constants/financialConstants';

export const FINANCIAL_QUERY_TYPES = {
  RIGHTS_ISSUE: 'rights_issue',
  CONNECTED_TRANSACTION: 'connected_transaction',
  TAKEOVERS: 'takeovers',
  OPEN_OFFER: 'open_offer',
  TAKEOVER_OFFER: 'takeover_offer',
  PROSPECTUS: 'prospectus',
  SHARE_CONSOLIDATION: 'share_consolidation',
  BOARD_LOT_CHANGE: 'board_lot_change',
  COMPANY_NAME_CHANGE: 'company_name_change',
  GENERAL: 'general'
};

/**
 * Identify the type of financial query with enhanced regulatory precision
 */
export const identifyFinancialQueryType = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  // Open Offer Detection (Listing Rules specific)
  if (lowerQuery.includes('open offer') && 
      !lowerQuery.includes('takeover') && 
      !lowerQuery.includes('mandatory')) {
    return FINANCIAL_QUERY_TYPES.OPEN_OFFER;
  }
  
  // Takeover Offer Detection (Takeovers Code specific)
  if ((lowerQuery.includes('offer') && lowerQuery.includes('takeover')) || 
      lowerQuery.includes('mandatory offer') || 
      lowerQuery.includes('rule 26') || 
      lowerQuery.includes('whitewash')) {
    return FINANCIAL_QUERY_TYPES.TAKEOVER_OFFER;
  }
  
  if (lowerQuery.includes('share consolidation') || 
      lowerQuery.includes('sub-division') || 
      lowerQuery.includes('subdivision')) {
    return FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION;
  }
  
  if ((lowerQuery.includes('board lot') || lowerQuery.includes('lot size')) && 
      lowerQuery.includes('change')) {
    return FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE;
  }
  
  if (lowerQuery.includes('company name') && 
      (lowerQuery.includes('change') || lowerQuery.includes('chinese name'))) {
    return FINANCIAL_QUERY_TYPES.COMPANY_NAME_CHANGE;
  }
  
  if (lowerQuery.includes('connected transaction') || lowerQuery.includes('chapter 14a')) {
    return FINANCIAL_QUERY_TYPES.CONNECTED_TRANSACTION;
  }
  
  if (lowerQuery.includes('prospectus') || lowerQuery.includes('offering document') || lowerQuery.includes('ipo')) {
    return FINANCIAL_QUERY_TYPES.PROSPECTUS;
  }
  
  return FINANCIAL_QUERY_TYPES.GENERAL;
};

/**
 * Check if a query is related to trading arrangements
 */
export const isTradingArrangementRelated = (query: string): boolean => {
  const lowerQuery = query.toLowerCase();
  
  return lowerQuery.includes('trading arrangement') || 
         lowerQuery.includes('timetable') || 
         lowerQuery.includes('schedule') || 
         (lowerQuery.includes('trading') && 
          (lowerQuery.includes('rights') || 
           lowerQuery.includes('offer') || 
           lowerQuery.includes('consolidation') || 
           lowerQuery.includes('lot size') || 
           lowerQuery.includes('name change')));
};
