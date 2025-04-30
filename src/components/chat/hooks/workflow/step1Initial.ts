
import { checkIsChineseInput } from '../useLanguageState';
import { grokService } from '@/services/grokService';
import { Step1Result, WorkflowStep } from './types';

/**
 * Step 1: Initial Processing
 * - Receives user question and/or uploaded files
 * - Detects language and translates if Chinese
 * - Processes images and documents
 * - Performs initial analysis
 * - Determines flow direction based on regulatory relevance
 */
export const executeStep1 = async (
  queryText: string,
  attachedFiles: File[] | undefined,
  storeTranslation: (original: string, translated: string) => void,
  setStepProgress: (progress: string) => void,
  retrieveRegulatoryContext: (queryText: string) => Promise<any>
): Promise<Step1Result> => {
  setStepProgress('Receiving query and performing initial analysis');
  
  // Step 1.2.1: Check if input is Chinese and needs translation
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

  // Step 1.2.2 & 1.2.3: Process attached files if present
  let fileContents = '';
  if (attachedFiles && attachedFiles.length > 0) {
    setStepProgress('Processing attached files');
    
    for (const file of attachedFiles) {
      try {
        // Determine file type
        const fileType = file.type;
        console.log(`Processing file: ${file.name}, type: ${fileType}`);
        
        let extractedContent = '';
        
        if (fileType.includes('image')) {
          // Step 1.2.2: Process images using Grok vision
          setStepProgress(`Analyzing image: ${file.name}`);
          const imageResult = await grokService.processImage(file);
          extractedContent = imageResult?.text || '';
        } else if (
          fileType.includes('pdf') || 
          fileType.includes('word') || 
          fileType.includes('excel') ||
          fileType.includes('spreadsheet') ||
          fileType.includes('msword') ||
          fileType.includes('openxmlformats')
        ) {
          // Step 1.2.3: Process documents
          setStepProgress(`Extracting content from document: ${file.name}`);
          const docResult = await grokService.processDocument(file);
          extractedContent = docResult?.content || '';
        }
        
        if (extractedContent) {
          fileContents += `\n\nContent from ${file.name}:\n${extractedContent}`;
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
  }
  
  // Step 1.3: Combine query and file contents for analysis
  const combinedQuery = processedQuery + (fileContents ? `\n\nExtracted file contents: ${fileContents}` : '');

  // Step 1.4: Check regulatory relevance
  setStepProgress('Analyzing query relevance to financial regulations');
  
  try {
    // Check if query is related to Listing Rules or Takeovers Code
    const result = await retrieveRegulatoryContext(combinedQuery);
    const regulatoryContext = result.regulatoryContext || '';
    const reasoning = result.reasoning || '';
    
    // Step 1.4.3: If not related to regulations, skip to response
    if (!regulatoryContext || regulatoryContext.trim() === '') {
      console.log('Query not related to financial regulations, skipping to response');
      return { 
        shouldContinue: false, 
        nextStep: 'response', 
        query: combinedQuery,
        isRegulatoryRelated: false
      };
    }
    
    // Step 1.4.1 & 1.4.2: Determine if Listing Rules or Takeovers Code related
    const isListingRulesRelated = 
      regulatoryContext.toLowerCase().includes('listing rules') ||
      regulatoryContext.toLowerCase().includes('chapter');
      
    const isTakeoversCodeRelated =
      regulatoryContext.toLowerCase().includes('takeovers code') ||
      regulatoryContext.toLowerCase().includes('takeover') ||
      regulatoryContext.toLowerCase().includes('general offer');
    
    // Decide on next step based on content relevance
    let nextStep: 'listingRules' | 'takeoversCode' | 'response' = 'response';
    
    // Step 1.4.1: If related to Listing Rules, go to Step 2
    if (isListingRulesRelated) {
      nextStep = 'listingRules';
    } 
    // Step 1.4.2: If related to Takeovers Code but not Listing Rules, go to Step 3
    else if (isTakeoversCodeRelated) {
      nextStep = 'takeoversCode';
    }
    
    return {
      shouldContinue: true,
      nextStep,
      query: combinedQuery,
      regulatoryContext,
      reasoning,
      isRegulatoryRelated: true,
      isListingRulesRelated,
      isTakeoversCodeRelated,
      originalQuery: queryText,
      fileContents
    };
  } catch (error) {
    console.error('Error in step 1:', error);
    return { 
      shouldContinue: false, 
      nextStep: 'response', 
      query: combinedQuery,
      error,
      isRegulatoryRelated: false
    };
  }
};
