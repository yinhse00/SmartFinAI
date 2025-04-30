
import * as mammoth from 'mammoth';
import { DocumentProcessorInterface } from './baseProcessor';

export class WordProcessor implements DocumentProcessorInterface {
  /**
   * Extract text from a Word document
   */
  async extractText(file: File): Promise<{ content: string; source: string }> {
    try {
      console.log('Processing Word document:', file.name);
      
      // Read the file as ArrayBuffer
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      // Use the extracted array buffer processing method
      const text = await this.extractTextFromArrayBuffer(arrayBuffer);
      
      return {
        content: text || 'No text content could be extracted from the document.',
        source: file.name
      };
    } catch (error) {
      console.error('Error extracting text from Word document:', error);
      return {
        content: `Error extracting text: ${error instanceof Error ? error.message : String(error)}`,
        source: file.name
      };
    }
  }

  /**
   * Read file as ArrayBuffer
   */
  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as ArrayBuffer);
      };
      reader.onerror = () => {
        reject(new Error('Error reading file as ArrayBuffer'));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract text from ArrayBuffer using mammoth.js
   */
  private async extractTextFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Mammoth extraction error:', error);
      throw new Error(`Word document parsing error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export a singleton instance
export const wordProcessor = new WordProcessor();
