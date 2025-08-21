
import { apiClient } from '../../api/grok/apiClient';
import { getGrokApiKey, getGoogleApiKey } from '../../apiKeyService';
import { fileConverter } from '../utils/fileConverter';
import { ChatCompletionRequest } from '../../api/grok/types';
import { getFeatureAIPreference } from '../../ai/aiPreferences';
import { AIProvider } from '../../../types/aiProvider';
import { googleVisionProcessor } from './googleVisionProcessor';

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
      // Get user's preferred AI provider for chat
      const { provider } = getFeatureAIPreference('chat');
      console.log(`Processing image with ${provider} Vision: ${file.name}`);
      
      // Generate cache key using file name, size, and provider
      const cacheKey = `${file.name}-${file.size}-${provider}`;
      
      // Check cache for this image with this provider
      const cachedResult = imageExtractionCache.get(cacheKey);
      if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_EXPIRATION)) {
        console.log(`Using cached OCR result for ${file.name} with ${provider}`);
        return {
          content: cachedResult.content,
          source: cachedResult.source
        };
      }
      
      let extractedText: string;

      // Route to appropriate AI provider based on user preference
      if (provider === AIProvider.GOOGLE) {
        // Check Google API key
        const googleApiKey = getGoogleApiKey();
        if (!googleApiKey) {
          throw new Error('Google API key not found');
        }
        
        const result = await googleVisionProcessor.extractText(file);
        extractedText = result.content;
      } else {
        // Default to Grok (existing logic)
        const base64Data = await fileConverter.fileToBase64(file);
        if (!base64Data) {
          throw new Error('Failed to convert image to base64');
        }
        
        const apiKey = getGrokApiKey();
        if (!apiKey) {
          throw new Error('Grok API key not found');
        }
        
        const requestBody: ChatCompletionRequest = {
          model: "grok-4-0709",
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
              ] as any
            }
          ],
          temperature: 0.1,
          max_tokens: 4000,
        };
        
        const response = await apiClient.callChatCompletions(requestBody, apiKey);
        extractedText = response.choices[0]?.message?.content || 'No text was extracted from the image';
      }
      
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
