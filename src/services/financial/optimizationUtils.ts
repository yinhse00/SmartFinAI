/**
 * Determine optimal temperature setting based on query type and content
 */
export function determineOptimalTemperature(queryType: string, prompt: string): number {
  // For factual regulatory matters, use lower temperature
  if (queryType === 'rights_issue' && prompt.toLowerCase().includes('timetable')) {
    return 0.01; // Keep very precise setting for timetables
  }
  
  if (['listing_rules', 'takeovers_code'].includes(queryType)) {
    return 0.15; // Further reduced from 0.2 to 0.15 for rule interpretations
  }
  
  if (prompt.toLowerCase().includes('example') || prompt.toLowerCase().includes('template')) {
    return 0.3; // Reduced from 0.4 to 0.3 for more consistent examples
  }
  
  // Default for general inquiries
  return 0.2; // Reduced from 0.3 to 0.2
}

/**
 * Determine optimal token limit based on query complexity
 */
export function determineOptimalTokens(queryType: string, prompt: string): number {
  if (queryType === 'rights_issue' && prompt.toLowerCase().includes('timetable')) {
    return 1000000; // Doubled from 500,000 to 1,000,000 tokens for detailed timetables
  }
  
  if (prompt.toLowerCase().includes('explain') || prompt.toLowerCase().includes('detail')) {
    return 100000; // Doubled from 50,000 to 100,000 for explanations
  }
  
  // Default token count
  return 60000; // Doubled from 30,000 to 60,000
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
