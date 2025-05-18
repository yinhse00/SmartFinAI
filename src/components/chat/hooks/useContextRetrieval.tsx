
import { useState } from 'react';
import { grokService } from '@/services/grokService';
import { useToast } from '@/hooks/use-toast';
import { parallelQueryProcessor } from '@/services/response/core/parallelQueryProcessor';

export const useContextRetrieval = () => {
  const { toast } = useToast();
  const [lastRegulationSearchTime, setLastRegulationSearchTime] = useState<number>(0);

  /**
   * Enhanced regulatory context retrieval using parallel processing
   */
  const retrieveRegulatoryContext = async (
    queryText: string,
    isPreliminaryAssessment: boolean = false
  ) => {
    console.log(`Retrieving regulatory context for query${isPreliminaryAssessment ? " (parallel assessment)" : ""}`);
    
    const searchStart = Date.now();
    
    try {
      // For preliminary assessment, use our enhanced parallel approach
      if (isPreliminaryAssessment) {
        console.log('Using parallel query processing for comprehensive assessment');
        const result = await parallelQueryProcessor.processQueryInParallel(queryText);
        
        const contextTime = Date.now() - searchStart;
        console.log(`Parallel context retrieval completed in ${contextTime}ms`);
        
        return {
          regulatoryContext: result.optimizedContext,
          reasoning: result.assessment.reasoning,
          contextTime,
          categories: result.assessment.categories,
          estimatedComplexity: result.assessment.estimatedComplexity,
          contexts: result.contexts
        };
      }
      
      // For non-preliminary assessments, call the regular context service
      // which now has integrated parallel processing capabilities
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

      let regulatoryContext = '';
      let reasoning = '';
      let usedSummaryIndex = false;
      let searchStrategy = 'direct';
      let categories = [];
      
      if (contextResponse) {
        if (typeof contextResponse === 'string') {
          regulatoryContext = contextResponse;
        } else if (typeof contextResponse === 'object') {
          regulatoryContext = contextResponse.context || contextResponse.regulatoryContext || '';
          reasoning = contextResponse.reasoning || '';
          usedSummaryIndex = contextResponse.usedSummaryIndex || false;
          searchStrategy = contextResponse.searchStrategy || 'direct';
          categories = contextResponse.categories || [];
        }
      }

      const contextTime = Date.now() - searchStart;
      console.log(`Context retrieval completed in ${contextTime}ms`);

      if (regulatoryContext.trim() === '') {
        console.log('No specific regulatory context found for the query');
      } else {
        console.log('Found relevant regulatory context');
      }
      
      return {
        regulatoryContext,
        reasoning,
        contextTime,
        usedSummaryIndex,
        searchStrategy,
        categories
      };
    } catch (error) {
      console.error('Error retrieving regulatory context:', error);
      
      const contextTime = Date.now() - searchStart;
      console.log(`Context retrieval failed after ${contextTime}ms`);
      
      return {
        regulatoryContext: '',
        reasoning: `Error retrieving context: ${error instanceof Error ? error.message : String(error)}`,
        contextTime,
        usedSummaryIndex: false,
        searchStrategy: 'failed',
        error
      };
    }
  };

  return {
    retrieveRegulatoryContext
  };
};
