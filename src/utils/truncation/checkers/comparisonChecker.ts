
/**
 * Check comparison response for completeness
 * @param content Response content to analyze
 * @param queryType Type of financial query
 * @returns Analysis result with completeness status and missing elements
 */
export function checkComparisonResponse(content: string, queryType: string) {
  const result = {
    isComplete: true,
    isTruncated: false,  // Explicitly include isTruncated property
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  const lowerContent = content.toLowerCase();
  
  // Special checks for rights issue vs open offer comparison
  if (lowerContent.includes('rights issue') && lowerContent.includes('open offer')) {
    const mandatoryRightsIssueTerms = ['nil-paid rights', 'ex-rights', 'trading period'];
    const mandatoryOpenOfferTerms = ['no nil-paid', 'ex-entitlement', 'no trading of rights'];
    
    // Check for missing terms in the comparison
    const missingRightsTerms = mandatoryRightsIssueTerms.filter(term => !lowerContent.includes(term));
    const missingOpenOfferTerms = mandatoryOpenOfferTerms.filter(term => 
      !lowerContent.includes(term) && !lowerContent.includes(term.replace('-', ' ')));
    
    if (missingRightsTerms.length > 0) {
      result.isComplete = false;
      result.isTruncated = true;  // Set isTruncated when incomplete
      missingRightsTerms.forEach(term => {
        result.missingElements.push(`Missing key rights issue term: ${term}`);
      });
    }
    
    if (missingOpenOfferTerms.length > 0) {
      result.isComplete = false;
      result.isTruncated = true;  // Set isTruncated when incomplete
      missingOpenOfferTerms.forEach(term => {
        result.missingElements.push(`Missing key open offer term: ${term}`);
      });
    }
    
    // Check for timetable completeness in comparison
    if (lowerContent.includes('timetable')) {
      // For timetables, ensure we have adequate date information for both
      const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
      if (dateMatches.length < 8) { // We need more dates when comparing two timetables
        result.isComplete = false;
        result.isTruncated = true;  // Set isTruncated when incomplete
        result.missingElements.push(`Insufficient key dates for comparison (found ${dateMatches.length})`);
      }
    }
    
    // Check for conclusion specifically in comparison responses
    if (!lowerContent.includes('in conclusion') && 
        !lowerContent.includes('to conclude') && 
        !lowerContent.includes('key differences:') && 
        !lowerContent.includes('summary of differences')) {
      result.isComplete = false;
      result.isTruncated = true;  // Set isTruncated when incomplete
      result.missingElements.push("Missing conclusion section in comparison");
    }
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
