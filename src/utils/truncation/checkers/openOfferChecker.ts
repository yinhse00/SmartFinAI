
/**
 * Check Open Offer response for completeness
 * @param content The content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkOpenOfferResponse(content: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[]
  };
  
  const lowerContent = content.toLowerCase();
  
  // Skip standard checks for comparison queries
  if (isComparisonQuery(content)) {
    return result;
  }
  
  const mandatoryKeywords = ['ex-entitlement', 'record date', 'acceptance period', 'payment date'];
  
  const missingKeywords = mandatoryKeywords.filter(
    keyword => !lowerContent.includes(keyword) && !lowerContent.includes(keyword.replace('-', ' '))
  );
  
  if (missingKeywords.length > 0) {
    result.isComplete = false;
    result.missingElements.push(
      ...missingKeywords.map(k => `Missing key open offer concept: ${k}`)
    );
  }
  
  // Check that open offer explicitly mentions no nil-paid rights
  if (!lowerContent.includes('no nil-paid') && !lowerContent.includes('not have nil-paid') && 
      !lowerContent.includes('unlike rights issues') && !lowerContent.includes('no trading of rights')) {
    result.isComplete = false;
    result.missingElements.push("Missing key open offer distinction (no nil-paid rights trading)");
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
