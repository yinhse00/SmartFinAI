
/**
 * Check listing rules response for completeness
 * 
 * @param content The content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkListingRulesResponse(content: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  // Basic check for conclusion section
  if (!content.toLowerCase().includes('conclusion') && 
      !content.toLowerCase().includes('in summary') && 
      !content.toLowerCase().includes('to summarize') &&
      content.length > 2000) {
    result.isComplete = false;
    result.missingElements.push("Missing conclusion section");
    result.confidence = 'medium';
  }
  
  return result;
}
