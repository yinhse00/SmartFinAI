
import { checkIsChineseInput } from '../useLanguageState';
import { grokService } from '@/services/grokService';
import { Step1Result } from './types';
import { parallelQueryProcessor } from '@/services/response/core/parallelQueryProcessor';

/**
 * Step 1: Enhanced Initial Processing
 * - Receives user question
 * - Detects language and translates if Chinese
 * - Uses parallel processing for comprehensive initial assessment
 * - Determines category paths simultaneously
 */
export const executeStep1 = async (
  queryText: string,
  storeTranslation: (original: string, translated: string) => void,
  setStepProgress: (progress: string) => void,
  retrieveRegulatoryContext: (queryText: string, isPreliminaryAssessment?: boolean) => Promise<any>
): Promise<Step1Result> => {
  setStepProgress('Receiving query and performing initial analysis');
  
  // Step 1(c): Check if input is Chinese and needs translation
  const isChinese = checkIsChineseInput(queryText);
  let processedQuery = queryText;
  
  if (isChinese) {
    setStepProgress('Translating Chinese query to English');
    try {
      // Translate Chinese to English for processing
      const translation = await grokService.translateContent({
        content: queryText,
        sourceLanguage: 'zh',
        targetLanguage: 'en'
      });
      
      if (typeof translation === 'object' && translation !== null && 'text' in translation) {
        processedQuery = translation.text || '';
        storeTranslation(queryText, processedQuery);
        console.log('Translated query:', processedQuery);
      }
    } catch (error) {
      console.error('Translation error:', error);
      // Continue with original text if translation fails
    }
  }

  // Step 1(d-e): Enhanced parallel assessment and context gathering
  setStepProgress('Analyzing query across multiple regulatory categories');
  
  try {
    // Use the parallel query processor for comprehensive analysis
    const { assessment, optimizedContext, contexts } = 
      await parallelQueryProcessor.processQueryInParallel(processedQuery);
    
    // Determine whether to continue processing based on assessment
    const isRegulatoryRelated = assessment.isRegulatoryRelated && 
                              (optimizedContext && optimizedContext.trim() !== '');
    
    // Step 1(f): If not related to regulations, skip to response
    if (!isRegulatoryRelated) {
      console.log('Query not related to financial regulations, skipping to response');
      return { 
        shouldContinue: false, 
        nextStep: 'response',
        query: processedQuery,
        isRegulatoryRelated: false
      };
    }
    
    // Determine categories from the assessment
    const highestCategory = assessment.categories
      .sort((a, b) => b.confidence - a.confidence)[0];
    
    // Check for specific category types
    const isListingRulesRelated = Boolean(contexts['listing_rules'] || 
                               highestCategory.category === 'listing_rules');
    
    const isTakeoversCodeRelated = Boolean(contexts['takeovers_code'] || 
                                highestCategory.category === 'takeovers_code');
    
    const isProcessRelated = Boolean(contexts['process'] ||
                          highestCategory.category === 'process' ||
                          assessment.categories.some(c => 
                            c.category === 'process' && c.confidence > 0.6));
    
    // Choose next step based on gathered contexts and priorities
    let nextStep: 'listingRules' | 'takeoversCode' | 'execution' | 'response' = 'response';
    
    // With parallel processing, we can skip intermediate steps and go straight to response
    // if we already have all the needed context
    if (optimizedContext && optimizedContext.trim() !== '') {
      nextStep = 'response';
    } else {
      // Fall back to linear process if parallel didn't yield sufficient context
      if (isListingRulesRelated) {
        nextStep = 'listingRules';
      } else if (isTakeoversCodeRelated) {
        nextStep = 'takeoversCode';
      } else if (isProcessRelated) {
        nextStep = 'execution';
      }
    }
    
    return {
      shouldContinue: true,
      nextStep,
      query: processedQuery,
      regulatoryContext: optimizedContext,
      contexts,
      reasoning: assessment.reasoning || '',
      isRegulatoryRelated: true,
      isListingRulesRelated,
      isTakeoversCodeRelated,
      isProcessRelated,
      assessment,
      // Skip sequential searches if we already have comprehensive context
      skipSequentialSearches: Boolean(optimizedContext && optimizedContext.trim() !== '')
    };
  } catch (error) {
    console.error('Error in enhanced step 1:', error);
    // Fall back to traditional approach if parallel processing fails
    const result = await retrieveRegulatoryContext(processedQuery, true);
    const regulatoryContext = result.regulatoryContext || result.context || '';
    const reasoning = result.reasoning || '';
    
    // Determine if Listing Rules or Takeovers Code related
    const isListingRulesRelated = 
      regulatoryContext.toLowerCase().includes('listing rules') ||
      regulatoryContext.toLowerCase().includes('chapter');
      
    const isTakeoversCodeRelated =
      regulatoryContext.toLowerCase().includes('takeovers code') ||
      regulatoryContext.toLowerCase().includes('takeover') ||
      regulatoryContext.toLowerCase().includes('general offer');
    
    // Decide on next step based on content relevance
    let nextStep: 'listingRules' | 'takeoversCode' | 'execution' | 'response' = 'response';
    
    if (isListingRulesRelated) {
      nextStep = 'listingRules';
    } else if (isTakeoversCodeRelated) {
      nextStep = 'takeoversCode';
    }
    
    return {
      shouldContinue: regulatoryContext.trim() !== '',
      nextStep,
      query: processedQuery,
      regulatoryContext,
      reasoning,
      isRegulatoryRelated: regulatoryContext.trim() !== '',
      isListingRulesRelated,
      isTakeoversCodeRelated,
      skipSequentialSearches: false
    };
  }
};
