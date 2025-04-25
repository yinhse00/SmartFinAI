
import { supabase } from '@/integrations/supabase/client';
import { ReferenceDocument, DocumentCategory } from '@/types/references';
import { ReferenceSearchResults } from './types';
import { extractKeyTerms, calculateRelevanceScore, hasFuzzyMatch } from '../utils/textProcessing';

export const referenceSearchService = {
  async searchReferenceDocuments(
    query: string, 
    category?: string, 
    prioritizeFAQ: boolean = false
  ): Promise<ReferenceSearchResults> {
    try {
      console.log(`Searching reference documents for "${query}" in category: ${category || 'all'}`);
      
      // Extract search terms for better matching
      const searchTerms = extractKeyTerms(query.toLowerCase());
      console.log('Extracted search terms:', searchTerms);
      
      // Initial database query with basic filters
      let referenceQuery = supabase
        .from('reference_documents')
        .select('*');
        
      if (category && category !== 'all') {
        referenceQuery = referenceQuery.eq('category', category);
      }
      
      // First try an exact match search
      const { data: exactMatchData, error: exactMatchError } = await referenceQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`
      );
      
      if (exactMatchError) {
        console.error("Error during exact match search:", exactMatchError);
        return { referenceDocuments: [] };
      }
      
      // Prepare the result set
      let matches = exactMatchData || [];
      console.log(`Found ${matches.length} exact matches`);
      
      // If we didn't find many exact matches, try searching for individual terms
      if (matches.length < 3 && searchTerms.length > 0) {
        console.log('Performing term-based search for better recall');
        
        // Build a more comprehensive search condition
        const searchConditions = searchTerms.map(term => 
          `title.ilike.%${term}%,description.ilike.%${term}%`
        ).join(',');
        
        const { data: termMatchData, error: termMatchError } = await referenceQuery.or(searchConditions);
        
        if (termMatchError) {
          console.error("Error during term-based search:", termMatchError);
        } else if (termMatchData) {
          // Combine the results, ensuring no duplicates
          const newMatches = termMatchData.filter(item => 
            !matches.some(existing => existing.id === item.id)
          );
          
          console.log(`Found ${newMatches.length} additional matches from term search`);
          matches = [...matches, ...newMatches];
        }
      }
      
      // Process and type the matched data
      const typedReferenceData = matches.map(item => ({
        ...item,
        category: item.category as DocumentCategory,
        relevanceScore: calculateRelevanceScore(
          item.description || '', 
          item.title, 
          searchTerms.length > 0 ? searchTerms : [query]
        )
      })) as (ReferenceDocument & { relevanceScore: number })[];
      
      // Sort by relevance score
      typedReferenceData.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      console.log(`Returning ${typedReferenceData.length} reference documents sorted by relevance`);
      
      // Apply FAQ prioritization if requested
      if (prioritizeFAQ) {
        return {
          referenceDocuments: typedReferenceData.sort((a, b) => {
            // First sort by FAQ status
            const aIsFaq = a.title.includes('10.4') || 
                          a.title.toLowerCase().includes('faq') || 
                          a.title.toLowerCase().includes('continuing');
            const bIsFaq = b.title.includes('10.4') || 
                          b.title.toLowerCase().includes('faq') || 
                          b.title.toLowerCase().includes('continuing');
            
            if (aIsFaq && !bIsFaq) return -1;
            if (!aIsFaq && bIsFaq) return 1;
            
            // Then sort by relevance score
            return b.relevanceScore - a.relevanceScore;
          }).map(({ relevanceScore, ...rest }) => rest) // Remove relevanceScore from output
        };
      }
      
      // Return documents sorted by relevance score
      return { 
        referenceDocuments: typedReferenceData.map(({ relevanceScore, ...rest }) => rest) 
      };
    } catch (error) {
      console.error("Error searching reference documents:", error);
      return { referenceDocuments: [] };
    }
  },
  
  async searchReferenceDocumentsFuzzy(
    query: string,
    category?: string,
    fuzzyThreshold: number = 0.8
  ): Promise<ReferenceSearchResults> {
    try {
      console.log(`Performing fuzzy search for "${query}" with threshold ${fuzzyThreshold}`);
      
      // First get all potential documents in the category
      let referenceQuery = supabase
        .from('reference_documents')
        .select('*');
        
      if (category && category !== 'all') {
        referenceQuery = referenceQuery.eq('category', category);
      }
      
      const { data, error } = await referenceQuery;
      
      if (error) {
        console.error("Error fetching documents for fuzzy search:", error);
        return { referenceDocuments: [] };
      }
      
      if (!data || data.length === 0) {
        console.log('No documents found for fuzzy matching');
        return { referenceDocuments: [] };
      }
      
      // Extract search terms
      const searchTerms = extractKeyTerms(query.toLowerCase());
      console.log(`Using ${searchTerms.length} search terms for fuzzy matching`);
      
      // Find fuzzy matches and calculate relevance
      const matches = data.filter(doc => 
        hasFuzzyMatch(doc.title, searchTerms, fuzzyThreshold) || 
        hasFuzzyMatch(doc.description || '', searchTerms, fuzzyThreshold)
      );
      
      console.log(`Found ${matches.length} fuzzy matches`);
      
      // Calculate relevance scores and sort
      const scoredMatches = matches.map(doc => ({
        ...doc,
        category: doc.category as DocumentCategory,
        relevanceScore: calculateRelevanceScore(
          doc.description || '',
          doc.title,
          searchTerms.length > 0 ? searchTerms : [query]
        )
      })).sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Return the documents without the relevanceScore property
      return {
        referenceDocuments: scoredMatches.map(({ relevanceScore, ...rest }) => rest) as ReferenceDocument[]
      };
    } catch (error) {
      console.error("Error during fuzzy search:", error);
      return { referenceDocuments: [] };
    }
  }
};
