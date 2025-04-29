
/**
 * Text file processor
 */

import { BaseDocumentProcessor } from './baseProcessor';

/**
 * Specialized processor for plain text files
 */
export class TextProcessor extends BaseDocumentProcessor {
  /**
   * Extract content from text files
   */
  public async extractText(file: File): Promise<{ content: string; source: string }> {
    try {
      console.log(`Processing text file: ${file.name}`);
      
      const text = await this.readTextFile(file);
      return {
        content: text,
        source: file.name
      };
    } catch (error) {
      console.error(`Error extracting text from ${file.name}:`, error);
      return {
        content: `Error extracting text from ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  }

  /**
   * Read content from a text file
   */
  private readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to read text file"));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("FileReader error"));
      };
      
      reader.readAsText(file);
    });
  }
}

export const textProcessor = new TextProcessor();
