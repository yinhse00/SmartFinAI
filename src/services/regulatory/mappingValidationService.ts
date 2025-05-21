
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '../api/grok/apiClient';
import { getGrokApiKey } from '../apiKeyService';
import { ChatCompletionRequest } from '../api/grok/types';

interface ListingGuidanceDocument {
  id: string;
  title: string;
  content: string | null;
  updated_at?: string;
}

export const mappingValidationService = {
  /**
   * Validate a response against the listing guidance mapping
   */
  validateAgainstListingGuidance: async (
    response: string,
    query: string
  ): Promise<{
    isValid: boolean;
    confidence: number;
    corrections?: string;
    sourceMaterials: string[];
  }> => {
    try {
      console.log('Validating response against listing guidance mapping');
      
      // 1. Fetch the new listing guide document
      const { data: guideDocument, error: fetchError } = await supabase
        .from('reference_documents')
        .select('id, title, content')
        .ilike('title', '%Guide for New Listing Applicants%')
        .limit(1)
        .single();
      
      if (fetchError || !guideDocument) {
        console.error('Unable to find listing guidance document:', fetchError);
        return {
          isValid: true, // Default to valid if we can't find the guidance
          confidence: 0,
          sourceMaterials: []
        };
      }
      
      // Check if we have content to validate against
      if (!guideDocument.content) {
        console.warn('Listing guidance document has no content to validate against');
        return {
          isValid: true,
          confidence: 0,
          sourceMaterials: [guideDocument.title]
        };
      }
      
      // 2. Get the API key for validation
      const apiKey = getGrokApiKey();
      if (!apiKey) {
        console.error('No API key available for response validation');
        return {
          isValid: true, // Default to valid if we can't validate
          confidence: 0,
          sourceMaterials: [guideDocument.title]
        };
      }
      
      // 3. Prepare the validation request
      const validationRequest: ChatCompletionRequest = {
        model: "grok-3-beta",
        messages: [
          {
            role: "system",
            content: `You are a financial regulatory validation expert. Your task is to determine if the provided answer to a question about new listing applicants is accurate according to the Hong Kong regulatory guidance mapping. 
            You will be provided with:
            1. The original user query
            2. The response that needs validation
            3. The regulatory mapping document content
            
            Evaluate if the response is factually accurate and complete. Do not focus on writing style, only on regulatory accuracy.
            
            Your output should be in this format:
            VALID: true/false
            CONFIDENCE: 0-100
            CORRECTIONS: [Only if invalid, what needs to be corrected]`
          },
          {
            role: "user",
            content: `Please validate this response against the regulatory mapping document:
            
            USER QUERY:
            ${query}
            
            RESPONSE TO VALIDATE:
            ${response}
            
            REGULATORY MAPPING DOCUMENT:
            ${guideDocument.content.substring(0, 12000)} 
            
            Is this response valid according to the regulatory mapping document? Provide your assessment.`
          }
        ],
        temperature: 0,
        max_tokens: 1000
      };
      
      // 4. Call the validation API
      console.log('Calling validation API');
      const validationResponse = await apiClient.callChatCompletions(validationRequest, apiKey);
      
      const validationText = validationResponse.choices[0]?.message?.content || '';
      console.log('Validation response:', validationText);
      
      // 5. Parse the validation result
      const isValidMatch = validationText.match(/VALID:\s*(true|false)/i);
      const confidenceMatch = validationText.match(/CONFIDENCE:\s*(\d+)/i);
      const correctionsMatch = validationText.match(/CORRECTIONS:\s*(.+?)($|\n\n)/is);
      
      const isValid = isValidMatch ? isValidMatch[1].toLowerCase() === 'true' : true;
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 0;
      const corrections = correctionsMatch ? correctionsMatch[1].trim() : undefined;
      
      return {
        isValid,
        confidence,
        corrections,
        sourceMaterials: [guideDocument.title]
      };
    } catch (error) {
      console.error('Error validating response against listing guidance:', error);
      return {
        isValid: true, // Default to valid on error
        confidence: 0,
        sourceMaterials: []
      };
    }
  }
};
