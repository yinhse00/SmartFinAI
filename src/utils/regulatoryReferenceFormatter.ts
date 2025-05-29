
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
  // More comprehensive pattern to catch various formats
  const listingRulePattern = /\b(?:Rule\s+(\d+[A-Z]?(?:\.\d+[A-Z]?)*(?:\([a-z]\))?)|Chapter\s+(\d+[A-Z]?)|Listing\s+Rule\s+(\d+[A-Z]?(?:\.\d+[A-Z]?)*(?:\([a-z]\))?))\b/gi;
  let match;
  
  while ((match = listingRulePattern.exec(text)) !== null) {
    const isRule = match[1] !== undefined || match[3] !== undefined;
    const identifier = match[1] || match[2] || match[3];
    if (identifier) {
      references.push({
        text: match[0],
        type: isRule ? 'listing_rule' : 'chapter',
        identifier: identifier,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }
  
  // Takeovers Code references - enhanced pattern
  const takeoversPattern = /\b(?:Rule|Section)\s+(\d+(?:\.\d+)*)\s+of\s+(?:the\s+)?(?:Takeovers\s+Code|Code\s+on\s+Takeovers|Codes\s+on\s+Takeovers)/gi;
  while ((match = takeoversPattern.exec(text)) !== null) {
    references.push({
      text: match[0],
      type: 'takeovers_code',
      identifier: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  // FAQ references - enhanced pattern
  const faqPattern = /\b(?:FAQ\s+(?:Series\s+)?(\d+(?:\.\d+)*)|Frequently\s+Asked\s+Questions?\s+(\d+(?:\.\d+)*))\b/gi;
  while ((match = faqPattern.exec(text)) !== null) {
    const identifier = match[1] || match[2];
    if (identifier) {
      references.push({
        text: match[0],
        type: 'faq',
        identifier: identifier,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }
  
  // Guidance Letter references - enhanced pattern
  const guidancePattern = /\b(?:Guidance\s+Letter\s+([A-Z]{1,3}-\d+)|GL\s*[-:]?\s*([A-Z]{1,3}-\d+))\b/gi;
  while ((match = guidancePattern.exec(text)) !== null) {
    const identifier = match[1] || match[2];
    if (identifier) {
      references.push({
        text: match[0],
        type: 'guidance_letter',
        identifier: identifier,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }
  
  // Listing Decision references - enhanced pattern
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
  
  // Debug logging for reference detection
  if (references.length > 0) {
    console.log(`Extracted ${references.length} regulatory references:`, references.map(r => `${r.text} (${r.type})`));
  }
  
  // Sort by startIndex to process in order
  return references.sort((a, b) => a.startIndex - b.startIndex);
};

/**
 * Convert regulatory references to clickable links
 */
export const enhanceWithClickableLinks = (text: string): string => {
  // IMPROVED: Only skip if there are actual existing anchor tags with href attributes
  // Don't skip just because there are other HTML elements like <p>, <h2>, etc.
  const existingLinksRegex = /<a\s+[^>]*href[^>]*>.*?<\/a>/gi;
  const hasExistingLinks = existingLinksRegex.test(text);
  
  if (hasExistingLinks) {
    console.log('Text already contains anchor links, skipping enhancement');
    return text;
  }
  
  const references = extractRuleReferences(text);
  if (references.length === 0) {
    console.log('No regulatory references found in text');
    return text;
  }
  
  console.log(`Enhancing ${references.length} references with clickable links`);
  
  let enhancedText = text;
  
  // Process references in reverse order to maintain indices
  for (let i = references.length - 1; i >= 0; i--) {
    const ref = references[i];
    const mapping = mapReference(ref.type, ref.identifier, ref.text);
    
    if (mapping) {
      // Create clickable link with enhanced styling
      const linkHtml = `<a href="${mapping.url}" target="_blank" rel="noopener noreferrer" class="font-bold text-finance-accent-blue hover:text-finance-accent-green transition-colors cursor-pointer underline decoration-dotted underline-offset-2 hover:decoration-solid">${ref.text}</a>`;
      
      enhancedText = 
        enhancedText.slice(0, ref.startIndex) + 
        linkHtml + 
        enhancedText.slice(ref.endIndex);
        
      console.log(`Created clickable link for: ${ref.text} -> ${mapping.url}`);
    } else {
      // Fallback to bold styling for unmapped references
      const boldHtml = `<strong class="font-bold text-finance-dark-blue dark:text-finance-light-blue">${ref.text}</strong>`;
      
      enhancedText = 
        enhancedText.slice(0, ref.startIndex) + 
        boldHtml + 
        enhancedText.slice(ref.endIndex);
        
      console.log(`No URL mapping found for: ${ref.text}, applied bold styling`);
    }
  }
  
  console.log(`Enhanced text with ${references.length} clickable regulatory references`);
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
