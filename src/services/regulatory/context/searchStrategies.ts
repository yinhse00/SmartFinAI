
import { searchService } from '../../databaseService';
import { isWhitewashWaiverQuery, isGeneralOfferQuery, isTradingArrangementQuery, isCorporateActionQuery } from '../utils/queryDetector';
import { getWhitewashWaiverFallbackEntry } from '../fallbacks/whitewashFallback';

/**
 * Module for specialized search strategies
 */
export const searchStrategies = {
  /**
   * Execute specialized search for general offer queries
   */
  findGeneralOfferDocuments: async (normalizedQuery: string, isWhitewashQuery: boolean) => {
    let takeoversResults = [];

    console.log('Identified as general offer query - specifically searching for Takeovers Code documents');
    
    // First, specifically check for the takeovers and mergers code PDF
    const takeoversCodeResults = await searchService.searchByTitle("codes on takeovers and mergers and share buy backs");
    if (takeoversCodeResults.length > 0) {
      console.log('Found specific "codes on takeovers and mergers and share buy backs.pdf" document');
      takeoversResults = [...takeoversCodeResults];
    }
    
    // Direct search in takeovers category
    const categoryResults = await searchService.search(normalizedQuery, 'takeovers');
    console.log(`Found ${categoryResults.length} Takeovers Code documents by category search`);
    takeoversResults = [...takeoversResults, ...categoryResults];
    
    // If direct search didn't yield results, try content search with specific terms
    if (takeoversResults.length === 0) {
      takeoversResults = await searchService.search("general offer mandatory takeovers code", "takeovers");
      console.log(`Found ${takeoversResults.length} results from takeovers keyword search`);
    }
    
    // Special handling for whitewash waiver queries
    if (isWhitewashQuery) {
      const whitewashResults = await searchService.search("whitewash waiver dealing requirements", "takeovers");
      console.log(`Found ${whitewashResults.length} whitewash waiver specific results`);
      
      // Add whitewash-specific documents to results
      takeoversResults = [...takeoversResults, ...whitewashResults];
    }
    
    return takeoversResults;
  },

  /**
   * Execute specialized search for trading arrangement documents
   */
  findTradingArrangementDocuments: async (normalizedQuery: string, isCorporateAction: boolean) => {
    let tradingArrangementsResults = [];
    
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
   * Execute fallback search for timetables
   */
  findTimetableDocuments: async (query: string, isGeneralOffer: boolean) => {
    let timetableResults = [];
    
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
   * Add special fallback documents when necessary
   */
  addFallbackDocumentsIfNeeded: (results: any[], query: string, isWhitewashQuery: boolean, isGeneralOffer: boolean) => {
    let enhancedResults = [...results];
    
    // For whitewash waiver queries, ensure we have dealing requirements information
    if (isWhitewashQuery && !results.some(result => 
        result.content.toLowerCase().includes('dealing') && 
        result.content.toLowerCase().includes('whitewash'))) {
      console.log("Adding specific whitewash waiver dealing requirements");
      enhancedResults.push(getWhitewashWaiverFallbackEntry());
    }
    
    // Special case for general offer timetable - add fallback if needed
    if (isGeneralOffer && 
        (query.toLowerCase().includes('timetable') || 
         query.toLowerCase().includes('schedule') ||
         query.toLowerCase().includes('timeline')) &&
        enhancedResults.length < 2) {
      console.log("Enhancing general offer timetable context with fallback information");
      enhancedResults.push({
        title: "General Offer Timetable",
        source: "Takeovers Code Rule 15",
        content: "A general offer timetable under the Takeovers Code begins with the Rule 3.5 announcement and must specify a closing date not less than 21 days from the date the offer document is posted. All conditions must be satisfied within 60 days from the offer document posting, unless extended by the Executive.",
        category: "takeovers"
      });
    }
    // Special case for rights issue timetables if needed
    else if (query.toLowerCase().includes('rights issue') && 
        (query.toLowerCase().includes('timetable') || 
         query.toLowerCase().includes('schedule') ||
         query.toLowerCase().includes('timeline')) &&
        enhancedResults.length < 2) {
      console.log("Enhancing rights issue timetable context with fallback information");
      enhancedResults.push({
        title: "Rights Issue Timetable",
        source: "Listing Rules Chapter 10",
        content: "Rights issue timetables typically follow a structured timeline from announcement to dealing day. Key dates include record date, PAL dispatch, rights trading period, and acceptance deadline.",
        category: "listing_rules"
      });
    }
    
    return enhancedResults;
  }
};
