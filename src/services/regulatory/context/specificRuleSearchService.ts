
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
    
    // Enhanced rule reference pattern to handle various formats
    const rulePatterns = [
      // Standard format (e.g., "rule 14.44")
      /(?:rule|Rule)\s+(\d+\.\d+[A-Z]?(?:\(\d+\))?)/i,
      // Chapter context format (e.g., "Chapter 14A.44")
      /(?:Chapter|chapter)\s+(\d+[A-Z]?)\.(\d+[A-Z]?(?:\(\d+\))?)/i,
      // Chapter with separate rule (e.g., "Chapter 14A rule 44")
      /(?:Chapter|chapter)\s+(\d+[A-Z]?)\s+(?:rule|Rule)\s+(\d+)/i
    ];
    
    let ruleNumber: string | null = null;
    let chapterContext: string | null = null;
    
    // Try each pattern to find matches
    for (const pattern of rulePatterns) {
      const matches = query.match(pattern);
      if (matches) {
        if (matches[2]) {
          // Handle chapter-specific format
          chapterContext = matches[1];
          ruleNumber = `${matches[1]}.${matches[2]}`;
        } else {
          ruleNumber = matches[1];
          // Try to extract chapter context if present
          const chapterMatch = ruleNumber.match(/^(\d+[A-Z]?)\./);
          if (chapterMatch) {
            chapterContext = chapterMatch[1];
          }
        }
        break;
      }
    }
    
    if (ruleNumber) {
      console.log(`Found reference to Rule ${ruleNumber}${chapterContext ? ` in Chapter ${chapterContext}` : ''}, searching specifically`);
      
      // Check for FAQ rule 10.4
      if (ruleNumber === '10.4') {
        const faqResults = await findFAQDocuments(query);
        if (faqResults.length > 0) {
          return faqResults;
        }
      }
      
      // Search with chapter context if available
      const searchQuery = chapterContext 
        ? `chapter ${chapterContext} rule ${ruleNumber}`
        : `rule ${ruleNumber}`;
      
      ruleResults = await searchService.search(searchQuery, 'listing_rules');
      
      // Filter results to ensure they match the correct chapter context
      ruleResults = ruleResults.filter(entry => {
        const entryContent = entry.content.toLowerCase();
        const rulePattern = new RegExp(
          chapterContext
            ? `(?:chapter\\s+${chapterContext}.*)?rule\\s+${ruleNumber.replace('.', '\\.')}\\b`
            : `rule\\s+${ruleNumber.replace('.', '\\.')}\\b`,
          'i'
        );
        return rulePattern.test(entryContent);
      });
      
      // Sort results by relevance
      ruleResults.sort((a, b) => {
        const aContent = a.content.toLowerCase();
        const bContent = b.content.toLowerCase();
        
        // Prioritize exact matches
        const aExactMatch = aContent.includes(`rule ${ruleNumber.toLowerCase()}`);
        const bExactMatch = bContent.includes(`rule ${ruleNumber.toLowerCase()}`);
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        return 0;
      });
      
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
