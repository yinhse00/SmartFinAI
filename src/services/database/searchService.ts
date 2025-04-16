
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
    // Check if query is related to FAQs or continuing obligations
    const isFaqQuery = query.toLowerCase().includes('faq') || 
                      query.toLowerCase().includes('continuing obligation') ||
                      query.toLowerCase().match(/\b10\.4\b/); // Match "10.4" as a whole word
    
    // Search in-memory database
    const databaseEntries = await searchService.search(query, category);
    
    // Prioritize 10.4 FAQ documents if the query appears to be related
    if (isFaqQuery) {
      const faqEntries = databaseEntries.filter(entry => 
        entry.title.includes('10.4') || 
        entry.title.toLowerCase().includes('faq') || 
        entry.title.toLowerCase().includes('continuing obligation')
      );
      
      if (faqEntries.length > 0) {
        console.log(`Found ${faqEntries.length} FAQ-related entries to prioritize`);
        // Move FAQ entries to the front of the results
        const otherEntries = databaseEntries.filter(entry => !faqEntries.includes(entry));
        const prioritizedEntries = [...faqEntries, ...otherEntries];
        console.log(`Prioritized ${faqEntries.length} FAQ entries out of ${databaseEntries.length} total entries`);
        
        // Search reference documents in Supabase but prioritize FAQ results
        const { referenceDocuments } = await searchReferenceDocuments(query, category, true);
        
        return {
          databaseEntries: prioritizedEntries,
          referenceDocuments
        };
      }
    }
    
    // Standard reference document search for non-FAQ queries
    const { referenceDocuments } = await searchReferenceDocuments(query, category);
    
    console.log(`Found ${databaseEntries.length} database entries and ${referenceDocuments.length || 0} reference documents`);
    
    return {
      databaseEntries,
      referenceDocuments
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
