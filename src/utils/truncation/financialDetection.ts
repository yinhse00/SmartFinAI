
import { logTruncation, LogLevel } from './logLevel';
import { detectTruncationComprehensive } from './comprehensiveDetection';

/**
 * Check if a financial trading arrangement content is complete
 * Specific for trading arrangements related to rights issues, open offers,
 * share consolidation, board lot changes and company name changes
 * 
 * @param content The text content to check
 * @param queryType The type of financial query
 * @returns Boolean indicating if the trading arrangement appears to be complete
 */
export const isTradingArrangementComplete = (content: string, queryType?: string): boolean => {
  if (!content) return false;
  
  // Common trading arrangement phrases that should be present
  const commonPhrases = [
    'trading arrangement',
    'last day',
    'first day',
    'ex-date',
    'effective date'
  ];
  
  // Check if at least some common phrases are present
  const hasCommonPhrases = commonPhrases.some(phrase => 
    content.toLowerCase().includes(phrase)
  );
  
  if (!hasCommonPhrases) {
    // Not a trading arrangement or very incomplete
    logTruncation(LogLevel.INFO, "Trading arrangement missing common phrases", { queryType });
    return false;
  }

  // For rights issue timetables, check for all necessary components
  if (queryType?.includes('rights_issue') || 
      content.toLowerCase().includes('rights issue') || 
      content.toLowerCase().includes('nil-paid')) {
    
    // Rights issue should mention at least 5 key dates
    const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
    if (dateMatches.length < 5) {
      logTruncation(LogLevel.WARN, "Rights issue missing sufficient dates", { 
        datesFound: dateMatches.length, 
        dateExamples: dateMatches.slice(0, 3) 
      });
      return false;
    }
    
    // Rights issue should mention nil-paid rights trading period
    const hasNilPaidTrading = content.toLowerCase().includes('nil-paid') && 
                              (content.toLowerCase().includes('trading') || 
                               content.toLowerCase().includes('period'));
                               
    // Should have key dates
    const hasKeyDates = content.toLowerCase().includes('ex-rights') || 
                        (content.toLowerCase().includes('record') && content.toLowerCase().includes('date'));
    
    // Should mention acceptance deadline and results announcement
    const hasCompletionDates = (content.toLowerCase().includes('acceptance') && content.toLowerCase().includes('deadline')) ||
                             content.toLowerCase().includes('results announcement') ||
                             content.toLowerCase().includes('fully-paid shares');
    
    const isComplete = hasNilPaidTrading && hasKeyDates && hasCompletionDates;
    
    if (!isComplete) {
      logTruncation(LogLevel.INFO, "Rights issue trading arrangement incomplete", {
        hasNilPaidTrading,
        hasKeyDates,
        hasCompletionDates
      });
    }
    
    return isComplete;
  }
  
  if (content.toLowerCase().includes('open offer')) {
    // Open offers should explicitly mention no nil-paid rights trading
    const isComplete = content.toLowerCase().includes('no nil-paid') || 
           (content.toLowerCase().includes('open offer') && 
            content.toLowerCase().includes('timetable'));
            
    if (!isComplete) {
      logTruncation(LogLevel.INFO, "Open offer arrangement missing key nil-paid rights information");
    }
    
    return isComplete;
  }
  
  if (content.toLowerCase().includes('consolidation') || 
      content.toLowerCase().includes('sub-division')) {
    // Share consolidation/sub-division should mention old/new shares trading
    const isComplete = (content.toLowerCase().includes('old shares') || 
            content.toLowerCase().includes('new shares')) &&
           content.toLowerCase().includes('trading');
           
    if (!isComplete) {
      logTruncation(LogLevel.INFO, "Share consolidation arrangement missing old/new shares trading info");
    }
    
    return isComplete;
  }
  
  if (content.toLowerCase().includes('board lot') || 
      content.toLowerCase().includes('lot size')) {
    // Board lot changes should mention parallel trading
    const isComplete = content.toLowerCase().includes('parallel trading') || 
           (content.toLowerCase().includes('board lot') && 
            content.toLowerCase().includes('trading arrangement'));
            
    if (!isComplete) {
      logTruncation(LogLevel.INFO, "Board lot change arrangement missing parallel trading info");
    }
    
    return isComplete;
  }
  
  if (content.toLowerCase().includes('company name') || 
      content.toLowerCase().includes('stock short name')) {
    // Name changes should mention new stock short name
    const isComplete = content.toLowerCase().includes('stock short name') || 
           (content.toLowerCase().includes('company name') && 
            content.toLowerCase().includes('trading'));
            
    if (!isComplete) {
      logTruncation(LogLevel.INFO, "Company name change arrangement missing stock short name info");
    }
    
    return isComplete;
  }
  
  // General check for completeness of trading arrangement information
  const isComplete = content.includes('|') && // Has table format
         content.length > 500 &&  // Reasonably detailed
         (content.toLowerCase().includes('conclusion') || 
          content.toLowerCase().includes('summary') ||
          content.toLowerCase().endsWith('.') ||
          content.toLowerCase().includes('note')); // Has proper ending
          
  if (!isComplete) {
    logTruncation(LogLevel.INFO, "General trading arrangement appears incomplete", {
      hasTable: content.includes('|'),
      contentLength: content.length,
      hasProperEnding: content.toLowerCase().includes('conclusion') || 
                       content.toLowerCase().includes('summary') ||
                       content.toLowerCase().endsWith('.') ||
                       content.toLowerCase().includes('note')
    });
  }
  
  return isComplete;
};

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
  
  // Basic truncation check
  if (detectTruncationComprehensive(content)) {
    analysis.isTruncated = true;
    analysis.isComplete = false;
    analysis.missingElements.push("Response appears truncated by general indicators");
  }
  
  // Domain-specific checks based on query type
  if (financialQueryType) {
    logTruncation(LogLevel.DEBUG, `Analyzing financial response for ${financialQueryType}`, {
      contentLength: content.length
    });
    
    // Check for specific patterns based on query type
    if (financialQueryType.includes('rights_issue')) {
      if (!content.toLowerCase().includes('ex-rights')) {
        analysis.missingElements.push("Ex-rights date information");
        analysis.isComplete = false;
      }
      
      if (!content.toLowerCase().includes('nil-paid')) {
        analysis.missingElements.push("Nil-paid rights trading period");
        analysis.isComplete = false;
      }
      
      const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
      if (dateMatches.length < 5) {
        analysis.missingElements.push(`Sufficient key dates (only found ${dateMatches.length})`);
        analysis.isComplete = false;
      }
      
      analysis.diagnostics.datesFound = dateMatches.length;
    }
    
    else if (financialQueryType.includes('takeovers')) {
      if (!content.toLowerCase().includes('offer period')) {
        analysis.missingElements.push("Offer period information");
        analysis.isComplete = false;
      }
      
      if (!content.toLowerCase().includes('consideration')) {
        analysis.missingElements.push("Consideration details");
        analysis.isComplete = false;
      }
    }
    
    else if (financialQueryType.includes('listing_rules')) {
      if (content.length < 300) {
        analysis.missingElements.push("Sufficient rule explanation");
        analysis.isComplete = false;
      }
      
      if (!content.toLowerCase().includes('requirement') && 
          !content.toLowerCase().includes('rule') && 
          !content.toLowerCase().includes('regulation')) {
        analysis.missingElements.push("Explicit rule references");
        analysis.isComplete = false;
      }
    }
  }
  
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
