
import { grokService } from '@/services/grokService';
import { Step3Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 3: Takeovers Code Search using only Grok's built-in knowledge
 * - Use Grok's knowledge for Takeovers Code
 * - Check if match found and analyze
 * - Determine if execution guidance needed
 */
export const executeStep3 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step3Result> => {
  setStepProgress('Searching Hong Kong Takeovers Code information using AI knowledge');
  
  try {
    // Step 3(a): Search for Takeovers Code using Grok's knowledge base
    const response = await grokService.getRegulatoryContext(
      `Provide comprehensive information about Hong Kong Takeovers Code regarding: ${params.query}`
    );
    
    // Use utility function to safely extract text
    const takeoversCodeContext = safelyExtractText(response);
    
    // Step 3(b-c): Check if search was positive
    const searchPositive = takeoversCodeContext && takeoversCodeContext.trim() !== '';
    
    if (searchPositive) {
      setStepProgress('Found relevant Takeovers Code information');
      
      // Search for more specific details if needed
      const detailedResponse = await grokService.getRegulatoryContext(
        `Provide detailed information about specific rules, processes or requirements in the Hong Kong Takeovers Code related to: ${params.query}`
      );
      
      // Use utility function to safely extract text
      const detailedTakeoverContext = safelyExtractText(detailedResponse);
      
      let enhancedContext = takeoversCodeContext;
      if (detailedTakeoverContext) {
        enhancedContext += "\n\n--- Detailed Takeovers Code Information ---\n\n" + detailedTakeoverContext;
      }
      
      // Add any previous listing rules context if available
      if (params.listingRulesContext) {
        enhancedContext = params.listingRulesContext + "\n\n--- Takeovers Code Context ---\n\n" + enhancedContext;
      }
      
      // Step 3(e-f): Check if execution guidance is needed
      const executionRequired = 
        params.query.toLowerCase().includes('process') ||
        params.query.toLowerCase().includes('how to') ||
        params.query.toLowerCase().includes('steps') ||
        params.query.toLowerCase().includes('procedure') ||
        params.query.toLowerCase().includes('timeline') ||
        params.query.toLowerCase().includes('timetable');
        
      if (executionRequired) {
        return {
          shouldContinue: true,
          nextStep: 'execution',
          query: params.query,
          takeoversCodeContext: enhancedContext,
          regulatoryContext: enhancedContext,
          executionRequired: true,
          skipSequentialSearches: Boolean(params.skipSequentialSearches),
          isRegulatoryRelated: Boolean(params.isRegulatoryRelated) || true
        };
      }
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        takeoversCodeContext: enhancedContext,
        regulatoryContext: enhancedContext,
        executionRequired: false,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: Boolean(params.isRegulatoryRelated) || true
      };
    } else {
      // Step 3(g-h): Negative search - check if execution guidance is needed
      setStepProgress('No specific Takeovers Code found, checking if execution guidance is needed');
      
      const executionRequired = 
        params.query.toLowerCase().includes('process') ||
        params.query.toLowerCase().includes('how to') ||
        params.query.toLowerCase().includes('steps') ||
        params.query.toLowerCase().includes('procedure') ||
        params.query.toLowerCase().includes('timeline') ||
        params.query.toLowerCase().includes('timetable');
        
      if (executionRequired) {
        return {
          shouldContinue: true,
          nextStep: 'execution',
          query: params.query,
          executionRequired: true,
          skipSequentialSearches: Boolean(params.skipSequentialSearches),
          isRegulatoryRelated: Boolean(params.isRegulatoryRelated) || true
        };
      }
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        takeoversCodeSearchNegative: true,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: Boolean(params.isRegulatoryRelated) || true
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
      isRegulatoryRelated: Boolean(params.isRegulatoryRelated) || true
    };
  }
};
