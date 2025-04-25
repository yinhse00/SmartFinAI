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
  
  // Enhanced rule patterns with strict validation
  const rulePatterns = [
    // Standard rule numbers (e.g., 14.44)
    /(?:rule\s+)?(\d+\.\d+[A-Z]?\(\d+\)?)/gi,
    // Chapter-specific rules (e.g., 14A.44)
    /(?:rule\s+)?(\d+[A-Z]\.\d+[A-Z]?\(\d+\)?)/gi,
    // Chapter references
    /chapter\s+(\d+[A-Z]?)/gi,
    // Rules with chapter context
    /chapter\s+(\d+[A-Z]?)\s+rule\s+(\d+)/gi
  ];
  
  // Extract all rule numbers preserving chapter context
  const ruleNumbers = rulePatterns.flatMap(pattern => {
    const matches = Array.from(text.matchAll(pattern));
    return matches.map(match => {
      const fullMatch = match[0].toLowerCase();
      // Add validation to ensure proper rule format
      if (!isValidRuleFormat(fullMatch)) {
        console.warn(`Invalid rule format detected: ${fullMatch}`);
        return null;
      }
      return fullMatch;
    }).filter(Boolean); // Remove null values
  });
  
  return [...terms, ...ruleNumbers];
}

/**
 * Validate rule number format
 */
function isValidRuleFormat(rule: string): boolean {
  // Basic format validation
  const basicFormat = /^(?:rule\s+)?\d+[A-Z]?\.\d+(?:\(\d+\))?$/i;
  const chapterFormat = /^chapter\s+\d+[A-Z]?\s+rule\s+\d+$/i;
  
  return basicFormat.test(rule) || chapterFormat.test(rule);
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
    // Convert "Chapter 14A rule 44" to "14A.44" with validation
    const chapterNum = chapterMatch[1];
    const ruleNum = chapterMatch[2];
    if (isValidChapterNumber(chapterNum) && isValidRuleNumber(ruleNum)) {
      normalized = `${chapterNum}.${ruleNum}`;
    } else {
      console.warn(`Invalid chapter/rule combination: Chapter ${chapterNum} Rule ${ruleNum}`);
      return text; // Return original if invalid
    }
  }
  
  return normalized.replace(/\s+/g, '');
}

/**
 * Validate chapter number format
 */
function isValidChapterNumber(chapter: string): boolean {
  return /^\d+[A-Z]?$/.test(chapter);
}

/**
 * Validate rule number format
 */
function isValidRuleNumber(rule: string): boolean {
  return /^\d+(?:\.\d+)?(?:\(\d+\))?$/.test(rule);
}
