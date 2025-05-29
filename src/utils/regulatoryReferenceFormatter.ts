
import { mapReference, ReferenceMapping } from '@/services/regulatory/urlMappingService';

/**
 * Utility for detecting and formatting regulatory references
 * Enhances display with clickable links while maintaining professional appearance
 */

export interface ExtractedReference {
  text: string;
  type: string;
  identifier: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Extract rule references from text with enhanced detection
 */
export const extractRuleReferences = (text: string): ExtractedReference[] => {
  const references: ExtractedReference[] = [];
  
  // Enhanced Listing Rules references (Rule X.XX, Chapter X)
  const listingRulePattern = /\b(?:Rule\s+(\d+[A-Z]?(?:\.\d+[A-Z]?)*)|Chapter\s+(\d+[A-Z]?))\b/gi;
  let match;
  
  while ((match = listingRulePattern.exec(text)) !== null) {
    const isRule = match[1] !== undefined;
    const identifier = match[1] || match[2];
    references.push({
      text: match[0],
      type: isRule ? 'listing_rule' : 'chapter',
      identifier: identifier,
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  // Takeovers Code references
  const takeoversPattern = /\b(?:Rule|Section)\s+(\d+(?:\.\d+)*)\s+of\s+(?:the\s+)?(?:Takeovers\s+Code|Code\s+on\s+Takeovers)/gi;
  while ((match = takeoversPattern.exec(text)) !== null) {
    references.push({
      text: match[0],
      type: 'takeovers_code',
      identifier: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  // FAQ references
  const faqPattern = /\bFAQ\s+(?:Series\s+)?(\d+(?:\.\d+)*)\b/gi;
  while ((match = faqPattern.exec(text)) !== null) {
    references.push({
      text: match[0],
      type: 'faq',
      identifier: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  // Guidance Letter references
  const guidancePattern = /\b(?:Guidance\s+Letter\s+|GL)([A-Z]{1,3}-\d+)\b/gi;
  while ((match = guidancePattern.exec(text)) !== null) {
    references.push({
      text: match[0],
      type: 'guidance_letter',
      identifier: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  // Listing Decision references
  const listingDecisionPattern = /\b(?:LD|Listing\s+Decision)\s*[:\-]?\s*([A-Z]{1,3}[-\s]\d+[-\s]\d+)\b/gi;
  while ((match = listingDecisionPattern.exec(text)) !== null) {
    references.push({
      text: match[0],
      type: 'listing_decision',
      identifier: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  // Sort by startIndex to process in order
  return references.sort((a, b) => a.startIndex - b.startIndex);
};

/**
 * Convert regulatory references to clickable links
 */
export const enhanceWithClickableLinks = (text: string): string => {
  // Don't modify HTML content that already has links
  if (text.includes('</a>') || text.includes('<a ')) return text;
  
  const references = extractRuleReferences(text);
  if (references.length === 0) return text;
  
  let enhancedText = text;
  let offset = 0;
  
  // Process references in reverse order to maintain indices
  for (let i = references.length - 1; i >= 0; i--) {
    const ref = references[i];
    const mapping = mapReference(ref.type, ref.identifier, ref.text);
    
    if (mapping) {
      // Create clickable link with same styling as current bold references
      const linkHtml = `<a href="${mapping.url}" target="_blank" rel="noopener noreferrer" class="font-bold text-finance-accent-blue hover:text-finance-accent-green transition-colors cursor-pointer underline decoration-dotted underline-offset-2">${ref.text}</a>`;
      
      enhancedText = 
        enhancedText.slice(0, ref.startIndex) + 
        linkHtml + 
        enhancedText.slice(ref.endIndex);
    } else {
      // Fallback to bold styling for unmapped references
      const boldHtml = `<strong class="font-bold text-finance-dark-blue dark:text-finance-light-blue">${ref.text}</strong>`;
      
      enhancedText = 
        enhancedText.slice(0, ref.startIndex) + 
        boldHtml + 
        enhancedText.slice(ref.endIndex);
    }
  }
  
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
  enhanceWithClickableLinks,
  containsRegulatoryTimetable
};
