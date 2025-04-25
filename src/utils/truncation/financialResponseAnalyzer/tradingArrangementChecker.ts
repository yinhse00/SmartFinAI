
/**
 * Check trading arrangement response for completeness
 * 
 * @param content The content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkTradingArrangementResponse(content: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  const lowerContent = content.toLowerCase();
  
  // Check for key trading arrangement components
  const mandatoryElements = [
    { term: 'ex-date', description: "Ex-date information" },
    { term: 'record date', description: "Record date information" },
    { term: 'payment date', description: "Payment date information" },
    { term: 'timetable', description: "Complete timetable section" },
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
  
  // For long responses, check if conclusion is present
  if (content.length > 2000 && 
      !lowerContent.includes('conclusion') && 
      !lowerContent.includes('in summary') && 
      !lowerContent.includes('to summarize')) {
    result.isComplete = false;
    if (!result.missingElements.includes('Conclusion section')) {
      result.missingElements.push('Conclusion section');
    }
  }
  
  return result;
}
