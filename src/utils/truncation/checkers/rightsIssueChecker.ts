
import { logTruncation, LogLevel } from '../logLevel';

/**
 * Check Rights Issue response for completeness
 * @param content Response content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkRightsIssueResponse(content: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[]
  };
  
  const lowerContent = content.toLowerCase();
  
  // Don't run standard checks if this is a comparison
  if (isComparisonQuery(content)) {
    return result;
  }
  
  const mandatoryKeywords = [
    'ex-rights', 
    'nil-paid rights', 
    'trading period', 
    'record date', 
    'acceptance deadline'
  ];
  
  const missingKeywords = mandatoryKeywords.filter(
    keyword => !lowerContent.includes(keyword) && !lowerContent.includes(keyword.replace('-', ' '))
  );
  
  if (missingKeywords.length > 0) {
    result.isComplete = false;
    result.missingElements.push(
      ...missingKeywords.map(k => `Missing key rights issue concept: ${k}`)
    );
  }
  
  // Check for sufficient date information in timetables
  if (lowerContent.includes('timetable')) {
    const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
    if (dateMatches.length < 5) {
      result.isComplete = false;
      result.missingElements.push(`Insufficient key dates (found ${dateMatches.length})`);
    }
    
    // Check that the response doesn't end abruptly with a table without conclusion
    const lastParagraphs = content.split('\n').slice(-7).join('\n').toLowerCase();
    if ((lastParagraphs.includes('|') || lastParagraphs.includes('-')) && 
        !lastParagraphs.includes('conclusion') && 
        !lastParagraphs.includes('summary') &&
        !lastParagraphs.includes('key points')) {
      result.isComplete = false;
      result.missingElements.push("Response ends with table or list without conclusion");
    }
  }
  
  return result;
}

/**
 * Check if content is a comparison query
 */
export function isComparisonQuery(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return lowerContent.includes('difference between') || 
         lowerContent.includes('compare') || 
         lowerContent.includes('versus') || 
         lowerContent.includes('vs');
}
