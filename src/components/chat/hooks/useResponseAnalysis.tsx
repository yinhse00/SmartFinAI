
import { getTruncationDiagnostics } from '@/utils/truncation';
import { useTruncationDetection, isTradingArrangementRelated } from './useTruncationDetection';
import { isSimpleConversationalQuery } from '@/services/financial/expertiseDetection';

/**
 * Hook for analyzing response completeness and quality
 */
export const useResponseAnalysis = () => {
  const { isResponseComplete } = useTruncationDetection();

  const analyzeResponseCompleteness = (
    responseText: string,
    financialQueryType: string,
    queryText: string,
    isSimpleQuery: boolean
  ) => {
    // Fast-path for simple queries and shorter responses
    if (isSimpleQuery || responseText.length < 500) {
      return { 
        isComplete: true, 
        reasons: [], 
        financialAnalysis: { isComplete: true, missingElements: [] } 
      };
    }
    
    // Quick check for obvious truncation markers
    const hasObviousTruncation = responseText.endsWith('...') || 
                              responseText.includes('I'll continue') ||
                              responseText.includes('I will continue');
                              
    if (hasObviousTruncation) {
      return {
        isComplete: false,
        reasons: ['Response has obvious truncation markers'],
        financialAnalysis: { isComplete: false, missingElements: ['Complete response'] }
      };
    }
    
    // Only perform comprehensive check for complex financial/regulatory queries
    // Get basic diagnostics
    const diagnostics = getTruncationDiagnostics(responseText);
    
    // Do comprehensive completeness check for financial/regulatory queries
    const completenessCheck = isResponseComplete(
      responseText, 
      diagnostics, 
      financialQueryType, 
      queryText
    );
    
    return completenessCheck;
  };
  
  const isQuerySimple = (queryText: string): boolean => {
    return isSimpleConversationalQuery(queryText) || 
           queryText.length < 80 || 
           !queryText.includes('?');
  };
  
  const isQueryAggregationRelated = (queryText: string): boolean => {
    return queryText.toLowerCase().includes('aggregate') && 
           (queryText.toLowerCase().includes('rights issue') ||
            queryText.toLowerCase().includes('rule 7.19a'));
  };

  return {
    analyzeResponseCompleteness,
    isQuerySimple,
    isQueryAggregationRelated
  };
};
