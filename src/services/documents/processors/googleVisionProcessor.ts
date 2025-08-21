import { googleApiClient } from '../../api/google/apiClient';
import { getGoogleApiKey } from '../../apiKeyService';
import { fileConverter } from '../utils/fileConverter';
import { GoogleVisionRequest } from '../../api/google/types';

export const googleVisionProcessor = {
  async extractText(file: File): Promise<{ content: string; source: string }> {
    try {
      console.log(`Processing image with Google Vision: ${file.name}`);
      
      // Convert file to base64
      const base64Data = await fileConverter.fileToBase64(file);
      if (!base64Data) {
        throw new Error('Failed to convert image to base64');
      }

      // Get API key
      const apiKey = getGoogleApiKey();
      if (!apiKey) {
        throw new Error('Google API key not found');
      }

      // Extract base64 content without data URL prefix
      const base64Content = base64Data.split(',')[1] || base64Data;

      // Prepare request for Google Vision API
      const requestBody: GoogleVisionRequest = {
        model: "gemini-2.0-flash",
        contents: [{
          parts: [
            { 
              text: "Extract all the text from this image. Format it in a clear, readable way maintaining paragraphs, headings, and bullet points if present." 
            },
            { 
              inline_data: {
                mime_type: file.type || 'image/jpeg',
                data: base64Content
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4000,
        }
      };
      
      // Call Google API
      const response = await googleApiClient.callVisionAPI(requestBody, apiKey);
      
      // Extract the text content from the response
      const extractedText = response.candidates[0]?.content?.parts[0]?.text || 'No text was extracted from the image';
      
      console.log(`Successfully extracted text from image ${file.name}`);
      
      return {
        content: extractedText,
        source: file.name
      };
    } catch (error) {
      console.error(`Error in Google Vision processing for ${file.name}:`, error);
      throw error;
    }
  }
};