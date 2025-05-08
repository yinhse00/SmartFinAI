
import { useState } from 'react';
import { grokService } from '@/services/grokService';
import { useToast } from '@/hooks/use-toast';

export const useContextRetrieval = () => {
  const { toast } = useToast();
  const [lastRegulationSearchTime, setLastRegulationSearchTime] = useState<number>(0);

  /**
   * Retrieve regulatory context based on query content
   */
  const retrieveRegulatoryContext = async (
    queryText: string,
    isPreliminaryAssessment: boolean = false
  ) => {
    console.log(`Retrieving regulatory context for query${isPreliminaryAssessment ? " (preliminary assessment)" : ""}`);
    
    const searchStart = Date.now();
    let regulatoryContext = '';
    let reasoning = '';
    let usedSummaryIndex = false;
    let searchStrategy = 'direct';

    try {
      // Call the regulatory context service with additional metadata for model selection
      const contextResponse = await grokService.getRegulatoryContext(
        queryText, 
        {
          isPreliminaryAssessment,
          metadata: {
            processingStage: isPreliminaryAssessment ? 'preliminary' : 'main',
            isInitialAssessment: isPreliminaryAssessment
          }
        }
      );

      if (contextResponse) {
        if (typeof contextResponse === 'string') {
          regulatoryContext = contextResponse;
        } else if (typeof contextResponse === 'object') {
          regulatoryContext = contextResponse.context || contextResponse.text || '';
          reasoning = contextResponse.reasoning || '';
          usedSummaryIndex = contextResponse.usedSummaryIndex || false;
          searchStrategy = contextResponse.searchStrategy || 'direct';
        }
      }

      if (regulatoryContext.trim() === '') {
        console.log('No specific regulatory context found for the query');
        usedSummaryIndex = false;
      } else {
        console.log('Found relevant regulatory context');
      }
    } catch (error) {
      console.error('Error retrieving regulatory context:', error);
      regulatoryContext = '';
      reasoning = `Error retrieving context: ${error instanceof Error ? error.message : String(error)}`;
    }

    const contextTime = Date.now() - searchStart;
    console.log(`Context retrieval completed in ${contextTime}ms`);

    return {
      regulatoryContext,
      reasoning,
      contextTime,
      usedSummaryIndex,
      searchStrategy,
    };
  };

  return {
    retrieveRegulatoryContext
  };
};
