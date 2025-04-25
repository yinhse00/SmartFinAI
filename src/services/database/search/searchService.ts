
import { RegulatoryEntry } from '../types';
import { databaseService } from '../databaseService';
import { referenceSearchService } from './referenceSearchService';
import { faqSearchService } from './faqSearchService';
import { SearchResults } from './types';
import { extractKeyTerms, calculateRelevanceScore, hasFuzzyMatch } from '../utils/textProcessing';

export const searchService = {
  search: async (query: string, category?: string): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for "${query}" in category: ${category || 'all'}`);
    
    const allEntries = databaseService.getAllEntries();
    const searchTerms = extractKeyTerms(query.toLowerCase());
    
    // Step 1: First try exact matches (more efficient)
    const exactMatches = allEntries.filter(entry => {
      const titleLower = entry.title.toLowerCase();
      const contentLower = entry.content.toLowerCase();
      
      // Check if title or content includes the whole query
      const matchesWholeQuery = 
        titleLower.includes(query.toLowerCase()) || 
        contentLower.includes(query.toLowerCase());
      
      // If matches whole query and category filter passes, include it
      if (matchesWholeQuery && (!category || entry.category === category)) {
        return true;
      }
      
      return false;
    });
    
    // If we found exact matches, prioritize them
    if (exactMatches.length > 0) {
      console.log(`Found ${exactMatches.length} exact matches`);
      
      // Calculate relevance scores for sorting
      const scoredExactMatches = exactMatches.map(entry => ({
        entry,
        score: calculateRelevanceScore(entry.content, entry.title, [query])
      }));
      
      // Sort by relevance
      scoredExactMatches.sort((a, b) => b.score - a.score);
      
      return scoredExactMatches.map(item => item.entry);
    }
    
    // Step 2: If no exact matches, search by individual terms
    console.log('No exact matches, searching by individual terms');
    
    const termMatches = allEntries.filter(entry => {
      const titleLower = entry.title.toLowerCase();
      const contentLower = entry.content.toLowerCase();
      
      // Check if any search term is found in title or content
      const hasTermMatch = searchTerms.some(term => 
        titleLower.includes(term) || contentLower.includes(term)
      );
      
      // Apply category filter
      if (hasTermMatch && (!category || entry.category === category)) {
        return true;
      }
      
      return false;
    });
    
    // If we found term matches, calculate relevance and return
    if (termMatches.length > 0) {
      console.log(`Found ${termMatches.length} term matches`);
      
      // Calculate relevance scores for sorting
      const scoredTermMatches = termMatches.map(entry => ({
        entry,
        score: calculateRelevanceScore(entry.content, entry.title, searchTerms)
      }));
      
      // Sort by relevance
      scoredTermMatches.sort((a, b) => b.score - a.score);
      
      return scoredTermMatches.map(item => item.entry);
    }
    
    // Step 3: If still no matches, try fuzzy matching as a last resort
    console.log('No term matches, trying fuzzy matching');
    
    const fuzzyMatches = allEntries.filter(entry => {
      // Skip category filter mismatches immediately
      if (category && entry.category !== category) return false;
      
      // Try fuzzy matching on title and content
      return hasFuzzyMatch(entry.title, searchTerms) || 
             hasFuzzyMatch(entry.content, searchTerms);
    });
    
    if (fuzzyMatches.length > 0) {
      console.log(`Found ${fuzzyMatches.length} fuzzy matches`);
      
      // Calculate relevance scores for fuzzy matches
      const scoredFuzzyMatches = fuzzyMatches.map(entry => ({
        entry,
        score: calculateRelevanceScore(entry.content, entry.title, searchTerms)
      }));
      
      // Sort by relevance
      scoredFuzzyMatches.sort((a, b) => b.score - a.score);
      
      return scoredFuzzyMatches.map(item => item.entry);
    }
    
    // No matches found
    console.log('No matches found');
    return [];
  },
  
  searchByTitle: async (titleQuery: string): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for documents with title containing "${titleQuery}"`);
    
    const allEntries = databaseService.getAllEntries();
    const lowerTitleQuery = titleQuery.toLowerCase();
    const searchTerms = extractKeyTerms(lowerTitleQuery);
    
    // First try exact title matches
    const exactMatches = allEntries.filter(entry => 
      entry.title.toLowerCase().includes(lowerTitleQuery)
    );
    
    if (exactMatches.length > 0) {
      console.log(`Found ${exactMatches.length} documents with exact title match`);
      return exactMatches;
    }
    
    // If no exact matches, try matching individual terms
    if (searchTerms.length > 0) {
      const termMatches = allEntries.filter(entry => 
        searchTerms.some(term => entry.title.toLowerCase().includes(term))
      );
      
      if (termMatches.length > 0) {
        console.log(`Found ${termMatches.length} documents with term matches in title`);
        
        // Score and sort by relevance
        const scoredMatches = termMatches.map(entry => ({
          entry,
          score: calculateRelevanceScore('', entry.title, searchTerms)
        }));
        
        scoredMatches.sort((a, b) => b.score - a.score);
        return scoredMatches.map(item => item.entry);
      }
    }
    
    // Last resort: fuzzy title matching
    const fuzzyMatches = allEntries.filter(entry => 
      hasFuzzyMatch(entry.title, searchTerms.length > 0 ? searchTerms : [lowerTitleQuery])
    );
    
    console.log(`Found ${fuzzyMatches.length} documents with fuzzy title matches`);
    return fuzzyMatches;
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
    
    // Search in-memory database with enhanced algorithms
    let databaseEntries = await searchService.search(query, category);
    
    // Use our new fuzzy search capability for reference documents
    const { referenceDocuments } = await referenceSearchService.searchReferenceDocumentsFuzzy(
      query, 
      category, 
      0.8 // Fuzzy threshold
    );
    
    console.log(`Found ${databaseEntries.length} database entries and ${referenceDocuments.length} reference documents`);
    
    // For FAQ queries, use our enhanced ranking system
    if (isFaqQuery) {
      databaseEntries = faqSearchService.rankFaqResultsByRelevance(databaseEntries, query);
    }
    
    return {
      databaseEntries,
      referenceDocuments
    };
  }
};
