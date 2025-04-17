
import { contextService } from '@/services/regulatory/contextService';
import { summaryIndexService } from '@/services/database/summaryIndexService';

/**
 * Hook for retrieving regulatory context
 */
export const useContextRetrieval = () => {
  const retrieveRegulatoryContext = async (
    queryText: string,
    isFaqQuery: boolean
  ) => {
    let regulatoryContext = '';
    let reasoning = '';
    let contextTime = 0;
    let usedSummaryIndex = false;
    
    try {
      const contextStart = Date.now();
      
      // Step 1: Check Summary and Keyword Index first for faster lookup
      console.log('Checking Summary and Keyword Index for quick matches...');
      const summaryResult = await summaryIndexService.findRelevantSummary(queryText);
      
      if (summaryResult.found) {
        console.log('Found relevant match in Summary Index');
        regulatoryContext = summaryResult.context || '';
        reasoning = 'Retrieved from Summary and Keyword Index for faster processing';
        usedSummaryIndex = true;
      } else {
        // Step 2: If no match in Summary Index, perform comprehensive search
        console.log('No match in Summary Index, performing comprehensive database search');
        const contextResult = await contextService.getComprehensiveRegulatoryContext(queryText);
        regulatoryContext = contextResult.context || '';
        reasoning = contextResult.reasoning || '';
      }
      
      contextTime = Date.now() - contextStart;
      
      // For FAQ queries, ensure we've searched across multiple potential sources
      if (isFaqQuery) {
        console.log('FAQ query detected, performing thorough database search for all relevant FAQ content');
        
        // If initial search didn't yield strong FAQ content, try multiple search strategies
        if (!regulatoryContext.toLowerCase().includes('faq') && 
            !regulatoryContext.toLowerCase().includes('continuing obligation')) {
          console.log('Initial search didn\'t find specific FAQ content, trying specialized search');
          
          // Try with multiple variants of the FAQ search query
          const faqSearchQueries = [
            "10.4 FAQ Continuing Obligations",
            "FAQ continuing obligations",
            "continuing obligations FAQ",
            "10.4 FAQ"
          ];
          
          for (const faqQuery of faqSearchQueries) {
            console.log(`Trying specialized FAQ search with query: ${faqQuery}`);
            const faqContextResult = await contextService.getRegulatoryContextWithReasoning(faqQuery);
            
            if (faqContextResult.context && 
              (faqContextResult.context.toLowerCase().includes('faq') || 
                faqContextResult.context.toLowerCase().includes('continuing obligation'))) {
              console.log('Found FAQ content in specialized search, using this context');
              regulatoryContext = faqContextResult.context;
              reasoning = "This context is from the '10.4 FAQ Continuing Obligations' document which contains the exact wording needed for accurate answers.";
              break;
            }
          }
        }
      }
    } catch (contextError) {
      // If context retrieval fails, log it but continue with empty context
      console.error("Error retrieving context:", contextError);
      regulatoryContext = '';
      reasoning = 'Failed to retrieve context due to an error';
    }
    
    return { regulatoryContext, reasoning, contextTime, usedSummaryIndex };
  };

  return { retrieveRegulatoryContext };
};
