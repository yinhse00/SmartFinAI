
import { searchService } from '../../databaseService';
import { extractFinancialTerms } from '../utils/financialTermsExtractor';
import { contextFormatter } from './contextFormatter';
import { enhancedContextService } from './enhancedContextService';

/**
 * Specialized service for comprehensive database searches
 */
export const comprehensiveContextService = {
  /**
   * Comprehensive database search that ensures all relevant sources are consulted
   * This is the primary method for ensuring thorough database verification before answering
   */
  getComprehensiveRegulatoryContext: async (query: string) => {
    try {
      console.group('Performing Comprehensive Database Review');
      console.log('Original Query:', query);
      
      // Use enhancedContextService instead of dynamically importing contextService
      const initialContext = await enhancedContextService.getRegulatoryContextWithReasoning(query);
      
      // Log the initial results
      console.log('Initial context search complete');
      console.log('Context found:', initialContext.context ? 'Yes' : 'No');
      console.log('Reasoning:', initialContext.reasoning);
      
      // Check if we need to search more broadly
      if (!initialContext.context || initialContext.context.length < 100) {
        console.log('Initial search yielded limited results, expanding search scope');
        
        // Extract core concepts for broader search
        const terms = extractFinancialTerms(query);
        const broadQuery = terms.length > 0 ? terms.join(' ') : query;
        
        // Search across all categories
        console.log('Searching across all database categories');
        const { databaseEntries, referenceDocuments } = await searchService.searchComprehensive(broadQuery);
        
        if (databaseEntries.length > 0 || referenceDocuments.length > 0) {
          console.log(`Found ${databaseEntries.length} database entries and ${referenceDocuments.length} reference documents in expanded search`);
          
          // Format the additional results
          const additionalContext = contextFormatter.formatEntriesToContext(databaseEntries);
          const additionalReasoning = `Expanded database search found ${databaseEntries.length} entries and ${referenceDocuments.length} reference documents that may be relevant.`;
          
          // Combine with initial context if it exists
          if (initialContext.context) {
            return {
              context: initialContext.context + "\n\n--- ADDITIONAL CONTEXT ---\n\n" + additionalContext,
              reasoning: initialContext.reasoning + " " + additionalReasoning
            };
          } else {
            return {
              context: additionalContext,
              reasoning: additionalReasoning
            };
          }
        }
      }
      
      console.groupEnd();
      return initialContext;
    } catch (error) {
      console.error('Error in comprehensive regulatory context search:', error);
      console.groupEnd();
      return {
        context: 'Error performing comprehensive database search',
        reasoning: 'System was unable to thoroughly search the database due to an unexpected error.'
      };
    }
  }
};
