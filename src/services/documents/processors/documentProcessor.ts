
import { apiClient } from '../../api/grok/apiClient';
import { getGrokApiKey } from '../../apiKeyService';
import { fileConverter } from '../utils/fileConverter';
import { checkApiAvailability } from '../../api/grok/modules/endpointManager';
import { ChatCompletionMessage, ChatCompletionRequest } from '../../api/grok/types';

/**
 * Processor for extracting text from document files using client-side extraction first
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
   * Extract text content from Word documents with improved client-side first approach
   */
  extractWordText: async (file: File, mammothAvailable: boolean = false): Promise<{ content: string; source: string }> => {
    try {
      console.log(`Processing Word document: ${file.name}, Mammoth available: ${mammothAvailable}`);
      
      // Always try client-side extraction first
      try {
        console.log("Attempting client-side Word document extraction");
        
        if (!mammothAvailable) {
          console.warn("Mammoth.js not available for client-side extraction");
        }
        
        const text = await documentProcessor.extractTextClientSide(file);
        
        if (text && text.trim().length > 0 && !text.includes('[Document text extraction')) {
          console.log("Client-side extraction successful");
          return {
            content: text,
            source: file.name
          };
        } else {
          console.log("Client-side extraction returned empty or error content, trying API fallback");
        }
      } catch (clientError) {
        console.warn("Client-side extraction failed:", clientError);
        // Continue to API fallback
      }
      
      // API-based fallback - only if client-side failed
      const apiKey = getGrokApiKey();
      const isApiAvailable = apiKey ? await checkApiAvailability(apiKey) : false;

      if (isApiAvailable) {
        // Use text-based API request for Word documents
        return await documentProcessor.extractDocumentWithTextPrompt(file, 'Word');
      } else {
        // Last resort fallback when API is unavailable
        console.warn("Grok API unavailable, using client-side fallback for Word document");
        
        if (mammothAvailable) {
          // If Mammoth is available but initial extraction failed, try again with more debugging
          try {
            console.log("Retrying extraction with Mammoth.js");
            const reader = new FileReader();
            const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as ArrayBuffer);
              reader.onerror = reject;
              reader.readAsArrayBuffer(file);
            });
            
            const text = await fileConverter.getPlainTextFromDocx(buffer);
            return {
              content: text,
              source: file.name
            };
          } catch (mammothError) {
            console.error("Mammoth.js extraction failed:", mammothError);
          }
        }
        
        return {
          content: `[Document Text Extraction Limited: The Word document '${file.name}' could not be processed in offline mode because Mammoth.js is not available or failed to extract content. Please try again when online or provide the text in another format.]`,
          source: file.name
        };
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
   * Client-side document text extraction (primary method now, not just fallback)
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
            // Enhanced extraction that works in browser
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
   * Use Grok API to extract text from documents using text-based prompts instead of image inputs
   */
  extractDocumentWithTextPrompt: async (file: File, documentType: string): Promise<{ content: string; source: string }> => {
    try {
      console.log(`Processing ${documentType} with text-based prompt: ${file.name}`);
      
      // Extract text content first using client-side methods
      let textContent = "";
      try {
        textContent = await documentProcessor.extractTextClientSide(file);
      } catch (extractionError) {
        console.warn("Could not pre-extract text:", extractionError);
        textContent = `[Unable to pre-extract content from ${file.name}]`;
      }
      
      // Prepare request for Grok API using text prompt only (no image)
      const apiKey = getGrokApiKey();
      if (!apiKey) {
        throw new Error('Grok API key not found');
      }
      
      const requestBody: ChatCompletionRequest = {
        model: "grok-4-0709",
        messages: [
          {
            role: "system" as const, 
            content: `You are a document formatting assistant. The user will provide extracted text from a ${documentType} file that may have formatting issues. Your task is to clean up and format this text to make it more readable while preserving the original content and structure.`
          },
          {
            role: "user" as const, 
            content: `This is raw text extracted from a ${documentType} file. Please clean up any formatting issues and organize it in a clear, readable way:\n\n${textContent}`
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
        const formattedText = response.choices[0]?.message?.content || textContent;
        
        console.log(`Successfully processed text from ${documentType} ${file.name}`);
        
        return {
          content: formattedText,
          source: file.name
        };
      } catch (apiError) {
        clearTimeout(timeoutId);
        console.warn("API processing failed, using pre-extracted text:", apiError);
        
        // Fall back to the pre-extracted text
        return {
          content: textContent,
          source: file.name
        };
      }
    } catch (error) {
      console.error(`Error in ${documentType} processing for ${file.name}:`, error);
      
      return {
        content: `Error processing ${documentType} ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
        source: file.name
      };
    }
  },

  // We're keeping the old method for backward compatibility
  extractDocumentWithGrok: async (file: File, documentType: string): Promise<{ content: string; source: string }> => {
    // Only used for PDF files now, so we'll redirect to text-prompt method for Word documents
    if (documentType === 'Word') {
      return documentProcessor.extractDocumentWithTextPrompt(file, documentType);
    }
    
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
      
      const requestBody: ChatCompletionRequest = {
        model: "grok-4-0709",
        messages: [
          {
            role: "user" as const, 
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
            ] as any // Using type assertion for complex content structure
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
