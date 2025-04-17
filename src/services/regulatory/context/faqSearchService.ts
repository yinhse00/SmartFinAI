
import { RegulatoryEntry } from '../../database/types';
import { searchService } from '../../databaseService';
import { contextFormatter } from './contextFormatter';

/**
 * Service for FAQ-related search operations
 */
export const faqSearchService = {
  /**
   * Find and process FAQ documents
   */
  getFaqContext: async (query: string) => {
    try {
      console.log('Searching for FAQ documents:', query);
      
      // Get FAQ documents
      const faqResults = await findFAQDocuments(query);
      
      if (faqResults.length > 0) {
        console.log(`Found ${faqResults.length} FAQ documents to prioritize`);
        // Format context with section headings and regulatory citations
        const context = contextFormatter.formatEntriesToContext(faqResults);
        
        // Generate reasoning that explains why these specific regulations are relevant
        const reasoning = `This response is based directly on official HKEX documentation from "10.4 FAQ Continuing Obligations" that provides authoritative guidance on the inquiry. The information is taken verbatim from the official FAQ document to ensure accuracy.`;
        
        return contextFormatter.createContextResponse(context, reasoning);
      }
      
      return { context: '', reasoning: '' };
    } catch (error) {
      console.error('Error retrieving FAQ context:', error);
      return { context: '', reasoning: '' };
    }
  }
};

/**
 * Find FAQ-related documents
 */
export const findFAQDocuments = async (query: string): Promise<RegulatoryEntry[]> => {
  // Check if query might be related to continuing obligations or FAQs
  const isFaqRelated = query.toLowerCase().includes('continuing obligation') || 
                      query.toLowerCase().includes('faq') ||
                      Boolean(query.match(/\b10\.4\b/));
  
  if (isFaqRelated) {
    console.log('Query appears related to FAQs or continuing obligations, searching for relevant documents');
    
    // First try with exact "10.4 FAQ" title search
    let faqResults = await searchService.searchByTitle("10.4 FAQ Continuing Obligations");
    
    if (faqResults.length > 0) {
      console.log('Found specific "10.4 FAQ Continuing Obligations" document');
      return faqResults;
    }
    
    // Then try broader title search
    faqResults = await searchService.searchByTitle("FAQ");
    
    if (faqResults.length > 0) {
      console.log(`Found ${faqResults.length} FAQ documents by title search`);
      return faqResults;
    }
    
    // Finally, try content search
    faqResults = await searchService.search("continuing obligations FAQ", "listing_rules");
    console.log(`Found ${faqResults.length} results from FAQ keyword search`);
    return faqResults;
  }
  
  return [];
};
