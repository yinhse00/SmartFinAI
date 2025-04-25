
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
  
  // Enhanced rule number pattern matching
  const rulePatterns = [
    // Standard rule numbers (e.g., 14.44)
    /\d+\.\d+[A-Z]?/g,
    // Chapter-specific rules (e.g., 14A.44)
    /\d+[A-Z]\.\d+[A-Z]?/g,
    // Rules with subsections (e.g., 14.44(1))
    /\d+\.\d+[A-Z]?\(\d+\)/g,
    // Chapter-specific rules with subsections (e.g., 14A.44(1))
    /\d+[A-Z]\.\d+[A-Z]?\(\d+\)/g,
    // Chapter numbers
    /chapter\s+\d+[A-Z]?/gi
  ];
  
  // Extract all rule numbers using the enhanced patterns
  const ruleNumbers = rulePatterns.flatMap(pattern => 
    text.match(pattern) || []
  );
  
  // Combine terms with extracted rule numbers
  return [...terms, ...ruleNumbers];
}

/**
 * Count how many terms from the query match the keywords
 */
export function countMatches(keywords: string[], queryTerms: string[]): number {
  let count = 0;
  
  for (const term of queryTerms) {
    // Enhanced matching for rule numbers to consider chapter context
    const termLower = term.toLowerCase();
    const isRuleMatch = keywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      // Exact match
      if (keywordLower.includes(termLower)) {
        return true;
      }
      // Rule number match considering chapter context
      if (termLower.match(/\d+[A-Z]?\.\d+/) && keywordLower.match(/\d+[A-Z]?\.\d+/)) {
        const normalizedTerm = termLower.replace(/rule\s+/i, '');
        const normalizedKeyword = keywordLower.replace(/rule\s+/i, '');
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
