
import { grokService } from '@/services/grokService';
import { Step2Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 2: Listing Rules Search using only Grok's knowledge base
 * - Optimized for faster responses
 */
export const executeStep2 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step2Result> => {
  setStepProgress('Searching HKEX Listing Rules information');
  
  try {
    // Fast direct query to Grok's knowledge base
    const response = await grokService.getRegulatoryContext(
      `HKEX Listing Rules regarding: ${params.query}`,
      { metadata: { fastResponse: true } }
    );
    
    const listingRulesContext = safelyExtractText(response);
    const searchPositive = listingRulesContext && listingRulesContext.trim() !== '';
    
    if (searchPositive) {
      setStepProgress('Found relevant Listing Rules');
      
      // Check for execution guidance needs
      const executionRequired = 
        params.query.toLowerCase().includes('process') ||
        params.query.toLowerCase().includes('how to') ||
        params.query.toLowerCase().includes('steps') ||
        params.query.toLowerCase().includes('procedure') ||
        params.query.toLowerCase().includes('timeline');
        
      if (executionRequired) {
        return {
          shouldContinue: true,
          nextStep: 'execution',
          query: params.query,
          listingRulesContext: listingRulesContext,
          executionRequired: true,
          skipSequentialSearches: Boolean(params.skipSequentialSearches),
          isRegulatoryRelated: true
        };
      }
      
      // Check for takeover relevance
      const takeoverRelated = 
        listingRulesContext.toLowerCase().includes('takeover') ||
        listingRulesContext.toLowerCase().includes('general offer');
      
      if (takeoverRelated) {
        return {
          shouldContinue: true,
          nextStep: 'takeoversCode',
          query: params.query,
          listingRulesContext: listingRulesContext,
          takeoversCodeRelated: true,
          skipSequentialSearches: Boolean(params.skipSequentialSearches),
          isRegulatoryRelated: true
        };
      }
      
      // Standard response path
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        listingRulesContext: listingRulesContext,
        regulatoryContext: listingRulesContext,
        executionRequired: false,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true
      };
    } else {
      // Move to next step if no listing rule content found
      setStepProgress('No specific Listing Rules found');
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        listingRulesSearchNegative: true,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true
      };
    }
  } catch (error) {
    console.error('Error in step 2:', error);
    return { 
      shouldContinue: true, 
      nextStep: 'response', 
      query: params.query,
      error,
      skipSequentialSearches: Boolean(params.skipSequentialSearches),
      isRegulatoryRelated: true
    };
  }
};
