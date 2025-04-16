
import { detectTruncationComprehensive } from './advancedDetection';
import { logTruncation, LogLevel } from './logLevel';
import { analyzeFinancialResponse as analyzeFinancialResponseDetails } from './financialResponseAnalyzer';

/**
 * Analyzes a response for financial-specific completeness indicators
 * @param content Response content
 * @param financialQueryType Type of financial query
 * @returns Detailed analysis of content completeness
 */
export const analyzeFinancialResponse = (content: string, financialQueryType?: string) => {
  const analysis = {
    isComplete: true,
    isTruncated: false,
    missingElements: [] as string[],
    diagnostics: {} as any
  };
  
  // Basic truncation check with more comprehensive detection
  if (detectTruncationComprehensive(content)) {
    analysis.isTruncated = true;
    analysis.isComplete = false;
    analysis.missingElements.push("Response appears truncated by advanced indicators");
  }
  
  // Get detailed financial analysis
  const financialAnalysis = analyzeFinancialResponseDetails(content, financialQueryType);
  
  // Merge the results
  if (!financialAnalysis.isComplete) {
    analysis.isComplete = false;
    analysis.missingElements.push(...financialAnalysis.missingElements);
  }
  
  return analysis;
};
