
import { RegulatoryEntry } from '../../database/types';
import { searchService } from '../../databaseService';
import { findFAQDocuments } from './faqSearchService';

/**
 * Service for specific rule searches
 */
export const specificRuleSearchService = {
  /**
   * Find documents related to specific rules
   */
  findSpecificRulesDocuments: async (query: string): Promise<RegulatoryEntry[]> => {
    let ruleResults: RegulatoryEntry[] = [];
    
    // Enhanced rule reference pattern to handle chapter-specific rules
    const ruleMatches = query.match(/(?:rule|Rule)\s+(\d+[A-Z]?\.?\d*[A-Z]?(?:\(\d+\))?)/i) ||
                       query.match(/(?:Chapter|chapter)\s+(\d+[A-Z]?)\.(\d+[A-Z]?(?:\(\d+\))?)/i);
    
    if (ruleMatches) {
      let ruleNumber = ruleMatches[1];
      
      // Handle chapter-specific format (e.g., "14A.44")
      if (ruleMatches[2]) {
        ruleNumber = `${ruleMatches[1]}.${ruleMatches[2]}`;
      }
      
      console.log(`Found reference to Rule ${ruleNumber}, searching specifically`);
      
      // Check if this is rule 10.4 which relates to FAQs
      if (ruleNumber === '10.4') {
        const faqResults = await findFAQDocuments(query);
        if (faqResults.length > 0) {
          return faqResults;
        }
      }
      
      // Search for the exact rule number, considering chapter context
      const searchQuery = `rule ${ruleNumber}`;
      ruleResults = await searchService.search(searchQuery, 'listing_rules');
      
      // Verify results are from correct chapter context
      ruleResults = ruleResults.filter(entry => {
        const entryContent = entry.content.toLowerCase();
        const rulePattern = new RegExp(`rule\\s+${ruleNumber.replace('.', '\\.')}\\b`, 'i');
        return rulePattern.test(entryContent);
      });
      
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
