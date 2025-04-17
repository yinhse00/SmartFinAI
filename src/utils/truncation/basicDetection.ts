
import { logTruncation, LogLevel } from './logLevel';

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
    ((content.match(/```/g) || []).length % 2 !== 0),
    
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

  const isTruncated = truncationIndicators.some(indicator => indicator === true);
  
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
