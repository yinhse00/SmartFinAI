
/**
 * Utility functions for detecting and handling response truncation in chat messages
 * with enhanced debug logging and specialized detection algorithms
 */

/**
 * Log level configuration for truncation detection
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

// Current log level - can be adjusted at runtime
let currentLogLevel = LogLevel.WARN;

/**
 * Set the log level for truncation detection
 * @param level The log level to set
 */
export const setTruncationLogLevel = (level: LogLevel) => {
  currentLogLevel = level;
};

/**
 * Get the current log level for truncation detection
 * @returns The current log level
 */
export const getTruncationLogLevel = (): LogLevel => {
  return currentLogLevel;
};

/**
 * Internal logging function for truncation detection
 * @param level Log level
 * @param message Message to log
 * @param details Additional details for debugging
 */
const logTruncation = (level: LogLevel, message: string, details?: any) => {
  if (level <= currentLogLevel) {
    const prefix = `[TruncationDetect ${LogLevel[level]}]`;
    
    if (details) {
      console.log(prefix, message, details);
    } else {
      console.log(prefix, message);
    }
  }
};

/**
 * Detects if a text response appears to be truncated/incomplete based on various indicators
 * @param content The text content to check for truncation
 * @returns Boolean indicating if the content appears to be truncated
 */
export const detectTruncation = (content: string): boolean => {
  if (!content) return false;

  const truncationIndicators = [
    // Long message that doesn't end with proper punctuation
    !/[.!?:]$/.test(content) && content.length > 200,
    
    // Uneven number of code blocks (opening without closing)
    (content.match(/```/g) || []).length % 2 !== 0,
    
    // Message ending with list indicators
    content.trim().endsWith('-') || content.trim().endsWith('*'),
    
    // Unmatched brackets or braces
    (content.includes('{') && !content.includes('}')) || 
    (content.includes('[') && !content.includes(']')),
    
    // Long content without proper sentence ending
    content.split(' ').length > 50 && 
    !content.endsWith('.') && 
    !content.endsWith('!') && 
    !content.endsWith('?'),
    
    // Table formatting without separator line
    (content.includes('|') && !content.includes('---'))
  ];

  const isTruncated = truncationIndicators.some(indicator => indicator);
  
  if (isTruncated) {
    logTruncation(
      LogLevel.WARN, 
      "Basic truncation detected", 
      { length: content.length, lastChars: content.slice(-20) }
    );
  }

  return isTruncated;
};

/**
 * Check for unbalanced programming language constructs like brackets, parentheses, etc.
 * @param content The content to check
 * @returns Object with details about unbalanced constructs
 */
export const checkUnbalancedConstructs = (content: string): {
  isUnbalanced: boolean;
  details: {
    braces: number; // {}
    brackets: number; // []
    parentheses: number; // ()
    angleBrackets: number; // <>
    codeBlocks: number; // ```
  }
} => {
  const counts = {
    braces: 0,
    brackets: 0,
    parentheses: 0,
    angleBrackets: 0,
    codeBlocks: 0
  };
  
  // Count opening and closing braces
  for (const char of content) {
    if (char === '{') counts.braces++;
    else if (char === '}') counts.braces--;
    else if (char === '[') counts.brackets++;
    else if (char === ']') counts.brackets--;
    else if (char === '(') counts.parentheses++;
    else if (char === ')') counts.parentheses--;
    else if (char === '<') counts.angleBrackets++;
    else if (char === '>') counts.angleBrackets--;
  }
  
  // Count code blocks (need special handling for triple backticks)
  const codeBlockMatches = content.match(/```/g) || [];
  counts.codeBlocks = codeBlockMatches.length % 2;
  
  const isUnbalanced = 
    counts.braces !== 0 || 
    counts.brackets !== 0 || 
    counts.parentheses !== 0 || 
    counts.angleBrackets !== 0 || 
    counts.codeBlocks !== 0;
  
  if (isUnbalanced) {
    logTruncation(
      LogLevel.INFO, 
      "Unbalanced programming constructs detected", 
      counts
    );
  }
  
  return {
    isUnbalanced,
    details: counts
  };
};

/**
 * More comprehensive truncation check that includes additional indicators
 * @param content The text content to check for truncation
 * @returns Boolean indicating if the content appears to be truncated
 */
export const detectTruncationComprehensive = (content: string): boolean => {
  if (!content) return false;
  
  // Basic truncation checks
  const basicTruncation = detectTruncation(content);
  if (basicTruncation) {
    logTruncation(LogLevel.INFO, "Basic truncation check triggered");
    return true;
  }
  
  // Check for unbalanced constructs
  const { isUnbalanced, details } = checkUnbalancedConstructs(content);
  if (isUnbalanced) {
    logTruncation(LogLevel.INFO, "Unbalanced constructs detected", details);
    return true;
  }
  
  // Additional advanced checks
  const advancedTruncationIndicators = [
    // Cut off sentence (likely mid-sentence)
    (content.split(' ').length > 30 && 
     !content.endsWith('.') && !content.endsWith('!') && !content.endsWith('?') && 
     !content.endsWith(':') && !content.includes('T+') && !content.endsWith(';') &&
     !content.endsWith(')') && !content.endsWith('}') && !content.endsWith(']')),
     
    // Cut off table formatting
    (content.includes('|') && content.includes('|---|') && !content.includes('|---')),
    
    // Cut off markdown formatting 
    ((content.match(/```/g) || []).length % 2 !== 0),
    
    // Possible unfinished JSON or code
    (content.includes('"{') && !content.includes('}"')),
    
    // Table rows are uneven
    content.includes('|') && (() => {
      const rows = content.split('\n').filter(line => line.includes('|') && !line.includes('---'));
      if (rows.length < 2) return false;
      const pipeCounts = rows.map(row => (row.match(/\|/g) || []).length);
      return pipeCounts.some(count => count !== pipeCounts[0]);
    })(),
    
    // Ends with conjunction or preposition
    /\b(and|or|but|if|as|at|by|for|from|in|of|on|to|with)$/i.test(content.trim()),
    
    // Timetable seems incomplete (less than 5 dates)
    content.toLowerCase().includes('timetable') && 
    (content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || []).length < 5,
    
    // New: Content that ends with an opening quote
    content.trim().endsWith('"') && 
    ((content.match(/"/g) || []).length % 2 !== 0),
    
    // New: Content that ends with a bullet point but no text after it
    /[\n\r]\s*[-*•]\s*$/.test(content),
    
    // New: Content has HTML tags but they're not properly closed
    (() => {
      const openingTags = (content.match(/<[a-z][^>]*>/gi) || []).length;
      const closingTags = (content.match(/<\/[a-z][^>]*>/gi) || []).length;
      return openingTags > closingTags;
    })()
  ];
  
  for (let i = 0; i < advancedTruncationIndicators.length; i++) {
    if (advancedTruncationIndicators[i]) {
      logTruncation(
        LogLevel.INFO, 
        `Advanced truncation indicator #${i} triggered`, 
        { contentEnding: content.slice(-40) }
      );
      return true;
    }
  }
  
  return false;
};

/**
 * Analyzes content for specific domain indicators of truncation and returns detailed diagnostics
 * @param content The content to analyze
 * @returns Detailed diagnostics object
 */
export const getTruncationDiagnostics = (content: string): {
  isTruncated: boolean;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
  contentSample: string;
} => {
  const reasons: string[] = [];
  let confidence: 'low' | 'medium' | 'high' = 'low';
  
  // Check basic truncation
  if (detectTruncation(content)) {
    reasons.push("Basic truncation indicators detected");
    confidence = 'medium';
  }
  
  // Check unbalanced constructs
  const { isUnbalanced, details } = checkUnbalancedConstructs(content);
  if (isUnbalanced) {
    reasons.push(`Unbalanced programming constructs: ${JSON.stringify(details)}`);
    confidence = 'high';
  }
  
  // Advanced checks
  if (content.split(' ').length > 30 && 
      !content.endsWith('.') && !content.endsWith('!') && !content.endsWith('?')) {
    reasons.push("Content ends without proper punctuation");
  }
  
  if (content.includes('|') && content.includes('|---|') && !content.includes('|---')) {
    reasons.push("Table formatting appears to be cut off");
    confidence = 'high';
  }
  
  if ((content.match(/```/g) || []).length % 2 !== 0) {
    reasons.push("Uneven number of code block markers");
    confidence = 'high';
  }
  
  if (/\b(and|or|but|if|as|at|by|for|from|in|of|on|to|with)$/i.test(content.trim())) {
    reasons.push("Content ends with conjunction or preposition");
    confidence = 'medium';
  }
  
  // Sample of content end for context
  const contentSample = content.length > 100 
    ? `...${content.slice(-100)}` 
    : content;
  
  const isTruncated = reasons.length > 0;
  
  if (isTruncated) {
    logTruncation(
      LogLevel.WARN, 
      "Truncation diagnostics show likely truncation", 
      { confidence, reasons, sample: content.slice(-40) }
    );
  }
  
  return {
    isTruncated,
    confidence,
    reasons,
    contentSample
  };
};

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
