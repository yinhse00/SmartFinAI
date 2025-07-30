
import { documentGenerationService } from './documentGenerationService';
import { translationService } from '../translation/translationService';

/**
 * Service for document operations
 */
export const documentService = {
  /**
   * Translate content using Grok AI
   */
  translateContent: translationService.translateContent,
  
  /**
   * Generate a Word document from text
   */
  generateWordDocument: documentGenerationService.generateWordDocument,

  /**
   * Generate a PDF document from text
   */
  generatePdfDocument: documentGenerationService.generatePdfDocument,

  /**
   * Generate an Excel document from text
   */
  generateExcelDocument: documentGenerationService.generateExcelDocument,

  /**
   * Generate a PowerPoint document from text
   */
  generatePowerPointDocument: documentGenerationService.generatePowerPointDocument
};
