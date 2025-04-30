
import { SearchResult } from './types';
import { basicSearch } from './basicSearch';
import { searchReferenceDocuments } from './referenceDocumentSearch';

/**
 * Enhanced search functionality that combines multiple data sources
 */
export const comprehensiveSearch = {
  /**
   * Search both in-memory database and reference documents
   */
  searchComprehensive: async (query: string, category?: string): Promise<SearchResult> => {
    // Check if query is related to FAQs or continuing obligations
    const isFaqQuery = query.toLowerCase().includes('faq') || 
                      query.toLowerCase().includes('continuing obligation') ||
                      query.toLowerCase().match(/\b10\.4\b/); // Match "10.4" as a whole word
    
    // Search in-memory database
    const databaseEntries = await basicSearch.search(query, category);
    
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
