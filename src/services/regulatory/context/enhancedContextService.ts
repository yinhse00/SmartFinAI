
import { contextSearchOrchestrator } from './contextSearchOrchestrator';
import { faqSearchService } from './faqSearchService';

/**
 * Specialized service for enhanced regulatory context with reasoning
 */
export const enhancedContextService = {
  /**
   * Enhanced regulatory context retrieval with specialized financial semantic search
   * This is used by the comprehensive context service
   */
  getRegulatoryContextWithReasoning: async (query: string) => {
    try {
      console.group('Retrieving Specialized Financial Context');
      console.log('Original Query:', query);
      
      // Check if this might be FAQ related
      const isFaqQuery = query.toLowerCase().includes('faq') || 
                         query.toLowerCase().includes('continuing obligation') ||
                         Boolean(query.match(/\b10\.4\b/));
                         
      if (isFaqQuery) {
        console.log('Detected FAQ/continuing obligations query, prioritizing relevant documents');
        // Try to get FAQ context first for better performance
        const faqResponse = await faqSearchService.getFaqContext(query);
        
        // If FAQ context was found, return it immediately
        if (faqResponse.context) {
          console.groupEnd();
          return faqResponse;
        }
      }
      
      // For all other queries, use the comprehensive search orchestrator
      const result = await contextSearchOrchestrator.executeComprehensiveSearch(query);
      
      console.groupEnd();
      return result;
    } catch (error) {
      console.error('Error retrieving specialized financial context:', error);
      console.groupEnd();
      return {
        context: 'Error fetching financial regulatory context',
        reasoning: 'Unable to search specialized financial database due to an unexpected error.'
      };
    }
  }
};
