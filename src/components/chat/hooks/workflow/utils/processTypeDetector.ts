
/**
 * Utility for detecting the type of regulatory process based on query content
 */
export const detectProcessType = (query: string, takeoversCodeContext?: string): string => {
  const normalizedQuery = query.toLowerCase();
  
  const isTakeoverRelated = 
    normalizedQuery.includes('takeover') ||
    normalizedQuery.includes('general offer') ||
    normalizedQuery.includes('mandatory offer') ||
    (takeoversCodeContext && takeoversCodeContext.length > 100);
  
  const isRightsIssueRelated = 
    normalizedQuery.includes('rights issue') ||
    normalizedQuery.includes('rights offering');
      
  const isOpenOfferRelated = 
    normalizedQuery.includes('open offer');
      
  const isConnectedTransactionRelated = 
    normalizedQuery.includes('connected transaction') ||
    normalizedQuery.includes('chapter 14a');
  
  if (isTakeoverRelated) return 'takeovers_code';
  if (isRightsIssueRelated) return 'rights_issue';
  if (isOpenOfferRelated) return 'open_offer';
  if (isConnectedTransactionRelated) return 'connected_transaction';
  return 'generic';
};

/**
 * Check if query is specifically about execution process
 */
export const isExecutionProcessQuery = (query: string): boolean => {
  const normalizedQuery = query.toLowerCase();
  return normalizedQuery.includes('execution') || 
         normalizedQuery.includes('timetable') ||
         normalizedQuery.includes('timeline') ||
         normalizedQuery.includes('schedule') ||
         normalizedQuery.includes('process');
};
