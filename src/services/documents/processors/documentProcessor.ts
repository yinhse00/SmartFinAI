
/**
 * Main document processor
 */

import { pdfProcessor } from './pdfProcessor';
import { textProcessor } from './textProcessor';
import { BaseDocumentProcessor } from './baseProcessor';
import { wordProcessor } from './wordProcessor';

/**
 * Processor for document files (PDF, Word)
 */
export class DocumentProcessor extends BaseDocumentProcessor {
  /**
   * Extract text from PDF documents
   */
  public async extractPdfText(file: File): Promise<{ content: string; source: string }> {
    console.log(`DocumentProcessor: Delegating PDF processing for ${file.name}`);
    return await pdfProcessor.extractText(file);
  }

  /**
   * Extract text from Word documents
   * Uses a specialized processor that works well with DOCX files
   */
  public async extractWordText(file: File): Promise<{ content: string; source: string }> {
    console.log(`DocumentProcessor: Delegating Word processing for ${file.name}`);
    try {
      // First attempt with dedicated Word processor
      return await wordProcessor.extractText(file);
    } catch (error) {
      console.warn(`Word processor failed for ${file.name}, trying text fallback:`, error);
      
      // If Word processor fails, try falling back to text processor
      // This helps with simpler DOCX files that might be interpreted as text
      try {
        return await textProcessor.extractText(file);
      } catch (innerError) {
        console.error(`Both processors failed for ${file.name}:`, innerError);
        return {
          content: `Failed to extract content from ${file.name}. The document may be corrupted or in an unsupported format.`,
          source: file.name
        };
      }
    }
  }
}

export const documentProcessor = new DocumentProcessor();
