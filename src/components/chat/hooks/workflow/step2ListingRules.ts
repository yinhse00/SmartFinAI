
import { grokService } from '@/services/grokService';
import { WorkflowStep } from './types';

/**
 * Step 2: Listing Rules Search
 * - Search in Summary and Keyword Index
 * - Query related chapters if match found
 * - Check if also Takeovers Code related
 */
export const executeStep2 = async (params: any, setStepProgress: (progress: string) => void) => {
  setStepProgress('Searching Listing Rules summary and keyword index');
  
  try {
    // Step 2(a): Search Summary and Keyword Index for Listing Rules
    const response = await grokService.getRegulatoryContext(
      `Search specifically in "Summary and Keyword Index_Listing Rule.docx" for: ${params.query}`
    );
    
    const listingRulesContext = typeof response === 'object' && response ? 
                               (response.text || '') : 
                               (typeof response === 'string' ? response : '');
    const reasoning = '';
    
    // Step 2(b-c): Check if search was positive or negative
    const searchPositive = listingRulesContext && listingRulesContext.trim() !== '';
    
    if (searchPositive) {
      setStepProgress('Found relevant Listing Rules, retrieving chapter details');
      
      // Search in related Chapter of Listing Rules
      const chapterMatch = listingRulesContext.match(/Chapter\s+(\d+[A-Z]?)/i);
      let enhancedContext = listingRulesContext;
      
      if (chapterMatch && chapterMatch[1]) {
        const chapterNum = chapterMatch[1];
        const chapterResponse = await grokService.getRegulatoryContext(
          `Find detailed information about Chapter ${chapterNum} of the Listing Rules`
        );
        
        const chapterContext = typeof chapterResponse === 'object' && chapterResponse ? 
                              (chapterResponse.text || '') : 
                              (typeof chapterResponse === 'string' ? chapterResponse : '');
        
        if (chapterContext) {
          enhancedContext += "\n\n--- Detailed Chapter Information ---\n\n" + chapterContext;
        }
      }
      
      // Step 2(d): Check if also related to Takeovers Code
      const takeoverRelated = 
        enhancedContext.toLowerCase().includes('takeover') ||
        enhancedContext.toLowerCase().includes('general offer') ||
        enhancedContext.toLowerCase().includes('mandatory offer');
      
      if (takeoverRelated) {
        return {
          shouldContinue: true,
          nextStep: 'takeoversCode' as WorkflowStep,
          query: params.query,
          listingRulesContext: enhancedContext,
          takeoversCodeRelated: true
        };
      }
      
      // Check if execution guidance is needed
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
          nextStep: 'execution' as WorkflowStep,
          query: params.query,
          listingRulesContext: enhancedContext,
          executionRequired: true
        };
      }
      
      return {
        shouldContinue: true,
        nextStep: 'response' as WorkflowStep,
        query: params.query,
        listingRulesContext: enhancedContext,
        regulatoryContext: enhancedContext,
        executionRequired: false
      };
    } else {
      // Negative search result - move to Step 4 or 5 depending on execution needs
      setStepProgress('No specific Listing Rules found, checking if execution guidance is needed');
      
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
          nextStep: 'execution' as WorkflowStep,
          query: params.query,
          executionRequired: true
        };
      }
      
      return {
        shouldContinue: true,
        nextStep: 'response' as WorkflowStep,
        query: params.query,
        listingRulesSearchNegative: true
      };
    }
  } catch (error) {
    console.error('Error in step 2:', error);
    return { 
      shouldContinue: true, 
      nextStep: 'response' as WorkflowStep, 
      query: params.query,
      error
    };
  }
};
