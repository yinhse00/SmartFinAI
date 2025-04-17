
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
  
  // CRITICAL FIX: Less aggressive truncation detection to match both environments
  // Only detect clear, obvious truncation to avoid false positives
  if (content.endsWith('...') || content.endsWith('…') || content.endsWith('--') || 
      content.match(/\.\s*$/m) === null) { // Missing final period
    analysis.isTruncated = true;
    analysis.isComplete = false;
    analysis.missingElements.push("Response appears truncated by basic indicators");
    
    console.log("Basic truncation detected", {
      contentLength: content.length,
      lastChars: content.slice(-30)
    });
  }
  
  // More lenient financial analysis - only mark as incomplete for serious issues
  const financialAnalysis = analyzeFinancialResponseDetails(content, financialQueryType);
  
  // Only consider the response incomplete if multiple elements are missing
  if (financialAnalysis.missingElements.length > 1) {
    analysis.isComplete = false;
    analysis.missingElements.push(...financialAnalysis.missingElements);
    
    console.log("Financial analysis indicates incomplete response", {
      missingElements: financialAnalysis.missingElements
    });
  }
  
  return analysis;
};
