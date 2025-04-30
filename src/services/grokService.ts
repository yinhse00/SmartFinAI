
// This is the service for the Grok AI integration specialized for Hong Kong financial expertise
import { hasGrokApiKey, getGrokApiKey } from './apiKeyService';
import { contextService } from './regulatory/contextService';
import { documentService } from './documents/documentService';
import { fileProcessingService } from './documents/fileProcessingService';
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
   * Process document files (PDF, Word, Excel)
   */
  processDocument: async (file: File) => {
    return await fileProcessingService.processFile(file);
  },

  /**
   * Process image files using Grok Vision
   */
  processImage: async (file: File) => {
    if (!file || !file.type.includes('image')) {
      throw new Error('Invalid image file');
    }
    
    const apiKey = getGrokApiKey();
    if (!apiKey) {
      throw new Error('API key not set');
    }

    try {
      // Convert image to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });

      // Call Grok Vision API
      const requestBody = {
        model: "grok-2-vision-latest",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Please describe and extract all text content from this image." },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      };
      
      const response = await grokResponseGenerator.makeApiCall(requestBody, apiKey);
      
      if (!response || !response.choices || !response.choices[0]?.message?.content) {
        throw new Error('Invalid response from vision API');
      }
      
      return {
        text: response.choices[0].message.content,
        source: file.name
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return {
        text: `Error processing image ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  }
};
