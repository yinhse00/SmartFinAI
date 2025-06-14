/**
 * Service for searching the regulatory database
 */

import { RegulatoryEntry } from "./types";
import { databaseService } from "./databaseService";
import { supabase } from '@/integrations/supabase/client';

export const searchService = {
  /**
   * Search the regulatory database
   */
  search: async (query: string, category?: string): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for "${query}" in category: ${category || 'all'}`);
    
    // Convert query to lowercase for case-insensitive matching
    const queryLower = query.toLowerCase();
    
    // Prepare the Supabase query - simplified without problematic relationships
    let supabaseQuery = supabase
      .from('regulatory_provisions')
      .select('id, rule_number, title, content, chapter, section, last_updated, is_current');
    
    // Add search condition
    const { data, error } = await supabaseQuery;
    
    if (error) {
      console.error('Error searching regulatory provisions:', error);
      return [];
    }
    
    // Filter results client-side
    const filteredData = data.filter(item => {
      return (
        item.title.toLowerCase().includes(queryLower) ||
        item.content.toLowerCase().includes(queryLower) ||
        item.rule_number.toLowerCase().includes(queryLower)
      );
    });
    
    // Map the Supabase data structure to our RegulatoryEntry type
    return filteredData.map(item => {
      // Determine category based on chapter or rule number
      let mappedCategory: RegulatoryEntry['category'] = 'other';
      if (item.chapter?.includes('14') || item.chapter?.includes('13')) {
        mappedCategory = 'listing_rules';
      } else if (item.rule_number?.includes('TO')) {
        mappedCategory = 'takeovers';
      }
      
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        category: mappedCategory,
        source: item.chapter ? `${item.chapter} ${item.section || ''}` : 'Unknown',
        section: item.section || undefined,
        lastUpdated: new Date(item.last_updated),
        status: item.is_current ? 'active' : 'archived'
      };
    });
  },
  
  /**
   * Search the regulatory database specifically by title
   * This is particularly useful for finding specific documents like Trading Arrangements
   */
  searchByTitle: async (titleQuery: string): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for documents with title containing "${titleQuery}"`);
    
    // Get all entries
    const allEntries = await databaseService.getAllEntries();
    
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
   * Used by the sequential search process
   */
  getEntriesBySourceIds: async (sourceIds: string[]): Promise<RegulatoryEntry[]> => {
    console.log(`Retrieving ${sourceIds.length} entries by source IDs`);
    
    // Get all entries
    const allEntries = await databaseService.getAllEntries();
    
    // Filter entries by source IDs
    const results = allEntries.filter(entry => sourceIds.includes(entry.id));
    
    console.log(`Retrieved ${results.length} entries from database`);
    return results;
  },

  /**
   * Search both in-memory database and reference documents
   * @param query The search query
   * @param category Optional category to filter results
   * @returns Combined results with database entries first (prioritized)
   */
  searchComprehensive: async (query: string, category?: string): Promise<{
    databaseEntries: RegulatoryEntry[],
    referenceDocuments: []
  }> => {
    // Search for entries in the regulatory database
    const databaseEntries = await searchService.search(query, category);
    
    console.log(`Found ${databaseEntries.length} database entries. Reference document search is disabled.`);
    
    return {
      databaseEntries,
      referenceDocuments: []
    };
  }
};
