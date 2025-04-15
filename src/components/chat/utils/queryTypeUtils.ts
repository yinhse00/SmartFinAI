
/**
 * Utilities for identifying financial query types
 */

export const FINANCIAL_QUERY_TYPES = {
  RIGHTS_ISSUE: 'rights_issue',
  CONNECTED_TRANSACTION: 'connected_transaction',
  TAKEOVERS: 'takeovers',
  PROSPECTUS: 'prospectus',
  OPEN_OFFER: 'open_offer',
  SHARE_CONSOLIDATION: 'share_consolidation',
  BOARD_LOT_CHANGE: 'board_lot_change',
  COMPANY_NAME_CHANGE: 'company_name_change',
  GENERAL: 'general'
};

/**
 * Identify the type of financial query based on content
 */
export const identifyFinancialQueryType = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('rights issue')) {
    return FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE;
  } 
  
  if (lowerQuery.includes('open offer')) {
    return FINANCIAL_QUERY_TYPES.OPEN_OFFER;
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
  
  if (lowerQuery.includes('takeover') || lowerQuery.includes('mandatory offer') || lowerQuery.includes('rule 26')) {
    return FINANCIAL_QUERY_TYPES.TAKEOVERS;
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
