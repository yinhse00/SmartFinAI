
/**
 * Check takeover offer response for completeness
 * 
 * @param content The content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkTakeoverOfferResponse(content: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  const lowerContent = content.toLowerCase();
  
  // Check for key takeover offer components
  const mandatoryElements = [
    { term: 'mandatory offer', description: "Mandatory offer requirements" },
    { term: '30%', description: "30% threshold" },
    { term: 'takeovers code', description: "Reference to the Takeovers Code" },
    { term: 'rule 26', description: "Reference to Rule 26" },
  ];
  
  // Check if any mandatory elements are missing
  const missingElements = mandatoryElements.filter(
    element => !lowerContent.includes(element.term)
  );
  
  if (missingElements.length > 0) {
    result.isComplete = false;
    result.missingElements.push(
      ...missingElements.map(e => e.description)
    );
  }
  
  return result;
}
