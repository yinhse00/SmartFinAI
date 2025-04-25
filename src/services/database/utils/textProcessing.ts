
/**
 * Utilities for processing text and extracting terms
 */

/**
 * Extract key terms from text by splitting into words and filtering
 */
export function extractKeyTerms(text: string): string[] {
  // Split text into words and filter out short words and common stop words
  const stopWords = ['the', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of'];
  
  const terms = text
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  // Enhanced rule patterns with strict chapter-specific contexts
  const rulePatterns = [
    // Standard rule numbers with optional subsections (e.g., 14.44, 14.44(1))
    /(?:rule\s+)?(\d+\.\d+[A-Z]?\(\d+\)?)/gi,
    // Chapter-specific rules (e.g., 14A.44)
    /(?:rule\s+)?(\d+[A-Z]\.\d+[A-Z]?\(\d+\)?)/gi,
    // Chapter references
    /chapter\s+(\d+[A-Z]?)/gi,
    // Rules with chapter context (e.g., Chapter 14A rule 44)
    /chapter\s+(\d+[A-Z]?)\s+rule\s+(\d+)/gi
  ];
  
  // Extract all rule numbers preserving chapter context
  const ruleNumbers = rulePatterns.flatMap(pattern => {
    const matches = Array.from(text.matchAll(pattern));
    return matches.map(match => {
      // Preserve full match to maintain context
      return match[0].toLowerCase();
    });
  });
  
  // Add normalized rule numbers to terms
  return [...terms, ...ruleNumbers];
}

/**
 * Count how many terms from the query match the keywords
 */
export function countMatches(keywords: string[], queryTerms: string[]): number {
  let count = 0;
  
  for (const term of queryTerms) {
    const termLower = term.toLowerCase();
    const isRuleMatch = keywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      // Exact match check
      if (keywordLower === termLower) {
        return true;
      }
      
      // Rule number match with chapter context
      if (termLower.match(/\d+[A-Z]?\.\d+/) && keywordLower.match(/\d+[A-Z]?\.\d+/)) {
        // Normalize both terms for comparison
        const normalizedTerm = normalizeRuleNumber(termLower);
        const normalizedKeyword = normalizeRuleNumber(keywordLower);
        return normalizedTerm === normalizedKeyword;
      }
      
      return false;
    });
    
    if (isRuleMatch) {
      count++;
    }
  }
  
  return count;
}

/**
 * Normalize rule numbers for consistent comparison
 */
function normalizeRuleNumber(text: string): string {
  // Remove "rule" and extra spaces
  let normalized = text.toLowerCase().replace(/rule\s+/i, '').trim();
  
  // Extract chapter and rule parts if present
  const chapterMatch = normalized.match(/chapter\s+(\d+[A-Z]?)\s+(?:rule\s+)?(\d+)/i);
  if (chapterMatch) {
    // Convert "Chapter 14A rule 44" to "14A.44"
    normalized = `${chapterMatch[1]}.${chapterMatch[2]}`;
  }
  
  // Remove any remaining spaces
  return normalized.replace(/\s+/g, '');
}

