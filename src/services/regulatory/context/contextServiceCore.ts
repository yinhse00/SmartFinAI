
import { searchService } from '../../databaseService';
import { extractFinancialTerms } from '../utils/financialTermsExtractor';
import { removeDuplicateResults, prioritizeByRelevance } from '../utils/resultProcessors';
import { isWhitewashWaiverQuery, isGeneralOfferQuery, isTradingArrangementQuery, isCorporateActionQuery } from '../utils/queryDetector';
import { searchStrategies } from './searchStrategies';
import { contextFormatter } from './contextFormatter';

/**
 * Core functionality for contextService
 */
export const contextServiceCore = {
  /**
   * Get regulatory context for a given financial query (simplified version)
   */
  getRegulatoryContext: async (query: string): Promise<string> => {
    try {
      console.log('Basic Financial Context Search:', query);
      
      // Check if this might be FAQ related
      const isFaqQuery = query.toLowerCase().includes('faq') || 
                        query.toLowerCase().includes('continuing obligation') ||
                        query.match(/\b10\.4\b/);
      
      if (isFaqQuery) {
        // Get FAQ documents first
        const faqResults = await searchStrategies.findFAQDocuments(query);
        
        if (faqResults.length > 0) {
          console.log(`Found ${faqResults.length} FAQ documents to prioritize`);
          return contextFormatter.formatEntriesToContext(faqResults);
        }
      }
      
      // Normalize query to handle common variations
      const normalizedQuery = query.toLowerCase()
        .replace('right issue', 'rights issue')
        .replace('rights issues', 'rights issue');
      
      // Check for specific rule references first
      const specificRuleResults = await searchStrategies.findSpecificRulesDocuments(normalizedQuery);
      
      if (specificRuleResults.length > 0) {
        console.log(`Found ${specificRuleResults.length} results specifically matching rule references`);
        const ruleContext = contextFormatter.formatEntriesToContext(specificRuleResults);
        return ruleContext;
      }
      
      // Perform a search across the database with financial terms prioritization
      let searchResults = await searchService.search(normalizedQuery, 'listing_rules');
      
      // If no results, try keyword search
      if (searchResults.length === 0) {
        const financialTerms = extractFinancialTerms(query);
        if (query.toLowerCase().includes('timetable') || query.toLowerCase().includes('schedule')) {
          searchResults = await searchService.search('rights issue timetable');
        } else {
          searchResults = await searchService.search(financialTerms.join(' '));
        }
      }
      
      // Combine and format results with Hong Kong regulatory citations
      const context = contextFormatter.formatEntriesToContext(searchResults);
      
      return context || 'No specific Hong Kong financial regulatory information found.';
    } catch (error) {
      console.error('Error retrieving financial regulatory context:', error);
      return 'Error fetching Hong Kong financial regulatory context';
    }
  }
};
