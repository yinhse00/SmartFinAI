
import { getOptimalTemperature, getOptimalTokens } from '../utils/parameterUtils';
import { identifyFinancialQueryType } from '../utils/queryTypeUtils';
import { 
  getCorporateActionParameters,
  isTradingArrangementQuery,
  isSupportedCorporateAction
} from '../utils/corporateActionParameters';
import { isSimpleConversationalQuery } from '@/services/financial/expertiseDetection';

/**
 * Hook for determining optimal query parameters
 */
export const useQueryParameters = () => {
  const determineQueryParameters = (queryText: string) => {
    // Check if this is a simple conversational query
    const isSimpleQuery = isSimpleConversationalQuery(queryText);
    
    // For simple conversational queries, use minimal processing
    if (isSimpleQuery) {
      console.log('Simple conversational query detected, using minimal processing parameters');
      return {
        financialQueryType: 'conversational',
        temperature: 0.7,  // Higher temperature for more creative responses
        maxTokens: 2000    // Lower token limit for simple queries
      };
    }
    
    // For financial queries, continue with standard logic
    const financialQueryType = identifyFinancialQueryType(queryText);
    console.log('Financial Query Type:', financialQueryType);
    
    // Get base optimized parameters
    let maxTokens = getOptimalTokens(financialQueryType, queryText);
    let temperature = getOptimalTemperature(financialQueryType, queryText);
    
    // Special case for trading arrangements for various corporate actions
    if (isSupportedCorporateAction(financialQueryType) && 
        isTradingArrangementQuery(queryText)) {
      
      // Fine-tuned parameters based on corporate action type
      console.log(`Processing ${financialQueryType} trading arrangement query`);
      
      const corporateActionParams = getCorporateActionParameters(financialQueryType, queryText);
      maxTokens = corporateActionParams.maxTokens;
      temperature = corporateActionParams.temperature;
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
