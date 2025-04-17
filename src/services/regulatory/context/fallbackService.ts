
import { aggregationSearchService } from './aggregationSearchService';
import { takeoversSearchService } from './takeoversSearchService';
import { tradingArrangementsService } from './tradingArrangementsService';

/**
 * Service for handling fallback document scenarios
 */
export const fallbackService = {
  /**
   * Add special fallback documents when necessary
   */
  addFallbackDocumentsIfNeeded: (results: any[], query: string, isWhitewashQuery: boolean, isGeneralOffer: boolean) => {
    let enhancedResults = [...results];
    
    // Add whitewash fallback if needed
    enhancedResults = takeoversSearchService.addWhitewashFallbackIfNeeded(enhancedResults, isWhitewashQuery);
    
    // Special case for rights issue aggregate requirement fallback
    if (query.toLowerCase().includes('rights issue') && 
        (query.toLowerCase().includes('aggregate') || query.toLowerCase().includes('aggregation')) &&
        enhancedResults.length < 2) {
      console.log("Adding fallback for rights issue aggregation requirements");
      const aggregationDocs = await aggregationSearchService.findAggregationDocuments(query);
      enhancedResults = [...enhancedResults, ...aggregationDocs];
    }
    
    // Add general offer timetable fallback if needed
    enhancedResults = takeoversSearchService.addGeneralOfferTimetableFallback(enhancedResults, query, isGeneralOffer);
    
    // Add rights issue timetable fallback if needed
    enhancedResults = tradingArrangementsService.addRightsIssueTimetableFallback(enhancedResults, query);
    
    return enhancedResults;
  }
};
