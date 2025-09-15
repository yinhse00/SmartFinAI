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
    const lines = content.split('\n');
    const items: FinancialLineItem[] = [];
    
    for (const line of lines) {
      const amount = this.extractAmount(line);
      if (amount && amount > 0) {
        const name = this.extractItemName(line);
        if (name) {
          const category = this.categorizeItem(name, statementType);
          items.push({ name, amount, category });
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
    const amountPattern = /[\d,]+\.?\d*/g;
    const matches = line.match(amountPattern);
    
    if (matches) {
      for (const match of matches) {
        const cleaned = match.replace(/,/g, '');
        const num = parseFloat(cleaned);
        if (!isNaN(num) && num > 1000) {
          return num;
        }
      }
    }
    
    return null;
  }

  private extractItemName(line: string): string | null {
    const amountPattern = /[\d,]+\.?\d*/g;
    let name = line.replace(amountPattern, '').trim();
    name = name.replace(/[()$£€¥]/g, '').trim();
    
    if (name.length < 3 || name.length > 100) {
      return null;
    }
    
    return name;
  }

  private categorizeItem(itemName: string, statementType: 'profit_loss' | 'balance_sheet' | 'cash_flow'): 'revenue_item' | 'asset_item' | 'liability_item' {
    const lowerName = itemName.toLowerCase();
    
    if (statementType === 'profit_loss') {
      return 'revenue_item';
    } else if (statementType === 'balance_sheet') {
      if (lowerName.includes('liability') || lowerName.includes('debt') || 
          lowerName.includes('payable') || lowerName.includes('loan')) {
        return 'liability_item';
      }
      return 'asset_item';
    }
    
    return 'revenue_item';
  }
}

export const financialDataExtractor = new FinancialDataExtractorService();