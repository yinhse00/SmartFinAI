/**
 * Check Open Offer response for completeness
 * Open Offers are CORPORATE ACTIONS governed by Listing Rules Chapter 7, NOT the Takeovers Code
 * 
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
  
  // CRITICAL CHECK: Must identify open offer as Listing Rules corporate action
  if (!lowerContent.includes('corporate action') && !lowerContent.includes('capital raising')) {
    result.isComplete = false;
    result.missingElements.push("CRITICAL: Missing identification of Open Offer as a corporate action under Listing Rules");
  }
  
  // Check for Listing Rules references - MANDATORY for open offers
  if (!lowerContent.includes('listing rule') && !lowerContent.includes('chapter 7') && 
      !lowerContent.includes('rule 7.') && !lowerContent.includes('rule 7 ')) {
    result.isComplete = false;
    result.missingElements.push("Missing Listing Rules references for Open Offer");
  }
  
  // Check for incorrect regulatory framework references - MUST flag any takeover code mentions
  if (lowerContent.includes('takeovers code') || 
      lowerContent.includes('takeover code') ||
      lowerContent.includes('codes on takeovers') ||
      lowerContent.includes('rule 26')) {
    result.isComplete = false;
    result.missingElements.push("CRITICAL ERROR: Incorrectly references Takeovers Code for Open Offer (corporate action under Listing Rules)");
  }
  
  // Check for key trading arrangement guide timetable elements
  const timetableKeywords = [
    'cum-entitlement', 
    'ex-entitlement', 
    'record date', 
    'application form', 
    'acceptance', 
    'new shares listing'
  ];
  
  const missingTimetableKeywords = timetableKeywords.filter(
    keyword => !lowerContent.includes(keyword) && !lowerContent.includes(keyword.replace('-', ' '))
  );
  
  if (missingTimetableKeywords.length > 0) {
    result.isComplete = false;
    result.missingElements.push(
      ...missingTimetableKeywords.map(k => `Missing key open offer timetable element: ${k}`)
    );
  }
  
  // Check that open offer explicitly mentions no nil-paid rights AND explicitly identifies as corporate action
  if (!lowerContent.includes('no nil-paid') && !lowerContent.includes('not have nil-paid') && 
      !lowerContent.includes('unlike rights issues') && !lowerContent.includes('no trading of rights')) {
    result.isComplete = false;
    result.missingElements.push("Missing key open offer distinction (no nil-paid rights trading)");
  }
  
  // Check for Guide on Trading Arrangements reference
  if (!lowerContent.includes('guide on trading arrangement') && 
      !lowerContent.includes('trading arrangements guide') &&
      !lowerContent.includes('hkex guide')) {
    result.isComplete = false;
    result.missingElements.push("Missing reference to Guide on Trading Arrangements");
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

/**
 * Check for regulatory framework confusion in the query
 */
export function checkRegulatoryFrameworkClarity(content: string): { isConfused: boolean, explanation: string } {
  const lowerContent = content.toLowerCase();
  
  // Check if open offers are incorrectly described using takeovers terminology
  if ((lowerContent.includes('open offer') || lowerContent.includes('corporate action')) &&
      (lowerContent.includes('takeover') || lowerContent.includes('rule 26') || 
       lowerContent.includes('mandatory offer'))) {
    return {
      isConfused: true,
      explanation: "CRITICAL: Response incorrectly mixes Open Offers (Listing Rules corporate action) with Takeovers Code concepts"
    };
  }
  
  return { isConfused: false, explanation: "" };
}
