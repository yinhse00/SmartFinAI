import { grokService } from '@/services/grokService';
import { Step1Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 1: Initial Processing
 * - Assess if query is regulatory related
 * - Perform preliminary context search in parallel
 * - Make decision about search path
 */
export const executeStep1 = async (
  query: string,
  storeTranslation: (original: string, translated: string) => void,
  setStepProgress: (progress: string) => void,
  retrieveRegulatoryContext: (queryText: string, isPreliminaryAssessment?: boolean) => Promise<any>
): Promise<Step1Result> => {
  setStepProgress('Analyzing query and retrieving initial context');
  
  try {
    // Parallel process: Retrieve initial regulatory context
    const contextPromise = retrieveRegulatoryContext(query, true);
    
    // Perform initial analysis to determine if query is regulatory related
    const analysisResponse = await grokService.generateResponse({
      prompt: `Determine if this query is related to HK financial regulations, specifically listing rules or takeovers code: "${query}"
      
      Output format:
      {
        "isRegulatoryRelated": true/false,
        "isListingRulesRelated": true/false,
        "isTakeoversCodeRelated": true/false,
        "isProcessRelated": true/false,
        "reasoning": "brief explanation"
      }`,
      temperature: 0.1,
      format: 'json'
    });
    
    // Extract and parse the JSON response
    let assessment = null;
    try {
      const responseText = safelyExtractText(analysisResponse);
      assessment = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing assessment:', e);
      assessment = {
        isRegulatoryRelated: true,
        isListingRulesRelated: true,
        isTakeoversCodeRelated: false,
        isProcessRelated: false,
        reasoning: "Failed to parse response, defaulting to listing rules search"
      };
    }
    
    // Wait for parallel context retrieval to complete
    const contextResult = await contextPromise;
    const regulatoryContext = safelyExtractText(contextResult);
    
    // Determine next step based on assessment
    const isRegulatoryRelated = Boolean(assessment?.isRegulatoryRelated);
    const isListingRulesRelated = Boolean(assessment?.isListingRulesRelated);
    const isTakeoversCodeRelated = Boolean(assessment?.isTakeoversCodeRelated);
    const isProcessRelated = Boolean(assessment?.isProcessRelated);
    
    // Check if we found sufficient context from parallel search
    const hasComprehensiveContext = regulatoryContext && 
                                  regulatoryContext.length > 200 &&
                                  (regulatoryContext.includes("Chapter") ||
                                   regulatoryContext.includes("Rule") ||
                                   regulatoryContext.includes("Code"));
    
    if (isRegulatoryRelated) {
      setStepProgress('Query is regulatory related, determining best approach');
      
      // If comprehensive context found, we can skip sequential searches
      if (hasComprehensiveContext) {
        return {
          shouldContinue: true,
          nextStep: 'response',
          query,
          regulatoryContext,
          reasoning: assessment?.reasoning,
          isRegulatoryRelated,
          isListingRulesRelated,
          isTakeoversCodeRelated,
          isProcessRelated,
          skipSequentialSearches: true,
          assessment,
          contexts: { parallel: regulatoryContext }
        };
      }
      
      // Otherwise follow sequential search path based on assessment
      if (isTakeoversCodeRelated) {
        return {
          shouldContinue: true,
          nextStep: 'takeoversCode',
          query,
          regulatoryContext,
          reasoning: assessment?.reasoning,
          isRegulatoryRelated,
          isListingRulesRelated,
          isTakeoversCodeRelated,
          isProcessRelated,
          skipSequentialSearches: false,
          assessment
        };
      }
      
      return {
        shouldContinue: true,
        nextStep: 'listingRules',
        query,
        regulatoryContext,
        reasoning: assessment?.reasoning,
        isRegulatoryRelated,
        isListingRulesRelated,
        isTakeoversCodeRelated,
        isProcessRelated, 
        skipSequentialSearches: false,
        assessment
      };
    } else {
      // Non-regulatory query
      setStepProgress('Query appears to be non-regulatory');
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query,
        regulatoryContext: '',
        reasoning: assessment?.reasoning,
        isRegulatoryRelated: false,
        isListingRulesRelated: false,
        isTakeoversCodeRelated: false,
        isProcessRelated: false,
        skipSequentialSearches: true,
        assessment
      };
    }
  } catch (error) {
    console.error('Error in step 1:', error);
    return { 
      shouldContinue: true, 
      nextStep: 'response', 
      query,
      error,
      isRegulatoryRelated: true,
      isListingRulesRelated: false,
      isTakeoversCodeRelated: false,
      isProcessRelated: false,
      skipSequentialSearches: true
    };
  }
};

export const step1Initial = (params: {
  query: string;
  storeTranslation: (original: string, translated: string) => void;
  setStepProgress: (progress: string) => void;
  retrieveRegulatoryContext: (queryText: string, isPreliminaryAssessment?: boolean) => Promise<any>;
}) => {
  return executeStep1(params.query, params.storeTranslation, params.setStepProgress, params.retrieveRegulatoryContext);
};
