
import { fileTypeDetector } from './utils/fileTypeDetector';
import { imageProcessor } from './processors/imageProcessor';
import { documentProcessor } from './processors/documentProcessor';
import { spreadsheetProcessor } from './processors/spreadsheetProcessor';
import { textProcessor } from './processors/textProcessor';

/**
 * Service for processing different file types and extracting text content
 */
export const fileProcessingService = {
  /**
   * Process a file and extract text content based on file type
   */
  processFile: async (file: File): Promise<{ content: string; source: string }> => {
    const fileType = fileTypeDetector.detectFileType(file);
    
    try {
      switch (fileType) {
        case 'pdf':
          return await documentProcessor.extractPdfText(file);
        case 'word':
          return await documentProcessor.extractWordText(file);
        case 'excel':
          return await spreadsheetProcessor.extractExcelText(file);
        case 'image':
          return await imageProcessor.extractText(file);
        case 'text':
          return await textProcessor.extractText(file);
        default:
          return { content: `Unable to extract text from ${file.name}`, source: file.name };
      }
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      return { 
        content: `Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        source: file.name 
      };
    }
  }
};
