
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
      console.log(`Searching for "${query}" in category: all`);
      
      // First search the database for relevant entries
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
  },
  
  /**
   * Enhanced version that shows reasoning steps
   */
  getRegulatoryContextWithReasoning: async (query: string): Promise<{context: string, reasoning: string}> => {
    try {
      console.log(`Searching for "${query}" in category: all`);
      
      const reasoning = ["Searching regulatory database for relevant information..."];
      
      // Search the database for relevant entries
      const relevantEntries = await databaseService.search(query);
      
      if (relevantEntries.length === 0) {
        reasoning.push("No specific regulatory information found in database.");
        return {
          context: "No specific regulatory information found in database.",
          reasoning: reasoning.join("\n")
        };
      }
      
      reasoning.push(`Found ${relevantEntries.length} relevant regulatory entries.`);
      
      // Add info about each entry found
      relevantEntries.forEach(entry => {
        reasoning.push(`- Found relevant information in: ${entry.title} (${entry.category})`);
      });
      
      // Format the entries as context
      const context = formatRegulatoryEntriesAsContext(relevantEntries);
      
      return {
        context,
        reasoning: reasoning.join("\n")
      };
    } catch (error) {
      console.error("Error fetching regulatory context:", error);
      return {
        context: "Error fetching regulatory context.",
        reasoning: "Error occurred while searching regulatory database."
      };
    }
  }
};
