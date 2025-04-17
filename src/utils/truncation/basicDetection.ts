
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
