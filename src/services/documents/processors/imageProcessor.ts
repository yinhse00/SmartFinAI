
import { apiClient } from '../../api/grok/apiClient';
import { getGrokApiKey } from '../../apiKeyService';
import { fileConverter } from '../utils/fileConverter';
import { ChatCompletionRequest } from '../../api/grok/types';

// Cache for image extraction results
const imageExtractionCache = new Map<string, {
  content: string, 
  source: string, 
  timestamp: number
}>();

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

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
      
      // Generate cache key using file name and size
      const cacheKey = `${file.name}-${file.size}`;
      
      // Check cache for this image
      const cachedResult = imageExtractionCache.get(cacheKey);
      if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_EXPIRATION)) {
        console.log(`Using cached OCR result for ${file.name}`);
        return {
          content: cachedResult.content,
          source: cachedResult.source
        };
      }
      
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
      
      const requestBody: ChatCompletionRequest = {
        model: "grok-3-beta", // OPTIMIZATION: Always use full model for image processing
        messages: [
          {
            role: "user" as const, 
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
            ] as any // Type assertion for complex content structure
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
      
      // Cache the result
      const result = {
        content: extractedText,
        source: file.name,
        timestamp: Date.now()
      };
      
      imageExtractionCache.set(cacheKey, result);
      
      // Limit cache size
      if (imageExtractionCache.size > 20) {
        const oldestKey = Array.from(imageExtractionCache.keys())[0];
        imageExtractionCache.delete(oldestKey);
      }
      
      return {
        content: extractedText,
        source: file.name
      };
    } catch (error) {
      console.error(`Error in OCR processing for ${file.name}:`, error);
      return {
        content: `Error extracting text from image ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  },
  
  // Clear the image extraction cache
  clearImageCache: () => {
    imageExtractionCache.clear();
    console.log('Image extraction cache cleared');
  }
};
