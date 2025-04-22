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
  
  // Explicit check - if it's specifically about open offers as a corporate action, it's NOT a general offer query
  if (isOpenOfferQuery(query)) {
    return false; // Critical: Open offers are corporate actions under Listing Rules, not Takeovers Code
  }
  
  // If it has execution process terms, check for takeovers code terminology
  if (hasExecutionProcessTerms(normalizedQuery) && !hasListingRulesTerms(normalizedQuery)) {
    return hasTakeoversCodeTerms(normalizedQuery);
  }
  
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
  // BUT NOT if it's clearly an open offer query
  return takeoversCodeTerms.some(term => normalizedQuery.includes(term)) && !isOpenOfferQuery(query) || isWhitewashQuery;
}

/**
 * Checks if this is an open offer query (CORPORATE ACTION under Listing Rules)
 * Open offers are a capital-raising corporate action governed by Listing Rules Chapter 7
 */
export function isOpenOfferQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  
  // Strong explicit check for "open offer" term to ensure it's about the corporate action
  if (normalizedQuery.includes('open offer')) {
    // If it has execution process terms, check for listing rules terminology
    if (hasExecutionProcessTerms(normalizedQuery)) {
      return !hasTakeoversCodeTerms(normalizedQuery);
    }
    
    // Look for corporate action or listing rules context clues
    const corporateActionClues = [
      'corporate action',
      'listing rule',
      'capital raising',
      'fundraising',
      'chapter 7',
      'rule 7',
      'shareholder'
    ];
    
    // If we find explicit corporate action/listing rule clues, we're more confident it's an open offer query
    const hasCorporateActionClues = corporateActionClues.some(clue => normalizedQuery.includes(clue));
    
    // Check for takeovers code clues which would indicate it's NOT about open offers
    const takeoversCodeClues = [
      'takeover',
      'mandatory offer',
      'rule 26',
      'acquisition'
    ];
    
    // If there are takeovers code clues, it's likely not about open offers (corporate action)
    const hasTakeoversCodeClues = takeoversCodeClues.some(clue => normalizedQuery.includes(clue));
    
    // If we have corporate action clues or no takeovers code clues, classify as open offer
    return hasCorporateActionClues || !hasTakeoversCodeClues;
  }
  
  return false;
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
 * Checks if this is a trading arrangement guide query
 */
export function isTradingArrangementGuideQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return normalizedQuery.includes('guide on trading') || 
         normalizedQuery.includes('trading arrangements guide') || 
         normalizedQuery.includes('trading arrangement') || 
         (normalizedQuery.includes('trading') && 
          normalizedQuery.includes('arrangement'));
}

/**
 * Checks if this is a corporate action query
 */
export function isCorporateActionQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  const corporateActions = [
    'open offer',  // CORPORATE ACTION under Listing Rules
    'rights issue', 
    'share consolidation', 
    'board lot', 
    'company name change'
  ];
  return corporateActions.some(action => normalizedQuery.includes(action));
}

/**
 * Checks if this is a share reorganization query
 */
export function isShareReorganizationQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return normalizedQuery.includes('share consolidation') || 
         normalizedQuery.includes('consolidation of shares') || 
         normalizedQuery.includes('sub-division') || 
         normalizedQuery.includes('subdivision') || 
         normalizedQuery.includes('split') && 
         normalizedQuery.includes('share');
}

/**
 * Checks if this is a board lot size change query
 */
export function isBoardLotChangeQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return (normalizedQuery.includes('board lot') || 
          normalizedQuery.includes('lot size')) && 
         normalizedQuery.includes('change');
}

/**
 * Checks if this is a company name change query
 */
export function isCompanyNameChangeQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return normalizedQuery.includes('company name') && 
        (normalizedQuery.includes('change') || normalizedQuery.includes('chinese name'));
}

/**
 * Checks if this is a specific corporate action covered by the trading arrangements guide
 */
export function isGuideCoveredCorporateActionQuery(query: string): boolean {
  return isOpenOfferQuery(query) ||
         isShareReorganizationQuery(query) ||
         isBoardLotChangeQuery(query) ||
         isCompanyNameChangeQuery(query) ||
         query.toLowerCase().includes('rights issue');
}

/**
 * Explicitly checks if query relates to takeovers code (NOT corporate actions)
 * This helps distinguish between regulatory frameworks
 */
export function isTakeoversCodeQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  
  // If it's an open offer query, it's NOT a takeovers code query
  if (isOpenOfferQuery(query)) {
    return false;
  }
  
  // If it has execution process terms, check for takeovers code terminology
  if (hasExecutionProcessTerms(normalizedQuery)) {
    return hasTakeoversCodeTerms(normalizedQuery);
  }
  
  const takeoversTerms = [
    'takeover',
    'general offer',
    'mandatory offer',
    'voluntary offer',
    'rule 26',
    'takeovers code',
    'whitewash',
    'concert parties'
  ];
  
  return takeoversTerms.some(term => normalizedQuery.includes(term));
}

/**
 * Check if query contains execution process terms
 */
export function hasExecutionProcessTerms(query: string): boolean {
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
  
  return executionTerms.some(term => query.includes(term));
}

/**
 * Check if query contains Listing Rules terminology
 */
export function hasListingRulesTerms(query: string): boolean {
  const listingRulesTerms = [
    'listing rule',
    'chapter 7',
    'rule 7',
    'corporate action',
    'capital raising',
    'rights issue',
    'board lot',
    'share consolidation'
  ];
  
  return listingRulesTerms.some(term => query.includes(term));
}

/**
 * Check if query contains Takeovers Code terminology
 */
export function hasTakeoversCodeTerms(query: string): boolean {
  const takeoversTerms = [
    'takeover',
    'general offer',
    'mandatory offer',
    'voluntary offer',
    'rule 26',
    'takeovers code',
    'sfc',
    'securities and futures commission'
  ];
  
  return takeoversTerms.some(term => query.includes(term));
}

/**
 * Checks if query specifically relates to execution processes
 */
export function isExecutionProcessQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  const executionTerms = [
    'execution process', 
    'working process', 
    'execution timeline',
    'working procedure',
    'execution timetable',
    'preparation steps',
    'execution steps'
  ];
  
  return executionTerms.some(term => normalizedQuery.includes(term));
}
