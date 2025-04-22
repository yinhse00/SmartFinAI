/**
 * Utilities for identifying financial query types with enhanced regulatory nuance
 */

import { FINANCIAL_EXPERTISES, FRAMEWORK_TERMINOLOGY } from '@/services/constants/financialConstants';
import { 
  isOpenOfferQuery, 
  isGeneralOfferQuery, 
  isTakeoversCodeQuery 
} from '@/services/regulatory/utils/queryDetector';

export const FINANCIAL_QUERY_TYPES = {
  RIGHTS_ISSUE: 'rights_issue',
  CONNECTED_TRANSACTION: 'connected_transaction',
  TAKEOVERS: 'takeovers',
  OPEN_OFFER: 'open_offer', // CORPORATE ACTION under Listing Rules (Chapter 7)
  TAKEOVER_OFFER: 'takeover_offer', // Under Takeovers Code only
  PROSPECTUS: 'prospectus',
  SHARE_CONSOLIDATION: 'share_consolidation',
  BOARD_LOT_CHANGE: 'board_lot_change',
  COMPANY_NAME_CHANGE: 'company_name_change',
  GENERAL: 'general'
};

/**
 * Identify the type of financial query with enhanced regulatory precision
 * Ensures open offers (corporate actions) are never confused with takeover offers
 */
export const identifyFinancialQueryType = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  // CRITICAL: First check - explicitly look for "open offer" as corporate action
  // Open Offer Detection (Listing Rules corporate action)
  if (isOpenOfferQuery(query)) {
    // This is a corporate action under Listing Rules Chapter 7
    console.log("Identified as OPEN OFFER - corporate action under Listing Rules");
    return FINANCIAL_QUERY_TYPES.OPEN_OFFER;
  }
  
  // CRITICAL: Second check - explicitly look for takeovers code terms
  if (isTakeoversCodeQuery(query)) {
    console.log("Identified as TAKEOVER_OFFER - under Takeovers Code");
    return FINANCIAL_QUERY_TYPES.TAKEOVER_OFFER;
  }
  
  // Takeover Offer Detection (Takeovers Code specific)
  if (isGeneralOfferQuery(query)) {
    console.log("Identified as TAKEOVER_OFFER through general offer check");
    return FINANCIAL_QUERY_TYPES.TAKEOVER_OFFER;
  }
  
  // Additional checks for other financial query types
  // IMPORTANT: Only check for "open offer" after the more specific isOpenOfferQuery check above
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
  
  if (lowerQuery.includes('rights issue')) {
    return FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE;
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

/**
 * Check if query appears to conflate different regulatory frameworks
 * This helps detect when a user might be confusing open offers with takeover offers
 */
export const detectRegulatoryFrameworkConfusion = (query: string): boolean => {
  const lowerQuery = query.toLowerCase();
  
  // Check if query mentions both listing rules and takeovers code terms
  const hasListingRulesTerms = FRAMEWORK_TERMINOLOGY.LISTING_RULES.some(term => 
    lowerQuery.includes(term)
  );
  
  const hasTakeoversCodeTerms = FRAMEWORK_TERMINOLOGY.TAKEOVERS_CODE.some(term => 
    lowerQuery.includes(term)
  );
  
  // Check specifically for "open offer" alongside takeovers terminology
  const potentialConfusion = 
    (lowerQuery.includes('open offer') && hasTakeoversCodeTerms) ||
    (lowerQuery.includes('takeover') && lowerQuery.includes('open offer'));
  
  return potentialConfusion;
};
