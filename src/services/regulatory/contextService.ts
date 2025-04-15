
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
      
      // Search for relevant documents in the Supabase reference_documents table
      const { data: relevantDocuments, error } = await supabase
        .from('reference_documents')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching from reference_documents:", error);
        // Fall back to the in-memory database if Supabase query fails
        const relevantEntries = await databaseService.search(query);
        if (relevantEntries.length === 0) {
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
      
      // Search for relevant documents in the Supabase reference_documents table
      const { data: relevantDocuments, error } = await supabase
        .from('reference_documents')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching from reference_documents:", error);
        reasoning.push("Error accessing reference documents. Falling back to in-memory database.");
        
        // Fall back to the in-memory database if Supabase query fails
        const relevantEntries = await databaseService.search(query);
        
        if (relevantEntries.length === 0) {
          reasoning.push("No specific regulatory information found in database.");
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
      
      if (relevantDocuments && relevantDocuments.length > 0) {
        reasoning.push(`Found ${relevantDocuments.length} relevant documents in reference database.`);
        
        // Add info about each document found
        relevantDocuments.forEach(doc => {
          reasoning.push(`- Found relevant document: ${doc.title} (${doc.category})`);
        });
        
        // Format the documents as context
        const context = formatDocumentsAsContext(relevantDocuments);
        
        return {
          context,
          reasoning: reasoning.join("\n")
        };
      }
      
      // If no documents found in Supabase, fall back to in-memory database
      reasoning.push("No matching documents found in reference database. Checking in-memory database...");
      
      const relevantEntries = await databaseService.search(query);
      
      if (relevantEntries.length === 0) {
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
