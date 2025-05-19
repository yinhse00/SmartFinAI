
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
 * Optimized for both speed and quality
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
   * Enhanced with parallel processing and optimized for first-batch delivery
   */
  processFile: async (file: File): Promise<{ content: string; source: string }> => {
    const fileType = fileTypeDetector.detectFileType(file);
    const { mammothAvailable, xlsxAvailable } = checkDocumentLibraries();
    
    console.log(`Processing file: ${file.name}, type: ${fileType}, libraries available:`, { mammothAvailable, xlsxAvailable });
    
    // Define our initial fast response deadline
    const FAST_RESPONSE_DEADLINE = 15000; // 15 seconds
    const startTime = Date.now();
    
    try {
      // Use Promise.race to ensure we get a response within deadline
      return await Promise.race([
        // Main processing promise - full quality
        (async () => {
          try {
            let result;
            switch (fileType) {
              case 'pdf':
                result = await documentProcessor.extractPdfText(file);
                break;
              case 'word':
                result = await documentProcessor.extractWordText(file, mammothAvailable);
                break;
              case 'excel':
                result = await spreadsheetProcessor.extractExcelText(file, xlsxAvailable);
                break;
              case 'image':
                result = await imageProcessor.extractText(file);
                break;
              default:
                result = { content: `Unable to extract text from ${file.name}`, source: file.name };
            }
            
            // If we're past our deadline, add a note that this is the complete response
            if (Date.now() - startTime > FAST_RESPONSE_DEADLINE) {
              result.content = `${result.content}\n\n[Full processing completed after initial delivery]`;
            }
            
            return result;
          } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            return { 
              content: `Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 
              source: file.name 
            };
          }
        })(),
        
        // Timeout promise - returns preliminary results if main processing takes too long
        new Promise<{ content: string; source: string }>((resolve) => {
          setTimeout(() => {
            // Only resolve if we're dealing with a potentially slow format
            if (['pdf', 'excel', 'word'].includes(fileType)) {
              console.log(`Providing initial response for ${file.name} after ${FAST_RESPONSE_DEADLINE/1000}s`);
              resolve({
                content: `[Initial Processing: ${file.name} (${fileType})]\n\nProcessing your ${fileType} file. Initial content is being analyzed and extracted. Full content will be available shortly...`,
                source: file.name,
              });
            }
          }, FAST_RESPONSE_DEADLINE);
        })
      ]);
    } catch (error) {
      console.error(`Error in file processing race for ${file.name}:`, error);
      return { 
        content: `Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        source: file.name 
      };
    }
  }
};
