
/**
 * Utilities for optimizing parameters for corporate action queries
 */

/**
 * Gets optimized parameters for corporate action trading arrangement queries
 * @param financialQueryType The type of financial query
 * @param queryText The original query text
 * @returns Parameters optimized for the corporate action
 */
export const getCorporateActionParameters = (
  financialQueryType: string,
  queryText: string
): { maxTokens: number; temperature: number } => {
  // Default values for most corporate actions
  let maxTokens = 30000;
  let temperature = 0.03;

  // Set even more precise parameters for rights issue timetables
  if (financialQueryType === 'rights_issue') {
    maxTokens = 250000; // Increased token limit for rights issue timetables 
    temperature = 0.01; // Very precise temperature for structured output
  }

  console.log(`Using specialized corporate action parameters - Type: ${financialQueryType}, Temperature: ${temperature}, Tokens: ${maxTokens}`);
  
  return { maxTokens, temperature };
};

/**
 * Determines if a query is related to trading arrangements
 * @param queryText The query text to analyze
 * @returns True if the query is related to trading arrangements
 */
export const isTradingArrangementQuery = (queryText: string): boolean => {
  const normalizedQuery = queryText.toLowerCase();
  return normalizedQuery.includes('trading arrangement') || 
         normalizedQuery.includes('timetable') || 
         normalizedQuery.includes('schedule');
};

/**
 * Checks if a query is for a corporate action that requires special handling
 * @param financialQueryType The type of financial query
 * @returns True if the query is for a supported corporate action
 */
export const isSupportedCorporateAction = (financialQueryType: string): boolean => {
  return ['rights_issue', 'open_offer', 'share_consolidation', 'board_lot_change', 'company_name_change']
    .includes(financialQueryType);
};
