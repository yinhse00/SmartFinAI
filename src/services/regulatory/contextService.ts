
import { contextServiceCore } from './context/contextServiceCore';
import { comprehensiveContextService } from './context/comprehensiveContextService';
import { enhancedContextService } from './context/enhancedContextService';
import { validationContextService } from './context/validationContextService';

/**
 * Financial regulatory context service - specialized for Hong Kong corporate finance
 */
export const contextService = {
  /**
   * Comprehensive database search that ensures all relevant sources are consulted
   * This is the primary method for ensuring thorough database verification before answering
   */
  getComprehensiveRegulatoryContext: comprehensiveContextService.getComprehensiveRegulatoryContext,

  /**
   * Enhanced regulatory context retrieval with specialized financial semantic search
   */
  getRegulatoryContextWithReasoning: enhancedContextService.getRegulatoryContextWithReasoning,

  /**
   * Get regulatory context for a given financial query (simplified version)
   */
  getRegulatoryContext: contextServiceCore.getRegulatoryContext,

  /**
   * Get specialized context for definition queries
   */
  getDefinitionContext: async (query: string) => {
    console.log('Retrieving specialized definition context for:', query);
    
    // Extract the term being defined
    const termMatch = query.match(/what\s+is\s+([^?]+)/i) || 
                     query.match(/definition\s+of\s+([^?]+)/i);
                     
    const term = termMatch ? termMatch[1].trim() : query;
    
    try {
      // Search for the term in multiple regulatory sources
      const sources = ['listing_rules', 'guidance', 'takeovers'];
      let combinedContext = '';
      
      for (const source of sources) {
        const sourceContext = await contextServiceCore.getSourceSpecificContext(term, source);
        if (sourceContext) {
          combinedContext += `\n\n--- FROM ${source.toUpperCase()} ---\n\n${sourceContext}`;
        }
      }
      
      if (combinedContext) {
        return {
          context: combinedContext,
          reasoning: `Comprehensive definition search across multiple regulatory sources for term "${term}"`
        };
      }
      
      // Fall back to standard context retrieval
      return enhancedContextService.getRegulatoryContextWithReasoning(query);
    } catch (error) {
      console.error('Error retrieving definition context:', error);
      return {
        context: '',
        reasoning: 'Error in definition search'
      };
    }
  },
  
  /**
   * Get validation context for cross-checking response accuracy
   * This provides additional context from alternative sources to validate answers
   */
  getValidationContext: async (query: string) => {
    return validationContextService.getValidationContext(query);
  }
};
