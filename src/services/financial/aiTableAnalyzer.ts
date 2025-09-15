import { grokService } from '../grokService';
import { TableDetectionResult } from './aiTableDetector';

export interface TableValidationResult {
  isValid: boolean;
  confidence: number;
  structuralIssues: string[];
  accountingValidation: {
    balanceSheetBalances: boolean;
    profitLossConsistency: boolean;
    periodConsistency: boolean;
  };
  dataQualityIssues: string[];
  recommendations: string[];
}

export interface StructuredFinancialData {
  statementType: 'profit_loss' | 'balance_sheet' | 'cash_flow';
  periods: string[];
  lineItems: Array<{
    name: string;
    amounts: Record<string, number>;
    category: 'revenue_item' | 'asset_item' | 'liability_item';
    isTotal: boolean;
    materiality?: {
      isLikelyMaterial: boolean;
      percentage: number;
      reasoning: string;
    };
  }>;
  keyTotals: Record<string, Record<string, number>>; // e.g., { totalRevenue: { FY2023: 1000000, FY2024: 1200000 } }
  accountingRelationships: {
    assetsEqualsLiabilitiesPlusEquity?: Record<string, boolean>;
    revenueFlowConsistency?: boolean;
  };
}

class AITableAnalyzerService {

  /**
   * Analyze and validate financial statement table structure
   */
  async analyzeTableStructure(table: TableDetectionResult, fullContent: string): Promise<StructuredFinancialData> {
    console.log('🔬 Analyzing table structure for:', table.tableType);

    try {
      const structuredData = await this.extractStructuredData(table, fullContent);
      const validatedData = await this.validateFinancialData(structuredData);
      const enhancedData = await this.enhanceWithMaterialityIndicators(validatedData);
      
      return enhancedData;
    } catch (error) {
      console.error('Table structure analysis failed:', error);
      throw new Error(`Failed to analyze table structure: ${error.message}`);
    }
  }

  /**
   * Extract structured financial data using AI understanding
   */
  private async extractStructuredData(table: TableDetectionResult, fullContent: string): Promise<StructuredFinancialData> {
    const prompt = `
Analyze this ${table.tableType} financial statement table and extract structured data.

REQUIREMENTS:
1. Extract ALL line items with their amounts across ALL periods
2. Identify key totals (Total Revenue, Total Assets, Total Liabilities, etc.)
3. Categorize each line item correctly
4. Validate accounting relationships
5. Ensure period consistency

Table Type: ${table.tableType}
Detected Periods: ${table.tableStructure.periods.join(', ')}
Line Items Count: ${table.tableStructure.lineItems.length}

Context around table:
${this.extractTableContext(fullContent, table)}

Return structured JSON with:
- All line items with amounts per period
- Key totals identification
- Accounting relationship validation
- Data quality assessment
    `;

    const response = await grokService.generateResponse({
      prompt,
      format: 'structured_json',
      metadata: {
        context: 'financial_data_extraction',
        requirements: {
          validation: 'accounting_principles',
          focus: 'data_accuracy'
        }
      }
    });

    return this.parseStructuredResponse(response.text, table);
  }

  /**
   * Extract relevant context around the detected table
   */
  private extractTableContext(fullContent: string, table: TableDetectionResult): string {
    const lines = fullContent.split('\n');
    const startLine = Math.max(0, table.tableStructure.startLine - 5);
    const endLine = Math.min(lines.length, table.tableStructure.endLine + 5);
    
    return lines.slice(startLine, endLine).join('\n');
  }

  /**
   * Parse AI response into structured financial data
   */
  private parseStructuredResponse(aiResponse: string, table: TableDetectionResult): StructuredFinancialData {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No structured data found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        statementType: table.tableType === 'notes' || table.tableType === 'other' ? 'profit_loss' : table.tableType,
        periods: parsed.periods || table.tableStructure.periods,
        lineItems: this.normalizeLineItems(parsed.lineItems || [], table.tableStructure.periods),
        keyTotals: parsed.keyTotals || {},
        accountingRelationships: parsed.accountingRelationships || {}
      };
    } catch (error) {
      console.error('Failed to parse structured response:', error);
      return this.createFallbackStructure(table);
    }
  }

  /**
   * Normalize line items to consistent format
   */
  private normalizeLineItems(items: any[], periods: string[]): StructuredFinancialData['lineItems'] {
    return items.map(item => ({
      name: item.name || '',
      amounts: item.amounts || {},
      category: this.normalizeCategory(item.category),
      isTotal: item.isTotal || false
    }));
  }

  /**
   * Normalize category values
   */
  private normalizeCategory(category: string): 'revenue_item' | 'asset_item' | 'liability_item' {
    const lower = category?.toLowerCase() || '';
    
    if (lower.includes('asset')) return 'asset_item';
    if (lower.includes('liability') || lower.includes('debt')) return 'liability_item';
    return 'revenue_item';
  }

  /**
   * Create fallback structure when AI parsing fails
   */
  private createFallbackStructure(table: TableDetectionResult): StructuredFinancialData {
    const lineItems = table.tableStructure.lineItems.map(item => ({
      name: item.name,
      amounts: this.createAmountsFromValues(item.values, table.tableStructure.periods),
      category: this.normalizeCategory(''),
      isTotal: item.isTotal || false
    }));

    return {
      statementType: table.tableType === 'notes' || table.tableType === 'other' ? 'profit_loss' : table.tableType,
      periods: table.tableStructure.periods,
      lineItems,
      keyTotals: {},
      accountingRelationships: {}
    };
  }

  /**
   * Create amounts object from values array
   */
  private createAmountsFromValues(values: number[], periods: string[]): Record<string, number> {
    const amounts: Record<string, number> = {};
    values.forEach((value, index) => {
      if (periods[index]) {
        amounts[periods[index]] = value;
      }
    });
    return amounts;
  }

  /**
   * Validate financial data for accounting consistency
   */
  private async validateFinancialData(data: StructuredFinancialData): Promise<StructuredFinancialData> {
    console.log('✅ Validating financial data consistency...');

    // Validate balance sheet equation: Assets = Liabilities + Equity
    if (data.statementType === 'balance_sheet') {
      data.accountingRelationships.assetsEqualsLiabilitiesPlusEquity = this.validateBalanceSheetEquation(data);
    }

    // Validate revenue flow consistency for P&L statements
    if (data.statementType === 'profit_loss') {
      data.accountingRelationships.revenueFlowConsistency = this.validateRevenueFlow(data);
    }

    return data;
  }

  /**
   * Validate balance sheet equation across all periods
   */
  private validateBalanceSheetEquation(data: StructuredFinancialData): Record<string, boolean> {
    const validation: Record<string, boolean> = {};

    for (const period of data.periods) {
      const totalAssets = this.findTotalAmount(data, 'total assets', period);
      const totalLiabilities = this.findTotalAmount(data, 'total liabilities', period);
      const totalEquity = this.findTotalAmount(data, 'total equity', period);

      if (totalAssets && totalLiabilities && totalEquity) {
        const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < (totalAssets * 0.01); // 1% tolerance
        validation[period] = isBalanced;
        
        if (!isBalanced) {
          console.warn(`⚠️ Balance sheet equation not balanced for ${period}:`, {
            totalAssets,
            totalLiabilities,
            totalEquity,
            difference: totalAssets - (totalLiabilities + totalEquity)
          });
        }
      }
    }

    return validation;
  }

  /**
   * Validate revenue flow consistency in P&L statement
   */
  private validateRevenueFlow(data: StructuredFinancialData): boolean {
    // Check if total revenue >= individual revenue items
    for (const period of data.periods) {
      const totalRevenue = this.findTotalAmount(data, 'total revenue', period);
      if (!totalRevenue) continue;

      const revenueItems = data.lineItems.filter(item => 
        item.category === 'revenue_item' && 
        !item.isTotal &&
        item.amounts[period] > 0
      );

      const sumOfRevenueItems = revenueItems.reduce((sum, item) => sum + (item.amounts[period] || 0), 0);
      
      if (sumOfRevenueItems > totalRevenue * 1.1) { // Allow 10% tolerance
        console.warn(`⚠️ Revenue flow inconsistency in ${period}:`, {
          totalRevenue,
          sumOfRevenueItems
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Find total amount for a specific item and period
   */
  private findTotalAmount(data: StructuredFinancialData, itemName: string, period: string): number | null {
    const item = data.lineItems.find(item => 
      item.isTotal && 
      item.name.toLowerCase().includes(itemName.toLowerCase())
    );
    
    return item ? (item.amounts[period] || null) : null;
  }

  /**
   * Enhance data with preliminary materiality indicators
   */
  private async enhanceWithMaterialityIndicators(data: StructuredFinancialData): Promise<StructuredFinancialData> {
    console.log('🎯 Adding materiality indicators...');

    // Get base amounts for materiality calculation
    const baseAmounts = this.getBaseAmountsForMateriality(data);

    // Enhance each line item with materiality analysis
    const enhancedLineItems = data.lineItems.map(item => {
      const materiality = this.calculatePreliminaryMateriality(item, baseAmounts, data.statementType);
      return {
        ...item,
        materiality
      };
    });

    return {
      ...data,
      lineItems: enhancedLineItems
    };
  }

  /**
   * Get base amounts for materiality calculations
   */
  private getBaseAmountsForMateriality(data: StructuredFinancialData): Record<string, number> {
    const baseAmounts: Record<string, number> = {};

    for (const period of data.periods) {
      if (data.statementType === 'profit_loss') {
        const totalRevenue = this.findTotalAmount(data, 'total revenue', period);
        if (totalRevenue) baseAmounts[period] = totalRevenue;
      } else if (data.statementType === 'balance_sheet') {
        const totalAssets = this.findTotalAmount(data, 'total assets', period);
        if (totalAssets) baseAmounts[period] = totalAssets;
      }
    }

    return baseAmounts;
  }

  /**
   * Calculate preliminary materiality for a line item
   */
  private calculatePreliminaryMateriality(
    item: StructuredFinancialData['lineItems'][0], 
    baseAmounts: Record<string, number>,
    statementType: string
  ): StructuredFinancialData['lineItems'][0]['materiality'] {
    const threshold = 5.0; // 5% materiality threshold
    let maxPercentage = 0;
    let reasoning = '';

    // Calculate materiality across all periods
    for (const [period, amount] of Object.entries(item.amounts)) {
      const baseAmount = baseAmounts[period];
      if (baseAmount && baseAmount > 0) {
        const percentage = Math.abs(amount / baseAmount) * 100;
        maxPercentage = Math.max(maxPercentage, percentage);
      }
    }

    const isLikelyMaterial = maxPercentage >= threshold;

    if (isLikelyMaterial) {
      reasoning = `${item.name} represents ${maxPercentage.toFixed(1)}% of ${statementType === 'profit_loss' ? 'total revenue' : 'total assets'}, exceeding the 5% materiality threshold`;
    } else {
      reasoning = `${item.name} represents ${maxPercentage.toFixed(1)}% of ${statementType === 'profit_loss' ? 'total revenue' : 'total assets'}, below the 5% materiality threshold`;
    }

    return {
      isLikelyMaterial,
      percentage: maxPercentage,
      reasoning
    };
  }

  /**
   * Validate complete table analysis results
   */
  async validateTableAnalysis(data: StructuredFinancialData): Promise<TableValidationResult> {
    const structuralIssues: string[] = [];
    const dataQualityIssues: string[] = [];
    const recommendations: string[] = [];

    // Check structural completeness
    if (data.lineItems.length < 3) {
      structuralIssues.push('Insufficient line items detected');
    }

    if (data.periods.length < 2) {
      dataQualityIssues.push('Insufficient periods for comparative analysis');
      recommendations.push('Seek additional period data for trend analysis');
    }

    // Check accounting validation results
    const accountingValidation = {
      balanceSheetBalances: data.statementType === 'balance_sheet' ? 
        Object.values(data.accountingRelationships.assetsEqualsLiabilitiesPlusEquity || {}).every(v => v) : true,
      profitLossConsistency: data.statementType === 'profit_loss' ? 
        data.accountingRelationships.revenueFlowConsistency || false : true,
      periodConsistency: data.periods.length > 0
    };

    // Generate overall confidence score
    let confidence = 1.0;
    confidence -= structuralIssues.length * 0.1;
    confidence -= dataQualityIssues.length * 0.05;
    if (!accountingValidation.balanceSheetBalances) confidence -= 0.2;
    if (!accountingValidation.profitLossConsistency) confidence -= 0.15;

    const isValid = confidence > 0.6 && structuralIssues.length === 0;

    if (isValid) {
      recommendations.push('Proceed with materiality analysis using extracted data');
    } else {
      recommendations.push('Review data extraction and consider manual verification');
    }

    return {
      isValid,
      confidence: Math.max(0, confidence),
      structuralIssues,
      accountingValidation,
      dataQualityIssues,
      recommendations
    };
  }
}

export const aiTableAnalyzer = new AITableAnalyzerService();