
import { fileTypeDetector } from './utils/fileTypeDetector';
import { imageProcessor } from './processors/imageProcessor';
import { documentProcessor } from './processors/documentProcessor';
import { spreadsheetProcessor } from './processors/spreadsheetProcessor';
import { textProcessor } from './processors/textProcessor';
import { toast } from '@/components/ui/use-toast';
import { grokApiService } from '../api/grokApiService';

/**
 * Service for processing different file types and extracting text content
 */
export const fileProcessingService = {
  /**
   * Process a file and extract text content based on file type
   */
  processFile: async (file: File): Promise<{ content: string; source: string }> => {
    const fileType = fileTypeDetector.detectFileType(file);
    
    // First check API connectivity before attempting processing
    let isApiAvailable = false;
    try {
      // Quick check to see if the API is available
      const result = await grokApiService.testApiConnection();
      isApiAvailable = result.success;
      
      if (!isApiAvailable) {
        console.warn('API is not available, using offline mode for file processing');
        toast({
          title: "Limited File Processing",
          description: "Operating in offline mode with limited file processing capabilities.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error checking API availability:', error);
      isApiAvailable = false;
    }
    
    try {
      // Display toast notification about processing
      toast({
        title: "Processing File",
        description: `Extracting content from ${file.name}...${!isApiAvailable ? ' (Limited offline mode)' : ''}`,
        duration: 3000,
      });
      
      // Process based on file type
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
          return { content: `Unable to extract text from ${file.name}. Unsupported file type.`, source: file.name };
      }
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      
      // Provide more helpful error message
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network Error')) {
        errorMessage = `Network connectivity issue while processing ${file.name}. The API may be unreachable or blocked by CORS restrictions. Please check your internet connection and API configuration.`;
      } else if (errorMessage.includes('413') || errorMessage.includes('Payload Too Large')) {
        errorMessage = `The file ${file.name} is too large for processing. Please try a smaller file or split the content.`;
      }
      
      toast({
        title: "File Processing Failed",
        description: `Could not process ${file.name}. ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}`,
        variant: "destructive",
        duration: 5000,
      });
      
      return { 
        content: `Error processing ${file.name}: ${errorMessage}`, 
        source: file.name 
      };
    }
  }
};
