/**
 * Determine optimal temperature setting based on query type and content
 */
export function determineOptimalTemperature(queryType: string, prompt: string): number {
  // For factual regulatory matters, use lower temperature
  if (queryType === 'rights_issue' && prompt.toLowerCase().includes('timetable')) {
    return 0.05; // Even more precise for timetables (reduced from 0.1)
  }
  
  if (['listing_rules', 'takeovers_code'].includes(queryType)) {
    return 0.2; // Precise for rule interpretations
  }
  
  if (prompt.toLowerCase().includes('example') || prompt.toLowerCase().includes('template')) {
    return 0.4; // Slightly higher for examples but still controlled
  }
  
  // Default for general inquiries
  return 0.3;
}

/**
 * Determine optimal token limit based on query complexity
 */
export function determineOptimalTokens(queryType: string, prompt: string): number {
  if (queryType === 'rights_issue' && prompt.toLowerCase().includes('timetable')) {
    return 100000; // Increased to 100,000 tokens for detailed timetables
  }
  
  if (prompt.toLowerCase().includes('explain') || prompt.toLowerCase().includes('detail')) {
    return 5000; // Increased from 2,000 to 5,000 for explanations
  }
  
  // Default token count
  return 3000; // Increased from 1,500 to 3,000
}

/**
 * Evaluate relevance of response to the original query
 */
export function evaluateResponseRelevance(response: string, query: string, queryType: string): number {
  let score = 0;
  
  // Check for specific rule citations
  if (/Rule \d+\.\d+|\[Chapter \d+\]|section \d+/i.test(response)) {
    score += 3;
  }
  
  // Check for HK-specific regulatory entities
  if (/HKEX|SFC|Hong Kong Stock Exchange|Securities and Futures Commission/i.test(response)) {
    score += 2;
  }
  
  // Check for professional financial terminology
  const financialTerms = [
    'listing rules', 'takeovers code', 'SFO', 'circular', 'disclosure',
    'connected transaction', 'inside information', 'prospectus'
  ];
  
  financialTerms.forEach(term => {
    if (response.toLowerCase().includes(term)) {
      score += 1;
    }
  });
  
  // Normalize to 0-10 scale
  return Math.min(10, score);
}
