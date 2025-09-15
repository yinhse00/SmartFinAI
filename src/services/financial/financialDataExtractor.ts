import { fileProcessingService } from '../documents/fileProcessingService';
import { fileTypeDetector } from '../documents/utils/fileTypeDetector';

export interface FinancialData {
  statementType: 'profit_loss' | 'balance_sheet' | 'cash_flow';
  totalRevenue?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  lineItems: FinancialLineItem[];
  comparativeData?: {
    periods: string[];
    comparativeItems: ComparativeFinancialItem[];
  };
}

export interface ComparativeFinancialItem {
  name: string;
  category: 'revenue_item' | 'asset_item' | 'liability_item';
  values: { period: string; amount: number }[];
  yearOverYearChanges: { fromPeriod: string; toPeriod: string; changeAmount: number; changePercentage: number }[];
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

      console.log(`🤖 Starting AI-first financial data extraction for ${file.name} (${fileType})`);
      
      const processed = await fileProcessingService.processFile(file);
      
      if (!processed.content || processed.content.trim().length === 0) {
        console.error('No content extracted from file:', file.name);
        return {
          success: false,
          error: 'No readable content could be extracted from the file. Please ensure the file is not corrupted or password-protected.'
        };
      }
      
      console.log(`Extracted ${processed.content.length} characters from ${file.name}`);
      
      // 🚀 AI-FIRST APPROACH: Try AI table detection first
      console.log('🔥 [SYSTEM DEBUG] Attempting AI-first table detection...');
      try {
        const { aiTableDetector } = await import('./aiTableDetector');
        console.log('📦 [SYSTEM DEBUG] AI table detector imported successfully');
        
        const tableAnalysis = await aiTableDetector.analyzeDocument(file, processed.content);
        console.log('📊 [SYSTEM DEBUG] AI analysis complete:', {
          quality: tableAnalysis.documentQuality,
          tablesFound: tableAnalysis.tables.length,
          hasProfitLoss: !!tableAnalysis.primaryProfitLossTable,
          hasBalanceSheet: !!tableAnalysis.primaryBalanceSheetTable,
          recommendation: tableAnalysis.processingRecommendation
        });
        
        if (tableAnalysis.documentQuality === 'high' && 
            (tableAnalysis.primaryProfitLossTable || tableAnalysis.primaryBalanceSheetTable)) {
          console.log('✅ [SYSTEM DEBUG] AI table detection successful! Using AI-enhanced structured approach');
          console.log('🎯 [SYSTEM DEBUG] Processing with AI-detected tables instead of regex fallback');
          
          const extractedData = await this.parseWithAITables(tableAnalysis, processed.content);
          
          return {
            success: true,
            data: extractedData
          };
        } else {
          console.log('⚠️ [SYSTEM DEBUG] AI table detection quality insufficient:', tableAnalysis.documentQuality);
          console.log('📉 [SYSTEM DEBUG] Falling back to traditional regex parsing');
        }
      } catch (aiError) {
        console.error('❌ [SYSTEM DEBUG] AI table detection failed:', aiError);
        console.error('🔧 [SYSTEM DEBUG] Error details:', aiError instanceof Error ? aiError.message : String(aiError));
        console.warn('🔄 [SYSTEM DEBUG] Using regex fallback due to AI failure');
      }
      
      // 🔄 FALLBACK: Traditional regex parsing (AI detection not used)
      console.log('📝 [SYSTEM DEBUG] Using traditional regex-based parsing as fallback');
      const extractedData = await this.parseFinancialContent(processed.content, file.name);
      
      if (extractedData.lineItems.length === 0) {
        console.warn('No line items extracted from financial statement');
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

  private async parseWithAITables(tableAnalysis: any, content: string): Promise<FinancialData> {
    const { aiTableAnalyzer } = await import('./aiTableAnalyzer');
    
    // Use the primary table (P&L or Balance Sheet)
    const primaryTable = tableAnalysis.primaryProfitLossTable || tableAnalysis.primaryBalanceSheetTable;
    const structuredData = await aiTableAnalyzer.analyzeTableStructure(primaryTable, content);
    
    // Convert to FinancialData format
    return {
      statementType: structuredData.statementType,
      totalRevenue: structuredData.keyTotals.totalRevenue?.[structuredData.periods[structuredData.periods.length - 1]],
      totalAssets: structuredData.keyTotals.totalAssets?.[structuredData.periods[structuredData.periods.length - 1]],
      totalLiabilities: structuredData.keyTotals.totalLiabilities?.[structuredData.periods[structuredData.periods.length - 1]],
      lineItems: structuredData.lineItems.map(item => ({
        name: item.name,
        amount: Object.values(item.amounts)[Object.values(item.amounts).length - 1] || 0,
        category: item.category
      })),
      comparativeData: structuredData.periods.length > 1 ? {
        periods: structuredData.periods,
        comparativeItems: structuredData.lineItems.map(item => ({
          name: item.name,
          category: item.category,
          values: Object.entries(item.amounts).map(([period, amount]) => ({ period, amount })),
          yearOverYearChanges: this.calculateYearOverYearChanges(item.amounts, structuredData.periods)
        }))
      } : undefined
    };
  }

  private calculateYearOverYearChanges(amounts: Record<string, number>, periods: string[]): any[] {
    const changes = [];
    const sortedPeriods = periods.sort();
    
    for (let i = 1; i < sortedPeriods.length; i++) {
      const fromPeriod = sortedPeriods[i - 1];
      const toPeriod = sortedPeriods[i];
      const fromAmount = amounts[fromPeriod] || 0;
      const toAmount = amounts[toPeriod] || 0;
      
      changes.push({
        fromPeriod,
        toPeriod,
        changeAmount: toAmount - fromAmount,
        changePercentage: fromAmount !== 0 ? ((toAmount - fromAmount) / Math.abs(fromAmount)) * 100 : 0
      });
    }
    
    return changes;
  }

  private async parseFinancialContent(content: string, fileName: string): Promise<FinancialData> {
    console.log('🎯 Starting enhanced financial content parsing...');
    
    // First, identify specific financial statement sections
    const identifiedSections = this.identifyFinancialStatementSections(content);
    console.log('📊 Identified financial statement sections:', identifiedSections.map(s => s.title));
    
    // If we found specific sections, process them; otherwise fall back to full content
    const contentToProcess = identifiedSections.length > 0 
      ? identifiedSections.map(s => s.content).join('\n\n')
      : content;
    
    const statementType = this.detectStatementType(contentToProcess, fileName);
    console.log('📈 Detected statement type:', statementType);
    
    // Extract line items with enhanced table-focused extraction
    const lineItems = this.extractLineItems(contentToProcess, statementType);
    
    // Extract comparative data for multi-year analysis
    const comparativeData = this.extractComparativeData(contentToProcess, statementType);
    
    const totals = this.extractTotals(contentToProcess, statementType);
    
    return {
      statementType,
      ...totals,
      lineItems,
      comparativeData
    };
  }

  private identifyFinancialStatementSections(content: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];
    const lines = content.split('\n');
    
    console.log('🔍 Identifying specific financial statement sections...');
    
    // Patterns for the two critical financial statements
    const profitLossPatterns = [
      /combined\s+statements?\s+of\s+profit\s+or\s+loss\s+and\s+other\s+comprehensive\s+income/i,
      /statements?\s+of\s+profit\s+or\s+loss\s+and\s+other\s+comprehensive\s+income/i,
      /consolidated\s+statements?\s+of\s+profit\s+or\s+loss/i,
      /income\s+statements?\s+and\s+comprehensive\s+income/i
    ];
    
    const financialPositionPatterns = [
      /combined\s+statements?\s+of\s+financial\s+position/i,
      /statements?\s+of\s+financial\s+position/i,
      /consolidated\s+statements?\s+of\s+financial\s+position/i,
      /balance\s+sheets?/i
    ];
    
    let currentSection: { title: string; startIndex: number } | null = null;
    let currentContent: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line matches any of our target statement patterns
      const isProfitLoss = profitLossPatterns.some(pattern => pattern.test(line));
      const isFinancialPosition = financialPositionPatterns.some(pattern => pattern.test(line));
      
      if (isProfitLoss || isFinancialPosition) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            title: currentSection.title,
            content: currentContent.join('\n')
          });
          console.log(`✅ Found section: ${currentSection.title} (${currentContent.length} lines)`);
        }
        
        // Start new section
        currentSection = {
          title: line,
          startIndex: i
        };
        currentContent = [line];
      } else if (currentSection) {
        // We're inside a section, add content
        currentContent.push(line);
        
        // Stop collecting if we hit another major section or end
        if (this.isNewMajorSection(line) && currentContent.length > 10) {
          sections.push({
            title: currentSection.title,
            content: currentContent.slice(0, -1).join('\n') // Exclude the new section header
          });
          console.log(`✅ Completed section: ${currentSection.title} (${currentContent.length - 1} lines)`);
          currentSection = null;
          currentContent = [];
        }
      }
    }
    
    // Add final section if exists
    if (currentSection && currentContent.length > 5) {
      sections.push({
        title: currentSection.title,
        content: currentContent.join('\n')
      });
      console.log(`✅ Final section: ${currentSection.title} (${currentContent.length} lines)`);
    }
    
    return sections;
  }
  
  private isNewMajorSection(line: string): boolean {
    const majorSectionPatterns = [
      /^notes?\s+to\s+the\s+financial\s+statements/i,
      /^directors?\s+report/i,
      /^auditors?\s+report/i,
      /^management\s+discussion/i,
      /^cash\s+flow\s+statements?/i,
      /^statements?\s+of\s+changes\s+in\s+equity/i
    ];
    
    return majorSectionPatterns.some(pattern => pattern.test(line.trim()));
  }

  private detectStatementType(content: string, fileName: string): 'profit_loss' | 'balance_sheet' | 'cash_flow' {
    const lowerContent = content.toLowerCase();
    const lowerFileName = fileName.toLowerCase();
    
    // Enhanced detection based on content analysis
    if (lowerContent.includes('profit or loss and other comprehensive income') ||
        lowerContent.includes('combined statements of profit or loss')) {
      console.log('🎯 Detected: Profit or Loss and Other Comprehensive Income');
      return 'profit_loss';
    }
    
    if (lowerContent.includes('statements of financial position') ||
        lowerContent.includes('combined statements of financial position')) {
      console.log('🎯 Detected: Statements of Financial Position');
      return 'balance_sheet';
    }
    
    if (lowerContent.includes('cash flow') || lowerFileName.includes('cash_flow') || 
        lowerContent.includes('statement of cash flows')) {
      return 'cash_flow';
    }
    
    if (lowerContent.includes('balance sheet') || lowerFileName.includes('balance_sheet')) {
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
  
  private extractComparativeData(content: string, statementType: 'profit_loss' | 'balance_sheet' | 'cash_flow'): { periods: string[]; comparativeItems: ComparativeFinancialItem[] } | undefined {
    console.log('📊 Extracting comparative multi-year data...');
    
    const lines = content.split('\n');
    const periods: string[] = [];
    const comparativeItems: ComparativeFinancialItem[] = [];
    
    // Find period headers (FY2022, FY2023, FY2024, 6M2024, 6M2025, etc.)
    const periodPatterns = [
      /FY\d{4}/g,
      /\d{1,2}M\d{4}/g,
      /20\d{2}/g,
      /Year\s+ended\s+\d{4}/gi
    ];
    
    // Extract periods from headers
    for (const line of lines.slice(0, 20)) { // Check first 20 lines for headers
      for (const pattern of periodPatterns) {
        const matches = line.match(pattern);
        if (matches) {
          for (const match of matches) {
            if (!periods.includes(match)) {
              periods.push(match);
              console.log(`📅 Found period: ${match}`);
            }
          }
        }
      }
    }
    
    if (periods.length < 2) {
      console.log('⚠️ Not enough periods found for comparative analysis');
      return undefined;
    }
    
    // Extract line items with values for each period
    const itemMap = new Map<string, { name: string; category: 'revenue_item' | 'asset_item' | 'liability_item'; values: Map<string, number> }>();
    
    for (const line of lines) {
      if (this.isHeaderLine(line) || this.isPageInfo(line)) continue;
      
      const itemName = this.extractItemName(line);
      if (!itemName || itemName.length < 3) continue;
      
      // Extract all amounts from the line
      const amounts = this.extractMultipleAmounts(line);
      if (amounts.length >= Math.min(periods.length, 2)) {
        const category = this.categorizeItem(itemName, statementType);
        
        if (!itemMap.has(itemName)) {
          itemMap.set(itemName, {
            name: itemName,
            category,
            values: new Map()
          });
        }
        
        const item = itemMap.get(itemName)!;
        
        // Match amounts to periods (typically right-to-left, most recent first)
        for (let i = 0; i < Math.min(amounts.length, periods.length); i++) {
          const periodIndex = periods.length - 1 - i; // Start from most recent period
          const period = periods[periodIndex];
          const amount = amounts[i];
          
          if (amount !== null && Math.abs(amount) >= 1) {
            item.values.set(period, amount);
            console.log(`💰 ${itemName} - ${period}: ${amount.toLocaleString()}`);
          }
        }
      }
    }
    
    // Convert to comparative items with year-over-year changes
    for (const [, item] of itemMap) {
      if (item.values.size >= 2) {
        const values = Array.from(item.values.entries())
          .map(([period, amount]) => ({ period, amount }))
          .sort((a, b) => a.period.localeCompare(b.period));
        
        const yearOverYearChanges = [];
        for (let i = 1; i < values.length; i++) {
          const fromValue = values[i - 1];
          const toValue = values[i];
          const changeAmount = toValue.amount - fromValue.amount;
          const changePercentage = fromValue.amount !== 0 ? (changeAmount / Math.abs(fromValue.amount)) * 100 : 0;
          
          yearOverYearChanges.push({
            fromPeriod: fromValue.period,
            toPeriod: toValue.period,
            changeAmount,
            changePercentage
          });
          
          console.log(`📈 ${item.name}: ${fromValue.period} to ${toValue.period} = ${changePercentage.toFixed(1)}% change`);
        }
        
        comparativeItems.push({
          name: item.name,
          category: item.category,
          values,
          yearOverYearChanges
        });
      }
    }
    
    console.log(`✅ Extracted ${comparativeItems.length} comparative items across ${periods.length} periods`);
    
    return {
      periods: periods.sort(),
      comparativeItems
    };
  }
  
  private extractMultipleAmounts(line: string): (number | null)[] {
    const amounts: (number | null)[] = [];
    
    // Enhanced regex for multiple amounts in a single line
    const multiAmountPatterns = [
      // Table format with multiple amounts: | item | 1,234 | 2,345 | 3,456 |
      /\|\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*\|/g,
      // Tab or space separated: 1,234    2,345    3,456
      /([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?)/g,
      // Parentheses for negatives in tables: (1,234)  2,345  (3,456)
      /\(([0-9,]+(?:\.[0-9]{1,2})?)\)|([0-9,]+(?:\.[0-9]{1,2})?)/g
    ];
    
    for (const pattern of multiAmountPatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const numStr = (match[1] || match[2] || match[0]).replace(/[^0-9.-]/g, '');
        const amount = parseFloat(numStr);
        
        if (!isNaN(amount) && amount >= 1) {
          const isNegative = match[0].includes('(');
          amounts.push(isNegative ? -amount : amount);
        }
      }
      pattern.lastIndex = 0; // Reset regex
    }
    
    return amounts;
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
    // CORRECTED CATEGORIZATION FOR MATERIALITY ANALYSIS:
    // ALL P&L items → revenue_item (compared against Total Revenue)
    // ALL Balance Sheet items → asset_item or liability_item (compared against Total Assets)
    
    if (statementType === 'profit_loss') {
      return 'revenue_item'; // All P&L items use revenue as base for materiality
    } else if (statementType === 'balance_sheet') {
      const name = itemName.toLowerCase();
      
      // Enhanced asset/liability classification for balance sheet
      const assetKeywords = [
        'asset', 'cash', 'bank', 'inventory', 'stock', 'receivable', 'debtors',
        'investment', 'property', 'equipment', 'plant', 'machinery', 'goodwill',
        'intangible', 'prepaid', 'deposits', 'land', 'building', 'vehicle',
        'right-of-use', 'deferred tax asset'
      ];
      
      const liabilityKeywords = [
        'liability', 'payable', 'creditors', 'debt', 'loan', 'borrowing',
        'provision', 'accrued', 'deferred', 'tax payable', 'interest payable',
        'share capital', 'retained earnings', 'equity', 'reserves', 'surplus',
        'share premium', 'capital', 'obligation', 'lease liability'
      ];
      
      // Check for asset indicators
      if (assetKeywords.some(keyword => name.includes(keyword))) {
        return 'asset_item';
      }
      
      // Check for liability indicators  
      if (liabilityKeywords.some(keyword => name.includes(keyword))) {
        return 'liability_item';
      }
      
      // Default to asset for uncategorized balance sheet items
      return 'asset_item';
    }
    
    // Default fallback
    return 'revenue_item';
  }
}

export const financialDataExtractor = new FinancialDataExtractorService();