
/**
 * Main document processor that delegates to specialized processors
 */

import { pdfProcessor } from './pdfProcessor';
import { wordProcessor } from './wordProcessor';
import { textProcessor } from './textProcessor';
import { fileConverter } from '../utils/fileConverter';

/**
 * Processor for extracting text from document files
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
   * Extract text content from plain text files
   */
  extractTextFileContent: async (file: File): Promise<{ content: string; source: string }> => {
    return textProcessor.extractText(file);
  },

  /**
   * Client-side document text extraction (basic fallback when API is unavailable)
   */
  extractTextClientSide: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            reject(new Error("Failed to read file"));
            return;
          }
          
          // For .txt files
          if (file.name.endsWith('.txt')) {
            resolve(e.target.result as string);
            return;
          }
          
          // For Word documents (.docx, .doc), extract what we can
          if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            // Basic extraction that works in browser
            const text = await fileConverter.getPlainTextFromDocx(e.target.result);
            if (text) {
              resolve(text);
            } else {
              reject(new Error("Could not extract text from Word document"));
            }
            return;
          }
          
          reject(new Error("Unsupported file type for client-side extraction"));
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("FileReader error"));
      };
      
      if (file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  },

  /**
   * Use Grok Vision to extract text from documents as a fallback method
   */
  extractDocumentWithGrok: async (file: File, documentType: string): Promise<{ content: string; source: string }> => {
    if (documentType === 'PDF') {
      return pdfProcessor.extractText(file);
    } else if (documentType === 'Word') {
      return wordProcessor.extractText(file);
    } else {
      throw new Error(`Unsupported document type: ${documentType}`);
    }
  }
};
