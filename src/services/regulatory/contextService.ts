
/**
 * Service for handling regulatory context operations
 */
import { databaseService } from '../databaseService';
import { formatRegulatoryEntriesAsContext } from '../contextUtils';

export const contextService = {
  /**
   * Fetch relevant regulatory information for context
   */
  getRegulatoryContext: async (query: string): Promise<string> => {
    try {
      // Search the database for relevant entries
      const relevantEntries = await databaseService.search(query);
      
      if (relevantEntries.length === 0) {
        return "No specific regulatory information found in database.";
      }
      
      // Format the entries as context
      return formatRegulatoryEntriesAsContext(relevantEntries);
    } catch (error) {
      console.error("Error fetching regulatory context:", error);
      return "Error fetching regulatory context.";
    }
  }
};
