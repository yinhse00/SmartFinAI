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
  summaryData: {
    totalRevenue: number;
    totalAssets: number;
    totalLiabilities: number;
  };
  thresholds: {
    materiality: number;
    yoyChange: number;
  };
  extractedPeriods: string[];
}

class EnhancedMaterialityAnalyzerService {
  private defaultMaterialityThreshold = 5.0;
  private defaultYoyThreshold = 20.0;

  async analyzeFinancialStatementEnhanced(
    projectId: string,
    financialStatementId: string,
    documentText: string,
    fullDocumentContent?: string
  ): Promise<EnhancedMaterialityAnalysis> {
    console.log('🚀 Starting enhanced materiality analysis...');

    const materialityThreshold = this.defaultMaterialityThreshold;
    const yoyThreshold = this.defaultYoyThreshold;
    
    // Get financial statement data
    const { data: statement, error } = await supabase
      .from('financial_statements')
      .select('*')
      .eq('id', financialStatementId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch financial statement: ${error.message}`);
    }

    console.log(`📊 Processing financial statement: ${statement.statement_type}, ${statement.file_name}`);

    // Check if we already have analysis for this statement
    const existingAnalysis = await this.getEnhancedMaterialityAnalysis(projectId);
    if (existingAnalysis.length > 0) {
      console.log('📊 Found existing analysis, returning latest...');
      return existingAnalysis[0];
    }

    const items: EnhancedMaterialityItem[] = [];
    const extractedData = statement.extracted_data as any;

    // Extract qualitative factors using NLP on full document if available
    let qualitativeFactors: any[] = [];
    if (fullDocumentContent) {
      try {
        const nlpResult = await financialNLPService.extractQualitativeFactors(fullDocumentContent);
        qualitativeFactors = nlpResult.qualitativeFactors || [];
        console.log(`🧠 NLP extracted ${qualitativeFactors.length} qualitative factors`);
      } catch (nlpError) {
        console.warn('NLP extraction failed:', nlpError);
      }
    }

    // Process quantitative line items
    if (extractedData?.lineItems && extractedData.lineItems.length > 0) {
      console.log(`📈 Processing ${extractedData.lineItems.length} line items`);
      for (const lineItem of extractedData.lineItems) {
        const materialityItem = this.calculateEnhancedMateriality(
          lineItem,
          statement,
          materialityThreshold,
          yoyThreshold
        );
        if (materialityItem) {
          items.push(materialityItem);
        }
      }
    } else {
      console.warn('No line items found in extracted data');
    }

    // Add qualitative factors as material items
    if (qualitativeFactors.length > 0) {
      const qualitativeItems = qualitativeFactors
        .filter(factor => factor.material)
        .map(factor => this.convertQualitativeToMaterialityItem(factor, materialityThreshold, yoyThreshold));
      
      items.push(...qualitativeItems);
    }

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
      qualitativeFactors,
      summaryData: {
        totalRevenue: statement.total_revenue || 0,
        totalAssets: statement.total_assets || 0,
        totalLiabilities: statement.total_liabilities || 0
      },
      thresholds: {
        materiality: materialityThreshold,
        yoyChange: yoyThreshold
      },
      extractedPeriods: extractedData?.periods || []
    };

    await this.saveEnhancedMaterialityAnalysis(analysis);
    
    console.log(`✅ Enhanced materiality analysis completed: ${items.length} items (${items.filter(i => i.isMaterial).length} material)`);
    
    return analysis;
  }

  private calculateEnhancedMateriality(
    lineItem: any,
    statement: any,
    materialityThreshold: number,
    yoyThreshold: number
  ): EnhancedMaterialityItem | null {
    if (!lineItem.name || lineItem.amount === undefined) {
      return null;
    }

    const baseAmount = this.getBaseAmount(lineItem.category, statement);
    if (baseAmount === 0) {
      console.warn(`Base amount is zero for ${lineItem.name}, using amount as base`);
      return null;
    }

    const percentage = Math.abs((lineItem.amount / baseAmount) * 100);
    const isMaterial = percentage >= materialityThreshold;

    // Calculate YoY percentage if available
    let yoyPercentage = 0;
    if (lineItem.yearOverYearChanges && lineItem.yearOverYearChanges.length > 0) {
      yoyPercentage = Math.abs(lineItem.yearOverYearChanges[lineItem.yearOverYearChanges.length - 1].changePercentage);
    }

    const section = this.mapCategoryToSection(lineItem.category);
    const aiReasoning = this.generateReasoning(lineItem, percentage, yoyPercentage, isMaterial);

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
      businessContext: {}
    };
  }

  private getBaseAmount(category: string, statement: any): number {
    switch (category) {
      case 'revenue_item':
        return statement.total_revenue || 0;
      case 'asset_item':
        return statement.total_assets || 0;
      case 'liability_item':
        return statement.total_liabilities || 0;
      default:
        return statement.total_revenue || statement.total_assets || 0;
    }
  }

  private mapCategoryToSection(category: string): 'P/L' | 'BS' | 'CF' | 'Qualitative' {
    switch (category) {
      case 'revenue_item':
        return 'P/L';
      case 'asset_item':
      case 'liability_item':
        return 'BS';
      case 'qualitative_item':
        return 'Qualitative';
      default:
        return 'P/L';
    }
  }

  private generateReasoning(lineItem: any, percentage: number, yoyPercentage: number, isMaterial: boolean): string {
    const base = `${lineItem.name} represents ${percentage.toFixed(1)}% of the relevant base amount.`;
    const change = yoyPercentage > 0 ? ` Year-over-year change of ${yoyPercentage.toFixed(1)}%.` : '';
    const conclusion = isMaterial ? ' This exceeds the materiality threshold and requires disclosure.' : ' This is below the materiality threshold.';
    
    return base + change + conclusion;
  }

  private convertQualitativeToMaterialityItem(
    factor: any,
    materialityThreshold: number,
    yoyThreshold: number
  ): EnhancedMaterialityItem {
    return {
      itemName: factor.factor,
      itemType: 'qualitative_item',
      amount: 0,
      baseAmount: 1,
      percentage: 100, // Qualitative factors are considered 100% material if flagged
      yoyPercentage: 0,
      materialityThreshold,
      yoyThreshold,
      isMaterial: factor.material,
      aiSuggested: factor.material,
      userConfirmed: false,
      aiReasoning: factor.description,
      section: 'Qualitative',
      businessContext: { qualitativeFactor: true }
    };
  }

  private async saveEnhancedMaterialityAnalysis(analysis: EnhancedMaterialityAnalysis): Promise<void> {
    // Delete existing records
    await supabase
      .from('materiality_analysis')
      .delete()
      .eq('financial_statement_id', analysis.financialStatementId);

    // Prepare records for insertion
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
      currency: 'Unknown',
      audit_status: 'Unknown',
      business_context: JSON.stringify(item.businessContext || {}),
      extracted_periods: JSON.stringify(analysis.extractedPeriods)
    }));

    const { error } = await supabase
      .from('materiality_analysis')
      .insert(materialityRecords);

    if (error) {
      throw new Error(`Failed to save enhanced materiality analysis: ${error.message}`);
    }
  }

  async getEnhancedMaterialityAnalysis(projectId: string): Promise<EnhancedMaterialityAnalysis[]> {
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
      return [];
    }

    const statement = data[0].financial_statements;
    
    return [{
      projectId,
      financialStatementId: data[0].financial_statement_id,
      items: data.map(item => {
        const itemBusinessContext = item.business_context as any;
        return {
          id: item.id,
          itemName: item.item_name,
          itemType: (item.item_type as 'revenue_item' | 'asset_item' | 'liability_item' | 'qualitative_item'),
          amount: item.amount,
          baseAmount: item.base_amount,
          percentage: item.percentage,
          yoyPercentage: item.yoy_percentage || 0,
          materialityThreshold: item.materiality_threshold,
          yoyThreshold: item.yoy_threshold || this.defaultYoyThreshold,
          isMaterial: item.is_material,
          aiSuggested: item.ai_suggested,
          userConfirmed: item.user_confirmed,
          aiReasoning: item.ai_reasoning,
          section: this.mapCategoryToSection(item.item_type),
          periods: [],
          businessContext: itemBusinessContext
        };
      }),
      qualitativeFactors: [],
      summaryData: {
        totalRevenue: statement.total_revenue || 0,
        totalAssets: statement.total_assets || 0,
        totalLiabilities: statement.total_liabilities || 0
      },
      thresholds: {
        materiality: data[0]?.materiality_threshold || this.defaultMaterialityThreshold,
        yoyChange: data[0]?.yoy_threshold || this.defaultYoyThreshold
      },
      extractedPeriods: []
    }];
  }
}

export const enhancedMaterialityAnalyzer = new EnhancedMaterialityAnalyzerService();