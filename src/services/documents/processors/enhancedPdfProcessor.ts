import { enhancedOCRService } from '../ocr/enhancedOCRService';
import { documentProcessor } from './documentProcessor';
import { CentralBrainService } from '../../brain/centralBrainService';
import { getFeatureAIPreference } from '../../ai/aiPreferences';

interface ProcessedPdfResult {
  content: string;
  source: string;
  metadata: {
    method: string;
    pageCount?: number;
    hasImages: boolean;
    structure?: any;
  };
}

export const enhancedPdfProcessor = {
  async extractText(file: File): Promise<ProcessedPdfResult> {
    try {
      console.log(`Processing PDF: ${file.name} (${file.size} bytes)`);

      // First, try traditional PDF text extraction
      let extractedText = '';
      let extractionMethod = 'text-extraction';
      let hasImages = false;

      try {
        const textResult = await documentProcessor.extractPdfText(file);
        extractedText = textResult.content;
        
        // Check if the extracted text is meaningful (not just garbled or very short)
        if (this.isTextMeaningful(extractedText)) {
          console.log('PDF text extraction successful');
        } else {
          // Text extraction didn't work well, try OCR
          console.log('PDF text extraction yielded poor results, trying OCR...');
          extractedText = await this.performOCROnPdf(file);
          extractionMethod = 'ocr';
          hasImages = true;
        }
      } catch (error) {
        console.log('PDF text extraction failed, falling back to OCR');
        extractedText = await this.performOCROnPdf(file);
        extractionMethod = 'ocr-fallback';
        hasImages = true;
      }

      // Analyze document structure
      const structure = enhancedOCRService.analyzeDocumentStructure(extractedText);
      
      // Format the content for better presentation
      const formattedContent = this.formatPdfContent(extractedText, structure, extractionMethod);

      return {
        content: formattedContent,
        source: `Enhanced PDF Processing (${file.name})`,
        metadata: {
          method: extractionMethod,
          hasImages,
          structure: {
            headings: structure.headings.length,
            tables: structure.tables.length,
            lists: structure.lists.length,
            wordCount: structure.metadata.wordCount,
            pages: this.estimatePageCount(extractedText)
          }
        }
      };
    } catch (error) {
      console.error('Enhanced PDF processing failed:', error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async performOCROnPdf(file: File): Promise<string> {
    // For PDF OCR, we would need to convert PDF to images first
    // This is a simplified approach - in production, you'd use pdf-poppler or similar
    console.log('Performing OCR on PDF using centralized brain system');
    
    try {
      // Use centralized brain system for OCR processing
      const preferences = getFeatureAIPreference('chat');
      const response = await CentralBrainService.processFileAnalysis(
        'Extract all text from this PDF document using OCR', 
        [file], 
        {
          preferences,
          feature: 'pdf_ocr',
          extractionType: 'text'
        }
      );

      if (response.success) {
        return response.content;
      } else {
        // Fallback to original OCR service
        const ocrResult = await enhancedOCRService.performHybridOCR(file);
        return ocrResult.text;
      }
    } catch (error) {
      console.error('Brain system PDF OCR failed, trying fallback:', error);
      try {
        // Fallback to original OCR service
        const ocrResult = await enhancedOCRService.performHybridOCR(file);
        return ocrResult.text;
      } catch (fallbackError) {
        console.error('Direct PDF OCR failed:', fallbackError);
        throw new Error('PDF OCR processing failed');
      }
    }
  },

  isTextMeaningful(text: string): boolean {
    if (!text || text.length < 50) return false;
    
    // Check for common indicators of poor text extraction
    const poorExtractionIndicators = [
      /^[\s\n]*$/, // Only whitespace
      /^[^\w\s]{20,}/, // Starts with many special characters
      /(.)\1{10,}/, // Repeated characters
    ];
    
    for (const indicator of poorExtractionIndicators) {
      if (indicator.test(text)) return false;
    }
    
    // Check if we have a reasonable ratio of words to total characters
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordRatio = words.length / text.length;
    
    return wordRatio > 0.1; // At least 10% of characters should be in words
  },

  formatPdfContent(text: string, structure: any, method: string): string {
    let formatted = `**PDF Content Analysis** (Extraction method: ${method})\n\n`;
    
    // Add document overview
    formatted += `**Document Overview:**\n`;
    formatted += `• Word count: ${structure.metadata.wordCount}\n`;
    formatted += `• Estimated pages: ${this.estimatePageCount(text)}\n`;
    formatted += `• Headings found: ${structure.headings.length}\n`;
    formatted += `• Tables found: ${structure.tables.length}\n`;
    formatted += `• Lists found: ${structure.lists.length}\n\n`;

    // Add headings section
    if (structure.headings.length > 0) {
      formatted += `**Document Structure:**\n`;
      structure.headings.forEach((heading: string, index: number) => {
        formatted += `${index + 1}. ${heading}\n`;
      });
      formatted += '\n';
    }

    // Add tables if found
    if (structure.tables.length > 0) {
      formatted += `**Tables/Data:**\n`;
      structure.tables.forEach((table: string, index: number) => {
        formatted += `Table ${index + 1}:\n${table}\n\n`;
      });
    }

    // Add key information extracted
    if (structure.metadata.dates?.length > 0) {
      formatted += `**Important Dates:** ${structure.metadata.dates.slice(0, 5).join(', ')}\n`;
    }
    
    if (structure.metadata.numbers?.length > 0) {
      formatted += `**Key Numbers:** ${structure.metadata.numbers.slice(0, 10).join(', ')}\n`;
    }

    // Add full content
    formatted += `\n**Full Document Content:**\n${text}`;

    return formatted;
  },

  estimatePageCount(text: string): number {
    // Rough estimation: ~250 words per page for typical documents
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 250));
  }
};