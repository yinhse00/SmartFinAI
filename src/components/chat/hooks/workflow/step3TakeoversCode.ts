
import { grokService } from '@/services/grokService';
import { WorkflowStep } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 3: Takeovers Code Search
 * - Search in Summary and Index_Takeovers Code
 * - Check if match found and analyze
 * - Determine if execution guidance needed
 */
export const executeStep3 = async (params: any, setStepProgress: (progress: string) => void) => {
  setStepProgress('Searching Takeovers Code summary and index');
  
  try {
    // Step 3.1: Search Summary and Index for Takeovers Code
    const response = await grokService.getRegulatoryContext(
      `Search specifically in "Summary and Index_Takeovers Code.docx" for: ${params.query}`
    );
    
    // Use utility function to safely extract text
    const takeoversCodeContext = safelyExtractText(response);
    
    // Step 3.1.1 & 3.1.2: Check if search was positive
    const searchPositive = takeoversCodeContext && takeoversCodeContext.trim() !== '';
    
    if (searchPositive) {
      // Step 3.1.1: Found relevant information, retrieve detailed context
      setStepProgress('Found relevant Takeovers Code information');
      
      // Search in the codes on takeovers and mergers document
      const detailedResponse = await grokService.getRegulatoryContext(
        `Find detailed information in "the codes on takeovers and mergers and share buy backs.pdf" about: ${params.query}`
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
      
      // Step 3.2.1: Check if execution guidance is needed
      const executionRequired = 
        params.query.toLowerCase().includes('process') ||
        params.query.toLowerCase().includes('how to') ||
        params.query.toLowerCase().includes('steps') ||
        params.query.toLowerCase().includes('procedure') ||
        params.query.toLowerCase().includes('timeline') ||
        params.query.toLowerCase().includes('timetable');
        
      if (executionRequired) {
        // Step 3.2.1: If execution required, go to Step 4
        return {
          shouldContinue: true,
          nextStep: 'execution' as WorkflowStep,
          query: params.query,
          takeoversCodeContext: enhancedContext,
          regulatoryContext: enhancedContext,
          executionRequired: true
        };
      }
      
      // Step 3.2.2: Execution not required, go to Step 5
      return {
        shouldContinue: true,
        nextStep: 'response' as WorkflowStep,
        query: params.query,
        takeoversCodeContext: enhancedContext,
        regulatoryContext: enhancedContext,
        executionRequired: false
      };
    } else {
      // Step 3.1.2: Negative search - check if execution guidance is needed
      setStepProgress('No specific Takeovers Code found, checking if execution guidance is needed');
      
      // Step 3.2: Check execution requirements
      const executionRequired = 
        params.query.toLowerCase().includes('process') ||
        params.query.toLowerCase().includes('how to') ||
        params.query.toLowerCase().includes('steps') ||
        params.query.toLowerCase().includes('procedure') ||
        params.query.toLowerCase().includes('timeline') ||
        params.query.toLowerCase().includes('timetable');
        
      if (executionRequired) {
        // Step 3.2.1: Execution required, go to Step 4
        return {
          shouldContinue: true,
          nextStep: 'execution' as WorkflowStep,
          query: params.query,
          executionRequired: true
        };
      }
      
      // Step 3.2.2: Execution not required, go to Step 5
      return {
        shouldContinue: true,
        nextStep: 'response' as WorkflowStep,
        query: params.query,
        takeoversCodeSearchNegative: true
      };
    }
  } catch (error) {
    console.error('Error in step 3:', error);
    return { 
      shouldContinue: true, 
      nextStep: 'response' as WorkflowStep, 
      query: params.query,
      error
    };
  }
};
