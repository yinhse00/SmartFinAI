
import { searchService } from '../../databaseService';
import { findFAQDocuments } from './faqSearchService';

/**
 * Service for specific rule searches
 */
export const specificRuleSearchService = {
  /**
   * Find documents related to specific rules
   */
  findSpecificRulesDocuments: async (query: string) => {
    let ruleResults = [];
    
    // Check for specific rule references
    const ruleMatches = query.match(/rule\s+(\d+\.\d+[A-Z]?|10\.29|7\.19A?)/i);
    
    if (ruleMatches) {
      const ruleNumber = ruleMatches[1];
      console.log(`Found reference to Rule ${ruleNumber}, searching specifically`);
      
      // Check if this is rule 10.4 which relates to FAQs
      if (ruleNumber === '10.4') {
        const faqResults = await findFAQDocuments(query);
        if (faqResults.length > 0) {
          return faqResults;
        }
      }
      
      // Search for the exact rule number
      ruleResults = await searchService.search(`rule ${ruleNumber}`, 'listing_rules');
      
      // If found specific rule references, return immediately
      if (ruleResults.length > 0) {
        return ruleResults;
      }
    }
    
    // Special case for aggregation requirements in rights issues
    if ((query.toLowerCase().includes('aggregate') || query.toLowerCase().includes('aggregation')) && 
        (query.toLowerCase().includes('rights issue') || query.toLowerCase().includes('rights issues'))) {
      
      console.log('Rights issue aggregation requirements query detected, searching for specific rules');
      
      // First try with rule 7.19A specifically
      const specificResults = await searchService.search('rule 7.19A aggregate requirements', 'listing_rules');
      
      if (specificResults.length > 0) {
        return specificResults;
      }
      
      // Then try broader search for rights issue with aggregation
      return await searchService.search('rights issue aggregate independent shareholders', 'listing_rules');
    }
    
    return ruleResults;
  }
};
