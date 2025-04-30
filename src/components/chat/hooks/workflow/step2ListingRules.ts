
import { grokService } from '@/services/grokService';
import { WorkflowStep, Step2Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 2: Listing Rules Search
 * - Search in Summary and Keyword Index
 * - Query related chapters if match found
 * - Check if also Takeovers Code related
 */
export const executeStep2 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step2Result> => {
  setStepProgress('Searching Listing Rules summary and keyword index');
  
  try {
    // Step 2.1: Search Summary and Keyword Index for Listing Rules
    const response = await grokService.getRegulatoryContext(
      `Search specifically in "Summary and Keyword Index_Listing Rule.docx" for: ${params.query}`
    );
    
    // Use utility function to safely extract text
    const listingRulesContext = safelyExtractText(response);
    
    // Step 2.1.1 & 2.1.2: Check if search was positive or negative
    const searchPositive = listingRulesContext && listingRulesContext.trim() !== '';
    
    if (searchPositive) {
      // Step 2.1.1: Search was positive, get chapter details
      setStepProgress('Found relevant Listing Rules, retrieving chapter details');
      
      // Search in related Chapter of Listing Rules
      const chapterMatch = listingRulesContext.match(/Chapter\s+(\d+[A-Z]?)/i);
      let enhancedContext = listingRulesContext;
      
      if (chapterMatch && chapterMatch[1]) {
        const chapterNum = chapterMatch[1];
        const chapterResponse = await grokService.getRegulatoryContext(
          `Find detailed information about Chapter ${chapterNum} of the Listing Rules`
        );
        
        // Use utility function to safely extract text
        const chapterContext = safelyExtractText(chapterResponse);
        
        if (chapterContext) {
          enhancedContext += "\n\n--- Detailed Chapter Information ---\n\n" + chapterContext;
        }
      }
      
      // Step 2.2.1: Check if also related to Takeovers Code
      const takeoverRelated = 
        enhancedContext.toLowerCase().includes('takeover') ||
        enhancedContext.toLowerCase().includes('general offer') ||
        enhancedContext.toLowerCase().includes('mandatory offer');
      
      // Step 2.2.1: If related to Takeovers Code, go to Step 3
      if (takeoverRelated) {
        return {
          shouldContinue: true,
          nextStep: 'takeoversCode',
          query: params.query,
          listingRulesContext: enhancedContext,
          takeoversCodeRelated: true
        };
      }
      
      // Step 2.2.2: Not related to Takeovers Code, check if execution guidance is needed
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
          listingRulesContext: enhancedContext,
          executionRequired: true
        };
      }
      
      // If execution not required, go directly to response
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        listingRulesContext: enhancedContext,
        regulatoryContext: enhancedContext,
        executionRequired: false
      };
    } else {
      // Step 2.1.2: Negative search result - check execution needs or proceed to Step 5
      setStepProgress('No specific Listing Rules found, checking next steps');
      
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
          executionRequired: true
        };
      }
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        listingRulesSearchNegative: true
      };
    }
  } catch (error) {
    console.error('Error in step 2:', error);
    return { 
      shouldContinue: true, 
      nextStep: 'response',
      query: params.query,
      error
    };
  }
};
