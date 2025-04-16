
/**
 * Service for searching the regulatory database
 */

import { RegulatoryEntry } from "./types";
import { databaseService } from "./databaseService";
import { supabase } from '@/integrations/supabase/client';
import { ReferenceDocument, DocumentCategory } from '@/types/references';

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
  },

  /**
   * Search both in-memory database and reference documents
   * @param query The search query
   * @param category Optional category to filter results
   * @returns Combined results with database entries first (prioritized)
   */
  searchComprehensive: async (query: string, category?: string): Promise<{
    databaseEntries: RegulatoryEntry[],
    referenceDocuments: ReferenceDocument[]
  }> => {
    // Search in-memory database
    const databaseEntries = await searchService.search(query, category);
    
    // Search reference documents in Supabase
    let referenceQuery = supabase
      .from('reference_documents')
      .select('*');
      
    if (category && category !== 'all') {
      referenceQuery = referenceQuery.eq('category', category);
    }
    
    // Add search filter for title and description
    const { data: referenceData, error } = await referenceQuery.or(
      `title.ilike.%${query}%,description.ilike.%${query}%`
    );
    
    if (error) {
      console.error("Error searching reference documents:", error);
      return {
        databaseEntries,
        referenceDocuments: []
      };
    }
    
    console.log(`Found ${databaseEntries.length} database entries and ${referenceData?.length || 0} reference documents`);
    
    // Convert the raw data to ReferenceDocument type
    const typedReferenceData = referenceData?.map(item => ({
      ...item,
      category: item.category as DocumentCategory
    })) as ReferenceDocument[] || [];
    
    return {
      databaseEntries,
      referenceDocuments: typedReferenceData
    };
  }
};

