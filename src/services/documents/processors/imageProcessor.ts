
import { apiClient } from '../../api/grok/apiClient';
import { getGrokApiKey } from '../../apiKeyService';
import { fileConverter } from '../utils/fileConverter';

/**
 * Processor for extracting text from images using Grok Vision
 */
export const imageProcessor = {
  /**
   * Extract text from images using Grok Vision model
   */
  extractText: async (file: File): Promise<{ content: string; source: string }> => {
    try {
      console.log(`Processing image with Grok Vision: ${file.name}`);
      
      // Convert file to base64
      const base64Data = await fileConverter.fileToBase64(file);
      if (!base64Data) {
        throw new Error('Failed to convert image to base64');
      }
      
      // Prepare request for Grok Vision API
      const apiKey = getGrokApiKey();
      if (!apiKey) {
        throw new Error('Grok API key not found');
      }
      
      const requestBody = {
        model: "grok-3-vision-latest", // Updated to correct vision model
        messages: [
          {
            role: "user", 
            content: [
              { 
                type: "text", 
                text: "Extract all the text from this image. Format it in a clear, readable way maintaining paragraphs, headings, and bullet points if present." 
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
      
      // Call Grok API
      const response = await apiClient.callChatCompletions(requestBody, apiKey);
      
      // Extract the text content from the response
      const extractedText = response.choices[0]?.message?.content || 'No text was extracted from the image';
      
      console.log(`Successfully extracted text from image ${file.name}`);
      
      return {
        content: extractedText,
        source: file.name
      };
    } catch (error) {
      console.error(`Error in OCR processing for ${file.name}:`, error);
      
      // Check for specific model support errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Image inputs are not supported")) {
        return {
          content: `Error processing image ${file.name}: This model doesn't support image inputs. Please try again later or use a different format.`,
          source: file.name
        };
      }
      
      return {
        content: `Error extracting text from image ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  }
};
