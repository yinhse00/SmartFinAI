
import { logTruncation, LogLevel } from './logLevel';
import { 
  checkRightsIssueResponse, 
  checkOpenOfferResponse,
  checkComparisonResponse,
  isComparisonQuery 
} from './checkers';
import { hasConclusion } from './utils/contentHelpers';
import { FRAMEWORK_TERMINOLOGY } from '@/services/constants/financialConstants';

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

/**
 * Detailed analysis of financial response completeness
 * @param content Response content
 * @param financialQueryType Type of financial query
 * @returns Analysis result with details about completeness
 */
const analyzeFinancialResponseDetails = (content: string, financialQueryType: string) => {
  const analysis = {
    isComplete: true,
    missingElements: [] as string[]
  };

  // Check for conclusion section in longer financial responses
  if (content.length > 4000 && !hasConclusion(content)) {
    analysis.missingElements.push("Missing conclusion or summary section");
  }
  
  // Domain-specific checks based on query type
  if (financialQueryType === 'rights_issue') {
    // More lenient check for rights issue content
    const hasRelevantContent = content.toLowerCase().includes('rights issue') &&
                              (content.toLowerCase().includes('timetable') || 
                               content.toLowerCase().includes('schedule') ||
                               content.toLowerCase().includes('dates'));
                              
    // Check for at least some key rights issue concepts
    let keyConceptsMentioned = 0;
    const keyConcepts = ['ex-date', 'record date', 'payment', 'trading', 'acceptance'];
    
    keyConcepts.forEach(concept => {
      if (content.toLowerCase().includes(concept)) {
        keyConceptsMentioned++;
      }
    });
    
    // Only consider incomplete if multiple key concepts are missing
    if (hasRelevantContent && keyConceptsMentioned < 2) {
      analysis.missingElements.push(`Missing key rights issue concepts (only ${keyConceptsMentioned}/5 found)`);
    }
  } else if (financialQueryType === 'open_offer') {
    // Simple check for open offer content
    const hasOpenOfferContent = content.toLowerCase().includes('open offer') &&
                               content.toLowerCase().includes('listing rule');
    
    if (!hasOpenOfferContent) {
      analysis.missingElements.push("Missing key open offer concepts");
    }
  }
  
  // Update completeness status based on missing elements
  if (analysis.missingElements.length > 2) {
    analysis.isComplete = false;
  }
  
  return analysis;
};
