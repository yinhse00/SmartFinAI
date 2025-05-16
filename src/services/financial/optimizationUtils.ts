
/**
 * Determine optimal temperature setting based on query type and content
 */
import { tokenManagementService } from '../response/modules/tokenManagementService';

export function determineOptimalTemperature(queryType: string, prompt: string): number {
  // Use enhanced balanced temperature settings
  if (queryType === 'rights_issue' || queryType === 'connected_transaction') {
    return 0.3; // Lower for precise regulatory content
  }
  
  if (prompt.toLowerCase().includes('compare') || prompt.toLowerCase().includes('difference')) {
    return 0.4; // Balanced for comparisons
  }
  
  if (prompt.toLowerCase().includes('explain') || prompt.toLowerCase().includes('what is')) {
    return 0.5; // Medium for explanations
  }
  
  // Check for simple questions
  if (prompt.length < 100 && !prompt.includes('?')) {
    return 0.7; // Higher for simple, conversational queries
  }
  
  // Default to a balanced temperature
  return 0.5;
}

/**
 * Determine optimal token limit based on query complexity
 * Production implementation with comprehensive limits
 */
export function determineOptimalTokens(queryType: string, prompt: string): number {
  // Use tokenManagementService for consistency
  return tokenManagementService.getTokenLimit({ 
    queryType, 
    prompt,
    isComplexQuery: prompt.toLowerCase().includes('timetable') || prompt.length > 150
  });
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
  
  // Check if response appears to directly quote database content
  if (response.includes('[') && response.includes(']') && 
      (response.includes('Source:') || response.includes('Reference:'))) {
    score += 5; // Strongly favor responses that appear to quote database content
  }
  
  // Enhance score for comprehensive, well-formatted responses
  // Favor paragraphing and formatting over section markers
  if (response.includes('<p>') || (response.split('\n\n').length > 3)) {
    score += 2; // Good paragraph structure
  }
  
  if (response.includes('<strong>') || response.includes('<b>') || 
      response.includes('**') || response.includes('<em>')) {
    score += 2; // Good text formatting
  }
  
  if (response.includes('<ul>') || response.includes('<li>') || 
      (response.match(/[\n•\-\*]/g)?.length || 0) > 5) {
    score += 2; // Good list formatting
  }
  
  // Normalize to 0-10 scale
  return Math.min(10, score);
}
