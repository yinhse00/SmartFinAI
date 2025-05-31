
/**
 * Utility for detecting and formatting regulatory references
 * Enhances display without changing the output structure
 */

/**
 * Extract rule references from text
 */
export const extractRuleReferences = (text: string): string[] => {
  const references: string[] = [];
  
  // Match Listing Rules references
  const listingRulePattern = /(?:Rule|Chapter)\s+(\d+[A-Z]?(?:\.\d+)?)/gi;
  let match;
  
  while ((match = listingRulePattern.exec(text)) !== null) {
    references.push(match[0]);
  }
  
  // Match Takeovers Code references
  const takeoversCodePattern = /(?:Rule|Section)\s+(\d+(?:\.\d+)?)\s+of\s+(?:the\s+)?(?:Takeovers\s+Code|Code\s+on\s+Takeovers)/gi;
  while ((match = takeoversCodePattern.exec(text)) !== null) {
    references.push(match[0]);
  }
  
  // Match FAQ references
  const faqPattern = /FAQ\s+(?:Series\s+)?(\d+)/gi;
  while ((match = faqPattern.exec(text)) !== null) {
    references.push(match[0]);
  }
  
  // Match Listing Decision references
  const listingDecisionPattern = /(?:LD|Listing\s+Decision)[- ](\d+[- ]\d+)/gi;
  while ((match = listingDecisionPattern.exec(text)) !== null) {
    references.push(match[0]);
  }
  
  return [...new Set(references)]; // Remove duplicates
};

/**
 * Format rule references for display
 */
export const enhanceRuleReferences = (text: string): string => {
  // Don't modify HTML content directly
  if (text.includes('</')) return text;
  
  let enhancedText = text;
  
  // Enhance Listing Rules references
  enhancedText = enhancedText.replace(
    /(?:Rule|Chapter)\s+(\d+[A-Z]?(?:\.\d+)?)/gi,
    (match) => `**${match}**`
  );
  
  // Enhance Takeovers Code references
  enhancedText = enhancedText.replace(
    /(?:Rule|Section)\s+(\d+(?:\.\d+)?)\s+of\s+(?:the\s+)?(?:Takeovers\s+Code|Code\s+on\s+Takeovers)/gi,
    (match) => `**${match}**`
  );
  
  // Enhance FAQ references
  enhancedText = enhancedText.replace(
    /FAQ\s+(?:Series\s+)?(\d+)/gi,
    (match) => `**${match}**`
  );
  
  // Enhance Listing Decision references
  enhancedText = enhancedText.replace(
    /(?:LD|Listing\s+Decision)[- ](\d+[- ]\d+)/gi,
    (match) => `**${match}**`
  );
  
  return enhancedText;
};

/**
 * Detect if text contains regulatory timetable patterns
 */
export const containsRegulatoryTimetable = (text: string): boolean => {
  // Look for table structures with timeline/date columns
  const hasTableStructure = text.includes('|') && 
                           text.split('\n').filter(line => line.includes('|')).length > 3;
  
  // Look for timeline/date headers
  const hasTimelineHeaders = /\|\s*(?:Timeline|Date|Day|Time|Deadline|T[-+]\d+)\s*\|/i.test(text);
  
  return hasTableStructure && hasTimelineHeaders;
};

export default {
  extractRuleReferences,
  enhanceRuleReferences,
  containsRegulatoryTimetable
};
