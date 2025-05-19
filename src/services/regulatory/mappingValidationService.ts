
import { supabase } from '@/integrations/supabase/client';
import { grokService } from '@/services/grokService';

/**
 * Service for validating responses against regulatory mapping data
 */
export const mappingValidationService = {
  /**
   * Validate a response against the new listing applicants guidance
   */
  async validateAgainstListingGuidance(
    response: string,
    query: string
  ): Promise<{
    isValid: boolean;
    corrections?: string;
    confidence: number;
    sourceMaterials: string[];
  }> {
    try {
      console.log('Validating response against New Listing Applicants guidance');
      
      // First retrieve the mapping guidance document
      const guidanceDoc = await mappingValidationService.getListingGuidanceDocument();
      
      if (!guidanceDoc) {
        console.log('No listing guidance document found for validation');
        return {
          isValid: true, // Default to valid when we can't validate
          confidence: 0,
          sourceMaterials: []
        };
      }
      
      console.log('Retrieved guidance document for validation');
      
      // Extract relevant sections from the guidance document based on the query
      const relevantGuidance = await mappingValidationService.extractRelevantGuidance(
        guidanceDoc.content,
        query
      );
      
      if (!relevantGuidance) {
        console.log('No relevant guidance found for this query');
        return {
          isValid: true, // Default to valid when we don't have relevant guidance
          confidence: 0.5,
          sourceMaterials: [guidanceDoc.title]
        };
      }
      
      // Validate the response against the relevant guidance
      const validationResult = await mappingValidationService.performValidation(
        response,
        relevantGuidance,
        query
      );
      
      return {
        ...validationResult,
        sourceMaterials: [guidanceDoc.title]
      };
    } catch (error) {
      console.error('Error validating against listing guidance:', error);
      return {
        isValid: true, // Default to valid on error
        confidence: 0,
        sourceMaterials: []
      };
    }
  },
  
  /**
   * Get the latest listing guidance document
   */
  async getListingGuidanceDocument(): Promise<{
    id: string;
    title: string;
    content: string;
    updated_at: string;
  } | null> {
    try {
      // Search for the guidance document in the reference_documents table
      const { data, error } = await supabase
        .from('reference_documents')
        .select('id, title, content, updated_at')
        .ilike('title', '%Guide for New Listing Applicants%')
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (error || !data || data.length === 0) {
        console.error('No listing guidance document found:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('Error retrieving listing guidance document:', error);
      return null;
    }
  },
  
  /**
   * Extract relevant guidance sections based on the query
   */
  async extractRelevantGuidance(
    fullGuidance: string,
    query: string
  ): Promise<string | null> {
    try {
      // Use Grok to extract relevant sections from the guidance
      const extractionPrompt = `
      The following text contains a regulatory mapping guide for new listing applicants.
      Based on this query: "${query}"
      Extract ONLY the most relevant sections from the guide that would be needed to validate 
      a response to this query. Include all relevant rule references, requirements, and 
      decision criteria. If nothing is relevant, respond with "No relevant guidance found."
      `;
      
      const response = await grokService.generateResponse({
        prompt: extractionPrompt,
        regulatoryContext: fullGuidance,
        temperature: 0.2,
        maxTokens: 2000
      });
      
      const extractedGuidance = response?.text || '';
      
      if (extractedGuidance.includes('No relevant guidance found') || 
          extractedGuidance.trim().length < 50) {
        return null;
      }
      
      return extractedGuidance;
    } catch (error) {
      console.error('Error extracting relevant guidance:', error);
      return null;
    }
  },
  
  /**
   * Perform validation of response against guidance
   */
  async performValidation(
    response: string,
    relevantGuidance: string,
    query: string
  ): Promise<{
    isValid: boolean;
    corrections?: string;
    confidence: number;
  }> {
    try {
      // Use Grok to validate the response against the guidance
      const validationPrompt = `
      You are a regulatory validation expert. Compare a response to a financial regulatory query against 
      the official guidance document to check accuracy.
      
      Query: "${query}"
      
      Relevant guidance from official document:
      ${relevantGuidance}
      
      Response to validate:
      ${response.substring(0, 4000)} ${response.length > 4000 ? '... (truncated for validation)' : ''}
      
      Evaluate the response and provide:
      1. Whether it's accurate based on the guidance (true/false)
      2. Confidence level in your assessment (0-1)
      3. Any significant corrections needed
      
      Format as JSON: {"isValid": boolean, "confidence": number, "corrections": "string or null"}
      `;
      
      const validationResponse = await grokService.generateResponse({
        prompt: validationPrompt,
        temperature: 0.1,
        maxTokens: 1000
      });
      
      // Extract JSON from the response
      const validationText = validationResponse?.text || '';
      const jsonMatch = validationText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const validation = JSON.parse(jsonMatch[0]);
          return {
            isValid: validation.isValid === true,
            corrections: validation.corrections || undefined,
            confidence: typeof validation.confidence === 'number' ? 
              validation.confidence : 0.5
          };
        } catch (parseError) {
          console.error('Error parsing validation JSON:', parseError);
        }
      }
      
      // Default response if parsing fails
      return {
        isValid: true,
        confidence: 0.5
      };
    } catch (error) {
      console.error('Error performing validation:', error);
      return {
        isValid: true,
        confidence: 0
      };
    }
  }
};
