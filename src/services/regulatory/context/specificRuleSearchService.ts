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
    
    // Enhanced rule reference pattern with validation
    const rulePatterns = [
      // Standard format with validation
      /(?:rule|Rule)\s+(\d+\.\d+[A-Z]?(?:\(\d+\))?)/i,
      // Chapter context format
      /(?:Chapter|chapter)\s+(\d+[A-Z]?)\.(\d+[A-Z]?(?:\(\d+\))?)/i,
      // Chapter with separate rule
      /(?:Chapter|chapter)\s+(\d+[A-Z]?)\s+(?:rule|Rule)\s+(\d+)/i
    ];
    
    let ruleNumber: string | null = null;
    let chapterContext: string | null = null;
    
    // Try each pattern to find matches with validation
    for (const pattern of rulePatterns) {
      const matches = query.match(pattern);
      if (matches) {
        if (matches[2]) {
          // Handle chapter-specific format with validation
          const chapterNum = matches[1];
          const ruleNum = matches[2];
          if (isValidChapterAndRule(chapterNum, ruleNum)) {
            chapterContext = chapterNum;
            ruleNumber = `${chapterNum}.${ruleNum}`;
          }
        } else {
          ruleNumber = matches[1];
          // Extract chapter context if present
          const chapterMatch = ruleNumber.match(/^(\d+[A-Z]?)\./);
          if (chapterMatch && isValidChapterNumber(chapterMatch[1])) {
            chapterContext = chapterMatch[1];
          }
        }
        break;
      }
    }
    
    if (ruleNumber) {
      console.log(`Found reference to Rule ${ruleNumber}${chapterContext ? ` in Chapter ${chapterContext}` : ''}, searching specifically`);
      
      // Search with strict validation
      const searchQuery = chapterContext 
        ? `chapter ${chapterContext} rule ${ruleNumber}`
        : `rule ${ruleNumber}`;
      
      ruleResults = await searchService.search(searchQuery, 'listing_rules');
      
      // Enhanced filtering with exact match prioritization
      ruleResults = ruleResults.filter(entry => {
        const entryContent = entry.content.toLowerCase();
        const rulePattern = new RegExp(
          `rule\\s+${ruleNumber.replace('.', '\\.')}\\b`,
          'i'
        );
        
        // Check for exact rule number match
        const hasExactMatch = rulePattern.test(entryContent);
        
        // If chapter context exists, verify it matches
        if (chapterContext) {
          const chapterPattern = new RegExp(
            `chapter\\s+${chapterContext}`,
            'i'
          );
          return hasExactMatch && chapterPattern.test(entryContent);
        }
        
        return hasExactMatch;
      });
      
      // Sort by relevance with exact matches first
      ruleResults.sort((a, b) => {
        const aExact = new RegExp(`rule\\s+${ruleNumber}\\b`, 'i').test(a.content);
        const bExact = new RegExp(`rule\\s+${ruleNumber}\\b`, 'i').test(b.content);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });
    }
    
    return ruleResults;
  }
};

// Helper function to validate chapter and rule combination
function isValidChapterAndRule(chapter: string, rule: string): boolean {
  return /^\d+[A-Z]?$/.test(chapter) && /^\d+(?:\.\d+)?(?:\(\d+\))?$/.test(rule);
}

// Helper function to validate chapter number format
function isValidChapterNumber(chapter: string): boolean {
  return /^\d+[A-Z]?$/.test(chapter);
}
