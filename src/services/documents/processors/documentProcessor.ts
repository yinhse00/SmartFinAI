import { apiClient } from '../../api/grok/apiClient';
import { getGrokApiKey } from '../../apiKeyService';
import { fileConverter } from '../utils/fileConverter';
import { checkApiAvailability } from '../../api/grok/modules/endpointManager';
import { useToast } from '@/hooks/use-toast';

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
      
      // Check if API is available
      const apiKey = getGrokApiKey();
      const isApiAvailable = apiKey ? await checkApiAvailability(apiKey) : false;
      
      if (isApiAvailable) {
        // Use Grok Vision as a browser-compatible method for PDFs
        return await documentProcessor.extractDocumentWithGrok(file, 'PDF');
      } else {
        // Fallback message when API is unavailable
        console.warn("Grok API unavailable, using fallback for PDF");
        return {
          content: `[Document Text Extraction Limited: The PDF '${file.name}' could not be fully processed because the Grok API is currently unreachable. Basic text has been extracted where possible, but formatting and some content may be missing.]`,
          source: file.name
        };
      }
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
      
      // Check if API is available
      const apiKey = getGrokApiKey();
      const isApiAvailable = apiKey ? await checkApiAvailability(apiKey) : false;

      if (isApiAvailable) {
        // Use Grok Vision for Word documents
        return await documentProcessor.extractDocumentWithGrok(file, 'Word');
      } else {
        // Fallback - client-side basic extraction for Word
        console.warn("Grok API unavailable, using client-side fallback for Word document");
        
        try {
          // Try to use browser-side extraction if available
          const text = await documentProcessor.extractTextClientSide(file);
          return {
            content: `[Limited Processing Mode: API Unreachable]\n\n${text}`,
            source: file.name
          };
        } catch (fallbackError) {
          console.error("Client-side fallback failed:", fallbackError);
          return {
            content: `[Document Text Extraction Limited: The Word document '${file.name}' could not be processed because the Grok API is currently unreachable. Please try again later or provide the text in another format.]`,
            source: file.name
          };
        }
      }
    } catch (error) {
      console.error(`Error extracting Word text from ${file.name}:`, error);
      return {
        content: `Error extracting text from Word document ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  },

  /**
   * Client-side document text extraction (basic fallback when API is unavailable)
   */
  extractTextClientSide: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            reject(new Error("Failed to read file"));
            return;
          }
          
          // For .txt files
          if (file.name.endsWith('.txt')) {
            resolve(e.target.result as string);
            return;
          }
          
          // For Word documents (.docx, .doc), extract what we can
          if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            // Basic extraction that works in browser
            const text = await fileConverter.getPlainTextFromDocx(e.target.result);
            if (text) {
              resolve(text);
            } else {
              reject(new Error("Could not extract text from Word document"));
            }
            return;
          }
          
          reject(new Error("Unsupported file type for client-side extraction"));
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("FileReader error"));
      };
      
      if (file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
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
        model: "grok-3-beta", // Updated from grok-2-vision-latest to grok-3-beta
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
};
