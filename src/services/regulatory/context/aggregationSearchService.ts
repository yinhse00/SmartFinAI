
import { searchService } from '../../databaseService';
import { RegulatoryEntry } from '../../database/types';

/**
 * Service for rights issue aggregation searches
 */
export const aggregationSearchService = {
  /**
   * Find documents related to rights issue aggregation
   */
  findAggregationDocuments: async (query: string): Promise<RegulatoryEntry[]> => {
    // Check if this is a rights issue aggregation query
    const isAggregationQuery = query.toLowerCase().includes('rights issue') && 
      (query.toLowerCase().includes('aggregate') || 
      query.toLowerCase().includes('within 12 months') ||
      query.toLowerCase().includes('previous'));
    
    if (isAggregationQuery) {
      console.log('Detected rights issue aggregation query, prioritizing Rule 7.19A information');
      const aggregationResults = await searchService.search('rule 7.19A aggregation requirements', 'listing_rules');
      console.log(`Found ${aggregationResults.length} results for Rule 7.19A aggregation`);
      
      // If no specific results found, add fallback
      if (aggregationResults.length === 0) {
        return [{
          id: 'fallback-aggregation-7.19A',
          title: "Rights Issue Aggregation Requirements",
          source: "Listing Rules Rule 7.19A",
          content: "Under Listing Rule 7.19A(1), if a rights issue, when aggregated with any other rights issues, open offers, and specific mandate placings announced by the issuer within the previous 12 months, would increase the number of issued shares by more than 50%, the rights issue must be made conditional on approval by shareholders at general meeting by resolution on which any controlling shareholders shall abstain from voting in favor. Where there is no controlling shareholder, directors and chief executive must abstain from voting in favor. The 50% threshold applies to the aggregate increase over the 12-month period, not to each individual corporate action.",
          category: "listing_rules",
          lastUpdated: new Date(),
          status: 'active'
        }];
      }
      
      return aggregationResults;
    }
    
    return [];
  }
};
