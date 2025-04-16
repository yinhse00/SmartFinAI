
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
  
  // Additional advanced checks from specialized detectors
  if (checkAdvancedTruncationIndicators(content)) {
    return true;
  }
  
  return false;
};

/**
 * Checks for advanced truncation indicators
 * @param content Text content to check
 * @returns True if any advanced indicator is found
 */
function checkAdvancedTruncationIndicators(content: string): boolean {
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
    
    // Check for uneven table rows
    checkUnevenTableRows(content),
    
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
    checkUnclosedHtmlTags(content),
    
    // Missing complete conclusion for financial comparisons
    checkMissingConclusion(content),
    
    // Ends with "For more" or "For additional" suggesting incomplete guidance
    /\b(for more|for additional|for further|if you need|should you require|contact|please specify)\s*$/i.test(content.trim()),
    
    // Detects if response appears to be waiting for more specific information
    /\b(let me know|tell me more|provide more detail|specify your|if you have any|for specific|would you like me to)\s*$/i.test(content.trim()),
  ];
  
  // Financial content specific checks
  const financialSpecificIndicators = [
    content.toLowerCase().includes('rights issue') && 
    content.toLowerCase().includes('timetable') && 
    !content.toLowerCase().includes('acceptance') && 
    !content.toLowerCase().includes('payment date'),
    
    // Check for comparison response without conclusion
    content.toLowerCase().includes('difference between') && 
    content.toLowerCase().includes('rights issue') && 
    content.toLowerCase().includes('open offer') && 
    !content.toLowerCase().includes('key differences') && 
    !content.toLowerCase().includes('summary') && 
    !content.toLowerCase().includes('conclusion'),
    
    // Financial specific check - table without explanation
    content.includes('|') && 
    content.includes('|---') && 
    content.toLowerCase().includes('financial') && 
    !(/\b(notes:|note:|explanation:|explained below|as shown above)\b/i.test(content))
  ];
  
  // Combine all indicators
  const allIndicators = [...advancedTruncationIndicators, ...financialSpecificIndicators];
  
  for (let i = 0; i < allIndicators.length; i++) {
    if (allIndicators[i]) {
      logTruncation(
        LogLevel.INFO, 
        `Advanced truncation indicator #${i} triggered`, 
        { contentEnding: content.slice(-40) }
      );
      return true;
    }
  }
  
  return false;
}

/**
 * Check if table rows are uneven
 */
function checkUnevenTableRows(content: string): boolean {
  if (!content.includes('|')) return false;
  
  const rows = content.split('\n').filter(line => line.includes('|') && !line.includes('---'));
  if (rows.length < 2) return false;
  
  const pipeCounts = rows.map(row => (row.match(/\|/g) || []).length);
  return pipeCounts.some(count => count !== pipeCounts[0]);
}

/**
 * Check for unclosed HTML tags
 */
function checkUnclosedHtmlTags(content: string): boolean {
  const openingTags = (content.match(/<[a-z][^>]*>/gi) || []).length;
  const closingTags = (content.match(/<\/[a-z][^>]*>/gi) || []).length;
  return openingTags > closingTags;
}

/**
 * Check for missing conclusion in lengthy content
 */
function checkMissingConclusion(content: string): boolean {
  return content.length > 5000 && 
    content.toLowerCase().includes('difference between') && 
    !(/\b(in conclusion|to summarize|in summary|key points:|to recap|in short|overall|thus|therefore)\b/i.test(content.slice(-1500)));
}
