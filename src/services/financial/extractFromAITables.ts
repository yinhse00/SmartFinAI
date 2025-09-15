/**
 * Extract structured financial data from AI-detected tables
 * Bridge between AI table detection and existing FinancialData format
 */

import { FinancialData, LineItem } from './financialDataExtractor';
import { DocumentTableAnalysis } from './aiTableDetector';
import { aiTableAnalyzer } from './aiTableAnalyzer';

export async function extractFromAITables(
  tableAnalysis: DocumentTableAnalysis, 
  statementType: 'profit_loss' | 'balance_sheet' | 'cash_flow', 
  content: string
): Promise<FinancialData> {
  try {
    console.log('🤖 Extracting financial data from AI-detected tables...');
    
    // Get the primary table based on statement type
    const primaryTable = statementType === 'profit_loss' 
      ? tableAnalysis.primaryProfitLossTable 
      : tableAnalysis.primaryBalanceSheetTable;
    
    if (!primaryTable) {
      throw new Error(`No ${statementType} table found in AI analysis`);
    }
    
    // Use AI table analyzer to get structured data
    const structuredData = await aiTableAnalyzer.analyzeTableStructure(primaryTable, content);
    
    // Convert to FinancialData format
    const lineItems: LineItem[] = structuredData.lineItems.map(item => ({
      name: item.name,
      amount: item.amounts[structuredData.periods[structuredData.periods.length - 1]] || 0,
      category: item.category,
      subcategory: item.category,
      materialityAssessment: item.materiality ? {
        isMaterial: item.materiality.isLikelyMaterial,
        threshold: 0,
        percentage: item.materiality.percentage,
        reasoning: item.materiality.reasoning
      } : undefined
    }));
    
    // Get the latest period totals
    const latestPeriod = structuredData.periods[structuredData.periods.length - 1];
    
    const financialData: FinancialData = {
      statementType: structuredData.statementType,
      lineItems: lineItems.map(item => ({
        name: item.name,
        amount: item.amount,
        category: item.category as 'revenue_item' | 'asset_item' | 'liability_item'
      })),
      totalRevenue: structuredData.keyTotals.totalRevenue?.[latestPeriod],
      totalAssets: structuredData.keyTotals.totalAssets?.[latestPeriod],
      totalLiabilities: structuredData.keyTotals.totalLiabilities?.[latestPeriod],
      comparativeData: {
        periods: structuredData.periods,
        comparativeItems: structuredData.lineItems.map(item => ({
          name: item.name,
          category: item.category as 'revenue_item' | 'asset_item' | 'liability_item',
          values: Object.entries(item.amounts).map(([period, amount]) => ({ period, amount })),
          yearOverYearChanges: []
        }))
      }
    };
    
    console.log(`✅ Successfully extracted ${lineItems.length} line items from AI tables`);
    return financialData;
    
  } catch (error) {
    console.error('❌ Failed to extract data from AI tables:', error);
    throw error;
  }
}