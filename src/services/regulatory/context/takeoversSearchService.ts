
import { RegulatoryEntry } from '../../database/types';
import { searchService } from '../../databaseService';
import { getWhitewashWaiverFallbackEntry } from '../fallbacks/whitewashFallback';

/**
 * Service for searching takeover code related documents
 */
export const takeoversSearchService = {
  /**
   * Find documents related to general offers in the takeovers code
   */
  findGeneralOfferDocuments: async (query: string, isWhitewashQuery: boolean): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for general offer documents${isWhitewashQuery ? ' (whitewash related)' : ''}`);
    
    // Search in takeovers category
    const takeoversResults = await searchService.search(query, 'takeovers');
    
    // For whitewash queries, we need to specifically search for whitewash waivers
    if (isWhitewashQuery) {
      const whitewashResults = await searchService.search('whitewash waiver', 'takeovers');
      
      // Combine results, removing duplicates
      const combinedResults = [...takeoversResults];
      
      for (const whitewashResult of whitewashResults) {
        if (!combinedResults.some(result => result.id === whitewashResult.id)) {
          combinedResults.push(whitewashResult);
        }
      }
      
      console.log(`Found ${combinedResults.length} takeovers code documents related to whitewash waivers`);
      return combinedResults;
    }
    
    console.log(`Found ${takeoversResults.length} general offer takeovers code documents`);
    return takeoversResults;
  },
  
  /**
   * Find all takeover documents relevant to the query
   * Used in the sequential search process
   */
  findTakeoverDocuments: async (query: string): Promise<RegulatoryEntry[]> => {
    console.log('Searching for all relevant takeovers code documents');
    
    // Search directly in the takeovers category
    const takeoversResults = await searchService.search(query, 'takeovers');
    
    // Check for specific takeover keywords in the query
    const takeoversKeywords = [
      'takeover', 'take over', 'takeovers', 'offer', 'offers', 'offeror', 
      'offeree', 'mandatory', 'whitewash', 'waiver', 'concert'
    ];
    
    const containsTakeoverKeywords = takeoversKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // If the query contains takeover keywords but we didn't find results, do a broader search
    if (containsTakeoverKeywords && takeoversResults.length === 0) {
      console.log('Query contains takeover keywords but no results found, doing broader search');
      
      // Find relevant takeover rule numbers
      const relevantRuleNumbers = findRelevantTakeoverRules(query);
      
      // If we found relevant rule numbers, search for them specifically
      if (relevantRuleNumbers.length > 0) {
        console.log(`Found relevant takeover rule numbers: ${relevantRuleNumbers.join(', ')}`);
        
        // Search for each rule number
        const ruleResults = await Promise.all(
          relevantRuleNumbers.map(ruleNum => searchService.search(ruleNum, 'takeovers'))
        );
        
        // Flatten the results
        const flattenedRuleResults = ruleResults.flat();
        
        // Combine with previous results
        const combinedResults = [...takeoversResults];
        
        // Add unique entries
        for (const ruleResult of flattenedRuleResults) {
          if (!combinedResults.some(result => result.id === ruleResult.id)) {
            combinedResults.push(ruleResult);
          }
        }
        
        console.log(`Found ${combinedResults.length} takeovers code documents (including rule numbers)`);
        return combinedResults;
      }
    }
    
    console.log(`Found ${takeoversResults.length} takeovers code documents`);
    return takeoversResults;
  },

  /**
   * Add whitewash fallback document if needed for whitewash queries
   */
  addWhitewashFallbackIfNeeded: (results: RegulatoryEntry[], isWhitewashQuery: boolean): RegulatoryEntry[] => {
    if (isWhitewashQuery && results.length < 2) {
      console.log('Adding whitewash waiver fallback document');
      return [...results, getWhitewashWaiverFallbackEntry()];
    }
    return results;
  },

  /**
   * Add general offer timetable fallback if needed
   */
  addGeneralOfferTimetableFallback: (results: RegulatoryEntry[], query: string, isGeneralOffer: boolean): RegulatoryEntry[] => {
    const lowerQuery = query.toLowerCase();
    const isTimetableQuery = lowerQuery.includes('timetable') || 
                            lowerQuery.includes('timeline') || 
                            lowerQuery.includes('schedule');

    if (isGeneralOffer && isTimetableQuery && results.length < 2) {
      console.log('Adding general offer timetable fallback');
      
      // Create a fallback general offer timetable document
      const timetableFallback: RegulatoryEntry = {
        id: `general-offer-timetable-${Date.now()}`,
        title: "General Offer Timetable",
        content: "A general offer timetable under the Hong Kong Takeovers Code typically follows these steps: " + 
                "Day 0: Announcement of firm intention to make an offer. " +
                "Day 21 (latest): Posting of offer document to shareholders. " +
                "Day 28: Earliest first closing date (offer must be open for at least 21 days from posting). " +
                "Day 39: Target board's latest date to provide updated financial information or profit forecast. " +
                "Day 60: Final deadline for all offer conditions to be satisfied or waived. " +
                "Day 81: Final deadline for offer to become or be declared unconditional as to acceptances.",
        category: "takeovers",
        source: "Takeovers Code",
        lastUpdated: new Date(),
        status: "active"
      };
      
      return [...results, timetableFallback];
    }
    
    return results;
  }
};

/**
 * Find relevant takeover rule numbers based on query content
 */
function findRelevantTakeoverRules(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const ruleMap: Record<string, string[]> = {
    'mandatory': ['Rule 26', 'Rule 26.1'],
    'whitewash': ['Whitewash Waiver', 'Rule 26 Waiver'],
    'concert parties': ['Rule 26.1'],
    'offer period': ['Rule 2'],
    'general offer': ['Rule 26'],
    'partial offer': ['Rule 28'],
    'disclosure': ['Rule 3'],
    'frustration': ['Rule 4'],
    'special deals': ['Rule 25'],
    'chain principle': ['Rule 26.1']
  };
  
  const relevantRules: string[] = [];
  
  for (const [keyword, rules] of Object.entries(ruleMap)) {
    if (lowerQuery.includes(keyword)) {
      relevantRules.push(...rules);
    }
  }
  
  return [...new Set(relevantRules)]; // Remove duplicates
}
