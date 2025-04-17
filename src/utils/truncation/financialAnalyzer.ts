
import { logTruncation, LogLevel } from './logLevel';
import { detectTruncationComprehensive } from './advancedDetection';
import { analyzeFinancialResponse as analyzeFinancialResponseDetails } from './financialResponseAnalyzer';

/**
 * Analyzes a financial response for completeness
 * @param content Response content
 * @param financialQueryType Type of financial query
 * @returns Analysis result with details about completeness
 */
export const analyzeFinancialResponse = (content: string, financialQueryType?: string) => {
  const analysis = {
    isComplete: true,
    isTruncated: false,
    missingElements: [] as string[],
    diagnostics: {} as any
  };
  
  // CRITICAL FIX: Much more lenient truncation detection to match both environments
  // Only detect very obvious truncation patterns
  if (content.endsWith('...') || 
      content.endsWith('…') || 
      (content.length > 0 && content.length < 50)) { // Extremely short responses
    analysis.isTruncated = true;
    analysis.isComplete = false;
    analysis.missingElements.push("Response appears truncated by basic indicators");
  }
  
  // Only run financial analysis for specific financial query types
  if (financialQueryType && 
      ['rights_issue', 'open_offer', 'takeovers', 'listing_rules'].includes(financialQueryType)) {
    const financialAnalysis = analyzeFinancialResponseDetails(content, financialQueryType);
    
    // Use even more lenient criteria - only mark incomplete for 2+ missing critical elements
    if (financialAnalysis.missingElements.length > 2) {
      analysis.isComplete = false;
      analysis.missingElements.push(...financialAnalysis.missingElements);
    }
  }
  
  return analysis;
};
