
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
    (content.includes('|') && !content.includes('---') && content.split('|').length < 6),
    
    // Cut off markdown formatting 
    ((content.split('```').length % 2) === 0),
    
    // Possible unfinished JSON or code
    (content.includes('"{') && !content.includes('}"')),
    
    // Ends with conjunction or preposition
    /\b(and|or|but|if|as|at|by|for|from|in|of|on|to|with)$/i.test(content.trim())
  ];
  
  return advancedTruncationIndicators.some(indicator => indicator);
};
