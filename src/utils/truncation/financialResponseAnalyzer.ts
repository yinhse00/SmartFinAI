
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
    
    // Check for execution process completeness
    if (isExecutionProcessContent(content)) {
      const executionProcessResult = checkExecutionProcessCompleteness(content, financialQueryType);
      
      if (!executionProcessResult.isComplete) {
        analysis.isComplete = false;
        analysis.missingElements.push(...executionProcessResult.missingElements);
      }
    }
    
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
      
      // Check for acquisition purpose (essential for takeover offers)
      if (!content.toLowerCase().includes('acquisition') && 
          !content.toLowerCase().includes('control')) {
        analysis.isComplete = false;
        analysis.missingElements.push("CRITICAL: Missing acquisition/control purpose for Takeover offer under Takeovers Code");
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

/**
 * Checks if content is about execution process
 */
function isExecutionProcessContent(content: string): boolean {
  const executionTerms = [
    'execution process', 
    'working process', 
    'execution timeline', 
    'preparation steps',
    'execution steps',
    'timetable execution'
  ];
  
  const normalizedContent = content.toLowerCase();
  
  return executionTerms.some(term => normalizedContent.includes(term));
}

/**
 * Checks execution process response completeness
 */
function checkExecutionProcessCompleteness(content: string, queryType: string): { isComplete: boolean, missingElements: string[] } {
  const result = {
    isComplete: true,
    missingElements: [] as string[]
  };
  
  const normalizedContent = content.toLowerCase();
  
  // Check for key preparation phases
  if (!normalizedContent.includes('preparation') && !normalizedContent.includes('drafting')) {
    result.isComplete = false;
    result.missingElements.push("Missing preparation phase details");
  }
  
  // Check for regulatory vetting details
  if (!normalizedContent.includes('vetting')) {
    result.isComplete = false;
    result.missingElements.push("Missing regulatory vetting details");
  }
  
  // Check for specific timeframes
  if (!hasTimeframes(normalizedContent)) {
    result.isComplete = false;
    result.missingElements.push("Missing specific timeframes for steps");
  }
  
  // Check for regulatory authority references
  if (queryType === 'open_offer' || queryType === 'rights_issue') {
    // Listing Rules authority check
    if (!normalizedContent.includes('hkex') && !normalizedContent.includes('stock exchange')) {
      result.isComplete = false;
      result.missingElements.push("Missing Stock Exchange (HKEX) regulatory authority reference");
    }
  } else if (queryType === 'takeover_offer' || queryType === 'takeovers_code') {
    // Takeovers Code authority check
    if (!normalizedContent.includes('sfc') && !normalizedContent.includes('securities and futures commission')) {
      result.isComplete = false;
      result.missingElements.push("Missing Securities and Futures Commission (SFC) regulatory authority reference");
    }
  }
  
  // Check for correct regulatory framework references
  if (queryType === 'open_offer' || queryType === 'rights_issue') {
    // Should reference Listing Rules concepts
    const hasListingRulesTerms = 
      FRAMEWORK_TERMINOLOGY.LISTING_RULES.some(term => normalizedContent.includes(term));
    
    if (!hasListingRulesTerms) {
      result.isComplete = false;
      result.missingElements.push("Missing Listing Rules framework references");
    }
  } else if (queryType === 'takeover_offer' || queryType === 'takeovers_code') {
    // Should reference Takeovers Code concepts
    const hasTakeoversCodeTerms = 
      FRAMEWORK_TERMINOLOGY.TAKEOVERS_CODE.some(term => normalizedContent.includes(term));
    
    if (!hasTakeoversCodeTerms) {
      result.isComplete = false;
      result.missingElements.push("Missing Takeovers Code framework references");
    }
  }
  
  return result;
}

/**
 * Helper function to check for timeframes in content
 */
function hasTimeframes(content: string): boolean {
  // Check for day ranges like "2-3 days" or "5-20 business days"
  const dayRangeRegex = /\d+\s*-\s*\d+\s*(days|business days)/i;
  
  // Check for specific day references like "Day 21" or "Day 60"
  const specificDayRegex = /day\s+\d+/i;
  
  return dayRangeRegex.test(content) || specificDayRegex.test(content);
}
