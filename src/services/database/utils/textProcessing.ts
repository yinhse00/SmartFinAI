
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

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  // Initialize the matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 1; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[a.length][b.length];
}

/**
 * Calculate similarity score between two strings (0-1 where 1 is exact match)
 */
export function calculateSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1; // Exact match
  
  const distance = calculateLevenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Check if a string contains a fuzzy match to any of the search terms
 */
export function hasFuzzyMatch(text: string, searchTerms: string[], threshold = 0.8): boolean {
  if (!text || !searchTerms.length) return false;
  const textLower = text.toLowerCase();
  
  // First check for exact substrings (faster)
  if (searchTerms.some(term => textLower.includes(term.toLowerCase()))) {
    return true;
  }
  
  // Split text into words for word-level fuzzy matching
  const words = textLower.split(/\s+/);
  
  // Check each search term against each word
  return searchTerms.some(term => {
    const termLower = term.toLowerCase();
    return words.some(word => {
      // Skip very short words to avoid false positives
      if (word.length < 3) return false;
      
      // Calculate similarity
      const similarity = calculateSimilarity(word, termLower);
      return similarity >= threshold;
    });
  });
}

/**
 * Calculate relevance score for search results
 */
export function calculateRelevanceScore(text: string, title: string, searchTerms: string[]): number {
  if (!text || !searchTerms.length) return 0;
  
  let score = 0;
  const textLower = text.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Process search terms
  for (const term of searchTerms) {
    const termLower = term.toLowerCase();
    
    // Exact matches in title are highly valuable
    if (titleLower.includes(termLower)) {
      score += 10;
      
      // Exact title match is even more valuable
      if (titleLower === termLower) {
        score += 50;
      }
      
      // Title starting with the term is also valuable
      if (titleLower.startsWith(termLower)) {
        score += 5;
      }
    }
    
    // Exact matches in content
    if (textLower.includes(termLower)) {
      score += 5;
      
      // Count occurrences in content
      const occurrences = (textLower.match(new RegExp(termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      score += Math.min(occurrences, 10); // Cap at 10 to avoid over-weighting
    }
    
    // Fuzzy matches in title
    if (!titleLower.includes(termLower) && hasFuzzyMatch(titleLower, [termLower], 0.85)) {
      score += 3;
    }
    
    // Fuzzy matches in content
    if (!textLower.includes(termLower) && hasFuzzyMatch(textLower, [termLower], 0.85)) {
      score += 1;
    }
  }
  
  // Bonus for shorter documents (more focused)
  const lengthPenalty = Math.log(text.length) / 10;
  score -= lengthPenalty;
  
  // Ensure score doesn't go negative due to length penalty
  return Math.max(0, score);
}
