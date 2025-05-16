/**
 * Determine optimal temperature setting based on query type and content
 */
import { tokenManagementService } from '../response/modules/tokenManagementService';

export function determineOptimalTemperature(queryType: string, prompt: string): number {
  return tokenManagementService.getTemperature({ queryType, prompt });
}

/**
 * Determine optimal token limit based on query complexity
 * Production-safe implementation with conservative limits
 */
export function determineOptimalTokens(queryType: string, prompt: string): number {
  return tokenManagementService.getTokenLimit({ queryType, prompt });
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
      (response.includes('---') || response.includes('FAQ') || 
       response.includes('Source:') || response.includes('Reference:'))) {
    score += 5; // Strongly favor responses that appear to quote database content
  }
  
  // Normalize to 0-10 scale
  return Math.min(10, score);
}
