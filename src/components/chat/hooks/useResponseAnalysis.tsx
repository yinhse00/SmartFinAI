
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
    
    // Enhanced check for obvious truncation markers
    const hasObviousTruncation = responseText.endsWith('...') || 
                              responseText.includes("I'll continue") ||
                              responseText.includes('I will continue') ||
                              responseText.includes('In the next part') ||
                              responseText.includes('to be continued') ||
                              responseText.includes('will explain');
                              
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
    
    // Check for incomplete sentences at the end
    const matchResult = responseText.trim().match(/[.!?。]\s*$/);
    // Force explicit boolean conversion to fix type issues
    const endsWithCompleteSentence = matchResult !== null ? true : false;
    const lastSentenceIncomplete = !endsWithCompleteSentence;
    const isLongResponse = responseText.length > 1000;
    
    if (lastSentenceIncomplete && isLongResponse) {
      diagnostics.isTruncated = true;
      diagnostics.reasons.push('Response ends with incomplete sentence');
    }
    
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
