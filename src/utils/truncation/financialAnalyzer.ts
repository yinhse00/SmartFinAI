
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
  
  // Check for obvious truncation patterns
  if (content.endsWith('...') || 
      content.endsWith('…') || 
      (content.length > 0 && content.length < 50)) {
    analysis.isTruncated = true;
    analysis.isComplete = false;
    analysis.missingElements.push("Response appears truncated by basic indicators");
  }
  
  // CRITICAL CHECK: For open offers, ensure Guide on Trading Arrangements is referenced
  if (financialQueryType === 'open_offer' && 
      !content.toLowerCase().includes('guide on trading arrangements')) {
    analysis.isComplete = false;
    analysis.missingElements.push("CRITICAL: Open offer response must reference Guide on Trading Arrangements");
  }
  
  // Only run financial analysis for specific financial query types
  if (financialQueryType && 
      ['rights_issue', 'open_offer', 'takeovers', 'listing_rules'].includes(financialQueryType)) {
    const financialAnalysis = analyzeFinancialResponseDetails(content, financialQueryType);
    
    // Open offers are critical - be strict about completeness for them
    if (financialQueryType === 'open_offer') {
      // Any missing elements for open offers are critical
      if (financialAnalysis.missingElements.length > 0) {
        analysis.isComplete = false;
        analysis.missingElements.push(...financialAnalysis.missingElements);
      }
    } else {
      // For other types, use more lenient criteria
      if (financialAnalysis.missingElements.length > 2) {
        analysis.isComplete = false;
        analysis.missingElements.push(...financialAnalysis.missingElements);
      }
    }
  }
  
  return analysis;
};
