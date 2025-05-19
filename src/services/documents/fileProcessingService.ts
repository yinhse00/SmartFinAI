
import { fileTypeDetector } from './utils/fileTypeDetector';
import { imageProcessor } from './processors/imageProcessor';
import { documentProcessor } from './processors/documentProcessor';
import { spreadsheetProcessor } from './processors/spreadsheetProcessor';

/**
 * Check if required document libraries are loaded
 */
const checkDocumentLibraries = (): { mammothAvailable: boolean, xlsxAvailable: boolean } => {
  const mammothAvailable = typeof window !== 'undefined' && 'mammoth' in window && window.mammoth !== undefined;
  const xlsxAvailable = typeof window !== 'undefined' && 'XLSX' in window && window.XLSX !== undefined;
  
  console.log("Document libraries status:", { mammothAvailable, xlsxAvailable });
  
  return { mammothAvailable, xlsxAvailable };
};

/**
 * Service for processing different file types and extracting text content
 */
export const fileProcessingService = {
  /**
   * Check if document processing libraries are available
   */
  checkLibrariesAvailable: (): { mammothAvailable: boolean, xlsxAvailable: boolean } => {
    return checkDocumentLibraries();
  },
  
  /**
   * Process a file and extract text content based on file type
   */
  processFile: async (file: File): Promise<{ content: string; source: string }> => {
    const fileType = fileTypeDetector.detectFileType(file);
    const { mammothAvailable, xlsxAvailable } = checkDocumentLibraries();
    
    console.log(`Processing file: ${file.name}, type: ${fileType}, libraries available:`, { mammothAvailable, xlsxAvailable });
    
    try {
      switch (fileType) {
        case 'pdf':
          return await documentProcessor.extractPdfText(file);
        case 'word':
          return await documentProcessor.extractWordText(file, mammothAvailable);
        case 'excel':
          return await spreadsheetProcessor.extractExcelText(file, xlsxAvailable);
        case 'image':
          return await imageProcessor.extractText(file);
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
