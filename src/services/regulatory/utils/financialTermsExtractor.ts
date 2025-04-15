
/**
 * Extract financial and regulatory terms from a query
 */
export function extractFinancialTerms(query: string): string[] {
  const financialTerms = [
    'listing rules', 'rights issue', 'right issue', 'takeovers code', 'connected transaction',
    'mandatory offer', 'disclosure', 'prospectus', 'SFC', 'HKEX', 'offering',
    'waiver', 'circular', 'public float', 'placing', 'subscription', 'underwriting',
    'timetable', 'schedule', 'timeline', 'whitewash', 'share buy back', 'dealing requirements'
  ];
  
  const lowerQuery = query.toLowerCase();
  
  // First check for direct matches
  const foundTerms = financialTerms.filter(term => 
    lowerQuery.includes(term.toLowerCase())
  );
  
  // If no direct matches found but contains date references, add rights issue timetable
  if ((foundTerms.length === 0 || !foundTerms.some(term => term.includes('timetable'))) && 
    (lowerQuery.includes('date') || 
     lowerQuery.includes('june') ||
     lowerQuery.includes('jan') ||
     lowerQuery.includes('feb') ||
     lowerQuery.includes('mar') ||
     lowerQuery.includes('apr') ||
     lowerQuery.includes('may') ||
     lowerQuery.includes('jun') ||
     lowerQuery.includes('jul') ||
     lowerQuery.includes('aug') ||
     lowerQuery.includes('sep') ||
     lowerQuery.includes('oct') ||
     lowerQuery.includes('nov') ||
     lowerQuery.includes('dec') ||
     lowerQuery.match(/\d+\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i) ||
     lowerQuery.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/))) {
    
    // Add timetable terms if they're missing but query has dates
    if (lowerQuery.includes('rights') || lowerQuery.includes('right')) {
      return [...foundTerms, 'timetable', 'rights issue'].filter((v, i, a) => a.indexOf(v) === i);
    }
    return [...foundTerms, 'timetable'].filter((v, i, a) => a.indexOf(v) === i);
  }
  
  return foundTerms.length > 0 ? foundTerms : [query];
}
