
import { isTradingArrangementComplete, analyzeFinancialResponse } from '@/utils/truncation';

/**
 * Hook for specialized truncation detection
 */
export const useTruncationDetection = () => {
  /**
   * Check if a response is complete based on various specialized criteria
   */
  const isResponseComplete = (
    content: string,
    diagnosticsResult: { isTruncated: boolean },
    queryType: string,
    queryText: string
  ): { 
    isComplete: boolean, 
    reasons: string[],
    financialAnalysis: any 
  } => {
    // Initial state assumes completeness unless proven otherwise
    let isComplete = !diagnosticsResult.isTruncated;
    const reasons: string[] = [];
    
    // Financial content-specific analysis
    const financialAnalysis = analyzeFinancialResponse(content, queryType);
    
    // Only check for trading arrangement truncation if not already detected
    const isTradingArrangementTruncated = !diagnosticsResult.isTruncated && 
                                    isTradingArrangementRelated(queryText) && 
                                    !isTradingArrangementComplete(content, queryType);
    
    // Collect reasons for incompleteness
    if (diagnosticsResult.isTruncated) {
      isComplete = false;
      reasons.push("Standard truncation detected");
    }
    
    if (isTradingArrangementTruncated) {
      isComplete = false;
      reasons.push("Trading arrangement information incomplete");
    }
    
    if (!financialAnalysis.isComplete) {
      isComplete = false;
      financialAnalysis.missingElements.forEach((element: string) => {
        reasons.push(`Missing ${element}`);
      });
    }
    
    return {
      isComplete: isComplete,
      reasons: reasons,
      financialAnalysis: financialAnalysis
    };
  };

  return {
    isResponseComplete
  };
};

// Helper function to check if a query is related to trading arrangements
export function isTradingArrangementRelated(queryText: string): boolean {
  const normalizedQuery = queryText.toLowerCase();
  return normalizedQuery.includes('trading arrangement') || 
         normalizedQuery.includes('timetable') || 
         normalizedQuery.includes('schedule');
}
