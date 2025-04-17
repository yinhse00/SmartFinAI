
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
  
  // CONSISTENCY FIX: Use the same truncation detection logic in all environments
  // Basic truncation check with more comprehensive detection
  if (detectTruncationComprehensive(content)) {
    analysis.isTruncated = true;
    analysis.isComplete = false;
    analysis.missingElements.push("Response appears truncated by advanced indicators");
    
    // Log the truncation with more details for debugging
    console.log("Truncation detected by comprehensive checks", {
      contentLength: content.length,
      lastChars: content.slice(-30)
    });
  }
  
  // Get detailed financial analysis
  const financialAnalysis = analyzeFinancialResponseDetails(content, financialQueryType);
  
  // Merge the results
  if (!financialAnalysis.isComplete) {
    analysis.isComplete = false;
    analysis.missingElements.push(...financialAnalysis.missingElements);
    
    // Log detailed missing elements
    console.log("Financial analysis indicates incomplete response", {
      missingElements: financialAnalysis.missingElements
    });
  }
  
  return analysis;
};
