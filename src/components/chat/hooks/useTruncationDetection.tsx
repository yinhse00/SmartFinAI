
import { logTruncation, LogLevel } from '@/utils/truncation';
import { detectTruncation, checkUnbalancedConstructs } from '@/utils/truncation/basicDetection';
import { analyzeFinancialResponse } from '@/utils/truncation/financialResponseAnalyzer';

/**
 * Hook for specialized truncation detection
 */
export const useTruncationDetection = () => {
  /**
   * Check if a response is complete based on various specialized criteria
   */
  const isResponseComplete = (
    content: string,
    diagnosticsResult: { isTruncated: boolean; reasons: string[] },
    queryType: string,
    queryText: string
  ): { 
    isComplete: boolean, 
    reasons: string[],
    financialAnalysis: any 
  } => {
    // Initial state assumes completeness unless proven otherwise
    let isComplete = !diagnosticsResult.isTruncated;
    const reasons: string[] = [...diagnosticsResult.reasons];
    
    // Check for critical financial requirements
    const isAggregationQuery = queryText.toLowerCase().includes('aggregate') || 
                            queryText.toLowerCase().includes('rule 7.19a') || 
                            queryText.toLowerCase().includes('within 12 months');
    
    // Special checks for Rule 7.19A aggregation queries
    if (isAggregationQuery) {
      const hasKeyElements = content.toLowerCase().includes('50% threshold') && 
                           content.toLowerCase().includes('independent shareholders') && 
                           content.toLowerCase().includes('12 month');
      
      const hasDirectAnswer = content.toLowerCase().includes('need to seek') || 
                           content.toLowerCase().includes('approval is required') || 
                           content.toLowerCase().includes('approval is not required') ||
                           content.toLowerCase().includes('needs approval') || 
                           content.toLowerCase().includes('does not need approval');
      
      const hasConclusion = content.toLowerCase().includes('conclusion') || 
                         content.toLowerCase().includes('in summary') || 
                         content.toLowerCase().includes('to summarize');
      
      if (!hasKeyElements) {
        isComplete = false;
        reasons.push("Missing key aggregation requirements information");
      }
      
      if (!hasDirectAnswer) {
        isComplete = false;
        reasons.push("No direct answer to the approval requirement question");
      }
      
      if (!hasConclusion && content.length > 3000) {
        isComplete = false;
        reasons.push("Missing conclusion section");
      }
    }
    
    // Financial content-specific analysis
    const financialAnalysis = analyzeFinancialResponse(content, queryType);
    
    // Only check for trading arrangement truncation if not already detected
    const isTradingArrangementTruncated = !diagnosticsResult.isTruncated && 
                                    isTradingArrangementRelated(queryText) && 
                                    !isTradingArrangementComplete(content, queryType);
    
    // Collect reasons for incompleteness
    if (diagnosticsResult.isTruncated) {
      isComplete = false;
      // No need to add this reason if it's already in the reasons array
      if (!reasons.includes("Response appears truncated by advanced indicators")) {
        reasons.push("Response appears truncated by advanced indicators");
      }
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
    
    // For Rule 7.19A responses that look complete despite truncation indicators
    if (isAggregationQuery && 
        content.toLowerCase().includes('50% threshold') && 
        content.toLowerCase().includes('independent shareholders') && 
        content.toLowerCase().includes('12 month') &&
        content.toLowerCase().includes('in conclusion') &&
        content.toLowerCase().includes('approval')) {
      
      // Include as an additional check but don't override overall completeness
      reasons.push("Response contains all key aggregation elements but may have other issues");
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

// Helper function to check if trading arrangement content is complete
function isTradingArrangementComplete(content: string, queryType: string): boolean {
  // Simple implementation to prevent errors
  return content.toLowerCase().includes('timetable') && 
         content.toLowerCase().includes('ex-date') && 
         content.toLowerCase().includes('record date');
}
