
import { detectTruncationComprehensive } from './comprehensiveDetection';
import { logTruncation, LogLevel } from './logLevel';
import { TRADING_ARRANGEMENTS } from '@/services/constants/tradingConstants';

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
  
  // Domain-specific checks based on query type
  if (financialQueryType) {
    logTruncation(LogLevel.DEBUG, `Analyzing financial response for ${financialQueryType}`, {
      contentLength: content.length
    });
    
    // Rights Issue specific checks
    if (financialQueryType.includes('rights_issue')) {
      const mandatoryKeywords = [
        'ex-rights', 
        'nil-paid rights', 
        'trading period', 
        'record date', 
        'acceptance deadline'
      ];
      
      const missingKeywords = mandatoryKeywords.filter(
        keyword => !content.toLowerCase().includes(keyword)
      );
      
      if (missingKeywords.length > 0) {
        analysis.isComplete = false;
        analysis.missingElements.push(
          ...missingKeywords.map(k => `Missing key rights issue concept: ${k}`)
        );
      }
      
      // Check for sufficient date information
      const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
      if (dateMatches.length < 5) {
        analysis.isComplete = false;
        analysis.missingElements.push(`Insufficient key dates (found ${dateMatches.length})`);
      }
    }
    
    // Similar detailed checks can be added for other financial query types
    // like takeovers, open offers, etc.
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
 * Checks if a trading arrangement response is complete based on the query type
 * @param content Response content
 * @param queryType Type of financial query related to trading arrangements
 * @returns Boolean indicating if the response contains complete information
 */
export const isTradingArrangementComplete = (content: string, queryType?: string): boolean => {
  if (!content || !queryType) return true; // If no content or query type, assume it's complete
  
  const normalizedContent = content.toLowerCase();
  
  // Check if the content mentions trading arrangements
  const hasTradingMention = normalizedContent.includes('trading arrangement') || 
                           normalizedContent.includes('timetable') || 
                           normalizedContent.includes('trading schedule');
  
  if (!hasTradingMention) return true; // Not a trading arrangement response
  
  // For specific corporate actions, check for expected elements
  switch(queryType) {
    case 'rights_issue':
      return checkRightsIssueCompleteness(normalizedContent);
    case 'open_offer':
      return checkOpenOfferCompleteness(normalizedContent);
    case 'share_consolidation':
    case 'share_subdivision':
      return checkShareReorganizationCompleteness(normalizedContent);
    case 'board_lot_change':
      return checkBoardLotCompleteness(normalizedContent);
    case 'company_name_change':
      return checkCompanyNameChangeCompleteness(normalizedContent);
    default:
      return true; // For unknown types, assume complete
  }
};

/**
 * Check Rights Issue response completeness
 */
function checkRightsIssueCompleteness(content: string): boolean {
  const requiredElements = [
    'ex-rights', 
    'nil-paid', 
    'trading period', 
    'record date', 
    'acceptance'
  ];
  
  // Check for table structure
  const hasTable = content.includes('|') && content.includes('---|') && content.includes('timetable');
  
  // Check for minimum required dates
  const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
  const hasSufficientDates = dateMatches.length >= 5;
  
  // Check for key required elements
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  return hasTable && hasSufficientDates && missingElements.length === 0;
}

/**
 * Check Open Offer response completeness
 */
function checkOpenOfferCompleteness(content: string): boolean {
  const requiredElements = [
    'ex-entitlement', 
    'application', 
    'acceptance', 
    'payment'
  ];
  
  const hasTable = content.includes('|') && content.includes('---|');
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  return hasTable && missingElements.length === 0;
}

/**
 * Check Share Consolidation/Subdivision completeness
 */
function checkShareReorganizationCompleteness(content: string): boolean {
  const requiredElements = [
    'general meeting', 
    'effective date', 
    'exchange period'
  ];
  
  const hasTable = content.includes('|') && content.includes('---|');
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  return hasTable && missingElements.length === 0;
}

/**
 * Check Board Lot Change completeness
 */
function checkBoardLotCompleteness(content: string): boolean {
  const requiredElements = [
    'parallel trading', 
    'board lot', 
    'exchange'
  ];
  
  const hasTable = content.includes('|') && content.includes('---|');
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  return hasTable && missingElements.length === 0;
}

/**
 * Check Company Name Change completeness
 */
function checkCompanyNameChangeCompleteness(content: string): boolean {
  const requiredElements = [
    'general meeting', 
    'effective date', 
    'stock short name'
  ];
  
  const hasTable = content.includes('|') && content.includes('---|');
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  return hasTable && missingElements.length === 0;
}
