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

      const processed = await fileProcessingService.processFile(file);
      const extractedData = await this.parseFinancialContent(processed.content, file.name);
      
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
    console.log('Content preview:', content.substring(0, 500));
    
    const lines = content.split('\n');
    const items: FinancialLineItem[] = [];
    
    // Enhanced line detection - look for structured data patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      
      // Skip headers and obvious non-data lines
      if (this.isHeaderLine(line) || this.isPageInfo(line)) continue;
      
      const amount = this.extractAmount(line);
      const name = this.extractItemName(line);
      
      if (amount !== null && name) {
        const category = this.categorizeItem(name, statementType);
        items.push({ name, amount, category });
        console.log('Added line item:', { name, amount, category });
      }
      
      // Also check if this line contains tabular data
      const tabulatedItems = this.extractFromTabularLine(line, statementType);
      items.push(...tabulatedItems);
    }
    
    console.log('Total line items extracted:', items.length);
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
    
    // Split by tabs or multiple spaces to identify columns
    const columns = line.split(/\t+|\s{3,}/).filter(col => col.trim().length > 0);
    
    if (columns.length >= 2) {
      const lastColumn = columns[columns.length - 1];
      const amount = this.extractAmount(lastColumn);
      
      if (amount !== null) {
        const itemName = columns.slice(0, -1).join(' ').trim();
        if (itemName && !this.isHeaderLine(itemName)) {
          const category = this.categorizeItem(itemName, statementType);
          items.push({
            name: itemName,
            amount,
            category
          });
        }
      }
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
    console.log('Extracting amount from line:', line);
    
    // Enhanced regex for various number formats including currencies and negatives
    const patterns = [
      // Currency with parentheses for negatives: $(1,234.56)
      /[\$\£\€\¥]\s*\((\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\)/,
      // Currency with minus: $-1,234.56
      /[\$\£\€\¥]\s*-\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      // Currency positive: $1,234.56
      /[\$\£\€\¥]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      // Number with parentheses: (1,234.56)
      /\((\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\)/,
      // Number with minus: -1,234.56
      /-\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      // Simple number: 1,234.56 or 1234.56
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      // Number without decimals: 1,234 or 1234
      /(\d{1,3}(?:,\d{3})*)/
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 100) { // Lower threshold for detection
          const isNegative = line.includes('(') || line.includes('-');
          const result = isNegative ? -amount : amount;
          console.log('Extracted amount:', result, 'from line:', line);
          return result;
        }
      }
    }
    
    console.log('No amount found in line:', line);
    return null;
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