
import { grokService } from '@/services/grokService';
import { Step1Result, WorkflowStep } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 1: Initial analysis
 * - Determine whether input needs translation
 * - Process uploaded files
 * - Analyze whether related to regulatory context
 * - Determine next step in workflow
 */
export const executeStep1 = async (
  queryText: string,
  files?: File[],
  storeTranslation?: (originalText: string, translatedText: string) => void,
  setStepProgress?: (progress: string) => void,
  retrieveRegulatoryContext?: (query: string, isFaq: boolean) => Promise<any>
): Promise<Step1Result> => {
  if (setStepProgress) setStepProgress('Initial query analysis');
  
  try {
    // Step 1.1: Check if this is a Chinese query that needs translation
    let originalQuery = queryText;
    let fileContents = '';
    
    // Check for Chinese characters
    const containsChinese = /[\u4e00-\u9fa5]/.test(queryText);
    
    if (containsChinese) {
      if (setStepProgress) setStepProgress('Translating query to English');
      
      const { text } = await grokService.query({
        prompt: `Translate the following Chinese text to English: ${queryText}`,
        maxTokens: 2000
      });
      
      // Store translation for later use
      if (storeTranslation) {
        storeTranslation(originalQuery, text);
      }
      
      queryText = text;
    }
    
    // Step 1.2: Process any uploaded files
    if (files && files.length > 0) {
      if (setStepProgress) setStepProgress('Processing uploaded files');
      
      for (const file of files) {
        try {
          const extractedContent = await grokService.processFile(file);
          fileContents += `\nContent from file "${file.name}":\n${extractedContent}\n`;
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          fileContents += `\nError extracting content from file "${file.name}".`;
        }
      }
      
      if (fileContents.trim()) {
        queryText = `${queryText}\n\nREFERENCE MATERIALS:\n${fileContents}`;
      }
    }
    
    // Step 1.3: Initial analysis to determine relevance to regulatory content
    if (setStepProgress) setStepProgress('Analyzing query context');
    
    // Use the regulatory context service to get high-level regulatory relevance
    let regulatoryContext = '';
    let reasoning = '';
    let isRegulatoryRelated = false;
    
    if (retrieveRegulatoryContext) {
      const contextResult = await retrieveRegulatoryContext(queryText, false);
      regulatoryContext = contextResult.regulatoryContext || '';
      reasoning = contextResult.reasoning || '';
      isRegulatoryRelated = !!regulatoryContext && regulatoryContext.trim() !== '';
    }
    
    // Step 1.4: Determine whether related to Listing Rules or Takeovers Code
    // Check if query text matches listing rules patterns
    const isListingRulesRelated = 
      isRegulatoryRelated && (
        queryText.toLowerCase().includes('listing rule') || 
        queryText.toLowerCase().includes('chapter') || 
        queryText.toLowerCase().includes('main board') ||
        (regulatoryContext && 
          regulatoryContext.toLowerCase().includes('listing rule'))
      );
    
    // Check if query text matches takeover code patterns  
    const isTakeoversCodeRelated = 
      isRegulatoryRelated && (
        queryText.toLowerCase().includes('takeover') || 
        queryText.toLowerCase().includes('code') ||
        queryText.toLowerCase().includes('offer') ||
        (regulatoryContext && 
          regulatoryContext.toLowerCase().includes('takeovers code'))
      );
    
    // Step 1.5: Determine which workflow branch to follow
    if (isListingRulesRelated) {
      return {
        shouldContinue: true,
        nextStep: 'listingRules' as 'listingRules' | 'takeoversCode' | 'response' | 'execution' | 'complete',
        query: queryText,
        isRegulatoryRelated,
        regulatoryContext,
        reasoning,
        isListingRulesRelated,
        isTakeoversCodeRelated,
        originalQuery,
        fileContents: fileContents || undefined
      };
    } else if (isTakeoversCodeRelated) {
      return {
        shouldContinue: true,
        nextStep: 'takeoversCode' as 'listingRules' | 'takeoversCode' | 'response' | 'execution' | 'complete',
        query: queryText,
        isRegulatoryRelated,
        regulatoryContext,
        reasoning,
        isListingRulesRelated,
        isTakeoversCodeRelated,
        originalQuery,
        fileContents: fileContents || undefined
      };
    } else {
      // Not related to listing rules or takeovers code, go directly to response
      return {
        shouldContinue: isRegulatoryRelated,
        nextStep: 'response' as 'listingRules' | 'takeoversCode' | 'response' | 'execution' | 'complete',
        query: queryText,
        isRegulatoryRelated,
        regulatoryContext,
        reasoning,
        originalQuery,
        fileContents: fileContents || undefined
      };
    }
    
  } catch (error) {
    console.error('Error in step 1:', error);
    return { 
      shouldContinue: false, 
      nextStep: 'response' as 'listingRules' | 'takeoversCode' | 'response' | 'execution' | 'complete', 
      query: queryText,
      isRegulatoryRelated: false,
      error
    };
  }
};
