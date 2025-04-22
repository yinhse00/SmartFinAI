
import { logTruncation, LogLevel } from './logLevel';
import { 
  checkRightsIssueResponse, 
  checkOpenOfferResponse,
  checkComparisonResponse,
  isComparisonQuery 
} from './checkers';
import { hasConclusion } from './utils/contentHelpers';

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
  
  // Check for conclusion section in all financial responses
  if (content.length > 3000 && !hasConclusion(content)) {
    analysis.isComplete = false;
    analysis.missingElements.push("Missing conclusion or summary section");
  }
  
  // Domain-specific checks based on query type
  if (financialQueryType) {
    logTruncation(LogLevel.DEBUG, `Analyzing financial response for ${financialQueryType}`, {
      contentLength: content.length
    });
    
    const queryTypeCheckers = {
      'rights_issue': checkRightsIssueResponse,
      'open_offer': checkOpenOfferResponse
    };
    
    // Run the appropriate checker for the query type
    if (financialQueryType in queryTypeCheckers) {
      const checker = queryTypeCheckers[financialQueryType as keyof typeof queryTypeCheckers];
      const checkResult = checker(content);
      
      if (!checkResult.isComplete) {
        analysis.isComplete = false;
        analysis.missingElements.push(...checkResult.missingElements);
      }
    }
    
    // Check for comparison queries across different financial types
    if (isComparisonQuery(content)) {
      const comparisonResult = checkComparisonResponse(content, financialQueryType);
      
      if (!comparisonResult.isComplete) {
        analysis.isComplete = false;
        analysis.missingElements.push(...comparisonResult.missingElements);
      }
    }
    
    // CRITICAL: Enhanced check for regulatory framework confusion
    
    // For open offers, MUST be under Listing Rules and NEVER reference Takeovers Code
    if (financialQueryType === 'open_offer') {
      // Check for Listing Rules references
      if (!content.toLowerCase().includes('listing rule') && 
          !content.toLowerCase().includes('chapter 7')) {
        analysis.isComplete = false;
        analysis.missingElements.push("CRITICAL: Open offer response missing Listing Rules references");
      }
      
      // Check for incorrect Takeovers Code references
      if (content.toLowerCase().includes('takeover') || 
          content.toLowerCase().includes('rule 26') ||
          content.toLowerCase().includes('mandatory offer')) {
        analysis.isComplete = false;
        analysis.missingElements.push("CRITICAL ERROR: Open offer response incorrectly references Takeovers Code concepts");
      }
      
      // Check for capital raising purpose (essential for corporate actions)
      if (!content.toLowerCase().includes('capital') && 
          !content.toLowerCase().includes('fundraising')) {
        analysis.isComplete = false;
        analysis.missingElements.push("CRITICAL: Missing capital-raising purpose for Open Offer corporate action");
      }
    }
    
    // For takeover offers, MUST be under Takeovers Code and NEVER reference Listing Rules Chapter 7
    if (financialQueryType === 'takeover_offer') {
      // Check for Takeovers Code references
      if (!content.toLowerCase().includes('takeover') && 
          !content.toLowerCase().includes('code on takeover')) {
        analysis.isComplete = false;
        analysis.missingElements.push("CRITICAL: Takeover offer response missing Takeovers Code references");
      }
      
      // Check for incorrect Listing Rules Chapter 7 references
      if (content.toLowerCase().includes('chapter 7') || 
          content.toLowerCase().includes('rule 7.')) {
        analysis.isComplete = false;
        analysis.missingElements.push("CRITICAL ERROR: Takeover offer response incorrectly references Listing Rules Chapter 7");
      }
    }
  }
  
  // Log if the response is not complete
  if (!analysis.isComplete) {
    logTruncation(
      LogLevel.WARN, 
      "Financial response analysis shows incomplete content", 
      { 
        queryType: financialQueryType,
        missingElements: analysis.missingElements
      }
    );
  }
  
  return analysis;
};
