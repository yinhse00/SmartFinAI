/**
 * Utilities for identifying financial query types with enhanced regulatory nuance
 */

import { FINANCIAL_EXPERTISES, FRAMEWORK_TERMINOLOGY, REGULATORY_FRAMEWORKS } from '@/services/constants/financialConstants';
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
  
  // CRITICAL: First check - explicitly look for process/timetable/execution terms
  // Execution process detection
  if (isExecutionProcessQuery(query)) {
    console.log("Identified as EXECUTION PROCESS query");
    
    // Determine if it's Listing Rules or Takeovers Code related
    if (hasTakeoversTerms(query)) {
      // Takeovers Code execution process
      console.log("Identified as TAKEOVER_OFFER execution process");
      return FINANCIAL_QUERY_TYPES.TAKEOVER_OFFER;
    } else if (lowerQuery.includes('open offer')) {
      // Open Offer execution process
      console.log("Identified as OPEN_OFFER execution process");
      return FINANCIAL_QUERY_TYPES.OPEN_OFFER;
    } else if (lowerQuery.includes('rights issue')) {
      // Rights Issue execution process
      console.log("Identified as RIGHTS_ISSUE execution process");
      return FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE;
    } else if (lowerQuery.includes('share consolidation') || lowerQuery.includes('sub-division') || lowerQuery.includes('subdivision')) {
      // Share consolidation execution process
      console.log("Identified as SHARE_CONSOLIDATION execution process");
      return FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION;
    } else if ((lowerQuery.includes('board lot') || lowerQuery.includes('lot size')) && lowerQuery.includes('change')) {
      // Board lot change execution process
      console.log("Identified as BOARD_LOT_CHANGE execution process");
      return FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE;
    } else if (lowerQuery.includes('company name') && (lowerQuery.includes('change') || lowerQuery.includes('chinese name'))) {
      // Company name change execution process
      console.log("Identified as COMPANY_NAME_CHANGE execution process");
      return FINANCIAL_QUERY_TYPES.COMPANY_NAME_CHANGE;
    }
  }
  
  // CRITICAL: Second check - check for specific corporate actions covered by the trading arrangements guide
  if (lowerQuery.includes('guide on trading') || lowerQuery.includes('trading arrangements guide')) {
    // If query mentions specific corporate actions
    if (lowerQuery.includes('rights issue')) {
      return FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE;
    } else if (lowerQuery.includes('open offer')) {
      return FINANCIAL_QUERY_TYPES.OPEN_OFFER;
    } else if (lowerQuery.includes('share consolidation') || lowerQuery.includes('sub-division') || lowerQuery.includes('subdivision')) {
      return FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION;
    } else if ((lowerQuery.includes('board lot') || lowerQuery.includes('lot size')) && lowerQuery.includes('change')) {
      return FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE;
    } else if (lowerQuery.includes('company name') && (lowerQuery.includes('change') || lowerQuery.includes('chinese name'))) {
      return FINANCIAL_QUERY_TYPES.COMPANY_NAME_CHANGE;
    }
  }
  
  // CRITICAL: Third check - explicitly look for "open offer" as corporate action
  // Open Offer Detection (Listing Rules corporate action)
  if (isOpenOfferQuery(query)) {
    // This is a corporate action under Listing Rules Chapter 7
    console.log("Identified as OPEN OFFER - corporate action under Listing Rules");
    return FINANCIAL_QUERY_TYPES.OPEN_OFFER;
  }
  
  // CRITICAL: Fourth check - explicitly look for takeovers code terms
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
 * Check if query is about execution process, timetable or working procedure
 */
export const isExecutionProcessQuery = (query: string): boolean => {
  const lowerQuery = query.toLowerCase();
  
  const executionTerms = [
    'execution', 
    'process', 
    'timeline', 
    'working', 
    'procedure', 
    'steps',
    'timetable execution',
    'working process'
  ];
  
  return executionTerms.some(term => lowerQuery.includes(term));
};

/**
 * Check if a query contains Takeovers Code terms
 */
export const hasTakeoversTerms = (query: string): boolean => {
  const lowerQuery = query.toLowerCase();
  
  return FRAMEWORK_TERMINOLOGY.TAKEOVERS_CODE.some(term => lowerQuery.includes(term));
};

/**
 * Check if a query contains Listing Rules terms
 */
export const hasListingRulesTerms = (query: string): boolean => {
  const lowerQuery = query.toLowerCase();
  
  return FRAMEWORK_TERMINOLOGY.LISTING_RULES.some(term => lowerQuery.includes(term));
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

/**
 * Get explanatory text about regulatory framework distinction
 * This is used when potential confusion is detected
 */
export const getRegulatoryFrameworkDistinctionText = (): string => {
  return `
IMPORTANT REGULATORY DISTINCTION:

1. Open Offers (under Listing Rules Chapter 7):
   - Corporate action for capital raising by listed companies
   - No trading in nil-paid rights
   - Regulated by the Stock Exchange of Hong Kong Limited
   - Focus on fundraising for the issuer

2. Takeover/General Offers (under Takeovers Code):
   - Acquisition mechanism for obtaining control of a company
   - Subject to mandatory offer thresholds (30%)
   - Regulated by the Securities and Futures Commission
   - Focus on change of control and shareholder protection

These are completely different regulatory concepts governed by different rules.
  `;
};

/**
 * Check if query relates specifically to trading arrangements guide
 */
export const isGuideCoveredActionQuery = (query: string): boolean => {
  const lowerQuery = query.toLowerCase();
  
  return (
    (lowerQuery.includes('guide') && lowerQuery.includes('trading')) ||
    (lowerQuery.includes('trading arrangements') && 
     (lowerQuery.includes('rights issue') ||
      lowerQuery.includes('open offer') ||
      lowerQuery.includes('share consolidation') ||
      lowerQuery.includes('sub-division') ||
      lowerQuery.includes('board lot') ||
      lowerQuery.includes('company name')))
  );
};
