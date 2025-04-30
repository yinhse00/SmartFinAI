
import { apiClient } from '../../api/grok/apiClient';
import { getGrokApiKey } from '../../apiKeyService';
import { fileConverter } from '../utils/fileConverter';
import { checkApiAvailability } from '../../api/grok/modules/endpointManager';
import { DocumentProcessorInterface } from './interfaces/DocumentProcessorInterface';
import { useGrokVisionProcessor } from './utils/grokVisionProcessor';
// Add missing import for clientSideTextExtractor
import { clientSideTextExtractor } from './utils/clientSideTextExtractor';

/**
 * Processor specifically for Word documents
 */
export const wordProcessor: DocumentProcessorInterface = {
  /**
   * Extract text content from Word documents
   */
  extractText: async (file: File): Promise<{ content: string; source: string }> => {
    try {
      console.log(`Processing Word document: ${file.name}`);
      
      // Check if API is available
      const apiKey = getGrokApiKey();
      const isApiAvailable = apiKey ? await checkApiAvailability(apiKey) : false;

      if (isApiAvailable) {
        // Use Grok Vision for Word documents
        return await useGrokVisionProcessor(file, 'Word');
      } else {
        // Fallback - client-side basic extraction for Word
        console.warn("Grok API unavailable, using client-side fallback for Word document");
        
        try {
          // Try to use browser-side extraction if available
          const text = await clientSideTextExtractor.extractText(file);
          return {
            content: `[Limited Processing Mode: API Unreachable]\n\n${text}`,
            source: file.name
          };
        } catch (fallbackError) {
          console.error("Client-side fallback failed:", fallbackError);
          return {
            content: `[Document Text Extraction Limited: The Word document '${file.name}' could not be processed because the Grok API is currently unreachable. Please try again later or provide the text in another format.]`,
            source: file.name
          };
        }
      }
    } catch (error) {
      console.error(`Error extracting Word text from ${file.name}:`, error);
      return {
        content: `Error extracting text from Word document ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  }
};
