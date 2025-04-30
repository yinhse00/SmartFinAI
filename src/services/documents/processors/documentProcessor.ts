
import { pdfProcessor } from './pdfProcessor';
import { wordProcessor } from './wordProcessor';
import { clientSideTextExtractor } from './utils/clientSideTextExtractor';

/**
 * Main document processor service that delegates to specific processors
 */
export const documentProcessor = {
  /**
   * Extract text from PDF files
   */
  extractPdfText: async (file: File): Promise<{ content: string; source: string }> => {
    return pdfProcessor.extractText(file);
  },

  /**
   * Extract text content from Word documents
   */
  extractWordText: async (file: File): Promise<{ content: string; source: string }> => {
    return wordProcessor.extractText(file);
  },

  /**
   * Client-side document text extraction (basic fallback when API is unavailable)
   */
  extractTextClientSide: async (file: File): Promise<string> => {
    return clientSideTextExtractor.extractText(file);
  },

  /**
   * Use Grok Vision to extract text from documents as a fallback method
   * @deprecated Use the specific processor implementations directly
   */
  extractDocumentWithGrok: async (file: File, documentType: string): Promise<{ content: string; source: string }> => {
    // This is kept for backward compatibility
    // Import dynamically to avoid circular dependencies
    const { useGrokVisionProcessor } = await import('./utils/grokVisionProcessor');
    return useGrokVisionProcessor(file, documentType);
  }
};
