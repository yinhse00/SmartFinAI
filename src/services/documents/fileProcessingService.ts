
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
    
    console.log(`Processing file: ${file.name}, type: ${fileType}, libraries available:`, { mammothAvailable, xlsxAvailable });
    
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
      
      // Check if this is a financial statement - use direct processors for reliability
      const isFinancialStatement = file.name.toLowerCase().includes('financial') || 
                                  file.name.toLowerCase().includes('statement') ||
                                  file.name.toLowerCase().includes('balance') ||
                                  file.name.toLowerCase().includes('income') ||
                                  file.name.toLowerCase().includes('cash flow') ||
                                  file.name.toLowerCase().includes('profit') ||
                                  file.name.toLowerCase().includes('loss');
      
      switch (fileType) {
        case 'pdf':
          // For financial statements, always use direct processor to avoid API dependency
          if (isFinancialStatement) {
            console.log(`Processing financial statement PDF directly: ${file.name}`);
            result = await enhancedPdfProcessor.extractText(file);
          } else {
            // Use FileAdapter for non-financial documents
            try {
              const content = await FileAdapter.extractContent([file], 'text', { feature: 'file_processing' });
              result = { content, source: file.name };
            } catch (error) {
              console.log(`FileAdapter failed for ${file.name}, using direct processor`);
              result = await enhancedPdfProcessor.extractText(file);
            }
          }
          break;
        case 'word':
          // For financial statements, always use direct processor to avoid API dependency
          if (isFinancialStatement) {
            console.log(`Processing financial statement Word doc directly: ${file.name}`);
            result = await documentProcessor.extractWordText(file, mammothAvailable);
          } else {
            // Use FileAdapter for non-financial documents
            try {
              const content = await FileAdapter.extractContent([file], 'text', { feature: 'file_processing' });
              result = { content, source: file.name };
            } catch (error) {
              console.log(`FileAdapter failed for ${file.name}, using direct processor`);
              result = await documentProcessor.extractWordText(file, mammothAvailable);
            }
          }
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
  }
};
