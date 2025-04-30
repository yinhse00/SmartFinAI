
import { DocumentProcessorInterface } from './interfaces/DocumentProcessorInterface';
import { clientSideTextExtractor } from './utils/clientSideTextExtractor';
import mammoth from 'mammoth';

/**
 * Handles Word document (.docx) processing
 */
export class WordProcessor implements DocumentProcessorInterface {
  async extractText(file: File): Promise<{ content: string; source: string }> {
    try {
      console.log('Processing Word document:', file.name);
      
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      try {
        // First attempt: Use mammoth.js to extract text including tables
        const result = await mammoth.extractRawText({ arrayBuffer });
        console.log('Word document processed with mammoth.js:', result.value.substring(0, 100) + '...');
        return {
          content: result.value,
          source: file.name
        };
      } catch (mammothError) {
        console.warn('Mammoth processing failed, falling back to basic text extraction:', mammothError);
        
        // Fallback: Use basic text extraction mechanism
        const extractedText = await clientSideTextExtractor.extractText(file);
        return {
          content: extractedText,
          source: file.name
        };
      }
    } catch (error) {
      console.error('Error processing Word document:', error);
      throw new Error(`Failed to process Word document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Create and export an instance of the processor to maintain compatibility with existing code
export const wordProcessor = new WordProcessor();
