
import { apiClient } from '../../api/grok/apiClient';
import { getGrokApiKey } from '../../apiKeyService';
import { fileConverter } from '../utils/fileConverter';
import { checkApiAvailability } from '../../api/grok/modules/endpointManager';
import { DocumentProcessorInterface } from './interfaces/DocumentProcessorInterface';
import { useGrokVisionProcessor } from './utils/grokVisionProcessor';

/**
 * Processor specifically for PDF documents
 */
export const pdfProcessor: DocumentProcessorInterface = {
  /**
   * Extract text from PDF files using browser-compatible approach
   */
  extractText: async (file: File): Promise<{ content: string; source: string }> => {
    try {
      console.log(`Processing PDF: ${file.name}`);
      
      // Check if API is available
      const apiKey = getGrokApiKey();
      const isApiAvailable = apiKey ? await checkApiAvailability(apiKey) : false;
      
      if (isApiAvailable) {
        // Use Grok Vision for PDFs
        return await useGrokVisionProcessor(file, 'PDF');
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
  }
};
