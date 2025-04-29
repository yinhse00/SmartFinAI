
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
}

export const pdfProcessor = new PdfProcessor();
