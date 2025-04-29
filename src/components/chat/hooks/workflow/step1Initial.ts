
import { checkIsChineseInput } from '../useLanguageState';
import { grokService } from '@/services/grokService';

/**
 * Step 1: Initial Processing
 * - Receives user question
 * - Detects language and translates if Chinese
 * - Initial analysis by Grok
 * - Determines if regulatory-related
 */
export const executeStep1 = async (
  queryText: string,
  storeTranslation: (original: string, translated: string) => void,
  setStepProgress: (progress: string) => void,
  retrieveRegulatoryContext: (queryText: string) => Promise<any>
) => {
  setStepProgress('Receiving query and performing initial analysis');
  
  // Step 1(c): Check if input is Chinese and needs translation
  const isChinese = checkIsChineseInput(queryText);
  let processedQuery = queryText;
  
  if (isChinese) {
    setStepProgress('Translating Chinese query to English');
    try {
      // Translate Chinese to English for processing
      const translation = await grokService.translateContent(queryText, 'en');
      if (typeof translation === 'object' && translation.text) {
        processedQuery = translation.text;
        storeTranslation(queryText, processedQuery);
        console.log('Translated query:', processedQuery);
      }
    } catch (error) {
      console.error('Translation error:', error);
      // Continue with original text if translation fails
    }
  }

  // Step 1(d-e): Process query with Grok and check if regulatory-related
  setStepProgress('Analyzing query relevance to financial regulations');
  
  try {
    // Check if query is related to Listing Rules or Takeovers Code
    const result = await retrieveRegulatoryContext(processedQuery);
    const regulatoryContext = result.regulatoryContext || '';
    const reasoning = result.reasoning || '';
    
    // Step 1(f): If not related to regulations, skip to response
    if (!regulatoryContext || regulatoryContext.trim() === '') {
      console.log('Query not related to financial regulations, skipping to response');
      return { 
        shouldContinue: false, 
        nextStep: 'response' as WorkflowStep, 
        query: processedQuery,
        isRegulatoryRelated: false
      };
    }
    
    // Determine if Listing Rules or Takeovers Code related
    const isListingRulesRelated = 
      regulatoryContext.toLowerCase().includes('listing rules') ||
      regulatoryContext.toLowerCase().includes('chapter');
      
    const isTakeoversCodeRelated =
      regulatoryContext.toLowerCase().includes('takeovers code') ||
      regulatoryContext.toLowerCase().includes('takeover') ||
      regulatoryContext.toLowerCase().includes('general offer');
    
    // Decide on next step based on content relevance
    let nextStep: WorkflowStep = 'response';
    
    if (isListingRulesRelated) {
      nextStep = 'listingRules';
    } else if (isTakeoversCodeRelated) {
      nextStep = 'takeoversCode';
    }
    
    return {
      shouldContinue: true,
      nextStep,
      query: processedQuery,
      regulatoryContext,
      reasoning,
      isRegulatoryRelated: true,
      isListingRulesRelated,
      isTakeoversCodeRelated
    };
  } catch (error) {
    console.error('Error in step 1:', error);
    return { 
      shouldContinue: false, 
      nextStep: 'response' as WorkflowStep, 
      query: processedQuery,
      error,
      isRegulatoryRelated: false
    };
  }
};
