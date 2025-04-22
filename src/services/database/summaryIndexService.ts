
import { databaseService } from "./databaseService";
import { RegulatoryEntry } from "./types";

/**
 * This service handles Summary and Keyword Index operations
 * It provides a faster way to find information by checking summaries and keywords first
 * before performing a full database search
 */

// Interface for summary index entries
interface SummaryIndexEntry {
  id: string;
  title: string;
  keywords: string[];
  summary: string;
  sourceId: string;
  category: string;
  sourceFile?: string; // Source file name used for specific file search
}

// In-memory database of summary entries for faster lookup
let summaryIndexDatabase: SummaryIndexEntry[] = [];

/**
 * Service for summary and keyword index
 */
export const summaryIndexService = {
  /**
   * Initialize the summary index
   */
  initializeSummaryIndex: async (): Promise<void> => {
    console.log('Initializing Summary and Keyword Index');
    
    // Get all entries from the regulatory database
    const allEntries = databaseService.getAllEntries();
    
    // Generate summary index entries
    summaryIndexDatabase = allEntries.map(entry => generateSummaryEntry(entry));
    
    console.log(`Summary Index initialized with ${summaryIndexDatabase.length} entries`);
  },
  
  /**
   * Find relevant summary for the query
   */
  findRelevantSummary: async (query: string): Promise<{
    found: boolean;
    context?: string;
    sourceIds?: string[];
  }> => {
    console.log(`Searching Summary Index for: "${query}"`);
    
    // Ensure summary index is initialized
    if (summaryIndexDatabase.length === 0) {
      await summaryIndexService.initializeSummaryIndex();
    }
    
    // Extract key terms from query
    const queryTerms = extractKeyTerms(query.toLowerCase());
    
    // Find matches based on keywords
    const matches = summaryIndexDatabase.filter(entry => {
      // Check if any query terms match the keywords
      return entry.keywords.some(keyword => 
        queryTerms.some(term => keyword.includes(term))
      );
    });
    
    if (matches.length > 0) {
      console.log(`Found ${matches.length} relevant summaries in index`);
      
      // Sort matches by relevance (number of keyword matches)
      const sortedMatches = matches.sort((a, b) => {
        const aMatchCount = countMatches(a.keywords, queryTerms);
        const bMatchCount = countMatches(b.keywords, queryTerms);
        return bMatchCount - aMatchCount;
      });
      
      // Get full regulatory entries for the top matches
      const topMatches = sortedMatches.slice(0, 3); // Limit to top 3 matches
      
      // Get the original entries from the database
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
   * This supports the new sequential search workflow
   */
  findRelevantSummaryByFile: async (query: string, fileName: string): Promise<{
    found: boolean;
    context?: string;
    sourceIds?: string[];
  }> => {
    console.log(`Searching Summary Index for "${query}" in file: ${fileName}`);
    
    // Ensure summary index is initialized
    if (summaryIndexDatabase.length === 0) {
      await summaryIndexService.initializeSummaryIndex();
    }
    
    // Extract key terms from query
    const queryTerms = extractKeyTerms(query.toLowerCase());
    
    // Find entries that are from the specified file and match query terms
    const matches = summaryIndexDatabase.filter(entry => {
      // Check if entry is from the specified file
      const isFromTargetFile = entry.sourceFile === fileName || 
                              entry.title.includes(fileName) ||
                              entry.title.includes(fileName.replace('.docx', ''));
      
      // If not from target file, skip
      if (!isFromTargetFile) return false;
      
      // Check if any query terms match the keywords
      return entry.keywords.some(keyword => 
        queryTerms.some(term => keyword.includes(term))
      );
    });
    
    if (matches.length > 0) {
      console.log(`Found ${matches.length} relevant entries in file "${fileName}"`);
      
      // Sort matches by relevance (number of keyword matches)
      const sortedMatches = matches.sort((a, b) => {
        const aMatchCount = countMatches(a.keywords, queryTerms);
        const bMatchCount = countMatches(b.keywords, queryTerms);
        return bMatchCount - aMatchCount;
      });
      
      // Get the original entries from the database
      const sourceIds = sortedMatches.map(match => match.sourceId);
      
      // Return source IDs without loading full content yet
      return {
        found: true,
        sourceIds
      };
    }
    
    console.log(`No matches found in file "${fileName}"`);
    return { found: false };
  },
  
  /**
   * Add a new entry to the summary index
   */
  addToSummaryIndex: (entry: RegulatoryEntry): void => {
    const summaryEntry = generateSummaryEntry(entry);
    summaryIndexDatabase.push(summaryEntry);
    console.log(`Added entry "${entry.title}" to Summary Index`);
  }
};

/**
 * Generate a summary entry from a regulatory entry
 */
function generateSummaryEntry(entry: RegulatoryEntry): SummaryIndexEntry {
  // Extract keywords from title and content
  const titleKeywords = extractKeyTerms(entry.title.toLowerCase());
  const contentKeywords = extractKeyTerms(entry.content.toLowerCase());
  
  // Merge keywords and remove duplicates
  const allKeywords = [...new Set([...titleKeywords, ...contentKeywords])];
  
  // Generate a brief summary (first 200 characters)
  const summary = entry.content.substring(0, 200) + '...';
  
  // Determine if this is from a summary index file
  const sourceFile = entry.title.includes('Summary and Keyword Index') ? entry.title : undefined;
  
  return {
    id: `summary-${entry.id}`,
    title: entry.title,
    keywords: allKeywords,
    summary,
    sourceId: entry.id,
    category: entry.category,
    sourceFile
  };
}

/**
 * Extract key terms from text
 */
function extractKeyTerms(text: string): string[] {
  // Split text into words and filter out short words and common stop words
  const stopWords = ['the', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of'];
  
  return text
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    // Include regulatory specific terms like rule numbers
    .concat(text.match(/\d+\.\d+[A-Z]?/g) || [])
    // Include chapter numbers
    .concat(text.match(/chapter\s+\d+/gi) || []);
}

/**
 * Count how many terms from the query match the keywords
 */
function countMatches(keywords: string[], queryTerms: string[]): number {
  let count = 0;
  
  for (const term of queryTerms) {
    if (keywords.some(keyword => keyword.includes(term))) {
      count++;
    }
  }
  
  return count;
}
