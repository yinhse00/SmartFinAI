
import { RegulatoryEntry } from '../../database/types';
import { searchService } from '../../databaseService';
import { GUIDE_COVERED_ACTIONS } from '../../constants/financialConstants';

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
      
      // Direct search for Trading Arrangement guide by title
      tradingArrangementsResults = await searchService.searchByTitle("Guide on Trading Arrangements");
      console.log(`Found ${tradingArrangementsResults.length} Trading Arrangement documents by title search`);
      
      // If title search didn't yield results, try content search
      if (tradingArrangementsResults.length === 0) {
        tradingArrangementsResults = await searchService.search("guide on trading arrangements for selected types of corporate actions", "listing_rules");
        console.log(`Found ${tradingArrangementsResults.length} results from trading arrangement keyword search`);
      }
      
      // If still no results, try specific corporate action type
      if (tradingArrangementsResults.length === 0) {
        // Extract corporate action type from query
        const corporateActionType = extractCorporateActionType(normalizedQuery);
        if (corporateActionType) {
          tradingArrangementsResults = await searchService.search(`trading arrangements ${corporateActionType}`, "listing_rules");
          console.log(`Found ${tradingArrangementsResults.length} results using '${corporateActionType}' keyword`);
        }
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
      // Try to determine specific corporate action type
      const corporateActionType = extractCorporateActionType(query.toLowerCase());
      
      if (corporateActionType) {
        // Search for timetable info for specific corporate action
        timetableResults = await searchService.search(`${corporateActionType} timetable`, 'listing_rules');
        console.log(`Found ${timetableResults.length} results using '${corporateActionType} timetable' keyword`);
      }
      
      // If no specific results, default to rights issue timetable
      if (timetableResults.length === 0) {
        timetableResults = await searchService.search('rights issue timetable', 'listing_rules');
        console.log(`Found ${timetableResults.length} results using 'rights issue timetable' keyword`);
      }
    }
    
    return timetableResults;
  },
  
  /**
   * Add trading arrangements guide reference if necessary
   */
  addTradingArrangementGuideReference: (results: RegulatoryEntry[], queryType: string): RegulatoryEntry[] => {
    let enhancedResults = [...results];
    
    // Add trading arrangements guide reference for covered corporate actions
    if (GUIDE_COVERED_ACTIONS.includes(queryType) && 
        !results.some(r => r.title.toLowerCase().includes('trading arrangements'))) {
      console.log("Adding trading arrangements guide reference");
      enhancedResults.push({
        id: 'guide-trading-arrangements',
        title: "Guide on Trading Arrangements for Selected Types of Corporate Actions",
        source: "HKEX",
        content: "This guide covers trading arrangements for rights issues, open offers, share consolidations or sub-divisions, changes in board lot size, and changes of company name or addition of Chinese name. It outlines the standard execution process and timetables approved by HKEX.",
        category: "listing_rules",
        lastUpdated: new Date(),
        status: 'active'
      });
    }
    
    return enhancedResults;
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

/**
 * Extract corporate action type from query
 * @param query The normalized query
 * @returns Corporate action type or undefined
 */
function extractCorporateActionType(query: string): string | undefined {
  if (query.includes('rights issue')) {
    return 'rights issue';
  }
  if (query.includes('open offer')) {
    return 'open offer';
  }
  if (query.includes('share consolidation') || query.includes('sub-division') || query.includes('subdivision')) {
    return 'share consolidation';
  }
  if (query.includes('board lot') || query.includes('lot size')) {
    return 'board lot change';
  }
  if (query.includes('company name') || query.includes('chinese name')) {
    return 'company name change';
  }
  return undefined;
}
