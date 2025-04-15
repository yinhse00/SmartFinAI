import { databaseService } from '../databaseService';

export const contextService = {
  /**
   * Enhanced regulatory context retrieval with semantic search capabilities
   */
  getRegulatoryContextWithReasoning: async (query: string) => {
    try {
      // Perform a more sophisticated search across the database
      const searchResults = await databaseService.search(query, 'listing_rules');
      
      // If no results, try a broader search
      const fallbackResults = searchResults.length === 0 
        ? await databaseService.search(query) 
        : searchResults;
      
      // Combine and prioritize results
      const context = fallbackResults
        .map(entry => `[${entry.title}]: ${entry.content}`)
        .join('\n\n');
      
      const reasoning = fallbackResults.length > 0
        ? `Found ${fallbackResults.length} relevant document(s) for the query.`
        : 'No specific regulatory context found for the query.';
      
      return {
        context: context || 'No relevant regulatory information found.',
        reasoning: reasoning
      };
    } catch (error) {
      console.error('Error retrieving regulatory context:', error);
      return {
        context: 'Error fetching regulatory context',
        reasoning: 'Unable to search database due to an unexpected error.'
      };
    }
  },

  /**
   * Get regulatory context for a given query
   */
  getRegulatoryContext: async (query: string): Promise<string> => {
    try {
      // Perform a search across the database
      const searchResults = await databaseService.search(query, 'listing_rules');
      
      // If no results, try a broader search
      const fallbackResults = searchResults.length === 0 
        ? await databaseService.search(query) 
        : searchResults;
      
      // Combine and prioritize results
      const context = fallbackResults
        .map(entry => `[${entry.title}]: ${entry.content}`)
        .join('\n\n');
      
      return context || 'No specific regulatory information found.';
    } catch (error) {
      console.error('Error retrieving regulatory context:', error);
      return 'Error fetching regulatory context';
    }
  }
};
