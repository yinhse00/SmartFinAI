
/**
 * Word document processor
 */

import { BaseDocumentProcessor } from './baseProcessor';
import { fileConverter } from '../utils/fileConverter';

/**
 * Specialized processor for Word documents
 */
export class WordProcessor extends BaseDocumentProcessor {
  /**
   * Extract text from Word documents
   */
  public async extractText(file: File): Promise<{ content: string; source: string }> {
    try {
      console.log(`Processing Word document: ${file.name}`);
      
      // Check if API is available
      const isApiAvailable = await this.isApiAvailable();

      if (isApiAvailable) {
        // Use Grok Vision for Word documents
        return await this.processWithGrokVision(file, 'Word');
      } else {
        // Fallback - client-side basic extraction for Word
        console.warn("Grok API unavailable, using client-side fallback for Word document");
        
        try {
          // Try to use browser-side extraction if available
          const text = await this.extractTextClientSide(file);
          return {
            content: `[Limited Processing Mode: API Unreachable]\n\n${text}`,
            source: file.name
          };
        } catch (fallbackError) {
          console.error("Client-side fallback failed:", fallbackError);
          return this.createApiUnavailableMessage(file, 'Word document');
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

  /**
   * Extract text from a document using client-side methods
   */
  private async extractTextClientSide(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            reject(new Error("Failed to read file"));
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
      
      reader.readAsArrayBuffer(file);
    });
  }
}

export const wordProcessor = new WordProcessor();
