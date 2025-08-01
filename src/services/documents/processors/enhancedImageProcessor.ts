import { enhancedOCRService } from '../ocr/enhancedOCRService';
import { fileTypeDetector } from '../utils/fileTypeDetector';

interface ProcessedImageResult {
  content: string;
  source: string;
  metadata: {
    confidence: number;
    ocrMethod: string;
    structure?: any;
    language?: string;
  };
}

export const enhancedImageProcessor = {
  async extractText(file: File): Promise<ProcessedImageResult> {
    try {
      // Determine if this is an image file
      const fileType = fileTypeDetector.detectFileType(file);
      if (fileType !== 'image') {
        throw new Error('File is not an image');
      }

      console.log(`Processing image: ${file.name} (${file.size} bytes)`);

      // Use hybrid OCR for best results
      const ocrResult = await enhancedOCRService.performHybridOCR(file);
      
      // Analyze document structure
      const structure = enhancedOCRService.analyzeDocumentStructure(ocrResult.text);
      
      // Format the extracted content for better readability
      const formattedContent = this.formatExtractedContent(ocrResult.text, structure);

      return {
        content: formattedContent,
        source: `Enhanced Image OCR (${file.name})`,
        metadata: {
          confidence: ocrResult.confidence,
          ocrMethod: ocrResult.source,
          structure: {
            headings: structure.headings.length,
            tables: structure.tables.length,
            lists: structure.lists.length,
            wordCount: structure.metadata.wordCount
          },
          language: ocrResult.language
        }
      };
    } catch (error) {
      console.error('Enhanced image processing failed:', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  formatExtractedContent(text: string, structure: any): string {
    let formatted = `**Extracted Text Content:**\n\n`;
    
    // Add headings if found
    if (structure.headings.length > 0) {
      formatted += `**Document Headings:**\n`;
      structure.headings.forEach((heading: string, index: number) => {
        formatted += `${index + 1}. ${heading}\n`;
      });
      formatted += '\n';
    }

    // Add tables if found
    if (structure.tables.length > 0) {
      formatted += `**Tables/Structured Data:**\n`;
      structure.tables.forEach((table: string, index: number) => {
        formatted += `Table ${index + 1}:\n${table}\n\n`;
      });
    }

    // Add lists if found
    if (structure.lists.length > 0) {
      formatted += `**Lists/Bullet Points:**\n`;
      structure.lists.forEach((item: string) => {
        formatted += `• ${item.replace(/^[-•*]\s*/, '').replace(/^\d+[.)]\s*/, '')}\n`;
      });
      formatted += '\n';
    }

    // Add main content
    formatted += `**Full Text Content:**\n${text}`;

    // Add metadata summary
    if (structure.metadata.dates?.length > 0) {
      formatted += `\n\n**Detected Dates:** ${structure.metadata.dates.join(', ')}`;
    }
    
    if (structure.metadata.numbers?.length > 0) {
      formatted += `\n**Detected Numbers:** ${structure.metadata.numbers.slice(0, 10).join(', ')}`;
      if (structure.metadata.numbers.length > 10) {
        formatted += ` (and ${structure.metadata.numbers.length - 10} more)`;
      }
    }

    return formatted;
  },

  async preprocessImage(file: File): Promise<File> {
    // In the future, we could add image preprocessing here
    // (resize, enhance contrast, deskew, etc.)
    return file;
  }
};