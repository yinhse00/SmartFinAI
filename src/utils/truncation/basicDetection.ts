
import { logTruncation, LogLevel } from './logLevel';

export const detectTruncation = (content: string): boolean => {
  if (!content) return false;

  // Improved truncation indicators - more comprehensive
  const truncationIndicators = [
    // Clear truncation markers
    content.trim().endsWith('...') || content.trim().endsWith('…'),
    
    // Severely cut off content 
    content.length < 50 && content.length > 0,
    
    // Uneven code blocks
    ((content.match(/```/g) || []).length > 1 && (content.match(/```/g) || []).length % 2 !== 0),
    
    // End with unfinished markdown table
    content.includes('|') && content.split('\n').filter(line => line.includes('|')).length > 2 && 
    !content.trim().split('\n').slice(-3).some(line => line.includes('|')),
    
    // Cut off HTML tag
    content.trim().match(/<[^>]*$/),
    
    // End with incomplete sentence right after a bullet point
    content.trim().match(/[-*•]\s+\w+[^.!?]*$/),
    
    // End with incomplete sentence after a colon
    content.trim().match(/:\s+\w+[^.!?]*$/)
  ];
  
  const isTruncated = truncationIndicators.some(indicator => indicator === true);
  
  if (isTruncated) {
    logTruncation(
      LogLevel.WARN, 
      "Basic truncation detected", 
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
      // Only consider unbalanced if the count is high enough to matter
      if (count % 2 !== 0 && count > 2) {
        isUnbalanced = true;
      }
    } else {
      // For different opening/closing pairs, count each separately
      const openCount = (content.match(new RegExp(`\\${opening}`, 'g')) || []).length;
      const closeCount = (content.match(new RegExp(`\\${closing}`, 'g')) || []).length;
      counts[name] = openCount - closeCount;
      // Only consider unbalanced if the difference is significant
      // More lenient for brackets and parentheses which may appear in natural text
      if (Math.abs(openCount - closeCount) > (name === 'brackets' || name === 'parentheses' ? 3 : 1)) {
        isUnbalanced = true;
      }
    }
  }
  
  // Check for list items without endings when we have multiple list items
  const bulletPoints = (content.match(/^[\s]*[-*•][\s].*$/gm) || []).length;
  const lastBulletComplete = !content.match(/[-*•][\s][^.!?:;)]*$/m); // Is the last bullet point complete?
  const unfinishedList = bulletPoints > 3 && !lastBulletComplete;
  
  if (unfinishedList) {
    counts['bulletPoints'] = bulletPoints;
    counts['lastBulletComplete'] = lastBulletComplete ? 1 : 0;
    isUnbalanced = true;
  }
  
  // Check for table row balance (number of | symbols should be consistent in each row)
  if (content.includes('|') && content.includes('\n|')) {
    const tableRows = content.split('\n').filter(line => line.trim().startsWith('|'));
    if (tableRows.length > 2) {
      const pipeCounts = tableRows.map(row => (row.match(/\|/g) || []).length);
      const inconsistentTable = pipeCounts.some(count => count !== pipeCounts[0]);
      if (inconsistentTable) {
        counts['inconsistentTableRows'] = 1;
        isUnbalanced = true;
      }
    }
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
