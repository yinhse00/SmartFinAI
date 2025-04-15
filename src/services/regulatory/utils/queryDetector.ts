
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
 * Checks if this is a general offer query
 */
export function isGeneralOfferQuery(query: string, isWhitewashQuery: boolean = false): boolean {
  const normalizedQuery = query.toLowerCase();
  return normalizedQuery.includes('general offer') || 
         normalizedQuery.includes('takeover') ||
         normalizedQuery.includes('mandatory offer') ||
         isWhitewashQuery;
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
  const corporateActions = ['rights issue', 'open offer', 'share consolidation', 'board lot', 'company name change'];
  return corporateActions.some(action => normalizedQuery.includes(action));
}
