
/**
 * PDF document processor
 */

import { BaseDocumentProcessor } from './baseProcessor';

/**
 * Specialized processor for PDF documents
 */
export class PdfProcessor extends BaseDocumentProcessor {
  /**
   * Extract text from PDF files using Grok Vision
   */
  public async extractText(file: File): Promise<{ content: string; source: string }> {
    try {
      console.log(`Processing PDF: ${file.name}`);
      
      // Check if API is available
      const isApiAvailable = await this.isApiAvailable();
      
      if (isApiAvailable) {
        // Use Grok Vision as a browser-compatible method for PDFs
        return await this.processWithGrokVision(file, 'PDF');
      } else {
        // Fallback message when API is unavailable
        console.warn("Grok API unavailable, using fallback for PDF");
        return this.createApiUnavailableMessage(file, 'PDF');
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
