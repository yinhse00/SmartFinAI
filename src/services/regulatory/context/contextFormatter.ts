
import { generateContextReasoning } from '../utils/contextReasoningGenerator';

/**
 * Module for formatting and preparing context
 */
export const contextFormatter = {
  /**
   * Format regulatory entries as context with proper section headings
   */
  formatEntriesToContext: (entries: any[]) => {
    return entries
      .map(entry => `[${entry.title} | ${entry.source}]:\n${entry.content}`)
      .join('\n\n---\n\n');
  },
  
  /**
   * Generate reasoning for why specific context was selected
   */
  generateReasoning: (results: any[], query: string, financialTerms: string[]) => {
    return generateContextReasoning(results, query, financialTerms);
  },
  
  /**
   * Create final response object with context and reasoning
   */
  createContextResponse: (context: string, reasoning: string) => {
    return {
      context: context || 'No specific Hong Kong financial regulatory information found.',
      reasoning: reasoning
    };
  }
};
