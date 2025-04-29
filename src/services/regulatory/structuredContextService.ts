
import { regulatoryDatabaseService } from '@/services/database/regulatoryDatabaseService';
import { searchService } from '@/services/database/searchService';

/**
 * Enhanced context service that uses the structured database
 */
export const structuredContextService = {
  /**
   * Get regulatory context based on a query string
   */
  getRegulatoryContext: async (query: string): Promise<{ context: string; reasoning: string }> => {
    console.log('Getting regulatory context for query:', query);
    
    try {
      // Search in structured database
      const provisions = await regulatoryDatabaseService.searchProvisions(query);
      
      if (provisions.length === 0) {
        console.log('No provisions found in structured database, falling back to traditional search');
        
        // Fall back to the traditional search if no structured results
        return await fallbackToTraditionalSearch(query);
      }
      
      // Format the provisions into context
      let context = `Relevant regulatory provisions for your query:\n\n`;
      
      for (const provision of provisions) {
        context += `Rule ${provision.rule_number}: ${provision.title}\n`;
        context += `${provision.content}\n\n`;
      }
      
      return {
        context,
        reasoning: `Retrieved ${provisions.length} relevant provisions from the regulatory database using structured search for better accuracy.`
      };
    } catch (error) {
      console.error('Error in structured context service:', error);
      return await fallbackToTraditionalSearch(query);
    }
  },
  
  /**
   * Get context specifically for definitions
   */
  getDefinitionContext: async (term: string): Promise<{ context: string; reasoning: string }> => {
    console.log('Getting definition context for term:', term);
    
    try {
      // Extract potential terms from the query
      const queryTerms = term.match(/["']([^"']+)["']/) || 
                       term.match(/what\s+is\s+(?:an?\s+)?([a-z0-9\s]+)/i) ||
                       term.match(/define\s+(?:an?\s+)?([a-z0-9\s]+)/i);
      
      const searchTerm = queryTerms ? queryTerms[1] : term;
      
      // Search for definitions in the database
      const definitions = await regulatoryDatabaseService.searchDefinitions(searchTerm);
      
      if (definitions.length === 0) {
        console.log('No definitions found in structured database, falling back');
        return await fallbackToTraditionalSearch(term);
      }
      
      // Format the definitions into context
      let context = `Regulatory definitions found for "${searchTerm}":\n\n`;
      
      for (const def of definitions) {
        const category = def.category_id ? `(${(def as any).regulatory_categories?.name || def.category_id})` : '';
        context += `Term: "${def.term}" ${category}\n`;
        context += `Definition: ${def.definition}\n\n`;
      }
      
      return {
        context,
        reasoning: `Retrieved ${definitions.length} relevant definitions from the regulatory database.`
      };
    } catch (error) {
      console.error('Error in definition context search:', error);
      return await fallbackToTraditionalSearch(term);
    }
  }
};

/**
 * Fall back to traditional search when structured search doesn't yield results
 */
async function fallbackToTraditionalSearch(query: string): Promise<{ context: string; reasoning: string }> {
  try {
    // Use the existing searchService
    const { databaseEntries, referenceDocuments } = await searchService.searchComprehensive(query);
    
    let context = '';
    
    // Add database entries first
    if (databaseEntries.length > 0) {
      databaseEntries.forEach(entry => {
        context += `${entry.title}\n${entry.content}\n\n`;
      });
    }
    
    // Add reference document information if available
    if (referenceDocuments.length > 0) {
      context += '\n--- REFERENCE DOCUMENTS ---\n\n';
      referenceDocuments.forEach((doc, index) => {
        if (index < 3) { // Limit to top 3 documents
          context += `${doc.title}: ${doc.description || 'No description available'}\n`;
        }
      });
    }
    
    return {
      context: context.trim(),
      reasoning: 'Used traditional search as fallback since structured search returned no results.'
    };
  } catch (error) {
    console.error('Error in fallback search:', error);
    return {
      context: '',
      reasoning: 'Failed to retrieve context due to search errors.'
    };
  }
}
