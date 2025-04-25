
/**
 * Check connected transaction response for completeness
 * 
 * @param content The content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkConnectedTransactionResponse(content: string) {
  const result = {
    isComplete: true,
    isTruncated: false,  // Explicitly include isTruncated property
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  const lowerContent = content.toLowerCase();
  
  // Check for key connected transaction components
  const mandatoryElements = [
    { term: 'connected person', description: "Connected person definition" },
    { term: 'percentage ratio', description: "Percentage ratio thresholds" },
    { term: 'de minimis', description: "De minimis exemption" },
    { term: 'chapter 14a', description: "Reference to Chapter 14A" },
  ];
  
  // Check if any mandatory elements are missing
  const missingElements = mandatoryElements.filter(
    element => !lowerContent.includes(element.term)
  );
  
  if (missingElements.length > 0) {
    result.isComplete = false;
    result.isTruncated = true;  // Set isTruncated when incomplete
    result.missingElements.push(
      ...missingElements.map(e => e.description)
    );
  }
  
  return result;
}
