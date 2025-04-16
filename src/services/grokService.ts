
// This is the service for the Grok AI integration specialized for Hong Kong financial expertise
import { hasGrokApiKey, getGrokApiKey } from './apiKeyService';
import { contextService } from './regulatory/contextService';
import { documentService } from './documents/documentService';
import { grokResponseGenerator } from './response/grokResponseGenerator';
import { GrokRequestParams, GrokResponse } from '@/types/grok';

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
   */
  getRegulatoryContext: contextService.getRegulatoryContext,
  
  /**
   * Enhanced professional financial response generation with advanced context handling
   */
  generateResponse: async (params: GrokRequestParams): Promise<GrokResponse> => {
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
  generateExcelDocument: documentService.generateExcelDocument
};
