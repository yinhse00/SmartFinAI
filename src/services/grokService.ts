
// This is the service for the Grok AI integration specialized for Hong Kong financial expertise
import { hasGrokApiKey, getGrokApiKey } from './apiKeyService';
import { contextService } from './regulatory/contextService';
import { documentService } from './documents/documentService';
import { grokResponseGenerator } from './response/grokResponseGenerator';
import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { fileProcessingService } from './documents/fileProcessingService';

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
  }
};
