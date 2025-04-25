
/**
 * Check trading arrangement response for completeness
 * 
 * @param content The content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkTradingArrangementResponse(content: string) {
  const result = {
    isComplete: true,
    isTruncated: false,  // Explicitly include isTruncated property
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  const lowerContent = content.toLowerCase();
  
  // Check for key trading arrangement components
  const mandatoryElements = [
    { term: 'ex-date', description: "Ex-date information" },
    { term: 'record date', description: "Record date information" },
    { term: 'payment date', description: "Payment date details" },
    { term: 'timetable', description: "Trading timetable" },
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
