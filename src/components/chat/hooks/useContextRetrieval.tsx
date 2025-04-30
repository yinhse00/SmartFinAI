
import { contextService } from '@/services/regulatory/contextService';
import { summaryIndexService } from '@/services/database/summaryIndexService';
import { extractKeyTerms } from '@/services/database/utils/textProcessing';
import { structuredContextService } from '@/services/regulatory/structuredContextService';

/**
 * Hook for retrieving regulatory context with enhanced accuracy
 */
export const useContextRetrieval = () => {
  const retrieveRegulatoryContext = async (
    queryText: string,
    isFaqQuery: boolean = false
  ) => {
    let regulatoryContext = '';
    let reasoning = '';
    let contextTime = 0;
    let usedSummaryIndex = false;
    let searchStrategy = 'general';
    
    try {
      const contextStart = Date.now();
      
      // Enhanced query analysis to improve search accuracy
      const queryTerms = extractKeyTerms(queryText.toLowerCase());
      const containsChapterReference = Boolean(queryText.match(/chapter\s+\d+/i));
      const containsRuleReference = Boolean(queryText.match(/rule\s+\d+(\.\d+)?/i));
      const isDefinitionQuery = queryText.toLowerCase().includes('what is') || 
                               queryText.toLowerCase().includes('definition');
      
      console.log('Query analysis:', {
        queryTerms,
        containsChapterReference,
        containsRuleReference,
        isDefinitionQuery,
        isFaqQuery
      });
      
      // STEP 0: Try the structured database first (NEW)
      try {
        console.log('Checking structured database for relevant provisions...');
        
        // For definition queries, use the specialized definition context service
        if (isDefinitionQuery) {
          const definitionContext = await structuredContextService.getDefinitionContext(queryText);
          
          if (definitionContext.context) {
            regulatoryContext = definitionContext.context;
            reasoning = definitionContext.reasoning;
            searchStrategy = 'structured-definition';
            contextTime = Date.now() - contextStart;
            return { regulatoryContext, reasoning, contextTime, usedSummaryIndex, searchStrategy };
          }
        }
        
        // For regular queries, use the standard structured context service
        const structuredResult = await structuredContextService.getRegulatoryContext(queryText);
        
        if (structuredResult.context) {
          regulatoryContext = structuredResult.context;
          reasoning = structuredResult.reasoning;
          searchStrategy = 'structured-database';
          contextTime = Date.now() - contextStart;
          return { regulatoryContext, reasoning, contextTime, usedSummaryIndex, searchStrategy };
        }
      } catch (structuredError) {
        console.error("Error using structured database:", structuredError);
        // Continue to fallback methods below
      }
      
      // Step 1: Check Summary and Keyword Index first for faster lookup
      console.log('Checking Summary and Keyword Index for quick matches...');
      
      // Use more targeted summary search based on query characteristics
      let summaryResult;
      
      if (containsChapterReference || containsRuleReference) {
        // For queries with specific references, use specialized search
        searchStrategy = 'reference-based';
        summaryResult = await summaryIndexService.findRelevantSummaryByReference(queryText);
      } else {
        // Standard summary search
        summaryResult = await summaryIndexService.findRelevantSummary(queryText);
      }
      
      if (summaryResult.found) {
        console.log(`Found relevant match in Summary Index using ${searchStrategy} strategy`);
        regulatoryContext = summaryResult.context || '';
        reasoning = `Retrieved from Summary and Keyword Index using ${searchStrategy} strategy for faster and more accurate processing`;
        usedSummaryIndex = true;
      } else {
        // Step 2: If no match in Summary Index, perform comprehensive search
        console.log('No match in Summary Index, performing comprehensive database search');
        
        // Use different search strategy based on query type
        if (isDefinitionQuery) {
          console.log('Definition query detected, using definition-focused search strategy');
          const definitionContext = await contextService.getDefinitionContext(queryText);
          regulatoryContext = definitionContext.context || '';
          reasoning = definitionContext.reasoning || '';
          searchStrategy = 'definition-focused';
        } else {
          // Standard comprehensive search
          const contextResult = await contextService.getComprehensiveRegulatoryContext(queryText);
          regulatoryContext = contextResult.context || '';
          reasoning = contextResult.reasoning || '';
          searchStrategy = 'comprehensive';
        }
      }
      
      contextTime = Date.now() - contextStart;
      
      // For FAQ queries, ensure we've searched across multiple potential sources
      if (isFaqQuery === true) {
        console.log('FAQ query detected, performing thorough database search for all relevant FAQ content');
        searchStrategy = 'faq-specialized';
        
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

      // New: Add validation data to cross-check response accuracy
      const validationData = await contextService.getValidationContext(queryText);
      if (validationData && validationData.context) {
        // Append validation context with clear separator
        regulatoryContext += "\n\n--- CROSS-VALIDATION DATA ---\n\n" + validationData.context;
        console.log('Added cross-validation data to improve response accuracy');
      }
      
    } catch (contextError) {
      // If context retrieval fails, log it but continue with empty context
      console.error("Error retrieving context:", contextError);
      regulatoryContext = '';
      reasoning = 'Failed to retrieve context due to an error';
      searchStrategy = 'failed';
    }
    
    return { 
      regulatoryContext, 
      reasoning, 
      contextTime, 
      usedSummaryIndex,
      searchStrategy 
    };
  };

  return { retrieveRegulatoryContext };
};
