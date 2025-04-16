
import { logTruncation, LogLevel } from './logLevel';
import { detectTruncation, checkUnbalancedConstructs } from './basicDetection';

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
    
    // Content that ends with an opening quote
    content.trim().endsWith('"') && 
    ((content.match(/"/g) || []).length % 2 !== 0),
    
    // Content that ends with a bullet point but no text after it
    /[\n\r]\s*[-*•]\s*$/.test(content),
    
    // Content has HTML tags but they're not properly closed
    (() => {
      const openingTags = (content.match(/<[a-z][^>]*>/gi) || []).length;
      const closingTags = (content.match(/<\/[a-z][^>]*>/gi) || []).length;
      return openingTags > closingTags;
    })(),
    
    // Missing complete conclusion 
    !content.toLowerCase().includes('in conclusion') && 
    !content.toLowerCase().includes('to summarize') &&
    !content.toLowerCase().includes('in summary') &&
    content.length > 4000,
    
    // Ends with "For more" or "For additional" suggesting incomplete guidance
    /\b(for more|for additional|for further)\s*$/i.test(content.trim())
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
