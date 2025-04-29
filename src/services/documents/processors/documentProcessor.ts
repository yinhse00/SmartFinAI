
import { apiClient } from '../../api/grok/apiClient';
import { getGrokApiKey } from '../../apiKeyService';
import { fileConverter } from '../utils/fileConverter';

/**
 * Processor for extracting text from document files using Grok Vision
 */
export const documentProcessor = {
  /**
   * Extract text from PDF files using browser-compatible approach
   */
  extractPdfText: async (file: File): Promise<{ content: string; source: string }> => {
    try {
      console.log(`Processing PDF: ${file.name}`);
      
      // Use Grok Vision as a browser-compatible method for PDFs
      return await documentProcessor.extractDocumentWithGrok(file, 'PDF');
    } catch (error) {
      console.error(`Error extracting PDF text from ${file.name}:`, error);
      return {
        content: `Error extracting text from PDF ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  },

  /**
   * Extract text content from Word documents
   */
  extractWordText: async (file: File): Promise<{ content: string; source: string }> => {
    try {
      console.log(`Processing Word document: ${file.name}`);
      
      // Use Grok Vision for Word documents
      return await documentProcessor.extractDocumentWithGrok(file, 'Word');
    } catch (error) {
      console.error(`Error extracting Word text from ${file.name}:`, error);
      return {
        content: `Error extracting text from Word document ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  },

  /**
   * Use Grok Vision to extract text from documents as a fallback method
   */
  extractDocumentWithGrok: async (file: File, documentType: string): Promise<{ content: string; source: string }> => {
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
      
      // Call Grok API
      const response = await apiClient.callChatCompletions(requestBody, apiKey);
      
      // Extract the text content from the response
      const extractedText = response.choices[0]?.message?.content || `No text was extracted from the ${documentType} file`;
      
      console.log(`Successfully extracted text from ${documentType} ${file.name}`);
      
      return {
        content: extractedText,
        source: file.name
      };
    } catch (error) {
      console.error(`Error in ${documentType} processing for ${file.name}:`, error);
      return {
        content: `Error extracting text from ${documentType} ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  }
};
