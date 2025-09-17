import { supabase } from '@/integrations/supabase/client';
import { financialNLPService, QualitativeFactor } from '../nlp/financialNLPService';

export interface EnhancedMaterialityItem {
  id?: string;
  itemName: string;
  itemType: 'revenue_item' | 'asset_item' | 'liability_item' | 'qualitative_item';
  amount: number;
  baseAmount: number;
  percentage: number;
  yoyPercentage?: number;
  materialityThreshold: number;
  yoyThreshold: number;
  isMaterial: boolean;
  aiSuggested: boolean;
  userConfirmed: boolean;
  aiReasoning?: string;
  section: 'P/L' | 'BS' | 'CF' | 'Qualitative';
  periods?: string[];
  businessContext?: any;
}

export interface EnhancedMaterialityAnalysis {
  projectId: string;
  financialStatementId: string;
  items: EnhancedMaterialityItem[];
  qualitativeFactors: QualitativeFactor[];
  totalRevenue?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  materialityThreshold: number;
  yoyThreshold: number;
  extractedPeriods: string[];
  currency: string;
  auditStatus: string;
}

class EnhancedMaterialityAnalyzerService {
  private defaultMaterialityThreshold = 5.0;
  private defaultYoyThreshold = 20.0;

  async analyzeFinancialStatementEnhanced(
    projectId: string,
    financialStatementId: string,
    documentText: string,
    materialityThreshold: number = this.defaultMaterialityThreshold,
    yoyThreshold: number = this.defaultYoyThreshold,
    businessContext?: any
  ): Promise<EnhancedMaterialityAnalysis> {
    
    // Extract qualitative factors using NLP
    console.log('🤖 Starting NLP analysis for qualitative factors...');
    const nlpResult = await financialNLPService.extractQualitativeFactors(documentText);
    
    // Get financial statement data
    const { data: statement } = await supabase
      .from('financial_statements')
      .select('*')
      .eq('id', financialStatementId)
      .single();

    if (!statement || !statement.extracted_data) {
      throw new Error('Financial statement data not found');
    }

    const extractedData = statement.extracted_data as any;
    const items: EnhancedMaterialityItem[] = [];

    // Process financial line items with enhanced materiality calculation
    if (extractedData.lineItems) {
      for (const lineItem of extractedData.lineItems) {
        const materialityItem = await this.calculateEnhancedMateriality(
          lineItem,
          statement,
          materialityThreshold,
          yoyThreshold,
          nlpResult.periods,
          businessContext
        );
        items.push(materialityItem);
      }
    }

    // Add qualitative factors as material items
    const qualitativeItems = nlpResult.qualitativeFactors
      .filter(factor => factor.material)
      .map(factor => this.convertQualitativeToMaterialityItem(factor, materialityThreshold, yoyThreshold));
    
    items.push(...qualitativeItems);

    // Sort by materiality (material items first, then by percentage)
    items.sort((a, b) => {
      if (a.isMaterial && !b.isMaterial) return -1;
      if (!a.isMaterial && b.isMaterial) return 1;
      return b.percentage - a.percentage;
    });

    const analysis: EnhancedMaterialityAnalysis = {
      projectId,
      financialStatementId,
      items,
      qualitativeFactors: nlpResult.qualitativeFactors,
      totalRevenue: statement.total_revenue,
      totalAssets: statement.total_assets,
      totalLiabilities: statement.total_liabilities,
      materialityThreshold,
      yoyThreshold,
      extractedPeriods: nlpResult.periods,
      currency: nlpResult.currency,
      auditStatus: nlpResult.auditStatus
    };

    await this.saveEnhancedMaterialityAnalysis(analysis);
    
    console.log(`✅ Enhanced materiality analysis completed: ${items.length} items (${items.filter(i => i.isMaterial).length} material)`);
    
    return analysis;
  }

  private async calculateEnhancedMateriality(
    lineItem: any,
    statement: any,
    materialityThreshold: number,
    yoyThreshold: number,
    periods: string[],
    businessContext?: any
  ): Promise<EnhancedMaterialityItem> {
    const statementType = statement.extracted_data?.statementType || statement.statement_type;
    
    // Dynamic base amount calculation
    let baseAmount = 0;
    let section: 'P/L' | 'BS' | 'CF' = 'P/L';
    
    if (statementType === 'profit_loss') {
      baseAmount = statement.total_revenue || statement.extracted_data?.totalRevenue || 1;
      section = 'P/L';
    } else if (statementType === 'balance_sheet') {
      // Enhanced BS materiality: assets vs current/non-current assets, liabilities vs current/non-current liabilities
      if (lineItem.category === 'asset_item') {
        baseAmount = this.getAssetBase(lineItem, statement);
      } else if (lineItem.category === 'liability_item') {
        baseAmount = this.getLiabilityBase(lineItem, statement);
      } else {
        baseAmount = statement.total_assets || statement.extracted_data?.totalAssets || 1;
      }
      section = 'BS';
    } else {
      baseAmount = statement.total_revenue || 1;
      section = 'CF';
    }

    const percentage = Math.abs((lineItem.amount / baseAmount) * 100);
    
    // Calculate YoY percentage if multiple periods available
    let yoyPercentage = 0;
    if (periods.length >= 2 && lineItem.historicalData) {
      const latestYear = periods[periods.length - 1];
      const previousYear = periods[periods.length - 2];
      
      const latestAmount = lineItem.historicalData[latestYear] || lineItem.amount;
      const previousAmount = lineItem.historicalData[previousYear];
      
      if (previousAmount && previousAmount !== 0) {
        yoyPercentage = ((latestAmount - previousAmount) / Math.abs(previousAmount)) * 100;
      }
    }

    // Enhanced materiality assessment: quantitative + YoY + qualitative
    const quantitativeMateriality = percentage >= materialityThreshold;
    const yoyMateriality = Math.abs(yoyPercentage) >= yoyThreshold;
    const isMaterial = quantitativeMateriality || yoyMateriality;

    // Generate enhanced AI reasoning
    const aiReasoning = this.generateEnhancedReasoning(
      lineItem,
      percentage,
      yoyPercentage,
      materialityThreshold,
      yoyThreshold,
      section,
      baseAmount,
      businessContext
    );

    return {
      itemName: lineItem.name,
      itemType: lineItem.category,
      amount: lineItem.amount,
      baseAmount,
      percentage,
      yoyPercentage,
      materialityThreshold,
      yoyThreshold,
      isMaterial,
      aiSuggested: isMaterial,
      userConfirmed: false,
      aiReasoning,
      section,
      periods,
      businessContext
    };
  }

  private getAssetBase(lineItem: any, statement: any): number {
    const itemName = lineItem.name.toLowerCase();
    
    // For current assets, use current assets as base
    if (itemName.includes('current') || itemName.includes('cash') || 
        itemName.includes('receivables') || itemName.includes('inventory')) {
      return statement.extracted_data?.currentAssets || statement.total_assets * 0.4 || 1;
    }
    
    // For non-current assets, use non-current assets as base
    if (itemName.includes('non-current') || itemName.includes('property') || 
        itemName.includes('equipment') || itemName.includes('intangible')) {
      return statement.extracted_data?.nonCurrentAssets || statement.total_assets * 0.6 || 1;
    }
    
    // Default to total assets
    return statement.total_assets || 1;
  }

  private getLiabilityBase(lineItem: any, statement: any): number {
    const itemName = lineItem.name.toLowerCase();
    
    // For current liabilities, use current liabilities as base
    if (itemName.includes('current') || itemName.includes('payables') || 
        itemName.includes('accruals') || itemName.includes('tax payable')) {
      return statement.extracted_data?.currentLiabilities || statement.total_liabilities * 0.6 || 1;
    }
    
    // For non-current liabilities, use non-current liabilities as base
    if (itemName.includes('non-current') || itemName.includes('long-term') || 
        itemName.includes('borrowings') || itemName.includes('bonds')) {
      return statement.extracted_data?.nonCurrentLiabilities || statement.total_liabilities * 0.4 || 1;
    }
    
    // Default to total liabilities
    return statement.total_liabilities || 1;
  }

  private generateEnhancedReasoning(
    lineItem: any,
    percentage: number,
    yoyPercentage: number,
    materialityThreshold: number,
    yoyThreshold: number,
    section: string,
    baseAmount: number,
    businessContext?: any
  ): string {
    let reasoning = `${lineItem.name} represents ${percentage.toFixed(1)}% of ${this.getBaseDescription(section)}`;
    
    // Materiality assessment
    if (percentage >= materialityThreshold) {
      reasoning += ` and exceeds the materiality threshold of ${materialityThreshold}%.`;
    } else {
      reasoning += ` and is below the materiality threshold of ${materialityThreshold}%.`;
    }

    // YoY analysis
    if (yoyPercentage !== 0) {
      const yoyDirection = yoyPercentage > 0 ? 'increased' : 'decreased';
      reasoning += ` Year-over-year, this item ${yoyDirection} by ${Math.abs(yoyPercentage).toFixed(1)}%.`;
      
      if (Math.abs(yoyPercentage) >= yoyThreshold) {
        reasoning += ` This ${Math.abs(yoyPercentage).toFixed(1)}% change exceeds the YoY materiality threshold of ${yoyThreshold}%, making it material for disclosure.`;
      }
    }

    // Business context
    if (businessContext) {
      const contextInsight = this.getBusinessContextInsight(lineItem.name, businessContext);
      if (contextInsight) {
        reasoning += ` ${contextInsight}`;
      }
    }

    // HKEX disclosure guidance
    reasoning += ` According to HKEX requirements, `;
    if (percentage >= materialityThreshold || Math.abs(yoyPercentage) >= yoyThreshold) {
      reasoning += `this item requires separate disclosure and detailed explanation in the MD&A section.`;
    } else {
      reasoning += `this item may be aggregated with similar items unless business significance warrants separate disclosure.`;
    }

    return reasoning;
  }

  private getBaseDescription(section: string): string {
    switch (section) {
      case 'P/L': return 'total revenue';
      case 'BS': return 'the relevant asset/liability base';
      case 'CF': return 'total cash flows';
      default: return 'the base amount';
    }
  }

  private getBusinessContextInsight(itemName: string, businessContext: any): string | null {
    if (!businessContext?.businessContent) return null;
    
    const itemLower = itemName.toLowerCase();
    const businessText = businessContext.businessContent.toLowerCase();
    
    // Technology/AI context
    if ((itemLower.includes('technology') || itemLower.includes('development')) && 
        businessText.includes('ai')) {
      return 'This aligns with the company\'s AI technology development strategy.';
    }
    
    // Marketing/advertising context
    if ((itemLower.includes('marketing') || itemLower.includes('advertising')) && 
        businessText.includes('marketing')) {
      return 'This relates to the company\'s core marketing services business.';
    }
    
    // Customer concentration
    if (itemLower.includes('receivables') && businessText.includes('customer')) {
      return 'Receivables concentration may indicate customer dependency risks.';
    }
    
    return null;
  }

  private convertQualitativeToMaterialityItem(
    factor: QualitativeFactor,
    materialityThreshold: number,
    yoyThreshold: number
  ): EnhancedMaterialityItem {
    return {
      itemName: factor.factor,
      itemType: 'qualitative_item',
      amount: 0,
      baseAmount: 1,
      percentage: factor.material ? materialityThreshold + 1 : materialityThreshold - 1,
      yoyPercentage: 0,
      materialityThreshold,
      yoyThreshold,
      isMaterial: factor.material,
      aiSuggested: factor.material,
      userConfirmed: false,
      aiReasoning: `Qualitative factor identified through NLP analysis: ${factor.description}. Confidence: ${(factor.confidence * 100).toFixed(0)}%.`,
      section: 'Qualitative'
    };
  }

  async recalculateMateriality(
    analysisId: string,
    newMaterialityThreshold: number,
    newYoyThreshold: number
  ): Promise<EnhancedMaterialityAnalysis> {
    // Get existing analysis
    const { data: existingItems } = await supabase
      .from('materiality_analysis')
      .select('*')
      .eq('id', analysisId);

    if (!existingItems || existingItems.length === 0) {
      throw new Error('Analysis not found');
    }

    // Recalculate materiality for each item
    const updatedItems = existingItems.map(item => {
      const percentage = (item.amount / item.base_amount) * 100;
      const yoyMateriality = Math.abs(item.yoy_percentage || 0) >= newYoyThreshold;
      const quantitativeMateriality = percentage >= newMaterialityThreshold;
      const isMaterial = quantitativeMateriality || yoyMateriality;

      return {
        ...item,
        materiality_threshold: newMaterialityThreshold,
        yoy_threshold: newYoyThreshold,
        is_material: isMaterial,
        ai_suggested: isMaterial
      };
    });

    // Update database
    for (const item of updatedItems) {
      await supabase
        .from('materiality_analysis')
        .update({
          materiality_threshold: item.materiality_threshold,
          yoy_threshold: item.yoy_threshold,
          is_material: item.is_material,
          ai_suggested: item.ai_suggested
        })
        .eq('id', item.id);
    }

    console.log(`✅ Recalculated materiality with thresholds: ${newMaterialityThreshold}% base, ${newYoyThreshold}% YoY`);

    // Return updated analysis (simplified)
    return this.getEnhancedMaterialityAnalysis(existingItems[0].project_id);
  }

  private async saveEnhancedMaterialityAnalysis(analysis: EnhancedMaterialityAnalysis): Promise<void> {
    // Delete existing records
    await supabase
      .from('materiality_analysis')
      .delete()
      .eq('financial_statement_id', analysis.financialStatementId);

    // Insert enhanced materiality records
    const materialityRecords = analysis.items.map(item => ({
      project_id: analysis.projectId,
      financial_statement_id: analysis.financialStatementId,
      item_name: item.itemName,
      item_type: item.itemType,
      amount: item.amount,
      base_amount: item.baseAmount,
      percentage: item.percentage,
      yoy_percentage: item.yoyPercentage || 0,
      materiality_threshold: item.materialityThreshold,
      yoy_threshold: item.yoyThreshold,
      is_material: item.isMaterial,
      ai_suggested: item.aiSuggested,
      user_confirmed: item.userConfirmed,
      ai_reasoning: item.aiReasoning,
      business_context: {
        section: item.section,
        periods: item.periods,
        ...item.businessContext
      }
    }));

    const { error } = await supabase
      .from('materiality_analysis')
      .insert(materialityRecords);

    if (error) {
      throw new Error(`Failed to save enhanced materiality analysis: ${error.message}`);
    }
  }

  async getEnhancedMaterialityAnalysis(projectId: string): Promise<EnhancedMaterialityAnalysis> {
    const { data, error } = await supabase
      .from('materiality_analysis')
      .select(`
        *,
        financial_statements!inner(*)
      `)
      .eq('project_id', projectId)
      .order('percentage', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch enhanced materiality analysis: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No materiality analysis found');
    }

    const statement = data[0].financial_statements;
    
    return {
      projectId,
      financialStatementId: data[0].financial_statement_id,
      items: data.map(item => ({
        id: item.id,
        itemName: item.item_name,
        itemType: item.item_type,
        amount: item.amount,
        baseAmount: item.base_amount,
        percentage: item.percentage,
        yoyPercentage: item.yoy_percentage,
        materialityThreshold: item.materiality_threshold,
        yoyThreshold: item.yoy_threshold,
        isMaterial: item.is_material,
        aiSuggested: item.ai_suggested,
        userConfirmed: item.user_confirmed,
        aiReasoning: item.ai_reasoning,
        section: item.business_context?.section || 'P/L',
        periods: item.business_context?.periods || [],
        businessContext: item.business_context
      })),
      qualitativeFactors: [], // Would need separate table for this
      totalRevenue: statement.total_revenue,
      totalAssets: statement.total_assets,
      totalLiabilities: statement.total_liabilities,
      materialityThreshold: data[0]?.materiality_threshold || this.defaultMaterialityThreshold,
      yoyThreshold: data[0]?.yoy_threshold || this.defaultYoyThreshold,
      extractedPeriods: data[0]?.business_context?.periods || [],
      currency: data[0]?.business_context?.currency || 'Unknown',
      auditStatus: data[0]?.business_context?.auditStatus || 'Unknown'
    };
  }
}

export const enhancedMaterialityAnalyzer = new EnhancedMaterialityAnalyzerService();