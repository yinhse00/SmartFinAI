import { fileProcessingService } from '../documents/fileProcessingService';
import { fileTypeDetector } from '../documents/utils/fileTypeDetector';

export interface FinancialData {
  statementType: 'profit_loss' | 'balance_sheet' | 'cash_flow';
  totalRevenue?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  lineItems: FinancialLineItem[];
}

export interface FinancialLineItem {
  name: string;
  amount: number;
  category: 'revenue_item' | 'asset_item' | 'liability_item';
}

export interface ExtractionResult {
  success: boolean;
  data?: FinancialData;
  error?: string;
}

class FinancialDataExtractorService {
  async extractFinancialData(file: File): Promise<ExtractionResult> {
    try {
      const fileType = fileTypeDetector.detectFileType(file);
      
      if (!['pdf', 'word', 'excel'].includes(fileType)) {
        return {
          success: false,
          error: 'Unsupported file type. Please upload PDF, Word, or Excel files.'
        };
      }

      console.log(`Starting financial data extraction for ${file.name} (${fileType})`);
      
      const processed = await fileProcessingService.processFile(file);
      
      if (!processed.content || processed.content.trim().length === 0) {
        console.error('No content extracted from file:', file.name);
        return {
          success: false,
          error: 'No readable content could be extracted from the file. Please ensure the file is not corrupted or password-protected.'
        };
      }
      
      console.log(`Extracted ${processed.content.length} characters from ${file.name}`);
      
      const extractedData = await this.parseFinancialContent(processed.content, file.name);
      
      if (extractedData.lineItems.length === 0) {
        console.warn('No line items extracted from financial statement');
        // Still return success but with warning
        return {
          success: true,
          data: extractedData,
          error: 'Warning: No financial line items could be automatically extracted. The file may need manual review.'
        };
      }
      
      console.log(`Successfully extracted ${extractedData.lineItems.length} line items`);
      
      return {
        success: true,
        data: extractedData
      };
    } catch (error) {
      console.error('Financial data extraction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      };
    }
  }

  private async parseFinancialContent(content: string, fileName: string): Promise<FinancialData> {
    const statementType = this.detectStatementType(content, fileName);
    const lineItems = this.extractLineItems(content, statementType);
    
    const totals = this.extractTotals(content, statementType);
    
    return {
      statementType,
      ...totals,
      lineItems
    };
  }

  private detectStatementType(content: string, fileName: string): 'profit_loss' | 'balance_sheet' | 'cash_flow' {
    const lowerContent = content.toLowerCase();
    const lowerFileName = fileName.toLowerCase();
    
    if (lowerContent.includes('cash flow') || lowerFileName.includes('cash_flow') || 
        lowerContent.includes('statement of cash flows')) {
      return 'cash_flow';
    }
    
    if (lowerContent.includes('balance sheet') || lowerFileName.includes('balance_sheet') ||
        lowerContent.includes('statement of financial position')) {
      return 'balance_sheet';
    }
    
    return 'profit_loss';
  }

  private extractLineItems(content: string, statementType: 'profit_loss' | 'balance_sheet' | 'cash_flow'): FinancialLineItem[] {
    console.log('Extracting line items for statement type:', statementType);
    console.log('Content length:', content.length, 'characters');
    
    const lines = content.split('\n');
    const items: FinancialLineItem[] = [];
    
    console.log('Processing', lines.length, 'lines');
    
    // Enhanced line detection with multiple strategies
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      
      // Skip headers and obvious non-data lines
      if (this.isHeaderLine(line) || this.isPageInfo(line)) continue;
      
      // Strategy 1: Look for table data with pipes or consistent spacing
      if (line.includes('|') || /\s{3,}/.test(line)) {
        const tabulatedItems = this.extractFromTabularLine(line, statementType);
        for (const item of tabulatedItems) {
          // Check for duplicates
          if (!items.find(existing => existing.name === item.name && existing.amount === item.amount)) {
            items.push(item);
            console.log('Added tabular item:', item);
          }
        }
      }
      
      // Strategy 2: Regular line parsing
      const amount = this.extractAmount(line);
      const name = this.extractItemName(line);
      
      if (amount !== null && name && Math.abs(amount) >= 1) {
        const category = this.categorizeItem(name, statementType);
        const newItem = { name, amount, category };
        
        // Check for duplicates
        if (!items.find(existing => existing.name === newItem.name && existing.amount === newItem.amount)) {
          items.push(newItem);
          console.log('Added line item:', newItem);
        }
      }
    }
    
    console.log('Total line items extracted:', items.length);
    
    // If we didn't find many items, log some sample lines for debugging
    if (items.length < 3) {
      console.log('Few items found. Sample lines for debugging:');
      const sampleLines = lines.filter(line => line.trim().length > 10).slice(0, 10);
      sampleLines.forEach((line, index) => {
        console.log(`Sample ${index + 1}: "${line}"`);
        const amount = this.extractAmount(line);
        const name = this.extractItemName(line);
        console.log(`  -> Amount: ${amount}, Name: ${name}`);
      });
    }
    
    return items;
  }

  private isHeaderLine(line: string): boolean {
    const headerPatterns = [
      /^(income|profit|loss|balance|cash|flow|statement|year|period|ended|assets|liabilities|equity)/i,
      /^\s*(note|page|\d+\s*$)/i,
      /^(consolidated|company|group|financial)/i
    ];
    return headerPatterns.some(pattern => pattern.test(line));
  }

  private isPageInfo(line: string): boolean {
    return /^\s*page\s+\d+|^\s*\d+\s*$|^[-=\s]+$/.test(line);
  }

  private extractFromTabularLine(line: string, statementType: 'profit_loss' | 'balance_sheet' | 'cash_flow'): FinancialLineItem[] {
    const items: FinancialLineItem[] = [];
    
    try {
      // Multiple strategies for tabular data extraction
      let columns: string[] = [];
      
      // Strategy 1: Split by pipes (markdown table format)
      if (line.includes('|')) {
        columns = line.split('|').map(col => col.trim()).filter(col => col.length > 0);
      } 
      // Strategy 2: Split by tabs
      else if (line.includes('\t')) {
        columns = line.split('\t').map(col => col.trim()).filter(col => col.length > 0);
      }
      // Strategy 3: Split by multiple spaces (minimum 3)
      else if (/\s{3,}/.test(line)) {
        columns = line.split(/\s{3,}/).map(col => col.trim()).filter(col => col.length > 0);
      }
      
      if (columns.length >= 2) {
        // Try each column as potential amount (rightmost first)
        for (let i = columns.length - 1; i >= 1; i--) {
          const potentialAmount = this.extractAmount(columns[i]);
          
          if (potentialAmount !== null && Math.abs(potentialAmount) >= 1) {
            // Use all previous columns as the item name
            const itemName = columns.slice(0, i).join(' ').trim();
            const cleanedName = this.extractItemName(itemName);
            
            if (cleanedName && !this.isHeaderLine(cleanedName) && cleanedName.length > 2) {
              const category = this.categorizeItem(cleanedName, statementType);
              items.push({
                name: cleanedName,
                amount: potentialAmount,
                category
              });
              break; // Found a valid item, move to next line
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error extracting from tabular line:', line, error);
    }
    
    return items;
  }

  private extractTotals(content: string, statementType: 'profit_loss' | 'balance_sheet' | 'cash_flow'): Partial<FinancialData> {
    const totals: Partial<FinancialData> = {};
    
    if (statementType === 'profit_loss') {
      totals.totalRevenue = this.findTotal(content, ['total revenue', 'revenue', 'total sales', 'turnover']);
    } else if (statementType === 'balance_sheet') {
      totals.totalAssets = this.findTotal(content, ['total assets', 'total current assets', 'total non-current assets']);
      totals.totalLiabilities = this.findTotal(content, ['total liabilities', 'total current liabilities', 'total non-current liabilities']);
    }
    
    return totals;
  }

  private findTotal(content: string, patterns: string[]): number | undefined {
    const lines = content.toLowerCase().split('\n');
    
    for (const pattern of patterns) {
      for (const line of lines) {
        if (line.includes(pattern)) {
          const amount = this.extractAmount(line);
          if (amount && amount > 0) {
            return amount;
          }
        }
      }
    }
    
    return undefined;
  }

  private extractAmount(line: string): number | null {
    if (!line || line.length === 0) return null;
    
    try {
      console.log('Extracting amount from line:', line.substring(0, 150));
      
      // Enhanced regex patterns for comprehensive financial number detection
      const patterns = [
        // Currency with parentheses for negatives: $(1,234.56) or $-1,234.56 in ()
        /[\$\£\€\¥]\s*\(([0-9,]+(?:\.[0-9]{1,2})?)\)/g,
        /\([\$\£\€\¥]\s*([0-9,]+(?:\.[0-9]{1,2})?)\)/g,
        // Currency with explicit minus: $-1,234.56
        /[\$\£\€\¥]\s*-\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
        // Currency positive: $1,234.56
        /[\$\£\€\¥]\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
        // Number with parentheses (negative): (1,234.56)
        /\(([0-9,]+(?:\.[0-9]{1,2})?)\)/g,
        // Number with explicit minus: -1,234.56
        /-\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
        // Numbers with 'k', 'm', 'b' suffixes: 123.4k, 45.6m, 1.2b
        /([0-9,]+(?:\.[0-9]{1,2})?)\s*[kmb]/gi,
        // Numbers marked as 'thousand': 1,234 thousand
        /([0-9,]+)\s*thousand/gi,
        // Table format with pipes: | 1,234.56 |
        /\|\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*\|/g,
        // Tab-separated values
        /\t\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:\t|$)/g,
        // Numbers with at least 3 digits and commas: 1,234.56
        /([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?)/g,
        // Simple decimals with at least 2 decimal places: 1234.56
        /([0-9]+\.[0-9]{2})/g,
        // Whole numbers (minimum 3 digits to avoid ratios): 1234
        /([0-9]{3,})/g
      ];
      
      let bestMatch: number | null = null;
      let highestConfidence = 0;
      let isNegative = false;

      // Check for negative indicators
      const hasParentheses = line.includes('(') && line.includes(')') && !/\([^0-9]*\)/.test(line);
      const hasMinusSign = line.includes('-') && !line.includes('--') && !line.includes('e-');
      
      for (let patternIndex = 0; patternIndex < patterns.length; patternIndex++) {
        const pattern = patterns[patternIndex];
        let match;
        
        while ((match = pattern.exec(line)) !== null) {
          let numStr = match[1].replace(/,/g, '');
          let amount = parseFloat(numStr);
          
          if (!isNaN(amount) && amount >= 1) {
            // Handle suffixes
            const originalMatch = match[0].toLowerCase();
            if (originalMatch.includes('k')) amount *= 1000;
            if (originalMatch.includes('m')) amount *= 1000000;
            if (originalMatch.includes('b')) amount *= 1000000000;
            if (originalMatch.includes('thousand')) amount *= 1000;
            
            // Calculate confidence based on pattern specificity and context
            let confidence = patterns.length - patternIndex; // Earlier patterns are more specific
            
            // Boost confidence for currency symbols
            if (originalMatch.includes('$') || originalMatch.includes('£') || originalMatch.includes('€')) {
              confidence += 5;
            }
            
            // Boost confidence for proper decimal formatting
            if (numStr.includes('.') && numStr.split('.')[1].length === 2) {
              confidence += 3;
            }
            
            // Boost confidence for larger amounts (more likely to be significant)
            if (amount >= 1000) confidence += 2;
            if (amount >= 100000) confidence += 2;
            
            // Exclude unrealistic values
            if (amount < 999999999999 && confidence > highestConfidence) {
              highestConfidence = confidence;
              isNegative = hasParentheses || (hasMinusSign && originalMatch.includes('-'));
              bestMatch = isNegative ? -amount : amount;
            }
          }
        }
        pattern.lastIndex = 0; // Reset regex
      }
      
      if (bestMatch !== null) {
        console.log('✅ Extracted amount:', bestMatch, 'from line:', line.substring(0, 100));
      } else {
        console.log('❌ No amount found in line:', line.substring(0, 100));
      }
      
      return bestMatch;
    } catch (error) {
      console.warn('Error extracting amount from line:', line, error);
      return null;
    }
  }

  private extractItemName(line: string): string | null {
    // Remove amounts and common prefixes/suffixes
    let name = line.replace(/[\$\£\€\¥]?\s*\(?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\)?/g, '').trim();
    
    // Remove common prefixes and line numbers
    name = name.replace(/^(note\s+\d+|note\s+|notes?\s+|\d+\.?\s+)/i, '').trim();
    
    // Remove trailing punctuation
    name = name.replace(/[:.;,\-\s]+$/, '').trim();
    
    // Remove leading punctuation and spaces
    name = name.replace(/^[:.;,\-\s]+/, '').trim();
    
    // Filter out obvious non-item names
    if (name.length < 3 || /^\d+$/.test(name) || /^page\s+\d+$/i.test(name)) {
      return null;
    }
    
    return name.length > 0 ? name : null;
  }

  private categorizeItem(itemName: string, statementType: 'profit_loss' | 'balance_sheet' | 'cash_flow'): 'revenue_item' | 'asset_item' | 'liability_item' {
    const name = itemName.toLowerCase();
    
    // Enhanced categorization with more keywords
    const revenueKeywords = [
      'revenue', 'sales', 'income', 'turnover', 'fees', 'commission', 'interest received',
      'dividend income', 'other income', 'operating income', 'gross profit', 'net profit',
      'earnings', 'gain on', 'service income', 'rental income'
    ];
    
    const assetKeywords = [
      'asset', 'cash', 'bank', 'inventory', 'stock', 'receivable', 'debtors',
      'investment', 'property', 'equipment', 'plant', 'machinery', 'goodwill',
      'intangible', 'prepaid', 'deposits', 'land', 'building', 'vehicle'
    ];
    
    const liabilityKeywords = [
      'liability', 'payable', 'creditors', 'debt', 'loan', 'borrowing',
      'provision', 'accrued', 'deferred', 'tax payable', 'interest payable',
      'share capital', 'retained earnings', 'equity', 'reserves', 'surplus'
    ];
    
    // Check for revenue indicators
    if (revenueKeywords.some(keyword => name.includes(keyword))) {
      return 'revenue_item';
    }
    
    // Check for asset indicators
    if (assetKeywords.some(keyword => name.includes(keyword))) {
      return 'asset_item';
    }
    
    // Check for liability indicators
    if (liabilityKeywords.some(keyword => name.includes(keyword))) {
      return 'liability_item';
    }
    
    // Enhanced default logic based on statement type and context
    switch (statementType) {
      case 'profit_loss':
        // In P&L, expenses are typically negative revenue items
        return 'revenue_item';
      case 'balance_sheet':
        // In balance sheet, first half typically assets, second half liabilities
        return name.includes('total') && name.includes('asset') ? 'asset_item' : 'liability_item';
      case 'cash_flow':
        return 'revenue_item';
      default:
        return 'revenue_item';
    }
  }
}

export const financialDataExtractor = new FinancialDataExtractorService();