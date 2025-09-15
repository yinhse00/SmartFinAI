
import { fileTypeDetector } from './utils/fileTypeDetector';
import { imageProcessor } from './processors/imageProcessor';
import { enhancedImageProcessor } from './processors/enhancedImageProcessor';
import { enhancedPdfProcessor } from './processors/enhancedPdfProcessor';
import { documentProcessor } from './processors/documentProcessor';
import { spreadsheetProcessor } from './processors/spreadsheetProcessor';
import { FileAdapter } from '../brain/adapters/fileAdapter';

/**
 * Check if required document libraries are loaded
 */
const checkDocumentLibraries = (): { mammothAvailable: boolean, xlsxAvailable: boolean } => {
  const mammothAvailable = typeof window !== 'undefined' && 'mammoth' in window && window.mammoth !== undefined;
  const xlsxAvailable = typeof window !== 'undefined' && 'XLSX' in window && window.XLSX !== undefined;
  
  console.log("Document libraries status:", { mammothAvailable, xlsxAvailable });
  
  return { mammothAvailable, xlsxAvailable };
};

/**
 * Service for processing different file types and extracting text content
 */
export const fileProcessingService = {
  /**
   * Check if document processing libraries are available
   */
  checkLibrariesAvailable: (): { mammothAvailable: boolean, xlsxAvailable: boolean } => {
    return checkDocumentLibraries();
  },
  
  /**
   * Process a file and extract text content based on file type
   */
  processFile: async (file: File): Promise<{ content: string; source: string; metadata?: any }> => {
    const fileType = fileTypeDetector.detectFileType(file);
    const { mammothAvailable, xlsxAvailable } = checkDocumentLibraries();
    
    console.log(`📁 [FILE PROCESSING] Processing file: ${file.name}`);
    console.log(`📂 [FILE PROCESSING] Detected type: ${fileType}`);
    console.log(`📚 [FILE PROCESSING] Libraries available:`, { mammothAvailable, xlsxAvailable });
    
    // Special handling for specific mapping schedule files
    const isListingGuidance = file.name.toLowerCase().includes('guide for new listing applicants');
    const isListedIssuerGuidance = file.name.toLowerCase().includes('guidance materials for listed issuers');
    
    const metadata = {
      isListingGuidance,
      isListedIssuerGuidance,
      isRegulatoryMapping: isListingGuidance || isListedIssuerGuidance
    };
    
    try {
      let result;
      
      // Enhanced financial statement detection - use direct processors for reliability
      const isFinancialStatement = fileProcessingService.isFinancialStatement(file.name);
      
      switch (fileType) {
        case 'pdf':
          // ALWAYS use direct processor for ALL documents to avoid API dependency issues
          console.log(`🔧 Processing PDF directly (bypassing API): ${file.name}`);
          result = await enhancedPdfProcessor.extractText(file);
          break;
        case 'word':
          // ALWAYS use direct processor for ALL documents to avoid API dependency issues
          console.log(`🔧 Processing Word document directly (bypassing API): ${file.name}`);
          result = await documentProcessor.extractWordText(file, mammothAvailable);
          break;
        case 'excel':
          // Excel files always use direct processor (more reliable for financial data)
          console.log(`Processing Excel file directly: ${file.name}`);
          result = await spreadsheetProcessor.extractExcelText(file, xlsxAvailable);
          
          // Add specific metadata for regulatory Excel files
          if (metadata.isRegulatoryMapping) {
            console.log(`Detected regulatory mapping file: ${file.name}`);
            result.metadata = {
              ...metadata,
              purpose: isListingGuidance ? 'new_listing_guidance' : 'listed_issuer_guidance'
            };
          }
          break;
        case 'image':
          // Use enhanced image processor with OCR capabilities and structure analysis
          result = await enhancedImageProcessor.extractText(file);
          break;
        default:
          return { content: `Unable to extract text from ${file.name}`, source: file.name };
      }
      
      // Ensure result has metadata
      if (metadata.isRegulatoryMapping) {
        result.metadata = result.metadata || {};
        result.metadata = { ...result.metadata, ...metadata };
      }
      
      return result;
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      return { 
        content: `Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        source: file.name 
      };
    }
  },

  /**
   * Check if a filename indicates it's a financial statement
   */
  isFinancialStatement: (fileName: string): boolean => {
    const lowerName = fileName.toLowerCase();
    const financialKeywords = [
      'financial', 'statement', 'balance', 'income', 'profit', 'loss',
      'cash flow', 'p&l', 'p l', 'balance sheet', 'income statement',
      'trial balance', 'general ledger', 'chart of accounts', 'accounting',
      'revenue', 'expense', 'asset', 'liability', 'equity', 'cashflow',
      'pnl', 'bs', 'cfs', 'financial position', 'comprehensive income'
    ];
    return financialKeywords.some(keyword => lowerName.includes(keyword));
  }
};
