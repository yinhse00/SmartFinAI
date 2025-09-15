import { supabase } from '@/integrations/supabase/client';

export interface MaterialityItem {
  id?: string;
  itemName: string;
  itemType: 'revenue_item' | 'asset_item' | 'liability_item';
  amount: number;
  baseAmount: number;
  percentage: number;
  materialityThreshold: number;
  isMaterial: boolean;
  aiSuggested: boolean;
  userConfirmed: boolean;
  aiReasoning?: string;
  businessContext?: any;
  comparativeAnalysis?: {
    periodChanges: Array<{
      fromPeriod: string;
      toPeriod: string;
      changeAmount: number;
      changePercentage: number;
      isMaterialChange: boolean;
    }>;
    trendAnalysis: string;
    underlyingReasons?: string;
  };
}

export interface MaterialityAnalysis {
  projectId: string;
  financialStatementId: string;
  items: MaterialityItem[];
  totalRevenue?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  materialityThreshold: number;
}

export interface BusinessContext {
  businessContent?: string;
  segments?: any[];
  userInputs?: any;
}

class MaterialityAnalyzerService {
  private defaultThreshold = 5.0;

  async analyzeFinancialStatement(
    projectId: string,
    financialStatementId: string,
    businessContext?: BusinessContext,
    customThreshold?: number
  ): Promise<MaterialityAnalysis> {
    const threshold = customThreshold || this.defaultThreshold;
    
    const { data: statement } = await supabase
      .from('financial_statements')
      .select('*')
      .eq('id', financialStatementId)
      .single();

    if (!statement || !statement.extracted_data) {
      throw new Error('Financial statement data not found');
    }

    const extractedData = statement.extracted_data as any;
    const items: MaterialityItem[] = [];

    if (extractedData.lineItems) {
      for (const lineItem of extractedData.lineItems) {
        const materialityItem = await this.calculateMateriality(
          lineItem,
          statement,
          threshold,
          businessContext
        );
        
        // Add comparative analysis if available
        if (extractedData.comparativeData) {
          const comparativeItem = extractedData.comparativeData.comparativeItems
            .find(item => item.name === lineItem.name);
          
          if (comparativeItem) {
            materialityItem.comparativeAnalysis = this.analyzeYearOverYearChanges(
              comparativeItem,
              threshold,
              businessContext
            );
          }
        }
        
        items.push(materialityItem);
      }
    }

    const analysis: MaterialityAnalysis = {
      projectId,
      financialStatementId,
      items,
      totalRevenue: statement.total_revenue,
      totalAssets: statement.total_assets,
      totalLiabilities: statement.total_liabilities,
      materialityThreshold: threshold
    };

    await this.saveMaterialityAnalysis(analysis);
    
    return analysis;
  }

  private async calculateMateriality(
    lineItem: any,
    statement: any,
    threshold: number,
    businessContext?: BusinessContext
  ): Promise<MaterialityItem> {
    const statementType = statement.extracted_data?.statementType || statement.statement_type;
    let baseAmount = 0;
    
    // CORRECTED MATERIALITY LOGIC:
    if (statementType === 'profit_loss') {
      baseAmount = statement.total_revenue || statement.extracted_data?.totalRevenue || 1;
    } else if (statementType === 'balance_sheet') {
      baseAmount = statement.total_assets || statement.extracted_data?.totalAssets || 1;
    } else {
      // Fallback logic
      baseAmount = lineItem.category === 'revenue_item' ? 
        (statement.total_revenue || 1) : (statement.total_assets || 1);
    }

    const percentage = Math.abs((lineItem.amount / baseAmount) * 100);
    const quantitativeMateriality = percentage >= threshold;

    // TRY AI-ENHANCED MATERIALITY ASSESSMENT
    try {
      const { aiMaterialityReasoner } = await import('./aiMaterialityReasoner');
      const aiResult = await aiMaterialityReasoner.assessMateriality(
        lineItem.name,
        lineItem.amount,
        baseAmount,
        statementType as 'profit_loss' | 'balance_sheet',
        businessContext,
        undefined, // comparativeData
        threshold
      );

      return {
        itemName: lineItem.name,
        itemType: lineItem.category,
        amount: lineItem.amount,
        baseAmount,
        percentage,
        materialityThreshold: threshold,
        isMaterial: aiResult.aiAssessment.isMaterial,
        aiSuggested: aiResult.aiAssessment.isMaterial,
        userConfirmed: false,
        aiReasoning: aiResult.aiAssessment.reasoning.quantitativeAnalysis + ' ' + 
                    aiResult.aiAssessment.reasoning.businessContext,
        businessContext: businessContext ? {
          hasBusinessAlignment: this.checkBusinessAlignment(lineItem.name, businessContext),
          relatedSegments: this.findRelatedSegments(lineItem.name, businessContext)
        } : undefined
      };
    } catch (aiError) {
      console.warn('AI materiality assessment failed, using traditional method:', aiError);
      
      // FALLBACK: Traditional materiality calculation
      const aiReasoning = this.generateAIReasoning(
        lineItem, 
        percentage, 
        threshold, 
        businessContext, 
        statementType
      );

      return {
        itemName: lineItem.name,
        itemType: lineItem.category,
        amount: lineItem.amount,
        baseAmount,
        percentage,
        materialityThreshold: threshold,
        isMaterial: quantitativeMateriality,
        aiSuggested: quantitativeMateriality,
        userConfirmed: false,
        aiReasoning,
        businessContext: businessContext ? {
          hasBusinessAlignment: this.checkBusinessAlignment(lineItem.name, businessContext),
          relatedSegments: this.findRelatedSegments(lineItem.name, businessContext)
        } : undefined
      };
    }
  }

  private generateAIReasoning(
    lineItem: any,
    percentage: number,
    threshold: number,
    businessContext?: BusinessContext,
    statementType?: string
  ): string {
    // Determine correct base description
    let baseDescription = 'the base amount';
    if (statementType === 'profit_loss') {
      baseDescription = 'total revenue';
    } else if (statementType === 'balance_sheet') {
      baseDescription = 'total assets';
    }
    
    let reasoning = `${lineItem.name} represents ${percentage.toFixed(1)}% of ${baseDescription}. `;
    
    if (percentage >= threshold) {
      reasoning += `This exceeds the materiality threshold of ${threshold}% and requires separate disclosure in the IPO prospectus. `;
      
      // Add statement-specific guidance
      if (statementType === 'profit_loss') {
        reasoning += `As a material P&L item, this significantly impacts operational performance and profit margins. `;
      } else if (statementType === 'balance_sheet') {
        reasoning += `As a material balance sheet item, this represents a significant component of the company's financial position. `;
      }
      
      if (businessContext) {
        const alignment = this.checkBusinessAlignment(lineItem.name, businessContext);
        if (alignment) {
          reasoning += `This item aligns with core business operations in technology-driven marketing services. `;
        }
      }
    } else {
      reasoning += `This is below the materiality threshold of ${threshold}% and may be aggregated with similar items unless business significance warrants separate disclosure. `;
    }

    return reasoning;
  }
  
  private analyzeYearOverYearChanges(
    comparativeItem: any,
    threshold: number,
    businessContext?: BusinessContext
  ): MaterialityItem['comparativeAnalysis'] {
    console.log('🔍 Analyzing year-over-year changes for:', comparativeItem.name);
    
    const periodChanges = comparativeItem.yearOverYearChanges.map((change: any) => ({
      fromPeriod: change.fromPeriod,
      toPeriod: change.toPeriod,
      changeAmount: change.changeAmount,
      changePercentage: change.changePercentage,
      isMaterialChange: Math.abs(change.changePercentage) >= (threshold * 2) // Material if change > 2x threshold
    }));
    
    // Generate trend analysis
    let trendAnalysis = this.generateTrendAnalysis(periodChanges, comparativeItem.name);
    
    // Generate underlying reasons based on business context
    let underlyingReasons = this.generateUnderlyingReasons(
      comparativeItem.name,
      periodChanges,
      businessContext
    );
    
    console.log(`📊 ${comparativeItem.name} trend analysis:`, trendAnalysis);
    if (underlyingReasons) {
      console.log(`💡 Underlying reasons:`, underlyingReasons);
    }
    
    return {
      periodChanges,
      trendAnalysis,
      underlyingReasons
    };
  }
  
  private generateTrendAnalysis(periodChanges: any[], itemName: string): string {
    if (periodChanges.length === 0) return 'No period-to-period data available.';
    
    const significantChanges = periodChanges.filter(change => change.isMaterialChange);
    const growthTrend = periodChanges.filter(change => change.changePercentage > 0);
    const declineTrend = periodChanges.filter(change => change.changePercentage < 0);
    
    let analysis = `${itemName} shows `;
    
    if (significantChanges.length > 0) {
      analysis += `significant material changes across periods. `;
      
      const largestChange = periodChanges.reduce((max, change) => 
        Math.abs(change.changePercentage) > Math.abs(max.changePercentage) ? change : max
      );
      
      analysis += `The most significant change was ${largestChange.changePercentage.toFixed(1)}% `;
      analysis += `from ${largestChange.fromPeriod} to ${largestChange.toPeriod}. `;
    }
    
    if (growthTrend.length > declineTrend.length) {
      analysis += `Overall trend shows growth across most periods.`;
    } else if (declineTrend.length > growthTrend.length) {
      analysis += `Overall trend shows decline across most periods.`;
    } else {
      analysis += `Mixed trend with both growth and decline periods.`;
    }
    
    return analysis;
  }
  
  private generateUnderlyingReasons(
    itemName: string,
    periodChanges: any[],
    businessContext?: BusinessContext
  ): string | undefined {
    if (!businessContext?.businessContent) return undefined;
    
    const businessText = businessContext.businessContent.toLowerCase();
    const itemLower = itemName.toLowerCase();
    
    let reasons = '';
    
    // Map financial item changes to business context
    if (itemLower.includes('revenue') || itemLower.includes('sales')) {
      if (businessText.includes('expansion') || businessText.includes('new customer')) {
        reasons += 'Revenue changes may be attributed to business expansion and new customer acquisition as described in the business overview. ';
      }
      if (businessText.includes('automobile') && businessText.includes('fmcg')) {
        reasons += 'The company\'s expansion from FMCG to automobile industry likely contributed to revenue growth in advertising marketing services. ';
      }
      if (businessText.includes('marketing technology') || businessText.includes('ai')) {
        reasons += 'Investment in marketing technology and AI capabilities supports revenue growth in technology services. ';
      }
    }
    
    if (itemLower.includes('cost') || itemLower.includes('expense')) {
      if (businessText.includes('platform') || businessText.includes('online')) {
        reasons += 'Cost increases may relate to expanded online platform utilization for advertising services. ';
      }
      if (businessText.includes('research') || businessText.includes('development')) {
        reasons += 'Higher expenses may be driven by increased R&D investment in marketing technology advancement. ';
      }
    }
    
    if (itemLower.includes('asset') || itemLower.includes('investment')) {
      if (businessText.includes('technology') || businessText.includes('proprietary')) {
        reasons += 'Asset changes may reflect investment in proprietary technology development and intellectual property. ';
      }
    }
    
    return reasons.length > 0 ? reasons.trim() : undefined;
  }

  private checkBusinessAlignment(itemName: string, businessContext: BusinessContext): boolean {
    if (!businessContext.businessContent) return false;
    
    const keywords = itemName.toLowerCase().split(' ');
    const businessText = businessContext.businessContent.toLowerCase();
    
    return keywords.some(keyword => 
      keyword.length > 3 && businessText.includes(keyword)
    );
  }

  private findRelatedSegments(itemName: string, businessContext: BusinessContext): string[] {
    if (!businessContext.segments) return [];
    
    return businessContext.segments
      .filter((segment: any) => {
        const segmentText = (segment.name + ' ' + segment.description).toLowerCase();
        const itemKeywords = itemName.toLowerCase().split(' ');
        return itemKeywords.some(keyword => 
          keyword.length > 3 && segmentText.includes(keyword)
        );
      })
      .map((segment: any) => segment.name);
  }

  private async saveMaterialityAnalysis(analysis: MaterialityAnalysis): Promise<void> {
    const materialityRecords = analysis.items.map(item => ({
      project_id: analysis.projectId,
      financial_statement_id: analysis.financialStatementId,
      item_name: item.itemName,
      item_type: item.itemType,
      amount: item.amount,
      base_amount: item.baseAmount,
      percentage: item.percentage,
      materiality_threshold: item.materialityThreshold,
      is_material: item.isMaterial,
      ai_suggested: item.aiSuggested,
      user_confirmed: item.userConfirmed,
      ai_reasoning: item.aiReasoning,
      business_context: item.businessContext
    }));

    await supabase
      .from('materiality_analysis')
      .delete()
      .eq('financial_statement_id', analysis.financialStatementId);

    const { error } = await supabase
      .from('materiality_analysis')
      .insert(materialityRecords);

    if (error) {
      throw new Error(`Failed to save materiality analysis: ${error.message}`);
    }
  }

  async updateUserConfirmation(
    materialityId: string,
    confirmed: boolean,
    isMaterial?: boolean
  ): Promise<void> {
    const updateData: any = {
      user_confirmed: confirmed
    };

    if (isMaterial !== undefined) {
      updateData.is_material = isMaterial;
    }

    const { error } = await supabase
      .from('materiality_analysis')
      .update(updateData)
      .eq('id', materialityId);

    if (error) {
      throw new Error(`Failed to update confirmation: ${error.message}`);
    }
  }

  async getMaterialityAnalysis(projectId: string): Promise<MaterialityAnalysis[]> {
    const { data, error } = await supabase
      .from('materiality_analysis')
      .select(`
        *,
        financial_statements!inner(*)
      `)
      .eq('project_id', projectId);

    if (error) {
      throw new Error(`Failed to fetch materiality analysis: ${error.message}`);
    }

    const groupedByStatement = data.reduce((acc, item) => {
      const statementId = item.financial_statement_id;
      if (!acc[statementId]) {
        acc[statementId] = [];
      }
      acc[statementId].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(groupedByStatement).map(([statementId, items]) => {
      const statement = items[0].financial_statements;
      return {
        projectId,
        financialStatementId: statementId,
        items: items.map(item => ({
          id: item.id,
          itemName: item.item_name,
          itemType: item.item_type,
          amount: item.amount,
          baseAmount: item.base_amount,
          percentage: item.percentage,
          materialityThreshold: item.materiality_threshold,
          isMaterial: item.is_material,
          aiSuggested: item.ai_suggested,
          userConfirmed: item.user_confirmed,
          aiReasoning: item.ai_reasoning,
          businessContext: item.business_context
        })),
        totalRevenue: statement.total_revenue,
        totalAssets: statement.total_assets,
        totalLiabilities: statement.total_liabilities,
        materialityThreshold: items[0]?.materiality_threshold || this.defaultThreshold
      };
    });
  }
}

export const materialityAnalyzer = new MaterialityAnalyzerService();