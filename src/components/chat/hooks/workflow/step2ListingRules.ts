
import { grokService } from '@/services/grokService';
import { Step2Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 2: Listing Rules Search using only Grok's built-in knowledge
 * - Use Grok's knowledge base for Listing Rules
 * - Check if match found and analyze
 * - Check if also Takeovers Code related
 */
export const executeStep2 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step2Result> => {
  setStepProgress('Searching HKEX Listing Rules information using AI knowledge');
  
  try {
    // Step 2(a): Search for Listing Rules using Grok's knowledge base only
    const response = await grokService.getRegulatoryContext(
      `Provide comprehensive information about HKEX Listing Rules regarding: ${params.query}`
    );
    
    // Use utility function to safely extract text
    const listingRulesContext = safelyExtractText(response);
    
    // Step 2(b-c): Check if search was positive or negative
    const searchPositive = listingRulesContext && listingRulesContext.trim() !== '';
    
    if (searchPositive) {
      setStepProgress('Found relevant Listing Rules information');
      
      // Check for specific chapter references in the response
      const chapterMatch = listingRulesContext.match(/Chapter\s+(\d+[A-Z]?)/i);
      let enhancedContext = listingRulesContext;
      
      if (chapterMatch && chapterMatch[1]) {
        const chapterNum = chapterMatch[1];
        const chapterResponse = await grokService.getRegulatoryContext(
          `Provide detailed information specifically about Chapter ${chapterNum} of the HKEX Listing Rules related to: ${params.query}`
        );
        
        // Use utility function to safely extract text
        const chapterContext = safelyExtractText(chapterResponse);
        
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
          nextStep: 'takeoversCode',
          query: params.query,
          listingRulesContext: enhancedContext,
          takeoversCodeRelated: true,
          skipSequentialSearches: Boolean(params.skipSequentialSearches),
          isRegulatoryRelated: Boolean(params.isRegulatoryRelated) || true
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
          nextStep: 'execution',
          query: params.query,
          listingRulesContext: enhancedContext,
          executionRequired: true,
          skipSequentialSearches: Boolean(params.skipSequentialSearches),
          isRegulatoryRelated: Boolean(params.isRegulatoryRelated) || true
        };
      }
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        listingRulesContext: enhancedContext,
        regulatoryContext: enhancedContext,
        executionRequired: false,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: Boolean(params.isRegulatoryRelated) || true
      };
    } else {
      // Negative search result - move to next step depending on execution needs
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
        listingRulesSearchNegative: true,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: Boolean(params.isRegulatoryRelated) || true
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
      isRegulatoryRelated: Boolean(params.isRegulatoryRelated) || true
    };
  }
};
