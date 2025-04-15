
/**
 * Service for searching the regulatory database
 */

import { RegulatoryEntry } from "./types";
import { databaseService } from "./databaseService";

export const searchService = {
  /**
   * Search the regulatory database
   */
  search: async (query: string, category?: string): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for "${query}" in category: ${category || 'all'}`);
    
    // Get all entries
    const allEntries = databaseService.getAllEntries();
    
    // Convert query to lowercase for case-insensitive matching
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    // Filter by search term and optional category
    const results = allEntries.filter(entry => {
      // Check if any of the query terms match the title or content
      const titleLower = entry.title.toLowerCase();
      const contentLower = entry.content.toLowerCase();
      
      const matchesByTerm = queryTerms.some(term => 
        titleLower.includes(term) || contentLower.includes(term)
      );
      
      // Also check for the whole phrase match for more precise queries
      const matchesWholePhrase = 
        titleLower.includes(query.toLowerCase()) || 
        contentLower.includes(query.toLowerCase());
        
      // If neither matches, return false
      if (!matchesByTerm && !matchesWholePhrase) {
        return false;
      }
      
      // If category is specified, filter by it
      if (category && entry.category !== category) {
        return false;
      }
      
      return true;
    });
    
    return results;
  },
  
  /**
   * Search the regulatory database specifically by title
   * This is particularly useful for finding specific documents like Trading Arrangements
   */
  searchByTitle: async (titleQuery: string): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for documents with title containing "${titleQuery}"`);
    
    // Get all entries
    const allEntries = databaseService.getAllEntries();
    
    // Convert query to lowercase for case-insensitive matching
    const lowerTitleQuery = titleQuery.toLowerCase();
    
    // Find entries with matching title
    const results = allEntries.filter(entry => {
      const titleLower = entry.title.toLowerCase();
      return titleLower.includes(lowerTitleQuery);
    });
    
    console.log(`Found ${results.length} documents with matching title`);
    return results;
  }
};
