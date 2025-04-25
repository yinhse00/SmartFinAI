
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
  },

  /**
   * Find relevant summary by reference (chapter, rule, etc.)
   * This function is called by useContextRetrieval.tsx
   */
  findRelevantSummaryByReference: async (
    query: string,
    options?: SummarySearchOptions
  ): Promise<SearchResult> => {
    console.log(`Searching Summary Index for references in: "${query}"`);
    
    const entries = summaryIndexCore.getAllSummaryEntries();
    if (entries.length === 0) {
      await summaryIndexCore.initializeSummaryIndex();
    }
    
    // Extract references from query
    const chapterMatch = query.match(/chapter\s+(\d+)/i);
    const ruleMatch = query.match(/rule\s+(\d+(\.\d+)?)/i);
    
    const chapterRef = chapterMatch ? chapterMatch[1] : null;
    const ruleRef = ruleMatch ? ruleMatch[1] : null;
    
    console.log(`Extracted references: Chapter=${chapterRef}, Rule=${ruleRef}`);
    
    // Find entries that match the reference
    const matches = entries.filter(entry => {
      // Check for chapter references
      if (chapterRef && (
          entry.title.toLowerCase().includes(`chapter ${chapterRef}`) ||
          entry.keywords.some(kw => kw.includes(`chapter${chapterRef}`)) ||
          entry.summary.toLowerCase().includes(`chapter ${chapterRef}`)
      )) {
        return true;
      }
      
      // Check for rule references
      if (ruleRef && (
          entry.title.toLowerCase().includes(`rule ${ruleRef}`) ||
          entry.keywords.some(kw => kw.includes(`rule${ruleRef}`)) ||
          entry.summary.toLowerCase().includes(`rule ${ruleRef}`)
      )) {
        return true;
      }
      
      return false;
    });
    
    if (matches.length > 0) {
      console.log(`Found ${matches.length} relevant entries with reference matches`);
      
      // Get full regulatory entries for the matches
      const topMatches = matches.slice(0, options?.maxResults || 3);
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
    } else {
      console.log('No reference matches found, falling back to standard search');
      // Fall back to standard search if no reference matches
      return await summarySearchOperations.findRelevantSummary(query, options);
    }
    
    console.log('No relevant reference matches found in Summary Index');
    return { found: false };
  }
};
