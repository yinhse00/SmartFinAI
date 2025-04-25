
/**
 * Check rights issue response for completeness
 * 
 * @param content The content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkRightsIssueResponse(content: string) {
  const result = {
    isComplete: true,
    isTruncated: false,  // Explicitly include isTruncated property
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  const lowerContent = content.toLowerCase();
  
  // Check for key rights issue components
  const mandatoryElements = [
    { term: 'subscription price', description: "Subscription price information" },
    { term: 'record date', description: "Record date information" },
    { term: 'rights ratio', description: "Rights ratio details" },
    { term: 'nil paid', description: "Nil-paid rights trading information" },
    { term: 'underwriting', description: "Underwriting arrangements" },
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
  
  // Check for timetable information which is crucial for rights issues
  if (!lowerContent.includes('timetable')) {
    result.isComplete = false;
    result.isTruncated = true;  // Set isTruncated when incomplete
    result.missingElements.push('Rights issue timetable');
  }
  
  // For long responses, check if conclusion is present
  if (content.length > 3000 && 
      !lowerContent.includes('conclusion') && 
      !lowerContent.includes('in summary') && 
      !lowerContent.includes('to summarize')) {
    result.isComplete = false;
    result.isTruncated = true;  // Set isTruncated when incomplete
    if (!result.missingElements.includes('Conclusion section')) {
      result.missingElements.push('Conclusion section');
    }
  }
  
  return result;
}
