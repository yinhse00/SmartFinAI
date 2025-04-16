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
   * Execute specialized search for listing rules regarding rights issues
   */
  findSpecificRulesDocuments: async (query: string) => {
    let ruleResults = [];
    
    // Check for specific rule references
    const ruleMatches = query.match(/rule\s+(\d+\.\d+[A-Z]?|10\.29|7\.19A?)/i);
    
    if (ruleMatches) {
      const ruleNumber = ruleMatches[1];
      console.log(`Found reference to Rule ${ruleNumber}, searching specifically`);
      
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
    
    // Special case for rights issue aggregate requirement fallback
    if (query.toLowerCase().includes('rights issue') && 
        (query.toLowerCase().includes('aggregate') || query.toLowerCase().includes('aggregation')) &&
        enhancedResults.length < 2) {
      console.log("Adding fallback for rights issue aggregation requirements");
      enhancedResults.push({
        title: "Rights Issue Aggregation Requirements",
        source: "Listing Rules Rule 7.19A",
        content: "Under Listing Rule 7.19A(1), if a rights issue, when aggregated with any other rights issues, open offers, and specific mandate placings announced by the issuer within the previous 12 months, would increase the number of issued shares by more than 50%, the rights issue must be made conditional on approval by shareholders at general meeting by resolution on which any controlling shareholders shall abstain from voting in favor. Where there is no controlling shareholder, directors and chief executive must abstain from voting in favor. Aggregation applies to multiple corporate actions within a 12-month period.",
        category: "listing_rules"
      });
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
