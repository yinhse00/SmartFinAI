
/**
 * Generate reasoning for why specific context was selected
 */
export function generateContextReasoning(results: any[], query: string, financialTerms: string[]): string {
  if (results.length === 0) {
    return 'No relevant Hong Kong financial regulatory information found for this query.';
  }
  
  // If we have results but they might be limited
  if (results.length < 2 && (query.toLowerCase().includes('rights issue') && query.toLowerCase().includes('timetable'))) {
    return 'Limited specific regulatory information found. Providing general rights issue timetable guidance based on Hong Kong Listing Rules Chapter 10.';
  }
  
  // Special case for whitewash waivers
  if (query.toLowerCase().includes('whitewash')) {
    if (results.some(result => result.content.toLowerCase().includes('dealing') && result.content.toLowerCase().includes('whitewash'))) {
      return 'Found relevant Takeovers Code provisions including specific dealing requirements for whitewash waivers under Note 1 to Rule 32.';
    }
  }
  
  const categoryCount: Record<string, number> = {};
  results.forEach(result => {
    categoryCount[result.category] = (categoryCount[result.category] || 0) + 1;
  });
  
  const mainCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);
  
  // Check if we have the takeovers code document
  const hasTakeoversCode = results.some(result => 
    result.title.toLowerCase().includes('codes on takeovers and mergers') || 
    result.title.toLowerCase().includes('takeovers code')
  );
  
  let matchedTerms = financialTerms.length ? 
    `financial terms (${financialTerms.join(', ')})` : 
    'general financial context';
    
  if (hasTakeoversCode) {
    matchedTerms = 'Codes on Takeovers and Mergers and Share Buy-backs and ' + matchedTerms;
  }
  
  return `Found ${results.length} relevant Hong Kong financial document(s) matching ${matchedTerms}. Primary sources include ${mainCategories.join(', ')} regulations.`;
}
