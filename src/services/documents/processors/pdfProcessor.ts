
/**
 * PDF document processor
 */

import { BaseDocumentProcessor } from './baseProcessor';
import { grokApiService } from '@/services/api/grokApiService';

/**
 * Specialized processor for PDF documents
 */
export class PdfProcessor extends BaseDocumentProcessor {
  /**
   * Extract text from PDF files using Grok Vision
   */
  public async extractText(file: File): Promise<{ content: string; source: string }> {
    try {
      console.log(`Processing PDF: ${file.name} (size: ${(file.size / 1024).toFixed(2)} KB)`);
      
      // Check if API is available
      const isApiAvailable = await this.isApiAvailable();
      
      if (isApiAvailable) {
        try {
          // Use enhanced document processing API
          console.log("Using Grok Vision API for PDF extraction");
          const extractedText = await grokApiService.processDocument(file);
          
          if (!extractedText || extractedText.trim().length === 0) {
            console.warn("API returned empty text from PDF, falling back to basic processing");
            return this.fallbackProcessing(file);
          }
          
          return {
            content: extractedText,
            source: file.name
          };
        } catch (apiError) {
          console.error("Error using Grok Vision API:", apiError);
          // Fall back to basic processing on API error
          console.log("Falling back to basic processing due to API error");
          return this.fallbackProcessing(file);
        }
      } else {
        // Fallback message when API is unavailable
        console.warn("Grok API unavailable, using fallback for PDF");
        return this.fallbackProcessing(file);
      }
    } catch (error) {
      console.error(`Error extracting PDF text from ${file.name}:`, error);
      return {
        content: `Error extracting text from PDF ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  }
  
  /**
   * Fallback processing method when API is unavailable
   */
  private fallbackProcessing(file: File): { content: string; source: string } {
    return {
      content: `Limited PDF extraction available for ${file.name} (${(file.size / 1024).toFixed(2)} KB).

When the API connection is restored, you'll be able to extract full text from PDF files.

In the meantime, you can:
1. Try converting the PDF to a text file format
2. Try a smaller PDF file if this one is large
3. Check the API connection status and ensure your API key is valid`,
      source: file.name
    };
  }
  
  /**
   * Enhanced error handling to provide more detailed diagnostic information
   */
  protected createApiUnavailableMessage(file: File, fileType: string): { content: string; source: string } {
    console.log(`Creating fallback message for ${fileType} file: ${file.name}`);
    return {
      content: `Unable to process ${fileType} file: ${file.name} because the API is unavailable. 
      
This file type requires the Grok Vision API to be configured. For DOCX files, consider converting to PDF or TXT format for more reliable processing.

File details:
- Name: ${file.name}
- Size: ${(file.size / 1024).toFixed(2)} KB
- Type: ${file.type || 'Unknown'}`,
      source: file.name
    };
  }
}

export const pdfProcessor = new PdfProcessor();
