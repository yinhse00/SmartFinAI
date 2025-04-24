
/**
 * Check Chapter 18C Specialist Technology Companies response for completeness
 * 
 * @param content The content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkChapter18CResponse(content: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  const lowerContent = content.toLowerCase();
  
  // Check for key Chapter 18C components that must be present
  const mandatoryElements = [
    { term: 'specialist technology', description: "Specialist Technology definition" },
    { term: 'market capitalization', description: "Minimum market capitalization requirements" },
    { term: 'commercial company', description: "Commercial Company criteria" },
    { term: 'pre-commercial company', description: "Pre-Commercial Company criteria" },
    { term: 'sophisticated independent investor', description: "Sophisticated Independent Investor requirements" },
    { term: 'r&d', description: "R&D investment thresholds" },
    { term: 'working capital', description: "Working capital requirements" },
  ];
  
  // Check if any mandatory elements are missing
  const missingElements = mandatoryElements.filter(
    element => !lowerContent.includes(element.term)
  );
  
  if (missingElements.length > 0) {
    result.isComplete = false;
    result.missingElements.push(
      ...missingElements.map(e => `Missing ${e.description}`)
    );
  }
  
  // Check for key threshold values that should be present
  const thresholdValues = [
    { term: '8 billion', description: "HK$8 billion minimum market cap for Commercial Companies" },
    { term: '15 billion', description: "HK$15 billion minimum market cap for Pre-Commercial Companies" },
    { term: '15%', description: "15% R&D to revenue ratio requirement" }
  ];
  
  // Check if threshold values are missing
  const missingThresholds = thresholdValues.filter(
    threshold => !content.includes(threshold.term)
  );
  
  if (missingThresholds.length > 0) {
    result.isComplete = false;
    result.missingElements.push(
      ...missingThresholds.map(t => `Missing ${t.description}`)
    );
  }
  
  // Check for conclusion section
  if (!lowerContent.includes('conclusion') && 
      !lowerContent.includes('to summarize') && 
      !lowerContent.includes('in summary')) {
    result.isComplete = false;
    result.missingElements.push("Missing conclusion section");
    result.confidence = 'medium';
  }
  
  return result;
}
