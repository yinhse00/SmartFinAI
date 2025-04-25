
import { RegulatoryEntry } from '../types';
import { databaseService } from '../databaseService';
import { referenceSearchService } from './referenceSearchService';
import { faqSearchService } from './faqSearchService';
import { SearchResults } from './types';

export const searchService = {
  search: async (query: string, category?: string): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for "${query}" in category: ${category || 'all'}`);
    
    const allEntries = databaseService.getAllEntries();
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    const results = allEntries.filter(entry => {
      const titleLower = entry.title.toLowerCase();
      const contentLower = entry.content.toLowerCase();
      
      const matchesByTerm = queryTerms.some(term => 
        titleLower.includes(term) || contentLower.includes(term)
      );
      
      const matchesWholePhrase = 
        titleLower.includes(query.toLowerCase()) || 
        contentLower.includes(query.toLowerCase());
        
      if (!matchesByTerm && !matchesWholePhrase) return false;
      if (category && entry.category !== category) return false;
      
      return true;
    });
    
    return faqSearchService.isFaqQuery(query) 
      ? faqSearchService.prioritizeFaqResults(results)
      : results;
  },
  
  searchByTitle: async (titleQuery: string): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for documents with title containing "${titleQuery}"`);
    
    const allEntries = databaseService.getAllEntries();
    const lowerTitleQuery = titleQuery.toLowerCase();
    
    const results = allEntries.filter(entry => 
      entry.title.toLowerCase().includes(lowerTitleQuery)
    );
    
    console.log(`Found ${results.length} documents with matching title`);
    return results;
  },

  getEntriesBySourceIds: async (sourceIds: string[]): Promise<RegulatoryEntry[]> => {
    console.log(`Retrieving ${sourceIds.length} entries by source IDs`);
    
    const allEntries = databaseService.getAllEntries();
    const results = allEntries.filter(entry => sourceIds.includes(entry.id));
    
    console.log(`Retrieved ${results.length} entries from database`);
    return results;
  },

  searchComprehensive: async (query: string, category?: string): Promise<SearchResults> => {
    const isFaqQuery = faqSearchService.isFaqQuery(query);
    const databaseEntries = await searchService.search(query, category);
    
    const { referenceDocuments } = await referenceSearchService.searchReferenceDocuments(
      query, 
      category, 
      isFaqQuery
    );
    
    console.log(`Found ${databaseEntries.length} database entries and ${referenceDocuments.length} reference documents`);
    
    return {
      databaseEntries: isFaqQuery ? faqSearchService.prioritizeFaqResults(databaseEntries) : databaseEntries,
      referenceDocuments
    };
  }
};
