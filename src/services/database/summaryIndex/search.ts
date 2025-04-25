
import { databaseService } from '../databaseService';
import { extractKeyTerms, countMatches } from '../utils/textProcessing';
import { RegulatoryEntry } from '../types';
import { SearchResult, SummarySearchOptions } from './types';
import { summaryIndexCore } from './core';

export const summarySearchOperations = {
  /**
   * Find relevant summary for the query
   */
  findRelevantSummary: async (
    query: string, 
    options?: SummarySearchOptions
  ): Promise<SearchResult> => {
    console.log(`Searching Summary Index for: "${query}"`);
    
    const entries = summaryIndexCore.getAllSummaryEntries();
    if (entries.length === 0) {
      await summaryIndexCore.initializeSummaryIndex();
    }
    
    // Extract key terms from query
    const queryTerms = extractKeyTerms(query.toLowerCase());
    
    // Find matches based on keywords
    const matches = entries.filter(entry => {
      return entry.keywords.some(keyword => 
        queryTerms.some(term => keyword.includes(term))
      );
    });
    
    if (matches.length > 0) {
      console.log(`Found ${matches.length} relevant summaries in index`);
      
      // Sort matches by relevance
      const sortedMatches = matches.sort((a, b) => {
        const aMatchCount = countMatches(a.keywords, queryTerms);
        const bMatchCount = countMatches(b.keywords, queryTerms);
        return bMatchCount - aMatchCount;
      });
      
      // Get full regulatory entries for the top matches
      const topMatches = sortedMatches.slice(0, options?.maxResults || 3);
      const matchedEntries = await Promise.all(
        topMatches.map(match => databaseService.getEntryById(match.sourceId))
      );
      
      // Filter out nulls and format the context
      const validEntries = matchedEntries.filter(entry => entry !== null) as RegulatoryEntry[];
      
      if (validEntries.length > 0) {
        const context = validEntries
          .map(entry => `[${entry.title} | ${entry.source}]:\n${entry.content}`)
          .join('\n\n---\n\n');
        
        return {
          found: true,
          context,
          sourceIds: validEntries.map(entry => entry.id)
        };
      }
    }
    
    console.log('No relevant matches found in Summary Index');
    return { found: false };
  },

  /**
   * Find relevant summary by specific file name
   */
  findRelevantSummaryByFile: async (
    query: string, 
    fileName: string,
    options?: SummarySearchOptions
  ): Promise<SearchResult> => {
    console.log(`Searching Summary Index for "${query}" in file: ${fileName}`);
    
    const entries = summaryIndexCore.getAllSummaryEntries();
    if (entries.length === 0) {
      await summaryIndexCore.initializeSummaryIndex();
    }
    
    const queryTerms = extractKeyTerms(query.toLowerCase());
    
    // Find entries from the specified file that match query terms
    const matches = entries.filter(entry => {
      const isFromTargetFile = entry.sourceFile === fileName || 
                              entry.title.includes(fileName) ||
                              entry.title.includes(fileName.replace('.docx', ''));
      
      if (!isFromTargetFile) return false;
      
      return entry.keywords.some(keyword => 
        queryTerms.some(term => keyword.includes(term))
      );
    });
    
    if (matches.length > 0) {
      console.log(`Found ${matches.length} relevant entries in file "${fileName}"`);
      
      // Sort by relevance and return source IDs
      const sortedMatches = matches
        .sort((a, b) => {
          const aMatchCount = countMatches(a.keywords, queryTerms);
          const bMatchCount = countMatches(b.keywords, queryTerms);
          return bMatchCount - aMatchCount;
        })
        .slice(0, options?.maxResults || 3);
      
      return {
        found: true,
        sourceIds: sortedMatches.map(match => match.sourceId)
      };
    }
    
    console.log(`No matches found in file "${fileName}"`);
    return { found: false };
  }
};

