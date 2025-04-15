
/**
 * Utility functions for detecting and handling response truncation in chat messages
 */

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

  return truncationIndicators.some(indicator => indicator);
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
  if (basicTruncation) return true;
  
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
    (content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || []).length < 5
  ];
  
  return advancedTruncationIndicators.some(indicator => indicator);
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
    return false;
  }

  // For rights issue timetables, check for all necessary components
  if (queryType?.includes('rights_issue') || 
      content.toLowerCase().includes('rights issue') || 
      content.toLowerCase().includes('nil-paid')) {
    
    // Rights issue should mention at least 5 key dates
    const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
    if (dateMatches.length < 5) return false;
    
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
    
    return hasNilPaidTrading && hasKeyDates && hasCompletionDates;
  }
  
  if (content.toLowerCase().includes('open offer')) {
    // Open offers should explicitly mention no nil-paid rights trading
    return content.toLowerCase().includes('no nil-paid') || 
           (content.toLowerCase().includes('open offer') && 
            content.toLowerCase().includes('timetable'));
  }
  
  if (content.toLowerCase().includes('consolidation') || 
      content.toLowerCase().includes('sub-division')) {
    // Share consolidation/sub-division should mention old/new shares trading
    return (content.toLowerCase().includes('old shares') || 
            content.toLowerCase().includes('new shares')) &&
           content.toLowerCase().includes('trading');
  }
  
  if (content.toLowerCase().includes('board lot') || 
      content.toLowerCase().includes('lot size')) {
    // Board lot changes should mention parallel trading
    return content.toLowerCase().includes('parallel trading') || 
           (content.toLowerCase().includes('board lot') && 
            content.toLowerCase().includes('trading arrangement'));
  }
  
  if (content.toLowerCase().includes('company name') || 
      content.toLowerCase().includes('stock short name')) {
    // Name changes should mention new stock short name
    return content.toLowerCase().includes('stock short name') || 
           (content.toLowerCase().includes('company name') && 
            content.toLowerCase().includes('trading'));
  }
  
  // General check for completeness of trading arrangement information
  return content.includes('|') && // Has table format
         content.length > 500 &&  // Reasonably detailed
         (content.toLowerCase().includes('conclusion') || 
          content.toLowerCase().includes('summary') ||
          content.toLowerCase().endsWith('.') ||
          content.toLowerCase().includes('note')); // Has proper ending
};
