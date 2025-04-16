
/**
 * Common utility functions for content analysis
 */

/**
 * Check if content is a comparison query
 * @param content Response content to analyze
 */
export function isComparisonQuery(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return lowerContent.includes('difference between') || 
         lowerContent.includes('compare') || 
         lowerContent.includes('versus') || 
         lowerContent.includes('vs');
}

/**
 * Check if the content has a proper conclusion section
 * @param content Response content to analyze
 */
export function hasConclusion(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return lowerContent.includes('in conclusion') ||
         lowerContent.includes('to conclude') ||
         lowerContent.includes('key differences:') ||
         lowerContent.includes('key points:') ||
         lowerContent.includes('summary:') ||
         lowerContent.includes('to summarize');
}

/**
 * Extract dates from content
 * @param content Response content to analyze
 */
export function extractDates(content: string): string[] {
  return content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
}
