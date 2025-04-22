
/**
 * Utilities for processing text and extracting terms
 */

/**
 * Extract key terms from text by splitting into words and filtering
 */
export function extractKeyTerms(text: string): string[] {
  // Split text into words and filter out short words and common stop words
  const stopWords = ['the', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of'];
  
  return text
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    // Include regulatory specific terms like rule numbers
    .concat(text.match(/\d+\.\d+[A-Z]?/g) || [])
    // Include chapter numbers
    .concat(text.match(/chapter\s+\d+/gi) || []);
}

/**
 * Count how many terms from the query match the keywords
 */
export function countMatches(keywords: string[], queryTerms: string[]): number {
  let count = 0;
  
  for (const term of queryTerms) {
    if (keywords.some(keyword => keyword.includes(term))) {
      count++;
    }
  }
  
  return count;
}

