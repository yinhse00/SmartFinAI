
/**
 * Check open offer response for completeness
 * 
 * @param content The content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkOpenOfferResponse(content: string) {
  const result = {
    isComplete: true,
    isTruncated: false, // Explicitly include isTruncated property
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  const lowerContent = content.toLowerCase();
  
  // Check for key open offer components
  const mandatoryElements = [
    { term: 'offer price', description: "Offer price information" },
    { term: 'record date', description: "Record date information" },
    { term: 'non-transferable', description: "Non-transferable nature of entitlements" },
    { term: 'entitlement ratio', description: "Entitlement ratio details" },
  ];
  
  // Check if any mandatory elements are missing
  const missingElements = mandatoryElements.filter(
    element => !lowerContent.includes(element.term)
  );
  
  if (missingElements.length > 0) {
    result.isComplete = false;
    result.isTruncated = true; // Set isTruncated when incomplete
    result.missingElements.push(
      ...missingElements.map(e => e.description)
    );
  }
  
  // For long responses, check if conclusion is present
  if (content.length > 3000 && 
      !lowerContent.includes('conclusion') && 
      !lowerContent.includes('in summary') && 
      !lowerContent.includes('to summarize')) {
    result.isComplete = false;
    result.isTruncated = true; // Set isTruncated when incomplete
    result.missingElements.push('Missing conclusion section');
  }
  
  return result;
}
