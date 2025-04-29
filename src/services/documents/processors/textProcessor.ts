
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
      
      // Enhanced processing for larger text files
      if (text.length > 10000) {
        console.log(`Large text file detected (${text.length} chars). Performing chapter detection...`);
        const detectedChapter = this.detectChapter(text);
        if (detectedChapter) {
          console.log(`Detected chapter: ${detectedChapter} in text file`);
        }
      }
      
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
  
  /**
   * Detect chapter from text content
   * This helps categorize regulatory content
   */
  private detectChapter(content: string): string | null {
    const chapter14Regex = /Chapter\s*14\s*(?:Notifiable\s*Transactions)/i;
    const chapter14aRegex = /Chapter\s*14A\s*(?:Connected\s*Transactions)/i;
    const chapter13Regex = /Chapter\s*13\s*(?:Equity\s*Securities)/i;
    
    if (chapter14aRegex.test(content)) {
      return '14A';
    } else if (chapter14Regex.test(content)) {
      return '14';
    } else if (chapter13Regex.test(content)) {
      return '13';
    }
    
    return null;
  }
}

export const textProcessor = new TextProcessor();
