
import { RegulatoryEntry } from '../../database/types';
import { searchService } from '../../databaseService';

/**
 * Service for trading arrangement searches
 */
export const tradingArrangementsService = {
  /**
   * Find documents related to trading arrangements
   */
  findTradingArrangementDocuments: async (normalizedQuery: string, isCorporateAction: boolean): Promise<RegulatoryEntry[]> => {
    let tradingArrangementsResults: RegulatoryEntry[] = [];
    
    if (isCorporateAction) {
      console.log('Identified as corporate action trading arrangement query');
      
      // Direct search for Trading Arrangement document by title
      tradingArrangementsResults = await searchService.searchByTitle("Trading Arrangements");
      console.log(`Found ${tradingArrangementsResults.length} Trading Arrangement documents by title search`);
      
      // If title search didn't yield results, try content search
      if (tradingArrangementsResults.length === 0) {
        tradingArrangementsResults = await searchService.search("trading arrangement corporate action", "listing_rules");
        console.log(`Found ${tradingArrangementsResults.length} results from trading arrangement keyword search`);
      }
    }
    
    return tradingArrangementsResults;
  },
  
  /**
   * Find timetable-related documents
   */
  findTimetableDocuments: async (query: string, isGeneralOffer: boolean): Promise<RegulatoryEntry[]> => {
    let timetableResults: RegulatoryEntry[] = [];
    
    if (isGeneralOffer) {
      // Special handling for general offer timetable requests
      timetableResults = await searchService.search('general offer timetable takeovers', 'takeovers');
      console.log(`Found ${timetableResults.length} results using 'general offer timetable' keyword`);
    } else {
      // Default to rights issue timetable info for other timetable requests
      timetableResults = await searchService.search('rights issue timetable', 'listing_rules');
      console.log(`Found ${timetableResults.length} results using 'rights issue timetable' keyword`);
    }
    
    return timetableResults;
  },
  
  /**
   * Add rights issue timetable fallback if necessary
   */
  addRightsIssueTimetableFallback: (results: RegulatoryEntry[], query: string): RegulatoryEntry[] => {
    let enhancedResults = [...results];
    
    // Special case for rights issue timetables if needed
    if (query.toLowerCase().includes('rights issue') && 
        (query.toLowerCase().includes('timetable') || 
         query.toLowerCase().includes('schedule') ||
         query.toLowerCase().includes('timeline')) &&
        enhancedResults.length < 2) {
      console.log("Enhancing rights issue timetable context with fallback information");
      enhancedResults.push({
        id: 'fallback-rights-issue-timetable',
        title: "Rights Issue Timetable",
        source: "Listing Rules Chapter 10",
        content: "Rights issue timetables typically follow a structured timeline from announcement to dealing day. Key dates include record date, PAL dispatch, rights trading period, and acceptance deadline.",
        category: "listing_rules",
        lastUpdated: new Date(),
        status: 'active'
      });
    }
    
    return enhancedResults;
  }
};
