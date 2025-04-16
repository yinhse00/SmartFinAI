
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
    
    // Check for listing rules references
    if ((financialQueryType.includes('rights_issue') || financialQueryType.includes('open_offer')) &&
        !content.match(/rule\s+[0-9.]+|chapter\s+[0-9]+/i)) {
      analysis.isComplete = false;
      analysis.missingElements.push("Missing listing rule references");
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
