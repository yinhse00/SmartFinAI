import { supabase } from '@/integrations/supabase/client';
import { MaterialityAnalysis } from './materialityAnalyzer';

export interface FinancialContentRequest {
  projectId: string;
  materialityAnalyses: MaterialityAnalysis[];
  businessContext?: {
    businessContent?: string;
    userInputs?: any;
  };
}

export interface FinancialContentResult {
  content: string;
  sourceAttributions: Array<{
    sourceType: string;
    sourceReference: string;
    contentSnippet: string;
    confidenceScore: number;
  }>;
}

class FinancialContentGeneratorService {
  async generateFinancialInformation(request: FinancialContentRequest): Promise<FinancialContentResult> {
    const materialItems = this.extractMaterialItems(request.materialityAnalyses);
    const guidance = await this.getListingGuidance();
    const businessAlignment = await this.getBusinessAlignment(request.projectId);
    
    const content = await this.generateContent(materialItems, guidance, businessAlignment, request.businessContext);
    const sourceAttributions = this.createSourceAttributions(materialItems, guidance, businessAlignment);
    
    return {
      content,
      sourceAttributions
    };
  }

  private extractMaterialItems(analyses: MaterialityAnalysis[]) {
    const materialItems = {
      revenue: [] as any[],
      assets: [] as any[],
      liabilities: [] as any[]
    };

    for (const analysis of analyses) {
      for (const item of analysis.items) {
        if (item.isMaterial && item.userConfirmed) {
          switch (item.itemType) {
            case 'revenue_item':
              materialItems.revenue.push(item);
              break;
            case 'asset_item':
              materialItems.assets.push(item);
              break;
            case 'liability_item':
              materialItems.liabilities.push(item);
              break;
          }
        }
      }
    }

    return materialItems;
  }

  private async getListingGuidance() {
    const { data: guidance } = await supabase
      .from('ipo_prospectus_section_guidance')
      .select('*')
      .ilike('section', '%financial%');

    return guidance || [];
  }

  private async getBusinessAlignment(projectId: string) {
    const { data: businessSection } = await supabase
      .from('ipo_prospectus_sections')
      .select('content')
      .eq('project_id', projectId)
      .eq('section_type', 'business')
      .maybeSingle();

    return businessSection?.content || '';
  }

  private async generateContent(
    materialItems: any,
    guidance: any[],
    businessAlignment: string,
    businessContext?: any
  ): Promise<string> {
    let content = `# Financial Information\n\n`;
    
    content += `## Basis of Preparation\n\n`;
    content += `The financial information presented below has been prepared in accordance with applicable accounting standards and regulatory requirements. Items are disclosed separately when they are material to the understanding of the Company's financial position and performance.\n\n`;
    
    if (materialItems.revenue.length > 0) {
      content += `## Revenue Analysis\n\n`;
      content += `The following revenue items have been identified as material based on their significance relative to total revenue:\n\n`;
      
      for (const item of materialItems.revenue) {
        content += `### ${item.itemName}\n`;
        content += `Amount: ${item.amount.toLocaleString()}\n`;
        content += `Percentage of total revenue: ${item.percentage.toFixed(1)}%\n`;
        
        if (item.businessContext?.hasBusinessAlignment) {
          content += `This revenue stream aligns with the business operations described in the business section of this prospectus.\n`;
        }
        
        content += `\n`;
      }
    }

    if (materialItems.assets.length > 0) {
      content += `## Material Assets\n\n`;
      content += `The following assets represent material components of the Company's financial position:\n\n`;
      
      for (const item of materialItems.assets) {
        content += `### ${item.itemName}\n`;
        content += `Amount: ${item.amount.toLocaleString()}\n`;
        content += `Percentage of total assets: ${item.percentage.toFixed(1)}%\n`;
        
        if (item.businessContext?.relatedSegments?.length > 0) {
          content += `Related to business segments: ${item.businessContext.relatedSegments.join(', ')}\n`;
        }
        
        content += `\n`;
      }
    }

    if (materialItems.liabilities.length > 0) {
      content += `## Material Liabilities\n\n`;
      content += `The following liabilities represent material obligations of the Company:\n\n`;
      
      for (const item of materialItems.liabilities) {
        content += `### ${item.itemName}\n`;
        content += `Amount: ${item.amount.toLocaleString()}\n`;
        content += `Percentage of total liabilities: ${item.percentage.toFixed(1)}%\n`;
        content += `\n`;
      }
    }

    content += `## Materiality Assessment\n\n`;
    content += `The Company has applied a materiality threshold in determining which items require separate disclosure. `;
    content += `This assessment considers both quantitative factors (percentage of total amounts) and qualitative factors `;
    content += `(significance to business operations and investor understanding).\n\n`;

    if (guidance.length > 0) {
      content += `## Regulatory Compliance\n\n`;
      content += `This financial information disclosure complies with the applicable listing rules and regulatory requirements.\n\n`;
    }

    return content;
  }

  private createSourceAttributions(materialItems: any, guidance: any[], businessAlignment: string) {
    const attributions = [];

    if (materialItems.revenue.length > 0 || materialItems.assets.length > 0 || materialItems.liabilities.length > 0) {
      attributions.push({
        sourceType: 'financial_statement',
        sourceReference: 'Uploaded financial statements',
        contentSnippet: 'Material items extracted from uploaded financial statements',
        confidenceScore: 0.9
      });
    }

    if (businessAlignment) {
      attributions.push({
        sourceType: 'business_section',
        sourceReference: 'Business section content',
        contentSnippet: 'Business context for financial item alignment',
        confidenceScore: 0.8
      });
    }

    if (guidance.length > 0) {
      attributions.push({
        sourceType: 'listing_rules',
        sourceReference: 'IPO prospectus section guidance',
        contentSnippet: 'Regulatory requirements for financial information disclosure',
        confidenceScore: 0.95
      });
    }

    return attributions;
  }
}

export const financialContentGenerator = new FinancialContentGeneratorService();