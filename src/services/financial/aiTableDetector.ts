import { grokService } from '../grokService';

export interface TableDetectionResult {
  confidence: number;
  tableType: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'notes' | 'other';
  tableStructure: {
    headers: string[];
    periods: string[];
    startLine: number;
    endLine: number;
    lineItems: Array<{
      name: string;
      values: number[];
      isTotal: boolean;
    }>;
  };
  validationErrors: string[];
}

export interface DocumentTableAnalysis {
  tables: TableDetectionResult[];
  primaryProfitLossTable?: TableDetectionResult;
  primaryBalanceSheetTable?: TableDetectionResult;
  documentQuality: 'high' | 'medium' | 'low';
  processingRecommendation: string;
}

class AITableDetectorService {
  
  /**
   * Analyze document for financial statement tables using AI vision
   */
  async analyzeDocument(file: File, content: string): Promise<DocumentTableAnalysis> {
    console.log('🔍 Starting AI table detection for:', file.name);
    
    try {
      const tableAnalysis = await this.detectTablesWithAI(content, file.name);
      const validatedTables = await this.validateDetectedTables(tableAnalysis);
      
      return {
        tables: validatedTables,
        primaryProfitLossTable: validatedTables.find(t => t.tableType === 'profit_loss' && t.confidence > 0.8),
        primaryBalanceSheetTable: validatedTables.find(t => t.tableType === 'balance_sheet' && t.confidence > 0.8),
        documentQuality: this.assessDocumentQuality(validatedTables),
        processingRecommendation: this.generateProcessingRecommendation(validatedTables)
      };
    } catch (error) {
      console.error('AI table detection failed:', error);
      return this.createFallbackAnalysis();
    }
  }

  /**
   * Use AI to identify and analyze financial statement tables
   */
  private async detectTablesWithAI(content: string, fileName: string): Promise<TableDetectionResult[]> {
    const prompt = `
Analyze this financial document and identify all financial statement tables.

CRITICAL REQUIREMENTS:
1. Focus ONLY on these two key financial statements:
   - "Combined Statements of Profit or Loss and Other Comprehensive Income"
   - "Combined Statements of Financial Position" (Balance Sheet)
   
2. For each identified table, extract:
   - Table type classification (profit_loss, balance_sheet, or other)
   - All period headers (FY2022, FY2023, FY2024, 6M2024, 6M2025, etc.)
   - Line item names and their corresponding amounts
   - Key totals (Total Revenue, Total Assets, Total Liabilities, etc.)
   - Table boundaries (start/end positions)

3. Validate table structure:
   - Ensure amounts add up correctly
   - Verify period consistency
   - Check for complete data rows

4. Rate confidence (0-1) based on:
   - Table completeness
   - Data consistency
   - Clear headers and structure

Document: ${fileName}
Content: ${content.substring(0, 8000)}

Return structured JSON with detected tables and their analysis.
    `;

    if (!grokService.hasApiKey()) {
      throw new Error('Grok AI service not available');
    }

    const response = await grokService.generateResponse({
      prompt,
      format: 'structured_json',
      metadata: {
        context: 'financial_table_detection',
        requirements: {
          focus: 'table_identification',
          validation: 'financial_consistency'
        }
      }
    });

    return this.parseAITableResponse(response.text);
  }

  /**
   * Parse AI response into structured table detection results
   */
  private parseAITableResponse(aiResponse: string): TableDetectionResult[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const tables: TableDetectionResult[] = [];

      if (parsed.tables && Array.isArray(parsed.tables)) {
        for (const table of parsed.tables) {
          tables.push({
            confidence: table.confidence || 0.5,
            tableType: this.normalizeTableType(table.type),
            tableStructure: {
              headers: table.headers || [],
              periods: table.periods || [],
              startLine: table.startLine || 0,
              endLine: table.endLine || 0,
              lineItems: table.lineItems || []
            },
            validationErrors: table.validationErrors || []
          });
        }
      }

      return tables;
    } catch (error) {
      console.error('Failed to parse AI table response:', error);
      return [];
    }
  }

  /**
   * Normalize table type from AI response
   */
  private normalizeTableType(type: string): TableDetectionResult['tableType'] {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('profit') || lowerType.includes('loss') || lowerType.includes('income')) {
      return 'profit_loss';
    }
    if (lowerType.includes('position') || lowerType.includes('balance')) {
      return 'balance_sheet';
    }
    if (lowerType.includes('cash') || lowerType.includes('flow')) {
      return 'cash_flow';
    }
    if (lowerType.includes('notes')) {
      return 'notes';
    }
    
    return 'other';
  }

  /**
   * Validate detected tables for consistency and completeness
   */
  private async validateDetectedTables(tables: TableDetectionResult[]): Promise<TableDetectionResult[]> {
    const validatedTables: TableDetectionResult[] = [];

    for (const table of tables) {
      const validationResult = await this.validateSingleTable(table);
      validatedTables.push(validationResult);
    }

    return validatedTables;
  }

  /**
   * Validate a single table for financial statement consistency
   */
  private async validateSingleTable(table: TableDetectionResult): Promise<TableDetectionResult> {
    const errors: string[] = [...table.validationErrors];
    let adjustedConfidence = table.confidence;

    // Validate periods
    if (table.tableStructure.periods.length < 2) {
      errors.push('Insufficient period data for comparative analysis');
      adjustedConfidence -= 0.2;
    }

    // Validate line items
    if (table.tableStructure.lineItems.length < 3) {
      errors.push('Insufficient line items detected');
      adjustedConfidence -= 0.3;
    }

    // Validate totals for profit_loss tables
    if (table.tableType === 'profit_loss') {
      const hasTotalRevenue = table.tableStructure.lineItems.some(
        item => item.name.toLowerCase().includes('total') && 
                item.name.toLowerCase().includes('revenue')
      );
      if (!hasTotalRevenue) {
        errors.push('Total Revenue not identified in P&L statement');
        adjustedConfidence -= 0.2;
      }
    }

    // Validate totals for balance_sheet tables
    if (table.tableType === 'balance_sheet') {
      const hasTotalAssets = table.tableStructure.lineItems.some(
        item => item.name.toLowerCase().includes('total') && 
                item.name.toLowerCase().includes('assets')
      );
      if (!hasTotalAssets) {
        errors.push('Total Assets not identified in Balance Sheet');
        adjustedConfidence -= 0.2;
      }
    }

    return {
      ...table,
      confidence: Math.max(0, adjustedConfidence),
      validationErrors: errors
    };
  }

  /**
   * Assess overall document quality for processing
   */
  private assessDocumentQuality(tables: TableDetectionResult[]): 'high' | 'medium' | 'low' {
    const highConfidenceTables = tables.filter(t => t.confidence > 0.8);
    const mediumConfidenceTables = tables.filter(t => t.confidence > 0.5);

    if (highConfidenceTables.length >= 2) return 'high';
    if (mediumConfidenceTables.length >= 1) return 'medium';
    return 'low';
  }

  /**
   * Generate processing recommendation based on detected tables
   */
  private generateProcessingRecommendation(tables: TableDetectionResult[]): string {
    const profitLossTables = tables.filter(t => t.tableType === 'profit_loss');
    const balanceSheetTables = tables.filter(t => t.tableType === 'balance_sheet');

    if (profitLossTables.length > 0 && balanceSheetTables.length > 0) {
      return 'Proceed with AI-enhanced financial analysis using detected table structures';
    }

    if (profitLossTables.length > 0 || balanceSheetTables.length > 0) {
      return 'Partial financial statements detected - proceed with available data and flag missing statements';
    }

    return 'No standard financial statements detected - use generic document processing';
  }

  /**
   * Create fallback analysis when AI detection fails
   */
  private createFallbackAnalysis(): DocumentTableAnalysis {
    return {
      tables: [],
      documentQuality: 'low',
      processingRecommendation: 'Use generic document processing due to AI detection failure'
    };
  }

  /**
   * Extract structured data from detected table
   */
  async extractTableData(table: TableDetectionResult, fullContent: string): Promise<{
    lineItems: Array<{ name: string; amount: number; category: string }>;
    totals: Record<string, number>;
    periods: string[];
    comparativeData?: any;
  }> {
    console.log('📊 Extracting structured data from detected table:', table.tableType);

    const lineItems = table.tableStructure.lineItems.map(item => ({
      name: item.name,
      amount: item.values[item.values.length - 1] || 0, // Use most recent period
      category: this.categorizeItem(item.name, table.tableType)
    }));

    const totals: Record<string, number> = {};
    
    // Extract key totals based on table type
    for (const item of table.tableStructure.lineItems) {
      if (item.isTotal) {
        const totalKey = this.getTotalKey(item.name, table.tableType);
        if (totalKey) {
          totals[totalKey] = item.values[item.values.length - 1] || 0;
        }
      }
    }

    // Extract comparative data if multiple periods
    let comparativeData;
    if (table.tableStructure.periods.length > 1) {
      comparativeData = this.extractComparativeData(table);
    }

    return {
      lineItems,
      totals,
      periods: table.tableStructure.periods,
      comparativeData
    };
  }

  /**
   * Categorize financial line item
   */
  private categorizeItem(itemName: string, tableType: string): string {
    const lowerName = itemName.toLowerCase();
    
    if (tableType === 'profit_loss') {
      return 'revenue_item';
    } else if (tableType === 'balance_sheet') {
      if (lowerName.includes('asset')) return 'asset_item';
      if (lowerName.includes('liability') || lowerName.includes('debt')) return 'liability_item';
      return 'asset_item'; // Default for balance sheet items
    }
    
    return 'revenue_item';
  }

  /**
   * Get standardized total key name
   */
  private getTotalKey(itemName: string, tableType: string): string | null {
    const lowerName = itemName.toLowerCase();
    
    if (tableType === 'profit_loss') {
      if (lowerName.includes('revenue') || lowerName.includes('sales')) return 'totalRevenue';
      if (lowerName.includes('profit') || lowerName.includes('income')) return 'totalProfit';
    } else if (tableType === 'balance_sheet') {
      if (lowerName.includes('assets')) return 'totalAssets';
      if (lowerName.includes('liabilities')) return 'totalLiabilities';
      if (lowerName.includes('equity')) return 'totalEquity';
    }
    
    return null;
  }

  /**
   * Extract comparative data across periods
   */
  private extractComparativeData(table: TableDetectionResult): any {
    const comparativeItems = [];
    
    for (const item of table.tableStructure.lineItems) {
      if (item.values.length > 1) {
        const yearOverYearChanges = [];
        
        for (let i = 1; i < item.values.length; i++) {
          const fromValue = item.values[i - 1];
          const toValue = item.values[i];
          const changeAmount = toValue - fromValue;
          const changePercentage = fromValue !== 0 ? (changeAmount / Math.abs(fromValue)) * 100 : 0;
          
          yearOverYearChanges.push({
            fromPeriod: table.tableStructure.periods[i - 1],
            toPeriod: table.tableStructure.periods[i],
            changeAmount,
            changePercentage
          });
        }
        
        comparativeItems.push({
          name: item.name,
          category: this.categorizeItem(item.name, table.tableType),
          values: item.values.map((value, index) => ({
            period: table.tableStructure.periods[index],
            amount: value
          })),
          yearOverYearChanges
        });
      }
    }
    
    return {
      periods: table.tableStructure.periods,
      comparativeItems
    };
  }
}

export const aiTableDetector = new AITableDetectorService();