
import { GrokRequestParams } from '@/types/grok';
import { searchService } from '../../databaseService';

/**
 * Enhances query context with relevant regulatory information
 */
export const contextEnhancer = {
  /**
   * Enhance context with rule or chapter specific information
   */
  enhanceWithRuleContext: async (params: GrokRequestParams): Promise<GrokRequestParams> => {
    // Check if the query contains references to specific rules or chapters
    const ruleMatches = params.prompt.match(/rule\s+(\d+(\.\d+)*)/i) || 
                       params.prompt.match(/chapter\s+(\d+)/i) || 
                       params.prompt.match(/lb_chapter\s+(\d+)/i);
    
    if (ruleMatches) {
      // Extract the rule or chapter number
      const ruleNumber = ruleMatches[1];
      console.log(`Detected reference to Rule/Chapter ${ruleNumber}, searching for specific regulatory information`);
      
      // Search both in-memory database and reference documents
      const comprehensiveResults = await searchService.searchComprehensive(ruleNumber);
      
      // If we found matching reference documents, add their content to the context
      if (comprehensiveResults.referenceDocuments.length > 0) {
        console.log(`Found ${comprehensiveResults.referenceDocuments.length} reference documents matching Rule/Chapter ${ruleNumber}`);
        
        // Extract additional context from reference documents
        const referenceContext = comprehensiveResults.referenceDocuments
          .map(doc => `[${doc.title} | Reference Document]:\n${doc.description || "No detailed content available. Please check the reference document directly."}`)
          .join('\n\n---\n\n');
        
        // Add specific note about prioritizing database information
        const priorityNote = "NOTE: When information conflicts, prioritize the database entries over reference documents.";
        
        // Create enhanced context from both sources
        const enhancedContext = `${priorityNote}\n\n--- DATABASE ENTRIES ---\n\n`;
        
        // Add database entries first (prioritized)
        const databaseContext = comprehensiveResults.databaseEntries
          .map(entry => `[${entry.title} | ${entry.source}]:\n${entry.content}`)
          .join('\n\n---\n\n');
          
        // Combine the contexts
        const fullContext = enhancedContext + 
                          (databaseContext.length > 0 ? databaseContext : "No direct database entries found.") + 
                          "\n\n--- REFERENCE DOCUMENTS ---\n\n" + 
                          referenceContext;
                          
        params.regulatoryContext = fullContext;
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
