
import { RegulatoryEntry } from '../types';
import { databaseService } from '../databaseService';

/**
 * Basic search functionality for the regulatory database
 */
export const basicSearch = {
  /**
   * Search the regulatory database
   */
  search: async (query: string, category?: string): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for "${query}" in category: ${category || 'all'}`);
    
    // Get all entries
    const allEntries = databaseService.getAllEntries();
    
    // Convert query to lowercase for case-insensitive matching
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    // Check if query is related to FAQs or continuing obligations
    const isFaqQuery = query.toLowerCase().includes('faq') || query.toLowerCase().includes('continuing obligation');
    
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
    
    // Prioritize FAQ content if the query seems related to FAQs
    if (isFaqQuery) {
      return results.sort((a, b) => {
        // Prioritize entries with "FAQ" or "Continuing Obligations" in the title
        const aHasFaqTitle = a.title.toLowerCase().includes('faq') || 
                             a.title.toLowerCase().includes('continuing obligation');
        const bHasFaqTitle = b.title.toLowerCase().includes('faq') || 
                             b.title.toLowerCase().includes('continuing obligation');
        
        if (aHasFaqTitle && !bHasFaqTitle) return -1;
        if (!aHasFaqTitle && bHasFaqTitle) return 1;
        
        // If both or neither have FAQ in title, prioritize by content relevance
        return 0;
      });
    }
    
    return results;
  },
  
  /**
   * Search the regulatory database specifically by title
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
  },
  
  /**
   * Get regulatory entries by their source IDs
   */
  getEntriesBySourceIds: async (sourceIds: string[]): Promise<RegulatoryEntry[]> => {
    console.log(`Retrieving ${sourceIds.length} entries by source IDs`);
    
    // Get all entries
    const allEntries = databaseService.getAllEntries();
    
    // Filter entries by source IDs
    const results = allEntries.filter(entry => sourceIds.includes(entry.id));
    
    console.log(`Retrieved ${results.length} entries from database`);
    return results;
  }
};
