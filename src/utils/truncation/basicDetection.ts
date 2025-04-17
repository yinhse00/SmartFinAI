
import { logTruncation, LogLevel } from './logLevel';

export const detectTruncation = (content: string): boolean => {
  if (!content) return false;

  const truncationIndicators = [
    // More relaxed length check
    !/[.!?:]$/.test(content) && content.length > 500, // Increased from 200
    
    // Uneven number of code blocks
    ((content.match(/```/g) || []).length % 2 !== 0),
    
    // Content that seems abruptly cut off
    content.trim().endsWith('...') ||
    content.trim().endsWith('and') ||
    content.trim().endsWith('or') ||
    content.trim().endsWith('but') ||
    
    // Long content without proper sentence ending
    content.split(' ').length > 100 && 
    !content.endsWith('.') && 
    !content.endsWith('!') && 
    !content.endsWith('?'),
    
    // Table formatting without complete structure
    (content.includes('|') && !content.includes('---') && content.split('\n').length < 3)
  ];
  
  const isTruncated = truncationIndicators.some(indicator => indicator === true);
  
  if (isTruncated) {
    logTruncation(
      LogLevel.WARN, 
      "Basic truncation detected with more lenient criteria", 
      { length: content.length, lastChars: content.slice(-40) }
    );
  }

  return isTruncated;
};

/**
 * Checks for unbalanced programming constructs that may indicate truncation
 * @param content The content to check
 * @returns Object with unbalanced status and details
 */
export const checkUnbalancedConstructs = (content: string): { 
  isUnbalanced: boolean; 
  details: { [key: string]: number } 
} => {
  const constructs: { [key: string]: { opening: string; closing: string } } = {
    parentheses: { opening: '(', closing: ')' },
    brackets: { opening: '[', closing: ']' },
    braces: { opening: '{', closing: '}' },
    singleQuotes: { opening: "'", closing: "'" },
    doubleQuotes: { opening: '"', closing: '"' },
    codeBlocks: { opening: '```', closing: '```' }
  };
  
  const counts: { [key: string]: number } = {};
  let isUnbalanced = false;
  
  for (const [name, { opening, closing }] of Object.entries(constructs)) {
    // Special case for quotes which are the same character
    if (opening === closing) {
      // For identical opening/closing chars like quotes, we just check for even count
      const count = (content.match(new RegExp(`${opening}`, 'g')) || []).length;
      counts[name] = count;
      if (count % 2 !== 0) {
        isUnbalanced = true;
      }
    } else {
      // For different opening/closing pairs, count each separately
      const openCount = (content.match(new RegExp(`\\${opening}`, 'g')) || []).length;
      const closeCount = (content.match(new RegExp(`\\${closing}`, 'g')) || []).length;
      counts[name] = openCount - closeCount;
      if (openCount !== closeCount) {
        isUnbalanced = true;
      }
    }
  }
  
  // Also check for list items without endings when we have multiple list items
  const bulletPoints = (content.match(/^[\s]*[-*•][\s].*$/gm) || []).length;
  const unfinishedList = bulletPoints > 1 && /[-*•][\s][^.!?:;)]*$/.test(content);
  
  if (unfinishedList) {
    counts['bulletPoints'] = bulletPoints;
    isUnbalanced = true;
  }
  
  if (isUnbalanced) {
    logTruncation(
      LogLevel.WARN, 
      "Unbalanced constructs detected", 
      counts
    );
  }
  
  return { isUnbalanced, details: counts };
};
