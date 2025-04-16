
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
    // For simple queries, skip extensive completeness checking
    if (isSimpleQuery) {
      return { 
        isComplete: true, 
        reasons: [], 
        financialAnalysis: { isComplete: true, missingElements: [] } 
      };
    }
    
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
    return isSimpleConversationalQuery(queryText);
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
