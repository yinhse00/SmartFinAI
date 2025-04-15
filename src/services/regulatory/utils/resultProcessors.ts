
/**
 * Remove duplicate search results
 */
export function removeDuplicateResults(results: any[]): any[] {
  const uniqueIds = new Set();
  return results.filter(result => {
    // Create a simple ID from title and source
    const resultId = `${result.title}|${result.source}`;
    if (uniqueIds.has(resultId)) {
      return false;
    }
    uniqueIds.add(resultId);
    return true;
  });
}

/**
 * Prioritize search results based on relevance to financial terms
 */
export function prioritizeByRelevance(results: any[], financialTerms: string[]): any[] {
  return results.sort((a, b) => {
    const aRelevance = calculateRelevance(a, financialTerms);
    const bRelevance = calculateRelevance(b, financialTerms);
    return bRelevance - aRelevance;
  });
}

/**
 * Calculate relevance score of a result to financial terms
 */
export function calculateRelevance(result: any, financialTerms: string[]): number {
  let score = 0;
  
  // Score based on matches in title and content
  financialTerms.forEach(term => {
    if (result.title.toLowerCase().includes(term.toLowerCase())) score += 3;
    if (result.content.toLowerCase().includes(term.toLowerCase())) score += 1;
  });
  
  // Special handling for timetable searches
  if (financialTerms.some(term => term.includes('timetable') || term.includes('schedule'))) {
    if (result.title.toLowerCase().includes('timetable')) score += 5;
    if (result.content.toLowerCase().includes('timetable')) score += 2;
  }
  
  // Bonus for listing rules and regulatory categories
  if (result.category === 'listing_rules') score += 2;
  if (result.category === 'takeovers') score += 2;
  
  return score;
}
