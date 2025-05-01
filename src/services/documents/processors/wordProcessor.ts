
/**
 * Word document processor
 */

import { BaseDocumentProcessor } from './baseProcessor';
import * as mammoth from 'mammoth';

/**
 * Specialized processor for Word documents
 */
export class WordProcessor extends BaseDocumentProcessor {
  /**
   * Extract text from Word documents using Mammoth
   */
  public async extractText(file: File): Promise<{ content: string; source: string }> {
    try {
      console.log(`Processing Word document: ${file.name}`);
      
      // Check if API is available (same as in PDF processor)
      const isApiAvailable = await this.isApiAvailable();
      
      if (isApiAvailable) {
        // Use Grok Vision API for processing if available
        return await this.processWithGrokVision(file, 'DOCX');
      } else {
        // Use Mammoth.js for local processing when API is unavailable
        const result = await this.extractWithMammoth(file);
        console.log(`Successfully extracted text from Word document: ${file.name} (${result.length} chars)`);
        return {
          content: result,
          source: file.name
        };
      }
    } catch (error) {
      console.error(`Error extracting Word document text from ${file.name}:`, error);
      return {
        content: `Error extracting text from Word document ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  }
  
  /**
   * Use Mammoth.js to extract text from DOCX files
   */
  private async extractWithMammoth(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        if (e.target?.result) {
          try {
            const arrayBuffer = e.target.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            
            // Enhanced processing for listings rule documents
            let extractedText = result.value;
            
            // Special handling for Chapter 14 documents
            if (file.name.includes('Chapter 14') && file.name.includes('Notifiable Transactions')) {
              console.log("Applying special processing for Chapter 14 Notifiable Transactions");
              
              // Improve formatting for rule numbers
              extractedText = extractedText
                .replace(/(\d+\.\d+)(\s+)([A-Z])/g, '$1 $3') // Fix spacing after rule numbers
                .replace(/(\d+)\.(\d+)\s+/g, '$1.$2 '); // Ensure consistent formatting
            }
            
            // Special handling for Chapter 13 documents
            if (file.name.includes('Chapter 13') && file.name.includes('Continuing Obligations')) {
              console.log("Applying special processing for Chapter 13 Continuing Obligations");
              
              // Improve formatting for rule numbers and section headers
              extractedText = extractedText
                .replace(/(\d+\.\d+)(\s+)([A-Z])/g, '$1 $3') // Fix spacing after rule numbers
                .replace(/(\d+)\.(\d+)\s+/g, '$1.$2 ') // Ensure consistent formatting
                .replace(/Chapter\s+13\s+/gi, 'Chapter 13 '); // Standardize chapter reference
            }
            
            resolve(extractedText);
          } catch (err) {
            reject(new Error(`Mammoth processing error: ${err instanceof Error ? err.message : String(err)}`));
          }
        } else {
          reject(new Error("Failed to read file content"));
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
