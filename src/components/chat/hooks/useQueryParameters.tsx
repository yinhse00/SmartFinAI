
import { getOptimalTemperature, getOptimalTokens } from '../utils/parameterUtils';
import { identifyFinancialQueryType } from '../utils/queryTypeUtils';

/**
 * Hook for determining optimal query parameters
 */
export const useQueryParameters = () => {
  const determineQueryParameters = (queryText: string) => {
    // Determine the financial query type
    const financialQueryType = identifyFinancialQueryType(queryText);
    console.log('Financial Query Type:', financialQueryType);
    
    // Optimized parameters for preventing truncation
    let maxTokens = getOptimalTokens(financialQueryType, queryText);
    let temperature = getOptimalTemperature(financialQueryType, queryText);
    
    // Special case for trading arrangements for various corporate actions
    if ((financialQueryType === 'rights_issue' || 
         financialQueryType === 'open_offer' || 
         financialQueryType === 'share_consolidation' || 
         financialQueryType === 'board_lot_change' || 
         financialQueryType === 'company_name_change') && 
        (queryText.toLowerCase().includes('timetable') || 
         queryText.toLowerCase().includes('trading arrangement') || 
         queryText.toLowerCase().includes('schedule'))) {
      
      // Fine-tuned parameters based on corporate action type
      console.log(`Processing ${financialQueryType} trading arrangement query`);
      
      // Set even more precise parameters for rights issue timetables
      if (financialQueryType === 'rights_issue') {
        maxTokens = 250000; // Increased token limit for rights issue timetables 
        temperature = 0.01; // Very precise temperature for structured output
      } else {
        maxTokens = 30000; // Increased from 15,000 to 30,000 for other corporate actions
        temperature = 0.03; // Lower temperature for consistent output
      }
    }
    
    console.log(`Using specialized parameters - Temperature: ${temperature}, Tokens: ${maxTokens}`);
    
    return { 
      financialQueryType,
      temperature,
      maxTokens
    };
  };

  return {
    determineQueryParameters
  };
};
