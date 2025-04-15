
/**
 * Service for handling regulatory context operations
 */
import { databaseService } from '../databaseService';
import { formatRegulatoryEntriesAsContext } from '../contextUtils';
import { supabase } from '@/integrations/supabase/client';
import { ReferenceDocument } from '@/types/references';

export const contextService = {
  /**
   * Fetch relevant regulatory information for context from database
   */
  getRegulatoryContext: async (query: string): Promise<string> => {
    try {
      console.log(`Searching for "${query}" in reference documents...`);
      
      // Create an array of keywords to search for
      const keywords = extractKeywords(query);
      console.log("Using keywords for search:", keywords);
      
      // 1. First try an exact match search
      let { data: relevantDocuments, error } = await supabase
        .from('reference_documents')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      // 2. If no exact matches, try searching with extracted keywords
      if ((!relevantDocuments || relevantDocuments.length === 0) && keywords.length > 0) {
        console.log("No exact matches found, trying keyword search");
        
        // Build the query conditions for each keyword
        const keywordConditions = keywords.map(keyword => 
          `title.ilike.%${keyword}%,description.ilike.%${keyword}%`
        ).join(',');
        
        const { data: keywordDocuments, error: keywordError } = await supabase
          .from('reference_documents')
          .select('*')
          .or(keywordConditions)
          .order('created_at', { ascending: false });
          
        if (!keywordError && keywordDocuments && keywordDocuments.length > 0) {
          relevantDocuments = keywordDocuments;
          console.log(`Found ${relevantDocuments.length} documents through keyword search`);
        }
      }
      
      if (error) {
        console.error("Error fetching from reference_documents:", error);
        // Fall back to the in-memory database if Supabase query fails
        const relevantEntries = await databaseService.search(query);
        if (relevantEntries.length === 0) {
          // Try keyword search in memory database
          const entriesFromKeywords = await searchWithKeywords(keywords);
          if (entriesFromKeywords.length > 0) {
            return formatRegulatoryEntriesAsContext(entriesFromKeywords);
          }
          return "No specific regulatory information found in database.";
        }
        
        return formatRegulatoryEntriesAsContext(relevantEntries);
      }
      
      if (relevantDocuments && relevantDocuments.length > 0) {
        console.log(`Found ${relevantDocuments.length} relevant documents in reference_documents table`);
        
        // Format the documents as context
        return formatDocumentsAsContext(relevantDocuments);
      }
      
      // If no documents found in Supabase, fall back to in-memory database
      console.log("No documents found in reference_documents table, falling back to in-memory database");
      const relevantEntries = await databaseService.search(query);
      
      if (relevantEntries.length === 0) {
        // Try keyword search in memory database
        const entriesFromKeywords = await searchWithKeywords(keywords);
        if (entriesFromKeywords.length > 0) {
          return formatRegulatoryEntriesAsContext(entriesFromKeywords);
        }
        return "No specific regulatory information found in database.";
      }
      
      return formatRegulatoryEntriesAsContext(relevantEntries);
    } catch (error) {
      console.error("Error fetching regulatory context:", error);
      return "Error fetching regulatory context.";
    }
  },
  
  /**
   * Enhanced version that shows reasoning steps
   */
  getRegulatoryContextWithReasoning: async (query: string): Promise<{context: string, reasoning: string}> => {
    try {
      console.log(`Searching for "${query}" in reference documents...`);
      
      const reasoning = ["Searching reference documents database for relevant information..."];
      
      // Create an array of keywords to search for
      const keywords = extractKeywords(query);
      if (keywords.length > 0) {
        reasoning.push(`Extracted keywords for search: ${keywords.join(', ')}`);
      }
      
      // 1. First try an exact match search
      const { data: relevantDocuments, error } = await supabase
        .from('reference_documents')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      let finalDocuments = relevantDocuments;
      
      // 2. If no exact matches, try searching with extracted keywords
      if ((!finalDocuments || finalDocuments.length === 0) && keywords.length > 0) {
        reasoning.push("No exact matches found, trying keyword search");
        
        // Build the query conditions for each keyword
        const keywordConditions = keywords.map(keyword => 
          `title.ilike.%${keyword}%,description.ilike.%${keyword}%`
        ).join(',');
        
        const { data: keywordDocuments, error: keywordError } = await supabase
          .from('reference_documents')
          .select('*')
          .or(keywordConditions)
          .order('created_at', { ascending: false });
          
        if (!keywordError && keywordDocuments && keywordDocuments.length > 0) {
          finalDocuments = keywordDocuments;
          reasoning.push(`Found ${finalDocuments.length} documents through keyword search`);
        }
      }
      
      if (error) {
        console.error("Error fetching from reference_documents:", error);
        reasoning.push("Error accessing reference documents. Falling back to in-memory database.");
        
        // Fall back to the in-memory database if Supabase query fails
        const relevantEntries = await databaseService.search(query);
        
        if (relevantEntries.length === 0) {
          reasoning.push("No exact matches found, trying keyword search in memory database");
          
          // Try keyword search in memory database
          const entriesFromKeywords = await searchWithKeywords(keywords);
          
          if (entriesFromKeywords.length > 0) {
            reasoning.push(`Found ${entriesFromKeywords.length} entries through keyword search`);
            
            // Add info about each entry found
            entriesFromKeywords.forEach(entry => {
              reasoning.push(`- Found relevant information in: ${entry.title} (${entry.category})`);
            });
            
            return {
              context: formatRegulatoryEntriesAsContext(entriesFromKeywords),
              reasoning: reasoning.join("\n")
            };
          }
          
          reasoning.push("No specific regulatory information found in any database.");
          return {
            context: "No specific regulatory information found in database.",
            reasoning: reasoning.join("\n")
          };
        }
        
        reasoning.push(`Found ${relevantEntries.length} relevant entries in in-memory database.`);
        
        // Add info about each entry found
        relevantEntries.forEach(entry => {
          reasoning.push(`- Found relevant information in: ${entry.title} (${entry.category})`);
        });
        
        // Format the entries as context
        const context = formatRegulatoryEntriesAsContext(relevantEntries);
        
        return {
          context,
          reasoning: reasoning.join("\n")
        };
      }
      
      if (finalDocuments && finalDocuments.length > 0) {
        reasoning.push(`Found ${finalDocuments.length} relevant documents in reference database.`);
        
        // Add info about each document found
        finalDocuments.forEach(doc => {
          reasoning.push(`- Found relevant document: ${doc.title} (${doc.category})`);
        });
        
        // Format the documents as context
        const context = formatDocumentsAsContext(finalDocuments);
        
        return {
          context,
          reasoning: reasoning.join("\n")
        };
      }
      
      // If no documents found in Supabase, fall back to in-memory database
      reasoning.push("No matching documents found in reference database. Checking in-memory database...");
      
      const relevantEntries = await databaseService.search(query);
      
      if (relevantEntries.length === 0) {
        reasoning.push("No exact matches found, trying keyword search in memory database");
          
        // Try keyword search in memory database
        const entriesFromKeywords = await searchWithKeywords(keywords);
        
        if (entriesFromKeywords.length > 0) {
          reasoning.push(`Found ${entriesFromKeywords.length} entries through keyword search`);
          
          // Add info about each entry found
          entriesFromKeywords.forEach(entry => {
            reasoning.push(`- Found relevant information in: ${entry.title} (${entry.category})`);
          });
          
          return {
            context: formatRegulatoryEntriesAsContext(entriesFromKeywords),
            reasoning: reasoning.join("\n")
          };
        }
        
        reasoning.push("No specific regulatory information found in any database.");
        return {
          context: "No specific regulatory information found in database.",
          reasoning: reasoning.join("\n")
        };
      }
      
      reasoning.push(`Found ${relevantEntries.length} relevant entries in in-memory database.`);
      
      // Add info about each entry found
      relevantEntries.forEach(entry => {
        reasoning.push(`- Found relevant information in: ${entry.title} (${entry.category})`);
      });
      
      // Format the entries as context
      const context = formatRegulatoryEntriesAsContext(relevantEntries);
      
      return {
        context,
        reasoning: reasoning.join("\n")
      };
    } catch (error) {
      console.error("Error fetching regulatory context:", error);
      return {
        context: "Error fetching regulatory context.",
        reasoning: "Error occurred while searching regulatory database."
      };
    }
  }
};

/**
 * Format reference documents as context for AI prompts
 */
function formatDocumentsAsContext(documents: ReferenceDocument[]): string {
  return documents.map(doc => (
    `--- ${doc.title} (${doc.category}) ---\n` +
    `Description: ${doc.description || 'No description provided'}\n` +
    `Source: ${doc.file_url}\n`
  )).join('\n\n');
}

/**
 * Extract meaningful keywords from a query
 */
function extractKeywords(query: string): string[] {
  // Convert to lowercase and remove punctuation
  const cleanedQuery = query.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  // Split into words
  const words = cleanedQuery.split(/\s+/);
  
  // Remove common stopwords
  const stopwords = [
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'can', 'will', 'just', 'should', 'now', 'please', 'what', 'i', 'me', 'my', 'myself',
    'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they',
    'them', 'their', 'theirs', 'themselves', 'do', 'does', 'did', 'doing', 'have', 'has', 'had', 'having'
  ];
  
  // Filter out stopwords and short words (less than 2 characters)
  const keywords = words.filter(word => {
    return word.length > 2 && !stopwords.includes(word);
  });
  
  // Add some domain-specific combinations that would be important to match together
  const specialPhrases = [];
  if (query.toLowerCase().includes('hong kong')) specialPhrases.push('hong kong');
  if (query.toLowerCase().includes('listing rules')) specialPhrases.push('listing rules');
  if (query.toLowerCase().includes('rights issue')) specialPhrases.push('rights issue');
  if (query.toLowerCase().includes('takeover code')) specialPhrases.push('takeover code');
  
  return [...new Set([...keywords, ...specialPhrases])]; // Use Set to remove duplicates
}

/**
 * Search database with array of keywords
 */
async function searchWithKeywords(keywords: string[]): Promise<any[]> {
  if (keywords.length === 0) return [];
  
  // Search all entries for each keyword and collect results
  const allResults = [];
  
  for (const keyword of keywords) {
    const results = await databaseService.search(keyword);
    allResults.push(...results);
  }
  
  // Remove duplicates by id
  const uniqueResults = Array.from(
    new Map(allResults.map(item => [item.id, item])).values()
  );
  
  return uniqueResults;
}
