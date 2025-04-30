
/**
 * Base functionality for document processors
 */

import { apiClient } from '../../api/grok/apiClient';
import { getGrokApiKey } from '../../apiKeyService';
import { checkApiAvailability } from '../../api/grok/modules/endpointManager';
import { fileConverter } from '../utils/fileConverter';

/**
 * Interface for document processors
 */
export interface DocumentProcessorInterface {
  extractText: (file: File) => Promise<{ content: string; source: string }>;
}

/**
 * Base processor with shared functionality for document processing
 */
export abstract class BaseDocumentProcessor {
  /**
   * Process document with Grok Vision AI
   */
  protected async processWithGrokVision(
    file: File, 
    documentType: string
  ): Promise<{ content: string; source: string }> {
    try {
      console.log(`Processing ${documentType} with Grok Vision: ${file.name}`);
      
      // Convert file to base64
      const base64Data = await fileConverter.fileToBase64(file);
      if (!base64Data) {
        throw new Error(`Failed to convert ${documentType} to base64`);
      }
      
      // Prepare request for Grok Vision API
      const apiKey = getGrokApiKey();
      if (!apiKey) {
        throw new Error('Grok API key not found');
      }
      
      const requestBody = {
        model: "grok-2-vision-latest",
        messages: [
          {
            role: "user", 
            content: [
              { 
                type: "text", 
                text: `Extract all the text from this ${documentType} file. Format it in a clear, readable way maintaining paragraphs, headings, and bullet points if present.` 
              },
              { 
                type: "image_url", 
                image_url: { 
                  url: base64Data 
                } 
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      };
      
      // Call Grok API with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        // Call Grok API
        const response = await apiClient.callChatCompletions(requestBody, apiKey);
        clearTimeout(timeoutId);
        
        // Extract the text content from the response
        const extractedText = response.choices[0]?.message?.content || `No text was extracted from the ${documentType} file`;
        
        console.log(`Successfully extracted text from ${documentType} ${file.name}`);
        
        return {
          content: extractedText,
          source: file.name
        };
      } catch (apiError) {
        clearTimeout(timeoutId);
        throw apiError;
      }
    } catch (error) {
      console.error(`Error in ${documentType} processing for ${file.name}:`, error);
      
      // Determine if this is a connectivity issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isConnectivityIssue = 
        errorMessage.includes("unreachable") || 
        errorMessage.includes("failed") ||
        errorMessage.includes("network") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("abort");
      
      if (isConnectivityIssue) {
        return {
          content: `[API Connection Error: Could not process ${documentType} ${file.name} because the Grok AI service is currently unreachable. Please try again later or provide the text in another format.]`,
          source: file.name
        };
      }
      
      return {
        content: `Error extracting text from ${documentType} ${file.name}: ${errorMessage}`,
        source: file.name
      };
    }
  }

  /**
   * Checks if Grok API is available
   */
  protected async isApiAvailable(): Promise<boolean> {
    const apiKey = getGrokApiKey();
    return apiKey ? await checkApiAvailability(apiKey) : false;
  }

  /**
   * Creates a fallback message for when API is unavailable
   */
  protected createApiUnavailableMessage(
    file: File, 
    fileType: string
  ): { content: string; source: string } {
    return {
      content: `[Document Text Extraction Limited: The ${fileType} '${file.name}' could not be fully processed because the Grok API is currently unreachable. Basic text has been extracted where possible, but formatting and some content may be missing.]`,
      source: file.name
    };
  }
}
