import { GrokRequestParams } from '@/types/grok';
import { searchService } from '../../database/searchService';

/**
 * Enhances query context with relevant regulatory information
 */
export const contextEnhancer = {
  /**
   * Enhance context with rule or chapter specific information
   */
  enhanceWithRuleContext: async (params: GrokRequestParams): Promise<GrokRequestParams> => {
    // Check if the query contains references to specific rules or chapters
    const ruleMatches = params.prompt.match(/rule\s+(\d+\.\d+[A-Z]?\(\d+\)?)/i) || 
                       params.prompt.match(/rule\s+(\d+\.\d+[A-Z]?)/i) || 
                       params.prompt.match(/rule\s+(\d+)/i) ||
                       params.prompt.match(/chapter\s+(\d+)/i) || 
                       params.prompt.match(/lb_chapter\s+(\d+)/i) ||
                       params.prompt.match(/mb\s+rule\s+(\d+\.\d+[A-Z]?\(\d+\)?)/i) ||
                       params.prompt.match(/gem\s+rule\s+(\d+\.\d+[A-Z]?\(\d+\)?)/i);
    
    if (ruleMatches) {
      // Extract the rule or chapter number
      const ruleNumber = ruleMatches[1];
      console.log(`Detected reference to Rule/Chapter ${ruleNumber}, searching for specific regulatory information`);
      
      // Search both in-memory database and reference documents
      const comprehensiveResults = await searchService.searchComprehensive(ruleNumber);
      
      // If we found matching database entries, add their content to the context
      if (comprehensiveResults.databaseEntries.length > 0) {
        console.log(`Found ${comprehensiveResults.databaseEntries.length} database entries matching Rule/Chapter ${ruleNumber}. Reference document search is disabled.`);
        
        // Add specific note about prioritizing database information
        const priorityNote = "NOTE: When information conflicts, prioritize the database entries.";
        
        // Create enhanced context from database entries
        const enhancedContext = `${priorityNote}\n\n--- DATABASE ENTRIES ---\n\n`;
        
        const databaseContext = comprehensiveResults.databaseEntries
          .map(entry => `[${entry.title} | ${entry.source}]:\n${entry.content}`)
          .join('\n\n---\n\n');
          
        const fullContext = enhancedContext + 
                          (databaseContext.length > 0 ? databaseContext : "No direct database entries found.");
                          
        params.regulatoryContext = fullContext;
      }
    }
    
    // Special handling for rights issue aggregation questions - enhanced with more details
    if (params.prompt.toLowerCase().includes('rights issue') && 
        (params.prompt.toLowerCase().includes('aggregate') || 
         params.prompt.toLowerCase().includes('within 12 months') ||
         params.prompt.toLowerCase().includes('previous'))) {
      
      console.log('Detected rights issue aggregation query, enhancing context with Rule 7.19A information');
      
      // Specifically search for Rule 7.19A
      const aggregationResults = await searchService.search('rule 7.19A aggregation requirements', 'listing_rules');
      
      if (aggregationResults.length > 0) {
        console.log(`Found ${aggregationResults.length} results for Rule 7.19A aggregation`);
        
        // Create enhanced context specifically for aggregation
        const aggregationContext = aggregationResults
          .map(entry => `[${entry.title} | ${entry.source}]:\n${entry.content}`)
          .join('\n\n---\n\n');
          
        // Add aggregation context to existing context or create new context
        if (params.regulatoryContext) {
          params.regulatoryContext = aggregationContext + '\n\n---\n\n' + params.regulatoryContext;
        } else {
          params.regulatoryContext = aggregationContext;
        }
        
        // Add enhanced fallback information for Rule 7.19A if not found in results
        if (!params.regulatoryContext.includes('7.19A')) {
          const rule719aFallback = `[Rights Issue Aggregation Requirements | Listing Rules Rule 7.19A]:
Under Listing Rule 7.19A(1), if a rights issue, when aggregated with any other rights issues, open offers, and specific mandate placings announced by the issuer within the previous 12 months, would increase the number of issued shares by more than 50%, the rights issue must be made conditional on approval by shareholders at general meeting by resolution on which any controlling shareholders shall abstain from voting in favor. Where there is no controlling shareholder, directors and chief executive must abstain from voting in favor. 

The 50% threshold applies to the aggregate increase over the 12-month period, not to each individual corporate action. Previous approval of one rights issue does not exempt subsequent rights issues from the aggregation calculation. Each new rights issue must be assessed based on the cumulative effect of all rights issues within the rolling 12-month period.

For example, if a company has already conducted a 1-for-1 rights issue (100% increase) with proper shareholders' approval, a subsequent 1-for-5 rights issue (20% increase) within 12 months would need to be assessed based on the aggregated increase from both issues. Independent shareholders' approval would be required for each rights issue that, when aggregated with previous issues within 12 months, exceeds the 50% threshold.`;
          
          if (params.regulatoryContext) {
            params.regulatoryContext = rule719aFallback + '\n\n---\n\n' + params.regulatoryContext;
          } else {
            params.regulatoryContext = rule719aFallback;
          }
        }
      }
    }
    
    return params;
  },

  /**
   * Enhance context with whitewash waiver information
   */
  enhanceWithWhitewashContext: async (params: GrokRequestParams, isWhitewashQuery: boolean): Promise<GrokRequestParams> => {
    // If this is a whitewash query but we don't have the takeovers code or whitewash info in context
    if (isWhitewashQuery && !params.regulatoryContext?.toLowerCase().includes('whitewash')) {
      console.log('Query involves whitewash waiver, but context lacks specific information, searching for it');
      
      const whitewashDocs = await searchService.search("whitewash waiver dealing requirements", "takeovers");
      
      if (whitewashDocs.length > 0) {
        console.log('Found whitewash waiver documents, adding to context');
        const additionalContext = whitewashDocs
          .map(doc => `[${doc.title} | ${doc.source}]:\n${doc.content}`)
          .join('\n\n---\n\n');
        
        if (params.regulatoryContext) {
          params.regulatoryContext = additionalContext + '\n\n---\n\n' + params.regulatoryContext;
        } else {
          params.regulatoryContext = additionalContext;
        }
      } else {
        // If no whitewash docs found, add fallback info
        const whitewashFallback = `[Whitewash Waiver Dealing Requirements | Takeovers Code Note 1 to Rule 32]:
When a waiver from a mandatory general offer obligation under Rule 26 is granted (whitewash waiver), neither the potential controlling shareholders nor any person acting in concert with them may deal in the securities of the company during the period between the announcement of the proposals and the completion of the subscription. The Executive will not normally waive an obligation under Rule 26 if the potential controlling shareholders or their concert parties have acquired voting rights in the company in the 6 months prior to the announcement of the proposals but subsequent to negotiations with the directors of the company.`;
        
        if (params.regulatoryContext) {
          params.regulatoryContext = whitewashFallback + '\n\n---\n\n' + params.regulatoryContext;
        } else {
          params.regulatoryContext = whitewashFallback;
        }
      }
    }
    
    return params;
  },

  /**
   * Enhance context with trading arrangement documents
   */
  enhanceWithTradingArrangements: async (params: GrokRequestParams, isTradingArrangement: boolean, hasTradeArrangementInfo: boolean): Promise<GrokRequestParams> => {
    // If this is a trading arrangement query but we don't have the Trading Arrangement document,
    // attempt to find it specifically
    if (isTradingArrangement && !hasTradeArrangementInfo) {
      console.log('Attempting to find Trading Arrangement document specifically');
      const tradingDocs = await searchService.searchByTitle("Trading Arrangements");
      
      if (tradingDocs.length > 0) {
        console.log('Found Trading Arrangement document, adding to context');
        // Add the trading arrangement document to the context
        const additionalContext = tradingDocs
          .map(doc => `[${doc.title} | ${doc.source}]:\n${doc.content}`)
          .join('\n\n---\n\n');
        
        if (params.regulatoryContext) {
          params.regulatoryContext = additionalContext + '\n\n---\n\n' + params.regulatoryContext;
        } else {
          params.regulatoryContext = additionalContext;
        }
      }
    }
    
    return params;
  }
};
