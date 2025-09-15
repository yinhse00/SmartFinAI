
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
   * Process a file and extract text content with AI-first financial document handling
   */
  processFile: async (file: File): Promise<{ content: string; source: string; metadata?: any }> => {
    const fileType = fileTypeDetector.detectFileType(file);
    const { mammothAvailable, xlsxAvailable } = checkDocumentLibraries();
    
    console.log(`Processing file: ${file.name}, type: ${fileType}, libraries available:`, { mammothAvailable, xlsxAvailable });
    
    // Special handling for specific mapping schedule files
    const isListingGuidance = file.name.toLowerCase().includes('guide for new listing applicants');
    const isListedIssuerGuidance = file.name.toLowerCase().includes('guidance materials for listed issuers');
    const isFinancialStatement = fileProcessingService.isFinancialStatement(file.name);
    
    const metadata = {
      isListingGuidance,
      isListedIssuerGuidance,
      isRegulatoryMapping: isListingGuidance || isListedIssuerGuidance,
      isFinancialStatement,
      documentType: isFinancialStatement ? 'financial_statement' : 
                   (isListingGuidance || isListedIssuerGuidance) ? 'regulatory_guidance' : 'general'
    };
    
    try {
      let result;
      
      switch (fileType) {
        case 'pdf':
          console.log(`🔧 Processing PDF directly: ${file.name}`);
          result = await enhancedPdfProcessor.extractText(file);
          break;
        case 'word':
          console.log(`🔧 Processing Word document directly: ${file.name}`);
          result = await documentProcessor.extractWordText(file, mammothAvailable);
          break;
        case 'excel':
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
          result = await enhancedImageProcessor.extractText(file);
          break;
        default:
          return { content: `Unable to extract text from ${file.name}`, source: file.name };
      }
      
      // AI-first table detection for financial statements
      if (isFinancialStatement && result.content) {
        try {
          console.log('🤖 Attempting AI-first financial table detection...');
          const { aiTableDetector } = await import('../financial/aiTableDetector');
          
          const tableAnalysis = await aiTableDetector.analyzeDocument(file, result.content);
          
          if (tableAnalysis.detectedTables.length > 0) {
            console.log(`✅ AI detected ${tableAnalysis.detectedTables.length} financial tables`);
            result.metadata = {
              ...result.metadata,
              ...metadata,
              aiTableAnalysis: tableAnalysis,
              hasFinancialTables: true,
              processingMethod: 'ai_first'
            };
            
            // Update source to reflect AI processing
            result.source = `${result.source} (AI-Enhanced Financial Analysis)`;
          } else {
            console.log('⚠️ AI table detection found no valid financial tables, using fallback');
            result.metadata = {
              ...result.metadata,
              ...metadata,
              processingMethod: 'fallback_regex'
            };
          }
        } catch (aiError) {
          console.warn('AI table detection failed, using fallback:', aiError);
          result.metadata = {
            ...result.metadata,
            ...metadata,
            processingMethod: 'fallback_regex',
            aiError: aiError instanceof Error ? aiError.message : String(aiError)
          };
        }
      } else {
        // Ensure metadata is preserved for non-financial documents
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
