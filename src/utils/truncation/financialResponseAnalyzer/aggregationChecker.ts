
/**
 * Check aggregation response for completeness
 * 
 * @param content The content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkAggregationResponse(content: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  const lowerContent = content.toLowerCase();
  
  // Check for key aggregation components
  const mandatoryElements = [
    { term: '50% threshold', description: "50% threshold requirement" },
    { term: 'independent shareholders', description: "Independent shareholders approval requirement" },
    { term: '12 month', description: "12-month aggregation period" },
    { term: 'rule 7.19a', description: "Reference to Listing Rule 7.19A" },
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
