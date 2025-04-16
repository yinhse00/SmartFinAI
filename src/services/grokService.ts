
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
    try {
      // Use the enhanced grokResponseGenerator service
      const response = await grokResponseGenerator.generateResponse(params);
      
      // Add response completeness check if not already present
      if (response.metadata && !response.metadata.responseCompleteness) {
        const { detectTruncationComprehensive, getTruncationDiagnostics } = require('@/utils/truncationUtils');
        const diagnostics = getTruncationDiagnostics(response.text);
        
        response.metadata.responseCompleteness = {
          isComplete: !diagnostics.isTruncated,
          confidence: diagnostics.confidence,
          reasons: diagnostics.reasons
        };
      }
      
      return response;
    } catch (error) {
      console.error("Error in grokService generateResponse:", error);
      
      // Return fallback response with truncation metadata
      return {
        text: "I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.",
        metadata: {
          contextUsed: false,
          responseCompleteness: {
            isComplete: false,
            confidence: 'high',
            reasons: ["Error in response generation"]
          }
        }
      };
    }
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
