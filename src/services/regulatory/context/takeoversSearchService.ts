
import { RegulatoryEntry } from '../../database/types';
import { searchService } from '../../databaseService';
import { getWhitewashWaiverFallbackEntry } from '../fallbacks/whitewashFallback';

/**
 * Service for takeovers and general offer searches
 */
export const takeoversSearchService = {
  /**
   * Find documents related to general offers
   */
  findGeneralOfferDocuments: async (normalizedQuery: string, isWhitewashQuery: boolean): Promise<RegulatoryEntry[]> => {
    let takeoversResults: RegulatoryEntry[] = [];

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
   * Add whitewash-specific fallback if necessary
   */
  addWhitewashFallbackIfNeeded: (results: RegulatoryEntry[], isWhitewashQuery: boolean): RegulatoryEntry[] => {
    let enhancedResults = [...results];
    
    // For whitewash waiver queries, ensure we have dealing requirements information
    if (isWhitewashQuery && !results.some(result => 
        result.content.toLowerCase().includes('dealing') && 
        result.content.toLowerCase().includes('whitewash'))) {
      console.log("Adding specific whitewash waiver dealing requirements");
      enhancedResults.push(getWhitewashWaiverFallbackEntry());
    }
    
    return enhancedResults;
  },
  
  /**
   * Add general offer timetable fallback if necessary
   */
  addGeneralOfferTimetableFallback: (results: RegulatoryEntry[], query: string, isGeneralOffer: boolean): RegulatoryEntry[] => {
    let enhancedResults = [...results];
    
    // Special case for general offer timetable - add fallback if needed
    if (isGeneralOffer && 
        (query.toLowerCase().includes('timetable') || 
        query.toLowerCase().includes('schedule') ||
        query.toLowerCase().includes('timeline')) &&
        enhancedResults.length < 2) {
      console.log("Enhancing general offer timetable context with fallback information");
      enhancedResults.push({
        id: 'fallback-general-offer-timetable',
        title: "General Offer Timetable",
        source: "Takeovers Code Rule 15",
        content: "A general offer timetable under the Takeovers Code begins with the Rule 3.5 announcement and must specify a closing date not less than 21 days from the date the offer document is posted. All conditions must be satisfied within 60 days from the offer document posting, unless extended by the Executive.",
        category: "takeovers",
        lastUpdated: new Date(),
        status: 'active'
      });
    }
    
    return enhancedResults;
  }
};
