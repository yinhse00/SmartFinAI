
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
  if (financialQueryType === 'open_offer') {
    if (!content.toLowerCase().includes('guide on trading arrangement')) {
      analysis.isComplete = false;
      analysis.missingElements.push("CRITICAL: Open offer response must reference Guide on Trading Arrangements");
    }
    
    // Check for confusion with Takeovers Code
    if (content.toLowerCase().includes('takeover') || 
        content.toLowerCase().includes('takeovers code') || 
        content.toLowerCase().includes('mandatory offer')) {
      analysis.isComplete = false;
      analysis.missingElements.push("CRITICAL: Open offer incorrectly references Takeovers Code concepts");
    }
    
    // Check for clarification that open offers don't have nil-paid rights
    if (!content.toLowerCase().includes('no nil-paid') && 
        !content.toLowerCase().includes('not have nil-paid') && 
        !content.toLowerCase().includes('no trading of rights') &&
        !content.toLowerCase().includes('unlike rights issues')) {
      analysis.isComplete = false;
      analysis.missingElements.push("Missing key distinction: Open offers do not have nil-paid rights trading");
    }
  }
  
  // Only run financial analysis for specific financial query types
  if (financialQueryType && 
      ['rights_issue', 'open_offer', 'takeovers', 'listing_rules'].includes(financialQueryType)) {
    const financialAnalysis = analyzeFinancialResponseDetails(content, financialQueryType);
    
    // Open offers and rights issue timetables are critical - be strict about completeness
    if (financialQueryType === 'open_offer' || 
        (financialQueryType === 'rights_issue' && 
         content.toLowerCase().includes('timetable'))) {
      // Any missing elements for these critical queries are important
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
  
  // Check for absence of conclusion when conclusion is required
  if ((financialQueryType === 'open_offer' || financialQueryType === 'rights_issue') &&
      content.length > 2000 &&
      !content.toLowerCase().includes('conclusion') && 
      !content.toLowerCase().includes('in summary') && 
      !content.toLowerCase().includes('to summarize')) {
    analysis.isComplete = false;
    analysis.missingElements.push("Missing conclusion or summary section");
  }
  
  return analysis;
};
