
import { enhancedContextService } from '@/services/regulatory/context/enhancedContextService';

export const useContextRetrieval = () => {
  const retrieveRegulatoryContext = async (
    queryText: string,
    isFaqQuery: boolean
  ) => {
    const contextStart = Date.now();
    
    try {
      console.log('Retrieving enhanced regulatory context...');
      
      // Use enhanced context service for comprehensive context gathering
      const enhancedContext = await enhancedContextService.getEnhancedContext(
        queryText,
        { 
          isPreliminaryAssessment: false,
          metadata: { 
            isFaqQuery,
            useParallelProcessing: true
          }
        }
      );
      
      const contextTime = Date.now() - contextStart;
      
      // Format the context for Grok
      const formattedContext = enhancedContextService.formatEnhancedContextForGrok(enhancedContext);
      
      // Create reasoning that includes validation information
      let reasoning = 'Enhanced regulatory context retrieved';
      
      if (enhancedContext.vettingInfo.isRequired) {
        reasoning += ` with vetting requirements (${enhancedContext.vettingInfo.headlineCategory || 'applicable'})`;
      }
      
      if (enhancedContext.guidanceValidation.hasRelevantGuidance) {
        reasoning += ` and ${enhancedContext.guidanceValidation.matches.length} relevant guidance document(s)`;
      }
      
      // Determine search strategy used
      const searchStrategy = enhancedContext.contextMetadata.sources.join(' + ');
      
      console.log(`Enhanced context retrieved in ${contextTime}ms`);
      console.log(`Sources: ${searchStrategy}`);
      console.log(`Vetting required: ${enhancedContext.vettingInfo.isRequired}`);
      console.log(`Guidance matches: ${enhancedContext.guidanceValidation.matches.length}`);
      
      return {
        regulatoryContext: formattedContext,
        reasoning,
        contextTime,
        usedSummaryIndex: false,
        searchStrategy,
        enhancedContext // Pass through for later use in validation
      };
    } catch (error) {
      console.error('Error in enhanced context retrieval:', error);
      
      // Fallback to basic context
      const basicContext = '';
      return {
        regulatoryContext: basicContext,
        reasoning: 'Enhanced context retrieval failed, using fallback',
        contextTime: Date.now() - contextStart,
        usedSummaryIndex: false,
        searchStrategy: 'fallback'
      };
    }
  };

  return {
    retrieveRegulatoryContext
  };
};
