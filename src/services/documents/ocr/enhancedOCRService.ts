import { createWorker, Worker } from 'tesseract.js';
import { imageProcessor } from '../processors/imageProcessor';

interface OCRResult {
  text: string;
  confidence: number;
  source: 'tesseract' | 'grok' | 'hybrid';
  language?: string;
}

interface DocumentStructure {
  tables: string[];
  headings: string[];
  lists: string[];
  metadata: { [key: string]: any };
  originalText: string;
}

class EnhancedOCRService {
  private tesseractWorker: Worker | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.tesseractWorker = await createWorker(['eng', 'chi_sim', 'chi_tra'], 1, {
        logger: m => console.log('Tesseract:', m)
      });
      this.isInitialized = true;
      console.log('Tesseract worker initialized');
    } catch (error) {
      console.error('Failed to initialize Tesseract worker:', error);
    }
  }

  async performClientSideOCR(file: File): Promise<OCRResult> {
    if (!this.tesseractWorker) {
      await this.initialize();
    }

    if (!this.tesseractWorker) {
      throw new Error('Tesseract worker not available');
    }

    try {
      const result = await this.tesseractWorker.recognize(file);
      
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        source: 'tesseract',
        language: result.data.text.match(/[\u4e00-\u9fff]/) ? 'chinese' : 'english'
      };
    } catch (error) {
      console.error('Client-side OCR failed:', error);
      throw error;
    }
  }

  async performGrokVisionOCR(file: File): Promise<OCRResult> {
    try {
      const result = await imageProcessor.extractText(file);
      return {
        text: result.content,
        confidence: 85, // Estimated confidence for Grok
        source: 'grok'
      };
    } catch (error) {
      console.error('Grok Vision OCR failed:', error);
      throw error;
    }
  }

  async performHybridOCR(file: File): Promise<OCRResult> {
    const results: OCRResult[] = [];

    // Try both OCR methods
    try {
      const tesseractResult = await this.performClientSideOCR(file);
      results.push(tesseractResult);
    } catch (error) {
      console.warn('Tesseract OCR failed, trying Grok Vision');
    }

    try {
      const grokResult = await this.performGrokVisionOCR(file);
      results.push(grokResult);
    } catch (error) {
      console.warn('Grok Vision OCR failed');
    }

    if (results.length === 0) {
      throw new Error('All OCR methods failed');
    }

    // If we have multiple results, choose the best one
    if (results.length > 1) {
      const bestResult = this.selectBestResult(results);
      return {
        ...bestResult,
        source: 'hybrid'
      };
    }

    return results[0];
  }

  private selectBestResult(results: OCRResult[]): OCRResult {
    // Prefer result with higher confidence
    // If confidence is similar, prefer longer text (more content extracted)
    return results.reduce((best, current) => {
      if (current.confidence > best.confidence + 10) {
        return current;
      }
      if (Math.abs(current.confidence - best.confidence) <= 10) {
        return current.text.length > best.text.length ? current : best;
      }
      return best;
    });
  }

  analyzeDocumentStructure(content: string): DocumentStructure {
    const lines = content.split('\n').filter(line => line.trim());
    
    const tables = this.extractTables(content);
    const headings = this.extractHeadings(lines);
    const lists = this.extractLists(lines);
    const metadata = this.extractMetadata(content);

    return {
      tables,
      headings,
      lists,
      metadata,
      originalText: content
    };
  }

  private extractTables(content: string): string[] {
    // Look for table-like patterns (multiple columns separated by spaces/tabs)
    const tablePattern = /^(\s*\S+\s+\S+\s+\S+.*?)$/gm;
    const matches = content.match(tablePattern) || [];
    
    // Group consecutive table rows
    const tables: string[] = [];
    let currentTable = '';
    
    matches.forEach(line => {
      if (currentTable && this.isTableContinuation(line, currentTable)) {
        currentTable += '\n' + line;
      } else {
        if (currentTable) {
          tables.push(currentTable.trim());
        }
        currentTable = line;
      }
    });
    
    if (currentTable) {
      tables.push(currentTable.trim());
    }
    
    return tables.filter(table => table.split('\n').length >= 2);
  }

  private isTableContinuation(line: string, currentTable: string): boolean {
    const lineColumns = line.trim().split(/\s+/).length;
    const tableLines = currentTable.split('\n');
    const avgColumns = tableLines.reduce((sum, l) => sum + l.trim().split(/\s+/).length, 0) / tableLines.length;
    
    return Math.abs(lineColumns - avgColumns) <= 2;
  }

  private extractHeadings(lines: string[]): string[] {
    return lines.filter(line => {
      const trimmed = line.trim();
      // Look for lines that might be headings (short, capitalized, etc.)
      return trimmed.length > 0 && 
             trimmed.length < 100 && 
             (trimmed === trimmed.toUpperCase() || 
              /^[A-Z][^.]*$/.test(trimmed) ||
              /^\d+\.?\s+[A-Z]/.test(trimmed));
    });
  }

  private extractLists(lines: string[]): string[] {
    return lines.filter(line => {
      const trimmed = line.trim();
      // Look for bullet points, numbered lists, etc.
      return /^[-•*]\s+/.test(trimmed) || 
             /^\d+[.)]\s+/.test(trimmed) ||
             /^[a-z][.)]\s+/.test(trimmed);
    });
  }

  private extractMetadata(content: string): { [key: string]: any } {
    const metadata: { [key: string]: any } = {};
    
    // Extract common metadata patterns
    const datePattern = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g;
    const dates = content.match(datePattern) || [];
    if (dates.length > 0) metadata.dates = [...new Set(dates)];
    
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = content.match(emailPattern) || [];
    if (emails.length > 0) metadata.emails = [...new Set(emails)];
    
    const phonePattern = /\b(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
    const phones = content.match(phonePattern) || [];
    if (phones.length > 0) metadata.phones = [...new Set(phones)];
    
    // Extract numbers that might be important (amounts, percentages, etc.)
    const numberPattern = /\b(\$?[\d,]+\.?\d*%?|\d+[\d,]*\.?\d*%)\b/g;
    const numbers = content.match(numberPattern) || [];
    if (numbers.length > 0) metadata.numbers = [...new Set(numbers)];
    
    metadata.wordCount = content.split(/\s+/).length;
    metadata.lineCount = content.split('\n').length;
    
    return metadata;
  }

  async cleanup() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
      this.isInitialized = false;
    }
  }
}

export const enhancedOCRService = new EnhancedOCRService();