
import { grokService } from '@/services/grokService';
import { Step3Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 3: Takeovers Code Search using only Grok's knowledge
 * - Optimized for faster responses
 */
export const executeStep3 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step3Result> => {
  setStepProgress('Searching Takeovers Code information');
  
  try {
    // Fast direct query with optimized prompt
    const response = await grokService.getRegulatoryContext(
      `Hong Kong Takeovers Code regarding: ${params.query}`,
      { metadata: { specializedQuery: 'takeovers', fastResponse: true } }
    );
    
    const takeoversCodeContext = safelyExtractText(response);
    const searchPositive = takeoversCodeContext && takeoversCodeContext.trim() !== '';
    
    if (searchPositive) {
      setStepProgress('Found Takeovers Code information');
      
      // Add previous context if available
      let enhancedContext = takeoversCodeContext;
      if (params.listingRulesContext) {
        enhancedContext = params.listingRulesContext + "\n\n--- Takeovers Code Context ---\n\n" + enhancedContext;
      }
      
      // Check for execution guidance needs
      const executionRequired = 
        params.query.toLowerCase().includes('process') ||
        params.query.toLowerCase().includes('how to') ||
        params.query.toLowerCase().includes('steps') ||
        params.query.toLowerCase().includes('procedure');
        
      if (executionRequired) {
        return {
          shouldContinue: true,
          nextStep: 'execution',
          query: params.query,
          takeoversCodeContext: enhancedContext,
          regulatoryContext: enhancedContext,
          executionRequired: true,
          skipSequentialSearches: Boolean(params.skipSequentialSearches),
          isRegulatoryRelated: true
        };
      }
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        takeoversCodeContext: enhancedContext,
        regulatoryContext: enhancedContext,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true
      };
    } else {
      // Move to response if no takeovers code content found
      setStepProgress('No specific Takeovers Code found');
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        takeoversCodeSearchNegative: true,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true
      };
    }
  } catch (error) {
    console.error('Error in step 3:', error);
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
