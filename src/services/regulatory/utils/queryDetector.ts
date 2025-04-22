
/**
 * Checks if this is a whitewash waiver query
 */
export function isWhitewashWaiverQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return normalizedQuery.includes('whitewash') || 
         normalizedQuery.includes('whitewashed') ||
         (normalizedQuery.includes('waiver') && normalizedQuery.includes('general offer'));
}

/**
 * Enhanced query detection with clearer regulatory distinctions
 * This specifically detects queries related to offers under the Takeovers Code
 */
export function isGeneralOfferQuery(query: string, isWhitewashQuery: boolean = false): boolean {
  const normalizedQuery = query.toLowerCase();
  
  // These are specific Takeovers Code terms
  const takeoversCodeTerms = [
    'general offer',
    'takeover',
    'mandatory offer',
    'rule 26',
    'codes on takeovers',
    'takeovers code'
  ];
  
  // If any Takeovers Code terms are found or it's a whitewash query, it's likely a Takeovers Code query
  return takeoversCodeTerms.some(term => normalizedQuery.includes(term)) || isWhitewashQuery;
}

/**
 * Checks if this is an open offer query (under Listing Rules)
 * Open offers are a capital-raising mechanism governed by Listing Rules
 */
export function isOpenOfferQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  
  // Check for open offer but exclude takeovers code terminology
  return normalizedQuery.includes('open offer') && 
         !normalizedQuery.includes('takeover') &&
         !normalizedQuery.includes('mandatory offer') &&
         !normalizedQuery.includes('rule 26') &&
         !normalizedQuery.includes('general offer');
}

/**
 * Checks if this is a trading arrangement query
 */
export function isTradingArrangementQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return normalizedQuery.includes('trading arrangement') || 
         normalizedQuery.includes('timetable') || 
         normalizedQuery.includes('schedule');
}

/**
 * Checks if this is a corporate action query
 */
export function isCorporateActionQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  const corporateActions = [
    'open offer',  // Distinguish from takeover offer
    'rights issue', 
    'share consolidation', 
    'board lot', 
    'company name change'
  ];
  return corporateActions.some(action => normalizedQuery.includes(action));
}
