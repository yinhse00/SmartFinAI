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
    
    // Convert query to lowercase for case-insensitive matching
    const queryLower = query.toLowerCase();
    
    // Prepare the Supabase query
    let supabaseQuery = supabase
      .from('regulatory_provisions')
      .select(`
        id,
        rule_number,
        title,
        content,
        chapter,
        section,
        last_updated,
        is_current,
        regulatory_categories(code)
      `);
    
    // Map our category strings to the database category codes
    if (category) {
      const categoryMapping: Record<string, string[]> = {
        'listing_rules': ['CH13', 'CH14', 'CH14A'],
        'takeovers': ['TO'],
        'guidance': ['GN'],
        'decisions': ['LD'],
        'checklists': ['CL'],
        'other': ['OTHER']
      };
      
      const categoryCodes = categoryMapping[category] || ['OTHER'];
      supabaseQuery = supabaseQuery.in('regulatory_categories.code', categoryCodes);
    }
    
    // Add search condition
    // Since we can't do complex text search with the regular Supabase query,
    // we'll fetch the results and filter them client-side
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
      const categoryCode = item.regulatory_categories?.code || 'other';
      const categoryMapping: Record<string, RegulatoryEntry['category']> = {
        'CH13': 'listing_rules',
        'CH14': 'listing_rules',
        'CH14A': 'listing_rules',
        'TO': 'takeovers'
      };
      
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        category: categoryMapping[categoryCode] || 'other',
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
    referenceDocuments: ReferenceDocument[]
  }> => {
    // Search for entries in the regulatory database
    const databaseEntries = await searchService.search(query, category);
    
    // Search for reference documents in Supabase
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
      return { databaseEntries, referenceDocuments: [] };
    }
    
    // Convert the raw data to ReferenceDocument type
    const typedReferenceData = referenceData?.map(item => ({
      ...item,
      category: item.category as DocumentCategory
    })) as ReferenceDocument[] || [];
    
    console.log(`Found ${databaseEntries.length} database entries and ${typedReferenceData.length || 0} reference documents`);
    
    return {
      databaseEntries,
      referenceDocuments: typedReferenceData
    };
  }
};

// Helper function to search reference documents
async function searchReferenceDocuments(
  query: string, 
  category?: string, 
  prioritizeFAQ: boolean = false
): Promise<{ referenceDocuments: ReferenceDocument[] }> {
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
    return { referenceDocuments: [] };
  }
  
  // Convert the raw data to ReferenceDocument type
  const typedReferenceData = referenceData?.map(item => ({
    ...item,
    category: item.category as DocumentCategory
  })) as ReferenceDocument[] || [];
  
  // Prioritize FAQ documents if requested
  if (prioritizeFAQ) {
    return {
      referenceDocuments: typedReferenceData.sort((a, b) => {
        const aIsFaq = a.title.includes('10.4') || 
                      a.title.toLowerCase().includes('faq') || 
                      a.title.toLowerCase().includes('continuing');
        const bIsFaq = b.title.includes('10.4') || 
                      b.title.toLowerCase().includes('faq') || 
                      b.title.toLowerCase().includes('continuing');
        
        if (aIsFaq && !bIsFaq) return -1;
        if (!aIsFaq && bIsFaq) return 1;
        return 0;
      })
    };
  }
  
  return { referenceDocuments: typedReferenceData };
}
