/**
 * Service for searching the regulatory database
 */

import { RegulatoryEntry } from "./types";
import { databaseService } from "./databaseService";
import { supabase } from '@/integrations/supabase/client';

export const searchService = {
  /**
   * Search the regulatory database using search_index as central hub
   */
  search: async (query: string, category?: string): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for "${query}" in category: ${category || 'all'}`);
    
    try {
      // Step 1: Search search_index table for matching content
      let searchQuery = supabase
        .from('search_index')
        .select('*');
      
      // Add text search on particulars
      if (query.trim()) {
        searchQuery = searchQuery.ilike('particulars', `%${query}%`);
      }
      
      // Add category filter if specified
      if (category) {
        searchQuery = searchQuery.eq('category', category);
      }
      
      const { data: searchResults, error: searchError } = await searchQuery.limit(50);
      
      if (searchError) {
        console.error('Error searching search_index:', searchError);
        return [];
      }
      
      if (!searchResults || searchResults.length === 0) {
        return [];
      }
      
      // Step 2: Group results by tableindex and fetch detailed data
      const tableGroups = searchResults.reduce((groups, result) => {
        const table = result.tableindex;
        if (table) {
          if (!groups[table]) groups[table] = [];
          groups[table].push(result);
        }
        return groups;
      }, {} as Record<string, any[]>);
      
      // Step 3: Fetch detailed data from source tables and map to RegulatoryEntry
      const allEntries: RegulatoryEntry[] = [];
      
      for (const [tableName, indexResults] of Object.entries(tableGroups)) {
        const detailedEntries = await searchService.fetchDetailedDataFromTable(tableName, indexResults);
        allEntries.push(...detailedEntries);
      }
      
      return allEntries;
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  },

  /**
   * Fetch detailed data from specific table and map to RegulatoryEntry interface
   */
  fetchDetailedDataFromTable: async (tableName: string, indexResults: any[]): Promise<RegulatoryEntry[]> => {
    try {
      // Use particulars from search_index as fallback for detailed content
      return indexResults.map(indexResult => {
        // Map common fields based on table type
        let entry: RegulatoryEntry = {
          id: indexResult.id,
          title: '',
          content: indexResult.particulars || '',
          category: searchService.mapCategory(indexResult.category, tableName),
          source: tableName,
          lastUpdated: new Date(),
          status: 'active'
        };

        // Table-specific mapping
        if (tableName === 'listingrule_new_gl') {
          entry.title = 'Listing Rule Guidance';
          entry.section = indexResult.reference_no || undefined;
        } else if (tableName === 'listingrule_listed_faq') {
          entry.title = 'Listed Company FAQ';
          entry.section = indexResult.reference_nos || undefined;
        } else if (tableName === 'listingrule_new_faq') {
          entry.title = 'New Listing FAQ';
          entry.section = indexResult.question_no || undefined;
        } else if (tableName === 'announcement_pre_vetting_requirements') {
          entry.title = 'Pre-Vetting Requirements';
          entry.category = 'documentation';
        }

        return entry;
      });
    } catch (error) {
      console.error(`Error fetching detailed data from ${tableName}:`, error);
      return [];
    }
  },

  /**
   * Map category strings to RegulatoryEntry category enum
   */
  mapCategory: (categoryStr: string | null, tableName: string): RegulatoryEntry['category'] => {
    if (categoryStr?.toLowerCase().includes('listing')) return 'listing_rules';
    if (categoryStr?.toLowerCase().includes('takeover')) return 'takeovers';
    if (categoryStr?.toLowerCase().includes('faq')) return 'faqs';
    if (tableName.includes('faq')) return 'faqs';
    if (tableName.includes('listingrule')) return 'listing_rules';
    return 'other';
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
