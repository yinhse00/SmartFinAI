
// This is the service for the Grok AI integration specialized for Hong Kong financial expertise
import { hasGrokApiKey, getGrokApiKey } from './apiKeyService';
import { contextService } from './regulatory/contextService';
import { documentService } from './documents/documentService';
import { grokResponseGenerator } from './response/grokResponseGenerator';
import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { fileProcessingService } from './documents/fileProcessingService';
import { supabase } from '@/integrations/supabase/client';
import { mappingValidationService } from './regulatory/mappingValidationService';

/**
 * Main Grok service facade that integrates various specialized services
 */
export const grokService = {
  /**
   * Check if a Grok API key is set
   */
  hasApiKey: (): boolean => {
    return hasGrokApiKey();
  },

  /**
   * Fetch relevant regulatory information for context
   * Now accepts isPreliminaryAssessment flag and additional options
   */
  getRegulatoryContext: async (
    query: string,
    options?: { isPreliminaryAssessment?: boolean, metadata?: any }
  ) => {
    return contextService.getRegulatoryContext(query, options);
  },
  
  /**
   * Enhanced professional financial response generation with advanced context handling
   */
  generateResponse: async (params: GrokRequestParams): Promise<GrokResponse> => {
    // Get API key from local storage if not provided in params
    if (!params.apiKey) {
      params.apiKey = getGrokApiKey();
    }
    
    // Use the enhanced grokResponseGenerator service
    return await grokResponseGenerator.generateResponse(params);
  },

  /**
   * Translate content using Grok AI
   */
  translateContent: documentService.translateContent,
  
  /**
   * Generate a Word document from text
   */
  generateWordDocument: documentService.generateWordDocument,

  /**
   * Generate a PDF document from text
   */
  generatePdfDocument: documentService.generatePdfDocument,

  /**
   * Generate an Excel document from text
   */
  generateExcelDocument: documentService.generateExcelDocument,
  
  /**
   * Extract text from a document file
   */
  extractDocumentText: async (file: File): Promise<string> => {
    try {
      const result = await fileProcessingService.processFile(file);
      return result.content;
    } catch (error) {
      console.error("Error extracting document text:", error);
      return "";
    }
  },
  
  /**
   * Validate a response against mapping documents
   */
  validateResponseAgainstMapping: async (
    response: string,
    query: string,
    isNewListingQuery: boolean = false
  ): Promise<{
    isValid: boolean;
    confidence: number;
    corrections?: string;
    sourceMaterials: string[];
  }> => {
    if (isNewListingQuery) {
      return await mappingValidationService.validateAgainstListingGuidance(response, query);
    }
    
    // Default response for non-listing queries
    return {
      isValid: true,
      confidence: 0,
      sourceMaterials: []
    };
  },
  
  /**
   * Validate that mapping documents exist and are valid
   */
  validateMappingDocuments: async (): Promise<{ 
    data?: { isValid: boolean; message: string; }; 
    error?: Error;
  }> => {
    try {
      // Check for new listing guide
      const { data: newListingData, error: newListingError } = await supabase
        .from('reference_documents')
        .select('id, title')
        .ilike('title', '%Guide for New Listing Applicants%')
        .limit(1);
      
      // Check for listed issuer guide
      const { data: listedIssuerData, error: listedIssuerError } = await supabase
        .from('reference_documents')
        .select('id, title')
        .ilike('title', '%Guidance Materials for Listed Issuers%')
        .limit(1);
      
      if (newListingError || listedIssuerError) {
        throw new Error('Error checking mapping documents');
      }
      
      const hasNewListingGuide = newListingData && newListingData.length > 0;
      const hasListedIssuerGuide = listedIssuerData && listedIssuerData.length > 0;
      
      if (hasNewListingGuide && hasListedIssuerGuide) {
        return {
          data: {
            isValid: true,
            message: "Both mapping documents are present and validated."
          }
        };
      } else if (hasNewListingGuide) {
        return {
          data: {
            isValid: true,
            message: "New listing applicant guide is present. Listed issuer guide is missing."
          }
        };
      } else if (hasListedIssuerGuide) {
        return {
          data: {
            isValid: false,
            message: "Listed issuer guide is present. New listing applicant guide is missing."
          }
        };
      } else {
        return {
          data: {
            isValid: false,
            message: "Both mapping documents are missing. Please upload them for better response validation."
          }
        };
      }
    } catch (error) {
      console.error("Error validating mapping documents:", error);
      return {
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
};
